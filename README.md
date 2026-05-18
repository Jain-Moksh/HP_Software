# HP Accounting Software (Hemant Plast ERP)

HP Accounting Software is a custom-built inventory management and financial tracking system designed specifically for **Hemant Plast**. It simplifies the process of recording material movements (Inward, Outward, and internal Jobber-to-Jobber Transfers), tracks live stocks and financial balances, manages client reports, and handles automatic scheduled system backups.

---

## ✨ Features

- **Material Flows**: Easily log and update Material Inward (from Sellers to Jobbers) and Material Outward (from Jobbers to Vendors).
- **Mutual Exclusion**: Smart validation ensures either Type 1 or Type 2 material quantities are entered per row (not both).
- **Internal Transfers**: Log physical stock transfers from one Jobber to another. Live stock calculations adjust dynamically.
- **Dynamic Reports**: Detailed, real-time ledgers for both Jobbers (including monthly stock updates and opening/closing stock calculations) and Sellers (supply records and payment history).
- **Financial Adjustments**: Post manual credits, debits, payments, and corrections to settle accounts without affecting physical inventory.
- **LAN-Ready Access**: Auto-discovers local server IP on startup, making the system accessible to any device (tablets, mobiles, laptops) on the same WiFi/local network.
- **Automatic Backups**: Scheduled background backups to save database states programmatically, alongside manual `.sql` file backup downloads and one-click database restorations.
- **Admin Security**: Deletion requests are safeguarded using a configurable delete authorization password.

---

## 🛠️ Tech Stack

- **Frontend**: React 18 (Vite), React Router DOM (v6+), Tailwind CSS, Lucide React icons.
- **Backend**: Node.js, Express.js.
- **Database**: PostgreSQL with custom schema, constraints, and query indexes.

---

## 🚀 Quick Start & Installation

### 1. Prerequisites
- **Node.js** (v16+)
- **npm** (v8+)
- **PostgreSQL** database server running locally or on the network.

### 2. Environment Configuration
Navigate to the `server` directory, duplicate the environment template, and rename it to `.env`:
```bash
cd server
cp .env.example .env
```
Open `.env` and update the connection details for your PostgreSQL server:
```ini
PORT=5000
DB_USER=your_postgres_user
DB_PASSWORD=your_postgres_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hp
del_pass=your_secure_delete_password
```

### 3. Database Initialization
Run the built-in database setup script to verify and provision the PostgreSQL database:
```bash
node setup-db.js
```
*Note: This script checks for the presence of the `hp` database (or custom database named in your `.env`), creates it if it doesn't exist, and creates the required schemas and indexes without dropping any existing records.*

### 4. Running the Software

#### Method A: Automated Start (Windows)
Double-click the `start.bat` file in the root directory. This script will automatically:
1. Install client dependencies and build the static frontend.
2. Install server dependencies.
3. Start the Express server, serve the React app, and launch your default browser!

#### Method B: Manual Command Line Start
**Build the Frontend:**
```bash
cd client
npm install
npm run build
cd ..
```

**Start the Server:**
```bash
cd server
npm install
npm start
```
The server will output the URL (e.g. `http://192.168.1.10:5000`) and launch a browser tab automatically.

---

## 📂 Documentation Guides

For in-depth explanations, refer to these references located in the root folder:
- 📖 [prompt.md](file:///prompt.md): The master architectural documentation (Single Source of Truth).
- 🔌 [api.md](file:///api.md): Complete list of RESTful API endpoints and parameters.
- 💾 [db.md](file:///db.md): Detailed database table schema, constraints, and indexes.

---

## 🛡️ License and Credits

Developed exclusively for **Hemant Plast** by Moksh Software Solutions.
