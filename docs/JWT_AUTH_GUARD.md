# JWT Authentication Guard for Microservices

## Overview

We've implemented a **centralized JWT authentication guard** system that provides consistent, secure authentication across all microservices in the PayChain application.

---

## 🏗️ Architecture

### 3-Layer Security Model

```
┌─────────────────────────────────────────────────────────┐
│               1. API Gateway (First Line)                │
│  - Validates token presence and format                   │
│  - Routes to appropriate microservice                    │
│  - Blocks completely unauthenticated requests            │
└───────────────────────┬─────────────────────────────────┘
                        │
         ┌──────────────┴──────────────┐
         │                             │
┌────────▼────────┐           ┌────────▼────────┐
│  2. Auth Guard   │           │  2. Auth Guard   │
│  (Each Service)  │           │  (Each Service)  │
│  - Decodes JWT   │           │  - Decodes JWT   │
│  - Validates sig │           │  - Validates sig │
│  - Checks expiry │           │  - Checks expiry │
└────────┬────────┘           └────────┬────────┘
         │                             │
┌────────▼──────────────────────────────▼────────┐
│       3. Business Logic Authorization          │
│  - Resource ownership checks                   │
│  - User type validation (employer/worker)      │
│  - Custom permission logic                     │
└────────────────────────────────────────────────┘
```

---

## 📁 Files Created/Modified

### New Files:
- `backend/shared/auth_guard.py` - Centralized JWT authentication guard

### Modified Files:
- `backend/api_gateway/main.py` - Added AuthMiddleware
- `backend/job_service/main.py` - Using new auth guard
- `backend/payment_service/main.py` - Protected wallet balance endpoint
- `backend/user_service/main.py` - Using new auth guard
- `backend/payment_service/requirements.txt` - Added jose and passlib

---

## 🔐 Auth Guard Features

### 1. **Token Verification**
```python
from shared.auth_guard import get_current_user

@app.get("/jobs/my-jobs")
async def get_my_jobs(user: dict = Depends(get_current_user)):
    # user contains: {"sub": user_id, "user_type": "employer", "wallet": "0x..."}
    user_id = user.get("sub")
    ...
```

### 2. **User Type Guards**
```python
from shared.auth_guard import require_employer, require_worker

@app.post("/jobs")
async def create_job(user: dict = Depends(require_employer)):
    # Only employers can access this endpoint
    ...

@app.put("/jobs/{id}/accept")
async def accept_job(user: dict = Depends(require_worker)):
    # Only workers can access this endpoint
    ...
```

### 3. **Optional Authentication**
```python
from shared.auth_guard import get_current_user_optional

@app.get("/jobs")
async def list_jobs(user: Optional[dict] = Depends(get_current_user_optional)):
    # Public endpoint, but can provide personalized results if authenticated
    if user:
        # Show personalized recommendations
    else:
        # Show general results
    ...
```

### 4. **Resource Ownership Validation**
```python
from shared.auth_guard import auth_guard

@app.delete("/jobs/{job_id}")
async def delete_job(
    job_id: int,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session)
):
    # Manual ownership check
    job = await session.get(Job, job_id)
    if job.employer_id != int(user.get("sub")):
        raise HTTPException(status_code=403, detail="Not authorized")
    ...
```

---

## 🛡️ Security Enhancements Implemented

### ✅ Protected Endpoints

#### **Job Service:**
- ✅ `POST /jobs` - Requires employer authentication
- ✅ `PUT /jobs/{id}` - Requires employer authentication
- ✅ `DELETE /jobs/{id}` - Requires employer authentication
- ✅ `GET /jobs/my-jobs` - Requires authentication
- ✅ `POST /jobs/{id}/accept` - Requires worker authentication
- ✅ `PUT /jobs/{id}/checklist` - Requires authentication
- ✅ `POST /jobs/{id}/complete` - Requires authentication
- ✅ `GET /jobs/expired` - Requires authentication
- ✅ `POST /jobs/{id}/refund` - Requires employer authentication
- ⚠️ `GET /jobs` - Optional authentication (public browsing with personalization)
- ⚠️ `GET /jobs/{id}` - Optional authentication (public view with restrictions)

