# Concierge Barber Registry

A modern barber-focused concierge registry platform where barbers register their professional profiles and clients discover, vet, and connect with top-tier barbers. Built with Next.js 16, TypeScript, and PostgreSQL.

## 🚀 Project Status

**Current Progress: ~80% MVP Complete** ✨

### ✅ Completed Features

#### Backend & Infrastructure
- ✅ Next.js 16 project with TypeScript and App Router
- ✅ Tailwind CSS v4 + shadcn/ui configuration
- ✅ Complete project folder structure (all route groups)
- ✅ PostgreSQL database schema with Prisma (11 models)
- ✅ Comprehensive TypeScript type definitions
- ✅ App configuration and constants
- ✅ Environment variables setup

#### Authentication System
- ✅ Complete JWT-based authentication
  - Password hashing with bcrypt (12 rounds)
  - JWT access/refresh token strategy
  - API routes: register, login, logout, refresh, me
  - Auth middleware for protected routes
  - Role-based access control (client, barber, admin)
- ✅ Zod validation schemas
  - Auth validations (register, login, password reset)
  - Barber profile validations
  - Review and contact request validations
- ✅ Error handling utilities
- ✅ API response formatters

#### UI Components
- ✅ shadcn/ui base components: Button, Input, Card, Label, Badge, Textarea, Select
- ✅ Layout components: Header, Footer, Container
- ✅ Responsive navigation with role-based menu items

#### Pages & Features
- ✅ **Authentication Pages**
  - Login page with error handling
  - Register page with role selection (client/barber)
  - Forgot password page
  - Auth layout with gradient background

- ✅ **Public Pages**
  - Homepage with hero, features, and CTA sections
  - Search/Directory page with filters and barber cards
  - About page
  - Contact page with form and FAQ section
  - FAQ page with search and category filters
  - Privacy Policy page
  - Terms of Service page
  - 404 Not Found page
  - 500 Error page
  - Global error page
  - Loading page
  - Public layout

- ✅ **Barber Dashboard** (Complete - 8 pages)
  - Dashboard overview with stats cards (views, reviews, rating, requests)
  - Profile edit page (bio, location, contact, availability)
  - Services management page (add/edit/delete with pricing)
  - Portfolio management page (image upload with captions)
  - Reviews display page (rating breakdown, filters)
  - Contact requests page (inbox with response system)
  - Operating hours page (weekly schedule management)
  - Settings page (password change, notifications, account deactivation)
  - Sidebar navigation layout

- ✅ **Admin Panel** (Complete - 6 pages)
  - Admin dashboard with platform stats
  - Barber management page (approve/reject/suspend with filters)
  - User management page (view/deactivate/change roles)
  - Reviews moderation page (hide/show/delete/unflag)
  - Specialties management page (CRUD operations)
  - Audit log page (track administrative actions)
  - Sidebar navigation layout

- ✅ **Barber Profile Public View**
  - Full profile display with ratings and reviews
  - Services & pricing list
  - Contact form modal
  - Operating hours display
  - Portfolio gallery placeholder
  - Social links and contact information

#### API Endpoints
- ✅ **Auth API**: `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/refresh`, `/api/auth/me`
- ✅ **Barbers API**:
  - `GET /api/barbers` - Search & list with filters (city, state, specialty, rating, pagination)
  - `POST /api/barbers` - Create barber profile (auth required)
  - `GET /api/barbers/:slug` - Get full barber profile with all relations
- ✅ **Specialties API**: `GET /api/specialties` - List all specialties
- ✅ **Reviews API**: `POST /api/reviews` - Submit review (auth required, auto-updates rating)
- ✅ **Contact API**: `POST /api/contact` - Submit contact request (public)
- ✅ **Operating Hours API**:
  - `GET /api/operating-hours` - Get barber's hours (auth required)
  - `PUT /api/operating-hours` - Update hours (auth required)

#### Database & Seeding
- ✅ Complete Prisma schema with 12 models
- ✅ Database seed script for 21 barber specialties
- ✅ Seed configuration in package.json

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Database:** PostgreSQL (via Prisma ORM)
- **Authentication:** Custom JWT (jose library)
- **Validation:** Zod
- **Password Hashing:** bcryptjs
- **Deployment:** Vercel (ready)

## 📦 Installation

