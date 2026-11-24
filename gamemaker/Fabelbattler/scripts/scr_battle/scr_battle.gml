// Fabelbattler 1.20.0 – Kampf-Engine: Schaden, Status, Zauber, Ziele, Items, Ticks.
// Formeln und Kadenz entsprechen der aktiven index3d.html; nur die 3D-Effekte
// sind durch leichte 2D-Partikel ersetzt.

function fb_collision_at(u, gx, gy, b) {
    var all = is_struct(b) ? [b.player, b.enemies] : [global.G.team];
    for (var p = 0; p < array_length(all); p++) {
        var list = all[p];
        for (var i = 0; i < array_length(list); i++) {
            var o = list[i];
            if (o === u || o.isDead) continue;
            var dx = gx - o.grid.gx;
            var dy = gy - o.grid.gy;
            if (sqrt(dx * dx + dy * dy) < fb_unit_radius(u) + fb_unit_radius(o)) return o;
        }
    }
    return undefined;
}

function fb_move_unit(u, dx, dy, b) {
    var try_pos = function(gx, gy) {
        gx = fb_clamp(gx, 0, global.GRID.cols - 1);
        gy = fb_clamp(gy, 0, global.GRID.rows - 1);
        if (is_struct(fb_collision_at(u, gx, gy, b))) return undefined;
        return { gx: gx, gy: gy };
    };
    var p = try_pos(u.grid.gx + dx, u.grid.gy + dy);
    if (is_undefined(p)) p = try_pos(u.grid.gx + dx, u.grid.gy);
    if (is_undefined(p)) p = try_pos(u.grid.gx, u.grid.gy + dy);
    if (is_undefined(p)) return false;
    u.grid.gx = p.gx;
    u.grid.gy = p.gy;
    return true;
}

function fb_damage_text_scale(dmg, target, crit) {
    var rel = fb_clamp(dmg / max(1, target.maxHp) * 4, 0, 1);
    return 0.7 + rel * 0.25 + (crit ? 0.4 : 0);
}

function fb_heal(u, amount) {
    if (u.isDead || amount <= 0) return 0;
    var real = min(amount, u.maxHp - u.hp);
    u.hp += real;
    if (real > 1) {
        fb_effect(u, "+" + round(real), "#4ade80");
        fb_burst(u, "#4ade80", 10, 0.7);
        fb_shock(u, "#4ade80", 0.55);
    }
    return real;
}

function fb_shield(u, amount) {
    if (u.isDead || amount <= 0) return;
    u.shield += amount;
    fb_effect(u, "+" + round(amount) + " ⛨", "#8fb5ff");
    fb_burst(u, "#8fb5ff", 9, 0.6);
    fb_shock(u, "#8fb5ff", 0.5);
}

function fb_kill_unit(u, source) {
    if (u.isDead) return;
    if (fb_get(u.modsEffective, "revive", 0) > 0 && !u.revived) {
        u.revived = true;
        u.hp = u.maxHp * 0.4;
        u.shield = u.maxHp * 0.15;
        fb_clear_statuses(u);
        fb_effect(u, "WIEDER!", "#f2c14e");
        fb_burst(u, "#f2c14e", 14, 1.1);
        fb_add_toast("🌀 " + u.name + " ersteht wieder!");
        return;
    }
    u.isDead = true;
    if (is_struct(global.G.battle) && u.side === "enemy") global.G.battle.kills += 1;
    u.hp = 0;
    u.target = undefined;
    u.deathTimer = 0.6;
    if (global.G.selectedUnitId === u.id && u.side === "player" && is_struct(global.G.battle)) {
        var heroes = global.G.battle.player;
        for (var i = 0; i < array_length(heroes); i++) {
            if (!heroes[i].isDead) { global.G.selectedUnitId = heroes[i].id; break; }
        }
    }
    fb_effect(u, "☠", "#e5484d");
    fb_burst(u, "#e5484d", 18, 1.4);
    fb_shock(u, "#e5484d", u.isBoss ? 2 : 1.3);
    if (u.isBoss) {
        fb_add_shake(0.35);
        fb_add_toast(u.side === "enemy" ? "👑 Gegner-Boss besiegt!" : "👑 Team-Boss gefallen!");
    } else if (!u.isMob) {
        fb_add_shake(0.2);
        fb_add_toast("☠ " + u.name + " fällt!");
    }
    if (is_struct(source) && source.side === "player" && fb_get(source.modsEffective, "gold", 0) > 0) {
        global.G.gold += fb_get(source.modsEffective, "gold", 0);
    }
    if (is_struct(source) && fb_get(source.modsEffective, "killAtk", 0) > 0 && !source.isDead) {
        source.atk *= 1 + fb_get(source.modsEffective, "killAtk", 0);
        fb_effect(source, "ATK ↑", "#fbbf24");
    }
}

