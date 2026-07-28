#!/usr/bin/env python3
import argparse
import json
import signal
import sys
import time
import urllib.request
import urllib.error

# Global flags and metrics
interrupted = False
requests_sent = 0
responses_ok = 0
responses_err = 0
latencies = []

def signal_handler(signum, frame):
    global interrupted
    print("\n[Chaos Script] Interrupt received. Initiating cleanup...")
    interrupted = True

# Register signal handlers for graceful shutdown
signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

def set_anomaly_mode(order_service_url, mode):
    url = f"{order_service_url.rstrip('/')}/anomaly"
    data = json.dumps({"mode": mode}).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            res = json.loads(response.read().decode("utf-8"))
            print(f"[Chaos Script] Successfully set anomaly mode to: {res.get('mode')}")
            return True
    except Exception as e:
        print(f"[Chaos Script] Failed to set anomaly mode to {mode}: {e}", file=sys.stderr)
        return False

def make_request(target_url):
    global requests_sent, responses_ok, responses_err, latencies
    start_time = time.time()
    requests_sent += 1
    try:
        # Fetch target URL
        req = urllib.request.Request(target_url)
        with urllib.request.urlopen(req, timeout=10) as response:
            status = response.getcode()
            if status == 200:
                responses_ok += 1
            else:
                responses_err += 1
    except urllib.error.HTTPError as e:
        responses_err += 1
    except Exception as e:
        responses_err += 1
    
    duration = time.time() - start_time
    latencies.append(duration)

def print_summary(mode, start_time):
    actual_duration = time.time() - start_time
    err_percentage = (responses_err / requests_sent * 100) if requests_sent > 0 else 0.0
    
    # Calculate latency stats
    if latencies:
        avg_latency = sum(latencies) / len(latencies)
        sorted_latencies = sorted(latencies)
        p95_idx = int(len(sorted_latencies) * 0.95)
        p95_latency = sorted_latencies[p95_idx]
    else:
        avg_latency = 0.0
        p95_latency = 0.0

    print("=" * 50)
    print("               CHAOS EXECUTION SUMMARY")
    print("=" * 50)
    print(f"Injected Anomaly Mode : {mode}")
    print(f"Requested Duration    : {actual_duration:.2f} seconds")
    print(f"Total Requests Sent   : {requests_sent}")
    print(f"Successful Requests   : {responses_ok}")
    print(f"Failed Requests (5xx) : {responses_err}")
    print(f"Error Percentage      : {err_percentage:.2f}%")
    print(f"Average Latency       : {avg_latency:.4f} seconds")
    print(f"p95 Latency           : {p95_latency:.4f} seconds")
    print("=" * 50)

def main():
    parser = argparse.ArgumentParser(description="Chaos Injection & Load Generation Script")
    parser.add_argument("--mode", choices=["normal", "error", "latency"], required=True,
                        help="Anomaly mode to inject into order-service")
    parser.add_argument("--duration", type=int, default=60,
                        help="Duration of the run in seconds")
    parser.add_argument("--rate", type=int, default=10,
                        help="Requests per second to issue")
    parser.add_argument("--target", default="http://localhost:8080/users",
                        help="Target URL for request load generation")
    parser.add_argument("--order-service-url", default="http://localhost:8081",
                        help="Order service endpoint to switch anomaly mode")
    
    args = parser.parse_args()

    print(f"[Chaos Script] Starting chaos execution. Mode={args.mode}, Target={args.target}")
    
    # Set the anomaly mode
    if not set_anomaly_mode(args.order_service_url, args.mode):
        print("[Chaos Script] Aborting due to failure setting anomaly mode.", file=sys.stderr)
        sys.exit(1)

    start_time = time.time()
    interval = 1.0 / args.rate

    try:
        while time.time() - start_time < args.duration and not interrupted:
            loop_start = time.time()
            make_request(args.target)
            
            # Sleep to maintain requested rate
            elapsed = time.time() - loop_start
            sleep_time = max(0, interval - elapsed)
            if sleep_time > 0:
                time.sleep(sleep_time)
    finally:
        # Cleanup: Restore normal mode
        print("[Chaos Script] Restoring normal anomaly mode...")
        set_anomaly_mode(args.order_service_url, "normal")
        print_summary(args.mode, start_time)

if __name__ == "__main__":
    main()
