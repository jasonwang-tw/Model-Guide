---
name: wp-performance-optimization
description: WordPress 效能優化指南。根據 PageSpeed Insights 數據，分析主題程式碼、啟用外掛、functions.php，診斷並修復造成分數低落的原因。涵蓋前端優化（CSS/JS/圖片）、後端優化（資料庫查詢）、快取策略。當使用者提供 PageSpeed 報告或截圖時，使用此 Skill 進行效能優化。
---

# WordPress 效能優化指南

## 診斷流程

收到 PageSpeed 報告時，依序執行：

1. **識別 Core Web Vitals 問題** - LCP、FID/INP、CLS 各自對應不同優化方向
2. **掃描主題程式碼** - 檢查 functions.php、header.php、模板檔案
3. **分析啟用外掛** - 停用外掛逐一測試，找出效能殺手
4. **制定優化方案** - 按 impact 高低排列
5. **逐步執行並測量** - 每次改動後重測，確認有改善

## Core Web Vitals 問題對照

| 指標 | 門檻 | 常見原因 | 解決方案 |
|------|------|---------|---------|
| LCP > 2.5s | 圖片太大 / TTFB 慢 | WebP + 壓縮、CDN、快取 |
| INP > 200ms | JS 阻塞主執行緒 | 延遲載入、移除不必要 JS |
| CLS > 0.1 | 圖片無 width/height | 設定尺寸、使用 aspect-ratio |
| TTFB > 600ms | 伺服器回應慢 | 啟用頁面快取、資料庫優化 |
| 過多請求 | 外掛載入過多資源 | 條件載入、停用不必要外掛 |

## 前端優化

### JavaScript 延遲載入

```php
// functions.php - 為非關鍵 JS 加上 defer
add_filter('script_loader_tag', function($tag, $handle, $src) {
    // 排除管理員、jQuery（通常其他腳本依賴它）
    if (is_user_logged_in()) return $tag;
    if (in_array($handle, ['jquery', 'jquery-core'])) return $tag;

    return str_replace(' src=', ' defer src=', $tag);
}, 10, 3);
```

### 移除不必要的 WP 預設資源

```php
add_action('wp_enqueue_scripts', function() {
    // 移除 Gutenberg 區塊編輯器 CSS（若前台不使用）
    wp_dequeue_style('wp-block-library');
    wp_dequeue_style('wp-block-library-theme');
    wp_dequeue_style('global-styles');

    // WooCommerce 網站移除不必要的 WC 樣式
    if (!is_woocommerce() && !is_cart() && !is_checkout()) {
        wp_dequeue_style('woocommerce-general');
        wp_dequeue_style('woocommerce-smallscreen');
    }
}, 100);

// 移除 jQuery Migrate（現代瀏覽器不需要）
add_action('wp_default_scripts', function($scripts) {
    if (!is_admin() && isset($scripts->registered['jquery'])) {
        $scripts->registered['jquery']->deps = array_diff(
            $scripts->registered['jquery']->deps,
            ['jquery-migrate']
        );
    }
});
```

### 停用不必要的 WordPress 功能

```php
add_action('init', function() {
    // 停用 Emoji（節省 1 個 JS + 1 個 CSS 請求）
    remove_action('wp_head', 'print_emoji_detection_script', 7);
    remove_action('wp_print_styles', 'print_emoji_styles');
    remove_action('admin_print_scripts', 'print_emoji_detection_script');
    remove_action('admin_print_styles', 'print_emoji_styles');
    remove_filter('the_content_feed', 'wp_staticize_emoji');

    // 停用 oEmbed（若不需要嵌入外部內容）
    remove_action('wp_head', 'wp_oembed_add_discovery_links');
    remove_action('wp_head', 'wp_oembed_add_host_js');

    // 移除 RSD、WLW Manifest 連結
    remove_action('wp_head', 'rsd_link');
    remove_action('wp_head', 'wlwmanifest_link');
}, 1);

// 停用自我 pingback（避免自訂 URL 觸發 pingback）
add_action('pre_ping', function(&$links) {
    $home = home_url();
    foreach ($links as $key => $link) {
        if (strpos($link, $home) === 0) {
            unset($links[$key]);
        }
    }
});
```

