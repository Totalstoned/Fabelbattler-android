import ast, re, sys
from pathlib import Path

path = Path(sys.argv[1] if len(sys.argv) > 1 else 'app/src/main/assets/index3d.html')
src = path.read_text(encoding='utf-8')

def extract_block(name):
    marker = 'const ' + name + ' = {'
    start = src.find(marker)
    if start < 0:
        raise SystemExit('Block fehlt: ' + name)
    i = src.find('{', start)
    depth = 0
    quote = None
    escaped = False
    for j in range(i, len(src)):
        c = src[j]
        if quote:
            if escaped:
                escaped = False
            elif c == '\\':
                escaped = True
            elif c == quote:
                quote = None
            continue
        if c in '"\'`':
            quote = c
        elif c == '{':
            depth += 1
        elif c == '}':
            depth -= 1
            if depth == 0:
                return src[i + 1:j]
    raise SystemExit('Block nicht geschlossen: ' + name)

def field(body, key):
    m = re.search(r'\b' + re.escape(key) + r'\s*:\s*"((?:\\.|[^"\\])*)"', body)
    return m.group(1) if m else None

def keys(body):
    result = set()
    depth = 0
    quote = None
    escaped = False
    i = 0
    while i < len(body):
        c = body[i]
        if quote:
            if escaped:
                escaped = False
            elif c == '\\':
                escaped = True
            elif c == quote:
                quote = None
            i += 1
            continue
        if c in '"\'`':
            quote = c
            i += 1
            continue
        if c in '{[(':
            depth += 1
            i += 1
            continue
        if c in '}])':
            depth -= 1
            i += 1
            continue
        if depth == 0 and (c.isalnum() or c == '_'):
            m = re.match(r'[A-Za-z0-9_ÄÖÜäöüß]+', body[i:])
            if m:
                key = m.group(0)
                j = i + len(key)
                while j < len(body) and body[j].isspace():
                    j += 1
                if j < len(body) and body[j] == ':':
                    result.add(key)
                i = j
                continue
        i += 1
    return result

roster = {}
base_block = extract_block('ROSTER')
for m in re.finditer(r'^\s*([A-Za-z0-9_]+):\{(.*)\},?\s*$', base_block, re.M):
    key, body = m.group(1), m.group(2)
    roster[key] = {
        'name': field(body, 'name'),
        'role': field(body, 'role'),
        'cls': field(body, 'cls'),
        'cls2': field(body, 'cls2'),
        'ability': field(body, 'ability'),
        'race': 'Kaiju' if field(body, 'cls') == 'Kaiju' else 'Folklore',
    }

race = None
pack_block = extract_block('RACE_PACKS')
for line in pack_block.splitlines():
    header = re.match(r'^\s*([A-Za-z0-9_ÄÖÜäöü]+)\s*:\s*\[\s*$', line)
    if header:
        race = header.group(1)
        continue
    entry = re.match(r'^\s*(\[.*\]),?\s*$', line)
    if not entry or not race:
        continue
    e = ast.literal_eval(entry.group(1))
    roster[e[0]] = {'name': e[1], 'role': e[3], 'cls': e[4], 'cls2': e[5], 'ability': e[10], 'race': race}

spells = set(re.findall(r'^\s*([A-Za-z0-9_]+):S\(', extract_block('SPELLS'), re.M))
roles = keys(extract_block('ROLE_META'))
classes = keys(extract_block('CLASS_META'))
races = keys(extract_block('RACE_META'))
descs = keys(extract_block('ABILITY_DESC'))
innate = keys(extract_block('INNATE'))
ability_spell = {}
for k, v in re.findall(r'([A-Za-z0-9_]+)\s*:\s*"([A-Za-z0-9_]+)"', extract_block('ABILITY_SPELL')):
    ability_spell[k] = v
spell_override = {}
for k, v in re.findall(r'([A-Za-z0-9_]+)\s*:\s*"([A-Za-z0-9_]+)"', extract_block('SPELL_OVERRIDE')):
    spell_override[k] = v
styles = keys(extract_block('MONSTER_STYLE'))
statuses = keys(extract_block('STATUS_META'))
auras = keys(extract_block('AURA_DEFS'))
traits = {}
for key, body in re.findall(r'([A-Za-z0-9_]+)\s*:\s*\{([^}]*)\}', extract_block('UNIT_TRAITS')):
    m = re.search(r'aura\s*:\s*"([A-Za-z0-9_]+)"', body)
    traits[key] = m.group(1) if m else None

