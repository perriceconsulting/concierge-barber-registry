'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ROUTES, APP_CONFIG } from '@/config';
import { secureFetch, clearCsrfToken } from '@/lib/csrf-client';

export function Header() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is logged in by calling /api/auth/me
    async function checkAuth() {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setIsLoggedIn(true);
          setUserRole(data.data?.user?.role || null);
        } else {
          setIsLoggedIn(false);
          setUserRole(null);
        }
      } catch (error) {
        setIsLoggedIn(false);
        setUserRole(null);
      }
    }

    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await secureFetch('/api/auth/logout', {
        method: 'POST',
      });

      clearCsrfToken();
      setIsLoggedIn(false);
      setUserRole(null);
      router.push(ROUTES.HOME);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href={ROUTES.HOME} className="flex items-center space-x-2">
          <span className="text-2xl font-bold text-primary">
            {APP_CONFIG.name}
          </span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link
            href={ROUTES.SEARCH}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Find Barbers
          </Link>
          <Link
            href={ROUTES.SPECIALTIES}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Specialties
          </Link>
          <Link
            href={ROUTES.ABOUT}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            About
          </Link>
        </nav>

        {/* Auth Buttons */}
        <div className="flex items-center space-x-4">
          {isLoggedIn ? (
            <>
              {userRole === 'barber' && (
                <Link href={ROUTES.DASHBOARD}>
                  <Button variant="ghost">Dashboard</Button>
                </Link>
              )}
              {userRole === 'admin' && (
                <Link href={ROUTES.ADMIN}>
                  <Button variant="ghost">Admin</Button>
                </Link>
              )}
              <Button variant="outline" onClick={handleLogout}>
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link href={ROUTES.LOGIN}>
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href={ROUTES.REGISTER}>
                <Button>Get Started</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
