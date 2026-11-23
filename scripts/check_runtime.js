#!/usr/bin/env node
// Headless smoke test for the WebView game loop.
// Catches runtime errors that static bracket/data checks cannot see.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const htmlPath = path.resolve(process.argv[2] || path.join(root, 'app/src/main/assets/index3d.html'));
const threePath = path.join(root, 'app/src/main/assets/vendor/three.min.js');

function makeElement() {
  const classes = new Set();
  return {
    style: {},
    classList: {
      contains: (name) => classes.has(name),
      add: (name) => classes.add(name),
      remove: (name) => classes.delete(name),
      toggle: (name, on) => {
        if (on === undefined) on = !classes.has(name);
        if (on) classes.add(name); else classes.delete(name);
      },
    },
    innerHTML: '', textContent: '', children: [], childNodes: [], dataset: {},
    appendChild() {}, removeChild() {}, remove() {},
    addEventListener() {}, removeEventListener() {},
    setAttribute() {}, getAttribute: () => null,
    getBoundingClientRect: () => ({left: 0, top: 0, width: 720, height: 460}),
    querySelector: () => makeElement(), querySelectorAll: () => [],
    getContext: () => ({
      font: '', textAlign: '', textBaseline: '', lineWidth: 0,
      strokeStyle: '', fillStyle: '',
      strokeText() {}, fillText() {}, fillRect() {}, fill() {},
      createRadialGradient: () => ({addColorStop() {}}),
      createLinearGradient: () => ({addColorStop() {}}),
    }),
    width: 720, height: 460, clientWidth: 720, clientHeight: 460,
  };
}

const elements = {};
const documentObj = {
  getElementById(id) { return elements[id] || (elements[id] = makeElement()); },
  createElement: makeElement,
  body: makeElement(),
  documentElement: makeElement(),
  addEventListener() {}, removeEventListener() {},
};
const windowObj = {
  addEventListener() {}, removeEventListener() {},
  innerWidth: 720, innerHeight: 460, devicePixelRatio: 2,
  clientWidth: 720, clientHeight: 460,
  classList: {contains: () => false, add() {}, remove() {}, toggle() {}},
  getBoundingClientRect: () => ({left: 0, top: 0, width: 720, height: 460}),
};
const ctx = {
  console, document: documentObj, window: windowObj,
  performance: {now: () => Date.now()},
  requestAnimationFrame: () => 1, cancelAnimationFrame() {},
  setTimeout, clearTimeout, setInterval, clearInterval,
  Math, Date, JSON, Object, Array, String, Number, Boolean,
  Promise, RegExp, Error, TypeError, RangeError, Reflect,
  navigator: {userAgent: 'check-runtime'}, devicePixelRatio: 2,
};
ctx.globalThis = ctx;
ctx.self = ctx;
vm.createContext(ctx);

const html = fs.readFileSync(htmlPath, 'utf8');
const match = html.match(/<script>([\s\S]*?)<\/script>/);
if (!match) throw new Error(`Kein <script>-Block in ${htmlPath} gefunden`);
if (!/body\.battle-mode\s+\.battle-bar\s*\{[^}]*display:\s*flex/.test(html)) {
  throw new Error('Kampfleiste wird im Kampfmodus nicht eingeblendet (body.battle-mode .battle-bar)');
}
if (!html.includes('id="battleTimer"') || !html.includes('function updateBattleTimer')) {
  throw new Error('Kampf-Timer fehlt');
}
if (!html.includes('id="bossBar"') || !html.includes('function updateBossBar')) {
  throw new Error('Boss-Lebensbalken in der Kampfleiste fehlt');
}
if (!html.includes('id="battleStatus"') || !html.includes('function updateBattleStatus') ||
    !html.includes('id="statusEnemies"') || !html.includes('id="statusHeroes"')) {
  throw new Error('Kampf-Status (Gegner/Helden) in der Kampfleiste fehlt');
}
if (!html.includes('id="heroAlert"') || !html.includes('id="heroAlertCount"') ||
    !html.includes('function updateHeroAlert')) {
  throw new Error('Warnung für kritische Helden in der Kampfleiste fehlt');
}
if (!html.includes('id="teamHpBar"') || !html.includes('function updateTeamHpBar')) {
  throw new Error('Team-HP-Balken in der Kampfleiste fehlt');
}
if (!html.includes('id="battleMana"') || !html.includes('function updateBattleManaBar')) {
  throw new Error('Mana-Anzeige in der Kampfleiste fehlt');
}
if (!html.includes('renderer.setSize(w,h);')) {
  throw new Error('Renderer setzt die CSS-Größe nicht (Canvas wird auf HiDPI zu groß dargestellt)');
}
for (const id of ['mdRoleFilters', 'mdClassFilter', 'mdSynergy', 'hudItems', 'btnItemHeal', 'btnItemShield', 'btnItemNova', 'battleStatus', 'statusEnemies', 'statusFoeHeroes', 'statusMobs', 'statusHeroes', 'heroAlert', 'heroAlertCount', 'eliteAlert', 'eliteAlertCount', 'teamHpBar', 'teamHpFill', 'teamHpPct', 'battleMana', 'battleManaFill', 'battleManaValue', 'battleGold', 'battleGoldValue', 'focusHp', 'focusName', 'focusHpValue', 'focusStatus', 'focusCd', 'focusCdValue']) {
  if (!html.includes(`id="${id}"`)) throw new Error(`Neues UI-Element fehlt: ${id}`);
}
const gameJs = match[1];
vm.runInContext(fs.readFileSync(threePath, 'utf8'), ctx, {filename: 'three.min.js'});
vm.runInContext('var THREE = globalThis.THREE;', ctx);
ctx.THREE = ctx.THREE;
ctx.THREE.WebGLRenderer = function () {
  return {
    setPixelRatio() {}, outputColorSpace: 0, toneMapping: 0, toneMappingExposure: 1,
    shadowMap: {enabled: false, type: 0}, setSize() {}, render() {}, dispose() {},
    domElement: {
      addEventListener() {}, removeEventListener() {},
      getBoundingClientRect: () => ({left: 0, top: 0, width: 720, height: 460}),
    },
  };
};
vm.runInContext(gameJs, ctx, {filename: path.basename(htmlPath)});

