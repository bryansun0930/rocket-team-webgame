import type { Activities } from './activities';
export type Resource = 'money' | 'materials' | 'research';
export type Building = 'lab' | 'quarters' | 'intel';
export interface Campaign {
  version: 1;
  activities: Activities;
  exploration: { regionId: string; siteId: string };
  chapter: number;
  money: number;
  materials: number;
  research: number;
  reputation: number;
  wanted: number;
  balls: number;
  turns: number;
  captures: Record<string, number>;
  studied: number[];
  completed: string[];
  buildings: Record<Building, number>;
  stats: { surveys: number; captures: number; research: number; trades: number; upgrades: number; jobs: number };
  log: string[];
  ended: boolean;
}
export interface Mission {
  id: string;
  title: string;
  brief: string;
  ending: string;
  objective: keyof Campaign['stats'];
  target: number;
  cost: { money: number; materials: number; research: number };
  reward: { money: number; materials: number; research: number; reputation: number };
}
export interface Encounter { id: number; name: string; chance: number; weight?: number; rarity?: string; location?: string; regionId?: string; siteId?: string; }
