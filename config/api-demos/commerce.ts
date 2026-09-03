import type { ApiGroupConfig } from './types'

const READ = '#3b82f6'
const CREATE = '#22c55e'
const UPDATE = '#f59e0b'
const DELETE = '#ef4444'

/** commerce:read | commerce:create | commerce:update | commerce:delete */
export const commerceGroup: ApiGroupConfig = {
  id: 'commerce',
  title: 'Commerce',
  description: 'Catalog, orders, invoices, coupons, store settings, and store links (commerce:*).',
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
          warning: 'This permanently deletes the product.',
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
        {
          id: 'show', label: 'Show', method: 'GET', scope: 'commerce:read', color: READ,
          apiPath: '/v1/product-category/{id}',
          description: 'Retrieve a single product category.',
          needsId: true, idLabel: 'Category ID',
        },
      ],
    },
    {
      id: 'add-ons',
      title: 'Add-ons',
      basePath: '/api/hitpay/add-ons',
      tabs: [
        {
          id: 'list', label: 'List', method: 'GET', scope: 'commerce:read', color: READ,
          apiPath: '/v1/add-ons',
          description: 'Paginated list of product add-ons.',
          queryFields: [
            { key: 'keywords', label: 'keywords', type: 'text' },
            { key: 'per_page', label: 'per_page', type: 'number', defaultValue: '10' },
          ],
        },
        {
          id: 'show', label: 'Show', method: 'GET', scope: 'commerce:read', color: READ,
          apiPath: '/v1/add-ons/{id}',
          description: 'Retrieve a single add-on.',
          needsId: true, idLabel: 'Add-on ID',
        },
      ],
    },
    {
      id: 'invoice-settings',
      title: 'Invoice Settings',
      basePath: '/api/hitpay/invoice-settings',
      tabs: [
        {
          id: 'show', label: 'Show', method: 'GET', scope: 'commerce:read', color: READ,
          apiPath: '/v1/invoice-settings',
          description: 'Retrieve invoice title, footer, late fee, and custom fields.',
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
          warning: 'Only pending invoices can be deleted.',
        },
      ],
    },
    {
      id: 'store-settings',
      title: 'Store Settings',
      basePath: '/api/hitpay/store-settings',
      tabs: [
        {
          id: 'show', label: 'Show', method: 'GET', scope: 'commerce:read', color: READ,
          apiPath: '/v1/store-settings',
          description: 'Online store settings: shop_state, tax, order form, favicon. access_code is hidden on this public route.',
        },
      ],
    },
    {
      id: 'store-links',
      title: 'Store Links',
      basePath: '/api/hitpay/store-links',
      tabs: [
        {
          id: 'show', label: 'Show', method: 'GET', scope: 'commerce:read', color: READ,
          apiPath: '/v1/store-links',
          description: 'Published navigation, social, and link-in-bio links from the active store theme.',
        },
        {
          id: 'update', label: 'Update', method: 'PUT', scope: 'commerce:update', color: UPDATE,
          apiPath: '/v1/store-links',
          description: 'Merge into the active theme JSON (and draft if present). Send only the keys you want to change. Does not replace banner or layout fields.',
          bodyExample: {
            navigation_menus: [
              { id: 'home', title: 'Home', link: '/', type: 'page' },
            ],
            social_menus: [
              { id: 'ig', title: '@shop', link: 'https://instagram.com/shop', type: 'instagram' },
            ],
            link_in_bio: {
              enabled: true,
              icon_links: [
                { id: 'wa', title: 'WhatsApp', link: 'https://wa.me/6581234567', type: 'whatsapp' },
              ],
              button_links: [
                { id: 'web', title: 'Website', link: 'https://example.com', type: 'link' },
              ],
            },
          },
        },
      ],
    },
    {
      id: 'store-pages',
      title: 'Store Pages',
      basePath: '/api/hitpay/store-pages',
      tabs: [
        {
          id: 'list', label: 'List', method: 'GET', scope: 'commerce:read', color: READ,
          apiPath: '/v1/store-pages',
          description: 'Custom store pages from store design (title, path, content). Read-only.',
          queryFields: [
            { key: 'keywords', label: 'keywords', type: 'text' },
            { key: 'status', label: 'status', type: 'text', placeholder: 'published or draft' },
            { key: 'per_page', label: 'per_page', type: 'number', defaultValue: '10' },
          ],
        },
        {
          id: 'show', label: 'Show', method: 'GET', scope: 'commerce:read', color: READ,
          apiPath: '/v1/store-pages/{id}',
          description: 'Retrieve a single store page including store-design content.',
          needsId: true, idLabel: 'Store Page ID',
        },
      ],
    },
    {
      id: 'locations',
      title: 'Locations',
      basePath: '/api/hitpay/locations',
      tabs: [
        {
          id: 'list', label: 'List', method: 'GET', scope: 'commerce:read', color: READ,
          apiPath: '/v1/locations',
          description: 'List store locations.',
          queryFields: [
            { key: 'keywords', label: 'keywords', type: 'text', placeholder: 'Name or location ID' },
          ],
        },
        {
          id: 'show', label: 'Show', method: 'GET', scope: 'commerce:read', color: READ,
          apiPath: '/v1/locations/{id}',
          description: 'Retrieve a single location.',
          needsId: true, idLabel: 'Location ID',
        },
      ],
    },
    {
      id: 'coupons',
      title: 'Coupons',
      basePath: '/api/hitpay/coupons',
      tabs: [
        {
          id: 'list', label: 'List', method: 'GET', scope: 'commerce:read', color: READ,
          apiPath: '/v1/coupons',
          description: 'Paginated list of coupons.',
          queryFields: [
            { key: 'keywords', label: 'keywords', type: 'text' },
            { key: 'per_page', label: 'per_page', type: 'number', defaultValue: '10' },
          ],
        },
        {
          id: 'show', label: 'Show', method: 'GET', scope: 'commerce:read', color: READ,
          apiPath: '/v1/coupons/{id}',
          description: 'Retrieve a single coupon.',
          needsId: true, idLabel: 'Coupon ID',
        },
      ],
    },
    {
      id: 'discounts',
      title: 'Discounts',
      basePath: '/api/hitpay/discounts',
      tabs: [
        {
          id: 'list', label: 'List', method: 'GET', scope: 'commerce:read', color: READ,
          apiPath: '/v1/discounts',
          description: 'Paginated list of discounts.',
          queryFields: [
            { key: 'keywords', label: 'keywords', type: 'text' },
            { key: 'per_page', label: 'per_page', type: 'number', defaultValue: '10' },
            { key: 'pos_discount', label: 'pos_discount', type: 'text', placeholder: 'true' },
          ],
        },
        {
          id: 'show', label: 'Show', method: 'GET', scope: 'commerce:read', color: READ,
          apiPath: '/v1/discounts/{id}',
          description: 'Retrieve a single discount.',
          needsId: true, idLabel: 'Discount ID',
        },
      ],
    },
    {
      id: 'shipping',
      title: 'Shipping',
      basePath: '/api/hitpay/shipping',
      tabs: [
        {
          id: 'list', label: 'List', method: 'GET', scope: 'commerce:read', color: READ,
          apiPath: '/v1/shipping',
          description: 'List shipping methods and store shipping flags.',
        },
        {
          id: 'show', label: 'Show', method: 'GET', scope: 'commerce:read', color: READ,
          apiPath: '/v1/shipping/{id}',
          description: 'Retrieve a single shipping method.',
          needsId: true, idLabel: 'Shipping ID',
        },
      ],
    },
    {
      id: 'pickups',
      title: 'Pickups',
      basePath: '/api/hitpay/pickups',
      tabs: [
        {
          id: 'list', label: 'List', method: 'GET', scope: 'commerce:read', color: READ,
          apiPath: '/v1/pickups',
          description: 'Paginated list of pickup locations.',
          queryFields: [
            { key: 'perPage', label: 'perPage', type: 'number', defaultValue: '20' },
          ],
        },
        {
          id: 'show', label: 'Show', method: 'GET', scope: 'commerce:read', color: READ,
          apiPath: '/v1/pickups/{id}',
          description: 'Retrieve a single pickup.',
          needsId: true, idLabel: 'Pickup ID',
        },
      ],
    },
    {
      id: 'taxes',
      title: 'Taxes',
      basePath: '/api/hitpay/taxes',
      tabs: [
        {
          id: 'list', label: 'List', method: 'GET', scope: 'commerce:read', color: READ,
          apiPath: '/v1/taxes',
          description: 'Paginated list of tax settings (rates).',
          queryFields: [
            { key: 'keywords', label: 'keywords', type: 'text' },
            { key: 'per_page', label: 'per_page', type: 'number', defaultValue: '10' },
          ],
        },
        {
          id: 'show', label: 'Show', method: 'GET', scope: 'commerce:read', color: READ,
          apiPath: '/v1/taxes/{id}',
          description: 'Retrieve a single tax setting.',
          needsId: true, idLabel: 'Tax ID',
        },
      ],
    },
  ],
}