function fb_apply_damage(target, amount, source, showNumber, crit) {
    if (target.isDead || amount <= 0) return 0;
    var dmg = amount * (1 - fb_get(target.modsEffective, "dr", 0));
    if (fb_has_status(target, "defBuff")) dmg *= 1 - fb_status_power(target, "defBuff", 0);

    if (target.shield > 0) {
        var absorbed = min(target.shield, dmg);
        target.shield -= absorbed;
        dmg -= absorbed;
        if (absorbed > 1 && showNumber) {
            fb_effect(target, "⛨ " + round(absorbed), "#8fb5ff", fb_damage_text_scale(absorbed, target, false));
            if (dmg <= 0) {
                target.hitFlash = 0.15;
                fb_burst(target, "#8fb5ff", 6, 0.7);
            }
        }
    }
    if (dmg > 0) {
        target.hp -= dmg;
        target.hitFlash = 0.15;
        if (!target.isMob) fb_add_shake(fb_clamp(dmg / max(1, target.maxHp) * 0.5, 0.012, 0.16));
        if (showNumber) {
            var prefix = crit ? "★ " : "";
            var col = (is_struct(source) && source.side === "enemy") ? "#ff8a8a" : "#ffd166";
            fb_effect(target, prefix + "-" + round(dmg), col, fb_damage_text_scale(dmg, target, crit));
            if (dmg > target.maxHp * 0.06) fb_shock(target, crit ? "#fff2a8" : "#ffb86b", 0.75);
        }
        if (is_struct(source) && fb_get(source.modsEffective, "lifesteal", 0) > 0) {
            fb_heal(source, dmg * fb_get(source.modsEffective, "lifesteal", 0));
        }
    }
    if (target.hp <= 0) fb_kill_unit(target, source);
    return dmg;
}

function fb_cast_aura(u, b) {
    if (!is_struct(u.aura) || !is_struct(b)) return;
    var a = u.aura;
    var allies = fb_living_allies(u, b);
    var hits = 0;
    for (var i = 0; i < array_length(allies); i++) {
        var ally = allies[i];
        if (fb_dist(u, ally) <= fb_get(a, "radius", 2.8)) {
            fb_add_status(ally, fb_get(a, "status", "atkBuff"), fb_get(a, "dur", 3.2), fb_get(a, "power", 0.16));
            fb_effect(ally, fb_get(a, "emoji", "") + " " + fb_get(a, "label", ""), fb_get(a, "css", "#fcd34d"));
            hits += 1;
        }
    }
    if (hits > 0) {
        fb_burst(u, fb_get(a, "css", "#fcd34d"), 12, 0.85);
        fb_shock(u, fb_get(a, "css", "#fcd34d"), 0.6);
    }
}

function fb_tick_unit(u, dt, b) {
    u.attackCd = max(0, u.attackCd - dt);
    u.supportCd = max(0, u.supportCd - dt);
    u.spellCd = max(0, u.spellCd - dt);
    u.hitFlash = max(0, u.hitFlash - dt);
    u.animAttack = max(0, u.animAttack - dt);
    var names = variable_struct_get_names(u.statuses);
    for (var i = 0; i < array_length(names); i++) {
        var k = names[i];
        var v = max(0, fb_get(u.statuses, k, 0) - dt);
        fb_set(u.statuses, k, v);
    }
    if (is_struct(u.aura) && !u.isDead) {
        u.auraCd = max(0, u.auraCd - dt);
        if (u.auraCd <= 0 && !fb_has_status(u, "stun") && !fb_has_status(u, "charm")) {
            fb_cast_aura(u, b);
            u.auraCd = fb_get(u.aura, "cd", 6);
        }
    }
    if (fb_has_status(u, "burn")) {
        fb_apply_damage(u, fb_status_power(u, "burn", 0) * u.maxHp * dt, undefined, false, false);
    }
}

