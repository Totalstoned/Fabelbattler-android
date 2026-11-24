// Fabelbattler 1.20.0 – Run, Draft, Wellenablauf, Sieg/Niederlage, Eingaben.

function fb_reroll_cost() { return min(global.REROLL_BASE + global.rerollCount, global.REROLL_MAX); }

function fb_draft_pick_level() {
    var best = 1;
    for (var i = 0; i < array_length(global.G.team); i++) best = max(best, global.G.team[i].level);
    return best;
}

function fb_draft_keys() {
    if (array_length(global.draftOffer) === 3) return fb_clone(global.draftOffer);
    var g = global.G;
    var have = function(role) {
        var n = 0;
        for (var i = 0; i < array_length(g.team); i++) if (g.team[i].role === role) n += 1;
        return n;
    };
    // Rollen mit Lücken zuerst (einfache Insertion-Sort nach "haven").
    var order = fb_clone(global.ROLES);
    for (var a = 1; a < array_length(order); a++) {
        var key = order[a], b = a - 1;
        while (b >= 0 && have(order[b]) > have(key)) {
            order[b + 1] = order[b];
            b -= 1;
        }
        order[b + 1] = key;
    }
    var used = {};
    for (var i = 0; i < array_length(g.team); i++) fb_set(used, g.team[i].key, true);

    var filtered = [];
    for (var k = 0; k < array_length(global.ALL_KEYS); k++) {
        var key2 = global.ALL_KEYS[k];
        if (fb_get(used, key2, false)) continue;
        var r = fb_roster(key2);
        if (global.draftFilterRole !== "ALL" && fb_get(r, "role", "") !== global.draftFilterRole) continue;
        if (global.draftFilterClass !== "ALL" && fb_get(r, "cls", "") !== global.draftFilterClass && fb_get(r, "cls2", "") !== global.draftFilterClass) continue;
        array_push(filtered, key2);
    }
    var pool = array_length(filtered) >= 3 ? filtered : [];
    if (array_length(pool) === 0) {
        for (var f = 0; f < array_length(global.ALL_KEYS); f++) {
            if (!fb_get(used, global.ALL_KEYS[f], false)) array_push(pool, global.ALL_KEYS[f]);
        }
    }
    var shuffled = fb_shuffle(pool);
    var picks = [];
    for (var r2 = 0; r2 < min(2, array_length(order)); r2++) {
        var want = order[r2];
        for (var s = 0; s < array_length(shuffled); s++) {
            var cand = shuffled[s];
            if (fb_get(fb_roster(cand), "role", "") === want && !fb_contains(picks, cand)) {
                array_push(picks, cand);
                break;
            }
        }
    }
    for (var t = 0; t < array_length(shuffled); t++) {
        if (array_length(picks) >= 3) break;
        if (!fb_contains(picks, shuffled[t])) array_push(picks, shuffled[t]);
    }
    global.draftOffer = fb_shuffle(picks);
    return fb_clone(global.draftOffer);
}

function fb_open_draft() {
    var g = global.G;
    if (g.phase === "menu" || g.phase === "draft") return;
    if (array_length(g.team) >= g.teamSize) {
        fb_add_toast("Team ist bereits voll");
        return;
    }
    global.draftReturnPhase = g.phase === "battle" ? "battle" : "prep";
    global.draftOffer = [];
    global.rerollCount = 0;
    g.phase = "draft";
    fb_draft_keys();
}

function fb_close_draft() {
    var g = global.G;
    if (g.phase === "draft") {
        g.phase = (global.draftReturnPhase === "battle" && is_struct(g.battle)) ? "battle" : "prep";
    }
    global.draftOffer = [];
}

function fb_reroll_draft() {
    if (global.G.phase !== "draft") return false;
    var cost = fb_reroll_cost();
    if (global.G.gold < cost) {
        fb_add_toast("Zu wenig Gold für Reroll (" + string(cost) + ")");
        return false;
    }
    global.G.gold -= cost;
    global.rerollCount += 1;
    global.draftOffer = [];
    fb_draft_keys();
    fb_add_toast("Draft neu gewürfelt (−" + string(cost) + " Gold)");
    return true;
}

