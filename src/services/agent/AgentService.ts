/* ═══════════════════════════════════════════════════════════════
   AgentService
   ───────────────────────────────────────────────────────────────
   The single entry point between the application and whichever
   AI provider is currently active.

   WHY THIS EXISTS
   ───────────────
   Previously, `agent` was imported directly in a client-side hook,
   meaning the provider (and eventually its API keys) could leak to
   the browser.  AgentService lives server-side only — it is imported
   exclusively by API routes in src/app/api/agent/.

   HOW IT WORKS
   ────────────
   AgentService wraps any IAgent implementation.  The active provider
   is resolved once at module load (or injected via the constructor for
   tests) and is never exposed to the client bundle.

   SWAPPING PROVIDERS
   ──────────────────
   When WatsonxAgent is ready:
     1. Create  src/services/agent/WatsonxAgent.ts  implementing IAgent
     2. Change the `resolveProvider()` function below — one line
     3. No changes to routes, hooks, or components
   ═══════════════════════════════════════════════════════════════ */

import type {
  IAgent,
  ClassifyInput,
  ClassifyResult,
  DailyBriefInput,
  DailyBriefResult,
} from "./types";
import { MockAgent } from "./MockAgent";

// ─── Provider resolution ─────────────────────────────────────────
// Reads AGENT_PROVIDER env var at module load time (server-only).
// "mock"    → MockAgent  (default, zero dependencies)
// "watsonx" → WatsonxAgent (to be added when credentials are ready)

function resolveProvider(): IAgent {
  const provider = process.env.AGENT_PROVIDER ?? "mock";

  if (provider === "mock") {
    return new MockAgent();
  }

  // Placeholder guard — swap this block when WatsonxAgent exists:
  // if (provider === "watsonx") { return new WatsonxAgent(); }

  console.warn(
    `[AgentService] Unknown AGENT_PROVIDER "${provider}". Falling back to MockAgent.`,
  );
  return new MockAgent();
}

// ─── AgentService ────────────────────────────────────────────────

export class AgentService {
  private readonly provider: IAgent;

  constructor(provider?: IAgent) {
    // Allow injection in tests; otherwise resolve from env.
    this.provider = provider ?? resolveProvider();
  }

  classifyEmail(input: ClassifyInput): Promise<ClassifyResult> {
    return this.provider.classifyEmail(input);
  }

  generateDailyBrief(input: DailyBriefInput): Promise<DailyBriefResult> {
    return this.provider.generateDailyBrief(input);
  }
}
