import Link from 'next/link';
import { APP_CONFIG, ROUTES } from '@/config';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-primary">
              {APP_CONFIG.name}
            </h3>
            <p className="text-sm text-muted-foreground">
              Discover and connect with verified, top-rated barbers in your area.
            </p>
          </div>

          {/* For Clients */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">For Clients</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href={ROUTES.SEARCH}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Find Barbers
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.SPECIALTIES}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Browse Specialties
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.FAQ}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.BLOG}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* For Barbers */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">For Barbers</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href={ROUTES.FOR_BARBERS}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Join as a Barber
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.DASHBOARD}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Barber Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Company</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href={ROUTES.ABOUT}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.CONTACT}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.PRIVACY}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.TERMS}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 md:flex-row">
          <p className="text-sm text-muted-foreground">
            © {currentYear} {APP_CONFIG.name}. All rights reserved.
          </p>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <a href="https://perrisoft.netlify.app/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Built by Perrisoft</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
