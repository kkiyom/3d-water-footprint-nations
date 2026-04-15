"use client";
import { useState } from "react";

const content = {
  ja: {
    title: <>「見えない煙」を、<br />球体に可視化する</>,
    body: <>
      私たちが日常で使うエネルギー——電気、ガス、ガソリン——
      そして食料や工業製品の製造には、膨大な量のCO₂が大気中に放出されています。
      この作品は、国ごとの<b>一人あたりCO₂排出量</b>を
      球の大きさと色で可視化します。
      <br /><br />
      球にホバーすると、その国の排出量・一人あたり値・世界平均との比較と、
      主要な<b>内包炭素の貿易フロー</b>が表示されます。
    </>,
    exportLabel: "輸出元（内包炭素）",
    importLabel: "輸入先（内包炭素）",
    note: "※ 球サイズは一人あたり領域ベースCO₂排出量（2021年）。貿易フローはPeters et al. (2011) をもとにした主要フローの近似値。",
    citeLabel: "出典",
    reopen: "INFO",
  },
  en: {
    title: <>Visualizing<br />"The Invisible Smoke"</>,
    body: <>
      The energy we use every day — electricity, gas, fuel —
      along with the production of food and manufactured goods,
      releases enormous quantities of CO₂ into the atmosphere.
      This work visualizes each nation's <b>per-capita CO₂ emissions</b>
      through sphere size and color.
      <br /><br />
      Hover over a sphere to reveal its emissions data and the main
      <b> embodied carbon trade flows</b> connected to that country.
    </>,
    exportLabel: "Export source (embodied carbon)",
    importLabel: "Import destination",
    note: "* Sphere size = per-capita territorial CO₂ (2021). Trade flows are approximate major flows based on Peters et al. (2011).",
    citeLabel: "Source",
    reopen: "INFO",
  },
};

export default function InfoPanel({ lang, onLangChange }: { lang: "ja" | "en"; onLangChange: (l: "ja" | "en") => void }) {
  const [open, setOpen] = useState(true);
  const c = content[lang];

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          background: "rgba(0,0,0,0.7)",
          color: "rgba(255,255,255,0.92)",
          border: "1px solid rgba(255,255,255,0.25)",
          padding: "7px 16px",
          fontSize: 10,
          letterSpacing: "0.2em",
          cursor: "pointer",
          backdropFilter: "blur(6px)",
          fontFamily: "monospace",
          fontWeight: 700,
          zIndex: 20,
        }}
      >
        {c.reopen}
      </button>
    );
  }

  return (
    <div
      style={{
        position: "absolute",
        top: 16,
        right: 16,
        width: "min(420px, 92vw)",
        background: "rgba(10,4,0,0.82)",
        color: "rgba(255,255,255,0.92)",
        border: "1px solid rgba(255,120,30,0.3)",
        padding: "20px 20px 20px",
        lineHeight: 1.55,
        letterSpacing: "0.02em",
        backdropFilter: "blur(6px)",
        pointerEvents: "auto",
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, "Hiragino Kaku Gothic ProN", "Noto Sans JP", "Yu Gothic", sans-serif',
      }}
    >
      {/* ヘッダー行 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ fontSize: 25, fontWeight: 700, lineHeight: 1.3 }}>
          {c.title}
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0, marginLeft: 12 }}>
          <button
            onClick={() => onLangChange(lang === "ja" ? "en" : "ja")}
            style={{
              background: "rgba(0,0,0,0.5)",
              color: "rgba(255,255,255,0.92)",
              border: "1px solid rgba(255,255,255,0.2)",
              padding: "4px 10px",
              fontSize: 10,
              letterSpacing: "0.15em",
              cursor: "pointer",
              fontFamily: "monospace",
              fontWeight: 700,
            }}
          >
            {lang === "ja" ? "EN" : "JP"}
          </button>
          <button
            onClick={() => setOpen(false)}
            style={{
              background: "transparent",
              color: "rgba(255,255,255,0.92)",
              border: "none",
              fontSize: 18,
              cursor: "pointer",
              lineHeight: 1,
              padding: "2px 4px",
              fontFamily: "monospace",
            }}
          >
            ×
          </button>
        </div>
      </div>

      <div style={{ fontSize: 13, lineHeight: 1.7 }}>
        {c.body}
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, margin: "6px 0", flexWrap: "wrap" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#ff9944" }} />
            <span style={{ opacity: 0.75 }}>{c.exportLabel}</span>
          </span>
          <span style={{ opacity: 0.3 }}>/</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#ff5544" }} />
            <span style={{ opacity: 0.75 }}>{c.importLabel}</span>
          </span>
        </span>
        <br />
        <span style={{ opacity: 0.7, fontSize: 11 }}>{c.note}</span>
      </div>

      <div style={{
        marginTop: 16,
        paddingTop: 12,
        borderTop: "1px solid rgba(255,120,30,0.15)",
        fontSize: 10,
        lineHeight: 1.6,
        color: "rgba(255,255,255,0.4)",
        letterSpacing: "0.01em",
      }}>
        <div style={{ marginBottom: 6 }}>
          {c.citeLabel}（排出量）<br />
          Friedlingstein, P. et al. (2022). "Global Carbon Budget 2022."
          <i> Earth System Science Data</i>, 14, 4811–4900.
          https://doi.org/10.5194/essd-14-4811-2022
        </div>
        <div>
          {c.citeLabel}（貿易フロー）<br />
          Peters, G.P. et al. (2011). "Growth in emission transfers via international trade from 1990 to 2008."
          <i> PNAS</i>, 108(21), 8903–8908.
          https://doi.org/10.1073/pnas.1006388108
        </div>
      </div>
    </div>
  );
}
