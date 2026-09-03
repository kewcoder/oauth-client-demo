import { commerceGroup } from './commerce'
import { customersGroup } from './customers'
import { paymentsGroup } from './payments'
import type { ApiGroupConfig } from './types'

export type { ApiGroupConfig, ApiResourceConfig, ApiTabConfig } from './types'
export { commerceGroup, customersGroup, paymentsGroup }

export const apiDemoGroups: ApiGroupConfig[] = [paymentsGroup, commerceGroup, customersGroup]

export function findGroup(id: string): ApiGroupConfig | undefined {
  return apiDemoGroups.find(g => g.id === id)
}
