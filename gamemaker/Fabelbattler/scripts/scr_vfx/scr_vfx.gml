// Automatisch erzeugt aus "VFX - Complete Pack.yymps.zip" durch gamemaker/import_vfx.py.
// Nicht von Hand bearbeiten: Das Paket ist die Quelle der Sprite-Ressourcen.
function fb_vfx_init() {
    global.VFX_SPRITES = {
        hit:[spr_small_spark,spr_explosion_without_bomb],
        crit:[spr_star_explosion_without_build_up,spr_electric_explosion_without_build_up],
        magic:[spr_magic_sparkle_with_build_up,spr_magic_sparkle_without_build_up],
        fire:[spr_flame_swoosh,spr_small_flame],
        water:[spr_water_swoosh,spr_water_splash],
        lightning:[spr_lightning_bolt,spr_lightning_swoosh,spr_spark_of_electricity],
        heal:[spr_magic_sparkle_with_build_up],
        shield:[spr_circle_swoosh],
        death:[spr_explosion_with_bomb,spr_smoke_swoosh],
        boss:[spr_electric_explosion_with_build_up],
        victory:[spr_magic_sparkle_with_build_up],
        defeat:[spr_smoke_swoosh],
    };
    global.VFX_FPS = {
        hit:30,
        crit:34,
        magic:30,
        fire:30,
        water:30,
        lightning:34,
        heal:30,
        shield:30,
        death:26,
        boss:28,
        victory:30,
        defeat:24,
    };
    global.VFX_BLEND = {
        heal:c_lime,
        shield:c_aqua,
        water:c_aqua,
        lightning:$fff3b0,
        victory:c_white,
    };
}

function fb_vfx_kind_from_text(text) {
    if (!is_string(text)) return "";
    if (string_pos("★", text) > 0) return "crit";
    if (string_pos("☠", text) > 0) return "death";
    if (string_pos("WIEDER", text) > 0) return "heal";
    if (string_pos("⛨", text) > 0) return "shield";
    if (string_pos("+", text) > 0) return "heal";
    if (string_pos("-", text) > 0) return "hit";
    return "";
}

function fb_vfx_kind_from_color(color) {
    var c = is_string(color) ? string_lower(color) : "";
    if (string_pos("4ade80", c) > 0 || string_pos("22c55e", c) > 0) return "heal";
    if (string_pos("8fb5ff", c) > 0 || string_pos("60a5fa", c) > 0 || string_pos("67e8f9", c) > 0) return "water";
    if (string_pos("ff8a8a", c) > 0 || string_pos("fb7185", c) > 0 || string_pos("e5484d", c) > 0 || string_pos("ffb86b", c) > 0) return "fire";
    if (string_pos("fbbf24", c) > 0 || string_pos("fde68a", c) > 0 || string_pos("f2c14e", c) > 0 || string_pos("ffd166", c) > 0) return "lightning";
    return "magic";
}

function fb_vfx_spawn(kind, gx, gy, scale, alpha) {
    if (global.SIM.headless || !is_struct(global.G)) return;
    var arr = fb_get(global.VFX_SPRITES, kind, undefined);
    if (!is_array(arr) || array_length(arr) === 0) return;
    var spr = arr[irandom(array_length(arr) - 1)];
    var total = sprite_get_number(spr);
    if (total <= 0) return;
    if (array_length(global.G.vfx) > 120) array_delete(global.G.vfx, 0, 1);
    array_push(global.G.vfx, {
        spr: spr, gx: gx, gy: gy,
        frame: 0, total: total, fps: fb_get(global.VFX_FPS, kind, 30),
        scale: scale === undefined ? 0.5 : scale,
        alpha: alpha === undefined ? 0.9 : alpha,
        blend: fb_get(global.VFX_BLEND, kind, c_white),
        life: 0.75, max: 0.75
    });
}

function fb_vfx_spawn_effect(text, color, gx, gy) {
    var kind = fb_vfx_kind_from_text(text);
    if (kind === "") kind = fb_vfx_kind_from_color(color);
    var scale = 0.5;
    if (kind === "crit" || kind === "death" || kind === "boss") scale = 0.8;
    if (kind === "victory" || kind === "defeat") scale = 1.1;
    fb_vfx_spawn(kind, gx, gy, scale, 0.9);
}

function fb_vfx_tick(dt) {
    if (!is_struct(global.G)) return;
    for (var i = array_length(global.G.vfx) - 1; i >= 0; i--) {
        var v = global.G.vfx[i];
        v.life -= dt;
        v.frame = min(v.total - 1, v.frame + dt * v.fps);
        if (v.life <= 0) array_delete(global.G.vfx, i, 1);
    }
}

function fb_vfx_draw() {
    if (global.SIM.headless || !is_struct(global.G)) return;
    var L = fb_layout();
    for (var i = 0; i < array_length(global.G.vfx); i++) {
        var v = global.G.vfx[i];
        var p = fb_world(v.gx, v.gy);
        var w = sprite_get_width(v.spr) * v.scale * L.s;
        var h = sprite_get_height(v.spr) * v.scale * L.s;
        var a = fb_clamp(v.life / v.max, 0, 1) * v.alpha;
        draw_sprite_ext(v.spr, floor(v.frame), p.x - w / 2, p.y - h / 2,
            v.scale * L.s, v.scale * L.s, 0, v.blend, a);
    }
}
