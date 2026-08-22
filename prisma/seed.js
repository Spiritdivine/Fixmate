import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Seed Categories & Skills
  const categories = [
    {
      name: 'Electrical & Wiring',
      slug: 'electrical-and-wiring',
      skills: ['Inverter Installation', 'Solar Panel Wiring', 'Conduit Piping', 'Generator Maintenance', 'House Wiring', 'Fault Finding'],
    },
    {
      name: 'Plumbing & Pipefitting',
      slug: 'plumbing-and-pipefitting',
      skills: ['PPR Pipe Welding', 'Borehole Drilling', 'Water Heater Repair', 'Drainage Unclogging', 'Bathroom Sanitary Fitting', 'Pumping Machine Repair'],
    },
    {
      name: 'Carpentry & Woodwork',
      slug: 'carpentry-and-woodwork',
      skills: ['Roof Truss Construction', 'Kitchen Cabinet Making', 'Door Frame Installation', 'Furniture Restoration', 'Wardrobe Crafting'],
    },
    {
      name: 'Masonry & Tiling',
      slug: 'masonry-and-tiling',
      skills: ['Interlocking Paving', 'Ceramic Tile Laying', 'Granite & Marble Fitting', 'Plastering & POP Screeding', 'Bricklaying'],
    },
    {
      name: 'HVAC & Air Conditioning',
      slug: 'hvac-and-ac-repair',
      skills: ['AC Gas Refill', 'Compressor Replacement', 'Chiller Installation', 'Split Unit Servicing', 'Duct Installation'],
    },
    {
      name: 'Painting & POP Ceiling',
      slug: 'painting-and-pop',
      skills: ['POP Ceiling Design', 'Emulsion Painting', 'Screeding & Sanding', '3D Wall Panel Fitting', 'Waterproofing & Epoxy Floor'],
    },
  ];

  for (const cat of categories) {
    const createdCat = await prisma.jobCategory.upsert({
      where: { slug: cat.slug },
      update: {},
      create: {
        name: cat.name,
        slug: cat.slug,
        isActive: true,
      },
    });

    for (const skillName of cat.skills) {
      const skillSlug = skillName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      await prisma.skill.upsert({
        where: { name: skillName },
        update: {},
        create: {
          categoryId: createdCat.id,
          name: skillName,
          slug: skillSlug,
        },
      });
    }
  }

  // 2. Seed Default System Settings
  const settings = [
    { key: 'ESCROW_FEE_PERCENT', value: '5.00', description: 'Platform fee percentage deducted from completed milestones' },
    { key: 'WITHDRAWAL_MIN_AMOUNT', value: '1000.00', description: 'Minimum allowed wallet withdrawal amount in NGN' },
    { key: 'ESCROW_AUTO_RELEASE_DAYS', value: '14', description: 'Grace period before submitted milestone automatically releases' },
  ];

  for (const setting of settings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  // 3. Seed Default Admin User
  const adminEmail = 'admin@artisanplatform.com';
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('Admin@123456', 12);
    await prisma.user.create({
      data: {
        email: adminEmail,
        phoneNumber: '+2348000000000',
        passwordHash,
        role: 'ADMIN',
        status: 'ACTIVE',
        isEmailVerified: true,
        isPhoneVerified: true,
        isKycVerified: true,
        wallet: {
          create: {
            availableBalance: 0.0,
            escrowLockedBalance: 0.0,
            currency: 'NGN',
          },
        },
      },
    });
    console.log('✅ Created default Admin account: admin@artisanplatform.com (Password: Admin@123456)');
  }

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
