import type { Campaign, Encounter, Mission } from '../types/campaign';
export interface Guidance { title:string; detail:string; label:string; panel:string; ready:boolean; progress:number; target:number; }
interface GuideRules { eventTitle?:string; locationName?:string; researchMoney:number; ballPrice:number; buildings: {id:string;money:number;materials:number;max:number}[]; }
export function getGuidance(s:Campaign, mission:Mission|undefined, encounter:Encounter|null, rules:GuideRules):Guidance {
  const make=(title:string,detail:string,label:string,panel:string,ready=false):Guidance=>({title,detail,label,panel,ready,progress:mission?Math.min(s.stats[mission.objective],mission.target):10,target:mission?.target??10});
  if(rules.eventTitle)return make(rules.eventTitle,'探索中出现了新的情况，选择追踪目标或带走物资。','处理探索事件','explore');
  if(!mission)return make('你已成为地下首领','主线通关！继续收集宝可梦，或把基地升到满级。','继续探索','explore');
  const researchable=Object.entries(s.captures).some(([id,n])=>n>0&&!s.studied.includes(Number(id)));
  const resourceHelp=()=>make('先补充行动物资','找补给员完成免费委托，获得金币和材料。','领取物资委托','market');
  const captureHelp=()=>{
    if(s.balls<1) return s.money>=rules.ballPrice?make('精灵球用完了','到补给员处购买精灵球，再来继续行动。','补充精灵球','market'):resourceHelp();
    return encounter?make(`发现 ${encounter.name}`,'目标已经出现，投出精灵球就能尝试捕获。','尝试捕获','explore'):make('寻找一只宝可梦',`调查${rules.locationName??'外围区域'}，发现目标后投掷精灵球。`,'去外围调查','explore');
  };
  if(s.stats[mission.objective]>=mission.target) {
    if(s.money<mission.cost.money||s.materials<mission.cost.materials)return resourceHelp();
    if(s.research<mission.cost.research)return researchable?(s.money>=rules.researchMoney?make('还需要研究资料','研究一只尚未研究的宝可梦，补足提交所需研究点。','去研究','collection'):resourceHelp()):captureHelp();
    return make('任务目标已达成',`「${mission.title}」可以交付了，领取奖励并解锁下一章。`,'领取章节奖励','missions',true);
  }
  switch(mission.objective) {
    case 'surveys':return make(s.chapter===0?'第一次行动：侦察外围':'继续收集外围情报',s.chapter===0?`先调查${rules.locationName??'外围'}。你会得到物资，并发现宝可梦。`:`前往${rules.locationName??'外围'}，再完成 ${mission.target-s.stats.surveys} 次调查。`,'开始调查','explore');
    case 'captures':return captureHelp();
    case 'research':return researchable?(s.money>=rules.researchMoney?make('让研究员分析你的伙伴','研究不会消耗宝可梦，每个物种能研究一次。','研究宝可梦','collection'):resourceHelp()):captureHelp();
    case 'upgrades': {
      const affordable=rules.buildings.some(b=>{const level=s.buildings[b.id as keyof typeof s.buildings];return level<b.max&&s.money>=b.money*(level+1)&&s.materials>=b.materials*(level+1);});
      return affordable?make('让基地运转起来','挑选一座设施升级。研究室能提高捕获率。','升级基地设施','base'):resourceHelp();
    }
    case 'jobs':return make('为成员筹备物资','补给员有一份免费委托，完成后可领取金币和材料。','去做物资委托','market');
    case 'trades':return Object.values(s.captures).some(n=>n>0)?make('建立新的运输渠道','在队伍中转交一只宝可梦，即可完成交易。','选择转交伙伴','collection'):captureHelp();
  }
}
