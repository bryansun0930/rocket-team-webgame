export interface Cell { x:number; y:number; }
/** Four-neighbour BFS: never crosses walls or cuts diagonally through corners. */
export function findPath(walkable: boolean[][], start: Cell, goal: Cell): Cell[] | null {
  const height=walkable.length, width=walkable[0]?.length ?? 0;
  const inside=(p:Cell)=>p.x>=0&&p.y>=0&&p.x<width&&p.y<height;
  if(!inside(start)||!inside(goal)||!walkable[goal.y]?.[goal.x]) return null;
  const key=(p:Cell)=>`${p.x},${p.y}`;
  const queue=[start];const parents=new Map<string,Cell|null>([[key(start),null]]);
  for(let index=0;index<queue.length;index++) {
    const current=queue[index]!;
    if(current.x===goal.x&&current.y===goal.y) {
      const path:Cell[]=[];let point:Cell|null=current;
      while(point && key(point)!==key(start)){path.push(point);point=parents.get(key(point))??null;}
      return path.reverse();
    }
    for(const [dx,dy] of [[0,-1],[1,0],[0,1],[-1,0]]) {
      const next={x:current.x+dx!,y:current.y+dy!};
      if(inside(next)&&walkable[next.y]?.[next.x]&&!parents.has(key(next))) {parents.set(key(next),current);queue.push(next);}
    }
  }
  return null;
}
