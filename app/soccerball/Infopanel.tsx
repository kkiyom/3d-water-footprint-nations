export default function InfoPanel() {
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
        pointerEvents: "auto", // 操作したいなら auto（邪魔なら none）
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, "Hiragino Kaku Gothic ProN", "Noto Sans JP", "Yu Gothic", sans-serif',
      }}
    >

      <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
        「サッカーボールと世界の労働」
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
        　砕けたボールが示す、見えない供給網
      </div>

      <div style={{ fontSize: 13 }}>
        平和とスポーツの楽しみを代表するような「サッカーボール」。
        サッカーボールが私たちに届くまでには、
        綿花の栽培、糸や布の製造、合成皮革の加工、染色、縫製から包装まで、
        多くの工程が世界中で分担されています。
        <br /><br />
        特に生産拠点として知られるアジア諸国（パキスタン、インド、バングラデシュ、中国、タイ）では、
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
        <span style={{ opacity: 0.85 }}>
          これは「特定の一国の問題」ではなく、
          日本を含むグローバルな供給網の中で誰がどのように関わっているかを知るための問いです。
        </span>
      </div>
    </div>
  );
}