problems = []
if len(roster) != 123:
    problems.append('Einheiten: erwartet 123, gefunden ' + str(len(roster)))
if len(spells) != 51:
    problems.append('Zauber: erwartet 51, gefunden ' + str(len(spells)))
for key in ['oma', 'opa', 'feuerwehr', 'kampftruppe', 'soldat', 'missionar',
            'sanitaeter', 'rebelle', 'armee', 'bundeswehr', 'soeldner',
            'feuerwehrwagen', 'krankenwagen', 'panzer', 'hubschrauber',
            'kampfflugzeug', 'drohne', 'teddy']:
    if key not in roster or roster[key]['ability'] != 'biss':
        problems.append('Gegner-Wesen fehlt oder hat keine Biss-Fähigkeit: ' + key)
for token in ['ENEMY_ONLY', 'FOE_KEYS', 'const ALL_KEYS = Object.keys(ROSTER).filter', 'biss:S("Biss"']:
    if token not in src:
        problems.append('Gegner-exkluse Wesen fehlen: ' + token)
if any(u['race'] == 'Barbar' for u in roster.values()):
    problems.append('Barbar-Rasse ist noch im Roster vorhanden')
if sum(1 for u in roster.values() if u['race'] == 'Krypto') < 10:
    problems.append('Kryptozoologie-Pack ist unvollständig')
for key in ['schrecken', 'schwarmruf']:
    if key not in descs or key not in innate or key not in ability_spell:
        problems.append('Neue Fähigkeit unvollständig: ' + key)
core = re.search(r'const CORE_UNITS = \[(.*?)\];', src)
core_keys = re.findall(r'"([A-Za-z0-9_]+)"', core.group(1)) if core else []
if core_keys != ['bigfoot', 'chupacabra', 'fee']:
    problems.append('CORE_UNITS: erwartet bigfoot/chupacabra/fee, gefunden ' + str(core_keys))
core_roles = {'bigfoot': 'TANK', 'chupacabra': 'DPS', 'fee': 'HEALER'}
for key, role in core_roles.items():
    if key not in roster or roster[key]['role'] != role:
        problems.append('CORE_UNITS: ' + key + ' ist kein ' + role)
mob_cap = re.search(r'const MOB_CAP = (\d+);', src)
if not mob_cap or int(mob_cap.group(1)) != 500:
    problems.append('MOB_CAP: erwartet 500')

for token in ['const GRID = {cols:18,rows:14};', 'const MAP_SPEED = 2.2;',
              '(0.4+u.spd*0.5)*MAP_SPEED*dt', 'const DEFAULT_VIEW = 14.5;']:
    if token not in src:
        problems.append('Grosse Karte fehlt: ' + token)
for token in ['const ORIGIN_META = {', 'function unitOrigin(key)', 'function drawPortraitCanvas(key)',
              'function portraitCanvas(key)', 'function portraitUrl(key)', 'function makePortraitSprite(key)',
              'class="portrait"', 'makePortraitSprite(u.key)', 'ORIGIN_META[unitOrigin(key)].label']:
    if token not in src:
        problems.append('Wesen-Grafiken aus aller Welt fehlen: ' + token)
for key in ['kappa','babajaga','anansi','quetzalcoatl','ammit','tengu','selkie','yama','oni','mamiwata']:
    if key not in roster or key not in styles:
        problems.append('Neues Wesen aus aller Welt fehlt: ' + key)
for key in ['gamera','gyaos','anguirus','kumonga','destoroyah','reineke','rotkaeppchen','dornroeschen','bremer','till']:
    if key not in roster or key not in styles:
        problems.append('Kaiju-/Fabelwesen fehlt: ' + key)
for key in ['zwergenkrieger','zwergenbaumeister','zwergenschmied','zwergenheiler','zwergenjaeger','zwergenwaechter','zwergenbarde','zwergenalchemist','zwergenminenhaupt','zwergenrunenmeister']:
    if key in roster:
        problems.append('Zu normales Zwergenwesen noch im Roster: ' + key)
