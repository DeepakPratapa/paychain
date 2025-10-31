from fastapi import FastAPI, Request, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import httpx
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="PayChain API Gateway", version="1.0.0")

# Service URLs
USER_SERVICE_URL = os.getenv("USER_SERVICE_URL", "http://user-service:8001")
JOB_SERVICE_URL = os.getenv("JOB_SERVICE_URL", "http://job-service:8002")
PAYMENT_SERVICE_URL = os.getenv("PAYMENT_SERVICE_URL", "http://payment-service:8003")
CORS_ORIGINS = os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:5173").split(",")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    logger.info("✅ API Gateway started")


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    services_health = {}
    
    # Check User Service
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{USER_SERVICE_URL}/health", timeout=2.0)
            services_health["user_service"] = "healthy" if response.status_code == 200 else "unhealthy"
    except Exception:
        services_health["user_service"] = "unreachable"
    
    # Check Job Service
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{JOB_SERVICE_URL}/health", timeout=2.0)
            services_health["job_service"] = "healthy" if response.status_code == 200 else "unhealthy"
    except Exception:
        services_health["job_service"] = "unreachable"
    
    # Check Payment Service
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{PAYMENT_SERVICE_URL}/health", timeout=2.0)
            services_health["payment_service"] = "healthy" if response.status_code == 200 else "unhealthy"
    except Exception:
        services_health["payment_service"] = "unreachable"
    
    return {
        "status": "healthy",
        "service": "api-gateway",
        "services": services_health
    }


async def proxy_request(request: Request, target_url: str):
    """Proxy request to target service"""
    try:
        # Get request body
        body = await request.body()
        
        # Prepare headers
        headers = dict(request.headers)
        headers.pop("host", None)
        
        # Make request to target service
        async with httpx.AsyncClient() as client:
            response = await client.request(
                method=request.method,
                url=target_url,
                headers=headers,
                content=body,
                params=request.query_params,
                timeout=30.0
            )
            
            return JSONResponse(
                content=response.json() if response.text else {},
                status_code=response.status_code,
                headers=dict(response.headers)
            )
            
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Service timeout"
        )
    except Exception as e:
        logger.error(f"Proxy request failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service unavailable"
        )


# Auth routes → User Service
@app.api_route("/auth/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def auth_proxy(request: Request, path: str):
    target_url = f"{USER_SERVICE_URL}/auth/{path}"
    return await proxy_request(request, target_url)


# User routes → User Service
@app.api_route("/users/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def users_proxy(request: Request, path: str):
    target_url = f"{USER_SERVICE_URL}/users/{path}"
    return await proxy_request(request, target_url)


# Job routes → Job Service
@app.api_route("/jobs/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def jobs_proxy(request: Request, path: str):
    target_url = f"{JOB_SERVICE_URL}/jobs/{path}"
    return await proxy_request(request, target_url)


@app.api_route("/jobs", methods=["GET", "POST"])
async def jobs_root_proxy(request: Request):
    target_url = f"{JOB_SERVICE_URL}/jobs"
    return await proxy_request(request, target_url)


# Payment routes → Payment Service
@app.api_route("/escrow/{path:path}", methods=["GET", "POST"])
async def escrow_proxy(request: Request, path: str):
    target_url = f"{PAYMENT_SERVICE_URL}/escrow/{path}"
    return await proxy_request(request, target_url)


@app.api_route("/balance/{wallet_address}", methods=["GET"])
async def balance_proxy(request: Request, wallet_address: str):
    target_url = f"{PAYMENT_SERVICE_URL}/balance/{wallet_address}"
    return await proxy_request(request, target_url)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
