import { verifyToken } from "@/lib/tokens";
import RemoveMeButton from "@/components/delivery/RemoveMeButton";

export const metadata = {
  title: "Remove your data",
  robots: { index: false, follow: false },
};

/**
 * GDPR removal page — the target of the "Remove your data" link in every
 * participant email footer. Confirm and delete without needing an account.
 */
export default async function RemovePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const payload = verifyToken(token);

  if (!payload || payload.t !== "r") {
    return (
      <section className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-bold">This link is not valid</h1>
        <p className="mt-3 text-sm text-muted">
          Check that you opened the full link from your email. If it was
          split across lines, copy the whole thing and paste it into your
          browser.
        </p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-md px-4 py-14">
      <h1 className="text-2xl font-bold tracking-tight">
        Remove your data from this draw
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-muted">
        This deletes your name, email, wishlist link and notes from this draw
        immediately. You will not receive any further emails for it, and your
        assignment link will stop working. This cannot be undone — if you
        still want to take part, close this page now.
      </p>
      <div className="mt-6">
        <RemoveMeButton removeToken={token} />
      </div>
    </section>
  );
}
