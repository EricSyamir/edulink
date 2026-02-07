#!/usr/bin/env python3
"""
Load test: 50 concurrent DB queries, then 50 concurrent face detection requests.
Uses urllib only (no extra deps).

Usage:
  python load_test.py [API_URL]                    # Use default image
  python load_test.py --face-image photo.jpg       # Use your photo for face test
"""
import argparse
import base64
import json
import ssl
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import urllib.request

CONCURRENT = 50
FACE_IMAGE_B64: str | None = None  # Set from --face-image


def _request(method: str, url: str, data: bytes | None = None) -> dict:
    start = time.perf_counter()
    try:
        ctx = ssl.create_default_context()
        req = urllib.request.Request(url, data=data, method=method)
        if data:
            req.add_header("Content-Type", "application/json")
        with urllib.request.urlopen(req, timeout=120, context=ctx) as resp:
            body = resp.read().decode()
        elapsed = time.perf_counter() - start
        return {"ok": True, "ms": round(elapsed * 1000, 2), "status": resp.status, "body": body}
    except Exception as e:
        elapsed = time.perf_counter() - start
        return {"ok": False, "ms": round(elapsed * 1000, 2), "error": str(e)[:100]}


def run_db_query(req_id: int, api_url: str) -> dict:
    return {"id": req_id, **_request("GET", f"{api_url}/api/load-test/db")}


def run_face_detection(req_id: int, api_url: str) -> dict:
    img = FACE_IMAGE_B64  # None = use server default
    body = json.dumps({"face_image": img}).encode()
    return {"id": req_id, **_request("POST", f"{api_url}/api/load-test/face", data=body)}


def run_test(name: str, fn, n: int, api_url: str) -> None:
    print(f"\n{'='*60}")
    print(f"  {name}: {n} concurrent requests")
    print("=" * 60)
    start = time.perf_counter()
    results = []
    with ThreadPoolExecutor(max_workers=n) as ex:
        futures = [ex.submit(fn, i, api_url) for i in range(n)]
        for f in as_completed(futures):
            results.append(f.result())
    total = time.perf_counter() - start
    ok = sum(1 for r in results if r.get("ok"))
    failed = n - ok
    ms_list = [r["ms"] for r in results if r.get("ok")]
    avg_ms = sum(ms_list) / len(ms_list) if ms_list else 0
    min_ms = min(ms_list) if ms_list else 0
    max_ms = max(ms_list) if ms_list else 0
    rps = n / total if total > 0 else 0
    print(f"Total time:     {total:.2f}s")
    print(f"Successful:     {ok}/{n}")
    print(f"Failed:         {failed}")
    print(f"Requests/sec:   {rps:.1f}")
    print(f"Latency avg:    {avg_ms:.0f} ms")
    print(f"Latency min:    {min_ms:.0f} ms")
    print(f"Latency max:    {max_ms:.0f} ms")
    if failed > 0:
        errs = [r for r in results if not r.get("ok")][:5]
        print("First errors:")
        for r in errs:
            print(f"  #{r['id']}: {r.get('error', '?')}")


def main():
    global FACE_IMAGE_B64
    parser = argparse.ArgumentParser(description="Load test EduLink API")
    parser.add_argument("api_url", nargs="?", default="https://edulink-api.fly.dev", help="API base URL")
    parser.add_argument("--face-image", "-f", metavar="PATH_OR_URL", help="Image file or URL for face detection test")
    parser.add_argument("--face-only", action="store_true", help="Run only face detection test")
    parser.add_argument("--db-only", action="store_true", help="Run only database test")
    parser.add_argument("--concurrent", "-c", type=int, default=50, help="Concurrent requests (default: 50)")
    args = parser.parse_args()

    if args.face_image:
        s = args.face_image.strip()
        if s.startswith(("http://", "https://")):
            try:
                ctx = ssl.create_default_context()
                req = urllib.request.Request(s, headers={"User-Agent": "Mozilla/5.0"})
                with urllib.request.urlopen(req, timeout=15, context=ctx) as r:
                    FACE_IMAGE_B64 = base64.b64encode(r.read()).decode()
                print(f"Fetched face image from URL ({len(FACE_IMAGE_B64)} chars base64)")
            except Exception as e:
                print(f"Error fetching image URL: {e}")
                print("Tip: Download the image and use: --face-image path/to/photo.jpg")
                sys.exit(1)
        else:
            path = Path(s)
            if not path.exists():
                print(f"Error: file not found: {path}")
                sys.exit(1)
            FACE_IMAGE_B64 = base64.b64encode(path.read_bytes()).decode()
            print(f"Using face image: {path} ({len(FACE_IMAGE_B64)} chars base64)")

    api_url = args.api_url.rstrip("/")
    n = max(1, args.concurrent)
    print(f"Load test target: {api_url}")

    if not args.face_only:
        run_test(f"DATABASE ({n} concurrent queries)", run_db_query, n, api_url)
    if not args.db_only:
        run_test(f"FACE DETECTION ({n} concurrent)", run_face_detection, n, api_url)

    print("\n" + "=" * 60)
    print("Done.")
    print("=" * 60)


if __name__ == "__main__":
    main()
