"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { WeBoardView } from "@/lib/supabase/we-flow";

/**
 * Shared white elephant draft board.
 *
 * One phone operates, everyone else watches the same page. Moves are sent to
 * the server, which is the only place that decides legality (the state machine
 * in lib/white-elephant.ts). The board then refreshes:
 *   - immediately after an action,
 *   - on a short poll while the tab is visible (works with no extra config),
 *   - through a Supabase realtime channel when public keys are configured.
 *
 * Nothing is kept client-side: a reload re-renders from the server fold, so
 * progress can never be lost or diverge between phones.
 */
export default function DraftBoard({
  token,
  initial,
}: {
  token: string;
  initial: WeBoardView;
}) {
  const [view, setView] = useState<WeBoardView>(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [orderDraft, setOrderDraft] = useState<string[]>(
    initial.turnOrder.map((p) => p.id)
  );
  const [limitDraft, setLimitDraft] = useState(String(initial.stealLimit));
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/we/state?token=${encodeURIComponent(token)}`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as { view: WeBoardView };
      if (mounted.current) setView(data.view);
    } catch {
      /* a dropped poll must never break the board */
    }
  }, [token]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // Poll while visible; also refresh the moment the tab comes back.
  useEffect(() => {
    const tick = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        void refresh();
      }
    };
    const id = window.setInterval(tick, 2000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [refresh]);

  // Optional realtime transport: activated when public Supabase keys exist.
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return;
    let channel: { unsubscribe: () => void } | null = null;
    let cancelled = false;

    void import("@supabase/supabase-js")
      .then(({ createClient }) => {
        if (cancelled) return;
        const client = createClient(url, key, { auth: { persistSession: false } });
        channel = client
          .channel(`we-game-${view.gameId}`)
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "we_game",
              filter: `id=eq.${view.gameId}`,
            },
            () => void refresh()
          )
          .subscribe();
      })
      .catch(() => {
        /* realtime is a bonus; polling already covers the board */
      });

    return () => {
      cancelled = true;
      channel?.unsubscribe();
    };
  }, [view.gameId, refresh]);

  const nameOf = useMemo(
    () => new Map(view.players.map((p) => [p.id, p.name])),
    [view.players]
  );

  async function send(action: string, extra: Record<string, unknown> = {}) {
    setBusy(action);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/we/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, action, ...extra }),
      });
      const data = (await res.json()) as {
        view?: WeBoardView;
        error?: string;
        queued?: number;
        delivery?: { sent: number; failed: number } | null;
      };
      if (!res.ok) {
        setError(data.error ?? "That move was not allowed.");
        void refresh();
        return;
      }
      if (data.view) setView(data.view);
      if (action === "finish") {
        const sent = data.delivery?.sent ?? 0;
        const failed = data.delivery?.failed ?? 0;
        setNotice(
          `Results sent. ${sent} email${sent === 1 ? "" : "s"} delivered${
            failed > 0 ? `, ${failed} failed and will retry` : ""
          }.`
        );
      }
    } catch {
      setError("Network problem — check your connection and try again.");
    } finally {
      setBusy(null);
    }
  }

  function move(index: number, delta: number) {
    const next = [...orderDraft];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setOrderDraft(next);
    void send("order", { order: next });
  }

  const phaseLabel =
    view.phase === "lobby" ? "Setting up" : view.phase === "done" ? "Finished" : "In play";

  const canPick = view.phase === "playing";
  const canSteal =
    view.phase === "playing" && view.mode === "choose" && view.turnIndex > 0;

  return (
    <div className="space-y-6">
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">{view.title}</h1>
          <span className="rounded-full border border-border px-2 py-0.5 text-xs font-medium text-muted">
            {phaseLabel}
          </span>
          <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-muted">
            <span className="inline-block h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
            Live
          </span>
        </div>
        <p className="mt-1 text-xs text-muted">
          White elephant · {view.players.length} players · steal limit {view.stealLimit} per gift
        </p>
      </header>

      {error && (
        <p role="alert" className="rounded-lg border border-accent/40 bg-accent/5 px-3 py-2 text-sm">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="rounded-lg border border-border bg-surface px-3 py-2 text-sm">
          {notice}
        </p>
      )}

      {/* whose turn */}
      <section
        aria-live="polite"
        className="rounded-xl border border-border bg-surface px-4 py-4"
      >
        {view.phase === "done" ? (
          <>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Final results</p>
            <p className="mt-1 text-lg font-semibold">Every turn is used</p>
            <p className="mt-1 text-sm text-muted">
              Everyone keeps what is in their hands. Send the recap emails below.
            </p>
          </>
        ) : view.pendingActor ? (
          <>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              {view.mode === "pick_only" ? "Re-pick (was just stolen from)" : "Now playing"}
            </p>
            <p className="mt-1 text-2xl font-bold">{view.pendingActor.name}</p>
            <p className="mt-1 text-sm text-muted">
              {view.mode === "pick_only"
                ? "Pick a new gift from the pool — stealing back is not allowed."
                : view.turnIndex === 0
                  ? "First player of the first round: open a gift from the pool."
                  : "Open a new gift, or steal one that is already open."}
            </p>
          </>
        ) : (
          <p className="text-sm text-muted">No turn is pending.</p>
        )}
      </section>

      {/* lobby controls */}
      {view.phase === "lobby" && (
        <section className="rounded-xl border border-border bg-background px-4 py-4">
          <h2 className="text-sm font-semibold">Draw order</h2>
          <p className="mt-1 text-xs text-muted">
            Randomly assigned. Move people up or down before starting; the order is locked once the
            game begins.
          </p>
          <ol className="mt-3 space-y-2">
            {orderDraft.map((id, index) => (
              <li key={id} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
                <span className="w-5 text-xs text-muted">{index + 1}</span>
                <span className="flex-1 text-sm font-medium">{nameOf.get(id) ?? "Unknown"}</span>
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0 || busy !== null}
                  className="rounded-md border border-border px-2 py-1 text-xs disabled:opacity-40"
                  aria-label={`Move ${nameOf.get(id) ?? "player"} up`}
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === orderDraft.length - 1 || busy !== null}
                  className="rounded-md border border-border px-2 py-1 text-xs disabled:opacity-40"
                  aria-label={`Move ${nameOf.get(id) ?? "player"} down`}
                >
                  ↓
                </button>
              </li>
            ))}
          </ol>

          <div className="mt-4 flex flex-wrap items-end gap-3">
            <label className="text-xs font-medium text-muted">
              Steal limit per gift
              <input
                type="number"
                min={0}
                max={10}
                value={limitDraft}
                onChange={(e) => setLimitDraft(e.target.value)}
                className="mt-1 block w-24 rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"
              />
            </label>
            <button
              type="button"
              onClick={() => void send("steal-limit", { limit: Number(limitDraft) })}
              disabled={busy !== null}
              className="rounded-md border border-border px-3 py-1.5 text-sm disabled:opacity-40"
            >
              Save limit
            </button>
            <button
              type="button"
              onClick={() => void send("start", { order: orderDraft })}
              disabled={busy !== null}
              className="ml-auto min-h-11 rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-surface transition-colors hover:bg-accent-strong disabled:opacity-50"
            >
              Start the game
            </button>
          </div>
        </section>
      )}

      {/* pool */}
      {view.phase !== "lobby" && (
        <section>
          <h2 className="text-sm font-semibold">
            Gift pool{" "}
            <span className="font-normal text-muted">
              ({view.pool.length} unopened)
            </span>
          </h2>
          {view.pool.length === 0 ? (
            <p className="mt-2 text-sm text-muted">Every gift has been opened.</p>
          ) : (
            <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {view.pool.map((gift) => (
                <li key={gift.id} className="rounded-lg border border-border bg-surface p-3">
                  <p className="text-sm font-medium">{gift.label}</p>
                  <button
                    type="button"
                    onClick={() => void send("pick", { giftId: gift.id })}
                    disabled={!canPick || busy !== null}
                    className="mt-2 min-h-10 w-full rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-surface disabled:opacity-40"
                  >
                    {view.mode === "pick_only" ? "Pick this one" : "Open"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* players */}
      {view.phase !== "lobby" && (
        <section>
          <h2 className="text-sm font-semibold">Players</h2>
          <ul className="mt-3 space-y-2">
            {view.players.map((player) => {
              const isPending = view.pendingActor?.id === player.id;
              const stealable = canSteal && player.gift !== null && !player.gift.locked;
              return (
                <li
                  key={player.id}
                  className={`rounded-lg border px-3 py-3 ${
                    isPending ? "border-accent bg-accent/5" : "border-border bg-background"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{player.name}</span>
                    {isPending && (
                      <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold uppercase text-surface">
                        up now
                      </span>
                    )}
                    <span className="ml-auto text-xs text-muted">
                      {player.gift
                        ? `${player.gift.stolenCount}/${view.stealLimit} steals${
                            player.gift.locked ? " · locked" : ""
                          }`
                        : "nothing yet"}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="flex-1 text-sm">
                      {player.gift ? player.gift.label : <span className="text-muted">—</span>}
                    </span>
                    {player.gift && (
                      <button
                        type="button"
                        onClick={() => void send("steal", { giftId: player.gift!.id })}
                        disabled={!stealable || busy !== null}
                        className="min-h-10 rounded-md border border-accent px-3 py-1.5 text-xs font-semibold text-accent disabled:opacity-30"
                      >
                        {player.gift.locked ? "Locked" : "Steal"}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* controls */}
      <section className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
        <button
          type="button"
          onClick={() => void send("undo")}
          disabled={!view.canUndo || busy !== null}
          className="min-h-11 rounded-lg border border-border px-4 py-2 text-sm font-medium disabled:opacity-40"
        >
          Undo last step
        </button>
        {view.phase === "done" && !view.finished && (
          <button
            type="button"
            onClick={() => void send("finish")}
            disabled={busy !== null}
            className="ml-auto min-h-11 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-surface disabled:opacity-50"
          >
            Send result emails
          </button>
        )}
        {view.finished && (
          <span className="ml-auto text-xs text-muted">Result emails sent</span>
        )}
      </section>

      {view.history.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold">Recent moves</h2>
          <ol className="mt-2 space-y-1 text-xs text-muted">
            {view.history.map((h) => (
              <li key={h.seq}>
                #{h.seq} · {h.player}{" "}
                {h.type === "steal"
                  ? `stole ${h.gift} from ${h.victim}`
                  : h.type === "repick"
                    ? `re-opened ${h.gift}`
                    : `opened ${h.gift}`}
              </li>
            ))}
          </ol>
        </section>
      )}

      <p className="text-[11px] leading-relaxed text-muted">
        Keep this link to resume: the board reloads the exact state from the server, on any phone.
        Only share it with people in this game.
      </p>
    </div>
  );
}
