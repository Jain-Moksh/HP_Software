# API Documentation

The HP Accounting Software backend is a RESTful API built with Express.js.

**Base URL**: 
- **Server**: `http://localhost:5000` (or `http://<local-ip>:5000` for network access)
- **Frontend**: Derived dynamically or using relative `/api` path.

---

## 🏗️ Master Entities

| Endpoint | Method | Description |
|---|---|---|
| `/api/jobbers` | `GET` | List all jobbers |
| `/api/jobbers` | `POST` | Create a jobber `{ name }` |
| `/api/jobbers/:id` | `PUT` | Rename a jobber `{ name }` |
| `/api/jobbers/:id` | `DELETE` | Delete a jobber — Body: `{ password }` |
| `/api/sellers` | `GET` | List all sellers |
| `/api/sellers` | `POST` | Create a seller `{ name }` |
| `/api/sellers/:id` | `PUT` | Rename a seller `{ name }` |
| `/api/sellers/:id` | `DELETE` | Delete a seller — Body: `{ password }` |
| `/api/vendors` | `GET` | List all vendors |
| `/api/vendors` | `POST` | Create a vendor `{ name }` |

---

## 📊 Transactions

### Material-In
| Endpoint | Method | Description |
|---|---|---|
| `/api/transactions/in` | `GET` | List all inward transactions |
| `/api/transactions/in` | `POST` | Create inward entry `{ jobber_id, seller_id, type1, type2, material, rate, amount, date, remark, w, b, a }` (jobber_id, seller_id, date are required) |
| `/api/transactions/in/:id` | `PUT` | Update inward entry `{ jobber_id, seller_id, type1, type2, material, rate, amount, date, remark, w, b, a }` |
| `/api/transactions/in/:id` | `DELETE` | Delete inward entry* |
| `/api/transactions/in/:jobberId` | `GET` | List inward transactions for a specific jobber |

### Material Transfers (Internal Stock Movement)
| Endpoint | Method | Description |
|---|---|---|
| `/api/transactions/transfer` | `GET` | List all material transfers |
| `/api/transactions/transfer` | `POST` | Create material transfer `{ from_jobber_id, to_jobber_id, type1, type2, material, date, remark }` |
| `/api/transactions/transfer/:id` | `PUT` | Update material transfer `{ from_jobber_id, to_jobber_id, type1, type2, material, date, remark }` |
| `/api/transactions/transfer/:id` | `DELETE` | Delete material transfer* |

### Material-Out
| Endpoint | Method | Description |
|---|---|---|
| `/api/transactions/out` | `GET` | List all outward transactions |
| `/api/transactions/out` | `POST` | Create outward entry `{ jobber_id, vendor_id, type1, type2, material, rate, amount, date, remark, w, b, a }` (jobber_id, vendor_id, date are required) |
| `/api/transactions/out/:id` | `PUT` | Update outward entry `{ jobber_id, vendor_id, type1, type2, material, rate, amount, date, remark, w, b, a }` |
| `/api/transactions/out/:id` | `DELETE` | Delete outward entry* |
| `/api/transactions/out/:jobberId` | `GET` | List outward transactions for a specific jobber |

### Filtering & Lookups
| Endpoint | Method | Description |
|---|---|---|
| `/api/transactions/seller/:sellerId` | `GET` | Get all transactions associated with a seller |
| `/api/transactions/vendor/:vendorId` | `GET` | Get all transactions associated with a vendor |

---

## 📈 Reports

| Endpoint | Method | Description |
|---|---|---|
| `/api/job-report/:jobberName` | `GET` | Get full ledger and stock for a jobber |
| `/api/seller-report/:sellerName` | `GET` | Get transaction history for a seller |
| `/api/stock/jobber/:jobberId` | `GET` | Get current stock totals for a specific jobber |

---

## 🔧 Adjustments

### Jobber Adjustments
- `GET /api/adjustments/jobber/:jobberId`: Fetch adjustments for a jobber.
- `POST /api/adjustments`: Create adjustment `{ jobber_id, amount, date, remark }`.
- `PUT /api/adjustments/:id`: Update adjustment.
- `DELETE /api/adjustments/:id`: Delete adjustment.*

### Seller Adjustments
- `GET /api/seller-adjustments/seller/:sellerId`: Fetch adjustments for a seller.
- `POST /api/seller-adjustments`: Create adjustment `{ seller_id, amount, date, remark }`.
- `PUT /api/seller-adjustments/:id`: Update adjustment.
- `DELETE /api/seller-adjustments/:id`: Delete adjustment.*

---

## 🔧 Utility Tools

| Endpoint | Method | Description |
|---|---|---|
| `/api/utility/backup/config` | `GET` | Retrieve the automatic backup settings |
| `/api/utility/backup/config` | `POST` | Update the automatic backup settings `{ enabled, interval, path }` |
| `/api/utility/backup/download` | `GET` | Stream and download a manual `.sql` snapshot of the database |
| `/api/utility/restore` | `POST` | Upload and restore the system state from a `.sql` backup file `{ sql }` |

---

## 🛡️ Notes & Security

- **Security**: Deletion for Transactions, Material Transfers, and Adjustments requires the `x-delete-password` header. Deletion for Masters (Jobbers/Sellers) requires the password in the JSON request body.
- **Auto-Creation**: Masters are automatically created by the frontend/backend if a new name is provided during transaction entry.
- **Title Case**: All names and remarks are automatically converted to Title Case on the backend.