#### **Payment Service:**
- ✅ `GET /balance/{wallet_address}` - **NOW PROTECTED** - User must own the wallet
- ✅ `POST /escrow/lock` - Service-to-service authentication
- ✅ `POST /escrow/release` - Service-to-service authentication
- ✅ `POST /escrow/refund` - Service-to-service authentication

#### **User Service:**
- ✅ `GET /users/me` - Requires authentication
- ⚪ `POST /auth/verify` - Public (login endpoint)
- ⚪ `POST /auth/challenge` - Public (login step 1)
- ⚪ `POST /auth/refresh` - Public (uses refresh token)

---

## 🚀 Usage Examples

### Example 1: Creating a Job (Employer Only)

```python
# backend/job_service/main.py

from shared.auth_guard import require_employer

@app.post("/jobs", response_model=JobResponse)
async def create_job(
    job_data: JobCreate,
    user: dict = Depends(require_employer),  # ✅ Only employers
    session: AsyncSession = Depends(get_db_session)
):
    employer_id = int(user.get("sub"))
    
    new_job = Job(
        employer_id=employer_id,
        title=job_data.title,
        ...
    )
    
    session.add(new_job)
    await session.commit()
    return new_job
```

### Example 2: Wallet Balance (Owner Only)

```python
# backend/payment_service/main.py

from shared.auth_guard import get_current_user

@app.get("/balance/{wallet_address}")
async def get_balance(
    wallet_address: str,
    user: dict = Depends(get_current_user)  # ✅ Must be authenticated
):
    # ✅ Verify ownership
    user_wallet = user.get("wallet", "").lower()
    requested_wallet = wallet_address.lower()
    
    if user_wallet != requested_wallet:
        raise HTTPException(
            status_code=403,
            detail="You can only view your own wallet balance"
        )
    
    balance = blockchain.get_balance(wallet_address)
    return {"balance_eth": balance}
```

### Example 3: Optional Auth with Personalization

```python
# backend/job_service/main.py

from shared.auth_guard import get_current_user_optional

@app.get("/jobs")
async def list_jobs(
    user: Optional[dict] = Depends(get_current_user_optional),
    session: AsyncSession = Depends(get_db_session)
):
    query = select(Job).where(Job.status == "open")
    
    # ✅ Personalize if authenticated
    if user:
        user_type = user.get("user_type")
        if user_type == "worker":
            # Show recommendations based on skills
            query = query.order_by(Job.pay_amount_usd.desc())
    
    jobs = await session.execute(query)
    return jobs.all()
```

---

## 🔍 JWT Token Structure

### Access Token Payload:
```json
{
  "sub": "123",               // User ID
  "user_type": "employer",    // User type
  "wallet": "0xabc...",       // Wallet address
  "exp": 1698765432,          // Expiration timestamp
  "iat": 1698763632,          // Issued at timestamp
  "type": "access"            // Token type
}
```

### Refresh Token Payload:
```json
{
  "sub": "123",
  "exp": 1699370232,          // 7 days expiry
  "iat": 1698763632,
  "type": "refresh"           // Different type
}
```

---

## 🔄 Authentication Flow

```
┌──────────┐                ┌──────────────┐                ┌────────────┐
│ Frontend │                │ API Gateway  │                │  Service   │
└─────┬────┘                └──────┬───────┘                └─────┬──────┘
      │                            │                              │
      │ 1. GET /jobs/my-jobs       │                              │
      │ Authorization: Bearer XXX  │                              │
      ├───────────────────────────>│                              │
      │                            │                              │
      │                            │ 2. Check token format        │
      │                            │    (middleware)              │
      │                            │                              │
      │                            │ 3. Forward with token        │
      │                            ├─────────────────────────────>│
      │                            │                              │
      │                            │                              │ 4. Decode JWT
      │                            │                              │ 5. Verify signature
      │                            │                              │ 6. Check expiry
      │                            │                              │ 7. Validate type
      │                            │                              │
      │                            │                              │ 8. Execute logic
      │                            │                              │    with user context
      │                            │                              │
      │                            │ 9. Return response           │
      │                            │<─────────────────────────────┤
      │                            │                              │
      │ 10. Response with data     │                              │
      │<───────────────────────────┤                              │
      │                            │                              │
```

---

## 🛠️ Implementation Checklist