vm.runInContext(`
  if (typeof startBattle !== 'function' || typeof simulateBattle !== 'function' || typeof updateVisuals !== 'function') {
    throw new Error('Game API missing');
  }
  // Important: startBattle() only runs while in menu phase. Setting phase to
  // "battle" here would skip syncUnits() and hide unit-group runtime errors.
  globalThis.__maxBattleTime = 0;
  globalThis.__timerText = "";
  globalThis.__simTicks = 0;
  globalThis.__simOutcomes = {wins: 0, losses: 0};
  for (let round = 0; round < 5; round++) {
    G.phase = "menu";
    G.battle = null;
    G.team = [];
    G.teamSize = 4;
    for (let i = 0; i < 4; i++) G.team.push(createUnit("sensenmann", 1, "player"));
    startBattle();
    for (let f = 0; f < 600 && G.battle && G.phase === "battle"; f++) {
      updateVisuals(f * 0.016, 0.016);
      simulateBattle(0.016);
      updateBattleTimer();
      globalThis.__simTicks++;
      if (G.battle) {
        globalThis.__maxBattleTime = Math.max(globalThis.__maxBattleTime, G.battle.time);
        globalThis.__timerText = document.getElementById("battleTimer").textContent;
      }
    }
    if (G.phase === "prep") globalThis.__simOutcomes.wins++;
    else if (G.phase === "defeat") globalThis.__simOutcomes.losses++;
  }
  if (SIM.headless) throw new Error('simulateBattle() hat den Headless-Modus nicht zurückgesetzt');

  G.phase = "menu";
  G.battle = null;
  G.team = [];
  for (let f = 0; f < 60; f++) updateVisuals(f * 0.016, 0.016);

  G.phase = "draft";
  G.team = [createUnit("hotzenplotz", 1, "player"), createUnit("fee", 1, "player")];
  G.battle = null;
  for (let f = 0; f < 60; f++) {
    updateVisuals(f * 0.016, 0.016);
    updateTeamList(); updateHud(); updateButtons(); updateSynergies();
    updateManaBar(); updateUnitInfo();
  }
`, ctx);

const maxBattleTime = vm.runInContext('globalThis.__maxBattleTime', ctx);
const timerText = vm.runInContext('globalThis.__timerText', ctx);
const simTicks = vm.runInContext('globalThis.__simTicks', ctx);
const simOutcomes = vm.runInContext('globalThis.__simOutcomes', ctx);
if (!(maxBattleTime >= 1) || !/^Zeit \d+s$/.test(timerText)) {
  throw new Error(`Timer läuft nicht: max=${maxBattleTime}, text=${timerText}`);
}
if (!(simTicks >= 1) || simOutcomes.wins + simOutcomes.losses < 1) {
  throw new Error(`Kampf-Simulation endet nicht: ticks=${simTicks}, outcomes=${JSON.stringify(simOutcomes)}`);
}

vm.runInContext(`
  G.phase = "menu";
  G.battle = null;
  const cryptKeys = ["bigfoot","chupacabra","yeti","nessie","mothman","ogopogo","jerseydevil","skinwalker","thunderbird","kraken","batsquatch","megalodon"];
  cryptKeys.forEach(k => {
    if (!ROSTER[k] || ROSTER[k].race !== "Krypto") throw new Error("Kryptid fehlt: " + k);
  });
  if (Object.keys(ROSTER).some(k => ROSTER[k].race === "Barbar")) {
    throw new Error("Barbar-Rasse ist noch im Roster");
  }
  G.team = cryptKeys.slice(0,4).map(k => createUnit(k,1,"player"));
  const small = createUnit("yeti",1,"player");
  G.team = cryptKeys.map(k => createUnit(k,1,"player"));
  const big = createUnit("yeti",1,"player");
  globalThis.__stackCheck = big.maxHp > small.maxHp && big.atk > small.atk;
  G.team = cryptKeys.slice(0,4).map(k => createUnit(k,1,"player"));
  const animated = G.team.map(u => makeCharacter(u));
  globalThis.__animCheck =
    typeof poseCharacter === "function" && typeof attackPulse === "function" &&
    animated.every(g => g.userData && Array.isArray(g.userData.limbs) &&
      typeof g.userData.animPhase === "number" && typeof g.userData.walk === "number") &&
    attackPulse({animAttack:0.15},0.3) > 0 && attackPulse({animAttack:0},0.3) === 0 &&
    (function(){
      const u = createUnit("sensenmann",1,"player");
      const g = makeCharacter(u);
      const model = g.userData.model;
      const before = model ? model.rotation.z : g.userData.limbs[0].rotation.x;
      u.hitFlash = 0.15;
      poseCharacter(u,g,1,0.016,1);
      const after = model ? model.rotation.z : g.userData.limbs[0].rotation.x;
      return before !== after;
    })();
  G.phase = "draft";
  updateSynergies();
`, ctx);

