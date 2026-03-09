---
name: test-web
description: 網站專案（Next.js / Astro / 一般 Web）的完整 QA 測試流程。涵蓋 TypeScript 型別檢查、ESLint、建置驗證、API 路由測試、SEO 基礎驗證、console.log 殘留掃描，以及單元/整合測試執行。由 tester agent 自動調用，或手動用於網站專案測試。
---

# 網站 QA 測試流程

## 框架偵測

```bash
# 判斷框架
[ -f "next.config.js" ] || [ -f "next.config.ts" ] || [ -f "next.config.mjs" ] && echo "Next.js"
[ -f "astro.config.mjs" ] || [ -f "astro.config.ts" ] && echo "Astro"
[ -f "vite.config.*" ] && echo "Vite"
[ -f "package.json" ] && node -e "const p=require('./package.json'); console.log(Object.keys({...p.dependencies,...p.devDependencies}).filter(k=>['react','vue','svelte','angular'].includes(k)))"
```

---

## 第一階段：靜態分析

### 1. TypeScript 型別檢查

```bash
npx tsc --noEmit 2>&1 | head -50
```

### 2. ESLint / Lint

```bash
# Next.js
npx next lint 2>&1 | head -50

# 一般
npx eslint . --ext .js,.ts,.jsx,.tsx 2>&1 | head -50
```

### 3. 程式碼掃描

```bash
# console.log 殘留
grep -rn "console\.log\|console\.debug" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" src/ app/ 2>/dev/null

# 硬編碼敏感資料
grep -rn "api.key\|apikey\|secret\|password" --include="*.ts" --include="*.tsx" --include="*.js" -i src/ app/ 2>/dev/null | grep -v ".env\|process.env\|//\|test"

# TODO / FIXME 殘留
grep -rn "TODO\|FIXME" --include="*.ts" --include="*.tsx" --include="*.js" src/ app/ 2>/dev/null
```

### 4. 環境變數安全性（Next.js）

```bash
# 確認敏感變數不含 NEXT_PUBLIC_ 前綴（否則會暴露至客戶端）
grep -rn "NEXT_PUBLIC_" .env* 2>/dev/null | grep -i "secret\|key\|password\|token"
```

### 5. Next.js 特定驗證

```bash
# 確認 'use client' 無濫用（Server Component 裡不應有）
grep -rn "'use client'" app/ 2>/dev/null | wc -l

# 確認圖片使用 next/image
grep -rn "<img " --include="*.tsx" --include="*.jsx" app/ src/ 2>/dev/null | grep -v "//\|next/image"

# API Route 輸入驗證
grep -rn "request\.json()\|req\.body" --include="*.ts" app/api/ src/api/ 2>/dev/null
```

### 6. Astro 特定驗證

```bash
npx astro check 2>&1 | head -30

# Content Collection schema 驗證
[ -d "src/content" ] && ls src/content/
```

---

## 第二階段：建置與執行測試

### 1. 依賴安裝確認

```bash
[ -f "package-lock.json" ] && npm ci --silent 2>&1 | tail -5
[ -f "yarn.lock" ] && yarn install --frozen-lockfile 2>&1 | tail -5
[ -f "pnpm-lock.yaml" ] && pnpm install --frozen-lockfile 2>&1 | tail -5
```

### 2. 建置測試

```bash
npm run build 2>&1 | tail -30
echo "Build exit code: $?"
```

### 3. 單元 / 整合測試

```bash
# Jest
npx jest --passWithNoTests 2>&1 | tail -20

# Vitest
npx vitest run 2>&1 | tail -20

# 自動偵測
npm test -- --passWithNoTests 2>&1 | tail -20
```

### 4. 啟動並測試關鍵路由

```bash
# 啟動 preview server
npm run start &> /tmp/web-test.log &
SERVER_PID=$!
sleep 5

BASE_URL="http://localhost:3000"

# 測試關鍵路由
curl -s -o /dev/null -w "首頁        → %{http_code}\n" "$BASE_URL/"
curl -s -o /dev/null -w "API health  → %{http_code}\n" "$BASE_URL/api/health" 2>/dev/null
curl -s -o /dev/null -w "sitemap.xml → %{http_code}\n" "$BASE_URL/sitemap.xml" 2>/dev/null
curl -s -o /dev/null -w "robots.txt  → %{http_code}\n" "$BASE_URL/robots.txt" 2>/dev/null

kill $SERVER_PID 2>/dev/null
```

### 5. SEO 基礎驗證

```bash
# 啟動後測試首頁 meta
curl -s http://localhost:3000/ | grep -E "<title>|<meta name=\"description\"|og:title|og:description|canonical" | head -10
```

確認項目：
- `<title>` 存在且非空
- `meta description` 存在
- Open Graph 標籤（`og:title`、`og:description`、`og:image`）
- `canonical` URL 設定

### 6. Lighthouse CI（選用）

```bash
npx lhci autorun 2>/dev/null || echo "Lighthouse CI 未設定，可選擇性執行"
```

---

## 無執行環境

若無法執行 `npm run build`（例如缺少 Node.js 或依賴），在摘要中標註「僅靜態分析」。
