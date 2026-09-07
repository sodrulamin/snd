# VoIP Recharge Card Sales & Distribution (S&D) Platform

An enterprise-grade, full-stack Sales and Distribution system for VoIP Recharge Cards built with **Spring Boot 3 (Java 21)**, **MySQL (Flyway Migrations)**, and **React (Vite + Tailwind CSS)**.

---

## 🌟 Key Features

1. **Recharge Card Inventory Management**:
   - Multi-tier Denominations ($5, $10, $20, $50, $100 or custom values).
   - High-throughput cryptographic batch generator producing unique serialized cards with AES-256 encrypted PINs and SHA-256 validation hashes.
   - Status tracking across lifecycle: `IN_STOCK`, `ALLOCATED`, `SOLD`, `REDEEMED`, `VOID`.
   - Security PIN masking (`•••• •••• 1234`) and role-based Plaintext PIN reveal / CSV export for distributors.

2. **Distributor Network & Sales Workflow**:
   - Wholesale Distributor directory with credit limits, customized volume discount rates, and live wallet balances.
   - Intelligent Sales Order checkout with atomic card allocation from available batches.
   - Instant Printable Sales Voucher & Invoicing with QR/voucher headers.
   - Dedicated Distributor Transaction Ledger for wallet top-ups, bank wire credits, and invoice deductions.

3. **Analytics & Financial Reporting**:
   - Executive Dashboard with live KPIs: Total Net Revenue, Gross Wholesale Face Value, Cards Sold, Available Inventory, Low Stock alerts.
   - Time-series Revenue Trend area charts & Denomination market share donut charts.
   - Date-range filtered financial reports with CSV export.

4. **Public VoIP Card Redemption API & Simulator**:
   - High-speed `POST /api/voip/redeem` endpoint for VoIP softswitch / billing server integration.
   - Interactive scratch-off simulator terminal to test end-user PIN redemption.
   - Replay attack & fraud prevention rejecting already redeemed or voided cards.

5. **JWT Authentication & Security**:
   - Role-Based Access Control (`ROLE_ADMIN`, `ROLE_DISTRIBUTOR`).
   - BCrypt password hashing and Spring Security stateless filter chain.

---

## 🚀 Quick Start Guide

### Prerequisites
- Java 21+ & Maven 3.9+
- Node.js 18+ & NPM
- MySQL 8.0 on `localhost:3306` (Database: `snd_db`, User: `root`, Password: `rootpassword`)

### Run Backend
Double-click `start-backend.bat` or run:
```bash
cd backend
mvn spring-boot:run
```
Backend API will be live on: `http://localhost:8081`

### Run Frontend
Double-click `start-frontend.bat` or run:
```bash
cd frontend
npm run dev
```
Frontend UI will be live on: `http://localhost:5173`

---


---

## 🐳 Run with Docker & Docker Compose

To launch the complete application stack (MySQL 8.0, Spring Boot Backend, and React + Nginx Frontend) with a single command:

```bash
# 1. Build and run all services in background
docker compose up --build -d

# 2. View live logs
docker compose logs -f

# 3. Stop all services
docker compose down
```

### Docker Services & Ports:
- **Frontend (React + Nginx)**: [http://localhost](http://localhost) (Port 80)
- **Backend API (Spring Boot)**: [http://localhost:8081](http://localhost:8081) (Port 8081)
- **Database (MySQL 8.0)**: `localhost:3306` (Volume persisted in `snd_mysql_data`)

## 🔑 Default Credentials

| Portal Role | Username | Password | Notes |
|---|---|---|---|
| **System Admin** | `admin` | `admin123` | Full access to batches, orders, partners, reports |
| **Distributor** | `dist_metro` | `dist123` | Metro Telecom Partner account |
| **Distributor** | `dist_apex` | `dist123` | Apex Global Connect account |

---

## 📡 Core API Endpoints

- `POST /api/auth/login` - User login & JWT issuance
- `GET /api/dashboard/summary` - Metrics & KPI charts data
- `GET /api/inventory/denominations` - List active VoIP card values
- `POST /api/inventory/batches/generate` - Generate new card batch with encrypted PINs
- `GET /api/inventory/cards` - Search & filter cards (with optional Plain PIN reveal)
- `GET /api/inventory/cards/export/csv` - Download CSV of batch or order cards
- `POST /api/sales/orders` - Create sales order & allocate cards
- `GET /api/sales/orders/{id}/invoice` - Fetch printable invoice data
- `GET /api/distributors` - List partner distributors & balances
- `POST /api/distributors/wallet-adjustment` - Credit / debit distributor wallet
- `POST /api/voip/redeem` - Public VoIP customer recharge endpoint
- `GET /api/reports/financial` - Filterable revenue report