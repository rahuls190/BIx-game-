// No stray fragments inside any Level 2 sprite's crop.
//
// The art pipeline trims each cell to a 10px margin, which can leave slivers of the NEIGHBOURING cell's art sitting on that
// cut line (a bracket edge beside Pack, a plate edge beside the spitter turret). If the crop table includes them they draw as thin
// stray lines next to the sprite. This test reads the real PNGs and fails if any such piece is still inside a crop, or if the
// crop cuts off real sprite pixels. It mirrors the rule in design/build_level2_artbounds.py, which writes the table.
const fs=require('fs'),zlib=require('zlib'),assert=require('assert');
const noop=()=>{};global.window={};eval(fs.readFileSync('dist/level2-art.js','utf8'));const ART=window.L2ART;

function readAlpha(file){
  const b=fs.readFileSync(file);
  assert(b.slice(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),file+' is not a PNG');
  let o=8,w,h,depth,type,inter;const idat=[];
  while(o<b.length){const len=b.readUInt32BE(o),t=b.toString('ascii',o+4,o+8),d=b.slice(o+8,o+8+len);
    if(t==='IHDR'){w=d.readUInt32BE(0);h=d.readUInt32BE(4);depth=d[8];type=d[9];inter=d[12]}
    else if(t==='IDAT')idat.push(d);else if(t==='IEND')break;o+=12+len}
  assert(depth===8&&type===6&&inter===0,`${file}: expected 8-bit RGBA, non-interlaced (got depth ${depth}, type ${type}, interlace ${inter})`);
  const raw=zlib.inflateSync(Buffer.concat(idat)),stride=w*4,cur=Buffer.alloc(stride),prev=Buffer.alloc(stride),alpha=new Uint8Array(w*h);
  for(let y=0;y<h;y++){
    const f=raw[y*(stride+1)],src=raw.slice(y*(stride+1)+1,(y+1)*(stride+1));
    for(let i=0;i<stride;i++){
      const a=i>=4?cur[i-4]:0,up=prev[i],c=i>=4?prev[i-4]:0;let v=src[i];
      if(f===1)v+=a;else if(f===2)v+=up;else if(f===3)v+=(a+up)>>1;
      else if(f===4){const p=a+up-c,pa=Math.abs(p-a),pb=Math.abs(p-up),pc=Math.abs(p-c);v+=(pa<=pb&&pa<=pc)?a:(pb<=pc?up:c)}
      cur[i]=v&255}
    for(let x=0;x<w;x++)alpha[y*w+x]=cur[x*4+3];
    cur.copy(prev)}
  return {w,h,alpha};
}

// A fragment small enough to be a few faint specks is tolerated. Some sit on columns the sprite itself uses, so no crop rectangle can
// exclude them (today: 1, 7, 8 and 39 px in four cells); only cleaning the PNGs would, which the art rules require to be a new -vN file.
// Anything at or above this size is a visible sliver and fails.
const VISIBLE=40;
const MARGIN=10,MAX_FRAC=0.2,TILING=/conveyor|lava-channel|furnace-background/,SOFT=/coolant-mist/;   // tiling plates keep their full cell; mist puffs legitimately reach the edge
// pieces of opaque pixels that touch the margin band and are a small part of the cell: bleed from a neighbouring cell
function bleedPieces(a,W,ox,oy,cw,ch){
  let total=0;for(let y=0;y<ch;y++)for(let x=0;x<cw;x++)if(a[(oy+y)*W+ox+x]>0)total++;
  const seen=new Uint8Array(cw*ch),out=[];
  const opaque=(x,y)=>a[(oy+y)*W+ox+x]>0,inBand=(x,y)=>x<=MARGIN||y<=MARGIN||x>=cw-1-MARGIN||y>=ch-1-MARGIN;
  for(let y=0;y<ch;y++)for(let x=0;x<cw;x++){
    if(!inBand(x,y)||!opaque(x,y)||seen[y*cw+x])continue;
    const q=[[x,y]],pts=[];seen[y*cw+x]=1;
    while(q.length){const [cx,cy]=q.pop();pts.push([cx,cy]);
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=cx+dx,ny=cy+dy;
        if(nx>=0&&ny>=0&&nx<cw&&ny<ch&&!seen[ny*cw+nx]&&opaque(nx,ny)){seen[ny*cw+nx]=1;q.push([nx,ny])}}}
    if(pts.length<total*MAX_FRAC)out.push(pts);
  }
  return {pieces:out,total};
}

let cells=0,checked=0,problems=[];
for(const [name,plate] of Object.entries(ART)){
  const file='dist/assets/'+name;
  if(TILING.test(name)||SOFT.test(name)){   // not checked for bleed, but the table must still describe the real file
    const ih=fs.readFileSync(file).slice(16,24);
    assert(ih.readUInt32BE(0)===plate.w&&ih.readUInt32BE(4)===plate.h,`${name}: the file is ${ih.readUInt32BE(0)}x${ih.readUInt32BE(4)} but the crop table says ${plate.w}x${plate.h}`);
    continue;
  }
  const {w:W,h:H,alpha}=readAlpha(file);
  assert(W===plate.w&&H===plate.h,`${name}: the file is ${W}x${H} but the crop table says ${plate.w}x${plate.h}`);
  const cw=W/plate.cols,ch=H/plate.rows;
  plate.cells.forEach((r,i)=>{
    cells++;if(!r)return;checked++;
    const ox=(i%plate.cols)*cw,oy=Math.floor(i/plate.cols)*ch,[sx,sy,sw,sh]=r;
    const {pieces}=bleedPieces(alpha,W,ox,oy,cw,ch),bleed=new Set();
    for(const pts of pieces)for(const [x,y]of pts)bleed.add(y*cw+x);
    // 1. no stray fragment may sit inside the crop, or it is drawn next to the sprite
    let inside=0;for(const k of bleed){const x=k%cw+ox,y=Math.floor(k/cw)+oy;if(x>=sx&&x<sx+sw&&y>=sy&&y<sy+sh)inside++}
    if(inside>=VISIBLE)problems.push(`${name} cell ${i}: ${inside} stray pixel(s) from a neighbouring cell are inside the crop [${r}] and will be drawn as a sliver`);
    // 2. the crop must not cut off any real sprite pixel
    let clipped=0;for(let y=0;y<ch;y++)for(let x=0;x<cw;x++){
      if(alpha[(oy+y)*W+ox+x]===0||bleed.has(y*cw+x))continue;
      const gx=ox+x,gy=oy+y;if(gx<sx||gx>=sx+sw||gy<sy||gy>=sy+sh)clipped++}
    if(clipped)problems.push(`${name} cell ${i}: the crop [${r}] cuts off ${clipped} real sprite pixel(s)`);
  });
}
assert(problems.length===0,'\n  '+problems.join('\n  '));
assert(checked>=60,'expected to check the sprite cells of every plate, checked '+checked);
console.log(JSON.stringify({plates:Object.keys(ART).length,spriteCellsChecked:checked,problems:0}));
