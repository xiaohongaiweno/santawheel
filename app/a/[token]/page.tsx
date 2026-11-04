import { verifyToken } from "@/lib/tokens";
import { getSupabaseAdmin } from "@/lib/supabase/draw-service";
import RemoveMeButton from "@/components/delivery/RemoveMeButton";
import Watermark from "@/components/delivery/Watermark";
import { signToken } from "@/lib/tokens";

export const metadata = {
  title: "Your Secret Santa assignment",
  robots: { index: false, follow: false },
};

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <section className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="text-xl font-bold">{title}</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">{body}</p>
    </section>
  );
}

export default async function AssignmentPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const payload = verifyToken(token);

  if (!payload || payload.t !== "a") {
    return (
      <Notice
        title="This link is not valid"
        body="Check that you opened the full link from your email — it may have been truncated or mistyped."
      />
    );
  }

  const db = getSupabaseAdmin();
  const { data: exchange } = await db
    .from("exchange")
    .select("title, status, draw_generation, paid")
    .eq("id", payload.x)
    .maybeSingle();

  if (!exchange) {
    return <Notice title="Draw not found" body="This draw no longer exists." />;
  }
  if (exchange.status !== "drawn" || payload.g !== exchange.draw_generation) {
    return (
      <Notice
        title="This link has been revoked"
        body="The organizer reset the draw and all links were re-issued. Ask them to resend your new assignment email."
      />
    );
  }

  const { data: pair } = await db
    .from("pair")
    .select("receiver_id")
    .eq("exchange_id", payload.x)
    .eq("giver_id", payload.p)
    .maybeSingle();
  if (!pair) {
    return (
      <Notice
        title="This link has been revoked"
        body="The draw was reset. Ask the organizer to resend your assignment email."
      />
    );
  }

  const [{ data: receiver }, { data: giver }] = await Promise.all([
    db
      .from("participant")
      .select("name, wishlist_url, removed_at")
      .eq("id", pair.receiver_id)
      .single(),
    db
      .from("participant")
      .select("name, removed_at")
      .eq("id", payload.p)
      .single(),
  ]);

  if (giver?.removed_at) {
    return (
      <Notice
        title="You have been removed from this draw"
        body="Your data was removed at your request. No further emails will be sent to you."
      />
    );
  }

  const receiverRemoved = Boolean(receiver?.removed_at);
  const receiverName = receiverRemoved ? "a removed participant" : (receiver?.name as string);

  // Track first open (drives premium reminder emails). Idempotent.
  await db
    .from("assignment")
    .update({ viewed_at: new Date().toISOString() })
    .eq("exchange_id", payload.x)
    .eq("giver_id", payload.p)
    .eq("viewed_at", null);

  return (
    <section className="mx-auto max-w-md px-4 py-14">
      <p className="text-sm text-muted">{String(exchange.title)}</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight">
        Hi {giver?.name}, you are drawing for
      </h1>
      <div className="mt-6 rounded-xl border border-border bg-surface p-6 text-center">
        <p className="text-3xl font-bold text-accent">{receiverName}</p>
        {receiverRemoved && (
          <p className="mt-2 text-xs text-muted">
            This person removed their data. The organizer has been handling it —
            they may update the draw.
          </p>
        )}
        {receiver?.wishlist_url && !receiverRemoved && (
          <a
            href={receiver.wishlist_url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="mt-4 inline-block rounded-lg border border-border px-4 py-2 text-sm font-medium hover:border-accent hover:text-accent"
          >
            View their wishlist
          </a>
        )}
      </div>

      <p className="mt-6 text-xs leading-relaxed text-muted">
        Keep this page private — it is your personal assignment link and shows
        nobody else&apos;s pairing.
      </p>

      <div className="mt-8 rounded-lg border border-border bg-surface p-4">
        <p className="text-xs leading-relaxed text-muted">
          This email was sent because you joined a Secret Santa group organized
          with SantaWheel. Don&apos;t want to take part?
        </p>
        <div className="mt-3">
          <RemoveMeButton
            removeToken={signToken({ t: "r", x: payload.x, p: payload.p })}
          />
        </div>
      </div>

      <Watermark visible={!exchange.paid} />
    </section>
  );
}