function fb_choose_target(u, b) {
    if (fb_has_status(u, "charm")) {
        var allies = fb_living_allies(u, b);
        var other = [];
        for (var i = 0; i < array_length(allies); i++) if (allies[i] !== u) array_push(other, allies[i]);
        return fb_lowest_ally(other);
    }
    var targets = fb_living_enemies(u, b);
    if (array_length(targets) === 0) return undefined;
    var taunts = [];
    for (var j = 0; j < array_length(targets); j++) {
        var t = targets[j];
        if (fb_has_status(t, "taunt") || fb_get(t.modsEffective, "taunt", false)) array_push(taunts, t);
    }
    if (array_length(taunts) > 0) {
        var best = taunts[0], bd = fb_dist(u, best);
        for (var k = 1; k < array_length(taunts); k++) {
            var d = fb_dist(u, taunts[k]);
            if (d < bd) { best = taunts[k]; bd = d; }
        }
        return best;
    }
    var pick = targets[0], score = fb_dist(u, pick) + pick.hp / max(1, pick.maxHp) * 0.4;
    for (var m = 1; m < array_length(targets); m++) {
        var s = fb_dist(u, targets[m]) + targets[m].hp / max(1, targets[m].maxHp) * 0.4;
        if (s < score) { pick = targets[m]; score = s; }
    }
    return pick;
}

function fb_move_toward(u, target, dt, b) {
    if (fb_has_status(u, "root") || fb_has_status(u, "stun")) return;
    var dx = target.grid.gx - u.grid.gx;
    var dy = target.grid.gy - u.grid.gy;
    var d = sqrt(dx * dx + dy * dy);
    if (d < 0.02) return;
    var slow = fb_has_status(u, "slow") ? (1 - fb_status_power(u, "slow", 0.3)) : 1;
    var speed = (0.55 + u.spd * 0.35) * global.MAP_SPEED * slow;
    var step = min(speed * dt, d);
    fb_move_unit(u, dx / d * step, dy / d * step, b);
}

function fb_support_action(u, b, dt) {
    if (fb_has_status(u, "charm") || fb_has_status(u, "stun")) return false;
    if (u.supportCd > 0) return false;
    var e = u.modsEffective;
    if (!fb_get(e, "heal", 0) && !fb_get(e, "shieldPct", 0)) return false;
    var ally = fb_lowest_ally(fb_living_allies(u, b));
    if (!is_struct(ally)) return false;
    var need = (ally.hp + ally.shield) / max(1, ally.maxHp);
    if (need >= 0.78) return false;
    if (fb_dist(u, ally) > u.healRange) {
        fb_move_toward(u, ally, dt, b);
        return true;
    }
    if (fb_get(e, "heal", 0)) fb_heal(ally, u.maxHp * fb_get(e, "heal", 0) + u.atk * 0.4);
    if (fb_get(e, "shieldPct", 0)) fb_shield(ally, u.maxHp * fb_get(e, "shieldPct", 0));
    u.attackCd = 1 / u.spd;
    u.supportCd = 4;
    return true;
}

function fb_apply_on_hit(u, target, b) {
    var e = u.modsEffective;
    if (fb_get(e, "splash", 0)) {
        var foes = fb_living_enemies(u, b);
        for (var i = 0; i < array_length(foes); i++) {
            var t = foes[i];
            if (t !== target && fb_dist(t, target) < 1.4) fb_apply_damage(t, u.atk * fb_get(e, "splash", 0), u, false, false);
        }
    }
    if (fb_get(e, "curse", 0)) fb_add_status(target, "weaken", 2.5, fb_get(e, "curse", 0));
    if (fb_get(e, "slow", 0) && random(1) < 0.55) fb_add_status(target, "slow", 2, fb_get(e, "slow", 0));
    if (fb_get(e, "root", 0) && random(1) < fb_get(e, "root", 0)) fb_add_status(target, "root", 0.8);
    if (fb_get(e, "stun", 0) && random(1) < fb_get(e, "stun", 0)) fb_add_status(target, "stun", 0.7);
    if (fb_get(e, "charm", 0) && random(1) < fb_get(e, "charm", 0)) fb_add_status(target, "charm", 1.8);
    if (fb_get(e, "burn", 0)) fb_add_status(target, "burn", 3, fb_get(e, "burn", 0));
    if (fb_get(e, "howl", 0)) {
        var allies = fb_living_allies(u, b);
        for (var j = 0; j < array_length(allies); j++) fb_add_status(allies[j], "atkBuff", 3, fb_get(e, "howl", 0));
    }
}

