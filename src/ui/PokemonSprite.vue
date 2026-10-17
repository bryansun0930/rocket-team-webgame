<script setup lang="ts">
import {computed,ref,watch} from 'vue';
const props=withDefaults(defineProps<{id:number;name:string;large?:boolean;lazy?:boolean}>(),{large:false,lazy:true});
const failed=ref(false);
const source=computed(()=>`${import.meta.env.BASE_URL}assets/pokemon/sprites/${String(props.id).padStart(3,'0')}.png`);
watch(source,()=>{failed.value=false;});
</script>
<template>
 <span :class="['pokemon-visual',{'pokemon-visual-large':large}]">
  <img v-if="!failed" :src="source" :alt="`${name}像素精灵图`" width="64" height="64" :loading="lazy?'lazy':'eager'" decoding="async" @error="failed=true" />
  <span v-else class="sprite-fallback" role="img" :aria-label="`${name}图片暂不可用`">?<small>图片暂不可用</small></span>
 </span>
</template>
