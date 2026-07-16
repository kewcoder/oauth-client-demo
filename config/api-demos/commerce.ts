import type { ApiGroupConfig } from './types'

const READ = '#3b82f6'
const CREATE = '#22c55e'
const UPDATE = '#f59e0b'
const DELETE = '#ef4444'

/** commerce:read | commerce:create | commerce:update | commerce:delete */
export const commerceGroup: ApiGroupConfig = {
  id: 'commerce',
  title: 'Commerce',
  description: 'Products, categories, orders, and invoices (OAuth commerce:* scopes).',
  scopes: ['commerce', 'commerce:read', 'commerce:create', 'commerce:update', 'commerce:delete'],
  resources: [
    {
      id: 'products',
      title: 'Products',
      basePath: '/api/hitpay/products',
      tabs: [
        {
          id: 'list', label: 'List', method: 'GET', scope: 'commerce:read', color: READ,
          apiPath: '/v1/products',
          description: 'Paginated list of products.',
          queryFields: [
            { key: 'per_page', label: 'per_page', type: 'number', defaultValue: '10' },
            { key: 'current_page', label: 'current_page', type: 'number', defaultValue: '1' },
          ],
        },
        {
          id: 'show', label: 'Show', method: 'GET', scope: 'commerce:read', color: READ,
          apiPath: '/v1/products/{id}',
          description: 'Retrieve a single product.',
          needsId: true, idLabel: 'Product ID',
        },
        {
          id: 'create', label: 'Create', method: 'POST', scope: 'commerce:create', color: CREATE,
          apiPath: '/v1/products',
          description: 'Create a new product.',
          bodyExample: {
            name: 'Demo Product',
            price: 19.99,
            currency: 'sgd',
            status: 'published',
          },
        },
        {
          id: 'update', label: 'Update', method: 'PATCH', scope: 'commerce:update', color: UPDATE,
          apiPath: '/v1/products/{id}',
          description: 'Update an existing product.',
          needsId: true, idLabel: 'Product ID',
          bodyExample: { name: 'Updated Product', price: 24.99 },
        },
        {
          id: 'delete', label: 'Delete', method: 'DELETE', scope: 'commerce:delete', color: DELETE,
          apiPath: '/v1/products/{id}',
          description: 'Delete a product.',
          needsId: true, idLabel: 'Product ID',
        },
      ],
    },
    {
      id: 'product-category',
      title: 'Product Categories',
      basePath: '/api/hitpay/product-category',
      tabs: [
        {
          id: 'list', label: 'List', method: 'GET', scope: 'commerce:read', color: READ,
          apiPath: '/v1/product-category',
          description: 'List product categories.',
          queryFields: [
            { key: 'per_page', label: 'per_page', type: 'number', defaultValue: '10' },
            { key: 'current_page', label: 'current_page', type: 'number', defaultValue: '1' },
          ],
        },
      ],
    },
    {
      id: 'orders',
      title: 'Orders',
      basePath: '/api/hitpay/orders',
      tabs: [
        {
          id: 'list', label: 'List', method: 'GET', scope: 'commerce:read', color: READ,
          apiPath: '/v1/orders',
          description: 'Paginated list of orders.',
          queryFields: [
            { key: 'per_page', label: 'per_page', type: 'number', defaultValue: '10' },
            { key: 'current_page', label: 'current_page', type: 'number', defaultValue: '1' },
          ],
        },
        {
          id: 'show', label: 'Show', method: 'GET', scope: 'commerce:read', color: READ,
          apiPath: '/v1/orders/{id}',
          description: 'Retrieve a single order.',
          needsId: true, idLabel: 'Order ID',
        },
        {
          id: 'create', label: 'Create', method: 'POST', scope: 'commerce:create', color: CREATE,
          apiPath: '/v1/orders',
          description: 'Create a new order (empty body creates a draft order).',
          bodyExample: {},
        },
        {
          id: 'update', label: 'Update', method: 'PATCH', scope: 'commerce:update', color: UPDATE,
          apiPath: '/v1/orders/{id}',
          description: 'Update an existing order.',
          needsId: true, idLabel: 'Order ID',
          bodyExample: { remark: 'Updated via OAuth demo' },
        },
        {
          id: 'delete', label: 'Delete', method: 'DELETE', scope: 'commerce:delete', color: DELETE,
          apiPath: '/v1/orders/{id}',
          description: 'Delete a draft order.',
          needsId: true, idLabel: 'Order ID',
        },
      ],
    },
    {
      id: 'invoices',
      title: 'Invoices',
      basePath: '/api/hitpay/invoices',
      tabs: [
        {
          id: 'list', label: 'List', method: 'GET', scope: 'commerce:read', color: READ,
          apiPath: '/v1/invoices',
          description: 'Paginated list of invoices.',
          queryFields: [
            { key: 'per_page', label: 'per_page', type: 'number', defaultValue: '10' },
            { key: 'current_page', label: 'current_page', type: 'number', defaultValue: '1' },
          ],
        },
        {
          id: 'show', label: 'Show', method: 'GET', scope: 'commerce:read', color: READ,
          apiPath: '/v1/invoices/{id}',
          description: 'Retrieve a single invoice.',
          needsId: true, idLabel: 'Invoice ID',
        },
        {
          id: 'create', label: 'Create', method: 'POST', scope: 'commerce:create', color: CREATE,
          apiPath: '/v1/invoices',
          description: 'Create a new invoice.',
          bodyExample: {
            customer: { name: 'John Doe', email: 'john@example.com' },
            type: 'invoice',
            invoice_date: new Date().toISOString().slice(0, 10),
            auto_invoice_number: true,
            currency: 'sgd',
            amount: 99,
            subtotal: 99,
            payment_by: 'amount',
            send_email: 0,
          },
        },
        {
          id: 'update', label: 'Update', method: 'PUT', scope: 'commerce:update', color: UPDATE,
          apiPath: '/v1/invoices/{id}',
          description: 'Update an existing invoice.',
          needsId: true, idLabel: 'Invoice ID',
          bodyExample: { amount: 120, subtotal: 120 },
        },
        {
          id: 'delete', label: 'Delete', method: 'DELETE', scope: 'commerce:delete', color: DELETE,
          apiPath: '/v1/invoices/{id}',
          description: 'Delete a pending invoice.',
          needsId: true, idLabel: 'Invoice ID',
        },
      ],
    },
  ],
}
