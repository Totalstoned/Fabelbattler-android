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
      beginPath() {}, closePath() {}, moveTo() {}, lineTo() {},
      ellipse() {}, arc() {}, rect() {}, strokeRect() {}, clearRect() {},
      stroke() {}, save() {}, restore() {}, translate() {}, rotate() {}, scale() {},
      createRadialGradient: () => ({addColorStop() {}}),
      createLinearGradient: () => ({addColorStop() {}}),
    }),
    width: 720, height: 460, clientWidth: 720, clientHeight: 460,
    toDataURL: () => 'data:image/png;base64,stub',
  };
}

const elements = {};
const documentObj = {
  getElementById(id) { return elements[id] || (elements[id] = makeElement()); },
  createElement: makeElement,
  createElementNS: makeElement,
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
if (!html.includes('id="focusIntent"') || !html.includes('function updateFocusIntent') ||
    !html.includes('focusIntentValue')) {
  throw new Error('Elite/Boss-Aktionsanzeige im Fokus-Panel fehlt');
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
if (!html.includes('id="atlasOverlay"') || !html.includes('id="atlasFrame"') ||
    !html.includes('creatures/bigfoot/turntable.png') || !html.includes('function setAtlasFrame')) {
  throw new Error('Drehbarer Bigfoot-Atlas fehlt');
}
if (!html.includes('id="battleStatus"') || !html.includes('function updateBattleStatus') ||
    !html.includes('id="statusEnemies"') || !html.includes('id="statusHeroes"')) {
  throw new Error('Kampf-Status (Gegner/Helden) in der Kampfleiste fehlt');
}
if (!html.includes('const STATUS_RING_GEOMETRIES = {}') || !html.includes('function dominantStatusKey') ||
    !html.includes('Ringformen im Feld:') || !html.includes('shape:"danger"') ||
    !html.includes('shape:"control"') || !html.includes('shape:"boost"')) {
  throw new Error('Status-Formen (Dreieck/Viereck/Sechseck) fuer Farbblinde fehlen');
}
if (!html.includes('id="battleReport"') || !html.includes('function showBattleReport') ||
    !html.includes('function battleReportData') || !html.includes('hideBattleReport();') ||
    !html.includes('showBattleReport(true)') || !html.includes('showBattleReport(false)')) {
  throw new Error('Nachkampf-Auswertung (Schaden/Heilung/Top) fehlt');
}
if (!html.includes('hitStop:0') || !html.includes('function triggerHitStop') ||
    !html.includes('function visualFrameDt') || !html.includes('if(SIM.headless || G.phase !== "battle" || !G.battle || !(seconds > 0)) return false;') ||
    !html.includes('if(opts.crit && hasDamageFx(target)) triggerHitStop(HIT_STOP_CRIT)') ||
    !html.includes('if(hasDamageFx(u)) triggerHitStop(u.isBoss ? HIT_STOP_BOSS : HIT_STOP_KILL);') ||
    !html.includes('if(G.phase === "battle" && G.battle) updateBattle(dt);') ||
    !html.includes('const visualDt = visualFrameDt(dt)') || !html.includes('updateEffects(visualDt)') ||
    !html.includes('updateVisuals(visualClock,visualDt,dt)') ||
    !html.includes('function updateVisuals(time,dt,viewDt)')) {
  throw new Error('Visueller Hit-Stop bei Krit/Kill fehlt oder greift in die Simulation ein');
}
if (!html.includes('id="heroAlert"') || !html.includes('id="heroAlertCount"') ||
    !html.includes('function updateHeroAlert')) {
  throw new Error('Warnung für kritische Helden in der Kampfleiste fehlt');
}
if (!html.includes('id="teamHpBar"') || !html.includes('function updateTeamHpBar')) {
  throw new Error('Team-HP-Balken in der Kampfleiste fehlt');
}
if (html.includes('id="battleMana"') || html.includes('function updateBattleManaBar')) {
  throw new Error('Mana-Anzeige ist noch vorhanden');
}
if (!html.includes('NO_BATTLE_INTERVENTION = true')) {
  throw new Error('Kein automatischer Kampf ohne Eingriffe markiert');
}
if (!html.includes('label:"Verstärker"') || !html.includes('SPECIAL:{') ||
    !html.includes('label:"Sonderwesen"') || !html.includes('ROSTER.mothra.role = "SPECIAL"')) {
  throw new Error('Rollen Tank/DPS/Heiler/Verstärker/Sonderwesen fehlen');
}
if (!html.includes('renderer.setSize(w,h);')) {
  throw new Error('Renderer setzt die CSS-Größe nicht (Canvas wird auf HiDPI zu groß dargestellt)');
}
for (const id of ['mdRoleFilters', 'mdClassFilter', 'mdSynergy', 'hudItems', 'battleStatus', 'statusEnemies', 'statusFoeHeroes', 'statusMobs', 'statusHeroes', 'eliteInfo', 'statusElites', 'eliteInfoPlayer', 'statusElitesPlayer', 'battleKills', 'battleKillsValue', 'heroAlert', 'heroAlertCount', 'teamHpBar', 'teamHpFill', 'teamHpPct', 'enemyHpBar', 'enemyHpFill', 'enemyHpPct', 'battleGold', 'battleGoldValue', 'battleGoldGain', 'battleDudes', 'battleDudesValue', 'focusHp', 'focusName', 'focusHpValue', 'focusStatus', 'focusCd', 'focusCdValue', 'focusIntent', 'focusIntentValue', 'focusAtkValue', 'focusMeta', 'focusTarget', 'focusTargetName', 'focusTargetHp', 'focusTargetAtk', 'focusTargetCd', 'focusTargetStatus', 'playerBossBar', 'playerBossBarFill', 'playerBossBarPct', 'atlasOverlay', 'atlasFrame', 'atlasAngle', 'atlasPrev', 'atlasNext', 'atlasClose', 'battleReport', 'battleReportTitle', 'battleReportDamage', 'battleReportHeal', 'battleReportTop', 'btnReportClose', 'nextWavePreview']) {
  if (!html.includes(`id="${id}"`)) throw new Error(`Neues UI-Element fehlt: ${id}`);
}
if (!html.includes('function nextWavePreview') || !html.includes('G.phase === "battle" ? null : nextWavePreview(G.wave)')) {
  throw new Error('Wellen-Vorschau fehlt oder ist nicht an den Prep-HUD angebunden');
}
if (!html.includes('const RELICS = [') || !html.includes('function grantRelicForWave') ||
    !html.includes('const relic = grantRelicForWave(cleared);') ||
    !html.includes(' Relikt "+relic.emoji+" "+relic.name')) {
  throw new Error('Relikt-Belohnung nach Boss-Wellen fehlt');
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

// Die App startet jetzt mit Draft; Tests brauchen weiterhin ein Startteam.
vm.runInContext(`
  globalThis.__beginTestRun = function(){
    beginRun();
    closeDraft();
    G.team = CORE_UNITS.map(k => createUnit(k,1,"player"));
  };
`, ctx);

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
    if (G.phase === "prep" || G.phase === "draft") globalThis.__simOutcomes.wins++;
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
    updateUnitInfo();
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
  const fableKeys = ["gamera","gyaos","anguirus","kumonga","destoroyah","reineke","rotkaeppchen","dornroeschen","bremer","till"];
  fableKeys.forEach(k => {
    if (!ROSTER[k] || !MONSTER_STYLE[k]) throw new Error("Kaiju-/Fabelwesen fehlt: " + k);
  });
  if (Object.keys(ROSTER).some(k => /^zwergen/.test(k))) {
    throw new Error("Zwergenwesen sind noch im Roster");
  }
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
  // 3D-Details: Kaiju besitzen Krallen an Pfoten/Händen und Rückenplatten.
  const detailUnit = createUnit("shingodzilla",1,"player");
  const detailModel = makeCharacter(detailUnit).userData.model;
  globalThis.__kaijuDetailCheck = !!detailModel &&
    detailModel.children.some(c => c.userData && c.userData.claw) &&
    detailModel.children.filter(c => c.geometry && c.geometry.type === "ConeGeometry").length >= 8;
  // Fahrzeuge: echte Silhouetten statt Humanoid-Roboter; Rotoren drehen sich.
  const vehicleKeys=["panzer","feuerwehrwagen","krankenwagen","hubschrauber","kampfflugzeug","drohne"];
  const vehicleModels=vehicleKeys.map(k=>makeCharacter(createUnit(k,1,"enemy")));
  const vehicleShapes=vehicleModels.map(g=>g.userData.model.children.filter(c=>c.userData&&c.userData.vehicle).length);
  const mecha=makeCharacter(createUnit("mechagodzilla",1,"player"));
  globalThis.__vehicleCheck=vehicleShapes.every(n=>n>=4) && new Set(vehicleShapes).size>1 &&
    mecha.userData.model.children.every(c=>!c.userData || !c.userData.vehicle);
  const heli=vehicleModels[3], rotor=heli.userData.rotors[0];
  const rotBefore=rotor ? rotor.rotation.y : 0;
  if(rotor) poseCharacter(heli.userData.u,heli,1,0.2,1);
  globalThis.__rotorCheck=!!rotor && Math.abs(rotor.rotation.y-rotBefore)>0.1;
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
  globalThis.__startDraftCheck = G.phase === "draft" && G.team.length === 0 &&
    G.teamSize === 3 && G.gold === 20 && rerollCost() === 2;
  G.team = CORE_UNITS.map(k => createUnit(k,1,"player"));
  globalThis.__coreCheck = G.teamSize === 3 && G.team.length === 3 &&
    G.team.map(u => u.key + ":" + u.role).join(",") === "bigfoot:TANK,chupacabra:DPS,fee:HEALER";
  closeDraft();
  startBattle();
  globalThis.__coreBattleCheck = !!G.battle && G.battle.player.length === 3 && G.battle.enemies.length === 3;
  globalThis.__bigMapCheck = GRID.cols === 18 && GRID.rows === 14 && MAP_SPEED >= 2;
  globalThis.__portraitCheck = typeof portraitUrl === "function" &&
    portraitUrl("bigfoot").indexOf("data:image/png") === 0 &&
    typeof makePortraitSprite === "function" &&
    ORIGIN_META[unitOrigin("kappa")].label === "Japanisch";
`, ctx);

if (!vm.runInContext('globalThis.__startDraftCheck', ctx)) {
  throw new Error('Startauswahl: Runde beginnt ohne Team im Draft mit 20 Gold');
}
if (!vm.runInContext('globalThis.__coreCheck', ctx)) {
  throw new Error('Basis-Trio als Startteam fehlt oder hat falsche Rollen');
}
if (!vm.runInContext('globalThis.__bigMapCheck', ctx)) {
  throw new Error('Schlachtfeld ist nicht vergroessert (18x14, MAP_SPEED)');
}
vm.runInContext(`(() => {
  const layouts = [];
  for (let s = 0; s < 24; s++) layouts.push(makeMapLayout(7,s));
  const corners = new Set(layouts.map(l => l.corner.gx+","+l.corner.gy));
  const biomes = new Set(layouts.map(l => l.biomeIndex));
  const modes = new Set(layouts.map(l => l.mode));
  const biome = prepareMap(3,5);
  prepareMap(3,6);
  globalThis.__habitatCount = ARENA_BIOMES.length;
  globalThis.__biomeCheck = ARENA_BIOMES.length === 8 &&
    layouts.some(l => l.water) && layouts.some(l => !l.water) &&
    corners.size > 1 && biomes.size > 1 && modes.size > 1 &&
    JSON.stringify(makeMapLayout(7,5)) === JSON.stringify(makeMapLayout(7,5)) &&
    biome.label === ARENA_BIOMES[MAP_LAYOUT.biomeIndex].label &&
    waterMesh.visible === !!biome.water &&
    scene.background.getHex() === biome.sky && scene.fog.color.getHex() === biome.fog;
})();`, ctx);
if (!vm.runInContext('globalThis.__biomeCheck', ctx)) {
  throw new Error('Zufällige Habitate mit Meer/Wasser und wechselnder Stadt fehlen');
}
if (!vm.runInContext('globalThis.__portraitCheck', ctx)) {
  throw new Error('Wesen-Grafiken aus aller Welt fehlen');
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
  const costs = [rerollCost()];
  rerollDraft(); costs.push(rerollCost());
  rerollDraft(); costs.push(rerollCost());
  rerollDraft(); costs.push(rerollCost());
  rerollDraft(); costs.push(rerollCost());
  globalThis.__rerollCheck = costs.join(",") === "2,3,4,4,4" &&
    G.gold === goldBefore - 13;
  G.phase = "menu";
  G.battle = null;
  G.team = [createUnit("bigfoot",1,"player"),createUnit("chupacabra",1,"player"),createUnit("fee",1,"player")];
  G.teamSize = 4;
  G.gold = 0;
  startBattle();
  globalThis.__stowGoldCheck = G.phase === "battle" && G.battle && G.battle.player.length === 3;
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
  G.phase = "prep";
  G.battle = null;
  G.team = [createUnit("bigfoot",1,"player")];
  G.teamSize = 3;
  G.wave = 1;
  const sizeBefore = G.teamSize;
  winBattle();
  globalThis.__growthCheck = G.teamSize === sizeBefore + 1 && G.wave === 2 &&
    G.phase === "draft" && G.team.length < G.teamSize;
  globalThis.__foeOnlyCheck = Object.keys(ENEMY_ONLY).length === 18 &&
    Object.keys(ENEMY_ONLY).every(k => ROSTER[k] && ROSTER[k].ability === k+"_sig" &&
      HUMAN_TECH[k] && SPELLS[HUMAN_TECH[k]] && ROSTER[k].spell === HUMAN_TECH[k] &&
      ABILITY_DESC[k+"_sig"] === HUMAN_TECH_DESC[k] &&
      FOE_KEYS.includes(k) && !ALL_KEYS.includes(k));
  const abilityCounts = {};
  Object.keys(ROSTER).forEach(k => {
    const a = ROSTER[k].ability;
    abilityCounts[a] = (abilityCounts[a]||0)+1;
  });
  const familyAbilities = Object.keys(FAMILY_SIG).map(f => FAMILY_SIG[f].ability);
  globalThis.__uniqueAbilities = Object.keys(abilityCounts).length === 118 &&
    Object.keys(abilityCounts).every(a => abilityCounts[a] === 1 || familyAbilities.includes(a)) &&
    abilityCounts.atomatem === 5 && abilityCounts.brusttrommeln === 2;
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
  throw new Error('Draft-Reroll kostet nicht 2, dann 3, dann 4 (danach 4) Gold');
}
if (!vm.runInContext('globalThis.__stowGoldCheck', ctx)) {
  throw new Error('Nach viel Reroll mit keinem Gold darf der Kampf trotzdem starten');
}
if (!vm.runInContext('globalThis.__growthCheck', ctx)) {
  throw new Error('Team waechst nicht pro Runde um 1 Einheit');
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
if (!vm.runInContext('globalThis.__uniqueAbilities', ctx)) {
  throw new Error('Fähigkeiten sind nicht eindeutig (nur Godzilla/Kong-Familien dürfen sich teilen)');
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
if (!html.includes('function draftGapLabel') || !html.includes('<span class="gap-fill">') ||
    !html.includes('gap-fill-card')) {
  throw new Error('Draft-Karten markieren keine fehlenden Rollen');
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
  const late = createUnit("bigfoot",1,"player");
  setUnitLevel(late,100);
  globalThis.__level100Stats = late.level === 100 && Number.isFinite(late.maxHp) &&
    Number.isFinite(late.atk) && late.maxHp > ROSTER.bigfoot.hp*20 &&
    late.atk > ROSTER.bigfoot.atk*15;
  G.phase = "draft";
  G.team = [late];
  const latePreview = draftPreviewStats("bigfoot",100);
  globalThis.__level100Preview = latePreview.hp > ROSTER.bigfoot.hp*20 &&
    latePreview.atk > ROSTER.bigfoot.atk*15;
  G.team = [];
  G.phase = "menu";
`, ctx);
if (!vm.runInContext('globalThis.__level100Stats', ctx)) {
  throw new Error('Level 100 skaliert HP/ATK nicht endlich und deutlich hoch');
}
if (!vm.runInContext('globalThis.__level100Preview', ctx)) {
  throw new Error('Draft-Vorschau unterstützt Level 100 nicht');
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

// Der Statusring muss die Wirkungsklasse auch ohne Farbe zeigen und zur
// passenden Geometrie wechseln (inkl. Spott und Ruhezustand).
vm.runInContext(`
  G.phase = "menu";
  G.battle = null;
  __beginTestRun();
  startBattle();
  const shapeUnit = G.battle.player[0];
  const shapeGroup = unitGroups.get(shapeUnit.id);
  shapeUnit.statuses = {burn:2};
  shapeUnit.statusPower = {};
  updateVisuals(1,0.016);
  globalThis.__shapeDanger = !!shapeGroup && shapeGroup.userData.statusRing.visible &&
    shapeGroup.userData.statusRing.geometry === STATUS_RING_GEOMETRIES.danger &&
    shapeGroup.userData.statusRing.material.color.getHex() === STATUS_META.burn.hex;
  shapeUnit.statuses = {stun:2};
  updateVisuals(1,0.016);
  globalThis.__shapeControl = shapeGroup.userData.statusRing.geometry === STATUS_RING_GEOMETRIES.control;
  shapeUnit.statuses = {atkBuff:2};
  updateVisuals(1,0.016);
  globalThis.__shapeBoost = shapeGroup.userData.statusRing.geometry === STATUS_RING_GEOMETRIES.boost;
  shapeUnit.statuses = {};
  shapeUnit.modsEffective = {taunt:true};
  updateVisuals(1,0.016);
  globalThis.__shapeTaunt = shapeGroup.userData.statusRing.visible &&
    shapeGroup.userData.statusRing.geometry === STATUS_RING_GEOMETRIES.boost;
  shapeUnit.modsEffective = {};
  updateVisuals(1,0.016);
  globalThis.__shapeClear = !shapeGroup.userData.statusRing.visible;
  const legendUnit = createUnit("fee",1,"player");
  legendUnit.statuses = {burn:1};
  globalThis.__shapeLegend = /▲ Schaden/.test(statusShapeLegend()) &&
    /◆ Kontrolle/.test(statusShapeLegend()) && /⬢ Verstärkung/.test(statusShapeLegend()) &&
    /▲ 🔥 Brand/.test(statusText(legendUnit));
  G.phase = "menu";
  G.battle = null;
`, ctx);

for (const [flag, message] of [
  ['__shapeDanger', 'Statusring zeigt Schaden nicht als Dreieck'],
  ['__shapeControl', 'Statusring zeigt Kontrolle nicht als Viereck'],
  ['__shapeBoost', 'Statusring zeigt Verstaerkung nicht als Sechseck'],
  ['__shapeTaunt', 'Spott zeigt keinen Statusring ohne aktiven Status'],
  ['__shapeClear', 'Statusring verschwindet nicht ohne Status'],
  ['__shapeLegend', 'Formen-Legende fehlt in der Einheiten-Info'],
]) {
  if (!vm.runInContext(`globalThis.${flag}`, ctx)) throw new Error(message);
}

vm.runInContext(`
  const w1 = mobWaveSize(1,"enemy"), w20 = mobWaveSize(20,"enemy"), w40 = mobWaveSize(40,"enemy");
  globalThis.__mobSizeCheck = w1 >= 4 && w20 > w1 && w40 === 500 && mobWaveSize(40,"player") === 500;
  G.phase = "menu";
  G.battle = null;
  G.teamSize = 3;
  G.team = ["bigfoot","chupacabra","fee"].map(k => createUnit(k,1,"player"));
  __beginTestRun();
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

vm.runInContext(`(() => {
  // Fünf Monster-Archetypen mit fünf paarweise verschiedenen Effekten.
  const mfx = MONSTER_MOB_KEYS.map(k => MOB_ARCHETYPES[k].effect);
  globalThis.__mobEffectCheck = MONSTER_MOB_KEYS.length === 5 &&
    new Set(mfx).size === 5 && mfx.every(e => STATUS_META[e]) &&
    HUMAN_MOB_KEYS.length === 7 &&
    HUMAN_MOB_KEYS.every(k => MOB_ARCHETYPES[k].human && STATUS_META[MOB_ARCHETYPES[k].effect]) &&
    MOB_ARCHETYPES.panzer.shape === "tank" && MOB_ARCHETYPES.feuerwehr.shape === "truck";

  // Menschen-Lager: 2x bis 20x mehr Menschen als Monster, Rentner am schwächsten.
  globalThis.__ratioCheck = humanSuperiority(1) === 2 &&
    humanSuperiority(40) === 15 && humanSuperiority(100) === 20;
  globalThis.__weakRentner = MOB_ARCHETYPES.rentner.hp < MOB_ARCHETYPES.kriecher.hp &&
    MOB_ARCHETYPES.rentner.atk < MOB_ARCHETYPES.kriecher.atk;
  G.phase = "menu"; G.battle = null; __beginTestRun();
  G.wave = 1; startBattle();
  globalThis.__humanField1 = countHumans(G.battle) >= 2*countMonsters(G.battle) &&
    countHumans(G.battle) > countMonsters(G.battle);
  G.phase = "menu"; G.battle = null; __beginTestRun();
  G.wave = 40; startBattle();
  globalThis.__humanField40 = countHumans(G.battle) >= 2*countMonsters(G.battle) &&
    countHumans(G.battle) >= 10*countMonsters(G.battle) &&
    G.battle.enemyMobs.length === mobWaveSize(40,"enemy");
  globalThis.__humanField40H = countHumans(G.battle);
  globalThis.__humanField40M = countMonsters(G.battle);
  globalThis.__signatureCount = new Set(Object.keys(ROSTER).map(k => ROSTER[k].ability)).size;
  // Stationierung ist relativ zur Stadtecke: front naeher am Feldzentrum,
  // Rueckzug weiter weg – bei linker und rechter Stadt gleichermassen.
  const center = (GRID.cols-1)/2;
  const avgDist = list => list.reduce((s,m) => s+Math.abs(m.grid.gx-center),0)/Math.max(1,list.length);
  // Feste Karte: sonst verschiebt die Zahl der Siege den Salz-Wert und der
  // Check würde von Garnisonen abhängen statt von der Stationierungslogik.
  const savedSalt = G.mapSalt;
  prepareMap(40,3);
  const stationList = buildMobSwarm("enemy",40);
  const front = stationList.filter(m => m.key === "mob_landsturmsoldat" || m.key === "mob_mythenzerstoerer");
  const back = stationList.filter(m => m.key === "mob_rentner" || m.key === "mob_feldsanitaeter");
  globalThis.__stationCheck = front.length > 0 && back.length > 0 && avgDist(front) < avgDist(back);
  prepareMap(40,savedSalt); G.mapSalt = savedSalt;

  // Zehn Klassen, zehn menschliche Spezialisten mit Gegenbonus.
  const covered = Object.keys(HUMAN_COUNTER);
  globalThis.__counterCheck = covered.length === Object.keys(CLASS_META).length &&
    covered.every(cls => HUMAN_COUNTER[cls] &&
      (ROSTER[HUMAN_COUNTER[cls]] || MOB_ARCHETYPES[HUMAN_COUNTER[cls]])) &&
    Object.keys(ENEMY_ONLY).every(k => HUMAN_UNIT_COUNTER[k] &&
      ROSTER[k].counterClass === HUMAN_UNIT_COUNTER[k]);
  // Zufällige Stadt: Häuser, Gräben, Barrikaden, Wachturm und echte Deckung.
  const coverCells = [...TOWN_COVER];
  globalThis.__townDefenseCheck = !!townLayer && townLayer.children.length >= 15 &&
    !!wildLayer && wildLayer.children.length >= 8 &&
    coverCells.length >= 12 && TOWN_POSTS.front.length > 0 && TOWN_POSTS.back.length > 0 &&
    townLayer.children.some(o => o.geometry && o.geometry.parameters &&
      o.geometry.parameters.height >= 1.5) &&
    HABITAT_SCALE.kaiju > HABITAT_SCALE.building &&
    HABITAT_SCALE.building > HABITAT_SCALE.human;
  globalThis.__townStructures = townLayer ? townLayer.children.length : 0;
  globalThis.__coverCells = coverCells.length;
  globalThis.__humanCoverCheck = G.battle.enemyMobs.filter(m => m.isHuman).every(m =>
    m.guard && TOWN_COVER.has(Math.round(m.guard.gx)+","+Math.round(m.guard.gy))) &&
    G.battle.enemyMobs.some(m => m.isHuman && hasCover(m));
  const parts = coverCells[0].split(",").map(Number);
  const coverUnit = createMob("rentner","enemy",1), exposed = createMob("rentner","enemy",1);
  coverUnit.grid.gx = parts[0]; coverUnit.grid.gy = parts[1];
  exposed.grid.gx = -99; exposed.grid.gy = -99;
  const wasHeadless = SIM.headless;
  SIM.headless = true;
  const dCovered = applyDamage(coverUnit,10,null), dExposed = applyDamage(exposed,10,null);
  SIM.headless = wasHeadless;
  globalThis.__coverDamageCheck = dCovered < dExposed;
  // Hoehenvorteil: Turm > Haus > Mauer > Graben > freies Feld. Menschen sind
  // deutlich kleiner als Monumente und stehen in offenen, begehbaren Haeusern.
  const coverCellsByKind = [...TOWN_CELL_BY_KEY.values()];
  const rangeAt = kind => {
    const cell = coverCellsByKind.find(p => p.kind === kind);
    if(!cell) return -1;
    const probe = createMob("rentner","enemy",1);
    probe.grid.gx = cell.gx; probe.grid.gy = cell.gy;
    return coverRangeBonus(probe);
  };
  const exposedProbe = createMob("rentner","enemy",1);
  exposedProbe.grid.gx = -99; exposedProbe.grid.gy = -99;
  globalThis.__heightRangeCheck = rangeAt("tower") > rangeAt("house") &&
    rangeAt("house") >= rangeAt("wall") && rangeAt("wall") >= rangeAt("trench") &&
    rangeAt("trench") >= coverRangeBonus(exposedProbe) && HABITAT_SCALE.human <= 0.3;
  globalThis.__walkableHouseCheck = townLayer.children.filter(o => o.geometry &&
    o.geometry.parameters && Math.abs(o.geometry.parameters.height-0.08) < 0.001).length >= 5;

  // Helden-Garnison: Haus-/Turmplätze, Höhenbonus, Halten bis Feindkontakt.
  assignGarrisons();
  const garKeys = G.team.map(u => u.garrison && (u.garrison.gx+","+u.garrison.gy));
  globalThis.__garrisonCheck = G.team.every(u => !!u.garrison &&
    TOWN_COVER.has(u.garrison.gx+","+u.garrison.gy) &&
    Math.abs(u.grid.gx-u.garrison.gx) < 0.01 &&
    Math.abs(u.grid.gy-u.garrison.gy) < 0.01 &&
    hasCover(u) && atGarrison(u)) &&
    new Set(garKeys).size > 1 && G.team.some(u => u.garrison.kind === "tower") &&
    coverRangeBonus(G.team[0]) > coverRangeBonus(exposedProbe);
  const emptyFoeBattle = {player:[],enemies:[],playerMobs:[],enemyMobs:[]};
  const nearFoe = createMob("kriecher","enemy",1);
  nearFoe.grid.gx = G.team[0].garrison.gx; nearFoe.grid.gy = G.team[0].garrison.gy;
  const nearFoeBattle = {player:[],enemies:[nearFoe],playerMobs:[],enemyMobs:[]};
  globalThis.__garrisonHoldCheck = garrisonHold(G.team[0],emptyFoeBattle) &&
    !garrisonHold(G.team[0],nearFoeBattle);
  globalThis.__humanElevationCheck = G.battle && G.battle.enemyMobs.some(m => m.isHuman && m.guard) &&
    G.battle.enemyMobs.filter(m => m.isHuman && m.guard).every(m =>
      !!TOWN_CELL_BY_KEY.get(m.guard.gx+","+m.guard.gy));
  globalThis.__garrisonSlots = garKeys.length;

  // Fünf Angriffsformationen: einzeln, paarweise, zu dritt, Schwarm, zwei Seiten.
  const byMode = {};
  for (let salt = 0; salt < 80 && Object.keys(byMode).length < ATTACK_MODES.length; salt++) {
    prepareMap(8,salt);
    const mode = MAP_LAYOUT.mode;
    if (byMode[mode]) continue;
    byMode[mode] = buildMobSwarm("enemy",8).filter(m => !m.isHuman);
  }
  globalThis.__attackModeCheck = Object.keys(byMode).length === ATTACK_MODES.length &&
    byMode.einzel.every((m,i) => i === 0 || m.arrivalDelay >= byMode.einzel[i-1].arrivalDelay) &&
    new Set(byMode.einzel.map(m => Math.round(m.grid.gx))).size === 1 &&
    new Set(byMode.paar.map(m => m.spawnGroup)).size === 2 &&
    new Set(byMode.trio.map(m => m.spawnGroup)).size === 3 &&
    byMode.schwarm.every(m => m.arrivalDelay === 0 && m.spawnGroup === 0) &&
    new Set(byMode["zwei-seiten"].map(m => m.spawnEdge)).size === 2;
  globalThis.__attackModes = Object.keys(byMode).length;

  // Prozedurale Städte: wechselnde Zahl von Deckungsfeldern und Höhen,
  // aber immer Graben < Mauer < Haus < Turm und offene Wege fuer Angreifer.
  const citySamples = [];
  for (let wave = 1; wave <= 8; wave++) {
    prepareMap(wave, wave*3);
    const cells = [...TOWN_CELL_BY_KEY.values()];
    const houses = cells.filter(c => c.kind === "house").map(c => c.height);
    const walls = cells.filter(c => c.kind === "wall").map(c => c.height);
    const trenches = cells.filter(c => c.kind === "trench").map(c => c.height);
    const tower = cells.find(c => c.kind === "tower");
    citySamples.push({n:cells.length, houses:houses.length, wild:wildLayer.children.length,
      props:propsLayer ? propsLayer.children.length : 0,
      signs:propsLayer ? propsLayer.children.filter(o => o.userData && o.userData.sign).length : 0,
      highrises:propsLayer ? propsLayer.children.filter(o => o.userData && o.userData.highrise).length : 0,
      crossings:propsLayer ? propsLayer.children.filter(o => o.userData && o.userData.crossing).length : 0,
      pylons:propsLayer ? propsLayer.children.filter(o => o.userData && o.userData.pylon).length : 0,
      traffic:propsLayer ? propsLayer.children.filter(o => o.userData && o.userData.traffic).length : 0,
      vending:propsLayer ? propsLayer.children.filter(o => o.userData && o.userData.vending).length : 0,
      cranes:propsLayer ? propsLayer.children.filter(o => o.userData && o.userData.crane).length : 0,
      containers:propsLayer ? propsLayer.children.filter(o => o.userData && o.userData.container).length : 0,
      powerlines:propsLayer ? propsLayer.children.filter(o => o.userData && o.userData.powerline).length : 0,
      torii:propsLayer ? propsLayer.children.filter(o => o.userData && o.userData.torii).length : 0,
      pagoda:propsLayer ? propsLayer.children.filter(o => o.userData && o.userData.pagoda).length : 0,
      taxi:propsLayer ? propsLayer.children.filter(o => o.userData && o.userData.taxi).length : 0,
      kana:propsLayer ? propsLayer.children.filter(o => o.userData && o.userData.kanaSign).length : 0,
      skyline:skylineLayer.children.filter(o => o.userData && o.userData.skyline).length,
      neon:skylineLayer.children.filter(o => o.userData && o.userData.skylineGlow).length,
      billboards:skylineLayer.children.filter(o => o.userData && o.userData.skylineBillboard).length,
      ok:!!tower && Math.min(...walls) >= 0.5 && Math.min(...houses) >= 0.65 &&
        tower.height > Math.max(...houses) && Math.max(...trenches) < Math.min(...walls)});
  }
  globalThis.__cityCounts = citySamples.map(s => s.n).join("/");
  globalThis.__procCityCheck = new Set(citySamples.map(s => s.n)).size > 1 &&
    new Set(citySamples.map(s => s.houses)).size > 1 &&
    citySamples.every(s => s.n >= 12 && s.wild >= 8 && s.ok);
  globalThis.__propsCount = citySamples.map(s => s.props).join("/");
  globalThis.__cityPropsCheck = citySamples.every(s => s.props >= 20 &&
    s.signs > 0 && s.highrises > 0 && s.crossings > 0 &&
    s.pylons > 0 && s.cranes > 0 && s.containers > 0 && s.powerlines > 0 &&
    s.traffic >= 15 && s.vending >= 8) &&
    new Set(citySamples.map(s => s.props)).size > 1;
  globalThis.__japanCityCheck = citySamples.every(s =>
    s.torii >= 12 && s.pagoda >= 2 && s.taxi >= 10 && s.kana >= 3);
  globalThis.__skylineCounts = citySamples.map(s => s.skyline+"+"+s.billboards).join("/");
  globalThis.__skylineCheck = citySamples.every(s => s.skyline >= 18 && s.neon > 0 && s.billboards > 0) &&
    new Set(citySamples.map(s => s.skyline)).size > 1;
  const neon = skylineLayer.children.find(o => o.userData && o.userData.skylineGlow);
  const neonBefore = neon ? neon.material.opacity : 0;
  updateVisuals(2.5,0,0);
  globalThis.__neonCheck = !!neon && Math.abs(neon.material.opacity-neonBefore) > 0.01;
  // Staubwolken sind reine FX: sie duerfen die Headless-Simulation nicht beruehren.
  const dustHeadless = SIM.headless;
  SIM.headless = false;
  const dustBefore = G.particles.length;
  spawnDustAt(2,2);
  const dustObj = G.particles[G.particles.length-1] && G.particles[G.particles.length-1].obj;
  globalThis.__dustCheck = G.particles.length === dustBefore+1 &&
    !!dustObj && !!dustObj.userData.dust;
  if(dustObj){ fxLayer.remove(dustObj); disposeObject(dustObj); G.particles.pop(); }
  SIM.headless = dustHeadless;

  const waterSalt = (() => { let s = 0; while(s < 50 && !makeMapLayout(8,s).water) s++; return s; })();
  prepareMap(8,waterSalt);
  const seaMobs = buildMobSwarm("player",8).filter(m => !m.isHuman);
  globalThis.__seaSpawnCheck = waterMesh.visible && seaMobs.length > 0 &&
    seaMobs.some(m => MAP_LAYOUT.seaLeft ? m.grid.gx < 3 : m.grid.gx > GRID.cols-4);

  // Angreifer warten wirklich auf ihre Staffel, bevor sie ziehen.
  let arrivalSalt = 0;
  while(arrivalSalt < 50 && makeMapLayout(1,arrivalSalt).mode === "schwarm") arrivalSalt++;
  G.phase = "menu"; G.battle = null; __beginTestRun();
  G.wave = 1; G.mapSalt = arrivalSalt-1; startBattle();
  const lateArrival = G.battle.enemyMobs.find(m => !m.isHuman && m.arrivalDelay > 0);
  if (lateArrival) {
    const gx = lateArrival.grid.gx, gy = lateArrival.grid.gy;
    for (let f = 0; f < 5 && G.battle; f++) simulateBattle(0.016);
    globalThis.__arrivalCheck = lateArrival.grid.gx === gx && lateArrival.grid.gy === gy;
  } else globalThis.__arrivalCheck = false;

  // Jeder Kampf bekommt eine neue Karte, auch bei gleicher Welle.
  G.phase = "menu"; G.battle = null; __beginTestRun(); G.wave = 3;
  const saltBefore = G.mapSalt;
  startBattle();
  const firstLayout = JSON.stringify(MAP_LAYOUT);
  G.phase = "menu"; G.battle = null;
  startBattle();
  globalThis.__freshMapCheck = firstLayout !== JSON.stringify(MAP_LAYOUT) &&
    G.mapSalt >= saltBefore+2;

  G.phase = "menu";
  G.battle = null;
})();`, ctx);

for (const [flag, message] of [
  ['__mobEffectCheck', 'Monster/Menschen-Archetypen haben zu wenige verschiedene Effekte'],
  ['__ratioCheck', 'Menschen-Überzahl wächst nicht von 2x auf 20x'],
  ['__weakRentner', 'Rentner sind nicht schwächer als Monster'],
  ['__humanField1', 'Welle 1: nicht mindestens doppelt so viele Menschen wie Monster'],
  ['__humanField40', 'Welle 40: Menschen überragen Monster nicht deutlich genug'],
  ['__counterCheck', 'Nicht jede Klasse hat einen menschlichen Spezialisten'],
  ['__stationCheck', 'Sanitäter/Rentner stehen nicht hinter den Soldaten'],
  ['__townDefenseCheck', 'Zufällige Stadt mit Häusern/Gräben/Barrikaden/Wachturm fehlt'],
  ['__procCityCheck', 'Prozedurale Stadt variiert nicht oder Hoehen/Wege sind ungueltig'],
  ['__cityPropsCheck', 'Stadt-Requisiten (Laternen/Wracks/Truemmer/Rauch) fehlen'],
  ['__japanCityCheck', 'Japanische Kulisse (Torii/Pagode/Neon/Taxis) fehlt'],
  ['__humanCoverCheck', 'Menschen werden nicht in der Stadt stationiert'],
  ['__coverDamageCheck', 'Städtische Deckung reduziert keinen Schaden'],
  ['__heightRangeCheck', 'Höhenvorteil erhöht die Reichweite nicht'],
  ['__walkableHouseCheck', 'Häuser sind nicht begehbar'],
  ['__garrisonCheck', 'Helden werden nicht in Häusern/Türmen stationiert'],
  ['__garrisonHoldCheck', 'Garnison hält nicht oder verlässt das Haus bei Feindkontakt nicht'],
  ['__humanElevationCheck', 'Menschen haben keine sichtbare Deckungs-Position'],
  ['__kaijuDetailCheck', 'Kaiju-Modell hat keine Krallen/Rückenplatten'],
  ['__vehicleCheck', 'Panzer/Feuerwehr/Hubschrauber/Jet/Drohne haben keine Fahrzeug-Geometrie'],
  ['__rotorCheck', 'Hubschrauber-Rotor dreht sich nicht'],
  ['__skylineCheck', 'Hintergrund-Skyline fehlt oder variiert nicht'],
  ['__neonCheck', 'Neon-Kronen der Skyline pulsieren nicht'],
  ['__dustCheck', 'Kaiju-Staubwolken fehlen oder greifen in die Simulation ein'],
  ['__attackModeCheck', 'Angriffsformationen (einzeln/paar/trio/Schwarm/zwei Seiten) fehlen'],
  ['__seaSpawnCheck', 'Kaiju kommen nicht aus dem Meer'],
  ['__arrivalCheck', 'Gestaffelte Ankunft der Monster greift nicht'],
  ['__freshMapCheck', 'Kampf bekommt keine neue zufällige Karte'],
]) {
  if (!vm.runInContext(`globalThis.${flag}`, ctx)) throw new Error(message);
}

vm.runInContext(`
  G.phase = "menu";
  G.battle = null;
  __beginTestRun();
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
  __beginTestRun();
  G.wave = 5;
  startBattle();
  globalThis.__eliteCheck = G.battle.enemyMobs.some(m => m.isElite) && !G.battle.enemyMobs.some(m => m.isBoss);
  __beginTestRun();
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
  __beginTestRun();
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
  __beginTestRun();
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
  __beginTestRun();
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
  __beginTestRun();
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
  __beginTestRun();
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
  __beginTestRun();
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
  __beginTestRun();
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

if (['battleMana', 'battleManaFill', 'battleManaValue', 'manaBar', 'manaHealReady', 'manaNovaReady']
    .some(id => html.includes(`id="${id}"`))) {
  throw new Error('Mana-Anzeige ist noch im UI vorhanden');
}
if (['btnHeal', 'btnNova', 'btnBattleHeal', 'btnBattleNova', 'btnItemHeal', 'btnItemShield',
     'btnItemNova', 'btnPause'].some(id => html.includes(`id="${id}"`))) {
  throw new Error('Aktive Eingriffe im Kampf sind noch im UI vorhanden');
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
  const camBtn = document.getElementById("btnZoomReset");
  const followShown = camBtn.textContent.indexOf("Folgen") >= 0 &&
    !camBtn.classList.contains("camfree");
  panCameraPixels(240,0);
  const panned = Math.abs(cameraPan.x) > 0.2 && cameraFollow === false;
  const freeShown = camBtn.textContent.indexOf("Frei") >= 0 &&
    camBtn.classList.contains("camfree") && /Doppelklick/.test(camBtn.title);
  panCameraPixels(100000,100000);
  const clamped = Math.abs(cameraPan.x) <= PAN_LIMIT_X + 0.001 &&
    Math.abs(cameraPan.z) <= PAN_LIMIT_Z + 0.001;
  for (let f = 0; f < 60; f++) updateVisuals(f * 0.016, 0.016);
  const movedCamera = Math.abs(camera.position.x - CAMERA_OFFSET.x) > 0.2 ||
    Math.abs(camera.position.z - CAMERA_OFFSET.z) > 0.2;
  resetCameraZoom();
  const resetShown = camBtn.textContent.indexOf("Folgen") >= 0 &&
    !camBtn.classList.contains("camfree");
  for (let f = 0; f < 200; f++) updateVisuals(f * 0.016, 0.016);
  globalThis.__cameraPan = panned && clamped && movedCamera &&
    cameraPan.x === 0 && cameraFollow === true &&
    Math.abs(cameraFocus.x - cameraDesired.x) < 0.1 &&
    Math.abs(cameraFocus.z - cameraDesired.z) < 0.1;
  globalThis.__cameraModeButton = followShown && freeShown && resetShown;
`, ctx);
if (!vm.runInContext('globalThis.__cameraPan', ctx)) {
  throw new Error('Freie Kamera-Bewegung (Pan/Reset) funktioniert nicht');
}
if (!vm.runInContext('globalThis.__cameraModeButton', ctx)) {
  throw new Error('Kamera-Modus wird am Zoom-Button nicht angezeigt');
}

vm.runInContext(`
  const atlasEl = document.getElementById("atlasFrame");
  const opened = openCreatureAtlas("bigfoot") &&
    document.getElementById("atlasOverlay").classList.contains("show");
  setAtlasFrame(0);
  const p0 = atlasEl.style.backgroundPosition;
  const a0 = document.getElementById("atlasAngle").textContent;
  rotateCreatureAtlas(1);
  const p1 = atlasEl.style.backgroundPosition;
  rotateCreatureAtlas(3);
  const p4 = atlasEl.style.backgroundPosition;
  const a4 = document.getElementById("atlasAngle").textContent;
  const wrapped = setAtlasFrame(8) === 0 && setAtlasFrame(-1) === 7;
  const chupa = openCreatureAtlas("chupacabra") &&
    atlasEl.style.backgroundImage.indexOf("creatures/chupacabra/turntable.png") >= 0;
  const fee = openCreatureAtlas("fee") &&
    atlasEl.style.backgroundImage.indexOf("creatures/fee/turntable.png") >= 0;
  const godzilla = openCreatureAtlas("godzilla") &&
    atlasEl.style.backgroundImage.indexOf("creatures/godzilla/turntable.png") >= 0;
  const kaijuKeys = ["kingkong","mothra","mechagodzilla","kingghidorah","rodan","shingodzilla",
    "burninggodzilla","minilla","gamera","anguirus","kumonga","destoroyah",
    "queenmuto","scarking","methuselah","warbat","shimo","godzillaearth",
    "bagan","oni","gyaos"];
  const kaijuOK = kaijuKeys.every(k => openCreatureAtlas(k) &&
    atlasEl.style.backgroundImage.indexOf("creatures/"+k+"/turntable.png") >= 0);
  const mythKeys = ["vampire","werewolf","hydra","hotzenplotz","ruebezahl",
    "waldschrat","medusa","dschinn","kappa","sukubus","lilith","goblin","alp",
    "blaubart","hexe","quetzalcoatl","ammit","tengu","yama","anansi","selkie",
    "nessie","mothman","jerseydevil","skinwalker","reineke","rotkaeppchen"];
  const mythOK = mythKeys.every(k => openCreatureAtlas(k) &&
    atlasEl.style.backgroundImage.indexOf("creatures/"+k+"/turntable.png") >= 0);
  const folkloreKeys = ["rumpelstilzchen","heinzelmaennchen","wichtigel","gartenelfe","lichtfee","schatten",
    "klabautermann","moosweiblein","aufhocker","fernrisswolf","kroetenmoench","panzer",
    "babajaga","mamiwata","nachtzerrer","sensenmann","oma","opa",
    "soldat","kampftruppe","feuerwehr","hubschrauber","krankenwagen","drohne",
    "missionar","sanitaeter","rebelle","armee","bundeswehr","soeldner"];
  const folkloreOK = folkloreKeys.every(k => openCreatureAtlas(k) &&
    atlasEl.style.backgroundImage.indexOf("creatures/"+k+"/turntable.png") >= 0);
  const unknown = !openCreatureAtlas("goblin-alt");
  closeCreatureAtlas();
  const closed = !document.getElementById("atlasOverlay").classList.contains("show");
  globalThis.__atlasCheck = opened && closed && unknown && wrapped && chupa && fee && godzilla && kaijuOK && mythOK && folkloreOK &&
    p0 === "0% 0%" && p1 === "33% 0%" && p4 === "0% 100%" &&
    a0.indexOf("Front") >= 0 && a4.indexOf("Rücken") >= 0;
`, ctx);
if (!vm.runInContext('globalThis.__atlasCheck', ctx)) {
  throw new Error('Drehbarer Bigfoot-Atlas zeigt die falschen Blickwinkel');
}

vm.runInContext(`
  __beginTestRun();
  G.teamSize = G.team.length;
  startBattle();
  const rpHitter = G.battle.player[0];
  const rpAlly = G.battle.player[2] || G.battle.player[1] || rpHitter;
  const rpFoe = G.battle.enemies[0];
  rpFoe.shield = 0;
  const rpHpBefore = rpFoe.hp;
  applyDamage(rpFoe, 13, rpHitter, {});
  const rpDealt = Math.round(rpHpBefore - rpFoe.hp);
  rpAlly.hp = Math.max(1, rpAlly.maxHp - 25);
  const rpHealed = Math.round(healUnit(rpAlly, 9));
  const rpReport = battleReportData(true);
  showBattleReport(true);
  const rpPanel = document.getElementById("battleReport");
  const rpShown = rpPanel.classList.contains("show") &&
    document.getElementById("battleReportTitle").textContent.indexOf("besiegt") >= 0 &&
    Number(document.getElementById("battleReportDamage").textContent) === rpReport.damage &&
    Number(document.getElementById("battleReportHeal").textContent) === rpReport.heal &&
    document.getElementById("battleReportTop").textContent === rpReport.top;
  const rpNumbers = rpDealt > 0 && rpReport.damage >= rpDealt && rpReport.heal >= rpHealed &&
    rpReport.top.indexOf(rpHitter.name) >= 0;
  hideBattleReport();
  const rpHidden = !rpPanel.classList.contains("show") && G.lastReport === null;
  G.phase = "menu";
  G.battle = null;
  startBattle();
  const rpFresh = battleReportData(true);
  globalThis.__reportCheck = rpNumbers && rpShown && rpHidden &&
    rpFresh.damage === 0 && rpFresh.heal === 0 && rpFresh.top === "–";
  G.phase = "menu";
  G.battle = null;
  hideBattleReport();
`, ctx);
if (!vm.runInContext('globalThis.__reportCheck', ctx)) {
  throw new Error('Nachkampf-Auswertung zaehlt Schaden/Heilung oder setzt das Panel nicht zurueck');
}

vm.runInContext(`
  __beginTestRun();
  startBattle();
  const hsHero = G.battle.player[0];
  const hsFoe = G.battle.enemies[0];
  hsFoe.shield = 0;
  const hsTime = G.battle.time, hsCd = hsHero.attackCd, hsSpell = hsHero.spellCd, hsHp = hsFoe.hp;
  G.hitStop = 0;
  globalThis.__hsStart = G.hitStop === 0 && visualFrameDt(0.016) === 0.016;
  applyDamage(hsFoe, 1, hsHero, {crit:true});
  globalThis.__hsCrit = G.hitStop === HIT_STOP_CRIT;
  globalThis.__hsFreeze = visualFrameDt(0.016) === 0 && G.hitStop > 0 && G.hitStop < HIT_STOP_CRIT;
  // Der Stop darf nur das Bild anhalten: Zeit, Cooldowns und Treffer bleiben echt.
  globalThis.__hsSim = G.battle.time === hsTime && hsHero.attackCd === hsCd &&
    hsHero.spellCd === hsSpell && hsFoe.hp < hsHp;
  triggerHitStop(10);
  globalThis.__hsCap = G.hitStop === HIT_STOP_BOSS;
  let hsTicks = 0;
  while (G.hitStop > 0 && hsTicks < 40) { visualFrameDt(0.016); hsTicks++; }
  globalThis.__hsEnds = G.hitStop === 0 && hsTicks >= 3 && hsTicks < 40 &&
    visualFrameDt(0.016) === 0.016;
  G.hitStop = 0;
  killUnit(hsFoe, hsHero);
  globalThis.__hsKill = G.hitStop === HIT_STOP_KILL;
  G.hitStop = 0;
  killUnit(createMob("brute", "enemy", 1, "boss"), hsHero);
  globalThis.__hsBoss = G.hitStop === HIT_STOP_BOSS;
  G.hitStop = 0;
  const hsMob = createMob("brute", "enemy", 1, "normal");
  applyDamage(hsMob, 1, hsHero, {crit:true});
  const hsMobCrit = G.hitStop;
  killUnit(hsMob, hsHero);
  globalThis.__hsMobQuiet = hsMobCrit === 0 && G.hitStop === 0;
  SIM.headless = true;
  G.hitStop = 0;
  const hsHeadFoe = G.battle.enemies.find(u => !u.isDead) || hsHero;
  applyDamage(hsHeadFoe, 1, hsHero, {crit:true});
  killUnit(hsHeadFoe, hsHero);
  triggerHitStop(0.1);
  const hsHeadTime = G.battle.time;
  globalThis.__hsHeadless = G.hitStop === 0 && visualFrameDt(0.016) === 0.016 &&
    G.battle.time === hsHeadTime;
  SIM.headless = false;
  G.phase = "menu";
  G.battle = null;
  G.hitStop = 0;
`, ctx);

for (const [flag, message] of [
  ['__hsStart', 'Hit-Stop startet nicht aus dem Normalzustand'],
  ['__hsCrit', 'Kritischer Treffer löst keinen kurzen Hit-Stop aus'],
  ['__hsFreeze', 'Hit-Stop pausiert die Darstellungs-dt nicht'],
  ['__hsSim', 'Hit-Stop verändert Simulationszeit, Cooldowns oder Schaden'],
  ['__hsCap', 'Hit-Stop stapelt sich unbegrenzt'],
  ['__hsEnds', 'Hit-Stop endet nicht wieder nach wenigen Frame-Ticks'],
  ['__hsKill', 'Todesstoß löst keinen Hit-Stop aus'],
  ['__hsBoss', 'Boss-Tod bekommt keinen stärkeren Hit-Stop'],
  ['__hsMobQuiet', 'Normale Schwarm-Mobs lösen ungewollt einen Hit-Stop aus'],
  ['__hsHeadless', 'Hit-Stop greift in den Headless-Modus ein'],
]) {
  if (!vm.runInContext(`globalThis.${flag}`, ctx)) throw new Error(message);
}

vm.runInContext(`
  G.phase = "draft";
  G.battle = null;
  G.team = [createUnit("bigfoot",1,"player")];
  globalThis.__gapLabelCheck = draftGapLabel("TANK") === "" &&
    draftGapLabel("HEALER") === "✓ Lücke: "+ROLE_META.HEALER.label;
  const mdDraft = document.getElementById("mdDraft");
  const origAppend = mdDraft.appendChild;
  const cards = [];
  mdDraft.appendChild = function(el){ cards.push(el); return el; };
  let rendered = true;
  draftOffer = ["fee","chupacabra","bigfoot"];
  try { renderDraftCards(); } catch(e) { rendered = false; }
  mdDraft.appendChild = origAppend;
  const badgeRe = new RegExp('<span class="gap-fill">([^<]*)</span>');
  const badges = cards.map(c => (c.innerHTML.match(badgeRe)||[])[1] || "");
  globalThis.__gapCardsCheck = rendered && cards.length === 3 &&
    badges.filter(Boolean).length === 2 &&
    badges.indexOf("✓ Lücke: "+ROLE_META.HEALER.label) >= 0 &&
    badges.indexOf("✓ Lücke: "+ROLE_META.DPS.label) >= 0 &&
    cards.filter(c => c.className.indexOf("gap-fill-card") >= 0).length === 2;
  G.team.push(createUnit("fee",1,"player"));
  globalThis.__gapFilledCheck = draftGapLabel("HEALER") === "";
  G.team = ROLES.map(r => ({role:r}));
  globalThis.__gapAllCheck = ROLES.every(r => draftGapLabel(r) === "");
  G.phase = "menu";
`, ctx);

for (const [flag, message] of [
  ['__gapLabelCheck', 'Draft-Lücken-Hinweis ignoriert die Rollen des Teams'],
  ['__gapCardsCheck', 'Draft-Karten markieren Wesen mit fehlender Rolle nicht'],
  ['__gapFilledCheck', 'Draft-Lücken-Markierung verschwindet nicht nach dem Pick'],
  ['__gapAllCheck', 'Draft-Lücken-Markierung bleibt bei vollständigem Team aktiv'],
]) {
  if (!vm.runInContext(`globalThis.${flag}`, ctx)) throw new Error(message);
}

vm.runInContext(`
  const nw1 = nextWavePreview(1);
  const nw5 = nextWavePreview(5);
  const nw10 = nextWavePreview(10);
  const nwCap = nextWavePreview(999);
  globalThis.__nwSelf = nw1.wave === 1 && !nw1.isElite && !nw1.isBoss &&
    nw1.count === mobWaveSize(1,"enemy") && nw1.gold === 5+1*2;
  globalThis.__nwElite = nw5.isElite && !nw5.isBoss &&
    nw5.elites === Math.max(2,Math.floor(mobWaveSize(5,"enemy")/50)) &&
    nw5.gold === 5+5*2+nw5.elites*2;
  globalThis.__nwBoss = nw10.isBoss && !nw10.isElite && nw10.gold === 5+10*2+15;
  globalThis.__nwCap = nwCap.count === MOB_CAP;
  const nwEl = document.getElementById("nextWavePreview");
  G.phase = "prep";
  G.battle = null;
  G.wave = 3;
  updateHud();
  globalThis.__nwShown = nwEl.classList.contains("show") &&
    nwEl.textContent.indexOf("Welle 3: Standard") >= 0 &&
    nwEl.textContent.indexOf("+11 Gold") >= 0;
  G.wave = 10;
  updateHud();
  globalThis.__nwBossShown = nwEl.classList.contains("boss") &&
    nwEl.textContent.indexOf("👑 Boss") >= 0;
  G.wave = 1;
  G.phase = "battle";
  G.battle = {player:[],enemies:[],playerMobs:[],enemyMobs:[],time:0};
  updateHud();
  globalThis.__nwHidden = !nwEl.classList.contains("show") && nwEl.textContent === "";
  G.phase = "menu";
  G.battle = null;
`, ctx);

for (const [flag, message] of [
  ['__nwSelf', 'Wellen-Vorschau fuer Standardrunden stimmt nicht mit den Kampfregeln ueberein'],
  ['__nwElite', 'Wellen-Vorschau zeigt Elite-Runde oder Gold falsch an'],
  ['__nwBoss', 'Wellen-Vorschau zeigt Boss-Runde oder Gold falsch an'],
  ['__nwCap', 'Wellen-Vorschau ignoriert die Mob-Obergrenze'],
  ['__nwShown', 'Wellen-Vorschau erscheint nicht im Prep-HUD'],
  ['__nwBossShown', 'Boss-Vorschau wird nicht hervorgehoben'],
  ['__nwHidden', 'Wellen-Vorschau bleibt im laufenden Kampf sichtbar'],
]) {
  if (!vm.runInContext(`globalThis.${flag}`, ctx)) throw new Error(message);
}

// Relikte: feste Belohnung nach Boss-Wellen, Passiv-Bonus nur fuer our Team.
vm.runInContext(`
  globalThis.__relicDefs = RELICS.length === 5 &&
    RELICS.every(r => r.key && r.name && r.emoji && r.bonus);
  globalThis.__relicBoss = !!relicForWave(10) && !relicForWave(9) &&
    !relicForWave(11) && relicForWave(20).key !== relicForWave(10).key;
  G.relics = [];
  G.lastRelic = null;
  const r10 = grantRelicForWave(10);
  globalThis.__relicGrant = !!r10 && G.relics.length === 1 &&
    G.relics[0] === r10.key && G.lastRelic === r10;
  grantRelicForWave(10);
  globalThis.__relicUnique = G.relics.length === 1;
  const rb = relicBonuses();
  globalThis.__relicBonus = rb.atk > 1 && Math.abs(rb.hp-1) < 1e-9 &&
    rb.spd === 1 && rb.shieldPct === 0 && rb.dr === 0;
  const relicHero = createUnit("bigfoot",1,"player");
  const relicFoe = createUnit("bigfoot",1,"enemy");
  globalThis.__relicHeroOnly = relicHero.atk > relicFoe.atk && relicHero.maxHp === relicFoe.maxHp &&
    Math.abs(relicHero.atk/relicFoe.atk-1.08) < 1e-6;
  G.team = [relicHero];
  G.battle = {player:[relicHero],enemies:[relicFoe],playerMobs:[],enemyMobs:[],time:0,stats:{damage:{},heal:{}}};
  G.phase = "battle";
  G.wave = 10;
  winBattle();
  globalThis.__relicWin = G.lastRelic === r10 &&
    document.getElementById("battleReportTitle").textContent.indexOf("Relikt") >= 0;
  G.phase = "prep";
  G.battle = null;
  G.wave = 11;
  updateHud();
  globalThis.__relicHud = document.getElementById("nextWavePreview").textContent.indexOf("Relikte 1") >= 0;
  beginRun();
  closeDraft();
  globalThis.__relicReset = G.relics.length === 0 && G.lastRelic === null;
`, ctx);
for (const [flag, message] of [
  ['__relicDefs', 'Relikt-Liste ist unvollstaendig'],
  ['__relicBoss', 'Relikte werden nicht deterministisch nach Boss-Wellen vergeben'],
  ['__relicGrant', 'Relikt wird nicht ins Team-Set eingetragen'],
  ['__relicUnique', 'Dasselbe Relikt wird mehrfach eingetragen'],
  ['__relicBonus', 'Relikt-Bonus stimmt nicht mit dem angezeigten Effekt ueberein'],
  ['__relicHeroOnly', 'Relikt-Bonus wirkt auf Gegner oder auf die falschen Werte'],
  ['__relicWin', 'Boss-Sieg zeigt das Relikt nicht in der Auswertung'],
  ['__relicHud', 'Relikt-Zaehler fehlt in der Wellen-Vorschau'],
  ['__relicReset', 'Relikte werden bei einem neuen Lauf nicht zurueckgesetzt'],
]) {
  if (!vm.runInContext(`globalThis.${flag}`, ctx)) throw new Error(message);
}

vm.runInContext(`(() => {
  const viewBtn = document.getElementById("btnBattleView");
  G.phase = "menu"; G.battle = null; __beginTestRun(); G.wave = 1; startBattle();
  globalThis.__defaultClean = document.body.classList.contains("clean-view") &&
    viewBtn.textContent === "▶" && G.paused === false;
  setBattlePaused(false);
  globalThis.__cleanButton = !!viewBtn && viewBtn.textContent === "⏸";
  const beforeTime = G.battle.time;
  setBattlePaused(true);
  const hidden = G.paused === true && document.body.classList.contains("clean-view") &&
    viewBtn.textContent === "▶" && visualFrameDt(0.016) === 0;
  // Pause halt nur die Simulation: Kamera-Ziehen, Zoom und Wesen-Tap bleiben aktiv.
  const camBefore = cameraFocus.x + cameraFocus.z;
  const viewBefore = cameraView;
  panCameraPixels(80,40);
  zoomCamera(1);
  updateVisuals(0,0,0.3);
  const camMoved = Math.abs(cameraFocus.x+cameraFocus.z-camBefore) > 0.01 &&
    Math.abs(cameraView-viewBefore) > 0.01;
  const tapUnit = G.battle.player[0];
  selectUnit(tapUnit);
  const pausedInfo = document.getElementById("infoOverlay").classList.contains("show") &&
    (!ATLAS_CREATURES[tapUnit.key] ||
      document.getElementById("infoExtra").innerHTML.includes("btnAtlasFromUnit"));
  closeInfo();
  for (let f = 0; f < 4 && G.battle; f++) simulateBattle(0.016);
  const frozen = G.battle.time === beforeTime;
  setBattlePaused(false);
  simulateBattle(0.016);
  const resumed = !G.battle || G.battle.time > beforeTime;
  globalThis.__cleanViewCheck = hidden && frozen && resumed && camMoved && pausedInfo &&
    !G.paused && !document.body.classList.contains("clean-view") &&
    viewBtn.textContent === "⏸";

  // Schwarm-Schadenszahlen: sichtbar, aber gedeckelt.
  const beforeHeadless = SIM.headless;
  SIM.headless = false;
  G.effects.length = 0;
  const mob = createMob("kriecher","enemy",1);
  mob.id -= mob.id % 4;
  mob.grid.gx = 8; mob.grid.gy = 6;
  applyDamage(mob,7,null);
  const shown = G.effects.length;
  G.effects.length = MOB_NUMBER_LIMIT;
  const cappedMob = createMob("kriecher","enemy",1);
  cappedMob.id -= cappedMob.id % 4;
  applyDamage(cappedMob,7,null);
  globalThis.__mobNumberCheck = shown > 0 && G.effects.length === MOB_NUMBER_LIMIT;
  G.effects.length = 0;
  SIM.headless = beforeHeadless;
  G.phase = "menu"; G.battle = null;
})();`, ctx);
for (const [flag, message] of [
  ['__defaultClean', 'Kampf startet nicht in der aufgeräumten Ansicht'],
  ['__cleanButton', 'Play/Pause-Knopf unten rechts fehlt'],
  ['__cleanViewCheck', 'Pause-Taste haelt den Kampf nicht an oder startet ihn nicht wieder'],
  ['__mobNumberCheck', 'Schadenszahlen im Schwarm fehlen oder sind nicht gedeckelt'],
]) {
  if (!vm.runInContext(`globalThis.${flag}`, ctx)) throw new Error(message);
}

vm.runInContext(`(() => {
  const grass = cc0Texture("stone_grass",()=>null,48);
  const cached = cc0Texture("stone_grass",()=>null,48) === grass;
  const brick = cc0Texture("brick_wall",()=>null,2);
  const roof = cc0Texture("roof_tiles",()=>null,1);
  const asphalt = cc0Texture("asphalt",()=>null,3);
  const cityMaps = !!brick && !!roof && !!asphalt &&
    townLayer.children.some(o => o.material && o.material.map === brick) &&
    townLayer.children.some(o => o.material && o.material.map === roof) &&
    townLayer.children.some(o => o.material && o.material.map === asphalt);
  globalThis.__cityTextureCheck = cityMaps;
  const particle = cc0Texture("circle_01",()=>null);
  const originalLoader = THREE.TextureLoader;
  THREE.TextureLoader = function(){ throw new Error("missing"); };
  const fallbackTex = {};
  const fallback = cc0Texture("__missing__",()=>fallbackTex);
  THREE.TextureLoader = originalLoader;
  globalThis.__cc0TextureCheck = !!grass && cached && !!particle && fallback === fallbackTex;
})();`, ctx);
if (!vm.runInContext('globalThis.__cc0TextureCheck', ctx)) throw new Error('CC0-Texturen laden oder Fallback greift nicht');
if (!vm.runInContext('globalThis.__cityTextureCheck', ctx)) throw new Error('2K-Fassaden/Dachziegel/Asphalt sind nicht an der Stadt angebunden');
vm.runInContext(`(() => {
  const amb = scene.children.find(o => o.isAmbientLight);
  const hemi = scene.children.find(o => o.isHemisphereLight);
  globalThis.__brightCityCheck = !!amb && amb.intensity >= 0.7 && !!hemi && hemi.intensity >= 1.0;
  const ys = unitLayer.children.map(g => g.userData && g.userData.label && g.userData.label.position.y)
    .filter(y => typeof y === 'number').map(y => Math.round(y*100));
  globalThis.__labelStaggerCheck = new Set(ys).size >= 2;
  globalThis.__splashCheck = !!document.getElementById('splashOverlay');
})();`, ctx);
if (!vm.runInContext('globalThis.__brightCityCheck', ctx)) throw new Error('Stadtbeleuchtung ist zu dunkel');
if (!vm.runInContext('globalThis.__labelStaggerCheck', ctx)) throw new Error('Namenslabels überlappen sich ohne Höhenversatz');
if (!vm.runInContext('globalThis.__splashCheck', ctx)) throw new Error('Startbild-Overlay fehlt');

// Mechanik-Pivot: echte Effekte der vier neuen Faehigkeitsfamilien im Kopf
// simulieren (kein DOM, keine Zufallstreffer) und den lokalen CC0-Rig pruefen.
if (!html.includes('models/universal_animation.glb') ||
    !html.includes('vendor/GLTFLoader.js') ||
    !html.includes('vendor/SkeletonUtils.js') ||
    !html.includes('THREE.SkeletonUtils.clone') ||
    !html.includes('d.rig.mixer.update(dt)') ||
    !html.includes('function makeChargeBar') ||
    !html.includes('chargeBar.visible = ratio > 0.01') ||
    !html.includes('function statusIconTexture') ||
    !html.includes('statusIcon.visible') ||
    !html.includes('id="abilityLog"') ||
    !html.includes('function logAbility') ||
    !html.includes('renderAbilityLog();')) {
  throw new Error('CC0-Universal-Animation ist nicht an die Einheiten angebunden');
}
vm.runInContext(`(() => {
  const g = createUnit('godzilla', 1, 'player');
  const k = createUnit('kingkong', 1, 'player');
  const f = createUnit('fee', 1, 'player');
  const r = createUnit('rumpelstilzchen', 1, 'player');
  const t = createUnit('kingkong', 1, 'enemy');
  const t2 = createUnit('vampire', 1, 'enemy');
  const b = {time:1, player:[g,k,f,r], enemies:[t,t2], playerMobs:[], enemyMobs:[],
    stats:{damage:{},heal:{}}, kills:0};
  const oldBattle = G.battle, oldPhase = G.phase;
  G.battle = b; G.phase = 'battle';
  [g,k,f,r,t,t2].forEach(x => { x.grid.gx = 2; x.grid.gy = 2; x.hp = x.maxHp; });

  g.charge = 1;
  const godHp = t.hp;
  const godOK = castMechanic(g,t,b,SPELLS.atomstrahl) && t.hp < godHp &&
    g.charge === 0 && hasStatus(t,'burn') && mechanicChargeCap(g) === 3;

  t.atk = 999;
  const kongHp = t.hp;
  const kongOK = castMechanic(k,t,b,SPELLS.ansturm) && t.hp < kongHp &&
    hasStatus(t,'taunt') && (k.stormUntil||0) > b.time && speedSurge(k,b) === 1.5;

  const rHp = t.hp;
  const rumpel1 = castMechanic(r,t,b,SPELLS.goldspinnen) && t.hp < rHp;
  const rumpel2 = castMechanic(r,t,b,SPELLS.goldspinnen) && hasStatus(t,'charm');
  const rumpel3 = castMechanic(r,t,b,SPELLS.goldspinnen) &&
    hasStatus(t,'taunt') && (t.luredUntil||0) > b.time;

  f.hp = f.maxHp*0.5;
  const fee1 = castMechanic(f,t,b,SPELLS.feensegen) && hasStatus(f,'regrow');
  const fee2 = castMechanic(f,t,b,SPELLS.feensegen) && !!f.bondTargetId;
  const fee3 = castMechanic(f,t,b,SPELLS.feensegen) && hasStatus(t,'charm');
  [g,k,f,r].forEach(x => { x.hp = x.maxHp*0.7; });
  const feeHp = k.hp;
  const fee4 = castMechanic(f,t,b,SPELLS.feensegen) && k.hp > feeHp*0.78;

  G.battle = oldBattle; G.phase = oldPhase;
  globalThis.__mechanicCheck = godOK && kongOK && rumpel1 && rumpel2 && rumpel3 &&
    fee1 && fee2 && fee3 && fee4;
  globalThis.__universalCheck = !!UNIVERSAL && typeof loadUniversalAnimation === 'function' &&
    typeof makeUniversalRig === 'function' && typeof setUniversalClip === 'function';
  globalThis.__statusIconCheck = !!statusIconTexture('burn', STATUS_META.burn) &&
    statusIconTexture('burn', STATUS_META.burn) === statusIconTexture('burn', STATUS_META.burn);
  globalThis.__abilityLogCheck = typeof logAbility === 'function' &&
    typeof renderAbilityLog === 'function' && !!document.getElementById('abilityLog');
})();`, ctx);
if (!vm.runInContext('globalThis.__mechanicCheck', ctx)) throw new Error('Neue Faehigkeiten wirken nicht (Atomladung/Sturm/Rumpel/Feen)');
if (!vm.runInContext('globalThis.__universalCheck', ctx)) throw new Error('Universal-Animation ist nicht verdrahtet');
if (!vm.runInContext('globalThis.__statusIconCheck', ctx)) throw new Error('Status-Icon-Texturen fehlen oder werden nicht geteilt');
if (!vm.runInContext('globalThis.__abilityLogCheck', ctx)) throw new Error('Faehigkeits-Log fehlt');

console.log(`Runtime OK: ${path.relative(root, htmlPath)} (menu, sim ${simTicks} ticks/${simOutcomes.wins}W-${simOutcomes.losses}L, core trio, mobs 500/500, elite/boss+bossbar+ownBossBar, kampfstatus+mobs+elitenZaehler+besiegteGegner+heldenwarnung+teamHp+enemyHp+kein-mana+automatischer-kampf+gold+gold-gewinn+fokusHp+fokusName+fokusStatus+fokusCd+fokusAtk+fokusMeta+zielstatus+zielring+focus-quiet+status-formen, mob-treffer-impuls, draft3+reroll+filter+draft-luecken-markierung, items, krypto, stacks, bossbar-crit, sieg-toast, heal-btn, niederlage-toast, revive, timer ${timerText}, begegnung ${vm.runInContext('globalThis.__minMeetDist', ctx).toFixed(2)}, steinboden ${vm.runInContext('globalThis.__stoneTiles', ctx)}, vollbild ${vm.runInContext('globalThis.__fullGround', ctx)}, kamera-pan+modus, grosse-karte, startauswahl+reroll2/3/4+teamwachstum+portraits, ziel-cd, bigfoot-atlas, nachkampf-auswertung, hit-stop, wellen-vorschau, boss-relikte, menschen ${vm.runInContext('globalThis.__humanField40H', ctx)}:${vm.runInContext('globalThis.__humanField40M', ctx)} monster (Welle 40), ${vm.runInContext('globalThis.__signatureCount', ctx)} verschiedene faehigkeiten, ${vm.runInContext('globalThis.__habitatCount', ctx)} habitate, zufallskarte+stadt ${vm.runInContext('globalThis.__townStructures', ctx)} teile/${vm.runInContext('globalThis.__coverCells', ctx)} deckung, städte ${vm.runInContext('globalThis.__cityCounts', ctx)} deckungsfelder/${vm.runInContext('globalThis.__propsCount', ctx)} requisiten/${vm.runInContext('globalThis.__skylineCounts', ctx)} skyline, ${vm.runInContext('globalThis.__attackModes', ctx)} angriffsformationen, kampfansicht+echte-pause+pause-kamera+pause-tap+hellere-stadt+labels-gestaffelt+startbild-5s+schadenszahlen+cc0-2k-texturen+cc0-stadttexturen+cc0-atlas+21-kaiju+27-mythos-atlas+folklor-atlas+video-atlas+24-neue-atlanten+sonderwesen+atomladung+koenig-kong-sturm+feen-wald+rumpel-zauber+universal-animation+ladeleiste-3s+status-icons+faehigkeits-log+panzer+prozedurale-stadt+stadt-requisiten+japan-city-details+schilder+ampeln+automaten+hochhaeuser+hafen+strommasten+skyline+neon+billboards+staub+fahrzeug-modelle+rotoren+3d-krallen+wildnis+hoehen-reichweite+begehbare-haeuser+garnison+helden-im-haus+menschen-erhoeht (${vm.runInContext('globalThis.__garrisonSlots', ctx)} Plätze))`);