function fb_draft_buy(index) {
    var g = global.G;
    if (g.phase !== "draft") return false;
    if (index < 0 || index >= array_length(global.draftOffer)) return false;
    if (array_length(g.team) >= g.teamSize) {
        fb_add_toast("Team ist bereits voll");
        return false;
    }
    if (g.gold < 2) {
        fb_add_toast("Zu wenig Gold (2 nötig)");
        return false;
    }
    var key = global.draftOffer[index];
    g.gold -= 2;
    var u = fb_create_unit(key, fb_draft_pick_level(), "player");
    array_push(g.team, u);
    g.selectedUnitId = u.id;
    global.rerollCount = 0;
    global.draftOffer = [];
    fb_refresh_team();
    fb_add_toast(u.emoji + " " + u.name + " gewählt · " + u.role);
    if (array_length(g.team) >= g.teamSize) fb_close_draft();
    else fb_draft_keys();
    return true;
}

function fb_begin_run() {
    var g = global.G;
    g.team = [];
    g.teamSize = global.START_TEAM_MIN;
    g.wave = 1;
    g.gold = 20;
    g.mana = 30;
    g.items = { heal: 2, shield: 1, nova: 1 };
    g.battle = undefined;
    g.selectedUnitId = undefined;
    global.rerollCount = 0;
    g.phase = "prep";
    fb_clear_effects();
    fb_open_draft();
    fb_add_toast("Wähle " + string(global.START_TEAM_MIN) + " Wesen – danach kommt pro Runde 1 dazu");
}

function fb_announce_special_mobs() {
    if (global.SIM.headless || !is_struct(global.G.battle)) return;
    var b = global.G.battle;
    var all = [b.playerMobs, b.enemyMobs];
    for (var p = 0; p < array_length(all); p++) {
        for (var i = 0; i < array_length(all[p]); i++) {
            var m = all[p][i];
            if (!m.isElite && !m.isBoss) continue;
            var col = m.isBoss
                ? (m.side === "player" ? "#7ee0d0" : "#ff6b6b")
                : (m.side === "player" ? "#67e8f9" : "#ffd166");
            fb_shock(m, col, m.isBoss ? 1.6 : 1.1);
            fb_burst(m, col, m.isBoss ? 20 : 12, m.isBoss ? 1.2 : 0.9);
        }
    }
}

function fb_start_battle() {
    var g = global.G;
    if (array_length(g.team) === 0 || g.phase === "battle" || g.phase === "draft") return;
    if (array_length(g.team) < g.teamSize) {
        fb_open_draft();
        return;
    }
    var trimmed = [];
    for (var i = 0; i < min(g.teamSize, array_length(g.team)); i++) array_push(trimmed, g.team[i]);
    g.team = trimmed;
    g.phase = "battle";
    fb_clear_effects();
    fb_revive_team();
    for (var j = 0; j < array_length(g.team); j++) {
        var u = g.team[j];
        u.grid.gx = fb_clamp((j % 2) * 0.7, 0, global.GRID.cols - 1);
        u.grid.gy = fb_clamp(0.6 + floor(j / 2) * 1.7, 0, global.GRID.rows - 1);
        u.attackCd = random(0.4);
        fb_recalc(u);
    }
    var enemyTeam = fb_build_enemy_team();
    var playerMobs = fb_build_mob_swarm("player", g.wave);
    var enemyMobs = fb_build_mob_swarm("enemy", g.wave);
    g.battle = {
        player: g.team, enemies: enemyTeam, playerMobs: playerMobs, enemyMobs: enemyMobs,
        time: 0, mobCache: undefined, kills: 0,
        killsTotal: array_length(enemyTeam) + array_length(enemyMobs)
    };
    if (!is_struct(fb_find_unit(g.selectedUnitId))) {
        g.selectedUnitId = array_length(g.team) > 0 ? g.team[0].id : undefined;
    }
    for (var e = 0; e < array_length(enemyTeam); e++) fb_recalc(enemyTeam[e]);
    fb_refresh_team();
    g.mana = min(g.maxMana, g.mana + 10);
    fb_announce_special_mobs();
    var tierHint = "";
    for (var q = 0; q < array_length(enemyMobs); q++) {
        if (enemyMobs[q].isBoss) { tierHint = " · 👑 BOSS"; break; }
        if (enemyMobs[q].isElite) tierHint = " · ✨ Elite";
    }
    fb_add_toast("Welle " + string(g.wave) + ": " + string(array_length(g.team)) + "+" + string(array_length(playerMobs)) +
        " gegen " + string(array_length(enemyTeam)) + "+" + string(array_length(enemyMobs)) + tierHint);
}

