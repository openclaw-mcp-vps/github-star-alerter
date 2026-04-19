import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "GitHub Star Alerter";
export const size = {
  width: 1200,
  height: 630
};

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 56,
          background: "#0d1117",
          color: "#e6edf3"
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            border: "1px solid rgba(16, 185, 129, 0.5)",
            borderRadius: 999,
            padding: "10px 18px",
            fontSize: 24,
            color: "#6ee7b7"
          }}
        >
          MARKET INTEL FOR FOUNDERS
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 82, fontWeight: 700, letterSpacing: -2 }}>GitHub Star Alerter</div>
          <div style={{ fontSize: 36, maxWidth: 980, color: "#93c5fd" }}>
            Daily digest of repos in your topics hitting star velocity thresholds.
          </div>
        </div>

        <div style={{ fontSize: 24, color: "#94a3b8" }}>
          github-star-alerter.com • Track early momentum before competitors do
        </div>
      </div>
    ),
    {
      ...size
    }
  );
}
