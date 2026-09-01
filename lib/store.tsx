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
import type {
  BookkeepingPosting,
  Invoice,
  LearnedRule,
  Message,
  ReceiptType,
  Revisor,
  Role,
  SalaryRequest,
  SalaryStatus,
  Transaction,
  TxStatus,
} from "./types";
import { REVISOR, CURRENT_CLIENT_ID } from "./mock-data";
import { uid } from "./utils";
import { patternFromDescription } from "./bookkeeping-rules";
import type { Match } from "./csv";

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
      patch: {
        status?: TxStatus;
        receiptType?: ReceiptType;
        note?: string;
        receiptUrl?: string;
        posting?: BookkeepingPosting;
        orphanId?: string;
        fortnoxFileId?: string;
      };
    }
  | {
      type: "bokfor";
      clientId: string;
      txId: string;
      posting: BookkeepingPosting;
    }
  | { type: "add_message"; clientId: string; message: Message }
  | { type: "mark_messages_read"; clientId: string; reader: Role }
  | {
      type: "import_csv";
      clientId: string;
      matches: Match[];
    }
  | { type: "add_invoice"; clientId: string; invoice: Invoice }
  | { type: "add_salary_request"; clientId: string; request: SalaryRequest }
  | {
      type: "update_salary_status";
      clientId: string;
      requestId: string;
      status: SalaryStatus;
      decisionNote?: string;
    }
  | { type: "hydrate"; state: State }
  | { type: "hydrate_revisor"; revisor: Revisor };

const initialState: State = {
  revisor: REVISOR,
  currentRole: "klient",
  currentClientId: CURRENT_CLIENT_ID,
};

// Actions som ska persistas till servern (bakåt-synk till Supabase).
const PERSISTED: Action["type"][] = [
  "update_tx",
  "bokfor",
  "add_message",
  "mark_messages_read",
  "add_invoice",
  "add_salary_request",
  "update_salary_status",
  "import_csv",
];

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

