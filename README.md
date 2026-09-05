# HitPay OAuth Client Demo

A Nuxt 3 demo that shows how a third-party app connects a HitPay merchant account via OAuth 2.0, stores the session in a cookie, and makes authenticated API calls — payments, commerce, customers, and store links.

## Features

- Enter OAuth app credentials in the browser (no `.env` required for credentials)
- Authorization code flow via `/api/oauth/start` → HitPay → `/api/oauth/callback`
- Session stored in `hitpay_token` cookie after successful auth
- Automatic access token refresh on `401` responses
- Server-side API proxy to avoid CORS issues
- API playground on `/connected`: Payments, Commerce, and Customers (same `/v1` paths as the public API)
- Local HTTPS dev server with optional `mkcert` certificates

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy the example file:

```bash
cp .env.example .env
```

The only required values are the two server URLs:

```env
HITPAY_OAUTH_AUTHORIZE_URL=https://dashboard.hit-pay.com/oauth/authorize
HITPAY_API_BASE_URL=https://api.hit-pay.com
```

> Credentials (Client ID, Client Secret, Redirect URI, Scopes) are entered directly in the browser on the home page and saved to a `hitpay_config` cookie — you do **not** need to put them in `.env`.

### 3. Local HTTPS (optional)

The dev server runs on HTTPS when cert files are present at `certs/`. If the files are missing the server falls back to HTTP automatically.

