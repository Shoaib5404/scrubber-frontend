import path from 'node:path';

type PrismaLike = {
  user: {
    upsert: (args: unknown) => Promise<{ id: number }>;
    findUnique: (args: unknown) => Promise<{ id: number } | null>;
  };
  batchFile: {
    deleteMany: (args: unknown) => Promise<unknown>;
    create: (args: unknown) => Promise<{ id: number }>;
  };
  claim: {
    create: (args: unknown) => Promise<{ id: number }>;
  };
  serviceLine: {
    create: (args: unknown) => Promise<unknown>;
  };
  $disconnect: () => Promise<void>;
};

/**
 * Seeds Nest DB with e2e users + owned/foreign batches before Playwright specs.
 */
export default async function globalSetup() {
  const backendRoot = path.resolve(process.cwd(), '../scrubber-backend');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaClient } = require(
    path.join(backendRoot, 'node_modules/@prisma/client'),
  ) as { PrismaClient: new () => PrismaLike };
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const argon2 = require(path.join(backendRoot, 'node_modules/argon2')) as {
    hash: (plain: string) => Promise<string>;
  };

  const prisma = new PrismaClient();
  const password = await argon2.hash('Password123!');

  const admin = await prisma.user.upsert({
    where: { email: 'e2e-admin@example.com' },
    create: {
      email: 'e2e-admin@example.com',
      name: 'E2E Admin',
      role: 'admin',
      password,
      isActive: true,
      subscriptionStatus: 'active',
    },
    update: {
      password,
      isActive: true,
      role: 'admin',
      subscriptionStatus: 'active',
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: 'e2e-customer@example.com' },
    create: {
      email: 'e2e-customer@example.com',
      name: 'E2E Customer',
      role: 'customer',
      password,
      isActive: true,
      subscriptionStatus: 'active',
    },
    update: {
      password,
      isActive: true,
      role: 'customer',
      subscriptionStatus: 'active',
    },
  });

  const other = await prisma.user.upsert({
    where: { email: 'e2e-other@example.com' },
    create: {
      email: 'e2e-other@example.com',
      name: 'E2E Other',
      role: 'customer',
      password,
      isActive: true,
      subscriptionStatus: 'active',
    },
    update: {
      password,
      isActive: true,
      role: 'customer',
      subscriptionStatus: 'active',
    },
  });

  // Refresh deterministic batch fixtures for ownership tests.
  await prisma.batchFile.deleteMany({
    where: {
      originalFilename: { in: ['e2e-customer-own.edi', 'e2e-other-tenant.edi'] },
    },
  });

  const ownBatch = await prisma.batchFile.create({
    data: {
      filename: 'e2e-customer-own.edi',
      originalFilename: 'e2e-customer-own.edi',
      filePath: 'storage/edi/e2e-customer-own.edi',
      status: 'parsed',
      uploadedById: customer.id,
      totalClaims: 1,
    },
  });

  await prisma.batchFile.create({
    data: {
      filename: 'e2e-other-tenant.edi',
      originalFilename: 'e2e-other-tenant.edi',
      filePath: 'storage/edi/e2e-other-tenant.edi',
      status: 'parsed',
      uploadedById: other.id,
      totalClaims: 0,
    },
  });

  const claim = await prisma.claim.create({
    data: {
      batchFileId: ownBatch.id,
      claimId: 'E2E-CLAIM-001',
      status: 'pending',
      totalCharge: 10,
      billingProviderName: 'E2E Clinic',
      payerName: 'E2E Payer',
      subscriberMemberId: 'MEM-E2E',
      payerId: 'PAYER1',
      claimFilingIndicator: 'CI',
    },
  });

  await prisma.serviceLine.create({
    data: {
      claimId: claim.id,
      lineNumber: 1,
      procedureCode: '99213',
      chargeAmount: 10,
      units: 1,
      status: 'pending',
    },
  });

  void admin;
  await prisma.$disconnect();
}
