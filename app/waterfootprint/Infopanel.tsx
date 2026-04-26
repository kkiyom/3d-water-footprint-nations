"use client";
import { useState } from "react";

const content = {
  ja: {
    title: <>「見えない水」を、<br />球体に可視化する</>,
    body: <>
      私たちが使う水の多くは、蛇口の向こう側ではなく
      <b>食料・衣服・工業製品の生産</b>の中に隠れています。
      この作品は、国ごとの<b>一人あたり</b>水フットプリントを球の大きさと色で可視化します。
      一人あたりの水負荷が大きいほど球が大きく、白みがかった水色から深い藍色へと変化します。
      <br /><br />
      国にホバーすると、その国が関わる仮想水の貿易フローが表示されます。
    </>,
    importLabel: "輸入元",
    exportLabel: "輸出先",
    note: "※「ウォーターフットプリント」＝消費（食・モノ・サービス）に伴い、直接・間接に使われた淡水量。",
    cite1label: "出典（国別水フットプリント）",
    cite2label: "出典（仮想水貿易フロー）",
    reopen: "INFO",
  },
  en: {
    title: <>Visualizing<br />"Invisible Water"</>,
    body: <>
      Much of the water we use is hidden not beyond the faucet, but within the
      production of <b>food, clothing, and industrial goods</b>.
      This work visualizes each nation's <b>per-capita</b> water footprint through sphere size and color —
      from near-white pale blue (low) to deep indigo (high).
      <br /><br />
      Hover over a country to reveal its virtual water trade flows.
    </>,
    importLabel: "Import source",
    exportLabel: "Export destination",
    note: "* Water Footprint = total freshwater used directly and indirectly through consumption (food, goods, services).",
    cite1label: "Source (national water footprint)",
    cite2label: "Source (virtual water trade flows)",
    reopen: "INFO",
  },
};

export default function InfoPanel({ lang, onLangChange, defaultOpen = true }: { lang: "ja" | "en"; onLangChange: (l: "ja" | "en") => void; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
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
        background: "rgba(0,0,0,0.78)",
        color: "rgba(255,255,255,0.92)",
        border: "1px solid rgba(255,255,255,0.18)",
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
            <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#a78bfa" }} />
            <span style={{ opacity: 0.75 }}>{c.importLabel}</span>
          </span>
          <span style={{ opacity: 0.3 }}>/</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#fff" }} />
            <span style={{ opacity: 0.75 }}>{c.exportLabel}</span>
          </span>
        </span>
        <br />
        <span style={{ opacity: 0.7, fontSize: 11 }}>{c.note}</span>
      </div>

      <div style={{
        marginTop: 16,
        paddingTop: 12,
        borderTop: "1px solid rgba(255,255,255,0.1)",
        fontSize: 10,
        lineHeight: 1.6,
        color: "rgba(255,255,255,0.4)",
        letterSpacing: "0.01em",
      }}>
        <div style={{ marginBottom: 6 }}>
          {c.cite1label}<br />
          Hoekstra, A.Y. & Mekonnen, M.M. (2012). "The water footprint of humanity."
          <i> Proceedings of the National Academy of Sciences</i>, 109(9), 3232–3237.
          https://doi.org/10.1073/pnas.1109936109
        </div>
        <div>
          {c.cite2label}<br />
          Zhang, X. et al. (2024). "A Study of Virtual Water Trade among G20 Countries
          from a Value-Added Trade Perspective." <i>Water</i>, 16(19), 2808.
          https://doi.org/10.3390/w16192808
        </div>
      </div>
    </div>
  );
}
