import { readFileSync, existsSync } from 'node:fs'

const isDev = process.env.NODE_ENV !== 'production'
const hasCerts = isDev && existsSync('./certs/localhost-key.pem') && existsSync('./certs/localhost.pem')

export default defineNuxtConfig({
  compatibilityDate: '2024-12-01',
  devtools: { enabled: true },
  devServer: {
    https: hasCerts ? {
      key: readFileSync('./certs/localhost-key.pem', 'utf-8'),
      cert: readFileSync('./certs/localhost.pem', 'utf-8')
    } : undefined,
    port: 3000
  },
  runtimeConfig: {
    hitpayAuthorizeUrl: process.env.HITPAY_OAUTH_AUTHORIZE_URL,
    hitpayApiBaseUrl: process.env.HITPAY_API_BASE_URL,
    // Optional env-var fallbacks — overridden by the hitpay_config cookie set on the index page
    hitpayClientId:     process.env.HITPAY_CLIENT_ID     || '',
    hitpayClientSecret: process.env.HITPAY_CLIENT_SECRET || '',
    hitpayRedirectUri:  process.env.HITPAY_REDIRECT_URI  || '',
    hitpayScopes:       process.env.HITPAY_SCOPES        || '',
  }
})
