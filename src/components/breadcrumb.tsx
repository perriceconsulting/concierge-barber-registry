import Link from 'next/link';
import {
  BreadcrumbStructuredData,
  type BreadcrumbItem,
} from '@/components/seo/breadcrumb-structured-data';

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  if (items.length === 0) return null;

  return (
    <>
      <BreadcrumbStructuredData items={items} />
      <nav
        aria-label="Breadcrumb"
        className={`text-sm text-muted-foreground ${className ?? ''}`}
      >
        <ol className="flex flex-wrap items-center gap-2">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            return (
              <li key={item.path} className="flex items-center gap-2">
                {isLast ? (
                  <span aria-current="page" className="text-foreground">
                    {item.name}
                  </span>
                ) : (
                  <>
                    <Link href={item.path} className="hover:text-primary transition-colors">
                      {item.name}
                    </Link>
                    <span aria-hidden="true">/</span>
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
