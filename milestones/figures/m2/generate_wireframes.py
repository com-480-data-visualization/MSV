"""
Generate 5 wireframe/sketch images for Milestone 2.
Style: dark background (#0a0a0a), gold (#c9a96e), light gray (#e8e0d4).
Each image ~800x500px at 150 DPI.
"""

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import numpy as np
from matplotlib.patches import FancyBboxPatch

# ── Global style ──────────────────────────────────────────────
BG = "#0a0a0a"
GOLD = "#c9a96e"
GRAY = "#e8e0d4"
FONT_TITLE = {"color": GOLD, "fontsize": 16, "fontweight": "bold", "fontfamily": "serif"}
FONT_LABEL = {"color": GRAY, "fontsize": 10, "fontfamily": "serif"}
FONT_SMALL = {"color": GRAY, "fontsize": 8, "fontfamily": "serif"}
FONT_ANNO = {"color": GOLD, "fontsize": 9, "fontfamily": "serif", "fontstyle": "italic"}
DPI = 150
FIGSIZE = (800 / DPI, 500 / DPI)  # inches at 150 DPI -> 800x500 px

OUT = "/Users/alexandremourot/Desktop/CoursEPFL/MA4/dataviz/com-480-dataviz/milestones/figures/m2/"


def save(fig, name):
    fig.savefig(f"{OUT}{name}", dpi=DPI, bbox_inches="tight",
                facecolor=fig.get_facecolor(), pad_inches=0.15)
    plt.close(fig)
    print(f"  -> saved {name}")


# ═══════════════════════════════════════════════════════════════
# 1. Beeswarm sketch
# ═══════════════════════════════════════════════════════════════
def beeswarm_sketch():
    fig, ax = plt.subplots(figsize=FIGSIZE, facecolor=BG)
    ax.set_facecolor(BG)
    ax.set_xlim(-1, 11)
    ax.set_ylim(-1, 7)
    ax.axis("off")
    ax.set_title("The Building Blocks — Beeswarm Chart", **FONT_TITLE, pad=12)

    families = {
        "Floral":  {"cx": 2.0, "cy": 3.5, "color": "#d4829f", "notes": [
            ("Jasmine", 0.55), ("Rose", 0.48), ("Lily", 0.25), ("Iris", 0.22),
            ("Peony", 0.18), ("Violet", 0.15), ("", 0.12), ("", 0.10)]},
        "Woody":   {"cx": 4.5, "cy": 3.0, "color": "#8b6d4f", "notes": [
            ("Sandalwood", 0.50), ("Cedar", 0.42), ("Vetiver", 0.30),
            ("Patchouli", 0.28), ("", 0.16), ("", 0.13), ("", 0.10)]},
        "Citrus":  {"cx": 7.0, "cy": 4.0, "color": "#d4b84e", "notes": [
            ("Bergamot", 0.52), ("Lemon", 0.35), ("Orange", 0.28),
            ("Grapefruit", 0.20), ("", 0.14), ("", 0.10)]},
        "Spicy":   {"cx": 9.0, "cy": 2.5, "color": "#c4625a", "notes": [
            ("Pepper", 0.35), ("Cinnamon", 0.28), ("Saffron", 0.22),
            ("", 0.16), ("", 0.12), ("", 0.09)]},
        "Fresh":   {"cx": 5.5, "cy": 5.5, "color": "#5d9b8a", "notes": [
            ("Musk", 0.65), ("Mint", 0.25), ("Aqua", 0.20),
            ("", 0.14), ("", 0.11), ("", 0.08)]},
    }

    np.random.seed(42)
    for family, info in families.items():
        cx, cy, col = info["cx"], info["cy"], info["color"]
        for note_name, radius in info["notes"]:
            r = radius * 1.8  # visual scale
            dx = np.random.uniform(-0.8, 0.8)
            dy = np.random.uniform(-0.6, 0.6)
            x, y = cx + dx, cy + dy
            circle = plt.Circle((x, y), r, facecolor=col, edgecolor=GRAY,
                                linewidth=0.5, alpha=0.55)
            ax.add_patch(circle)
            if note_name:
                ax.text(x, y, note_name, ha="center", va="center",
                        fontsize=6.5 if radius > 0.35 else 5.5,
                        color="#f0ebe3", fontfamily="serif")
        # Family label below cluster
        ax.text(cx, cy - 1.5, family, ha="center", **FONT_LABEL)

    save(fig, "beeswarm_sketch.png")


