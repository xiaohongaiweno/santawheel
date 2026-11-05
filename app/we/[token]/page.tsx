import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DraftBoard from "@/components/we/DraftBoard";
import { loadWeContext, toBoardView, WeGameError } from "@/lib/supabase/we-flow";
import { exchangeIdFromBoardToken } from "@/lib/we-token";

export const metadata: Metadata = {
  title: "White elephant draft board",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Shared white elephant board, reached from the board link. Private by design:
 * noindex/nofollow and never linked from the marketing pages.
 */
export default async function WhiteElephantBoardPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const exchangeId = exchangeIdFromBoardToken(token);
  if (!exchangeId) notFound();

  try {
    const view = toBoardView(await loadWeContext(exchangeId));
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-8">
        <DraftBoard token={token} initial={view} />
      </div>
    );
  } catch (e) {
    if (e instanceof WeGameError) notFound();
    throw e;
  }
}
