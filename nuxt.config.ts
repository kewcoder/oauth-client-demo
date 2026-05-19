import { readFileSync } from 'node:fs'

const hitpayScopes = process.env.HITPAY_SCOPES || 'read:business read:orders read:products'

export default defineNuxtConfig({
  compatibilityDate: '2024-12-01',
  devtools: { enabled: true },
  devServer: {
    // https: {
    //   key: readFileSync('./certs/localhost-key.pem', 'utf-8'),
    //   cert: readFileSync('./certs/localhost.pem', 'utf-8')
    // },
    port: 3000
  },
  runtimeConfig: {
    hitpayClientId: process.env.HITPAY_CLIENT_ID,
    hitpayClientSecret: process.env.HITPAY_CLIENT_SECRET,
    hitpayAuthorizeUrl: process.env.HITPAY_OAUTH_AUTHORIZE_URL,
    hitpayApiBaseUrl: process.env.HITPAY_API_BASE_URL,
    hitpayRedirectUri: process.env.HITPAY_REDIRECT_URI,
    hitpayScopes,
    public: {
      hitpayScopes,
    },
  }
})