### 圖片優化

```php
// 啟用原生 lazy loading（WordPress 5.5+ 已預設啟用）
add_filter('wp_lazy_loading_enabled', '__return_true');

// 支援 WebP 上傳
add_filter('upload_mimes', function($mimes) {
    $mimes['webp'] = 'image/webp';
    return $mimes;
});

// 設定 JPEG 品質為 80（平衡品質與檔案大小）
add_filter('jpeg_quality', fn() => 80);
add_filter('wp_editor_set_quality', fn() => 80);

// 圖片輸出時務必設定 width/height（避免 CLS）
// the_post_thumbnail('medium') 會自動帶 width/height
// 手動輸出時：
echo wp_get_attachment_image($attachment_id, 'medium'); // 正確：帶尺寸屬性
```

## 後端優化

### 資料庫查詢優化

```php
// ❌ 錯誤：N+1 查詢問題
$posts = get_posts(['post_type' => 'product', 'posts_per_page' => 20]);
foreach ($posts as $post) {
    $price = get_post_meta($post->ID, '_price', true); // 每次迴圈都查 DB
}

// ✅ 正確：一次預載所有 meta
$posts = get_posts([
    'post_type'      => 'product',
    'posts_per_page' => 20,
    'update_post_meta_cache' => true, // 預設為 true，確保開啟
    'update_post_term_cache' => true
]);
foreach ($posts as $post) {
    $price = get_post_meta($post->ID, '_price', true); // 從快取讀取
}

// 限制 Revision 數量（wp-config.php）
// define('WP_POST_REVISIONS', 3);
```

### 停用/限制 REST API

```php
// 移除訪客不需要的 REST API 路由（不影響 Gutenberg）
add_action('rest_api_init', function() {
    // 隱藏用戶列表（安全性 + 效能）
    remove_action('rest_api_init', 'create_initial_rest_routes', 0);
}, 9);

// 或僅禁止未登入用戶存取
add_filter('rest_authentication_errors', function($result) {
    if (!empty($result)) return $result;
    if (!is_user_logged_in()) {
        return new WP_Error('rest_not_logged_in', '請先登入', ['status' => 401]);
    }
    return $result;
});
```

## 快取策略

### Transient 快取（適用於昂貴查詢）

```php
function get_featured_products($limit = 5) {
    $cache_key = "featured_products_{$limit}";
    $cached    = get_transient($cache_key);

    if (false !== $cached) {
        return $cached;
    }

    $products = get_posts([
        'post_type'      => 'product',
        'meta_key'       => '_featured',
        'meta_value'     => 'yes',
        'posts_per_page' => $limit
    ]);

    // 快取 30 分鐘
    set_transient($cache_key, $products, 30 * MINUTE_IN_SECONDS);
    return $products;
}

// 當產品更新時清除快取
add_action('save_post_product', function($post_id) {
    delete_transient("featured_products_5");
});
```

### Fragment Cache（快取部分 HTML 輸出）

```php
function cached_section($cache_key, callable $callback, $expire = HOUR_IN_SECONDS) {
    $output = get_transient($cache_key);

    if (false === $output) {
        ob_start();
        $callback();
        $output = ob_get_clean();
        set_transient($cache_key, $output, $expire);
    }

    echo $output;
}

// 使用範例
cached_section('homepage_featured', function() {
    // 複雜的模板輸出...
    get_template_part('template-parts/featured');
}, HOUR_IN_SECONDS);
```

### 瀏覽器快取（.htaccess）

