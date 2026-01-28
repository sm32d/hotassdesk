# HotAssDesk 🪑

A modern, automated desk booking system to replace manual spreadsheets. Built with Next.js, Prisma, and PostgreSQL.

## 🚀 Features

-   **Interactive Floor Plan**: Visual desk booking with a map interface.
-   **Role-Based Access**:
    -   **Employees**: Book desks (AM/PM/Full Day), view upcoming bookings, cancel bookings.
    -   **Admins**: Upload floor plans, map desk coordinates, manage users, and approve long-term allocations.
-   **Flexible Booking**: Support for hot-desking (daily) and long-term allocations.
-   **Seat Types**: Distinguish between Solo Focus desks and Team Clusters (with monitors).

## 🛠️ Tech Stack

-   **Framework**: Next.js 14 (App Router)
-   **Language**: TypeScript
-   **Database**: PostgreSQL
-   **ORM**: Prisma
-   **Auth**: NextAuth.js v5
-   **Styling**: Tailwind CSS

## ⚙️ Local Setup Guide

Follow these steps to get the project running on your local machine.

### 1. Prerequisites

-   **Node.js** (v18+ recommended)
-   **PostgreSQL** (installed and running)

### 2. Installation

```bash
# Install dependencies
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory (or check the existing one) with the following variables:

```env
# Database Connection
# Replace 'username' with your local postgres user (e.g., 'postgres' or your system username)
# Replace 'password' if you have one set
DATABASE_URL="postgresql://username:password@localhost:5432/hotassdesk"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="supersecretkey123" # Change this in production

# Environment
NODE_ENV="development"
```

### 4. Database Setup

Ensure your local PostgreSQL server is running, then initialize the database. This command will create the database, apply migrations, and seed initial data.

```bash
# Create DB tables and seed data
npx prisma migrate dev --name init
```

### 5. Running the Application

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔐 Default Credentials

The seed script creates two default users for testing:

| Role | Email | Password | Access |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@company.com` | `admin123` | Full access, Admin Portal, Floor Plan Editor |
| **Employee** | `employee@company.com` | `employee123` | Dashboard, Booking, My Bookings |

## 🗺️ Setting Up the Floor Plan (Admin)

1.  Log in as **Admin**.
2.  Navigate to the **Admin Dashboard** -> **Floor Plan**.
3.  **Upload** a floor plan image (PNG/JPG).
4.  Select a seat code from the sidebar (e.g., `S1`) and **click on the map** to place it.
5.  Click **Save Layout** when finished.
6.  Employees will now see the interactive map when booking!
