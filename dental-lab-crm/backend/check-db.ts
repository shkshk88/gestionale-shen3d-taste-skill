import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    const casesCount = await prisma.case.count();
    const clientsCount = await prisma.client.count();
    const usersCount = await prisma.user.count();

    console.log('\n=== DATABASE STATUS ===');
    console.log(`Cases: ${casesCount}`);
    console.log(`Clients: ${clientsCount}`);
    console.log(`Users: ${usersCount}`);

    if (casesCount > 0) {
      console.log('\n=== SAMPLE CASES ===');
      const cases = await prisma.case.findMany({
        take: 5,
        select: {
          caseNumber: true,
          patientName: true,
          status: true,
          dueDate: true,
        },
      });
      console.table(cases);
    }

    if (clientsCount > 0) {
      console.log('\n=== SAMPLE CLIENTS ===');
      const clients = await prisma.client.findMany({
        take: 3,
        select: {
          studioName: true,
          email: true,
          active: true,
        },
      });
      console.table(clients);
    }
  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
