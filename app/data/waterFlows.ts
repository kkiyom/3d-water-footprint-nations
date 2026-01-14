// app/data/waterFlows.ts
// Source: MDPI Water (2024) Table 2
// NOTE: ISO2 country codes are used to match sphere dataset.

export type VWRow2016 = {
  code: string;        // ISO2
  export_m3: number;
  import_m3: number;
  net_m3: number;
};

export const vwTable2016: VWRow2016[] = [
  { code: "AR", export_m3: 669.19,  import_m3: 2.10,     net_m3: 667.09 },
  { code: "AU", export_m3: 270.77,  import_m3: 9.22,     net_m3: 261.56 },
  { code: "BR", export_m3: 1363.82, import_m3: 8.29,     net_m3: 1355.53 },
  { code: "CA", export_m3: 526.99,  import_m3: 9.09,     net_m3: 517.91 },
  { code: "CN", export_m3: 2420.68, import_m3: 74.93,    net_m3: 2345.75 },
  { code: "FR", export_m3: 94.06,   import_m3: 35.81,   net_m3: 58.25 },
  { code: "DE", export_m3: 50.49,   import_m3: 70.49,   net_m3: -20.00 },
  { code: "IN", export_m3: 1308.51, import_m3: 18.71,   net_m3: 1289.81 },
  { code: "ID", export_m3: 835.62,  import_m3: 7.26,    net_m3: 828.37 },
  { code: "IT", export_m3: 158.84,  import_m3: 21.47,   net_m3: 137.37 },
  { code: "JP", export_m3: 74.81,   import_m3: 31.57,   net_m3: 43.23 },
  { code: "MX", export_m3: 211.86,  import_m3: 9.18,    net_m3: 202.68 },
  { code: "KR", export_m3: 26.61,   import_m3: 17.58,   net_m3: 9.03 },
  { code: "RU", export_m3: 474.98,  import_m3: 11.83,   net_m3: 463.15 },
  { code: "SA", export_m3: 17.63,   import_m3: 7.00,    net_m3: 10.63 },
  { code: "ZA", export_m3: 81.27,   import_m3: 3.47,    net_m3: 77.80 },
  { code: "TR", export_m3: 121.85,  import_m3: 7.74,    net_m3: 114.10 },
  { code: "GB", export_m3: 153.19,  import_m3: 1.98,    net_m3: 151.21 },
  { code: "US", export_m3: 2765.32, import_m3: 77.97,   net_m3: 2687.35 },
  { code: "ROW",export_m3: 389.89,  import_m3: 11590.7, net_m3: -11200.8 },
];

export type WaterFlowKind = "import" | "export" | "estimated";

export type WaterFlow = {
  from: string;
  to: string;
  value: number;
  kind: WaterFlowKind;
};

export function buildWorldHubFlows2016(opts?: {
  hubCode?: string;          // default: "WORLD"
  includeROW?: boolean;      // default: false
  mode?: "import" | "export" | "both";
}): WaterFlow[] {
  const hub = opts?.hubCode ?? "WORLD";
  const includeROW = opts?.includeROW ?? false;
  const mode = opts?.mode ?? "both";

  return vwTable2016
    .filter(r => includeROW || r.code !== "ROW")
    .flatMap(r => {
      if (r.code === hub) return [];

      const flows: WaterFlow[] = [];
      if (mode === "export" || mode === "both") {
        flows.push({ from: r.code, to: hub, value: r.export_m3, kind: "export" });
      }
      if (mode === "import" || mode === "both") {
        flows.push({ from: hub, to: r.code, value: r.import_m3, kind: "import" });
      }
      return flows;
    });
}

export function buildEstimatedBilateralFlows2016(opts?: {
  topExporters?: number; // default 6
  topImporters?: number; // default 6
  excludeSelf?: boolean; // default true
  includeROW?: boolean;  // default false
}) {
  const topE = opts?.topExporters ?? 6;
  const topI = opts?.topImporters ?? 6;
  const excludeSelf = opts?.excludeSelf ?? true;
  const includeROW = opts?.includeROW ?? false;

  const rows = vwTable2016.filter(r => includeROW || r.code !== "ROW");

  const exporters = [...rows]
    .sort((a, b) => b.export_m3 - a.export_m3)
    .slice(0, topE);

  const importers = [...rows]
    .sort((a, b) => b.import_m3 - a.import_m3)
    .slice(0, topI);

  const importSum = importers.reduce((s, r) => s + r.import_m3, 0) || 1;

  const flows: WaterFlow[] = [];

  for (const ex of exporters) {
    for (const im of importers) {
      if (excludeSelf && ex.code === im.code) continue;

      const share = im.import_m3 / importSum;
      const v = ex.export_m3 * share;

      flows.push({
        from: ex.code,
        to: im.code,
        value: v,
        kind: "estimated",
      });
    }
  }

  // 小さすぎる線を消して見やすく（任意）
  flows.sort((a, b) => b.value - a.value);
  return flows;
}
