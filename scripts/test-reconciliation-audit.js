import prisma from '../src/config/db.js';
import { ReconciliationService } from '../src/services/reconciliation.service.js';

async function testReconciliationAudit() {
  console.log('📊 Testing Automated Daily Financial Reconciliation Worker...');

  const report = await ReconciliationService.performDailyReconciliation();

  console.log('\n📈 Generated Reconciliation Report:');
  console.log(`   Report ID:           ${report.id}`);
  console.log(`   Audited Date:        ${new Date(report.date).toISOString().split('T')[0]}`);
  console.log(`   Paystack Balance:    ₦${Number(report.paystackBalanceNgn).toLocaleString()}`);
  console.log(`   DB Available NGN:    ₦${Number(report.dbTotalAvailableNgn).toLocaleString()}`);
  console.log(`   DB Locked NGN:       ₦${Number(report.dbTotalLockedNgn).toLocaleString()}`);
  console.log(`   NGN Variance:        ₦${Number(report.ngnVariance).toLocaleString()}`);
  console.log(`   Monad Escrow USDC:   $${Number(report.monadEscrowUsdc)}`);
  console.log(`   DB Active USDC:      $${Number(report.dbActiveCryptoEscrow)}`);
  console.log(`   USDC Variance:       $${Number(report.cryptoVariance)}`);
  console.log(`   Audit Health Status: [${report.status}]`);

  if (!report.id || !report.status) {
    throw new Error('Reconciliation failed to generate a valid report');
  }

  const savedReport = await prisma.dailyFinancialReport.findUnique({
    where: { id: report.id },
  });

  if (!savedReport) {
    throw new Error('Report was not persisted to PostgreSQL');
  }

  console.log('\n🎉 FINANCIAL RECONCILIATION WORKER TEST PASSED!');
}

testReconciliationAudit()
  .catch((err) => {
    console.error('❌ Reconciliation Test Failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