```bash
cd concierge-barber-registry

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your database credentials

# Generate Prisma Client
npx prisma generate

# Push database schema (or create migration)
npx prisma db push

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🗄️ Database Schema

The application uses PostgreSQL with the following models:

- **User** - Base authentication
- **Session** - JWT refresh token storage
- **BarberProfile** - Barber professional profiles
- **Specialty** - Barber specialties (Fades, Beards, etc.)
- **BarberSpecialty** - Many-to-many junction table
- **Service** - Services offered by barbers
- **PortfolioImage** - Barber work galleries
- **Review** - Client reviews and ratings
- **OperatingHours** - Weekly operating schedules
- **Favorite** - Client-saved barbers
- **ContactRequest** - Client inquiries
- **AuditLog** - Admin action tracking

## 🔐 Authentication

The app uses a custom JWT authentication system:

- **Access tokens**: Short-lived (15 minutes), stored in memory
- **Refresh tokens**: Long-lived (7 days), stored in httpOnly cookies
- **Token rotation**: New refresh token issued on each refresh
- **Session tracking**: Active sessions stored in database

### API Endpoints

#### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout and revoke session
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user

## 📁 Project Structure

```
concierge-barber-registry/
├── src/
│   └── app/
│       ├── (public)/         # Public pages
│       ├── (auth)/           # Auth pages
│       ├── (dashboard)/      # Barber dashboard
│       ├── (admin)/          # Admin panel
│       └── api/              # API routes
│           └── auth/         # ✅ Implemented
│               ├── register/
│               ├── login/
│               ├── logout/
│               ├── refresh/
│               └── me/
├── components/
│   ├── ui/                   # shadcn/ui components
│   ├── barbers/              # Barber-specific
│   ├── forms/                # Form components
│   └── layout/               # Layout components
├── lib/
│   ├── db.ts                 # ✅ Prisma client
│   ├── utils.ts              # ✅ Utility functions
│   ├── api/
│   │   ├── errors.ts         # ✅ Error handling
│   │   └── middleware.ts     # ✅ Auth middleware
│   ├── auth/
│   │   ├── jwt.ts            # ✅ JWT utilities
│   │   └── password.ts       # ✅ Password hashing
│   └── validations/          # ✅ Zod schemas
│       ├── auth.ts
│       ├── barber.ts
│       └── review.ts
├── types/
│   └── index.ts              # ✅ TypeScript types
├── config/
│   └── index.ts              # ✅ App configuration
├── prisma/
│   └── schema.prisma         # ✅ Database schema
└── package.json
```

## 🎨 Design System

### Brand Colors

```css
Primary:   #1A1A2E (Deep Navy/Black)
Secondary: #C9A96E (Gold/Brass)
Accent:    #E94560 (Bold Red)
Background:#FFFFFF
Surface:   #F5F5F5
```

### Typography

- **Headings:** Inter/Montserrat (bold, uppercase)
- **Body:** Inter
- **Accent:** Playfair Display (for branding)

## 📝 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Prisma commands
npx prisma studio    # Open Prisma Studio (GUI)
npx prisma generate  # Generate Prisma Client
npx prisma db push   # Push schema to database
npx prisma migrate dev --name init  # Create migration
```

## 🔜 Next Steps

### Immediate Priorities

1. **Install Dependencies** - Run `npm install` in the `concierge-barber-registry` directory
2. **Generate Prisma Client** - Run `npx prisma generate`
3. **Database Setup** - Configure PostgreSQL connection in `.env.local`
4. **Database Migration** - Run `npx prisma db push` or `npx prisma migrate dev --name init`
5. **Start Development Server** - Run `npm run dev`

### Remaining Features to Build

#### High Priority (Core MVP)
- [ ] Actual file upload implementation (Cloudinary/Vercel Blob)
- [ ] Connect operating hours UI to API
- [ ] Connect reviews moderation to API
- [ ] Connect specialties management to API

#### Medium Priority (Enhanced MVP)
- [ ] Favorites API (save/unsave barbers)
- [ ] Email notifications (Resend):
  - Welcome emails
  - Profile verification emails
  - Contact request notifications
  - Review notifications
- [ ] Password reset email flow
- [ ] Email verification flow
- [ ] TanStack Query for optimized data fetching
- [ ] Toast notifications for user feedback
- [ ] Loading states and skeleton loaders

#### Nice to Have (Post-MVP)
- [ ] Maps integration (Google Maps on search/profile pages)
- [ ] Rate limiting middleware implementation
- [ ] Advanced search with map view toggle
- [ ] SEO optimization (structured data, sitemap.xml)
- [ ] Social login (Google OAuth)
- [ ] Image optimization and lazy loading
- [ ] Mobile responsive fine-tuning
- [ ] Real-time notifications
- [ ] Chat/messaging system
- [ ] Barber analytics dashboard

## 🌐 Environment Variables

Required environment variables (see `.env.example`):

```env
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://...

# Auth
JWT_ACCESS_SECRET=your-secret-here
JWT_REFRESH_SECRET=your-secret-here

# Optional Services
RESEND_API_KEY=
CLOUDINARY_API_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

## 📖 Documentation

- [Development Progress](./DEVELOPMENT_PROGRESS.md) - Detailed progress tracking
- [Database Schema](./prisma/schema.prisma) - Full Prisma schema
- [API Documentation](./src/app/api/) - API route implementations

## 🤝 Contributing

This project is in active development. See `DEVELOPMENT_PROGRESS.md` for current status and roadmap.

## 📄 License

Private project - Concierge Barber Registry

---

**Built with ❤️ using Next.js 16, TypeScript, and modern web technologies**
