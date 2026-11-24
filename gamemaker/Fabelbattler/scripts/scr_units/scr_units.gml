// Fabelbattler 1.20.0 – Einheiten, Mobs, Synergie-Berechnung und Gegneraufbau.

function fb_pick(arr) {
    if (array_length(arr) === 0) return undefined;
    return arr[irandom(array_length(arr) - 1)];
}

function fb_contains(arr, value) {
    for (var i = 0; i < array_length(arr); i++) if (arr[i] === value) return true;
    return false;
}

function fb_living(list) {
    var out = [];
    for (var i = 0; i < array_length(list); i++) if (!list[i].isDead) array_push(out, list[i]);
    return out;
}

function fb_side_units(b, side) {
    var out = [];
    if (!is_struct(b)) return out;
    var heroes = side === "player" ? b.player : b.enemies;
    var mobs = side === "player" ? b.playerMobs : b.enemyMobs;
    var i;
    for (i = 0; i < array_length(heroes); i++) array_push(out, heroes[i]);
    for (i = 0; i < array_length(mobs); i++) array_push(out, mobs[i]);
    return out;
}

function fb_living_enemies(u, b) {
    return fb_living(fb_side_units(b, u.side === "player" ? "enemy" : "player"));
}

function fb_living_allies(u, b) { return fb_living(fb_side_units(b, u.side)); }

function fb_find_unit(id) {
    if (is_undefined(id)) return undefined;
    var g = global.G;
    var i;
    for (i = 0; i < array_length(g.team); i++) if (g.team[i].id === id) return g.team[i];
    if (is_struct(g.battle)) {
        var pools = [g.battle.player, g.battle.enemies, g.battle.playerMobs, g.battle.enemyMobs];
        for (var p = 0; p < array_length(pools); p++) {
            for (i = 0; i < array_length(pools[p]); i++) if (pools[p][i].id === id) return pools[p][i];
        }
    }
    return undefined;
}

function fb_recalc(u) {
    var m = fb_clone(global.DEFAULT_MODS);
    fb_merge_innate(m, u.ability);

    var trait = fb_get(global.UNIT_TRAITS, u.key, undefined);
    if (is_struct(trait) && fb_get(trait, "taunt", false)) fb_set(m, "taunt", true);
    u.trait = trait;
    var auraKey = is_struct(trait) ? fb_get(trait, "aura", undefined) : undefined;
    u.aura = is_undefined(auraKey) ? undefined : fb_get(global.AURA_DEFS, auraKey, undefined);

    var list = (u.side === "enemy" && is_struct(global.G.battle)) ? global.G.battle.enemies : global.G.team;
    var cs = fb_synergy_counts(list);
    repeat (fb_synergy_stacks(fb_get(cs, u.cls, 0))) fb_apply_class_synergy(u.cls, m);
    if (!is_undefined(u.cls2) && u.cls2 !== "") {
        repeat (fb_synergy_stacks(fb_get(cs, u.cls2, 0))) fb_apply_class_synergy(u.cls2, m);
    }
    var rc = fb_race_counts(list);
    repeat (fb_synergy_stacks(fb_get(rc, u.race, 0))) fb_apply_race_synergy(u.race, m);

    var total = is_struct(global.G.battle) ? array_length(fb_side_units(global.G.battle, u.side)) : array_length(list);
    var swarm = fb_swarm_stacks(total);
    if (swarm > 0) {
        m.hp *= 1 + 0.04 * swarm;
        m.atk *= 1 + 0.04 * swarm;
    }

    u.modsEffective = m;
    u.maxHp = round(u.baseHp * m.hp);
    u.atk = u.baseAtk * m.atk;
    u.spd = max(0.25, u.baseSpd * m.spd);
    u.hp = u.maxHp;
    u.shield = u.maxHp * fb_get(m, "shieldPct", 0);
}

