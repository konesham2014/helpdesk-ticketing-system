import { PrismaClient, UserRole, TicketStatus, TicketPriority } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.activityLog.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.user.deleteMany();

  // Create admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin@helpdesk.com',
      name: 'Admin User',
      password: await bcrypt.hash('admin123', 10),
      role: UserRole.ADMIN,
    },
  });

  // Create agents
  const agent1 = await prisma.user.create({
    data: {
      email: 'agent1@helpdesk.com',
      name: 'Sarah Johnson',
      password: await bcrypt.hash('agent123', 10),
      role: UserRole.AGENT,
    },
  });

  const agent2 = await prisma.user.create({
    data: {
      email: 'agent2@helpdesk.com',
      name: 'Mike Chen',
      password: await bcrypt.hash('agent123', 10),
      role: UserRole.AGENT,
    },
  });

  // Create customers
  const customer1 = await prisma.user.create({
    data: {
      email: 'john@example.com',
      name: 'John Doe',
      password: await bcrypt.hash('customer123', 10),
      role: UserRole.CUSTOMER,
    },
  });

  const customer2 = await prisma.user.create({
    data: {
      email: 'jane@example.com',
      name: 'Jane Smith',
      password: await bcrypt.hash('customer123', 10),
      role: UserRole.CUSTOMER,
    },
  });

  // Create sample tickets
  const ticket1 = await prisma.ticket.create({
    data: {
      title: 'Cannot login to my account',
      description: 'I have been trying to login for the past hour but keep getting an error message. I have reset my password twice already.',
      status: TicketStatus.IN_PROGRESS,
      priority: TicketPriority.HIGH,
      customerId: customer1.id,
      assignedToId: agent1.id,
      comments: {
        create: [
          {
            content: 'I will look into this right away. Can you confirm which browser you are using?',
            authorId: agent1.id,
          },
          {
            content: 'I am using Chrome on Windows 11.',
            authorId: customer1.id,
          },
        ],
      },
      activities: {
        create: [
          { action: 'TICKET_CREATED', userId: customer1.id, details: 'Ticket created by customer' },
          { action: 'STATUS_CHANGED', userId: agent1.id, oldValue: 'OPEN', newValue: 'IN_PROGRESS', details: 'Agent started working on ticket' },
          { action: 'ASSIGNED', userId: agent1.id, details: 'Ticket assigned to Sarah Johnson' },
        ],
      },
    },
  });

  const ticket2 = await prisma.ticket.create({
    data: {
      title: 'Feature request: Dark mode',
      description: 'It would be great if the app had a dark mode option. My eyes hurt when using the app at night.',
      status: TicketStatus.OPEN,
      priority: TicketPriority.LOW,
      customerId: customer2.id,
      activities: {
        create: [
          { action: 'TICKET_CREATED', userId: customer2.id, details: 'Feature request submitted' },
        ],
      },
    },
  });

  const ticket3 = await prisma.ticket.create({
    data: {
      title: 'Payment processing error',
      description: 'My credit card payment keeps failing with error code 402. I have verified my card details are correct.',
      status: TicketStatus.RESOLVED,
      priority: TicketPriority.CRITICAL,
      customerId: customer1.id,
      assignedToId: agent2.id,
      resolvedAt: new Date(),
      comments: {
        create: [
          {
            content: 'I see the issue - there was a temporary gateway timeout. The payment has now been processed successfully.',
            authorId: agent2.id,
          },
          {
            content: 'Thank you for the quick resolution!',
            authorId: customer1.id,
          },
        ],
      },
      activities: {
        create: [
          { action: 'TICKET_CREATED', userId: customer1.id, details: 'Critical payment issue reported' },
          { action: 'ASSIGNED', userId: agent2.id, details: 'Ticket assigned to Mike Chen' },
          { action: 'STATUS_CHANGED', userId: agent2.id, oldValue: 'OPEN', newValue: 'IN_PROGRESS', details: 'Investigating payment gateway' },
          { action: 'STATUS_CHANGED', userId: agent2.id, oldValue: 'IN_PROGRESS', newValue: 'RESOLVED', details: 'Payment gateway issue resolved' },
        ],
      },
    },
  });

  const ticket4 = await prisma.ticket.create({
    data: {
      title: 'Data export not working',
      description: 'When I try to export my data to CSV, the download starts but never completes. It hangs at 99%.',
      status: TicketStatus.WAITING,
      priority: TicketPriority.MEDIUM,
      customerId: customer2.id,
      assignedToId: agent1.id,
      comments: {
        create: [
          {
            content: 'I have identified the issue with the CSV export. A fix is being deployed.',
            authorId: agent1.id,
          },
        ],
      },
      activities: {
        create: [
          { action: 'TICKET_CREATED', userId: customer2.id },
          { action: 'ASSIGNED', userId: agent1.id },
          { action: 'STATUS_CHANGED', userId: agent1.id, oldValue: 'IN_PROGRESS', newValue: 'WAITING' },
        ],
      },
    },
  });

  const ticket5 = await prisma.ticket.create({
    data: {
      title: 'Mobile app crashes on launch',
      description: 'The iOS app crashes immediately after opening. I have tried reinstalling it multiple times.',
      status: TicketStatus.OPEN,
      priority: TicketPriority.HIGH,
      customerId: customer1.id,
      activities: {
        create: [
          { action: 'TICKET_CREATED', userId: customer1.id },
        ],
      },
    },
  });

  console.log('✅ Seed data created successfully!');
  console.log('\nDemo accounts:');
  console.log('  Admin:    admin@helpdesk.com / admin123');
  console.log('  Agent 1:  agent1@helpdesk.com / agent123');
  console.log('  Agent 2:  agent2@helpdesk.com / agent123');
  console.log('  Customer: john@example.com / customer123');
  console.log('  Customer: jane@example.com / customer123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
