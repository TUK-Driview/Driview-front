from PIL import Image, ImageDraw, ImageFilter
import math, os

OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'images')

BLUE      = (55, 138, 221)
BLUE_LITE = (133, 183, 235)
BG_DARK   = (10, 15, 30)
BG_MID    = (13, 27, 62)


def make_bg(size):
    img = Image.new('RGB', (size, size), BG_DARK)
    draw = ImageDraw.Draw(img)
    cx = cy = size // 2
    for i in range(80, 0, -1):
        r   = int(cx * 1.42 * i / 80)
        rat = i / 80
        c = (
            int(BG_DARK[0] + (BG_MID[0] - BG_DARK[0]) * rat),
            int(BG_DARK[1] + (BG_MID[1] - BG_DARK[1]) * rat),
            int(BG_DARK[2] + (BG_MID[2] - BG_DARK[2]) * rat),
        )
        draw.ellipse([cx-r, cy-r, cx+r, cy+r], fill=c)
    return img


def draw_wheel_shape(draw, cx, cy, sc, color, hub_accent):
    """휠 실루엣만 그리기 (글로우용·본체용 공통)."""
    rim_r = int(300 * sc)
    rim_w = int(58 * sc)
    draw.ellipse(
        [cx - rim_r - rim_w//2, cy - rim_r - rim_w//2,
         cx + rim_r + rim_w//2, cy + rim_r + rim_w//2],
        outline=color, width=rim_w,
    )
    spoke_w   = int(52 * sc)
    hub_outer = int(105 * sc)
    spoke_in  = hub_outer - int(4 * sc)
    spoke_out = rim_r - rim_w // 2 - int(4 * sc)
    for deg in [270, 30, 150]:
        rad = math.radians(deg)
        x1 = cx + spoke_in  * math.cos(rad)
        y1 = cy + spoke_in  * math.sin(rad)
        x2 = cx + spoke_out * math.cos(rad)
        y2 = cy + spoke_out * math.sin(rad)
        draw.line([(x1, y1), (x2, y2)], fill=color, width=spoke_w)
    draw.ellipse([cx-hub_outer, cy-hub_outer, cx+hub_outer, cy+hub_outer], fill=color)
    hub_inner = int(62 * sc)
    draw.ellipse([cx-hub_inner, cy-hub_inner, cx+hub_inner, cy+hub_inner], fill=BG_DARK)
    dot_r = int(24 * sc)
    draw.ellipse([cx-dot_r, cy-dot_r, cx+dot_r, cy+dot_r], fill=hub_accent)


def make_icon(size, sc=1.0, fg_only=False, mono=False):
    wheel_color = (255, 255, 255) if mono else BLUE
    hub_accent  = (200, 200, 200) if mono else BLUE_LITE

    # 1) 배경
    if fg_only:
        base = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    else:
        base = make_bg(size).convert('RGBA')

    cx = cy = size // 2

    # 2) 글로우 레이어: 블루 휠을 흐리게
    glow_layer = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow_layer)
    draw_wheel_shape(gd, cx, cy, sc, (*wheel_color, 180), (*hub_accent, 180))
    radius = max(1, int(size * 0.018))
    glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(radius=radius))

    # 3) 선명한 휠 레이어
    wheel_layer = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    wd = ImageDraw.Draw(wheel_layer)
    draw_wheel_shape(wd, cx, cy, sc, (*wheel_color, 255), (*hub_accent, 255))

    # 4) 합성: 배경 → 글로우 → 휠
    base = Image.alpha_composite(base, glow_layer)
    base = Image.alpha_composite(base, wheel_layer)
    return base


# ── 생성 ─────────────────────────────────────────────────
make_icon(1024).convert('RGB').save(os.path.join(OUT, 'icon.png'))
print('✓ icon.png')

make_icon(1024, sc=0.72, fg_only=True).save(os.path.join(OUT, 'android-icon-foreground.png'))
print('✓ android-icon-foreground.png')

make_bg(1024).save(os.path.join(OUT, 'android-icon-background.png'))
print('✓ android-icon-background.png')

make_icon(1024, sc=0.72, fg_only=True, mono=True).save(os.path.join(OUT, 'android-icon-monochrome.png'))
print('✓ android-icon-monochrome.png')

make_icon(512, sc=0.52).convert('RGB').save(os.path.join(OUT, 'splash-icon.png'))
print('✓ splash-icon.png')

make_icon(64, sc=0.055).convert('RGB').save(os.path.join(OUT, 'favicon.png'))
print('✓ favicon.png')

print('\n✅ 완료!')
