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
  }
})
