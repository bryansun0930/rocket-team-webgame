<script setup lang="ts">
import { computed, reactive } from 'vue';
import { useCampaignStore } from '../stores/campaign';
import { usePokedexStore } from '../stores/pokedex';
import { activities } from '../systems/activities';
const campaign=useCampaignStore(),dex=usePokedexStore();
const selected=reactive<Record<string,number>>({});
const eligible=computed(()=>campaign.collection.filter(p=>p.available>0));
const name=(id:number)=>dex.entries.find(p=>p.id===id)?.name??`#${id}`;
const run=(id:string)=>campaign.save.activities.dispatches.find(d=>d.jobId===id);
const pick=(id:string)=>selected[id]&&eligible.value.some(p=>p.id===selected[id])?selected[id]:eligible.value[0]?.id;
const matches=(job:typeof activities.dispatches[number])=>job.types.some(t=>dex.entries.find(p=>p.id===pick(job.id))?.type.includes(t));
const reward=(r:{money:number;materials:number;research:number;balls:number})=>[r.money?`${r.money} 金币`:'',r.materials?`${r.materials} 材料`:'',r.research?`${r.research} 研究`:'',r.balls?`${r.balls} 精灵球`:''].filter(Boolean).join(' · ');
function send(id:string){const pokemonId=pick(id);if(pokemonId)campaign.sendDispatch(id,pokemonId);}
</script>
<template>
  <section class="dispatch-panel" aria-label="宝可梦派遣">
    <details class="dispatch-fold" :open="campaign.save.activities.dispatches.length>0">
    <summary>伙伴派遣 <span>{{ campaign.save.activities.dispatches.length }} / {{ activities.dispatchSlots }} 队{{ campaign.readyDispatches?` · ${campaign.readyDispatches}可领取`:' · 展开安排任务' }}</span></summary>
    <p>调查、成功捕获、高收益物资委托各推进 1 次行动；休整和应急补给不推进，无需挂机等待。派遣中的个体暂不能研究或转交，领取或召回后归队。</p>
    <article v-for="job in activities.dispatches" :key="job.id" class="activity-card">
      <h3>{{ job.name }} <small>{{ job.turns }} 次行动</small></h3>
      <p>基础奖励：{{ reward(job.reward) }} · {{ job.reward.reputation }} 声望</p>
      <p>适合 {{ job.types.join(' / ') }} 属性 · 匹配额外获得 {{ reward(job.bonus) }}</p>
      <template v-if="run(job.id)">
        <p>{{ name(run(job.id)!.pokemonId) }} · {{ run(job.id)!.bonus?'属性加成已生效':'基础收益' }}</p>
        <progress :value="job.turns-Math.max(0,run(job.id)!.finishTurn-campaign.save.activities.dispatchActions)" :max="job.turns" />
        <p>{{ run(job.id)!.finishTurn<=campaign.save.activities.dispatchActions?'派遣已完成，可领取奖励':`还需 ${run(job.id)!.finishTurn-campaign.save.activities.dispatchActions} 次行动` }}</p>
        <button :disabled="run(job.id)!.finishTurn>campaign.save.activities.dispatchActions" @click="campaign.collectDispatch(job.id)">领取{{ job.name }}奖励</button>
        <button class="secondary" @click="campaign.collectDispatch(job.id,true)">召回伙伴（放弃奖励）</button>
      </template>
      <template v-else>
        <label :for="`dispatch-${job.id}`">选择空闲伙伴</label>
        <select :id="`dispatch-${job.id}`" :value="pick(job.id)??''" :disabled="!eligible.length" @change="selected[job.id]=Number(($event.target as HTMLSelectElement).value)">
          <option v-if="!eligible.length" value="">暂无空闲伙伴，请先捕获</option>
          <option v-for="pokemon in eligible" :key="pokemon.id" :value="pokemon.id">{{ name(pokemon.id) }} · 空闲 {{ pokemon.available }} 只</option>
        </select>
        <p v-if="eligible.length">{{ matches(job)?'属性匹配，出发后获得额外奖励':'属性未匹配，仍可获得基础奖励' }}</p>
        <button :disabled="!eligible.length || !dex.loaded || campaign.save.activities.dispatches.length>=activities.dispatchSlots" @click="send(job.id)">派遣执行{{ job.name }}</button>
      </template>
    </article>
    </details>
  </section>
</template>