function fb_damage_multiplier(u) {
    var dmg = 1;
    if (fb_has_status(u, "weaken")) dmg *= 1 - fb_status_power(u, "weaken", 0);
    if (fb_has_status(u, "atkBuff")) dmg *= 1 + fb_status_power(u, "atkBuff", 0);
    if (fb_get(u.modsEffective, "rage", 0) > 0 && u.hp < u.maxHp * 0.5) dmg *= 1 + fb_get(u.modsEffective, "rage", 0);
    return dmg;
}

function fb_roll_crit(u) {
    var crit = fb_get(u.modsEffective, "crit", 0);
    return crit > 0 && random(1) < crit;
}

function fb_cast_spell(u, target, b) {
    var sp = fb_spell(u.spell);
    if (!is_struct(sp) || fb_get(sp, "cd", 0) <= 0 || u.spellCd > 0) return false;
    if (fb_has_status(u, "stun") || fb_has_status(u, "charm")) return false;
    if (!is_struct(target) || (target.isDead && !fb_get(sp, "revive", false))) return false;
    if (fb_dist(u, target) > fb_get(sp, "range", 3)) return false;

    u.spellCd = fb_get(sp, "cd", 1) / max(0.7, u.spd);
    u.animAttack = 0.3;
    if (target.isDead && fb_get(sp, "revive", false)) {
        target.isDead = false;
        target.revived = true;
        target.hp = target.maxHp * 0.35;
        target.shield = target.maxHp * 0.1;
        fb_clear_statuses(target);
        fb_effect(target, "WIEDER!", fb_get(sp, "color", "#e6edf5"));
        return true;
    }
    if (fb_get(sp, "dash", false)) {
        var d = fb_dist(u, target);
        if (d > 1.05) {
            var dx = target.grid.gx - u.grid.gx;
            var dy = target.grid.gy - u.grid.gy;
            var step = min(d - 1.05, 1.6);
            fb_move_unit(u, dx / d * step, dy / d * step, b);
        }
    }
    if (fb_get(sp, "dmg", 0)) {
        var dmg = u.atk * fb_get(sp, "dmg", 0) * (0.9 + random(1) * 0.2) * fb_damage_multiplier(u);
        var crit = fb_roll_crit(u);
        if (crit) dmg *= 2;
        fb_apply_damage(target, dmg, u, true, crit);
        if (fb_get(sp, "splash", 0)) {
            var foes = fb_living_enemies(u, b);
            for (var i = 0; i < array_length(foes); i++) {
                var t = foes[i];
                if (t !== target && fb_dist(t, target) < 1.6) fb_apply_damage(t, dmg * fb_get(sp, "splash", 0), u, false, false);
            }
        }
    }
    var keys = ["weaken", "slow", "root", "stun", "charm", "burn"];
    for (var k = 0; k < array_length(keys); k++) {
        var key = keys[k];
        if (fb_get(sp, key, 0) && !target.isDead) {
            fb_add_status(target, key, key === "burn" ? 3 : 2, fb_get(sp, key, 0));
        }
    }
    if (fb_get(sp, "buff", 0)) {
        var allies = fb_living_allies(u, b);
        for (var j = 0; j < array_length(allies); j++) fb_add_status(allies[j], "atkBuff", 3, fb_get(sp, "buff", 0));
    }
    if (fb_get(sp, "rage", 0)) fb_add_status(u, "atkBuff", 3, fb_get(sp, "rage", 0));
    if (fb_get(sp, "taunt", 0)) fb_add_status(u, "taunt", 2.5, 1);
    var ally = fb_lowest_ally(fb_living_allies(u, b));
    if (!is_struct(ally)) ally = u;
    if (fb_get(sp, "heal", 0)) fb_heal(ally, u.maxHp * fb_get(sp, "heal", 0) + u.atk * 0.35);
    if (fb_get(sp, "shield", 0)) fb_shield(ally, u.maxHp * fb_get(sp, "shield", 0));
    if (fb_get(sp, "gold", 0) && u.side === "player") {
        global.G.gold += fb_get(sp, "gold", 0);
        fb_effect(u, "+" + fb_get(sp, "gold", 0) + " Gold", fb_get(sp, "color", "#e6edf5"));
    }
    var col = fb_get(sp, "color", "#e6edf5");
    fb_effect(target, fb_get(sp, "name", ""), col);
    fb_burst(target, col, (fb_get(sp, "dmg", 0) || fb_get(sp, "heal", 0) || fb_get(sp, "shield", 0)) ? 16 : 10, 1.25);
    fb_shock(target, col, 1);
    fb_add_shake(0.1);
    return true;
}

