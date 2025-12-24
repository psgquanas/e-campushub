"use client";

import Snowfall from "react-snowfall";

export default function SnowfallEffect() {
  return (
    <Snowfall
      color="#dee4fd"
      snowflakeCount={200}
      style={{
        position: "fixed",
        width: "100vw",
        height: "100vh",
        zIndex: 9999,
        pointerEvents: "none",
      }}
    />
  );
}
