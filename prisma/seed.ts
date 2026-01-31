import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@company.com' },
    update: {},
    create: {
      email: 'admin@company.com',
      password: adminPassword,
      name: 'Admin User',
      role: 'ADMIN'
    }
  });

  // Create employee user
  const employeePassword = await bcrypt.hash('employee123', 10);
  await prisma.user.upsert({
    where: { email: 'employee@company.com' },
    update: {},
    create: {
      email: 'employee@company.com',
      password: employeePassword,
      name: 'John Employee',
      role: 'EMPLOYEE'
    }
  });
  
  // Create sample seats
  // const seats = [
  //   // Solo desks
  //   { seatCode: 'S1', type: 'SOLO', hasMonitor: false },
  //   { seatCode: 'S2', type: 'SOLO', hasMonitor: false },
  //   { seatCode: 'S3', type: 'SOLO', hasMonitor: false },
  //   { seatCode: 'S4', type: 'SOLO', hasMonitor: false },
  //   // Team cluster desks
  //   ...Array.from({ length: 80 }, (_, i) => ({
  //     seatCode: `T${i + 1}`,
  //     type: 'TEAM_CLUSTER',
  //     hasMonitor: true
  //   }))
  // ];
  
  // for (const seat of seats) {
  //   await prisma.seat.upsert({
  //     where: { seatCode: seat.seatCode },
  //     update: {},
  //     create: seat as any
  //   });
  // }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
