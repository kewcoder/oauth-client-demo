import type { ApiGroupConfig } from './types'

const READ = '#3b82f6'
const CREATE = '#22c55e'
const UPDATE = '#f59e0b'
const DELETE = '#ef4444'

/** customer:read | customer:create | customer:update | customer:delete */
export const customersGroup: ApiGroupConfig = {
  id: 'customers',
  title: 'Customers',
  description: 'Customer directory (OAuth customer:* scopes — not included in default commerce scopes).',
  scopes: ['customer', 'customer:read', 'customer:create', 'customer:update', 'customer:delete'],
  resources: [
    {
      id: 'customers',
      title: 'Customers',
      basePath: '/api/hitpay/customers',
      tabs: [
        {
          id: 'list', label: 'List', method: 'GET', scope: 'customer:read', color: READ,
          apiPath: '/v1/customers',
          description: 'Paginated list of customers.',
          queryFields: [
            { key: 'per_page', label: 'per_page', type: 'number', defaultValue: '10' },
            { key: 'current_page', label: 'current_page', type: 'number', defaultValue: '1' },
            { key: 'keywords', label: 'keywords', type: 'text', placeholder: 'Name or email' },
          ],
        },
        {
          id: 'show', label: 'Show', method: 'GET', scope: 'customer:read', color: READ,
          apiPath: '/v1/customers/{id}',
          description: 'Retrieve a single customer.',
          needsId: true, idLabel: 'Customer ID',
        },
        {
          id: 'create', label: 'Create', method: 'POST', scope: 'customer:create', color: CREATE,
          apiPath: '/v1/customers',
          description: 'Create a customer.',
          bodyExample: {
            name: 'Ada Lovelace',
            email: 'ada@example.com',
            phone_number: '+6581234567',
          },
        },
        {
          id: 'update', label: 'Update', method: 'PATCH', scope: 'customer:update', color: UPDATE,
          apiPath: '/v1/customers/{id}',
          description: 'Update a customer.',
          needsId: true, idLabel: 'Customer ID',
          bodyExample: {
            name: 'Ada Lovelace',
            email: 'ada@example.com',
          },
        },
        {
          id: 'delete', label: 'Delete', method: 'DELETE', scope: 'customer:delete', color: DELETE,
          apiPath: '/v1/customers/{id}',
          description: 'Delete a customer.',
          needsId: true, idLabel: 'Customer ID',
          warning: 'This permanently deletes the customer.',
        },
      ],
    },
  ],
}
