import type { Encounter } from './campaign';
export interface Activities {
  normalSurveys: number;
  dispatchActions: number;
  supplyCredits: number;
  contractSupportUsed: boolean;
  contract: { id: string; progress: number; searches: number } | null;
  completedContracts: string[];
  event: { id: string; encounter: Encounter } | null;
  dispatches: { jobId: string; pokemonId: number; finishTurn: number; bonus: boolean }[];
  contact: Encounter | null;
}