function fb_battle_end_fx(units, color, burstColor) {
    if (global.SIM.headless) return;
    for (var i = 0; i < array_length(units); i++) {
        fb_shock(units[i], color, 1.25);
        fb_burst(units[i], burstColor, 8, 0.9);
    }
    fb_add_shake(0.18);
}

function fb_check_battle_end() {
    var g = global.G;
    if (!is_struct(g.battle) || g.phase !== "battle") return;
    if (array_length(fb_living(fb_side_units(g.battle, "enemy"))) === 0) fb_win_battle();
    else if (array_length(fb_living(fb_side_units(g.battle, "player"))) === 0) fb_lose_battle();
}

function fb_win_battle() {
    var g = global.G;
    var cleared = g.wave;
    var b = g.battle;
    var eliteGold = 0, bossGold = 0, i;
    if (is_struct(b)) {
        for (i = 0; i < array_length(b.enemyMobs); i++) {
            if (b.enemyMobs[i].isElite) eliteGold += 2;
            if (b.enemyMobs[i].isBoss) bossGold += 15;
        }
    }
    var duration = is_struct(b) ? floor(b.time) : 0;
    var survivors = is_struct(b) ? array_length(fb_living(b.player)) : array_length(g.team);
    var heroTotal = is_struct(b) ? array_length(b.player) : array_length(g.team);

    g.phase = "prep";
    g.battle = undefined;
    fb_clear_effects();
    fb_battle_end_fx(fb_living(g.team), "#ffd166", "#fff2a8");

    var reward = 5 + cleared * 2 + eliteGold + bossGold;
    g.gold += reward;
    g.mana = min(g.maxMana, g.mana + 25);
    g.items.heal += 1;
    if (cleared % 2 === 0) g.items.shield += 1;
    if (cleared % 3 === 0) g.items.nova += 1;
    fb_revive_team();
    if (cleared % 3 === 0) {
        var minLvl = 999;
        for (i = 0; i < array_length(g.team); i++) {
            fb_set_unit_level(g.team[i], g.team[i].level + 1);
            minLvl = min(minLvl, g.team[i].level);
        }
        fb_add_toast("Team-Level-Up! Mindestlevel: " + string(minLvl));
    }
    g.wave += 1;
    if (g.teamSize < global.TEAM_GROWTH_CAP) {
        g.teamSize += 1;
        fb_add_toast("Neues Wesen verfügbar: Team wächst auf " + string(g.teamSize) + " (max " + string(global.TEAM_GROWTH_CAP) + ")");
    }
    var bonus = bossGold > 0 ? " (Boss +" + string(bossGold) + ")" : (eliteGold > 0 ? " (Elite +" + string(eliteGold) + ")" : "");
    fb_add_toast("Welle " + string(cleared) + " besiegt! +" + string(reward) + " Gold" + bonus +
        " · " + string(duration) + "s · Helden " + string(survivors) + "/" + string(heroTotal));
    if (g.phase === "prep" && array_length(g.team) < g.teamSize) fb_open_draft();
}

function fb_lose_battle() {
    var g = global.G;
    var b = g.battle;
    var duration = is_struct(b) ? floor(b.time) : 0;
    var survivors = is_struct(b) ? array_length(fb_living(b.player)) : array_length(g.team);
    var heroTotal = is_struct(b) ? array_length(b.player) : array_length(g.team);
    var foesLeft = is_struct(b) ? array_length(fb_living(fb_side_units(b, "enemy"))) : 0;
    g.phase = "defeat";
    g.battle = undefined;
    fb_clear_effects();
    var fallen = [];
    for (var i = 0; i < array_length(g.team); i++) if (g.team[i].isDead) array_push(fallen, g.team[i]);
    fb_battle_end_fx(array_length(fallen) > 0 ? fallen : g.team, "#ef4444", "#ff8a8a");
    fb_revive_team();
    fb_add_toast("Niederlage in Welle " + string(g.wave) + " · " + string(duration) + "s · Helden " +
        string(survivors) + "/" + string(heroTotal) + " · Gegner " + string(foesLeft) + " übrig");
}

function fb_cycle_focus(dir) {
    var g = global.G;
    var list = is_struct(g.battle) ? g.battle.player : g.team;
    list = fb_living(list);
    if (array_length(list) === 0) return;
    var idx = 0;
    for (var i = 0; i < array_length(list); i++) {
        if (list[i].id === g.selectedUnitId) { idx = i; break; }
    }
    idx = (idx + dir + array_length(list)) % array_length(list);
    g.selectedUnitId = list[idx].id;
}

