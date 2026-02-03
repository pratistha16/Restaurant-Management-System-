# QA & UAT Testing Process for Restaurant Management System (RMS)

This document outlines the step-by-step process for Quality Assurance (QA) and User Acceptance Testing (UAT) of the Multi-Tenant RMS.

## 1. Prerequisites & Environment Setup

Before starting testing, ensure the environment is ready:

1.  **Database**: Ensure migrations are applied (`python manage.py migrate`).
2.  **Server**: Start the server with ASGI support for WebSockets (`daphne -p 8000 rms.asgi:application` or `python manage.py runserver` for dev).
3.  **Dependencies**: Install requirements (`pip install -r requirements.txt`).

## 2. User Roles Required

Create the following users for testing (use Super Admin to create Tenant Owners, then Tenant Owner to create staff):

| Role | Username (Example) | Permissions/Scope |
| :--- | :--- | :--- |
| **Super Admin** | `admin` | Global System Access |
| **Tenant Owner** | `owner_pizza` | Full access to 'Pizza Hut' tenant |
| **Manager** | `manager_pizza` | Menu, Inventory, Reports |
| **Waiter** | `waiter_pizza` | POS, Order Creation |
| **Kitchen Staff** | `chef_pizza` | KDS View, Order Status Update |

## 3. QA Testing (Functional Verification)

### Module 1: Multi-Tenancy & Onboarding
**Goal**: Verify tenant isolation and onboarding flow.

1.  **Create Tenant**:
    *   *Action*: API `POST /api/v1/superadmin/restaurants/` with name "Test Resto".
    *   *Expectation*: Restaurant created, domain/slug generated.
2.  **Tenant Isolation**:
    *   *Action*: Create Item in Tenant A. Switch to Tenant B.
    *   *Expectation*: Tenant B cannot see Tenant A's items.

### Module 2: Menu Management
**Goal**: Verify menu creation and configuration.

1.  **Create Category**:
    *   *Action*: `POST /api/v1/tenant/{slug}/menu/categories/` (e.g., "Starters").
    *   *Expectation*: Category created.
2.  **Create Item**:
    *   *Action*: `POST /api/v1/tenant/{slug}/menu/items/` with `base_price` and `category`.
    *   *Expectation*: Item listed in menu.
3.  **Addons**:
    *   *Action*: Create AddonGroup "Toppings" and Addon "Cheese". Link to Item.
    *   *Expectation*: Item details show available addons.

### Module 3: POS & Ordering
**Goal**: Verify order taking and table management.

1.  **Table Setup**:
    *   *Action*: Create Table #1 via API.
    *   *Expectation*: Table created with a unique `qr_code_token`.
2.  **QR Code Generation**:
    *   *Action*: `GET /api/v1/tenant/{slug}/pos/tables/{id}/qr_code/`.
    *   *Expectation*: Receive a PNG image of the QR code.
3.  **Place Order**:
    *   *Action*: `POST /api/v1/tenant/{slug}/pos/orders/` with items and table ID.
    *   *Expectation*: Order created with status `open`. Total amount calculated correctly.

### Module 4: Kitchen Display System (KDS)
**Goal**: Verify real-time order flow to kitchen.

1.  **WebSocket Connection**:
    *   *Action*: Connect to `ws://localhost:8000/ws/kitchen/{slug}/`.
    *   *Expectation*: Connection successful.
2.  **Order Notification**:
    *   *Action*: Change Order status to `confirmed` via POS API.
    *   *Expectation*: WebSocket receives `order_update` event with order details.
3.  **Update Status**:
    *   *Action*: Kitchen User updates order to `ready`.
    *   *Expectation*: POS/Waiter receives update (if listening).

### Module 5: Inventory Management
**Goal**: Verify automatic stock deduction.

1.  **Setup Inventory**:
    *   *Action*: Create Ingredient "Flour" (Stock: 10kg). Create Recipe for "Pizza Base" using 0.2kg Flour.
2.  **Stock Deduction**:
    *   *Action*: Confirm an order for 5 "Pizza Base".
    *   *Expectation*: "Flour" stock reduces to 9.0kg (10 - 5*0.2).
    *   *Verification*: Check `GET /api/v1/tenant/{slug}/inventory/ingredients/`.

## 4. UAT Testing (End-to-End Scenarios)

These scenarios simulate real-world usage.

### Scenario A: "The Dinner Rush"
**Actors**: Waiter, Kitchen Staff, Cashier.

1.  **Waiter**: Scans Table 5 QR code (or selects manually). Adds 2 Burgers (No Onions) and 1 Coke. Places Order.
2.  **System**: Validates stock. Creates Order #123.
3.  **Kitchen**: Screen beeps (WebSocket). Chef sees "2 Burgers, 1 Coke".
4.  **Kitchen**: Chef marks order as "Preparing".
5.  **Waiter**: Checks status, informs customer "It's cooking".
6.  **Kitchen**: Chef marks "Ready".
7.  **Waiter**: Serves food.
8.  **Cashier**: Customer asks for bill. Cashier marks Order as "Completed" and records payment.

### Scenario B: "Out of Stock"
**Actors**: Manager, Waiter.

1.  **Manager**: Updates Inventory of "Steak" to 0.
2.  **Waiter**: Tries to place order for Steak.
3.  **System**: *Future Improvement*: Should warn or block order (Currently: Allows, but stock goes negative or needs manual check).
    *   *UAT Note*: Verify if negative stock handling is acceptable for business logic.

## 5. Bug Reporting

When finding an issue, report with:
*   **Step**: Exact API call or Action.
*   **Expected**: What should happen.
*   **Actual**: What happened (Error code, Traceback).
*   **Logs**: Check terminal output for Django/Daphne logs.
