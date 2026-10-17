import Phaser from 'phaser';
import maps from '../../data/maps.json';
import { Player } from '../entities/Player';
import playerAsset from '../../data/player.json';
import interactions from '../../data/interactions.json';
import { emptyDirections } from '../../systems/input';
import { findPath } from '../../systems/pathfinding';

export class BootScene extends Phaser.Scene {
  private player?: Player;
  private area: 'base' | 'field' = 'base';
  private interactKey?: Phaser.Input.Keyboard.Key;
  private markers: typeof interactions.base = [];
  private hint?: Phaser.GameObjects.Text;
  private walkable:boolean[][]=[];
  constructor(private readonly onReady: () => void, private readonly onInteract: (panel:string) => void = () => {}) {
    super('boot');
  }

  preload(): void {
    const base = import.meta.env.BASE_URL;
    this.load.tilemapTiledJSON(maps.initial.key, base + maps.initial.url);
    this.load.tilemapTiledJSON(maps.field.key, base + maps.field.url);
    this.load.image('base-tiles', base + maps.initial.tilesetUrl);
    this.load.spritesheet(playerAsset.texture, base + playerAsset.url, {
      frameWidth: playerAsset.frameWidth,
      frameHeight: playerAsset.frameHeight,
    });
  }

  create(data: { area?: 'base' | 'field' } = {}): void {
    this.area = data.area ?? 'base';
    const config = this.area === 'base' ? maps.initial : maps.field;
    const map = this.make.tilemap({ key: config.key });
    const tileset = map.addTilesetImage(config.tilesetName, 'base-tiles');
    if (!tileset) throw new Error('Missing map tileset');
    const layers = config.layers.map((name) => {
      const layer = map.createLayer(name, tileset);
      if (!layer) throw new Error(`Missing map layer: ${name}`);
      layer.setCollisionByProperty({ collides: true });
      return layer;
    });
    const spawn = map.getObjectLayer(config.spawnLayer)?.objects.find(
      (object) => object.name === config.spawnName,
    );
    if (spawn?.x === undefined || spawn.y === undefined) throw new Error('Missing player spawn');
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.player = new Player(this, spawn.x, spawn.y, config.playerSpeed);
    layers.forEach((layer) => this.physics.add.collider(this.player!, layer));
    this.markers = interactions[this.area];
    this.walkable=Array.from({length:map.height},(_,y)=>Array.from({length:map.width},(_,x)=>!layers.some(layer=>layer.getTileAt(x,y)?.collides)));
    this.markers.forEach(marker => {
      const npc=this.physics.add.staticSprite(marker.x,marker.y,playerAsset.texture,marker.frame).setOrigin(.5,1).setTint(marker.tint).setDepth(marker.y);
      npc.refreshBody();
      (npc.body as Phaser.Physics.Arcade.StaticBody).setSize(12,8).setOffset(10,23);
      this.physics.add.collider(this.player!,npc);
      const label=this.add.text(marker.x,marker.y-34,marker.name,{fontSize:'8px',fontFamily:'sans-serif',color:'#f0bf72',backgroundColor:'#16121d',padding:{x:3,y:2}}).setOrigin(.5).setDepth(1000);
      const open=(_pointer:Phaser.Input.Pointer,_x:number,_y:number,event:Phaser.Types.Input.EventData)=>{
        event.stopPropagation();this.player?.stopNavigation();this.onInteract(marker.panel);
      };
      npc.setInteractive(new Phaser.Geom.Rectangle(-14,-14,60,60),Phaser.Geom.Rectangle.Contains).on('pointerdown',open);
      label.setInteractive().on('pointerdown',open);
      const row=this.walkable[Math.floor(marker.y/16)];if(row)row[Math.floor(marker.x/16)]=false;
    });
    this.interactKey=this.input.keyboard!.addKey('E');
    this.hint=this.add.text(this.scale.width/2,this.scale.height/2-this.scale.height/(2*config.zoom)+8,'',{fontSize:'8px',fontFamily:'sans-serif',color:'#ffffff',backgroundColor:'#211725',padding:{x:4,y:3}}).setOrigin(.5,0).setScrollFactor(0).setDepth(2000);
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.setZoom(config.zoom).startFollow(this.player, true);
    const resize=()=>this.cameras.main.setZoom(Math.max(.75,Math.min(2,this.scale.width/208,this.scale.height/192)));
    resize();this.scale.on(Phaser.Scale.Events.RESIZE,resize);
    this.cameras.main.roundPixels = true;
    const onBlur = () => {
      this.input.keyboard?.resetKeys();
      this.registry.set('touchInput', emptyDirections());
      this.player?.setVelocity(0, 0);
      this.player?.stopNavigation();
    };
    const onTap=(pointer:Phaser.Input.Pointer,objects:Phaser.GameObjects.GameObject[])=>{
      if(objects.length||!this.player)return;
      const point=this.cameras.main.getWorldPoint(pointer.x,pointer.y);
      const goal={x:Math.floor(point.x/16),y:Math.floor(point.y/16)};
      const path=findPath(this.walkable,{x:Math.floor(this.player.x/16),y:Math.floor((this.player.y-4)/16)},goal);
      if(!path)return;
      this.player.navigate(path.map(cell=>({x:cell.x*16+8,y:cell.y*16+12})));
      const ring=this.add.circle(goal.x*16+8,goal.y*16+8,6,0xf0bf72,.3).setStrokeStyle(1,0xf0bf72).setDepth(999);
      this.tweens.add({targets:ring,alpha:0,scale:1.8,duration:650,onComplete:()=>ring.destroy()});
    };
    this.input.on('pointerdown',onTap);
    this.game.events.on(Phaser.Core.Events.BLUR, onBlur);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off(Phaser.Core.Events.BLUR, onBlur);
      this.scale.off(Phaser.Scale.Events.RESIZE,resize);
      this.input.off('pointerdown',onTap);
      this.player = undefined;
    });
    this.onReady();
  }

  update(_time:number,delta:number): void {
    this.player?.update(delta);
    if (!this.player) return;
    const nearest=this.markers.find(marker => Phaser.Math.Distance.Between(this.player!.x,this.player!.y,marker.x,marker.y)<32);
    this.hint?.setText(nearest ? `点按成员即可交互` : '').setVisible(false);
    if(this.interactKey && Phaser.Input.Keyboard.JustDown(this.interactKey)) this.interact();
  }

  interact(): void {
    if (!this.sys.isActive() || !this.player) return;
    const nearest=this.markers.find(marker => Phaser.Math.Distance.Between(this.player!.x,this.player!.y,marker.x,marker.y)<32);
    if(nearest) this.onInteract(nearest.panel);
  }

  stopMovement():void {this.player?.stopNavigation();}
}
