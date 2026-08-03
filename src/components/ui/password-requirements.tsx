import { PASSWORD_REQUIREMENTS } from '@/lib/validations/auth';
import { cn } from '@/lib/utils';

// Live checklist of password rules. Shares PASSWORD_REQUIREMENTS with the
// server-side Zod schema, so what's shown always matches what's enforced.
// Reusable on register, reset-password, and change-password forms.
export function PasswordRequirements({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  return (
    <ul className={cn('space-y-1', className)} aria-live="polite">
      {PASSWORD_REQUIREMENTS.map((req) => {
        const met = req.test(value);
        return (
          <li
            key={req.label}
            className={cn(
              'flex items-center gap-1.5 text-xs transition-colors',
              met ? 'text-green-500' : 'text-muted-foreground'
            )}
          >
            <span aria-hidden="true" className="w-3 text-center">
              {met ? '✓' : '○'}
            </span>
            <span>{req.label}</span>
            <span className="sr-only">{met ? '(met)' : '(not met)'}</span>
          </li>
        );
      })}
    </ul>
  );
}
