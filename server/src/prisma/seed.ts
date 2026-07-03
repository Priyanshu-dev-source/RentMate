import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const saltRounds = 10;
  const adminPasswordHash = await bcrypt.hash("AdminPass123!", saltRounds);
  const ownerPasswordHash = await bcrypt.hash("OwnerPass123!", saltRounds);
  const tenantPasswordHash = await bcrypt.hash("TenantPass123!", saltRounds);

  // 1. Seed Admin (no profile needed for admin)
  const adminEmail = "admin@rentmate.com";
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash: adminPasswordHash },
    create: {
      email: adminEmail,
      passwordHash: adminPasswordHash,
      firstName: "Platform",
      lastName: "Administrator",
      role: UserRole.ADMIN,
      isActive: true,
    },
  });
  console.log(`✓ Seeded Admin User: ${adminEmail} / AdminPass123!`);

  // 2. Seed Owner (with OwnerProfile)
  const ownerEmail = "owner@rentmate.com";
  const ownerUser = await prisma.user.upsert({
    where: { email: ownerEmail },
    update: { passwordHash: ownerPasswordHash },
    create: {
      email: ownerEmail,
      passwordHash: ownerPasswordHash,
      firstName: "John",
      lastName: "Owner",
      role: UserRole.OWNER,
      isActive: true,
    },
  });
  // Ensure OwnerProfile exists
  await prisma.ownerProfile.upsert({
    where: { userId: ownerUser.id },
    update: {},
    create: {
      userId: ownerUser.id,
      isVerified: false,
    },
  });
  console.log(`✓ Seeded Owner User + OwnerProfile: ${ownerEmail} / OwnerPass123!`);

  // 3. Seed Tenant (with TenantProfile)
  const tenantEmail = "tenant@rentmate.com";
  const tenantUser = await prisma.user.upsert({
    where: { email: tenantEmail },
    update: { passwordHash: tenantPasswordHash },
    create: {
      email: tenantEmail,
      passwordHash: tenantPasswordHash,
      firstName: "Jane",
      lastName: "Tenant",
      role: UserRole.TENANT,
      isActive: true,
    },
  });
  // Ensure TenantProfile exists
  await prisma.tenantProfile.upsert({
    where: { userId: tenantUser.id },
    update: {},
    create: {
      userId: tenantUser.id,
    },
  });
  console.log(`✓ Seeded Tenant User + TenantProfile: ${tenantEmail} / TenantPass123!`);

  console.log("\nDatabase seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