biomes_start = src.find('const ARENA_BIOMES = [')
biomes = src[biomes_start:src.find('];',biomes_start)] if biomes_start >= 0 else ''
if biomes.count('label:') != 6:
    problems.append('Arena-Szenen: erwartet 6, gefunden ' + str(biomes.count('label:')))
for token in ['function arenaBiome(wave)', 'function applyArenaBiome(wave)',
              'arenaPalette = {base:base.material', 'applyArenaBiome(G.wave);',
              'const biome = applyArenaBiome(G.wave);', 'applyArenaBiome(1);']:
    if token not in src:
        problems.append('Szenenwechsel im Wellenzyklus fehlt: ' + token)
for token in ['const START_TEAM_MIN = 3;', 'const TEAM_GROWTH_CAP = 10;', 'if(G.team.length < G.teamSize && G.gold >= 2){ openDraft(); return; }',
              'start.disabled = G.team.length < G.teamSize && G.gold >= 2;',
              'const REROLL_BASE = 2;', 'const REROLL_MAX = 4;', 'function rerollCost()',
              'Math.min(REROLL_BASE+rerollCount,REROLL_MAX)', 'rerollCount = 0;',
              'G.teamSize++', 'openDraft();', 'Reroll "+rerollCost()+" Gold']:
    if token not in src:
        problems.append('Startauswahl/Teamwachstum/Reroll 2-3-4 fehlt: ' + token)
if 'Reroll 1 Gold' in src:
    problems.append('Alter Reroll-Preis (1 Gold) ist noch im UI vorhanden')
status_shape_block = extract_block('STATUS_SHAPES')
status_shapes = keys(status_shape_block)
for shape in ['danger', 'control', 'boost']:
    if shape not in status_shapes:
        problems.append('Status-Form fehlt: ' + shape)
segments = re.findall(r'\bsegments\s*:\s*(\d+)', status_shape_block)
if len(segments) != 3 or len(set(segments)) != 3:
    problems.append('Status-Formen brauchen drei verschiedene Segmentzahlen')
status_meta_block = extract_block('STATUS_META')
for status_key in statuses:
    if not re.search(r'\b' + re.escape(status_key) + r'\s*:\s*\{[^{}]*\bshape\s*:\s*"(?:danger|control|boost)"', status_meta_block):
        problems.append('Status ohne Form (farbblind nicht unterscheidbar): ' + status_key)
for token in ['const STATUS_RING_GEOMETRIES = {}', 'function dominantStatusKey', 'function statusShapeLegend',
              'Ringformen im Feld: ${statusShapeLegend()}']:
    if token not in src:
        problems.append('Status-Formen im Feld/UI fehlen: ' + token)
for token in ['MOB_ARCHETYPES', 'mobWaveSize', 'buildMobSwarm', 'mobAction', 'updateMobVisuals', 'hudMobs', 'mdReroll', 'rerollDraft', 'slice(0,3)', 'mdRoleFilters', 'mdClassFilter', 'mdSynergy', 'draftFilterRole', 'draftSynergyText', 'hudItems', 'btnItemHeal', 'btnItemShield', 'btnItemNova', 'function useItem', 'ELITE_EVERY', 'BOSS_EVERY', 'MOB_TIERS', 'mobTierFor', 'isBoss', 'isElite', 'battleStatus', 'statusEnemies', 'statusFoeHeroes', 'statusMobs', 'statusHeroes', 'function updateBattleStatus']:
    if token not in src:
        problems.append('Mob-System fehlt: ' + token)
for token in ['battleKills', 'battleKillsValue', 'function updateBattleKills', 'killsTotal', 'G.battle.kills++']:
    if token not in src:
        problems.append('Besiegte-Gegner-Anzeige in der Kampfleiste fehlt: ' + token)
for token in ['heroAlert', 'heroAlertCount', 'function updateHeroAlert']:
    if token not in src:
        problems.append('Kritische-Helden-Warnung fehlt: ' + token)
for token in ['teamHpBar', 'teamHpFill', 'teamHpValue', 'teamHpPct', 'function updateTeamHpBar']:
    if token not in src:
        problems.append('Team-HP-Balken fehlt: ' + token)
for token in ['enemyHpBar', 'enemyHpFill', 'enemyHpPct', 'enemyHpValue', 'function updateEnemyHpBar', 'function shortHp', 'enemyhp b.abs', 'enemyhp.closing']:
    if token not in src:
        problems.append('Gegner-Stärkebalken fehlt: ' + token)
