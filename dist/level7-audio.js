/* Original, asset-free Level 7 score and game sounds. Audio unlocks on Start. */
(function(root){
  'use strict';
  const AudioCtor=root.AudioContext||root.webkitAudioContext;
  const roots=[146.83,116.54,174.61,130.81]; // Dm, Bb, F, C
  const arpeggio=[0,7,12,15,12,7,3,7];
  const stepTime=60/96/2;
  let ctx=null,master=null,music=null,effects=null,timer=null,active=false,nextTime=0,step=0,area='dome';
  const musicVoices=new Set();
  let muted=false;
  try{muted=root.localStorage?.getItem('l7-muted')==='1'}catch(e){}

  function setup(){
    if(!AudioCtor)return false;
    if(ctx)return true;
    try{
      ctx=new AudioCtor();master=ctx.createGain();music=ctx.createGain();effects=ctx.createGain();
      master.gain.value=muted?0:.8;music.gain.value=.32;effects.gain.value=.42;
      music.connect(master);effects.connect(master);master.connect(ctx.destination);
      return true;
    }catch(e){ctx=null;return false}
  }
  function tone(freq,when,duration,level,type,bus,slide=0){
    if(!ctx||!Number.isFinite(freq)||freq<=0)return;
    const oscillator=ctx.createOscillator(),envelope=ctx.createGain();
    oscillator.type=type;oscillator.frequency.setValueAtTime(freq,when);
    if(slide)oscillator.frequency.exponentialRampToValueAtTime(Math.max(25,freq*slide),when+duration);
    envelope.gain.setValueAtTime(.0001,when);
    envelope.gain.exponentialRampToValueAtTime(Math.max(.0002,level),when+Math.min(.024,duration/3));
    envelope.gain.exponentialRampToValueAtTime(.0001,when+duration);
    oscillator.connect(envelope);envelope.connect(bus);
    if(bus===music){musicVoices.add(oscillator);oscillator.onended=()=>musicVoices.delete(oscillator)}
    oscillator.start(when);oscillator.stop(when+duration+.025);
  }
  function chord(rootFreq,when){
    for(const [semi,level] of [[0,.12],[3,.075],[7,.055]])tone(rootFreq*Math.pow(2,semi/12),when,2.25,level,'sine',music);
  }
  function schedule(){
    if(!active||!ctx||ctx.state==='suspended')return;
    const horizon=ctx.currentTime+.22;
    while(nextTime<horizon){
      const bar=Math.floor(step/8)%4,beat=step%8,rootFreq=roots[bar];
      if(beat===0)chord(rootFreq,nextTime);
      if(beat===0||beat===4)tone(rootFreq/2,nextTime,.26,area==='deadhead'?.21:.16,'triangle',music);
      if(beat===2||beat===6)tone(rootFreq*2,nextTime,.07,.035,'sine',music);
      const sparse=area==='dome'||area==='archive';
      if(!sparse||beat%2===0){const f=rootFreq*2*Math.pow(2,arpeggio[beat]/12);tone(f,nextTime,.13,area==='deadhead'?.055:.085,'triangle',music)}
      nextTime+=stepTime;step++;
    }
  }
  function start(){
    if(!setup())return;
    stop();
    active=true;ctx.resume?.();nextTime=ctx.currentTime+.04;step=0;
    music.gain.setTargetAtTime(.32,ctx.currentTime,.015);
    if(timer===null&&root.setInterval)timer=root.setInterval(schedule,80);
    schedule();
  }
  function stop(){
    active=false;
    if(timer!==null){root.clearInterval?.(timer);timer=null}
    if(!ctx)return;
    music.gain.setTargetAtTime(0,ctx.currentTime,.015);
    for(const voice of musicVoices)try{voice.stop(ctx.currentTime+.02)}catch(e){}
    musicVoices.clear();
  }
  function setArea(value){area=value||'dome'}
  function sfx(name){
    if(muted||!setup()||ctx.state==='suspended')return;
    const t=ctx.currentTime+.005,hit=(f,d,v,type='sine',slide=0)=>tone(f,t,d,v,type,effects,slide);
    switch(name){
      case 'jump':hit(390,.19,.22,'triangle',1.62);break;
      case 'land':hit(95,.13,.16,'triangle',.55);break;
      case 'cog':hit(740,.12,.17);tone(1110,t+.09,.19,.14,'sine',effects);break;
      case 'fragment':hit(520,.3,.16);tone(780,t+.14,.34,.14,'sine',effects);tone(1040,t+.28,.4,.1,'sine',effects);break;
      case 'deploy':hit(280,.4,.18,'sawtooth',1.75);tone(680,t+.12,.24,.12,'sine',effects);break;
      case 'recall':hit(680,.34,.15,'triangle',.42);break;
      case 'linkbreak':hit(540,.5,.22,'sawtooth',.18);break;
      case 'checkpoint':hit(500,.18,.12);tone(750,t+.13,.28,.13,'sine',effects);break;
      case 'door':hit(120,.55,.24,'triangle',.6);tone(440,t+.18,.32,.1,'sine',effects);break;
      case 'blackout':hit(72,.8,.3,'sawtooth',.45);break;
      case 'hurt':hit(260,.28,.23,'sawtooth',.38);break;
      case 'alert':hit(610,.11,.14,'square');tone(480,t+.13,.12,.1,'square',effects);break;
      case 'ping':hit(880,.18,.12,'sine',1.45);break;
      case 'reroute':hit(460,.23,.13,'triangle',.7);break;
      case 'finish':for(let i=0;i<4;i++)tone([294,349,440,587][i],t+i*.15,.5,.17,'sine',effects);break;
    }
  }
  function toggle(){muted=!muted;try{root.localStorage?.setItem('l7-muted',muted?'1':'0')}catch(e){}if(master)master.gain.setTargetAtTime(muted?0:.8,ctx.currentTime,.025);return muted}
  root.L7Audio={start,stop,setArea,sfx,toggle,isMuted:()=>muted,isAvailable:()=>!!AudioCtor};
})(window);
