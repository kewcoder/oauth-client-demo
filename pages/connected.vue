<script setup lang="ts">
const config = useRuntimeConfig()
const apiBase = config.public.hitpayApiBaseUrl

const tokenInfo = ref<any>(null)
const result = ref<any>(null)
const loading = ref<string | null>(null)

const TOKEN_COOKIE = 'hitpay_token'

function getTokenCookie(): Record<string, any> | null {
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${TOKEN_COOKIE}=([^;]*)`))
  if (!match) return null
  try {
    return JSON.parse(decodeURIComponent(match[1]))
  } catch {
    return null
  }
}

function clearTokenCookie() {
  document.cookie = `${TOKEN_COOKIE}=; path=/; max-age=0; SameSite=Lax`
}

const loadTokenInfo = () => {
  const session = getTokenCookie()
  if (!session) return
  tokenInfo.value = {
    connected: true,
    token_type: session.token_type || null,
    scope: session.scope || null,
    expires_in: session.expires_in || null,
    business: session.business || null,
    has_access_token: Boolean(session.access_token),
  }
}

function saveTokenCookie(session: Record<string, any>, updates: Record<string, any>) {
  const updated = { ...session, ...updates }
  document.cookie = `${TOKEN_COOKIE}=${encodeURIComponent(JSON.stringify(updated))}; path=/; max-age=${60 * 60 * 24}; SameSite=Lax`
  return updated
}

async function doRefresh(session: Record<string, any>) {
  const token = await $fetch<Record<string, any>>('/api/oauth/refresh', {
    method: 'POST',
    body: { refresh_token: session.refresh_token },
  })
  return saveTokenCookie(session, token)
}

async function hitpayFetch(path: string) {
  let session = getTokenCookie()
  console.log(session)
  if (!session?.access_token) throw new Error('Not connected')

  try {
    return await $fetch(`${apiBase}${path}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
  } catch (err: any) {
    if (err?.response?.status === 401 && session.refresh_token) {
      session = await doRefresh(session)
      return $fetch(`${apiBase}${path}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
    }
    throw err
  }
}

const callInfo = async () => {
  loading.value = 'info'
  result.value = null
  try {
    result.value = await hitpayFetch('/v1/info')
  } catch (error: any) {
    result.value = error?.data || { message: error?.message || 'Request failed' }
  } finally {
    loading.value = null
  }
}

const callOrders = async () => {
  loading.value = 'orders'
  result.value = null
  try {
    result.value = await hitpayFetch('/v1/orders')
  } catch (error: any) {
    result.value = error?.data || { message: error?.message || 'Request failed' }
  } finally {
    loading.value = null
  }
}

const getProducts = async () => {
  loading.value = 'products'
  result.value = null
  try {
    result.value = await hitpayFetch('/v1/products')
  } catch (error: any) {
    result.value = error?.data || { message: error?.message || 'Request failed' }
  } finally {
    loading.value = null
  }
}

const getCharges = async () => {
  loading.value = 'charges'
  result.value = null
  try {
    result.value = await hitpayFetch('/v1/charges')
  } catch (error: any) {
    result.value = error?.data || { message: error?.message || 'Request failed' }
  } finally {
    loading.value = null
  }
}

const getCustomers = async () => {
  loading.value = 'customers'
  result.value = null
  try {
    result.value = await hitpayFetch('/v1/customers')
  } catch (error: any) {
    result.value = error?.data || { message: error?.message || 'Request failed' }
  } finally {
    loading.value = null
  }
}

const logout = () => {
  clearTokenCookie()
  window.location.href = '/'
}


onMounted(loadTokenInfo)
</script>

<template>
  <div style="font-family: Arial, sans-serif; max-width: 1000px; margin: 40px auto; padding: 24px;">
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <h1>Connected</h1>
      <button style="padding: 8px 14px; border-radius: 8px; border: 1px solid #ddd; cursor: pointer;" @click="logout">
        Disconnect
      </button>
    </div>
    <p>The OAuth flow completed. You can now test authenticated API requests.</p>

    <div style="margin: 20px 0; padding: 20px; border: 1px solid #ddd; border-radius: 12px;">
      <h2>Session</h2>
      <pre>{{ tokenInfo }}</pre>
    </div>

    <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 20px;">
      <button style="padding: 10px 14px; border-radius: 8px; border: 0; cursor: pointer;" @click="callInfo">
        {{ loading === 'info' ? 'Loading...' : 'GET /info' }}
      </button>
      <button style="padding: 10px 14px; border-radius: 8px; border: 0; cursor: pointer;" @click="callOrders">
        {{ loading === 'orders' ? 'Loading...' : 'GET /orders' }}
      </button>
      <button style="padding: 10px 14px; border-radius: 8px; border: 0; cursor: pointer;" @click="getProducts">
        {{ loading === 'products' ? 'Loading...' : 'GET /products' }}
      </button>
      <button style="padding: 10px 14px; border-radius: 8px; border: 0; background: #fee2e2; cursor: pointer;" @click="getCharges" title="Requires read:charges scope (not approved)">
        {{ loading === 'charges' ? 'Loading...' : 'GET /charges ⚠️' }}
      </button>
      <button style="padding: 10px 14px; border-radius: 8px; border: 0; background: #fee2e2; cursor: pointer;" @click="getCustomers" title="Requires read:customers scope (not approved)">
        {{ loading === 'customers' ? 'Loading...' : 'GET /customers ⚠️' }}
      </button>
    </div>

    <div style="padding: 20px; border: 1px solid #ddd; border-radius: 12px;">
      <h2>API Result</h2>
      <pre>{{ result }}</pre>
    </div>
  </div>
</template>
