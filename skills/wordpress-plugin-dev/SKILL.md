---
name: wordpress-plugin-dev
description: WordPress 外掛開發指南。涵蓋外掛結構、Settings API、Shortcode、Custom Post Type、REST API、Activation Hook、WP-Cron 等。當建立外掛、開發外掛功能或發布外掛至 WordPress.org 時使用。
---

# WordPress 外掛開發指南

## Icon 使用規範

**禁止使用 emoji 代替 icon**。依使用場景選擇對應 icon 系統：

| 場景 | Icon 系統 | 說明 |
|------|---------|------|
| **wp-admin 後台 UI** | [Dashicons](https://developer.wordpress.org/resource/dashicons/)（WP 內建） | 已隨 wp-admin 載入，零額外依賴，視覺與後台一致 |
| **前台輸出**（Shortcode / Block 前端 / 自訂頁面） | [Lucide](https://lucide.dev/) | 輕量 SVG，適合前台自訂 UI |
| **既有專案** | 先偵測現有 icon 庫並延續 | 見下方偵測指令 |

### 既有專案：先偵測現有 icon 庫

```bash
# 檢查 PHP / enqueue 是否已引入 icon 庫
grep -rE "dashicons|lucide|fontawesome|heroicons" *.php admin/ --include="*.php" 2>/dev/null | head -5

# 檢查 package.json
cat package.json 2>/dev/null | grep -E "lucide|heroicons|@fortawesome|feather-icons"
```

> **找不到合適 icon 時**：若在既有 icon 庫中找不到符合情境的圖示，**主動告知開發者**，並推薦替代選項，由開發者決定。

### Buy Me a Coffee 按鈕規範

WordPress 外掛優先使用 **Dashicons 原生圖示**，流程如下：

1. **先檢查 Dashicons** 是否有符合的圖示
2. 有 → 使用 Dashicons（後台）或 Lucide（前台）
3. 無 → **例外允許使用 ☕ emoji**

> ✅ Dashicons 已有 `dashicons-coffee`（代碼 `f16f`），Buy Me a Coffee 按鈕**應優先使用此 icon**，不需 emoji。

| 位置 | 做法 |
|------|------|
| **後台（wp-admin）** | 使用 `dashicons-coffee` |
| **前台輸出** | 使用 Lucide `<Coffee />` 或官方 SVG |
| **找不到合適 Dashicons** | 例外：允許使用 ☕ emoji |

```php
// ✅ 後台：使用 Dashicons coffee
echo '<a href="https://buymeacoffee.com/jasonwang0052" target="_blank">
  <span class="dashicons dashicons-coffee"></span>
  Buy Me a Coffee
</a>';
```

```html
<!-- ✅ 前台：使用 Lucide CDN -->
<a href="https://buymeacoffee.com/jasonwang0052" target="_blank" rel="noopener noreferrer">
  <i data-lucide="coffee"></i>
  Buy Me a Coffee
</a>
```

### Dashicons 使用範例（wp-admin 預設）

```php
// Dashicons 已自動載入於 wp-admin，直接使用即可
// 在後台 HTML 中：
// <span class="dashicons dashicons-admin-settings"></span>
// <span class="dashicons dashicons-search"></span>
// <span class="dashicons dashicons-yes-alt"></span>

// CPT menu_icon 同樣使用 Dashicons
'menu_icon' => 'dashicons-book'

// 瀏覽所有圖示：https://developer.wordpress.org/resource/dashicons/
```

### Lucide 使用範例（前台輸出）

```php
// 前台 enqueue Lucide CDN
function my_plugin_enqueue_frontend() {
    wp_enqueue_script(
        'lucide',
        'https://unpkg.com/lucide@latest/dist/umd/lucide.min.js',
        [], null, true
    );
}
add_action('wp_enqueue_scripts', 'my_plugin_enqueue_frontend');
```

```html
<!-- 前台 Shortcode / Block 輸出 -->
<i data-lucide="search"></i>
<i data-lucide="arrow-right"></i>
<script>lucide.createIcons();</script>
```

---

## 外掛結構

```php
<?php
/**
 * Plugin Name: My Custom Plugin
 * Plugin URI:  https://example.com/my-plugin
 * Description: 簡短描述外掛功能
 * Version:     1.0.0
 * Author:      Your Name
 * License:     GPL2
 * Text Domain: my-plugin
 */

// 防止直接存取
if (!defined('ABSPATH')) {
    exit;
}

// 定義常數（方便後續使用）
define('MY_PLUGIN_VERSION', '1.0.0');
define('MY_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('MY_PLUGIN_URL', plugin_dir_url(__FILE__));
```

## Activation / Deactivation / Uninstall Hook

```php
register_activation_hook(__FILE__, 'my_plugin_activate');
register_deactivation_hook(__FILE__, 'my_plugin_deactivate');

function my_plugin_activate() {
    // 建立資料表、設定預設選項等
    my_plugin_create_tables();
    flush_rewrite_rules();
}

function my_plugin_deactivate() {
    // 清除排程工作
    wp_clear_scheduled_hook('my_daily_event');
    flush_rewrite_rules();
}

// 刪除外掛時的清理（建立獨立的 uninstall.php）
// uninstall.php
if (!defined('WP_UNINSTALL_PLUGIN')) {
    exit;
}
delete_option('my_plugin_settings');
// 刪除自訂資料表
global $wpdb;
$wpdb->query("DROP TABLE IF EXISTS {$wpdb->prefix}my_table");
```

## Settings API

```php
function my_plugin_settings_init() {
    register_setting(
        'my_plugin_options',
        'my_plugin_settings',
        ['sanitize_callback' => 'my_plugin_sanitize_settings']
    );

    add_settings_section('my_plugin_section', '主要設定', 'my_plugin_section_callback', 'my_plugin');

    add_settings_field(
        'api_key',
        'API 金鑰',
        'my_plugin_api_key_callback',
        'my_plugin',
        'my_plugin_section'
    );
}
add_action('admin_init', 'my_plugin_settings_init');

// 設定值清理（永遠要清理使用者輸入）
function my_plugin_sanitize_settings($input) {
    $output = [];
    if (isset($input['api_key'])) {
        $output['api_key'] = sanitize_text_field($input['api_key']);
    }
    return $output;
}

function my_plugin_menu() {
    add_options_page('My Plugin 設定', 'My Plugin', 'manage_options', 'my-plugin', 'my_plugin_options_page');
}
add_action('admin_menu', 'my_plugin_menu');
```

## Shortcode

```php
function my_shortcode_handler($atts, $content = null) {
    $atts = shortcode_atts([
        'type'  => 'default',
        'count' => 5
    ], $atts);

    // 清理屬性值
    $type  = sanitize_text_field($atts['type']);
    $count = absint($atts['count']);

    // 使用 ob_start 保持輸出乾淨
    ob_start();
    ?>
    <div class="my-shortcode my-shortcode--<?php echo esc_attr($type); ?>">
        <?php echo esc_html($content); ?>
    </div>
    <?php
    return ob_get_clean();
}
add_shortcode('my_shortcode', 'my_shortcode_handler');

// 使用：[my_shortcode type="featured" count="10"]
```

## Custom Post Type

```php
function my_custom_post_type() {
    register_post_type('my_book', [
        'labels' => [
            'name'               => '書籍',
            'singular_name'      => '書籍',
            'add_new_item'       => '新增書籍',
            'edit_item'          => '編輯書籍',
            'search_items'       => '搜尋書籍',
            'not_found'          => '找不到書籍'
        ],
        'public'       => true,
        'has_archive'  => true,
        'show_in_rest' => true, // 支援 Gutenberg 編輯器
        'supports'     => ['title', 'editor', 'thumbnail', 'excerpt', 'custom-fields'],
        'menu_icon'    => 'dashicons-book',
        'rewrite'      => ['slug' => 'books']
    ]);
}
add_action('init', 'my_custom_post_type');
```

## Custom Taxonomy

```php
function my_custom_taxonomy() {
    register_taxonomy('genre', 'my_book', [
        'labels' => [
            'name'          => '類型',
            'singular_name' => '類型',
            'add_new_item'  => '新增類型'
        ],
        'hierarchical'  => true,
        'show_in_rest'  => true,
        'rewrite'       => ['slug' => 'genre']
    ]);
}
add_action('init', 'my_custom_taxonomy');
```

## REST API

```php
add_action('rest_api_init', function() {
    register_rest_route('my-plugin/v1', '/books', [
        [
            'methods'             => 'GET',
            'callback'            => 'get_books',
            'permission_callback' => '__return_true',
            'args' => [
                'per_page' => [
                    'default'           => 10,
                    'sanitize_callback' => 'absint'
                ]
            ]
        ],
        [
            'methods'             => 'POST',
            'callback'            => 'create_book',
            'permission_callback' => function() {
                return current_user_can('manage_options');
            },
            'args' => [
                'title' => [
                    'required'          => true,
                    'sanitize_callback' => 'sanitize_text_field'
                ]
            ]
        ]
    ]);
});

function get_books(WP_REST_Request $request) {
    $per_page = $request->get_param('per_page');
    $books    = get_posts(['post_type' => 'my_book', 'posts_per_page' => $per_page]);
    return rest_ensure_response(array_map(function($book) {
        return ['id' => $book->ID, 'title' => $book->post_title];
    }, $books));
}

function create_book(WP_REST_Request $request) {
    $post_id = wp_insert_post([
        'post_type'   => 'my_book',
        'post_title'  => $request->get_param('title'),
        'post_status' => 'publish'
    ]);

    if (is_wp_error($post_id)) {
        return new WP_Error('create_failed', $post_id->get_error_message(), ['status' => 500]);
    }

    return rest_ensure_response(['id' => $post_id]);
}
```

## WP-Cron

```php
// 排程事件（在 activation hook 中設定）
function my_plugin_schedule_events() {
    if (!wp_next_scheduled('my_daily_event')) {
        wp_schedule_event(time(), 'daily', 'my_daily_event');
    }
}
add_action('wp', 'my_plugin_schedule_events');

add_action('my_daily_event', function() {
    // 每日執行的工作（如同步資料、清理快取）
    error_log('[My Plugin] 執行每日排程工作');
});

// 在 deactivation hook 中清除
// wp_clear_scheduled_hook('my_daily_event');
```

## Custom Database Table

```php
function my_plugin_create_tables() {
    global $wpdb;
    $table_name      = $wpdb->prefix . 'my_table';
    $charset_collate = $wpdb->get_charset_collate();

    $sql = "CREATE TABLE {$table_name} (
        id       mediumint(9)  NOT NULL AUTO_INCREMENT,
        name     varchar(255)  NOT NULL,
        status   varchar(20)   NOT NULL DEFAULT 'pending',
        created_at datetime    DEFAULT CURRENT_TIMESTAMP NOT NULL,
        PRIMARY KEY (id),
        KEY status (status)
    ) {$charset_collate};";

    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    dbDelta($sql); // dbDelta 可安全升級既有資料表結構
}

// 使用資料表
function my_plugin_insert_record($name) {
    global $wpdb;
    $wpdb->insert(
        $wpdb->prefix . 'my_table',
        ['name' => sanitize_text_field($name), 'status' => 'pending'],
        ['%s', '%s']
    );
    return $wpdb->insert_id;
}

function my_plugin_get_records($status = 'pending') {
    global $wpdb;
    return $wpdb->get_results(
        $wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}my_table WHERE status = %s ORDER BY created_at DESC",
            $status
        )
    );
}
```

## CSS 工具鏈

依場景選擇對應的樣式方案：

| 場景 | 預設做法 | 原因 |
|------|---------|------|
| **wp-admin 後台 UI** | WP 原生樣式 | 避免 Tailwind Preflight 破壞後台既有樣式，零額外依賴 |
| **複雜後台 UI（React）** | `@wordpress/components` | Gutenberg 元件庫，與 Block Editor 風格一致 |
| **前台輸出**（Shortcode / Block 前端） | Tailwind + PostCSS + SCSS | 前台不受 wp-admin 限制，適合自訂 UI |

---

### 後台 UI：WP 原生樣式（預設）

> WP admin 已內建完整 UI class，**無需引入任何外部 CSS 框架**。

```php
// 常用 WP 原生樣式 class
// 按鈕：.button .button-primary .button-secondary .button-link .button-link-delete
// 表單：.form-table .regular-text .large-text
// 通知：.notice .notice-success .notice-warning .notice-error .notice-info .is-dismissible
// 卡片：.postbox .inside
// 標題：.wp-heading-inline .page-title-action
```

```php
// 典型 Settings 頁面輸出範例（使用 WP 原生樣式）
function my_plugin_options_page() {
    ?>
    <div class="wrap">
        <h1><?php echo esc_html(get_admin_page_title()); ?></h1>

        <div class="notice notice-info">
            <p>說明文字</p>
        </div>

        <form method="post" action="options.php">
            <?php settings_fields('my_plugin_options'); ?>
            <?php do_settings_sections('my_plugin'); ?>

            <table class="form-table" role="presentation">
                <tr>
                    <th scope="row"><label for="api_key">API 金鑰</label></th>
                    <td>
                        <input type="text" id="api_key" name="my_plugin_settings[api_key]"
                               class="regular-text" value="<?php echo esc_attr($api_key); ?>">
                        <p class="description">取得 API 金鑰請至...</p>
                    </td>
                </tr>
            </table>

            <?php submit_button(); ?>
        </form>
    </div>
    <?php
}
```

```php
// enqueue 自訂後台樣式（僅補充 WP 原生不足的部分，以純 CSS 撰寫）
function my_plugin_enqueue_admin_styles($hook) {
    if ($hook !== 'settings_page_my-plugin') return;
    wp_enqueue_style('my-plugin-admin', MY_PLUGIN_URL . 'assets/css/admin.css', [], MY_PLUGIN_VERSION);
}
add_action('admin_enqueue_scripts', 'my_plugin_enqueue_admin_styles');
```

```css
/* assets/css/admin.css — 僅補充 WP 原生不足的自訂樣式，不引入外部框架 */
/* ⚠️ 不使用 Tailwind Preflight（會覆蓋 wp-admin 既有樣式） */

.my-plugin-wrap .settings-card {
    background: #fff;
    border: 1px solid #c3c4c7;
    border-radius: 4px;
    padding: 20px;
    margin-bottom: 16px;
}
```

---

### 複雜後台 UI（React）：@wordpress/components

```bash
npm install @wordpress/components @wordpress/element
```

```jsx
import { Button, TextControl, Notice, Panel, PanelBody } from '@wordpress/components'
import { useState } from '@wordpress/element'

function PluginSettings() {
    const [apiKey, setApiKey] = useState('')

    return (
        <Panel>
            <PanelBody title="API 設定" initialOpen={true}>
                <TextControl
                    label="API 金鑰"
                    value={apiKey}
                    onChange={setApiKey}
                />
                <Button variant="primary" onClick={handleSave}>
                    儲存設定
                </Button>
            </PanelBody>
        </Panel>
    )
}
```

---

### 前台輸出：Tailwind + PostCSS + SCSS

**新增功能至既有外掛前，先偵測現有 UI 工具：**

```bash
# 檢查 package.json 已安裝的 UI 框架
cat package.json 2>/dev/null | grep -E "tailwindcss|bootstrap|bulma"

# 檢查前台 enqueue 是否已引入框架
grep -E "bootstrap|tailwind|bulma" *.php templates/ --include="*.php" 2>/dev/null
```

| 偵測結果 | 做法 |
|---------|------|
| 找到 `tailwindcss` | 延續 Tailwind，自訂以 SCSS + `@apply` 撰寫 |
| 找到 `bootstrap` | 延續 Bootstrap，自訂以 SCSS 撰寫並編譯 |
| 找到其他框架 | 延續該框架 |
| 未找到任何框架 | ↓ 使用以下預設設定 |

```bash
npm install -D tailwindcss postcss autoprefixer sass
npx tailwindcss init
```

```js
// tailwind.config.js
module.exports = {
  content: ['./templates/**/*.php', './js/**/*.js'],
  theme: { extend: {} },
  plugins: []
}
```

```scss
// src/scss/frontend.scss
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer components {
  .my-plugin-card {
    @apply rounded-lg border border-gray-200 bg-white p-5 shadow-sm;
  }
}
```

```json
// package.json scripts
{
  "scripts": {
    "build:css": "sass src/scss/frontend.scss | postcss -o assets/css/frontend.css --no-map",
    "watch:css": "sass --watch src/scss/frontend.scss:assets/css/frontend.css"
  }
}
```

```php
// 載入前台樣式（僅在有輸出的頁面）
function my_plugin_enqueue_frontend_styles() {
    if (!is_page_with_shortcode('my_shortcode')) return;
    wp_enqueue_style('my-plugin-frontend', MY_PLUGIN_URL . 'assets/css/frontend.css', [], MY_PLUGIN_VERSION);
}
add_action('wp_enqueue_scripts', 'my_plugin_enqueue_frontend_styles');
```

## AJAX

```php
// 前端：使用 wp_localize_script 傳遞 nonce
function my_plugin_enqueue_scripts() {
    wp_enqueue_script('my-plugin', MY_PLUGIN_URL . 'js/main.js', ['jquery'], MY_PLUGIN_VERSION, true);
    wp_localize_script('my-plugin', 'myPluginData', [
        'ajaxUrl' => admin_url('admin-ajax.php'),
        'nonce'   => wp_create_nonce('my_nonce')
    ]);
}
add_action('wp_enqueue_scripts', 'my_plugin_enqueue_scripts');

// js/main.js
// jQuery.post(myPluginData.ajaxUrl, {
//     action: 'my_ajax_handler',
//     nonce:  myPluginData.nonce,
//     data:   'some_value'
// }).done(function(response) { console.log(response); });

// 後端：登入用戶與訪客都可使用
add_action('wp_ajax_my_ajax_handler', 'my_ajax_handler');
add_action('wp_ajax_nopriv_my_ajax_handler', 'my_ajax_handler');

function my_ajax_handler() {
    // 1. 驗證 nonce
    check_ajax_referer('my_nonce', 'nonce');

    // 2. 驗證權限（若需要）
    // if (!current_user_can('edit_posts')) {
    //     wp_send_json_error('權限不足', 403);
    // }

    // 3. 清理輸入
    $data = isset($_POST['data']) ? sanitize_text_field($_POST['data']) : '';

    if (empty($data)) {
        wp_send_json_error('缺少必要參數');
    }

    // 4. 處理業務邏輯
    $result = my_plugin_process($data);

    wp_send_json_success(['result' => $result]);
}
```

## 最佳實踐

1. **前綴所有函數與類** - 避免與其他外掛衝突（如 `myplugin_`）
2. **永遠清理輸入** - 使用 `sanitize_*()` 系列函數
3. **永遠跳脫輸出** - 使用 `esc_html()`、`esc_attr()`、`esc_url()`
4. **使用 `wp_json_encode()`** - 而非原生 `json_encode()`
5. **Nonce 驗證** - 所有表單和 AJAX 請求都要驗證 nonce
6. **準備好 SQL** - 使用 `$wpdb->prepare()` 防止 SQL injection
7. **國際化** - 使用 `__()` 和 `load_plugin_textdomain()`
8. **語意化版本** - 遵守 Semantic Versioning (1.0.0)

## 快速參考

| 類型 | 函數 |
|------|------|
| 路徑 | `plugin_dir_path(__FILE__)`, `plugin_dir_url(__FILE__)` |
| 選項 | `get_option()`, `update_option()`, `delete_option()` |
| Post Meta | `get_post_meta()`, `update_post_meta()`, `delete_post_meta()` |
| 用戶 Meta | `get_user_meta()`, `update_user_meta()` |
| Nonce | `wp_create_nonce()`, `check_ajax_referer()`, `wp_verify_nonce()` |
| 清理輸入 | `sanitize_text_field()`, `absint()`, `wp_kses_post()` |
| 跳脫輸出 | `esc_html()`, `esc_attr()`, `esc_url()`, `wp_kses()` |
| SQL 安全 | `$wpdb->prepare()`, `$wpdb->insert()`, `$wpdb->update()` |
