<script setup lang="ts">
import { ref } from 'vue';
import { useCampaignStore } from '../stores/campaign';
import { validateSave } from '../systems/campaign';
import { writeSave } from '../systems/save';
import config from '../data/campaign.json';
const campaign=useCampaignStore();
const confirmReset=ref(false);
const error=ref('');
const input=ref<HTMLInputElement|null>(null);
function exportSave() {
  const url=URL.createObjectURL(new Blob([JSON.stringify(campaign.save,null,2)],{type:'application/json'}));
  const link=document.createElement('a');link.href=url;link.download='rocket-team-save.json';link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
async function importSave(event:Event) {
  if(campaign.busy) return;
  const file=(event.target as HTMLInputElement).files?.[0];if(!file) return;
  campaign.busy=true;
  error.value='';
  try { if(file.size>1000000) throw new Error('文件过大'); const parsed=validateSave(JSON.parse(await file.text()));await writeSave(parsed);campaign.save=parsed;campaign.encounter=parsed.activities.contact;campaign.hasSaveError=false;campaign.notice='存档已导入。'; }
  catch { error.value='导入失败：请使用本游戏导出的有效存档。现有进度未更改。'; }
  finally { (event.target as HTMLInputElement).value='';campaign.busy=false; }
}
async function reset() {
  if(campaign.busy) return;
  campaign.busy=true;
  try { const fresh=JSON.parse(JSON.stringify(config.initial));await writeSave(fresh);campaign.save=fresh;campaign.encounter=null;campaign.hasSaveError=false;confirmReset.value=false;campaign.notice='新行动已开始。'; }
  catch { error.value='无法保存新进度，原进度保持不变。'; }
  finally { campaign.busy=false; }
}
async function retry() { if(campaign.busy) return;campaign.initialized=false;campaign.hasSaveError=false;await campaign.init(); }
async function saveNow() { if(campaign.busy)return;campaign.busy=true;try { await writeSave(campaign.save);campaign.hasSaveError=false;campaign.saveStatus='已手动保存'; } catch { error.value='保存失败，请导出备份。'; } finally {campaign.busy=false;} }
</script>
<template><section class="operations"><p class="eyebrow">ARCHIVE</p><h2>存档与行动记录</h2>
<p>进度保存在当前浏览器的 IndexedDB 中，操作后自动保存。更换浏览器前请导出备份。</p>
<div class="action-stack"><button @click="saveNow">手动保存当前进度</button><button @click="retry">重新读取本地存档</button><button @click="exportSave">导出存档 JSON</button><label>导入存档（将替换当前进度）<input ref="input" type="file" accept="application/json,.json" @change="importSave" /></label></div>
<p v-if="error" role="alert">{{ error }}</p>
<button v-if="!confirmReset" class="secondary" @click="confirmReset=true">开始新游戏…</button><div v-else class="reset-confirm"><p>重新开始会覆盖本地进度，请先导出备份。</p><button @click="reset">确认重新开始</button><button @click="confirmReset=false">取消</button></div>
<h3>最近记录</h3><ol class="activity-log"><li v-for="(line,index) in campaign.save.log" :key="index">{{ line }}</li></ol></section></template>
