import { env } from "../config/env";
import { logger } from "../utils/logger";

export interface HighCompatibilityEmailData {
  tenantName: string;
  compatibilityScore: number;
  listingTitle: string;
  message?: string;
  detailsUrl: string;
}

export interface InterestStatusEmailData {
  tenantName: string;
  ownerName: string;
  listingTitle: string;
  status: "ACCEPTED" | "REJECTED";
  chatUrl: string;
}

export class EmailService {
  /**
   * Dispatch an email via Resend HTTP API.
   * If api key is mock or missing, executes in simulation mode.
   */
  static async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    const apiKey = env.RESEND_API_KEY;
    const fromEmail = env.RESEND_FROM_EMAIL;

    if (!apiKey || apiKey === "mock_api_key") {
      logger.info(`[Mock Email] Dispatching to: ${to}`);
      logger.info(`[Mock Email] Subject: ${subject}`);
      logger.debug(`[Mock Email] HTML Body Preview:\n${html.substring(0, 400)}...`);
      return true;
    }

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [to],
          subject,
          html,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`Resend API sending failed: ${response.statusText} (${response.status}) - ${errorText}`);
        return false;
      }

      const resData = (await response.json()) as Record<string, unknown>;
      const resId = typeof resData.id === "string" ? resData.id : "unknown-id";
      logger.info(`Email successfully sent via Resend API to: ${to}. ID: ${resId}`);
      return true;
    } catch (err: unknown) {
      logger.error(`Error in sendEmail fetch: ${err instanceof Error ? err.message : String(err)}`);
      return false;
    }
  }

  /**
   * Render premium, responsive HTML template for High Compatibility alerts.
   */
  static renderHighCompatibilityTemplate(data: HighCompatibilityEmailData): string {
    const scoreColor = data.compatibilityScore >= 90 ? "#10B981" : "#14B8A6";
    const customMessageHtml = data.message
      ? `<div style="background-color: #F8FAFC; border-left: 4px solid #64748B; padding: 12px 16px; margin: 20px 0; border-radius: 0 8px 8px 0; color: #475569; font-style: italic;">
          "${data.message}"
         </div>`
      : "";

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New High Compatibility Tenant Interest</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #F1F5F9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; background-color: #F1F5F9; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                <!-- Header Banner -->
                <tr>
                  <td style="background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); padding: 32px 40px; text-align: center;">
                    <h1 style="color: #FFFFFF; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em;">RentMate</h1>
                    <p style="color: #94A3B8; margin: 4px 0 0 0; font-size: 14px; font-weight: 500;">Flatmate & Rental Compatibility Finder</p>
                  </td>
                </tr>
                <!-- Content Area -->
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="color: #0F172A; margin: 0 0 16px 0; font-size: 20px; font-weight: 700; line-height: 1.25;">High Match Alert! 🔥</h2>
                    <p style="color: #334155; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                      Hello owner, a tenant has expressed interest in your listing <strong>${data.listingTitle}</strong> and they have a compatibility score of:
                    </p>

                    <!-- Score Badge Block -->
                    <table border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 24px auto;">
                      <tr>
                        <td align="center" style="background-color: ${scoreColor}; border-radius: 50px; padding: 12px 32px; box-shadow: 0 10px 15px -3px rgba(20, 184, 166, 0.2);">
                          <span style="color: #FFFFFF; font-size: 28px; font-weight: 800; letter-spacing: -0.05em;">${data.compatibilityScore}% Match</span>
                        </td>
                      </tr>
                    </table>

                    <p style="color: #334155; font-size: 16px; line-height: 1.6; margin: 24px 0 16px 0;">
                      <strong>Tenant Name:</strong> ${data.tenantName}
                    </p>

                    ${customMessageHtml}

                    <p style="color: #475569; font-size: 14px; line-height: 1.5; margin: 24px 0;">
                      We recommend reviewing their detailed profile breakdown and lifestyle preferences to see if they fit your requirements.
                    </p>

                    <!-- Action Button -->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 32px 0 0 0;">
                      <tr>
                        <td align="center">
                          <a href="${data.detailsUrl}" target="_blank" style="display: inline-block; background-color: #0F172A; color: #FFFFFF; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-size: 16px; font-weight: 600; text-align: center; box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.15); transition: background-color 0.2s ease;">
                            View Compatibility Breakdown
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 24px 40px; text-align: center;">
                    <p style="color: #94A3B8; font-size: 12px; line-height: 1.5; margin: 0;">
                      &copy; 2026 RentMate Inc. All rights reserved. <br>
                      You are receiving this automated alert because you listed a property on our platform.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  /**
   * Render premium, responsive HTML template for Interest Status Updates.
   */
  static renderInterestStatusTemplate(data: InterestStatusEmailData): string {
    const isAccepted = data.status === "ACCEPTED";
    const statusTitle = isAccepted ? "Interest Accepted! 🎉" : "Interest Update";
    const statusColor = isAccepted ? "#10B981" : "#64748B";

    const bodyMessage = isAccepted
      ? `Congratulations! <strong>${data.ownerName}</strong> has accepted your interest request for <strong>${data.listingTitle}</strong>. They would love to chat further and discuss flatmate coordination.`
      : `Thank you for expressing interest in <strong>${data.listingTitle}</strong>. Unfortunately, the owner has decided to decline the request at this time. Don't worry, there are plenty of other options waiting for you on RentMate!`;

    const buttonLabel = isAccepted ? "Open Chat Room" : "Browse Other Listings";

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${statusTitle}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #F1F5F9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; background-color: #F1F5F9; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                <!-- Header Banner -->
                <tr>
                  <td style="background: ${statusColor}; padding: 32px 40px; text-align: center;">
                    <h1 style="color: #FFFFFF; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em;">RentMate</h1>
                    <p style="color: #E2E8F0; margin: 4px 0 0 0; font-size: 14px; font-weight: 500;">Flatmate & Rental Compatibility Finder</p>
                  </td>
                </tr>
                <!-- Content Area -->
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="color: #0F172A; margin: 0 0 16px 0; font-size: 20px; font-weight: 700; line-height: 1.25;">${statusTitle}</h2>
                    <p style="color: #334155; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                      Hello ${data.tenantName},
                    </p>
                    <p style="color: #334155; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                      ${bodyMessage}
                    </p>

                    <p style="color: #475569; font-size: 14px; line-height: 1.5; margin: 24px 0;">
                      Click the button below to take the next step on the RentMate portal:
                    </p>

                    <!-- Action Button -->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 32px 0 0 0;">
                      <tr>
                        <td align="center">
                          <a href="${data.chatUrl}" target="_blank" style="display: inline-block; background-color: #0F172A; color: #FFFFFF; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-size: 16px; font-weight: 600; text-align: center; box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.15); transition: background-color 0.2s ease;">
                            ${buttonLabel}
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 24px 40px; text-align: center;">
                    <p style="color: #94A3B8; font-size: 12px; line-height: 1.5; margin: 0;">
                      &copy; 2026 RentMate Inc. All rights reserved. <br>
                      You are receiving this because you registered an account on RentMate.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }
}
