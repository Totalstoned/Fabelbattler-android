// Fabelbattler 1.20.0 – Grundzustand, Struct-Helfer, Synergien, Status und Toasts.
// Die Spieldaten kommen aus scr_data.gml (automatisch aus index3d.html exportiert).

function fb_clone(v) {
    if (is_struct(v)) {
        var out = {};
        var names = variable_struct_get_names(v);
        for (var i = 0; i < array_length(names); i++) {
            variable_struct_set(out, names[i], fb_clone(variable_struct_get(v, names[i])));
        }
        return out;
    }
    if (is_array(v)) {
        var arr = [];
        for (var i = 0; i < array_length(v); i++) array_push(arr, fb_clone(v[i]));
        return arr;
    }
    return v;
}

function fb_get(s, key, def) {
    if (is_struct(s) && variable_struct_exists(s, key)) return variable_struct_get(s, key);
    return def;
}

function fb_has(s, key) {
    return is_struct(s) && variable_struct_exists(s, key);
}

function fb_set(s, key, value) {
    variable_struct_set(s, key, value);
    return value;
}

function fb_bump(s, key) {
    if (!is_string(key) || key === "") return;
    var n = fb_get(s, key, 0);
    fb_set(s, key, n + 1);
}

function fb_clamp(v, lo, hi) { return max(lo, min(hi, v)); }

function fb_hex(css) {
    if (!is_string(css)) return css;
    var s = css;
    if (string_char_at(s, 1) === "#") s = string_delete(s, 1, 1);
    var r = string_pos(string_upper(string_char_at(s, 1)), "0123456789ABCDEF") - 1;
    var g = string_pos(string_upper(string_char_at(s, 3)), "0123456789ABCDEF") - 1;
    var b = string_pos(string_upper(string_char_at(s, 5)), "0123456789ABCDEF") - 1;
    return r * 65536 + g * 256 + b;
}

function fb_dist(a, b) {
    var dx = a.grid.gx - b.grid.gx;
    var dy = a.grid.gy - b.grid.gy;
    return sqrt(dx * dx + dy * dy);
}

function fb_roster(key) { return fb_get(global.ROSTER, key, undefined); }
function fb_spell(key) { return fb_get(global.SPELLS, key, undefined); }
function fb_meta(name, key) { return fb_get(fb_get(global, name, {}), key, undefined); }

function fb_state_init() {
    global.G = {
        team: [], wave: 1, gold: 20, mana: 30, maxMana: 100,
        phase: "menu", battle: undefined, uid: 0,
        effects: [], particles: [], shockwaves: [], vfx: [],
        teamSize: 4, items: { heal: 2, shield: 1, nova: 1 },
        selectedUnitId: undefined
    };
    global.SIM = { headless: false };
    global.rerollCount = 0;
    global.draftOffer = [];
    global.draftFilterRole = "ALL";
    global.draftFilterClass = "ALL";
    global.draftReturnPhase = "prep";
    global.toastLog = [];
    global.shake = 0;
    global.uiClock = 0;
    global.lastToast = "";
    global.lastToastAt = -100000;
}

function fb_add_toast(msg) {
    if (global.SIM.headless) return;
    var now = current_time;
    if (msg === global.lastToast && now - global.lastToastAt < 700) return;
    global.lastToast = msg;
    global.lastToastAt = now;
    array_push(global.toastLog, { msg: msg, at: now });
    while (array_length(global.toastLog) > 3) array_delete(global.toastLog, 0, 1);
}

function fb_add_shake(amount) {
    if (global.SIM.headless) return;
    global.shake = min(0.5, global.shake + amount);
}

// Visuelle Effekte werden als leichte 2D-Daten gespeichert; Headless läuft ohne sie.
function fb_effect(u, text, color, scale) {
    if (global.SIM.headless || !is_struct(u)) return;
    if (u.isMob && !u.isElite && !u.isBoss) return;
    array_push(global.G.effects, {
        gx: u.grid.gx, gy: u.grid.gy, text: text, color: fb_hex(color),
        life: 0.9, max: 0.9, scale: scale === undefined ? 0.7 : scale
    });
    fb_vfx_spawn_effect(text, color, u.grid.gx, u.grid.gy);
}

function fb_burst(u, color, count, strength) {
    if (global.SIM.headless || !is_struct(u)) return;
    if (u.isMob && !u.isElite && !u.isBoss) return;
    var n = max(3, count === undefined ? 8 : count);
    var parts = [];
    for (var i = 0; i < n; i++) {
        var a = random(2 * pi);
        var sp = (0.5 + random(1)) * (strength === undefined ? 1 : strength);
        array_push(parts, {
            gx: u.grid.gx + (random(1) - 0.5) * 0.2,
            gy: u.grid.gy + (random(1) - 0.5) * 0.2,
            vx: cos(a) * sp, vy: sin(a) * sp,
            life: 0.7
        });
    }
    array_push(global.G.particles, { parts: parts, life: 0.7, max: 0.7, color: fb_hex(color) });
}

function fb_shock(u, color, strength) {
    if (global.SIM.headless || !is_struct(u)) return;
    if (u.isMob && !u.isElite && !u.isBoss) return;
    array_push(global.G.shockwaves, {
        gx: u.grid.gx, gy: u.grid.gy, color: fb_hex(color),
        life: 0.5, max: 0.5, scale: strength === undefined ? 1 : strength
    });
}

