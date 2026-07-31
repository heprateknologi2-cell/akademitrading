import threading
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime

_CACHE: dict[str, tuple[float, object]] = {}
_LOCK = threading.Lock()
_EXECUTOR = ThreadPoolExecutor(max_workers=8, thread_name_prefix="yf")

def get_cached(key: str, ttl_seconds: int):
    with _LOCK:
        entry = _CACHE.get(key)
        if entry and (time.time() - entry[0]) < ttl_seconds:
            return entry[1]
    return None

def set_cached(key: str, value, ttl_seconds: int = 300):
    with _LOCK:
        _CACHE[key] = (time.time(), value)

def clear_cache():
    with _LOCK:
        _CACHE.clear()

def cache_ttl_status():
    with _LOCK:
        now = time.time()
        return {
            "entries": len(_CACHE),
            "oldest": min((now - ts for ts, _ in _CACHE.values()), default=0),
            "updated_at": datetime.now().isoformat(),
        }

def run_parallel(fn, items):
    return list(_EXECUTOR.map(fn, items))
