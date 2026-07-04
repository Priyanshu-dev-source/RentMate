import { Compatibility } from "@prisma/client";
import { CompatibilityRepository } from "../repositories/CompatibilityRepository";
import { ListingRepository } from "../repositories/ListingRepository";
import { UserRepository } from "../repositories/UserRepository";
import { OpenAiService } from "./OpenAiService";
import { RuleEngine } from "./RuleEngine";
import { buildTenantListingPrompt, buildTenantTenantPrompt, buildBatchTenantListingPrompt } from "../prompts/compatibility.prompt";
import { AppError } from "../helpers/app-error";

export class CompatibilityService {
  private compatibilityRepository: CompatibilityRepository;
  private listingRepository: ListingRepository;
  private userRepository: UserRepository;
  private openaiService: OpenAiService;

  constructor() {
    this.compatibilityRepository = new CompatibilityRepository();
    this.listingRepository = new ListingRepository();
    this.userRepository = new UserRepository();
    this.openaiService = new OpenAiService();
  }

  /**
   * Assess compatibility between a Tenant and a Listing.
   * Uses Cache-First, AI-Second, Fallback Rule Engine-Third.
   */
  async getTenantListingCompatibility(userId: string, listingId: string): Promise<Compatibility> {
    // 1. Resolve active tenant profile
    const tenantProfile = await this.userRepository.getTenantProfile(userId);
    if (!tenantProfile) {
      throw AppError.notFound("Tenant profile not found. Complete your preferences profile first.");
    }

    // 2. Fetch the target listing
    const listing = await this.listingRepository.findById(listingId);
    if (!listing) {
      throw AppError.notFound("Target listing not found");
    }

    // 3. Cache lookup: check if compatibility score already computed
    const cached = await this.compatibilityRepository.getListingCompatibility(tenantProfile.id, listingId);
    if (cached) {
      console.log(`[Cache Hit] Compatibility score retrieved from DB for tenant:${tenantProfile.id} and listing:${listingId}`);
      return cached;
    }

    // 4. Cache miss: Compute compatibility
    let score = 0;
    let explanation = "";
    let method = "AI";

    try {
      console.log(`[Cache Miss] Computing compatibility via OpenAI for tenant:${tenantProfile.id} and listing:${listingId}`);
      const prompt = buildTenantListingPrompt(tenantProfile, listing);
      const result = await this.openaiService.getCompatibilityAnalysis(prompt);
      score = result.score;
      explanation = result.explanation;
    } catch (err: any) {
      console.warn(`[Fallback Triggered] OpenAI service failed. Invoking local rule engine:`, err.message);
      const fallbackResult = RuleEngine.matchTenantListing(tenantProfile, listing);
      score = fallbackResult.score;
      explanation = fallbackResult.explanation;
      method = "RuleEngine";
    }

    // 5. Store match in Database cache
    return this.compatibilityRepository.upsertListingCompatibility(
      tenantProfile.id,
      listingId,
      score,
      {
        explanation,
        computedBy: method,
        timestamp: new Date().toISOString(),
      }
    );
  }

  /**
   * Assess compatibility between two tenants (Roommate compatibility).
   * Uses Cache-First, AI-Second, Fallback Rule Engine-Third.
   */
  async getTenantTenantCompatibility(userId: string, targetUserId: string): Promise<Compatibility> {
    if (userId === targetUserId) {
      throw AppError.badRequest("You cannot calculate compatibility with yourself");
    }

    // 1. Resolve active tenant profile
    const tenantProfile = await this.userRepository.getTenantProfile(userId);
    if (!tenantProfile) {
      throw AppError.notFound("Tenant profile not found. Complete your preferences profile first.");
    }

    // 2. Resolve target tenant profile
    const targetTenantProfile = await this.userRepository.getTenantProfile(targetUserId);
    if (!targetTenantProfile) {
      throw AppError.notFound("Target tenant profile not found");
    }

    // 3. Cache lookup
    const cached = await this.compatibilityRepository.getTenantCompatibility(tenantProfile.id, targetTenantProfile.id);
    if (cached) {
      console.log(`[Cache Hit] Compatibility score retrieved from DB for tenant:${tenantProfile.id} and tenant:${targetTenantProfile.id}`);
      return cached;
    }

    // 4. Cache miss: Compute compatibility
    let score = 0;
    let explanation = "";
    let method = "AI";

    try {
      console.log(`[Cache Miss] Computing compatibility via OpenAI for tenant:${tenantProfile.id} and tenant:${targetTenantProfile.id}`);
      const prompt = buildTenantTenantPrompt(tenantProfile, targetTenantProfile);
      const result = await this.openaiService.getCompatibilityAnalysis(prompt);
      score = result.score;
      explanation = result.explanation;
    } catch (err: any) {
      console.warn(`[Fallback Triggered] OpenAI service failed. Invoking local roommate rule engine:`, err.message);
      const fallbackResult = RuleEngine.matchTenantTenant(tenantProfile, targetTenantProfile);
      score = fallbackResult.score;
      explanation = fallbackResult.explanation;
      method = "RuleEngine";
    }

    // 5. Store match in Database cache
    return this.compatibilityRepository.upsertTenantCompatibility(
      tenantProfile.id,
      targetTenantProfile.id,
      score,
      {
        explanation,
        computedBy: method,
        timestamp: new Date().toISOString(),
      }
    );
  }

