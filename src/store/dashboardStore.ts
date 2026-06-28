import { create } from "zustand";
import { persist } from "zustand/middleware";
import { defaultShortcuts } from "../data/defaultShortcuts";
import { uid } from "../lib/storage";
import type {
  DashboardData,
  DashboardLayout,
  DashboardSnapshot,
  FreeItemPosition,
  Profile,
  Settings,
  Shortcut,
  Todo,
  WidgetKey,
} from "../types/dashboard";

export const defaultSettings: Settings = {
  background: "image",
  blur: 18,
  glassOpacity: 0.12,
  iconSize: 56,
  columns: 6,
  greeting: "Jó napot!",
  searchProvider: "google",
  timeFormat: "24",
  weatherLocation: "Budapest",
  calendar: {
    daysAhead: 14,
    maxEvents: 8,
    showLocation: true,
    showSource: false,
    sourceScope: "global",
  },
  shortcuts: {
    showCategoriesOnDashboard: false,
  },
  widgets: { calendar: true, todos: true, notes: true },
};

export const defaultLayout: DashboardLayout = {
  mode: "grid",
  widgetOrder: ["calendar", "todos", "notes"],
  freeItems: {},
};

const createDefaultData = (): DashboardData => ({
  shortcuts: defaultShortcuts,
  todos: [
    { id: "todo-1", text: "Email válaszok", completed: false, order: 0 },
    { id: "todo-2", text: "Tervezési dokumentum", completed: false, order: 1 },
    { id: "todo-3", text: "Kutatás készítése", completed: false, order: 2 },
  ],
  note: "Ne feledd: a fókusz kulcsa a kevesebb, de jobb döntés.",
  settings: defaultSettings,
  layout: defaultLayout,
});

const createProfile = (name: string, data = createDefaultData()): Profile => {
  const now = new Date().toISOString();
  return {
    id: uid(),
    name,
    createdAt: now,
    updatedAt: now,
    data,
  };
};

const defaultProfile = createProfile("Alap profil");

const shortcutIconSlugs: Record<string, string> = {
  drive: "googledrive",
  figma: "figma",
  github: "github",
  gmail: "gmail",
  notion: "notion",
  naptár: "googlecalendar",
  reddit: "reddit",
  spotify: "spotify",
  youtube: "youtube",
};

const normalizeData = (data: DashboardData): DashboardData => ({
  ...data,
  settings: {
    ...defaultSettings,
    ...data.settings,
    calendar: {
      ...defaultSettings.calendar,
      ...(data.settings?.calendar ?? {}),
    },
    shortcuts: {
      ...defaultSettings.shortcuts,
      ...(data.settings?.shortcuts ?? {}),
    },
    widgets: {
      ...defaultSettings.widgets,
      ...(data.settings?.widgets ?? {}),
    },
  },
  layout: {
    mode: data.layout?.mode ?? defaultLayout.mode,
    widgetOrder: data.layout?.widgetOrder ?? defaultLayout.widgetOrder,
    freeItems: data.layout?.freeItems ?? defaultLayout.freeItems,
  },
  shortcuts: data.shortcuts.map((shortcut) => ({
    ...shortcut,
    iconSlug: shortcut.iconSlug || shortcutIconSlugs[shortcut.name.trim().toLowerCase()],
  })),
});

type State = {
  profiles: Profile[];
  activeProfileId: string;
  shortcuts: Shortcut[];
  todos: Todo[];
  note: string;
  settings: Settings;
  layout: DashboardLayout;
  createProfile: (name: string) => void;
  switchProfile: (id: string) => void;
  renameProfile: (id: string, name: string) => void;
  updateProfileAvatar: (id: string, avatarUrl: string) => void;
  deleteProfile: (id: string) => void;
  addShortcut: (shortcut: Omit<Shortcut, "id" | "order">) => void;
  updateShortcut: (id: string, shortcut: Partial<Shortcut>) => void;
  deleteShortcut: (id: string) => void;
  reorderShortcuts: (ids: string[]) => void;
  addTodo: (text: string) => void;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
  reorderTodos: (ids: string[]) => void;
  setNote: (note: string) => void;
  updateSettings: (settings: Partial<Settings>) => void;
  setLayoutMode: (mode: DashboardLayout["mode"]) => void;
  reorderWidgets: (keys: WidgetKey[]) => void;
  updateFreeItemPosition: (id: string, position: FreeItemPosition) => void;
  resetFreeLayout: () => void;
  hydrateSnapshot: (snapshot: DashboardSnapshot) => void;
};