if (!vm.runInContext('globalThis.__stackCheck', ctx)) {
  throw new Error('Team-Buffs skalieren nicht mit der Dudes-Anzahl');
}
if (!vm.runInContext('globalThis.__animCheck', ctx)) {
  throw new Error('Animations-System (Idle/Angriff/Treffer) fehlt oder reagiert nicht');
}

vm.runInContext(`
  G.phase = "menu";
  G.battle = null;
  beginRun();
  globalThis.__coreCheck = G.teamSize === 3 && G.team.length === 3 &&
    G.team.map(u => u.key + ":" + u.role).join(",") === "bigfoot:TANK,chupacabra:DPS,fee:HEALER";
  startBattle();
  globalThis.__coreBattleCheck = !!G.battle && G.battle.player.length === 3 && G.battle.enemies.length === 3;
`, ctx);

if (!vm.runInContext('globalThis.__coreCheck', ctx)) {
  throw new Error('Basis-Trio als Startteam fehlt oder hat falsche Rollen');
}
if (!vm.runInContext('globalThis.__coreBattleCheck', ctx)) {
  throw new Error('3-gegen-3-Kampf mit dem Basis-Trio startet nicht');
}

vm.runInContext(`
  G.phase = "draft";
  draftOffer = [];
  const dk = draftKeys();
  globalThis.__draftCheck = dk.length === 3 && new Set(dk).size === 3;
  const goldBefore = G.gold;
  const rolled = rerollDraft();
  globalThis.__rerollCheck = rolled === true && G.gold === goldBefore - 1;
  draftFilterRole = "HEALER";
  draftFilterClass = "ALL";
  draftOffer = [];
  globalThis.__filterRoleCheck = draftKeys().length > 0 && draftKeys().every(k => ROSTER[k].role === "HEALER");
  draftFilterRole = "ALL";
  draftFilterClass = "Kaiju";
  draftOffer = [];
  globalThis.__filterClassCheck = draftKeys().length > 0 && draftKeys().every(k => ROSTER[k].cls === "Kaiju" || ROSTER[k].cls2 === "Kaiju");
  draftFilterRole = "ALL";
  draftFilterClass = "ALL";
  draftOffer = [];
  globalThis.__synergyTextCheck = typeof draftSynergyText === "function" && draftSynergyText().indexOf("Lücken:") === 0;
  G.phase = "menu";
`, ctx);

if (!vm.runInContext('globalThis.__draftCheck', ctx)) {
  throw new Error('Draft liefert nicht genau drei verschiedene Karten');
}
if (!vm.runInContext('globalThis.__rerollCheck', ctx)) {
  throw new Error('Draft-Reroll zieht nicht genau 1 Gold ab');
}
if (!vm.runInContext('globalThis.__filterRoleCheck', ctx)) {
  throw new Error('Draft-Rollenfilter liefert falsche Karten');
}
if (!vm.runInContext('globalThis.__filterClassCheck', ctx)) {
  throw new Error('Draft-Klassenfilter liefert falsche Karten');
}
if (!vm.runInContext('globalThis.__synergyTextCheck', ctx)) {
  throw new Error('Synergie-Hinweis im Draft fehlt');
}

vm.runInContext(`
  G.phase = "menu";
  G.battle = null;
  beginRun();
  globalThis.__itemsInitCheck = G.items.heal === 2 && G.items.shield === 1 && G.items.nova === 1;
  startBattle();
  G.battle.player.forEach(u => { u.hp = u.maxHp; u.shield = 0; });
  const hero = G.battle.player[0];
  hero.hp = hero.maxHp * 0.4;
  const healBefore = G.items.heal;
  globalThis.__healItemCheck = useItem("heal") && G.items.heal === healBefore - 1 && hero.hp > hero.maxHp * 0.4;
  const shieldBefore = G.items.shield;
  const shieldsBefore = G.battle.player.reduce((s,u) => s + u.shield, 0);
  globalThis.__shieldItemCheck = useItem("shield") && G.items.shield === shieldBefore - 1 &&
    G.battle.player.reduce((s,u) => s + u.shield, 0) > shieldsBefore;
  const novaBefore = G.items.nova;
  globalThis.__novaItemCheck = useItem("nova") && G.items.nova === novaBefore - 1;
  G.phase = "menu";
  G.battle = null;
`, ctx);

if (!vm.runInContext('globalThis.__itemsInitCheck', ctx)) {
  throw new Error('Item-Startbestand fehlt');
}
if (!vm.runInContext('globalThis.__healItemCheck', ctx)) {
  throw new Error('Heiltrank heilt keinen verletzten Helden');
}
if (!vm.runInContext('globalThis.__shieldItemCheck', ctx)) {
  throw new Error('Schutzrune gibt keinen Schild');
}
if (!vm.runInContext('globalThis.__novaItemCheck', ctx)) {
  throw new Error('Blitzsplitter verbraucht kein Item');
}

