import type { Pokemon } from '../types/pokemon';
export const rarityLabels = { common:'常见', uncommon:'少见', rare:'稀有', legendary:'传说' };

export function parsePokemon(data: unknown): Pokemon[] {
  if (!Array.isArray(data)) throw new Error('图鉴数据必须是数组');
  const ids = new Set<number>();
  for (const entry of data) {
    if (!entry || typeof entry !== 'object') throw new Error('图鉴条目格式错误');
    const p = entry as Record<string, unknown>;
    if (!Number.isInteger(p.id) || (p.id as number) <= 0 || ids.has(p.id as number)
      || !['name', 'englishName', 'category', 'description'].every(
        (field) => typeof p[field] === 'string' && (p[field] as string).trim().length > 0,
      )
      || !Array.isArray(p.type) || p.type.length === 0
      || !p.type.every((t: unknown) => typeof t === 'string' && t.trim().length > 0)
      || typeof p.sprite !== 'string' || !/^assets\/pokemon\/sprites\/\d{3}\.png$/.test(p.sprite)
      || typeof p.habitat !== 'string' || !p.habitat.trim()
      || typeof p.rarity !== 'string' || !Object.hasOwn(rarityLabels,p.rarity)
      || !['rocketValue', 'researchValue'].every(
        (field) => typeof p[field] === 'number' && Number.isFinite(p[field]) && (p[field] as number) >= 0,
      )) throw new Error('图鉴条目缺少有效字段或编号重复');
    ids.add(p.id as number);
  }
  return (data as Pokemon[]).slice().sort((a, b) => a.id - b.id);
}

export function filterPokemon(entries: Pokemon[], query: string, type: string, rarity=''): Pokemon[] {
  const term = query.trim().toLocaleLowerCase();
  return entries.filter((p) => (!type || p.type.includes(type)) && (!rarity || p.rarity===rarity) && (
    !term || p.name.toLocaleLowerCase().includes(term)
    || p.englishName.toLocaleLowerCase().includes(term)
    || String(p.id).padStart(3, '0').includes(term.replace(/^#/, ''))
  ));
}
