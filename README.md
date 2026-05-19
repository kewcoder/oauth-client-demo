# Nuxt OAuth Demo App

A Nuxt 3 OAuth client demo that shows how a third-party app connects a HitPay merchant account, stores the OAuth session locally, and calls the HitPay API with an access token.

## Features

- Starts the authorization code flow through `/api/oauth/start`.
- Handles the OAuth callback at `/api/oauth/callback`.
- Exchanges the authorization code for an access token and refresh token.
- Stores a session summary in the `hitpay_token` cookie.
- Tests authenticated API calls from the `/connected` page.
- Automatically refreshes the access token when an API request returns `401`.

## Prerequisites

- A modern Node.js version compatible with Nuxt 3.
- npm.
- OAuth client credentials from HitPay:
  - Client ID
  - Client Secret
  - Redirect URI
- Local HTTPS certificates for development.

## Setup

Install dependencies:

```bash
npm install
```

Copy the environment file:

```bash
cp .env.example .env
```

Fill in the following values in `.env`:

```bash
HITPAY_OAUTH_AUTHORIZE_URL=https://dashboard.src.test/oauth/business/authorize
HITPAY_API_BASE_URL=https://api.src.test
HITPAY_CLIENT_ID=your-client-id
HITPAY_CLIENT_SECRET=your-client-secret
HITPAY_REDIRECT_URI=https://localhost:3000/api/oauth/callback
HITPAY_SCOPES=read:business read:orders read:products
```

Make sure the redirect URI registered with the OAuth provider exactly matches `HITPAY_REDIRECT_URI`.

## Local HTTPS Certificates

This project runs the Nuxt dev server with HTTPS and reads the following files:

- `certs/localhost-key.pem`
- `certs/localhost.pem`

If you use `mkcert`, generate the certificates with:

```bash
mkdir -p certs
mkcert -key-file certs/localhost-key.pem -cert-file certs/localhost.pem localhost
```

The `certs/` folder is ignored by git because it contains local files.

## Running the Demo

Start the dev server:

```bash
npm run dev
```

Open:

```text
https://localhost:3000
```

Click **Connect with HitPay**, complete the authorization flow, and the app will redirect to `/connected`.

## OAuth Flow

1. The user clicks the connect button on the home page.
2. The browser is redirected to `/api/oauth/start`.
3. The server builds an authorize URL with `client_id`, `redirect_uri`, `response_type=code`, `scope`, and `state`.
4. HitPay redirects back to `/api/oauth/callback` with an authorization code.
5. The server exchanges the code for tokens through the token endpoint.
6. The server fetches the business summary from `/v1/info`.
7. The session is stored in the `hitpay_token` cookie.
8. The user is redirected to `/connected` to try API requests.

## Local Endpoints

- `GET /api/oauth/start`  
  Starts the OAuth flow and redirects to the authorization URL.

- `GET /api/oauth/callback`  
  Handles the OAuth callback, exchanges the authorization code for tokens, stores the session, and redirects to `/connected`.

- `POST /api/oauth/refresh`  
  Receives a `refresh_token`, requests a new access token, and returns it to the client.

## Demo Pages

- `/` shows the connect button and the requested scopes.
- `/connected` shows the session summary and buttons to test API calls:
  - `GET /v1/info`
  - `GET /v1/orders`
  - `GET /v1/products`
  - `GET /v1/charges`
  - `GET /v1/customers`

Some buttons may fail if the related scopes are not approved by the OAuth provider. This is useful for demonstrating insufficient-scope errors.

## Development Notes

- The `npm run dev` script sets `NODE_TLS_REJECT_UNAUTHORIZED=0` to make local development with self-signed certificates easier.
- Do not commit the `.env` file or anything inside `certs/`.
- The `hitpay_token` cookie is intentionally readable on the client for demo purposes. For production apps, store tokens in a server-side session or an `httpOnly` cookie.

## Build

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```
