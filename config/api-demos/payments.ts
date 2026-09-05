import type { ApiGroupConfig } from './types'

const READ = '#3b82f6'
const CREATE = '#22c55e'
const UPDATE = '#f59e0b'
const DELETE = '#ef4444'

export const paymentsGroup: ApiGroupConfig = {
  id: 'payments',
  title: 'Payments',
  description: 'Payment requests, charges, refunds, and recurring billing.',
  scopes: ['payments', 'payments:read', 'payments:create', 'payments:cancel', 'payments:refund'],
  resources: [
    {
      id: 'payment-requests',
      title: 'Payment Requests',
      basePath: '/api/hitpay/payment-requests',
      tabs: [
        {
          id: 'list', label: 'List', method: 'GET', scope: 'payments:read', color: READ,
          apiPath: '/v1/payment-requests',
          description: 'Paginated list of payment requests.',
          queryFields: [
            { key: 'per_page', label: 'per_page', type: 'number', defaultValue: '10' },
            { key: 'current_page', label: 'current_page', type: 'number', defaultValue: '1' },
            { key: 'search', label: 'search', placeholder: 'Search...' },
          ],
        },
        {
          id: 'show', label: 'Show', method: 'GET', scope: 'payments:read', color: READ,
          apiPath: '/v1/payment-requests/{id}',
          description: 'Retrieve a single payment request.',
          needsId: true, idLabel: 'Payment Request ID',
        },
        {
          id: 'create', label: 'Create', method: 'POST', scope: 'payments:create', color: CREATE,
          apiPath: '/v1/payment-requests',
          description: 'Create a new payment request.',
          bodyExample: {
            currency: 'SGD', amount: 10.00, purpose: 'Demo Payment',
            name: 'John Doe', email: 'john@example.com',
            redirect_url: 'https://example.com/success',
            webhook: 'https://example.com/webhook',
            allow_repeated_payments: 'false',
            send_email: true, send_sms: false, reference_number: 'REF-001',
          },
        },
        {
          id: 'update', label: 'Update', method: 'PUT', scope: 'payments:create', color: UPDATE,
          apiPath: '/v1/payment-requests/{id}',
          description: 'Update an existing payment request.',
          needsId: true, idLabel: 'Payment Request ID',
          bodyExample: {
            currency: 'SGD', amount: 25.00, purpose: 'Updated Payment',
            name: 'Jane Doe', email: 'jane@example.com', reference_number: 'REF-002',
          },
        },
        {
          id: 'delete', label: 'Delete', method: 'DELETE', scope: 'payments:cancel', color: DELETE,
          apiPath: '/v1/payment-requests/{id}',
          description: 'Cancel a payment request.',
          needsId: true, idLabel: 'Payment Request ID',
          warning: 'This will permanently cancel the payment request. Completed requests cannot be deleted.',
        },
      ],
    },
    {
      id: 'charges',
      title: 'Charges',
      basePath: '/api/hitpay/charges',
      tabs: [
        {
          id: 'list', label: 'List', method: 'GET', scope: 'payments:read', color: READ,
          apiPath: '/v1/charges',
          description: 'List charges.',
          queryFields: [
            { key: 'per_page', label: 'per_page', type: 'number', defaultValue: '10' },
            { key: 'current_page', label: 'current_page', type: 'number', defaultValue: '1' },
          ],
        },
        {
          id: 'show', label: 'Show', method: 'GET', scope: 'payments:read', color: READ,
          apiPath: '/v1/charges/{id}',
          description: 'Retrieve a single charge.',
          needsId: true, idLabel: 'Charge ID',
        },
      ],
    },
    {
      id: 'refunds',
      title: 'Refunds',
      basePath: '/api/hitpay/refund',
      tabs: [
        {
          id: 'create', label: 'Create', method: 'POST', scope: 'payments:refund', color: CREATE,
          apiPath: '/v1/refund',
          description: 'Create a refund for a charge.',
          bodyExample: {
            payment_id: 'charge-uuid-here',
            amount: 10.00,
            send_email: true,
            email: 'customer@example.com',
            webhook: 'https://example.com/webhook',
          },
        },
        {
          id: 'show', label: 'Show', method: 'GET', scope: 'payments:read', color: READ,
          apiPath: '/v1/refund/{id}',
          description: 'Retrieve a refund.',
          needsId: true, idLabel: 'Refund ID',
        },
      ],
    },
    {
      id: 'recurring-billing',
      title: 'Recurring Billing',
      basePath: '/api/hitpay/recurring-billing',
      tabs: [
        {
          id: 'list', label: 'List', method: 'GET', scope: 'payments:read', color: READ,
          apiPath: '/v1/recurring-billing',
          description: 'List recurring billing plans. Accepts perPage or per_page.',
          queryFields: [
            { key: 'per_page', label: 'per_page', type: 'number', defaultValue: '10' },
            { key: 'current_page', label: 'current_page', type: 'number', defaultValue: '1' },
            { key: 'status', label: 'status', placeholder: 'e.g. active' },
            { key: 'customer_email', label: 'customer_email', placeholder: 'customer@example.com' },
            { key: 'reference', label: 'reference', placeholder: 'REF-001' },
          ],
        },
        {
          id: 'show', label: 'Show', method: 'GET', scope: 'payments:read', color: READ,
          apiPath: '/v1/recurring-billing/{id}',
          description: 'Retrieve a recurring billing plan.',
          needsId: true, idLabel: 'Recurring Billing ID',
        },
        {
          id: 'create', label: 'Create', method: 'POST', scope: 'payments:create', color: CREATE,
          apiPath: '/v1/recurring-billing',
          description: 'Create a recurring billing plan.',
          bodyExample: {
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
          },
        },
        {
          id: 'update', label: 'Update', method: 'PUT', scope: 'payments:create', color: UPDATE,
          apiPath: '/v1/recurring-billing/{id}',
          description: 'Update a recurring billing plan.',
          needsId: true, idLabel: 'Recurring Billing ID',
          bodyExample: { customer_name: 'Jane Doe', amount: 25, name: 'Updated Subscription' },
        },
        {
          id: 'delete', label: 'Delete', method: 'DELETE', scope: 'payments:cancel', color: DELETE,
          apiPath: '/v1/recurring-billing/{id}',
          description: 'Cancel a recurring billing plan.',
          needsId: true, idLabel: 'Recurring Billing ID',
        },
        {
          id: 'pause', label: 'Pause', method: 'POST', scope: 'payments:cancel', color: DELETE,
          apiPath: '/v1/recurring-billing/{id}/pause',
          description: 'Pause a recurring billing plan.',
          needsId: true, idLabel: 'Recurring Billing ID',
          pathSuffix: '/pause',
        },
        {
          id: 'resume', label: 'Resume', method: 'POST', scope: 'payments:create', color: CREATE,
          apiPath: '/v1/recurring-billing/{id}/resume',
          description: 'Resume a paused recurring billing plan.',
          needsId: true, idLabel: 'Recurring Billing ID',
          pathSuffix: '/resume',
        },
      ],
    },
    {
      id: 'recurring-billing-settings',
      title: 'Recurring Billing Settings',
      basePath: '/api/hitpay/recurring-billing-settings',
      tabs: [
        {
          id: 'show', label: 'Show', method: 'GET', scope: 'payments:read', color: READ,
          apiPath: '/v1/recurring-billing-settings',
          description: 'Retrieve recurring billing settings.',
        },
        {
          id: 'create', label: 'Create', method: 'POST', scope: 'payments:create', color: CREATE,
          apiPath: '/v1/recurring-billing-settings',
          description: 'Create recurring billing settings.',
          bodyExample: { renewal_reminders: true, status_after_retrying: 'canceled' },
        },
        {
          id: 'update', label: 'Update', method: 'PUT', scope: 'payments:create', color: UPDATE,
          apiPath: '/v1/recurring-billing-settings',
          description: 'Update recurring billing settings.',
          bodyExample: { renewal_reminders: true, status_after_retrying: 'canceled' },
        },
        {
          id: 'delete', label: 'Delete', method: 'DELETE', scope: 'payments:cancel', color: DELETE,
          apiPath: '/v1/recurring-billing-settings',
          description: 'Delete recurring billing settings.',
        },
      ],
    },
    {
      id: 'subscription-plan',
      title: 'Subscription Plans',
      basePath: '/api/hitpay/subscription-plan',
      tabs: [
        {
          id: 'list', label: 'List', method: 'GET', scope: 'payments:read', color: READ,
          apiPath: '/v1/subscription-plan',
          description: 'List subscription plans. Uses per_page only.',
          queryFields: [
            { key: 'per_page', label: 'per_page', type: 'number', defaultValue: '10' },
            { key: 'current_page', label: 'current_page', type: 'number', defaultValue: '1' },
          ],
        },
        {
          id: 'show', label: 'Show', method: 'GET', scope: 'payments:read', color: READ,
          apiPath: '/v1/subscription-plan/{id}',
          description: 'Retrieve a subscription plan.',
          needsId: true, idLabel: 'Subscription Plan ID',
        },
        {
          id: 'create', label: 'Create', method: 'POST', scope: 'payments:create', color: CREATE,
          apiPath: '/v1/subscription-plan',
          description: 'Create a subscription plan.',
          bodyExample: { name: 'Monthly Plan', amount: 12, cycle: 'monthly', currency: 'SGD' },
        },
        {
          id: 'update', label: 'Update', method: 'PUT', scope: 'payments:create', color: UPDATE,
          apiPath: '/v1/subscription-plan/{id}',
          description: 'Update a subscription plan.',
          needsId: true, idLabel: 'Subscription Plan ID',
          bodyExample: { name: 'Updated Plan', amount: 15 },
        },
        {
          id: 'delete', label: 'Delete', method: 'DELETE', scope: 'payments:cancel', color: DELETE,
          apiPath: '/v1/subscription-plan/{id}',
          description: 'Delete a subscription plan.',
          needsId: true, idLabel: 'Subscription Plan ID',
        },
      ],
    },
  ],
}
