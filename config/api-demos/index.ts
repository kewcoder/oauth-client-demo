import { commerceGroup } from './commerce'
import { paymentsGroup } from './payments'
import type { ApiGroupConfig } from './types'

export type { ApiGroupConfig, ApiResourceConfig, ApiTabConfig } from './types'
export { commerceGroup, paymentsGroup }

export const apiDemoGroups: ApiGroupConfig[] = [paymentsGroup, commerceGroup]

export function findGroup(id: string): ApiGroupConfig | undefined {
  return apiDemoGroups.find(g => g.id === id)
}
