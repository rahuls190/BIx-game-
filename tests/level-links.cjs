/* The way forward: each level's complete screen must lead to the next level, and the last one must lead home. Level 6 once sent the
   player back to Level 5 and Levels 3 and 5 only offered "all levels". Also: every stylesheet and script a level page names exists,
   and every level that shows a medal loads the CSS that styles it. Run from the repo root: node tests/level-links.cjs */
'use strict';
const assert = require('assert'), fs = require('fs'), path = require('path');
let checks = 0;
const ok = (c, m) => { assert(c, m); checks++ };
const dist = f => path.join(__dirname, '..', 'dist', f);
const ORDER = ['level1', 'level2', 'level3', 'level4', 'level5', 'level6'];
ORDER.forEach((lvl, i) => {
  const html = fs.readFileSync(dist(lvl + '.html'), 'utf8');
  const m = html.match(/<a class="next-level" href="\.\/([^"]+)">([^<]*)/);
  ok(m, `${lvl} has a next-level link on its complete screen`);
  const next = ORDER[i + 1];
  if (next) ok(m[1] === next + '.html', `${lvl} leads forward to ${next}, not ${m[1]}`);
  else ok(m[1].startsWith('index.html'), `${lvl} is the last level and leads home, not to ${m[1]}`);
  ok(fs.existsSync(dist(m[1].split('#')[0])), `${lvl}'s next-level target ${m[1]} exists`);
  for (const ref of [...html.matchAll(/(?:src|href)="\.\/([^"?#]+)(?:\?[^"]*)?"/g)].map(r => r[1]))
    if (/\.(js|css)$/.test(ref)) ok(fs.existsSync(dist(ref)), `${lvl} names ${ref} and it exists`);
  if (/id="medal"/.test(html)) {
    const css = [...html.matchAll(/href="\.\/([^"?]+\.css)/g)].map(r => fs.readFileSync(dist(r[1]), 'utf8')).join('\n');
    ok(/\.medal\s*\{/.test(css), `${lvl} shows a medal and loads the CSS that styles it`);
  }
});
console.log(JSON.stringify({ checks }));
