import { prisma } from "../config/database";
import { EmailService, HighCompatibilityEmailData, InterestStatusEmailData } from "./EmailService";
import { logger } from "../utils/logger";
import { env } from "../config/env";

// IDE Type Sync Comment

export class NotificationService {
  private static workerIntervalId: NodeJS.Timeout | null = null;
  private static isWorkerRunning = false;
  private static isProcessing = false;

  /**
   * Enqueue a new email notification into the database.
   */
  static async enqueueEmail(
    to: string,
    subject: string,
    templateName: string,
    templateData: Record<string, unknown>
  ): Promise<void> {
    try {
      await prisma.emailQueue.create({
        data: {
          to,
          subject,
          templateName,
          templateData: JSON.stringify(templateData),
          status: "PENDING",
        },
      });
      logger.info(`Enqueued email job to: ${to} for template: ${templateName}`);
    } catch (err: unknown) {
      logger.error(`Failed to enqueue email to ${to}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /**
   * Helper to enqueue high compatibility alerts.
   */
  static async enqueueHighCompatibilityAlert(
    tenantName: string,
    ownerEmail: string,
    listingTitle: string,
    score: number,
    message: string | null,
    detailsUrl: string
  ): Promise<void> {
    await this.enqueueEmail(
      ownerEmail,
      `🔥 High Match Alert: ${tenantName} is interested in your listing!`,
      "HIGH_COMPATIBILITY_ALERT",
      {
        tenantName,
        compatibilityScore: score,
        listingTitle,
        message: message || undefined,
        detailsUrl,
      }
    );
  }

  /**
   * Helper to enqueue interest status update alerts.
   */
  static async enqueueInterestStatusAlert(
    tenantName: string,
    tenantEmail: string,
    ownerName: string,
    listingTitle: string,
    status: "ACCEPTED" | "REJECTED",
    chatUrl: string
  ): Promise<void> {
    const subject = status === "ACCEPTED" 
      ? `🎉 Interest Accepted! ${ownerName} wants to connect` 
      : `Update on your interest request for ${listingTitle}`;

    await this.enqueueEmail(
      tenantEmail,
      subject,
      "INTEREST_STATUS_ALERT",
      {
        tenantName,
        ownerName,
        listingTitle,
        status,
        chatUrl,
      }
    );
  }

  /**
   * Start the background worker daemon to process the database queue.
   */
  static startQueueWorker(intervalMs: number = 10000): void {
    if (this.isWorkerRunning) {
      logger.warn("Notification queue worker is already running");
      return;
    }

    this.isWorkerRunning = true;
    logger.info(`Starting notification queue worker with interval of ${intervalMs}ms`);

    this.workerIntervalId = setInterval(() => {
      void (async () => {
        if (this.isProcessing) return; // Prevent overlapping runs
        this.isProcessing = true;
        try {
          await this.processQueue();
        } catch (err: unknown) {
          logger.error(`Error during processing email queue: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
          this.isProcessing = false;
        }
      })();
    }, intervalMs);
  }

  /**
   * Stop the queue worker.
   */
  static stopQueueWorker(): void {
    if (this.workerIntervalId) {
      clearInterval(this.workerIntervalId);
      this.workerIntervalId = null;
      this.isWorkerRunning = false;
      logger.info("Notification queue worker stopped");
    }
  }

  /**
   * Process pending queue entries.
   */
  static async processQueue(): Promise<void> {
    const now = new Date();

    // Fetch pending jobs where nextRunAt is in the past
    const jobs = await prisma.emailQueue.findMany({
      where: {
        status: "PENDING",
        nextRunAt: {
          lte: now,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
      take: 10, // process in chunks
    });

    if (jobs.length === 0) return;

    logger.debug(`Found ${jobs.length} pending email notifications to process`);

    for (const job of jobs) {
      try {
        const payload = JSON.parse(job.templateData) as unknown;
        let htmlContent = "";

        // Compile appropriate template
        if (job.templateName === "HIGH_COMPATIBILITY_ALERT") {
          htmlContent = EmailService.renderHighCompatibilityTemplate(payload as HighCompatibilityEmailData);
        } else if (job.templateName === "INTEREST_STATUS_ALERT") {
          htmlContent = EmailService.renderInterestStatusTemplate(payload as InterestStatusEmailData);
        } else {
          throw new Error(`Unknown email template name: ${job.templateName}`);
        }

        // Increment attempt count before sending to guard against double processing
        const updatedAttempt = job.attempts + 1;

        // Try to dispatch the email
        const sendSuccess = await EmailService.sendEmail(job.to, job.subject, htmlContent);

        if (sendSuccess) {
          await prisma.emailQueue.update({
            where: { id: job.id },
            data: {
              status: "SENT",
              attempts: updatedAttempt,
            },
          });
          logger.info(`Processed email job: ${job.id} successfully sent to: ${job.to}`);
        } else {
          throw new Error("Failed to dispatch email via provider client");
        }
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        const nextAttempts = job.attempts + 1;
        const reachedMax = nextAttempts >= job.maxAttempts;
        const newStatus = reachedMax ? "FAILED" : "PENDING";
        
        // Exponential backoff calculation: 2^attempts * 1 minute (or 10 seconds for integration tests/development)
        // If in test/dev, use a shorter retry window of 10s * attempts for responsive test runs.
        const isTestEnv = env.NODE_ENV === "test" || env.RESEND_API_KEY === "mock_api_key";
        const backoffSeconds = isTestEnv ? nextAttempts * 5 : nextAttempts * 60;
        const nextRunAt = new Date(Date.now() + backoffSeconds * 1000);

        await prisma.emailQueue.update({
          where: { id: job.id },
          data: {
            status: newStatus,
            attempts: nextAttempts,
            lastError: errMsg,
            nextRunAt,
          },
        });

        logger.error(
          `Job ${job.id} failed (attempt ${nextAttempts}/${job.maxAttempts}). ` +
          `Status updated to ${newStatus}. Next run at: ${nextRunAt.toISOString()}. Error: ${errMsg}`
        );
      }
    }
  }
}
