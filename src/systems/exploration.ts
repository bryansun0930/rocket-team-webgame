import locations from '../data/exploration.json' with { type: 'json' };
import type { Campaign, Encounter } from '../types/campaign';

export const regions = locations.regions;
export type ExplorationSelection = { regionId: string; siteId: string };
export function validateLocation(value: unknown): ExplorationSelection {
  if (value === undefined) return { regionId: locations.defaultRegionId, siteId: locations.defaultSiteId };
  if (!value || typeof value !== 'object') throw new Error('探索地点无效');
  const selected = value as ExplorationSelection;
  const region = regions.find(r => r.id === selected.regionId);
  if (!region?.sites.some(site => site.id === selected.siteId)) throw new Error('探索地点无效');
  return { regionId: selected.regionId, siteId: selected.siteId };
}
export function getLocation(selection: ExplorationSelection) {
  const selected = validateLocation(selection);
  const region = regions.find(r => r.id === selected.regionId)!;
  return { region, site: region.sites.find(s => s.id === selected.siteId)! };
}
export function explorationPool(state: Campaign, encounters: Encounter[], special = false): Encounter[] {
  const { region, site } = getLocation(state.exploration);
  if (special && state.studied.length < region.specialResearch) throw new Error(`完成 ${region.specialResearch} 种物种研究后解锁特殊调查。`);
  const ids = new Set(special ? region.specialPokemonIds : site.pokemonIds);
  const pool = encounters.filter(p => ids.has(p.id) && (special ? p.rarity === 'legendary' : p.rarity !== 'legendary'));
  if (!pool.length) throw new Error('该地点暂无可遭遇的宝可梦。');
  return pool;
}
