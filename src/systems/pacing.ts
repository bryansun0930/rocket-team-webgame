import config from '../data/activities.json' with { type: 'json' };
import type { Campaign, Encounter } from '../types/campaign';
import { record } from './log.ts';
export const firstContract = (state:Campaign) => state.activities.completedContracts.length === 0;
export const trackingLimit = (state:Campaign) => firstContract(state) ? config.tracking.firstGuaranteeAfter : config.tracking.guaranteeAfter;
export const contractReward = (state:Campaign, reward:typeof config.tracking.firstReward) => firstContract(state) ? config.tracking.firstReward : reward;
export function supportedCapture(state:Campaign, encounter:Encounter):boolean {
 const active=state.activities.contract,quest=config.contracts.find(q=>q.id===active?.id);
 return !state.activities.contractSupportUsed&&firstContract(state)&&!!active&&!active.progress&&quest?.pokemonId===encounter.id&&quest?.siteId===encounter.siteId;
}
export function surveyProgress(state:Campaign) {
 state.activities.dispatchActions++;
 if(state.stats.surveys % config.supply.surveysPerCredit===0)state.activities.supplyCredits++;
}
export function supplyWork(state:Campaign,rules:{jobMoney:number;jobMaterials:number}) {
 const full=state.activities.supplyCredits>0;
 const money=full?rules.jobMoney+state.buildings.quarters*15:config.supply.emergencyMoney;
 const materials=full?rules.jobMaterials:config.supply.emergencyMaterials;
 if(full){state.activities.supplyCredits--;state.activities.dispatchActions++;}
 state.money+=money;state.materials+=materials;state.stats.jobs++;state.turns++;
 record(state,`${full?'物资委托':'应急补给'}完成：+${money} 金币，+${materials} 材料。${full?'同时推进派遣。':'不推进派遣；探索可解锁高收益委托。'}`);
}
/** First teaching event at 3 surveys, then 4/5/6 survey gaps; deterministic across reloads. */
export function eventIndexAt(surveys:number):number|null {
 if(surveys<config.eventInterval)return null;
 let remaining=surveys-config.eventInterval;
 if(remaining===0)return 0;
 const cycle=config.eventIntervals.reduce((a,b)=>a+b,0),cycles=Math.floor(remaining/cycle);
 remaining%=cycle;
 if(remaining===0)return cycles*config.eventIntervals.length;
 let boundary=0;
 for(let i=0;i<config.eventIntervals.length;i++){boundary+=config.eventIntervals[i]!;if(remaining===boundary)return cycles*config.eventIntervals.length+i+1;}
 return null;
}
