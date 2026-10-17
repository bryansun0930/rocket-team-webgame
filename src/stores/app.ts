import { defineStore } from 'pinia';

export const useAppStore = defineStore('app', {
  state: () => ({ ready: false }),
  actions: {
    setReady(ready: boolean) {
      this.ready = ready;
    },
  },
});