function fb_try_attack(u, target, b) {
    if (u.attackCd > 0 || fb_has_status(u, "stun")) return;
    if (fb_dist(u, target) > max(1, u.rng / 70)) return;
    var dmg = u.atk * (0.85 + random(1) * 0.3) * fb_damage_multiplier(u);
    var crit = fb_roll_crit(u);
    if (crit) dmg *= 2;
    fb_apply_damage(target, dmg, u, true, crit);
    fb_apply_on_hit(u, target, b);
    fb_burst(target, crit ? "#fff2a8" : "#ffb86b", crit ? 10 : 6, crit ? 1.2 : 0.8);
    u.animAttack = 0.25;
    u.attackCd = 1 / u.spd;
}

function fb_mob_action(u, b, dt) {
    if (!is_struct(b.mobCache)) return;
    var cache = fb_get(b.mobCache, u.side === "player" ? "enemy" : "player", undefined);
    if (!is_struct(cache)) return;
    var front = fb_get(cache, "front", { gx: 0, gy: 0 });
    if (fb_has_status(u, "root") || fb_has_status(u, "stun")) return;
    var dx = front.gx - u.grid.gx;
    var dy = front.gy - u.grid.gy;
    var d = sqrt(dx * dx + dy * dy);
    if (d > 0.9) {
        var step = min((0.4 + u.spd * 0.5) * global.MAP_SPEED * dt, d - 0.85);
        var drift = sin(u.id * 1.7 + b.time * 2) * 0.12;
        var dd = max(0.01, d);
        u.grid.gx = fb_clamp(u.grid.gx + dx / d * step - drift * dy / dd, 0, global.GRID.cols - 1);
        u.grid.gy = fb_clamp(u.grid.gy + dy / d * step + drift * dx / dd, 0, global.GRID.rows - 1);
        return;
    }
    if (u.attackCd > 0) return;
    var targets = fb_living(fb_get(cache, "targets", []));
    if (array_length(targets) === 0) return;
    fb_apply_damage(fb_pick(targets), u.atk, u, false, false);
    u.animAttack = 0.18;
    u.attackCd = 1 / u.spd;
}

function fb_separate(units, dt) {
    for (var i = 0; i < array_length(units); i++) {
        for (var j = i + 1; j < array_length(units); j++) {
            var a = units[i], c = units[j];
            var dx = c.grid.gx - a.grid.gx;
            var dy = c.grid.gy - a.grid.gy;
            var d = sqrt(dx * dx + dy * dy);
            var rad = fb_unit_radius(a) + fb_unit_radius(c);
            if (d <= 0.001) {
                a.grid.gx = fb_clamp(a.grid.gx - 0.02, 0, global.GRID.cols - 1);
                c.grid.gx = fb_clamp(c.grid.gx + 0.02, 0, global.GRID.cols - 1);
            } else if (d < rad) {
                var push = (rad - d) * 0.5 * min(1, dt * 8);
                a.grid.gx = fb_clamp(a.grid.gx - dx / d * push, 0, global.GRID.cols - 1);
                a.grid.gy = fb_clamp(a.grid.gy - dy / d * push, 0, global.GRID.rows - 1);
                c.grid.gx = fb_clamp(c.grid.gx + dx / d * push, 0, global.GRID.cols - 1);
                c.grid.gy = fb_clamp(c.grid.gy + dy / d * push, 0, global.GRID.rows - 1);
            }
        }
    }
}

