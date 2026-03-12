---
name: wordpress-theme-dev
description: WordPress 主題開發指南。涵蓋模板層級、鉤子、模板標籤、自定義 post type、除錯工具等。當修改主題、建立範本檔案或自定義主題功能時使用。
---

# WordPress 主題開發指南

## Icon 使用規範

> **原則**：新專案或新功能一律使用 [Lucide](https://lucide.dev/)，**禁止使用 emoji 代替 icon**。

### 既有專案：先偵測現有 icon 庫

```bash
# 1. 檢查 package.json 已安裝的 icon 庫
cat package.json 2>/dev/null | grep -E "lucide|heroicons|phosphor|react-icons|@fortawesome|feather-icons|@tabler/icons"

# 2. 檢查 functions.php / style.css 是否有引入 icon 庫
grep -rE "lucide|fontawesome|heroicons|feather" functions.php style.css template-parts/ --include="*.php" 2>/dev/null | head -5
```

| 偵測結果 | 做法 |
|---------|------|
| 找到 `lucide-react` / `lucide` | 延續使用 Lucide |
| 找到 `font-awesome` / `heroicons` 等 | 延續使用該庫 |
| 未找到任何 icon 庫 | 使用 Lucide CDN（見下方） |

> **找不到合適 icon 時**：若在既有 icon 庫中無法找到符合情境的圖示，**主動告知開發者**，並推薦 Lucide 中的替代選項，由開發者決定是否採用。

### 安裝 Lucide（新專案預設）

```php
// functions.php — 透過 wp_enqueue_scripts 載入
function theme_enqueue_lucide() {
    wp_enqueue_script(
        'lucide',
        'https://unpkg.com/lucide@latest/dist/umd/lucide.min.js',
        [],
        null,
        true
    );
}
add_action('wp_enqueue_scripts', 'theme_enqueue_lucide');
```

```html
<!-- 在模板中使用 -->
<i data-lucide="search"></i>
<i data-lucide="menu"></i>
<i data-lucide="shopping-cart"></i>
<?php wp_footer(); // 確保 lucide.js 已載入 ?>
<script>lucide.createIcons();</script>
```

---

## 模板層級（Template Hierarchy）

WordPress 模板載入順序（從最具體到最通用）：

| 頁面類型 | 優先順序 |
|---------|---------|
| 單篇文章 | `single-{post-type}-{slug}.php` → `single-{post-type}.php` → `single.php` → `singular.php` → `index.php` |
| 頁面 | `{page-slug}.php` → `page-{id}.php` → `page.php` → `singular.php` → `index.php` |
| 分類 | `category-{slug}.php` → `category-{id}.php` → `category.php` → `archive.php` → `index.php` |
| 首頁 | `front-page.php` → `home.php` → `index.php` |
| 搜尋 | `search.php` → `index.php` |
| 404 | `404.php` → `index.php` |

## CSS 工具鏈設定

### 既有專案：優先偵測現有 UI 工具

**新增功能至既有主題前，先執行以下偵測，延續現有工具；若無則使用預設（Tailwind + PostCSS + SCSS）。**

```bash
# 1. 檢查 package.json 已安裝的 UI 框架
cat package.json 2>/dev/null | grep -E "tailwindcss|bootstrap|bulma|uikit|foundation|daisyui"

# 2. 檢查 functions.php 是否有 CDN 或外部樣式引入
grep -E "bootstrap|tailwind|bulma|uikit|foundation" functions.php style.css 2>/dev/null

# 3. 檢查模板中的 class 命名風格
grep -r 'class="' template-parts/ --include="*.php" 2>/dev/null | head -5

# 4. 檢查現有 CSS 前綴（BEM / utility-first 等）
ls assets/css/ src/scss/ 2>/dev/null
```

| 偵測結果 | 做法 |
|---------|------|
| 找到 `tailwindcss` | 延續 Tailwind，自訂以 SCSS + `@apply` 撰寫 |
| 找到 `bootstrap` | 延續 Bootstrap，自訂以 SCSS 撰寫並編譯 |
| 找到其他框架（bulma / uikit 等） | 延續該框架，自訂以 SCSS 撰寫 |
| 未找到任何框架 | ↓ 使用以下預設設定 |

---

> **預設原則（新主題 / 無既有 UI 框架）**：所有樣式一律透過 TailwindCSS 撰寫；自訂元件以 SCSS 撰寫並編譯，不直接寫純 CSS。PostCSS 負責 autoprefixer 等後處理優化。

```bash
npm install -D tailwindcss postcss autoprefixer sass
npx tailwindcss init
```

```js
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './**/*.php',
    './template-parts/**/*.php',
    './js/**/*.js'
  ],
  theme: { extend: {} },
  plugins: []
}
```

```js
// postcss.config.js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
}
```

```scss
// src/scss/main.scss — 以 SCSS 撰寫自訂樣式，由 PostCSS 編譯
@tailwind base;
@tailwind components;
@tailwind utilities;

// 自訂元件（使用 @layer + @apply + SCSS 巢狀）
@layer components {
  .card {
    @apply rounded-xl border border-gray-200 p-6 shadow-sm;

    &__title {
      @apply text-xl font-bold text-gray-900;
    }

    &__body {
      @apply mt-3 text-gray-600;
    }
  }

  .btn-primary {
    @apply inline-flex items-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700;
  }
}
```

```json
// package.json scripts
{
  "scripts": {
    "build:css": "sass src/scss/main.scss | postcss -o assets/css/main.css --no-map",
    "watch:css": "sass --watch src/scss/main.scss:assets/css/main.css",
    "build": "npm run build:css && npm run build:js"
  }
}
```

## 腳本與樣式載入

```php
// 正確做法：使用 wp_enqueue_scripts 鉤子
function theme_enqueue_scripts() {
    // 載入 Tailwind + SCSS 編譯產出的主要樣式
    wp_enqueue_style('main', get_template_directory_uri() . '/assets/css/main.css', [], wp_get_theme()->get('Version'));

    // 主要 JS（放在 footer）
    wp_enqueue_script('main', get_template_directory_uri() . '/js/main.js', [], '1.0', true);

    // 傳遞 PHP 資料給 JS
    wp_localize_script('main', 'themeData', [
        'ajaxUrl' => admin_url('admin-ajax.php'),
        'nonce'   => wp_create_nonce('theme_nonce')
    ]);
}
add_action('wp_enqueue_scripts', 'theme_enqueue_scripts');

// 條件載入（只在需要的頁面載入）
function theme_conditional_scripts() {
    if (is_singular('product')) {
        wp_enqueue_script('product-gallery', get_template_directory_uri() . '/js/gallery.js', [], '1.0', true);
    }
}
add_action('wp_enqueue_scripts', 'theme_conditional_scripts', 20);
```

## 文章查詢

```php
// 主迴圈
if (have_posts()) :
    while (have_posts()) : the_post();
        the_title();
        the_content();
    endwhile;
    the_posts_pagination(); // 分頁導覽
endif;

// 自訂查詢（用 wp_reset_postdata 重置）
$query = new WP_Query([
    'post_type'      => 'post',
    'posts_per_page' => 6,
    'meta_key'       => 'featured',
    'meta_value'     => 'yes',
    'orderby'        => 'date',
    'order'          => 'DESC'
]);

if ($query->have_posts()) :
    while ($query->have_posts()) : $query->the_post();
        the_title();
    endwhile;
    wp_reset_postdata(); // 必須呼叫，恢復全域 $post
endif;
```

## 常用模板標籤

```php
// 路徑與 URL
get_template_directory_uri()    // 主題目錄 URL
get_stylesheet_directory_uri()  // 子主題目錄 URL
get_stylesheet_uri()            // style.css URL

// 文章資料
the_title()                     // 輸出文章標題
get_the_title()                 // 回傳文章標題（不輸出）
the_permalink()                 // 輸出文章連結
get_permalink()                 // 回傳文章連結
the_content()                   // 輸出文章內容
the_excerpt()                   // 輸出文章摘要
the_post_thumbnail('large')     // 輸出特色圖片
get_the_post_thumbnail_url(null, 'medium') // 取得特色圖片 URL

// 日期與作者
the_date()
the_time('Y-m-d')
the_author()

// 分類與標籤
the_category(', ')
the_tags(', ')
```

## 鉤子（Hooks）

### Actions（動作）

```php
// 初始化：註冊 CPT、taxonomy
add_action('init', function() {
    // register_post_type(), register_taxonomy()
});

// 頁面頭部：加入 meta tag、CSS
add_action('wp_head', function() {
    echo '<meta name="theme-color" content="#ffffff">';
});

// 頁腳：加入追蹤碼
add_action('wp_footer', function() {
    // Google Analytics 等
});

// 後台選單
add_action('admin_menu', function() {
    add_theme_page('主題設定', '主題設定', 'manage_options', 'theme-settings', 'theme_settings_page');
});
```

### Filters（過濾器）

```php
// 修改文章內容（加入前置內容）
add_filter('the_content', function($content) {
    if (is_single() && in_the_loop()) {
        $content = '<div class="post-notice">注意</div>' . $content;
    }
    return $content;
});

// 修改摘要長度
add_filter('excerpt_length', fn() => 30);

// 修改摘要結尾符號
add_filter('excerpt_more', fn() => '...');

// 修改文章 class
add_filter('post_class', function($classes) {
    if (is_sticky()) {
        $classes[] = 'is-featured';
    }
    return $classes;
});
```

### 常用優先級

- `1` - 最早執行
- `10` - 預設
- `20` - 較晚（覆蓋外掛預設值）
- `99` / `9999` - 最後執行（確保最後覆蓋）

## 自定義 Post Type

```php
function theme_register_post_types() {
    register_post_type('portfolio', [
        'labels' => [
            'name'          => '作品集',
            'singular_name' => '作品',
            'add_new_item'  => '新增作品',
            'edit_item'     => '編輯作品'
        ],
        'public'       => true,
        'has_archive'  => true,
        'show_in_rest' => true, // 支援 Gutenberg 編輯器
        'supports'     => ['title', 'editor', 'thumbnail', 'excerpt'],
        'menu_icon'    => 'dashicons-portfolio',
        'rewrite'      => ['slug' => 'portfolio']
    ]);
}
add_action('init', 'theme_register_post_types');
```

## 自定義 Taxonomy

```php
function theme_register_taxonomies() {
    register_taxonomy('project-category', 'portfolio', [
        'labels' => [
            'name'          => '專案類別',
            'singular_name' => '類別'
        ],
        'hierarchical' => true,
        'show_in_rest' => true,
        'rewrite'      => ['slug' => 'project-category']
    ]);
}
add_action('init', 'theme_register_taxonomies');
```

## Theme Support 與 Menus

```php
function theme_setup() {
    // 主題功能支援
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_theme_support('html5', ['search-form', 'comment-form', 'gallery']);
    add_theme_support('woocommerce');

    // 設定特色圖片尺寸
    set_post_thumbnail_size(800, 450, true);
    add_image_size('hero', 1920, 600, true);

    // 導覽選單
    register_nav_menus([
        'primary' => '主導覽',
        'footer'  => '頁腳選單'
    ]);
}
add_action('after_setup_theme', 'theme_setup');

// 輸出選單
wp_nav_menu([
    'theme_location' => 'primary',
    'container'      => 'nav',
    'menu_class'     => 'nav-menu',
    'fallback_cb'    => false
]);
```

## REST API

```php
add_action('rest_api_init', function() {
    register_rest_route('theme/v1', '/posts', [
        'methods'             => 'GET',
        'callback'            => 'theme_get_posts',
        'permission_callback' => '__return_true',
        'args' => [
            'per_page' => ['default' => 10, 'sanitize_callback' => 'absint']
        ]
    ]);
});

function theme_get_posts(WP_REST_Request $request) {
    $posts = get_posts([
        'posts_per_page' => $request->get_param('per_page')
    ]);

    return rest_ensure_response(array_map(function($post) {
        return [
            'id'    => $post->ID,
            'title' => $post->post_title,
            'link'  => get_permalink($post->ID)
        ];
    }, $posts));
}
```

## 使用現有端點（前端 fetch）

```javascript
fetch('/wp-json/wp/v2/posts?per_page=6')
    .then(res => res.json())
    .then(posts => console.log(posts));
```

## 除錯工具

### 開啟除錯（wp-config.php）

```php
define('WP_DEBUG',         true);
define('WP_DEBUG_LOG',     true);   // 寫入 wp-content/debug.log
define('WP_DEBUG_DISPLAY', false);  // 不在前台顯示錯誤
define('SCRIPT_DEBUG',     true);   // 載入未壓縮的 JS/CSS
```

### 常用除錯函數

```php
// 僅管理員可見
if (current_user_can('administrator')) {
    echo '<pre>' . print_r($variable, true) . '</pre>';
}

// 寫入日誌
error_log('[Theme] ' . print_r($variable, true));

// 檢查當前查詢
global $wp_query;
echo '<pre>' . print_r($wp_query->query_vars, true) . '</pre>';

// 計算資料庫查詢次數（需開啟 SAVEQUERIES）
if (defined('SAVEQUERIES') && SAVEQUERIES) {
    global $wpdb;
    echo $wpdb->num_queries . ' queries';
}
```

### 推薦除錯外掛

- **Query Monitor** - 查看資料庫查詢、PHP 錯誤、HTTP 請求、Hook 列表
- **Debug Bar** - 簡易除錯工具列

## 最佳實踐

1. **永遠用鉤子載入腳本** - 不要直接在 header.php 中 `<script>` 或 `<link>`
2. **前綴所有函數** - 避免與外掛衝突（如 `mytheme_`）
3. **子主題** - 修改現有主題時使用子主題，避免更新被覆蓋
4. **`wp_reset_postdata()`** - 自訂 `WP_Query` 查詢後必須呼叫
5. **安全輸出** - `esc_html()`、`esc_attr()`、`esc_url()`、`wp_kses()`
6. **本地化** - 使用 `__()`、`_e()` 處理顯示字串

## 快速參考

| 類型 | 函數 |
|------|------|
| 迴圈重置 | `wp_reset_postdata()` / `wp_reset_query()` |
| 取得 URL | `home_url()`, `get_permalink()`, `get_template_directory_uri()` |
| 用戶權限 | `current_user_can('editor')`, `is_user_logged_in()` |
| 條件標籤 | `is_single()`, `is_page()`, `is_archive()`, `is_singular()`, `is_front_page()` |
| 安全輸出 | `esc_html()`, `esc_attr()`, `esc_url()`, `wp_kses_post()` |
| 圖片 | `the_post_thumbnail()`, `get_the_post_thumbnail_url()`, `wp_get_attachment_image()` |