function upsertLearnedRule(
  rules: LearnedRule[],
  description: string,
  posting: BookkeepingPosting,
): LearnedRule[] {
  const pattern = patternFromDescription(description);
  const existing = rules.find((r) => r.pattern === pattern);
  const today = new Date().toISOString().slice(0, 10);
  if (existing) {
    return rules.map((r) =>
      r.id !== existing.id ? r : { ...r, posting, count: r.count + 1, lastUsed: today },
    );
  }
  return [
    ...rules,
    { id: uid("lr"), pattern, posting, count: 1, lastUsed: today },
  ];
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "hydrate":
      return action.state;

    case "hydrate_revisor":
      return { ...state, revisor: action.revisor };

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

    case "bokfor": {
      const next = {
        ...state,
        revisor: {
          ...state.revisor,
          clients: state.revisor.clients.map((c) => {
            if (c.id !== action.clientId) return c;
            const tx = c.transactions.find((t) => t.id === action.txId);
            if (!tx) return c;
            return {
              ...c,
              transactions: c.transactions.map((t) =>
                t.id !== action.txId
                  ? t
                  : { ...t, status: "bokford" as TxStatus, posting: action.posting },
              ),
              learnedRules: upsertLearnedRule(c.learnedRules, tx.description, action.posting),
              lastActive: new Date().toISOString().slice(0, 10),
            };
          }),
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
              : { ...c, messages: [...c.messages, action.message], lastActive: new Date().toISOString().slice(0, 10) },
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

    case "add_invoice":
      return {
        ...state,
        revisor: {
          ...state.revisor,
          clients: state.revisor.clients.map((c) =>
            c.id !== action.clientId
              ? c
              : { ...c, invoices: [...c.invoices, action.invoice], lastActive: new Date().toISOString().slice(0, 10) },
          ),
        },
      };

    case "add_salary_request":
      return {
        ...state,
        revisor: {
          ...state.revisor,
          clients: state.revisor.clients.map((c) =>
            c.id !== action.clientId
              ? c
              : {
                  ...c,
                  salaryRequests: [...c.salaryRequests, action.request],
                  lastActive: new Date().toISOString().slice(0, 10),
                },
          ),
        },
      };

    case "update_salary_status": {
      const today = new Date().toISOString().slice(0, 10);
      return {
        ...state,
        revisor: {
          ...state.revisor,
          clients: state.revisor.clients.map((c) =>
            c.id !== action.clientId
              ? c
              : {
                  ...c,
                  salaryRequests: c.salaryRequests.map((r) =>
                    r.id !== action.requestId
                      ? r
                      : {
                          ...r,
                          status: action.status,
                          decidedAt:
                            action.status === "godkand" || action.status === "avvisad"
                              ? new Date().toISOString()
                              : r.decidedAt,
                          paidAt: action.status === "utbetald" ? today : r.paidAt,
                          decisionNote: action.decisionNote ?? r.decisionNote,
                        },
                  ),
                },
          ),
        },
      };
    }

    case "import_csv": {
      const next = {
        ...state,
        revisor: {
          ...state.revisor,
          clients: state.revisor.clients.map((c) => {
            if (c.id !== action.clientId) return c;
            const consumedOrphanIds = new Set(
              action.matches.map((m) => m.orphan?.id).filter((x): x is string => Boolean(x)),
            );
            const newTx: Transaction[] = action.matches.map((m) => {
              const status: TxStatus =
                m.row.amount > 0 ? "ok" : m.orphan ? "inkommen" : "saknar_underlag";
              const t: Transaction = {
                id: uid("ti"),
                date: m.row.date,
                description: m.row.description,
                amount: m.row.amount,
                status,
              };
              if (m.orphan) {
                t.receiptType = m.orphan.receiptType;
                t.note = m.orphan.note;
                t.receiptUrl = m.orphan.filename;
                t.orphanId = m.orphan.id;
              }
              return t;
            });
            return {
              ...c,
              transactions: [...c.transactions, ...newTx],
              orphans: c.orphans.filter((o) => !consumedOrphanIds.has(o.id)),
              lastActive: new Date().toISOString().slice(0, 10),
            };
          }),
        },
      };
      return recountMissing(next);
    }

    default:
      return state;
  }
}

type Toast = { id: string; text: string; tone?: "default" | "success" };
type Source = "supabase" | "mock" | "unknown";

type Ctx = {
  state: State;
  dispatch: (action: Action) => void;
  toasts: Toast[];
  toast: (text: string, tone?: Toast["tone"]) => void;
  dismissToast: (id: string) => void;
  refresh: () => Promise<void>;
  resetDemo: () => Promise<void>;
  source: Source;
};

const AppContext = createContext<Ctx | null>(null);

const STORAGE_KEY = "rakna:state:v4";
const POLL_INTERVAL_MS = 15000;

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, rawDispatch] = useReducer(reducer, initialState);
  const [hydrated, setHydrated] = useState(false);
  const [source, setSource] = useState<Source>("unknown");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const inFlightSync = useRef(false);

  const applyServerRevisor = useCallback((rev: Revisor) => {
    rawDispatch({ type: "hydrate_revisor", revisor: rev });
  }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/data/state", { cache: "no-store" });
      const data = (await res.json()) as { revisor?: Revisor; source?: Source };
      if (data.revisor) applyServerRevisor(data.revisor);
      if (data.source) setSource(data.source);
    } catch {
      // Network-off? Fortsätt med lokal state.
    }
  }, [applyServerRevisor]);

  const resetDemo = useCallback(async () => {
    try {
      const res = await fetch("/api/data/reset", { method: "POST" });
      const data = (await res.json()) as { revisor?: Revisor; source?: Source; error?: string };
      if (data.error) throw new Error(data.error);
      if (data.revisor) applyServerRevisor(data.revisor);
      if (data.source) setSource(data.source);
    } catch (err) {
      console.error("resetDemo failed", err);
    }
  }, [applyServerRevisor]);

  // Snabb hydration från localStorage för första paint, sen server-truth.
  useEffect(() => {
    try {
      ["rakna:state:v1", "rakna:state:v2", "rakna:state:v3"].forEach((k) =>
        window.localStorage.removeItem(k),
      );
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as State;
        rawDispatch({ type: "hydrate", state: parsed });
      }
    } catch {
      // ignore
    }
    setHydrated(true);
    void refresh();
  }, [refresh]);

  // Polla för att fånga uppdateringar från andra enheter/browsers.
  useEffect(() => {
    if (!hydrated) return;
    const interval = setInterval(() => {
      if (!inFlightSync.current && !document.hidden) void refresh();
    }, POLL_INTERVAL_MS);
    const onFocus = () => {
      if (!document.hidden) void refresh();
    };
    document.addEventListener("visibilitychange", onFocus);
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onFocus);
      window.removeEventListener("focus", onFocus);
    };
  }, [hydrated, refresh]);

  // Persistera lokal state till localStorage för nästa mount.
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [state, hydrated]);

  // Dispatcher: applicerar lokalt (optimistisk UI) och synkar med servern.
  const dispatch = useCallback(
    (action: Action) => {
      rawDispatch(action);
      if (!PERSISTED.includes(action.type)) return;
      inFlightSync.current = true;
      void (async () => {
        try {
          const res = await fetch("/api/data/action", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(action),
          });
          const data = (await res.json()) as {
            revisor?: Revisor;
            source?: Source;
            error?: string;
          };
          if (res.ok && data.revisor) {
            applyServerRevisor(data.revisor);
            if (data.source) setSource(data.source);
          } else if (data.error && data.source !== "mock") {
            console.warn("Sync fail:", data.error);
          }
        } catch (err) {
          console.warn("Network dispatch failed — keeping local state", err);
        } finally {
          inFlightSync.current = false;
        }
      })();
    },
    [applyServerRevisor],
  );

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
    () => ({ state, dispatch, toasts, toast, dismissToast, refresh, resetDemo, source }),
    [state, dispatch, toasts, toast, dismissToast, refresh, resetDemo, source],
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