for token in ['battleMana', 'battleManaFill', 'battleManaValue', 'manaHealReady', 'manaNovaReady', 'ready-heal', 'ready-nova', 'function updateBattleManaBar']:
    if token not in src:
        problems.append('Mana-Anzeige in der Kampfleiste fehlt: ' + token)
for token in ['btnBattleHeal").classList.toggle("ready"', 'btnBattleNova").classList.toggle("ready"', 'btn.heal.ready:not(:disabled)', 'btn.nova.ready:not(:disabled)']:
    if token not in src:
        problems.append('Zauber-Buttons zeigen Bereitschaft nicht deutlich: ' + token)
for token in ['battleGold', 'battleGoldValue', 'function updateBattleGold']:
    if token not in src:
        problems.append('Gold-Anzeige in der Kampfleiste fehlt: ' + token)
for token in ['id="battleGoldGain"', 'battleGoldGainUntil', 'battle-info.gold b.gain']:
    if token not in src:
        problems.append('Gold-Gewinn-Feedback in der Kampfleiste fehlt: ' + token)
for token in ['playerBossBar', 'playerBossBarFill', 'playerBossBarHp', 'playerBossBarPct', 'function updatePlayerBossBar']:
    if token not in src:
        problems.append('Eigener Boss-Lebensbalken fehlt: ' + token)
for token in ['bossBar', 'bossBarFill', 'bossBarHp', 'bossBarPct', 'function updateBossBar']:
    if token not in src:
        problems.append('Gegner-Boss-Lebensbalken fehlt: ' + token)
for token in ['id="btnItemHeal" title="Heilt den verwundetsten Helden um 35 %"', 'healNeeded', 'Alle Helden bei voller HP', 'kind === "heal" && !healNeeded']:
    if token not in src:
        problems.append('Trank-Button ohne verwundeten Helden fehlt: ' + token)
for token in ['id="btnZoomReset"', 'function resetCameraZoom', 'targetView = DEFAULT_VIEW;',
              'getElementById("btnZoomReset").onclick = resetCameraZoom;',
              'addEventListener("dblclick",resetCameraZoom)', 'if(e.key==="0") resetCameraZoom();']:
    if token not in src:
        problems.append('Zoom-Reset in der Kampfleiste fehlt: ' + token)
for token in ['const cameraPan = new THREE.Vector3(0,0,0);', 'let cameraFollow = true;',
              'function panCameraPixels', 'cameraPan.x = clamp(', 'cameraPan.z = clamp(',
              'touch-action:none', 'addEventListener("pointermove"']:
    if token not in src:
        problems.append('Freie Kamera-Bewegung (Pan) fehlt: ' + token)
for token in ['id="btnZoomReset" title="Kamera folgt dem Fokus – Ziehen schaltet auf frei">⌖ Folgen</button>',
              '.btn.ghost.camfree', 'function updateCameraButton', 'let cameraModeShown = null;',
              'b.textContent = cameraFollow ? "⌖ Folgen" : "⌖ Frei";',
              'b.classList.toggle("camfree",!cameraFollow);', 'updateCameraButton();']:
    if token not in src:
        problems.append('Kamera-Modus am Zoom-Button fehlt: ' + token)

for token in ['battleDudes', 'battleDudesValue', 'function updateBattleDudes', 'swarmStacks(sideUnits(G.battle,"player").length)']:
    if token not in src:
        problems.append('Duden-Bonus in der Kampfleiste fehlt: ' + token)
for token in ['a.hp/a.maxHp - b.hp/b.maxHp', 'const healed = healUnit(ally,ally.maxHp*0.35);',
              'Heiltrank "+ally.emoji+" +"+Math.round(healed)+" HP"', 'return real;']:
    if token not in src:
        problems.append('Heiltrank-Zielwahl oder echte Heilungsanzeige fehlt: ' + token)
for token in ['function loseBattle', 'Niederlage in Welle', 'Gegner "+foesLeft+" übrig']:
    if token not in src:
        problems.append('Niederlage-Zusammenfassung fehlt: ' + token)
