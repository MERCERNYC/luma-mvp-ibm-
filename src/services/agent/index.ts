/* ═══════════════════════════════════════════════════════════════
   Agent service — public API
   ───────────────────────────────────────────────────────────────
   SERVER-ONLY.  Import from here in API routes; never in components
   or client-side hooks.

   Public surface
   ──────────────
   agentService   — singleton entry point used by API routes
   AgentService   — class (for tests / custom instantiation)
   IAgent + all input/output types — for type-checking route handlers

   To swap in the real watsonx provider:
     1. Create  src/services/agent/WatsonxAgent.ts  implementing IAgent
     2. Set  AGENT_PROVIDER=watsonx  in .env.local
     3. Add the branch in AgentService.resolveProvider()
     4. No changes required anywhere else in the codebase
   ═══════════════════════════════════════════════════════════════ */

import "server-only";

export type {
  IAgent,
  EmailType,
  ClassifyInput,
  ClassifyResult,
  DailyBriefInput,
  DailyBriefResult,
} from "./types";

export { MockAgent }    from "./MockAgent";
export { AgentService } from "./AgentService";

import { AgentService } from "./AgentService";

/**
 * The active AgentService singleton used by all API routes.
 * Provider is selected by the AGENT_PROVIDER env var (default: "mock").
 */
export const agentService = new AgentService();
