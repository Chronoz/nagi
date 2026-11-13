#!/usr/bin/env python3
"""Generate Nagi apple-touch-startup-image PNGs and the shared SVG mark.
   Paper/sand #F1EADB, one quiet pebble with faint rake rings, no text.
   The mark is centred and sized in CSS pixels so the CSS splash can match.
"""
import math, io, hashlib, json
from pathlib import Path
from PIL import Image, ImageDraw

# App chrome background (#nagi --w-bg), also manifest background_color
PAPER = (0xF1, 0xEA, 0xDB, 255)
PAPER_HEX = '#F1EADB'
# Dark (yūgure) — optional prefers-color-scheme launch images
INK_BG = (0x0F, 0x1D, 0x1E, 255)
INK_BG_HEX = '#0F1D1E'
# Stone + rake, from the garden palette
STONE = (0xD0, 0xC6, 0xB0, 255)       # muted sand stone
STONE_EDGE = (0x7D, 0x89, 0x84, 230)
RING = (0x55, 0x62, 0x5F)             # --contour
# Mark box in CSS pixels (logical). Rings included. Centred on the screen.
MARK_CSS = 96  # pebble ~54, outer ring ~90

# (pixel_w, pixel_h, dpr, device_width_css, device_height_css, name)
# device-width/height in the media query are ALWAYS the portrait CSS sizes.
DEVICES = [
    ('iphone-se',        750, 1334, 2, 375, 667),
    ('iphone-8plus',    1242, 2208, 3, 414, 736),
    ('iphone-x',        1125, 2436, 3, 375, 812),  # X, XS, 11 Pro, 12/13 mini
    ('iphone-xr',        828, 1792, 2, 414, 896),  # XR, 11
    ('iphone-xs-max',   1242, 2688, 3, 414, 896),  # XS Max, 11 Pro Max
    ('iphone-12',       1170, 2532, 3, 390, 844),  # 12/13/14, 12/13 Pro
    ('iphone-12-max',   1284, 2778, 3, 428, 926),  # 12/13/14 Pro Max
    ('iphone-14-pro',   1179, 2556, 3, 393, 852),  # 14 Pro, 15, 15 Pro, 16
    ('iphone-14-max',   1290, 2796, 3, 430, 932),  # 14 Pro Max, 15 Plus/Pro Max, 16 Plus
    ('iphone-16-pro',   1206, 2622, 3, 402, 874),
    ('iphone-16-max',   1320, 2868, 3, 440, 956),
]

def wobble(a, k=1.0):
    return 1 + 0.07*k*math.sin(3*a + 0.55) + 0.045*k*math.cos(5*a + 1.2)

def ring_pts(cx, cy, rx, ry, n=48, k=1.0):
    pts = []
    for i in range(n):
        a = i / n * 2 * math.pi
        w = wobble(a, k)
        pts.append((cx + math.cos(a) * rx * w, cy + math.sin(a) * ry * w * 0.94))
    return pts

def svg_mark(dark=False):
    # viewBox 0 0 96 96, unit = 1 CSS px. Pebble radius ~27, rings at 33, 40, 46.
    fill = '#C8BCA4' if not dark else '#2A4444'
    edge = '#7D8984' if not dark else '#6C8781'
    ring = '#55625F' if not dark else '#B9C5B9'
    rop = '0.22' if not dark else '0.28'
    def d(rx, ry, k=1.0):
        pts = ring_pts(48, 48, rx, ry, 48, k)
        return 'M' + ' L'.join(f'{x:.2f},{y:.2f}' for x,y in pts) + 'Z'
    pebble = d(27, 23.5, 1.0)
    r1, r2, r3 = d(34, 30, 0.85), d(40.5, 36, 0.7), d(46.5, 41.5, 0.55)
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96">'
        f'<path d="{r3}" fill="none" stroke="{ring}" stroke-opacity="{rop}" stroke-width="0.9"/>'
        f'<path d="{r2}" fill="none" stroke="{ring}" stroke-opacity="{rop}" stroke-width="0.9"/>'
        f'<path d="{r1}" fill="none" stroke="{ring}" stroke-opacity="{float(rop)*0.85:.2f}" stroke-width="0.85"/>'
        f'<path d="{pebble}" fill="{fill}" fill-opacity="0.85" stroke="{edge}" stroke-opacity="0.55" stroke-width="1.1"/>'
        f'</svg>'
    )

def draw_mark(im, dpr, dark=False):
    """Paint the mark at the visual centre, MARK_CSS CSS px across."""
    W, H = im.size
    cx, cy = W / 2, H / 2
    scale = dpr
    fill = (0xC8, 0xBC, 0xA4, 217) if not dark else (0x2A, 0x44, 0x44, 217)
    edge = (0x7D, 0x89, 0x84, 140) if not dark else (0x6C, 0x87, 0x81, 160)
    ring = (0x55, 0x62, 0x5F, 56) if not dark else (0xB9, 0xC5, 0xB9, 71)
    # Use a higher-res overlay then paste, for smoother rings
    side = int(MARK_CSS * scale)
    layer = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    dr = ImageDraw.Draw(layer)
    lc = side / 2
    def poly(rx_css, ry_css, k, fill_c, width_css):
        pts = ring_pts(lc, lc, rx_css * scale, ry_css * scale, 72, k)
        w = max(1, round(width_css * scale))
        if fill_c[3] == 0 or fill_c is ring:
            dr.line(pts + [pts[0]], fill=fill_c, width=w, joint='curve')
        else:
            dr.polygon(pts, fill=fill_c, outline=None)
    # rings first (css radii)
    for rx, ry, k, op in ((46.5, 41.5, 0.55, ring), (40.5, 36, 0.7, ring), (34, 30, 0.85, ring)):
        poly(rx, ry, k, op, 0.9)
    # pebble
    pts = ring_pts(lc, lc, 27 * scale, 23.5 * scale, 72, 1.0)
    dr.polygon(pts, fill=fill)
    ew = max(1, round(1.1 * scale))
    dr.line(pts + [pts[0]], fill=edge, width=ew, joint='curve')
    im.paste(layer, (int(cx - side/2), int(cy - side/2)), layer)

