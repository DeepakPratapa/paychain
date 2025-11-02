# JWT Token Storage & Management in PayChain

## Quick Answers to Your Questions

### 🍪 Do we use cookies?
**NO** - PayChain does NOT use HTTP cookies at all.

### 💾 Where are JWTs stored?
**Frontend**: `localStorage` (browser)  
**Backend**: Only **revoked tokens** are stored in **Redis** (for blacklisting)

---

## 📋 Complete Token Flow

### 1. Token Generation (Backend)

When a user logs in via MetaMask signature verification:

```python
# /backend/shared/auth.py

def create_access_token(data: dict, secret_key: str) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=30)
    
    to_encode.update({
        "exp": expire,                    # Expiration time
        "iat": datetime.utcnow(),         # Issued at time
        "type": "access",                 # Token type
        "jti": secrets.token_hex(16)      # Unique token ID (32 chars)
    })
    
    encoded_jwt = jwt.encode(to_encode, secret_key, algorithm="HS256")
    return encoded_jwt  # Returns signed JWT string
```

**Key Points**:
- JWT is **signed** with `JWT_SECRET_KEY` (not stored anywhere)
- Token contains user data (sub=user_id, user_type, username, wallet_address)
- **JTI (JWT ID)** is a unique identifier for token revocation
- Token is **stateless** - backend doesn't store valid tokens in database

### 2. Token Storage (Frontend)

Tokens are stored in browser's `localStorage`:

```javascript
// /frontend/src/contexts/AuthContext.jsx

// After successful login
localStorage.setItem('access_token', response.access_token)     // 30 min lifetime
localStorage.setItem('refresh_token', response.refresh_token)   // 7 day lifetime
localStorage.setItem('user', JSON.stringify(response.user))     // User data
```

**Storage Locations**:

| Item | Storage | Lifetime | Purpose |
|------|---------|----------|---------|
| `access_token` | localStorage | 30 minutes | API authentication |
| `refresh_token` | localStorage | 7 days | Get new access token |
| `user` | localStorage | Until logout | User info (avoid API calls) |
| `csrf_token` | sessionStorage | Until tab close | CSRF protection |

**Why localStorage (not cookies)?**
- ✅ Works with SPAs (Single Page Apps)
- ✅ Easy access from JavaScript
- ✅ No CORS cookie issues
- ✅ Mobile app compatible
- ⚠️ Vulnerable to XSS (mitigated by CSP headers & DOMPurify)

### 3. Token Usage (Frontend → Backend)

Every API request includes the JWT in the `Authorization` header:

```javascript
// /frontend/src/services/api.js

api.interceptors.request.use(async (config) => {
    const token = localStorage.getItem('access_token')
    
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    
    return config
})
```

**HTTP Request Example**:
```
GET /api/jobs/123
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0Miw...
```

### 4. Token Validation (Backend)

Backend validates JWT on **every request**:

```python
# /backend/shared/auth_guard.py

async def verify_token(self, authorization: str) -> dict:
    # 1. Extract token from "Bearer <token>"
    token = authorization.replace("Bearer ", "")
    
    # 2. Decode & verify signature with JWT_SECRET_KEY
    payload = decode_token(token, self.settings.JWT_SECRET_KEY)
    
    # 3. Check expiration (automatically by JWT library)
    if not payload:
        raise HTTPException(401, "Invalid or expired token")
    
    # 4. Check token type
    if payload.get("type") != "access":
        raise HTTPException(401, "Invalid token type")
    
    # 5. Check if token is blacklisted (REDIS LOOKUP)
    token_jti = payload.get("jti")
    is_revoked = await self.blacklist.is_token_revoked(token_jti)
    if is_revoked:
        raise HTTPException(401, "Token has been revoked")
    
    # 6. Check if all user tokens were revoked
    user_id = int(payload.get("sub"))
    revoke_time = await self.blacklist.get_user_revocation_time(user_id)
    if revoke_time and token_issued_before_revoke:
        raise HTTPException(401, "Token has been revoked")
    
    return payload  # Valid! Return user data
```

**Validation Steps**:
1. ✅ Signature verification (JWT_SECRET_KEY)
2. ✅ Expiration check
3. ✅ Token type check
4. ✅ **Blacklist check (Redis)**
5. ✅ **User-wide revocation check (Redis)**

---

## 🗄️ Database/Storage Usage

### ❌ What is NOT stored in database:

- **Valid JWT tokens** (stateless design)
- **User passwords** (only bcrypt hashes)
- **JWT secret key** (environment variable only)
- **Active sessions** (JWT handles this)

### ✅ What IS stored:

#### PostgreSQL Database:
```sql
-- /database/init.sql

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    wallet_address VARCHAR(42) UNIQUE NOT NULL,
    user_type VARCHAR(20) NOT NULL,
    -- NO JWT TOKENS STORED HERE
);
```

