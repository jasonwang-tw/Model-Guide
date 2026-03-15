---
name: rest-api-integration
description: REST API 串接整合指南。涵蓋 WP REST API、WooCommerce API、第三方 API 串接、認證方式、HTTP 請求處理。當需要串接外部服務、抓取資料、同步數據或開發 API 功能時使用。
---

# REST API 串接整合指南

## API 搜尋流程

當使用者提到串接特定平台時：

1. **識別平台** - 從關鍵字判斷目標 API（如 Stripe、LINE、Github 等）
2. **搜尋官方文檔** - 使用 WebSearch 查找最新 API 文件
3. **分析端點** - 確認 Base URL、認證方式、請求格式、Rate Limits
4. **實作驗證** - 先用 curl 測試確認端點可用後再寫程式碼

## WP REST API

### 基本使用

```php
// 獲取文章（加上 timeout 避免請求掛起）
$response = wp_remote_get('https://example.com/wp-json/wp/v2/posts?per_page=10', [
    'timeout' => 15
]);

if (is_wp_error($response)) {
    error_log('API Error: ' . $response->get_error_message());
    return false;
}

$code = wp_remote_retrieve_response_code($response);
if ($code !== 200) {
    error_log('API HTTP Error: ' . $code);
    return false;
}

$posts = json_decode(wp_remote_retrieve_body($response));
```

### POST 請求（建立文章）

```php
$response = wp_remote_post('https://example.com/wp-json/wp/v2/posts', [
    'timeout' => 15,
    'headers' => [
        'Authorization' => 'Basic ' . base64_encode('username:application_password'),
        'Content-Type'  => 'application/json'
    ],
    'body' => wp_json_encode([
        'title'   => '新文章標題',
        'content' => '文章內容',
        'status'  => 'publish'
    ])
]);

$data = json_decode(wp_remote_retrieve_body($response));
```

### PUT / PATCH 請求（更新資料）

```php
// PUT：替換整個資源
$response = wp_remote_request('https://example.com/wp-json/wp/v2/posts/123', [
    'method'  => 'PUT',
    'timeout' => 15,
    'headers' => [
        'Authorization' => 'Basic ' . base64_encode('username:application_password'),
        'Content-Type'  => 'application/json'
    ],
    'body' => wp_json_encode(['title' => '更新後的標題'])
]);

// PATCH：部分更新（更常用）
$response = wp_remote_request('https://example.com/wp-json/wp/v2/posts/123', [
    'method'  => 'PATCH',
    'timeout' => 15,
    'headers' => [
        'Authorization' => 'Basic ' . base64_encode('username:application_password'),
        'Content-Type'  => 'application/json'
    ],
    'body' => wp_json_encode(['status' => 'draft'])
]);
```

### DELETE 請求

```php
$response = wp_remote_request('https://example.com/wp-json/wp/v2/posts/123', [
    'method'  => 'DELETE',
    'timeout' => 15,
    'headers' => [
        'Authorization' => 'Basic ' . base64_encode('username:application_password')
    ]
]);
```

### 自定義端點

```php
add_action('rest_api_init', function() {
    register_rest_route('custom/v1', '/sync', [
        'methods'             => 'POST',
        'callback'            => 'sync_external_data',
        'permission_callback' => function() {
            return current_user_can('manage_options');
        },
        'args' => [
            'title'   => ['required' => true, 'sanitize_callback' => 'sanitize_text_field'],
            'content' => ['required' => true, 'sanitize_callback' => 'wp_kses_post']
        ]
    ]);
});

function sync_external_data(WP_REST_Request $request) {
    $post_id = wp_insert_post([
        'post_title'   => $request->get_param('title'),
        'post_content' => $request->get_param('content'),
        'post_status'  => 'publish'
    ]);

    if (is_wp_error($post_id)) {
        return new WP_Error('insert_failed', $post_id->get_error_message(), ['status' => 500]);
    }

    return rest_ensure_response(['success' => true, 'post_id' => $post_id]);
}
```

## WooCommerce REST API