function fb_create_unit(key, lvl, side) {
    var base = fb_roster(key);
    if (!is_struct(base)) base = fb_roster("schlag");
    if (is_undefined(lvl)) lvl = 1;
    if (is_undefined(side)) side = "player";
    global.G.uid += 1;
    var u = {
        id: global.G.uid, key: key, name: fb_get(base, "name", key),
        emoji: fb_get(base, "emoji", "?"), role: fb_get(base, "role", "DPS"),
        cls: fb_get(base, "cls", "Chaos"), cls2: fb_get(base, "cls2", ""),
        race: fb_get(base, "race", "Folklore"), level: lvl, side: side,
        ability: fb_get(base, "ability", "biss"), spell: fb_get(base, "spell", "schlag"),
        baseHp: fb_get(base, "hp", 50) * (1 + (lvl - 1) * 0.3),
        baseAtk: fb_get(base, "atk", 8) * (1 + (lvl - 1) * 0.25),
        baseSpd: fb_get(base, "spd", 1), rng: fb_get(base, "rng", 70),
        healRange: fb_get(base, "healRange", 2),
        mods: fb_clone(global.DEFAULT_MODS), modsEffective: {},
        maxHp: 0, hp: 0, atk: 0, spd: 1, shield: 0,
        grid: { gx: 0, gy: 0 }, target: undefined,
        attackCd: random(0.8), supportCd: 0, spellCd: random(0.8),
        hitFlash: 0, animAttack: 0, deathTimer: 0,
        statuses: {}, statusPower: {}, isDead: false, revived: false,
        auraCd: 0, aura: undefined, trait: undefined,
        isMob: false, isElite: false, isBoss: false
    };
    fb_recalc(u);
    u.auraCd = is_struct(u.aura) ? fb_get(u.aura, "cd", 6) * 0.5 : 0;
    return u;
}

function fb_set_unit_level(u, lvl) {
    var base = fb_roster(u.key);
    if (!is_struct(base)) return;
    u.level = lvl;
    u.baseHp = fb_get(base, "hp", 50) * (1 + (lvl - 1) * 0.3);
    u.baseAtk = fb_get(base, "atk", 8) * (1 + (lvl - 1) * 0.25);
    fb_recalc(u);
}

function fb_refresh_team() {
    for (var i = 0; i < array_length(global.G.team); i++) fb_recalc(global.G.team[i]);
}

function fb_mob_wave_size(wave, side) {
    var raw = 4 + 3 * (wave - 1) + 0.6 * (wave - 1) * (wave - 1);
    var bonus = side === "enemy" ? 1 : 0;
    return min(global.MOB_CAP, max(0, round(raw) + bonus));
}

function fb_mob_tier(wave, index, count) {
    if (wave > 0 && wave % global.BOSS_EVERY === 0 && index === count - 1) return "boss";
    if (wave > 0 && wave % global.ELITE_EVERY === 0) {
        var n = max(2, floor(count / 50));
        return index < n ? "elite" : "normal";
    }
    return "normal";
}

function fb_mob_tier_color(tier, side, color) {
    if (tier === "boss") return fb_hex("#ff2d55");
    if (tier === "elite") return fb_hex("#fbbf24");
    if (side === "player") return fb_hex("#67e8f9");
    return color;
}

function fb_create_mob(archetype, side, wave, tier) {
    var a = fb_get(global.MOB_ARCHETYPES, archetype, global.MOB_ARCHETYPES.kriecher);
    var t = fb_get(global.MOB_TIERS, tier, global.MOB_TIERS.normal);
    var scale = 1 + (wave - 1) * 0.035;
    var total = array_length(global.G.team) + fb_mob_wave_size(wave, side);
    var buff = 1 + 0.04 * fb_swarm_stacks(total);
    var baseHp = fb_get(a, "hp", 9) * scale * fb_get(t, "hp", 1);
    var baseAtk = fb_get(a, "atk", 2) * (1 + (wave - 1) * 0.025) * fb_get(t, "atk", 1);

    global.G.uid += 1;
    var m = {
        id: global.G.uid, key: "mob_" + archetype,
        name: fb_get(t, "prefix", "") + fb_get(a, "name", archetype),
        emoji: fb_get(t, "emoji", "") !== "" ? fb_get(t, "emoji", "") : fb_get(a, "emoji", "?"),
        role: "MOB", cls: undefined, cls2: undefined, race: undefined,
        level: wave, side: side, ability: undefined, spell: undefined,
        isMob: true, archetype: archetype, tier: tier,
        isElite: tier === "elite", isBoss: tier === "boss",
        color: fb_mob_tier_color(tier, side, fb_get(a, "color", 0x8b5cf6)),
        scale: fb_get(a, "scale", 0.4) * fb_get(t, "scale", 1),
        baseHp: baseHp, baseAtk: baseAtk, baseSpd: fb_get(a, "spd", 1),
        rng: fb_get(a, "rng", 40), healRange: 0,
        modsEffective: fb_clone(global.DEFAULT_MODS),
        maxHp: round(baseHp * buff), hp: 0, atk: baseAtk * buff,
        spd: fb_get(a, "spd", 1), shield: 0,
        grid: { gx: 0, gy: 0 }, target: undefined,
        attackCd: random(0.5), supportCd: 0, spellCd: 999,
        hitFlash: 0, animAttack: 0, deathTimer: 0.6,
        statuses: {}, statusPower: {}, isDead: false, revived: false,
        auraCd: 0, aura: undefined, trait: undefined
    };
    m.hp = m.maxHp;
    return m;
}

