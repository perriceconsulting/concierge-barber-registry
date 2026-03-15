import { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { createLogger } from '@/lib/logger';

const logger = createLogger('METADATA');

export async function generateBarberMetadata(slug: string): Promise<Metadata> {
  try {
    const barberProfile = await prisma.barberProfile.findUnique({
      where: { slug },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        specialties: {
          include: {
            specialty: true,
          },
        },
        portfolioImages: {
          orderBy: { sortOrder: 'asc' },
          take: 3,
        },
      },
    });

    if (!barberProfile) {
      return {
        title: 'Barber Not Found',
        description: 'The barber profile you are looking for could not be found.',
      };
    }

    const barberName = barberProfile.displayName;
    const location = `${barberProfile.city}, ${barberProfile.state}`;
    const specialtiesText = barberProfile.specialties
      .map((s) => s.specialty.name)
      .join(', ');

    const description = barberProfile.bio
      ? `${barberProfile.bio.substring(0, 145)}... ${barberProfile.yearsExperience ? `${barberProfile.yearsExperience} years experience.` : ''} View portfolio, services, pricing, and client reviews.`
      : `Professional barber in ${location}. ${barberProfile.yearsExperience ? `${barberProfile.yearsExperience} years experience.` : ''} Specializing in ${specialtiesText}. View portfolio and book appointments.`;

    const keywords = [
      barberName,
      `barber ${barberProfile.city}`,
      `${barberProfile.city} barber`,
      `barber in ${location}`,
      `best barber ${barberProfile.city}`,
      ...barberProfile.specialties.map((s) => s.specialty.name.toLowerCase()),
      ...barberProfile.specialties.map((s) => `${s.specialty.name.toLowerCase()} ${barberProfile.city}`),
    ];

    return {
      title: `${barberName} - Professional Barber in ${location}`,
      description,
      keywords,
      openGraph: {
        title: barberProfile.tagline
          ? `${barberName} | ${barberProfile.tagline}`
          : `${barberName} - Professional Barber`,
        description,
        type: 'profile',
        url: `/barbers/${barberProfile.slug}`,
        images: barberProfile.portfolioImages.map((img) => ({
          url: img.imageUrl,
          alt: img.caption || `${barberName}'s work`,
          width: 1200,
          height: 630,
        })),
        locale: 'en_US',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${barberName} - ${location}`,
        description,
        images: barberProfile.portfolioImages.length > 0
          ? [barberProfile.portfolioImages[0].imageUrl]
          : undefined,
      },
      alternates: {
        canonical: `/barbers/${barberProfile.slug}`,
      },
    };
  } catch (error) {
    logger.error('Error generating barber metadata:', error);
    return {
      title: 'Barber Profile',
      description: 'View barber profile, portfolio, and reviews.',
    };
  }
}
