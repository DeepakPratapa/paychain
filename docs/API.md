# PayChain API Documentation

## Table of Contents
- [Authentication](#authentication)
- [User Service](#user-service)
- [Job Service](#job-service)
- [Payment Service](#payment-service)
- [WebSocket Server](#websocket-server)

---

## Authentication

PayChain uses **MetaMask signature-based authentication** with JWT tokens.

### Authentication Flow

1. **Get Challenge**: Request a nonce to sign
2. **Sign Message**: Sign the challenge with MetaMask
3. **Verify Signature**: Exchange signature for JWT tokens

### Tokens

- **Access Token**: Short-lived (15 minutes), used for API authentication
- **Refresh Token**: Long-lived (7 days), used to obtain new access tokens

### Headers

All authenticated requests must include:
```
Authorization: Bearer <access_token>
```

Service-to-service calls use:
```
X-Service-API-Key: <service_api_key>
```

---

## User Service

Base URL: `http://localhost:8001`

### POST /auth/challenge

Get a challenge message to sign with MetaMask.

**Request:**
```json
{
  "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
}
```

**Response:**
```json
{
  "challenge": "PayChain Login - Nonce: abc123def456..."
}
```

### POST /auth/verify

Verify signature and get authentication tokens.

**Request:**
```json
{
  "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "signature": "0x...",
  "challenge": "PayChain Login - Nonce: abc123def456..."
}
```

**Response (Existing User):**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "username": "alice_employer",
    "email": "alice@example.com",
    "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "user_type": "employer"
  }
}
```

**Response (New User):**
```json
{
  "needs_signup": true
}
```

### POST /auth/signup

Create a new user account.

**Request:**
```json
{
  "username": "alice_employer",
  "email": "alice@example.com",
  "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "user_type": "employer"
}
```

**Response:**
```json
{
  "id": 1,
  "username": "alice_employer",
  "email": "alice@example.com",
  "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "user_type": "employer",
  "created_at": "2024-01-15T10:30:00Z"
}
```

### POST /auth/refresh

Refresh access token using refresh token.

**Request:**
```json
{
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer"
}
```

### POST /auth/logout

Revoke current session.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "message": "Successfully logged out"
}
```

### GET /users/me

Get current user profile.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "id": 1,
  "username": "alice_employer",
  "email": "alice@example.com",
  "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "user_type": "employer",
  "created_at": "2024-01-15T10:30:00Z"
}
```

---

## Job Service

Base URL: `http://localhost:8002`

### GET /jobs

List all jobs with optional filters.

**Query Parameters:**
- `status` (optional): Filter by status (open, in_progress, submitted, completed, cancelled)
- `search` (optional): Search in title and description

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
[
  {
    "id": 1,
    "title": "Build a landing page",
    "description": "Create a responsive landing page...",
    "price": "0.05",
    "time_limit_hours": 24,
    "status": "open",
    "employer_id": 1,
    "employer_username": "alice_employer",
    "worker_id": null,
    "worker_username": null,
    "deadline": null,
    "checklist": [
      {"task": "Design mockup", "completed": false},
      {"task": "Implement HTML/CSS", "completed": false}
    ],
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
]
```

### GET /jobs/my

Get jobs related to current user (posted jobs for employers, accepted jobs for workers).

**Headers:** `Authorization: Bearer <token>`

**Response:** Same as GET /jobs

### GET /jobs/{job_id}

Get detailed information about a specific job.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "id": 1,
  "title": "Build a landing page",
  "description": "Create a responsive landing page...",
  "price": "0.05",
  "time_limit_hours": 24,
  "status": "in_progress",
  "employer_id": 1,
  "employer_username": "alice_employer",
  "worker_id": 3,
  "worker_username": "charlie_worker",
  "deadline": "2024-01-16T10:30:00Z",
  "checklist": [
    {"task": "Design mockup", "completed": true},
    {"task": "Implement HTML/CSS", "completed": false}
  ],
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T11:00:00Z"
}
```

### POST /jobs

Create a new job (employers only).

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "title": "Build a landing page",
  "description": "Create a responsive landing page with modern design...",
  "price": 0.05,
  "time_limit_hours": 24,
  "checklist": [
    {"task": "Design mockup", "completed": false},
    {"task": "Implement HTML/CSS", "completed": false},
    {"task": "Make it responsive", "completed": false}
  ]
}
```

**Response:**
```json
{
  "id": 1,
  "title": "Build a landing page",
  "status": "open",
  ...
}
```

### PUT /jobs/{job_id}/accept

Accept a job as a worker.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "id": 1,
  "status": "in_progress",
  "worker_id": 3,
  "worker_username": "charlie_worker",
  "deadline": "2024-01-16T10:30:00Z",
  ...
}
```

### PUT /jobs/{job_id}/checklist

Update job checklist (workers only, during in_progress status).

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "checklist": [
    {"task": "Design mockup", "completed": true},
    {"task": "Implement HTML/CSS", "completed": true},
    {"task": "Make it responsive", "completed": false}
  ]
}
```

**Response:**
```json
{
  "id": 1,
  "checklist": [...],
  ...
}
```

### POST /jobs/{job_id}/submit

Submit completed work for review (workers only).

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "id": 1,
  "status": "submitted",
  ...
}
```

### POST /jobs/{job_id}/complete

Approve work and release payment (employers only).

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "id": 1,
  "status": "completed",
  "transaction_hash": "0x...",
  ...
}
```

### DELETE /jobs/{job_id}

Cancel a job (employers only, open jobs only).

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "message": "Job cancelled successfully"
}
```

