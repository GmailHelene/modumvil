"""Tegner equity-kurven (utviklingen av kapitalen) som en SVG-fil.

Bruker ingen eksterne biblioteker — bare ren Python som skriver SVG. Filen kan
åpnes i en nettleser eller legges inn i en nettside. Grønn linje = strategien,
grå stiplet = kjøp-og-hold til sammenligning.
"""

from __future__ import annotations


def _points(values: list[float], x0: float, y0: float, w: float, h: float,
            vmin: float, vmax: float) -> str:
    n = len(values)
    span = (vmax - vmin) or 1
    pts = []
    for i, v in enumerate(values):
        x = x0 + (w * i / max(n - 1, 1))
        y = y0 + h - (h * (v - vmin) / span)   # y er invertert i SVG
        pts.append(f"{x:.1f},{y:.1f}")
    return " ".join(pts)


def equity_svg(equity_curve: list[float], buyhold_curve: list[float] | None = None,
               title: str = "Equity-kurve") -> str:
    """Returner en komplett SVG som streng."""
    W, H = 820, 420
    m = 60                                     # marg
    plot_w, plot_h = W - 2 * m, H - 2 * m

    all_vals = list(equity_curve) + (list(buyhold_curve) if buyhold_curve else [])
    vmin, vmax = min(all_vals), max(all_vals)
    pad = (vmax - vmin) * 0.08 or 1
    vmin, vmax = vmin - pad, vmax + pad

    strat_pts = _points(equity_curve, m, m, plot_w, plot_h, vmin, vmax)
    start, end = equity_curve[0], equity_curve[-1]
    ret = (end - start) / start * 100
    color = "#16a34a" if end >= start else "#dc2626"

    # Y-akse-etiketter (5 nivåer)
    ylabels = ""
    for k in range(5):
        val = vmin + (vmax - vmin) * k / 4
        y = m + plot_h - (plot_h * k / 4)
        ylabels += (
            f'<line x1="{m}" y1="{y:.1f}" x2="{m + plot_w}" y2="{y:.1f}" '
            f'stroke="#e5e7eb" stroke-width="1"/>'
            f'<text x="{m - 8}" y="{y + 4:.1f}" text-anchor="end" '
            f'font-size="11" fill="#6b7280">{val:,.0f}</text>'
        )

    bh_line = ""
    if buyhold_curve:
        bh_pts = _points(buyhold_curve, m, m, plot_w, plot_h, vmin, vmax)
        bh_line = (f'<polyline points="{bh_pts}" fill="none" stroke="#9ca3af" '
                   f'stroke-width="1.5" stroke-dasharray="5,4"/>')

    legend = (
        f'<rect x="{m}" y="{m - 34}" width="14" height="3" fill="{color}"/>'
        f'<text x="{m + 20}" y="{m - 30}" font-size="12" fill="#374151">Strategi</text>'
    )
    if buyhold_curve:
        legend += (
            f'<rect x="{m + 100}" y="{m - 34}" width="14" height="3" fill="#9ca3af"/>'
            f'<text x="{m + 120}" y="{m - 30}" font-size="12" fill="#374151">Kjøp-og-hold</text>'
        )

    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">
  <rect width="{W}" height="{H}" fill="#ffffff"/>
  <text x="{m}" y="30" font-size="16" font-weight="bold" fill="#111827">{title}</text>
  <text x="{W - m}" y="30" text-anchor="end" font-size="14" fill="{color}">{ret:+.2f} %</text>
  {ylabels}
  {bh_line}
  <polyline points="{strat_pts}" fill="none" stroke="{color}" stroke-width="2.5"/>
  {legend}
  <text x="{m}" y="{H - 20}" font-size="11" fill="#6b7280">Start: {start:,.0f}</text>
  <text x="{W - m}" y="{H - 20}" text-anchor="end" font-size="11" fill="#6b7280">Slutt: {end:,.0f}</text>
</svg>'''


def save_equity_svg(path: str, equity_curve: list[float],
                    buyhold_curve: list[float] | None = None,
                    title: str = "Equity-kurve") -> None:
    with open(path, "w", encoding="utf-8") as f:
        f.write(equity_svg(equity_curve, buyhold_curve, title))