```php
$consumer_key    = 'ck_xxxxxxxxxxxx';
$consumer_secret = 'cs_xxxxxxxxxxxx';
$store_url       = 'https://example.com';
$auth_header     = ['Authorization' => 'Basic ' . base64_encode("{$consumer_key}:{$consumer_secret}")];

// 獲取產品
$response = wp_remote_get("{$store_url}/wp-json/wc/v3/products", [
    'timeout' => 15,
    'headers' => $auth_header
]);
$products = json_decode(wp_remote_retrieve_body($response));

// 建立訂單
$order_data = [
    'payment_method'       => 'bacs',
    'payment_method_title' => 'Bank Transfer',
    'set_paid'             => true,
    'billing'  => [
        'first_name' => 'John', 'last_name' => 'Doe',
        'email' => 'john@example.com', 'phone' => '0912345678'
    ],
    'shipping' => [
        'first_name' => 'John', 'last_name' => 'Doe',
        'address_1' => '123 Main St', 'city' => 'Taipei', 'country' => 'TW'
    ],
    'line_items' => [
        ['product_id' => 123, 'quantity' => 2],
        ['product_id' => 456, 'quantity' => 1, 'variation_id' => 457]
    ]
];

$response = wp_remote_post("{$store_url}/wp-json/wc/v3/orders", [
    'timeout' => 15,
    'headers' => array_merge($auth_header, ['Content-Type' => 'application/json']),
    'body'    => wp_json_encode($order_data)
]);

// 更新庫存
$response = wp_remote_request("{$store_url}/wp-json/wc/v3/products/123", [
    'method'  => 'PUT',
    'timeout' => 15,
    'headers' => array_merge($auth_header, ['Content-Type' => 'application/json']),
    'body'    => wp_json_encode(['stock_quantity' => 50, 'manage_stock' => true])
]);
```

## 第三方 API 串接

### 通用請求輔助函式

```php
/**
 * 發送 API 請求並回傳標準化結果
 */
function api_request($method, $endpoint, $data = [], $api_key = '', $timeout = 15) {
    $args = [
        'method'  => strtoupper($method),
        'timeout' => $timeout,
        'headers' => ['Content-Type' => 'application/json']
    ];

    if ($api_key) {
        $args['headers']['Authorization'] = 'Bearer ' . $api_key;
    }

    if (!empty($data) && in_array($args['method'], ['POST', 'PUT', 'PATCH'])) {
        $args['body'] = wp_json_encode($data);
    }

    $response = wp_remote_request($endpoint, $args);

    if (is_wp_error($response)) {
        error_log('[API Error] ' . $endpoint . ' - ' . $response->get_error_message());
        return ['success' => false, 'error' => $response->get_error_message()];
    }

    $code = wp_remote_retrieve_response_code($response);
    $body = json_decode(wp_remote_retrieve_body($response), true);

    if ($code < 200 || $code >= 300) {
        error_log("[API Error] {$endpoint} - HTTP {$code}");
        return ['success' => false, 'error' => "HTTP {$code}", 'body' => $body];
    }

    return ['success' => true, 'data' => $body];
}

// 使用範例
$result = api_request('GET',  'https://api.example.com/products', [], $api_key);
$result = api_request('POST', 'https://api.example.com/orders', $order_data, $api_key);
```

### 帶快取的 GET 請求

```php
function cached_api_get($endpoint, $api_key = '', $expire = 300) {
    $cache_key = 'api_' . md5($endpoint);
    $cached    = get_transient($cache_key);

    if (false !== $cached) {
        return $cached;
    }

    $result = api_request('GET', $endpoint, [], $api_key);

    if ($result['success']) {
        set_transient($cache_key, $result, $expire);
    }

    return $result;
}
```

### OAuth 2.0 認證

```php
function get_oauth_token($token_url, $client_id, $client_secret, $code, $redirect_uri) {
    $response = wp_remote_post($token_url, [
        'timeout' => 15,
        'headers' => ['Content-Type' => 'application/x-www-form-urlencoded'],
        'body'    => http_build_query([
            'grant_type'    => 'authorization_code',
            'client_id'     => $client_id,
            'client_secret' => $client_secret,
            'code'          => $code,
            'redirect_uri'  => $redirect_uri
        ])
    ]);

    if (is_wp_error($response)) {
        return false;
    }

    return json_decode(wp_remote_retrieve_body($response), true);
}
```

### API Key 認證