const activeData = (state: State): DashboardData => ({
  shortcuts: state.shortcuts,
  todos: state.todos,
  note: state.note,
  settings: state.settings,
  layout: state.layout ?? defaultLayout,
});

const stampActiveProfile = (state: State, data: DashboardData) => ({
  profiles: (state.profiles ?? [defaultProfile]).map((profile) =>
    profile.id === state.activeProfileId
      ? { ...profile, data, updatedAt: new Date().toISOString() }
      : profile,
  ),
});

const normalizeSnapshot = (snapshot: DashboardSnapshot): DashboardSnapshot => {
  const profiles = snapshot.profiles?.length
    ? snapshot.profiles.map((profile) => ({ ...profile, data: normalizeData(profile.data) }))
    : [defaultProfile];
  const activeProfileId = profiles.some((profile) => profile.id === snapshot.activeProfileId)
    ? snapshot.activeProfileId
    : profiles[0].id;

  return { profiles, activeProfileId };
};

export const createDashboardSnapshot = (state: Pick<State, "profiles" | "activeProfileId">): DashboardSnapshot => ({
  profiles: state.profiles,
  activeProfileId: state.activeProfileId,
});

export const useDashboardStore = create<State>()(
  persist(
    (set) => ({
      profiles: [defaultProfile],
      activeProfileId: defaultProfile.id,
      ...defaultProfile.data,
      createProfile: (name) =>
        set((state) => {
          const profile = createProfile(name.trim() || "Új profil");
          return {
            profiles: [...state.profiles, profile],
            activeProfileId: profile.id,
            ...profile.data,
          };
        }),
      switchProfile: (id) =>
        set((state) => {
          const profile = state.profiles.find((item) => item.id === id);
          if (!profile) return {};
          const data = normalizeData(profile.data);
          return {
            activeProfileId: profile.id,
            ...data,
          };
        }),
      renameProfile: (id, name) =>
        set((state) => ({
          profiles: state.profiles.map((profile) =>
            profile.id === id
              ? { ...profile, name: name.trim() || profile.name, updatedAt: new Date().toISOString() }
              : profile,
          ),
        })),
      updateProfileAvatar: (id, avatarUrl) =>
        set((state) => ({
          profiles: state.profiles.map((profile) =>
            profile.id === id
              ? { ...profile, avatarUrl: avatarUrl.trim() || undefined, updatedAt: new Date().toISOString() }
              : profile,
          ),
        })),
      deleteProfile: (id) =>
        set((state) => {
          if (state.profiles.length <= 1) return {};
          const profiles = state.profiles.filter((profile) => profile.id !== id);
          const activeProfile = id === state.activeProfileId ? profiles[0] : state.profiles.find((profile) => profile.id === state.activeProfileId);
          if (!activeProfile) return { profiles };
          const data = normalizeData(activeProfile.data);
          return {
            profiles,
            activeProfileId: activeProfile.id,
            ...data,
          };
        }),
      addShortcut: (shortcut) =>
        set((state) => {
          const data = {
            ...activeData(state),
            shortcuts: [...state.shortcuts, { ...shortcut, id: uid(), order: state.shortcuts.length }],
          };
          return { ...data, ...stampActiveProfile(state, data) };
        }),
      updateShortcut: (id, shortcut) =>
        set((state) => {
          const data = {
            ...activeData(state),
            shortcuts: state.shortcuts.map((item) => (item.id === id ? { ...item, ...shortcut } : item)),
          };
          return { ...data, ...stampActiveProfile(state, data) };
        }),
      deleteShortcut: (id) =>
        set((state) => {
          const data = {
            ...activeData(state),
            shortcuts: state.shortcuts.filter((item) => item.id !== id),
          };
          return { ...data, ...stampActiveProfile(state, data) };
        }),
      reorderShortcuts: (ids) =>
        set((state) => {
          const data = {
            ...activeData(state),
            shortcuts: ids
            .map((id, order) => ({ ...state.shortcuts.find((item) => item.id === id)!, order }))
            .filter(Boolean),
          };
          return { ...data, ...stampActiveProfile(state, data) };
        }),
      addTodo: (text) =>
        set((state) => {
          const data = {
            ...activeData(state),
            todos: [...state.todos, { id: uid(), text, completed: false, order: state.todos.length }],
          };
          return { ...data, ...stampActiveProfile(state, data) };
        }),
      toggleTodo: (id) =>
        set((state) => {
          const data = {
            ...activeData(state),
            todos: state.todos.map((todo) =>
            todo.id === id ? { ...todo, completed: !todo.completed } : todo,
          ),
          };
          return { ...data, ...stampActiveProfile(state, data) };
        }),
      deleteTodo: (id) =>
        set((state) => {
          const data = {
            ...activeData(state),
            todos: state.todos.filter((todo) => todo.id !== id),
          };
          return { ...data, ...stampActiveProfile(state, data) };
        }),
      reorderTodos: (ids) =>
        set((state) => {
          const data = {
            ...activeData(state),
            todos: ids.map((id, order) => ({ ...state.todos.find((todo) => todo.id === id)!, order })),
          };
          return { ...data, ...stampActiveProfile(state, data) };
        }),
      setNote: (note) =>
        set((state) => {
          const data = { ...activeData(state), note };
          return { ...data, ...stampActiveProfile(state, data) };
        }),
      updateSettings: (settings) =>
        set((state) => {
          const data = { ...activeData(state), settings: { ...state.settings, ...settings } };
          return { ...data, ...stampActiveProfile(state, data) };
        }),
      setLayoutMode: (mode) =>
        set((state) => {
          const layout = state.layout ?? defaultLayout;
          const data = { ...activeData(state), layout: { ...layout, mode } };
          return { ...data, ...stampActiveProfile(state, data) };
        }),
      reorderWidgets: (keys) =>
        set((state) => {
          const layout = state.layout ?? defaultLayout;
          const data = { ...activeData(state), layout: { ...layout, widgetOrder: keys } };
          return { ...data, ...stampActiveProfile(state, data) };
        }),
      updateFreeItemPosition: (id, position) =>
        set((state) => {
          const layout = state.layout ?? defaultLayout;
          const data = {
            ...activeData(state),
            layout: {
              ...layout,
              freeItems: { ...(layout.freeItems ?? {}), [id]: position },
            },
          };
          return { ...data, ...stampActiveProfile(state, data) };
        }),
      resetFreeLayout: () =>
        set((state) => {
          const layout = state.layout ?? defaultLayout;
          const data = {
            ...activeData(state),
            layout: { ...layout, freeItems: {} },
          };
          return { ...data, ...stampActiveProfile(state, data) };
        }),
      hydrateSnapshot: (snapshot) =>
        set(() => {
          const next = normalizeSnapshot(snapshot);
          const activeProfile = next.profiles.find((profile) => profile.id === next.activeProfileId) ?? next.profiles[0];
          return {
            profiles: next.profiles,
            activeProfileId: activeProfile.id,
            ...activeProfile.data,
          };
        }),
    }),
    {
      name: "auren-dashboard",
      version: 1,
      migrate: (persisted) => {
        const state = persisted as Partial<State>;
        if (state.profiles?.length && state.activeProfileId) return state;
        const migratedProfile = createProfile("Alap profil", normalizeData({
          shortcuts: state.shortcuts ?? defaultShortcuts,
          todos: state.todos ?? createDefaultData().todos,
          note: state.note ?? createDefaultData().note,
          settings: state.settings ?? defaultSettings,
          layout: state.layout ?? createDefaultData().layout,
        }));
        return {
          profiles: [migratedProfile],
          activeProfileId: migratedProfile.id,
          ...migratedProfile.data,
        };
      },
      merge: (persisted, current) => {
        const state = persisted as Partial<State>;
        if (!state.profiles?.length || !state.activeProfileId) return { ...current, ...state };
        const snapshot = normalizeSnapshot({ profiles: state.profiles, activeProfileId: state.activeProfileId });
        const activeProfile = snapshot.profiles.find((profile) => profile.id === snapshot.activeProfileId) ?? snapshot.profiles[0];
        return {
          ...current,
          ...state,
          profiles: snapshot.profiles,
          activeProfileId: activeProfile.id,
          ...activeProfile.data,
        };
      },
    },
  ),
);
