export type SearchProvider = "google" | "duckduckgo" | "brave" | "bing";
export type Locale = "hu" | "en" | "de" | "fr";

export type Shortcut = {
  id: string;
  name: string;
  url: string;
  icon: string;
  iconSlug?: string;
  color: string;
  category: string;
  openInNewTab: boolean;
  order: number;
};

export type ShortcutCategory = {
  id: string;
  name: string;
  color: string;
  order: number;
};

export type Todo = {
  id: string;
  text: string;
  completed: boolean;
  order: number;
};

export type WidgetKey = "calendar" | "todos" | "notes";

export type LayoutMode = "grid" | "free";

export type BackgroundFit = "cover" | "contain" | "fill" | "center" | "repeat";

export type FreeItemPosition = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type DashboardLayout = {
  mode: LayoutMode;
  widgetOrder: WidgetKey[];
  freeItems: Record<string, FreeItemPosition>;
};

export type Settings = {
  locale: Locale;
  background: "image" | "gradient" | "custom";
  backgroundImageUrl?: string;
  backgroundFit: BackgroundFit;
  backgroundDim: number;
  blur: number;
  glassOpacity: number;
  iconSize: number;
  columns: number;
  greeting: string;
  searchProvider: SearchProvider;
  timeFormat: "12" | "24";
  weatherLocation: string;
  calendar: {
    daysAhead: number;
    maxEvents: number;
    showLocation: boolean;
    showSource: boolean;
    sourceScope: "global" | "profile";
  };
  shortcuts: {
    showCategoriesOnDashboard: boolean;
  };
  widgets: {
    calendar: boolean;
    todos: boolean;
    notes: boolean;
  };
};

export type DashboardData = {
  shortcuts: Shortcut[];
  shortcutCategories: ShortcutCategory[];
  todos: Todo[];
  note: string;
  settings: Settings;
  layout: DashboardLayout;
};

export type Profile = {
  id: string;
  name: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
  data: DashboardData;
};

export type DashboardSnapshot = {
  profiles: Profile[];
  activeProfileId: string;
};

