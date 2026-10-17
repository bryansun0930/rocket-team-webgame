<script setup lang="ts">
import { computed } from 'vue';
import { useCampaignStore } from '../stores/campaign';
import { firstContract, trackingLimit, contractReward } from '../systems/pacing';
import { activities } from '../systems/activities';
import { getLocation } from '../systems/exploration';
const campaign=useCampaignStore();
const contracts=computed(()=>activities.contracts.filter(q=>q.regionId===campaign.location.region.id));
const destination=(q:{regionId:string;siteId:string})=>{const p=getLocation(q);return `${p.region.name}·${p.site.name}`;};
const blocked=computed(()=>!!campaign.encounter||!!campaign.save.activities.event);
</script>
<template>
  <section class="contract-board" aria-label="定向捕获委托">
    <article v-if="campaign.activeContract" class="activity-card active-contract">
      <p class="eyebrow">正在追踪 · 捕获委托</p>
      <h3>{{ campaign.activeContract.title }} <small>{{ campaign.save.activities.contract?.progress ? '已完成' : '0 / 1' }}</small></h3>
      <p>目标地点：{{ destination(campaign.activeContract) }}。接取后在此捕获 {{ campaign.activeContract.pokemonName }}，伙伴会留在队伍。</p>
      <p v-if="!campaign.save.activities.contract?.progress">目标出现权重提高 · 已调查 {{ campaign.save.activities.contract?.searches }} 次，连续 {{ trackingLimit(campaign.save) }} 次保底发现目标。</p>
      <p v-if="firstContract(campaign.save)">新手委托：{{ campaign.save.activities.contractSupportUsed?'捕获支援已使用':'目标首次投球必定成功（仅支援一次）' }}；奖励 {{ activities.tracking.firstReward.money }} 金币、{{ activities.tracking.firstReward.materials }} 材料，足够进行一次研究室初次升级。</p>
      <button v-if="campaign.save.activities.contract?.progress" @click="campaign.claimCaptureContract()">领取捕获委托奖励</button>
      <button v-else :disabled="blocked" @click="campaign.investigateContract()">调查委托地点</button>
      <button class="secondary" @click="campaign.cancelContract()">取消捕获委托</button>
    </article>
    <details class="contract-catalog">
      <summary>捕获委托 · {{ campaign.location.region.name }} <span>已完成 {{ campaign.save.activities.completedContracts.length }} / {{ activities.contracts.length }}</span></summary>
      <article v-for="quest in contracts" :key="quest.id" class="activity-card">
        <h3>{{ quest.title }}</h3><p>{{ destination(quest) }} · 捕获 1 只 {{ quest.pokemonName }}</p>
        <p>奖励 {{ contractReward(campaign.save,quest.reward).money }} 金币 · {{ contractReward(campaign.save,quest.reward).materials }} 材料 · {{ contractReward(campaign.save,quest.reward).research }} 研究 · {{ contractReward(campaign.save,quest.reward).balls }} 精灵球 · {{ contractReward(campaign.save,quest.reward).reputation }} 声望</p>
        <p v-if="firstContract(campaign.save)">首份完成的委托享受新手奖励和捕获支援。</p>
        <button :disabled="!!campaign.activeContract || campaign.save.activities.completedContracts.includes(quest.id)" @click="campaign.acceptCaptureContract(quest.id)">{{ campaign.save.activities.completedContracts.includes(quest.id)?'已完成':campaign.activeContract?.id===quest.id?'进行中':'接取'+quest.title+'委托' }}</button>
      </article>
    </details>
  </section>
</template>
