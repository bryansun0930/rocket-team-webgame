<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type Phaser from 'phaser';
import type { BootScene } from '../game/scenes/BootScene';
import { createGame } from '../game/createGame';
import { useAppStore } from '../stores/app';
import { emptyDirections } from '../systems/input';
const props=defineProps<{active:boolean;area:'base'|'field'}>();
const emit=defineEmits<{interact:[panel:string]}>();
const container=ref<HTMLDivElement|null>(null);
const app=useAppStore();let game:Phaser.Game|undefined;
let layoutObserver:ResizeObserver|undefined;
let layoutFrame=0;
function fitWorld() {
 const canvas=container.value,shell=canvas?.closest('.game-shell');
 const location=shell?.querySelector('.world-location'),guide=shell?.querySelector('.guide-card');
 if(!canvas||!shell||!location||!guide)return;
 const bounds=shell.getBoundingClientRect();
 const top=Math.max(0,location.getBoundingClientRect().bottom-bounds.top+8);
 const bottom=Math.max(0,bounds.bottom-guide.getBoundingClientRect().top+8);
 canvas.style.top=`${top}px`;canvas.style.bottom=`${bottom}px`;
}
function queueLayout() {cancelAnimationFrame(layoutFrame);layoutFrame=requestAnimationFrame(fitWorld);}
function stop() {
  game?.registry.set('touchInput',emptyDirections());
  (game?.scene.getScene('boot') as BootScene|undefined)?.stopMovement();
}
function syncActive() {
  stop();const scene=game?.scene.getScene('boot');
  if(props.active)game?.scene.resume('boot');
  if(scene?.input.keyboard){scene.input.keyboard.resetKeys();scene.input.keyboard.enabled=props.active;}
  if(!props.active)game?.scene.pause('boot');
}
function visibility(){if(document.hidden)stop();}
watch(()=>props.active,syncActive);
watch(()=>props.area,area=>{stop();game?.scene.getScene('boot')?.scene.restart({area});});
onMounted(()=>{
 window.addEventListener('blur',stop);document.addEventListener('visibilitychange',visibility);
 const shell=container.value?.closest('.game-shell');
 layoutObserver=new ResizeObserver(queueLayout);
 for(const node of [shell,shell?.querySelector('.world-location'),shell?.querySelector('.guide-card')])if(node)layoutObserver.observe(node);
 fitWorld();queueLayout();
 if(container.value)game=createGame(container.value,()=>{app.setReady(true);syncActive();},panel=>emit('interact',panel));
});
onBeforeUnmount(()=>{layoutObserver?.disconnect();cancelAnimationFrame(layoutFrame);window.removeEventListener('blur',stop);document.removeEventListener('visibilitychange',visibility);game?.destroy(true);game=undefined;app.setReady(false);});
</script>
<template><div ref="container" class="game-canvas" aria-label="游戏地图，点按地面移动，点按成员交互" /></template>