function fb_blitz_targets(b) {
    if (!is_struct(b)) return [];
    var heroes = fb_living(b.enemies);
    return array_length(heroes) > 0 ? heroes : fb_living(b.enemyMobs);
}

function fb_use_item(kind) {
    var g = global.G;
    if (!is_struct(g.items) || fb_get(g.items, kind, 0) <= 0 || !is_struct(g.battle) || g.phase !== "battle") return false;
    var heroes = fb_living(g.battle.player);
    if (kind === "heal") {
        var ally = fb_lowest_ally(heroes);
        if (!is_struct(ally) || ally.hp >= ally.maxHp) return false;
        g.items.heal -= 1;
        var healed = fb_heal(ally, ally.maxHp * 0.35);
        fb_add_toast("Heiltrank " + ally.emoji + " +" + round(healed) + " HP");
    } else if (kind === "shield") {
        if (array_length(heroes) === 0) return false;
        g.items.shield -= 1;
        for (var i = 0; i < array_length(heroes); i++) fb_shield(heroes[i], heroes[i].maxHp * 0.25);
        fb_add_toast("Schutzrune ⛨ +25 % für alle Helden");
    } else if (kind === "nova") {
        var targets = fb_blitz_targets(g.battle);
        if (array_length(targets) === 0) return false;
        g.items.nova -= 1;
        var t = fb_pick(targets);
        fb_apply_damage(t, t.maxHp * 0.3, undefined, true, false);
        if (!t.isMob) fb_add_status(t, "stun", 0.8, 1);
        fb_add_toast("Blitzsplitter ✺ 30 %");
    } else return false;
    return true;
}

function fb_fabel_blitz() {
    var g = global.G;
    if (g.mana < 70 || !is_struct(g.battle) || g.phase !== "battle") return false;
    var targets = fb_blitz_targets(g.battle);
    if (array_length(targets) === 0) return false;
    g.mana -= 70;
    var t = fb_pick(targets);
    fb_apply_damage(t, t.maxHp * 0.35, undefined, true, false);
    fb_shock(t, "#fde68a", 1.5);
    fb_add_shake(0.25);
    fb_add_toast("Fabel-Blitz ✺");
    return true;
}

function fb_hero_heal() {
    var g = global.G;
    if (g.mana < 40 || !is_struct(g.battle) || g.phase !== "battle") return false;
    g.mana -= 40;
    var heroes = fb_living(g.battle.player);
    for (var i = 0; i < array_length(heroes); i++) fb_heal(heroes[i], heroes[i].maxHp * 0.25);
    fb_add_toast("Heilung ✚ 25 % für alle Helden");
    return true;
}

function fb_update_battle(dt) {
    var b = global.G.battle;
    if (!is_struct(b)) return;
    b.time += dt;
    fb_refresh_mob_cache(b);
    var units = [];
    var pools = [b.player, b.enemies, b.playerMobs, b.enemyMobs];
    var i, j;
    for (i = 0; i < array_length(pools); i++) {
        for (j = 0; j < array_length(pools[i]); j++) array_push(units, pools[i][j]);
    }
    for (i = 0; i < array_length(units); i++) if (!units[i].isDead) fb_tick_unit(units[i], dt, b);
    for (i = 0; i < array_length(units); i++) {
        var u = units[i];
        if (u.isDead) continue;
        if (u.isMob) { fb_mob_action(u, b, dt); continue; }
        if (fb_support_action(u, b, dt)) continue;
        var target = fb_choose_target(u, b);
        u.target = target;
        if (!is_struct(target)) continue;
        if (fb_cast_spell(u, target, b)) continue;
        if (fb_dist(u, target) > max(1, u.rng / 70)) fb_move_toward(u, target, dt, b);
        else fb_try_attack(u, target, b);
    }
    var heroes = [];
    for (i = 0; i < array_length(b.player); i++) if (!b.player[i].isDead) array_push(heroes, b.player[i]);
    for (i = 0; i < array_length(b.enemies); i++) if (!b.enemies[i].isDead) array_push(heroes, b.enemies[i]);
    fb_separate(heroes, dt);
    fb_check_battle_end();
}

function fb_simulate_battle(dt) {
    var prev = global.SIM.headless;
    global.SIM.headless = true;
    fb_update_battle(dt);
    global.SIM.headless = prev;
}
