#!/usr/bin/env python3
"""Палітра сайту в OKLCH -> HEX і перевірка контрасту за WCAG 2.x.

Запуск: python3 tools/contrast.py
Без залежностей. Значення мають збігатися зі змінними в styles.css.
"""
import math

PALETTE = {
    # назва:      (L,     C,     h)
    "--bg":       (0.948, 0.011, 250),  # перфорована дошка, світла сталь
    "--surface":  (0.988, 0.005, 250),  # бирки, таблички
    "--text":     (0.255, 0.040, 258),  # синя робоча куртка, майже чорнило
    "--muted":    (0.475, 0.030, 255),  # олівець по металу
    "--accent":   (0.750, 0.160, 68),   # свіжа олива на просвіт / домкрат
    "--accent-2": (0.530, 0.150, 258),  # синій робочий комбінезон
}


def oklch_to_srgb(L, C, h):
    a = C * math.cos(math.radians(h))
    b = C * math.sin(math.radians(h))
    l_ = L + 0.3963377774 * a + 0.2158037573 * b
    m_ = L - 0.1055613458 * a - 0.0638541728 * b
    s_ = L - 0.0894841775 * a - 1.2914855480 * b
    l, m, s = l_ ** 3, m_ ** 3, s_ ** 3
    r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
    g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
    bl = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s

    def enc(x):
        x = min(max(x, 0.0), 1.0)
        return 12.92 * x if x <= 0.0031308 else 1.055 * x ** (1 / 2.4) - 0.055

    return tuple(enc(v) for v in (r, g, bl)), all(-1e-4 <= v <= 1 + 1e-4 for v in (r, g, bl))


def hex_of(rgb):
    return "#" + "".join(f"{round(v * 255):02X}" for v in rgb)


def from_hex(hx):
    return tuple(int(hx[i:i + 2], 16) / 255 for i in (1, 3, 5))


def lum(rgb):
    def lin(c):
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = (lin(c) for c in rgb)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def ratio(h1, h2):
    a, b = lum(from_hex(h1)), lum(from_hex(h2))
    return (max(a, b) + 0.05) / (min(a, b) + 0.05)


HEX = {}
print("Палітра (OKLCH -> HEX):")
for name, (L, C, h) in PALETTE.items():
    rgb, in_gamut = oklch_to_srgb(L, C, h)
    HEX[name] = hex_of(rgb)
    print(f"  {name:10s} oklch({L} {C} {h})  {HEX[name]}  {'в гамуті sRGB' if in_gamut else 'ПОЗА ГАМУТОМ'}")

# (текст, фон, де використовується, мінімум)
PAIRS = [
    ("--text", "--bg", "основний текст на фоні", 4.5),
    ("--text", "--surface", "текст на бирках і плашках", 4.5),
    ("--muted", "--bg", "дрібний другорядний текст на фоні", 4.5),
    ("--muted", "--surface", "дрібний другорядний текст на бирках", 4.5),
    ("--text", "--accent", "напис на головній кнопці", 4.5),
    ("--accent-2", "--bg", "посилання, номери, іконки на фоні", 4.5),
    ("--accent-2", "--surface", "номери бирок, посилання на плашках", 4.5),
    ("--surface", "--accent-2", "білий текст на синій плашці", 4.5),
    ("--surface", "--text", "текст у темній смузі (підвал, панель)", 4.5),
    ("--bg", "--text", "текст фону на темній смузі", 4.5),
    ("--accent", "--text", "помаранчевий текст і фокус у темній смузі", 4.5),
]
print("\nКонтраст WCAG 2.x:")
ok_all = True
for fg, bg, where, need in PAIRS:
    r = ratio(HEX[fg], HEX[bg])
    ok = r >= need
    ok_all &= ok
    print(f"  {fg:10s} на {bg:10s} {r:5.2f}:1  потрібно {need}:1  {'OK ' if ok else 'НІ '} — {where}")
print("\nУсі пари проходять." if ok_all else "\nЄ пари, що не проходять!")
