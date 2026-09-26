# StockSense

StockSense is an inventory management system for products, warehouses, and stock movements. It replaces scattered spreadsheets with one record of what is on hand, where it sits, and how it got there.

## Features

- Sign up, login, logout, and OTP password reset
- Inventory Manager and Warehouse Staff roles
- Products, categories, and reorder rules
- Multi-warehouse locations
- Receipts, deliveries, internal transfers, and physical adjustments
- Stock ledger that cannot be edited
- Dashboard KPIs, filters, and charts from live MongoDB data
- Search, filters, sorting, and pagination
- Low-stock and out-of-stock alerts

## MERN stack

- React, Vite, React Router, Axios
- Node.js, Express, Mongoose
- MongoDB

```text
React → Axios → Express REST API → Mongoose → MongoDB
```

## Architecture

The frontend in `client/` only displays and submits data. Stock changes happen in `server/services/stockService.js`:

```text
Receipt     → increase stock
Delivery    → decrease stock, rejected when quantity is not available
Transfer    → move quantity between locations, company total stays the same
Adjustment  → set the counted quantity and record the difference
Ledger      → one history row for every change
```

Receipts, deliveries, transfers, and adjustments change stock only when they are validated. MongoDB transactions keep the stock update and the ledger row together. MongoDB must run as a replica set so those transactions work.

## Installation

```bash
npm run install:all
copy server\.env.example server\.env
copy client\.env.example client\.env
```

Set `JWT_SECRET` in `server/.env` before sharing the app. The example value is only for local development.

## Environment variables

Server (`server/.env`):

| Name | Purpose |
| --- | --- |
| `PORT` | API port, default `5000` |
| `MONGO_URI` | MongoDB connection string, including the replica set name |
| `CLIENT_ORIGIN` | Frontend origin allowed by CORS |
| `JWT_SECRET` | Secret used to sign login and reset tokens |
| `NODE_ENV` | `development` or `production` |

Client (`client/.env`):

| Name | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | API base URL, default `http://localhost:5000/api` |

## MongoDB setup

Install MongoDB and start it as a single-node replica set. Transactions fail on a standalone server.

```bash
mkdir .mongo
mongod --replSet rs0 --dbpath .mongo --bind_ip 127.0.0.1 --port 27018
```

In another terminal:

```bash
mongosh --port 27018 --eval "rs.initiate({_id:'rs0',members:[{_id:0,host:'127.0.0.1:27018'}]})"
```

Then set:

```text
MONGO_URI=mongodb://127.0.0.1:27018/stocksense?replicaSet=rs0
```

If you enable `replication.replSetName: rs0` on the Windows MongoDB service instead, you can use port `27017`.

## Development commands

```bash
npm run dev:server
npm run dev:client
```

- App: http://localhost:5173
- Health: http://localhost:5000/api/health

## Seed demo data

Seeding is manual. The API does not load demo data on startup.

```bash
npm run seed
```

`npm run seed:reset` clears the StockSense collections and loads them again. It does not drop other databases.

A fresh seed includes at least:

- 8 users
- 12 categories
- 4 warehouses and 24 locations
- 80 products
- 40 receipts and 120 receipt lines
- 48 deliveries and 152 delivery lines
- 30 transfers
- 25 adjustments
- 200 ledger rows
- 54 reorder rules

## Demo accounts

Password for every demo account: `StockSense#2026`

| Role | Email |
| --- | --- |
| Inventory Manager | `manager@stocksense.demo` |
| Warehouse Staff | `staff@stocksense.demo` |
| Unverified account | `unverified@stocksense.demo` |

Warehouse Staff can view inventory and process receipts, deliveries, transfers, and counts. They cannot create products, categories, warehouses, locations, or reorder rules.

In local development, password-reset codes are printed in the API log. They are not returned by the API. Production does not write those codes when `NODE_ENV=production`.

## API overview

Authenticated routes expect `Authorization: Bearer <token>`.

```text
POST   /api/auth/signup
POST   /api/auth/login
POST   /api/auth/forgot-password
POST   /api/auth/verify-otp
POST   /api/auth/reset-password
POST   /api/auth/logout
GET    /api/auth/me

GET    /api/dashboard
GET    /api/alerts

GET    /api/products
POST   /api/products
GET    /api/products/:id
PUT    /api/products/:id
DELETE /api/products/:id

GET    /api/categories
POST   /api/categories
PUT    /api/categories/:id
DELETE /api/categories/:id

GET    /api/receipts
POST   /api/receipts
GET    /api/receipts/:id
PUT    /api/receipts/:id
POST   /api/receipts/:id/validate
POST   /api/receipts/:id/cancel

GET    /api/deliveries
POST   /api/deliveries/:id/validate

GET    /api/transfers
POST   /api/transfers/:id/validate

GET    /api/adjustments
POST   /api/adjustments/:id/validate

GET    /api/ledger
GET    /api/warehouses
GET    /api/locations
GET    /api/reorder-rules
```

List routes accept `page` and `limit`, for example `?page=1&limit=20`.

## Folder structure

```text
client/src
  components/   shared UI and layout
  pages/        screens
  features/     document workflows shared by operations
  services/     Axios API calls
  context/      auth and toasts
  routes/       public and protected routes
server
  models/       Mongoose schemas
  services/     stock and document rules
  controllers/  HTTP handlers
  routes/       REST routes
  middleware/   auth, roles, errors
  seed/         demo data
```

## Stock flow

```text
Receipt     → stock increases
Delivery    → stock decreases
Transfer    → location changes, total stays the same
Adjustment  → physical count replaces the system count
Ledger      → records previous quantity, new quantity, user, and reason
```

Negative stock is rejected. A delivery or transfer larger than the source location returns `Insufficient stock available.` or `Insufficient stock at the source location.`
