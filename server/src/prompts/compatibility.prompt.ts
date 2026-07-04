import { TenantProfile, Listing } from "@prisma/client";

/**
 * AI Prompts Builder.
 * 
 * Instructs the AI model to perform a strict matching score calculation
 * and output a structured JSON response containing:
 * - score: number (0 to 100)
 * - explanation: string (concise summary of matches and conflicts)
 */

export const COMPATIBILITY_SYSTEM_PROMPT = `
You are a highly analytical AI Compatibility Engine designed to assess residential compatibility.
Your objective is to compare a tenant's lifestyle habits and budget with either a property listing's rules/amenities or another tenant's lifestyle habits.

CRITICAL INSTRUCTIONS:
1. Assess compatibility on a strict scale of 0 to 100, where:
   - 90-100: Exceptional match, no conflicts.
   - 70-89: Good match, minor differences (e.g. flexible schedules or small budget overlaps).
   - 50-69: Moderate match, some compromises required (e.g. conflicting sleep schedules or slight rules differences).
   - Below 50: Severe incompatibility (e.g., smoking mismatch, pets mismatch, budget completely out of bounds).
2. You must output ONLY a valid JSON object. Do not include any markdown backticks (e.g. \`\`\`json), comments, or surrounding text. The response must parse directly with JSON.parse.
3. The JSON object must strictly match this structure:
   {
     "score": 85,
     "explanation": "Provide a concise 2-3 sentence explanation summarizing the matching points (e.g. budget, cleanliness) and potential friction areas (e.g. guests policy)."
   }
`;

export function buildTenantListingPrompt(tenant: TenantProfile, listing: Listing): string {
  return `
Tenant Attributes:
- Cleanliness: ${tenant.cleanliness}/5
- Sleep Schedule: ${tenant.sleepSchedule || "flexible"}
- Smoking Habit: ${tenant.smoking ? "Smoker" : "Non-Smoker"}
- Has Pets: ${tenant.pets ? "Yes" : "No"}
- Drinks Alcohol: ${tenant.drinking ? "Yes" : "No"}
- Guest Policy Preference: ${tenant.guestPolicy || "occasionally"}
- Noise Level Preference: ${tenant.noiseLevel || "moderate"}
- Diet: ${tenant.diet || "any"}
- Work Schedule: ${tenant.workSchedule || "hybrid"}
- Monthly Budget Range: INR ${tenant.budgetMin || 0} to INR ${tenant.budgetMax || "unspecified"}

Property Listing Details:
- Title: "${listing.title}"
- Rent Price: INR ${listing.price} per month
- Property Type: ${listing.propertyType}
- Room Type: ${listing.roomType}
- Max Occupants Allowed: ${listing.maxOccupants}
- Amenities Offered: ${listing.amenities.join(", ") || "None"}
- House Rules: ${listing.rules.join(", ") || "None"}

Please evaluate and output the JSON compatibility score and explanation.
`;
}

export function buildTenantTenantPrompt(tenantA: TenantProfile, tenantB: TenantProfile): string {
  return `
Tenant A (Requester):
- Cleanliness: ${tenantA.cleanliness}/5
- Sleep Schedule: ${tenantA.sleepSchedule || "flexible"}
- Smoking Habit: ${tenantA.smoking ? "Smoker" : "Non-Smoker"}
- Has Pets: ${tenantA.pets ? "Yes" : "No"}
- Drinks Alcohol: ${tenantA.drinking ? "Yes" : "No"}
- Guest Policy Preference: ${tenantA.guestPolicy || "occasionally"}
- Noise Level Preference: ${tenantA.noiseLevel || "moderate"}
- Diet: ${tenantA.diet || "any"}
- Work Schedule: ${tenantA.workSchedule || "hybrid"}
- Monthly Budget Range: INR ${tenantA.budgetMin || 0} to INR ${tenantA.budgetMax || "unspecified"}

Tenant B (Target Roommate):
- Cleanliness: ${tenantB.cleanliness}/5
- Sleep Schedule: ${tenantB.sleepSchedule || "flexible"}
- Smoking Habit: ${tenantB.smoking ? "Smoker" : "Non-Smoker"}
- Has Pets: ${tenantB.pets ? "Yes" : "No"}
- Drinks Alcohol: ${tenantB.drinking ? "Yes" : "No"}
- Guest Policy Preference: ${tenantB.guestPolicy || "occasionally"}
- Noise Level Preference: ${tenantB.noiseLevel || "moderate"}
- Diet: ${tenantB.diet || "any"}
- Work Schedule: ${tenantB.workSchedule || "hybrid"}
- Monthly Budget Range: INR ${tenantB.budgetMin || 0} to INR ${tenantB.budgetMax || "unspecified"}

Please evaluate and output the JSON compatibility score and explanation.
`;
}

export function buildBatchTenantListingPrompt(tenant: TenantProfile, listings: Listing[]): string {
  const listingsStr = listings.map((listing, i) => {
    return `Listing ${i + 1}:
- ID: ${listing.id}
- Title: "${listing.title}"
- Rent Price: INR ${listing.price} per month
- Property Type: ${listing.propertyType}
- Room Type: ${listing.roomType}
- Max Occupants Allowed: ${listing.maxOccupants}
- Amenities Offered: ${listing.amenities.join(", ") || "None"}
- House Rules: ${listing.rules.join(", ") || "None"}`;
  }).join("\n\n");

  return `Tenant Attributes:
- Cleanliness: ${tenant.cleanliness}/5
- Sleep Schedule: ${tenant.sleepSchedule || "flexible"}
- Smoking Habit: ${tenant.smoking ? "Smoker" : "Non-Smoker"}
- Has Pets: ${tenant.pets ? "Yes" : "No"}
- Drinks Alcohol: ${tenant.drinking ? "Yes" : "No"}
- Guest Policy Preference: ${tenant.guestPolicy || "occasionally"}
- Noise Level Preference: ${tenant.noiseLevel || "moderate"}
- Diet: ${tenant.diet || "any"}
- Work Schedule: ${tenant.workSchedule || "hybrid"}
- Monthly Budget Range: INR ${tenant.budgetMin || 0} to INR ${tenant.budgetMax || "unspecified"}

List of Listings to assess:
${listingsStr}

Please evaluate and output a single JSON object where the keys are the listing IDs, and values are objects conforming strictly to:
{
  "score": number (0 to 100),
  "explanation": "Provide a concise 2-3 sentence explanation."
}`;
}