vm.runInContext(`
  const w1 = mobWaveSize(1,"enemy"), w20 = mobWaveSize(20,"enemy"), w40 = mobWaveSize(40,"enemy");
  globalThis.__mobSizeCheck = w1 >= 4 && w20 > w1 && w40 === 500 && mobWaveSize(40,"player") === 500;
  G.phase = "menu";
  G.battle = null;
  G.teamSize = 3;
  G.team = ["bigfoot","chupacabra","fee"].map(k => createUnit(k,1,"player"));
  beginRun();
  G.wave = 40;
  startBattle();
  globalThis.__mobBattleCheck = G.battle.playerMobs.length === mobWaveSize(40,"player") &&
    G.battle.enemyMobs.length === mobWaveSize(40,"enemy") &&
    G.battle.enemyMobs.length > G.team.length &&
    G.battle.playerMobs.length > G.team.length;
  let mobDamaged = false;
  for (let f = 0; f < 600 && G.battle; f++) {
    simulateBattle(0.016);
    if (!G.battle) break;
    if (G.battle.playerMobs.some(m => m.isDead) || G.battle.enemyMobs.some(m => m.isDead)) mobDamaged = true;
  }
  globalThis.__mobAfterCheck = mobDamaged && !SIM.headless;
  G.phase = "menu";
  G.battle = null;
`, ctx);

if (!vm.runInContext('globalThis.__mobSizeCheck', ctx)) {
  throw new Error('Mob-Wellenformel oder 500er-Cap falsch');
}
if (!vm.runInContext('globalThis.__mobBattleCheck', ctx)) {
  throw new Error('Mobs werden nicht auf beiden Seiten bis 500 gespawnt');
}
if (!vm.runInContext('globalThis.__mobAfterCheck', ctx)) {
  throw new Error('Mob-Kampf-Simulation mit 500 Mobs pro Seite läuft nicht');
}

vm.runInContext(`
  G.phase = "menu";
  G.battle = null;
  beginRun();
  G.wave = 10;
  startBattle();
  const em = G.battle.enemyMobs, pm = G.battle.playerMobs;
  globalThis.__bossCheck = em.filter(m => m.isBoss).length === 1 && pm.filter(m => m.isBoss).length === 1 &&
    em.filter(m => m.isElite).length > 0;
  const boss = em.find(m => m.isBoss), normal = em.find(m => !m.isElite && !m.isBoss);
  globalThis.__bossStatsCheck = boss.maxHp > normal.maxHp*3 && boss.atk > normal.atk && boss.scale > normal.scale;
  boss.hp = boss.maxHp * 0.5;
  updateBossBar();
  globalThis.__bossBarCheck = parseFloat(document.getElementById("bossBarFill").style.width) === 50 &&
    document.getElementById("bossBarPct").textContent === "50%";
  const bossBar = document.getElementById("bossBar");
  globalThis.__bossBarShowCheck = bossBar.classList.contains("show") && !bossBar.classList.contains("critical");
  boss.hp = boss.maxHp * 0.2;
  updateBossBar();
  globalThis.__bossBarCriticalCheck = bossBar.classList.contains("show") && bossBar.classList.contains("critical") &&
    parseFloat(document.getElementById("bossBarFill").style.width) === 20 &&
    document.getElementById("bossBarPct").textContent === "20%";
  boss.isDead = true;
  updateBossBar();
  globalThis.__bossBarHideCheck = !bossBar.classList.contains("show") && !bossBar.classList.contains("critical");
  const bossGoldBefore = G.gold;
  const eliteCount = em.filter(m => m.isElite).length;
  winBattle();
  globalThis.__bossGoldCheck = G.gold > bossGoldBefore + 5 + 10*2 + eliteCount*2;
  beginRun();
  G.wave = 5;
  startBattle();
  globalThis.__eliteCheck = G.battle.enemyMobs.some(m => m.isElite) && !G.battle.enemyMobs.some(m => m.isBoss);
  beginRun();
  G.wave = 1;
  startBattle();
  globalThis.__noTierCheck = !G.battle.enemyMobs.some(m => m.isElite || m.isBoss);
  G.phase = "menu";
  G.battle = null;
`, ctx);

if (!vm.runInContext('globalThis.__bossCheck', ctx)) {
  throw new Error('Bosse/Eliten werden nicht auf beiden Seiten gespawnt');
}
if (!vm.runInContext('globalThis.__bossStatsCheck', ctx)) {
  throw new Error('Boss-Werte sind nicht stärker als normale Mobs');
}
if (!vm.runInContext('globalThis.__bossBarCheck', ctx)) {
  throw new Error('Boss-Lebensbalken zeigt nicht die aktuelle Boss-HP');
}
if (!vm.runInContext('globalThis.__bossBarShowCheck', ctx)) {
  throw new Error('Boss-Lebensbalken wird bei sicherer HP nicht normal angezeigt');
}
if (!vm.runInContext('globalThis.__bossBarCriticalCheck', ctx)) {
  throw new Error('Boss-Lebensbalken zeigt keine kritische HP unter 25 %');
}
if (!vm.runInContext('globalThis.__bossBarHideCheck', ctx)) {
  throw new Error('Boss-Lebensbalken verschwindet nicht nach dem Boss-Tod');
}
if (!vm.runInContext('globalThis.__bossGoldCheck', ctx)) {
  throw new Error('Boss/Elite geben keinen Bonus-Gold');
}
if (!vm.runInContext('globalThis.__eliteCheck', ctx)) {
  throw new Error('Elite-Welle ohne Boss fehlt');
}
if (!vm.runInContext('globalThis.__noTierCheck', ctx)) {
  throw new Error('Welle 1 enthält bereits Elite-/Boss-Mobs');
}

