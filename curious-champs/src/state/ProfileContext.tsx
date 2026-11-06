import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { AgeBand, AnswerKind, MediaTopic } from "../lib/types";

// Everything is stored only on this device. Nothing here is sent to the server
// except the question text and the age group.

export interface ChildProfile {
  nickname: string;
  avatarColor: string;
  ageBand: AgeBand;
}

export interface ParentSettings {
  readAloud: boolean;
  videos: boolean;
}

export interface HistoryItem {
  id: string;
  question: string;
  askedAt: number;
  kind: AnswerKind;
  mediaTopic: MediaTopic;
  flagged: boolean;
  source: "online" | "offline";
}

interface StoredState {
  profile: ChildProfile | null;
  settings: ParentSettings;
  history: HistoryItem[];
  rewards: number;
}

const STORAGE_KEY = "curious-champs/state/v1";
const MAX_HISTORY = 100;

const defaultState: StoredState = {
  profile: null,
  settings: { readAloud: true, videos: true },
  history: [],
  rewards: 0,
};

interface ProfileContextValue extends StoredState {
  ready: boolean;
  saveProfile: (profile: ChildProfile) => void;
  updateSettings: (patch: Partial<ParentSettings>) => void;
  recordQuestion: (item: Omit<HistoryItem, "id" | "askedAt">) => void;
  clearHistory: () => void;
  resetAll: () => void;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoredState>(defaultState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setState({ ...defaultState, ...(JSON.parse(raw) as Partial<StoredState>) });
      })
      .catch(() => {
        // Corrupt or unreadable storage: start fresh rather than crash.
      })
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state, ready]);

  const saveProfile = useCallback((profile: ChildProfile) => {
    setState((s) => ({ ...s, profile }));
  }, []);

  const updateSettings = useCallback((patch: Partial<ParentSettings>) => {
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  }, []);

  const recordQuestion = useCallback((item: Omit<HistoryItem, "id" | "askedAt">) => {
    setState((s) => ({
      ...s,
      rewards: item.kind === "answer" ? s.rewards + 1 : s.rewards,
      history: [
        { ...item, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, askedAt: Date.now() },
        ...s.history,
      ].slice(0, MAX_HISTORY),
    }));
  }, []);

  const clearHistory = useCallback(() => setState((s) => ({ ...s, history: [] })), []);
  const resetAll = useCallback(() => setState(defaultState), []);

  const value = useMemo(
    () => ({ ...state, ready, saveProfile, updateSettings, recordQuestion, clearHistory, resetAll }),
    [state, ready, saveProfile, updateSettings, recordQuestion, clearHistory, resetAll],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used inside ProfileProvider");
  return ctx;
}
