import { defineStore } from 'pinia';
import { filterPokemon, parsePokemon } from '../systems/pokemon';
import type { Pokemon } from '../types/pokemon';

export const usePokedexStore = defineStore('pokedex', {
  state: () => ({
    entries: [] as Pokemon[],
    query: '',
    type: '',
    rarity: '',
    selectedId: null as number | null,
    loading: false,
    loaded: false,
    error: '',
  }),
  getters: {
    types: (state) => [...new Set(state.entries.flatMap((p) => p.type))],
    filtered: (state) => filterPokemon(state.entries, state.query, state.type, state.rarity),
    selected: (state) => state.entries.find((p) => p.id === state.selectedId),
  },
  actions: {
    async load() {
      if (this.loading || this.loaded) return;
      this.loading = true;
      this.error = '';
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}data/pokemon.json`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        this.entries = parsePokemon(await response.json());
        this.loaded = true;
      } catch {
        this.error = '图鉴数据加载失败，请检查数据文件后重试。';
      } finally {
        this.loading = false;
      }
    },
    clearFilters() {
      this.query = '';
      this.type = '';
      this.rarity = '';
    },
  },
});
