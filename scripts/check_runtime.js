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
// Deterministischer Zufall: wechselnde Gegner-Kombinationen duerfen den
// Smoke-Test nicht flaky machen (CI muss reproduzierbar gruen bleiben).
function seededMath(seed) {
  let s = seed >>> 0;
  const random = () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
  return Object.create(Math, {random: {value: random}});
}

const ctx = {
  console, document: documentObj, window: windowObj,
  performance: {now: () => Date.now()},
  requestAnimationFrame: () => 1, cancelAnimationFrame() {},
  setTimeout, clearTimeout, setInterval, clearInterval,
  Math: seededMath(1), Date, JSON, Object, Array, String, Number, Boolean,
  Promise, RegExp, Error, TypeError, RangeError, Reflect,
  navigator: {userAgent: 'check-runtime'}, devicePixelRatio: 2,
};
ctx.globalThis = ctx;
ctx.self = ctx;
vm.createContext(ctx);

const html = fs.readFileSync(htmlPath, 'utf8');
const match = html.match(/<script>([\s\S]*?)<\/script>/);
if (!match) throw new Error(`Kein <script>-Block in ${htmlPath} gefunden`);
if (!/\.battle-bar\{[^}]*rgba\(17,22,30,\.42\)/.test(html) || !/\.battle-bar\{[^}]*backdrop-filter:blur/.test(html)) {
  throw new Error('Kampfleiste verdeckt das Schlachtfeld (nicht transluzent)');
}
if (!/body\.battle-mode\s+\.battle-bar\s*\{[^}]*display:\s*flex/.test(html)) {
  throw new Error('Kampfleiste wird im Kampfmodus nicht eingeblendet (body.battle-mode .battle-bar)');
}
if (!/body\.battle-mode\s+\.toasts\s*\{[^}]*top:\s*\d+px[^}]*bottom:\s*auto/.test(html)) {
  throw new Error('Toasts überlagern im Kampfmodus die Kampfleiste (body.battle-mode .toasts fehlt)');
}
if (!html.includes('const TOAST_MAX = 3;') || !html.includes('const TOAST_DEDUP_MS = 700;') ||
    !html.includes('toastLog.shift().node.remove()')) {
  throw new Error('Toast-Begrenzung (maximal drei, keine Doppelmeldungen) fehlt');
}
if (!html.includes('id="battleTimer"') || !html.includes('function updateBattleTimer')) {
  throw new Error('Kampf-Timer fehlt');
}
if (!html.includes('id="bossBar"') || !html.includes('function updateBossBar')) {
  throw new Error('Boss-Lebensbalken in der Kampfleiste fehlt');
}
if (!html.includes('id="playerBossBar"') || !html.includes('function updatePlayerBossBar')) {
  throw new Error('Eigener Boss-Lebensbalken in der Kampfleiste fehlt');
}
if (!html.includes('addShake(0.35)') || !html.includes('Gegner-Boss besiegt!') ||
    !html.includes('Team-Boss gefallen!')) {
  throw new Error('Boss-Tod-Feedback (Shake/Hinweis) fehlt');
}
if (!html.includes('const targetRing = new THREE.Mesh(') || !html.includes('targetRing.visible = true')) {
  throw new Error('Zielmarkierung des fokussierten Wesens im 3D-Feld fehlt');
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
if (!html.includes('id="btnBattleHeal">Heilregen (40)</button>') || !html.includes('id="btnBattleNova">Blitz (70)</button>')) {
  throw new Error('Kampf-Buttons zeigen Manakosten nicht an');
}
if (!html.includes('renderer.setSize(w,h);')) {
  throw new Error('Renderer setzt die CSS-Größe nicht (Canvas wird auf HiDPI zu groß dargestellt)');
}
for (const id of ['mdRoleFilters', 'mdClassFilter', 'mdSynergy', 'hudItems', 'btnItemHeal', 'btnItemShield', 'btnItemNova', 'battleStatus', 'statusEnemies', 'statusFoeHeroes', 'statusMobs', 'statusHeroes', 'eliteInfo', 'statusElites', 'eliteInfoPlayer', 'statusElitesPlayer', 'battleKills', 'battleKillsValue', 'heroAlert', 'heroAlertCount', 'teamHpBar', 'teamHpFill', 'teamHpPct', 'enemyHpBar', 'enemyHpFill', 'enemyHpPct', 'battleMana', 'battleManaFill', 'battleManaValue', 'manaHealReady', 'manaNovaReady', 'battleGold', 'battleGoldValue', 'battleGoldGain', 'battleDudes', 'battleDudesValue', 'focusHp', 'focusName', 'focusHpValue', 'focusStatus', 'focusCd', 'focusCdValue', 'focusAtkValue', 'focusMeta', 'focusTarget', 'focusTargetName', 'focusTargetHp', 'focusTargetAtk', 'focusTargetStatus', 'playerBossBar', 'playerBossBarFill', 'playerBossBarPct']) {
  if (!html.includes(`id="${id}"`)) throw new Error(`Neues UI-Element fehlt: ${id}`);
}
// Toasts werden im Headless-Modus unterdrückt. Der Zähler macht das prüfbar,
// ohne auf das Aussehen des echten DOM-Containers angewiesen zu sein.
const toastBox = documentObj.getElementById('toasts');
const originalToastAppend = toastBox.appendChild;
ctx.__toastAppends = 0;
toastBox.appendChild = function (...args) {
  ctx.__toastAppends++;
  return originalToastAppend.apply(this, args);
};

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
  globalThis.__minMeetDist = 99;
  globalThis.__headlessClean = true;
  globalThis.__stoneTiles = arena.children.filter(o => o.material && o.material.map).length;
  globalThis.__fullGround = arena.children.some(o => o.geometry && o.geometry.parameters
    && o.geometry.parameters.width > 100 && o.material && o.material.map);
  for (let round = 0; round < 5; round++) {
    G.phase = "menu";
    G.battle = null;
    G.team = [];
    G.teamSize = 4;
    for (let i = 0; i < 4; i++) G.team.push(createUnit("sensenmann", 1, "player"));
    startBattle();
    for (let f = 0; f < 600 && G.battle && G.phase === "battle"; f++) {
      updateVisuals(f * 0.016, 0.016);
      // Headless darf weder 3D-Effekte noch Toasts erzeugen: sonst bläht der
      // Smoke-Test den FX-Layer auf und verdeckt echte UI-Fehler.
      const fxBefore = G.effects.length;
      const particlesBefore = G.particles.length;
      const wavesBefore = G.shockwaves.length;
      const toastsBefore = globalThis.__toastAppends;
      simulateBattle(0.016);
      if (G.effects.length > fxBefore || G.particles.length > particlesBefore ||
          G.shockwaves.length > wavesBefore || globalThis.__toastAppends > toastsBefore) {
        globalThis.__headlessClean = false;
      }
      updateBattleTimer();
      globalThis.__simTicks++;
      if (G.battle) {
        globalThis.__maxBattleTime = Math.max(globalThis.__maxBattleTime, G.battle.time);
        globalThis.__timerText = document.getElementById("battleTimer").textContent;
        // Begegnungs-Check: Helden und Gegner duerfen nicht auf ihren Seiten
        // stehen bleiben, sondern muessen sich auf dem Feld annaehern.
        for (const p of G.battle.player.filter(u => !u.isDead)) {
          for (const e of G.battle.enemies.filter(u => !u.isDead)) {
            const d = Math.hypot(p.grid.gx-e.grid.gx, p.grid.gy-e.grid.gy);
            if (d < globalThis.__minMeetDist) globalThis.__minMeetDist = d;
          }
        }
      }
    }
    if (G.phase === "prep") globalThis.__simOutcomes.wins++;
    else if (G.phase === "defeat") globalThis.__simOutcomes.losses++;
  }
  if (SIM.headless) throw new Error('simulateBattle() hat den Headless-Modus nicht zurückgesetzt');
  // Gegenprobe: außerhalb des Headless-Modus muss ein Toast sichtbar werden,
  // sonst wäre der Headless-Check wirkungslos (stummer Zähler).
  const probeToasts = globalThis.__toastAppends;
  showToast("headless-probe");
  globalThis.__toastProbeWorks = globalThis.__toastAppends === probeToasts + 1;
  if (!(globalThis.__minMeetDist < 2)) {
    throw new Error('Einheiten begegnen sich nicht auf dem Feld: minDist='+globalThis.__minMeetDist);
  }
  if (!(globalThis.__stoneTiles >= 40)) {
    throw new Error('Steinboden fehlt: tiles='+globalThis.__stoneTiles);
  }
  if (!globalThis.__fullGround) {
    throw new Error('Steinboden bedeckt nicht den ganzen Bildschirm');
  }

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
if (!vm.runInContext('globalThis.__toastProbeWorks', ctx)) {
  throw new Error('Toast-Zähler für den Headless-Check ist wirkungslos');
}
if (!vm.runInContext('globalThis.__headlessClean', ctx)) {
  throw new Error('simulateBattle() erzeugt trotz SIM.headless Effekte, Partikel, Schockwellen oder Toasts');
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
  const barUnit = createUnit("bigfoot",1,"player");
  const barGroup = makeCharacter(barUnit);
  barUnit.hp = barUnit.maxHp*0.5;
  const firstBar = hpBarRatio(barUnit,barGroup,0.016);
  let settledBar = firstBar;
  for (let i = 0; i < 40; i++) settledBar = hpBarRatio(barUnit,barGroup,0.016);
  globalThis.__hpBarEaseCheck = firstBar > 0.5 && firstBar < 1 &&
    settledBar < firstBar && Math.abs(settledBar-0.5) < 0.01;
`, ctx);

if (!vm.runInContext('globalThis.__hpBarEaseCheck', ctx)) {
  throw new Error('3D-Lebensbalken springt statt weich zu folgen');
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
  globalThis.__foeOnlyCheck = Object.keys(ENEMY_ONLY).length === 18 &&
    Object.keys(ENEMY_ONLY).every(k => ROSTER[k] && ROSTER[k].ability === "biss" &&
      FOE_KEYS.includes(k) && !ALL_KEYS.includes(k));
  let foeLeak = false;
  for (let i = 0; i < 20; i++) {
    draftOffer = [];
    if (draftKeys().some(k => ENEMY_ONLY[k])) foeLeak = true;
  }
  globalThis.__foeDraftLeak = foeLeak;
  let monsterLeak = false;
  for (let i = 0; i < 20; i++) {
    const used = {};
    const roles = ["TANK", "DPS", "BUFFER", "HEALER"];
    for (let j = 0; j < roles.length; j++) {
      const key = enemyKeyFor({race: "Kaiju", cls: "Kaiju", cls2: "Element"}, used, roles[j]);
      if (!ENEMY_ONLY[key]) monsterLeak = true;
    }
  }
  globalThis.__foeMonsterLeak = monsterLeak;
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
if (!vm.runInContext('globalThis.__foeOnlyCheck', ctx)) {
  throw new Error('Zivile Gegner-Wesen fehlen oder liegen im Spielerpool');
}
if (vm.runInContext('globalThis.__foeDraftLeak', ctx)) {
  throw new Error('Gegner-Wesen tauchen im Draft auf');
}
if (vm.runInContext('globalThis.__foeMonsterLeak', ctx)) {
  throw new Error('Gegnerteams enthalten noch Monster aus dem Spielerpool');
}

if (!html.includes('Lv ${previewLevel} · HP ${preview.hp} · ATK ${preview.atk}')) {
  throw new Error('Draft-Karten zeigen kein Level und keine skalierten Werte');
}
vm.runInContext(`
  G.phase = "draft";
  G.team = [createUnit("bigfoot",3,"player"), createUnit("fee",2,"player")];
  const lvl = draftPickLevel();
  const low = draftPreviewStats("bigfoot",1);
  const high = draftPreviewStats("bigfoot",lvl);
  renderDraftCards();
  globalThis.__draftLevelCheck = lvl === 3 && low.hp === ROSTER.bigfoot.hp &&
    high.hp === Math.round(ROSTER.bigfoot.hp*1.6) && high.hp > low.hp && high.atk > low.atk;
  G.team = [];
  globalThis.__draftLevelReset = draftPickLevel() === 1;
  G.phase = "menu";
`, ctx);
if (!vm.runInContext('globalThis.__draftLevelCheck', ctx)) {
  throw new Error('Draft-Vorschau skaliert nicht mit dem Teamlevel');
}
if (!vm.runInContext('globalThis.__draftLevelReset', ctx)) {
  throw new Error('Draft-Picklevel fällt ohne Team nicht auf 1 zurück');
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

// Statuseffekte sind zentral fuer Buffs/Debuffs, waren aber ungetestet:
// sie muessen herabzaehlen, stillen Brand-Schaden verursachen und ablaufen.
vm.runInContext(`
  G.phase = "menu";
  G.battle = null;
  clearEffects();
  const statusUnit = createUnit("fee", 1, "player");
  statusUnit.shield = 0;
  addStatus(statusUnit, "burn", 0.4, 0.05);
  addStatus(statusUnit, "slow", 1.2, 0.3);
  addStatus(statusUnit, "unknown", 2, 1);
  globalThis.__statusApplied = hasStatus(statusUnit, "burn") && hasStatus(statusUnit, "slow") &&
    activeStatusKeys(statusUnit).sort().join(",") === "burn,slow";
  const statusHpBefore = statusUnit.hp;
  const statusFxBefore = G.effects.length;
  tickUnit(statusUnit, 0.2, null);
  globalThis.__statusTick = statusUnit.statuses.burn < 0.4 &&
    Math.abs(statusUnit.statuses.slow - 1) < 0.001 &&
    statusUnit.hp < statusHpBefore && G.effects.length === statusFxBefore;
  tickUnit(statusUnit, 0.3, null);
  globalThis.__statusExpired = !hasStatus(statusUnit, "burn") && hasStatus(statusUnit, "slow") &&
    activeStatusKeys(statusUnit).indexOf("burn") < 0;
  clearStatuses(statusUnit);
  globalThis.__statusClear = !hasStatus(statusUnit, "slow") && activeStatusKeys(statusUnit).length === 0;
  clearEffects();
`, ctx);

for (const [flag, message] of [
  ['__statusApplied', 'Statuseffekte werden nicht gesetzt oder unbekannte erscheinen'],
  ['__statusTick', 'Statuseffekte zaehlen nicht herab oder Brand verursacht keinen stillen Schaden'],
  ['__statusExpired', 'Abgelaufene Statuseffekte bleiben aktiv'],
  ['__statusClear', 'Statuseffekte werden nicht vollstaendig entfernt'],
]) {
  if (!vm.runInContext(`globalThis.${flag}`, ctx)) throw new Error(message);
}

vm.runInContext(`
  G.phase = "menu";
  G.battle = null;
  beginRun();
  startBattle();
  const healBtn = document.getElementById("btnItemHeal");
  G.items.heal = 1;
  G.battle.player.forEach(u => { u.hp = u.maxHp; u.shield = 0; u.isDead = false; });
  updateButtons();
  globalThis.__healBtnFull = healBtn.disabled === true && /voller HP/.test(healBtn.title);
  G.battle.player[0].hp = G.battle.player[0].maxHp * 0.5;
  updateButtons();
  globalThis.__healBtnWounded = healBtn.disabled === false && /35 %/.test(healBtn.title);
  const fullItemCount = G.items.heal;
  G.battle.player[0].hp = G.battle.player[0].maxHp;
  updateButtons();
  globalThis.__healBtnNoConsume = healBtn.disabled === true && useItem("heal") === false && G.items.heal === fullItemCount;
  G.items.heal = 0;
  G.battle.player[0].hp = G.battle.player[0].maxHp * 0.5;
  updateButtons();
  globalThis.__healBtnEmpty = healBtn.disabled === true;
  G.battle.player.forEach(u => { u.hp = u.maxHp; u.shield = 0; });
  // Der verwundete Held hat viel Schild, ein anderer ist bei voller HP ohne
  // Schild: die Zielwahl darf nicht vom Schild irritiert werden.
  const wounded = G.battle.player[0];
  wounded.hp = wounded.maxHp * 0.4;
  wounded.shield = wounded.maxHp * 0.8;
  const hpBefore = wounded.hp;
  G.items.heal = 2;
  const potionsBefore = G.items.heal;
  const healToasts = [];
  const origHealToast = showToast;
  showToast = function(msg){ healToasts.push(msg); };
  let healUsed = false;
  try { healUsed = useItem("heal"); } finally { showToast = origHealToast; }
  const actualHeal = Math.round(wounded.hp - hpBefore);
  globalThis.__healTargetCheck = healUsed && G.items.heal === potionsBefore - 1 && actualHeal > 0;
  globalThis.__healToastCheck = healToasts.length === 1 &&
    healToasts[0] === "Heiltrank "+wounded.emoji+" +"+actualHeal+" HP";
  G.phase = "menu";
  G.battle = null;
`, ctx);

if (!vm.runInContext('globalThis.__healBtnFull', ctx)) {
  throw new Error('Trank-Button ist bei voller HP nicht deaktiviert und erklärt nicht den Grund');
}
if (!vm.runInContext('globalThis.__healBtnWounded', ctx)) {
  throw new Error('Trank-Button bleibt bei verwundetem Helden deaktiviert');
}
if (!vm.runInContext('globalThis.__healBtnNoConsume', ctx)) {
  throw new Error('Wirkungsloser Heiltrank wird doch verbraucht');
}
if (!vm.runInContext('globalThis.__healBtnEmpty', ctx)) {
  throw new Error('Trank-Button ist ohne Trank aktiv');
}
if (!vm.runInContext('globalThis.__healTargetCheck', ctx)) {
  throw new Error('Heiltrank trifft nicht den verwundeten Helden');
}
if (!vm.runInContext('globalThis.__healToastCheck', ctx)) {
  throw new Error('Heiltrank-Toast zeigt nicht die tatsächliche Heilung');
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
    document.getElementById("bossBarPct").textContent === "50%" &&
    document.getElementById("bossBarHp").textContent === Math.ceil(boss.maxHp * 0.5)+'/'+Math.ceil(boss.maxHp);
  const bossBar = document.getElementById("bossBar");
  globalThis.__bossBarShowCheck = bossBar.classList.contains("show") && !bossBar.classList.contains("critical");
  boss.hp = boss.maxHp * 0.2;
  updateBossBar();
  globalThis.__bossBarCriticalCheck = bossBar.classList.contains("show") && bossBar.classList.contains("critical") &&
    parseFloat(document.getElementById("bossBarFill").style.width) === 20 &&
    document.getElementById("bossBarPct").textContent === "20%" &&
    document.getElementById("bossBarHp").textContent === Math.ceil(boss.maxHp * 0.2)+'/'+Math.ceil(boss.maxHp);
  boss.isDead = true;
  updateBossBar();
  globalThis.__bossBarHideCheck = !bossBar.classList.contains("show") && !bossBar.classList.contains("critical");
  const ownBoss = pm.find(m => m.isBoss);
  const ownBossBar = document.getElementById("playerBossBar");
  ownBoss.hp = ownBoss.maxHp * 0.5;
  updatePlayerBossBar();
  globalThis.__ownBossBarCheck = parseFloat(document.getElementById("playerBossBarFill").style.width) === 50 &&
    document.getElementById("playerBossBarPct").textContent === "50%" &&
    document.getElementById("playerBossBarHp").textContent === Math.ceil(ownBoss.maxHp * 0.5)+'/'+Math.ceil(ownBoss.maxHp);
  globalThis.__ownBossBarShowCheck = ownBossBar.classList.contains("show") && !ownBossBar.classList.contains("critical");
  ownBoss.hp = ownBoss.maxHp * 0.2;
  updatePlayerBossBar();
  globalThis.__ownBossBarCriticalCheck = ownBossBar.classList.contains("critical") &&
    parseFloat(document.getElementById("playerBossBarFill").style.width) === 20 &&
    document.getElementById("playerBossBarHp").textContent === Math.ceil(ownBoss.maxHp * 0.2)+'/'+Math.ceil(ownBoss.maxHp);
  ownBoss.isDead = true;
  updatePlayerBossBar();
  globalThis.__ownBossBarHideCheck = !ownBossBar.classList.contains("show") && !ownBossBar.classList.contains("critical");
  const bossGoldBefore = G.gold;
  const eliteCount = em.filter(m => m.isElite).length;
  winBattle();
  globalThis.__bossGoldCheck = G.gold > bossGoldBefore + 5 + 10*2 + eliteCount*2;
  beginRun();
  G.wave = 5;
  startBattle();
  globalThis.__eliteCheck = G.battle.enemyMobs.some(m => m.isElite) && !G.battle.enemyMobs.some(m => m.isBoss);
  beginRun();
  clearEffects();
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
if (!vm.runInContext('globalThis.__ownBossBarCheck', ctx)) {
  throw new Error('Eigener Boss-Lebensbalken zeigt nicht die aktuelle Boss-HP');
}
if (!vm.runInContext('globalThis.__ownBossBarShowCheck', ctx)) {
  throw new Error('Eigener Boss-Lebensbalken wird bei sicherer HP nicht normal angezeigt');
}
if (!vm.runInContext('globalThis.__ownBossBarCriticalCheck', ctx)) {
  throw new Error('Eigener Boss-Lebensbalken zeigt keine kritische HP unter 25 %');
}
if (!vm.runInContext('globalThis.__ownBossBarHideCheck', ctx)) {
  throw new Error('Eigener Boss-Lebensbalken verschwindet nicht nach dem Boss-Tod');
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
  const killBar = document.getElementById("battleKills");
  const killValue = document.getElementById("battleKillsValue");
  updateBattleKills();
  globalThis.__killsHidden = !killBar.classList.contains("show");
  G.wave = 1;
  startBattle();
  const killsTotal = G.battle.enemies.length + G.battle.enemyMobs.length;
  updateBattleKills();
  globalThis.__killsStart = killBar.classList.contains("show") && killValue.textContent === "0/"+killsTotal;
  killUnit(G.battle.enemies[0], null);
  killUnit(G.battle.enemyMobs[0], null);
  updateBattleKills();
  globalThis.__killsLive = killValue.textContent === "2/"+killsTotal;
  killUnit(G.battle.player[0], null);
  updateBattleKills();
  globalThis.__killsAllyIgnored = killValue.textContent === "2/"+killsTotal;
  G.phase = "menu";
  G.battle = null;
  updateBattleKills();
  globalThis.__killsHide = !killBar.classList.contains("show");
`, ctx);

for (const [flag, message] of [
  ['__killsHidden', 'Besiegte-Gegner-Anzeige erscheint außerhalb des Kampfes'],
  ['__killsStart', 'Besiegte-Gegner-Anzeige zeigt nicht den Startwert 0/Gesamt'],
  ['__killsLive', 'Besiegte-Gegner-Anzeige zählt besiegte Gegner nicht'],
  ['__killsAllyIgnored', 'Besiegte-Gegner-Anzeige zählt gefallene Helden fälschlich mit'],
  ['__killsHide', 'Besiegte-Gegner-Anzeige verschwindet nicht außerhalb des Kampfes'],
]) {
  if (!vm.runInContext(`globalThis.${flag}`, ctx)) throw new Error(message);
}

vm.runInContext(`
  G.phase = "menu";
  G.battle = null;
  beginRun();
  G.wave = 1;
  startBattle();
  updateBattleStatus();
  const eliteInfo = document.getElementById("eliteInfo");
  const eliteInfoPlayer = document.getElementById("eliteInfoPlayer");
  globalThis.__eliteHiddenWave1 = !eliteInfo.classList.contains("show") &&
    document.getElementById("statusElites").textContent === "0/0";
  globalThis.__elitePlayerHiddenWave1 = !eliteInfoPlayer.classList.contains("show") &&
    document.getElementById("statusElitesPlayer").textContent === "0/0";
  G.phase = "menu";
  G.battle = null;
  beginRun();
  G.wave = 5;
  startBattle();
  const elites = G.battle.enemyMobs.filter(m => m.isElite);
  const ownElites = G.battle.playerMobs.filter(m => m.isElite);
  updateBattleStatus();
  const eliteTotal = elites.length;
  const ownEliteTotal = ownElites.length;
  globalThis.__eliteShow = eliteTotal > 0 && eliteInfo.classList.contains("show") &&
    document.getElementById("statusElites").textContent === eliteTotal+'/'+eliteTotal;
  globalThis.__elitePlayerShow = ownEliteTotal > 0 && eliteInfoPlayer.classList.contains("show") &&
    document.getElementById("statusElitesPlayer").textContent === ownEliteTotal+'/'+ownEliteTotal;
  elites[0].isDead = true;
  ownElites[0].isDead = true;
  updateBattleStatus();
  globalThis.__eliteLive = document.getElementById("statusElites").textContent === (eliteTotal-1)+'/'+eliteTotal &&
    eliteInfo.classList.contains("show");
  globalThis.__elitePlayerLive = document.getElementById("statusElitesPlayer").textContent === (ownEliteTotal-1)+'/'+ownEliteTotal &&
    eliteInfoPlayer.classList.contains("show");
  G.phase = "menu";
  G.battle = null;
  updateBattleStatus();
  globalThis.__eliteHide = !eliteInfo.classList.contains("show");
  globalThis.__elitePlayerHide = !eliteInfoPlayer.classList.contains("show");
`, ctx);

if (!vm.runInContext('globalThis.__eliteHiddenWave1', ctx)) {
  throw new Error('Eliten-Zähler erscheint in Welle 1 ohne Eliten');
}
if (!vm.runInContext('globalThis.__elitePlayerHiddenWave1', ctx)) {
  throw new Error('Eigener Eliten-Zähler erscheint in Welle 1 ohne Eliten');
}
if (!vm.runInContext('globalThis.__eliteShow', ctx)) {
  throw new Error('Eliten-Zähler zeigt die gegnerischen Eliten nicht');
}
if (!vm.runInContext('globalThis.__elitePlayerShow', ctx)) {
  throw new Error('Eigener Eliten-Zähler zeigt die eigenen Eliten nicht');
}
if (!vm.runInContext('globalThis.__eliteLive', ctx)) {
  throw new Error('Eliten-Zähler reagiert nicht auf getötete Eliten');
}
if (!vm.runInContext('globalThis.__elitePlayerLive', ctx)) {
  throw new Error('Eigener Eliten-Zähler reagiert nicht auf getötete Eliten');
}
if (!vm.runInContext('globalThis.__eliteHide', ctx)) {
  throw new Error('Eliten-Zähler verschwindet nicht außerhalb des Kampfes');
}
if (!vm.runInContext('globalThis.__elitePlayerHide', ctx)) {
  throw new Error('Eigener Eliten-Zähler verschwindet nicht außerhalb des Kampfes');
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
  const critRing = unitGroups.get(a.id).userData.teamRing;
  updateVisuals(0.4, 0.016);
  globalThis.__critRingOff = critRing.material.color.getHex() === 0x67e8f9 && critRing.scale.x === 1;
  a.shield = 0;
  a.hp = a.maxHp * 0.2;
  updateHeroAlert();
  updateVisuals(0.4, 0.016);
  globalThis.__heroAlertOne = alert.classList.contains("show") && count.textContent === "1";
  globalThis.__critRingOn = critRing.material.color.getHex() === 0xff2d2d &&
    critRing.material.opacity > 0.6 && critRing.scale.x > 1;
  a.shield = a.maxHp * 0.2;
  updateVisuals(0.4, 0.016);
  globalThis.__critRingShield = critRing.material.color.getHex() === 0x67e8f9 && critRing.scale.x === 1;
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
if (!vm.runInContext('globalThis.__critRingOff', ctx)) {
  throw new Error('Bodenring gesunder Helden ist nicht normal');
}
if (!vm.runInContext('globalThis.__critRingOn', ctx)) {
  throw new Error('Kritischer Held bekommt keinen pulsierenden roten Bodenring im 3D');
}
if (!vm.runInContext('globalThis.__critRingShield', ctx)) {
  throw new Error('Bodenring ignoriert den Schild eines kritischen Helden');
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
  const hpValue = document.getElementById("teamHpValue");
  const hpPct = document.getElementById("teamHpPct");
  hpBar.classList.remove("show");
  hpBar.classList.remove("warn");
  hpBar.classList.remove("critical");
  updateTeamHpBar();
  const totalMax = heroes.reduce((s,u) => s+u.maxHp, 0);
  globalThis.__teamHpStart = hpBar.classList.contains("show") && hpPct.textContent === "100%" &&
    hpValue.textContent === Math.ceil(totalMax)+"/"+Math.ceil(totalMax) &&
    parseFloat(hpFill.style.width) === 100 && !hpBar.classList.contains("warn") && !hpBar.classList.contains("critical");
  heroes[0].hp = heroes[0].maxHp * 0.5;
  const expectedDamage = (totalMax - heroes[0].maxHp * 0.5) / totalMax * 100;
  updateTeamHpBar();
  globalThis.__teamHpDamage = Math.abs(parseFloat(hpFill.style.width) - expectedDamage) < 0.2 &&
    hpValue.textContent === Math.ceil(totalMax - heroes[0].maxHp * 0.5)+"/"+Math.ceil(totalMax);
  heroes[0].shield = heroes[0].maxHp * 0.5;
  updateTeamHpBar();
  globalThis.__teamHpShield = parseFloat(hpFill.style.width) === 100 && hpPct.textContent === "100%" &&
    hpValue.textContent === Math.ceil(totalMax)+"/"+Math.ceil(totalMax);
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
    hpValue.textContent === Math.ceil(totalMax - heroes[0].maxHp)+"/"+Math.ceil(totalMax) &&
    hpBar.classList.contains("warn") === (expectedDead <= 50 && expectedDead > 25) &&
    hpBar.classList.contains("critical") === (expectedDead <= 25);
  G.phase = "menu";
  G.battle = null;
  updateTeamHpBar();
  globalThis.__teamHpHide = !hpBar.classList.contains("show") && !hpBar.classList.contains("warn") &&
    !hpBar.classList.contains("critical") && hpValue.textContent === "0/0";
`, ctx);

for (const [flag, message] of [
  ['__teamHpStart', 'Team-HP-Balken startet nicht bei 100 % und exakten Team-HP'],
  ['__teamHpDamage', 'Team-HP-Balken reagiert nicht auf Schaden'],
  ['__teamHpShield', 'Team-HP-Balken berücksichtigt Schilde nicht'],
  ['__teamHpCritical', 'Team-HP-Balken zeigt keine kritische Gesamt-HP'],
  ['__teamHpDead', 'Team-HP-Balken zählt tote Helden falsch oder zeigt falsche exakte HP'],
  ['__teamHpHide', 'Team-HP-Balken verschwindet nicht außerhalb des Kampfes'],
]) {
  if (!vm.runInContext(`globalThis.${flag}`, ctx)) throw new Error(message);
}

vm.runInContext(`
  G.phase = "menu";
  G.battle = null;
  beginRun();
  const enemyHpBar = document.getElementById("enemyHpBar");
  const enemyHpFill = document.getElementById("enemyHpFill");
  const enemyHpPct = document.getElementById("enemyHpPct");
  const enemyHpValue = document.getElementById("enemyHpValue");
  updateEnemyHpBar();
  globalThis.__enemyHpHidden = !enemyHpBar.classList.contains("show") &&
    !enemyHpBar.classList.contains("closing") && enemyHpValue.textContent === "0/0";
  G.wave = 1;
  startBattle();
  const foes = sideUnits(G.battle, "enemy");
  foes.forEach(u => { u.hp = u.maxHp; u.shield = 0; u.isDead = false; });
  const enemyTotalMax = foes.reduce((s,u) => s+u.maxHp, 0);
  updateEnemyHpBar();
  globalThis.__enemyHpFull = enemyHpBar.classList.contains("show") &&
    parseFloat(enemyHpFill.style.width) === 100 && enemyHpPct.textContent === "100%" &&
    !enemyHpBar.classList.contains("closing") &&
    enemyHpValue.textContent === enemyTotalMax+'/'+enemyTotalMax;
  foes[0].hp = foes[0].maxHp * 0.5;
  updateEnemyHpBar();
  globalThis.__enemyHpDamage = Math.abs(parseFloat(enemyHpFill.style.width) -
    (enemyTotalMax - foes[0].maxHp * 0.5) / enemyTotalMax * 100) < 0.2 &&
    enemyHpValue.textContent === Math.round(enemyTotalMax - foes[0].maxHp*0.5)+'/'+enemyTotalMax;
  foes[0].shield = foes[0].maxHp * 0.5;
  updateEnemyHpBar();
  globalThis.__enemyHpShield = parseFloat(enemyHpFill.style.width) === 100 &&
    enemyHpPct.textContent === "100%" &&
    enemyHpValue.textContent === enemyTotalMax+'/'+enemyTotalMax;
  foes[0].shield = 0;
  foes.forEach(u => { u.hp = u.maxHp * 0.1; u.shield = 0; });
  updateEnemyHpBar();
  globalThis.__enemyHpClosing = enemyHpBar.classList.contains("closing") &&
    parseFloat(enemyHpPct.textContent) <= 25;
  foes[0].isDead = true;
  foes.slice(1).forEach(u => { u.hp = u.maxHp; u.shield = 0; });
  updateEnemyHpBar();
  globalThis.__enemyHpDead = !enemyHpBar.classList.contains("closing") &&
    parseFloat(enemyHpFill.style.width) > 25 &&
    enemyHpValue.textContent === Math.round(enemyTotalMax - foes[0].maxHp)+'/'+enemyTotalMax;
  foes[0].isDead = false;
  foes[0].maxHp = 2400;
  foes[0].hp = 1200;
  updateEnemyHpBar();
  globalThis.__enemyHpCompact = enemyHpValue.textContent.endsWith('k') &&
    shortHp(1234) === '1.2k' && shortHp(12500) === '13k';
  G.phase = "menu";
  G.battle = null;
  updateEnemyHpBar();
  globalThis.__enemyHpHide = !enemyHpBar.classList.contains("show") &&
    !enemyHpBar.classList.contains("closing") && enemyHpValue.textContent === "0/0";
`, ctx);

for (const [flag, message] of [
  ['__enemyHpHidden', 'Gegner-Stärkebalken erscheint außerhalb des Kampfes'],
  ['__enemyHpFull', 'Gegner-Stärkebalken startet nicht bei 100 %'],
  ['__enemyHpDamage', 'Gegner-Stärkebalken reagiert nicht auf Schaden'],
  ['__enemyHpShield', 'Gegner-Stärkebalken berücksichtigt Schilde nicht'],
  ['__enemyHpClosing', 'Gegner-Stärkebalken zeigt nahen Sieg nicht grün an'],
  ['__enemyHpDead', 'Gegner-Stärkebalken zählt tote Gegner falsch'],
  ['__enemyHpCompact', 'Gegner-Stärkebalken zeigt hohe HP nicht kompakt an'],
  ['__enemyHpHide', 'Gegner-Stärkebalken verschwindet nicht außerhalb des Kampfes'],
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
  const manaHeal = document.getElementById("manaHealReady");
  const manaNova = document.getElementById("manaNovaReady");
  updateBattleManaBar();
  globalThis.__manaHidden = !mana.classList.contains("show");
  globalThis.__manaSpellHidden = !manaHeal.classList.contains("ready-heal") &&
    !manaNova.classList.contains("ready-nova");
  G.wave = 1;
  startBattle();
  G.mana = 40;
  updateBattleManaBar();
  globalThis.__manaShow = mana.classList.contains("show") &&
    parseFloat(manaFill.style.width) === 40 && manaValue.textContent === "40/100";
  globalThis.__manaHealOnly = manaHeal.classList.contains("ready-heal") &&
    !manaNova.classList.contains("ready-nova");
  G.mana = 70;
  updateBattleManaBar();
  globalThis.__manaLive = parseFloat(manaFill.style.width) === 70 && manaValue.textContent === "70/100";
  globalThis.__manaBothReady = manaHeal.classList.contains("ready-heal") &&
    manaNova.classList.contains("ready-nova");
  G.mana = 0;
  updateBattleManaBar();
  globalThis.__manaEmpty = parseFloat(manaFill.style.width) === 0 && manaValue.textContent === "0/100";
  globalThis.__manaSpellDim = !manaHeal.classList.contains("ready-heal") &&
    !manaNova.classList.contains("ready-nova");
  G.phase = "menu";
  G.battle = null;
  updateBattleManaBar();
  globalThis.__manaHideCheck = !mana.classList.contains("show");
  globalThis.__manaSpellHideCheck = !manaHeal.classList.contains("ready-heal") &&
    !manaNova.classList.contains("ready-nova");
`, ctx);

for (const [flag, message] of [
  ['__manaHidden', 'Mana-Anzeige erscheint außerhalb des Kampfes'],
  ['__manaSpellHidden', 'Zauberbereitschaft erscheint außerhalb des Kampfes'],
  ['__manaShow', 'Mana-Anzeige zeigt Startwert nicht an'],
  ['__manaHealOnly', 'Mana-Anzeige markiert Heilregen nicht ab 40 Mana als bereit'],
  ['__manaLive', 'Mana-Anzeige reagiert nicht auf Mana-Änderungen'],
  ['__manaBothReady', 'Mana-Anzeige markiert Blitz nicht ab 70 Mana als bereit'],
  ['__manaEmpty', 'Mana-Anzeige zeigt 0 nicht korrekt an'],
  ['__manaSpellDim', 'Mana-Anzeige blendet Zauberbereitschaft bei 0 Mana nicht aus'],
  ['__manaHideCheck', 'Mana-Anzeige verschwindet nicht außerhalb des Kampfes'],
  ['__manaSpellHideCheck', 'Zauberbereitschaft verschwindet nicht außerhalb des Kampfes'],
]) {
  if (!vm.runInContext(`globalThis.${flag}`, ctx)) throw new Error(message);
}

vm.runInContext(`
  G.phase = "menu";
  G.battle = null;
  beginRun();
  startBattle();
  const nb = G.battle;
  nb.enemies.forEach(u => { u.isDead = true; });
  const swarm = nb.enemyMobs.filter(m => !m.isDead);
  const swarmHpBefore = swarm.reduce((s,m) => s + m.hp, 0);
  G.mana = 70;
  globalThis.__novaMobPool = blitzTargets(nb).length === swarm.length &&
    blitzTargets(nb).every(m => m.isMob && !m.isDead);
  const casted = castFabelBlitz();
  const swarmHpAfter = nb.enemyMobs.reduce((s,m) => s + (m.isDead ? 0 : m.hp), 0);
  globalThis.__novaMobCast = casted && G.mana === 0 && swarmHpAfter < swarmHpBefore;
  G.mana = 70;
  nb.enemyMobs.forEach(m => { m.isDead = true; });
  globalThis.__novaNoTarget = !castFabelBlitz() && G.mana === 70;
  G.phase = "menu";
  G.battle = null;
`, ctx);

for (const [flag, message] of [
  ['__novaMobPool', 'Fabel-Blitz findet keine Schwarm-Mobs, wenn alle Gegner-Helden tot sind'],
  ['__novaMobCast', 'Fabel-Blitz trifft den Schwarm nicht oder verbraucht keine 70 Mana'],
  ['__novaNoTarget', 'Fabel-Blitz verbraucht Mana, obwohl kein Ziel mehr lebt'],
]) {
  if (!vm.runInContext(`globalThis.${flag}`, ctx)) throw new Error(message);
}

vm.runInContext(`
  G.phase = "menu";
  G.battle = null;
  beginRun();
  const goldBar = document.getElementById("battleGold");
  const goldValue = document.getElementById("battleGoldValue");
  const goldGain = document.getElementById("battleGoldGain");
  updateBattleGold();
  globalThis.__goldHidden = !goldBar.classList.contains("show") && goldGain.textContent === "";
  G.wave = 1;
  startBattle();
  G.gold = 20;
  updateBattleGold();
  globalThis.__goldShow = goldBar.classList.contains("show") && goldValue.textContent === "20" &&
    goldGain.textContent === "";
  G.gold = 47;
  updateBattleGold();
  globalThis.__goldLive = goldBar.classList.contains("show") && goldValue.textContent === "47";
  globalThis.__goldGain = goldGain.textContent === "+27" && goldGain.style.opacity === "1";
  G.phase = "menu";
  G.battle = null;
  updateBattleGold();
  globalThis.__goldHide = !goldBar.classList.contains("show") && goldGain.textContent === "" &&
    goldGain.style.opacity === "0";
`, ctx);

for (const [flag, message] of [
  ['__goldHidden', 'Gold-Anzeige erscheint außerhalb des Kampfes'],
  ['__goldShow', 'Gold-Anzeige zeigt den Startwert nicht an'],
  ['__goldLive', 'Gold-Anzeige reagiert nicht auf Gold-Änderungen'],
  ['__goldGain', 'Gold-Gewinn wird nicht als +N in der Kampfleiste hervorgehoben'],
  ['__goldHide', 'Gold-Anzeige verschwindet nicht außerhalb des Kampfes'],
]) {
  if (!vm.runInContext(`globalThis.${flag}`, ctx)) throw new Error(message);
}

vm.runInContext(`
  G.phase = "menu";
  G.battle = null;
  beginRun();
  const dudesBar = document.getElementById("battleDudes");
  const dudesValue = document.getElementById("battleDudesValue");
  updateBattleDudes();
  globalThis.__dudesHidden = !dudesBar.classList.contains("show");
  G.wave = 1;
  startBattle();
  const dudesStacks = swarmStacks(sideUnits(G.battle,"player").length);
  updateBattleDudes();
  globalThis.__dudesShow = dudesStacks > 0 && dudesBar.classList.contains("show") &&
    dudesValue.textContent === "+"+(dudesStacks*4)+" %";
  const savedMobs = G.battle.playerMobs;
  G.battle.playerMobs = [];
  updateBattleDudes();
  const soloStacks = swarmStacks(G.team.length);
  globalThis.__dudesLive = soloStacks < dudesStacks &&
    (soloStacks === 0 ? !dudesBar.classList.contains("show") :
      dudesBar.classList.contains("show") && dudesValue.textContent === "+"+(soloStacks*4)+" %");
  G.battle.playerMobs = savedMobs;
  G.phase = "menu";
  G.battle = null;
  updateBattleDudes();
  globalThis.__dudesHide = !dudesBar.classList.contains("show");
`, ctx);

for (const [flag, message] of [
  ['__dudesHidden', 'Duden-Bonus erscheint außerhalb des Kampfes'],
  ['__dudesShow', 'Duden-Bonus zeigt den aktiven Schwarm-Bonus nicht an'],
  ['__dudesLive', 'Duden-Bonus reagiert nicht auf die Anzahl der Einheiten'],
  ['__dudesHide', 'Duden-Bonus verschwindet nicht außerhalb des Kampfes'],
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
  clearEffects();
  beginRun();
  G.wave = 5;
  startBattle();
  const fxElite = G.battle.enemyMobs.find(m => m.isElite);
  const fxBoss = createMob("brute", "enemy", 10, "boss");
  const fxNormal = G.battle.enemyMobs.find(m => !m.isElite && !m.isBoss);
  globalThis.__specialFxFlagCheck = typeof hasDamageFx === "function" &&
    hasDamageFx(G.battle.player[0]) && hasDamageFx(fxElite) && hasDamageFx(fxBoss) && !hasDamageFx(fxNormal);
  const effectsBefore = G.effects.length, particlesBefore = G.particles.length, wavesBefore = G.shockwaves.length;
  applyDamage(fxNormal, fxNormal.maxHp*0.1, null, {});
  spawnBurst(fxNormal, "#fff", 6, 1);
  spawnShockwave(fxNormal, "#fff", 1);
  globalThis.__normalFxCheck = G.effects.length === effectsBefore &&
    G.particles.length === particlesBefore && G.shockwaves.length === wavesBefore;
  applyDamage(fxElite, fxElite.maxHp*0.1, null, {});
  spawnBurst(fxElite, "#fff", 6, 1);
  spawnShockwave(fxElite, "#fff", 1);
  globalThis.__eliteFxCheck = G.effects.length > effectsBefore &&
    G.particles.length > particlesBefore && G.shockwaves.length > wavesBefore;
  const effectsAfterElite = G.effects.length, wavesAfterElite = G.shockwaves.length;
  applyDamage(fxBoss, fxBoss.maxHp*0.1, null, {});
  spawnShockwave(fxBoss, "#fff", 1);
  globalThis.__bossFxCheck = G.effects.length > effectsAfterElite && G.shockwaves.length > wavesAfterElite;
  clearEffects();
  G.phase = "menu";
  G.battle = null;
`, ctx);

for (const [flag, message] of [
  ['__specialFxFlagCheck', 'Treffer-Feedback ist nicht auf Elite-/Boss-Mobs begrenzt'],
  ['__normalFxCheck', 'Normale Mobs erzeugen ungewollt Treffer-Effekte'],
  ['__eliteFxCheck', 'Elite-Mobs zeigen keine Trefferzahl, Partikel oder Schockwelle'],
  ['__bossFxCheck', 'Boss-Mobs zeigen keine Trefferzahl oder Schockwelle'],
]) {
  if (!vm.runInContext(`globalThis.${flag}`, ctx)) throw new Error(message);
}

vm.runInContext(`
  G.phase = "menu";
  G.battle = null;
  clearEffects();
  const supportHero = createUnit("fee", 1, "player");
  supportHero.hp = supportHero.maxHp * 0.5;
  G.shockwaves.length = 0;
  healUnit(supportHero, supportHero.maxHp * 0.2);
  globalThis.__healRingCheck = supportHero.hp > supportHero.maxHp * 0.5 &&
    G.shockwaves.length === 1 && G.shockwaves[0].obj.material.color.getHex() === 0x4ade80;
  const fullHero = createUnit("fee", 1, "player");
  G.shockwaves.length = 0;
  healUnit(fullHero, fullHero.maxHp * 0.2);
  globalThis.__healFullQuietCheck = G.shockwaves.length === 0;
  G.shockwaves.length = 0;
  shieldUnit(supportHero, supportHero.maxHp * 0.2);
  globalThis.__shieldRingCheck = supportHero.shield > 0 &&
    G.shockwaves.length === 1 && G.shockwaves[0].obj.material.color.getHex() === 0x8fb5ff;
  const fxMob = createMob("kriecher", "enemy", 1, "normal");
  fxMob.hp = fxMob.maxHp * 0.5;
  G.shockwaves.length = 0;
  healUnit(fxMob, fxMob.maxHp * 0.2);
  shieldUnit(fxMob, fxMob.maxHp * 0.2);
  globalThis.__supportMobQuietCheck = G.shockwaves.length === 0;
  clearEffects();
`, ctx);

for (const [flag, message] of [
  ['__healRingCheck', 'Heilung zeigt keinen gruenen Bodenring im 3D-Feld'],
  ['__healFullQuietCheck', 'Heilung bei voller HP erzeugt einen unnoetigen Ring'],
  ['__shieldRingCheck', 'Schild zeigt keinen blauen Bodenring im 3D-Feld'],
  ['__supportMobQuietCheck', 'Heilung/Schild erzeugt bei normalen Mobs ungewollt Effekte'],
]) {
  if (!vm.runInContext(`globalThis.${flag}`, ctx)) throw new Error(message);
}

vm.runInContext(`
  G.phase = "menu";
  G.battle = null;
  clearEffects();
  beginRun();
  G.wave = 10;
  startBattle();
  const deathToasts = [];
  const origDeathToast = showToast;
  showToast = function(msg){ deathToasts.push(msg); };
  const deathBoss = G.battle.enemyMobs.find(m => m.isBoss);
  const deathNormal = G.battle.enemyMobs.find(m => !m.isElite && !m.isBoss);
  cameraShake = 0;
  const deathWavesBefore = G.shockwaves.length;
  killUnit(deathNormal, null);
  globalThis.__normalDeathQuiet = deathToasts.length === 0 && cameraShake === 0;
  killUnit(deathBoss, null);
  globalThis.__bossDeathToast = deathToasts.length === 1 && /Gegner-Boss besiegt/.test(deathToasts[0]);
  globalThis.__bossDeathShake = cameraShake >= 0.3;
  globalThis.__bossDeathWave = G.shockwaves.length > deathWavesBefore;
  killUnit(createMob("brute", "player", 10, "boss"), null);
  globalThis.__ownBossDeathToast = deathToasts.length === 2 && /Team-Boss gefallen/.test(deathToasts[1]);
  showToast = origDeathToast;
  G.phase = "menu";
  G.battle = null;
  clearEffects();
  beginRun();
  cameraShake = 0;
  G.wave = 1;
  startBattle();
  globalThis.__spawnQuietWave1 = G.effects.length === 0 && G.particles.length === 0 &&
    G.shockwaves.length === 0 && cameraShake === 0;
  G.phase = "menu";
  G.battle = null;
  clearEffects();
  beginRun();
  G.wave = 5;
  startBattle();
  const eliteSpecials = [...G.battle.playerMobs, ...G.battle.enemyMobs].filter(m => m.isElite || m.isBoss);
  globalThis.__spawnEliteCheck = eliteSpecials.length > 0 && !eliteSpecials.some(m => m.isBoss) &&
    G.effects.length === eliteSpecials.length && G.particles.length === eliteSpecials.length &&
    G.shockwaves.length === eliteSpecials.length && cameraShake === 0;
  G.phase = "menu";
  G.battle = null;
  clearEffects();
  beginRun();
  G.wave = 10;
  startBattle();
  const bossSpecials = [...G.battle.playerMobs, ...G.battle.enemyMobs].filter(m => m.isElite || m.isBoss);
  globalThis.__spawnBossCheck = bossSpecials.some(m => m.isBoss) &&
    G.effects.length === bossSpecials.length &&
    G.particles.length === bossSpecials.length &&
    G.shockwaves.length === bossSpecials.length && cameraShake > 0;
  clearEffects();
  G.phase = "menu";
  G.battle = null;
`, ctx);

for (const [flag, message] of [
  ['__normalDeathQuiet', 'Normale Mobs erzeugen beim Tod ungewollt Toast/Shake'],
  ['__bossDeathToast', 'Gegner-Boss-Tod zeigt keinen eigenen Hinweis'],
  ['__bossDeathShake', 'Boss-Tod hat keinen verstärkten Kamera-Shake'],
  ['__bossDeathWave', 'Boss-Tod zeigt keine Schockwelle'],
  ['__ownBossDeathToast', 'Eigener Boss-Tod zeigt keinen eigenen Hinweis'],
  ['__spawnQuietWave1', 'Welle 1 erzeugt ungewollte Elite-/Boss-Spawn-Effekte'],
  ['__spawnEliteCheck', 'Eliten werden beim Spawn nicht im 3D angekündigt'],
  ['__spawnBossCheck', 'Bosse werden beim Spawn nicht im 3D angekündigt'],
]) {
  if (!vm.runInContext(`globalThis.${flag}`, ctx)) throw new Error(message);
}

vm.runInContext(`
  G.phase = "menu";
  G.battle = null;
  clearEffects();
  beginRun();
  startBattle();
  const sbBlocked = G.battle.player[0];
  const sbEffectsBefore = G.effects.length, sbParticlesBefore = G.particles.length;
  sbBlocked.hp = sbBlocked.maxHp;
  sbBlocked.shield = sbBlocked.maxHp * 0.5;
  sbBlocked.hitFlash = 0;
  const sbHpBefore = sbBlocked.hp, sbShieldBefore = sbBlocked.shield;
  applyDamage(sbBlocked, sbBlocked.maxHp * 0.1, null, {});
  globalThis.__shieldHitFeedback = sbBlocked.hp === sbHpBefore &&
    sbBlocked.shield < sbShieldBefore && sbBlocked.hitFlash > 0 &&
    G.effects.length > sbEffectsBefore && G.particles.length > sbParticlesBefore;
  // Schadenspunkte ohne Zahlen (DoT/Splash) bleiben auch bei Schild still.
  const sbQuiet = G.battle.player[1];
  sbQuiet.hp = sbQuiet.maxHp;
  sbQuiet.shield = sbQuiet.maxHp * 0.5;
  sbQuiet.hitFlash = 0;
  const sbQuietEffects = G.effects.length, sbQuietParticles = G.particles.length;
  applyDamage(sbQuiet, sbQuiet.maxHp * 0.1, null, {number:false});
  globalThis.__quietShieldCheck = sbQuiet.hp === sbQuiet.maxHp && sbQuiet.hitFlash === 0 &&
    G.effects.length === sbQuietEffects && G.particles.length === sbQuietParticles;
  clearEffects();
  G.phase = "menu";
  G.battle = null;
`, ctx);

for (const [flag, message] of [
  ['__shieldHitFeedback', 'Komplett blockierte Treffer zeigen keinen blauen Impuls'],
  ['__quietShieldCheck', 'Stille Schild-Treffer erzeugen ungewolltes Feedback'],
]) {
  if (!vm.runInContext(`globalThis.${flag}`, ctx)) throw new Error(message);
}

vm.runInContext(`
  G.phase = "menu";
  G.battle = null;
  clearEffects();
  beginRun();
  startBattle();
  const dsUnit = G.battle.player[0];
  const lastScale = () => G.effects.length ? G.effects[G.effects.length-1].scale.x : 0;
  dsUnit.hp = dsUnit.maxHp;
  dsUnit.shield = 0;
  applyDamage(dsUnit, dsUnit.maxHp*0.02, null, {});
  const dsSmall = lastScale();
  dsUnit.hp = dsUnit.maxHp;
  applyDamage(dsUnit, dsUnit.maxHp*0.24, null, {});
  const dsBig = lastScale();
  dsUnit.hp = dsUnit.maxHp;
  applyDamage(dsUnit, dsUnit.maxHp*0.02, null, {crit:true});
  const dsCrit = lastScale();
  globalThis.__damageScaleCheck = typeof damageTextScale === "function" &&
    dsSmall > 0 && dsBig > dsSmall*1.2 && dsCrit > dsSmall*1.4;
  clearEffects();
  G.phase = "menu";
  G.battle = null;
`, ctx);

if (!vm.runInContext('globalThis.__damageScaleCheck', ctx)) {
  throw new Error('Trefferzahlen skalieren nicht mit Schadensgröße und Krit');
}

vm.runInContext(`
  G.phase = "menu";
  G.battle = null;
  beginRun();
  startBattle();
  const bar = document.getElementById("focusHp");
  const value = document.getElementById("focusHpValue");
  const atk = document.getElementById("focusAtkValue");
  const cdBar = document.getElementById("focusCd");
  const cdValue = document.getElementById("focusCdValue");
  const fx = document.getElementById("focusStatus");
  const name = document.getElementById("focusName");
  const metaBar = document.getElementById("focusMeta");
  const focusHero = G.battle.player[0];
  const spellName = (SPELLS[focusHero.spell]||{}).name || "Zauber";
  G.selectedUnitId = focusHero.id;
  updateFocusHp();
  updateFocusCooldown();
  updateFocusMeta();
  const startShield = focusHero.shield > 0 ? " ⛨"+Math.ceil(focusHero.shield) : "";
  globalThis.__focusStart = bar.classList.contains("show") &&
    value.textContent === Math.ceil(focusHero.hp)+"/"+Math.ceil(focusHero.maxHp)+startShield &&
    fx.textContent === "" &&
    !bar.classList.contains("warn") && !bar.classList.contains("critical");
  globalThis.__focusMetaStart = metaBar.classList.contains("show") &&
    metaBar.textContent === "Lv "+focusHero.level+" · "+ROLE_META[focusHero.role].label;
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
  globalThis.__focusAtkStart = atk.textContent === String(Math.round(focusHero.atk));
  const oldAtk = focusHero.atk;
  focusHero.atk = oldAtk + 7;
  updateFocusHp();
  globalThis.__focusAtkLive = atk.textContent === String(Math.round(focusHero.atk));
  focusHero.atk = oldAtk;
  cycleFocus(1);
  const nextFocus = findUnitById(G.selectedUnitId);
  updateFocusHp();
  updateFocusMeta();
  globalThis.__focusNameCycle = !!nextFocus && nextFocus.id !== focusHero.id &&
    bar.classList.contains("show") && name.textContent === nextFocus.emoji+" "+nextFocus.name;
  globalThis.__focusMetaCycle = !!nextFocus && metaBar.classList.contains("show") &&
    metaBar.textContent === "Lv "+nextFocus.level+" · "+ROLE_META[nextFocus.role].label;
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
  globalThis.__focusAtkDead = atk.textContent === "0";
  updateFocusCooldown();
  globalThis.__focusCdDeadHidden = !cdBar.classList.contains("show");
  updateFocusMeta();
  globalThis.__focusMetaDeadHidden = !metaBar.classList.contains("show");
  focusHero.isDead = false;
  G.phase = "menu";
  G.battle = null;
  updateFocusHp();
  globalThis.__focusHide = !bar.classList.contains("show") && !bar.classList.contains("warn") &&
    !bar.classList.contains("critical") && fx.textContent === "";
  updateFocusCooldown();
  globalThis.__focusCdHide = !cdBar.classList.contains("show") && !cdBar.classList.contains("ready");
  globalThis.__focusNameReset = name.textContent === "Fokus";
  updateFocusMeta();
  globalThis.__focusMetaHide = !metaBar.classList.contains("show");
  globalThis.__focusAtkReset = atk.textContent === "0";
`, ctx);

vm.runInContext(`
  G.phase = "menu";
  G.battle = null;
  beginRun();
  startBattle();
  const targetHero = G.battle.player[0];
  const targetFoe = G.battle.enemies[0];
  G.selectedUnitId = targetHero.id;
  const targetBar = document.getElementById("focusTarget");
  const targetName = document.getElementById("focusTargetName");
  const targetMeta = document.getElementById("focusTargetMeta");
  const targetValue = document.getElementById("focusTargetHp");
  const targetFx = document.getElementById("focusTargetStatus");
  const targetAtk = document.getElementById("focusTargetAtk");
  targetHero.target = null;
  updateFocusTarget();
  globalThis.__targetNone = !targetBar.classList.contains("show") && targetName.textContent === "–" &&
    targetFx.textContent === "" && targetAtk.textContent === "0" &&
    targetMeta.textContent === "Lv – · –";
  targetHero.target = targetFoe;
  targetFoe.shield = 0;
  updateFocusTarget();
  globalThis.__targetShow = targetBar.classList.contains("show") &&
    targetName.textContent === targetFoe.emoji+" "+targetFoe.name &&
    targetMeta.textContent === "Lv "+targetFoe.level+" · "+((ROLE_META[targetFoe.role]||{}).label || targetFoe.role) &&
    targetValue.textContent === Math.ceil(targetFoe.hp)+"/"+Math.ceil(targetFoe.maxHp) &&
    targetAtk.textContent === String(Math.round(targetFoe.atk)) &&
    !targetBar.classList.contains("critical");
  targetFoe.hp = targetFoe.maxHp*0.2;
  updateFocusTarget();
  globalThis.__targetCritical = targetBar.classList.contains("critical") &&
    targetValue.textContent === Math.ceil(targetFoe.hp)+"/"+Math.ceil(targetFoe.maxHp);
  targetFoe.shield = targetFoe.maxHp*0.1;
  updateFocusTarget();
  globalThis.__targetShield = targetValue.textContent.indexOf(" ⛨") >= 0;
  targetFoe.statuses = {burn:3, stun:1, unknown:9};
  updateFocusTarget();
  globalThis.__targetStatus = targetFx.textContent === "🔥3s 💫1s";
  targetFoe.statuses = {};
  updateFocusTarget();
  globalThis.__targetStatusClear = targetFx.textContent === "";
  targetFoe.atk += 7;
  updateFocusTarget();
  globalThis.__targetAtkLive = targetAtk.textContent === String(Math.round(targetFoe.atk));
  const mobTarget = (G.battle.enemyMobs||[])[0];
  if(mobTarget){
    targetHero.target = mobTarget;
    updateFocusTarget();
    globalThis.__targetMetaMob = targetMeta.textContent === "Lv "+mobTarget.level+" · Schwarm";
    targetHero.target = targetFoe;
    updateFocusTarget();
  } else {
    globalThis.__targetMetaMob = true;
  }
  targetFoe.isDead = true;
  updateFocusTarget();
  globalThis.__targetDead = !targetBar.classList.contains("show") && targetName.textContent === "–";
  targetFoe.isDead = false;
  targetHero.isDead = true;
  updateFocusTarget();
  globalThis.__targetFocusDead = !targetBar.classList.contains("show");
  targetHero.isDead = false;
  G.phase = "menu";
  G.battle = null;
  updateFocusTarget();
  globalThis.__targetHide = !targetBar.classList.contains("show") &&
    !targetBar.classList.contains("critical") && targetName.textContent === "–" && targetValue.textContent === "0/0" &&
    targetFx.textContent === "" && targetAtk.textContent === "0" && targetMeta.textContent === "Lv – · –";
`, ctx);

vm.runInContext(`
  G.phase = "menu";
  G.battle = null;
  beginRun();
  startBattle();
  const fa = G.battle.player[0];
  const fb = G.battle.player[1];
  G.selectedUnitId = fa.id;
  killUnit(fa, fb);
  globalThis.__focusAutoSwitch = G.selectedUnitId === fb.id;
  G.phase = "menu";
  G.battle = null;
`, ctx);

vm.runInContext(`
  G.phase = "menu";
  G.battle = null;
  beginRun();
  startBattle();
  const ringHero = G.battle.player[0];
  const ringFoe = G.battle.enemies[0];
  G.selectedUnitId = ringHero.id;
  ringHero.target = ringFoe;
  ringFoe.grid.gx = 4;
  ringFoe.grid.gy = 5;
  updateVisuals(1,0.016);
  const ringPos = worldPos(4,5);
  globalThis.__targetRingShow = targetRing.visible &&
    Math.abs(targetRing.position.x-ringPos.x) < 0.01 &&
    Math.abs(targetRing.position.z-ringPos.z) < 0.01 &&
    targetRing.material.opacity > 0.4;
  ringFoe.isDead = true;
  updateVisuals(1,0.016);
  globalThis.__targetRingDead = !targetRing.visible;
  ringFoe.isDead = false;
  ringHero.target = null;
  updateVisuals(1,0.016);
  globalThis.__targetRingNone = !targetRing.visible;
  G.phase = "menu";
  G.battle = null;
`, ctx);

for (const [flag, message] of [
  ['__targetRingShow', 'Zielmarkierung zeigt das Ziel des fokussierten Helden nicht im 3D-Feld'],
  ['__targetRingDead', 'Zielmarkierung bleibt bei einem toten Ziel sichtbar'],
  ['__targetRingNone', 'Zielmarkierung bleibt ohne Ziel sichtbar'],
]) {
  if (!vm.runInContext(`globalThis.${flag}`, ctx)) throw new Error(message);
}

for (const [flag, message] of [
  ['__focusStart', 'Fokus-HP-Anzeige zeigt zu Kampfbeginn keine volle HP'],
  ['__focusCdStart', 'Fokus-Cooldown zeigt den Zauber und die Restzeit nicht'],
  ['__focusCdReady', 'Fokus-Cooldown zeigt keinen bereiten Zauber an'],
  ['__focusName', 'Fokus-HP-Anzeige zeigt nicht den Namen des fokussierten Wesens'],
  ['__focusNameCycle', 'Fokusname aktualisiert sich nicht nach der ◀/▶-Navigation'],
  ['__focusAtkStart', 'Fokus-Angriffsanzeige zeigt den Angriffswert nicht'],
  ['__focusAtkLive', 'Fokus-Angriffsanzeige reagiert nicht auf Buffs'],
  ['__focusAtkDead', 'Fokus-Angriffsanzeige bleibt bei einem toten Fokus stehen'],
  ['__focusAtkReset', 'Fokus-Angriffsanzeige wird außerhalb des Kampfes nicht zurückgesetzt'],
  ['__focusNameReset', 'Fokusname wird außerhalb des Kampfes nicht zurückgesetzt'],
  ['__focusMetaStart', 'Fokus-Anzeige zeigt Level und Rolle nicht an'],
  ['__focusMetaCycle', 'Fokus-Level/Rolle aktualisiert sich nicht nach der ◀/▶-Navigation'],
  ['__focusMetaDeadHidden', 'Fokus-Level/Rolle bleibt bei einem toten Fokus sichtbar'],
  ['__focusMetaHide', 'Fokus-Level/Rolle verschwindet nicht außerhalb des Kampfes'],
  ['__focusDamage', 'Fokus-HP-Anzeige reagiert nicht auf Schaden'],
  ['__focusShield', 'Fokus-HP-Anzeige zeigt den Schild nicht'],
  ['__focusStatus', 'Fokus-Anzeige zeigt aktive Statuseffekte nicht'],
  ['__focusStatusClear', 'Fokus-Anzeige löscht abgelaufene Statuseffekte nicht'],
  ['__focusCritical', 'Fokus-HP-Anzeige markiert kritische HP nicht'],
  ['__focusDeadHidden', 'Fokus-HP-Anzeige bleibt bei einem toten Fokus sichtbar'],
  ['__focusCdDeadHidden', 'Fokus-Cooldown bleibt bei einem toten Fokus sichtbar'],
  ['__focusHide', 'Fokus-HP-Anzeige verschwindet nicht außerhalb des Kampfes'],
  ['__focusCdHide', 'Fokus-Cooldown verschwindet nicht außerhalb des Kampfes'],
  ['__targetNone', 'Fokus-Ziel erscheint ohne Ziel'],
  ['__targetShow', 'Fokus-Ziel zeigt Namen, Rest-HP und Angriff nicht'],
  ['__targetMetaMob', 'Fokus-Ziel zeigt Level und Rolle (Schwarm) nicht'],
  ['__targetCritical', 'Fokus-Ziel markiert kritische HP nicht'],
  ['__targetShield', 'Fokus-Ziel zeigt den Schild nicht'],
  ['__targetStatus', 'Fokus-Ziel zeigt aktive Statuseffekte nicht'],
  ['__targetStatusClear', 'Fokus-Ziel löscht abgelaufene Statuseffekte nicht'],
  ['__targetAtkLive', 'Fokus-Ziel zeigt den Angriffswert nicht live'],
  ['__targetDead', 'Fokus-Ziel bleibt nach dem Tod des Ziels sichtbar'],
  ['__targetFocusDead', 'Fokus-Ziel bleibt bei einem toten Fokus sichtbar'],
  ['__targetHide', 'Fokus-Ziel verschwindet nicht außerhalb des Kampfes'],
  ['__focusAutoSwitch', 'Fokus springt bei Tod des fokussierten Helden nicht auf einen lebenden Helden'],
]) {
  if (!vm.runInContext(`globalThis.${flag}`, ctx)) throw new Error(message);
}

vm.runInContext(`
  G.phase = "menu";
  G.battle = null;
  beginRun();
  G.wave = 1;
  startBattle();
  const winToasts = [];
  const origToast = showToast;
  showToast = function(msg){ winToasts.push(msg); };
  G.battle.time = 12.7;
  G.battle.player[0].isDead = true;
  clearEffects();
  const winFxBefore = G.shockwaves.length + G.particles.length;
  winBattle();
  showToast = origToast;
  globalThis.__winEndFx = winFxBefore === 0 && G.shockwaves.length === 2 && G.particles.length === 2;
  const summary = winToasts.filter(t => t.indexOf("besiegt") >= 0);
  globalThis.__winToastSingle = summary.length === 1;
  globalThis.__winToastSummary = summary.length === 1 &&
    summary[0].indexOf("Welle 1 besiegt!") === 0 &&
    summary[0].indexOf("+7 Gold") >= 0 &&
    summary[0].indexOf("12s") >= 0 &&
    summary[0].indexOf("Helden 2/3") >= 0;
  G.phase = "menu";
  G.battle = null;
`, ctx);

for (const [flag, message] of [
  ['__winToastSingle', 'Sieg erzeugt mehrere doppelte Sieges-Toasts'],
  ['__winToastSummary', 'Sieges-Toast zeigt nicht Gold, Kampfdauer und überlebende Helden'],
  ['__winEndFx', 'Sieg zeigt keine Schockwelle und keine Partikel über den überlebenden Helden'],
]) {
  if (!vm.runInContext(`globalThis.${flag}`, ctx)) throw new Error(message);
}

vm.runInContext(`
  G.phase = "menu";
  G.battle = null;
  beginRun();
  G.wave = 1;
  startBattle();
  const lossToastList = [];
  const origLossToast = showToast;
  showToast = function(msg){ lossToastList.push(msg); };
  G.battle.time = 8.4;
  G.battle.player[0].isDead = true;
  G.battle.enemyMobs[0].isDead = true;
  const lossFoesLeft = sideUnits(G.battle, "enemy").filter(u => !u.isDead).length;
  clearEffects();
  const lossFxBefore = G.shockwaves.length + G.particles.length;
  loseBattle();
  showToast = origLossToast;
  globalThis.__lossEndFx = lossFxBefore === 0 && G.shockwaves.length === 1 && G.particles.length === 1;
  const lossSummary = lossToastList.filter(t => t.indexOf("Niederlage") >= 0);
  globalThis.__lossToastSingle = lossSummary.length === 1 && lossToastList.length === 1;
  globalThis.__lossToastSummary = lossSummary.length === 1 &&
    lossSummary[0].indexOf("Niederlage in Welle 1") === 0 &&
    lossSummary[0].indexOf("8s") >= 0 &&
    lossSummary[0].indexOf("Helden 2/3") >= 0 &&
    lossSummary[0].indexOf("Gegner "+lossFoesLeft+" übrig") >= 0;
  G.phase = "menu";
  G.battle = null;
`, ctx);

for (const [flag, message] of [
  ['__lossToastSingle', 'Niederlage erzeugt mehrere oder keine Zusammenfassungs-Toasts'],
  ['__lossToastSummary', 'Niederlage-Toast zeigt nicht Dauer, überlebende Helden und verbleibende Gegner'],
  ['__lossEndFx', 'Niederlage zeigt keine Schockwelle und keine Partikel am gefallenen Helden'],
]) {
  if (!vm.runInContext(`globalThis.${flag}`, ctx)) throw new Error(message);
}

vm.runInContext(`
  G.phase = "menu";
  G.battle = null;
  beginRun();
  startBattle();
  const focusToasts = [];
  const origFocusToast = showToast;
  showToast = function(msg){ focusToasts.push(msg); };
  const firstFocus = G.battle.player[0];
  G.selectedUnitId = firstFocus.id;
  cycleFocus(1);
  const cycledId = G.selectedUnitId;
  selectUnit(firstFocus);
  globalThis.__focusQuietInBattle = focusToasts.length === 0 && cycledId !== firstFocus.id;
  G.phase = "prep";
  G.battle = null;
  selectUnit(firstFocus);
  showToast = origFocusToast;
  globalThis.__focusToastInPrep = focusToasts.length === 1 &&
    focusToasts[0] === "Info: "+firstFocus.emoji+" "+firstFocus.name;
`, ctx);

for (const [flag, message] of [
  ['__focusQuietInBattle', 'Fokuswechsel im Kampf erzeugt Toast-Spam trotz Fokus-Anzeige'],
  ['__focusToastInPrep', 'Fokus-Auswahl außerhalb des Kampfes zeigt keinen Info-Toast mehr'],
]) {
  if (!vm.runInContext(`globalThis.${flag}`, ctx)) throw new Error(message);
}

vm.runInContext(`
  G.phase = "menu";
  G.battle = null;
  clearEffects();
  beginRun();
  startBattle();
  const reviveToasts = [];
  const origReviveToast = showToast;
  showToast = function(msg){ reviveToasts.push(msg); };
  const revivedHero = G.battle.player[0];
  revivedHero.mods.revive = 1;
  recalcUnit(revivedHero);
  revivedHero.hp = revivedHero.maxHp * 0.2;
  revivedHero.shield = 0;
  const effectsBeforeRevive = G.effects.length;
  killUnit(revivedHero, G.battle.enemies[0]);
  globalThis.__reviveTrait = !revivedHero.isDead && revivedHero.revived === true &&
    revivedHero.hp > revivedHero.maxHp * 0.35 &&
    revivedHero.shield > revivedHero.maxHp * 0.1 &&
    G.effects.length > effectsBeforeRevive &&
    reviveToasts.some(t => t.indexOf("ersteht wieder") >= 0);
  killUnit(revivedHero, G.battle.enemies[0]);
  globalThis.__reviveOnce = revivedHero.isDead === true &&
    reviveToasts.filter(t => t.indexOf("ersteht wieder") >= 0).length === 1;
  reviveTeam();
  globalThis.__reviveReset = !revivedHero.isDead && revivedHero.revived === false &&
    revivedHero.hp === revivedHero.maxHp;
  const spellReviver = G.battle.player[1];
  const spellFallen = G.battle.player[2];
  spellReviver.spell = "koepfe";
  spellReviver.spellCd = 0;
  spellReviver.grid.gx = spellFallen.grid.gx;
  spellReviver.grid.gy = spellFallen.grid.gy;
  spellFallen.isDead = true;
  spellFallen.hp = 0;
  spellFallen.revived = false;
  const spellRevived = castSpell(spellReviver, spellFallen, G.battle);
  globalThis.__reviveSpell = spellRevived && !spellFallen.isDead &&
    spellFallen.revived === true && spellFallen.hp > 0;
  showToast = origReviveToast;
  G.phase = "menu";
  G.battle = null;
  clearEffects();
`, ctx);

for (const [flag, message] of [
  ['__reviveTrait', 'Wiederbelebung setzt HP, Schild und Feedback nicht'],
  ['__reviveOnce', 'Wiederbelebung greift mehr als einmal pro Held'],
  ['__reviveReset', 'Wiederbelebungs-Flag wird nach Kampfende nicht zurückgesetzt'],
  ['__reviveSpell', 'Zauber-Wiederbelebung bringt einen gefallenen Helden nicht zurück'],
]) {
  if (!vm.runInContext(`globalThis.${flag}`, ctx)) throw new Error(message);
}

// Der Support-Cooldown verhindert, dass Schild-/Heil-Unterstützung bei jedem
// Zyklus erneut zuschlägt (v1.54: sonst endeten Kämpfe nicht mehr).
vm.runInContext(`
  G.phase = "menu";
  G.battle = null;
  beginRun();
  startBattle();
  const support = createUnit("fee", 1, "player");
  const ally = createUnit("fee", 1, "player");
  support.modsEffective = {shieldPct: 0.25};
  ally.hp = ally.maxHp * 0.5;
  ally.shield = 0;
  const supportBattle = {player: [support, ally], enemies: [], playerMobs: [], enemyMobs: []};
  support.supportCd = 0;
  const firstSupport = supportAction(support, supportBattle, 0.016);
  const shieldAfterFirst = ally.shield;
  const blockedSupport = supportAction(support, supportBattle, 0.016);
  globalThis.__supportCdOnce = firstSupport === true && shieldAfterFirst > 0 &&
    blockedSupport === false && ally.shield === shieldAfterFirst && support.supportCd === 4;
  support.supportCd = 0;
  const secondSupport = supportAction(support, supportBattle, 0.016);
  globalThis.__supportCdReset = secondSupport === true && ally.shield > shieldAfterFirst &&
    support.supportCd === 4;
  G.phase = "menu";
  G.battle = null;
`, ctx);

for (const [flag, message] of [
  ['__supportCdOnce', 'Support-Cooldown blockiert wiederholte Schilde nicht (Endlosskampf-Gefahr)'],
  ['__supportCdReset', 'Support-Unterstützung ist nach Ablauf des Cooldowns nicht wieder verfügbar'],
]) {
  if (!vm.runInContext(`globalThis.${flag}`, ctx)) throw new Error(message);
}

vm.runInContext(`
  SIM.headless = false;
  toastLog = [];
  for (let i = 1; i <= 5; i++) showToast("Meldung "+i);
  globalThis.__toastCap = toastLog.length === TOAST_MAX &&
    toastLog[0].msg === "Meldung 3" && toastLog[2].msg === "Meldung 5";
  showToast("Gleich");
  const countBefore = toastLog.length;
  showToast("Zwischen");
  const countAfterOther = toastLog.length;
  toastLog[toastLog.length-2].at = Date.now();
  showToast("Gleich");
  globalThis.__toastDedup = countBefore === TOAST_MAX && countAfterOther === TOAST_MAX &&
    toastLog.length === TOAST_MAX && toastLog[toastLog.length-1].msg === "Zwischen";
  toastLog = [];
`, ctx);

for (const [flag, message] of [
  ['__toastCap', 'Toasts werden nicht auf drei gleichzeitige Meldungen begrenzt'],
  ['__toastDedup', 'Identische Toasts werden innerhalb kurzer Zeit mehrfach angezeigt'],
]) {
  if (!vm.runInContext(`globalThis.${flag}`, ctx)) throw new Error(message);
}

vm.runInContext(`
  beginRun();
  startBattle();
  const tapHero = G.battle.player[0];
  const tapFoe = G.battle.enemies[0];
  G.selectedUnitId = tapHero.id;
  updateFocusHp();
  selectUnit(tapFoe);
  const infoOverlay = document.getElementById("infoOverlay");
  globalThis.__enemyTapInfo = infoOverlay.classList.contains("show") &&
    document.getElementById("infoTitle").textContent === tapFoe.name+" · Gegner" &&
    document.getElementById("infoText").innerHTML.indexOf(tapFoe.name) >= 0;
  globalThis.__enemyTapFocus = G.selectedUnitId === tapHero.id &&
    document.getElementById("focusHp").classList.contains("show") &&
    document.getElementById("focusName").textContent === tapHero.emoji+" "+tapHero.name;
  closeInfo();
  globalThis.__enemyTapInfoClosed = !infoOverlay.classList.contains("show");
  G.phase = "menu";
  G.battle = null;
`, ctx);

for (const [flag, message] of [
  ['__enemyTapInfo', 'Gegner-Tap zeigt keine Fähigkeits-Info an'],
  ['__enemyTapFocus', 'Gegner-Tap überschreibt den Helden-Fokus in der Kampfleiste'],
  ['__enemyTapInfoClosed', 'Gegner-Info lässt sich nicht schließen'],
]) {
  if (!vm.runInContext(`globalThis.${flag}`, ctx)) throw new Error(message);
}

vm.runInContext(`
  beginRun();
  startBattle();
  G.mana = 0;
  updateBattleManaBar();
  updateButtons();
  globalThis.__spellBtnOff = !document.getElementById("btnBattleHeal").classList.contains("ready") &&
    !document.getElementById("btnBattleNova").classList.contains("ready") &&
    !document.getElementById("btnHeal").classList.contains("ready") &&
    !document.getElementById("btnNova").classList.contains("ready");
  G.mana = 45;
  updateBattleManaBar();
  updateButtons();
  globalThis.__spellBtnHealReady = document.getElementById("btnBattleHeal").classList.contains("ready") &&
    document.getElementById("btnHeal").classList.contains("ready") &&
    !document.getElementById("btnBattleNova").classList.contains("ready");
  G.mana = 75;
  updateBattleManaBar();
  updateButtons();
  globalThis.__spellBtnNovaReady = document.getElementById("btnBattleNova").classList.contains("ready") &&
    document.getElementById("btnNova").classList.contains("ready");
  G.phase = "prep";
  G.battle = null;
  updateButtons();
  globalThis.__spellBtnHidePrep = !document.getElementById("btnBattleHeal").classList.contains("ready") &&
    !document.getElementById("btnBattleNova").classList.contains("ready");
`, ctx);

for (const [flag, message] of [
  ['__spellBtnOff', 'Zauber-Buttons leuchten bei zu wenig Mana fälschlich als bereit'],
  ['__spellBtnHealReady', 'Heilregen-Button zeigt Bereitschaft bei 40+ Mana nicht'],
  ['__spellBtnNovaReady', 'Blitz-Button zeigt Bereitschaft bei 70+ Mana nicht'],
  ['__spellBtnHidePrep', 'Zauber-Bereitschaft wird außerhalb des Kampfes nicht zurückgesetzt'],
]) {
  if (!vm.runInContext(`globalThis.${flag}`, ctx)) throw new Error(message);
}

vm.runInContext(`
  resetCameraZoom();
  zoomCamera(4);
  const zoomIn = targetView > DEFAULT_VIEW;
  resetCameraZoom();
  const zoomReset = targetView === DEFAULT_VIEW;
  zoomCamera(-4);
  const zoomOut = targetView < DEFAULT_VIEW;
  resetCameraZoom();
  for (let f = 0; f < 60; f++) updateVisuals(f * 0.016, 0.016);
  globalThis.__zoomReset = zoomIn && zoomOut && zoomReset &&
    Math.abs(cameraView - DEFAULT_VIEW) < 0.02;
`, ctx);
if (!vm.runInContext('globalThis.__zoomReset', ctx)) {
  throw new Error('Zoom-Reset stellt die Standard-Kamera nicht wieder her');
}

vm.runInContext(`
  cameraShake = 0;
  resetCameraZoom();
  panCameraPixels(240,0);
  const panned = Math.abs(cameraPan.x) > 0.2 && cameraFollow === false;
  panCameraPixels(100000,100000);
  const clamped = Math.abs(cameraPan.x) <= PAN_LIMIT_X + 0.001 &&
    Math.abs(cameraPan.z) <= PAN_LIMIT_Z + 0.001;
  for (let f = 0; f < 60; f++) updateVisuals(f * 0.016, 0.016);
  const movedCamera = Math.abs(camera.position.x - CAMERA_OFFSET.x) > 0.2 ||
    Math.abs(camera.position.z - CAMERA_OFFSET.z) > 0.2;
  resetCameraZoom();
  for (let f = 0; f < 200; f++) updateVisuals(f * 0.016, 0.016);
  globalThis.__cameraPan = panned && clamped && movedCamera &&
    cameraPan.x === 0 && cameraFollow === true &&
    Math.abs(cameraFocus.x - cameraDesired.x) < 0.1 &&
    Math.abs(cameraFocus.z - cameraDesired.z) < 0.1;
`, ctx);
if (!vm.runInContext('globalThis.__cameraPan', ctx)) {
  throw new Error('Freie Kamera-Bewegung (Pan/Reset) funktioniert nicht');
}

console.log(`Runtime OK: ${path.relative(root, htmlPath)} (menu, sim ${simTicks} ticks/${simOutcomes.wins}W-${simOutcomes.losses}L, core trio, mobs 500/500, elite/boss+bossbar+ownBossBar, kampfstatus+mobs+elitenZaehler+besiegteGegner+heldenwarnung+teamHp+enemyHp+mana+zauberbereit+gold+gold-gewinn+fokusHp+fokusName+fokusStatus+fokusCd+fokusAtk+fokusMeta+zielstatus+zielring+focus-quiet, mob-treffer-impuls, draft3+reroll+filter, items, krypto, stacks, bossbar-crit, sieg-toast, heal-btn, niederlage-toast, revive, timer ${timerText}, begegnung ${vm.runInContext('globalThis.__minMeetDist', ctx).toFixed(2)}, steinboden ${vm.runInContext('globalThis.__stoneTiles', ctx)}, vollbild ${vm.runInContext('globalThis.__fullGround', ctx)}, kamera-pan)`);
