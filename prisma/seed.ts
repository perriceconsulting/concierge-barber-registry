import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const specialties = [
  { name: 'Fades', slug: 'fades', icon: '✂️' },
  { name: 'Tapers', slug: 'tapers', icon: '💈' },
  { name: 'Lineups', slug: 'lineups', icon: '📏' },
  { name: 'Beard Trim', slug: 'beard-trim', icon: '🧔' },
  { name: 'Beard Shaping', slug: 'beard-shaping', icon: '✨' },
  { name: 'Hot Towel Shave', slug: 'hot-towel-shave', icon: '🔥' },
  { name: 'Hair Systems', slug: 'hair-systems', icon: '💇' },
  { name: 'Hair Coloring', slug: 'hair-coloring', icon: '🎨' },
  { name: 'Kids Cuts', slug: 'kids-cuts', icon: '👦' },
  { name: 'Afro', slug: 'afro', icon: '🌀' },
  { name: 'Dreadlocks', slug: 'dreadlocks', icon: '🔗' },
  { name: 'Braids', slug: 'braids', icon: '🪢' },
  { name: 'Designs/Patterns', slug: 'designs-patterns', icon: '⭐' },
  { name: 'Scissor Cut', slug: 'scissor-cut', icon: '✂️' },
  { name: 'Flat Top', slug: 'flat-top', icon: '📐' },
  { name: 'Mohawk', slug: 'mohawk', icon: '🦅' },
  { name: 'Mullet', slug: 'mullet', icon: '🎸' },
  { name: 'Senior Cuts', slug: 'senior-cuts', icon: '👴' },
  { name: 'Head Shave', slug: 'head-shave', icon: '🪒' },
  { name: 'Eyebrow Threading', slug: 'eyebrow-threading', icon: '👁️' },
  { name: 'Facial Treatment', slug: 'facial-treatment', icon: '🧖' },
];

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing specialties
  await prisma.specialty.deleteMany({});
  console.log('🗑️  Cleared existing specialties');

  // Seed specialties
  for (const specialty of specialties) {
    await prisma.specialty.create({
      data: specialty,
    });
    console.log(`✅ Created specialty: ${specialty.name}`);
  }

  console.log(`\n🎉 Successfully seeded ${specialties.length} specialties!`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