function fb_build_mob_swarm(side, wave) {
    var keys = ["kriecher", "flieger", "brute"];
    var list = [];
    var count = fb_mob_wave_size(wave, side);
    for (var i = 0; i < count; i++) {
        var r = (i * 7 + wave * 3) % 10;
        var key = r < 5 ? keys[0] : (r < 8 ? keys[1] : keys[2]);
        var m = fb_create_mob(key, side, wave, fb_mob_tier(wave, i, count));
        var lane = side === "player" ? 0.25 + (i % 3) * 0.45 : global.GRID.cols - 1 - (i % 3) * 0.45;
        m.grid.gx = fb_clamp(lane, 0, global.GRID.cols - 1);
        m.grid.gy = fb_clamp(0.3 + ((i * 5) % round(global.GRID.rows * 10)) / 10, 0, global.GRID.rows - 1);
        m.attackCd = (i % 7) * 0.08;
        array_push(list, m);
    }
    return list;
}

function fb_refresh_mob_cache(b) {
    if (is_struct(b.mobCache) && b.time - fb_get(b.mobCache, "t", 0) < 0.2) return;
    var make = function(side) {
        var units = fb_living(fb_side_units(b, side));
        var sample = [];
        if (array_length(units) > 40) {
            var step = ceil(array_length(units) / 40);
            for (var i = 0; i < array_length(units); i++) if (i % step === 0) array_push(sample, units[i]);
        } else {
            sample = fb_clone(units);
        }
        var sx = 0, sy = 0;
        for (var j = 0; j < array_length(sample); j++) {
            sx += sample[j].grid.gx;
            sy += sample[j].grid.gy;
        }
        var n = max(1, array_length(sample));
        var targets = [];
        for (var k = 0; k < min(40, array_length(units)); k++) array_push(targets, units[k]);
        return { t: b.time, front: { gx: sx / n, gy: sy / n }, targets: targets };
    };
    b.mobCache = { t: b.time, player: make("player"), enemy: make("enemy") };
}

function fb_enemy_key_for(used, preferRole) {
    var pool = [];
    var i;
    for (i = 0; i < array_length(global.FOE_KEYS); i++) {
        var k = global.FOE_KEYS[i];
        if (!fb_get(used, k, false) && fb_get(fb_roster(k), "role", "") === preferRole) array_push(pool, k);
    }
    if (array_length(pool) === 0) {
        for (i = 0; i < array_length(global.FOE_KEYS); i++) {
            var k2 = global.FOE_KEYS[i];
            if (!fb_get(used, k2, false)) array_push(pool, k2);
        }
    }
    if (array_length(pool) === 0) pool = fb_clone(global.FOE_KEYS);
    var key = fb_pick(pool);
    fb_set(used, key, true);
    return key;
}

function fb_build_enemy_team() {
    var used = {};
    var roles = [];
    for (var i = 0; i < array_length(global.G.team); i++) array_push(roles, global.G.team[i].role);
    var missing = [];
    for (var r = 0; r < array_length(global.ROLES); r++) {
        if (!fb_contains(roles, global.ROLES[r])) array_push(missing, global.ROLES[r]);
    }
    var out = [];
    for (var j = 0; j < array_length(global.G.team); j++) {
        var p = global.G.team[j];
        var prefer = j < array_length(missing) ? missing[j] : p.role;
        var u = fb_create_unit(fb_enemy_key_for(used, prefer), p.level, "enemy");
        u.baseHp *= 1 + global.G.wave * 0.04;
        u.baseAtk *= 1 + global.G.wave * 0.03;
        u.grid.gx = fb_clamp(global.GRID.cols - 1 - (j % 2) * 0.7, 0, global.GRID.cols - 1);
        u.grid.gy = fb_clamp(0.6 + floor(j / 2) * 1.7, 0, global.GRID.rows - 1);
        u.attackCd = random(0.4);
        array_push(out, u);
    }
    return out;
}

function fb_revive_team() {
    for (var i = 0; i < array_length(global.G.team); i++) {
        var u = global.G.team[i];
        u.isDead = false;
        u.revived = false;
        u.deathTimer = 0;
        u.animAttack = 0;
        fb_clear_statuses(u);
        fb_recalc(u);
    }
}
