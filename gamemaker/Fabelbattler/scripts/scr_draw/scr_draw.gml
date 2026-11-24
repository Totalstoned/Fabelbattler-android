// Fabelbattler 1.20.0 – 2D-Darstellung des 18x14-Kampfgrids, HUD, Draft und Menü.
// Die originale Three.js-Szene wird hier als flache, lesbare Schlachtansicht abgebildet.

function fb_layout() {
    var w = window_get_width();
    var h = window_get_height();
    var s = min(w / 1280, h / 720);
    return { s: s, ox: (w - 1280 * s) / 2, oy: (h - 720 * s) / 2, w: w, h: h };
}

function fb_ui_rect(name) {
    var L = fb_layout();
    var b;
    if (name === "menuStart") b = { x: 490, y: 390, w: 300, h: 70 };
    else if (name === "battleStart") b = { x: 30, y: 620, w: 170, h: 46 };
    else if (name === "draftOpen") b = { x: 210, y: 620, w: 140, h: 46 };
    else if (name === "heal") b = { x: 360, y: 620, w: 140, h: 46 };
    else if (name === "nova") b = { x: 510, y: 620, w: 140, h: 46 };
    else if (name === "itemHeal") b = { x: 670, y: 620, w: 120, h: 46 };
    else if (name === "itemShield") b = { x: 800, y: 620, w: 120, h: 46 };
    else if (name === "itemNova") b = { x: 930, y: 620, w: 120, h: 46 };
    else if (name === "prev") b = { x: 1070, y: 620, w: 80, h: 46 };
    else if (name === "next") b = { x: 1160, y: 620, w: 90, h: 46 };
    else if (name === "card0") b = { x: 230, y: 190, w: 230, h: 300 };
    else if (name === "card1") b = { x: 525, y: 190, w: 230, h: 300 };
    else if (name === "card2") b = { x: 820, y: 190, w: 230, h: 300 };
    else if (name === "reroll") b = { x: 1080, y: 500, w: 165, h: 50 };
    else if (name === "skip") b = { x: 1080, y: 560, w: 165, h: 50 };
    else if (name === "role") b = { x: 40, y: 120, w: 170, h: 40 };
    else if (name === "cls") b = { x: 40, y: 170, w: 170, h: 40 };
    else b = { x: 0, y: 0, w: 0, h: 0 };
    return { x: L.ox + b.x * L.s, y: L.oy + b.y * L.s, w: b.w * L.s, h: b.h * L.s };
}

function fb_field_rect() {
    var L = fb_layout();
    return { x: L.ox + 30 * L.s, y: L.oy + 80 * L.s, w: 1220 * L.s, h: 430 * L.s };
}

function fb_world(gx, gy) {
    var f = fb_field_rect();
    return {
        x: f.x + gx / max(1, global.GRID.cols - 1) * f.w,
        y: f.y + gy / max(1, global.GRID.rows - 1) * f.h
    };
}

function fb_panel(x, y, w, h, col, alpha) {
    draw_set_alpha(alpha);
    draw_set_color(col);
    draw_rectangle(x, y, x + w, y + h, false);
    draw_set_alpha(1);
}

function fb_button(name, label, enabled) {
    var r = fb_ui_rect(name);
    var mx = device_mouse_x_to_gui(0);
    var my = device_mouse_y_to_gui(0);
    var hover = fb_point_in(r, mx, my);
    var base = enabled ? (hover ? c_dkgray : c_gray) : $333333;
    fb_panel(r.x, r.y, r.w, r.h, base, 0.95);
    draw_set_color(enabled ? c_white : $777777);
    draw_rectangle(r.x, r.y, r.x + r.w, r.y + r.h, true);
    draw_set_halign(fa_center);
    draw_set_valign(fa_middle);
    draw_set_color(enabled ? c_white : $999999);
    draw_text(r.x + r.w / 2, r.y + r.h / 2, label);
    draw_set_halign(fa_left);
    draw_set_valign(fa_top);
}

function fb_bar(x, y, w, h, ratio, col) {
    draw_set_color($20242c);
    draw_rectangle(x, y, x + w, y + h, false);
    draw_set_color(col);
    draw_rectangle(x, y, x + w * fb_clamp(ratio, 0, 1), y + h, false);
    draw_set_color($64748b);
    draw_rectangle(x, y, x + w, y + h, true);
}

