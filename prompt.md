# HP Accounting Software — System Overview & Architecture

HP Accounting Software is a specialized inventory and financial management system designed for **Hemant Plast**. It tracks the inward and outward flow of materials between sellers, jobbers, and vendors, while maintaining precise stock records and financial balances.

---

## 🚀 Technology Stack

### Frontend
- **Framework**: React 18+ (Vite)
- **Routing**: React Router DOM (v6+) — Uses URL-based navigation for all pages and detail views (e.g., `/job-report/:id`, `/seller-report/:id`).
- **Styling**: Tailwind CSS (Premium theme with Slate/Blue palette, custom layers, and Google Fonts Inter typography)
- **Icons**: Lucide React
- **State Management**: Local React state (`useState`, `useEffect`) combined with `useOutletContext` for dynamic header actions.
- **Components**: 
  - `DataTable.jsx`: Reusable table with inline editing, computed fields, and deletion support.
  - `DateField.jsx`: Specialized date input with shortcut support.
  - `DeleteMasterModal.jsx`: Modal for confirmation of deleting jobbers/sellers.
  - `MainLayout.jsx`: Master layout with a persistent sidebar and dynamic header.

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL (pg)
- **Networking**: Configured for Local Area Network (LAN) access. The server auto-discovers and logs the local IP address on startup.

---

## 📂 Project Structure

```text
HP_Accounting_Software/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/     # UI Components (DataTable, Header, Sidebar, DateField, DeleteMasterModal)
│   │   ├── constants/      # App Constants & Configurations (pageConfig.js)
│   │   ├── layouts/        # Page Layouts (MainLayout with dynamic Header)
│   │   ├── pages/          # Application Views (Material-In, Material-Transfer, Material-Out, Reports)
│   │   ├── App.jsx         # Router & Route Definitions
│   │   ├── config.js       # Centralized API Base URL (LAN-aware)
│   │   └── index.css       # Global Styles (Tailwind CSS with Google Fonts directives)
├── server/                 # Express Backend
│   ├── config/             # DB Connection (PostgreSQL)
│   ├── controllers/        # Route Handlers (Transaction, Report, Adjustment logic)
│   ├── routes/             # API Endpoint Definitions
│   ├── migrate.js          # DB Migration Script
│   ├── schema.sql          # DB Initialization Script
│   ├── setup-db.js         # DB Setup & Remark Verification Script
│   └── index.js            # Entry Point & LAN Auto-Discovery
├── api.md                  # API Documentation
├── db.md                   # Database Schema Reference
└── prompt.md               # This documentation (Single Source of Truth)
```

---

## 🛠️ Core Features & Business Logic

### 1. Material Management (IN/OUT)
- **Mutual Exclusion**: For any entry, users can enter either **Type 1** or **Type 2** quantity, but not both. Entering one automatically clears the other.
- **Computed Amounts**: 
  - Total = `(Type1 + Type2) * Rate`.
  - **GST Flag ('B')**: Enabling the 'B' flag adds an 18% surcharge to the total amount.
- **Auto-Master Creation**: Typing a new Jobber, Seller, or Vendor name in a combobox automatically creates that record in the database upon saving the transaction.
- **Case Sensitivity**: All names and remarks are automatically converted to **Title Case** on the backend to maintain data consistency.

### 2. Advanced Reporting
- **Jobber Reports**: Consolidated ledger showing IN, OUT, and Adjustments. Calculates Dynamic Opening and Closing stocks per material type based on the selected month/year.
- **Seller Reports**: Historical supply records and payment/adjustment tracking.
- **Filtering**: Real-time searching by Material, Party Name, and Month/Year filtering across all transaction views.

### 3. Adjustment System
- **Payments & Deductions**: Manual financial corrections (Credits/Debits) can be added to Jobber and Seller accounts via the "PAY" or "Adjustment" buttons in report views. These affect financial balances without altering physical stock counts.

### 4. Material Transfers
- **Internal Movement**: Physical material movements directly from a sender Jobber to a receiver Jobber. Lacks rates, billing, or GST flags.
- **Stock Calculations**: Outbound transfers decrease the sender's live stock; inbound transfers increase the receiver's live stock in all stock reports and jobber ledgers.
- **Report Placement**: Outbound transfers are listed in the Jobber Report under **Material Outward (OUT)**, and inbound transfers are listed under **Material Inward (IN)**.
- **Read-Only Ledger Rows**: Transfer records shown in jobber ledger reports are flagged as read-only (omits editing inline) to ensure database integrity between the two jobber accounts. They can still be deleted securely via administrator password.

---

## 🔑 Key Technical Implementation

- **Dynamic Headers**: The `MainLayout` provides a `setHeaderActions` function via `useOutletContext`. Pages use this to inject toolbar buttons (New Entry, Refresh, Filter, etc.) directly into the global header.
- **Local Network Access**: 
  - The server binds to all network interfaces (`0.0.0.0` or local IP).
  - Vite is configured with `host: true` to serve the frontend over the network.
  - `client/src/config.js` uses a relative path `'/api'` for `API_BASE_URL`, allowing seamless use on multiple devices (Phones, Tablets, Laptops) within the same WiFi network because the Express server serves both the React app and the API.
- **Secure Deletion**: 
  - Deleting transactions or adjustments requires the `x-delete-password` header.
  - Deleting masters (Jobbers/Sellers) requires the password in the request body.
- **Decimal Precision**: Numerical values use `NUMERIC` in PostgreSQL. Invoices and Reports are formatted to display consistently with 0 or 2 decimal places.

---

## 🎨 Design Philosophy

- **Premium Interface**: A sleek dark sidebar (`#1E293B`) paired with a clean, airy main content area (`#F8FAFC`).
- **Interactive Tables**: Horizontally scrollable tables designed for high-density accounting data, featuring sticky headers and highlighted "Total" rows.
- **Performance**: Optimized SQL queries with proper indexing ensure fast report generation even with large datasets.

---

*This document serves as the Single Source of Truth (SSOT) for the HP Accounting Software project.*
