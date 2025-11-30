export type CountryWaterFootprint = {
  name: string;          // 国名
  code: string;          // 2文字くらいのコード（任意）
  wfPerCapita: number;   // 1人あたりWF (m3/人/年)
  externalShare: number; // 対外依存度 (%)
};

// Hoekstra らの研究を基にした国別データをまとめた統計表から抽出した値です
export const countryWaterFootprints: CountryWaterFootprint[] = [
  { name: "World average", code: "WORLD", wfPerCapita: 1243, externalShare: 16.1 },
  { name: "China",        code: "CN",    wfPerCapita: 702,  externalShare: 6.6 },
  { name: "Bangladesh",   code: "BD",    wfPerCapita: 896,  externalShare: 3.6 },
  { name: "South Africa", code: "ZA",    wfPerCapita: 931,  externalShare: 21.7 },
  { name: "India",        code: "IN",    wfPerCapita: 980,  externalShare: 1.6 },
  { name: "Egypt",        code: "EG",    wfPerCapita: 1097, externalShare: 18.9 },
  { name: "Japan",        code: "JP",    wfPerCapita: 1153, externalShare: 64.4 },
  { name: "Pakistan",     code: "PK",    wfPerCapita: 1218, externalShare: 5.3 },
  { name: "Netherlands",  code: "NL",    wfPerCapita: 1223, externalShare: 82.0 },
  { name: "United Kingdom", code: "GB",  wfPerCapita: 1245, externalShare: 70.4 },
  { name: "Jordan",       code: "JO",    wfPerCapita: 1303, externalShare: 73.0 },
  { name: "Indonesia",    code: "ID",    wfPerCapita: 1317, externalShare: 10.3 },
  { name: "Brazil",       code: "BR",    wfPerCapita: 1381, externalShare: 7.6 },
  { name: "Australia",    code: "AU",    wfPerCapita: 1393, externalShare: 18.1 },
  { name: "Mexico",       code: "MX",    wfPerCapita: 1441, externalShare: 30.0 },
  { name: "Germany",      code: "DE",    wfPerCapita: 1545, externalShare: 52.9 },
  { name: "Russia",       code: "RU",    wfPerCapita: 1858, externalShare: 15.5 },
  { name: "France",       code: "FR",    wfPerCapita: 1875, externalShare: 37.3 },
  { name: "Canada",       code: "CA",    wfPerCapita: 2049, externalShare: 20.4 },
  { name: "Thailand",     code: "TH",    wfPerCapita: 2223, externalShare: 8.3 },
  { name: "Italy",        code: "IT",    wfPerCapita: 2332, externalShare: 51.0 },
  { name: "United States",code: "US",    wfPerCapita: 2483, externalShare: 18.7 },
];
