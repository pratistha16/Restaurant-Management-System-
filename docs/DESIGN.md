# Multi-Tenant Restaurant Management System (RMS) - Design Document

## 1. Architecture Overview

### High-Level Architecture
- **Backend**: Django (Python) with Django REST Framework.
- **Database**: PostgreSQL (recommended for production) / SQLite (dev).
- **Multi-tenancy Strategy**: Shared Database, Shared Schema. Data isolation via `restaurant_id` foreign keys on all tenant-specific models.
- **Frontend**: 
  - **Admin/Tenant Web**: React / Next.js (implied for "Tablet-friendly" and modern UI).
  - **POS**: Tablet-optimized Web App (PWA).
- **Authentication**: JWT (JSON Web Tokens) with custom middleware to enforce Tenant isolation.

### Core Modules
1.  **Super Admin**: Global platform management.
2.  **Tenant (Restaurant)**: Daily operations (POS, Inventory, Accounting).
3.  **Table (Customer)**: QR-code based ordering (Read-only menu, Create Order).

---

## 2. Navigation Flows & Page Responsibilities

### 🟦 Super Admin Flow
| Page | Responsibilities |
| :--- | :--- |
| **Dashboard** | Platform metrics (Total Restaurants, Revenue), System Health, Security Alerts. |
| **Restaurants** | List all tenants. Actions: Impersonate, Suspend, Soft Delete. |
| **Restaurant Profile** | Detailed view: User count, POS stats, Inventory size. |
| **Subscription** | Manage Plans, Pricing, Invoices. |
| **Global Users** | View owners, Lock accounts. |
| **Settings** | Global tax templates, Feature flags. |

### 🟩 Tenant (Restaurant) Flow
| Page | Responsibilities |
| :--- | :--- |
| **Dashboard** | Sales overview, Active Orders, Low stock alerts. |
| **POS Module** | Table Grid, Menu Selection, Order Creation, Billing. |
| **Kitchen/Bar** | KDS (Kitchen Display System) - Live order feed. |
| **Inventory** | Raw materials, Recipes, Purchase Orders, Stock adjustments. |
| **Accounting** | Cash/Bank balance, Expenses, P&L Reports. |
| **Staff** | User management, Role assignment, Shift timing. |
| **Settings** | Restaurant profile, Printers, Tax rules. |

### 🪑 Table (Customer) Flow
| Step | Action |
| :--- | :--- |
| 1 | Scan QR Code (Contains Table ID + Tenant ID). |
| 2 | View Digital Menu (Read-only). |
| 3 | Add items to cart & Place Order. |
| 4 | View Order Status (Received -> Preparing -> Served). |
| 5 | Request Bill / Pay Online. |

---

## 3. Data Models (Schema Design)

### Global / Super Admin
- **Tenant (Restaurant)**
  - `name`, `subdomain`, `owner_contact`, `subscription_plan`, `status` (Active, Suspended), `is_deleted`.
- **SubscriptionPlan**
  - `name`, `price`, `features` (JSON), `max_users`, `max_orders`.

### Tenant Scoped (All have `restaurant_id`)

#### Users & Roles
- **UserProfile**: Extends Django User. `role`, `shift_start`, `shift_end`.
- **Role**: `name` (Owner, Manager, Waiter, Kitchen, etc.), `permissions` (JSON/M2M).

#### Menu & Inventory
- **Category**: `name`, `type` (Food/Bar).
- **Item**: `name`, `price`, `tax_group`, `recipe` (Link to Inventory).
- **Ingredient**: `name`, `unit`, `current_stock`, `low_stock_limit`.
- **Recipe**: `item` -> `ingredients` + `quantity`.

#### Orders & POS
- **Table**: `number`, `capacity`, `section`, `qr_code`.
- **Order**: `table`, `waiter`, `status` (Pending, KOT Printed, Served, Paid), `total_amount`.
- **OrderItem**: `order`, `item`, `quantity`, `notes`, `status` (New, Cooking, Ready).

#### Accounting
- **Transaction**: `type` (Sale, Expense), `amount`, `category`, `payment_method`.
- **Invoice**: `order`, `customer_details`, `tax_breakdown`.

---

## 4. API Structure

### Base URL Strategy
- `api.rms.com/v1/admin/...` (Super Admin)
- `api.rms.com/v1/tenant/{tenant_slug}/...` (Tenant Operations)

### Key Endpoints

#### Super Admin
- `GET /admin/stats` - Dashboard metrics.
- `GET /admin/tenants` - List restaurants.
- `POST /admin/tenants` - Onboard new restaurant.

#### Tenant
- `GET /tenant/menu` - Fetch menu (Public/Auth).
- `POST /tenant/orders` - Create order (POS/Customer).
- `GET /tenant/orders/live` - KDS polling/socket.
- `POST /tenant/inventory/purchase` - Add stock.
- `GET /tenant/reports/sales` - Sales analytics.

---

## 5. Permission Matrix

| Action | Owner | Manager | Waiter | Kitchen | Customer |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Manage Settings** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **View Sales Reports** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Manage Menu** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Take Orders (POS)** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Self Order (QR)** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **View KDS** | ✅ | ✅ | ❌ | ✅ | ❌ |
| **Manage Inventory** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Void Bill** | ✅ | ✅ | ❌ | ❌ | ❌ |

---

## 6. Print Workflows (Event-Driven)

### Architecture
- **Event Bus**: Redis / internal Django Signals.
- **Print Service**: Background worker listening for `ORDER_CREATED` or `BILL_REQUESTED`.

### Workflow
1.  **Order Placed** (via POS or QR).
2.  **Event Triggered**: `order_created(order_id)`.
3.  **Router**: Checks order items categories.
    - Food items -> **Kitchen Printer**.
    - Drink items -> **Bar Printer**.
4.  **Job Queue**: Print job added to `print_jobs` table (status: Pending).
5.  **Printer Client**: Local service polls API or receives WebSocket msg to fetch job and print ESC/POS commands.
