import Phaser from 'phaser';
import playerAsset from '../../data/player.json';
import { movement } from '../../systems/input';

export class Player extends Phaser.Physics.Arcade.Sprite {
  private facing: keyof typeof playerAsset.directions = 'down';
  private route: {x:number;y:number}[] = [];
  private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private readonly wasd: Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>;

  constructor(scene: Phaser.Scene, x: number, y: number, private readonly speed: number) {
    super(scene, x, y, playerAsset.texture, playerAsset.directions.down);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 1);
    this.setSize(12, 8).setOffset(10, 23);
    this.setCollideWorldBounds(true);
    for (const [direction, start] of Object.entries(playerAsset.directions)) {
      const key = `player_walk_${direction}`;
      if (!scene.anims.exists(key)) scene.anims.create({
        key,
        frames: [start, start + 1, start, start + 2].map((frame) => ({ key: playerAsset.texture, frame })),
        frameRate: playerAsset.frameRate,
        repeat: -1,
      });
    }
    const keyboard = scene.input.keyboard!;
    this.cursors = keyboard.createCursorKeys();
    this.wasd = keyboard.addKeys('W,A,S,D') as typeof this.wasd;
  }

  navigate(route:{x:number;y:number}[]):void { this.route=route; }
  stopNavigation():void { this.route=[];this.setVelocity(0,0); }

  update(delta=16): void {
    let { x, y } = movement({
      right: this.cursors.right.isDown || this.wasd.D.isDown,
      left: this.cursors.left.isDown || this.wasd.A.isDown,
      down: this.cursors.down.isDown || this.wasd.S.isDown,
      up: this.cursors.up.isDown || this.wasd.W.isDown,
    }, this.scene.registry.get('touchInput'));
    if(x||y) this.route=[];
    else if(this.route.length) {
      const target=this.route[0]!;
      const dx=target.x-this.x,dy=target.y-this.y,distance=Math.hypot(dx,dy);
      if(distance<=Math.max(2,this.speed*Math.min(delta,50)/1000)) this.route.shift();
      else { x=dx/distance;y=dy/distance; }
    }
    this.setVelocity(x * this.speed, y * this.speed);
    if (x || y) {
      this.facing = x < 0 ? 'left' : x > 0 ? 'right' : y < 0 ? 'up' : 'down';
      this.play(`player_walk_${this.facing}`, true);
    } else {
      this.anims.stop();
      this.setFrame(playerAsset.directions[this.facing]);
    }
    this.setDepth(this.y);
  }
}
