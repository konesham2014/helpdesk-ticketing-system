# HelpDesk Ticketing System

A modern, full-stack help desk ticketing system built with Next.js 14, TypeScript, PostgreSQL, and Prisma. Features role-based authentication, ticket management, real-time comments, file attachments, activity logging, and a polished admin dashboard.

## Features

- **Secure Authentication** - Role-based login (Customer, Agent, Admin) with NextAuth.js
- **Ticket Management** - Create, view, update, and track support tickets
- **Advanced Filtering** - Search, filter by status/priority/assignment, sort, and paginate tickets
- **Comments & Conversation** - Real-time comment threads with internal notes for staff
- **File Attachments** - Upload screenshots and documents to tickets
- **Activity Logging** - Complete audit trail of all ticket changes
- **User Management** - Admin panel to create and manage users
- **Dashboard Analytics** - Visual stats on ticket volumes, priorities, and recent activity
- **Responsive UI** - Built with Tailwind CSS and shadcn/ui components

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | NextAuth.js (Credentials) |
| Charts | Recharts |
| Icons | Lucide React |

## Quick Start

### 1. Prerequisites

- Node.js 18+
- PostgreSQL 14+

### 2. Setup

```bash
# Clone and navigate to project
cd helpdesk-ticketing-system

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL and NEXTAUTH_SECRET

# Generate Prisma client and run migrations
npx prisma generate
npx prisma migrate dev --name init

# Seed demo data
npm run db:seed

# Start development server
npm run dev
```

### 3. Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@helpdesk.com | admin123 |
| Agent | agent1@helpdesk.com | agent123 |
| Customer | john@example.com | customer123 |

### 4. Database Schema

```
User (id, email, name, password, role, isActive)
  ├── Ticket (customer) → CustomerTickets
  ├── Ticket (assignedTo) → AssignedTickets
  ├── Comment (author)
  ├── Attachment (uploadedBy)
  └── ActivityLog (user)

Ticket (id, title, description, status, priority, createdAt, resolvedAt)
  ├── Comment[]
  ├── Attachment[]
  └── ActivityLog[]
```

## Project Structure

```
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Demo data
├── src/
│   ├── app/
│   │   ├── (auth)/        # Login & Register pages
│   │   ├── (dashboard)/     # Dashboard, Tickets, Users, Activity, Profile
│   │   ├── api/            # REST API routes
│   │   │   ├── auth/       # NextAuth.js
│   │   │   ├── tickets/    # Ticket CRUD, comments, attachments, assign, status
│   │   │   ├── dashboard/  # Stats & analytics
│   │   │   ├── activity/   # Activity log
│   │   │   ├── users/      # User management
│   │   │   └── agents/     # Agent list
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Home redirect
│   ├── components/
│   │   ├── ui/             # shadcn/ui components
│   │   ├── layout/         # Sidebar, Dashboard layout
│   │   └── providers.tsx   # Session provider
│   ├── lib/
│   │   ├── prisma.ts       # Prisma client singleton
│   │   ├── auth.ts         # NextAuth config
│   │   └── utils.ts        # Helpers & formatters
│   ├── hooks/
│   │   └── use-toast.ts    # Toast notifications
│   └── types/
│       └── next-auth.d.ts  # Type extensions
└── public/uploads/         # File uploads
```

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/auth/[...nextauth] | Sign in/out | Public |
| GET | /api/tickets | List tickets (with filters) | Authenticated |
| POST | /api/tickets | Create ticket | Authenticated |
| GET | /api/tickets/[id] | Get ticket details | Authenticated |
| PATCH | /api/tickets/[id] | Update ticket | Authenticated |
| DELETE | /api/tickets/[id] | Delete ticket | Admin only |
| POST | /api/tickets/[id]/comments | Add comment | Authenticated |
| POST | /api/tickets/[id]/assign | Assign agent | Agent/Admin |
| PATCH | /api/tickets/[id]/status | Change status | Agent/Admin |
| POST | /api/tickets/[id]/attachments | Upload file | Authenticated |
| GET | /api/dashboard | Dashboard stats | Authenticated |
| GET | /api/activity | Activity log | Authenticated |
| GET | /api/users | List users | Admin only |
| POST | /api/users | Create user | Admin only |
| GET | /api/agents | List agents | Authenticated |

## Role Permissions

| Feature | Customer | Agent | Admin |
|---------|----------|-------|-------|
| Create tickets | ✅ | ✅ | ✅ |
| View own tickets | ✅ | ✅ | ✅ |
| View all tickets | ❌ | ✅ | ✅ |
| Edit tickets | Own only | All | All |
| Change status | ❌ | ✅ | ✅ |
| Assign agents | ❌ | ✅ | ✅ |
| Add comments | Own tickets | All | All |
| Internal notes | ❌ | ✅ | ✅ |
| Upload files | Own tickets | All | All |
| View activity | Own | All | All |
| Manage users | ❌ | ❌ | ✅ |
| Delete tickets | ❌ | ❌ | ✅ |

## License

MIT
