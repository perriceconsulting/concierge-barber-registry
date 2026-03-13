# Setup Guide - Concierge Barber Registry

## Quick Start

### 1. Install Dependencies

```bash
cd concierge-barber-registry
npm install
```

This will install all required packages including Next.js, React, Prisma, and UI libraries.

### 2. Configure Database

You have two options:

#### Option A: Use Neon (Recommended for Production)

1. Go to [https://neon.tech](https://neon.tech) and create a free account
2. Create a new project
3. Copy the connection string
4. Update `.env.local`:
   ```env
   DATABASE_URL="postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
   ```

#### Option B: Use Local PostgreSQL (Development)

1. Install PostgreSQL locally
2. Create a database:
   ```bash
   createdb concierge_barber_dev
   ```
3. Update `.env.local`:
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/concierge_barber_dev?sslmode=disable"
   ```

### 3. Set Up Database Schema

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database (or create migration)
npx prisma db push

# Or create a migration (recommended for production)
npx prisma migrate dev --name init
```

### 4. Seed Database (Optional)

Create a seed script to populate specialties:

```bash
# Create prisma/seed.ts
npx prisma db seed
```

### 5. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Environment Variables

Required variables in `.env.local`:

```env
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME="Concierge Barber Registry"
NODE_ENV=development

# Database
DATABASE_URL="postgresql://..."

# Authentication (generate with: openssl rand -base64 32)
JWT_ACCESS_SECRET="your-secret-here"
JWT_REFRESH_SECRET="your-secret-here"
```

Optional services (can be added later):
- `RESEND_API_KEY` - Email notifications
- `CLOUDINARY_*` - Image uploads
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Maps integration
- `GOOGLE_CLIENT_ID/SECRET` - OAuth login

## Testing the Application

### 1. Register a User

Navigate to `/register` and create:
- A client account
- A barber account

### 2. Test Authentication

- Login at `/login`
- Access dashboard at `/dashboard` (barber) or `/admin` (admin)

### 3. Create a Barber Profile

As a barber user:
1. Go to `/dashboard/profile`
2. Fill in profile information
3. Save changes

### 4. Test Admin Functions

To create an admin user, manually update the database:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```

Then access `/admin` to manage barbers.

## Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint

# Database
npx prisma studio        # Open Prisma Studio (GUI)
npx prisma generate      # Generate Prisma Client
npx prisma db push       # Push schema to database
npx prisma migrate dev   # Create new migration
npx prisma migrate reset # Reset database (CAUTION)

# Add UI Components
npx shadcn add [component-name]
```

## File Structure

```
concierge-barber-registry/
├── src/app/
│   ├── (public)/        # Public pages (home, search, about)
│   ├── (auth)/          # Auth pages (login, register) ✅
│   ├── (dashboard)/     # Barber dashboard ✅
│   ├── (admin)/         # Admin panel ✅
│   └── api/             # API routes ✅
│       ├── auth/        # Authentication endpoints ✅
│       ├── barbers/     # Barber CRUD endpoints ✅
│       └── specialties/ # Specialties endpoint ✅
├── components/
│   ├── ui/              # shadcn/ui components ✅
│   ├── layout/          # Header, Footer, Container ✅
│   ├── barbers/         # Barber-specific components
│   └── forms/           # Form components
├── lib/
│   ├── db.ts            # Prisma client ✅
│   ├── utils.ts         # Utility functions ✅
│   ├── api/             # API utilities ✅
│   │   ├── errors.ts    # Error handling ✅
│   │   └── middleware.ts # Auth middleware ✅
│   ├── auth/            # Auth utilities ✅
│   │   ├── jwt.ts       # JWT functions ✅
│   │   └── password.ts  # Password hashing ✅
│   └── validations/     # Zod schemas ✅
├── types/               # TypeScript types ✅
├── config/              # App configuration ✅
├── prisma/
│   └── schema.prisma    # Database schema ✅
└── .env.local           # Environment variables ✅
```

## Troubleshooting

### Dependencies Won't Install
If `npm install` is slow or failing:
```bash
# Clear cache
npm cache clean --force
npm install
```

### Prisma Client Not Found
```bash
npx prisma generate
```

### Database Connection Issues
- Verify `DATABASE_URL` in `.env.local`
- Check PostgreSQL is running
- Ensure firewall allows connection
- For Neon, ensure URL includes `?sslmode=require`

### Port 3000 Already in Use
```bash
# Kill process on port 3000 (Windows)
npx kill-port 3000

# Or use different port
PORT=3001 npm run dev
```

## Next Steps After Setup

1. ✅ Install dependencies
2. ✅ Configure database
3. ✅ Run migrations
4. ✅ Start dev server
5. Create seed data for specialties
6. Register test users (client, barber, admin)
7. Test all authentication flows
8. Test barber profile creation
9. Test admin approval workflow

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com/docs)

## Support

For issues or questions:
1. Check `DEVELOPMENT_PROGRESS.md` for current status
2. Review `README.md` for feature list
3. Consult the specification in `../barber concierge.json`
