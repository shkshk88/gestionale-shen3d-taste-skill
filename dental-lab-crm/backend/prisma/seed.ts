import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create Price Lists
  const standardPriceList = await prisma.priceList.create({
    data: {
      listName: 'Listino Standard',
      description: 'Listino prezzi base per tutti i clienti',
      isDefault: true,
      items: {
        create: [
          { workType: 'corona', material: 'ZR', unitPrice: 180 },
          { workType: 'corona', material: 'EMAX', unitPrice: 200 },
          { workType: 'corona', material: 'PMMA', unitPrice: 60 },
          { workType: 'corona', material: 'CERAM', unitPrice: 150 },
          { workType: 'corona', material: 'CR_CO', unitPrice: 120 },
          { workType: 'protesi', material: 'ZR', unitPrice: 220 },
          { workType: 'protesi', material: 'PMMA', unitPrice: 80 },
          { workType: 'protesi', material: 'RES', unitPrice: 70 },
          { workType: 'impianto', material: 'ZR', unitPrice: 250 },
          { workType: 'impianto', material: 'EMAX', unitPrice: 280 },
          { workType: 'faccetta', material: 'EMAX', unitPrice: 220 },
          { workType: 'faccetta', material: 'CERAM', unitPrice: 180 },
          { workType: 'faccetta', material: 'COMP', unitPrice: 120 },
          { workType: 'intarsio', material: 'EMAX', unitPrice: 160 },
          { workType: 'intarsio', material: 'COMP', unitPrice: 100 },
          { workType: 'bite', material: 'PMMA', unitPrice: 150 },
          { workType: 'bite', material: 'RES', unitPrice: 120 },
          { workType: 'maryland', material: 'ZR', unitPrice: 300 },
          { workType: 'maryland', material: 'EMAX', unitPrice: 320 },
        ],
      },
    },
  });

  const premiumPriceList = await prisma.priceList.create({
    data: {
      listName: 'Listino Premium',
      description: 'Prezzi scontati per clienti premium',
      isDefault: false,
      items: {
        create: [
          { workType: 'corona', material: 'ZR', unitPrice: 150 },
          { workType: 'corona', material: 'EMAX', unitPrice: 170 },
          { workType: 'protesi', material: 'ZR', unitPrice: 190 },
          { workType: 'impianto', material: 'ZR', unitPrice: 220 },
          { workType: 'faccetta', material: 'EMAX', unitPrice: 190 },
        ],
      },
    },
  });

  console.log('Created price lists');

  // Create Clients
  const clients = await Promise.all([
    prisma.client.create({
      data: {
        studioName: 'Clinica Dentale Rossi',
        contactPerson: 'Dr. Mario Rossi',
        address: 'Via Roma 123',
        city: 'Milano',
        postalCode: '20100',
        country: 'Italia',
        phone: '+39 02 1234567',
        email: 'info@clinicarossi.it',
        whatsapp: '+39 333 1234567',
        vatNumber: 'IT12345678901',
        priceListId: standardPriceList.id,
        notes: 'Cliente storico dal 2020',
      },
    }),
    prisma.client.create({
      data: {
        studioName: 'Studio Dr. Verdi',
        contactPerson: 'Dr. Anna Verdi',
        address: 'Corso Italia 45',
        city: 'Roma',
        postalCode: '00100',
        country: 'Italia',
        phone: '+39 06 7654321',
        email: 'studio@drverdi.it',
        whatsapp: '+39 333 7654321',
        vatNumber: 'IT98765432109',
        priceListId: premiumPriceList.id,
        notes: 'Preferisce materiali premium',
      },
    }),
    prisma.client.create({
      data: {
        studioName: 'Dental Care Center',
        contactPerson: 'Dr. Luca Bianchi',
        address: 'Piazza Duomo 10',
        city: 'Firenze',
        postalCode: '50100',
        country: 'Italia',
        phone: '+39 055 1122334',
        email: 'info@dentalcare.it',
        priceListId: standardPriceList.id,
      },
    }),
    prisma.client.create({
      data: {
        studioName: 'Smile Center Ferrari',
        contactPerson: 'Dr. Sofia Ferrari',
        address: 'Via Garibaldi 78',
        city: 'Torino',
        postalCode: '10100',
        country: 'Italia',
        phone: '+39 011 9988776',
        email: 'info@smilecenter.it',
        priceListId: standardPriceList.id,
      },
    }),
  ]);

  console.log('Created clients');

  // Create Dentists for each client
  const dentists = await Promise.all([
    // Dentists for Clinica Rossi (clients[0])
    prisma.dentist.create({
      data: {
        clientId: clients[0].id,
        name: 'Dr. Mario Rossi',
        email: 'mario.rossi@clinicarossi.it',
        phone: '+39 333 1234567',
        specialization: 'Protesi e Implantologia',
        active: true,
      },
    }),
    prisma.dentist.create({
      data: {
        clientId: clients[0].id,
        name: 'Dr. Laura Bianchi',
        email: 'laura.bianchi@clinicarossi.it',
        phone: '+39 333 7654321',
        specialization: 'Ortodonzia',
        active: true,
      },
    }),
    // Dentists for Studio Verdi (clients[1])
    prisma.dentist.create({
      data: {
        clientId: clients[1].id,
        name: 'Dr. Anna Verdi',
        email: 'anna.verdi@drverdi.it',
        phone: '+39 333 9876543',
        specialization: 'Chirurgia Orale',
        active: true,
      },
    }),
    prisma.dentist.create({
      data: {
        clientId: clients[1].id,
        name: 'Dr. Marco Neri',
        email: 'marco.neri@drverdi.it',
        specialization: 'Endodonzia',
        active: true,
      },
    }),
    // Dentist for Dental Care (clients[2]) - single dentist for testing auto-select
    prisma.dentist.create({
      data: {
        clientId: clients[2].id,
        name: 'Dr. Luca Bianchi',
        email: 'luca.bianchi@dentalcare.it',
        specialization: 'Odontoiatra Generale',
        active: true,
      },
    }),
    // Dentists for Smile Center (clients[3])
    prisma.dentist.create({
      data: {
        clientId: clients[3].id,
        name: 'Dr. Sofia Ferrari',
        email: 'sofia.ferrari@smilecenter.it',
        specialization: 'Estetica Dentale',
        active: true,
      },
    }),
    prisma.dentist.create({
      data: {
        clientId: clients[3].id,
        name: 'Dr. Giuseppe Russo',
        email: 'giuseppe.russo@smilecenter.it',
        specialization: 'Implantologia',
        active: true,
      },
    }),
  ]);

  console.log('Created dentists');

  // Create Admin Users (2 admin for management)
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@shen3d.com',
      name: 'Admin Principale',
      role: 'admin',
      language: 'it',
    },
  });

  const managerUser = await prisma.user.create({
    data: {
      email: 'manager@shen3d.com',
      name: 'Manager Lab',
      role: 'admin',
      language: 'it',
    },
  });

  const operatorUser = await prisma.user.create({
    data: {
      email: 'operatore@shen3d.com',
      name: 'Operatore Lab',
      role: 'operator',
      language: 'it',
    },
  });

  // Create Client Portal Users (SHENART, ALPHADENT, TEST)
  const shenartClient = await prisma.client.create({
    data: {
      studioName: 'SHENART Dental Studio',
      contactPerson: 'Admin SHENART',
      address: 'Via ShenArt 100',
      city: 'Milano',
      postalCode: '20100',
      country: 'Italia',
      phone: '+39 02 9999888',
      email: 'admin@shenart.it',
      priceListId: standardPriceList.id,
      notes: 'Cliente SHENART - Account principale',
    },
  });

  const alphadentClient = await prisma.client.create({
    data: {
      studioName: 'ALPHADENT Studio Odontoiatrico',
      contactPerson: 'Admin ALPHADENT',
      address: 'Via Alpha 200',
      city: 'Roma',
      postalCode: '00100',
      country: 'Italia',
      phone: '+39 06 7777666',
      email: 'admin@alphadent.it',
      priceListId: premiumPriceList.id,
      notes: 'Cliente ALPHADENT - Account principale',
    },
  });

  const testClient = await prisma.client.create({
    data: {
      studioName: 'TEST Studio (Interno)',
      contactPerson: 'Test User',
      address: 'Via Test 999',
      city: 'Torino',
      postalCode: '10100',
      country: 'Italia',
      phone: '+39 011 5555444',
      email: 'test@example.com',
      priceListId: standardPriceList.id,
      notes: 'Account di test per sviluppo interno',
    },
  });

  // Create dentists for new clients
  const deployDentists = await Promise.all([
    prisma.dentist.create({
      data: {
        clientId: shenartClient.id,
        name: 'Dr. Shen Artista',
        email: 'dr.shen@shenart.it',
        specialization: 'Protesi Avanzata',
        active: true,
      },
    }),
    prisma.dentist.create({
      data: {
        clientId: alphadentClient.id,
        name: 'Dr. Alpha Dentista',
        email: 'dr.alpha@alphadent.it',
        specialization: 'Implantologia',
        active: true,
      },
    }),
    prisma.dentist.create({
      data: {
        clientId: testClient.id,
        name: 'Dr. Test Tester',
        email: 'dr.test@example.com',
        specialization: 'Generale',
        active: true,
      },
    }),
  ]);

  // Create client portal users
  const clientUsers = await Promise.all([
    prisma.user.create({
      data: {
        email: 'mario.rossi@clinicarossi.it',
        name: 'Dr. Mario Rossi',
        role: 'client',
        language: 'it',
        clientId: clients[0].id,
      },
    }),
    prisma.user.create({
      data: {
        email: 'anna.verdi@drverdi.it',
        name: 'Dr. Anna Verdi',
        role: 'client',
        language: 'it',
        clientId: clients[1].id,
      },
    }),
    // SHENART portal user
    prisma.user.create({
      data: {
        email: 'admin@shenart.it',
        name: 'Admin SHENART',
        role: 'client',
        language: 'it',
        clientId: shenartClient.id,
      },
    }),
    // ALPHADENT portal user
    prisma.user.create({
      data: {
        email: 'admin@alphadent.it',
        name: 'Admin ALPHADENT',
        role: 'client',
        language: 'it',
        clientId: alphadentClient.id,
      },
    }),
    // TEST portal user
    prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        role: 'client',
        language: 'it',
        clientId: testClient.id,
      },
    }),
  ]);

  console.log('Created users');

  // Create Cases
  const now = new Date();
  const cases = await Promise.all([
    prisma.case.create({
      data: {
        caseNumber: 'LAB-2025-0001',
        clientId: clients[0].id,
        dentistId: dentists[0].id, // Dr. Mario Rossi
        patientName: 'Mario Bianchi',
        patientNotes: 'Paziente sensibile al metallo',
        status: 'in_progress',
        priority: 'urgent',
        receivedDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        dueDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
        createdBy: adminUser.id,
        teeth: {
          create: [
            { toothNumber: 11, workType: 'corona', material: 'ZR', vitaColor: 'A2', unitPrice: 180 },
            { toothNumber: 12, workType: 'corona', material: 'ZR', vitaColor: 'A2', unitPrice: 180 },
            { toothNumber: 21, workType: 'corona', material: 'ZR', vitaColor: 'A2', unitPrice: 180 },
            { toothNumber: 22, workType: 'corona', material: 'ZR', vitaColor: 'A2', unitPrice: 180 },
          ],
        },
        timeline: {
          create: [
            { eventType: 'created', eventData: JSON.stringify({ createdBy: 'Admin Shen3D' }), userId: adminUser.id },
            { eventType: 'status_changed', eventData: JSON.stringify({ newStatus: 'in_progress' }), userId: operatorUser.id },
          ],
        },
      },
    }),
    prisma.case.create({
      data: {
        caseNumber: 'LAB-2025-0002',
        clientId: clients[1].id,
        dentistId: dentists[2].id, // Dr. Anna Verdi
        patientName: 'Anna Lombardi',
        status: 'qc',
        priority: 'normal',
        receivedDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        dueDate: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
        createdBy: adminUser.id,
        teeth: {
          create: [
            { toothNumber: 14, workType: 'protesi', material: 'ZR', vitaColor: 'A3', unitPrice: 190 },
            { toothNumber: 15, workType: 'protesi', material: 'ZR', vitaColor: 'A3', unitPrice: 190 },
            { toothNumber: 16, workType: 'protesi', material: 'ZR', vitaColor: 'A3', unitPrice: 190 },
            { toothNumber: 17, workType: 'protesi', material: 'ZR', vitaColor: 'A3', unitPrice: 190 },
          ],
        },
        timeline: {
          create: [
            { eventType: 'created', eventData: JSON.stringify({ createdBy: 'Admin Shen3D' }), userId: adminUser.id },
            { eventType: 'status_changed', eventData: JSON.stringify({ newStatus: 'in_progress' }), userId: operatorUser.id },
            { eventType: 'status_changed', eventData: JSON.stringify({ newStatus: 'qc' }), userId: operatorUser.id },
          ],
        },
      },
    }),
    prisma.case.create({
      data: {
        caseNumber: 'LAB-2025-0003',
        clientId: clients[2].id,
        dentistId: dentists[4].id, // Dr. Luca Bianchi (single dentist)
        patientName: 'Luca Ricci',
        status: 'received',
        priority: 'rush',
        receivedDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        dueDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
        createdBy: adminUser.id,
        notesInternal: 'RUSH - Consegna urgente!',
        teeth: {
          create: [
            { toothNumber: 36, workType: 'impianto', material: 'ZR', vitaColor: 'B2', unitPrice: 250 },
          ],
        },
        timeline: {
          create: [
            { eventType: 'created', eventData: JSON.stringify({ createdBy: 'Admin Shen3D' }), userId: adminUser.id },
          ],
        },
      },
    }),
    prisma.case.create({
      data: {
        caseNumber: 'LAB-2025-0004',
        clientId: clients[0].id,
        dentistId: dentists[1].id, // Dr. Laura Bianchi
        patientName: 'Sofia Martini',
        status: 'shipped',
        priority: 'normal',
        receivedDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        dueDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        shippedDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        createdBy: adminUser.id,
        teeth: {
          create: [
            { toothNumber: 11, workType: 'faccetta', material: 'EMAX', vitaColor: 'A1', unitPrice: 220 },
            { toothNumber: 21, workType: 'faccetta', material: 'EMAX', vitaColor: 'A1', unitPrice: 220 },
          ],
        },
        timeline: {
          create: [
            { eventType: 'created', eventData: JSON.stringify({ createdBy: 'Admin Shen3D' }), userId: adminUser.id },
            { eventType: 'status_changed', eventData: JSON.stringify({ newStatus: 'in_progress' }), userId: operatorUser.id },
            { eventType: 'status_changed', eventData: JSON.stringify({ newStatus: 'qc' }), userId: operatorUser.id },
            { eventType: 'status_changed', eventData: JSON.stringify({ newStatus: 'shipped' }), userId: operatorUser.id },
          ],
        },
      },
    }),
    prisma.case.create({
      data: {
        caseNumber: 'LAB-2025-0005',
        clientId: clients[3].id,
        dentistId: dentists[5].id, // Dr. Sofia Ferrari
        patientName: 'Marco Tozzi',
        status: 'in_progress',
        priority: 'normal',
        receivedDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        dueDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
        createdBy: adminUser.id,
        teeth: {
          create: [
            { toothNumber: 46, workType: 'intarsio', material: 'EMAX', vitaColor: 'A2', unitPrice: 160 },
            { toothNumber: 47, workType: 'intarsio', material: 'EMAX', vitaColor: 'A2', unitPrice: 160 },
          ],
        },
        timeline: {
          create: [
            { eventType: 'created', eventData: JSON.stringify({ createdBy: 'Admin Shen3D' }), userId: adminUser.id },
            { eventType: 'status_changed', eventData: JSON.stringify({ newStatus: 'in_progress' }), userId: operatorUser.id },
          ],
        },
      },
    }),
  ]);

  console.log('Created cases');

  // Create some messages
  await prisma.caseMessage.create({
    data: {
      caseId: cases[0].id,
      senderId: adminUser.id,
      messageText: 'Caso ricevuto, inizieremo la lavorazione domani. Grazie!',
      messageType: 'text',
    },
  });

  await prisma.caseMessage.create({
    data: {
      caseId: cases[0].id,
      senderId: clientUsers[0].id,
      messageText: 'Perfetto, grazie per la conferma!',
      messageType: 'text',
    },
  });

  console.log('Created messages');

  // Create notification settings for users
  await Promise.all([
    prisma.notificationSettings.create({
      data: {
        userId: adminUser.id,
        notifyNewCase: true,
        notifyNewMessage: true,
        notifyStatusChange: true,
        notifyDelayAlert: true,
        notifyDeliveryReminder: true,
        notifyViaEmail: true,
        notifyViaWhatsapp: false,
      },
    }),
    prisma.notificationSettings.create({
      data: {
        userId: operatorUser.id,
        notifyNewCase: true,
        notifyNewMessage: true,
        notifyStatusChange: false,
        notifyDelayAlert: true,
        notifyDeliveryReminder: true,
        notifyViaEmail: true,
        notifyViaWhatsapp: false,
      },
    }),
  ]);

  console.log('Created notification settings');

  // Create system settings
  await prisma.systemSettings.create({
    data: {
      settingKey: 'default_delivery_days',
      settingValue: JSON.stringify({ value: 7 }),
    },
  });

  await prisma.systemSettings.create({
    data: {
      settingKey: 'delay_alert_threshold',
      settingValue: JSON.stringify({ value: 1 }),
    },
  });

  await prisma.systemSettings.create({
    data: {
      settingKey: 'working_hours',
      settingValue: JSON.stringify({ start: '08:00', end: '18:00' }),
    },
  });

  console.log('Created system settings');

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
