export type Direction = 'up' | 'down' | 'left' | 'right';
export type DirectionState = Record<Direction, boolean>;
export const emptyDirections = (): DirectionState => ({ up: false, down: false, left: false, right: false });

// Pointer IDs ensure lifting one finger cannot release another held direction.
export class PointerDirections {
  private readonly pointers = new Map<number, Direction>();
  press(pointer: number, direction: Direction): void { this.pointers.set(pointer, direction); }
  release(pointer: number): void { this.pointers.delete(pointer); }
  clear(): void { this.pointers.clear(); }
  snapshot(): DirectionState {
    const state = emptyDirections();
    for (const direction of this.pointers.values()) state[direction] = true;
    return state;
  }
}

export function movement(keyboard: DirectionState, touch: DirectionState = emptyDirections()): { x:number; y:number } {
  const x = Number(keyboard.right || touch.right) - Number(keyboard.left || touch.left);
  const y = Number(keyboard.down || touch.down) - Number(keyboard.up || touch.up);
  const length = Math.hypot(x, y) || 1;
  return { x: x / length, y: y / length };
}