vm.runInContext(`
  G.phase = "menu";
  G.battle = null;
  beginRun();
  G.wave = 1;
  startBattle();
  updateBattleStatus();
  const status = document.getElementById("battleStatus");
  const foesStart = parseInt(document.getElementById("statusEnemies").textContent, 10);
  const mobsPlayerStart = G.battle.playerMobs.length;
  const mobsEnemyStart = G.battle.enemyMobs.length;
  globalThis.__statusShowCheck = status.classList.contains("show") &&
    foesStart === sideUnits(G.battle, "enemy").length &&
    document.getElementById("statusFoeHeroes").textContent === G.battle.enemies.length+'/'+G.battle.enemies.length &&
    document.getElementById("statusMobs").textContent === mobsPlayerStart+'/'+mobsEnemyStart &&
    document.getElementById("statusHeroes").textContent === "3/3";
  G.battle.enemyMobs[0].isDead = true;
  G.battle.enemies[0].isDead = true;
  G.battle.player[0].isDead = true;
  updateBattleStatus();
  globalThis.__statusLiveCheck = parseInt(document.getElementById("statusEnemies").textContent, 10) === foesStart - 2 &&
    document.getElementById("statusFoeHeroes").textContent === (G.battle.enemies.length-1)+'/'+G.battle.enemies.length &&
    document.getElementById("statusMobs").textContent === mobsPlayerStart+'/'+(mobsEnemyStart-1) &&
    document.getElementById("statusHeroes").textContent === "2/3";
  G.phase = "menu";
  G.battle = null;
  updateBattleStatus();
  globalThis.__statusHideCheck = !status.classList.contains("show");
`, ctx);

if (!vm.runInContext('globalThis.__statusShowCheck', ctx)) {
  throw new Error('Kampf-Status zeigt nicht Gegner, Gegner-Helden, Mobs und Helden zu Kampfbeginn');
}
if (!vm.runInContext('globalThis.__statusLiveCheck', ctx)) {
  throw new Error('Kampf-Status reagiert nicht auf Tod von Gegner-Helden, Mobs oder Helden');
}
if (!vm.runInContext('globalThis.__statusHideCheck', ctx)) {
  throw new Error('Kampf-Status verschwindet nicht außerhalb des Kampfes');
}

vm.runInContext(`
  G.phase = "menu";
  G.battle = null;
  beginRun();
  G.wave = 1;
  startBattle();
  const alert = document.getElementById("heroAlert");
  const count = document.getElementById("heroAlertCount");
  updateHeroAlert();
  globalThis.__heroAlertHidden = !alert.classList.contains("show");
  const [a, b, c] = G.battle.player;
  a.shield = 0;
  a.hp = a.maxHp * 0.2;
  updateHeroAlert();
  globalThis.__heroAlertOne = alert.classList.contains("show") && count.textContent === "1";
  a.shield = a.maxHp * 0.2;
  b.shield = 0;
  b.hp = b.maxHp * 0.2;
  updateHeroAlert();
  globalThis.__heroAlertShield = alert.classList.contains("show") && count.textContent === "1";
  a.shield = 0;
  a.isDead = true;
  c.shield = 0;
  c.hp = c.maxHp * 0.1;
  updateHeroAlert();
  globalThis.__heroAlertCount = count.textContent === "2";
  G.phase = "menu";
  G.battle = null;
  updateHeroAlert();
  globalThis.__heroAlertHideCheck = !alert.classList.contains("show");
`, ctx);

if (!vm.runInContext('globalThis.__heroAlertHidden', ctx)) {
  throw new Error('Kritische-Helden-Warnung erscheint bei voller HP');
}
if (!vm.runInContext('globalThis.__heroAlertOne', ctx)) {
  throw new Error('Kritische-Helden-Warnung zählt nicht korrekt');
}
if (!vm.runInContext('globalThis.__heroAlertShield', ctx)) {
  throw new Error('Schild wird bei der kritischen-Helden-Warnung ignoriert');
}
if (!vm.runInContext('globalThis.__heroAlertCount', ctx)) {
  throw new Error('Kritische-Helden-Warnung zählt Tote mit oder aktualisiert nicht');
}
if (!vm.runInContext('globalThis.__heroAlertHideCheck', ctx)) {
  throw new Error('Kritische-Helden-Warnung verschwindet nicht außerhalb des Kampfes');
}

