const TOKEN_COOKIE = 'hitpay_token'

function getTokenCookie(): Record<string, any> | null {
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${TOKEN_COOKIE}=([^;]*)`))
  if (!match) return null
  try { return JSON.parse(decodeURIComponent(match[1])) } catch { return null }
}

function clearTokenCookie() {
  document.cookie = `${TOKEN_COOKIE}=; path=/; max-age=0; SameSite=Lax`
}

export function useOAuthSession() {
  const tokenInfo = ref<any>(null)
  const tokenData = ref<{ access_token: string; refresh_token: string | null } | null>(null)
  const infoResult = ref<any>(null)
  const infoLoading = ref(false)
  const copied = ref<string | null>(null)
  const tokensVisible = ref(false)

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

  return {
    tokenInfo,
    tokenData,
    infoResult,
    infoLoading,
    copied,
    tokensVisible,
    loadTokenInfo,
    copyToClipboard,
    callInfo,
    logout,
  }
}
