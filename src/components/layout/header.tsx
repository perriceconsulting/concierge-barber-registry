'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { ROUTES, APP_CONFIG } from '@/config';
import { secureFetch, clearCsrfToken } from '@/lib/csrf-client';
import { createLogger } from '@/lib/logger';

const logger = createLogger('HEADER');

const navLinks = [
  { name: 'Find Barbers', href: ROUTES.SEARCH },
  { name: 'Specialties', href: ROUTES.SPECIALTIES },
  { name: 'About', href: ROUTES.ABOUT },
];

export function Header() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [actualRole, setActualRole] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close mobile menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    }
    if (mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [mobileMenuOpen]);

  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          const user = data.data?.user;
          setIsLoggedIn(true);
          setUserName(user?.firstName ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ''}` : null);
          setAvatarUrl(user?.avatarUrl || null);
          setUserRole(user?.role || null);
          setActualRole(user?.actualRole || user?.role || null);
        } else {
          setIsLoggedIn(false);
          setUserName(null);
          setAvatarUrl(null);
          setUserRole(null);
          setActualRole(null);
        }
      } catch {
        setIsLoggedIn(false);
        setUserName(null);
        setAvatarUrl(null);
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
        <Link href={ROUTES.HOME} className="flex items-center space-x-2 shrink-0">
          <span className="text-xl sm:text-2xl font-bold text-primary">
            {APP_CONFIG.name}
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Desktop Auth */}
        <div className="hidden md:flex items-center space-x-4">
          {isLoggedIn ? (
            <>
              {(userRole === 'barber' || isAdmin) && (
                <Link href={ROUTES.DASHBOARD}>
                  <Button variant="ghost" size="sm">Dashboard</Button>
                </Link>
              )}
              {isAdmin && (
                <Link href={ROUTES.ADMIN}>
                  <Button variant="ghost" size="sm">Admin</Button>
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
              <div className="flex items-center gap-2">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={userName || 'User'}
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-full object-cover border"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                    {userName ? userName.charAt(0).toUpperCase() : '?'}
                  </div>
                )}
                <div className="text-left">
                  {userName && (
                    <p className="text-sm font-medium leading-none">{userName}</p>
                  )}
                  <p className="text-xs text-muted-foreground capitalize">{userRole || 'user'}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
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

        {/* Mobile: user avatar + hamburger */}
        <div className="flex md:hidden items-center gap-3">
          {isLoggedIn && (
            <div className="flex items-center gap-2">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={userName || 'User'}
                  className="h-8 w-8 rounded-full object-cover border"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                  {userName ? userName.charAt(0).toUpperCase() : '?'}
                </div>
              )}
            </div>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-md hover:bg-muted transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div ref={menuRef} className="md:hidden border-t bg-background">
          <div className="container mx-auto px-4 py-4 space-y-4">
            {/* User info */}
            {isLoggedIn && userName && (
              <div className="pb-3 border-b">
                <p className="text-sm font-medium">{userName}</p>
                <p className="text-xs text-muted-foreground capitalize">{userRole || 'user'}</p>
              </div>
            )}

            {/* Nav links */}
            <nav className="space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted hover:text-primary transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            {/* Auth actions */}
            <div className="pt-3 border-t space-y-2">
              {isLoggedIn ? (
                <>
                  {(userRole === 'barber' || isAdmin) && (
                    <Link
                      href={ROUTES.DASHBOARD}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted hover:text-primary transition-colors"
                    >
                      Dashboard
                    </Link>
                  )}
                  {isAdmin && (
                    <Link
                      href={ROUTES.ADMIN}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted hover:text-primary transition-colors"
                    >
                      Admin
                    </Link>
                  )}
                  {isAdmin && (
                    <div className="flex items-center gap-2 px-3 py-2">
                      <span className="text-xs text-muted-foreground">View as:</span>
                      <Select
                        value={userRole || 'admin'}
                        onChange={(e) => handleSwitchRole(e.target.value)}
                        className="h-8 flex-1 text-xs"
                      >
                        <option value="admin">Admin</option>
                        <option value="barber">Barber</option>
                        <option value="client">Client</option>
                      </Select>
                    </div>
                  )}
                  <Button variant="outline" size="sm" className="w-full" onClick={handleLogout}>
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Link href={ROUTES.LOGIN} onClick={() => setMobileMenuOpen(false)} className="block">
                    <Button variant="outline" className="w-full">Sign In</Button>
                  </Link>
                  <Link href={ROUTES.REGISTER} onClick={() => setMobileMenuOpen(false)} className="block">
                    <Button className="w-full">Get Started</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