for token in ['function blitzTargets', 'function castFabelBlitz',
              'btnNova").onclick = () => castFabelBlitz()',
              'btnBattleNova").onclick = () => castFabelBlitz()',
              'const targets = blitzTargets(G.battle)']:
    if token not in src:
        problems.append('Fabel-Blitz mit Mob-Fallback fehlt: ' + token)
for token in ['function battleEndFx', 'spawnShockwave(u,color,1.25)', 'spawnBurst(u,burstColor,8,0.9)',
              'battleEndFx(G.team.filter(u => !u.isDead)', 'battleEndFx(fallen.length ? fallen : G.team']:
    if token not in src:
        problems.append('Sichtbares Kampfende-Feedback im 3D-Feld fehlt: ' + token)
for token in ['focusHp', 'focusName', 'focusHpValue', 'function updateFocusHp']:
    if token not in src:
        problems.append('Fokus-HP-Anzeige in der Kampfleiste fehlt: ' + token)
for token in ['focusAtkValue', 'Math.round(u.atk)']:
    if token not in src:
        problems.append('Fokus-Angriffsanzeige in der Kampfleiste fehlt: ' + token)
for token in ['focusStatus', 'function updateFocusHp', 'activeStatusKeys(u).map']:
    if token not in src:
        problems.append('Fokus-Statusanzeige in der Kampfleiste fehlt: ' + token)
for token in ['focusCd', 'focusCdValue', 'function updateFocusCooldown']:
    if token not in src:
        problems.append('Fokus-Zauber-Cooldown in der Kampfleiste fehlt: ' + token)
for token in ['id="focusMeta"', 'function updateFocusMeta']:
    if token not in src:
        problems.append('Fokus-Level/Rolle in der Kampfleiste fehlt: ' + token)
for token in ['focusTarget', 'focusTargetName', 'focusTargetMeta', 'focusTargetHp', 'focusTargetAtk', 'focusTargetStatus', 'function updateFocusTarget', 'activeStatusKeys(target).map']:
    if token not in src:
        problems.append('Fokus-Ziel in der Kampfleiste fehlt: ' + token)
for token in ['focusTargetCd', 'const targetSpell = SPELLS[target.spell]', 'const rest = Math.max(0,target.spellCd||0)', '"bereit"', 'cdEl.classList.toggle("ready",rest <= 0)', '.battle-info.focustarget .cd.ready']:
    if token not in src:
        problems.append('Zauber-Abklingzeit des Fokus-Ziels fehlt: ' + token)
for token in ['eliteInfo', 'statusElites', 'enemyMobs.filter(m => m.isElite)', 'battle-info.status .elites.show',
              'eliteInfoPlayer', 'statusElitesPlayer', 'playerMobs.filter(m => m.isElite)',
              'battle-info.status .elites.friendly']:
    if token not in src:
        problems.append('Eliten-Zähler im Kampfstatus fehlt: ' + token)
for token in ['function mobHitPulse', 'mobHitPulse(m)', 'hitFlash']:
    if token not in src:
        problems.append('Treffer-Impuls für Mobs fehlt: ' + token)
for token in ['function hasDamageFx', 'hasDamageFx(u)', 'u.isElite', 'u.isBoss']:
    if token not in src:
        problems.append('Treffer-Feedback für Elite-/Boss-Mobs fehlt: ' + token)
for token in ['function announceSpecialMobs', '  announceSpecialMobs();', 'pushEffect(m,m.isBoss ? "👑 Boss" : "✨ Elite",color)', 'if(specials.some(m => m.isBoss)) addShake(0.18)']:
    if token not in src:
        problems.append('Spawn-Ankündigung für Elite-/Boss-Mobs fehlt: ' + token)
for token in ['function hpBarRatio', 'hpShown:clamp(u.hp/u.maxHp,0,1)', 'group.userData.hpShown = ratio', 'const ratio = hpBarRatio(u,group,dt)']:
    if token not in src:
        problems.append('Weich animierter 3D-Lebensbalken fehlt: ' + token)
for token in ['spawnShockwave(u,"#4ade80",0.55)', 'spawnShockwave(u,"#8fb5ff",0.5)']:
    if token not in src:
        problems.append('Heil-/Schild-Ring im 3D-Feld fehlt: ' + token)
for token in ['function draftPickLevel', 'function draftPreviewStats', 'const previewLevel = draftPickLevel()', 'Lv ${previewLevel} · HP ${preview.hp} · ATK ${preview.atk}', 'const pickLevel = draftPickLevel()']:
    if token not in src:
        problems.append('Level-Vorschau im Draft fehlt: ' + token)
