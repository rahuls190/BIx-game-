// The landing page (dist/index.html) must not ship with a dead link, a missing image or a missing
// stylesheet, and the buttons must lead to the real games. Run from the repo root.
const fs=require('fs'),path=require('path'),assert=require('assert');
const DIST='dist';let checks=0;const ok=(c,m)=>{assert(c,m);checks++};
const read=f=>fs.readFileSync(path.join(DIST,f),'utf8');
const html=read('index.html');

// --- basics ---
ok(/<html[^>]*\blang="[a-z-]+"/i.test(html),'the page has no lang attribute');
ok(/<title>[^<]{10,}<\/title>/.test(html),'the page has no real <title>');
ok(/<meta name="description" content="[^"]{40,}"/.test(html),'the page has no meta description');
const vp=html.match(/<meta name="viewport" content="([^"]*)"/);
ok(vp,'the page has no viewport meta');
ok(!/user-scalable\s*=\s*no|maximum-scale\s*=\s*1(\.0)?\b/.test(vp[1]),'the page blocks pinch-zoom (unlike the game screens, a page people read must allow it)');
ok(!/\{\{|\}\}/.test(html),'template placeholders were left in the page');

// --- every local reference resolves to a file ---
const refs=[...html.matchAll(/\b(?:href|src)="([^"#]+)(?:#[^"]*)?"/g)].map(m=>m[1]).filter(u=>!/^(https?:|data:|mailto:|\/\/)/.test(u));
ok(refs.length>=8,'suspiciously few local references: '+refs.length);
for(const u of refs){
  const clean=u.split('?')[0].replace(/^\.\//,'');
  ok(fs.existsSync(path.join(DIST,clean)),`index.html points at ${u}, which does not exist in dist/`);
}

// --- images: an alt attribute on all, and a description on every one that is not decorative ---
const imgs=[...html.matchAll(/<img\b[^>]*>/g)].map(m=>m[0]);
ok(imgs.length>=5,'expected the hero, Bix and all three level images');
for(const tag of imgs){
  const alt=tag.match(/\balt="([^"]*)"/);
  ok(alt,'an <img> has no alt attribute: '+tag.slice(0,90));
  if(!/aria-hidden="true"/.test(tag))ok(alt[1].length>=15,'a content image has no real description: '+tag.slice(0,90));
}

// --- the buttons lead to the games ---
const hrefs=[...html.matchAll(/href="\.\/(level[123]\.html)"/g)].map(m=>m[1]);
ok(hrefs.includes('level1.html')&&hrefs.includes('level2.html')&&hrefs.includes('level3.html'),'the page does not link to all three levels');
ok(/<canvas id="game"/.test(read('level1.html'))&&/game\.js/.test(read('level1.html')),'level1.html is not the Level 1 game');
ok(/<canvas id="game"/.test(read('level2.html'))&&/level2\.js/.test(read('level2.html')),'level2.html is not the Level 2 game');
ok(/<canvas id="game"/.test(read('level3.html'))&&/level3\.js/.test(read('level3.html')),'level3.html is not the Level 3 game');
ok(/href="\.\/level2\.html"/.test(read('level1.html')),'Level 1 no longer offers the way down to Level 2');

// --- the stylesheet ---
const css=read('landing.css');
ok(/@media \(min-width:1000px\)/.test(css),'the desktop layout is missing from landing.css');
ok(!/\{\{/.test(css),'placeholders left in landing.css');
for(const v of ['--ink','--accent','--mint','--orange'])ok(css.includes(v+':'),'landing.css lost the '+v+' colour');

// --- the repo-root safety net: if Pages ever publishes the root, it must forward to the real page ---
const root=fs.readFileSync('index.html','utf8');
ok(/http-equiv="refresh"[^>]*url=\.\/dist\//.test(root),'the root index.html does not redirect into dist/');
ok(fs.existsSync(path.join(DIST,'index.html')),'the redirect target dist/index.html is missing');

// --- 404 pages: an address with the wrong shape must forward to the right one, and must never loop ---
// dist/404.html is what visitors get when Pages publishes dist/ (the normal case): /dist/... links have to be mapped to the root.
// The repo-root 404.html is the mirror image, for when Pages publishes the repository root.
const vm=require('vm');
function redirectOf(file,pathname,search='',hash=''){
  const h=fs.readFileSync(file,'utf8'),scripts=[...h.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
  ok(scripts.length===1,file+' must have exactly one inline script');
  let to=null;
  vm.runInNewContext(scripts[0],{location:{pathname,search,hash,replace:u=>{to=u}}});
  return to;
}
const D404=path.join(DIST,'404.html'),R404='404.html';
ok(fs.existsSync(D404)&&fs.existsSync(R404),'both 404.html pages must exist');
const B='/BIx-game-';
const cases=[
  [D404,B+'/dist/level2.html',B+'/level2.html'],
  [D404,B+'/dist/level1.html',B+'/level1.html'],
  [D404,B+'/dist/',B+'/'],
  [D404,B+'/dist',B+'/'],
  [D404,B+'/dist/assets/landing-hero-v1.jpg',B+'/assets/landing-hero-v1.jpg'],
  [D404,B+'/no-such-page.html',null],           // genuinely missing: show the 404 page, do not redirect
  [D404,B+'/distinct.html',null],                // a name that merely starts with "dist" is not the folder
  [R404,B+'/level2.html',B+'/dist/level2.html'],
  [R404,B+'/level1.html',B+'/dist/level1.html'],
  [R404,B+'/dist/level2.html',null],             // already under dist/: leave it, so a missing file cannot loop
  [R404,B+'/dist/nope.html',null],
];
for(const [file,from,want] of cases)ok(redirectOf(file,from)===want,`${file} on ${from} should go to ${want}, went to ${redirectOf(file,from)}`);
ok(redirectOf(D404,B+'/dist/level2.html','?a=1','#x')===B+'/level2.html?a=1#x','the query string and hash must survive the redirect');
// following the redirect must land on something that stops: no address may bounce forever
for(const [file,from] of [[D404,B+'/dist/x/dist/y.html'],[R404,B+'/x.html']]){
  let at=from;for(let i=0;i<4;i++){const other=redirectOf(file===D404?D404:R404,at);if(other==null)break;at=other}
  ok(redirectOf(D404,at)===null||redirectOf(R404,at)===null,'a redirect chain from '+from+' did not settle');
}
ok(/<a href="\.\/">/.test(fs.readFileSync(D404,'utf8')),'the 404 page must offer a way home');

// --- Level 3 stays locked on the landing page until Levels 1 and 2 have banked more than 12 cogs ---
{
  const vm=require('vm'),P=require('../dist/progress.js');
  ok(/data-lock="level3"/.test(html)&&/data-lock-note="level3"/.test(html),'the Level 3 buttons and the lock note are marked for the lock script');
  const mkEl=(href)=>{const at={href};return{hidden:false,textContent:'',className:'',classList:{toggle(c,on){this.on=on?c:''}},getAttribute:k=>at[k]===undefined?null:at[k],setAttribute:(k,v)=>{at[k]=v},removeAttribute:k=>{delete at[k]},hasAttribute:k=>k in at,at}};
  function run(c1,c2){
    const btn=mkEl('./level3.html'),note=mkEl(),els={'[data-lock="level3"]':[btn],'[data-lock-note="level3"]':[note]};
    const progress=P.sanitize({levels:{level1:{bestCogs:c1},level2:{bestCogs:c2}}});
    const sb={window:{Mayhem:{subscribe(fn){fn({user:null,progress,configured:false,busy:false,message:''})}},MayhemProgress:P},document:{getElementById:()=>null,querySelector:()=>null,querySelectorAll:sel=>els[sel]||[]}};
    vm.createContext(sb);vm.runInContext(fs.readFileSync('dist/account-ui.js','utf8'),sb);
    return {btn,note};
  }
  let r=run(6,6);ok(r.btn.getAttribute('href')===null&&r.btn.getAttribute('aria-disabled')==='true'&&r.note.hidden===false&&/12 so far/.test(r.note.textContent),'with 12 banked cogs the Level 3 button has no link and the note says why');
  r=run(6,7);ok(r.btn.getAttribute('href')==='./level3.html'&&r.btn.getAttribute('aria-disabled')===null&&r.note.hidden===true,'with 13 banked cogs the Level 3 button links to the level');
}

console.log(JSON.stringify({checks,localRefs:refs.length,images:imgs.length}));
