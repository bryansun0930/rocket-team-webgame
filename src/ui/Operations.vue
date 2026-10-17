<script setup lang="ts">
import { computed } from 'vue';
import { useCampaignStore } from '../stores/campaign';
import { usePokedexStore } from '../stores/pokedex';
import config from '../data/campaign.json';
import type { Building } from '../types/campaign';
import PokemonSprite from './PokemonSprite.vue';
import { activities } from '../systems/activities';
import DispatchPanel from './DispatchPanel.vue';
import ExplorationPanel from './ExplorationPanel.vue';
const props = defineProps<{ panel: string }>();
const campaign = useCampaignStore();
const dex = usePokedexStore();
const objectives: Record<string,string> = { surveys:'实地调查',captures:'累计捕获',research:'物种研究',trades:'完成交易',upgrades:'设施升级',jobs:'物资委托' };
const progress = computed(() => campaign.mission ? campaign.save.stats[campaign.mission.objective as keyof typeof campaign.save.stats] : 0);
const name = (id:number) => dex.entries.find(p=>p.id===id)?.name ?? `#${id}`;
const costText = (cost: {money:number;materials:number;research:number}) => [cost.money?`${cost.money} 金币`:'',cost.materials?`${cost.materials} 材料`:'',cost.research?`${cost.research} 研究点`:''].filter(Boolean).join(' · ') || '无';
</script>
<template>
  <section :class="['operations',`operations-${props.panel}`]">
    <template v-if="props.panel === 'missions'">
      <p class="eyebrow">MISSION CONTROL</p>
      <template v-if="campaign.mission">
        <h2>第 {{ campaign.save.chapter + 1 }} 章 · {{ campaign.mission.title }}</h2>
        <p class="story-text">{{ campaign.mission.brief }}</p>
        <div class="objective"><strong>{{ objectives[campaign.mission.objective] }}</strong><span>{{ Math.min(progress,campaign.mission.target) }} / {{ campaign.mission.target }}</span></div>
        <progress :value="progress" :max="campaign.mission.target" />
        <p>提交资源：{{ costText(campaign.mission.cost) }}</p>
        <p>奖励：{{ costText(campaign.mission.reward) }} · {{ campaign.mission.reward.reputation }} 声望</p>
        <button :disabled="progress < campaign.mission.target" @click="campaign.finishMission()">提交行动报告</button>
      </template>
      <template v-else><h2>地下王者</h2><p class="story-text">你已完成全部十章主线，成为组织首领。可以继续探索、收集与经营基地。</p><p>最终等级 {{ campaign.level }} · 声望 {{ campaign.save.reputation }} · 调查 {{ campaign.save.stats.surveys }} 次</p></template>
      <details><summary>章节记录 · {{ campaign.save.completed.length }} / 10</summary><ol><li v-for="(mission,index) in config.missions" :key="mission.id">{{ mission.title }} {{ index < campaign.save.chapter ? '✓' : index === campaign.save.chapter ? '进行中' : '未解锁' }}</li></ol></details>
    </template>
    <template v-else-if="props.panel === 'explore'">
      <ExplorationPanel />
    </template>
    <template v-else-if="props.panel === 'base'">
      <p class="eyebrow">BASE MANAGEMENT</p><h2>基地建设</h2>
      <div class="facility-grid"><article v-for="building in config.buildings" :key="building.id" class="facility-card">
        <h3>{{ building.name }} <small>Lv.{{ campaign.save.buildings[building.id as Building] }}</small></h3><p>{{ building.description }}</p>
        <p v-if="campaign.save.buildings[building.id as Building] < building.max">升级：{{ building.money*(campaign.save.buildings[building.id as Building]+1) }} 金币 · {{ building.materials*(campaign.save.buildings[building.id as Building]+1) }} 材料</p>
        <button :disabled="campaign.save.buildings[building.id as Building] >= building.max" @click="campaign.upgradeBuilding(building.id)">{{ campaign.save.buildings[building.id as Building] >= building.max ? '已满级' : '升级设施' }}</button>
      </article></div><button @click="campaign.rest()">隐蔽休整 · 通缉 −{{ config.rules.restReduction }}</button>
    </template>
    <template v-else-if="props.panel === 'collection'">
      <p class="eyebrow">RESEARCH DIVISION</p><h2>队伍与研究</h2>
      <DispatchPanel />
      <h3>队伍与研究</h3>
      <p>每个物种可研究一次；研究后仍保留宝可梦。研究经费 {{ config.rules.researchMoney }} 金币。</p>
      <p v-if="!campaign.collection.length">队伍为空，去外围行动区调查并捕获宝可梦。</p>
      <div class="facility-grid"><article v-for="pokemon in campaign.collection" :key="pokemon.id" class="facility-card">
        <PokemonSprite :id="pokemon.id" :name="name(pokemon.id)" />
        <h3>{{ name(pokemon.id) }} <small>持有 {{ pokemon.count }} · 空闲 {{ pokemon.available }}</small></h3>
        <button :disabled="campaign.save.studied.includes(pokemon.id)||pokemon.available<1" @click="campaign.researchPokemon(pokemon.id)">{{ campaign.save.studied.includes(pokemon.id) ? '已研究' : '研究物种' }}</button>
        <button class="secondary" :disabled="pokemon.available<1" @click="campaign.tradePokemon(pokemon.id)">转交一只 · +{{ config.rules.tradeMoney }} 金币</button>
      </article></div>
    </template>
    <template v-else-if="props.panel === 'market'">
      <p class="eyebrow">SUPPLY NETWORK</p><h2>补给与委托</h2><p>每调查 {{ activities.supply.surveysPerCredit }} 次解锁 1 份高收益委托；初始提供 2 份。宿舍升级提高高收益金币，次数用尽后仍有应急补给。</p>
      <p>高收益委托剩余 {{ campaign.save.activities.supplyCredits }} 份 · 再调查 {{ activities.supply.surveysPerCredit-campaign.save.stats.surveys%activities.supply.surveysPerCredit }} 次解锁下一份。</p>
      <div class="action-stack"><button @click="campaign.work()">{{ campaign.save.activities.supplyCredits>0 ? `物资委托 · +${config.rules.jobMoney+campaign.save.buildings.quarters*15} 金币 / +${config.rules.jobMaterials} 材料` : `应急补给 · +${activities.supply.emergencyMoney} 金币 / +${activities.supply.emergencyMaterials} 材料（不推进派遣）` }}</button>
      <button @click="campaign.buyBalls()">购买精灵球 · {{ config.rules.ballPrice }} 金币</button><button @click="campaign.rest()">隐蔽休整 · 降低通缉</button></div>
    </template>
  </section>
</template>
