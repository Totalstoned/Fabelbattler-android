#!/usr/bin/env node
// Headless-Spiel-Harness: gezielte Kampf-Szenarien ohne Geraet/WebGL.
// Beispiele:
//   node scripts/game_harness.js --enemies oma,feuerwehr,teddy --wave 5
//   node scripts/game_harness.js --team bigfoot,fee --no-mobs --ticks 300 --json
// Als Modul: const {createGameHarness} = require('./scripts/game_harness');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const DEFAULT_HTML = path.join(ROOT, 'app/src/main/assets/index3d.html');
const THREE_PATH = path.join(ROOT, 'app/src/main/assets/vendor/three.min.js');

function makeElement() {
  const classes = new Set();
  return {
    style: {},
    classList: {
      contains: name => classes.has(name),
      add: name => classes.add(name),
      remove: name => classes.delete(name),
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

function seededMath(seed) {
  let s = seed >>> 0;
  const random = () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
  return Object.create(Math, {random: {value: random}});
}

function createGameHarness(htmlPath = DEFAULT_HTML) {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const match = html.match(/<script>([\s\S]*?)<\/script>/);
  if (!match) throw new Error('Kein <script>-Block in ' + htmlPath + ' gefunden');

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
    navigator: {userAgent: 'game-harness'}, devicePixelRatio: 2,
  };
  ctx.globalThis = ctx;
  ctx.self = ctx;
  vm.createContext(ctx);

  ctx.console = {log() {}, warn() {}, error() {}, info() {}};
  vm.runInContext(fs.readFileSync(THREE_PATH, 'utf8'), ctx, {filename: 'three.min.js'});
  vm.runInContext('var THREE = globalThis.THREE;', ctx);
  ctx.console = console;
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
  vm.runInContext(match[1], ctx, {filename: path.basename(htmlPath)});

  const rosterKeys = vm.runInContext('Object.keys(ROSTER)', ctx).slice();
  const enemyOnly = vm.runInContext('Object.keys(ENEMY_ONLY)', ctx).slice();
  const coreUnits = vm.runInContext('CORE_UNITS.slice()', ctx).slice();

  function run(options = {}) {
    const o = Object.assign({
      team: null, enemies: null, level: 1, wave: 1,
      ticks: 600, mobs: true, seed: null,
    }, options);
    const team = Array.isArray(o.team) && o.team.length ? o.team : coreUnits;
    const bad = team.filter(k => !rosterKeys.includes(k));
    if (bad.length) throw new Error('Unbekannte Spieler-Einheit(en): ' + bad.join(', '));
    if (o.enemies) {
      const badFoes = o.enemies.filter(k => !rosterKeys.includes(k));
      if (badFoes.length) throw new Error('Unbekannte Gegner-Einheit(en): ' + badFoes.join(', '));
    }
    const ticks = Math.max(1, Math.floor(o.ticks));
    const wave = Math.max(1, Math.floor(o.wave));
    const level = Math.max(1, Math.floor(o.level));
    if (o.seed !== null && o.seed !== undefined) ctx.Math = seededMath(o.seed);

    vm.runInContext(`
      (function () {
        const teamKeys = ${JSON.stringify(team)};
        const foeKeys = ${JSON.stringify(o.enemies || null)};
        if (typeof globalThis.__harnessOriginals === "undefined") {
          globalThis.__harnessOriginals = {enemyKeyFor: enemyKeyFor, buildMobSwarm: buildMobSwarm};
        }
        enemyKeyFor = globalThis.__harnessOriginals.enemyKeyFor;
        buildMobSwarm = globalThis.__harnessOriginals.buildMobSwarm;
        G.phase = "menu";
        G.battle = null;
        G.gold = 20; G.uid = 0;
        G.items = {heal: 2, shield: 1, nova: 1};
        G.effects = []; G.particles = []; G.shockwaves = [];
        draftOffer = []; draftFilterRole = "ALL"; draftFilterClass = "ALL";
        G.wave = ${wave};
        G.team = teamKeys.map(k => createUnit(k, ${level}, "player"));
        G.teamSize = G.team.length;
        G.selectedUnitId = G.team[0] ? G.team[0].id : null;
        if (foeKeys) {
          enemyKeyFor = function (unit, used) {
            const free = foeKeys.filter(k => !used[k]);
            const k = (free.length ? free : foeKeys)[0];
            used[k] = true;
            return k;
          };
        }
        ${o.mobs ? '' : 'buildMobSwarm = function () { return []; };\n'}
        startBattle();
        if (!G.battle) throw new Error("Harness: startBattle() hat keinen Kampf erzeugt");
      })();
    `, ctx);

    return vm.runInContext(`
      (function () {
        const maxTicks = ${ticks};
        let frame = 0, time = 0, last = null;
        const samples = [];
        while (G.phase === "battle" && frame < maxTicks) {
          updateVisuals(time, 0.016);
          simulateBattle(0.016);
          updateBattleTimer();
          frame++;
          time += 0.016;
          const b = G.battle;
          if (b) {
            last = {
              heroes: b.player.filter(u => !u.isDead).length,
              heroesTotal: b.player.length,
              foes: b.enemies.filter(u => !u.isDead).length,
              foesTotal: b.enemies.length,
              playerMobs: (b.playerMobs || []).filter(m => !m.isDead).length,
              enemyMobs: (b.enemyMobs || []).filter(m => !m.isDead).length,
              units: b.player.concat(b.enemies).map(u => ({
                key: u.key, side: u.side, name: u.name, spell: u.spell,
                hp: Math.max(0, Math.round(u.hp)), maxHp: Math.round(u.maxHp),
                atk: Math.round(u.atk), dead: u.isDead,
              })),
            };
            if (frame % 60 === 0) {
              samples.push({t: Math.round(time), heroes: last.heroes, foes: last.foes,
                playerMobs: last.playerMobs, enemyMobs: last.enemyMobs});
            }
          }
        }
        return Object.assign({
          outcome: G.phase === "prep" ? "win" : G.phase === "defeat" ? "loss" : "timeout",
          wave: G.wave, ticks: frame, duration: Math.round(time * 10) / 10,
          seed: ${o.seed === null || o.seed === undefined ? 'null' : JSON.stringify(o.seed)},
        }, last || {heroes: 0, heroesTotal: 0, foes: 0, foesTotal: 0,
          playerMobs: 0, enemyMobs: 0, units: []}, {samples: samples});
      })();
    `, ctx);
  }

  return {ctx, run, rosterKeys, enemyOnly, coreUnits, htmlPath};
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const eq = a.indexOf('=');
    const key = a.slice(2, eq < 0 ? undefined : eq);
    let value = eq < 0 ? true : a.slice(eq + 1);
    if (eq < 0 && !['--json', '--no-mobs', '--help'].includes(a)) value = argv[++i];
    args[key] = value;
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(`Spiel-Harness – headless Kampf-Szenarien

Optionen:
  --team k1,k2,k3   Spieler-Team (Standard: ${coreDefault()})
  --enemies k1,k2   Gegner-Helden (Standard: zufällig wie im Spiel)
  --wave N          Welle (Standard 1)
  --level N         Level aller Einheiten (Standard 1)
  --ticks N         maximale Simulations-Frames (Standard 600)
  --runs N          N Szenarien mit aufeinanderfolgenden Seeds, mit Bilanz
  --no-mobs         nur Helden, ohne 500er-Schwarm
  --seed N          deterministischer Zufall (Start-Seed bei --runs)
  --json            Maschinenlesbare Ausgabe
  --html PFAD       alternative index3d.html

Gegner-exklusive Keys: ${enemyDefault()}
Beispiel: node scripts/game_harness.js --enemies oma,feuerwehr,teddy --wave 5 --seed 7`);
    return;
  }
  const harness = createGameHarness(args.html || DEFAULT_HTML);
  const config = {
    team: args.team ? String(args.team).split(',') : harness.coreUnits,
    enemies: args.enemies ? String(args.enemies).split(',') : null,
    wave: args.wave ? Number(args.wave) : 1,
    level: args.level ? Number(args.level) : 1,
    ticks: args.ticks ? Number(args.ticks) : 600,
    mobs: !args['no-mobs'],
    runs: args.runs ? Math.max(1, Math.floor(Number(args.runs))) : 1,
  };
  const baseSeed = args.seed !== undefined ? Number(args.seed) : null;
  const results = [];
  for (let i = 0; i < config.runs; i++) {
    results.push(harness.run(Object.assign({}, config, {
      team: args.team ? config.team : null,
      seed: baseSeed === null ? i + 1 : baseSeed + i,
    })));
  }
  const count = out => results.filter(r => r.outcome === out).length;
  const avg = key => Math.round(results.reduce((s, r) => s + r[key], 0) / results.length * 10) / 10;
  const summary = {
    runs: results.length, wins: count('win'), losses: count('loss'), timeouts: count('timeout'),
    winRate: Math.round(count('win') / results.length * 100) + '%',
    avgDuration: avg('duration'), avgHeroes: avg('heroes'), avgFoes: avg('foes'),
  };
  if (args.json) {
    console.log(JSON.stringify(config.runs === 1 ? results[0] : {
      config: Object.assign({}, config, {seed: baseSeed}), summary,
      runs: results.map(r => ({seed: r.seed, outcome: r.outcome, duration: r.duration,
        heroes: r.heroes, foes: r.foes, playerMobs: r.playerMobs, enemyMobs: r.enemyMobs})),
    }, null, 2));
    return;
  }
  if (config.runs > 1) {
    results.forEach((r, i) => console.log(
      `Lauf ${i + 1} (seed ${r.seed}): ${r.outcome} · ${r.duration}s · Helden ${r.heroes}/${r.heroesTotal} · Gegner ${r.foes}/${r.foesTotal}`));
    console.log(`Bilanz: ${summary.wins}S/${summary.losses}N/${summary.timeouts} offen · Siegquote ${summary.winRate} · ` +
      `Ø ${summary.avgDuration}s · Ø Helden ${summary.avgHeroes} · Ø Gegner ${summary.avgFoes}`);
    return;
  }
  const result = results[0];
  console.log(`Ergebnis: ${result.outcome} · Welle ${result.wave} · ${result.duration}s · ${result.ticks} Ticks · seed ${result.seed}`);
  console.log(`Helden ${result.heroes}/${result.heroesTotal} · Gegner ${result.foes}/${result.foesTotal} · ` +
    `Mobs ${result.playerMobs}/${result.enemyMobs}`);
  for (const u of result.units) {
    console.log(`  ${u.side === 'player' ? 'Held ' : 'Gegner'} ${u.name} (${u.key}): ${u.hp}/${u.maxHp} HP, ${u.atk} ATK, ${u.spell}${u.dead ? ' – tot' : ''}`);
  }
  if (result.samples.length) console.log('Verlauf: ' + result.samples.map(s =>
    `${s.t}s ${s.heroes}/${s.foes}`).join(' · '));
}

function coreDefault() { return createGameHarness(DEFAULT_HTML).coreUnits.join(','); }
function enemyDefault() { return createGameHarness(DEFAULT_HTML).enemyOnly.join(', '); }

if (require.main === module) main();
module.exports = {createGameHarness, parseArgs};
