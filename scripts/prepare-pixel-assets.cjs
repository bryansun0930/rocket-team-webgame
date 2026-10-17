// Run from project root: node scripts/prepare-pixel-assets.cjs /path/to/node_modules/sharp
const sharp = require(process.argv[2] || 'sharp');
const fs = require('node:fs/promises');
(async () => {
const source='ART/generated/player_source.png';
const {data,info}=await sharp(source).ensureAlpha().raw().toBuffer({resolveWithObject:true});
const boxes=[];
for(let row=0;row<4;row++)for(let col=0;col<3;col++){
let minX=info.width,minY=info.height,maxX=0,maxY=0;
for(let y=Math.round(row*info.height/4);y<Math.round((row+1)*info.height/4);y++)for(let x=Math.round(col*info.width/3);x<Math.round((col+1)*info.width/3);x++){
if(data[(y*info.width+x)*4+3]>100){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}}
boxes.push({left:minX,top:minY,width:maxX-minX+1,height:maxY-minY+1});}
const scale=28/Math.max(...boxes.map(b=>b.height));
const frames=await Promise.all(boxes.map(async(b,i)=>{const width=Math.max(1,Math.round(b.width*scale)),height=Math.max(1,Math.round(b.height*scale));return {input:await sharp(source).extract(b).resize(width,height,{kernel:'nearest'}).png().toBuffer(),left:(i%3)*32+Math.floor((32-width)/2),top:Math.floor(i/3)*32+31-height};}));
await sharp({create:{width:96,height:128,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(frames).png().toFile('public/assets/characters/player/player_sheet.png');
const tiles=await Promise.all([{left:0,top:0,width:627,height:576},{left:627,top:0,width:627,height:576},{left:0,top:576,width:627,height:678},{left:627,top:576,width:627,height:678}].map(async(b,i)=>({input:await sharp('ART/generated/tiles_source.png').extract(b).resize(16,16,{kernel:'nearest'}).png().toBuffer(),left:i*16,top:0})));
await sharp({create:{width:64,height:16,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(tiles).png().toFile('public/assets/tiles/rocket_base/tiles.png');
for(const path of ['src/data/maps.json','public/assets/maps/rocket_base.json']){const content=await fs.readFile(path,'utf8');await fs.writeFile(path,content.replaceAll('tiles.svg','tiles.png'));}
console.log('Prepared 12 aligned 32x32 character frames and four 16x16 tiles.');
})().catch(error=>{console.error(error);process.exitCode=1;});
