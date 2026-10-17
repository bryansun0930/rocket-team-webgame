import type { Campaign, Mission, Encounter, Building } from '../types/campaign';

import { validateLocation } from './exploration.ts';

import { record } from './log.ts';
export { record } from './log.ts';
import { availablePokemon } from './activities.ts';
import { validateActivities } from './activity-save.ts';

import { surveyProgress } from './pacing.ts';

export interface Rules {
  ballPrice: number; researchMoney: number; researchPoints: number; tradeMoney: number;
  jobMoney: number; jobMaterials: number; restReduction: number; surveyMaterials: number;
  surveyMoney: number; wantedPerSurvey: number; raidThreshold: number; raidMoney: number;
}
export function survey(state: Campaign, rules: Rules, encounters: Encounter[], random = Math.random): Encounter {
  const encounter = chooseEncounter(encounters,random);
  state.turns++; state.stats.surveys++;
  surveyProgress(state);
  state.materials += rules.surveyMaterials; state.money += rules.surveyMoney;
  state.wanted += Math.max(1, rules.wantedPerSurvey - state.buildings.intel * 2);
  if (state.wanted >= rules.raidThreshold) {
    state.money = Math.max(0, state.money - rules.raidMoney); state.wanted = 40;
    record(state, `联盟搜查！损失最多 ${rules.raidMoney} 金币，成员已安全转移。`);
  }
  record(state, `调查发现 ${encounter.name}，获得 ${rules.surveyMoney} 金币、${rules.surveyMaterials} 材料。`);
  return { ...encounter };
}
export function chooseEncounter(encounters:Encounter[],random=Math.random):Encounter {
  const total=encounters.reduce((sum,p)=>sum+Math.max(0,p.weight??1),0);
  if(total<=0)throw new Error('调查区域没有可遭遇的宝可梦。');
  let roll=Math.min(.999999999,Math.max(0,random()))*total;
  for(const pokemon of encounters){roll-=Math.max(0,pokemon.weight??1);if(roll<0)return pokemon;}
  return encounters[encounters.length-1]!;
}
export function capture(state: Campaign, encounter: Encounter, random = Math.random, firstCaptureGuaranteed = false, encounterGuaranteed = false): boolean {
  if (state.balls < 1) throw new Error('精灵球不足，请前往补给处购买。');
  state.balls--;
  const success = encounterGuaranteed || (firstCaptureGuaranteed && state.stats.captures === 0) || random() < Math.min(.95, encounter.chance + state.buildings.lab * .08);
  if (success) {
    state.captures[encounter.id] = (state.captures[encounter.id] ?? 0) + 1;
    state.stats.captures++; state.reputation += 2;
    state.activities.dispatchActions++;
    record(state, `成功捕获 ${encounter.name}！`);
  } else record(state, `${encounter.name} 挣脱后离开了。继续调查可寻找新的目标。`);
  return success;
}
export function study(state: Campaign, id: number, rules: Rules): void {
  if (availablePokemon(state,id) < 1) throw new Error('需要有空闲的这只宝可梦，请先捕获或召回派遣伙伴。');
  if (state.studied.includes(id)) throw new Error('该物种已经完成研究。');
  if (state.money < rules.researchMoney) throw new Error('研究经费不足。');
  state.money -= rules.researchMoney;
  state.studied.push(id); state.stats.research++;
  state.research += rules.researchPoints + state.buildings.lab * 4;
  record(state, `完成 #${id} 的研究，获得研究点。宝可梦仍留在队伍中。`);
}
export function trade(state: Campaign, id: number, rules: Rules): void {
  if (availablePokemon(state,id) < 1) throw new Error('没有空闲的宝可梦可转交，请先召回派遣伙伴。');
  state.captures[id]!--; state.money += rules.tradeMoney; state.stats.trades++;
  record(state, `完成 #${id} 的转交，获得 ${rules.tradeMoney} 金币。`);
}
export function upgrade(state: Campaign, building: { id: string; name: string; money: number; materials: number; max: number }): void {
  const key = building.id as Building;
  const level = state.buildings[key];
  if (level >= building.max) throw new Error('设施已经达到最高等级。');
  const money = building.money * (level + 1), materials = building.materials * (level + 1);
  if (state.money < money || state.materials < materials) throw new Error('升级所需金币或材料不足。');
  state.money -= money; state.materials -= materials; state.buildings[key]++; state.stats.upgrades++;
  record(state, `${building.name} 已升至 ${level + 1} 级。`);
}
export function complete(state: Campaign, mission: Mission, total: number): void {
  if (state.ended || state.completed.includes(mission.id)) throw new Error('该任务已经完成。');
  if (mission.id !== `chapter_${String(state.chapter+1).padStart(2,'0')}`) throw new Error('任务尚未解锁。');
  if (state.stats[mission.objective] < mission.target) throw new Error('行动目标尚未达成。');
  for (const key of ['money', 'materials', 'research'] as const) {
    if (state[key] < mission.cost[key]) throw new Error('提交任务所需资源不足。');
  }
  for (const key of ['money', 'materials', 'research'] as const) state[key] += mission.reward[key] - mission.cost[key];
  state.reputation += mission.reward.reputation; state.completed.push(mission.id); state.chapter++;
  state.ended = state.chapter >= total;
  record(state, mission.ending);
}
export function validateSave(value: unknown): Campaign {
  if (!value || typeof value !== 'object') throw new Error('存档格式错误');
  const s = value as Campaign;
  const integer = (n: unknown) => typeof n === 'number' && Number.isSafeInteger(n) && n >= 0;
  if (s.version !== 1 || !integer(s.chapter) || s.chapter > 10 || typeof s.ended !== 'boolean'
    || s.ended !== (s.chapter === 10)
    || !['money','materials','research','reputation','wanted','balls','turns'].every(k => integer(s[k as keyof Campaign]))
    || !s.buildings || !['lab','quarters','intel'].every(k => integer(s.buildings[k as Building]) && s.buildings[k as Building] <= 3)
    || !s.stats || !['surveys','captures','research','trades','upgrades','jobs'].every(k => integer(s.stats[k as keyof Campaign['stats']]))
    || !s.captures || typeof s.captures !== 'object' || Array.isArray(s.captures)
    || !Object.entries(s.captures).every(([id,n]) => /^\d+$/.test(id) && Number(id) > 0 && integer(n))
    || !Array.isArray(s.studied) || !s.studied.every(id => integer(id) && id > 0) || new Set(s.studied).size !== s.studied.length
    || !Array.isArray(s.completed) || s.completed.length !== s.chapter
    || !s.completed.every((id,i) => id === `chapter_${String(i+1).padStart(2,'0')}`)
    || !Array.isArray(s.log) || s.log.length > 40 || !s.log.every(v => typeof v === 'string')) throw new Error('存档数据无效或版本不兼容');
  return { ...structuredClone(s), exploration: validateLocation(s.exploration), activities: validateActivities(s.activities,s) };
}
