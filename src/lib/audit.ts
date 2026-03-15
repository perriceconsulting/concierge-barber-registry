import { prisma } from '@/lib/db';
import type { UserRole } from '@prisma/client';

export type AuditAction =
  | 'user.login'
  | 'user.logout'
  | 'user.register'
  | 'user.password_reset'
  | 'user.password_change'
  | 'user.email_verify'
  | 'user.role_change'
  | 'user.deactivate'
  | 'barber.profile_create'
  | 'barber.profile_update'
  | 'barber.license_update'
  | 'barber.verification_submit'
  | 'barber.verification_approve'
  | 'barber.verification_reject'
  | 'barber.verification_suspend'
  | 'review.create'
  | 'review.update'
  | 'review.delete'
  | 'review.visibility_change'
  | 'session.revoke'
  | 'session.cleanup';

export type AuditEntityType =
  | 'user'
  | 'barber_profile'
  | 'review'
  | 'session';

interface CreateAuditLogParams {
  actorUserId?: string | null;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: string | null;
  details?: Record<string, any>;
  ipAddress?: string | null;
}

/**
 * Create an audit log entry for sensitive operations
 * Fire-and-forget pattern - does not throw errors
 */
export async function createAuditLog({
  actorUserId,
  action,
  entityType,
  entityId,
  details,
  ipAddress,
}: CreateAuditLogParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorUserId: actorUserId || null,
        action,
        entityType,
        entityId: entityId || null,
        details: details || null,
        ipAddress: ipAddress || null,
      },
    });
  } catch (error) {
    // Log to console but don't throw - audit logging should not break application flow
    console.error('[AUDIT LOG ERROR]', {
      action,
      entityType,
      entityId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Helper to extract IP address from request headers
 */
export function getIpFromRequest(request: Request): string | null {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    null
  );
}

/**
 * Create audit log for authentication events
 */
export async function auditAuthEvent(
  action: Extract<AuditAction, 'user.login' | 'user.logout' | 'user.register' | 'user.password_reset' | 'user.password_change' | 'user.email_verify'>,
  userId: string,
  request: Request,
  details?: Record<string, any>
): Promise<void> {
  await createAuditLog({
    actorUserId: userId,
    action,
    entityType: 'user',
    entityId: userId,
    details: {
      ...details,
      userAgent: request.headers.get('user-agent'),
    },
    ipAddress: getIpFromRequest(request),
  });
}

/**
 * Create audit log for barber verification events
 */
export async function auditVerificationEvent(
  action: Extract<AuditAction, 'barber.verification_submit' | 'barber.verification_approve' | 'barber.verification_reject' | 'barber.verification_suspend'>,
  adminUserId: string,
  barberProfileId: string,
  request: Request,
  details?: Record<string, any>
): Promise<void> {
  await createAuditLog({
    actorUserId: adminUserId,
    action,
    entityType: 'barber_profile',
    entityId: barberProfileId,
    details,
    ipAddress: getIpFromRequest(request),
  });
}

/**
 * Create audit log for role changes
 */
export async function auditRoleChange(
  adminUserId: string,
  targetUserId: string,
  oldRole: UserRole,
  newRole: UserRole,
  request: Request
): Promise<void> {
  await createAuditLog({
    actorUserId: adminUserId,
    action: 'user.role_change',
    entityType: 'user',
    entityId: targetUserId,
    details: {
      oldRole,
      newRole,
    },
    ipAddress: getIpFromRequest(request),
  });
}