# ═══════════════════════════════════════════════════════════════
# 2. Radar sketch
# ═══════════════════════════════════════════════════════════════
def radar_sketch():
    fig, axes = plt.subplots(1, 2, figsize=FIGSIZE, facecolor=BG,
                              subplot_kw={"projection": "polar"})

    categories = ["Floral", "Woody", "Citrus", "Spicy", "Fresh", "Sweet", "Musky", "Fruity"]
    N = len(categories)
    angles = np.linspace(0, 2 * np.pi, N, endpoint=False).tolist()
    angles += angles[:1]

    women_vals = [0.85, 0.30, 0.50, 0.25, 0.55, 0.70, 0.60, 0.75]
    men_vals =   [0.30, 0.80, 0.55, 0.70, 0.60, 0.35, 0.65, 0.25]
    women_vals += women_vals[:1]
    men_vals += men_vals[:1]

    configs = [
        (axes[0], women_vals, "#d4829f", "Women"),
        (axes[1], men_vals,   "#6a9ec4", "Men"),
    ]

    for ax, vals, color, label in configs:
        ax.set_facecolor(BG)
        ax.set_theta_offset(np.pi / 2)
        ax.set_theta_direction(-1)
        ax.set_xticks(angles[:-1])
        ax.set_xticklabels(categories, color=GRAY, fontsize=7, fontfamily="serif")
        ax.set_ylim(0, 1)
        ax.set_yticks([0.25, 0.5, 0.75])
        ax.set_yticklabels(["", "", ""], color=GRAY, fontsize=6)
        ax.spines["polar"].set_color(GOLD)
        ax.spines["polar"].set_linewidth(0.5)
        ax.tick_params(colors=GRAY)
        ax.grid(color=GOLD, alpha=0.2, linewidth=0.5)

        ax.plot(angles, vals, color=color, linewidth=1.5, alpha=0.8)
        ax.fill(angles, vals, color=color, alpha=0.2)
        ax.set_title(label, color=color, fontsize=13, fontfamily="serif",
                     fontweight="bold", pad=15)

    fig.suptitle("His & Hers — Radar Charts", **FONT_TITLE, y=0.98)
    fig.subplots_adjust(wspace=0.4)
    save(fig, "radar_sketch.png")


# ═══════════════════════════════════════════════════════════════
# 3. Bubble scatter sketch
# ═══════════════════════════════════════════════════════════════
def bubble_sketch():
    fig, ax = plt.subplots(figsize=FIGSIZE, facecolor=BG)
    ax.set_facecolor(BG)
    ax.set_title("The Ratings Game — Bubble Chart", **FONT_TITLE, pad=12)

    np.random.seed(7)
    n = 40
    freqs = np.random.exponential(2000, n) + 200
    ratings = np.random.normal(3.88, 0.08, n)
    sizes = np.random.uniform(30, 250, n)

    ax.scatter(freqs, ratings, s=sizes, c=GOLD, alpha=0.4, edgecolors=GRAY,
               linewidths=0.4)

    # Labeled special notes
    specials = [
        ("Pink Pepper",  450,  4.02, 60),
        ("Tonka Bean",   700,  4.00, 80),
        ("Musk",         9200, 3.82, 400),
        ("Vanilla",      4500, 3.90, 200),
    ]
    for name, x, y, s in specials:
        ax.scatter([x], [y], s=[s], c=GOLD, alpha=0.65, edgecolors=GRAY, linewidths=0.8)
        ax.annotate(name, (x, y), textcoords="offset points",
                    xytext=(8, 8), fontsize=8, color=GRAY, fontfamily="serif",
                    arrowprops=dict(arrowstyle="-", color=GOLD, lw=0.6))

    ax.set_xlabel("Frequency", **FONT_LABEL)
    ax.set_ylabel("Avg. Rating", **FONT_LABEL)
    ax.set_xlim(0, 10500)
    ax.set_ylim(3.70, 4.10)
    ax.tick_params(colors=GRAY, labelsize=8)
    ax.spines["bottom"].set_color(GOLD)
    ax.spines["left"].set_color(GOLD)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.spines["bottom"].set_linewidth(0.5)
    ax.spines["left"].set_linewidth(0.5)

    xticks = [0, 2000, 4000, 6000, 8000, 10000]
    ax.set_xticks(xticks)
    ax.set_xticklabels(["0", "2K", "4K", "6K", "8K", "10K"], fontsize=8, color=GRAY)

    save(fig, "bubble_sketch.png")


