import type { Cat, Product, Variant } from "../types";
import { P } from "../photos";

/** the product whose first variant is the example on the overview and the price check */
export const TRAP_PRODUCT = "p_mug";

type Spec = { key: string; title: string; cat: Cat; col: string; v: [string, number][] };

// USD prices as a buyer sees them; the 1.0 database stores them in cents
const SPEC: Spec[] = [
  { key: "mug", title: "Hand-pinched cream mug", cat: "ceramics", col: "Everyday table", v: [["Single", 25], ["Set of 2", 48], ["Set of 4", 92]] },
  { key: "tumbler", title: "Speckled stoneware tumbler", cat: "ceramics", col: "Everyday table", v: [["Sage", 22], ["Set of 4, Sage", 80]] },
  { key: "goldmug", title: "Porcelain mug, gold handle", cat: "ceramics", col: "Slow mornings", v: [["Single", 28]] },
  { key: "bowl", title: "Matte cream bowl", cat: "ceramics", col: "Everyday table", v: [["Single", 18], ["Set of 4", 66]] },
  { key: "leafbowl", title: "Hand-painted leaf bowl", cat: "ceramics", col: "Everyday table", v: [["Single", 32]] },
  { key: "plate", title: "Speckled dinner plate", cat: "ceramics", col: "Everyday table", v: [["Single", 22], ["Set of 4", 82]] },
  { key: "sideplate", title: "Brushstroke side plate", cat: "ceramics", col: "Hosting", v: [["Single", 19], ["Set of 4", 70]] },
  { key: "teapot", title: "Magnolia porcelain teapot", cat: "ceramics", col: "Slow mornings", v: [["800 ml", 58]] },
  { key: "vase", title: "Ring vase in sand", cat: "ceramics", col: "Small things", v: [["Small", 34], ["Large", 46]] },
  { key: "dripper", title: "Ceramic pour-over dripper", cat: "coffee", col: "Slow mornings", v: [["White", 29], ["With glass server", 44]] },
  { key: "glassdrip", title: "Glass pour-over set", cat: "coffee", col: "Slow mornings", v: [["600 ml", 38]] },
  { key: "blackdrip", title: "Black dripper and etched server", cat: "coffee", col: "Slow mornings", v: [["One size", 52]] },
  { key: "kettle", title: "Gooseneck kettle, wood handle", cat: "coffee", col: "Slow mornings", v: [["Matte black", 74]] },
  { key: "stovetop", title: "Stovetop kettle", cat: "coffee", col: "Kitchen", v: [["2 litres", 46]] },
  { key: "press", title: "Glass french press", cat: "coffee", col: "Slow mornings", v: [["600 ml", 39], ["1 litre", 47]] },
  { key: "ironpot", title: "Cast iron teapot", cat: "coffee", col: "Slow mornings", v: [["Black", 62]] },
  { key: "teaset", title: "Blue lotus tea set", cat: "coffee", col: "Hosting", v: [["Teapot and 5 cups", 88]] },
  { key: "beans", title: "Whole bean coffee jar", cat: "coffee", col: "Pantry", v: [["250 g", 16], ["500 g", 29]] },
  { key: "napkins", title: "Linen napkins, set of 6", cat: "linen", col: "Hosting", v: [["Taupe", 42], ["Rust", 42], ["Sage", 42]] },
  { key: "napkinmix", title: "Linen napkins, mixed set of 4", cat: "linen", col: "Hosting", v: [["Soft colours", 34]] },
  { key: "towel", title: "Striped cotton tea towel", cat: "linen", col: "Kitchen", v: [["Blue stripe", 12], ["Pack of 3", 32]] },
  { key: "towels", title: "Linen tea towels, pair", cat: "linen", col: "Kitchen", v: [["Olive stripe", 24]] },
  { key: "apron", title: "Cross-back canvas apron", cat: "linen", col: "Kitchen", v: [["Light grey", 38], ["Brown", 38]] },
  { key: "apronbrown", title: "Work apron with pocket", cat: "linen", col: "Kitchen", v: [["Brown", 34]] },
  { key: "throw", title: "Knitted throw", cat: "linen", col: "Living room", v: [["Cream", 86], ["Teal", 86], ["Grey", 86]] },
  { key: "chunky", title: "Chunky knit throw", cat: "linen", col: "Living room", v: [["Rust", 112]] },
  { key: "cushion", title: "Striped cushion", cat: "linen", col: "Living room", v: [["45 x 45 cm", 34], ["50 x 50 cm", 38]] },
  { key: "paddle", title: "Oak paddle board", cat: "wood", col: "Kitchen", v: [["Medium", 48], ["Large", 64]] },
  { key: "carving", title: "Maple carving board", cat: "wood", col: "Kitchen", v: [["One size", 72]] },
  { key: "roundboard", title: "Round acacia board", cat: "wood", col: "Hosting", v: [["30 cm", 36]] },
  { key: "utensils", title: "Wooden utensils with crock", cat: "wood", col: "Kitchen", v: [["Set of 5", 44]] },
  { key: "spoon", title: "Hand-carved wooden spoon", cat: "wood", col: "Kitchen", v: [["One size", 18]] },
  { key: "skillet", title: "Cast iron skillet", cat: "wood", col: "Kitchen", v: [["20 cm", 42], ["26 cm", 56]] },
  { key: "knife", title: "Damascus chef's knife, 20 cm", cat: "wood", col: "Kitchen", v: [["Black handle", 128]] },
  { key: "trays", title: "Acacia serving trays, pair", cat: "wood", col: "Hosting", v: [["Long", 54]] },
  { key: "tray", title: "Wooden tray with handles", cat: "wood", col: "Hosting", v: [["Medium", 48], ["Large", 62]] },
  { key: "pillars", title: "Pillar candles, set of 3", cat: "home", col: "Small things", v: [["Unscented", 30], ["Cedar", 34]] },
  { key: "pillar", title: "Ivory pillar candle", cat: "home", col: "Small things", v: [["Small", 14], ["Large", 22]] },
  { key: "votive", title: "Glass votive candle", cat: "home", col: "Small things", v: [["Fig", 18], ["Linen", 18]] },
  { key: "baskets", title: "Woven storage baskets", cat: "home", col: "Living room", v: [["Set of 3", 68]] },
  { key: "pitcher", title: "Pressed glass pitcher", cat: "home", col: "Hosting", v: [["1.2 litres", 36]] },
  { key: "carafe", title: "Ribbed glass carafe", cat: "home", col: "Hosting", v: [["With 2 glasses", 42]] },
  { key: "glasses", title: "Faceted glass tumblers", cat: "home", col: "Hosting", v: [["Set of 4", 36], ["Set of 6", 50]] },
  { key: "planter", title: "Ceramic planter with saucer", cat: "home", col: "Living room", v: [["White", 26], ["Black", 26]] },
  { key: "pot", title: "Concrete plant pot", cat: "home", col: "Living room", v: [["Small", 22], ["Medium", 32]] },
];

/** euros from the dollar price, rounded the way the store rounds its shelf prices */
const eur = (usd: number) => Math.round(usd * 0.93 * 2) / 2 - (usd >= 40 ? 0.1 : 0);
/** dong from the dollar price, to the nearest thousand */
const vnd = (usd: number) => Math.round((usd * 25400) / 1000) * 1000;

export function buildCatalog(): Product[] {
  return SPEC.filter((sp) => P[sp.key]).map((sp, i) => {
    const id = `p_${sp.key}`;
    const variants: Variant[] = sp.v.map(([title, usd], j) => ({
      id: `${id}_${title.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")}`,
      sku: `HG-${String(100 + i).padStart(3, "0")}-${j + 1}`,
      title,
      v1: { usd: Math.round(usd * 100), eur: Math.round(eur(usd) * 100), vnd: vnd(usd) },
      stock: 6 + ((i * 7 + j * 13) % 40),
    }));
    return { id, handle: sp.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""), title: sp.title, cat: sp.cat, photo: P[sp.key], collection: sp.col, variants };
  });
}
