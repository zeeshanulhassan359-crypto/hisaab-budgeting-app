export interface ExtractedItem {
  name: string;
  price: number;
  category: string;
}

export interface ReceiptPreset {
  id: string;
  merchant: string;
  date: string;
  total: number;
  items: ExtractedItem[];
}

export function mapItemToCategory(name: string): string {
  const n = name.toLowerCase();

  // Food keywords
  if (
    n.includes("milk") ||
    n.includes("bread") ||
    n.includes("water") ||
    n.includes("juice") ||
    n.includes("soda") ||
    n.includes("coke") ||
    n.includes("pepsi") ||
    n.includes("pizza") ||
    n.includes("burger") ||
    n.includes("pasta") ||
    n.includes("cheese") ||
    n.includes("apple") ||
    n.includes("banana") ||
    n.includes("orange") ||
    n.includes("tomato") ||
    n.includes("potato") ||
    n.includes("onion") ||
    n.includes("grocery") ||
    n.includes("market") ||
    n.includes("supermarket") ||
    n.includes("panda") ||
    n.includes("lulu") ||
    n.includes("carrefour") ||
    n.includes("danube") ||
    n.includes("rest") ||
    n.includes("restaurant") ||
    n.includes("cafe") ||
    n.includes("coffee") ||
    n.includes("tea") ||
    n.includes("dinner") ||
    n.includes("lunch") ||
    n.includes("breakfast") ||
    n.includes("snack") ||
    n.includes("biscuit") ||
    n.includes("chocolate") ||
    n.includes("ice cream") ||
    n.includes("gelato") ||
    n.includes("rice") ||
    n.includes("oil") ||
    n.includes("egg") ||
    n.includes("chicken") ||
    n.includes("meat") ||
    n.includes("beef") ||
    n.includes("fish") ||
    n.includes("cereal") ||
    n.includes("butter") ||
    n.includes("yogurt") ||
    n.includes("salt") ||
    n.includes("sugar") ||
    n.includes("sauce")
  ) {
    return "Food";
  }

  // Transport keywords
  if (
    n.includes("uber") ||
    n.includes("careem") ||
    n.includes("taxi") ||
    n.includes("gas") ||
    n.includes("fuel") ||
    n.includes("petrol") ||
    n.includes("diesel") ||
    n.includes("parking") ||
    n.includes("metro") ||
    n.includes("train") ||
    n.includes("bus") ||
    n.includes("flight") ||
    n.includes("airline") ||
    n.includes("car wash") ||
    n.includes("toll") ||
    n.includes("road")
  ) {
    return "Transport";
  }

  // Rent & Bills keywords
  if (
    n.includes("rent") ||
    n.includes("electricity") ||
    n.includes("water bill") ||
    n.includes("sewer") ||
    n.includes("wifi") ||
    n.includes("internet") ||
    n.includes("broadband") ||
    n.includes("telecom") ||
    n.includes("stc") ||
    n.includes("mobily") ||
    n.includes("zain") ||
    n.includes("bill") ||
    n.includes("invoice") ||
    n.includes("subscription") ||
    n.includes("netflix") ||
    n.includes("spotify") ||
    n.includes("disney") ||
    n.includes("prime video") ||
    n.includes("insurance")
  ) {
    return "Rent & Bills";
  }

  // Investments keywords
  if (
    n.includes("stock") ||
    n.includes("share") ||
    n.includes("crypto") ||
    n.includes("bitcoin") ||
    n.includes("ethereum") ||
    n.includes("binance") ||
    n.includes("gold") ||
    n.includes("silver") ||
    n.includes("invest") ||
    n.includes("deposit") ||
    n.includes("savings") ||
    n.includes("mutual fund") ||
    n.includes("etf")
  ) {
    return "Investments";
  }

  // Entertainment keywords
  if (
    n.includes("movie") ||
    n.includes("cinema") ||
    n.includes("theater") ||
    n.includes("ticket") ||
    n.includes("game") ||
    n.includes("steam") ||
    n.includes("playstation") ||
    n.includes("xbox") ||
    n.includes("nintendo") ||
    n.includes("arcade") ||
    n.includes("concert") ||
    n.includes("museum") ||
    n.includes("amusement") ||
    n.includes("park") ||
    n.includes("bowling")
  ) {
    return "Entertainment";
  }

  // Gift keywords
  if (
    n.includes("gift") ||
    n.includes("present") ||
    n.includes("birthday") ||
    n.includes("wedding") ||
    n.includes("anniversary") ||
    n.includes("donation") ||
    n.includes("charity")
  ) {
    return "Gift";
  }

  // Shopping keywords
  if (
    n.includes("shirt") ||
    n.includes("pant") ||
    n.includes("shoe") ||
    n.includes("dress") ||
    n.includes("jeans") ||
    n.includes("jacket") ||
    n.includes("t-shirt") ||
    n.includes("clothing") ||
    n.includes("zara") ||
    n.includes("h&m") ||
    n.includes("nike") ||
    n.includes("adidas") ||
    n.includes("laptop") ||
    n.includes("phone") ||
    n.includes("mouse") ||
    n.includes("keyboard") ||
    n.includes("charger") ||
    n.includes("electronics") ||
    n.includes("jarir") ||
    n.includes("book") ||
    n.includes("pen") ||
    n.includes("pencil") ||
    n.includes("notebook") ||
    n.includes("stationery") ||
    n.includes("makeup") ||
    n.includes("perfume") ||
    n.includes("bag") ||
    n.includes("backpack") ||
    n.includes("furniture") ||
    n.includes("amazon") ||
    n.includes("noon") ||
    n.includes("shampoo") ||
    n.includes("soap") ||
    n.includes("toothpaste") ||
    n.includes("detergent")
  ) {
    return "Shopping";
  }

  return "Others";
}