vm.runInContext(`
  G.phase = "menu";
  G.battle = null;
  beginRun();
  G.wave = 5;
  startBattle();
  const eliteBar = document.getElementById("eliteAlert");
  const eliteNum = document.getElementById("eliteAlertCount");
  updateEliteAlert();
  const elites = G.battle.enemyMobs.filter(m => m.isElite);
  globalThis.__eliteAlertStart = elites.length > 0 && eliteBar.classList.contains("show") &&
    eliteNum.textContent === String(elites.length);
  elites[0].isDead = true;
  updateEliteAlert();
  globalThis.__eliteAlertLive = eliteNum.textContent === String(elites.length-1);
  elites.forEach(m => { m.isDead = true; });
  updateEliteAlert();
  globalThis.__eliteAlertClear = !eliteBar.classList.contains("show");
  beginRun();
  G.wave = 1;
  startBattle();
  updateEliteAlert();
  globalThis.__eliteAlertWave1 = !eliteBar.classList.contains("show") &&
    G.battle.enemyMobs.every(m => !m.isElite);
  G.phase = "menu";
  G.battle = null;
  updateEliteAlert();
  globalThis.__eliteAlertHide = !eliteBar.classList.contains("show");
`, ctx);

for (const [flag, message] of [
  ['__eliteAlertStart', 'Eliten-Warnung zeigt zu Wellenbeginn keine lebenden Eliten'],
  ['__eliteAlertLive', 'Eliten-Warnung reagiert nicht auf getötete Eliten'],
  ['__eliteAlertClear', 'Eliten-Warnung verschwindet nicht nach dem letzten Eliten'],
  ['__eliteAlertWave1', 'Eliten-Warnung erscheint in Welle 1 ohne Eliten'],
  ['__eliteAlertHide', 'Eliten-Warnung verschwindet nicht außerhalb des Kampfes'],
]) {
  if (!vm.runInContext(`globalThis.${flag}`, ctx)) throw new Error(message);
}

vm.runInContext(`
  G.phase = "menu";
  G.battle = null;
  beginRun();
  G.wave = 1;
  startBattle();
  const heroes = G.battle.player;
  heroes.forEach(u => { u.hp = u.maxHp; u.shield = 0; });
  const hpBar = document.getElementById("teamHpBar");
  const hpFill = document.getElementById("teamHpFill");
  const hpPct = document.getElementById("teamHpPct");
  hpBar.classList.remove("show");
  hpBar.classList.remove("warn");
  hpBar.classList.remove("critical");
  updateTeamHpBar();
  globalThis.__teamHpStart = hpBar.classList.contains("show") && hpPct.textContent === "100%" &&
    parseFloat(hpFill.style.width) === 100 && !hpBar.classList.contains("warn") && !hpBar.classList.contains("critical");
  const totalMax = heroes.reduce((s,u) => s+u.maxHp, 0);
  heroes[0].hp = heroes[0].maxHp * 0.5;
  const expectedDamage = (totalMax - heroes[0].maxHp * 0.5) / totalMax * 100;
  updateTeamHpBar();
  globalThis.__teamHpDamage = Math.abs(parseFloat(hpFill.style.width) - expectedDamage) < 0.2;
  heroes[0].shield = heroes[0].maxHp * 0.5;
  updateTeamHpBar();
  globalThis.__teamHpShield = parseFloat(hpFill.style.width) === 100 && hpPct.textContent === "100%";
  heroes.forEach(u => { u.shield = 0; u.hp = u.maxHp * 0.1; });
  updateTeamHpBar();
  globalThis.__teamHpCritical = hpBar.classList.contains("critical") && !hpBar.classList.contains("warn") &&
    parseFloat(hpFill.style.width) <= 25 && parseFloat(hpPct.textContent) <= 25;
  heroes[0].isDead = true;
  heroes[0].hp = 0;
  heroes.slice(1).forEach(u => { u.hp = u.maxHp; });
  updateTeamHpBar();
  const expectedDead = (totalMax - heroes[0].maxHp) / totalMax * 100;
  globalThis.__teamHpDead = Math.abs(parseFloat(hpFill.style.width) - expectedDead) < 0.2 &&
    hpBar.classList.contains("warn") === (expectedDead <= 50 && expectedDead > 25) &&
    hpBar.classList.contains("critical") === (expectedDead <= 25);
  G.phase = "menu";
  G.battle = null;
  updateTeamHpBar();
  globalThis.__teamHpHide = !hpBar.classList.contains("show") && !hpBar.classList.contains("warn") &&
    !hpBar.classList.contains("critical");
`, ctx);

for (const [flag, message] of [
  ['__teamHpStart', 'Team-HP-Balken startet nicht bei 100 %'],
  ['__teamHpDamage', 'Team-HP-Balken reagiert nicht auf Schaden'],
  ['__teamHpShield', 'Team-HP-Balken berücksichtigt Schilde nicht'],
  ['__teamHpCritical', 'Team-HP-Balken zeigt keine kritische Gesamt-HP'],
  ['__teamHpDead', 'Team-HP-Balken zählt tote Helden falsch'],
  ['__teamHpHide', 'Team-HP-Balken verschwindet nicht außerhalb des Kampfes'],
]) {
  if (!vm.runInContext(`globalThis.${flag}`, ctx)) throw new Error(message);
}

vm.runInContext(`
  G.phase = "menu";
  G.battle = null;
  beginRun();
  const mana = document.getElementById("battleMana");
  const manaFill = document.getElementById("battleManaFill");
  const manaValue = document.getElementById("battleManaValue");
  updateBattleManaBar();
  globalThis.__manaHidden = !mana.classList.contains("show");
  G.wave = 1;
  startBattle();
  G.mana = 40;
  updateBattleManaBar();
  globalThis.__manaShow = mana.classList.contains("show") &&
    parseFloat(manaFill.style.width) === 40 && manaValue.textContent === "40/100";
  G.mana = 70;
  updateBattleManaBar();
  globalThis.__manaLive = parseFloat(manaFill.style.width) === 70 && manaValue.textContent === "70/100";
  G.mana = 0;
  updateBattleManaBar();
  globalThis.__manaEmpty = parseFloat(manaFill.style.width) === 0 && manaValue.textContent === "0/100";
  G.phase = "menu";
  G.battle = null;
  updateBattleManaBar();
  globalThis.__manaHideCheck = !mana.classList.contains("show");
`, ctx);