function fb_draw_field() {
    var f = fb_field_rect();
    fb_panel(f.x, f.y, f.w, f.h, $101620, 0.96);
    draw_set_color($263243);
    for (var gx = 0; gx <= global.GRID.cols; gx++) {
        var x = f.x + gx / global.GRID.cols * f.w;
        draw_line(x, f.y, x, f.y + f.h);
    }
    for (var gy = 0; gy <= global.GRID.rows; gy++) {
        var y = f.y + gy / global.GRID.rows * f.h;
        draw_line(f.x, y, f.x + f.w, y);
    }
    draw_set_color($3f5064);
    var mid = fb_world((global.GRID.cols - 1) / 2, 0);
    draw_line(mid.x, f.y, mid.x, f.y + f.h);

    var b = global.G.battle;
    if (is_struct(b)) {
        var pools = [b.playerMobs, b.enemyMobs, b.player, b.enemies];
        for (var p = 0; p < array_length(pools); p++) {
            var list = pools[p];
            for (var i = 0; i < array_length(list); i++) fb_draw_unit(list[i]);
        }
        var sel = fb_find_unit(global.G.selectedUnitId);
        if (is_struct(sel) && is_struct(sel.target)) {
            var a = fb_world(sel.grid.gx, sel.grid.gy);
            var t = fb_world(sel.target.grid.gx, sel.target.grid.gy);
            draw_set_color($fde68a);
            draw_set_alpha(0.65);
            draw_line(a.x, a.y, t.x, t.y);
            draw_set_alpha(1);
        }
    } else {
        for (var t2 = 0; t2 < array_length(global.G.team); t2++) fb_draw_unit(global.G.team[t2]);
    }
}

function fb_draw_unit(u) {
    if (u.isDead && u.deathTimer <= 0) return;
    var p = fb_world(u.grid.gx, u.grid.gy);
    var r = 6 + fb_unit_radius(u) * 10;
    if (u.isBoss) r *= 1.8;
    else if (u.isElite) r *= 1.35;
    var col = u.side === "player" ? $4fd1c5 : $ff7a7a;
    if (!u.isMob) {
        var rm = fb_get(global.ROLE_META, u.role, undefined);
        if (is_struct(rm)) col = fb_hex(fb_get(rm, "col", "#ffffff"));
    } else {
        col = u.color;
    }
    if (u.hitFlash > 0) col = c_white;
    draw_set_alpha(u.isDead ? 0.3 : 1);
    draw_set_color(col);
    draw_circle(p.x, p.y, r, false);
    draw_set_color(c_white);
    draw_circle(p.x, p.y, r, true);
    if (!u.isMob && u.id === global.G.selectedUnitId) {
        draw_set_color($fde68a);
        draw_circle(p.x, p.y, r + 4, true);
    }
    if (u.isElite || u.isBoss) {
        draw_set_color(u.isBoss ? $ff2d55 : $fbbf24);
        draw_circle(p.x, p.y, r + 3, true);
    }
    var bw = u.isMob ? 12 : 28;
    fb_bar(p.x - bw / 2, p.y - r - 10, bw, 4, u.hp / max(1, u.maxHp),
        u.side === "player" ? $4ade80 : $f87171);
    if (u.shield > 0) fb_bar(p.x - bw / 2, p.y - r - 6, bw, 2, u.shield / max(1, u.maxHp), $8fb5ff);
    if (!u.isMob) {
        draw_set_color($e6edf5);
        draw_set_halign(fa_center);
        draw_text(p.x, p.y + r + 3, string(u.name) + " L" + string(u.level));
        draw_set_halign(fa_left);
    }
    draw_set_alpha(1);
}

function fb_draw_effects() {
    var i, j;
    var L = fb_layout();
    for (i = 0; i < array_length(global.G.shockwaves); i++) {
        var w = global.G.shockwaves[i];
        var p = fb_world(w.gx, w.gy);
        var t = 1 - fb_clamp(w.life / w.max, 0, 1);
        draw_set_alpha(0.7 * (1 - t));
        draw_set_color(w.color);
        draw_circle(p.x, p.y, (8 + t * 34 * w.scale) * L.s, true);
        draw_set_alpha(1);
    }
    for (i = 0; i < array_length(global.G.particles); i++) {
        var ps = global.G.particles[i];
        draw_set_alpha(fb_clamp(ps.life / ps.max, 0, 1));
        draw_set_color(ps.color);
        for (j = 0; j < array_length(ps.parts); j++) {
            var q = ps.parts[j];
            var pp = fb_world(q.gx, q.gy);
            draw_circle(pp.x, pp.y, 2 * L.s, false);
        }
        draw_set_alpha(1);
    }
    for (i = 0; i < array_length(global.G.effects); i++) {
        var e = global.G.effects[i];
        var ep = fb_world(e.gx, e.gy);
        draw_set_alpha(fb_clamp(e.life / e.max, 0, 1));
        draw_set_color(e.color);
        draw_set_halign(fa_center);
        draw_text(ep.x, ep.y - 26 * L.s - (e.max - e.life) * 26 * L.s, e.text);
        draw_set_halign(fa_left);
        draw_set_alpha(1);
    }
}

