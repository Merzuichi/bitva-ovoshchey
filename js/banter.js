'use strict';
// Written separately for each language; mechanic instructions remain explicit.
const Banter={
 line(def,index=0){
  const hero=Run.heroId||'ogurets';
  if(def.climb)return [hero,'Беру хайграунд. Плюс аура за каждый этаж.','High ground acquired. Aura secured.'];
  if(def.type==='puzzle')return [hero,'Это не рандом, это лор верёвок. Сейчас разрулим.','Puzzle brain: locked in. Let the veggie cook.'];
  if(def.obj==='survive')return [hero,'Волны? База. Сейчас будет овощной эдит.','More waves? Chat, clip this veggie comeback.'];
  if(def.mods?.includes('night'))return [hero,'Темно, но аура светится. Главное — не обнять мину.','Lights out. Aura on. Nobody hug a mine.'];
  const lines=[
   ['perets','Я тебя могну! Это моя грядка!','I am about to mog this whole garden!'],
   [hero,'Сначала прокачка, потом разнос. База.','Upgrade first. Then we cook.'],
   [hero,'Плюс аура за стильный рывок. Погнали!','Clean dash. Bonus aura. Let us go!'],
   [hero,'Босс музыкой пугает, а я вообще на чиле.','Boss music? I am still in my warm-up arc.'],
   [hero,'Мой план — не стать салатом. Имба-стратегия.','The plan is simple: do not become salad. Peak strategy.']
  ];return lines[index%lines.length];
 }
};
for(const c of STORY){
 if(c.intro&&c.i%2===0)c.intro.push(Banter.line(c,c.i));
}