for (const [flag, message] of [
  ['__manaHidden', 'Mana-Anzeige erscheint außerhalb des Kampfes'],
  ['__manaShow', 'Mana-Anzeige zeigt Startwert nicht an'],
  ['__manaLive', 'Mana-Anzeige reagiert nicht auf Mana-Änderungen'],
  ['__manaEmpty', 'Mana-Anzeige zeigt 0 nicht korrekt an'],
  ['__manaHideCheck', 'Mana-Anzeige verschwindet nicht außerhalb des Kampfes'],
]) {
  if (!vm.runInContext(`globalThis.${flag}`, ctx)) throw new Error(message);
}

vm.runInContext(`
  G.phase = "menu";
  G.battle = null;
  beginRun();
  const goldBar = document.getElementById("battleGold");
  const goldValue = document.getElementById("battleGoldValue");
  updateBattleGold();
  globalThis.__goldHidden = !goldBar.classList.contains("show");
  G.wave = 1;
  startBattle();
  G.gold = 20;
  updateBattleGold();
  globalThis.__goldShow = goldBar.classList.contains("show") && goldValue.textContent === "20";
  G.gold = 47;
  updateBattleGold();
  globalThis.__goldLive = goldBar.classList.contains("show") && goldValue.textContent === "47";
  G.phase = "menu";
  G.battle = null;
  updateBattleGold();
  globalThis.__goldHide = !goldBar.classList.contains("show");
`, ctx);

for (const [flag, message] of [
  ['__goldHidden', 'Gold-Anzeige erscheint außerhalb des Kampfes'],
  ['__goldShow', 'Gold-Anzeige zeigt den Startwert nicht an'],
  ['__goldLive', 'Gold-Anzeige reagiert nicht auf Gold-Änderungen'],
  ['__goldHide', 'Gold-Anzeige verschwindet nicht außerhalb des Kampfes'],
]) {
  if (!vm.runInContext(`globalThis.${flag}`, ctx)) throw new Error(message);
}

vm.runInContext(`
  G.phase = "menu";
  G.battle = null;
  beginRun();
  startBattle();
  initMobMeshes();
  const m = G.battle.enemyMobs[0];
  const tier = m.tier || "normal";
  const mesh = mobMeshes["enemy:"+m.archetype+":"+tier];
  const peers = G.battle.enemyMobs.filter(x => x.archetype === m.archetype &&
    (x.tier || "normal") === tier && !(x.isDead && x.deathTimer <= 0));
  const idx = peers.indexOf(m);
  m.hitFlash = 0;
  mobFrame = 2;
  updateMobVisuals(1,0);
  const before = mesh.instanceMatrix.array.slice(idx*16, idx*16+16);
  m.hitFlash = 0.15;
  mobFrame = 2;
  updateMobVisuals(1,0);
  const after = mesh.instanceMatrix.array.slice(idx*16, idx*16+16);
  globalThis.__mobHitPulseCheck = mobHitPulse({hitFlash:0.15}) === 1 &&
    mobHitPulse({hitFlash:0.075}) > 0.4 && mobHitPulse({hitFlash:0.075}) < 0.6 &&
    mobHitPulse({hitFlash:0}) === 0 && mobHitPulse({}) === 0;
  globalThis.__mobHitVisualCheck = mesh.count > idx &&
    before.some((v,i) => Math.abs(v-after[i]) > 0.005);
  m.hitFlash = 0;
  G.phase = "menu";
  G.battle = null;
`, ctx);

for (const [flag, message] of [
  ['__mobHitPulseCheck', 'Mob-Treffer-Impuls skaliert nicht mit hitFlash'],
  ['__mobHitVisualCheck', 'Mob-Instanz reagiert visuell nicht auf einen Treffer'],
]) {
  if (!vm.runInContext(`globalThis.${flag}`, ctx)) throw new Error(message);
}

