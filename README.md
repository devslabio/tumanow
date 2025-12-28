# TumaNow - Multi-Company Courier and Delivery Management Platform

Multi-tenant courier and delivery management platform built with NestJS (backend) and Next.js (frontend).

## 🏗️ Project Structure

```
tumanow/
├── backend/          # NestJS API
│   ├── src/
│   │   ├── modules/  # Feature modules (auth, operators, orders, etc.)
│   │   ├── prisma/   # Prisma service
│   │   └── main.ts
│   └── prisma/       # Schema & migrations
└── ui/               # Next.js frontend
    ├── app/          # Next.js app directory
    ├── src/
    │   ├── lib/      # Utilities (api, validation, etc)
    │   ├── store/    # Zustand stores
    │   └── types/    # TypeScript types
    └── public/
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL (local or remote)
- pnpm (package manager)

### Database Setup

1. Create PostgreSQL database:
```bash
createdb tumanow
# Or using psql:
# psql -U postgres
# CREATE DATABASE tumanow;
```

2. Update database URL in `backend/.env`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/tumanow?schema=public"
```

### Backend Setup

```bash
cd backend

# Install dependencies
pnpm install

# Generate Prisma client
pnpm prisma:generate

# Run migrations
pnpm prisma:migrate

# (Optional) Seed database
pnpm prisma:seed

# Start development server
pnpm start:dev
```

Backend will run on `http://localhost:3001`
API docs available at `http://localhost:3001/api/docs`

### Frontend Setup

```bash
cd ui

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Frontend will run on `http://localhost:3000`

## 📦 Tech Stack

### Backend
- **NestJS** - Node.js framework
- **Prisma** - ORM with PostgreSQL
- **JWT** - Authentication
- **Swagger** - API documentation
- **class-validator** - DTO validation

### Frontend
- **Next.js 16** - React framework
- **Tailwind CSS v4** - Styling
- **Zustand** - State management
- **Axios** - HTTP client
- **FontAwesome** - Icons

## 🎨 Design System

- **Primary Color**: `#0b66c2`
- **Font**: Source Sans Pro
- **Design Pattern**: Following refuel app structure

## 🔐 Authentication

JWT-based authentication with role-based access control (RBAC).

### Default Roles (to be seeded)
- `SUPER_ADMIN` - Platform owner
- `PLATFORM_SUPPORT` - Platform support staff
- `OPERATOR_ADMIN` - Operator administrator
- `DISPATCHER` - Operations/dispatcher
- `CUSTOMER_CARE` - Support staff
- `DRIVER` - Delivery driver
- `CUSTOMER` - End customer

## 🏢 Multi-Tenancy

- Each operator (courier company) is a tenant
- Complete data isolation via `operator_id`
- Platform admins can access all tenants
- Operators can only access their own data

## 📋 Core Features

### Implemented
- ✅ Authentication (login, register, profile)
- ✅ Multi-tenant database schema
- ✅ JWT authentication
- ✅ API structure
- ✅ Frontend foundation

### To Be Implemented
- ⏳ Operator management
- ⏳ Order lifecycle management
- ⏳ Vehicle-based assignment
- ⏳ Payment processing
- ⏳ Tracking & POD
- ⏳ Notifications (Firebase, Email, SMS)
- ⏳ Reports & analytics

## 🔧 Environment Variables

### Backend (.env)
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/tumanow?schema=public"
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRATION=30d
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_REFRESH_EXPIRATION=30d
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_BASE=http://localhost:3001/api
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## 📝 API Documentation

Once the backend is running, visit:
- Swagger UI: `http://localhost:3001/api/docs`

## 🧪 Testing

```bash
# Backend tests
cd backend
pnpm test

# Frontend tests (when added)
cd ui
pnpm test
```

## 📚 Documentation

- [TOR Document](./docs/TOR.md) - Terms of Reference
- [API Documentation](./docs/API.md) - API endpoints
- [Architecture](./docs/architecture.md) - System architecture

## 🤝 Contributing

1. Follow the existing code structure
2. Use TypeScript strictly
3. Follow NestJS and Next.js best practices
4. Write tests for new features
5. Update documentation

## 📄 License

ISC

## 🆘 Support

For issues or questions, contact the development team.

