export default function manifest() {
  return {
    name: "SplitMate — Dépenses partagées",
    short_name: "SplitMate",
    description: "Gérez simplement les dépenses partagées en couple.",
    scope: "/",
    start_url: "/dashboard",
    display: "standalone",
    capture_links: "existing-client",
    launch_handler: {
      client_mode: "navigate-existing",
    },
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
