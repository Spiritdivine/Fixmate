import { EmailService } from '../src/services/email.service.js';

async function sendTest() {
  console.log('Sending live test beta welcome email to 01spiritdivine@gmail.com...');
  const res = await EmailService.sendBetaWelcomeEmail({
    to: '01spiritdivine@gmail.com',
    fullName: 'Spirit Divine',
    role: 'client',
    ticketId: 'AFX-BETA-491823',
    city: 'Abuja',
  });
  console.log('Dispatch result:', JSON.stringify(res, null, 2));
}

sendTest().catch(console.error);
