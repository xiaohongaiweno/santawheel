import { ImageResponse } from "next/og";
import { site } from "@/lib/site";

export const alt = site.ogImageAlt;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #fdfaf5 0%, #f6ead8 100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 28,
          }}
        >
          <svg width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="#b3402a" strokeWidth="1.8">
            <circle cx="12" cy="12" r="9" />
            <circle cx="12" cy="12" r="2.5" />
            <path d="M12 3v6.5M12 14.5V21M3 12h6.5M14.5 12H21M5.6 5.6l4.6 4.6M13.8 13.8l4.6 4.6M18.4 5.6l-4.6 4.6M10.2 13.8l-4.6 4.6" />
          </svg>
          <div style={{ fontSize: 88, fontWeight: 700, color: "#2a2320", display: "flex" }}>
            {site.name}
          </div>
        </div>
        <div style={{ marginTop: 28, fontSize: 34, color: "#7a6f68", display: "flex" }}>
          Spin into the season
        </div>
      </div>
    ),
    { ...size }
  );
}
