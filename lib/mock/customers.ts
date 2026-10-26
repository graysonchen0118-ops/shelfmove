import type { Currency, Customer } from "../types";
import { seeded } from "../rand";
import { FACES } from "../photos";

const PEOPLE: [string, string, Currency][] = [
  ["Nguyễn Thị Lan", "VN", "vnd"],
  ["Trần Minh Quân", "VN", "vnd"],
  ["Emily Carter", "US", "usd"],
  ["Lena Hoffmann", "DE", "eur"],
  ["Lê Hoàng Anh", "VN", "vnd"],
  ["Jason Reed", "US", "usd"],
  ["Camille Laurent", "FR", "eur"],
  ["Phạm Thu Hà", "VN", "vnd"],
  ["Wei Ling Tan", "SG", "usd"],
  ["Sofia Ramírez", "MX", "usd"],
  ["Võ Thanh Tùng", "VN", "vnd"],
  ["Aiko Tanaka", "JP", "usd"],
  ["Jonas Weber", "DE", "eur"],
  ["Hannah Brooks", "US", "usd"],
  ["Đặng Mai Linh", "VN", "vnd"],
  ["Lucas Moreau", "FR", "eur"],
  ["Olivia Bennett", "AU", "usd"],
  ["Bùi Quốc Bảo", "VN", "vnd"],
  ["Marco Rossi", "IT", "eur"],
  ["Grace Kim", "US", "usd"],
  ["Hoàng Ngọc Hân", "VN", "vnd"],
  ["Daniel Novak", "CZ", "eur"],
  ["Chloe Martin", "CA", "usd"],
  ["Đỗ Văn Khoa", "VN", "vnd"],
  ["Isabel Fernández", "ES", "eur"],
  ["Ethan Walker", "US", "usd"],
  ["Ngô Bích Ngọc", "VN", "vnd"],
  ["Anna Lindqvist", "SE", "eur"],
  ["Ryan O'Connor", "IE", "eur"],
  ["Mia Thompson", "US", "usd"],
  ["Huỳnh Gia Huy", "VN", "vnd"],
  ["Sarah Nguyen", "US", "usd"],
  ["Tom de Vries", "NL", "eur"],
  ["Priya Raman", "SG", "usd"],
  ["Lý Thanh Hương", "VN", "vnd"],
  ["Noah Fischer", "AT", "eur"],
  ["Ava Mitchell", "US", "usd"],
  ["Trịnh Đức Minh", "VN", "vnd"],
  ["Elise Dubois", "BE", "eur"],
  ["Kenji Watanabe", "JP", "usd"],
  ["Phan Thị Thảo", "VN", "vnd"],
  ["Julia Schmidt", "DE", "eur"],
  ["Benjamin Hall", "US", "usd"],
  ["Mai Anh Vũ", "VN", "vnd"],
  ["Lucía Torres", "ES", "eur"],
  ["James Wright", "GB", "usd"],
  ["Cao Thị Yến", "VN", "vnd"],
  ["Matteo Bianchi", "IT", "eur"],
  ["Zoe Adams", "AU", "usd"],
  ["Lâm Quang Vinh", "VN", "vnd"],
  ["Clara Becker", "DE", "eur"],
  ["Henry Lee", "US", "usd"],
  ["Tạ Thu Trang", "VN", "vnd"],
  ["Inès Petit", "FR", "eur"],
  ["Samuel Ortiz", "US", "usd"],
  ["Đinh Hải Yến", "VN", "vnd"],
  ["Freya Hansen", "DK", "eur"],
  ["Lily Chen", "US", "usd"],
  ["Vương Minh Châu", "VN", "vnd"],
  ["Paul Lambert", "FR", "eur"],
  ["Nora Jensen", "NO", "eur"],
  ["David Park", "US", "usd"],
  ["Kiều Phương Thảo", "VN", "vnd"],
  ["Elena Popescu", "RO", "eur"],
];

const plain = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/'/g, "")
    .toLowerCase();

const DOMAINS = ["gmail.com", "outlook.com", "yahoo.com", "icloud.com", "proton.me"];

export function buildCustomers(): Customer[] {
  const r = seeded(7);
  return PEOPLE.map(([name, country, currency], i) => {
    const parts = plain(name).split(" ");
    const handle = country === "VN" ? `${parts[parts.length - 1]}.${parts[0]}` : `${parts[0]}.${parts[parts.length - 1]}`;
    const guest = i % 4 === 3;
    const year = 2023 + Math.floor(r() * 3);
    const month = 1 + Math.floor(r() * 12);
    const photo = !guest ? FACES[name] : undefined;
    return {
      id: `cus_${(1000 + i * 37).toString(36)}${i}`,
      name,
      email: `${handle}${r() < 0.3 ? Math.floor(r() * 90 + 10) : ""}@${DOMAINS[Math.floor(r() * DOMAINS.length)]}`,
      country,
      currency,
      account: guest ? "guest" : "login",
      login: guest ? "none" : i % 9 === 1 ? "verified" : "carried",
      weakHash: !guest,
      since: `${year}-${String(month).padStart(2, "0")}`,
      photo,
    };
  });
}

export const COUNTRY: Record<string, string> = {
  VN: "Vietnam",
  US: "United States",
  DE: "Germany",
  FR: "France",
  SG: "Singapore",
  MX: "Mexico",
  JP: "Japan",
  AU: "Australia",
  IT: "Italy",
  CZ: "Czechia",
  CA: "Canada",
  ES: "Spain",
  SE: "Sweden",
  IE: "Ireland",
  NL: "Netherlands",
  AT: "Austria",
  BE: "Belgium",
  GB: "United Kingdom",
  DK: "Denmark",
  NO: "Norway",
  RO: "Romania",
};
