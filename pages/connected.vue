<script setup lang="ts">
// ── Session ──────────────────────────────────────────────────────────────────
const tokenInfo = ref<any>(null)
const infoResult = ref<any>(null)
const infoLoading = ref(false)

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

async function callInfo() {
  infoLoading.value = true
  infoResult.value = null
  try {
    infoResult.value = await $fetch('/api/hitpay/info')
  } catch (error: any) {
    infoResult.value = error?.data || { message: error?.message || 'Request failed' }
  } finally {
    infoLoading.value = false
    loadTokenInfo()
  }
}

const logout = () => {
  clearTokenCookie()
  window.location.href = '/'
}

onMounted(loadTokenInfo)

// ── Payment Requests ──────────────────────────────────────────────────────────
type Tab = 'list' | 'show' | 'create' | 'update' | 'delete'

const activeTab = ref<Tab>('list')
const prResult = ref<any>(null)
const prLoading = ref(false)
const prErrorMsg = ref<string | null>(null)

const listPerPage = ref('10')
const listCurrentPage = ref('1')
const listSearch = ref('')

const resourceId = ref('')

const CREATE_EXAMPLE = JSON.stringify({
  currency: 'SGD',
  amount: 10.00,
  purpose: 'Demo Payment',
  name: 'John Doe',
  email: 'john@example.com',
  redirect_url: 'https://example.com/success',
  webhook: 'https://example.com/webhook',
  allow_repeated_payments: 'false',
  send_email: true,
  send_sms: false,
  reference_number: 'REF-001',
}, null, 2)

const UPDATE_EXAMPLE = JSON.stringify({
  currency: 'SGD',
  amount: 25.00,
  purpose: 'Updated Payment',
  name: 'Jane Doe',
  email: 'jane@example.com',
  reference_number: 'REF-002',
}, null, 2)

const createBody = ref(CREATE_EXAMPLE)
const updateBody = ref(UPDATE_EXAMPLE)
const jsonError = ref<string | null>(null)

function validateJson(val: string): boolean {
  try {
    JSON.parse(val)
    jsonError.value = null
    return true
  } catch (e: any) {
    jsonError.value = `Invalid JSON: ${e.message}`
    return false
  }
}

const TABS: { id: Tab; label: string; method: string; scope: string }[] = [
  { id: 'list',   label: 'List',   method: 'GET',    scope: 'payments:read' },
  { id: 'show',   label: 'Show',   method: 'GET',    scope: 'payments:read' },
  { id: 'create', label: 'Create', method: 'POST',   scope: 'payments:create' },
  { id: 'update', label: 'Update', method: 'PUT',    scope: 'payments:create' },
  { id: 'delete', label: 'Delete', method: 'DELETE', scope: 'payments:cancel' },
]

const METHOD_COLORS: Record<string, string> = {
  GET: '#3b82f6',
  POST: '#22c55e',
  PUT: '#f59e0b',
  DELETE: '#ef4444',
}

async function sendPr() {
  prLoading.value = true
  prResult.value = null
  prErrorMsg.value = null

  try {
    if (activeTab.value === 'list') {
      const params = new URLSearchParams()
      if (listPerPage.value) params.set('per_page', listPerPage.value)
      if (listCurrentPage.value) params.set('current_page', listCurrentPage.value)
      if (listSearch.value) params.set('search', listSearch.value)
      prResult.value = await $fetch(`/api/hitpay/payment-requests?${params}`)

    } else if (activeTab.value === 'show') {
      prResult.value = await $fetch(`/api/hitpay/payment-requests/${resourceId.value}`)

    } else if (activeTab.value === 'create') {
      if (!validateJson(createBody.value)) { prLoading.value = false; return }
      prResult.value = await $fetch('/api/hitpay/payment-requests', {
        method: 'POST',
        body: JSON.parse(createBody.value),
      })

    } else if (activeTab.value === 'update') {
      if (!validateJson(updateBody.value)) { prLoading.value = false; return }
      prResult.value = await $fetch(`/api/hitpay/payment-requests/${resourceId.value}`, {
        method: 'PUT',
        body: JSON.parse(updateBody.value),
      })

    } else if (activeTab.value === 'delete') {
      prResult.value = await $fetch(`/api/hitpay/payment-requests/${resourceId.value}`, {
        method: 'DELETE',
      })
    }
  } catch (e: any) {
    prErrorMsg.value = e?.statusMessage || e?.message || 'Request failed'
    prResult.value = e?.data ?? null
  } finally {
    prLoading.value = false
  }
}