```php
// Header 認證
$response = wp_remote_get($endpoint, [
    'timeout' => 15,
    'headers' => ['X-API-Key' => 'your_api_key_here']
]);

// Query 參數認證
$response = wp_remote_get(add_query_arg('api_key', $api_key, $endpoint), ['timeout' => 15]);
```

## 錯誤處理與重試

```php
/**
 * 帶指數退避的重試機制（適用於 429 Too Many Requests）
 */
function api_request_with_retry($callback, $max_retries = 3) {
    for ($attempt = 1; $attempt <= $max_retries; $attempt++) {
        $response = call_user_func($callback);

        if (is_wp_error($response)) {
            break;
        }

        $code = wp_remote_retrieve_response_code($response);

        if ($code >= 200 && $code < 300) {
            return ['success' => true, 'data' => json_decode(wp_remote_retrieve_body($response), true)];
        }

        if ($code === 429 && $attempt < $max_retries) {
            // 指數退避：1s, 2s, 4s...
            usleep(pow(2, $attempt - 1) * 1000000);
            continue;
        }

        break;
    }

    return ['success' => false, 'error' => "Failed after {$max_retries} attempts"];
}
```

## Webhook 處理

```php
add_action('rest_api_init', function() {
    register_rest_route('webhook/v1', '/receive', [
        'methods'             => 'POST',
        'callback'            => 'handle_webhook',
        'permission_callback' => '__return_true'
    ]);
});

function handle_webhook(WP_REST_Request $request) {
    // 從設定取得 Secret，不要寫死
    $webhook_secret = get_option('my_webhook_secret', '');
    $signature      = $request->get_header('x-signature');

    if ($webhook_secret) {
        $expected = hash_hmac('sha256', $request->get_body(), $webhook_secret);
        if (!hash_equals($expected, (string) $signature)) {
            return new WP_Error('invalid_signature', 'Invalid signature', ['status' => 401]);
        }
    }

    $payload    = $request->get_json_params();
    $event_type = $request->get_header('x-event-type');

    switch ($event_type) {
        case 'order.created':
            process_new_order($payload);
            break;
        case 'payment.completed':
            process_payment($payload);
            break;
    }

    return rest_ensure_response(['received' => true]);
}
```

## 實用工具

### cURL 測試

```bash
# GET 請求
curl -X GET "https://api.example.com/data" \
  -H "Authorization: Bearer TOKEN"

# POST 請求
curl -X POST "https://api.example.com/data" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"key":"value"}'

# 查看完整 response headers
curl -i -X GET "https://api.example.com/data"
```

### API 文件搜尋

串接新平台時，依序確認：

1. Base URL（如 `https://api.stripe.com`）
2. Authentication 方式（API Key、Bearer Token、OAuth 2.0）
3. Rate Limits（每分鐘/小時限制幾次）
4. Response 格式與錯誤碼定義
5. Webhook 事件類型（若有）

## 最佳實踐

1. **使用 `wp_remote_*`** - 而非原生 curl，尊重 WP 的 HTTP API 層
2. **永遠設定 timeout** - 預設無限等待會讓 PHP 程序掛起
3. **檢查 `is_wp_error()`** - 每次請求都要處理連線失敗情況
4. **快取 GET 結果** - 用 transient 減少重複呼叫
5. **記錄日誌** - 用 `error_log()` 追蹤 API 請求與異常
6. **安全儲存金鑰** - API Key 存於 `wp_options` 或環境變數，不要寫死
7. **環境區分** - 測試環境與正式環境使用不同 Key
8. **使用 `wp_json_encode()`** - 而非 `json_encode()`，確保 UTF-8 正確編碼

## 快速參考

| 函數 | 用途 |
|------|------|
| `wp_remote_get()` | GET 請求 |
| `wp_remote_post()` | POST 請求 |
| `wp_remote_request()` | 任意 HTTP 方法（PUT/PATCH/DELETE）|
| `wp_remote_retrieve_body()` | 取得響應內容 |
| `wp_remote_retrieve_response_code()` | 取得 HTTP 狀態碼 |
| `is_wp_error()` | 檢查連線層錯誤 |
| `wp_json_encode()` | JSON 編碼（WP 版）|
| `add_query_arg()` | 安全附加 Query 參數 |
