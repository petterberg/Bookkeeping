"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import type { Message, ReceiptType, Revisor, Role, TxStatus } from "./types";
import { REVISOR, CURRENT_CLIENT_ID } from "./mock-data";
import { uid } from "./utils";

type State = {
  revisor: Revisor;
  currentRole: Role;
  currentClientId: string;
};

type Action =
  | { type: "set_role"; role: Role }
  | { type: "set_current_client"; clientId: string }
  | {
      type: "update_tx";
      clientId: string;
      txId: string;
      patch: { status?: TxStatus; receiptType?: ReceiptType; note?: string; receiptUrl?: string };
    }
  | { type: "add_message"; clientId: string; message: Message }
  | { type: "mark_messages_read"; clientId: string; reader: Role }
  | { type: "hydrate"; state: State };

const initialState: State = {
  revisor: REVISOR,
  currentRole: "klient",
  currentClientId: CURRENT_CLIENT_ID,
};

function recountMissing(state: State): State {
  return {
    ...state,
    revisor: {
      ...state.revisor,
      clients: state.revisor.clients.map((c) => ({
        ...c,
        missingCount: c.transactions.filter((t) => t.status === "saknar_underlag").length,
      })),
    },
  };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "hydrate":
      return action.state;

    case "set_role":
      return { ...state, currentRole: action.role };

    case "set_current_client":
      return { ...state, currentClientId: action.clientId };

    case "update_tx": {
      const next = {
        ...state,
        revisor: {
          ...state.revisor,
          clients: state.revisor.clients.map((c) =>
            c.id !== action.clientId
              ? c
              : {
                  ...c,
                  transactions: c.transactions.map((t) =>
                    t.id !== action.txId ? t : { ...t, ...action.patch },
                  ),
                  lastActive: new Date().toISOString().slice(0, 10),
                },
          ),
        },
      };
      return recountMissing(next);
    }

    case "add_message":
      return {
        ...state,
        revisor: {
          ...state.revisor,
          clients: state.revisor.clients.map((c) =>
            c.id !== action.clientId
              ? c
              : {
                  ...c,
                  messages: [...c.messages, action.message],
                  lastActive: new Date().toISOString().slice(0, 10),
                },
          ),
        },
      };

    case "mark_messages_read":
      return {
        ...state,
        revisor: {
          ...state.revisor,
          clients: state.revisor.clients.map((c) =>
            c.id !== action.clientId
              ? c
              : {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.from !== action.reader && !m.read ? { ...m, read: true } : m,
                  ),
                },
          ),
        },
      };

    default:
      return state;
  }
}

type Toast = { id: string; text: string; tone?: "default" | "success" };

type Ctx = {
  state: State;
  dispatch: React.Dispatch<Action>;
  toasts: Toast[];
  toast: (text: string, tone?: Toast["tone"]) => void;
  dismissToast: (id: string) => void;
};

const AppContext = createContext<Ctx | null>(null);

const STORAGE_KEY = "rakna:state:v1";

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [hydrated, setHydrated] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as State;
        dispatch({ type: "hydrate", state: parsed });
      }
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [state, hydrated]);

  const dismissToast = useCallback((id: string) => {
    setToasts((cur) => cur.filter((t) => t.id !== id));
    const h = timeouts.current.get(id);
    if (h) {
      clearTimeout(h);
      timeouts.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    (text: string, tone: Toast["tone"] = "default") => {
      const id = uid("toast");
      setToasts((cur) => [...cur, { id, text, tone }]);
      const h = setTimeout(() => dismissToast(id), 2500);
      timeouts.current.set(id, h);
    },
    [dismissToast],
  );

  const value = useMemo(
    () => ({ state, dispatch, toasts, toast, dismissToast }),
    [state, toasts, toast, dismissToast],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): Ctx {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}

export function useClient(clientId: string) {
  const { state } = useApp();
  return state.revisor.clients.find((c) => c.id === clientId);
}

export function useCurrentClient() {
  const { state } = useApp();
  return state.revisor.clients.find((c) => c.id === state.currentClientId)!;
}
