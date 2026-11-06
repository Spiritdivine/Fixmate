import prisma from '../src/config/db.js';
import bcrypt from 'bcryptjs';

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
  const adminEmail = 'admin@artifixhq.xyz';
  let existingAdmin = await prisma.user.findFirst({
    where: { email: { in: ['admin@artifixhq.xyz', 'admin@artisanplatform.com'] } },
  });

  if (existingAdmin && existingAdmin.email !== adminEmail) {
    existingAdmin = await prisma.user.update({
      where: { id: existingAdmin.id },
      data: { email: adminEmail },
    });
    console.log(`🔄 Migrated admin account email to ${adminEmail}`);
  }

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
    console.log('✅ Created default Admin account: admin@artifixhq.xyz (Password: Admin@123456)');
  }

  // 4. Seed Verified Multi-Trade Artisan Registry
  const passwordHash = await bcrypt.hash('Password123!', 12);

  const artisanSeedMatrix = [
    // A. Masterfix Electrical & Solar Tech - Ikeja, Lagos
    {
      email: 'artisan@artifixhq.xyz',
      phone: '+2348077778888',
      firstName: 'Sunday',
      lastName: 'Ogundipe',
      businessName: 'Masterfix Electrical & Solar Tech',
      tagline: 'Certified Solar Inverter & Smart Home Installation Expert',
      bio: 'Over 8 years experience delivering high-voltage domestic wiring, 5kVA - 20kVA solar inverter banks, and industrial electrical maintenance across Lagos State.',
      yearsOfExperience: 8,
      hourlyRate: 7500.0,
      state: 'Lagos',
      lgaCity: 'Ikeja',
      address: 'Plot 12, Commercial Avenue, Ikeja, Lagos',
      latitude: 6.5952,
      longitude: 3.3512,
      ratingAvg: 4.92,
      reviewCount: 42,
      completedJobsCount: 61,
      categorySlug: 'electrical-and-wiring',
      skills: ['Inverter Installation', 'Solar Panel Wiring', 'Conduit Piping', 'Fault Finding', 'House Wiring'],
    },
    // B. Lekki Circuit & Surge Defense - Lekki Phase 1, Lagos
    {
      email: 'electrical.lekki@artifixhq.xyz',
      phone: '+2348031110003',
      firstName: 'Oluwaseun',
      lastName: 'Fashola',
      businessName: 'Lekki Circuit & Surge Defense Systems',
      tagline: 'Distribution Board Re-wiring & Arc Fault Specialist',
      bio: 'Specialized in single-phase and three-phase domestic distribution boards, surge protection, earthing installation, and emergency electrical troubleshooting in Lekki and Ikoyi.',
      yearsOfExperience: 10,
      hourlyRate: 9000.0,
      state: 'Lagos',
      lgaCity: 'Lekki Phase 1',
      address: '15 Freedom Way, Lekki Phase 1, Lagos',
      latitude: 6.4421,
      longitude: 3.4812,
      ratingAvg: 4.97,
      reviewCount: 29,
      completedJobsCount: 45,
      categorySlug: 'electrical-and-wiring',
      skills: ['House Wiring', 'Fault Finding', 'Conduit Piping', 'Inverter Installation'],
    },
    // C. Adeleke Hydro-Works & Sanitary Tech - Lekki Phase 1, Lagos (PLUMBING)
    {
      email: 'plumber.lekki@artifixhq.xyz',
      phone: '+2348031110001',
      firstName: 'Babajide',
      lastName: 'Adeleke',
      businessName: 'Adeleke Hydro-Works & Sanitary Tech',
      tagline: 'Certified PPR Fusion Welder & Master Pipefitter',
      bio: 'Over 9 years of specialized experience in high-pressure plumbing, PPR leak diagnostics, bathroom sanitary fittings, and water heater engineering across Lekki, Ikoyi, and Victoria Island.',
      yearsOfExperience: 9,
      hourlyRate: 8500.0,
      state: 'Lagos',
      lgaCity: 'Lekki Phase 1',
      address: 'Plot 8, Admiralty Way, Lekki Phase 1, Lagos',
      latitude: 6.4474,
      longitude: 3.4731,
      ratingAvg: 4.95,
      reviewCount: 38,
      completedJobsCount: 52,
      categorySlug: 'plumbing-and-pipefitting',
      skills: ['PPR Pipe Welding', 'Bathroom Sanitary Fitting', 'Water Heater Repair', 'Drainage Unclogging'],
    },
    // D. Apex Piping & Leak Diagnostics - Ikeja / Mainland, Lagos (PLUMBING)
    {
      email: 'plumber.ikeja@artifixhq.xyz',
      phone: '+2348031110002',
      firstName: 'Emeka',
      lastName: 'Nnamdi',
      businessName: 'Apex Hydro Pressure & Leak Diagnostics',
      tagline: 'Industrial Drainage Unclogging & Submersible Pump Specialist',
      bio: 'Expert in plumbing diagnostic inspections, burst pipe mitigation, sewage piping, and domestic pumping machine repair across the Lagos Mainland.',
      yearsOfExperience: 7,
      hourlyRate: 7000.0,
      state: 'Lagos',
      lgaCity: 'Ikeja',
      address: '22 Allen Avenue, Ikeja, Lagos',
      latitude: 6.5952,
      longitude: 3.3512,
      ratingAvg: 4.88,
      reviewCount: 24,
      completedJobsCount: 39,
      categorySlug: 'plumbing-and-pipefitting',
      skills: ['PPR Pipe Welding', 'Pumping Machine Repair', 'Drainage Unclogging', 'Water Heater Repair'],
    },
    // E. CoolBreeze HVAC & Chiller Services - Victoria Island, Lagos (HVAC)
    {
      email: 'hvac.lagos@artifixhq.xyz',
      phone: '+2348031110004',
      firstName: 'Kabir',
      lastName: 'Suleiman',
      businessName: 'CoolBreeze HVAC & Chiller Engineering',
      tagline: 'Inverter AC Precision Diagnosis & Chemical Coil Descaling',
      bio: 'Commercial and residential HVAC technician. Certified in R410a/R32 gas charging, compressor replacements, and split-unit inverter PCB troubleshooting.',
      yearsOfExperience: 8,
      hourlyRate: 8000.0,
      state: 'Lagos',
      lgaCity: 'Victoria Island',
      address: 'Ahmadu Bello Way, VI, Lagos',
      latitude: 6.4281,
      longitude: 3.4219,
      ratingAvg: 4.91,
      reviewCount: 31,
      completedJobsCount: 48,
      categorySlug: 'hvac-and-ac-repair',
      skills: ['AC Gas Refill', 'Compressor Replacement', 'Split Unit Servicing'],
    },
    // F. Capital Hydrotech & Pipe Reticulation - Maitama, Abuja (PLUMBING)
    {
      email: 'plumber.abuja@artifixhq.xyz',
      phone: '+2348031110005',
      firstName: 'Mustapha',
      lastName: 'Aliyu',
      businessName: 'Capital Hydrotech & Borehole Systems',
      tagline: 'FCT Certified Sanitary & Pipe Reticulation Engineer',
      bio: 'Premier plumbing contractor serving Maitama, Asokoro, and Wuse 2. Turnkey residential piping, booster pump systems, and leak containment.',
      yearsOfExperience: 11,
      hourlyRate: 10000.0,
      state: 'FCT',
      lgaCity: 'Maitama',
      address: 'Gana Street, Maitama, Abuja',
      latitude: 9.0820,
      longitude: 7.4913,
      ratingAvg: 4.98,
      reviewCount: 46,
      completedJobsCount: 72,
      categorySlug: 'plumbing-and-pipefitting',
      skills: ['PPR Pipe Welding', 'Borehole Drilling', 'Bathroom Sanitary Fitting', 'Drainage Unclogging'],
    },
    // G. Abuja Grid-Tie Power & Maintenance - Wuse 2, Abuja (ELECTRICAL)
    {
      email: 'electrical.abuja@artifixhq.xyz',
      phone: '+2348031110006',
      firstName: 'Ibrahim',
      lastName: 'Garba',
      businessName: 'Abuja Grid-Tie Solar & Power Maintenance',
      tagline: 'Solar Hybrid Systems & Industrial Automation',
      bio: 'Certified automation and power plant technician. Residential load balancing, changeover switches, and automatic voltage regulator (AVR) repairs.',
      yearsOfExperience: 9,
      hourlyRate: 9500.0,
      state: 'FCT',
      lgaCity: 'Wuse 2',
      address: 'Aminu Kano Crescent, Wuse 2, Abuja',
      latitude: 9.0765,
      longitude: 7.4722,
      ratingAvg: 4.89,
      reviewCount: 22,
      completedJobsCount: 35,
      categorySlug: 'electrical-and-wiring',
      skills: ['Inverter Installation', 'Generator Maintenance', 'House Wiring', 'Fault Finding'],
    },
  ];

  for (const item of artisanSeedMatrix) {
    let user = await prisma.user.findFirst({
      where: { OR: [{ email: item.email }, { phoneNumber: item.phone }] },
      include: { artisanProfile: true },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: item.email,
          phoneNumber: item.phone,
          passwordHash,
          role: 'ARTISAN',
          status: 'ACTIVE',
          isEmailVerified: true,
          isPhoneVerified: true,
          isKycVerified: true,
          wallet: {
            create: {
              availableBalance: 150000.0,
              escrowLockedBalance: 0.0,
              currency: 'NGN',
            },
          },
          artisanProfile: {
            create: {
              firstName: item.firstName,
              lastName: item.lastName,
              businessName: item.businessName,
              tagline: item.tagline,
              bio: item.bio,
              yearsOfExperience: item.yearsOfExperience,
              hourlyRate: item.hourlyRate,
              state: item.state,
              lgaCity: item.lgaCity,
              address: item.address,
              latitude: item.latitude,
              longitude: item.longitude,
              ratingAvg: item.ratingAvg,
              reviewCount: item.reviewCount,
              completedJobsCount: item.completedJobsCount,
              isAvailable: true,
            },
          },
        },
        include: { artisanProfile: true },
      });
    } else if (user.artisanProfile) {
      // Ensure existing profile has up-to-date coordinates, availability, and details
      await prisma.artisanProfile.update({
        where: { id: user.artisanProfile.id },
        data: {
          firstName: item.firstName,
          lastName: item.lastName,
          businessName: item.businessName,
          state: item.state,
          lgaCity: item.lgaCity,
          address: item.address,
          latitude: item.latitude,
          longitude: item.longitude,
          isAvailable: true,
          ratingAvg: item.ratingAvg,
          reviewCount: item.reviewCount,
        },
      });
    }

    // Connect skills to ArtisanSkill
    if (user?.artisanProfile) {
      for (const skillName of item.skills) {
        const skillRecord = await prisma.skill.findFirst({
          where: { name: skillName },
        });
        if (skillRecord) {
          await prisma.artisanSkill.upsert({
            where: {
              artisanProfileId_skillId: {
                artisanProfileId: user.artisanProfile.id,
                skillId: skillRecord.id,
              },
            },
            update: {},
            create: {
              artisanProfileId: user.artisanProfile.id,
              skillId: skillRecord.id,
            },
          });
        }
      }
    }

    console.log(`✅ Seeded Verified Specialist: ${item.businessName} (${item.state})`);
  }

  // 5. Seed Default Client & Sample Job
  const clientEmail = 'client@artifixhq.xyz';
  const clientPhone = '+2348099990000';
  let existingClient = await prisma.user.findFirst({
    where: { OR: [{ email: clientEmail }, { phoneNumber: clientPhone }] },
  });

  if (!existingClient) {
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
    console.log('✅ Created default Client account: client@artifixhq.xyz (Password: Password123!)');

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

  // 12. Seed Official Trade Knowledge Sources (Nigerian Building & Safety Codes)
  const knowledgeSources = [
    {
      sourceCode: 'NIS_IEC_60364_ELEC_STANDARDS',
      trade: 'Electrical & Wiring',
      title: 'Nigerian Electrical Installation Regulations (NIS/IEC 60364)',
      content: 'Specifies minimum cross-sectional conductor sizes: 1.5mm² for lighting circuits (10A breaker), 2.5mm² for radial socket outlets (16A breaker), 4.0mm² for water heaters and air conditioning units (25A/32A breaker). Earthing resistance must not exceed 5 ohms.',
      riskLevel: 'high',
      status: 'APPROVED',
      reviewedBy: 'Chief Electrical Inspector',
      reviewedAt: new Date(),
    },
    {
      sourceCode: 'LASBCA_PLUMBING_CODE_PPR',
      trade: 'Plumbing & Pipefitting',
      title: 'Lagos State Building Control Agency - Water & Drainage Standards',
      content: 'All concealed pressurized water lines must use PPR (Polypropylene Random Copolymer) or CPVC with fusion welding at 260°C ± 10°C. Hydrostatic pressure testing at 1.5x working pressure (min 8 bar) required for 2 hours prior to wall screeding.',
      riskLevel: 'moderate',
      status: 'APPROVED',
      reviewedBy: 'LASBCA Structural Engineer',
      reviewedAt: new Date(),
    },
    {
      sourceCode: 'ASHRAE_REFRIGERATION_R410A',
      trade: 'HVAC & Air Conditioning',
      title: 'Refrigerant Recovery and Evacuation Safety Standards',
      content: 'Systems operating on R410A and R32 refrigerants require nitrogen pressure leak testing followed by vacuum drawdown to at least 500 microns. Direct top-up without leak resolution is strictly prohibited due to fractionation risks.',
      riskLevel: 'professional_only',
      status: 'APPROVED',
      reviewedBy: 'HVAC Safety Council',
      reviewedAt: new Date(),
    },
  ];

  for (const ks of knowledgeSources) {
    await prisma.knowledgeSource.upsert({
      where: { sourceCode: ks.sourceCode },
      update: ks,
      create: ks,
    });
  }
  console.log(`✅ Seeded ${knowledgeSources.length} official trade knowledge sources`);

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