# ═══════════════════════════════════════════════════════════════
# 4. Stacked area sketch
# ═══════════════════════════════════════════════════════════════
def stacked_area_sketch():
    fig, ax = plt.subplots(figsize=FIGSIZE, facecolor=BG)
    ax.set_facecolor(BG)
    ax.set_title("Fifty Years of Fragrance — Stacked Area", **FONT_TITLE, pad=12)

    decades = ["1970s", "1980s", "1990s", "2000s", "2010s", "2020s"]
    x = np.arange(len(decades))

    # Percentages per family (stacked, sum to 100)
    floral = [35, 33, 28, 26, 24, 22]
    woody  = [25, 24, 22, 23, 22, 20]
    citrus = [15, 14, 16, 14, 12, 11]
    fresh  = [15, 18, 22, 18, 16, 15]
    sweet  = [10, 11, 12, 19, 26, 32]

    colors = ["#d4829f", "#8b6d4f", "#d4b84e", "#5d9b8a", "#d4a05a"]
    labels = ["Floral", "Woody", "Citrus", "Fresh", "Sweet/Gourmand"]

    stacks = np.array([floral, woody, citrus, fresh, sweet])
    ax.stackplot(x, stacks, colors=colors, alpha=0.6, labels=labels,
                 edgecolor=BG, linewidth=0.5)

    ax.set_xticks(x)
    ax.set_xticklabels(decades, color=GRAY, fontsize=9, fontfamily="serif")
    ax.set_ylim(0, 100)
    ax.set_ylabel("Share (%)", **FONT_LABEL)
    ax.tick_params(colors=GRAY, labelsize=8)
    ax.spines["bottom"].set_color(GOLD)
    ax.spines["left"].set_color(GOLD)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.spines["bottom"].set_linewidth(0.5)
    ax.spines["left"].set_linewidth(0.5)

    legend = ax.legend(loc="upper left", fontsize=7, frameon=False,
                       labelcolor=GRAY)

    save(fig, "stacked_area_sketch.png")


# ═══════════════════════════════════════════════════════════════
# 5. Price strip sketch
# ═══════════════════════════════════════════════════════════════
def price_strip_sketch():
    fig, ax = plt.subplots(figsize=FIGSIZE, facecolor=BG)
    ax.set_facecolor(BG)
    ax.set_title("The Price of Scent — Strip Chart", **FONT_TITLE, pad=12)

    np.random.seed(21)

    # Men prices: clustered 20-80, a few outliers up to 260
    men_core = np.random.normal(46, 18, 80)
    men_outliers = np.random.uniform(150, 260, 6)
    men = np.clip(np.concatenate([men_core, men_outliers]), 3, 300)

    # Women prices: clustered 20-80, a few outliers up to 300
    women_core = np.random.normal(40, 16, 80)
    women_outliers = np.random.uniform(160, 300, 5)
    women = np.clip(np.concatenate([women_core, women_outliers]), 2, 300)

    # Jitter x position
    men_x = np.random.normal(1.0, 0.08, len(men))
    women_x = np.random.normal(2.0, 0.08, len(women))

    ax.scatter(men_x, men, s=18, c=GOLD, alpha=0.5, edgecolors=GRAY, linewidths=0.3)
    ax.scatter(women_x, women, s=18, c="#d4829f", alpha=0.5, edgecolors=GRAY, linewidths=0.3)

    # Mean lines (use fixed values from the dataset)
    men_mean = 46
    women_mean = 40
    ax.hlines(men_mean, 0.7, 1.3, colors=GOLD, linewidths=1.2, linestyles="--", alpha=0.8)
    ax.hlines(women_mean, 1.7, 2.3, colors="#d4829f", linewidths=1.2, linestyles="--", alpha=0.8)
    ax.text(1.35, men_mean + 3, f"mean ${men_mean}", **FONT_ANNO)
    ax.text(2.35, women_mean + 3, f"mean ${women_mean}",
            color="#d4829f", fontsize=9, fontfamily="serif", fontstyle="italic")

    ax.set_xlim(0.4, 2.8)
    ax.set_ylim(-10, 320)
    ax.set_xticks([1.0, 2.0])
    ax.set_xticklabels(["Men", "Women"], color=GRAY, fontsize=11, fontfamily="serif")
    ax.set_ylabel("Price ($)", **FONT_LABEL)
    ax.tick_params(axis="x", colors=GRAY, length=0)
    ax.tick_params(axis="y", colors=GRAY, labelsize=8)
    ax.spines["bottom"].set_color(GOLD)
    ax.spines["left"].set_color(GOLD)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.spines["bottom"].set_linewidth(0.5)
    ax.spines["left"].set_linewidth(0.5)

    save(fig, "price_strip_sketch.png")


# ═══════════════════════════════════════════════════════════════
# Main
# ═══════════════════════════════════════════════════════════════
if __name__ == "__main__":
    print("Generating M2 wireframes...")
    beeswarm_sketch()
    radar_sketch()
    bubble_sketch()
    stacked_area_sketch()
    price_strip_sketch()
    print("Done.")
