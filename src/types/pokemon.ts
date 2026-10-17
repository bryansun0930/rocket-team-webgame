export interface Pokemon {
  id: number;
  name: string;
  englishName: string;
  type: string[];
  category: string;
  description: string;
  rocketValue: number;
  researchValue: number;
  sprite: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  habitat: string;
}
