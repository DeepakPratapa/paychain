# PayChain User Flows

This document explains the complete user authentication and interaction flows in PayChain.

---

## 🔐 Authentication Flows

### 1. **New User Registration Flow**

**Steps:**

1. User visits homepage
2. Clicks **"Get Started"** or **"Connect Wallet"** button
3. MetaMask extension prompts to connect wallet
4. User selects account in MetaMask and approves connection
5. PayChain checks if wallet address exists in database
6. If NOT found → **Registration Modal appears**
7. User fills in:
   - Username (min 3 characters)
   - Email address
   - User Type: **Worker** or **Employer**
8. User clicks **"Complete Registration"**
9. Account created in database
10. Automatically logged in with JWT tokens
11. Redirected to Dashboard

**Key Points:**
- Wallet must be connected before registration
- MetaMask signature proves ownership of wallet
- No password needed - authentication is wallet-based
- User type determines available features (create jobs vs accept jobs)

---

### 2. **Returning User Login Flow**

**Steps:**

1. User visits homepage
2. Clicks **"Get Started"** or **"Connect Wallet"**
3. MetaMask prompts to connect (if not already connected)
4. User approves connection
5. PayChain detects wallet is already registered
6. User is prompted to sign a challenge message in MetaMask
7. Signature verified by backend
8. JWT tokens issued and stored
9. User automatically logged in
10. Redirected to Dashboard

**Key Points:**
- No registration modal shown for existing users
- Challenge-response prevents replay attacks
- Tokens expire after 15 minutes (access) / 7 days (refresh)
- Login persists across browser sessions via localStorage

---

### 3. **Account Switching**

**What happens when user switches accounts in MetaMask:**

1. WalletContext detects `accountsChanged` event
2. Current session is cleared
3. User shown toast: "Account changed. Please reconnect."
4. User must click "Connect Wallet" again
5. Flow continues as either New User or Returning User

---

## 🚀 Dev Mode (Hidden Feature)

### Activation

Press **`Ctrl + Shift + D`** anywhere in the app

### Features

- **Dev Mode Panel** slides in from bottom-right
- Shows 5 preconfigured demo accounts:
  - 2 Employers (TechStartupCo, DesignAgency)
  - 3 Workers (AliceDev, BobDesigner, CarolWriter)
- Click any account to get MetaMask import instructions
- Includes private keys for Ganache accounts

### How to Use Demo Accounts

1. Press `Ctrl + Shift + D` to open Dev Panel
2. Click desired account
3. Copy the displayed private key
4. Open MetaMask → Import Account → Paste private key
5. Switch to imported account in MetaMask
6. Connect wallet in PayChain
7. Automatically logged in (accounts are pre-seeded in database)

**⚠️ Security Note:**
These private keys are ONLY for local Ganache testnet. Never use on mainnet!

---

## 📋 Complete User Workflows

### Workflow A: Employer Posts Job

**Prerequisites:** Logged in as Employer

1. Click **"Create Job"** in navbar
2. Fill job form:
   - Title
   - Description
   - Job Type
   - Payment Amount (USD)
   - Time Limit (hours)
   - Optional: Add checklist tasks
3. Click **"Create Job & Lock Escrow"**
4. MetaMask prompts for transaction approval
5. Transaction sent to blockchain
6. Funds locked in smart contract
7. Job appears in "Browse Jobs" as **"open"**
8. Employer can view in Dashboard under "My Posted Jobs"

---

### Workflow B: Worker Accepts Job

**Prerequisites:** Logged in as Worker

1. Navigate to **"Browse Jobs"**
2. Filter by type, price, etc.
3. Click on job to view details
4. Read description and checklist
5. Click **"Accept Job"**
6. Confirmation modal appears
7. Click **"Confirm"**
8. Job status changes to **"in_progress"**
9. Deadline automatically calculated
10. Job appears in Dashboard under "Active Jobs"

---

### Workflow C: Worker Completes Job

**Prerequisites:** Worker has accepted job

1. Open job from Dashboard
2. Work on tasks (outside PayChain)
3. Mark checklist items as complete in UI
4. When all done, click **"Submit for Review"**
5. Job status changes to **"submitted"**
6. Employer notified (if WebSocket connected)

