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
| `/api/jobbers/:id` | `DELETE` | Delete a jobber — Body: `{ password }` |
| `/api/sellers` | `GET` | List all sellers |
| `/api/sellers` | `POST` | Create a seller `{ name }` |
| `/api/sellers/:id` | `DELETE` | Delete a seller — Body: `{ password }` |
| `/api/vendors` | `GET` | List all vendors |
| `/api/vendors` | `POST` | Create a vendor `{ name }` |

---

## 📊 Transactions

### Material-In
| Endpoint | Method | Description |
|---|---|---|
| `/api/transactions/in` | `GET` | List all inward transactions |
| `/api/transactions/in` | `POST` | Create inward entry |
| `/api/transactions/in/:id` | `PUT` | Update inward entry |
| `/api/transactions/in/:id` | `DELETE` | Delete inward entry* |
| `/api/transactions/in/:jobberId` | `GET` | List inward transactions for a specific jobber |

### Material-Out
| Endpoint | Method | Description |
|---|---|---|
| `/api/transactions/out` | `GET` | List all outward transactions |
| `/api/transactions/out` | `POST` | Create outward entry |
| `/api/transactions/out/:id` | `PUT` | Update outward entry |
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

## 🛡️ Notes & Security

- **Security**: Deletion for Transactions and Adjustments requires the `x-delete-password` header. Deletion for Masters (Jobbers/Sellers) requires the password in the JSON request body.
- **Auto-Creation**: Masters are automatically created by the frontend/backend if a new name is provided during transaction entry.
- **Title Case**: All names and remarks are automatically converted to Title Case on the backend.