function fb_point_in(r, x, y) {
    return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

function fb_handle_input() {
    var mx = device_mouse_x_to_gui(0);
    var my = device_mouse_y_to_gui(0);
    var click = mouse_check_button_pressed(mb_left);
    var g = global.G;

    if (click) {
        if (g.phase === "menu") {
            if (fb_point_in(fb_ui_rect("menuStart"), mx, my)) fb_begin_run();
        } else if (g.phase === "draft") {
            var i;
            for (i = 0; i < 3; i++) {
                if (fb_point_in(fb_ui_rect("card" + string(i)), mx, my)) { fb_draft_buy(i); break; }
            }
            if (fb_point_in(fb_ui_rect("reroll"), mx, my)) fb_reroll_draft();
            if (fb_point_in(fb_ui_rect("skip"), mx, my)) fb_close_draft();
            if (fb_point_in(fb_ui_rect("role"), mx, my)) {
                var roles = ["ALL", "TANK", "DPS", "HEALER", "BUFFER"];
                var cur = 0;
                for (var ri = 0; ri < array_length(roles); ri++) if (roles[ri] === global.draftFilterRole) cur = ri;
                var next = (cur + 1) % array_length(roles);
                global.draftFilterRole = roles[next];
                global.draftOffer = [];
                fb_draft_keys();
            }
            if (fb_point_in(fb_ui_rect("cls"), mx, my)) {
                var classes = ["ALL", "Wald", "Magie", "Dunkel", "Chaos", "Kaiju", "Mythos", "Geist", "Tier", "Stahl", "Element"];
                var ci = 0;
                for (var c = 0; c < array_length(classes); c++) if (classes[c] === global.draftFilterClass) ci = c;
                global.draftFilterClass = classes[(ci + 1) % array_length(classes)];
                global.draftOffer = [];
                fb_draft_keys();
            }
        } else {
            if (fb_point_in(fb_ui_rect("battleStart"), mx, my)) fb_start_battle();
            else if (fb_point_in(fb_ui_rect("draftOpen"), mx, my)) fb_open_draft();
            else if (fb_point_in(fb_ui_rect("heal"), mx, my)) fb_hero_heal();
            else if (fb_point_in(fb_ui_rect("nova"), mx, my)) fb_fabel_blitz();
            else if (fb_point_in(fb_ui_rect("itemHeal"), mx, my)) fb_use_item("heal");
            else if (fb_point_in(fb_ui_rect("itemShield"), mx, my)) fb_use_item("shield");
            else if (fb_point_in(fb_ui_rect("itemNova"), mx, my)) fb_use_item("nova");
            else if (fb_point_in(fb_ui_rect("prev"), mx, my)) fb_cycle_focus(-1);
            else if (fb_point_in(fb_ui_rect("next"), mx, my)) fb_cycle_focus(1);
        }
    }

    if (keyboard_check_pressed(vk_space)) {
        if (g.phase === "menu") fb_begin_run();
        else if (g.phase === "draft") fb_close_draft();
        else fb_start_battle();
    }
    if (keyboard_check_pressed(ord("R")) && g.phase === "draft") fb_reroll_draft();
    if (keyboard_check_pressed(ord("H"))) fb_hero_heal();
    if (keyboard_check_pressed(ord("N"))) fb_fabel_blitz();
    if (keyboard_check_pressed(ord("1"))) fb_use_item("heal");
    if (keyboard_check_pressed(ord("2"))) fb_use_item("shield");
    if (keyboard_check_pressed(ord("3"))) fb_use_item("nova");
    if (keyboard_check_pressed(vk_left)) fb_cycle_focus(-1);
    if (keyboard_check_pressed(vk_right)) fb_cycle_focus(1);
    if (keyboard_check_pressed(vk_escape) && g.phase === "draft") fb_close_draft();
}

function fb_step(dtRaw) {
    var dt = fb_clamp(dtRaw, 0, 0.05);
    var g = global.G;
    global.uiClock += dt;
    g.mana = min(g.maxMana, g.mana + dt * (g.phase === "battle" && is_struct(g.battle) ? 12 : 7));
    fb_tick_effects(dt);
    fb_handle_input();
    if (g.phase === "battle" && is_struct(g.battle)) fb_update_battle(dt);
}