---

### Workflow D: Employer Approves & Pays

**Prerequisites:** Worker has submitted job

1. Employer views job details
2. Reviews submitted work
3. Clicks **"Approve & Release Payment"**
4. MetaMask prompts for approval
5. Smart contract executes payment:
   - 98% to worker
   - 2% platform fee
6. Transaction confirmed
7. Job status changes to **"completed"**
8. Worker receives ETH payment

---

## 🔄 Real-time Features

### WebSocket Events

When connected, users receive real-time updates for:

- **Job Accepted:** Employer notified when worker accepts
- **Job Submitted:** Employer notified when worker submits
- **Payment Released:** Worker notified when payment sent
- **Status Changes:** All parties see live status updates

### How to Enable

WebSocket automatically connects when user logs in.  
Connection status shown in browser console.

---

## 🎯 Navigation Flows

### Homepage → Dashboard

- **Logged Out:** Shows hero, features, CTA buttons
- **Logged In:** Shows "Go to Dashboard" and "Browse Jobs" buttons
- Navbar always accessible for quick navigation

### Navbar Behavior

**Before Login:**
- Logo (links to home)
- **"Connect Wallet"** button

**After Login (Worker):**
- Logo
- Dashboard link
- Browse Jobs link
- Username display
- Connected wallet address
- Logout button

**After Login (Employer):**
- Same as Worker +
- **"Create Job"** button (primary action)

---

## 🔒 Security Features

### Challenge-Response Authentication

1. Backend generates random nonce + timestamp
2. Stored in Redis with 5-minute expiration
3. User signs message with private key (in MetaMask)
4. Backend verifies signature matches wallet address
5. Challenge deleted after use (prevents replay)

### Token Management

- **Access Token:** 15-minute expiry, used for API calls
- **Refresh Token:** 7-day expiry, used to get new access token
- Both stored in localStorage
- Axios interceptor auto-refreshes expired access tokens

### Service-to-Service

- Microservices use API keys to communicate
- API Gateway validates JWT before routing
- Payment Service isolated on separate Docker network

---

## 🛠️ Troubleshooting Common Issues

### "MetaMask Not Installed"
**Solution:** Install MetaMask browser extension

### "Wrong Network"
**Solution:** Switch MetaMask to localhost:8545 (Ganache)

### "Challenge Expired"
**Solution:** Click "Connect Wallet" again to get new challenge

### "Username Already Exists"
**Solution:** Choose different username during registration

### "Account Changed"
**Solution:** Click "Connect Wallet" to reconnect new account

### Dev Mode Not Working
**Solution:** Ensure you press `Ctrl + Shift + D` (not Cmd on Mac in some browsers)

---

## 📊 State Diagram

```
┌─────────────┐
│  Logged Out │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│ Connect Wallet  │
└──────┬──────────┘
       │
       ▼
┌─────────────────────┐
│ Check if Registered │
└──────┬──────────────┘
       │
       ├─── NO ────▶ ┌──────────────────┐
       │             │ Registration Form│
       │             └────────┬─────────┘
       │                      │
       │ ◀────────────────────┘
       │
       ├─── YES ───▶ ┌──────────────┐
       │             │ Sign Message │
       │             └──────┬───────┘
       │                    │
       │ ◀──────────────────┘
       │
       ▼
┌─────────────┐
│  Logged In  │
│  Dashboard  │
└─────────────┘
```

---

## 🎓 Best Practices for Demo

### For First-Time Demo

1. Start with Dev Mode (`Ctrl + Shift + D`)
2. Import "TechStartupCo" (Employer)
3. Create a job
4. Switch to "AliceDev" (Worker)
5. Accept the job
6. Mark checklist complete
7. Submit work
8. Switch back to Employer
9. Approve and release payment

### Showing Real User Flow

1. Start logged out
2. Click "Connect Wallet"
3. Use fresh MetaMask account
4. Show registration modal
5. Complete signup as Worker
6. Browse existing jobs
7. Accept and complete one

---

**For Questions or Issues:**
See `docs/API.md` for technical details  
See `docs/SECURITY_NOTES.md` for security implementation
