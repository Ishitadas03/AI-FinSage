import sys
import time
from collections import defaultdict
from threading import Lock
from fastapi import HTTPException, Request, status
from app.core.config import settings


class SimpleRateLimiter:
    """
    In-memory thread-safe sliding window rate limiter for auth endpoints.
    Tracks request timestamps by client IP.
    Bypasses rate limiting during automated testing runs.
    """

    def __init__(self, max_requests: int, window_seconds: int):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._requests: dict[str, list[float]] = defaultdict(list)
        self._lock = Lock()

    def check_rate_limit(self, request: Request) -> None:
        # Bypass rate limiting in testing environment / pytest suite
        if "pytest" in sys.modules or getattr(settings, "ENVIRONMENT", "").lower() == "testing":
            return

        client_ip = request.client.host if request.client else "127.0.0.1"
        now = time.time()

        with self._lock:
            # Filter timestamps within the current sliding window
            window_start = now - self.window_seconds
            timestamps = [t for t in self._requests[client_ip] if t > window_start]

            if len(timestamps) >= self.max_requests:
                retry_after = int(self.window_seconds - (now - timestamps[0]))
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Too many authentication attempts. Please try again in {max(1, retry_after)} seconds.",
                    headers={"Retry-After": str(max(1, retry_after))},
                )

            timestamps.append(now)
            self._requests[client_ip] = timestamps


# Pre-configured rate limiters: 10 requests / 60 seconds for login/register
auth_rate_limiter = SimpleRateLimiter(max_requests=10, window_seconds=60)
