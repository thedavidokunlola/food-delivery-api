# 🍔 Lagos Food Delivery Market API

A public REST API for a Lagos-based food delivery marketplace. Browse restaurants, explore menus, place orders, and track delivery status — all through a clean, versioned API.

> **Base URL:** `https://food-delivery-api-production-b47b.up.railway.app/api/v1`
>
> **No authentication required** for any endpoint. This API is open for reading by anyone on the internet.

---

## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
- [Authentication](#authentication)
- [Rate Limiting](#rate-limiting)
- [Response Format](#response-format)
- [Endpoints](#endpoints)
  - [Restaurants](#restaurants)
  - [Menu Items](#menu-items)
  - [Orders](#orders)
- [Design Decisions](#design-decisions)

---

## Overview

This API powers a Lagos food delivery market with four interconnected resources:

| Resource       | Description                              |
| -------------- | ---------------------------------------- |
| **Restaurants** | Lagos eateries with cuisine, rating, and delivery info |
| **Menu Items**  | Food items belonging to a restaurant     |
| **Orders**      | Customer orders placed at restaurants    |
| **Order Items** | Individual items within an order         |

### Versioning

All endpoints are prefixed with `/api/v1/`. When breaking changes are introduced, a `/api/v2/` prefix will be added — existing `/api/v1/` clients will not break.

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Setup

```bash
# Clone the repository
git clone https://github.com/your-username/food-delivery-api.git
cd food-delivery-api

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your PostgreSQL connection string

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# Seed the database with Lagos restaurants, menus, and orders
npx prisma db seed

# Start the development server
npx ts-node src/server.ts
```

The API will be available at `http://localhost:3000/api/v1`.

---

## Authentication

**No authentication is required.** All endpoints are publicly accessible. Anyone on the internet can call this API.

---

## Rate Limiting

All routes are rate-limited to **100 requests per minute per IP address**.

When the limit is exceeded, the API returns:

```
HTTP/1.1 429 Too Many Requests
Retry-After: 60
```

```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests. Retry after 60 seconds.",
    "retryAfter": 60
  }
}
```

---

## Response Format

### Success Envelope

All list endpoints return:

```json
{
  "data": [...],
  "meta": {
    "total": 50,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

Single resource endpoints return:

```json
{
  "data": { ... }
}
```

### Error Envelope

All errors return:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable description"
  }
}
```

### Error Codes

| Code                        | HTTP Status | Description                       |
| --------------------------- | ----------- | --------------------------------- |
| `NOT_FOUND`                 | 404         | Resource does not exist           |
| `INVALID_PARAMS`            | 400         | Invalid query parameter           |
| `VALIDATION_ERROR`          | 422         | Missing or invalid request body   |
| `RATE_LIMITED`              | 429         | Too many requests                 |
| `INTERNAL_ERROR`            | 500         | Unexpected server error           |
| `INVALID_STATUS_TRANSITION` | 400         | Invalid order status change       |

### Money Format

All monetary values are stored and returned as **integers in kobo** (₦1 = 100 kobo). For example, ₦2,500.00 is represented as `250000`.

---

## Endpoints

### Restaurants

#### List All Restaurants

```
GET /api/v1/restaurants
```

**Query Parameters:**

| Parameter   | Type    | Default | Description                    |
| ----------- | ------- | ------- | ------------------------------ |
| `limit`     | integer | 20      | Items per page (max 100)       |
| `offset`    | integer | 0       | Number of items to skip        |
| `cuisine`   | string  | —       | Filter by cuisine type         |
| `isOpen`    | boolean | —       | Filter by open status          |
| `minRating` | float   | —       | Filter by minimum rating       |
| `sort`      | string  | name    | Sort by: `name`, `rating`, `deliveryTime` |
| `order`     | string  | asc     | Sort order: `asc` or `desc`    |

**Example:**

```bash
curl "https://food-delivery-api-production-b47b.up.railway.app/api/v1/restaurants?cuisine=Nigerian&isOpen=true&sort=rating&order=desc&limit=5"
```

**Response:**

```json
{
  "data": [
    {
      "id": "clx1abc123",
      "name": "Mama Cass",
      "cuisine": "Nigerian",
      "address": "14 Admiralty Way, Lekki Phase 1, Lagos",
      "rating": 4.8,
      "isOpen": true,
      "deliveryTime": 30,
      "minimumOrder": 150000,
      "currency": "NGN",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "meta": {
    "total": 12,
    "limit": 5,
    "offset": 0,
    "hasMore": true
  }
}
```

---

#### Get Restaurant by ID

```
GET /api/v1/restaurants/:id
```

**Example:**

```bash
curl "https://food-delivery-api-production-b47b.up.railway.app/api/v1/restaurants/clx1abc123"
```

**Response:**

```json
{
  "data": {
    "id": "clx1abc123",
    "name": "Mama Cass",
    "cuisine": "Nigerian",
    "address": "14 Admiralty Way, Lekki Phase 1, Lagos",
    "rating": 4.8,
    "isOpen": true,
    "deliveryTime": 30,
    "minimumOrder": 150000,
    "currency": "NGN",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error (404):**

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Restaurant not found"
  }
}
```

---

#### Get Restaurant Menu

```
GET /api/v1/restaurants/:id/menu
```

**Query Parameters:**

| Parameter     | Type    | Default | Description              |
| ------------- | ------- | ------- | ------------------------ |
| `category`    | string  | —       | Filter by: `Starters`, `Mains`, `Drinks`, `Desserts`, `Sides` |
| `isAvailable` | boolean | —       | Filter by availability   |
| `sort`        | string  | name    | Sort by: `name`, `price` |
| `order`       | string  | asc     | Sort order: `asc`, `desc`|
| `limit`       | integer | 20      | Items per page (max 100) |
| `offset`      | integer | 0       | Number of items to skip  |

**Example:**

```bash
curl "https://food-delivery-api-production-b47b.up.railway.app/api/v1/restaurants/clx1abc123/menu?category=Mains&isAvailable=true&sort=price&order=asc"
```

**Response:**

```json
{
  "data": [
    {
      "id": "clx2def456",
      "restaurantId": "clx1abc123",
      "name": "Jollof Rice & Chicken",
      "description": "Smoky party-style jollof rice served with grilled chicken",
      "price": 350000,
      "currency": "NGN",
      "category": "Mains",
      "isAvailable": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "meta": {
    "total": 6,
    "limit": 20,
    "offset": 0,
    "hasMore": false
  }
}
```

---

### Menu Items

#### List All Menu Items

```
GET /api/v1/menu-items
```

**Query Parameters:**

| Parameter      | Type    | Default | Description              |
| -------------- | ------- | ------- | ------------------------ |
| `limit`        | integer | 20      | Items per page (max 100) |
| `offset`       | integer | 0       | Number of items to skip  |
| `restaurantId` | string  | —       | Filter by restaurant     |
| `category`     | string  | —       | Filter by category       |
| `minPrice`     | integer | —       | Min price in kobo        |
| `maxPrice`     | integer | —       | Max price in kobo        |
| `isAvailable`  | boolean | —       | Filter by availability   |
| `sort`         | string  | name    | Sort by: `name`, `price` |
| `order`        | string  | asc     | Sort order: `asc`, `desc`|

**Example:**

```bash
curl "https://food-delivery-api-production-b47b.up.railway.app/api/v1/menu-items?category=Mains&minPrice=200000&maxPrice=1000000&sort=price&order=asc&limit=10"
```

**Response:**

```json
{
  "data": [
    {
      "id": "clx2def456",
      "restaurantId": "clx1abc123",
      "name": "Jollof Rice & Chicken",
      "description": "Smoky party-style jollof rice served with grilled chicken",
      "price": 350000,
      "currency": "NGN",
      "category": "Mains",
      "isAvailable": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z",
      "restaurant": {
        "id": "clx1abc123",
        "name": "Mama Cass",
        "cuisine": "Nigerian"
      }
    }
  ],
  "meta": {
    "total": 45,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

---

#### Get Menu Item by ID

```
GET /api/v1/menu-items/:id
```

**Example:**

```bash
curl "https://food-delivery-api-production-b47b.up.railway.app/api/v1/menu-items/clx2def456"
```

---

### Orders

#### List All Orders

```
GET /api/v1/orders
```

**Query Parameters:**

| Parameter      | Type    | Default   | Description                  |
| -------------- | ------- | --------- | ---------------------------- |
| `limit`        | integer | 20        | Items per page (max 100)     |
| `offset`       | integer | 0         | Number of items to skip      |
| `restaurantId` | string  | —         | Filter by restaurant         |
| `status`       | string  | —         | Filter by: `pending`, `confirmed`, `preparing`, `out_for_delivery`, `delivered`, `cancelled` |
| `sort`         | string  | createdAt | Sort by: `createdAt`, `totalAmount` |
| `order`        | string  | desc      | Sort order: `asc`, `desc`    |

**Example:**

```bash
curl "https://food-delivery-api-production-b47b.up.railway.app/api/v1/orders?status=pending&sort=createdAt&order=desc&limit=5"
```

**Response:**

```json
{
  "data": [
    {
      "id": "clx3ghi789",
      "restaurantId": "clx1abc123",
      "customerName": "Adebayo Ogunlesi",
      "customerPhone": "08031234567",
      "deliveryAddress": "42 Admiralty Way, Lekki Phase 1, Lagos",
      "status": "pending",
      "totalAmount": 850000,
      "currency": "NGN",
      "createdAt": "2024-01-15T14:20:00.000Z",
      "updatedAt": "2024-01-15T14:20:00.000Z",
      "restaurant": {
        "id": "clx1abc123",
        "name": "Mama Cass"
      },
      "orderItems": [
        {
          "id": "clx4jkl012",
          "menuItemId": "clx2def456",
          "quantity": 2,
          "unitPrice": 350000,
          "subtotal": 700000,
          "currency": "NGN",
          "menuItem": {
            "id": "clx2def456",
            "name": "Jollof Rice & Chicken"
          }
        }
      ]
    }
  ],
  "meta": {
    "total": 40,
    "limit": 5,
    "offset": 0,
    "hasMore": true
  }
}
```

---

#### Get Order by ID

```
GET /api/v1/orders/:id
```

Returns the order with all its order items included.

**Example:**

```bash
curl "https://food-delivery-api-production-b47b.up.railway.app/api/v1/orders/clx3ghi789"
```

---

#### Create an Order

```
POST /api/v1/orders
```

**Request Body:**

```json
{
  "restaurantId": "clx1abc123",
  "customerName": "Chioma Adeyemi",
  "customerPhone": "08031234567",
  "deliveryAddress": "15 Ozumba Mbadiwe Avenue, Victoria Island, Lagos",
  "items": [
    {
      "menuItemId": "clx2def456",
      "quantity": 2
    },
    {
      "menuItemId": "clx2ghi789",
      "quantity": 1
    }
  ]
}
```

| Field            | Type   | Required | Description                    |
| ---------------- | ------ | -------- | ------------------------------ |
| `restaurantId`   | string | ✅       | ID of the restaurant           |
| `customerName`   | string | ✅       | Min 2 characters               |
| `customerPhone`  | string | ✅       | Nigerian format (e.g., 08031234567) |
| `deliveryAddress`| string | ✅       | Min 10 characters              |
| `items`          | array  | ✅       | At least 1 item                |
| `items[].menuItemId` | string | ✅  | ID of the menu item            |
| `items[].quantity`   | integer | ✅ | Min 1                          |

> **Note:** The server calculates `unitPrice`, `subtotal`, and `totalAmount` from current menu item prices. All amounts are in **kobo**.

**Example:**

```bash
curl -X POST "https://food-delivery-api-production-b47b.up.railway.app/api/v1/orders" \
  -H "Content-Type: application/json" \
  -d '{
    "restaurantId": "clx1abc123",
    "customerName": "Chioma Adeyemi",
    "customerPhone": "08031234567",
    "deliveryAddress": "15 Ozumba Mbadiwe Avenue, Victoria Island, Lagos",
    "items": [
      { "menuItemId": "clx2def456", "quantity": 2 }
    ]
  }'
```

**Response (201):**

```json
{
  "data": {
    "id": "clx5mno345",
    "restaurantId": "clx1abc123",
    "customerName": "Chioma Adeyemi",
    "customerPhone": "08031234567",
    "deliveryAddress": "15 Ozumba Mbadiwe Avenue, Victoria Island, Lagos",
    "status": "pending",
    "totalAmount": 700000,
    "currency": "NGN",
    "orderItems": [...]
  }
}
```

**Error (422 — missing field):**

```bash
curl -X POST "https://food-delivery-api-production-b47b.up.railway.app/api/v1/orders" \
  -H "Content-Type: application/json" \
  -d '{ "restaurantId": "clx1abc123" }'
```

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request body validation failed",
    "details": [
      { "field": "customerName", "message": "Required" },
      { "field": "customerPhone", "message": "Required" },
      { "field": "deliveryAddress", "message": "Required" },
      { "field": "items", "message": "Required" }
    ]
  }
}
```

---

#### Update Order Status

```
PATCH /api/v1/orders/:id
```

**Request Body:**

```json
{
  "status": "confirmed"
}
```

Valid status transitions:

| From               | Allowed To                     |
| ------------------ | ------------------------------ |
| `pending`          | `confirmed`, `cancelled`       |
| `confirmed`        | `preparing`, `cancelled`       |
| `preparing`        | `out_for_delivery`             |
| `out_for_delivery` | `delivered`                    |
| `delivered`        | *(none — terminal state)*      |
| `cancelled`        | *(none — terminal state)*      |

**Example:**

```bash
curl -X PATCH "https://food-delivery-api-production-b47b.up.railway.app/api/v1/orders/clx3ghi789" \
  -H "Content-Type: application/json" \
  -d '{ "status": "confirmed" }'
```

**Error (400 — invalid transition):**

```json
{
  "error": {
    "code": "INVALID_STATUS_TRANSITION",
    "message": "Cannot transition from 'delivered' to 'pending'"
  }
}
```

---

#### Cancel an Order

```
DELETE /api/v1/orders/:id
```

Only allowed if the order status is `pending` or `confirmed`. Sets the status to `cancelled`.

**Example:**

```bash
curl -X DELETE "https://food-delivery-api-production-b47b.up.railway.app/api/v1/orders/clx3ghi789"
```

**Response (200):**

```json
{
  "data": {
    "id": "clx3ghi789",
    "status": "cancelled",
    ...
  }
}
```

**Error (400 — cannot cancel):**

```json
{
  "error": {
    "code": "INVALID_STATUS_TRANSITION",
    "message": "Cannot cancel order with status 'delivered'. Only pending or confirmed orders can be cancelled."
  }
}
```

---

## Design Decisions

### Why These Four Resources?

A food delivery marketplace needs at minimum: **restaurants** (who sells), **menu items** (what they sell), **orders** (what was bought), and **order items** (the line items in each order). This mirrors the real-world domain of services like Jumia Food and Chowdeck in Lagos.

### Why CUID Instead of Sequential Integers?

- **Security**: Sequential IDs expose record count and allow enumeration attacks (`/orders/1`, `/orders/2`, etc.)
- **Distributed-friendly**: CUIDs can be generated without a central authority, making them safe for future horizontal scaling
- **URL-safe**: CUIDs are URL-safe strings that don't leak business information

### Why Offset Pagination?

Offset pagination is simple to implement and works well for small-to-medium datasets (< 100K records). It allows jumping to any page directly.

**When cursor pagination would be better:**
- Datasets with 100K+ records where `OFFSET` becomes slow
- Real-time feeds where records are being inserted frequently (offset can skip or duplicate records)
- Infinite scroll UIs where you only need "next page"

### Why Kobo for Money?

Floating-point arithmetic causes rounding errors with currency. For example, `0.1 + 0.2 !== 0.3` in JavaScript. By storing amounts as integers in kobo (the smallest unit of Nigerian Naira), we avoid all floating-point precision issues. Every `price`, `unitPrice`, `subtotal`, `totalAmount`, and `minimumOrder` is stored as an integer in kobo.

**Conversion:** ₦1,000.00 = 100,000 kobo.

### Why API Versioning from Day One?

Adding versioning later is a breaking change for existing clients. By starting with `/api/v1/`, we can:
- Ship `/api/v2/` with breaking changes without affecting v1 clients
- Deprecate v1 gradually with proper notice
- Run both versions simultaneously during migration

### The Envelope Shape

Every response uses a consistent envelope:

- **Success list**: `{ "data": [...], "meta": { total, limit, offset, hasMore } }`
- **Success single**: `{ "data": { ... } }`
- **Error**: `{ "error": { "code": "...", "message": "..." } }`

This consistency means API consumers always know where to find the data, pagination info, or error details — regardless of the endpoint.

---

## Deployment

### Railway

1. Push to GitHub
2. Connect Railway to the repository
3. Add `DATABASE_URL` environment variable (Railway PostgreSQL add-on)
4. Railway deploys automatically on push
5. Seed production database:
   ```bash
   railway run npx prisma db seed
   ```

### Live URL

> 🔗 **`https://food-delivery-api-production-b47b.up.railway.app`**

Replace with your actual Railway deployment URL after deploying.

---

## License

MIT