def render(w, h, dpr, dark=False):
    bg = INK_BG if dark else PAPER
    im = Image.new('RGBA', (w, h), bg)
    draw_mark(im, dpr, dark=dark)
    # iOS wants opaque RGB PNG
    return im.convert('RGB')

def media(dw, dh, dpr, orientation):
    return (f'(device-width: {dw}px) and (device-height: {dh}px) and '
            f'(-webkit-device-pixel-ratio: {dpr}) and (orientation: {orientation})')

def main(out: Path, shots: Path | None = None):
    out.mkdir(parents=True, exist_ok=True)
    (out / 'splash-mark.svg').write_text(svg_mark(False), encoding='utf-8')
    (out / 'splash-mark-dark.svg').write_text(svg_mark(True), encoding='utf-8')
    catalog = []
    for name, pw, ph, dpr, dw, dh in DEVICES:
        for dark, suffix in ((False, ''), (True, '-dark')):
            # portrait
            fn = f'launch-{pw}x{ph}{suffix}.png'
            im = render(pw, ph, dpr, dark=dark)
            im.save(out / fn, 'PNG', optimize=True)
            catalog.append({
                'file': fn, 'w': pw, 'h': ph, 'dpr': dpr,
                'deviceWidth': dw, 'deviceHeight': dh,
                'orientation': 'portrait', 'dark': dark,
                'media': media(dw, dh, dpr, 'portrait')
                    + (' and (prefers-color-scheme: dark)' if dark else ''),
                'name': name,
            })
            # landscape (pixels swapped; media still uses portrait device-width/height)
            fnl = f'launch-{ph}x{pw}{suffix}.png'
            iml = render(ph, pw, dpr, dark=dark)
            iml.save(out / fnl, 'PNG', optimize=True)
            catalog.append({
                'file': fnl, 'w': ph, 'h': pw, 'dpr': dpr,
                'deviceWidth': dw, 'deviceHeight': dh,
                'orientation': 'landscape', 'dark': dark,
                'media': media(dw, dh, dpr, 'landscape')
                    + (' and (prefers-color-scheme: dark)' if dark else ''),
                'name': name,
            })
    (out / 'launch.json').write_text(json.dumps(catalog, indent=2), encoding='utf-8')
    print('wrote', len(catalog), 'launch images + 2 svg marks to', out)
    if shots:
        shots.mkdir(parents=True, exist_ok=True)
        # contact: iPhone X portrait light, and a few others, plus a crop of the mark
        from PIL import ImageOps, ImageFont
        picks = [
            'launch-1125x2436.png', 'launch-1170x2532.png', 'launch-1179x2556.png',
            'launch-1125x2436-dark.png', 'launch-750x1334.png', 'launch-2436x1125.png',
        ]
        thumbs = []
        for fn in picks:
            p = out / fn
            if not p.exists():
                continue
            im = Image.open(p)
            # scale to height 480 for contact, keep aspect
            h = 480
            w = int(im.width * h / im.height)
            t = im.resize((w, h), Image.Resampling.LANCZOS)
            thumbs.append((fn, t))
        if thumbs:
            gap, pad, label = 16, 24, 28
            tw = sum(t.width for _, t in thumbs) + gap*(len(thumbs)-1) + pad*2
            th = 480 + pad*2 + label
            sheet = Image.new('RGB', (tw, th), (40, 40, 38))
            x = pad
            dr = ImageDraw.Draw(sheet)
            for fn, t in thumbs:
                sheet.paste(t, (x, pad + label))
                # thin paper border
                dr.rectangle([x-1, pad+label-1, x+t.width, pad+label+t.height], outline=(200, 196, 180))
                dr.text((x, 8), fn.replace('launch-','').replace('.png',''), fill=(220, 214, 200))
                x += t.width + gap
            sheet.save(shots / 'launch-contact.jpg', 'JPEG', quality=90)
        # close-up of the mark on iPhone X canvas
        x = Image.open(out / 'launch-1125x2436.png')
        cx, cy = x.width//2, x.height//2
        crop = x.crop((cx-240, cy-240, cx+240, cy+240))
        crop = crop.resize((480, 480), Image.Resampling.LANCZOS)
        crop.save(shots / 'launch-mark-closeup.png')
        x.resize((375, 812), Image.Resampling.LANCZOS).save(shots / 'launch-iphone-x.png')
        Image.open(out / 'launch-1125x2436-dark.png').resize((375, 812), Image.Resampling.LANCZOS).save(shots / 'launch-iphone-x-dark.png')
        print('shots written')

if __name__ == '__main__':
    import sys
    dest = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('/workspace/nagi-repo/theme/launch')
    shots = Path(sys.argv[2]) if len(sys.argv) > 2 else Path('/workspace/nagi-v4-shots')
    main(dest, shots)
