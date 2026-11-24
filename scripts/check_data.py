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
if len(roster) != 113:
    problems.append('Einheiten: erwartet 113, gefunden ' + str(len(roster)))
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
for token in ['MOB_ARCHETYPES', 'mobWaveSize', 'buildMobSwarm', 'mobAction', 'updateMobVisuals', 'hudMobs', 'mdReroll', 'rerollDraft', 'slice(0,3)', 'mdRoleFilters', 'mdClassFilter', 'mdSynergy', 'draftFilterRole', 'draftSynergyText', 'hudItems', 'btnItemHeal', 'btnItemShield', 'btnItemNova', 'function useItem', 'ELITE_EVERY', 'BOSS_EVERY', 'MOB_TIERS', 'mobTierFor', 'isBoss', 'isElite', 'battleStatus', 'statusEnemies', 'statusFoeHeroes', 'statusMobs', 'statusHeroes', 'function updateBattleStatus']:
    if token not in src:
        problems.append('Mob-System fehlt: ' + token)
for token in ['battleKills', 'battleKillsValue', 'function updateBattleKills', 'killsTotal', 'G.battle.kills++']:
    if token not in src:
        problems.append('Besiegte-Gegner-Anzeige in der Kampfleiste fehlt: ' + token)
for token in ['heroAlert', 'heroAlertCount', 'function updateHeroAlert']:
    if token not in src:
        problems.append('Kritische-Helden-Warnung fehlt: ' + token)
for token in ['teamHpBar', 'teamHpFill', 'teamHpPct', 'function updateTeamHpBar']:
    if token not in src:
        problems.append('Team-HP-Balken fehlt: ' + token)
for token in ['enemyHpBar', 'enemyHpFill', 'enemyHpPct', 'function updateEnemyHpBar', 'enemyhp.closing']:
    if token not in src:
        problems.append('Gegner-Stärkebalken fehlt: ' + token)
for token in ['battleMana', 'battleManaFill', 'battleManaValue', 'manaHealReady', 'manaNovaReady', 'ready-heal', 'ready-nova', 'function updateBattleManaBar']:
    if token not in src:
        problems.append('Mana-Anzeige in der Kampfleiste fehlt: ' + token)
for token in ['battleGold', 'battleGoldValue', 'function updateBattleGold']:
    if token not in src:
        problems.append('Gold-Anzeige in der Kampfleiste fehlt: ' + token)
for token in ['id="battleGoldGain"', 'battleGoldGainUntil', 'battle-info.gold b.gain']:
    if token not in src:
        problems.append('Gold-Gewinn-Feedback in der Kampfleiste fehlt: ' + token)
for token in ['playerBossBar', 'playerBossBarFill', 'playerBossBarPct', 'function updatePlayerBossBar']:
    if token not in src:
        problems.append('Eigener Boss-Lebensbalken fehlt: ' + token)

for token in ['battleDudes', 'battleDudesValue', 'function updateBattleDudes', 'swarmStacks(sideUnits(G.battle,"player").length)']:
    if token not in src:
        problems.append('Duden-Bonus in der Kampfleiste fehlt: ' + token)
for token in ['function loseBattle', 'Niederlage in Welle', 'Gegner "+foesLeft+" übrig']:
    if token not in src:
        problems.append('Niederlage-Zusammenfassung fehlt: ' + token)
for token in ['function blitzTargets', 'function castFabelBlitz',
              'btnNova").onclick = () => castFabelBlitz()',
              'btnBattleNova").onclick = () => castFabelBlitz()',
              'const targets = blitzTargets(G.battle)']:
    if token not in src:
        problems.append('Fabel-Blitz mit Mob-Fallback fehlt: ' + token)
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
for token in ['focusTarget', 'focusTargetName', 'focusTargetHp', 'focusTargetAtk', 'focusTargetStatus', 'function updateFocusTarget', 'activeStatusKeys(target).map']:
    if token not in src:
        problems.append('Fokus-Ziel in der Kampfleiste fehlt: ' + token)
for token in ['eliteInfo', 'statusElites', 'enemyMobs.filter(m => m.isElite)', 'battle-info.status .elites.show']:
    if token not in src:
        problems.append('Eliten-Zähler im Kampfstatus fehlt: ' + token)
for token in ['function mobHitPulse', 'mobHitPulse(m)', 'hitFlash']:
    if token not in src:
        problems.append('Treffer-Impuls für Mobs fehlt: ' + token)
for token in ['function hasDamageFx', 'hasDamageFx(u)', 'u.isElite', 'u.isBoss']:
    if token not in src:
        problems.append('Treffer-Feedback für Elite-/Boss-Mobs fehlt: ' + token)
for token in ['function draftPickLevel', 'function draftPreviewStats', 'const previewLevel = draftPickLevel()', 'Lv ${previewLevel} · HP ${preview.hp} · ATK ${preview.atk}', 'const pickLevel = draftPickLevel()']:
    if token not in src:
        problems.append('Level-Vorschau im Draft fehlt: ' + token)
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
for token in ['function stoneTexture', "map:stoneTexture('#333b45')", 'new THREE.BoxGeometry(part[2],0.18,part[3])', 'new THREE.PlaneGeometry(220,220)', 'groundMap.wrapS = groundMap.wrapT = THREE.RepeatWrapping']:
    if token not in src:
        problems.append('Steinboden (inkl. Vollbild-Flaeche) fehlt: ' + token)
for token in ['function moveToward', 'gx = clamp(gx,0,GRID.cols-1)', 'gy = clamp(gy,0,GRID.rows-1)']:
    if token not in src:
        problems.append('Freie Bewegung über das ganze Kampffeld fehlt: ' + token)

if problems:
    for p in problems[:30]:
        print('FEHLER:', p)
    if len(problems) > 30:
        print('... und', len(problems) - 30, 'weitere')
    sys.exit(1)

print('Daten gültig: Einheiten', len(roster), 'Zauber', len(spells), 'Rollen', len(roles), 'Klassen', len(classes), 'Rassen', len(races))