---

## Payment Service

Base URL: `http://localhost:8003`

### POST /escrow/create

Lock funds in escrow when creating a job (internal service-to-service call).

**Headers:** `X-Service-API-Key: <api_key>`

**Request:**
```json
{
  "job_id": 1,
  "employer_wallet": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "amount": "0.05",
  "time_limit_hours": 24
}
```

**Response:**
```json
{
  "transaction_hash": "0x...",
  "block_number": 12345,
  "gas_used": 150000
}
```

### POST /escrow/release

Release escrowed funds to worker (internal service-to-service call).

**Headers:** `X-Service-API-Key: <api_key>`

**Request:**
```json
{
  "job_id": 1,
  "worker_wallet": "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
}
```

**Response:**
```json
  "transaction_hash": "0x...",
  "block_number": 12346,
  "amount_to_worker": "0.049",
  "platform_fee": "0.001"
}
```

### POST /escrow/cancel

Cancel job before worker assignment and refund employer (internal service-to-service call).

**Headers:** `X-Service-API-Key: <api_key>`

**Request:**
```json
{
  "job_id": 1,
  "employer_wallet": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
}
```

**Response:**
```json
{
  "transaction_hash": "0x...",
  "gas_used": 45000,
  "status": "confirmed"
}
```

**Requirements:**
- Job must be locked in escrow
- No worker assigned (worker == address(0))
- Only employer can cancel
- No deadline check (instant refund)

**Use Case:**
Employer changes mind before any worker accepts the job.

---

### POST /escrow/refund

Refund expired job escrow to employer (internal service-to-service call).

**Headers:** `X-Service-API-Key: <api_key>`

**Request:**
```json
{
  "job_id": 1
}
```

**Response:**
```json
{
  "transaction_hash": "0x...",
  "block_number": 12347,
  "refunded_amount": "0.05"
}
```

**Requirements:**
- Job must be locked in escrow
- Deadline must have passed
- Job not completed
- Anyone can call (usually automated)

**Use Case:**
Worker accepted job but didn't complete by deadline. Employer gets full refund after deadline expires.

---
```

### POST /escrow/refund

Refund expired job escrow to employer (internal service-to-service call).

**Headers:** `X-Service-API-Key: <api_key>`

**Request:**
```json
{
  "job_id": 1
}
```

**Response:**
```json
{
  "transaction_hash": "0x...",
  "block_number": 12347,
  "refunded_amount": "0.05"
}
```

### GET /transactions

Get transaction history.

**Query Parameters:**
- `wallet_address` (optional): Filter by wallet
- `status` (optional): Filter by status (pending, confirmed, failed)

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
[
  {
    "id": 1,
    "job_id": 1,
    "transaction_hash": "0x...",
    "transaction_type": "escrow_create",
    "from_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "to_address": "0xContractAddress",
    "amount": "0.05",
    "status": "confirmed",
    "block_number": 12345,
    "created_at": "2024-01-15T10:30:00Z"
  }
]
```

---

## WebSocket Server

Base URL: `ws://localhost:8080`

### WebSocket Connection

**Endpoint:** `ws://localhost:8080/ws`

**Query Parameters:**
- `token`: JWT access token for authentication

**Example:**
```javascript
const ws = new WebSocket('ws://localhost:8080/ws?token=<access_token>')
```

### Client → Server Messages

**Subscribe to channel:**
```json
{
  "type": "subscribe",
  "channel": "job:1"
}
```

**Unsubscribe from channel:**
```json
{
  "type": "unsubscribe",
  "channel": "job:1"
}
```

**Ping (keepalive):**
```json
{
  "type": "ping"
}
```

### Server → Client Messages

**Pong (keepalive response):**
```json
{
  "type": "pong"
}
```

**Job event:**
```json
{
  "type": "job_update",
  "channel": "job:1",
  "data": {
    "job_id": 1,
    "status": "in_progress",
    "worker_username": "charlie_worker",
    "timestamp": "2024-01-15T11:00:00Z"
  }
}
```

**Payment event:**
```json
{
  "type": "payment_released",
  "channel": "job:1",
  "data": {
    "job_id": 1,
    "transaction_hash": "0x...",
    "amount": "0.049",
    "timestamp": "2024-01-15T12:00:00Z"
  }
}
```

### Broadcasting Events (Service-to-Service)

**Endpoint:** `POST http://localhost:8080/broadcast`

**Headers:** `X-Service-API-Key: <api_key>`

**Request:**
```json
{
  "channel": "job:1",
  "event_type": "job_update",
  "data": {
    "job_id": 1,
    "status": "completed"
  }
}
```

---

## Error Responses

All endpoints return standard error responses:

**400 Bad Request:**
```json
{
  "detail": "Validation error message"
}
```

**401 Unauthorized:**
```json
{
  "detail": "Not authenticated"
}
```

**403 Forbidden:**
```json
{
  "detail": "Not authorized to access this resource"
}
```

**404 Not Found:**
```json
{
  "detail": "Resource not found"
}
```

**500 Internal Server Error:**
```json
{
  "detail": "Internal server error"
}
```

---

## Rate Limiting

- **API endpoints**: 60 requests/minute per IP
- **Auth endpoints**: 10 requests/minute per IP
- **WebSocket**: 100 messages/minute per connection

Rate limit headers:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1642251600
```