#### Redis (Token Blacklist):
```python
# /backend/shared/token_blacklist.py

class TokenBlacklist:
    async def revoke_token(self, token_jti: str, expires_at: datetime):
        """
        Store ONLY revoked tokens in Redis
        Key: "blacklist:{jti}"
        Value: "revoked"
        TTL: Time until token expires (auto-cleanup)
        """
        ttl_seconds = int((expires_at - now).total_seconds())
        await self.redis_client.setex(
            f"blacklist:{token_jti}", 
            ttl_seconds, 
            "revoked"
        )
```

**Redis Storage**:

| Key Pattern | Value | TTL | Purpose |
|-------------|-------|-----|---------|
| `blacklist:{jti}` | "revoked" | Until token expiry | Individual token revocation |
| `user_revoke:{user_id}` | ISO timestamp | 7 days | Revoke all user tokens |

**Example Redis Data**:
```
blacklist:a1b2c3d4e5f6g7h8... → "revoked" (expires in 1800s)
user_revoke:42 → "2025-11-02T15:30:00" (expires in 7 days)
```

---

## 🔐 Token Revocation Flow

### When User Logs Out:

```python
# /backend/user_service/main.py

@app.post("/auth/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    # Extract JTI from current token
    token_jti = current_user.get("jti")
    expires_at = datetime.fromtimestamp(current_user.get("exp"))
    
    # Add token to blacklist in Redis
    await blacklist.revoke_token(token_jti, expires_at)
    
    return {"message": "Logged out successfully"}
```

### When User Changes Password (Future Enhancement):

```python
# Revoke ALL user tokens (not just current one)
await blacklist.revoke_all_user_tokens(user_id)

# This creates a timestamp in Redis
# All tokens issued BEFORE this timestamp are invalid
```

---

## 🔄 Token Refresh Flow

When access token expires (30 min), frontend auto-refreshes:

```javascript
// /frontend/src/services/api.js

const refreshAccessToken = async () => {
    const refreshToken = localStorage.getItem('refresh_token')
    
    const response = await axios.post('/api/auth/refresh', {
        refresh_token: refreshToken
    })
    
    // Store new tokens
    localStorage.setItem('access_token', response.data.access_token)
    localStorage.setItem('refresh_token', response.data.refresh_token)
    
    return response.data.access_token
}
```

**Backend Refresh Endpoint**:
```python
@app.post("/auth/refresh")
async def refresh_token(request: RefreshRequest):
    # 1. Decode & validate refresh token
    payload = decode_token(request.refresh_token, settings.JWT_SECRET_KEY)
    
    # 2. Check if refresh token is blacklisted
    # 3. Create NEW access token (new JTI)
    # 4. Create NEW refresh token (new JTI)
    # 5. Optionally blacklist old refresh token
    
    return TokenResponse(
        access_token=new_access,
        refresh_token=new_refresh
    )
```

---

## 📊 Storage Comparison

| Approach | PayChain Uses | Pros | Cons |
|----------|---------------|------|------|
| **Cookies (httpOnly)** | ❌ NO | Secure from XSS, auto-sent | CORS issues, mobile incompatible |
| **localStorage** | ✅ YES | Easy, works everywhere | XSS vulnerable (mitigated) |
| **Database (PostgreSQL)** | ❌ NO (for valid tokens) | Fully stateful | Slow, scalability issues |
| **Redis (blacklist only)** | ✅ YES | Fast, auto-expiry | Needs Redis infrastructure |

---

## 🛡️ Security Measures

### Protection Against XSS:
- ✅ **CSP Headers** - Restrict script sources
- ✅ **DOMPurify** - Sanitize user input
- ✅ **React auto-escaping** - Prevents injection

### Protection Against Token Theft:
- ✅ **Short token lifetime** (30 min access, 7 day refresh)
- ✅ **Token blacklist** - Revoke compromised tokens
- ✅ **HTTPS only** (HSTS header)
- ✅ **JTI tracking** - Unique token IDs

### Protection Against CSRF:
- ✅ **No cookies** - CSRF doesn't apply to localStorage
- ✅ **X-CSRF-Token header** - Additional protection layer
- ✅ **SameSite would be needed if we used cookies** - Not applicable

---

## 🎯 Key Takeaways

1. **JWTs are STATELESS**: Backend doesn't store valid tokens
2. **localStorage stores tokens**: Client-side only
3. **Redis stores ONLY revoked tokens**: For blacklisting
4. **No cookies used**: Avoids cookie-related security issues
5. **JTI enables revocation**: Despite stateless design
6. **Token refresh prevents re-login**: User stays logged in for 7 days

---

## 📚 Related Files

- `/backend/shared/auth.py` - Token creation
- `/backend/shared/auth_guard.py` - Token validation
- `/backend/shared/token_blacklist.py` - Revocation logic
- `/frontend/src/services/api.js` - Token storage & usage
- `/frontend/src/contexts/AuthContext.jsx` - Login/logout flow
- `/frontend/src/utils/csrf.js` - CSRF protection (sessionStorage)

---

## 🔮 Future Enhancements

1. **Refresh token rotation** - New refresh token on every use
2. **Device tracking** - Know which devices have tokens
3. **Token fingerprinting** - Bind token to browser/IP
4. **Automatic blacklist cleanup** - Redis already does this with TTL
5. **httpOnly cookies option** - For enterprise deployments
