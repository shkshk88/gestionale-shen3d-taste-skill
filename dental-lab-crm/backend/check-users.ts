import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('\n=== ALL USERS IN DATABASE ===');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        clientId: true,
      },
    });
    console.table(users);

    console.log('\n=== ALL CLIENTS IN DATABASE ===');
    const clients = await prisma.client.findMany({
      select: {
        id: true,
        studioName: true,
        email: true,
        contactPerson: true,
      },
    });
    console.table(clients);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
