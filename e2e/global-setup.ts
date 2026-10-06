import path from 'node:path';

type PrismaLike = {
  user: {
    upsert: (args: unknown) => Promise<unknown>;
  };
  $disconnect: () => Promise<void>;
};

/**
 * Seeds Nest DB with e2e-admin / e2e-customer before Playwright auth specs.
 * Uses sibling scrubber-backend Prisma client (no shell spawn — Windows CI-safe).
 */
export default async function globalSetup() {
  // Playwright runs with cwd = scrubber-frontend; sibling backend is one level up.
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

  for (const fixture of [
    {
      email: 'e2e-admin@example.com',
      name: 'E2E Admin',
      role: 'admin',
    },
    {
      email: 'e2e-customer@example.com',
      name: 'E2E Customer',
      role: 'customer',
    },
  ] as const) {
    await prisma.user.upsert({
      where: { email: fixture.email },
      create: {
        email: fixture.email,
        name: fixture.name,
        role: fixture.role,
        password,
        isActive: true,
        subscriptionStatus: 'active',
      },
      update: {
        password,
        isActive: true,
        role: fixture.role,
        subscriptionStatus: 'active',
      },
    });
  }

  await prisma.$disconnect();
}
