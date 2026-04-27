"""
scraperv2/orchestrator.py
─────────────────────────
Master pipeline runner. Executes each stage in sequence with timing.

Usage:
    python scraperv2/orchestrator.py            # run once
    python scraperv2/orchestrator.py --loop     # run every 2 hours

Stages:
    1. Collector   — fetch new articles from RSS feeds
    2. Categorizer — classify article categories
    3. Clusterer   — group articles into story clusters
    4. Summarizer  — generate factual summaries per cluster
    5. Bias        — score political bias per article
"""

import sys
import time
import argparse
from datetime import datetime

# Ensure scraperv2 package is importable
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import log

LOOP_INTERVAL_HOURS = 2


def run_stage(name: str, module_run):
    """Run a single pipeline stage with timing and error handling."""
    log.info(f"\n{'═' * 60}")
    log.info(f"  STAGE: {name}")
    log.info(f"{'═' * 60}")

    start = time.time()
    try:
        module_run()
    except Exception as e:
        log.error(f"  ✗ {name} FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False

    elapsed = time.time() - start
    log.info(f"  ✓ {name} completed in {elapsed:.1f}s")
    return True


def run_pipeline():
    """Execute the full pipeline once."""
    pipeline_start = time.time()
    log.info(f"\n{'#' * 60}")
    log.info(f"  PIPELINE START — {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    log.info(f"{'#' * 60}")

    # Import stages lazily to avoid loading heavy models upfront
    from collector import run as collect
    from categorizer import run as categorize
    from clusterer import run as cluster
    from summarizer_v3 import run as summarize
    from bias_analyzer import run as analyze_bias

    stages = [
        ("Collector",   collect),
        ("Categorizer", categorize),
        ("Clusterer",   cluster),
        ("Summarizer",  summarize),
        ("Bias Analyzer", analyze_bias),
    ]

    results = {}
    for name, func in stages:
        ok = run_stage(name, func)
        results[name] = "✓" if ok else "✗"

    total_time = time.time() - pipeline_start

    log.info(f"\n{'#' * 60}")
    log.info(f"  PIPELINE COMPLETE — {total_time:.1f}s total")
    log.info(f"{'#' * 60}")
    for name, status in results.items():
        log.info(f"  {status} {name}")
    log.info("")


def main():
    parser = argparse.ArgumentParser(description="ScraperV2 Pipeline Orchestrator")
    parser.add_argument(
        "--loop",
        action="store_true",
        help=f"Run the pipeline every {LOOP_INTERVAL_HOURS} hours in a loop",
    )
    parser.add_argument(
        "--stage",
        choices=["collect", "categorize", "cluster", "summarize", "bias"],
        help="Run a single stage instead of the full pipeline",
    )
    args = parser.parse_args()

    if args.stage:
        # Run a single stage
        stage_map = {
            "collect":    ("Collector",    lambda: __import__("collector").run()),
            "categorize": ("Categorizer",  lambda: __import__("categorizer").run()),
            "cluster":    ("Clusterer",    lambda: __import__("clusterer").run()),
            "summarize":  ("Summarizer",   lambda: __import__("summarizer_v3").run()),
            "bias":       ("Bias Analyzer",lambda: __import__("bias_analyzer").run()),
        }
        name, func = stage_map[args.stage]
        run_stage(name, func)
        return

    if args.loop:
        log.info(f"Loop mode: will run every {LOOP_INTERVAL_HOURS} hours. Press Ctrl+C to stop.")
        while True:
            try:
                run_pipeline()
                log.info(f"Sleeping for {LOOP_INTERVAL_HOURS} hours...")
                time.sleep(LOOP_INTERVAL_HOURS * 3600)
            except KeyboardInterrupt:
                log.info("Stopped by user.")
                break
    else:
        run_pipeline()


if __name__ == "__main__":
    main()
