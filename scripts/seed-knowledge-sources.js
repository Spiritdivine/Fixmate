import prisma from '../src/config/db.js';

async function seedKnowledge() {
  console.log('🌱 Seeding KnowledgeSource entries...');
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
    console.log(`  ✓ Seeded: [${ks.sourceCode}] ${ks.title}`);
  }

  console.log('✅ Knowledge sources seeded successfully!');
}

seedKnowledge()
  .catch((e) => {
    console.error('❌ Error seeding knowledge sources:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
