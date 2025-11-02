# 📚 PayChain Documentation

This folder contains essential technical documentation for the PayChain platform.

---

## 📄 Available Documentation

### [API.md](./API.md)
Complete API reference for all microservices including:
- Authentication endpoints
- Job management endpoints
- Payment/blockchain endpoints
- WebSocket events
- Request/response examples
- Error handling

**Use this for:** Understanding the API contract, integrating with backend services

---

### [Architecture.md](./Architecture.md)
System design and architecture overview:
- Microservices design patterns
- Database schema
- Service communication flow
- Technology stack details
- Deployment architecture

**Use this for:** Understanding system design, technical interviews, architecture reviews

---

### [SECURITY_NOTES.md](./SECURITY_NOTES.md)
Security implementation and best practices:
- JWT authentication flow
- MetaMask signature verification
- Token blacklisting
- Input validation
- Production security checklist
- Common vulnerabilities and mitigations

**Use this for:** Security audits, production deployment, understanding auth flow

---

### [USER_FLOWS.md](./USER_FLOWS.md)
User journey and workflow documentation:
- Employer workflows (create job, release payment)
- Worker workflows (browse, accept, complete jobs)
- Authentication flow
- Edge cases and error scenarios

**Use this for:** Understanding business logic, QA testing, product demos

---

### [WEBSOCKET_DOCUMENTATION.md](./WEBSOCKET_DOCUMENTATION.md)
Real-time notification system documentation:
- WebSocket connection setup
- Event types and payloads
- Channel subscription
- Client implementation examples
- Troubleshooting

**Use this for:** Implementing real-time features, debugging WebSocket issues

---

## 🚀 Quick Links

**Setup & Deployment:**
- [DEPLOYMENT.md](../DEPLOYMENT.md) - Complete deployment guide
- [ENV_SETUP.md](../ENV_SETUP.md) - Environment configuration

**Getting Started:**
- [README.md](../README.md) - Project overview and quick start
- [docker-compose.yml](../docker-compose.yml) - Container orchestration

---

## 📖 Documentation Index by Use Case

### For Developers
1. Start with [README.md](../README.md) for project overview
2. Read [Architecture.md](./Architecture.md) for system design
3. Reference [API.md](./API.md) for endpoints
4. Check [SECURITY_NOTES.md](./SECURITY_NOTES.md) for auth implementation

### For DevOps/Deployment
1. Follow [DEPLOYMENT.md](../DEPLOYMENT.md) for setup
2. Configure with [ENV_SETUP.md](../ENV_SETUP.md)
3. Review [Architecture.md](./Architecture.md) for infrastructure needs

### For Product/QA
1. Understand flows in [USER_FLOWS.md](./USER_FLOWS.md)
2. Test scenarios from [README.md](../README.md)
3. Check real-time features in [WEBSOCKET_DOCUMENTATION.md](./WEBSOCKET_DOCUMENTATION.md)

### For Security Review
1. Read [SECURITY_NOTES.md](./SECURITY_NOTES.md)
2. Review auth endpoints in [API.md](./API.md)
3. Check database schema in [Architecture.md](./Architecture.md)

---

## 🔄 Documentation Updates

All documentation is kept up-to-date with the latest codebase. Last updated: November 2025

If you find outdated information, please check the code directly or contact the maintainer.

---

## 📝 Contributing to Docs

When updating documentation:
1. Keep it concise and practical
2. Include code examples where helpful
3. Update this README if adding new docs
4. Remove outdated information promptly

---

**Need help?** Check the main [README.md](../README.md) or open an issue on GitHub.
