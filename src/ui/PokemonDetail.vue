<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue';
import type { Pokemon } from '../types/pokemon';
import { useCampaignStore } from '../stores/campaign';
import { rarityLabels } from '../systems/pokemon';
import PokemonSprite from './PokemonSprite.vue';

defineProps<{ pokemon: Pokemon }>();
const emit = defineEmits<{ close: [] }>();
const campaign = useCampaignStore();
const dialog = ref<HTMLDialogElement | null>(null);
onMounted(async () => {
  await nextTick();
  dialog.value?.showModal();
});
</script>

<template>
  <dialog ref="dialog" class="dex-modal" aria-labelledby="pokemon-detail-title" aria-modal="true"
    @cancel.prevent.stop="emit('close')" @keydown.stop @click.self="emit('close')">
    <header class="dex-modal-header">
      <span class="eyebrow">POKÉDEX · NO. {{ String(pokemon.id).padStart(3, '0') }}</span>
      <button autofocus aria-label="关闭宝可梦详情" @click="emit('close')">✕</button>
    </header>
    <article class="dex-detail">
      <div class="dex-hero" :data-rarity="pokemon.rarity"><PokemonSprite :id="pokemon.id" :name="pokemon.name" large :lazy="false" /></div>
      <h2 id="pokemon-detail-title">{{ pokemon.name }}</h2>
      <p>{{ pokemon.englishName }} · {{ pokemon.category }}</p>
      <div class="type-tags"><span v-for="type in pokemon.type" :key="type">{{ type }}</span></div>
      <p class="species-meta"><span :class="['rarity-tag', pokemon.rarity]">{{ rarityLabels[pokemon.rarity] }}</span> 栖息地：{{ pokemon.habitat }}</p>
      <p class="description">{{ pokemon.description }}</p>
      <dl>
        <div><dt>组织价值</dt><dd>{{ pokemon.rocketValue }}</dd></div>
        <div><dt>研究价值</dt><dd>{{ pokemon.researchValue }}</dd></div>
      </dl>
      <p>队伍持有：{{ campaign.save.captures[pokemon.id] ?? 0 }} 只 · {{ campaign.save.studied.includes(pokemon.id) ? '已完成研究' : '尚未研究' }}</p>
      <p class="data-note">以上为物种档案评分。捕获后可在“队伍”中研究或转交，实际收益见对应操作。</p>
    </article>
  </dialog>
</template>
