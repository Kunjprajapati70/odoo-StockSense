# StockSense

Inventory management system built as a separated MERN application. This repository currently contains the project structure and runtime setup. Business features are not implemented yet.

```text
React.js → Axios → Express.js REST API → Node.js → Mongoose → MongoDB
```

## Structure

```text
client/   React + Vite frontend
server/   Express + Mongoose API
```

Frontend modules live under `client/src` (`pages`, `components`, `layouts`, `routes`, `services`, `context`). API modules live under `server` (`config`, `routes`, `controllers`, `models`, `middleware`, `validators`, `utils`).

## Requirements

- Node.js 20 or newer
- MongoDB running locally, or a MongoDB connection string

## Setup

```bash
npm run install:all
```

Copy the environment examples and adjust them if needed:

```bash
copy client\.env.example client\.env
copy server\.env.example server\.env
```

`client/.env.example` and `server/.env.example` already match the local defaults, so the apps can start without those copies.

## Run

Start the API:

```bash
npm run dev:server
```

Start the frontend in a second terminal:

```bash
npm run dev:client
```

- Frontend: http://localhost:5173
- API health: http://localhost:5000/api/health

The health response reports whether MongoDB is connected. The API still starts if the database is unavailable. Feature routes are mounted and return `404` until those modules are implemented.

## Not included yet

Authentication, products, warehouse operations, alerts, filters, and inventory data are left for later modules. There is no demo stock data in this setup.
