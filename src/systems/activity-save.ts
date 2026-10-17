import { activities, emptyActivities } from './activities.ts';
import type { Activities } from '../types/activities';
import type { Campaign, Encounter } from '../types/campaign';
import { validateLocation } from './exploration.ts';
const integer=(n:unknown)=>typeof n==='number'&&Number.isSafeInteger(n)&&n>=0;
function contact(value:unknown): value is Encounter {
  if(!value || typeof value!=='object')return false;
  const e=value as Encounter;
  try {validateLocation({regionId:e.regionId,siteId:e.siteId});}catch{return false;}
  return integer(e.id)&&e.id>0&&e.id<=386&&typeof e.name==='string'&&!!e.name.trim()&&typeof e.chance==='number'&&Number.isFinite(e.chance)&&e.chance>=0&&e.chance<=1&&typeof e.location==='string'&&['common','uncommon','rare','legendary'].includes(e.rarity??'');
}
export function validateActivities(value:unknown,state:Campaign):Activities {
  if(value===undefined)return {...emptyActivities(),dispatchActions:state.turns};
  if(!value||typeof value!=='object')throw new Error('活动存档无效');
  const a=value as Activities,contracts=activities.contracts.map(q=>q.id);
  if((a.contractSupportUsed!==undefined&&typeof a.contractSupportUsed!=='boolean')||!integer(a.dispatchActions??state.turns)||!integer(a.supplyCredits??activities.supply.initialCredits)||!integer(a.normalSurveys??0)||!Array.isArray(a.completedContracts)||a.completedContracts.some(id=>!contracts.includes(id))||new Set(a.completedContracts).size!==a.completedContracts.length
    ||(a.contract!==null&&(!a.contract||!contracts.includes(a.contract.id)||a.completedContracts.includes(a.contract.id)||!integer(a.contract.progress)||a.contract.progress>1||!integer(a.contract.searches)))
    ||!Array.isArray(a.dispatches)||a.dispatches.length>activities.dispatchSlots
    ||new Set(a.dispatches.map(d=>d?.jobId)).size!==a.dispatches.length
    ||a.dispatches.some(d=>!d||!activities.dispatches.some(j=>j.id===d.jobId)||!integer(d.pokemonId)||d.pokemonId<1||d.pokemonId>386||!integer(d.finishTurn)||typeof d.bonus!=='boolean')
    ||(a.contact!==null&&!contact(a.contact))
    ||(a.event!==null&&(!a.event||!activities.events.some(e=>e.id===a.event?.id)||!contact(a.event.encounter)))
    ||(a.event!==null&&a.contact!==null))throw new Error('活动存档无效');
  for(const d of a.dispatches)if(a.dispatches.filter(v=>v.pokemonId===d.pokemonId).length>(state.captures[d.pokemonId]??0))throw new Error('派遣伙伴数量无效');
  return {...structuredClone(a), contractSupportUsed:a.contractSupportUsed??false,normalSurveys:a.normalSurveys??0,dispatchActions:a.dispatchActions??state.turns,supplyCredits:a.supplyCredits??activities.supply.initialCredits};
}