function fb_draw_hud() {
    var g = global.G;
    var L = fb_layout();
    var x = L.ox + 30 * L.s, y = L.oy + 18 * L.s;
    fb_panel(L.ox, L.oy, L.w, 62 * L.s, $0b0f16, 0.92);
    draw_set_color(c_white);
    draw_text(x, y, "FABELBATTLER 1.20.0   Welle " + string(g.wave) + "   Phase: " + g.phase);
    draw_text(x, y + 22 * L.s, "Gold " + string(g.gold) + "   Team " + string(array_length(g.team)) + "/" + string(g.teamSize) +
        "   Kills " + (is_struct(g.battle) ? string(g.battle.kills) + "/" + string(g.battle.killsTotal) : "-") +
        (is_struct(g.battle) ? "   Zeit " + string(floor(g.battle.time)) + "s" : ""));
    fb_bar(x + 820 * L.s, y + 4 * L.s, 180 * L.s, 12 * L.s, g.mana / g.maxMana, $60a5fa);
    draw_text(x + 820 * L.s, y + 20 * L.s, "Mana " + string(round(g.mana)) + "/" + string(g.maxMana));

    var by = L.oy + 548 * L.s;
    fb_panel(L.ox, by, L.w, 172 * L.s, $0b0f16, 0.92);
    fb_button("battleStart", "Kampf (Leertaste)", g.phase !== "battle" && g.phase !== "draft" && array_length(g.team) === g.teamSize);
    fb_button("draftOpen", "Draft", g.phase !== "battle" && g.phase !== "draft" && array_length(g.team) < g.teamSize);
    fb_button("heal", "Heilung 40", g.mana >= 40 && g.phase === "battle");
    fb_button("nova", "Blitz 70", g.mana >= 70 && g.phase === "battle");
    fb_button("itemHeal", "Trank " + string(g.items.heal), g.items.heal > 0 && g.phase === "battle");
    fb_button("itemShield", "Schild " + string(g.items.shield), g.items.shield > 0 && g.phase === "battle");
    fb_button("itemNova", "Splitter " + string(g.items.nova), g.items.nova > 0 && g.phase === "battle");
    fb_button("prev", "◀", true);
    fb_button("next", "▶", true);

    var sel = fb_find_unit(g.selectedUnitId);
    if (!is_struct(sel)) sel = array_length(g.team) > 0 ? g.team[0] : undefined;
    if (is_struct(sel)) {
        var ix = L.ox + 1070 * L.s, iy = L.oy + 450 * L.s;
        fb_panel(ix, iy, 200 * L.s, 88 * L.s, $111827, 0.9);
        draw_set_color(c_white);
        draw_text(ix + 8 * L.s, iy + 6 * L.s, sel.emoji + " " + sel.name + " L" + string(sel.level));
        draw_text(ix + 8 * L.s, iy + 24 * L.s, sel.role + " / " + sel.cls + " / " + sel.race);
        draw_text(ix + 8 * L.s, iy + 42 * L.s, "HP " + string(round(sel.hp)) + "/" + string(round(sel.maxHp)) +
            "  ATK " + string(round(sel.atk * 10) / 10));
        draw_text(ix + 8 * L.s, iy + 60 * L.s, "Zauber: " + string(fb_get(fb_spell(sel.spell), "name", "-")) +
            " CD " + string(round(sel.spellCd * 10) / 10));
    }
}