  /**
   * Assess compatibility for a batch of Listings against a Tenant.
   */
  async getTenantListingsCompatibilityBatch(
    userId: string,
    listingIds: string[]
  ): Promise<Record<string, { score: number; explanation: string }>> {
    // 1. Resolve active tenant profile
    const tenantProfile = await this.userRepository.getTenantProfile(userId);
    if (!tenantProfile) {
      throw AppError.notFound("Tenant profile not found. Complete your preferences profile first.");
    }

    const results: Record<string, { score: number; explanation: string }> = {};
    const uncachedListings: any[] = [];

    // 2. Query cache first for each listing
    for (const listingId of listingIds) {
      const cached = await this.compatibilityRepository.getListingCompatibility(tenantProfile.id, listingId);
      if (cached) {
        results[listingId] = {
          score: cached.score,
          explanation: (cached.details as any)?.explanation || "Retrieved from cache.",
        };
      } else {
        const listing = await this.listingRepository.findById(listingId);
        if (listing) {
          uncachedListings.push(listing);
        }
      }
    }

    if (uncachedListings.length > 0) {
      let batchResults: Record<string, { score: number; explanation: string }> = {};
      let method = "AI";

      try {
        console.log(`[Cache Miss] Computing batch compatibility via OpenAI for ${uncachedListings.length} listings`);
        const prompt = buildBatchTenantListingPrompt(tenantProfile, uncachedListings);
        batchResults = await this.openaiService.getBatchCompatibilityAnalysis(prompt);
      } catch (err: any) {
        console.warn(`[Fallback Triggered] OpenAI batch failed. Invoking local rule engine:`, err.message);
        method = "RuleEngine";
        for (const listing of uncachedListings) {
          const fallback = RuleEngine.matchTenantListing(tenantProfile, listing);
          batchResults[listing.id] = fallback;
        }
      }

      // Upsert batch results to database cache
      for (const listing of uncachedListings) {
        const match = batchResults[listing.id] || { score: 50, explanation: "Moderate match." };
        await this.compatibilityRepository.upsertListingCompatibility(
          tenantProfile.id,
          listing.id,
          match.score,
          {
            explanation: match.explanation,
            computedBy: method,
            timestamp: new Date().toISOString(),
          }
        );
        results[listing.id] = match;
      }
    }

    return results;
  }

  /**
   * Assess custom compatibility for AI Smart Search based on user inputs.
   */
  async getAISmartSearchCompatibility(
    _userId: string,
    inputs: { environment: string; preferences: string; habits: string },
    listingIds: string[]
  ): Promise<Record<string, { score: number; explanation: string }>> {
    const listings = await Promise.all(
      listingIds.map((id) => this.listingRepository.findById(id))
    );
    const validListings = listings.filter((l): l is NonNullable<typeof l> => !!l);

    if (validListings.length === 0) return {};

    const prompt = `
Tenant Custom Preferences:
- Desired House Environment: "${inputs.environment}"
- Preferences / Special Needs: "${inputs.preferences}"
- Habits / Routine: "${inputs.habits}"

List of Listings to assess:
${validListings.map((listing, i) => `Listing ${i + 1}:
- ID: ${listing.id}
- Title: "${listing.title}"
- Rent Price: INR ${listing.price} per month
- Property Type: ${listing.propertyType}
- Room Type: ${listing.roomType}
- House Rules: ${listing.rules.join(", ") || "None"}
- Description: "${listing.description}"`).join("\n\n")}

Please evaluate and output a single JSON object where the keys are the listing IDs, and values are objects containing:
{
  "score": number (0 to 100),
  "explanation": "Provide a brief 1-2 sentence explanation of why they are a good or poor match based on the custom tenant inputs."
}`;

    let results: Record<string, { score: number; explanation: string }> = {};
    try {
      console.log(`[AI Smart Search] Querying OpenAI compatibility for ${validListings.length} listings`);
      results = await this.openaiService.getBatchCompatibilityAnalysis(prompt);
    } catch (err: any) {
      console.warn(`[AI Smart Search Fallback] OpenAI call failed:`, err.message);
      for (const listing of validListings) {
        results[listing.id] = {
          score: 75,
          explanation: "Matches general search filters. Custom AI details could not be processed due to OpenAI connectivity fallback.",
        };
      }
    }
    return results;
  }
}
