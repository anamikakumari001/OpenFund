"use client";

import dynamic from "next/dynamic";

export const NetworkVizClient = dynamic(
  () => import("./network-viz").then((m) => m.NetworkViz),
  { ssr: false, loading: () => <div className="h-[500px]" /> }
);