vm.runInContext(`
  G.phase = "menu";
  G.battle = null;
  beginRun();
  startBattle();
  const bar = document.getElementById("focusHp");
  const value = document.getElementById("focusHpValue");
  const cdBar = document.getElementById("focusCd");
  const cdValue = document.getElementById("focusCdValue");
  const fx = document.getElementById("focusStatus");
  const name = document.getElementById("focusName");
  const focusHero = G.battle.player[0];
  const spellName = (SPELLS[focusHero.spell]||{}).name || "Zauber";
  G.selectedUnitId = focusHero.id;
  updateFocusHp();
  updateFocusCooldown();
  const startShield = focusHero.shield > 0 ? " ⛨"+Math.ceil(focusHero.shield) : "";
  globalThis.__focusStart = bar.classList.contains("show") &&
    value.textContent === Math.ceil(focusHero.hp)+"/"+Math.ceil(focusHero.maxHp)+startShield &&
    fx.textContent === "" &&
    !bar.classList.contains("warn") && !bar.classList.contains("critical");
  focusHero.spellCd = 2.5;
  updateFocusCooldown();
  globalThis.__focusCdStart = cdBar.classList.contains("show") &&
    !cdBar.classList.contains("ready") &&
    cdValue.textContent === spellName+" 2.5s";
  focusHero.spellCd = 0;
  updateFocusCooldown();
  globalThis.__focusCdReady = cdBar.classList.contains("show") &&
    cdBar.classList.contains("ready") &&
    cdValue.textContent === spellName+" bereit";
  globalThis.__focusName = name.textContent === focusHero.emoji+" "+focusHero.name;
  cycleFocus(1);
  const nextFocus = findUnitById(G.selectedUnitId);
  updateFocusHp();
  globalThis.__focusNameCycle = !!nextFocus && nextFocus.id !== focusHero.id &&
    bar.classList.contains("show") && name.textContent === nextFocus.emoji+" "+nextFocus.name;
  G.selectedUnitId = focusHero.id;
  updateFocusHp();
  focusHero.hp = focusHero.maxHp * 0.4;
  focusHero.shield = 0;
  updateFocusHp();
  globalThis.__focusDamage = bar.classList.contains("warn") && !bar.classList.contains("critical") &&
    value.textContent === Math.ceil(focusHero.hp)+"/"+Math.ceil(focusHero.maxHp);
  focusHero.shield = focusHero.maxHp * 0.2;
  updateFocusHp();
  globalThis.__focusShield = bar.classList.contains("show") &&
    value.textContent === Math.ceil(focusHero.hp)+"/"+Math.ceil(focusHero.maxHp)+" ⛨"+Math.ceil(focusHero.shield);
  focusHero.statuses = {burn:3, slow:1, unknown:9};
  updateFocusHp();
  globalThis.__focusStatus = fx.textContent === "🔥3s ❄1s";
  focusHero.statuses = {};
  updateFocusHp();
  globalThis.__focusStatusClear = fx.textContent === "";
  focusHero.hp = focusHero.maxHp * 0.1;
  focusHero.shield = 0;
  updateFocusHp();
  globalThis.__focusCritical = bar.classList.contains("critical") && !bar.classList.contains("warn");
  focusHero.isDead = true;
  updateFocusHp();
  globalThis.__focusDeadHidden = !bar.classList.contains("show") && fx.textContent === "";
  updateFocusCooldown();
  globalThis.__focusCdDeadHidden = !cdBar.classList.contains("show");
  focusHero.isDead = false;
  G.phase = "menu";
  G.battle = null;
  updateFocusHp();
  globalThis.__focusHide = !bar.classList.contains("show") && !bar.classList.contains("warn") &&
    !bar.classList.contains("critical") && fx.textContent === "";
  updateFocusCooldown();
  globalThis.__focusCdHide = !cdBar.classList.contains("show") && !cdBar.classList.contains("ready");
  globalThis.__focusNameReset = name.textContent === "Fokus";
`, ctx);

for (const [flag, message] of [
  ['__focusStart', 'Fokus-HP-Anzeige zeigt zu Kampfbeginn keine volle HP'],
  ['__focusCdStart', 'Fokus-Cooldown zeigt den Zauber und die Restzeit nicht'],
  ['__focusCdReady', 'Fokus-Cooldown zeigt keinen bereiten Zauber an'],
  ['__focusName', 'Fokus-HP-Anzeige zeigt nicht den Namen des fokussierten Wesens'],
  ['__focusNameCycle', 'Fokusname aktualisiert sich nicht nach der ◀/▶-Navigation'],
  ['__focusNameReset', 'Fokusname wird außerhalb des Kampfes nicht zurückgesetzt'],
  ['__focusDamage', 'Fokus-HP-Anzeige reagiert nicht auf Schaden'],
  ['__focusShield', 'Fokus-HP-Anzeige zeigt den Schild nicht'],
  ['__focusStatus', 'Fokus-Anzeige zeigt aktive Statuseffekte nicht'],
  ['__focusStatusClear', 'Fokus-Anzeige löscht abgelaufene Statuseffekte nicht'],
  ['__focusCritical', 'Fokus-HP-Anzeige markiert kritische HP nicht'],
  ['__focusDeadHidden', 'Fokus-HP-Anzeige bleibt bei einem toten Fokus sichtbar'],
  ['__focusCdDeadHidden', 'Fokus-Cooldown bleibt bei einem toten Fokus sichtbar'],
  ['__focusHide', 'Fokus-HP-Anzeige verschwindet nicht außerhalb des Kampfes'],
  ['__focusCdHide', 'Fokus-Cooldown verschwindet nicht außerhalb des Kampfes'],
]) {
  if (!vm.runInContext(`globalThis.${flag}`, ctx)) throw new Error(message);
}

console.log(`Runtime OK: ${path.relative(root, htmlPath)} (menu, sim ${simTicks} ticks/${simOutcomes.wins}W-${simOutcomes.losses}L, core trio, mobs 500/500, elite/boss+bossbar, kampfstatus+mobs+heldenwarnung+elitenwarnung+teamHp+mana+gold+fokusHp+fokusName+fokusStatus+fokusCd, mob-treffer-impuls, draft3+reroll+filter, items, krypto, stacks, bossbar-crit, timer ${timerText})`);