function fb_draw_draft() {
    var g = global.G;
    var L = fb_layout();
    fb_panel(L.ox, L.oy, L.w, L.h, $05070b, 0.93);
    draw_set_color(c_white);
    draw_set_halign(fa_center);
    draw_text(L.ox + L.w / 2, L.oy + 100 * L.s, "DRAFT – wähle ein Wesen (2 Gold)");
    draw_set_halign(fa_left);
    fb_button("role", "Rolle: " + global.draftFilterRole, true);
    fb_button("cls", "Klasse: " + global.draftFilterClass, true);
    var keys = fb_draft_keys();
    for (var i = 0; i < 3; i++) {
        var r = fb_ui_rect("card" + string(i));
        fb_panel(r.x, r.y, r.w, r.h, $151c27, 0.98);
        draw_set_color($64748b);
        draw_rectangle(r.x, r.y, r.x + r.w, r.y + r.h, true);
        var key = i < array_length(keys) ? keys[i] : "";
        var u = fb_roster(key);
        if (!is_struct(u)) continue;
        var rm = fb_get(global.ROLE_META, fb_get(u, "role", "DPS"), undefined);
        var rc = is_struct(rm) ? fb_hex(fb_get(rm, "col", "#ffffff")) : c_white;
        draw_set_color(rc);
        draw_text(r.x + 14 * L.s, r.y + 14 * L.s, fb_get(u, "emoji", "?") + " " + fb_get(u, "name", key));
        draw_set_color(c_white);
        draw_text(r.x + 14 * L.s, r.y + 48 * L.s, fb_get(u, "role", "") + " · " + fb_get(u, "cls", "") + " · " + fb_get(u, "race", ""));
        draw_text(r.x + 14 * L.s, r.y + 76 * L.s, "HP " + string(fb_get(u, "hp", 0)) + "   ATK " + string(fb_get(u, "atk", 0)));
        draw_text(r.x + 14 * L.s, r.y + 100 * L.s, "Reichweite " + string(fb_get(u, "rng", 0)) + "   Tempo " + string(fb_get(u, "spd", 0)));
        draw_text(r.x + 14 * L.s, r.y + 132 * L.s, string(fb_get(global.ABILITY_DESC, fb_get(u, "ability", ""), "")));
        draw_text(r.x + 14 * L.s, r.y + 190 * L.s, "Zauber: " + string(fb_get(fb_spell(fb_get(u, "spell", "")), "name", "-")));
        draw_set_color(g.gold >= 2 ? $4ade80 : $f87171);
        draw_text(r.x + 14 * L.s, r.y + 250 * L.s, "Kaufen · 2 Gold");
    }
    fb_button("reroll", "Reroll " + string(fb_reroll_cost()), g.gold >= fb_reroll_cost());
    fb_button("skip", "Zurück", true);
    draw_set_color(c_white);
    draw_text(L.ox + 1080 * L.s, L.oy + 430 * L.s, "Gold " + string(g.gold));
}

function fb_draw_toasts() {
    var L = fb_layout();
    var n = 0;
    for (var i = array_length(global.toastLog) - 1; i >= 0 && n < 3; i--) {
        var t = global.toastLog[i];
        if (current_time - fb_get(t, "at", 0) > 2000) continue;
        var y = L.oy + 70 * L.s + n * 26 * L.s;
        fb_panel(L.ox + L.w / 2 - 260 * L.s, y, 520 * L.s, 22 * L.s, $0f172a, 0.85);
        draw_set_color(c_white);
        draw_set_halign(fa_center);
        draw_text(L.ox + L.w / 2, y + 3 * L.s, fb_get(t, "msg", ""));
        draw_set_halign(fa_left);
        n += 1;
    }
}

function fb_draw() {
    var L = fb_layout();
    fb_panel(0, 0, L.w, L.h, $070a10, 1);
    if (global.G.phase === "menu") {
        draw_set_halign(fa_center);
        draw_set_color(c_white);
        draw_text(L.ox + L.w / 2, L.oy + 220 * L.s, "FABELBATTLER");
        draw_text(L.ox + L.w / 2, L.oy + 270 * L.s, "Autobattler · 123 Wesen · 51 Zauber · Version 1.20.0");
        draw_set_halign(fa_left);
        fb_button("menuStart", "Abenteuer starten", true);
        draw_set_color($94a3b8);
        draw_text(L.ox + L.w / 2 - 250 * L.s, L.oy + 490 * L.s,
            "Steuerung: Leertaste Kampf · R Reroll · H Heilung · N Blitz · 1/2/3 Items · ◀▶ Fokus");
        return;
    }
    fb_draw_field();
    fb_draw_effects();
    fb_draw_hud();
    if (global.G.phase === "draft") fb_draw_draft();
    if (global.G.phase === "defeat") {
        fb_panel(L.ox + L.w / 2 - 250 * L.s, L.oy + 250 * L.s, 500 * L.s, 130 * L.s, $2a1015, 0.95);
        draw_set_halign(fa_center);
        draw_set_color(c_white);
        draw_text(L.ox + L.w / 2, L.oy + 280 * L.s, "NIEDERLAGE in Welle " + string(global.G.wave));
        draw_text(L.ox + L.w / 2, L.oy + 315 * L.s, "Leertaste = erneut versuchen");
        draw_set_halign(fa_left);
    }
    fb_draw_toasts();
}
