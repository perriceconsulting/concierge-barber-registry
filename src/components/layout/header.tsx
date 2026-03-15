'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { ROUTES, APP_CONFIG } from '@/config';
import { secureFetch, clearCsrfToken } from '@/lib/csrf-client';
import { createLogger } from '@/lib/logger';

const logger = createLogger('HEADER');

export function Header() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [actualRole, setActualRole] = useState<string | null>(null);

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
          setActualRole(data.data?.user?.actualRole || data.data?.user?.role || null);
        } else {
          setIsLoggedIn(false);
          setUserRole(null);
          setActualRole(null);
        }
      } catch {
        setIsLoggedIn(false);
        setUserRole(null);
        setActualRole(null);
      }
    }

    checkAuth();
  }, []);

  const isAdmin = actualRole === 'admin';

  const handleSwitchRole = async (newRole: string) => {
    try {
      const res = await secureFetch('/api/auth/switch-role', {
        method: 'POST',
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        setUserRole(newRole);
        // Redirect to appropriate page
        if (newRole === 'admin') router.push(ROUTES.ADMIN);
        else if (newRole === 'barber') router.push('/dashboard');
        else router.push('/');
      }
    } catch (error) {
      logger.error('Failed to switch role:', error);
    }
  };

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
      logger.error('Logout failed:', error);
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
              {(userRole === 'barber' || isAdmin) && (
                <Link href={ROUTES.DASHBOARD}>
                  <Button variant="ghost">Dashboard</Button>
                </Link>
              )}
              {isAdmin && (
                <Link href={ROUTES.ADMIN}>
                  <Button variant="ghost">Admin</Button>
                </Link>
              )}
              {isAdmin && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">View as:</span>
                  <Select
                    value={userRole || 'admin'}
                    onChange={(e) => handleSwitchRole(e.target.value)}
                    className="h-8 w-24 text-xs"
                  >
                    <option value="admin">Admin</option>
                    <option value="barber">Barber</option>
                    <option value="client">Client</option>
                  </Select>
                </div>
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
