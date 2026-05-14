// Script per associare l'utente client-1 al cliente Clinica Dentale Rossi
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const clientId = '34e85227-82d5-45dc-9926-2ea72c0bb18f';
  const userId = 'client-1';

  console.log(`Checking users in database...`);

  // Lista tutti gli utenti
  const allUsers = await prisma.user.findMany();
  console.log('All users:', allUsers.map(u => ({ id: u.id, email: u.email, role: u.role, clientId: u.clientId })));

  // Verifica che il client esista
  const client = await prisma.client.findUnique({
    where: { id: clientId }
  });

  if (!client) {
    console.error(`Client ${clientId} not found!`);
    process.exit(1);
  }

  console.log(`Found client: ${client.studioName}`);

  // Cerca o crea l'utente client-1
  let user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    console.log(`User ${userId} not found, creating...`);
    user = await prisma.user.create({
      data: {
        id: userId,
        email: 'client@example.com',
        name: 'Clinica Dentale Rossi',
        role: 'client',
        clientId: clientId,
      }
    });
    console.log('Created user:', user);
  } else {
    // Aggiorna l'utente esistente
    user = await prisma.user.update({
      where: { id: userId },
      data: { clientId: clientId },
      include: { client: true }
    });
    console.log('Updated user:', user);
  }

  console.log('✅ Fix completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
