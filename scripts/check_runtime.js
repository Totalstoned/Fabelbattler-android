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
  return {
    style: {},
    classList: {contains: () => false, add() {}, remove() {}, toggle() {}},
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
if (!html.includes('renderer.setSize(w,h);')) {
  throw new Error('Renderer setzt die CSS-Größe nicht (Canvas wird auf HiDPI zu groß dargestellt)');
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
  G.team.forEach(u => makeCharacter(u));
  G.phase = "draft";
  updateSynergies();
`, ctx);

if (!vm.runInContext('globalThis.__stackCheck', ctx)) {
  throw new Error('Team-Buffs skalieren nicht mit der Dudes-Anzahl');
}

console.log(`Runtime OK: ${path.relative(root, htmlPath)} (menu, sim ${simTicks} ticks/${simOutcomes.wins}W-${simOutcomes.losses}L, draft, krypto, stacks, timer ${timerText})`);
