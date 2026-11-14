"""
scraperv2/collector_cron.py
───────────────────────────
Standalone scheduler that exclusively runs the Collector stage
every 30 minutes to aggressively fetch breaking news.
"""

import sys
import time
from datetime import datetime
import os

# Ensure scraperv2 package is importable
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import log
from collector import run as run_collector

LOOP_INTERVAL_MINS = 30

def job():
    log.info(f"\n{'#' * 60}")
    log.info(f"  COLLECTOR ONLY RUN — {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    log.info(f"{'#' * 60}")
    start = time.time()
    try:
        run_collector()
    except Exception as e:
        log.error(f"Collector failed: {e}")
    elapsed = time.time() - start
    log.info(f"  ✓ Collector finished in {elapsed:.1f}s")
    log.info(f"{'#' * 60}\n")

if __name__ == "__main__":
    log.info(f"Starting collector-only scheduler. Will run every {LOOP_INTERVAL_MINS} minutes.")
    log.info("Press Ctrl+C to stop.")
    
    while True:
        try:
            job()
            log.info(f"Sleeping for {LOOP_INTERVAL_MINS} minutes...")
            time.sleep(LOOP_INTERVAL_MINS * 60)
        except KeyboardInterrupt:
            log.info("Stopped by user.")
            break
