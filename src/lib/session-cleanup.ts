import { prisma } from '@/lib/db';

/**
 * Clean up expired and revoked sessions
 * This should be run periodically (e.g., daily via cron job)
 */
export async function cleanupExpiredSessions(): Promise<{
  deletedCount: number;
  deletedRevoked: number;
  deletedExpired: number;
}> {
  const now = new Date();

  try {
    // Delete expired sessions
    const deletedExpired = await prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: now,
        },
      },
    });

    // Delete revoked sessions older than 7 days
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const deletedRevoked = await prisma.session.deleteMany({
      where: {
        isRevoked: true,
        createdAt: {
          lt: sevenDaysAgo,
        },
      },
    });

    const totalDeleted = deletedExpired.count + deletedRevoked.count;

    console.log(`[Session Cleanup] Deleted ${totalDeleted} sessions:`);
    console.log(`  - ${deletedExpired.count} expired sessions`);
    console.log(`  - ${deletedRevoked.count} old revoked sessions`);

    return {
      deletedCount: totalDeleted,
      deletedExpired: deletedExpired.count,
      deletedRevoked: deletedRevoked.count,
    };
  } catch (error) {
    console.error('[Session Cleanup] Error cleaning up sessions:', error);
    throw error;
  }
}

/**
 * Clean up expired verification tokens
 * This should be run periodically (e.g., daily via cron job)
 */
export async function cleanupExpiredVerificationTokens(): Promise<{ deletedCount: number }> {
  const now = new Date();

  try {
    const result = await prisma.verificationToken.deleteMany({
      where: {
        expiresAt: {
          lt: now,
        },
      },
    });

    console.log(`[Token Cleanup] Deleted ${result.count} expired verification tokens`);

    return { deletedCount: result.count };
  } catch (error) {
    console.error('[Token Cleanup] Error cleaning up verification tokens:', error);
    throw error;
  }
}

/**
 * Combined cleanup job - runs both session and token cleanup
 */
export async function runCleanupJob(): Promise<{
  sessions: { deletedCount: number; deletedRevoked: number; deletedExpired: number };
  tokens: { deletedCount: number };
}> {
  console.log('[Cleanup Job] Starting cleanup...');

  const [sessions, tokens] = await Promise.all([
    cleanupExpiredSessions(),
    cleanupExpiredVerificationTokens(),
  ]);

  console.log('[Cleanup Job] Cleanup completed successfully');

  return { sessions, tokens };
}