Generate certs with [`mkcert`](https://github.com/FiloSottile/mkcert):

```bash
mkdir -p certs
mkcert -key-file certs/localhost-key.pem -cert-file certs/localhost.pem localhost
```

> `certs/` is git-ignored. Never commit certificate files.

### 4. Start dev server

```bash
npm run dev
```

Open **https://localhost:3000** (or http if no certs).

---

## Usage

### Connecting

1. Open the home page.
2. Fill in the form:
   - **Client ID** — from your HitPay OAuth app
   - **Client Secret** — from your HitPay OAuth app
   - **Redirect URI** — must match exactly what is registered in HitPay (e.g. `https://localhost:3000/api/oauth/callback`)
   - **Scopes** — space-separated list (see [Scopes](#scopes) below)
3. Click **Connect with HitPay**.
4. Complete authorization on HitPay — you'll be redirected back to `/connected`.

The form values are saved to the `hitpay_config` cookie so they persist across page reloads.

### Connected page

After a successful OAuth flow, `/connected` shows:

- **Session** — token type, granted scopes, business info
- **GET /info** — quick test of the authenticated connection
- **API playground** — Payments, Commerce, and Customers (see below)

---

## OAuth Flow

```
Browser                  This App                    HitPay
   |                        |                           |
   |-- fill form, click --> |                           |
   |                        |-- redirect to authorize ->|
   |                        |                           |-- user approves
   |                        |<-- callback with code ----|
   |                        |-- POST /open/oauth/token ---->|
   |                        |<-- access + refresh token-|
   |                        |-- GET /v1/info ---------->|
   |                        |<-- business summary ------|
   |<-- redirect /connected |                           |
```

1. User fills in credentials on `/` and clicks Connect.
2. Credentials are saved to `hitpay_config` cookie; browser goes to `/api/oauth/start`.
3. Server reads credentials from cookie, builds the authorization URL, and redirects.
4. HitPay redirects back to `/api/oauth/callback` with `?code=...`.
5. Server exchanges the code for tokens using the stored credentials.
6. Server fetches the business summary from `GET /v1/info`.
7. Session is written to `hitpay_token` cookie; user lands on `/connected`.

---

## API playground

Available on `/connected` after authorizing. Tabs come from `config/api-demos/`. Bodies and responses match the public `/v1` API (same as API key). Requests go through `/api/hitpay/...` so the access token stays on the server.

Foreign resource IDs return **403** on OAuth. Missing IDs return **404**. API-key callers keep their live error shapes (invoice **422**, recurring/subscription **401**).

### Pagination

List endpoints accept **`per_page`**. Many commerce lists also accept legacy **`perPage`** (if both are sent, `perPage` wins):

| Resource | `per_page` | `perPage` |
|---|---|---|
| Products, locations, coupons, discounts, pickups, taxes, add-ons, store-pages, product categories | yes | yes |
| Recurring billing | yes | yes (original key) |
| Orders, payment requests, subscription plans, invoices, customers, charges | yes | no |

Defaults vary (products 10, pickups 20, locations 500, categories 20). Clamped lists are typically 1–100.

### Payments

| Resource | Method | Endpoint | Scope |
|---|---|---|---|
| Payment requests | GET POST PUT DELETE | `/v1/payment-requests`, `/v1/payment-requests/{id}` | `payments:read` / `create` / `cancel` |
| Charges | GET | `/v1/charges`, `/v1/charges/{id}` | `payments:read` |
| Refunds | POST GET | `/v1/refund`, `/v1/refund/{id}` | `payments:refund` / `read` |
| Recurring billing | GET POST PUT DELETE + pause/resume | `/v1/recurring-billing` | `payments:read` / `create` / `cancel` |
| Recurring billing settings | GET POST PUT DELETE | `/v1/recurring-billing-settings` | `payments:read` / `create` / `cancel` |
| Subscription plans | GET POST PUT DELETE | `/v1/subscription-plan` | `payments:read` / `create` / `cancel` |

Payment request create fields: `currency`, `amount` (min `0.30`), `purpose`, `name`, `email`, `phone`, `redirect_url`, `webhook`, `allow_repeated_payments`, `send_email`, `send_sms`, `reference_number`, `expiry_date`, `payment_methods`, `metadata`. `executor_id` is not set for OAuth or API key.

### Commerce

| Resource | Method | Endpoint | Scope | Notes |
|---|---|---|---|---|
| Products | GET POST PATCH DELETE | `/v1/products` | `commerce:read` / `create` / `update` / `delete` | |
| Product categories | GET | `/v1/product-category` | `commerce:read` | |
| Add-ons | GET | `/v1/add-ons` | `commerce:read` | `?product_id=` of another business → 404 |
| Invoice settings | GET | `/v1/invoice-settings` | `commerce:read` | |
| Orders | GET POST PATCH DELETE | `/v1/orders` | `commerce:read` / `create` / `update` / `delete` | Delete draft only. OAuth `POST` with `channel=store_checkout` → **403** (storefront, not OAuth) |
| Invoices | GET POST PUT DELETE | `/v1/invoices` | `commerce:read` / `create` / `update` / `delete` | Delete pending only |
| Store settings | GET | `/v1/store-settings` | `commerce:read` | `{ store_settings }` — shop_state, tax, order form, favicon. `access_code` hidden |
| Store links | GET PUT | `/v1/store-links` | `commerce:read` / `update` | Navigation, footer columns, social, link-in-bio. PUT merges into published theme `data` (and draft if present) |
| Store pages | GET | `/v1/store-pages`, `/v1/store-pages/{id}` | `commerce:read` | Custom pages **without** store-design `content`. Query `keywords`, `status` (`published`/`draft`), `per_page` or `perPage` |
| Locations | GET | `/v1/locations` | `commerce:read` | Write stays API-key-only. Query `per_page` or `perPage` |
| Coupons | GET | `/v1/coupons` | `commerce:read` | Query `keywords`, `per_page` |
| Discounts | GET | `/v1/discounts` | `commerce:read` | Query `keywords`, `per_page`, `pos_discount` |
| Shipping | GET | `/v1/shipping` | `commerce:read` | |
| Pickups | GET | `/v1/pickups` | `commerce:read` | List only includes pickups that have a location |
| Taxes | GET | `/v1/taxes` | `commerce:read` | |

#### Store links PUT

Send at least one of `navigation_menus`, `footer_link_1`, `footer_link_2`, `social_menus`, `link_in_bio`. Menu items: `id?`, `title`, `link`, `type`.

| Field | Allowed `type` | `link` format |
|---|---|---|
| `navigation_menus` | `page`, `category`, plus social types | `page`/`category`: path starting with `/` |
| `footer_link_1`, `footer_link_2` | footer types | `{ enabled, title, menus[] }` — menus use footer item types |
| `social_menus`, `link_in_bio.*_links` | `facebook`, `instagram`, `twitter`, `tiktok`, `linkedin`, `email`, `phone`, `whatsapp`, `telegram`, `link` | Matching host / `mailto:` / `tel:` / `https://wa.me/` |

`link_in_bio`: `{ enabled, icon_links, button_links }`. Other theme keys (banners, layout) are not replaced. Invalid theme JSON is not persisted (422).

#### Store pages GET

Read-only. Public responses **omit** store-design `content`. No create/update/delete on this public route.

| Query | Notes |
|---|---|
| `keywords` | Filter `title` |
| `status` | `published` (`enabled=1`) or `draft` (`enabled=0`) |
| `per_page` | Clamped 1–100, default 10 |

Show response:

```json
{
  "id": "uuid",
  "business_id": "uuid",
  "title": "About us",
  "description": "…",
  "enabled": 1,
  "page_path": "about-us",
  "page_cover_id": null,
  "page_cover_url": null,
  "created_at": "…",
  "updated_at": "…"
}
```

List wraps the same objects in `{ data, links, meta }`. Foreign page IDs return **403**.

### Customers

Requires `customer:*` (not granted by `commerce`).

| Method | Endpoint | Scope |
|---|---|---|
| GET | `/v1/customers`, `/v1/customers/{id}` | `customer:read` |
| POST | `/v1/customers` | `customer:create` |
| PATCH | `/v1/customers/{id}` | `customer:update` |
| DELETE | `/v1/customers/{id}` | `customer:delete` |

---

## Scopes

Recommended scopes for the full demo:

```
business:read payments commerce customer
```

Umbrella scopes (`payments`, `commerce`, `customer`) do **not** pass `oauth.any-scope:payments:read` etc. Request the granular scopes (or approve them on the merchant) for each tab.

| Scope | Grants access to |
|---|---|
| `business:read` | `GET /v1/info` |
| `payments:read` | Charges, payment requests, refunds, recurring, subscription plans |
| `payments:create` | Create/update payment requests, recurring, plans |
| `payments:cancel` | Cancel payment requests, recurring, plans, settings |
| `payments:refund` | Create refunds |
| `commerce:read` | Products, categories, add-ons, orders, invoices, store settings/links/pages, coupons, discounts, shipping, pickups, taxes, locations |
| `commerce:create` | Create products, orders, invoices |
| `commerce:update` | Update products, orders, invoices, store links |
| `commerce:delete` | Delete products, orders, invoices |
| `customer:read` / `create` / `update` / `delete` | Customer directory |

---

## Server API Proxy

All HitPay API calls from the browser go through `server/api/hitpay/[...path].ts`. This keeps the access token server-side and avoids CORS issues.

Allow-listed resources in `server/api/hitpay/[...path].ts` include `info`, payment/charge/refund/recurring/subscription, products, product-category, add-ons, invoice-settings, orders, invoices, store-settings, store-links, store-pages, customers, locations, coupons, discounts, shipping, pickups, and taxes.

---

## Cookies

| Cookie | Contents | httpOnly |
|---|---|---|
| `hitpay_config` | OAuth app credentials (client ID, secret, redirect URI, scopes) | No |
| `hitpay_token` | OAuth session (access token, refresh token, business summary) | No |

> Both cookies are readable by JavaScript for demo purposes. In a production app, store tokens in `httpOnly` server-side sessions.

---

## Deployment

No cert files are needed in production — the HTTPS config is skipped automatically when `NODE_ENV=production` or when cert files are absent.

Only the two server URL env vars are required:

```env
HITPAY_OAUTH_AUTHORIZE_URL=https://dashboard.hit-pay.com/oauth/authorize
HITPAY_API_BASE_URL=https://api.hit-pay.com
```

Build for production:

```bash
npm run build
npm run preview
```
