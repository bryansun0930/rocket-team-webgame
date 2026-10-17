import { defineStore } from 'pinia';
import config from '../data/campaign.json';
import type { Campaign, Encounter, Mission } from '../types/campaign';
import { capture, complete, record, study, survey, trade, upgrade } from '../systems/campaign';
import { activities, availablePokemon, acceptContract, trackedPool, contractCapture, claimContract, createEvent, resolveEvent, startDispatch, finishDispatch } from '../systems/activities';
import { supportedCapture, supplyWork } from '../systems/pacing';
import { usePokedexStore } from './pokedex';
import { readSave, writeSave } from '../systems/save';

import { explorationPool, getLocation, regions, validateLocation } from '../systems/exploration';

const fresh = () => JSON.parse(JSON.stringify(config.initial)) as Campaign;
const missions = config.missions as Mission[];
export const useCampaignStore = defineStore('campaign', {
  state: () => ({ save: fresh(), encounter: null as Encounter | null, initialized: false, busy: false, saveStatus: '', notice: '', hasSaveError: false }),
  getters: {
    readyDispatches: (state) => state.save.activities.dispatches.filter(d=>d.finishTurn<=state.save.activities.dispatchActions).length,
    activeContract: (state) => activities.contracts.find(q=>q.id===state.save.activities.contract?.id),
    pendingEvent: (state) => activities.events.find(e=>e.id===state.save.activities.event?.id),
    location: (state) => getLocation(state.save.exploration),
    mission: (state) => missions[state.save.chapter],
    rank: (state) => state.save.ended ? '地下首领' : state.save.reputation >= 80 ? '组织干部' : state.save.reputation >= 30 ? '行动队长' : '新人',
    level: (state) => 1 + Math.floor(state.save.reputation / 20),
    collection: (state) => Object.entries(state.save.captures).filter(([,n]) => n > 0).map(([id,count]) => ({ id:Number(id), count, available:availablePokemon(state.save,Number(id)) })),
  },
  actions: {
    async init() {
      if (this.initialized || this.busy) return;
      this.busy = true;
      try { const loaded = await readSave(); if (loaded) { this.save = loaded; this.encounter=loaded.activities.contact; this.notice = '已读取本地存档。'; } }
      catch { this.hasSaveError = true; this.notice = '无法读取存档，已保留原存档。可重试读取，或导出当前进度。'; }
      finally { this.busy = false; this.initialized = true; }
    },
    async persist() {
      this.save.activities.contact=this.encounter ? {...this.encounter} : null;
      if (this.hasSaveError) { this.saveStatus = '自动保存已暂停：请先重试读取或手动保存。'; return; }
      this.saveStatus = '保存中…';
      try { await writeSave(this.save); this.saveStatus = '已自动保存'; }
      catch { this.saveStatus = '保存失败，请导出进度作为备份。'; }
    },
    act(action: () => void) {
      if (!this.initialized || this.busy) return;
      try { action(); void this.persist(); } catch(e) { this.notice = e instanceof Error ? e.message : '操作失败'; }
    },
    selectLocation(regionId: string, siteId?: string) {
      this.act(() => {
        if (this.encounter || this.save.activities.event) throw new Error('请先捕获或放弃当前目标，再切换地点。');
        const region = regions.find(r => r.id === regionId);
        this.save.exploration = validateLocation({ regionId, siteId: siteId ?? region?.sites[0]?.id });
      });
    },
    explore(siteId?: string, special = false) {
      this.act(() => {
        if (this.encounter || this.save.activities.event) throw new Error('请先捕获或放弃当前目标。');
        const selected = siteId ? validateLocation({ regionId: this.save.exploration.regionId, siteId }) : this.save.exploration;
        let pool = explorationPool({ ...this.save, exploration: selected }, config.encounters, special);
        this.save.exploration = selected;
        pool=trackedPool(this.save,pool,special);
        const { region, site } = getLocation(selected);
        const location = special ? region.specialName : `${region.name}·${site.name}`;
        const encounter = { ...survey(this.save, config.rules, pool), location, regionId:region.id, siteId:site.id };
        if(createEvent(this.save,encounter,special)) {
          this.encounter=null;this.notice=record(this.save,`${location}：遇到「${this.pendingEvent?.title}」，请选择行动。`);
        } else {this.encounter=encounter;this.notice=record(this.save,`${location}：发现 ${encounter.name}。`);}
      });
    },
    catchPokemon() { this.act(() => { if (!this.encounter) throw new Error('先调查寻找宝可梦。'); const supported=supportedCapture(this.save,this.encounter);const success=capture(this.save,this.encounter,Math.random,config.rules.firstCaptureGuaranteed,supported);if(success){if(supported)this.save.activities.contractSupportUsed=true;contractCapture(this.save,this.encounter);} this.notice = this.save.log[0]!; this.encounter = null; }); },
    acceptCaptureContract(id:string) {this.act(()=>{acceptContract(this.save,id);this.notice=this.save.log[0]!;});},
    cancelContract() {this.act(()=>{this.save.activities.contract=null;this.notice=record(this.save,'捕获委托已取消，可重新接取，追踪进度将重置。');});},
    claimCaptureContract() {this.act(()=>{claimContract(this.save);this.notice=this.save.log[0]!;});},
    investigateContract() {
      if(!this.activeContract)return;
      this.selectLocation(this.activeContract.regionId,this.activeContract.siteId);
      if(!this.encounter&&!this.save.activities.event)this.explore(this.activeContract.siteId);
    },
    chooseEvent(choiceId:string) {this.act(()=>{this.encounter=resolveEvent(this.save,choiceId,config.rules);this.notice=this.save.log[0]!;});},
    abandonEncounter() {this.act(()=>{this.encounter=null;this.notice=record(this.save,'已放弃接触，可继续调查。');});},
    sendDispatch(jobId:string,id:number) {this.act(()=>{const pokemon=usePokedexStore().entries.find(p=>p.id===id);if(!pokemon)throw new Error('图鉴尚未就绪，请稍后重试。');startDispatch(this.save,jobId,pokemon);this.notice=this.save.log[0]!;});},
    collectDispatch(jobId:string,cancel=false) {this.act(()=>{finishDispatch(this.save,jobId,cancel);this.notice=this.save.log[0]!;});},
    researchPokemon(id:number) { this.act(() => { study(this.save,id,config.rules); this.notice=this.save.log[0]!; }); },
    tradePokemon(id:number) { this.act(() => { trade(this.save,id,config.rules); this.notice=this.save.log[0]!; }); },
    upgradeBuilding(id:string) { this.act(() => { const building=config.buildings.find(b=>b.id===id); if (!building) return; upgrade(this.save,building); this.notice=this.save.log[0]!; }); },
    finishMission() { this.act(() => { if (!this.mission) return; complete(this.save,this.mission,config.missions.length); this.notice=this.save.log[0]!; }); },
    work() {this.act(()=>{supplyWork(this.save,config.rules);this.notice=this.save.log[0]!;});},
    buyBalls() { this.act(() => { if(this.save.money<config.rules.ballPrice) throw new Error('金币不足，完成物资委托可获取金币。');this.save.money-=config.rules.ballPrice;this.save.balls++;this.notice=record(this.save,'购入一枚精灵球。'); }); },
    rest() { this.act(() => { this.save.wanted=Math.max(0,this.save.wanted-config.rules.restReduction);this.save.turns++;this.notice=record(this.save,'隐蔽休整，通缉降低。'); }); },
  },
});
