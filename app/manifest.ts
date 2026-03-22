import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SplitMate — Dépenses partagées",
    short_name: "SplitMate",
    description: "Gérez simplement les dépenses partagées en couple.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#18181b",
    theme_color: "#18181b",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
