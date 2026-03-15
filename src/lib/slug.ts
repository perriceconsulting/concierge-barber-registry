import { prisma } from '@/lib/db';
import crypto from 'crypto';

/**
 * Generate a URL-friendly slug from text
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100); // Limit slug length
}

/**
 * Generate a unique slug for a barber profile with collision prevention
 * Attempts to use the display name, falls back to variations with suffix if collision exists
 */
export async function generateUniqueBarberSlug(
  displayName: string,
  userId: string
): Promise<string> {
  const baseSlug = slugify(displayName) || `barber-${userId.substring(0, 8)}`;

  // Check if base slug is available
  const existingProfile = await prisma.barberProfile.findUnique({
    where: { slug: baseSlug },
    select: { id: true },
  });

  // If no collision, use the base slug
  if (!existingProfile) {
    return baseSlug;
  }

  // Collision detected - try with random suffix
  const maxAttempts = 5;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    // Generate random 4-character suffix
    const suffix = crypto.randomBytes(2).toString('hex');
    const candidateSlug = `${baseSlug}-${suffix}`;

    const collision = await prisma.barberProfile.findUnique({
      where: { slug: candidateSlug },
      select: { id: true },
    });

    if (!collision) {
      return candidateSlug;
    }
  }

  // Fallback: use UUID-based slug (guaranteed unique)
  const fallbackSlug = `${baseSlug}-${userId.substring(0, 8)}`;
  return fallbackSlug;
}

/**
 * Validate that a slug meets requirements
 */
export function isValidSlug(slug: string): boolean {
  // Must be 1-100 characters, lowercase alphanumeric with hyphens
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug) && slug.length >= 1 && slug.length <= 100;
}
