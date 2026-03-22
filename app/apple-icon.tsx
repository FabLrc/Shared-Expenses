import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        background: "#18181b",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 40,
      }}
    >
      <span
        style={{
          color: "white",
          fontSize: 80,
          fontWeight: 900,
          fontFamily: "sans-serif",
          letterSpacing: "-4px",
        }}
      >
        S$
      </span>
    </div>,
    size
  );
}
