import * as G from './game-core.mjs';
const $=id=>document.getElementById(id);
const num=n=>Number(n||0).toLocaleString('en-GB');
const store={get(k){try{return localStorage.getItem(k)}catch{return null}},set(k,v){try{localStorage.setItem(k,String(v))}catch{}}};
const KIT_BY_ID=Object.fromEntries(G.KITS.map(x=>[x.id,x]));
let state=G.freshGame({bank:Number(store.get('ca21-bank-v2'))>=G.MIN_WAGER?Number(store.get('ca21-bank-v2')):G.START_POINTS});
let openedHelpFrom=null;let themeIndex=Math.max(0,['midnight','gold','violet'].indexOf(store.get('ca21-theme')||'midnight'));let sound=false;let ctx=null;let svgCounter=0;
const THEMES=['midnight','gold','violet'];
document.documentElement.dataset.theme=THEMES[themeIndex];
function beep(freq=440,dur=.065){if(!sound)return;try{ctx??=new (window.AudioContext||window.webkitAudioContext)();const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='sine';osc.frequency.value=freq;gain.gain.setValueAtTime(.035,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+dur);osc.connect(gain);gain.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+dur)}catch{sound=false}}
const safeEvent=(fn)=>{try{fn()}catch(err){console.error('Gameplay issue:',err);$('roundMessage').textContent='A game issue occurred. Please use New Season in the help menu to restart.'}};
function jersey(kit,{small=false}={}){
 const uid='jersey-'+(++svgCounter);
 const pat=kit.pattern==='stripe'?`<path d="M45 33V101M75 33V101" stroke="${kit.secondary}" stroke-width="11"/>`:
  kit.pattern==='hoops'?`<path d="M30 55H90M30 79H90" stroke="${kit.secondary}" stroke-width="12"/>`:
  kit.pattern==='half'?`<path d="M60 25H103V111H60Z" fill="${kit.secondary}"/>`:
  `<path d="M31 50L43 60 55 50 67 60 79 50 91 60M29 76L41 86 53 76 65 86 77 76 89 86" stroke="${kit.secondary}" stroke-width="9" fill="none"/>`;
 return `<svg class="jersey" viewBox="0 0 120 126" role="img" aria-label="Jersey number ${kit.number}, ${kit.pattern} pattern and ${kit.mark} badge"><defs><clipPath id="${uid}"><path d="M34 26L46 19H74L86 26 112 38 103 64 92 59V108H28V59L17 64 8 38Z"/></clipPath></defs><path d="M34 26L46 19H74L86 26 112 38 103 64 92 59V108H28V59L17 64 8 38Z" fill="${kit.primary}" stroke="#0c203b" stroke-width="5" stroke-linejoin="round"/><g clip-path="url(#${uid})">${pat}</g><path d="M46 19Q60 38 74 19" fill="none" stroke="#f1faff" stroke-width="5"/><text x="60" y="87" font-size="38" font-weight="900" text-anchor="middle" stroke="#102136" stroke-width="6" paint-order="stroke" fill="white">${kit.number}</text><circle cx="41" cy="43" r="12" fill="#eff8ff" stroke="#0c203b" stroke-width="2"/><text x="41" y="49" font-size="14" font-weight="bold" text-anchor="middle" fill="#0c203b">${kit.mark}</text></svg>`;
}
function card(card,faceDown=false){if(faceDown)return `<div class="playing-card back" aria-label="Face-down dealer card"><span>21✦</span></div>`;
 const kit=KIT_BY_ID[card.kitId],symbols={spades:'♠',hearts:'♥',diamonds:'♦',clubs:'♣'};
 return `<div class="playing-card" role="img" aria-label="${card.rank} of ${card.suit}; kit number ${kit.number}, ${kit.pattern} pattern, ${kit.mark} emblem"><span class="rank">${card.rank}<small>${symbols[card.suit]}</small></span>${jersey(kit)}<span class="suit">${symbols[card.suit]}</span><span class="kit-code">${kit.name}</span></div>`;
}
function updateState(next,{playSound=true}={}){state=next;if(state.phase==='scout'&&!state.scout)state=G.prepareScout(state);if(['scout','review'].includes(state.phase))store.set('ca21-bank-v2',state.bank);render();if(playSound)beep(state.phase==='scout'?620:440)}
function render(){
 $('bank').textContent=num(state.bank);$('betStat').textContent=num(state.phase==='player'||['scout','review'].includes(state.phase)?state.wager:state.bet);
 $('round').textContent=num(state.round);$('streak').textContent=num(state.streak);
 $('scoutAccuracy').textContent=`${num(state.scoutCorrect)}/${num(state.round-(state.phase==='ready'?0:state.phase==='player'?1:0))}`;
 $('chapter').textContent=G.chapter(state.round+1).toUpperCase();
 $('phasePill').textContent=state.phase==='ready'?'READY TO DEAL':state.phase==='player'?'YOUR MOVE':state.phase==='scout'?'SCOUT BONUS':'ROUND COMPLETE';
 $('dealerCards').innerHTML=state.dealer.length?state.dealer.map((c,i)=>card(c,state.phase==='player'&&i===1)).join(''):'<div class="empty-card">?</div><div class="empty-card">?</div>';
 $('playerCards').innerHTML=state.player.length?state.player.map(c=>card(c)).join(''):'<div class="empty-card">21</div><div class="empty-card">✦</div>';
 $('playerTotal').textContent=state.player.length?G.value(state.player).total:'—';
 $('dealerTotal').textContent=state.dealer.length?(state.phase==='player'?G.value([state.dealer[0]]).total:G.value(state.dealer).total):'—';
 const ready=state.phase==='ready',playing=state.phase==='player',review=state.phase==='review';
 $('dealBtn').hidden=!ready||state.bank<G.MIN_WAGER;$('dealBtn').disabled=!ready;
 $('hitBtn').hidden=!playing;$('hitBtn').disabled=!playing;
 $('standBtn').hidden=!playing;$('standBtn').disabled=!playing;
 $('doubleBtn').hidden=!playing;$('doubleBtn').disabled=!playing||state.player.length!==2||state.bank<state.wager;
 $('nextBtn').hidden=!review||state.bank<G.MIN_WAGER;
 $('resetBtn').hidden=!(state.bank<G.MIN_WAGER&&['ready','review'].includes(state.phase));
 $('betRow').hidden=!ready||state.bank<G.MIN_WAGER;
 $('betRange').max=Math.max(G.MIN_WAGER,state.bank);$('betRange').value=state.bet;$('betValue').textContent=num(state.bet);
 for(const b of document.querySelectorAll('[data-bet]')){b.disabled=!ready||Number(b.dataset.bet)>state.bank;b.setAttribute('aria-pressed',String(state.bet===Number(b.dataset.bet)))}
 const msg=$('roundMessage');msg.className='round-message';
 if(ready)msg.textContent=state.bank<G.MIN_WAGER?'Match points exhausted. Start a free new season to keep playing.':'Choose your virtual stake and deal four cards. No real money is involved.';
 else if(playing)msg.textContent=`Your cards total ${G.value(state.player).total}. Hit, stand or double — but do not exceed 21.`;
 else if(state.latest){const l=state.latest;const words={win:'Victory!',lose:'Dealer wins this hand.',push:'Draw — your points are returned.',blackjack:'BLACKJACK! Perfect opening.'};msg.textContent=`${words[l.result]} ${l.net>=0?'+':''}${num(l.net)} match points${l.bonus?` (includes +${l.bonus} twin-kit bonus)`:''}. ${state.phase==='scout'?'Now complete the Scout Bonus.':'Continue to the next round.'}`;msg.classList.add(l.result==='lose'?'lost':'won')}
 renderScout();
}
function renderScout(){const active=state.phase==='scout'||state.phase==='review';$('scoutReady').hidden=active;$('scoutGame').hidden=!active;$('scoutIntro').textContent=active?'Find the shirt matching the target. Compare number, pattern and badge.':'After every hand, earn extra points by spotting the same jersey using its number, badge and pattern.';
 if(!active||!state.scout){$('scoutFeedback').innerHTML='Correct match: <b>+30 bonus match points</b>.';return}
 const c=state.scout,target=KIT_BY_ID[c.target];$('targetKit').innerHTML=jersey(target);$('targetCue').textContent=c.hinted?`Clue: look for the ${target.pattern} pattern and ${target.mark} badge`:'Match the number · pattern · symbol';
 $('hintBtn').disabled=c.solved||c.hinted;$('skipBtn').disabled=c.solved;
 $('scoutOptions').innerHTML=c.choices.map((id,i)=>{const k=KIT_BY_ID[id];let sel='';if(c.solved&&i===c.answer)sel=' chosen-right';if(c.solved&&i===c.selected&&i!==c.answer)sel=' chosen-wrong';return `<button type="button" class="scout-option${sel}" data-choice="${i}" ${c.solved?'disabled':''} aria-label="Option ${i+1}, jersey number ${k.number}, ${k.pattern} pattern and ${k.mark} badge">${jersey(k)}<b>OPTION ${String.fromCharCode(65+i)}</b></button>`}).join('');
 if(c.solved){$('scoutFeedback').textContent=c.selected===c.answer?`Great spot! +${c.reward} match points. You matched number ${target.number}, ${target.pattern} pattern and ${target.mark} badge.`:c.selected<0?`Bonus skipped. The correct kit had number ${target.number}, ${target.pattern} pattern and ${target.mark} badge.`:`Not quite. Correct match: jersey ${target.number}, ${target.pattern} pattern and ${target.mark} badge. No match-point penalty.`;}
 else $('scoutFeedback').textContent=c.hinted?'Clue used: correct answer rewards 10 match points. Check the jersey number as well.':'Scout reward: +30 match points. Choose one shirt or reveal a clue.';
}
function clearHelp(){if($('helpOverlay').hidden)return;$('helpOverlay').hidden=true;store.set('ca21-seen','yes');(openedHelpFrom||$('dealBtn')).focus();}
function openHelp(){openedHelpFrom=document.activeElement;$('helpOverlay').hidden=false;$('closeHelp').focus()}
function newSeason(){const saved=state.mode;state=G.freshGame({mode:saved});store.set('ca21-bank-v2',state.bank);clearHelp();render();beep(520)}
$('dealBtn').addEventListener('click',()=>safeEvent(()=>updateState(G.deal(state))));
$('hitBtn').addEventListener('click',()=>safeEvent(()=>updateState(G.hit(state))));
$('standBtn').addEventListener('click',()=>safeEvent(()=>updateState(G.stand(state))));
$('doubleBtn').addEventListener('click',()=>safeEvent(()=>updateState(G.doubleDown(state))));
$('nextBtn').addEventListener('click',()=>safeEvent(()=>updateState(G.nextRound(state))));
$('resetBtn').addEventListener('click',newSeason);
$('betRange').addEventListener('input',e=>updateState(G.betChange(state,Number(e.target.value)),{playSound:false}));
document.querySelectorAll('[data-bet]').forEach(b=>b.addEventListener('click',()=>updateState(G.betChange(state,Number(b.dataset.bet)),{playSound:false})));
$('scoutOptions').addEventListener('click',e=>{const el=e.target.closest('[data-choice]');if(el)safeEvent(()=>updateState(G.answerScout(state,Number(el.dataset.choice))))});
$('hintBtn').addEventListener('click',()=>safeEvent(()=>updateState(G.scoutHint(state),{playSound:false})));
$('skipBtn').addEventListener('click',()=>safeEvent(()=>updateState(G.skipScout(state))));
$('themeBtn').addEventListener('click',()=>{themeIndex=(themeIndex+1)%THEMES.length;document.documentElement.dataset.theme=THEMES[themeIndex];store.set('ca21-theme',THEMES[themeIndex])});
$('soundBtn').addEventListener('click',()=>{sound=!sound;$('soundBtn').setAttribute('aria-pressed',String(sound));$('soundBtn').lastElementChild.textContent=sound?'Sound on':'Sound off';if(sound)beep(600)});
$('helpBtn').addEventListener('click',openHelp);$('closeHelp').addEventListener('click',clearHelp);$('newSeasonBtn').addEventListener('click',newSeason);
$('helpOverlay').addEventListener('click',e=>{if(e.target===$('helpOverlay'))clearHelp()});
document.addEventListener('keydown',e=>{if(e.altKey||e.metaKey||e.ctrlKey||e.target.matches('input,textarea,select'))return;const k=e.key.toLowerCase();if(k==='escape'){e.preventDefault();$('helpOverlay').hidden?openHelp():clearHelp();return}if(!$('helpOverlay').hidden)return;
 if(k==='h'&&state.phase==='player')$('hitBtn').click();if(k==='s'&&state.phase==='player')$('standBtn').click();if(k==='d'&&state.phase==='player')$('doubleBtn').click();if(k==='enter'&&e.target===document.body){if(state.phase==='ready')$('dealBtn').click();if(state.phase==='review')$('nextBtn').click()}});
// Reflect a fully valid first frame without network or external dependencies.
render();if(!store.get('ca21-seen'))openHelp();