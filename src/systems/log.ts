import type { Campaign } from '../types/campaign';
export function record(state: Campaign, message: string): string {
  state.log.unshift(message);
  state.log = state.log.slice(0, 40);
  return message;
}
