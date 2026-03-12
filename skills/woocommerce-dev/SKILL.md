---
name: woocommerce-dev
description: WooCommerce 電商開發指南。涵蓋產品管理、訂單處理、購物車、結帳流程、Webhook、訂單狀態、自定義結帳欄位等。當開發 WooCommerce 商店、自定義模板或擴展電商功能時使用。
---

# WooCommerce 開發指南

> **注意**：WooCommerce 7.1+ 預設啟用 HPOS（High-Performance Order Storage），訂單改存自訂資料表。請用 `wc_get_order()` 和 `wc_get_orders()` 而非 `WP_Query` 查詢訂單，以確保前後相容。

## Icon 使用規範

> **原則**：新功能或自訂模板一律使用 [Lucide](https://lucide.dev/)，**禁止使用 emoji 代替 icon**。

### 既有專案：先偵測現有 icon 庫

```bash
# 1. 檢查 package.json 已安裝的 icon 庫
cat package.json 2>/dev/null | grep -E "lucide|heroicons|phosphor|react-icons|@fortawesome|feather-icons|@tabler/icons"

# 2. 檢查主題 / 外掛是否已引入 icon 庫
grep -rE "lucide|fontawesome|heroicons|feather" functions.php woocommerce/ templates/ --include="*.php" 2>/dev/null | head -5
```

| 偵測結果 | 做法 |
|---------|------|
| 找到 `lucide-react` / `lucide` | 延續使用 Lucide |
| 找到 `font-awesome` / `heroicons` 等 | 延續使用該庫 |
| 未找到任何 icon 庫 | 使用 Lucide CDN（見下方） |

> **找不到合適 icon 時**：若在既有 icon 庫中無法找到符合情境的圖示，**主動告知開發者**，並推薦 Lucide 中的替代選項，由開發者決定是否採用。

### 安裝 Lucide（新專案預設）

```php
// functions.php
function wc_custom_enqueue_lucide() {
    wp_enqueue_script(
        'lucide',
        'https://unpkg.com/lucide@latest/dist/umd/lucide.min.js',
        [],
        null,
        true
    );
}
add_action('wp_enqueue_scripts', 'wc_custom_enqueue_lucide');
```

```html
<!-- WooCommerce 模板中使用 -->
<i data-lucide="shopping-cart"></i>
<i data-lucide="package"></i>
<i data-lucide="credit-card"></i>
<script>lucide.createIcons();</script>
```

---

## 產品查詢

```php
// 取得產品
$product = wc_get_product($product_id);

// 取得產品屬性
$product->get_name();
$product->get_price();
$product->get_regular_price();
$product->get_sale_price();
$product->get_short_description();
$product->get_description();
$product->get_image_id();
$product->get_stock_status();   // 'instock' | 'outofstock' | 'onbackorder'
$product->get_stock_quantity();
$product->get_sku();
$product->get_type();           // 'simple' | 'variable' | 'grouped'

// 取得產品分類
$product->get_category_ids();

// 取得/設定自訂 meta
$value = $product->get_meta('_custom_field');
$product->update_meta_data('_custom_field', 'value');
$product->save();
```

## 變體產品

```php
$product = wc_get_product($product_id);

if ($product->is_type('variable')) {
    $variations         = $product->get_available_variations();
    $variation_attrs    = $product->get_variation_attributes();

    foreach ($product->get_children() as $variation_id) {
        $variation = wc_get_product($variation_id);
        $variation->get_price();
        $variation->get_stock_quantity();
        $variation->get_attributes(); // ['attribute_pa_color' => 'red']
    }
}
```

## 產品迴圈

```php
$args = [
    'post_type'      => 'product',
    'posts_per_page' => 12,
    'post_status'    => 'publish',
    'tax_query'      => [
        ['taxonomy' => 'product_cat', 'field' => 'slug', 'terms' => 'featured']
    ]
];

$products = new WP_Query($args);

if ($products->have_posts()) :
    while ($products->have_posts()) : $products->the_post();
        global $product;
        ?>
        <h2><?php the_title(); ?></h2>
        <p><?php echo wp_kses_post($product->get_price_html()); ?></p>
        <?php woocommerce_template_loop_add_to_cart(); ?>
        <?php
    endwhile;
    wp_reset_postdata();
endif;
```

## 購物車

```php
// 加入購物車
WC()->cart->add_to_cart($product_id, $quantity, $variation_id, $variation, $cart_item_data);

// 取得購物車內容
$cart_items = WC()->cart->get_cart();

// 購物車金額
WC()->cart->get_cart_total();
WC()->cart->get_cart_subtotal();
WC()->cart->get_tax_amount();
WC()->cart->get_shipping_total();

// 優惠券
WC()->cart->apply_coupon($coupon_code);
WC()->cart->get_coupons();

// 移除品項 / 清空
WC()->cart->remove_cart_item($cart_item_key);
WC()->cart->empty_cart();
```

## 訂單查詢（HPOS 相容）

```php
// ✅ 推薦：使用 wc_get_orders()，HPOS 前後相容
$orders = wc_get_orders([
    'status'     => 'processing',
    'limit'      => 20,
    'customer'   => get_current_user_id(),
    'date_after' => '2024-01-01'
]);

foreach ($orders as $order) {
    echo $order->get_id() . ' - ' . $order->get_status();
}

// 取得單一訂單
$order = wc_get_order($order_id);
```

## 訂單操作

```php
$order = wc_get_order($order_id);

// 基本資訊
$order->get_id();
$order->get_order_number();
$order->get_date_created()->date('Y-m-d H:i:s');
$order->get_status();            // 'pending' | 'processing' | 'completed' ...
$order->get_total();
$order->get_subtotal();
$order->get_tax_total();
$order->get_shipping_total();
$order->get_payment_method();

// 顧客資訊
$order->get_billing_first_name();
$order->get_billing_email();
$order->get_billing_phone();
$order->get_shipping_address_1();
$order->get_shipping_city();

// 訂單項目
foreach ($order->get_items() as $item_id => $item) {
    $product  = $item->get_product();
    $quantity = $item->get_quantity();
    $total    = $item->get_total();
    // 取得訂單項目 meta
    $custom = wc_get_order_item_meta($item_id, '_custom_field', true);
}

// 更新訂單狀態（含備註）
$order->update_status('completed', '訂單已出貨。');

// 自訂 meta
$order->update_meta_data('_sap_order_id', 'SAP-12345');
$order->save();

// 新增訂單備註
$order->add_order_note('已通知倉庫備貨', false); // false = 不通知顧客

// 建立訂單
$order = wc_create_order();
$order->add_product(wc_get_product($product_id), $quantity);
$order->set_address($billing_address, 'billing');
$order->set_address($shipping_address, 'shipping');
$order->calculate_totals();
$order->save();
```

## 結帳欄位

```php
// 添加自定義結帳欄位
add_filter('woocommerce_checkout_fields', function($fields) {
    $fields['billing']['billing_company_tax_id'] = [
        'label'    => '統一編號',
        'required' => false,
        'class'    => ['form-row-wide'],
        'priority' => 25
    ];
    return $fields;
});

// 保存欄位值
add_action('woocommerce_checkout_update_order_meta', function($order_id) {
    if (!empty($_POST['billing_company_tax_id'])) {
        update_post_meta(
            $order_id,
            '_billing_company_tax_id',
            sanitize_text_field($_POST['billing_company_tax_id'])
        );
    }
});

// 顯示在訂單後台
add_action('woocommerce_admin_order_data_after_billing_address', function($order) {
    $tax_id = $order->get_meta('_billing_company_tax_id');
    if ($tax_id) {
        echo '<p><strong>統一編號：</strong> ' . esc_html($tax_id) . '</p>';
    }
});
```

## WooCommerce Hooks

### 產品 Hooks
```php
add_action('woocommerce_before_product_object_save', 'before_product_save', 10, 2);
add_action('woocommerce_single_product_summary', 'custom_product_section', 15);
add_filter('woocommerce_get_price_html', 'custom_price_html', 10, 2);
add_filter('woocommerce_product_title', 'custom_product_title', 10, 2);
```

### 購物車 Hooks
```php
add_action('woocommerce_add_to_cart', 'on_add_to_cart', 10, 6);
add_action('woocommerce_cart_contents', 'custom_cart_content');
add_filter('woocommerce_cart_item_remove_link', 'custom_remove_link', 10, 2);
```

### 結帳 Hooks
```php
add_filter('woocommerce_checkout_fields', 'modify_checkout_fields');
add_action('woocommerce_before_checkout_form', 'before_checkout_form');
add_action('woocommerce_checkout_order_created', 'after_order_created');
add_action('woocommerce_after_checkout_validation', 'validate_checkout', 10, 2);
```

### 訂單 Hooks
```php
add_action('woocommerce_checkout_order_created', 'new_order_created');
add_action('woocommerce_order_status_changed', 'order_status_changed', 10, 4);

// 範例：訂單變更為 completed 時觸發
function order_status_changed($order_id, $old_status, $new_status, $order) {
    if ($new_status === 'completed') {
        // 通知外部系統（如 SAP）
    }
}
```

### 郵件 Hooks
```php
add_filter('woocommerce_email_order_items', 'custom_email_items', 10, 2);
add_action('woocommerce_email_before_order_table', 'email_before_table', 10, 3);
```

## WooCommerce REST API

```php
$consumer_key    = 'ck_xxxxxxxxxxxx';
$consumer_secret = 'cs_xxxxxxxxxxxx';
$store_url       = 'https://example.com';

// 注意：字串插值需使用雙引號
$auth = 'Basic ' . base64_encode("{$consumer_key}:{$consumer_secret}");

// 取得處理中的訂單
$response = wp_remote_get("{$store_url}/wp-json/wc/v3/orders?status=processing", [
    'timeout' => 15,
    'headers' => ['Authorization' => $auth]
]);
$orders = json_decode(wp_remote_retrieve_body($response));

// 更新訂單狀態
$response = wp_remote_request("{$store_url}/wp-json/wc/v3/orders/123", [
    'method'  => 'PUT',
    'timeout' => 15,
    'headers' => ['Authorization' => $auth, 'Content-Type' => 'application/json'],
    'body'    => wp_json_encode(['status' => 'completed'])
]);
```

## Webhooks

```php
// 透過程式建立 WooCommerce Webhook
function register_my_webhook() {
    if (wc_get_webhook_count() > 0) return; // 避免重複建立

    $webhook = new WC_Webhook();
    $webhook->set_name('Order Created - My System');
    $webhook->set_topic('order.created');
    $webhook->set_delivery_url('https://my-system.com/webhook');
    $webhook->set_secret(wp_generate_password(32, false));
    $webhook->set_status('active');
    $webhook->save();
}
add_action('woocommerce_init', 'register_my_webhook');
```

## 常用條件判斷

```php
is_product();          // 單一產品頁
is_shop();             // 商店主頁
is_product_category(); // 分類頁
is_cart();             // 購物車頁
is_checkout();         // 結帳頁
is_account_page();     // 我的帳戶頁

$product->is_on_sale();       // 是否特價中
$product->is_purchasable();   // 是否可購買
$product->is_in_stock();      // 是否有庫存
$product->is_type('variable'); // 是否為變體產品
```

## 最佳實踐

1. **使用 `wc_get_orders()`** - 查詢訂單，HPOS 前後相容
2. **使用 `WC_Product` 類別** - 而非直接存取 post meta
3. **使用 `wc_price()`** - 格式化金額顯示
4. **避免直接查資料庫** - 優先使用 WooCommerce 提供的函數
5. **宣告 HPOS 相容性** - 在外掛中加入 `FeaturesUtil::declare_compatibility('custom_order_tables', __FILE__)`

## 快速參考

| 類型 | 函數 |
|------|------|
| 取得產品 | `wc_get_product($id)` |
| 取得訂單 | `wc_get_order($id)` |
| 查詢訂單 | `wc_get_orders([...])` ← HPOS 相容 |
| 格式化價格 | `wc_price($amount)` |
| 購物車 | `WC()->cart` |
| 取得設定 | `get_option('woocommerce_...')` |
| 訂單狀態列表 | `wc_get_order_statuses()` |
