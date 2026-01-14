export default function InfoPanel() {
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
        pointerEvents: "auto", // 操作したいなら auto（邪魔なら none）
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, "Hiragino Kaku Gothic ProN", "Noto Sans JP", "Yu Gothic", sans-serif',
      }}
    >

      <div style={{ fontSize: 25, fontWeight: 700, marginBottom: 8 }}>
        「見えない水」を、<br></br>球体に可視化する
      </div>

      <div style={{ fontSize: 13 }}>
        私たちが使う水の多くは、蛇口の向こう側ではなく
        <b>食料・衣服・工業製品の生産</b>の中に隠れています。
        この作品は、国ごとの水フットプリントを“触れそうな量感”として可視化します。
        {/* <br /><br />
        <b>操作</b>：ドラッグで回転／スクロールでズーム。球に触れると国名と数値を表示。 */}
        <br />
        <b></b>水の負荷が大きいほど大きく、色が濃くなっています。
        <br /><br />
        <span style={{ opacity: 0.85 }}>
          ※「ウォーターフットプリント」＝消費（食・モノ・サービス）に伴い、
          直接・間接に使われた淡水量（概念）。
        </span>
      </div>
    </div>
  );
}