# Draft-Karten markieren Wesen, die eine noch fehlende Rolle schliessen.
for token in ['function draftGapLabel(role){', 'const gapLabel = draftGapLabel(unit.role);',
              'card.className = "cardpick"+(gapLabel ? " gap-fill-card" : "");',
              '<span class="gap-fill">', '.cardpick .gap-fill{', '.cardpick.gap-fill-card{',
              '✓ markiert Wesen, die eine fehlende Rolle füllen']:
    if token not in src:
        problems.append('Draft-Luecken-Markierung fehlt in index3d.html: ' + token)
if len(roster) != len(set(roster)):
    problems.append('doppelte Einheitenschlüssel')

for key, u in roster.items():
    for label in ['name', 'role', 'cls', 'ability', 'race']:
        if not u.get(label):
            problems.append(key + ': fehlt ' + label)
    if u.get('role') and u['role'] not in roles:
        problems.append(key + ': unbekannte Rolle ' + u['role'])
    for label in ['cls', 'cls2']:
        if u.get(label) and u[label] not in classes:
            problems.append(key + ': unbekannte Klasse ' + u[label])
    if u.get('race') and u['race'] not in races:
        problems.append(key + ': unbekannte Rasse ' + u['race'])
    if u.get('ability') and u['ability'] not in descs:
        problems.append(key + ': keine Fähigkeitenbeschreibung für ' + u['ability'])
    if u.get('ability') and u['ability'] not in innate:
        problems.append(key + ': keine INNATE-Definition für ' + u['ability'])
    spell = spell_override.get(key) or ability_spell.get(u.get('ability')) or (u.get('ability') if u.get('ability') in spells else 'schlag')
    if spell not in spells:
        problems.append(key + ': Zauber ' + spell + ' fehlt')

for key in spell_override:
    if key not in roster:
        problems.append('SPELL_OVERRIDE: unbekannte Einheit ' + key)
for value in spell_override.values():
    if value not in spells:
        problems.append('SPELL_OVERRIDE: unbekannter Zauber ' + value)
for value in ability_spell.values():
    if value not in spells:
        problems.append('ABILITY_SPELL: unbekannter Zauber ' + value)
for key in styles:
    if key not in roster:
        problems.append('MONSTER_STYLE: unbekannte Einheit ' + key)
for key, aura in traits.items():
    if key not in roster:
        problems.append('UNIT_TRAITS: unbekannte Einheit ' + key)
    if aura and aura not in auras:
        problems.append('UNIT_TRAITS: unbekannte Aura ' + aura)
for key, body in re.findall(r'([A-Za-z0-9_]+)\s*:\s*\{([^}]*)\}', extract_block('AURA_DEFS')):
    status = re.search(r'\bstatus\s*:\s*"([A-Za-z0-9_]+)"', body)
    if not status or status.group(1) not in statuses:
        problems.append('AURA_DEFS: ' + key + ' hat unbekannten Status ' + (status.group(1) if status else '?'))

# Kampffläche: eine durchgehende Fläche ohne Mittelstreifen oder Seitenfarben.
# moveUnit() clamping muss das komplette GRID erlauben, damit sich beide Seiten
# in der Mitte begegnen können (keine Trennung nach u.side).
for token in ['addGroundRect(0,0,0.22', 'addGroundRect(-2.9', 'addGroundRect(2.9', 'arenaPulse']:
    if token in src:
        problems.append('Trennlinie/seitliche Einfärbung in der Kampffläche vorhanden: ' + token)
for token in ['function stoneTexture', "map:stoneTexture(ARENA_BIOMES[0].tileA)", 'new THREE.BoxGeometry(part[2],0.18,part[3])', 'new THREE.PlaneGeometry(220,220)', 'groundMap.wrapS = groundMap.wrapT = THREE.RepeatWrapping']:
    if token not in src:
        problems.append('Steinboden (inkl. Vollbild-Flaeche) fehlt: ' + token)
for token in ['function moveToward', 'gx = clamp(gx,0,GRID.cols-1)', 'gy = clamp(gy,0,GRID.rows-1)']:
    if token not in src:
        problems.append('Freie Bewegung über das ganze Kampffeld fehlt: ' + token)
