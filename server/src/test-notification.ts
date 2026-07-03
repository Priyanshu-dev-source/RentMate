/* eslint-disable no-console */
import { prisma } from "./config/database";
import { InterestRequestService } from "./services/InterestRequestService";
import { NotificationService } from "./services/NotificationService";
import { InterestStatus } from "@prisma/client";

async function run() {
  console.log("\n=== STARTING NOTIFICATION SYSTEM INTEGRATION TEST ===");

  // 1. Pre-cleanup in case of previous test crashes
  const emails = ["test_tenant_notify@example.com", "test_owner_notify@example.com"];
  const existingUsers = await prisma.user.findMany({
    where: {
      email: {
        in: emails,
      },
    },
  });

  for (const user of existingUsers) {
    // Delete depending records
    await prisma.emailQueue.deleteMany({
      where: {
        to: user.email,
      },
    });
    await prisma.interestRequest.deleteMany({
      where: {
        tenant: { userId: user.id },
      },
    });
    await prisma.compatibility.deleteMany({
      where: {
        tenantProfile: { userId: user.id },
      },
    });
    await prisma.tenantProfile.deleteMany({ where: { userId: user.id } });
    await prisma.listing.deleteMany({
      where: { owner: { userId: user.id } },
    });
    await prisma.ownerProfile.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
  }

  // 2. Create test users in DB
  const tenantUser = await prisma.user.create({
    data: {
      email: "test_tenant_notify@example.com",
      passwordHash: "dummyhash",
      firstName: "Rahul",
      lastName: "Kumar",
      role: "TENANT",
    },
  });

  const ownerUser = await prisma.user.create({
    data: {
      email: "test_owner_notify@example.com",
      passwordHash: "dummyhash",
      firstName: "Amit",
      lastName: "Sharma",
      role: "OWNER",
    },
  });

  const tenantProfile = await prisma.tenantProfile.create({
    data: { userId: tenantUser.id },
  });

  const ownerProfile = await prisma.ownerProfile.create({
    data: { userId: ownerUser.id },
  });

  // 3. Create listing owned by Owner
  const listing = await prisma.listing.create({
    data: {
      ownerId: ownerProfile.id,
      title: "Cozy Studio Apartment in Saket",
      description: "Fully furnished cozy studio apartment close to metro station.",
      price: 15000,
      propertyType: "APARTMENT",
      roomType: "SHARED",
      status: "ACTIVE",
      address: "M-Block, Saket",
      city: "New Delhi",
      state: "Delhi",
    },
  });

  // 4. Create compatibility entry with score of 88 (above 80 trigger threshold)
  const comp = await prisma.compatibility.create({
    data: {
      tenantProfileId: tenantProfile.id,
      targetListingId: listing.id,
      score: 88,
      details: {},
    },
  });

  console.log(`Created test Listing: ${listing.id} and Compatibility: ${comp.id} (Score: 88)`);

  const interestService = new InterestRequestService();

  // 5. Test Trigger 1: Tenant expresses interest
  console.log("\n--- Testing Trigger 1: Creating Interest Request (Tenant -> Owner) ---");
  const request = await interestService.createInterestRequest(
    tenantUser.id,
    listing.id,
    "Hello! I am very interested in sharing this apartment with you."
  );

  console.log(`Interest Request created: ${request.id}`);

  // Fetch enqueued jobs to verify
  let queuedJobs = await prisma.emailQueue.findMany({
    where: { to: ownerUser.email },
  });

  if (queuedJobs.length === 1 && queuedJobs[0].templateName === "HIGH_COMPATIBILITY_ALERT") {
    console.log("SUCCESS: High Compatibility email correctly enqueued for Owner!");
    console.log(`Subject: ${queuedJobs[0].subject}`);
  } else {
    throw new Error(`Owner email not enqueued. Found: ${queuedJobs.length} jobs.`);
  }

  // 6. Test Trigger 2: Owner accepts interest
  console.log("\n--- Testing Trigger 2: Accepting Interest Request (Owner -> Tenant) ---");
  await interestService.updateInterestStatus(
    request.id,
    ownerUser.id,
    InterestStatus.ACCEPTED
  );

  queuedJobs = await prisma.emailQueue.findMany({
    where: { to: tenantUser.email },
  });

  if (queuedJobs.length === 1 && queuedJobs[0].templateName === "INTEREST_STATUS_ALERT") {
    console.log("SUCCESS: Interest status update email enqueued for Tenant!");
    console.log(`Subject: ${queuedJobs[0].subject}`);
  } else {
    throw new Error(`Tenant status update email not enqueued. Found: ${queuedJobs.length} jobs.`);
  }

  // 7. Test Queue Processing
  console.log("\n--- Testing Queue Processing (Pending -> Sent) ---");
  await NotificationService.processQueue();

  const processedJobs = await prisma.emailQueue.findMany({
    where: {
      to: { in: emails },
    },
  });

  const allSent = processedJobs.every((j: { status: string }) => j.status === "SENT");
  if (allSent && processedJobs.length === 2) {
    console.log("SUCCESS: All queued email jobs processed and marked as SENT!");
  } else {
    throw new Error(`Jobs not processed successfully. Job states: ${JSON.stringify(processedJobs)}`);
  }

  // 8. Test Retry & Backoff Mechanism
  console.log("\n--- Testing Retry & Exponential Backoff ---");
  const badJob = await prisma.emailQueue.create({
    data: {
      to: "test_bad@example.com",
      subject: "Test Bad Job",
      templateName: "NON_EXISTENT_TEMPLATE",
      templateData: "{}",
      status: "PENDING",
      nextRunAt: new Date(Date.now() - 5000),
    },
  });

  // Process queue to trigger template compile failure
  await NotificationService.processQueue();

  const retriedJob = await prisma.emailQueue.findUnique({
    where: { id: badJob.id },
  });

  if (
    retriedJob &&
    retriedJob.attempts === 1 &&
    retriedJob.status === "PENDING" &&
    retriedJob.lastError !== null &&
    retriedJob.nextRunAt.getTime() > Date.now()
  ) {
    console.log("SUCCESS: Bad job correctly retried with exponential backoff!");
    console.log(`Attempts: ${retriedJob.attempts}`);
    console.log(`Last Error: ${retriedJob.lastError}`);
    console.log(`Next Run At: ${retriedJob.nextRunAt.toISOString()}`);
  } else {
    throw new Error(`Retry mechanism validation failed. Job: ${JSON.stringify(retriedJob)}`);
  }

  // Clean up bad job
  await prisma.emailQueue.delete({ where: { id: badJob.id } });

  // 9. Clean up test database data
  console.log("\n--- Cleaning up Test Database Records ---");
  await prisma.emailQueue.deleteMany({
    where: {
      to: { in: emails },
    },
  });
  await prisma.interestRequest.delete({ where: { id: request.id } });
  await prisma.compatibility.delete({ where: { id: comp.id } });
  await prisma.listing.delete({ where: { id: listing.id } });
  await prisma.tenantProfile.delete({ where: { id: tenantProfile.id } });
  await prisma.ownerProfile.delete({ where: { id: ownerProfile.id } });
  await prisma.user.deleteMany({
    where: { id: { in: [tenantUser.id, ownerUser.id] } },
  });
  console.log("Cleaned up test database records successfully");

  console.log("\n=== ALL NOTIFICATION SYSTEM TESTS COMPLETED SUCCESSFULLY ===");
}

run()
  .then(() => {
    console.log("Test execution completed.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
  });