export function parseReceiptText(text: string): ExtractedItem[] {
  const lines = text.split("\n");
  const items: ExtractedItem[] = [];

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    // Skip headers/footers/total lines
    const upperLine = line.toUpperCase();
    if (
      upperLine.includes("TOTAL") ||
      upperLine.includes("SUBTOTAL") ||
      upperLine.includes("TAX") ||
      upperLine.includes("VAT") ||
      upperLine.includes("CASH") ||
      upperLine.includes("CHANGE") ||
      upperLine.includes("BALANCE") ||
      upperLine.includes("INVOICE") ||
      upperLine.includes("RECEIPT") ||
      upperLine.includes("WELCOME") ||
      upperLine.includes("THANK YOU") ||
      upperLine.includes("TEL:") ||
      upperLine.includes("DATE:") ||
      upperLine.includes("TIME:") ||
      /^\d{2,4}[-/.]\d{2}[-/.]\d{2,4}/.test(line)
    ) {
      continue;
    }

    // Heuristically find a price at the end or start
    const priceAtEnd = line.match(/(?:SAR|SR|S\.R\.|\$)?\s*(\d+(?:\.\d{1,2})?)\s*(?:SAR|SR|S\.R\.|\$)?\s*$/i);
    if (priceAtEnd) {
      const priceVal = parseFloat(priceAtEnd[1]);
      if (priceVal > 0) {
        let itemName = line.substring(0, line.lastIndexOf(priceAtEnd[0])).trim();
        itemName = itemName.replace(/[\s-.:]+$/, "").trim();
        itemName = itemName.replace(/^\d+[\s*x]+\s*/i, "").trim();

        if (itemName && itemName.length > 1) {
          items.push({
            name: itemName,
            price: priceVal,
            category: mapItemToCategory(itemName),
          });
          continue;
        }
      }
    }

    const priceAtStart = line.match(/^\s*(?:SAR|SR|S\.R\.|\$)?\s*(\d+(?:\.\d{1,2})?)\s+(.+)$/i);
    if (priceAtStart) {
      const priceVal = parseFloat(priceAtStart[1]);
      let itemName = priceAtStart[2].trim();
      itemName = itemName.replace(/^[\s-.:]+/, "").trim();
      if (priceVal > 0 && itemName && itemName.length > 1) {
        items.push({
          name: itemName,
          price: priceVal,
          category: mapItemToCategory(itemName),
        });
      }
    }
  }

  return items;
}

export const RECEIPT_PRESETS: ReceiptPreset[] = [
  {
    id: "preset_panda",
    merchant: "Panda Supermarket",
    date: new Date().toISOString().split("T")[0],
    total: 46.00,
    items: [
      { name: "Fresh Milk 1L", price: 6.50, category: "Food" },
      { name: "Organic Red Apples 1kg", price: 12.00, category: "Food" },
      { name: "Pantene Shampoo 400ml", price: 24.00, category: "Shopping" },
      { name: "Diet Cola Can", price: 3.50, category: "Food" }
    ]
  },
  {
    id: "preset_jarir",
    merchant: "Jarir Bookstore",
    date: new Date().toISOString().split("T")[0],
    total: 180.00,
    items: [
      { name: "Logitech Wireless Mouse M330", price: 120.00, category: "Shopping" },
      { name: "Moleskine A5 Notebook", price: 15.00, category: "Shopping" },
      { name: "Anker USB-C to Lightning Cable", price: 45.00, category: "Shopping" }
    ]
  },
  {
    id: "preset_piatto",
    merchant: "Piatto Italian Restaurant",
    date: new Date().toISOString().split("T")[0],
    total: 147.00,
    items: [
      { name: "Margherita Pizza", price: 55.00, category: "Food" },
      { name: "Fettuccine Alfredo", price: 45.00, category: "Food" },
      { name: "Chocolate Gelato Dessert", price: 20.00, category: "Food" },
      { name: "Perrier Sparkling Water x2", price: 12.00, category: "Food" },
      { name: "Restaurant Service Charge", price: 15.00, category: "Others" }
    ]
  }
];
