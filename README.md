# HitPay OAuth Client Demo

A Nuxt 3 demo that shows how a third-party app connects a HitPay merchant account via OAuth 2.0, stores the session in a cookie, and makes authenticated API calls — including a full Payment Requests playground.

## Features

- Enter OAuth app credentials in the browser (no `.env` required for credentials)
- Authorization code flow via `/api/oauth/start` → HitPay → `/api/oauth/callback`
- Session stored in `hitpay_token` cookie after successful auth
- Automatic access token refresh on `401` responses
- Server-side API proxy to avoid CORS issues
- Payment Requests playground: List, Show, Create, Update, Delete
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
- **Payment Requests playground** — tabbed UI for all five endpoints (see below)

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

## Payment Requests Playground

Available on `/connected` after authorizing. Each tab maps to one endpoint:

| Tab    | Method   | Endpoint                        | Required scope     |
|--------|----------|---------------------------------|--------------------|
| List   | GET      | `/v1/payment-requests`          | `payments:read`    |
| Show   | GET      | `/v1/payment-requests/{id}`     | `payments:read`    |
| Create | POST     | `/v1/payment-requests`          | `payments:create`  |
| Update | PUT      | `/v1/payment-requests/{id}`     | `payments:create`  |
| Delete | DELETE   | `/v1/payment-requests/{id}`     | `payments:cancel`  |

Each tab includes an **example payload** button. All requests go through the server proxy at `/api/hitpay/...` so the access token is never exposed to the browser.

### Create payload fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `currency` | string | yes | ISO 4217, e.g. `SGD` |
| `amount` | number | yes | Min `0.30` |
| `purpose` | string | no | Payment description |
| `name` | string | no | Customer name |
| `email` | string | no | Customer email |
| `phone` | string | no | Up to 15 chars |
| `redirect_url` | string | no | URL after payment |
| `webhook` | string | no | Webhook callback URL |
| `allow_repeated_payments` | `"true"` / `"false"` | no | Default `"false"` |
| `send_email` | boolean | no | |
| `send_sms` | boolean | no | |
| `reference_number` | string | no | Max 255 chars |
| `expiry_date` | string | no | Format: `Y-m-d H:i:s` |
| `payment_methods` | string[] | no | Filter accepted methods |
| `metadata` | object | no | Arbitrary key-value pairs |

---

## Scopes

Recommended scopes for the full demo:

```
business:read payments payments:read payments:create payments:cancel payments:refund
```

| Scope | Grants access to |
|---|---|
| `business:read` | `GET /v1/info` |
| `payments` | General payments access |
| `payments:read` | List and show payment requests |
| `payments:create` | Create and update payment requests |
| `payments:cancel` | Delete / cancel payment requests |
| `payments:refund` | Refund payments |

---

## Server API Proxy

All HitPay API calls from the browser go through `server/api/hitpay/[...path].ts`. This keeps the access token server-side and avoids CORS issues.

| Method | Path | Proxies to |
|---|---|---|
| GET | `/api/hitpay/info` | `GET /v1/info` |
| GET | `/api/hitpay/payment-requests` | `GET /v1/payment-requests` |
| GET | `/api/hitpay/payment-requests/:id` | `GET /v1/payment-requests/:id` |
| POST | `/api/hitpay/payment-requests` | `POST /v1/payment-requests` |
| PUT | `/api/hitpay/payment-requests/:id` | `PUT /v1/payment-requests/:id` |
| DELETE | `/api/hitpay/payment-requests/:id` | `DELETE /v1/payment-requests/:id` |

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
