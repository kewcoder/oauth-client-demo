<script setup lang="ts">
// ── Session ──────────────────────────────────────────────────────────────────
const tokenInfo = ref<any>(null)
const tokenData = ref<{ access_token: string; refresh_token: string | null } | null>(null)
const infoResult = ref<any>(null)
const infoLoading = ref(false)
const copied = ref<string | null>(null)
const tokensVisible = ref(false)

const TOKEN_COOKIE = 'hitpay_token'

function getTokenCookie(): Record<string, any> | null {
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${TOKEN_COOKIE}=([^;]*)`))
  if (!match) return null
  try { return JSON.parse(decodeURIComponent(match[1])) } catch { return null }
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
  }
  tokenData.value = {
    access_token: session.access_token || '',
    refresh_token: session.refresh_token || null,
  }
}

async function copyToClipboard(text: string, key: string) {
  try {
    await navigator.clipboard.writeText(text)
    copied.value = key
    setTimeout(() => { copied.value = null }, 2000)
  } catch {}
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
  currency: 'SGD', amount: 10.00, purpose: 'Demo Payment',
  name: 'John Doe', email: 'john@example.com',
  redirect_url: 'https://example.com/success',
  webhook: 'https://example.com/webhook',
  allow_repeated_payments: 'false',
  send_email: true, send_sms: false, reference_number: 'REF-001',
}, null, 2)

const UPDATE_EXAMPLE = JSON.stringify({
  currency: 'SGD', amount: 25.00, purpose: 'Updated Payment',
  name: 'Jane Doe', email: 'jane@example.com', reference_number: 'REF-002',
}, null, 2)

const createBody = ref(CREATE_EXAMPLE)
const updateBody = ref(UPDATE_EXAMPLE)
const jsonError = ref<string | null>(null)

function validateJson(val: string): boolean {
  try { JSON.parse(val); jsonError.value = null; return true }
  catch (e: any) { jsonError.value = `Invalid JSON: ${e.message}`; return false }
}

const TABS = [
  { id: 'list'   as Tab, label: 'List',   method: 'GET',    scope: 'payments:read',   color: '#3b82f6' },
  { id: 'show'   as Tab, label: 'Show',   method: 'GET',    scope: 'payments:read',   color: '#3b82f6' },
  { id: 'create' as Tab, label: 'Create', method: 'POST',   scope: 'payments:create', color: '#22c55e' },
  { id: 'update' as Tab, label: 'Update', method: 'PUT',    scope: 'payments:create', color: '#f59e0b' },
  { id: 'delete' as Tab, label: 'Delete', method: 'DELETE', scope: 'payments:cancel', color: '#ef4444' },
]

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
      prResult.value = await $fetch('/api/hitpay/payment-requests', { method: 'POST', body: JSON.parse(createBody.value) })
    } else if (activeTab.value === 'update') {
      if (!validateJson(updateBody.value)) { prLoading.value = false; return }
      prResult.value = await $fetch(`/api/hitpay/payment-requests/${resourceId.value}`, { method: 'PUT', body: JSON.parse(updateBody.value) })
    } else if (activeTab.value === 'delete') {
      prResult.value = await $fetch(`/api/hitpay/payment-requests/${resourceId.value}`, { method: 'DELETE' })
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

const activeTabInfo = computed(() => TABS.find(t => t.id === activeTab.value)!)

// ── Charges ───────────────────────────────────────────────────────────────────
type ChargesTab = 'list' | 'show'
const chargesTab = ref<ChargesTab>('list')
const chargesResult = ref<any>(null)
const chargesLoading = ref(false)
const chargesErrorMsg = ref<string | null>(null)
const chargesId = ref('')
const chargesPerPage = ref('10')
const chargesCurrentPage = ref('1')

const CHARGES_TABS = [
  { id: 'list' as ChargesTab, label: 'List', method: 'GET', scope: 'payments:read', color: '#3b82f6' },
  { id: 'show' as ChargesTab, label: 'Show', method: 'GET', scope: 'payments:read', color: '#3b82f6' },
]

function setChargesTab(tab: ChargesTab) {
  chargesTab.value = tab
  chargesResult.value = null
  chargesErrorMsg.value = null
}

const canSendCharges = computed(() =>
  !chargesLoading.value && !(chargesTab.value === 'show' && !chargesId.value.trim())
)

async function sendCharges() {
  chargesLoading.value = true
  chargesResult.value = null
  chargesErrorMsg.value = null
  try {
    if (chargesTab.value === 'list') {
      const params = new URLSearchParams()
      if (chargesPerPage.value) params.set('per_page', chargesPerPage.value)
      if (chargesCurrentPage.value) params.set('current_page', chargesCurrentPage.value)
      chargesResult.value = await $fetch(`/api/hitpay/charges?${params}`)
    } else {
      chargesResult.value = await $fetch(`/api/hitpay/charges/${chargesId.value}`)
    }
  } catch (e: any) {
    chargesErrorMsg.value = e?.statusMessage || e?.message || 'Request failed'
    chargesResult.value = e?.data ?? null
  } finally {
    chargesLoading.value = false
  }
}

// ── Refunds ───────────────────────────────────────────────────────────────────
type RefundsTab = 'show' | 'create'
const refundsTab = ref<RefundsTab>('create')
const refundsResult = ref<any>(null)
const refundsLoading = ref(false)
const refundsErrorMsg = ref<string | null>(null)
const refundId = ref('')
const refundJsonError = ref<string | null>(null)

const REFUND_EXAMPLE = JSON.stringify({
  payment_id: 'charge-uuid-here',
  amount: 10.00,
  send_email: true,
  email: 'customer@example.com',
  webhook: 'https://example.com/webhook',
}, null, 2)

const refundBody = ref(REFUND_EXAMPLE)

const REFUNDS_TABS = [
  { id: 'create' as RefundsTab, label: 'Create', method: 'POST', scope: 'payments:refund', color: '#22c55e' },
  { id: 'show'   as RefundsTab, label: 'Show',   method: 'GET',  scope: 'payments:read',   color: '#3b82f6' },
]

function setRefundsTab(tab: RefundsTab) {
  refundsTab.value = tab
  refundsResult.value = null
  refundsErrorMsg.value = null
  refundJsonError.value = null
}

const canSendRefunds = computed(() => {
  if (refundsLoading.value) return false
  if (refundsTab.value === 'show' && !refundId.value.trim()) return false
  return true
})

async function sendRefunds() {
  refundsLoading.value = true
  refundsResult.value = null
  refundsErrorMsg.value = null
  try {
    if (refundsTab.value === 'show') {
      refundsResult.value = await $fetch(`/api/hitpay/refund/${refundId.value}`)
    } else {
      try { JSON.parse(refundBody.value) } catch (e: any) {
        refundJsonError.value = `Invalid JSON: ${e.message}`
        refundsLoading.value = false
        return
      }
      refundJsonError.value = null
      refundsResult.value = await $fetch('/api/hitpay/refund', {
        method: 'POST',
        body: JSON.parse(refundBody.value),
      })
    }
  } catch (e: any) {
    refundsErrorMsg.value = e?.statusMessage || e?.message || 'Request failed'
    refundsResult.value = e?.data ?? null
  } finally {
    refundsLoading.value = false
  }
}

// ── Recurring Billing ─────────────────────────────────────────────────────────
type RbTab = 'list' | 'show' | 'create' | 'update' | 'delete' | 'pause' | 'resume'

const rbTab = ref<RbTab>('list')
const rbResult = ref<any>(null)
const rbLoading = ref(false)
const rbErrorMsg = ref<string | null>(null)
const rbId = ref('')
const rbPerPage = ref('10')
const rbCurrentPage = ref('1')
const rbStatus = ref('')
const rbCustomerEmail = ref('')
const rbReference = ref('')
const rbJsonError = ref<string | null>(null)

const RB_CREATE_EXAMPLE = JSON.stringify({
  customer_email: 'customer@example.com',
  customer_name: 'John Doe',
  start_date: new Date().toISOString().slice(0, 10),
  redirect_url: 'https://example.com/success',
  webhook: 'https://example.com/webhook',
  save_card: 'true',
  amount: 20,
  name: 'Monthly Subscription',
  currency: 'SGD',
  payment_methods: ['card'],
}, null, 2)

const RB_UPDATE_EXAMPLE = JSON.stringify({
  customer_name: 'Jane Doe',
  amount: 25,
  name: 'Updated Subscription',
}, null, 2)

const rbCreateBody = ref(RB_CREATE_EXAMPLE)
const rbUpdateBody = ref(RB_UPDATE_EXAMPLE)

const RB_TABS = [
  { id: 'list'   as RbTab, label: 'List',   method: 'GET',    scope: 'payments:read',   color: '#3b82f6' },
  { id: 'show'   as RbTab, label: 'Show',   method: 'GET',    scope: 'payments:read',   color: '#3b82f6' },
  { id: 'create' as RbTab, label: 'Create', method: 'POST',   scope: 'payments:create', color: '#22c55e' },
  { id: 'update' as RbTab, label: 'Update', method: 'PUT',    scope: 'payments:create', color: '#f59e0b' },
  { id: 'delete' as RbTab, label: 'Delete', method: 'DELETE', scope: 'payments:cancel', color: '#ef4444' },
  { id: 'pause'  as RbTab, label: 'Pause',  method: 'POST',   scope: 'payments:cancel', color: '#ef4444' },
  { id: 'resume' as RbTab, label: 'Resume', method: 'POST',   scope: 'payments:create', color: '#22c55e' },
]

function setRbTab(tab: RbTab) {
  rbTab.value = tab
  rbResult.value = null
  rbErrorMsg.value = null
  rbJsonError.value = null
}

const activeRbTabInfo = computed(() => RB_TABS.find(t => t.id === rbTab.value)!)

const canSendRb = computed(() => {
  if (rbLoading.value) return false
  if (['show', 'update', 'delete', 'pause', 'resume'].includes(rbTab.value) && !rbId.value.trim()) return false
  return true
})

async function sendRb() {
  rbLoading.value = true
  rbResult.value = null
  rbErrorMsg.value = null
  try {
    if (rbTab.value === 'list') {
      const params = new URLSearchParams()
      if (rbPerPage.value) params.set('perPage', rbPerPage.value)
      if (rbCurrentPage.value) params.set('current_page', rbCurrentPage.value)
      if (rbStatus.value) params.set('status', rbStatus.value)
      if (rbCustomerEmail.value) params.set('customer_email', rbCustomerEmail.value)
      if (rbReference.value) params.set('reference', rbReference.value)
      rbResult.value = await $fetch(`/api/hitpay/recurring-billing?${params}`)
    } else if (rbTab.value === 'show') {
      rbResult.value = await $fetch(`/api/hitpay/recurring-billing/${rbId.value}`)
    } else if (rbTab.value === 'create') {
      if (!validateJson(rbCreateBody.value)) { rbJsonError.value = jsonError.value; rbLoading.value = false; return }
      rbJsonError.value = null
      rbResult.value = await $fetch('/api/hitpay/recurring-billing', { method: 'POST', body: JSON.parse(rbCreateBody.value) })
    } else if (rbTab.value === 'update') {
      if (!validateJson(rbUpdateBody.value)) { rbJsonError.value = jsonError.value; rbLoading.value = false; return }
      rbJsonError.value = null
      rbResult.value = await $fetch(`/api/hitpay/recurring-billing/${rbId.value}`, { method: 'PUT', body: JSON.parse(rbUpdateBody.value) })
    } else if (rbTab.value === 'delete') {
      rbResult.value = await $fetch(`/api/hitpay/recurring-billing/${rbId.value}`, { method: 'DELETE' })
    } else if (rbTab.value === 'pause') {
      rbResult.value = await $fetch(`/api/hitpay/recurring-billing/${rbId.value}/pause`, { method: 'POST' })
    } else if (rbTab.value === 'resume') {
      rbResult.value = await $fetch(`/api/hitpay/recurring-billing/${rbId.value}/resume`, { method: 'POST' })
    }
  } catch (e: any) {
    rbErrorMsg.value = e?.statusMessage || e?.message || 'Request failed'
    rbResult.value = e?.data ?? null
  } finally {
    rbLoading.value = false
  }
}

// ── Recurring Billing Settings ────────────────────────────────────────────────
type RbSettingsTab = 'show' | 'create' | 'update' | 'delete'

const rbSettingsTab = ref<RbSettingsTab>('show')
const rbSettingsResult = ref<any>(null)
const rbSettingsLoading = ref(false)
const rbSettingsErrorMsg = ref<string | null>(null)
const rbSettingsJsonError = ref<string | null>(null)

const RB_SETTINGS_EXAMPLE = JSON.stringify({
  renewal_reminders: true,
  status_after_retrying: 'canceled',
}, null, 2)

const rbSettingsBody = ref(RB_SETTINGS_EXAMPLE)

const RB_SETTINGS_TABS = [
  { id: 'show'   as RbSettingsTab, label: 'Show',   method: 'GET',    scope: 'payments:read',   color: '#3b82f6' },
  { id: 'create' as RbSettingsTab, label: 'Create', method: 'POST',   scope: 'payments:create', color: '#22c55e' },
  { id: 'update' as RbSettingsTab, label: 'Update', method: 'PUT',    scope: 'payments:create', color: '#f59e0b' },
  { id: 'delete' as RbSettingsTab, label: 'Delete', method: 'DELETE', scope: 'payments:cancel', color: '#ef4444' },
]

function setRbSettingsTab(tab: RbSettingsTab) {
  rbSettingsTab.value = tab
  rbSettingsResult.value = null
  rbSettingsErrorMsg.value = null
  rbSettingsJsonError.value = null
}

const activeRbSettingsTabInfo = computed(() => RB_SETTINGS_TABS.find(t => t.id === rbSettingsTab.value)!)

const canSendRbSettings = computed(() => !rbSettingsLoading.value)

async function sendRbSettings() {
  rbSettingsLoading.value = true
  rbSettingsResult.value = null
  rbSettingsErrorMsg.value = null
  try {
    if (rbSettingsTab.value === 'show') {
      rbSettingsResult.value = await $fetch('/api/hitpay/recurring-billing-settings')
    } else if (rbSettingsTab.value === 'create') {
      try { JSON.parse(rbSettingsBody.value) } catch (e: any) {
        rbSettingsJsonError.value = `Invalid JSON: ${e.message}`
        rbSettingsLoading.value = false
        return
      }
      rbSettingsJsonError.value = null
      rbSettingsResult.value = await $fetch('/api/hitpay/recurring-billing-settings', { method: 'POST', body: JSON.parse(rbSettingsBody.value) })
    } else if (rbSettingsTab.value === 'update') {
      try { JSON.parse(rbSettingsBody.value) } catch (e: any) {
        rbSettingsJsonError.value = `Invalid JSON: ${e.message}`
        rbSettingsLoading.value = false
        return
      }
      rbSettingsJsonError.value = null
      rbSettingsResult.value = await $fetch('/api/hitpay/recurring-billing-settings', { method: 'PUT', body: JSON.parse(rbSettingsBody.value) })
    } else if (rbSettingsTab.value === 'delete') {
      rbSettingsResult.value = await $fetch('/api/hitpay/recurring-billing-settings', { method: 'DELETE' })
    }
  } catch (e: any) {
    rbSettingsErrorMsg.value = e?.statusMessage || e?.message || 'Request failed'
    rbSettingsResult.value = e?.data ?? null
  } finally {
    rbSettingsLoading.value = false
  }
}

// ── Subscription Plans ────────────────────────────────────────────────────────
type SpTab = 'list' | 'show' | 'create' | 'update' | 'delete'

const spTab = ref<SpTab>('list')
const spResult = ref<any>(null)
const spLoading = ref(false)
const spErrorMsg = ref<string | null>(null)
const spId = ref('')
const spPerPage = ref('10')
const spCurrentPage = ref('1')
const spJsonError = ref<string | null>(null)

const SP_CREATE_EXAMPLE = JSON.stringify({
  name: 'Monthly Plan',
  amount: 12,
  cycle: 'monthly',
  currency: 'SGD',
}, null, 2)

const SP_UPDATE_EXAMPLE = JSON.stringify({
  name: 'Updated Plan',
  amount: 15,
}, null, 2)

const spCreateBody = ref(SP_CREATE_EXAMPLE)
const spUpdateBody = ref(SP_UPDATE_EXAMPLE)

const SP_TABS = [
  { id: 'list'   as SpTab, label: 'List',   method: 'GET',    scope: 'payments:read',   color: '#3b82f6' },
  { id: 'show'   as SpTab, label: 'Show',   method: 'GET',    scope: 'payments:read',   color: '#3b82f6' },
  { id: 'create' as SpTab, label: 'Create', method: 'POST',   scope: 'payments:create', color: '#22c55e' },
  { id: 'update' as SpTab, label: 'Update', method: 'PUT',    scope: 'payments:create', color: '#f59e0b' },
  { id: 'delete' as SpTab, label: 'Delete', method: 'DELETE', scope: 'payments:cancel', color: '#ef4444' },
]

function setSpTab(tab: SpTab) {
  spTab.value = tab
  spResult.value = null
  spErrorMsg.value = null
  spJsonError.value = null
}

const activeSpTabInfo = computed(() => SP_TABS.find(t => t.id === spTab.value)!)

const canSendSp = computed(() => {
  if (spLoading.value) return false
  if (['show', 'update', 'delete'].includes(spTab.value) && !spId.value.trim()) return false
  return true
})

async function sendSp() {
  spLoading.value = true
  spResult.value = null
  spErrorMsg.value = null
  try {
    if (spTab.value === 'list') {
      const params = new URLSearchParams()
      if (spPerPage.value) params.set('perPage', spPerPage.value)
      if (spCurrentPage.value) params.set('current_page', spCurrentPage.value)
      spResult.value = await $fetch(`/api/hitpay/subscription-plan?${params}`)
    } else if (spTab.value === 'show') {
      spResult.value = await $fetch(`/api/hitpay/subscription-plan/${spId.value}`)
    } else if (spTab.value === 'create') {
      try { JSON.parse(spCreateBody.value) } catch (e: any) {
        spJsonError.value = `Invalid JSON: ${e.message}`
        spLoading.value = false
        return
      }
      spJsonError.value = null
      spResult.value = await $fetch('/api/hitpay/subscription-plan', { method: 'POST', body: JSON.parse(spCreateBody.value) })
    } else if (spTab.value === 'update') {
      try { JSON.parse(spUpdateBody.value) } catch (e: any) {
        spJsonError.value = `Invalid JSON: ${e.message}`
        spLoading.value = false
        return
      }
      spJsonError.value = null
      spResult.value = await $fetch(`/api/hitpay/subscription-plan/${spId.value}`, { method: 'PUT', body: JSON.parse(spUpdateBody.value) })
    } else if (spTab.value === 'delete') {
      spResult.value = await $fetch(`/api/hitpay/subscription-plan/${spId.value}`, { method: 'DELETE' })
    }
  } catch (e: any) {
    spErrorMsg.value = e?.statusMessage || e?.message || 'Request failed'
    spResult.value = e?.data ?? null
  } finally {
    spLoading.value = false
  }
}
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

    <!-- Tokens (collapsible) -->
    <div v-if="tokenData" style="margin-bottom: 24px; border: 1px solid #ddd; border-radius: 12px; overflow: hidden;">
      <button
        @click="tokensVisible = !tokensVisible"
        style="width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; background: none; border: none; cursor: pointer; font-size: 15px; font-weight: 600; font-family: inherit;"
      >
        <span>Tokens</span>
        <span style="font-size: 12px; color: #888;">{{ tokensVisible ? '▲ Hide' : '▼ Show' }}</span>
      </button>

      <div v-if="tokensVisible" style="padding: 0 20px 20px; border-top: 1px solid #f0f0f0;">
        <p style="font-size: 13px; color: #666; margin-bottom: 16px;">
          Use the access token as <code>Authorization: Bearer &lt;token&gt;</code> in Postman or any HTTP client.
        </p>

        <div v-for="row in [
          { label: 'Access Token',         key: 'access',  value: tokenData.access_token },
          { label: 'Authorization Header', key: 'bearer',  value: 'Bearer ' + tokenData.access_token },
          ...(tokenData.refresh_token ? [{ label: 'Refresh Token', key: 'refresh', value: tokenData.refresh_token }] : []),
        ]" :key="row.key" style="margin-bottom: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
            <span style="font-size: 13px; font-weight: 600;">{{ row.label }}</span>
            <button
              @click="copyToClipboard(row.value, row.key)"
              :style="`font-size: 12px; padding: 4px 12px; border: 1px solid #ddd; border-radius: 6px; cursor: pointer; background: ${copied === row.key ? '#dcfce7' : '#f9fafb'}; color: ${copied === row.key ? '#166534' : '#374151'};`"
            >{{ copied === row.key ? 'Copied!' : 'Copy' }}</button>
          </div>
          <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 14px; font-family: monospace; font-size: 12px; word-break: break-all; color: #374151;">
            {{ row.value }}
          </div>
        </div>
      </div>
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
    <div style="display: flex; flex-direction: row; flex-wrap: nowrap; gap: 4px; border-bottom: 2px solid #e5e7eb; margin-bottom: 0; overflow-x: auto;">
      <button
        v-for="tab in TABS"
        :key="tab.id"
        @click="setTab(tab.id)"
        :style="`
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 14px; border: none; border-radius: 8px 8px 0 0;
          cursor: pointer; white-space: nowrap; font-family: inherit; font-size: 14px;
          font-weight: ${activeTab === tab.id ? '700' : '400'};
          background: ${activeTab === tab.id ? '#fff' : 'transparent'};
          border-bottom: ${activeTab === tab.id ? '2px solid #111' : '2px solid transparent'};
          margin-bottom: -2px;
        `"
      >
        <span :style="`font-size: 11px; font-weight: 700; color: #fff; background: ${tab.color}; border-radius: 4px; padding: 2px 5px;`">
          {{ tab.method }}
        </span>
        {{ tab.label }}
      </button>
    </div>

    <!-- Panel -->
    <div style="border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; padding: 24px; margin-bottom: 24px;">

      <!-- Scope badge -->
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
        <span style="font-size: 13px; color: #666;">Required scope:</span>
        <code style="background: #f3f4f6; padding: 2px 8px; border-radius: 4px; font-size: 13px;">{{ activeTabInfo.scope }}</code>
      </div>

      <!-- LIST -->
      <template v-if="activeTab === 'list'">
        <p style="margin-top: 0; color: #555;"><strong>GET</strong> <code>/v1/payment-requests</code> — paginated list of payment requests.</p>
        <div style="display: flex; flex-direction: row; gap: 12px; flex-wrap: wrap; margin-bottom: 16px;">
          <label style="display: flex; flex-direction: column; gap: 4px; font-size: 13px;">
            per_page
            <input v-model="listPerPage" type="number" min="1" max="100" style="padding: 6px 10px; border: 1px solid #ddd; border-radius: 6px; width: 80px;" />
          </label>
          <label style="display: flex; flex-direction: column; gap: 4px; font-size: 13px;">
            current_page
            <input v-model="listCurrentPage" type="number" min="1" style="padding: 6px 10px; border: 1px solid #ddd; border-radius: 6px; width: 80px;" />
          </label>
          <label style="display: flex; flex-direction: column; gap: 4px; font-size: 13px; flex: 1; min-width: 160px;">
            search
            <input v-model="listSearch" type="text" placeholder="Search..." style="padding: 6px 10px; border: 1px solid #ddd; border-radius: 6px;" />
          </label>
        </div>
      </template>

      <!-- SHOW -->
      <template v-else-if="activeTab === 'show'">
        <p style="margin-top: 0; color: #555;"><strong>GET</strong> <code>/v1/payment-requests/{id}</code> — retrieve a single payment request.</p>
        <label style="display: flex; flex-direction: column; gap: 4px; font-size: 13px; margin-bottom: 16px;">
          Payment Request ID <span style="color: #ef4444;">*</span>
          <input v-model="resourceId" type="text" placeholder="e.g. 019dfbb3-e763-735f-a6c6-1c9f006c6ec6" style="padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; font-family: monospace;" />
        </label>
      </template>

      <!-- CREATE -->
      <template v-else-if="activeTab === 'create'">
        <p style="margin-top: 0; color: #555;"><strong>POST</strong> <code>/v1/payment-requests</code> — create a new payment request.</p>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 13px; color: #666;">Request Body (JSON)</span>
          <button @click="createBody = CREATE_EXAMPLE; jsonError = null" style="font-size: 12px; padding: 4px 10px; border: 1px solid #ddd; border-radius: 6px; cursor: pointer; background: #f9fafb;">Use Example</button>
        </div>
        <textarea v-model="createBody" @input="jsonError = null" rows="16"
          style="width: 100%; box-sizing: border-box; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-family: monospace; font-size: 13px; resize: vertical; background: #fafafa;" />
        <p v-if="jsonError" style="color: #ef4444; font-size: 13px; margin-top: 4px;">{{ jsonError }}</p>
      </template>

      <!-- UPDATE -->
      <template v-else-if="activeTab === 'update'">
        <p style="margin-top: 0; color: #555;"><strong>PUT</strong> <code>/v1/payment-requests/{id}</code> — update an existing payment request.</p>
        <label style="display: flex; flex-direction: column; gap: 4px; font-size: 13px; margin-bottom: 16px;">
          Payment Request ID <span style="color: #ef4444;">*</span>
          <input v-model="resourceId" type="text" placeholder="e.g. 019dfbb3-e763-735f-a6c6-1c9f006c6ec6" style="padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; font-family: monospace;" />
        </label>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 13px; color: #666;">Request Body (JSON)</span>
          <button @click="updateBody = UPDATE_EXAMPLE; jsonError = null" style="font-size: 12px; padding: 4px 10px; border: 1px solid #ddd; border-radius: 6px; cursor: pointer; background: #f9fafb;">Use Example</button>
        </div>
        <textarea v-model="updateBody" @input="jsonError = null" rows="12"
          style="width: 100%; box-sizing: border-box; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-family: monospace; font-size: 13px; resize: vertical; background: #fafafa;" />
        <p v-if="jsonError" style="color: #ef4444; font-size: 13px; margin-top: 4px;">{{ jsonError }}</p>
      </template>

      <!-- DELETE -->
      <template v-else-if="activeTab === 'delete'">
        <p style="margin-top: 0; color: #555;"><strong>DELETE</strong> <code>/v1/payment-requests/{id}</code> — cancel a payment request.</p>
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
        :style="`margin-top: 20px; padding: 10px 24px; border-radius: 8px; border: none; font-weight: 600; font-size: 14px; font-family: inherit; cursor: ${canSend ? 'pointer' : 'not-allowed'}; background: ${canSend ? '#111' : '#d1d5db'}; color: ${canSend ? '#fff' : '#9ca3af'};`"
      >
        {{ prLoading ? 'Loading…' : 'Send Request' }}
      </button>
    </div>

    <!-- PR Response -->
    <div style="border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; margin-bottom: 40px;">
      <h2 style="margin-top: 0;">Response</h2>
      <div v-if="prErrorMsg" style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; margin-bottom: 12px; font-size: 13px; color: #991b1b;">
        {{ prErrorMsg }}
      </div>
      <pre style="background: #f9fafb; padding: 16px; border-radius: 8px; overflow: auto; font-size: 13px; margin: 0;">{{ prResult !== null ? JSON.stringify(prResult, null, 2) : '— no response yet —' }}</pre>
    </div>

    <!-- ── Charges ─────────────────────────────────────────────────────────── -->
    <h2 style="margin-bottom: 16px;">Charges</h2>

    <div style="display: flex; flex-direction: row; flex-wrap: nowrap; gap: 4px; border-bottom: 2px solid #e5e7eb; margin-bottom: 0; overflow-x: auto;">
      <button
        v-for="tab in CHARGES_TABS"
        :key="tab.id"
        @click="setChargesTab(tab.id)"
        :style="`
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 14px; border: none; border-radius: 8px 8px 0 0;
          cursor: pointer; white-space: nowrap; font-family: inherit; font-size: 14px;
          font-weight: ${chargesTab === tab.id ? '700' : '400'};
          background: ${chargesTab === tab.id ? '#fff' : 'transparent'};
          border-bottom: ${chargesTab === tab.id ? '2px solid #111' : '2px solid transparent'};
          margin-bottom: -2px;
        `"
      >
        <span :style="`font-size: 11px; font-weight: 700; color: #fff; background: ${tab.color}; border-radius: 4px; padding: 2px 5px;`">{{ tab.method }}</span>
        {{ tab.label }}
      </button>
    </div>

    <div style="border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; padding: 24px; margin-bottom: 24px;">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
        <span style="font-size: 13px; color: #666;">Required scope:</span>
        <code style="background: #f3f4f6; padding: 2px 8px; border-radius: 4px; font-size: 13px;">payments:read</code>
      </div>

      <template v-if="chargesTab === 'list'">
        <p style="margin-top: 0; color: #555;"><strong>GET</strong> <code>/v1/charges</code> — list charges.</p>
        <div style="display: flex; flex-direction: row; gap: 12px; flex-wrap: wrap; margin-bottom: 16px;">
          <label style="display: flex; flex-direction: column; gap: 4px; font-size: 13px;">
            per_page
            <input v-model="chargesPerPage" type="number" min="1" max="100" style="padding: 6px 10px; border: 1px solid #ddd; border-radius: 6px; width: 80px;" />
          </label>
          <label style="display: flex; flex-direction: column; gap: 4px; font-size: 13px;">
            current_page
            <input v-model="chargesCurrentPage" type="number" min="1" style="padding: 6px 10px; border: 1px solid #ddd; border-radius: 6px; width: 80px;" />
          </label>
        </div>
      </template>

      <template v-else>
        <p style="margin-top: 0; color: #555;"><strong>GET</strong> <code>/v1/charges/{id}</code> — retrieve a single charge.</p>
        <label style="display: flex; flex-direction: column; gap: 4px; font-size: 13px; margin-bottom: 16px;">
          Charge ID <span style="color: #ef4444;">*</span>
          <input v-model="chargesId" type="text" placeholder="e.g. 019dfbb3-e763-735f-a6c6-1c9f006c6ec6" style="padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; font-family: monospace;" />
        </label>
      </template>

      <button
        @click="sendCharges"
        :disabled="!canSendCharges"
        :style="`margin-top: 20px; padding: 10px 24px; border-radius: 8px; border: none; font-weight: 600; font-size: 14px; font-family: inherit; cursor: ${canSendCharges ? 'pointer' : 'not-allowed'}; background: ${canSendCharges ? '#111' : '#d1d5db'}; color: ${canSendCharges ? '#fff' : '#9ca3af'};`"
      >{{ chargesLoading ? 'Loading…' : 'Send Request' }}</button>
    </div>

    <div style="border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; margin-bottom: 40px;">
      <h2 style="margin-top: 0;">Response</h2>
      <div v-if="chargesErrorMsg" style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; margin-bottom: 12px; font-size: 13px; color: #991b1b;">{{ chargesErrorMsg }}</div>
      <pre style="background: #f9fafb; padding: 16px; border-radius: 8px; overflow: auto; font-size: 13px; margin: 0;">{{ chargesResult !== null ? JSON.stringify(chargesResult, null, 2) : '— no response yet —' }}</pre>
    </div>

    <!-- ── Refunds ─────────────────────────────────────────────────────────── -->
    <h2 style="margin-bottom: 16px;">Refunds</h2>

    <div style="display: flex; flex-direction: row; flex-wrap: nowrap; gap: 4px; border-bottom: 2px solid #e5e7eb; margin-bottom: 0; overflow-x: auto;">
      <button
        v-for="tab in REFUNDS_TABS"
        :key="tab.id"
        @click="setRefundsTab(tab.id)"
        :style="`
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 14px; border: none; border-radius: 8px 8px 0 0;
          cursor: pointer; white-space: nowrap; font-family: inherit; font-size: 14px;
          font-weight: ${refundsTab === tab.id ? '700' : '400'};
          background: ${refundsTab === tab.id ? '#fff' : 'transparent'};
          border-bottom: ${refundsTab === tab.id ? '2px solid #111' : '2px solid transparent'};
          margin-bottom: -2px;
        `"
      >
        <span :style="`font-size: 11px; font-weight: 700; color: #fff; background: ${tab.color}; border-radius: 4px; padding: 2px 5px;`">{{ tab.method }}</span>
        {{ tab.label }}
      </button>
    </div>

    <div style="border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; padding: 24px; margin-bottom: 24px;">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
        <span style="font-size: 13px; color: #666;">Required scope:</span>
        <code style="background: #f3f4f6; padding: 2px 8px; border-radius: 4px; font-size: 13px;">{{ refundsTab === 'create' ? 'payments:refund' : 'payments:read' }}</code>
      </div>

      <template v-if="refundsTab === 'create'">
        <p style="margin-top: 0; color: #555;"><strong>POST</strong> <code>/v1/refund</code> — create a refund for a charge.</p>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 13px; color: #666;">Request Body (JSON)</span>
          <button @click="refundBody = REFUND_EXAMPLE; refundJsonError = null" style="font-size: 12px; padding: 4px 10px; border: 1px solid #ddd; border-radius: 6px; cursor: pointer; background: #f9fafb;">Use Example</button>
        </div>
        <textarea v-model="refundBody" @input="refundJsonError = null" rows="10"
          style="width: 100%; box-sizing: border-box; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-family: monospace; font-size: 13px; resize: vertical; background: #fafafa;" />
        <p v-if="refundJsonError" style="color: #ef4444; font-size: 13px; margin-top: 4px;">{{ refundJsonError }}</p>
      </template>

      <template v-else>
        <p style="margin-top: 0; color: #555;"><strong>GET</strong> <code>/v1/refund/{id}</code> — retrieve a refund.</p>
        <label style="display: flex; flex-direction: column; gap: 4px; font-size: 13px; margin-bottom: 16px;">
          Refund ID <span style="color: #ef4444;">*</span>
          <input v-model="refundId" type="text" placeholder="e.g. 019dfbb3-e763-735f-a6c6-1c9f006c6ec6" style="padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; font-family: monospace;" />
        </label>
      </template>

      <button
        @click="sendRefunds"
        :disabled="!canSendRefunds"
        :style="`margin-top: 20px; padding: 10px 24px; border-radius: 8px; border: none; font-weight: 600; font-size: 14px; font-family: inherit; cursor: ${canSendRefunds ? 'pointer' : 'not-allowed'}; background: ${canSendRefunds ? '#111' : '#d1d5db'}; color: ${canSendRefunds ? '#fff' : '#9ca3af'};`"
      >{{ refundsLoading ? 'Loading…' : 'Send Request' }}</button>
    </div>

    <div style="border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; margin-bottom: 40px;">
      <h2 style="margin-top: 0;">Response</h2>
      <div v-if="refundsErrorMsg" style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; margin-bottom: 12px; font-size: 13px; color: #991b1b;">{{ refundsErrorMsg }}</div>
      <pre style="background: #f9fafb; padding: 16px; border-radius: 8px; overflow: auto; font-size: 13px; margin: 0;">{{ refundsResult !== null ? JSON.stringify(refundsResult, null, 2) : '— no response yet —' }}</pre>
    </div>

    <!-- ── Recurring Billing ─────────────────────────────────────────────────── -->
    <h2 style="margin-bottom: 16px;">Recurring Billing</h2>

    <div style="display: flex; flex-direction: row; flex-wrap: nowrap; gap: 4px; border-bottom: 2px solid #e5e7eb; margin-bottom: 0; overflow-x: auto;">
      <button
        v-for="tab in RB_TABS"
        :key="tab.id"
        @click="setRbTab(tab.id)"
        :style="`
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 14px; border: none; border-radius: 8px 8px 0 0;
          cursor: pointer; white-space: nowrap; font-family: inherit; font-size: 14px;
          font-weight: ${rbTab === tab.id ? '700' : '400'};
          background: ${rbTab === tab.id ? '#fff' : 'transparent'};
          border-bottom: ${rbTab === tab.id ? '2px solid #111' : '2px solid transparent'};
          margin-bottom: -2px;
        `"
      >
        <span :style="`font-size: 11px; font-weight: 700; color: #fff; background: ${tab.color}; border-radius: 4px; padding: 2px 5px;`">{{ tab.method }}</span>
        {{ tab.label }}
      </button>
    </div>

    <div style="border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; padding: 24px; margin-bottom: 24px;">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
        <span style="font-size: 13px; color: #666;">Required scope:</span>
        <code style="background: #f3f4f6; padding: 2px 8px; border-radius: 4px; font-size: 13px;">{{ activeRbTabInfo.scope }}</code>
      </div>

      <template v-if="rbTab === 'list'">
        <p style="margin-top: 0; color: #555;"><strong>GET</strong> <code>/v1/recurring-billing</code> — list recurring billing plans.</p>
        <div style="display: flex; flex-direction: row; gap: 12px; flex-wrap: wrap; margin-bottom: 16px;">
          <label style="display: flex; flex-direction: column; gap: 4px; font-size: 13px;">
            perPage
            <input v-model="rbPerPage" type="number" min="1" max="100" style="padding: 6px 10px; border: 1px solid #ddd; border-radius: 6px; width: 80px;" />
          </label>
          <label style="display: flex; flex-direction: column; gap: 4px; font-size: 13px;">
            current_page
            <input v-model="rbCurrentPage" type="number" min="1" style="padding: 6px 10px; border: 1px solid #ddd; border-radius: 6px; width: 80px;" />
          </label>
          <label style="display: flex; flex-direction: column; gap: 4px; font-size: 13px;">
            status
            <input v-model="rbStatus" type="text" placeholder="e.g. active" style="padding: 6px 10px; border: 1px solid #ddd; border-radius: 6px; width: 120px;" />
          </label>
          <label style="display: flex; flex-direction: column; gap: 4px; font-size: 13px; flex: 1; min-width: 160px;">
            customer_email
            <input v-model="rbCustomerEmail" type="text" placeholder="customer@example.com" style="padding: 6px 10px; border: 1px solid #ddd; border-radius: 6px;" />
          </label>
          <label style="display: flex; flex-direction: column; gap: 4px; font-size: 13px; flex: 1; min-width: 120px;">
            reference
            <input v-model="rbReference" type="text" placeholder="REF-001" style="padding: 6px 10px; border: 1px solid #ddd; border-radius: 6px;" />
          </label>
        </div>
      </template>

      <template v-else-if="rbTab === 'show'">
        <p style="margin-top: 0; color: #555;"><strong>GET</strong> <code>/v1/recurring-billing/{id}</code> — retrieve a recurring billing plan.</p>
        <label style="display: flex; flex-direction: column; gap: 4px; font-size: 13px; margin-bottom: 16px;">
          Recurring Billing ID <span style="color: #ef4444;">*</span>
          <input v-model="rbId" type="text" placeholder="e.g. 019dfbb3-e763-735f-a6c6-1c9f006c6ec6" style="padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; font-family: monospace;" />
        </label>
      </template>

      <template v-else-if="rbTab === 'create'">
        <p style="margin-top: 0; color: #555;"><strong>POST</strong> <code>/v1/recurring-billing</code> — create a recurring billing plan.</p>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 13px; color: #666;">Request Body (JSON)</span>
          <button @click="rbCreateBody = RB_CREATE_EXAMPLE; rbJsonError = null" style="font-size: 12px; padding: 4px 10px; border: 1px solid #ddd; border-radius: 6px; cursor: pointer; background: #f9fafb;">Use Example</button>
        </div>
        <textarea v-model="rbCreateBody" @input="rbJsonError = null" rows="16"
          style="width: 100%; box-sizing: border-box; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-family: monospace; font-size: 13px; resize: vertical; background: #fafafa;" />
        <p v-if="rbJsonError" style="color: #ef4444; font-size: 13px; margin-top: 4px;">{{ rbJsonError }}</p>
      </template>

      <template v-else-if="rbTab === 'update'">
        <p style="margin-top: 0; color: #555;"><strong>PUT</strong> <code>/v1/recurring-billing/{id}</code> — update a recurring billing plan.</p>
        <label style="display: flex; flex-direction: column; gap: 4px; font-size: 13px; margin-bottom: 16px;">
          Recurring Billing ID <span style="color: #ef4444;">*</span>
          <input v-model="rbId" type="text" placeholder="e.g. 019dfbb3-e763-735f-a6c6-1c9f006c6ec6" style="padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; font-family: monospace;" />
        </label>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 13px; color: #666;">Request Body (JSON)</span>
          <button @click="rbUpdateBody = RB_UPDATE_EXAMPLE; rbJsonError = null" style="font-size: 12px; padding: 4px 10px; border: 1px solid #ddd; border-radius: 6px; cursor: pointer; background: #f9fafb;">Use Example</button>
        </div>
        <textarea v-model="rbUpdateBody" @input="rbJsonError = null" rows="10"
          style="width: 100%; box-sizing: border-box; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-family: monospace; font-size: 13px; resize: vertical; background: #fafafa;" />
        <p v-if="rbJsonError" style="color: #ef4444; font-size: 13px; margin-top: 4px;">{{ rbJsonError }}</p>
      </template>

      <template v-else-if="rbTab === 'delete'">
        <p style="margin-top: 0; color: #555;"><strong>DELETE</strong> <code>/v1/recurring-billing/{id}</code> — cancel a recurring billing plan.</p>
        <label style="display: flex; flex-direction: column; gap: 4px; font-size: 13px; margin-bottom: 16px;">
          Recurring Billing ID <span style="color: #ef4444;">*</span>
          <input v-model="rbId" type="text" placeholder="e.g. 019dfbb3-e763-735f-a6c6-1c9f006c6ec6" style="padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; font-family: monospace;" />
        </label>
      </template>

      <template v-else-if="rbTab === 'pause'">
        <p style="margin-top: 0; color: #555;"><strong>POST</strong> <code>/v1/recurring-billing/{id}/pause</code> — pause a recurring billing plan.</p>
        <label style="display: flex; flex-direction: column; gap: 4px; font-size: 13px; margin-bottom: 16px;">
          Recurring Billing ID <span style="color: #ef4444;">*</span>
          <input v-model="rbId" type="text" placeholder="e.g. 019dfbb3-e763-735f-a6c6-1c9f006c6ec6" style="padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; font-family: monospace;" />
        </label>
      </template>

      <template v-else-if="rbTab === 'resume'">
        <p style="margin-top: 0; color: #555;"><strong>POST</strong> <code>/v1/recurring-billing/{id}/resume</code> — resume a paused recurring billing plan.</p>
        <label style="display: flex; flex-direction: column; gap: 4px; font-size: 13px; margin-bottom: 16px;">
          Recurring Billing ID <span style="color: #ef4444;">*</span>
          <input v-model="rbId" type="text" placeholder="e.g. 019dfbb3-e763-735f-a6c6-1c9f006c6ec6" style="padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; font-family: monospace;" />
        </label>
      </template>

      <button
        @click="sendRb"
        :disabled="!canSendRb"
        :style="`margin-top: 20px; padding: 10px 24px; border-radius: 8px; border: none; font-weight: 600; font-size: 14px; font-family: inherit; cursor: ${canSendRb ? 'pointer' : 'not-allowed'}; background: ${canSendRb ? '#111' : '#d1d5db'}; color: ${canSendRb ? '#fff' : '#9ca3af'};`"
      >{{ rbLoading ? 'Loading…' : 'Send Request' }}</button>
    </div>

    <div style="border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; margin-bottom: 40px;">
      <h2 style="margin-top: 0;">Response</h2>
      <div v-if="rbErrorMsg" style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; margin-bottom: 12px; font-size: 13px; color: #991b1b;">{{ rbErrorMsg }}</div>
      <pre style="background: #f9fafb; padding: 16px; border-radius: 8px; overflow: auto; font-size: 13px; margin: 0;">{{ rbResult !== null ? JSON.stringify(rbResult, null, 2) : '— no response yet —' }}</pre>
    </div>

    <!-- ── Recurring Billing Settings ──────────────────────────────────────── -->
    <h2 style="margin-bottom: 16px;">Recurring Billing Settings</h2>

    <div style="display: flex; flex-direction: row; flex-wrap: nowrap; gap: 4px; border-bottom: 2px solid #e5e7eb; margin-bottom: 0; overflow-x: auto;">
      <button
        v-for="tab in RB_SETTINGS_TABS"
        :key="tab.id"
        @click="setRbSettingsTab(tab.id)"
        :style="`
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 14px; border: none; border-radius: 8px 8px 0 0;
          cursor: pointer; white-space: nowrap; font-family: inherit; font-size: 14px;
          font-weight: ${rbSettingsTab === tab.id ? '700' : '400'};
          background: ${rbSettingsTab === tab.id ? '#fff' : 'transparent'};
          border-bottom: ${rbSettingsTab === tab.id ? '2px solid #111' : '2px solid transparent'};
          margin-bottom: -2px;
        `"
      >
        <span :style="`font-size: 11px; font-weight: 700; color: #fff; background: ${tab.color}; border-radius: 4px; padding: 2px 5px;`">{{ tab.method }}</span>
        {{ tab.label }}
      </button>
    </div>

    <div style="border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; padding: 24px; margin-bottom: 24px;">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
        <span style="font-size: 13px; color: #666;">Required scope:</span>
        <code style="background: #f3f4f6; padding: 2px 8px; border-radius: 4px; font-size: 13px;">{{ activeRbSettingsTabInfo.scope }}</code>
      </div>

      <template v-if="rbSettingsTab === 'show'">
        <p style="margin-top: 0; color: #555;"><strong>GET</strong> <code>/v1/recurring-billing-settings</code> — retrieve recurring billing settings.</p>
      </template>

      <template v-else-if="rbSettingsTab === 'create'">
        <p style="margin-top: 0; color: #555;"><strong>POST</strong> <code>/v1/recurring-billing-settings</code> — create recurring billing settings.</p>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 13px; color: #666;">Request Body (JSON)</span>
          <button @click="rbSettingsBody = RB_SETTINGS_EXAMPLE; rbSettingsJsonError = null" style="font-size: 12px; padding: 4px 10px; border: 1px solid #ddd; border-radius: 6px; cursor: pointer; background: #f9fafb;">Use Example</button>
        </div>
        <textarea v-model="rbSettingsBody" @input="rbSettingsJsonError = null" rows="8"
          style="width: 100%; box-sizing: border-box; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-family: monospace; font-size: 13px; resize: vertical; background: #fafafa;" />
        <p v-if="rbSettingsJsonError" style="color: #ef4444; font-size: 13px; margin-top: 4px;">{{ rbSettingsJsonError }}</p>
      </template>

      <template v-else-if="rbSettingsTab === 'update'">
        <p style="margin-top: 0; color: #555;"><strong>PUT</strong> <code>/v1/recurring-billing-settings</code> — update recurring billing settings.</p>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 13px; color: #666;">Request Body (JSON)</span>
          <button @click="rbSettingsBody = RB_SETTINGS_EXAMPLE; rbSettingsJsonError = null" style="font-size: 12px; padding: 4px 10px; border: 1px solid #ddd; border-radius: 6px; cursor: pointer; background: #f9fafb;">Use Example</button>
        </div>
        <textarea v-model="rbSettingsBody" @input="rbSettingsJsonError = null" rows="8"
          style="width: 100%; box-sizing: border-box; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-family: monospace; font-size: 13px; resize: vertical; background: #fafafa;" />
        <p v-if="rbSettingsJsonError" style="color: #ef4444; font-size: 13px; margin-top: 4px;">{{ rbSettingsJsonError }}</p>
      </template>

      <template v-else-if="rbSettingsTab === 'delete'">
        <p style="margin-top: 0; color: #555;"><strong>DELETE</strong> <code>/v1/recurring-billing-settings</code> — delete recurring billing settings.</p>
      </template>

      <button
        @click="sendRbSettings"
        :disabled="!canSendRbSettings"
        :style="`margin-top: 20px; padding: 10px 24px; border-radius: 8px; border: none; font-weight: 600; font-size: 14px; font-family: inherit; cursor: ${canSendRbSettings ? 'pointer' : 'not-allowed'}; background: ${canSendRbSettings ? '#111' : '#d1d5db'}; color: ${canSendRbSettings ? '#fff' : '#9ca3af'};`"
      >{{ rbSettingsLoading ? 'Loading…' : 'Send Request' }}</button>
    </div>

    <div style="border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; margin-bottom: 40px;">
      <h2 style="margin-top: 0;">Response</h2>
      <div v-if="rbSettingsErrorMsg" style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; margin-bottom: 12px; font-size: 13px; color: #991b1b;">{{ rbSettingsErrorMsg }}</div>
      <pre style="background: #f9fafb; padding: 16px; border-radius: 8px; overflow: auto; font-size: 13px; margin: 0;">{{ rbSettingsResult !== null ? JSON.stringify(rbSettingsResult, null, 2) : '— no response yet —' }}</pre>
    </div>

    <!-- ── Subscription Plans ────────────────────────────────────────────────── -->
    <h2 style="margin-bottom: 16px;">Subscription Plans</h2>

    <div style="display: flex; flex-direction: row; flex-wrap: nowrap; gap: 4px; border-bottom: 2px solid #e5e7eb; margin-bottom: 0; overflow-x: auto;">
      <button
        v-for="tab in SP_TABS"
        :key="tab.id"
        @click="setSpTab(tab.id)"
        :style="`
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 14px; border: none; border-radius: 8px 8px 0 0;
          cursor: pointer; white-space: nowrap; font-family: inherit; font-size: 14px;
          font-weight: ${spTab === tab.id ? '700' : '400'};
          background: ${spTab === tab.id ? '#fff' : 'transparent'};
          border-bottom: ${spTab === tab.id ? '2px solid #111' : '2px solid transparent'};
          margin-bottom: -2px;
        `"
      >
        <span :style="`font-size: 11px; font-weight: 700; color: #fff; background: ${tab.color}; border-radius: 4px; padding: 2px 5px;`">{{ tab.method }}</span>
        {{ tab.label }}
      </button>
    </div>

    <div style="border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; padding: 24px; margin-bottom: 24px;">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
        <span style="font-size: 13px; color: #666;">Required scope:</span>
        <code style="background: #f3f4f6; padding: 2px 8px; border-radius: 4px; font-size: 13px;">{{ activeSpTabInfo.scope }}</code>
      </div>

      <template v-if="spTab === 'list'">
        <p style="margin-top: 0; color: #555;"><strong>GET</strong> <code>/v1/subscription-plan</code> — list subscription plans.</p>
        <div style="display: flex; flex-direction: row; gap: 12px; flex-wrap: wrap; margin-bottom: 16px;">
          <label style="display: flex; flex-direction: column; gap: 4px; font-size: 13px;">
            perPage
            <input v-model="spPerPage" type="number" min="1" max="100" style="padding: 6px 10px; border: 1px solid #ddd; border-radius: 6px; width: 80px;" />
          </label>
          <label style="display: flex; flex-direction: column; gap: 4px; font-size: 13px;">
            current_page
            <input v-model="spCurrentPage" type="number" min="1" style="padding: 6px 10px; border: 1px solid #ddd; border-radius: 6px; width: 80px;" />
          </label>
        </div>
      </template>

      <template v-else-if="spTab === 'show'">
        <p style="margin-top: 0; color: #555;"><strong>GET</strong> <code>/v1/subscription-plan/{id}</code> — retrieve a subscription plan.</p>
        <label style="display: flex; flex-direction: column; gap: 4px; font-size: 13px; margin-bottom: 16px;">
          Subscription Plan ID <span style="color: #ef4444;">*</span>
          <input v-model="spId" type="text" placeholder="e.g. 019dfbb3-e763-735f-a6c6-1c9f006c6ec6" style="padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; font-family: monospace;" />
        </label>
      </template>

      <template v-else-if="spTab === 'create'">
        <p style="margin-top: 0; color: #555;"><strong>POST</strong> <code>/v1/subscription-plan</code> — create a subscription plan.</p>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 13px; color: #666;">Request Body (JSON)</span>
          <button @click="spCreateBody = SP_CREATE_EXAMPLE; spJsonError = null" style="font-size: 12px; padding: 4px 10px; border: 1px solid #ddd; border-radius: 6px; cursor: pointer; background: #f9fafb;">Use Example</button>
        </div>
        <textarea v-model="spCreateBody" @input="spJsonError = null" rows="10"
          style="width: 100%; box-sizing: border-box; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-family: monospace; font-size: 13px; resize: vertical; background: #fafafa;" />
        <p v-if="spJsonError" style="color: #ef4444; font-size: 13px; margin-top: 4px;">{{ spJsonError }}</p>
      </template>

      <template v-else-if="spTab === 'update'">
        <p style="margin-top: 0; color: #555;"><strong>PUT</strong> <code>/v1/subscription-plan/{id}</code> — update a subscription plan.</p>
        <label style="display: flex; flex-direction: column; gap: 4px; font-size: 13px; margin-bottom: 16px;">
          Subscription Plan ID <span style="color: #ef4444;">*</span>
          <input v-model="spId" type="text" placeholder="e.g. 019dfbb3-e763-735f-a6c6-1c9f006c6ec6" style="padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; font-family: monospace;" />
        </label>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 13px; color: #666;">Request Body (JSON)</span>
          <button @click="spUpdateBody = SP_UPDATE_EXAMPLE; spJsonError = null" style="font-size: 12px; padding: 4px 10px; border: 1px solid #ddd; border-radius: 6px; cursor: pointer; background: #f9fafb;">Use Example</button>
        </div>
        <textarea v-model="spUpdateBody" @input="spJsonError = null" rows="8"
          style="width: 100%; box-sizing: border-box; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-family: monospace; font-size: 13px; resize: vertical; background: #fafafa;" />
        <p v-if="spJsonError" style="color: #ef4444; font-size: 13px; margin-top: 4px;">{{ spJsonError }}</p>
      </template>

      <template v-else-if="spTab === 'delete'">
        <p style="margin-top: 0; color: #555;"><strong>DELETE</strong> <code>/v1/subscription-plan/{id}</code> — delete a subscription plan.</p>
        <label style="display: flex; flex-direction: column; gap: 4px; font-size: 13px; margin-bottom: 16px;">
          Subscription Plan ID <span style="color: #ef4444;">*</span>
          <input v-model="spId" type="text" placeholder="e.g. 019dfbb3-e763-735f-a6c6-1c9f006c6ec6" style="padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; font-family: monospace;" />
        </label>
      </template>

      <button
        @click="sendSp"
        :disabled="!canSendSp"
        :style="`margin-top: 20px; padding: 10px 24px; border-radius: 8px; border: none; font-weight: 600; font-size: 14px; font-family: inherit; cursor: ${canSendSp ? 'pointer' : 'not-allowed'}; background: ${canSendSp ? '#111' : '#d1d5db'}; color: ${canSendSp ? '#fff' : '#9ca3af'};`"
      >{{ spLoading ? 'Loading…' : 'Send Request' }}</button>
    </div>

    <div style="border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; margin-bottom: 40px;">
      <h2 style="margin-top: 0;">Response</h2>
      <div v-if="spErrorMsg" style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; margin-bottom: 12px; font-size: 13px; color: #991b1b;">{{ spErrorMsg }}</div>
      <pre style="background: #f9fafb; padding: 16px; border-radius: 8px; overflow: auto; font-size: 13px; margin: 0;">{{ spResult !== null ? JSON.stringify(spResult, null, 2) : '— no response yet —' }}</pre>
    </div>

  </div>
</template>