```apache
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/webp       "access plus 1 year"
    ExpiresByType image/jpeg       "access plus 1 year"
    ExpiresByType image/png        "access plus 1 year"
    ExpiresByType image/svg+xml    "access plus 1 year"
    ExpiresByType text/css         "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType image/x-icon     "access plus 1 year"
    ExpiresByType application/font-woff2 "access plus 1 year"
</IfModule>

# Gzip 壓縮
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/css application/javascript application/json
</IfModule>
```

## 資料庫維護

### 清理 Revision

```php
// 在 wp-config.php 限制修訂版本數
// define('WP_POST_REVISIONS', 5);

// 手動清理舊修訂版本（SQL）
global $wpdb;
$wpdb->query(
    "DELETE FROM {$wpdb->posts} WHERE post_type = 'revision'
     AND post_date < DATE_SUB(NOW(), INTERVAL 30 DAY)"
);
```

### 清理過期 Transient

```php
function cleanup_expired_transients() {
    global $wpdb;

    // 刪除過期的 transient timeout 記錄
    $wpdb->query(
        "DELETE FROM {$wpdb->options}
         WHERE option_name LIKE '_transient_timeout_%'
         AND option_value < UNIX_TIMESTAMP()"
    );

    // 刪除對應的 transient 值（已無 timeout 記錄的）
    $wpdb->query(
        "DELETE o FROM {$wpdb->options} o
         LEFT JOIN {$wpdb->options} t
           ON t.option_name = CONCAT('_transient_timeout_', SUBSTRING(o.option_name, 12))
         WHERE o.option_name LIKE '_transient_%'
           AND o.option_name NOT LIKE '_transient_timeout_%'
           AND t.option_name IS NULL"
    );
}
// 可搭配 WP-Cron 定期執行
```

## 監控與診斷

### 慢查詢記錄

```php
// 在開發環境記錄執行超過 0.5s 的查詢
if (WP_DEBUG) {
    add_filter('query', function($query) {
        global $timestart;
        $timestart = microtime(true);
        return $query;
    });

    add_action('shutdown', function() {
        global $wpdb;
        if (!defined('SAVEQUERIES') || !SAVEQUERIES) return;

        foreach ($wpdb->queries as $q) {
            if ($q[1] > 0.5) {
                error_log('[Slow Query] ' . round($q[1], 3) . 's - ' . $q[0]);
            }
        }
    });
}
```

### 頁面載入時間記錄

```php
add_action('wp_footer', function() {
    if (current_user_can('administrator')) {
        global $timestart;
        $load_time = round(microtime(true) - $timestart, 4);
        echo "<!-- Load time: {$load_time}s | Queries: " . get_num_queries() . " -->";
    }
});
```

## 優化清單

### 高優先級（立即執行）
- [ ] 啟用頁面快取（WP Rocket、W3 Total Cache）
- [ ] 啟用 Gzip / Brotli 壓縮
- [ ] 優化並轉換圖片為 WebP 格式
- [ ] 延遲載入非關鍵 JavaScript
- [ ] 設定所有圖片的 width/height（防 CLS）

### 中優先級
- [ ] 啟用物件快取（Redis/Memcached）
- [ ] 用 Transient 快取昂貴的 DB 查詢
- [ ] 停用不必要的 WP 預設資源（Emoji、oEmbed）
- [ ] 條件載入 CSS/JS（只在需要的頁面）
- [ ] 使用 CDN 分發靜態資源

### 低優先級（進階）
- [ ] 清理資料庫（Revision、Transient、垃圾留言）
- [ ] 優化字體載入（`font-display: swap`）
- [ ] 預連接第三方網域（`<link rel="preconnect">`）
- [ ] 啟用 HTTP/2

## 常用效能外掛

| 類型 | 推薦外掛 |
|------|---------|
| 頁面快取 | WP Rocket（付費）、W3 Total Cache、WP Super Cache |
| 圖片優化 | Imagify、Smush、EWWW Image Optimizer |
| 程式碼壓縮 | Autoptimize、Asset CleanUp |
| 效能監控 | Query Monitor、Debug Bar |
| CDN | Cloudflare（免費方案即可）、BunnyCDN |
