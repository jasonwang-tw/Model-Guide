#!/bin/bash
# Claude Session Usage Monitor Hook
# Stop hook：每次 Claude 回應後執行
#   - 正常：靜默 exit 0
#   - 95%+：儲存狀態、啟動背景倒數、輸出警告 exit 2（Claude 看到並暫停）
#   - 重置後：偵測到狀態檔 + current<5%，輸出 resume 訊號 exit 2（Claude 繼續任務）

MONITOR="$(cd "$(dirname "$0")/.." && pwd)/claude_usage_monitor.js"
STATE_FILE="/tmp/claude_pause_state.json"
RESULT_FILE="/tmp/claude_usage_result.json"

# ── 取得 pct 工具函式 ────────────────────────────────
get_pct() {
  node -e "try{const d=require('$RESULT_FILE');console.log(d.pct)}catch(e){console.log(0)}" 2>/dev/null
}
get_resets_at() {
  node -e "try{const d=require('$RESULT_FILE');console.log(d.resets_at)}catch(e){console.log('')}" 2>/dev/null
}

# ── 計算距離重置剩幾秒 ───────────────────────────────
secs_until_reset() {
  local iso="$1"
  local epoch
  epoch=$(date -d "$iso" +%s 2>/dev/null)
  [ -z "$epoch" ] && echo 300 && return  # fallback 5 分鐘
  local now
  now=$(date +%s)
  local diff=$(( epoch - now + 30 ))     # 多等 30 秒確保已重置
  [ $diff -lt 30 ] && diff=30
  echo "$diff"
}

# ════════════════════════════════════════════════════
# 情況 A：有暫停狀態檔 → 確認是否已重置
# ════════════════════════════════════════════════════
if [ -f "$STATE_FILE" ]; then
  node "$MONITOR" > "$RESULT_FILE" 2>/dev/null
  pct=$(get_pct)

  if [ -n "$pct" ] && [ "$pct" -lt 5 ] 2>/dev/null; then
    rm -f "$STATE_FILE"
    echo "[SESSION RESET] 用量已重置（${pct}%），請繼續之前暫停的任務！"
    exit 2   # 注入訊息讓 Claude 看到並繼續
  fi

  # 尚未重置，靜默等待
  exit 0
fi

# ════════════════════════════════════════════════════
# 情況 B：正常檢查
# ════════════════════════════════════════════════════
node "$MONITOR" > "$RESULT_FILE" 2>/dev/null
rc=$?

# 未達 95%，靜默退出
[ $rc -ne 2 ] && exit 0

# ════════════════════════════════════════════════════
# 情況 C：達到 95%
# ════════════════════════════════════════════════════
pct=$(get_pct)
resets_at=$(get_resets_at)
secs=$(secs_until_reset "$resets_at")

# 儲存狀態（包含重置時間）
cp "$RESULT_FILE" "$STATE_FILE"

# 輸出警告給 Claude
echo "[SESSION CRITICAL] 5小時用量已達 ${pct}%（>= 95%）"
echo "重置時間：${resets_at}（約 ${secs} 秒後）"
echo "請立即暫停任務，條列已完成／未完成項目，等待重置後繼續。"

# ── 背景倒數：等到重置時間後通知終端 ────────────────
nohup bash -c "
  sleep $secs

  # 確認是否真的已重置
  node \"$MONITOR\" > \"$RESULT_FILE\" 2>/dev/null
  pct=\$(node -e \"try{const d=require('$RESULT_FILE');console.log(d.pct)}catch(e){console.log(99)}\" 2>/dev/null)

  if [ -n \"\$pct\" ] && [ \"\$pct\" -lt 5 ] 2>/dev/null; then
    printf '\n\033[32m[RESET READY] Session 已重置（\${pct}%%），請輸入任意內容繼續任務！\033[0m\n' > /dev/tty
    printf '\a' > /dev/tty   # 終端響鈴
  else
    # 尚未重置，再等 2 分鐘重試一次
    sleep 120
    node \"$MONITOR\" > \"$RESULT_FILE\" 2>/dev/null
    pct=\$(node -e \"try{const d=require('$RESULT_FILE');console.log(d.pct)}catch(e){console.log(99)}\" 2>/dev/null)
    printf '\n\033[33m[RESET CHECK] 用量：\${pct}%%，請確認後繼續任務。\033[0m\n' > /dev/tty
    printf '\a' > /dev/tty
  fi
" > /tmp/claude_countdown.log 2>&1 &

exit 2
