#!/usr/bin/env node
/* Exportiert alle statischen Spieldaten aus index3d.html als GML-Struct-Literale.
   Die Quelle bleibt die aktive WebView-Datei; dieses Skript erzeugt
   gamemaker/Fabelbattler/scripts/scr_data/scr_data.gml. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const SOURCE = path.join(ROOT, 'app/src/main/assets/index3d.html');
const OUT = path.join(__dirname, 'Fabelbattler/scripts/scr_data/scr_data.gml');

const html = fs.readFileSync(SOURCE, 'utf8');

function slice(startMarker, endMarker) {
  const a = html.indexOf(startMarker);
  const b = html.indexOf(endMarker, a);
  if (a < 0 || b < 0) throw new Error(`Marker fehlt: ${startMarker} / ${endMarker}`);
  return html.slice(a, b);
}

const NAMES = [
  'OUTLINE_COLOR', 'ROSTER', 'RACE_PACKS', 'ENEMY_ONLY', 'FOE_KEYS', 'ALL_KEYS',
  'ROLE_META', 'ROLES', 'CLASS_META', 'RACE_META', 'STATUS_META', 'ABILITY_DESC',
  'INNATE', 'SPELLS', 'ABILITY_SPELL', 'SPELL_OVERRIDE', 'DEFAULT_MODS',
  'AURA_DEFS', 'UNIT_TRAITS', 'UNIT_SIZE', 'MOB_CAP', 'MOB_ARCHETYPES',
  'ELITE_EVERY', 'BOSS_EVERY', 'MOB_TIERS', 'GRID', 'TILE', 'MAP_SPEED',
  'CORE_UNITS', 'START_TEAM_MIN', 'TEAM_GROWTH_CAP', 'REROLL_BASE', 'REROLL_MAX',
  'ORIGIN_META', 'ORIGIN_BY_KEY', 'MONSTER_STYLE', 'RACE_STYLE', 'SYNERGY_MAX_STACKS'
];

const code = [
  slice('const OUTLINE_COLOR', 'const sceneEl = document.getElementById("scene");'),
  slice('const ORIGIN_META = {', 'function unitOrigin(key){'),
  slice('const MONSTER_STYLE = {', 'function monsterMat(color,glow,intensity,metal,rough){'),
  slice('const SYNERGY_MAX_STACKS = 4;', 'function synergyStacks(count){'),
  `globalThis.__FB__ = {${NAMES.join(',')}};`
].join('\n');

const sandbox = { console, Math, Object, Array, Number, String, JSON, Set, Map };
vm.createContext(sandbox);
vm.runInContext(code, sandbox, { filename: 'index3d.html:data' });
const data = sandbox.__FB__;

function ident(k) { return /^[A-Za-z_][A-Za-z0-9_]*$/.test(k); }
function gml(v) {
  if (v === null || v === undefined) return 'undefined';
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : 'undefined';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'string') return JSON.stringify(v);
  if (Array.isArray(v)) return '[' + v.map(gml).join(',') + ']';
  if (typeof v === 'object') {
    const parts = Object.keys(v).map(k => `${ident(k) ? k : JSON.stringify(k)}:${gml(v[k])}`);
    return '{' + parts.join(',') + '}';
  }
  return 'undefined';
}

const lines = [
  '// Automatisch erzeugt aus app/src/main/assets/index3d.html durch gamemaker/export_data.js.',
  '// Nicht von Hand bearbeiten: Die JS-Datei ist die Source of Truth.',
  'function fb_data_init() {'
];
for (const n of NAMES) {
  if (!(n in data)) throw new Error(`Datenblock fehlt: ${n}`);
  lines.push(`    global.${n} = ${gml(data[n])};`);
}
lines.push('}');
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, lines.join('\n') + '\n', 'utf8');

console.log(`OK ${path.relative(ROOT, OUT)}`);
console.log(`Einheiten=${Object.keys(data.ROSTER).length} Zauber=${Object.keys(data.SPELLS).length} GegnerKeys=${data.FOE_KEYS.length} DraftPool=${data.ALL_KEYS.length}`);
