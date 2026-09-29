'use strict';
const assert=require('assert'),fs=require('fs'),vm=require('vm');
let voices=0,stops=0,timer=null,cleared=0;
const gains=[];
const param=()=>({value:0,setValueAtTime(){},exponentialRampToValueAtTime(){},setTargetAtTime(value){this.value=value}});
class Context{
  constructor(){this.currentTime=1;this.state='running';this.destination={}}
  createGain(){const gain=param();gains.push(gain);return{gain,connect(){}}}
  createOscillator(){return{frequency:param(),type:'sine',connect(){},start(){voices++},stop(){stops++}}}
  resume(){this.state='running'}
}
const storage={getItem:()=>null,setItem(){}};
const sb={AudioContext:Context,localStorage:storage,setInterval:fn=>{timer=fn;return 1},clearInterval:()=>{cleared++;timer=null}};sb.window=sb;
vm.createContext(sb);vm.runInContext(fs.readFileSync('dist/level7-audio.js','utf8'),sb);
const a=sb.L7Audio;assert(a.isAvailable()&&!a.isMuted());
a.start();assert(voices>0&&timer,'Start schedules the score after a user action');
const before=voices;a.setArea('deadhead');a.sfx('jump');a.sfx('cog');assert(voices>before,'gameplay cues create voices');
assert(a.toggle()===true,'mute turns on');const quiet=voices;a.sfx('hurt');assert(voices===quiet,'mute silences effects');
assert(a.toggle()===false,'mute turns off');const stopsBefore=stops;a.stop();assert(cleared===1&&!timer,'Stop clears the music scheduler');
assert.strictEqual(gains[1].value,0,'Stop silences music already scheduled ahead');
assert(stops>stopsBefore,'Stop ends scheduled music voices');
const effectsBefore=voices;a.sfx('finish');assert(voices>effectsBefore,'Finish effect remains audible after score stops');
a.start();assert.strictEqual(gains[1].value,.32,'Restart restores the music bus');a.stop();
console.log(JSON.stringify({checks:11,voices,stops}));
