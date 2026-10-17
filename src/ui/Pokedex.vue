<script setup lang="ts">
import { onMounted, onBeforeUnmount, nextTick, computed } from 'vue';
import { usePokedexStore } from '../stores/pokedex';
import { useCampaignStore } from '../stores/campaign';
import PokemonDetail from './PokemonDetail.vue';
import { rarityLabels } from '../systems/pokemon';

const dex = usePokedexStore();
const campaign = useCampaignStore();
const registered = computed(() => dex.entries.filter(p => Object.hasOwn(campaign.save.captures, p.id)).length);
let opener: HTMLElement | null = null;
onMounted(() => { void dex.load(); });
onBeforeUnmount(() => { dex.selectedId = null; });
function openDetail(id: number, event: MouseEvent) {
  opener = event.currentTarget as HTMLElement;
  dex.selectedId = id;
}
async function closeDetail() {
  dex.selectedId = null;
  await nextTick();
  opener?.focus({ preventScroll: true });
}
</script>

<template>
  <section class="pokedex" aria-label="宝可梦图鉴">
    <p class="dex-summary">关都 · 城都 · 丰缘 <span>已收录 {{ registered }} / {{ dex.entries.length }} 种</span></p>
    <div class="dex-filters">
      <label>搜索
        <input v-model="dex.query" type="search" placeholder="中文名 / 英文名 / 编号" />
      </label>
      <label>属性分类
        <select v-model="dex.type">
          <option value="">全部属性</option>
          <option v-for="type in dex.types" :key="type" :value="type">{{ type }}</option>
        </select>
      </label>
      <label>稀有度
        <select v-model="dex.rarity"><option value="">全部稀有度</option><option v-for="(label,key) in rarityLabels" :key="key" :value="key">{{ label }}</option></select>
      </label>
    </div>
    <p v-if="dex.loading" role="status">正在读取图鉴…</p>
    <div v-else-if="dex.error" role="alert">
      <p>{{ dex.error }}</p><button @click="dex.load()">重新加载</button>
    </div>
    <template v-else>
      <p class="dex-result-count" role="status">找到 {{ dex.filtered.length }} / {{ dex.entries.length }} 条档案 · 上下滑动查看</p>
      <div v-if="dex.filtered.length" class="dex-list">
        <button v-for="pokemon in dex.filtered" :key="pokemon.id" class="dex-row" :data-rarity="pokemon.rarity"
          :aria-label="`查看${pokemon.name}详情`" aria-haspopup="dialog" @click="openDetail(pokemon.id, $event)">
          <span class="dex-row-content">
            <span class="dex-row-title"><span class="dex-number">#{{ String(pokemon.id).padStart(3, '0') }}</span><strong>{{ pokemon.name }}</strong><span class="english-name">{{ pokemon.englishName }}</span></span>
            <span class="dex-row-tags"><span class="type-tags"><span v-for="type in pokemon.type" :key="type">{{ type }}</span></span><span :class="['rarity-tag',pokemon.rarity]">{{ rarityLabels[pokemon.rarity] }}</span><span v-if="campaign.save.captures[pokemon.id]" class="ownership">×{{ campaign.save.captures[pokemon.id] }}</span><span v-else-if="Object.hasOwn(campaign.save.captures,pokemon.id)" class="ownership">已收录</span></span>
          </span>
          <span class="dex-row-arrow" aria-hidden="true">›</span>
        </button>
      </div>
      <div v-else class="empty-state">
        <p>没有符合条件的宝可梦。</p>
        <button @click="dex.clearFilters()">清除筛选</button>
      </div>
    </template>
    <PokemonDetail v-if="dex.selected" :pokemon="dex.selected" @close="closeDetail" />
  </section>
</template>
