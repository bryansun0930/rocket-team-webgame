import config from '../data/activities.json' with { type: 'json' };
import type { Campaign, Encounter } from '../types/campaign';
import type { Activities } from '../types/activities';
import { record } from './log.ts';
import { trackingLimit, contractReward, eventIndexAt } from './pacing.ts';
export const activities = config;
export const emptyActivities = (): Activities => ({ contractSupportUsed:false, dispatchActions:0, supplyCredits:config.supply.initialCredits, normalSurveys:0, contract:null, completedContracts:[], event:null, dispatches:[], contact:null });
export function availablePokemon(state: Campaign, id: number): number {
  return (state.captures[id] ?? 0) - (state.activities?.dispatches.filter(d => d.pokemonId === id).length ?? 0);
}
export function acceptContract(state: Campaign, id: string) {
  if (!config.contracts.some(q => q.id === id)) throw new Error('委托不存在。');
  if (state.activities.contract) throw new Error('请先完成或取消当前委托。');
  if (state.activities.completedContracts.includes(id)) throw new Error('该委托已经完成。');
  state.activities.contract = { id, progress:0, searches:0 };
  record(state, '已接取捕获委托，请前往指定地点调查。');
}
export function trackedPool(state: Campaign, pool: Encounter[], special: boolean): Encounter[] {
  const active = state.activities.contract;
  const quest = config.contracts.find(q => q.id === active?.id);
  if (!active || !quest || active.progress || special || quest.siteId !== state.exploration.siteId) return pool;
  const target = pool.find(p => p.id === quest.pokemonId);
  if (!target) throw new Error('委托目标不在当前遭遇池。');
  active.searches++;
  if (active.searches >= trackingLimit(state)) return [target];
  return pool.map(p => p.id === target.id ? {...p, weight:(p.weight ?? 1)*config.tracking.weightMultiplier} : p);
}
export function contractCapture(state: Campaign, encounter: Encounter) {
  const active=state.activities.contract,quest=config.contracts.find(q=>q.id===active?.id);
  if (active && quest && !active.progress && encounter.id===quest.pokemonId && encounter.siteId===quest.siteId) {
    active.progress=1;record(state,`委托目标 ${quest.pokemonName} 已捕获，可领取奖励。`);
  }
}
function grant(state: Campaign, reward: {money:number;materials:number;research:number;balls:number;reputation:number}) {
  for(const key of ['money','materials','research','balls','reputation'] as const)state[key]+=reward[key];
}
export function claimContract(state: Campaign) {
  const active=state.activities.contract,quest=config.contracts.find(q=>q.id===active?.id);
  if(!active || !quest || !active.progress || state.activities.completedContracts.includes(active.id))throw new Error('委托尚未完成或奖励已领取。');
  grant(state,contractReward(state,quest.reward));state.activities.completedContracts.push(active.id);state.activities.contract=null;
  record(state,`完成委托「${quest.title}」，伙伴留在队伍。奖励已发放，可前往基地升级研究室，提高捕获率。`);
}
export function createEvent(state: Campaign, encounter: Encounter, special: boolean) {
  if(state.activities.event)throw new Error('请先处理当前探索事件。');
  if(special)return false;
  state.activities.normalSurveys=(state.activities.normalSurveys??0)+1;
  const index=eventIndexAt(state.activities.normalSurveys);
  if(index===null)return false;
  const event=config.events[index%config.events.length]!;
  state.activities.event={id:event.id,encounter:{...encounter}};return true;
}
export function resolveEvent(state: Campaign, choiceId: string, raid: {raidThreshold:number;raidMoney:number}): Encounter | null {
  const pending=state.activities.event,event=config.events.find(e=>e.id===pending?.id),choice=event?.choices.find(c=>c.id===choiceId);
  if(!pending || !choice)throw new Error('事件已处理或选项无效。');
  state.wanted=Math.max(0,state.wanted+choice.wanted);state.money+=choice.money;state.materials+=choice.materials;state.research+=choice.research;
  if(state.wanted>=raid.raidThreshold){state.money=Math.max(0,state.money-raid.raidMoney);state.wanted=40;record(state,'冒险引来联盟搜查，部分金币损失。');}
  const encounter=choice.keepEncounter?{...pending.encounter,chance:Math.min(.95,pending.encounter.chance+choice.chanceBonus)}:null;
  state.activities.event=null;record(state,`${event!.title}：${choice.label}。${choice.description}`);return encounter;
}
export function startDispatch(state: Campaign, jobId: string, pokemon: {id:number;type:string[]}) {
  const job=config.dispatches.find(d=>d.id===jobId);
  if(!job)throw new Error('派遣任务不存在。');
  if(state.activities.dispatches.length>=config.dispatchSlots)throw new Error('派遣位已满，请先领取或召回。');
  if(state.activities.dispatches.some(d=>d.jobId===jobId))throw new Error('此任务已有伙伴执行。');
  if(availablePokemon(state,pokemon.id)<1)throw new Error('没有空闲的这只宝可梦。');
  const bonus=job.types.some(t=>pokemon.type.includes(t));
  state.activities.dispatches.push({jobId,pokemonId:pokemon.id,finishTurn:state.activities.dispatchActions+job.turns,bonus});
  record(state,`伙伴已出发执行「${job.name}」，再进行 ${job.turns} 次调查、成功捕获或高收益物资委托后可领取。`);
}
export function finishDispatch(state: Campaign, jobId: string, cancel=false) {
  const index=state.activities.dispatches.findIndex(d=>d.jobId===jobId),run=state.activities.dispatches[index],job=config.dispatches.find(d=>d.id===jobId);
  if(!run || !job)throw new Error('派遣任务不存在。');
  if(!cancel && state.activities.dispatchActions<run.finishTurn)throw new Error('派遣尚未完成。');
  if(!cancel){grant(state,job.reward);if(run.bonus)grant(state,job.bonus);}
  state.activities.dispatches.splice(index,1);
  record(state,cancel?'伙伴已召回，本次没有派遣奖励。':`「${job.name}」完成，伙伴归队，派遣奖励已领取。`);
}
