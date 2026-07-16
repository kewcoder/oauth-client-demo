import type { ApiResourceConfig, ApiTabConfig } from '~/config/api-demos/types'

function validateJson(val: string): { ok: true; data: unknown } | { ok: false; error: string } {
  try {
    return { ok: true, data: JSON.parse(val) }
  } catch (e: any) {
    return { ok: false, error: `Invalid JSON: ${e.message}` }
  }
}

function initQueryFields(resource: ApiResourceConfig): Record<string, string> {
  const fields: Record<string, string> = {}
  for (const tab of resource.tabs) {
    for (const q of tab.queryFields ?? []) {
      if (!(q.key in fields)) {
        fields[q.key] = q.defaultValue ?? ''
      }
    }
  }
  return fields
}

function initBodies(resource: ApiResourceConfig): Record<string, string> {
  const bodies: Record<string, string> = {}
  for (const tab of resource.tabs) {
    if (tab.bodyExample !== undefined) {
      bodies[tab.id] = JSON.stringify(tab.bodyExample, null, 2)
    }
  }
  return bodies
}

export function useApiResourceDemo(resource: ApiResourceConfig) {
  const activeTabId = ref(resource.tabs[0]?.id ?? '')
  const result = ref<any>(null)
  const loading = ref(false)
  const errorMsg = ref<string | null>(null)
  const resourceId = ref('')
  const queryFields = ref(initQueryFields(resource))
  const bodies = ref(initBodies(resource))
  const jsonError = ref<string | null>(null)

  const activeTab = computed(() =>
    resource.tabs.find(t => t.id === activeTabId.value) ?? resource.tabs[0],
  )

  const canSend = computed(() => {
    if (loading.value || !activeTab.value) return false
    if (activeTab.value.needsId && !resourceId.value.trim()) return false
    return true
  })

  function setTab(tabId: string) {
    activeTabId.value = tabId
    result.value = null
    errorMsg.value = null
    jsonError.value = null
  }

  function resetBody(tab: ApiTabConfig) {
    if (tab.bodyExample !== undefined) {
      bodies.value[tab.id] = JSON.stringify(tab.bodyExample, null, 2)
    }
    jsonError.value = null
  }

  function buildPath(tab: ApiTabConfig): string {
    let path = resource.basePath
    if (tab.needsId) {
      path += `/${resourceId.value.trim()}`
    }
    if (tab.pathSuffix) {
      path += tab.pathSuffix
    }
    return path
  }

  async function send() {
    const tab = activeTab.value
    if (!tab) return

    loading.value = true
    result.value = null
    errorMsg.value = null

    try {
      const path = buildPath(tab)

      if (tab.method === 'GET') {
        const params = new URLSearchParams()
        for (const [key, val] of Object.entries(queryFields.value)) {
          if (val) params.set(key, val)
        }
        const qs = params.toString()
        result.value = await $fetch(qs ? `${path}?${qs}` : path)
      } else if (tab.method === 'DELETE') {
        result.value = await $fetch(path, { method: 'DELETE' })
      } else if (tab.bodyExample !== undefined) {
        const parsed = validateJson(bodies.value[tab.id] ?? '{}')
        if (!parsed.ok) {
          jsonError.value = parsed.error
          loading.value = false
          return
        }
        jsonError.value = null
        result.value = await $fetch(path, {
          method: tab.method,
          body: parsed.data,
        })
      } else {
        result.value = await $fetch(path, { method: tab.method })
      }
    } catch (e: any) {
      errorMsg.value = e?.statusMessage || e?.message || 'Request failed'
      result.value = e?.data ?? null
    } finally {
      loading.value = false
    }
  }

  return {
    activeTabId,
    activeTab,
    result,
    loading,
    errorMsg,
    resourceId,
    queryFields,
    bodies,
    jsonError,
    canSend,
    setTab,
    resetBody,
    send,
  }
}