function fb_clear_effects() {
    var g = global.G;
    g.effects = [];
    g.particles = [];
    g.shockwaves = [];
    g.vfx = [];
    global.shake = 0;
}

function fb_tick_effects(dt) {
    var i, k;
    var g = global.G;
    for (i = array_length(g.effects) - 1; i >= 0; i--) {
        g.effects[i].life -= dt;
        if (g.effects[i].life <= 0) array_delete(g.effects, i, 1);
    }
    for (i = array_length(g.particles) - 1; i >= 0; i--) {
        var p = g.particles[i];
        p.life -= dt;
        for (k = 0; k < array_length(p.parts); k++) {
            var q = p.parts[k];
            q.gx += q.vx * dt;
            q.gy += q.vy * dt;
        }
        if (p.life <= 0) array_delete(g.particles, i, 1);
    }
    for (i = array_length(g.shockwaves) - 1; i >= 0; i--) {
        g.shockwaves[i].life -= dt;
        if (g.shockwaves[i].life <= 0) array_delete(g.shockwaves, i, 1);
    }
    global.shake = max(0, global.shake - dt);
    fb_vfx_tick(dt);
}

function fb_has_status(u, key) { return fb_get(u.statuses, key, 0) > 0; }

function fb_add_status(u, key, dur, power) {
    var old = fb_get(u.statuses, key, 0);
    if (dur > old) fb_set(u.statuses, key, dur);
    if (!is_undefined(power)) {
        var op = fb_get(u.statusPower, key, 0);
        if (power > op) fb_set(u.statusPower, key, power);
    }
}

function fb_clear_statuses(u) {
    u.statuses = {};
    u.statusPower = {};
}

function fb_status_power(u, key, def) { return fb_get(u.statusPower, key, def); }

function fb_apply_class_synergy(cls, m) {
    switch (cls) {
        case "Wald": m.hp *= 1.20; break;
        case "Magie": m.atk *= 1.15; break;
        case "Dunkel": m.lifesteal += 0.10; break;
        case "Chaos": m.spd *= 1.20; break;
        case "Kaiju": m.hp *= 1.25; break;
        case "Mythos": m.atk *= 1.10; m.shieldPct += 0.10; break;
        case "Geist": m.lifesteal += 0.08; m.curse += 0.10; break;
        case "Tier": m.spd *= 1.15; m.crit += 0.10; break;
        case "Stahl": m.shieldPct += 0.12; m.dr += 0.08; break;
        case "Element": m.burn += 0.02; m.splash += 0.12; break;
    }
}

function fb_apply_race_synergy(race, m) {
    switch (race) {
        case "Folklore": m.atk *= 1.10; m.lifesteal += 0.06; break;
        case "Kaiju": m.hp *= 1.20; m.splash += 0.10; break;
        case "Fee": m.heal += 0.04; m.shieldPct += 0.08; break;
        case "Zwerg": m.dr += 0.10; m.shieldPct += 0.08; break;
        case "Krypto": m.hp *= 1.15; m.shieldPct += 0.06; m.rage += 0.10; break;
        case "Assassine": m.crit += 0.15; m.spd *= 1.12; break;
        case "Alien": m.splash += 0.12; m.burn += 0.025; break;
    }
}

function fb_synergy_stacks(count) { return fb_clamp(count - 1, 0, global.SYNERGY_MAX_STACKS); }
function fb_swarm_stacks(count) { return fb_clamp(count - 2, 0, global.SYNERGY_MAX_STACKS); }

function fb_synergy_counts(list) {
    var counts = {};
    for (var i = 0; i < array_length(list); i++) {
        var u = list[i];
        fb_bump(counts, u.cls);
        fb_bump(counts, u.cls2);
    }
    return counts;
}

function fb_race_counts(list) {
    var counts = {};
    for (var i = 0; i < array_length(list); i++) fb_bump(counts, list[i].race);
    return counts;
}

function fb_merge_innate(m, ability) {
    var inn = fb_get(global.INNATE, ability, undefined);
    if (!is_struct(inn)) return;
    var names = variable_struct_get_names(inn);
    for (var i = 0; i < array_length(names); i++) {
        fb_set(m, names[i], fb_get(inn, names[i], 0));
    }
}

function fb_unit_radius(u) {
    var st = fb_get(global.MONSTER_STYLE, u.key, undefined);
    var r = is_struct(st) ? fb_get(st, "radius", 0.45) : 0.45;
    return fb_clamp(r * 0.72, 0.28, 0.5);
}

function fb_lowest_ally(list) {
    var best = undefined, bestV = 999999;
    for (var i = 0; i < array_length(list); i++) {
        var u = list[i];
        if (u.isDead) continue;
        var v = (u.hp + u.shield) / max(1, u.maxHp);
        if (v < bestV) { bestV = v; best = u; }
    }
    return best;
}

function fb_shuffle(arr) {
    var a = fb_clone(arr);
    for (var i = array_length(a) - 1; i > 0; i--) {
        var j = irandom(i);
        var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
}
