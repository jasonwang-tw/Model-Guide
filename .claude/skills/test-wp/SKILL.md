---
name: test-wp
description: WordPress 外掛與主題的完整 QA 測試流程。涵蓋 PHP 語法驗證、安全性掃描（Nonce/權限/SQL/XSS）、檔案結構驗證，以及 wp-env Docker 環境執行測試。由 tester agent 自動調用，或手動用於 WP 專案測試。
---

# WordPress QA 測試流程

## 第一階段：靜態分析

### 1. PHP 語法檢查

```bash
find . -name "*.php" | xargs -I{} php -l {}
```

### 2. 檔案結構驗證

**外掛（Plugin）**
- 主檔案有完整 Plugin Header（`Plugin Name`、`Version`、`Author`）
- 根目錄有 `index.php`（防止目錄列舉）
- 所有 PHP 檔案有 `ABSPATH` 防護：
  ```php
  if ( ! defined( 'ABSPATH' ) ) exit;
  ```

**主題（Theme）**
- `style.css` 含 Theme Header（`Theme Name`、`Version`、`Text Domain`）
- 必要檔案齊全：`functions.php`、`index.php`
- 模板層級符合 WordPress 標準（`single.php`、`page.php`、`archive.php`）

### 3. 安全性掃描

```bash
# 掃描已棄用函式
grep -rn "query_posts\|get_currentuserinfo" --include="*.php" .

# 掃描裸露輸出（未 escape）
grep -rn "echo \$" --include="*.php" .

# 掃描未處理的輸入
grep -rn "\$_GET\|\$_POST\|\$_REQUEST" --include="*.php" .
```

檢查項目：
- **XSS**：輸出使用 `esc_html()` / `esc_attr()` / `esc_url()` / `esc_js()`
- **Nonce**：表單/AJAX 有 `wp_nonce_field()` + `check_admin_referer()` / `check_ajax_referer()`
- **權限**：admin 功能有 `current_user_can()` 驗證
- **SQL**：自訂查詢使用 `$wpdb->prepare()`
- **輸入清理**：`$_GET`/`$_POST` 經過 `sanitize_*` 處理

### 4. 資源載入驗證

- CSS/JS 透過 `wp_enqueue_scripts` 載入（非硬編碼 `<link>` / `<script>`）
- AJAX URL 透過 `wp_localize_script` 注入（非硬編碼）
- JS 有 `(function($){ ... })(jQuery);` 包裝
- 無 `console.log` 殘留

```bash
grep -rn "console\.log" --include="*.js" .
```

---

## 第二階段：環境執行測試

### 前置：確認可用工具

```bash
docker info 2>&1 | head -3
npx --yes @wordpress/env --version 2>/dev/null || echo "wp-env unavailable"
wp --info 2>/dev/null | grep "WP-CLI" || echo "wp-cli unavailable"
```

### 方式 A：wp-env（Docker）

```bash
# 建立 .wp-env.json（若不存在）
# 外掛：{"core":"latest","plugins":["."],"config":{"WP_DEBUG":true,"WP_DEBUG_LOG":true,"WP_DEBUG_DISPLAY":false}}
# 主題：{"core":"latest","themes":["."],"config":{"WP_DEBUG":true,"WP_DEBUG_LOG":true,"WP_DEBUG_DISPLAY":false}}

npx @wordpress/env start
npx @wordpress/env run cli wp core version

# 啟用
npx @wordpress/env run cli wp plugin activate <slug>   # 外掛
npx @wordpress/env run cli wp theme activate <slug>    # 主題

# 建立測試內容
npx @wordpress/env run cli wp post create --post_title="Test Post" --post_status=publish
npx @wordpress/env run cli wp post create --post_title="Test Page" --post_type=page --post_status=publish

# HTTP 測試
curl -s -o /dev/null -w "首頁: %{http_code}\n" http://localhost:8888/
curl -s -o /dev/null -w "後台: %{http_code}\n" http://localhost:8888/wp-admin/
curl -s -o /dev/null -w "REST API: %{http_code}\n" http://localhost:8888/wp-json/

# Debug log
npx @wordpress/env run wordpress cat /var/www/html/wp-content/debug.log 2>/dev/null \
  | grep -i "fatal\|error\|warning" | tail -30

# 外掛停用測試
npx @wordpress/env run cli wp plugin deactivate <slug>
curl -s -o /dev/null -w "停用後首頁: %{http_code}\n" http://localhost:8888/

# 清理
npx @wordpress/env destroy
```

### 方式 B：本地 WP-CLI

```bash
wp plugin activate <slug>
curl -s -o /dev/null -w "%{http_code}" http://localhost/
wp --debug 2>&1 | grep -i "fatal\|error" | head -20
tail -50 wp-content/debug.log
```

### 方式 C：無環境

略過執行測試，在摘要中標註「僅靜態分析」。
