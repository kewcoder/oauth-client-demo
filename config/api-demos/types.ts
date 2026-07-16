export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export type QueryField = {
  key: string
  label: string
  type?: 'text' | 'number'
  placeholder?: string
  defaultValue?: string
}

export type ApiTabConfig = {
  id: string
  label: string
  method: HttpMethod
  scope: string
  color: string
  /** Documented HitPay path, e.g. /v1/products/{id} */
  apiPath: string
  description: string
  /** Append /{id} or /{id}/pause etc. to basePath */
  pathSuffix?: string
  needsId?: boolean
  idLabel?: string
  queryFields?: QueryField[]
  bodyExample?: object
  warning?: string
}

export type ApiResourceConfig = {
  id: string
  title: string
  /** Proxy base path without trailing slash, e.g. /api/hitpay/products */
  basePath: string
  tabs: ApiTabConfig[]
}

export type ApiGroupConfig = {
  id: string
  title: string
  description: string
  scopes: string[]
  resources: ApiResourceConfig[]
}
