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

  // 4. Seed Default Artisan User
  const artisanEmail = 'artisan@fixmate.ng';
  const artisanPhone = '+2348077778888';
  let existingArtisan = await prisma.user.findFirst({
    where: { OR: [{ email: artisanEmail }, { phoneNumber: artisanPhone }] },
  });

  if (!existingArtisan) {
    const passwordHash = await bcrypt.hash('Password123!', 12);
    existingArtisan = await prisma.user.create({
      data: {
        email: artisanEmail,
        phoneNumber: artisanPhone,
        passwordHash,
        role: 'ARTISAN',
        status: 'ACTIVE',
        isEmailVerified: true,
        isPhoneVerified: true,
        isKycVerified: true,
        wallet: {
          create: {
            availableBalance: 120000.0,
            escrowLockedBalance: 45000.0,
            currency: 'NGN',
          },
        },
        bankAccounts: {
          create: {
            bankName: 'Guaranty Trust Bank',
            bankCode: '058',
            accountNumber: '0123456789',
            accountName: 'Masterfix Electrical Services',
            isDefault: true,
          },
        },
        artisanProfile: {
          create: {
            businessName: 'Masterfix Electrical & Solar Tech',
            tagline: 'Certified Solar Inverter & Smart Home Installation Expert',
            bio: 'Over 8 years experience delivering high-voltage domestic wiring, 5kVA - 20kVA solar inverter banks, and industrial electrical maintenance across Lagos State.',
            yearsOfExperience: 8,
            hourlyRate: 7500.0,
            state: 'Lagos',
            lgaCity: 'Ikeja',
            address: 'Plot 12, Commercial Avenue, Ikeja, Lagos',
            ratingAvg: 4.9,
            reviewCount: 14,
            completedJobsCount: 22,
            isAvailable: true,
            portfolios: {
              create: [
                {
                  title: '10kVA Hybrid Solar Inverter System Setup',
                  description: 'Installed 16 x 550W Canadian mono solar panels with 2 x 10kWh lithium battery bank and surge protection units.',
                  mediaUrls: ['https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800&auto=format&fit=crop'],
                },
                {
                  title: 'Full Duplex Conduit Piping & DB Screeding',
                  description: 'Complete 5-bedroom duplex conduit installation, distribution board layout, and earthing installation.',
                  mediaUrls: ['https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop'],
                },
              ],
            },
            services: {
              create: [
                {
                  title: 'Solar Inverter Inspection & Battery Health Diagnostic',
                  description: 'Full battery internal resistance test, inverter firmware calibration, and load optimization.',
                  price: 25000.0,
                  deliveryDays: 1,
                  isActive: true,
                },
                {
                  title: 'Distribution Board (DB) Re-wiring & Surge Protection',
                  description: 'Removal of faulty circuit breakers, installation of new Schneider MCBs and RCD lightning arresters.',
                  price: 45000.0,
                  deliveryDays: 2,
                  isActive: true,
                },
              ],
            },
          },
        },
      },
    });
    console.log('✅ Created default Artisan account: artisan@fixmate.ng (Password: Password123!)');
  }

  // 5. Seed Default Client & Sample Job
  const clientEmail = 'client@fixmate.ng';
  const clientPhone = '+2348099990000';
  let existingClient = await prisma.user.findFirst({
    where: { OR: [{ email: clientEmail }, { phoneNumber: clientPhone }] },
  });

  if (!existingClient) {
    const passwordHash = await bcrypt.hash('Password123!', 12);
    existingClient = await prisma.user.create({
      data: {
        email: clientEmail,
        phoneNumber: clientPhone,
        passwordHash,
        role: 'CLIENT',
        status: 'ACTIVE',
        isEmailVerified: true,
        isPhoneVerified: true,
        wallet: {
          create: {
            availableBalance: 250000.0,
            escrowLockedBalance: 0.0,
            currency: 'NGN',
          },
        },
        clientProfile: {
          create: {
            firstName: 'Tunde',
            lastName: 'Balogun',
            state: 'Lagos',
            city: 'Lekki Phase 1',
          },
        },
      },
    });
    console.log('✅ Created default Client account: client@fixmate.ng (Password: Password123!)');

    // Create Sample Open Job
    const electricalCat = await prisma.jobCategory.findFirst({ where: { slug: 'electrical-and-wiring' } });
    if (electricalCat) {
      await prisma.job.create({
        data: {
          clientId: existingClient.id,
          categoryId: electricalCat.id,
          title: '5kVA Solar Inverter Installation & Battery Integration',
          description: 'Looking for a certified solar technician to install a 5kVA Felicity hybrid inverter, 8 solar panels on a tile roof, and connect to the main distribution board.',
          budgetType: 'MILESTONE_BASED',
          budgetMin: 80000.0,
          budgetMax: 120000.0,
          state: 'Lagos',
          lgaCity: 'Lekki Phase 1',
          address: 'Admiralty Way, Lekki Phase 1',
          status: 'OPEN',
        },
      });
      console.log('✅ Created sample open job in Electrical & Wiring');
    }
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
