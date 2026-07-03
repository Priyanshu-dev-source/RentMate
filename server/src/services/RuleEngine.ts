import { TenantProfile, Listing } from "@prisma/client";

export class RuleEngine {
  /**
   * Deterministic rule-based matching between a Tenant and a Listing.
   */
  static matchTenantListing(tenant: TenantProfile, listing: Listing): { score: number; explanation: string } {
    let score = 100;
    const deductions: string[] = [];

    // 1. Budget Constraint
    const rent = listing.price;
    if (tenant.budgetMax && rent > tenant.budgetMax) {
      const overagePercent = ((rent - tenant.budgetMax) / tenant.budgetMax) * 100;
      const penalty = Math.min(Math.round(overagePercent * 1.5), 50); // cap budget penalty at 50 points
      score -= penalty;
      deductions.push(`Listing rent is higher than your maximum budget by ${Math.round(overagePercent)}% (-${penalty} points)`);
    } else if (tenant.budgetMin && rent < tenant.budgetMin) {
      // Minor warning for being below minimum budget, no penalty
      deductions.push(`Listing rent is below your preferred minimum budget`);
    }

    // 2. Smoking Habit / Rules
    const listingForbidsSmoking = listing.rules.some(r => r.toLowerCase().includes("no smoking") || r.toLowerCase().includes("smoke-free"));
    if (tenant.smoking && listingForbidsSmoking) {
      score -= 40;
      deductions.push(`Tenant smokes but property rules forbid smoking (-40 points)`);
    }

    // 3. Pets Mismatch
    const listingForbidsPets = listing.rules.some(r => r.toLowerCase().includes("no pets") || r.toLowerCase().includes("pet-free"));
    if (tenant.pets && listingForbidsPets) {
      score -= 35;
      deductions.push(`Tenant has pets but property rules forbid pets (-35 points)`);
    }

    // 4. Cleanliness Comparison
    // If tenant cleanliness is high (4 or 5) but listing makes no mention, no penalty.
    // If cleanliness values exist and differ greatly, apply penalty.
    if (tenant.cleanliness && tenant.cleanliness < 3) {
      score -= 10;
      deductions.push(`Tenant cleanliness rating is low (${tenant.cleanliness}/5) (-10 points)`);
    }

    // Final clean check
    score = Math.max(0, Math.min(100, score));

    const explanation = deductions.length > 0
      ? `Local rule engine matched profile with score ${score}. Notices: ${deductions.join("; ")}.`
      : `Local rule engine matched profile perfectly with score ${score} based on budget, smoking, pet preferences, and cleanliness alignment.`;

    return { score, explanation };
  }

  /**
   * Deterministic rule-based matching between Tenant A and Tenant B.
   */
  static matchTenantTenant(tenantA: TenantProfile, tenantB: TenantProfile): { score: number; explanation: string } {
    let score = 100;
    const deductions: string[] = [];

    // 1. Smoking compatibility
    if (tenantA.smoking !== tenantB.smoking) {
      score -= 35;
      deductions.push(`Smoking habit mismatch (one smokes, one does not) (-35 points)`);
    }

    // 2. Sleep Schedule compatibility
    if (tenantA.sleepSchedule && tenantB.sleepSchedule && tenantA.sleepSchedule !== "flexible" && tenantB.sleepSchedule !== "flexible") {
      if (tenantA.sleepSchedule !== tenantB.sleepSchedule) {
        score -= 15;
        deductions.push(`Sleep schedule mismatch (${tenantA.sleepSchedule} vs ${tenantB.sleepSchedule}) (-15 points)`);
      }
    }

    // 3. Pets compatibility
    if (tenantA.pets !== tenantB.pets) {
      score -= 15;
      deductions.push(`Pet policy difference (-15 points)`);
    }

    // 4. Cleanliness difference
    if (tenantA.cleanliness && tenantB.cleanliness) {
      const cleanDiff = Math.abs(tenantA.cleanliness - tenantB.cleanliness);
      if (cleanDiff >= 2) {
        const penalty = cleanDiff * 10;
        score -= penalty;
        deductions.push(`Cleanliness rating discrepancy of ${cleanDiff} levels (-${penalty} points)`);
      }
    }

    // 5. Drinking preference mismatch
    if (tenantA.drinking !== tenantB.drinking) {
      score -= 10;
      deductions.push(`Drinking habits preference difference (-10 points)`);
    }

    score = Math.max(0, Math.min(100, score));

    const explanation = deductions.length > 0
      ? `Local rule engine matched roommates with score ${score}. Differences: ${deductions.join("; ")}.`
      : `Local rule engine matched roommates perfectly with score ${score} indicating high lifestyle, schedule, and cleanliness alignment.`;

    return { score, explanation };
  }
}
