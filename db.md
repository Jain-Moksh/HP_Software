# Database Schema & Reference

This document provides a detailed reference for the PostgreSQL database used in the HP Accounting Software.

---

## 🏗️ Master Tables

### `jobbers`
Stores information about the processing entities.
| Column | Type | Description |
|---|---|---|
| `id` | SERIAL | Primary Key |
| `name` | VARCHAR(255) | Unique name of the jobber (Title Case) |
| `created_at` | TIMESTAMP | Creation timestamp |

### `sellers`
Stores information about material suppliers.
| Column | Type | Description |
|---|---|---|
| `id` | SERIAL | Primary Key |
| `name` | VARCHAR(255) | Unique name of the seller (Title Case) |
| `created_at` | TIMESTAMP | Creation timestamp |

### `vendors`
Stores information about material recipients.
| Column | Type | Description |
|---|---|---|
| `id` | SERIAL | Primary Key |
| `name` | VARCHAR(255) | Unique name of the vendor (Title Case) |
| `created_at` | TIMESTAMP | Creation timestamp |

---

## 📊 Transaction Tables

### `transactions_in`
Records material flowing from **Sellers** to **Jobbers**.
| Column | Type | Description |
|---|---|---|
| `id` | SERIAL | Primary Key |
| `jobber_id` | INTEGER | FK → `jobbers.id` (ON DELETE CASCADE) |
| `seller_id` | INTEGER | FK → `sellers.id` (ON DELETE CASCADE) |
| `type1` | NUMERIC | Quantity for Material Type 1 |
| `type2` | NUMERIC | Quantity for Material Type 2 |
| `material` | VARCHAR(255) | Description of the material |
| `rate` | NUMERIC | Price per unit |
| `amount` | NUMERIC | Computed total: `(type1 + type2) * rate` (+18% if `b` is true) |
| `date` | DATE | Transaction date |
| `remark` | TEXT | Optional notes |
| `w`, `b`, `a` | BOOLEAN | Category flags (e.g., 'b' indicates 18% GST calculation) |
| `created_at` | TIMESTAMP | Creation timestamp |

### `transactions_out`
Records material flowing from **Jobbers** to **Vendors**.
| Column | Type | Description |
|---|---|---|
| `id` | SERIAL | Primary Key |
| `jobber_id` | INTEGER | FK → `jobbers.id` (ON DELETE CASCADE) |
| `vendor_id` | INTEGER | FK → `vendors.id` (ON DELETE CASCADE) |
| `type1`, `type2` | NUMERIC | Quantities |
| `material` | VARCHAR(255) | Description |
| `rate`, `amount` | NUMERIC | Price and Total |
| `date` | DATE | Transaction date |
| `remark` | TEXT | Optional notes |
| `w`, `b`, `a` | BOOLEAN | Category flags |
| `created_at` | TIMESTAMP | Creation timestamp |

---

## 🔧 Adjustment Tables

### `jobber_adjustments`
Financial corrections (Payments/Deductions) for jobber accounts.
| Column | Type | Description |
|---|---|---|
| `id` | SERIAL | Primary Key |
| `jobber_id` | INTEGER | FK → `jobbers.id` |
| `amount` | NUMERIC | Adjustment value |
| `date` | DATE | Adjustment date |
| `remark` | TEXT | Reason for adjustment |
| `created_at` | TIMESTAMP | Creation timestamp |

### `seller_adjustments`
Financial corrections for seller accounts.
| Column | Type | Description |
|---|---|---|
| `id` | SERIAL | Primary Key |
| `seller_id` | INTEGER | FK → `sellers.id` |
| `amount` | NUMERIC | Adjustment value |
| `date` | DATE | Adjustment date |
| `remark` | TEXT | Reason for adjustment |
| `created_at` | TIMESTAMP | Creation timestamp |

---

## 🚀 Performance Indexes

To ensure fast reporting and filtering, the following indexes are implemented:

- **`idx_in_jobber`**: `transactions_in(jobber_id)`
- **`idx_in_date`**: `transactions_in(date)`
- **`idx_out_jobber`**: `transactions_out(jobber_id)`
- **`idx_out_date`**: `transactions_out(date)`

---

## 🛡️ Business Rules & Constraints

- **Case Insensitivity**: Masters (Jobbers, Sellers, Vendors) are stored in **Title Case** to prevent duplicates like "Apple" and "apple".
- **Cascading Deletes**: 
  - Deleting a **Jobber** automatically deletes all their `transactions_in`, `transactions_out`, and `jobber_adjustments`.
  - Deleting a **Seller** automatically deletes all their `transactions_in` and `seller_adjustments`.
- **Decimal Precision**: All currency and quantity fields use `NUMERIC` for exact precision. Rates and Amounts are often rounded to 0 or 2 decimal places in reports.
- **Mutual Exclusion**: For material entries, `type1` and `type2` are mutually exclusive; only one can have a non-zero value per entry.
