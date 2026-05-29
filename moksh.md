# Seller Pages Architecture

This document provides technical details regarding the routing, database structures, and rendering logic for the "Sellers List" and "Individual Seller" pages in the HP Accounting Software.

---

## 1. Sellers List Page

**Overview:** 
Displays a grid of all registered sellers (material suppliers). It allows users to view the list, navigate to an individual seller's report, and perform edit/delete operations.

**Routing:**
- **Path:** `/seller-report`
- **Component:** `client/src/pages/SellerReport.jsx` (rendered via `App.jsx`)

**Database Tables Attached:**
- `sellers`: The primary master table providing the id and name of each seller.

**Rendering & API Usage:**
- **Fetching Data:** On component mount (`useEffect`), it fetches the complete list of sellers.
  - **API:** `GET /api/sellers`
- **Rendering Logic:** The data is held in local React state (`sellers`). It renders a loading state, an empty state, or a responsive grid layout. Each seller card includes hover effects and action buttons (View, Edit, Delete).
- **Edit/Rename Action:** Triggers a modal. On save, updates the seller name.
  - **API:** `PUT /api/sellers/:id` (Body: `{ name }`)
- **Delete Action:** Triggers a confirmation modal requiring a password.
  - **API:** `DELETE /api/sellers/:id` (Body: `{ password }`)
- **Navigation:** Clicking "View Report" or the card itself routes the user to `/seller-report/:id`.

---

## 2. Individual Seller Page (Seller Report)

**Overview:** 
Displays a detailed ledger for a specific seller, showing historical material supplies (`transactions_in`), financial adjustments/payments (`seller_adjustments`), and dynamic calculation of opening/closing balances based on month and year filtering.

**Routing:**
- **Path:** `/seller-report/:id`
- **Component:** `client/src/pages/SellerReportDetail.jsx` (rendered via `App.jsx`)

**Database Tables Attached:**
- `sellers`: For retrieving the active seller's details.
- `jobbers`: For populating dropdowns (combobox) when updating transaction destinations.
- `transactions_in`: To pull all inward material records associated with the seller (`tx_type = 'IN'`).
- `seller_adjustments`: To pull all financial payments/deductions associated with the seller (`tx_type = 'IN_ADJ'`).

**Rendering & API Usage:**
- **Fetching Master Data:** On mount, it fetches the list of jobbers and sellers to ensure ID resolution and combobox options.
  - **API:** `GET /api/jobbers` and `GET /api/sellers`
- **Fetching Report Data:** Once the specific seller is identified, it fetches their complete transaction and adjustment history.
  - **API:** `GET /api/seller-report/:sellerName`
- **Data Processing (Rendering Logic):**
  - **Filtering:** Groups transactions based on a selected Year and Month.
  - **Calculations:** 
    - `Opening Balance`: Sum of material amounts (`+`) and adjustments (`-`) from all prior dates before the currently selected month.
    - `Closing Balance`: Opening Balance + Net Amount of the selected month.
  - **Table Injection:** Uses a custom `DataTable` component. The `prepareTableData` function injects computed rows like "GROSS TOTAL", "NET TOTAL", and a draft row for new adjustments.
- **Modifying Records (Inline):**
  - Updating a material transaction triggers `PUT /api/transactions/in/:id`.
  - Adding/Updating an adjustment (payment) triggers `POST /api/seller-adjustments` or `PUT /api/seller-adjustments/:id`.
  - Deleting records triggers `DELETE /api/transactions/in/:id` or `DELETE /api/seller-adjustments/:id` (requires `x-delete-password` header).
  - If a user types a new Jobber name into the table, the component automatically ensures the master record exists by calling `POST /api/jobbers` before saving the transaction.
- **Pagination & UI:** Provides a sticky header showing live balances and a bottom bar to flip through months and years.
