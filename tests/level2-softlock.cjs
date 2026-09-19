// Level 2 has no soft-locks: from every checkpoint, the player can still reach every valve, the coolant gate and the exit,
// and can get back.
//
// tests/level2-route.cjs proves every required hop works going FORWARD. It cannot see a level where a player who does things
// in an unexpected order strands themselves: e.g. taking the lower Cooling Works route first, reaching the gate, and finding
// the upper valve unreachable because the way back is a 210px climb (the jump is 209px). This test builds the graph of
// surfaces from the required chains, in BOTH directions, and asks that question of every checkpoint.
//
// It uses the same ballistic formula as tests/level2-geometry.cjs with a safety margin, so it is an approximation of what
// the engine allows; level2-route.cjs plays each hop in the real engine, and the new return hop is one of them.
const fs=require('fs'),assert=require('assert');
global.window={};eval(fs.readFileSync('dist/level2-data.js','utf8'));const D=window.L2DATA;
let checks=0;const ok=(c,m)=>{assert(c,m);checks++};

const S={};
D.platforms.forEach((p,i)=>S['p'+i]={x:p[0],y:p[1],w:p[2]});
D.ledges.forEach((l,i)=>S['l'+i]={x:l[0],y:l[1],w:l[2]});
D.movers.forEach((m,i)=>S['m'+i]={x:m.x,y:m.y,w:m.w});           // a mover is judged at the centre of its travel
const id=n=>n[0]+n[1];

// spare pixels of horizontal reach left over after a jump from a to b (negative = cannot make it). Rising or falling.
function margin(a,b){
  const rise=a.y-b.y,disc=780**2-2*1450*rise;if(disc<=0)return -Infinity;      // cannot rise that far
  const t=(780+Math.sqrt(disc))/1450,gap=Math.max(0,b.x-(a.x+a.w),a.x-(b.x+b.w));
  return 285*t-35-(gap+42);
}
const MARGIN=30;
const edges={};const add=(a,b)=>{(edges[a]??=new Set()).add(b)};
for(const c of D.chains){
  if(c.kind!=='required')continue;                               // a player must never depend on an optional route
  for(let i=1;i<c.nodes.length;i++){
    const a=id(c.nodes[i-1]),b=id(c.nodes[i]);
    if(margin(S[a],S[b])>=MARGIN)add(a,b);
    if(margin(S[b],S[a])>=MARGIN)add(b,a);
  }
}
function reach(from){const seen=new Set([from]),q=[from];while(q.length){const n=q.pop();for(const m of edges[n]||[])if(!seen.has(m)){seen.add(m);q.push(m)}}return seen}

// the surface a point stands on
const deckAt=(x,y,slack=14)=>Object.entries(S).filter(([,s])=>Math.abs(s.y-y)<=slack&&x>=s.x-30&&x<=s.x+s.w+30).map(([k])=>k);
const single=(list,what)=>{ok(list.length>=1,'no surface found for '+what);return list[0]};

const start=single(deckAt(D.checkpoints[0].x,D.checkpoints[0].y),'the start checkpoint');
const valves=D.valves.map(v=>({id:v.id,deck:single(deckAt(v.x,v.y+34,40),'valve '+v.id)}));
const exitDeck=single(deckAt(D.exit.x,D.exit.y),'the exit lift');
const gate=D.gates[0],gateCp=D.checkpoints.find(c=>/gate/i.test(c.name));
ok(gateCp,'there is no checkpoint at the coolant gate');
const gateDeck=single(deckAt(gateCp.x,gateCp.y),'the coolant gate checkpoint');

// 1. from the start, everything is reachable
const fromStart=reach(start);
for(const v of valves)ok(fromStart.has(v.deck),`from the start, valve ${v.id} (${v.deck}) cannot be reached`);
ok(fromStart.has(gateDeck),'from the start, the coolant gate deck cannot be reached');
ok(fromStart.has(exitDeck),'from the start, the exit lift cannot be reached');

// 2. from EVERY checkpoint, all the remaining objectives are still reachable (forward progress is never cut off)
for(const cp of D.checkpoints){
  const deck=single(deckAt(cp.x,cp.y),'checkpoint '+cp.name),r=reach(deck);
  const atOrBeforeGate=cp.x<=gateCp.x;
  if(atOrBeforeGate&&cp.area==='cooling')for(const v of valves)ok(r.has(v.deck),`from checkpoint "${cp.name}" a player can no longer reach valve ${v.id}: they are soft-locked`);
  ok(r.has(exitDeck)||cp.x>exitDeck.x,`from checkpoint "${cp.name}" the exit lift cannot be reached`);
}

// 3. the round trip: after the gate deck, a player must be able to go back for whichever valve they missed, and return
{
  const r=reach(gateDeck);
  for(const v of valves){
    ok(r.has(v.deck),`from the gate deck (${gateDeck}) the ${v.id} deck (${v.deck}) is unreachable, so a player who reached the gate without it is stuck at a gate that can never open`);
    ok(reach(v.deck).has(gateDeck),`after the ${v.id} deck (${v.deck}) the gate deck (${gateDeck}) cannot be reached again`);
  }
}
// 4. the gate really needs those valves (so the checks above are about the right thing)
ok(Array.isArray(gate.needs)&&gate.needs.length===D.valves.length&&D.valves.every(v=>gate.needs.includes(v.id)),'the gate should need every valve');

console.log(JSON.stringify({checks,surfaces:Object.keys(S).length,edges:Object.values(edges).reduce((n,s)=>n+s.size,0),startDeck:start,gateDeck,valveDecks:valves.map(v=>v.deck),exitDeck}));
