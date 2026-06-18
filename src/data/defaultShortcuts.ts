import type { Shortcut } from "../types/dashboard";

const shortcuts: Array<Pick<Shortcut, "name" | "url" | "icon" | "iconSlug" | "color" | "category">> = [
  { name: "Gmail", url: "https://mail.google.com", icon: "G", iconSlug: "gmail", color: "#ea4335", category: "Munka" },
  { name: "Naptár", url: "https://calendar.google.com", icon: "31", iconSlug: "googlecalendar", color: "#4285f4", category: "Munka" },
  { name: "Notion", url: "https://notion.so", icon: "N", iconSlug: "notion", color: "#ffffff", category: "Jegyzet" },
  { name: "YouTube", url: "https://youtube.com", icon: "▶", iconSlug: "youtube", color: "#ff0033", category: "Szórakozás" },
  { name: "Drive", url: "https://drive.google.com", icon: "△", iconSlug: "googledrive", color: "#34a853", category: "Munka" },
  { name: "GitHub", url: "https://github.com", icon: "GH", iconSlug: "github", color: "#f5f7fb", category: "Fejlesztés" },
  { name: "LinkedIn", url: "https://linkedin.com", icon: "in", color: "#0a66c2", category: "Kapcsolatok" },
  { name: "Reddit", url: "https://reddit.com", icon: "r", iconSlug: "reddit", color: "#ff4500", category: "Közösség" },
  { name: "Figma", url: "https://figma.com", icon: "F", iconSlug: "figma", color: "#a259ff", category: "Design" },
  { name: "Spotify", url: "https://spotify.com", icon: "♪", iconSlug: "spotify", color: "#1ed760", category: "Zene" },
  { name: "Hírek", url: "https://telex.hu", icon: "H", color: "#60a5fa", category: "Hírek" },
];

export const defaultShortcuts: Shortcut[] = shortcuts.map((shortcut, order) => ({
  id: `shortcut-${order}`,
  ...shortcut,
  openInNewTab: true,
  order,
}));
