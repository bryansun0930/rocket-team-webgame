<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';
import { useCampaignStore } from '../stores/campaign';
import config from '../data/campaign.json';
import { regions } from '../systems/exploration';
import { rarityLabels } from '../systems/pokemon';
import type { Pokemon } from '../types/pokemon';
import { supportedCapture } from '../systems/pacing';
import ContractBoard from './ContractBoard.vue';
import PokemonSprite from './PokemonSprite.vue';
const campaign = useCampaignStore();
const contact = ref<HTMLElement | null>(null);
const names = new Map(config.encounters.map(p => [p.id, p.name]));
const pokemonNames = (ids: number[]) => ids.map(id => names.get(id) ?? `#${id}`).join('、');
watch(() => campaign.encounter ?? campaign.save.activities.event, async encounter => {
  if (encounter) { await nextTick(); contact.value?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
}, { immediate: true });
</script>

<template>
  <section class="exploration-panel" aria-label="地区探索">
    <nav class="region-tabs" aria-label="选择探索地区">
      <button v-for="region in regions" :key="region.id" :aria-pressed="campaign.location.region.id === region.id"
        :disabled="!!campaign.encounter || !!campaign.pendingEvent" @click="campaign.selectLocation(region.id)">{{ region.name }}</button>
    </nav>
    <ContractBoard />
    <p class="exploration-intro">{{ campaign.location.region.description }}</p>
    <p class="exploration-cost">每次调查：无需金币或精灵球 · 获得 {{ config.rules.surveyMoney }} 金币 / {{ config.rules.surveyMaterials }} 材料 · 通缉 +{{ Math.max(1, config.rules.wantedPerSurvey - campaign.save.buildings.intel * 2) }}。捕获时消耗精灵球。</p>
    <p v-if="campaign.encounter" class="exploration-lock" role="status">已发现目标，请先捕获或放弃接触，再继续调查或切换地区。</p>
    <article v-if="campaign.pendingEvent" ref="contact" class="activity-card exploration-event" aria-label="探索选择事件">
      <p class="eyebrow">探索事件 · 请选择行动</p><h3>{{ campaign.pendingEvent.title }}</h3>
      <p>{{ campaign.pendingEvent.description }}</p><p>发现目标：{{ campaign.save.activities.event?.encounter.name }}</p>
      <button v-for="choice in campaign.pendingEvent.choices" :key="choice.id" @click="campaign.chooseEvent(choice.id)"><strong>{{ choice.label }}</strong><span>{{ choice.description }}</span></button>
    </article>
    <article v-if="campaign.encounter" ref="contact" class="encounter-card" aria-label="当前遭遇">
      <p class="eyebrow">{{ campaign.encounter.location }} · #{{ campaign.encounter.id }}</p>
      <div class="encounter-scene"><PokemonSprite :id="campaign.encounter.id" :name="campaign.encounter.name" large :lazy="false" /></div>
      <h3>{{ campaign.encounter.name }} <span v-if="campaign.encounter.rarity" :class="['rarity-tag', campaign.encounter.rarity]">{{ rarityLabels[campaign.encounter.rarity as Pokemon['rarity']] }}</span></h3>
      <p v-if="(config.rules.firstCaptureGuaranteed && campaign.save.stats.captures === 0) || supportedCapture(campaign.save,campaign.encounter)">新手支援：本次捕获必定成功 · 消耗 1 枚精灵球</p>
      <p v-else>捕获概率 {{ Math.round(Math.min(.95, campaign.encounter.chance + campaign.save.buildings.lab * .08) * 100) }}% · 消耗 1 枚精灵球</p>
      <button :disabled="campaign.save.balls < 1" @click="campaign.catchPokemon()">投掷精灵球</button>
      <button class="secondary" @click="campaign.abandonEncounter()">放弃接触</button>
    </article>
    <div class="exploration-sites">
      <article v-for="site in campaign.location.region.sites" :key="site.id" class="exploration-site" :class="{ 'is-selected': campaign.location.site.id === site.id }">
        <header><h3>{{ site.name }}</h3><span>{{ site.pokemonIds.length }} 种</span></header>
        <p>{{ site.description }}</p>
        <p class="site-preview">可能出现：{{ pokemonNames(site.featured) }}等</p>
        <details><summary>查看完整遭遇名单</summary><p>{{ pokemonNames(site.pokemonIds) }}</p></details>
        <button :disabled="!!campaign.encounter || !!campaign.pendingEvent" @click="campaign.explore(site.id)">调查{{ site.name }}</button>
      </article>
    </div>
    <article class="special-investigation">
      <header><h3>{{ campaign.location.region.specialName }}</h3><span class="rarity-tag legendary">特殊调查</span></header>
      <p>传说线索：{{ pokemonNames(campaign.location.region.specialPokemonIds) }}。</p>
      <p>完成 {{ campaign.location.region.specialResearch }} 种物种研究解锁 · 当前 {{ campaign.save.studied.length }} 种。普通地点不会遇到传说宝可梦。</p>
      <button :disabled="!!campaign.encounter || !!campaign.pendingEvent || campaign.save.studied.length < campaign.location.region.specialResearch" @click="campaign.explore(undefined, true)">{{ campaign.save.studied.length < campaign.location.region.specialResearch ? '继续研究以解锁' : '开展特殊调查' }}</button>
    </article>

    <p class="exploration-cost">通缉达到 {{ config.rules.raidThreshold }} 会触发搜查，最多损失 {{ config.rules.raidMoney }} 金币。回基地休整可降低通缉。</p>
  </section>
</template>
