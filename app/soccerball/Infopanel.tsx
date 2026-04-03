"use client";
import { useState } from "react";

const content = {
  ja: {
    title: "「サッカーボールと世界の労働」",
    subtitle: "　砕けたボールが示す、見えない供給網",
    body: <>
      平和とスポーツの楽しみを代表するような「サッカーボール」。
      サッカーボールが私たちに届くまでには、
      綿花の栽培、糸や布の製造、合成皮革の加工、染色、縫製から包装まで、
      多くの工程が世界中で分担されています。
      <br /><br />
      特に生産拠点として知られるアジア諸国（パキスタン、インド、中国、タイ）では、
      縫製・組立の工程で児童労働が報告されてきました。
      また、綿花など原料の段階では、アフリカの一部地域（ガーナ、コートジボワール）でも
      児童労働のリスクが存在します。
      <br />
      中南米や東欧でも、正式な労働法規制が行き届かない中小工場や下請けでは、
      低賃金・長時間労働、非公式な家族労働が問題とされることがあります。
      <br /><br />
      国際的な調査では、こうしたサプライチェーンのさまざまな段階で、
      子どもたちが危険な労働に従事したり、教育の機会を奪われたりする
      リスクがあることが指摘されています。
      <br /><br />
      これは「特定の一国の問題」ではなく、
      日本を含むグローバルな供給網の中で誰がどのように関わっているかを知るための問いです。
    </>,
    reopen: "INFO",
  },
  en: {
    title: '"Soccer Balls and Global Labor"',
    subtitle: "　The Fractured Ball Reveals an Invisible Supply Chain",
    body: <>
      The soccer ball — a symbol of peace and sporting joy.
      Yet before it reaches us, its production spans the globe:
      cotton farming, thread and fabric manufacturing, synthetic leather processing,
      dyeing, stitching, and packaging — each step divided across countries.
      <br /><br />
      In major production hubs across Asia (Pakistan, India, China, Thailand),
      child labor has been documented in stitching and assembly.
      In raw material supply chains — particularly cotton — child labor risks
      also exist in parts of Africa (Ghana, Côte d'Ivoire).
      <br />
      In Latin America and Eastern Europe, small factories and subcontractors
      operating outside formal labor regulation have been linked to
      low wages, excessive hours, and informal family labor.
      <br /><br />
      International investigations have identified risks of children performing
      hazardous work or being denied access to education at multiple stages
      of these supply chains.
      <br /><br />
      This is not the problem of any single country —
      it is a question of who is involved, and how,
      within a global supply network that includes Japan.
    </>,
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
        width: "min(455px, 92vw)",
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
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.3 }}>{c.title}</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>{c.subtitle}</div>
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

      <div style={{ fontSize: 13 }}>{c.body}</div>

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
          Source (child labor in Pakistan stitching)<br />
          ILO/IPEC (1999). <i>Elimination of Child Labour in the Soccer Ball Industry in Sialkot, Pakistan</i>. Geneva: ILO.
          https://www.ilo.org/media/303521/download
        </div>
        <div style={{ marginBottom: 6 }}>
          Source (India, China, Thailand survey)<br />
          International Labor Rights Forum (2010). <i>Missed the Goal for Workers: The Reality of Soccer Ball
          Stitchers in Pakistan, India, China and Thailand</i>. Washington, D.C.: ILRF.
          https://ecommons.cornell.edu/bitstreams/8d3d1e73-90fe-4ab6-ad52-c289d71458db/download
        </div>
        <div>
          Source (U.S. government child labor goods list)<br />
          U.S. Department of Labor, ILAB (2024). <i>List of Goods Produced by Child Labor or Forced Labor</i> (11th ed.).
          https://www.dol.gov/agencies/ilab/reports/child-labor/list-of-goods
        </div>
      </div>
    </div>
  );
}