### ✅ Completed:
- [x] Created centralized `auth_guard.py`
- [x] Implemented JWT verification functions
- [x] Added user type guards (employer/worker)
- [x] Added optional authentication support
- [x] Protected all sensitive job endpoints
- [x] **Protected wallet balance endpoint**
- [x] Added API Gateway authentication middleware
- [x] Updated all services to use new auth guard
- [x] Removed duplicate auth code from services
- [x] Added proper error messages with 401/403 status codes
- [x] Maintained backward compatibility for public endpoints

### 🔄 Best Practices Applied:
- **DRY Principle**: One auth guard, used everywhere
- **Fail-Safe**: Deny by default, allow explicitly
- **Clear Errors**: Specific error messages for debugging
- **Type Safety**: Strong typing with user dictionaries
- **Flexibility**: Optional auth for hybrid endpoints
- **Security**: Token signature and expiry validation
- **Separation of Concerns**: Auth logic separated from business logic

---

## 📊 Security Improvements Summary

| Endpoint | Before | After |
|----------|--------|-------|
| GET /jobs | ❌ Public | ⚠️ Public* |
| GET /jobs/{id} | ❌ Public | ⚠️ Public* |
| POST /jobs | ✅ Protected | ✅ Protected (Employer) |
| GET /jobs/my-jobs | ✅ Protected | ✅ Protected |
| **GET /balance/{wallet}** | **❌ Public** | **✅ Protected (Owner)** |
| POST /jobs/{id}/accept | ✅ Protected | ✅ Protected (Worker) |
| POST /jobs/{id}/complete | ✅ Protected | ✅ Protected |
| GET /escrow/stats | ❌ Public | ❌ Public (read-only stats) |

*Public with optional authentication for personalization

---

## 🎯 Key Security Benefits

1. **Centralized Authentication**: One source of truth for JWT validation
2. **Consistent Errors**: Same error format across all services
3. **Type-Based Access Control**: Employer vs Worker guards
4. **Wallet Privacy**: Users can only see their own balances
5. **Resource Ownership**: Users can only modify their own resources
6. **Token Validation**: Signature, expiry, and type checks
7. **Service Isolation**: Each service validates independently
8. **Gateway Protection**: First line of defense against invalid requests

---

## 🧪 Testing Auth Guard

### Test 1: Protected Endpoint Without Token
```bash
curl http://localhost:8000/jobs/my-jobs
# Expected: 401 Unauthorized
# {"detail": "Not authenticated"}
```

### Test 2: Protected Endpoint With Valid Token
```bash
curl -H "Authorization: Bearer <valid_token>" http://localhost:8000/jobs/my-jobs
# Expected: 200 OK with user's jobs
```

### Test 3: Wallet Balance Access (Wrong Wallet)
```bash
curl -H "Authorization: Bearer <token_for_wallet_A>" \
     http://localhost:8000/payment/balance/0xWalletB...
# Expected: 403 Forbidden
# {"detail": "You can only view your own wallet balance"}
```

### Test 4: Employer-Only Endpoint as Worker
```bash
curl -H "Authorization: Bearer <worker_token>" \
     -X POST http://localhost:8000/jobs \
     -d '{"title": "New Job"}'
# Expected: 403 Forbidden
# {"detail": "Access denied. Required user type: employer"}
```

---

## 🚨 Migration Notes

### Breaking Changes:
- **Wallet balance now requires authentication**
  - Frontend must pass Authorization header
  - Users can only view their own wallet
  
### Non-Breaking Changes:
- Job browsing still works without auth (optional personalization)
- All previously protected endpoints work the same way
- Better error messages for debugging

---

## 📝 Next Steps (Recommended)

1. **Token Blacklisting**: Implement Redis-based token revocation
2. **Rate Limiting Per User**: Track by user ID from JWT
3. **Audit Logging**: Log all authenticated requests
4. **Token Rotation**: Implement automatic key rotation
5. **2FA for High-Value Operations**: Extra verification for payments
6. **IP Whitelisting**: For service-to-service calls
7. **Request Signing**: Additional layer for payment operations

---

## 📚 References

- JWT Standard: [RFC 7519](https://datatracker.ietf.org/doc/html/rfc7519)
- FastAPI Security: [Official Docs](https://fastapi.tiangolo.com/tutorial/security/)
- OWASP JWT Guide: [Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
