/* Colour Blindness 21 — Matchday Masters
   Original game concept: Cornelius Aurelius. Independent rules engine.
   100% virtual match points. No payments, deposits or real-money wagering. */
export const START_POINTS=1200;
export const MIN_WAGER=20;
export const RANKS=['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
export const SUITS=['spades','hearts','diamonds','clubs'];
export const KITS=[
 {id:'comet',name:'Comet',number:'12',primary:'#23d5ff',secondary:'#132b76',pattern:'stripe',mark:'✦'},
 {id:'flare',name:'Flare',number:'7',primary:'#ffbb62',secondary:'#731931',pattern:'hoops',mark:'◆'},
 {id:'orbit',name:'Orbit',number:'9',primary:'#c39aff',secondary:'#48227e',pattern:'half',mark:'●'},
 {id:'tidal',name:'Tidal',number:'14',primary:'#2ce2bb',secondary:'#075567',pattern:'chevrons',mark:'▲'},
 {id:'nova',name:'Nova',number:'5',primary:'#f876b0',secondary:'#5a1b73',pattern:'stripe',mark:'✦'},
 {id:'eclipse',name:'Eclipse',number:'11',primary:'#cbd9ef',secondary:'#253054',pattern:'hoops',mark:'◆'},
 {id:'voltage',name:'Voltage',number:'2',primary:'#f6de68',secondary:'#3f477f',pattern:'half',mark:'●'},
 {id:'pixel',name:'Pixel',number:'8',primary:'#a9ef8a',secondary:'#31624a',pattern:'chevrons',mark:'▲'},
 {id:'night',name:'Night',number:'10',primary:'#91b4fa',secondary:'#172c64',pattern:'stripe',mark:'▲'},
 {id:'signal',name:'Signal',number:'6',primary:'#ff9a7a',secondary:'#61304b',pattern:'chevrons',mark:'●'},
 {id:'focus',name:'Focus',number:'4',primary:'#edd5fc',secondary:'#554087',pattern:'half',mark:'◆'},
 {id:'arrow',name:'Arrow',number:'3',primary:'#67ded2',secondary:'#235089',pattern:'hoops',mark:'✦'}
];
export const bounded=(v,min,max)=>Math.max(min,Math.min(max,v));
export const kitId = card => card.kitId;
export function shuffledDeck(rng=Math.random){
 const deck=[]; let i=0;
 for(const suit of SUITS)for(const rank of RANKS){deck.push({id:`${suit}-${rank}`,suit,rank,kitId:KITS[i%KITS.length].id});i++}
 for(let j=deck.length-1;j>0;j--){const k=Math.floor(bounded(rng(),0,0.999999999)* (j+1));[deck[k],deck[j]]=[deck[j],deck[k]]}
 return deck;
}
export function value(hand){
 let total=0,aces=0;
 for(const c of hand){if(c.rank==='A'){aces++;total+=11}else if(['J','Q','K'].includes(c.rank))total+=10;else total+=Number(c.rank)}
 while(total>21&&aces>0){total-=10;aces--}
 return {total,soft:aces>0,bust:total>21};
}
export function isNatural(hand){return hand.length===2&&value(hand).total===21}
export function dealerShouldHit(hand){return value(hand).total<17}
export function hasKitPair(hand){const set=new Set;for(const card of hand){if(set.has(card.kitId))return true;set.add(card.kitId)}return false}
export function resultFor(player,dealer){const p=value(player),d=value(dealer);if(p.bust)return 'lose';if(isNatural(player)&&isNatural(dealer))return 'push';if(isNatural(player))return 'blackjack';if(isNatural(dealer))return 'lose';if(d.bust||p.total>d.total)return 'win';if(p.total===d.total)return 'push';return 'lose'}
export function settlement({bankAfterStake,wager,player,dealer}){
 const result=resultFor(player,dealer),bonusKit=hasKitPair(player);
 const baseProfit=result==='blackjack'?Math.round(wager*1.5):result==='win'?wager:0;
 const bonus=(baseProfit>0&&bonusKit)?Math.round(baseProfit*.25):0;
 const payout=(result==='push'?wager:result==='win'||result==='blackjack'?wager+baseProfit+bonus:0);
 return {result,bonusKit:bonusKit&&baseProfit>0,baseProfit,bonus,payout,bank:bankAfterStake+payout,net:payout-wager};
}
export function freshGame({mode='matchday',bank=START_POINTS,rng=Math.random}={}){
 return {mode,bank,bet:40,wager:0,deck:shuffledDeck(rng),player:[],dealer:[],phase:'ready',round:0,wins:0,streak:0,bestStreak:0,scoutCorrect:0,scoutStreak:0,latest:null,scout:null};
}
const clone=s=>({...s,player:[...s.player],dealer:[...s.dealer],deck:[...s.deck]});
function draw(s,rng){if(!s.deck.length)s.deck=shuffledDeck(rng);return s.deck.pop()}
export function betChange(state,next){if(state.phase!=='ready')return state;return {...state,bet:bounded(Math.round(next/10)*10,MIN_WAGER,Math.max(MIN_WAGER,state.bank))}}
export function deal(state,rng=Math.random){
 if(state.phase!=='ready'||state.bank<MIN_WAGER)return state;
 const s=clone(state);s.wager=bounded(s.bet,MIN_WAGER,s.bank);s.bank-=s.wager;s.round++;
 if(s.deck.length<14)s.deck=shuffledDeck(rng);
 s.player=[draw(s,rng)];s.dealer=[draw(s,rng)];s.player.push(draw(s,rng));s.dealer.push(draw(s,rng));s.phase='player';s.latest=null;s.scout=null;
 if(isNatural(s.player)||isNatural(s.dealer))return finish(s);
 return s;
}
function finish(state){const s=clone(state);const res=settlement({bankAfterStake:s.bank,wager:s.wager,player:s.player,dealer:s.dealer});s.bank=res.bank;
 if(res.result==='win'||res.result==='blackjack'){s.wins++;s.streak++;s.bestStreak=Math.max(s.bestStreak,s.streak)}else if(res.result==='lose'){s.streak=0}
 s.latest=res;s.phase='scout';return s}
export function hit(state,rng=Math.random){if(state.phase!=='player')return state;const s=clone(state);s.player.push(draw(s,rng));if(value(s.player).bust)return finish(s);if(value(s.player).total===21){while(dealerShouldHit(s.dealer))s.dealer.push(draw(s,rng));return finish(s)}return s}
export function stand(state,rng=Math.random){if(state.phase!=='player')return state;const s=clone(state);while(dealerShouldHit(s.dealer))s.dealer.push(draw(s,rng));return finish(s)}
export function doubleDown(state,rng=Math.random){if(state.phase!=='player'||state.player.length!==2||state.bank<state.wager)return state;const s=clone(state);s.bank-=s.wager;s.wager*=2;s.player.push(draw(s,rng));if(!value(s.player).bust){while(dealerShouldHit(s.dealer))s.dealer.push(draw(s,rng))}return finish(s)}
export function makeScout(round=1,rng=Math.random){
 const primary=KITS[Math.floor(rng()*KITS.length)%KITS.length];
 const diffs=KITS.filter(x=>x.id!==primary.id).sort((a,b)=>((a.pattern===primary.pattern?1:0)+(a.mark===primary.mark?1:0))-((b.pattern===primary.pattern?1:0)+(b.mark===primary.mark?1:0)));
 const candidates=round>=5?diffs.slice(-5):diffs.slice(0,7);
 const chosen=[primary];const pool=[...candidates];
 while(chosen.length<3){const index=Math.floor(rng()*pool.length)%pool.length;chosen.push(pool.splice(index,1)[0]);}
 for(let i=chosen.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[chosen[i],chosen[j]]=[chosen[j],chosen[i]]}
 return {target:primary.id,choices:chosen.map(x=>x.id),answer:chosen.findIndex(x=>x.id===primary.id),solved:false,hinted:false,selected:-1};
}
export function prepareScout(state,rng=Math.random){if(state.phase!=='scout'||state.scout)return state;return {...state,scout:makeScout(state.round,rng)}}
export function scoutHint(state){if(state.phase!=='scout'||!state.scout||state.scout.solved)return state;return {...state,scout:{...state.scout,hinted:true}}}
export function answerScout(state,index){if(state.phase!=='scout'||!state.scout||state.scout.solved)return state;
 const good=index===state.scout.answer,reward=good?(state.scout.hinted?10:30):0;
 return {...state,bank:state.bank+reward,scoutCorrect:state.scoutCorrect+(good?1:0),scoutStreak:good?state.scoutStreak+1:0,scout:{...state.scout,solved:true,selected:index,reward},phase:'review'};
}
export function skipScout(state){if(state.phase!=='scout')return state;return {...state,scout:state.scout?{...state.scout,solved:true,selected:-1,reward:0}:null,scoutStreak:0,phase:'review'}}
export function nextRound(state){if(state.phase!=='review')return state;return {...state,bet:bounded(state.bet,MIN_WAGER,Math.max(MIN_WAGER,state.bank)),wager:0,player:[],dealer:[],phase:'ready',latest:null,scout:null}}
export function chapter(round){return round<4?'First Whistle':round<9?'Match Tempo':round<16?'Champions League':'Legendary Season'}