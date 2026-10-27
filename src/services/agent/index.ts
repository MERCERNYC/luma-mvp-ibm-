/* ═══════════════════════════════════════════════════════════════
   Agent service — public API
   ───────────────────────────────────────────────────────────────
   Import from here, never from MockAgent or types directly.

   To swap in the real watsonx agent:
     1. Create  src/services/agent/WatsonxAgent.ts  implementing IAgent
     2. Replace the `agent` export below with a WatsonxAgent instance
     3. No changes required anywhere else in the codebase
   ═══════════════════════════════════════════════════════════════ */

export type {
  IAgent,
  ClassifyInput,
  ClassifyResult,
  DailyBriefInput,
  DailyBriefResult,
} from "./types";

export { MockAgent } from "./MockAgent";

import { MockAgent } from "./MockAgent";

/**
 * The active agent singleton used by all components.
 * Currently: MockAgent (deterministic, no network calls).
 * Replace with: `new WatsonxAgent(config)` when ready.
 */
export const agent: import("./types").IAgent = new MockAgent();