function setTab(tab: Tab) {
  activeTab.value = tab
  prResult.value = null
  prErrorMsg.value = null
  jsonError.value = null
}

const canSend = computed(() => {
  if (prLoading.value) return false
  if (['show', 'update', 'delete'].includes(activeTab.value) && !resourceId.value.trim()) return false
  return true
})
</script>

<template>
  <div style="font-family: Arial, sans-serif; max-width: 1000px; margin: 40px auto; padding: 24px;">

    <!-- Header -->
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <h1>Connected</h1>
      <button style="padding: 8px 14px; border-radius: 8px; border: 1px solid #ddd; cursor: pointer;" @click="logout">
        Disconnect
      </button>
    </div>
    <p>The OAuth flow completed. You can now test authenticated API requests.</p>

    <!-- Session -->
    <div style="margin: 20px 0; padding: 20px; border: 1px solid #ddd; border-radius: 12px;">
      <h2 style="margin-top: 0;">Session</h2>
      <pre style="margin: 0;">{{ tokenInfo }}</pre>
    </div>

    <!-- GET /info -->
    <div style="margin-bottom: 32px;">
      <button style="padding: 10px 14px; border-radius: 8px; border: 0; cursor: pointer; background: #f3f4f6;" @click="callInfo">
        {{ infoLoading ? 'Loading...' : 'GET /info' }}
      </button>
      <div v-if="infoResult" style="margin-top: 12px; padding: 16px; border: 1px solid #ddd; border-radius: 12px;">
        <pre style="margin: 0; font-size: 13px;">{{ JSON.stringify(infoResult, null, 2) }}</pre>
      </div>
    </div>

    <!-- Payment Requests -->
    <h2 style="margin-bottom: 16px;">Payment Requests</h2>

    <!-- Tab Bar -->
    <div style="display: flex; gap: 8px; border-bottom: 2px solid #e5e7eb; margin-bottom: 24px;">
      <button
        v-for="tab in TABS"
        :key="tab.id"
        @click="setTab(tab.id)"
        :style="{
          padding: '8px 16px',
          border: 'none',
          borderRadius: '8px 8px 0 0',
          cursor: 'pointer',
          fontWeight: activeTab === tab.id ? '700' : '400',
          background: activeTab === tab.id ? '#fff' : 'transparent',
          borderBottom: activeTab === tab.id ? '2px solid #111' : '2px solid transparent',
          marginBottom: '-2px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }"
      >
        <span
          :style="{
            fontSize: '11px',
            fontWeight: '700',
            color: '#fff',
            background: METHOD_COLORS[tab.method] || '#888',
            borderRadius: '4px',
            padding: '2px 5px',
          }"
        >{{ tab.method }}</span>
        {{ tab.label }}
      </button>
    </div>

    <!-- Panel -->
    <div style="border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; margin-bottom: 24px;">

      <!-- Scope badge -->
      <div style="margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 13px; color: #666;">Required scope:</span>
        <code style="background: #f3f4f6; padding: 2px 8px; border-radius: 4px; font-size: 13px;">
          {{ TABS.find(t => t.id === activeTab)?.scope }}
        </code>
      </div>

      <!-- LIST -->
      <template v-if="activeTab === 'list'">
        <p style="margin-top: 0; color: #555;">
          <strong>GET</strong> <code>/v1/payment-requests</code> — paginated list of payment requests.
        </p>
        <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 16px;">
          <label style="display: flex; flex-direction: column; gap: 4px; font-size: 13px;">
            per_page
            <input v-model="listPerPage" type="number" min="1" max="100" style="padding: 6px 10px; border: 1px solid #ddd; border-radius: 6px; width: 80px;" />
          </label>
          <label style="display: flex; flex-direction: column; gap: 4px; font-size: 13px;">
            current_page
            <input v-model="listCurrentPage" type="number" min="1" style="padding: 6px 10px; border: 1px solid #ddd; border-radius: 6px; width: 80px;" />
          </label>
          <label style="display: flex; flex-direction: column; gap: 4px; font-size: 13px; flex: 1;">
            search
            <input v-model="listSearch" type="text" placeholder="Search..." style="padding: 6px 10px; border: 1px solid #ddd; border-radius: 6px;" />
          </label>
        </div>
      </template>

      <!-- SHOW -->
      <template v-else-if="activeTab === 'show'">
        <p style="margin-top: 0; color: #555;">
          <strong>GET</strong> <code>/v1/payment-requests/{id}</code> — retrieve a single payment request.
        </p>
        <label style="display: flex; flex-direction: column; gap: 4px; font-size: 13px; margin-bottom: 16px;">
          Payment Request ID <span style="color: #ef4444;">*</span>
          <input v-model="resourceId" type="text" placeholder="e.g. 019dfbb3-e763-735f-a6c6-1c9f006c6ec6" style="padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; font-family: monospace;" />
        </label>
      </template>

      <!-- CREATE -->
      <template v-else-if="activeTab === 'create'">
        <p style="margin-top: 0; color: #555;">
          <strong>POST</strong> <code>/v1/payment-requests</code> — create a new payment request.
        </p>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 13px; color: #666;">Request Body (JSON)</span>
          <button @click="createBody = CREATE_EXAMPLE; jsonError = null" style="font-size: 12px; padding: 4px 10px; border: 1px solid #ddd; border-radius: 6px; cursor: pointer; background: #f9fafb;">
            Use Example
          </button>
        </div>
        <textarea
          v-model="createBody"
          @input="jsonError = null"
          rows="16"
          style="width: 100%; box-sizing: border-box; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-family: monospace; font-size: 13px; resize: vertical; background: #fafafa;"
        />
        <p v-if="jsonError" style="color: #ef4444; font-size: 13px; margin-top: 4px;">{{ jsonError }}</p>
      </template>

      <!-- UPDATE -->
      <template v-else-if="activeTab === 'update'">
        <p style="margin-top: 0; color: #555;">
          <strong>PUT</strong> <code>/v1/payment-requests/{id}</code> — update an existing payment request.
        </p>
        <label style="display: flex; flex-direction: column; gap: 4px; font-size: 13px; margin-bottom: 16px;">
          Payment Request ID <span style="color: #ef4444;">*</span>
          <input v-model="resourceId" type="text" placeholder="e.g. 019dfbb3-e763-735f-a6c6-1c9f006c6ec6" style="padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; font-family: monospace;" />
        </label>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 13px; color: #666;">Request Body (JSON)</span>
          <button @click="updateBody = UPDATE_EXAMPLE; jsonError = null" style="font-size: 12px; padding: 4px 10px; border: 1px solid #ddd; border-radius: 6px; cursor: pointer; background: #f9fafb;">
            Use Example
          </button>
        </div>
        <textarea
          v-model="updateBody"
          @input="jsonError = null"
          rows="12"
          style="width: 100%; box-sizing: border-box; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-family: monospace; font-size: 13px; resize: vertical; background: #fafafa;"
        />
        <p v-if="jsonError" style="color: #ef4444; font-size: 13px; margin-top: 4px;">{{ jsonError }}</p>
      </template>

      <!-- DELETE -->
      <template v-else-if="activeTab === 'delete'">
        <p style="margin-top: 0; color: #555;">
          <strong>DELETE</strong> <code>/v1/payment-requests/{id}</code> — cancel a payment request.
        </p>
        <label style="display: flex; flex-direction: column; gap: 4px; font-size: 13px; margin-bottom: 16px;">
          Payment Request ID <span style="color: #ef4444;">*</span>
          <input v-model="resourceId" type="text" placeholder="e.g. 019dfbb3-e763-735f-a6c6-1c9f006c6ec6" style="padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; font-family: monospace;" />
        </label>
        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; font-size: 13px; color: #991b1b;">
          This will permanently cancel the payment request. Completed requests cannot be deleted.
        </div>
      </template>

      <!-- Send Button -->
      <button
        @click="sendPr"
        :disabled="!canSend"
        :style="{
          marginTop: '20px',
          padding: '10px 24px',
          borderRadius: '8px',
          border: 'none',
          cursor: canSend ? 'pointer' : 'not-allowed',
          fontWeight: '600',
          fontSize: '14px',
          background: canSend ? '#111' : '#d1d5db',
          color: canSend ? '#fff' : '#9ca3af',
        }"
      >
        {{ prLoading ? 'Loading…' : 'Send Request' }}
      </button>
    </div>

    <!-- Response -->
    <div style="border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; margin-bottom: 40px;">
      <h2 style="margin-top: 0;">Response</h2>
      <div v-if="prErrorMsg" style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; margin-bottom: 12px; font-size: 13px; color: #991b1b;">
        {{ prErrorMsg }}
      </div>
      <pre style="background: #f9fafb; padding: 16px; border-radius: 8px; overflow: auto; font-size: 13px; margin: 0;">{{ prResult !== null ? JSON.stringify(prResult, null, 2) : '— no response yet —' }}</pre>
    </div>

  </div>
</template>
