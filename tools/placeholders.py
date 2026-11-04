#!/usr/bin/env python3
"""Генерує SVG-заглушки для фото в кольорах палітри.

Запуск: python3 tools/placeholders.py
Список кадрів той самий, що в PHOTOS.md. Після зйомки заглушки можна видалити.
"""
from pathlib import Path
from xml.sax.saxutils import escape

OUT = Path(__file__).resolve().parent.parent / "assets" / "placeholders"

BG, LINE, TEXT, MUTED, ACC2, SURFACE = "#E8EFF5", "#162336", "#162336", "#515D6D", "#2D6AC1", "#F9FBFE"

SHOTS = [
    # файл, ширина, висота, рядки заголовка, технічний рядок, де на сайті
    ("work-show", 1200, 800, ["Майстер показує клієнтці", "зняту деталь"],
     "Горизонтальне 3:2 · бокс, авто на підйомнику, денне світло з воріт", "«Як ми працюємо»"),
    ("old-parts", 1000, 1000, ["Старі деталі в коробці", "поруч із новими"],
     "Квадрат 1:1 · на капоті, зверху або під 45°", "«Гарантія»"),
    ("master-petro", 800, 1000, ["Петро", "біля підйомника"],
     "Вертикальне 4:5 · по пояс, синя куртка", "«Майстри»"),
    ("master-andrii", 800, 1000, ["Андрій зі сканером", "біля капота"],
     "Вертикальне 4:5 · по пояс, ноутбук у руках", "«Майстри»"),
    ("master-oksana", 800, 1000, ["Оксана за стійкою", "приймання"],
     "Вертикальне 4:5 · телефон і бланк кошторису", "«Майстри»"),
    ("waiting-room", 1200, 900, ["Кімната очікування", "з вікном у бокс"],
     "Горизонтальне 4:3 · у вікні видно авто на підйомнику", "«Часті питання»"),
    ("gate", 1200, 800, ["Синя брама з цифрою 10", "і вивіска над в’їздом"],
     "Горизонтальне 3:2 · з вулиці, вдень, видно куди заїжджати", "«Контакти»"),
]


def svg(name, w, h, title, tech, where):
    s = min(w, h)
    t1 = round(s * 0.075)        # заголовок
    t2 = round(s * 0.042)        # технічний рядок
    pad = round(s * 0.06)
    corner = round(s * 0.09)
    cx, cy = w / 2, h / 2
    # іконка фотоапарата
    cam_w, cam_h = s * 0.16, s * 0.11
    cam_y = cy - s * 0.25
    lines = []
    y0 = cy - (len(title) - 1) * t1 * 0.6
    for i, line in enumerate(title):
        lines.append(f'<text x="{cx}" y="{y0 + i * t1 * 1.2:.0f}" font-size="{t1}" font-weight="700" fill="{TEXT}" text-anchor="middle">{escape(line)}</text>')
    ty = y0 + len(title) * t1 * 1.2 + t2 * 0.6
    # технічний рядок може не влізти у вузьке фото: ділимо по « · »
    tech_parts = tech.split(" · ")
    tech_lines = [tech] if len(tech) * t2 * 0.52 < w - 2 * pad else [tech_parts[0], " · ".join(tech_parts[1:])]
    for i, line in enumerate(tech_lines):
        lines.append(f'<text x="{cx}" y="{ty + i * t2 * 1.4:.0f}" font-size="{t2}" fill="{MUTED}" text-anchor="middle">{escape(line)}</text>')
    c = corner
    p = pad
    corners = (
        f'M{p} {p + c}V{p}H{p + c} M{w - p - c} {p}H{w - p}V{p + c} '
        f'M{w - p} {h - p - c}V{h - p}H{w - p - c} M{p + c} {h - p}H{p}V{h - p - c}'
    )
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">
  <defs>
    <pattern id="hatch" width="28" height="28" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="28" height="28" fill="{BG}"/>
      <rect width="2" height="28" fill="{LINE}" fill-opacity="0.07"/>
    </pattern>
  </defs>
  <rect width="{w}" height="{h}" fill="url(#hatch)"/>
  <path d="{corners}" fill="none" stroke="{ACC2}" stroke-width="{max(4, round(s * 0.008))}" stroke-linecap="round"/>
  <g transform="translate({cx - cam_w / 2:.0f} {cam_y - cam_h / 2:.0f})" fill="none" stroke="{MUTED}" stroke-width="{max(3, round(s * 0.006))}" stroke-linejoin="round">
    <rect x="0" y="{cam_h * 0.18:.0f}" width="{cam_w:.0f}" height="{cam_h * 0.82:.0f}" rx="{cam_h * 0.12:.0f}"/>
    <path d="M{cam_w * 0.3:.0f} {cam_h * 0.18:.0f}l{cam_w * 0.08:.0f} {-cam_h * 0.18:.0f}h{cam_w * 0.24:.0f}l{cam_w * 0.08:.0f} {cam_h * 0.18:.0f}"/>
    <circle cx="{cam_w / 2:.0f}" cy="{cam_h * 0.6:.0f}" r="{cam_h * 0.26:.0f}"/>
  </g>
  <g font-family="Arsenal, 'Segoe UI', Arial, sans-serif">
    {chr(10).join('    ' + l for l in lines).strip()}
    <text x="{cx}" y="{h - p - t2 * 2.2:.0f}" font-size="{t2}" fill="{ACC2}" text-anchor="middle" font-weight="700">assets/photos/{name}.webp</text>
    <text x="{cx}" y="{h - p - t2 * 0.8:.0f}" font-size="{t2}" fill="{ACC2}" text-anchor="middle">{w}×{h} · {escape(where)}</text>
  </g>
</svg>
'''


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    for name, w, h, title, tech, where in SHOTS:
        (OUT / f"{name}.svg").write_text(svg(name, w, h, title, tech, where), encoding="utf-8")
        print("ok", name)
