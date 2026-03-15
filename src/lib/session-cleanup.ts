import { prisma } from '@/lib/db';
import { createLogger } from '@/lib/logger';

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

    const sessionLogger = createLogger('SESSION_CLEANUP');
    sessionLogger.info(`Deleted ${totalDeleted} sessions: ${deletedExpired.count} expired, ${deletedRevoked.count} old revoked`);

    return {
      deletedCount: totalDeleted,
      deletedExpired: deletedExpired.count,
      deletedRevoked: deletedRevoked.count,
    };
  } catch (error) {
    createLogger('SESSION_CLEANUP').error('Error cleaning up sessions:', error);
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

    createLogger('TOKEN_CLEANUP').info(`Deleted ${result.count} expired verification tokens`);

    return { deletedCount: result.count };
  } catch (error) {
    createLogger('TOKEN_CLEANUP').error('Error cleaning up verification tokens:', error);
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
  createLogger('CLEANUP').info('Starting cleanup...');

  const [sessions, tokens] = await Promise.all([
    cleanupExpiredSessions(),
    cleanupExpiredVerificationTokens(),
  ]);

  createLogger('CLEANUP').info('Cleanup completed successfully');

  return { sessions, tokens };
}
