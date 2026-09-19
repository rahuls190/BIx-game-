// On a touch screen, holding a button or dragging the joystick must not select text or raise the copy / image callout.
// This reads the real stylesheet the game pages load: the rule has to be inside a touch-only media query (a mouse
// player keeps normal text selection), has to cover the page, canvas and controls, and has to leave form fields alone.
const fs=require('fs'),assert=require('assert');
let checks=0;const ok=(c,m)=>{assert(c,m);checks++};
const css=fs.readFileSync('dist/polish.css','utf8').replace(/\/\*[\s\S]*?\*\//g,'');
// the media block, found by brace matching
const at=css.search(/@media\s*\(hover:\s*none\)\s*,\s*\(pointer:\s*coarse\)\s*\{/);
ok(at>=0,'polish.css has no touch-only (hover: none), (pointer: coarse) block');
let i=css.indexOf('{',at),depth=0,end=i;for(;end<css.length;end++){if(css[end]==='{')depth++;if(css[end]==='}'&&--depth===0)break}
const block=css.slice(i+1,end);
const rules=[...block.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(m=>({sel:m[1].split(',').map(s=>s.trim()),body:m[2]}));
const rule=(name,test)=>rules.find(r=>r.sel.some(s=>s===name)&&test(r.body));
for(const name of ['html','body','canvas','#touchControls','#joystick','button'])
  ok(rule(name,b=>/(^|[\s;])user-select:\s*none/.test(b)&&/-webkit-user-select:\s*none/.test(b)),`${name} can still be selected on a touch screen`);
ok(rule('body',b=>/-webkit-touch-callout:\s*none/.test(b)),'the long-press callout is not disabled');
for(const name of ['input','textarea'])ok(rule(name,b=>/user-select:\s*text/.test(b)),`${name} must stay selectable so people can type and paste`);
// nothing outside a touch query may switch selection off for the whole page
const outside=css.slice(0,at)+css.slice(end+1);
ok(!/(html|body|canvas)\s*[,{][^{}]*\{[^{}]*user-select:\s*none/.test(outside.replace(/#touchControls button\s*\{[^}]*\}/,'')),'user-select:none is applied to the page on every device, not only touch');
// both game pages load the stylesheet
for(const f of ['dist/level1.html','dist/level2.html'])ok(/href="\.\/polish\.css/.test(fs.readFileSync(f,'utf8')),`${f} does not load polish.css`);
console.log(JSON.stringify({checks}));
