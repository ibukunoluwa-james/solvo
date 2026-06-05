"""
Shared rate-limiter instance.

Lives in its own module so both `app.main` (which attaches it to FastAPI
state and registers the exception handler) and individual routers (which
decorate endpoints with `@limiter.limit(...)`) can import it without
creating a circular dependency on `app.main`.
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
