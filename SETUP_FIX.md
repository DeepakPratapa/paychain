# PayChain Setup Fix - November 1, 2025

## Issue Summary
The `setup-dev.sh` script was generating random secrets for all environment variables, but the `PLATFORM_PRIVATE_KEY` requires a valid Ethereum private key format, not a random hex string.

## Root Cause
The `.env.example` template had `PLATFORM_PRIVATE_KEY=CHANGE_ME_USE_SEPARATE_PRODUCTION_WALLET` as a placeholder, but the setup script didn't replace it with a valid Ganache test private key.

When the payment service tried to start, it failed with:
```
binascii.Error: Non-hexadecimal digit found
```

This occurred because `BlockchainClient` attempted to parse the placeholder text as an Ethereum private key.

## Fix Applied

### 1. Updated `scripts/setup-dev.sh`
Added automatic replacement of `PLATFORM_PRIVATE_KEY` with Ganache's first test account private key:

```bash
# Ganache test private key (account #0 - DO NOT USE IN PRODUCTION)
GANACHE_PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

# Replace PLATFORM_PRIVATE_KEY placeholder
sed -i "s|CHANGE_ME_USE_SEPARATE_PRODUCTION_WALLET|$GANACHE_PRIVATE_KEY|g" .env
```

### 2. Updated Current `.env`
Manually replaced the placeholder with the correct Ganache private key.

### 3. Recreated Payment Service Container
Since Docker containers cache environment variables, we had to:
```bash
docker compose stop payment-service
docker compose rm -f payment-service
docker compose up -d payment-service
```

## Ganache Test Accounts
For local development, Ganache provides these deterministic test accounts:

- **Account #0** (Platform/Deployer):
  - Address: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
  - Private Key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
  - Balance: 10,000 ETH

- **Account #1** (Test User 1):
  - Address: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
  - Private Key: `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`

## Verification
After the fix, all services are healthy:

```bash
$ curl http://localhost:8000/health
{
    "status": "healthy",
    "service": "api-gateway",
    "services": {
        "user_service": "healthy",
        "job_service": "healthy",
        "payment_service": "healthy"
    }
}
```

## Docker Container Status
```
CONTAINER                     STATUS
paychain-payment-service      Up (healthy)
paychain-frontend             Up
paychain-api-gateway          Up
paychain-nginx                Up
paychain-job-service          Up
paychain-user-service         Up
paychain-websocket            Up
paychain-postgres             Up (healthy)
paychain-redis                Up
paychain-ganache              Up
```

## Security Notes

⚠️ **CRITICAL**: The Ganache private key is hardcoded in the setup script for **LOCAL DEVELOPMENT ONLY**.

- **Never use these keys in production**
- **Never commit real private keys to Git**
- For production:
  1. Generate a new Ethereum wallet
  2. Store the private key in a secure secrets manager (AWS Secrets Manager, HashiCorp Vault, etc.)
  3. Use environment-specific .env files
  4. Rotate keys regularly
  5. Use hardware security modules (HSM) for high-value operations

## Testing the Fix
Run the setup script again to verify it works from scratch:

```bash
./scripts/setup-dev.sh
```

The script will:
1. Generate secure random secrets for JWT, database, API keys
2. Set the correct Ganache private key
3. Build Docker images
4. Start infrastructure (PostgreSQL, Redis, Ganache)
5. Deploy the smart contract
6. Start all microservices

## Related Files
- `scripts/setup-dev.sh` - Updated to set Ganache private key
- `.env.example` - Template with placeholder
- `.env` - Generated environment file (gitignored)
- `backend/payment_service/blockchain_client.py` - Uses the private key
- `docs/SECURITY_AUDIT_REPORT.md` - See finding C1 about secret management

## Next Steps
1. ✅ Fix applied and verified
2. Test the complete user flow (register → create job → accept → complete → payment)
3. Review security documentation in `docs/SECURITY_DASHBOARD.md`
4. Address remaining critical security findings before production
