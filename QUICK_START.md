# Quick Start Guide

## ✅ Recent Fixes Applied

1. **Prisma Schema** - Fixed Time type compatibility issues ✅
2. **Tailwind CSS** - Fixed `@apply` directive issues for v4 ✅
3. **File Structure** - Moved components/lib/types to src/ directory ✅

## 🚀 Start the Application

### Step 1: Install Dependencies

```bash
cd concierge-barber-registry
npm install
```

**Note**: This may take 3-5 minutes depending on your connection.

### Step 2: Configure Database

Update `.env.local` with your PostgreSQL connection:

```env
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"
```

**Options:**
- **Neon.tech** (Free): https://neon.tech (recommended)
- **Local PostgreSQL**: `postgresql://postgres:password@localhost:5432/concierge_barber_dev`

### Step 3: Set Up Database

```bash
npx prisma generate  # Already done! ✅
npx prisma db push   # Creates tables in your database
```

### Step 4: Start Development Server

```bash
npm run dev
```

Visit: `http://localhost:3000`

---

## 🎯 Test Routes

### Public Pages
- `/` - Homepage
- `/search` - Search barbers
- `/about` - About page
- `/login` - Login
- `/register` - Register

### After Login (Barber)
- `/dashboard` - Dashboard overview
- `/dashboard/profile` - Edit profile
- `/dashboard/services` - Manage services
- `/dashboard/portfolio` - Manage portfolio
- `/dashboard/reviews` - View reviews
- `/dashboard/requests` - Contact requests
- `/dashboard/settings` - Settings

### After Login (Admin)
- `/admin` - Admin dashboard
- `/admin/barbers` - Manage barbers
- `/admin/users` - Manage users

---

## ⚠️ Known Issues & Workarounds

### Issue: npm install times out
**Workaround**:
```bash
npm install --legacy-peer-deps
# or
npm install --network-timeout 100000
```

### Issue: Prisma generate fails
**Fix**: Schema already fixed! Just run:
```bash
npx prisma generate
```

### Issue: Build errors in CSS
**Fix**: Already fixed in `globals.css` - Tailwind v4 compatible

---

## 📝 Current Status

✅ **50% MVP Complete**
- All major pages built (17 pages)
- Core APIs implemented (9 endpoints)
- Authentication system working
- Dashboard fully functional
- Admin panel operational

⏭️ **Next to Build**
- File upload (Cloudinary/Vercel Blob)
- Email notifications
- Admin moderation pages
- SEO optimization

---

## 🆘 Troubleshooting

### Port 3000 in use
```bash
# Windows
npx kill-port 3000

# Or use different port
PORT=3001 npm run dev
```

### Database connection fails
1. Check DATABASE_URL in `.env.local`
2. Verify PostgreSQL is running (if local)
3. For Neon, ensure `?sslmode=require` is in URL

### Prisma errors
```bash
# Reset and regenerate
npx prisma generate
npx prisma db push --force-reset
```

---

**Need Help?** Check:
- `BUILD_SUMMARY.md` - Complete feature list
- `SETUP_GUIDE.md` - Detailed setup
- `SCHEMA_FIXES.md` - Recent fixes
- `README.md` - Full documentation
