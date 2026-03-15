#!/usr/bin/env python3
"""
Claude Code Usage Monitor
監控 current session usage，達到 95% 時輸出警告。
校準基準：Pro 方案 ≈ 53,802,637 tokens / 5hr session（實測 16,140,791 tokens = 30%，UI 實測 2026-03-15）
"""

import json
import shutil
import subprocess
import sys
from datetime import datetime, timezone

PRO_SESSION_LIMIT = 53_802_637  # 校準自 16,140,791 tokens = 30%（UI 實測 2026-03-15）
WARN_THRESHOLD = 0.95           # 95% 警戒線
RESET_THRESHOLD = 0.05          # 5% 以下視為已重置

NPX_PATH = shutil.which("npx") or shutil.which("npx.cmd")
if not NPX_PATH:
    print("ERROR: npx not found. Please install Node.js.")
    sys.exit(1)

def get_active_block():
    result = subprocess.run(
        [NPX_PATH, "ccusage@latest", "blocks", "--json", "--offline"],
        capture_output=True, text=True, shell=False
    )
    if result.returncode != 0:
        return None
    data = json.loads(result.stdout)
    active = [b for b in data["blocks"] if b.get("isActive") and not b.get("isGap")]
    return active[0] if active else None

def check_usage():
    block = get_active_block()
    if not block:
        return {"status": "no_active_block", "pct": 0}

    tokens = block["totalTokens"]
    pct = tokens / PRO_SESSION_LIMIT
    remaining_min = block.get("projection", {}).get("remainingMinutes", 0)

    status = "ok"
    if pct >= WARN_THRESHOLD:
        status = "critical"
    elif pct >= RESET_THRESHOLD and pct < 0.10:
        status = "reset"  # 剛重置

    return {
        "status": status,
        "pct": round(pct * 100, 1),
        "tokens": tokens,
        "limit": PRO_SESSION_LIMIT,
        "remaining_minutes": int(remaining_min),
        "block_start": block["startTime"],
        "block_end": block["endTime"],
    }

if __name__ == "__main__":
    result = check_usage()
    print(json.dumps(result, indent=2))

    pct = result["pct"]
    status = result["status"]

    sys.stdout.reconfigure(encoding="utf-8")

    if status == "critical":
        print(f"\n[CRITICAL] Current session usage: {pct}% -- reached 95%, pause task now!")
        sys.exit(2)
    elif status == "no_active_block":
        print("\n[RESET] No active block -- session has reset or not yet started")
        sys.exit(0)
    else:
        print(f"\n[OK] Current session usage: {pct}%")
        sys.exit(0)
