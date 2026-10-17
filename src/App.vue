<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import GameCanvas from './ui/GameCanvas.vue';
import Pokedex from './ui/Pokedex.vue';
import Operations from './ui/Operations.vue';
import SavePanel from './ui/SavePanel.vue';
import { useAppStore } from './stores/app';
import { useCampaignStore } from './stores/campaign';
import { usePokedexStore } from './stores/pokedex';
import { getGuidance } from './systems/guidance';
import config from './data/campaign.json';
const app=useAppStore(),campaign=useCampaignStore(),dex=usePokedexStore();
const page=ref('map'),area=ref<'base'|'field'>('base');
const sheet=ref<HTMLElement|null>(null);
const guide=computed(()=>getGuidance(campaign.save,campaign.mission,campaign.encounter,{...config.rules,buildings:config.buildings,eventTitle:campaign.pendingEvent?.title,locationName:`${campaign.location.region.name}·${campaign.location.site.name}`}));
const titles:Record<string,string>={missions:'行动任务',explore:'外围行动',collection:'队伍与研究',base:'基地建设',market:'补给处',pokedex:'宝可梦图鉴',save:'行动档案',menu:'指挥终端'};
const dock=[{id:'map',label:'世界',icon:'⌂'},{id:'explore',label:'行动',icon:'◇'},{id:'collection',label:'队伍',icon:'◉'},{id:'base',label:'建设',icon:'▣'},{id:'menu',label:'更多',icon:'☰'}];
const menu=[{id:'missions',label:'主线任务',detail:'查看目标与章节奖励',icon:'⚑'},{id:'market',label:'物资补给',detail:'精灵球 · 免费委托',icon:'◇'},{id:'pokedex',label:'宝可梦图鉴',detail:'档案与属性检索',icon:'▤'},{id:'save',label:'存档与设置',detail:'备份 · 读取 · 新游戏',icon:'▣'}];
const portraitStyle={backgroundImage:`url(${import.meta.env.BASE_URL}assets/characters/player/player_sheet.png)`};
let toastTimer:ReturnType<typeof setTimeout>|undefined;
let opener:HTMLElement|null=null;
function openPanel(panel:string) { opener=document.activeElement as HTMLElement|null;page.value=panel; }
function closePanel() { page.value='map';void nextTick(()=>opener?.focus()); }
function interact(panel:string) {
 if(panel==='field'||panel==='return'){area.value=panel==='field'?'field':'base';closePanel();}
 else openPanel(panel);
}
function goNext() {
 const {ready,panel}=guide.value;
 if(ready){campaign.finishMission();return;}
 if(panel==='explore') {
  area.value='field';
  if(!campaign.encounter&&!campaign.pendingEvent)campaign.explore();
 }
 openPanel(panel);
}
function nextFromSheet(){if(guide.value.ready){campaign.finishMission();closePanel();}else goNext();}
function keydown(event:KeyboardEvent) {
 if(page.value==='map')return;
 if(event.key==='Escape'){event.preventDefault();closePanel();return;}
 if(event.key==='Tab') {
  const nodes=sheet.value?.querySelectorAll<HTMLElement>('button:not([disabled]),input,select,summary,[tabindex="0"]');
  if(!nodes?.length)return;
  const first=nodes[0]!,last=nodes[nodes.length-1]!;
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
 }
}
watch(page,async value=>{if(value!=='map'){await nextTick();sheet.value?.focus();}});
watch(()=>campaign.notice,notice=>{
 if(toastTimer)clearTimeout(toastTimer);
 if(notice&&!campaign.hasSaveError)toastTimer=setTimeout(()=>{campaign.notice='';},5000);
});
onMounted(async()=>{window.addEventListener('keydown',keydown);await campaign.init();void dex.load();});
onBeforeUnmount(()=>{window.removeEventListener('keydown',keydown);if(toastTimer)clearTimeout(toastTimer);});
</script>
<template>
 <main class="game-shell" aria-label="火箭队：地下行动">
  <div v-if="!campaign.initialized" class="boot-screen"><span class="boot-emblem">R</span><h1>地下行动</h1><p role="status">正在连接行动档案…</p></div>
  <template v-else>
   <div class="world-layer" :inert="page!=='map'||undefined">
    <GameCanvas :active="page==='map'" :area="area" @interact="interact" />
    <div class="world-vignette" />
    <header class="hud-header">
     <div class="hud-identity"><span class="team-emblem">R</span><div><strong>地下行动</strong><small>{{ campaign.rank }} · Lv.{{ campaign.level }}</small></div></div>
     <div class="hud-wallet" aria-label="金币"><span>◆</span><strong>{{ campaign.save.money }}</strong><small>金币</small></div>
     <button class="terminal-button" aria-label="打开指挥终端" @click="openPanel('menu')">☰</button>
    </header>
    <div class="hud-resources" aria-label="行动资源"><span>材料 <b>{{ campaign.save.materials }}</b></span><span>研究 <b>{{ campaign.save.research }}</b></span><span>精灵球 <b>{{ campaign.save.balls }}</b></span><span :class="{danger:campaign.save.wanted>=70}">通缉 <b>{{ campaign.save.wanted }}</b></span></div>
    <button class="quest-tracker" aria-label="查看当前任务" @click="openPanel('missions')">
     <span class="quest-chapter">{{ campaign.save.ended ? '通关' : `第 ${campaign.save.chapter+1} 章` }}</span><strong>{{ campaign.mission?.title??'地下王者' }}</strong><span class="quest-count">{{ guide.progress }}/{{ guide.target }} ›</span>
     <span class="quest-meter"><span :style="{width:`${guide.progress/guide.target*100}%`}" /></span>
    </button>
    <div class="world-location"><span>● {{ area==='base'?'秘密基地':`${campaign.location.region.name}·${campaign.location.site.name}` }}</span><button @click="interact(area==='base'?'field':'return')">{{ area==='base'?'前往外围 ↗':'返回基地 ↙' }}</button></div>
    <p v-if="!app.ready" class="map-loading" role="status">地图加载中…</p>
    <section class="guide-card" aria-label="下一步行动指引">
     <div class="guide-copy"><div class="guide-portrait" :style="portraitStyle" aria-hidden="true"/><div><p class="guide-kicker">{{ guide.ready?'行动完成 · 可领取奖励':'干部指引 · 下一步' }}</p><h2>{{ guide.title }}</h2></div></div>
     <p class="guide-detail">{{ guide.detail }}</p>
     <button class="primary-action" @click="goNext">{{ guide.label }} <span>→</span></button>
    </section>
    <p class="tap-instruction">点地面自动走路 · 点成员直接交互</p>
    <nav class="game-dock" aria-label="游戏菜单"><button v-for="item in dock" :key="item.id" :aria-label="item.label" :aria-pressed="page===item.id" @click="item.id==='map'?closePanel():openPanel(item.id)"><span class="dock-icon">{{ item.icon }}</span><span>{{ item.label }}{{ item.id==='collection'&&campaign.readyDispatches?` · ${campaign.readyDispatches}可领取`:'' }}</span></button></nav>
   </div>
   <Transition name="toast"><div v-if="campaign.notice&&page==='map'" class="game-toast" role="status"><span>{{ campaign.notice }}</span><button aria-label="关闭提示" @click="campaign.notice=''">×</button></div></Transition>
   <div v-if="page!=='map'" class="sheet-backdrop" @click.self="closePanel">
    <section ref="sheet" class="game-sheet" role="dialog" aria-modal="true" :aria-label="titles[page]" tabindex="-1">
     <header class="sheet-header"><div><p>ROCKET TERMINAL</p><h2>{{ titles[page] }}</h2></div><button aria-label="返回地图" @click="closePanel">✕</button></header>
     <div class="sheet-body">
      <div v-if="campaign.notice" class="sheet-message" role="status">{{ campaign.notice }}</div>
      <Pokedex v-if="page==='pokedex'" />
      <SavePanel v-else-if="page==='save'" />
      <template v-else-if="page==='menu'">
       <p class="terminal-intro">{{ campaign.rank }}，请选择行动。</p>
       <div class="terminal-grid"><button v-for="item in menu" :key="item.id" @click="openPanel(item.id)"><span class="terminal-icon">{{ item.icon }}</span><strong>{{ item.label }}</strong><small>{{ item.detail }}</small></button></div>
       <div class="terminal-stats"><span>声望 <b>{{ campaign.save.reputation }}</b></span><span>已研究 <b>{{ campaign.save.studied.length }} 种</b></span><span>行动 <b>{{ campaign.save.turns }} 次</b></span></div>
       <p class="save-caption">{{ campaign.saveStatus||'本地自动保存 · 刷新后可继续游戏' }}</p>
      </template>
      <Operations v-else :panel="page" />
     </div>
     <button v-if="page!=='menu'&&(guide.ready||guide.panel!==page)" class="sheet-next" @click="nextFromSheet">{{ guide.ready?'领取奖励，进入下一章':`继续主线：${guide.label}` }} →</button>
    </section>
   </div>
  </template>
 </main>
</template>