for token in ['function damageTextScale', 'damageTextScale(dmg,target,!!opts.crit)']:
    if token not in src:
        problems.append('Skalierte Trefferzahlen fehlen: ' + token)

# Bigfoot-Prototyp des drehbaren Wesen-Atlasses: Sheet und Anbindung muessen
# im WebView-Build zusammen vorhanden sein (sonst bleibt die Zelle schwarz).
for token in ['id="atlasFrame"', 'background-image:url("creatures/bigfoot/turntable.png")',
              'background-size:400% 200%', 'function setAtlasFrame']:
    if token not in src:
        problems.append('Bigfoot-Turntable fehlt in index3d.html: ' + token)
if not (path.parent / 'creatures' / 'bigfoot' / 'turntable.png').is_file():
    problems.append('Bigfoot-Turntable-Datei fehlt im Assetordner')

# Nachkampf-Auswertung: Zaehlung und Panel muessen im WebView-Build zusammen liegen.
for token in ['id="battleReport"', 'id="battleReportTitle"', 'id="battleReportDamage"',
              'id="battleReportHeal"', 'id="battleReportTop"', 'id="btnReportClose"',
              'function noteBattleDamage', 'function noteBattleHeal', 'function battleReportData',
              'function showBattleReport', 'function hideBattleReport',
              'stats:{damage:{},heal:{}}', 'noteBattleDamage(source,target,dmg)',
              'noteBattleHeal(u,real)', 'showBattleReport(true)', 'showBattleReport(false)',
              'hideBattleReport();']:
    if token not in src:
        problems.append('Nachkampf-Auswertung fehlt in index3d.html: ' + token)

# Relikte nach Boss-Wellen: eigene Mechanik, keine Namen oder Grafiken der Referenz.
relic_start = src.find('const RELICS = [')
relic_block = src[relic_start:src.find('];',relic_start)] if relic_start >= 0 else ''
if relic_block.count('key:') != 5:
    problems.append('Relikte: erwartet 5, gefunden ' + str(relic_block.count('key:')))
for name in ['Wolfszahn','Eisenwurzel','Federmantel','Mondglas','Bernsteinherz']:
    if name not in relic_block:
        problems.append('Eigenes Relikt fehlt: ' + name)
for token in ['const RELIC_EVERY = BOSS_EVERY;', 'function relicForWave(wave)',
              'function grantRelicForWave(wave)', 'function relicBonuses()',
              'if(u.side !== "enemy"){', 'const rb = relicBonuses();',
              'G.lastRelic = r;', 'G.relics.push(r.key)',
              'G.relics = [];', 'G.lastRelic = null;',
              'const relic = grantRelicForWave(cleared);',
              ' Relikt "+relic.emoji+" "+relic.name',
              ' · Relikte "+G.relics.length']:
    if token not in src:
        problems.append('Relikt-Belohnung fehlt in index3d.html: ' + token)

# Visueller Hit-Stop: nur die Darstellung pausieren, die Simulation laeuft weiter.
for token in ['hitStop:0', 'const HIT_STOP_CRIT = 0.045', 'const HIT_STOP_KILL = 0.075',
              'const HIT_STOP_BOSS = 0.12', 'function triggerHitStop', 'function visualFrameDt',
              'if(SIM.headless || G.phase !== "battle" || !G.battle || !(seconds > 0)) return false;',
              'if(opts.crit && hasDamageFx(target)) triggerHitStop(HIT_STOP_CRIT);',
              'if(hasDamageFx(u)) triggerHitStop(u.isBoss ? HIT_STOP_BOSS : HIT_STOP_KILL);',
              'G.hitStop = 0;', 'const visualDt = visualFrameDt(dt)',
              'visualClock += visualDt', 'updateEffects(visualDt)',
              'updateVisuals(visualClock,visualDt)']:
    if token not in src:
        problems.append('Visueller Hit-Stop fehlt in index3d.html: ' + token)

if problems:
    for p in problems[:30]:
        print('FEHLER:', p)
    if len(problems) > 30:
        print('... und', len(problems) - 30, 'weitere')
    sys.exit(1)

print('Daten gültig: Einheiten', len(roster), 'Zauber', len(spells), 'Rollen', len(roles), 'Klassen', len(classes), 'Rassen', len(races))
