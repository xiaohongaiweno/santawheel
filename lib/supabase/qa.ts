import { getSupabaseAdmin } from "@/lib/supabase/draw-service";
import { enqueueEmails } from "@/lib/email-queue";
import { signToken } from "@/lib/tokens";
import { answerLink, kindLabel, type ExchangeKind } from "@/lib/email-templates";

/**
 * Anonymous Q&A between a gifter and the person they are drawing.
 *
 * Identity is only ever resolved server-side from the HMAC token: the gifter
 * posts with their assignment token, the question is stored against their
 * pair, and the receiver is notified by email with a direct answer link that
 * identifies the question but never the asker. UI copy never exposes names.
 */

export const QUESTION_MAX_LEN = 500;
export const ANSWER_MAX_LEN = 1000;
/** Cap per pair so one gifter cannot spam their receiver. */
export const MAX_QUESTIONS_PER_PAIR = 10;

export interface QuestionRow {
  id: string;
  question_text: string;
  answer_text: string | null;
  created_at: string;
  answered_at: string | null;
}

/** Thrown as e.name for route-level mapping. */
export class QuestionError extends Error {}

/**
 * Ask an anonymous question as the gifter of `giverId`.
 * Returns the stored question. Enqueues the notification email to the
 * receiver (best-effort by the caller — a failed email still leaves the
 * question visible on the receiver's assignment page).
 */
export async function askAnonymousQuestion(input: {
  exchangeId: string;
  giverId: string;
  questionText: string;
}): Promise<QuestionRow> {
  const db = getSupabaseAdmin();
  const text = input.questionText.trim().slice(0, QUESTION_MAX_LEN);
  if (!text) throw new QuestionError("Question text is required");

  // Resolve the gifter's pair to find who the question is for.
  const { data: pair } = await db
    .from("pair")
    .select("receiver_id")
    .eq("exchange_id", input.exchangeId)
    .eq("giver_id", input.giverId)
    .maybeSingle();
  if (!pair) {
    throw new QuestionError("PAIR_NOT_FOUND: your assignment link is no longer valid");
  }

  const [{ data: receiver }, { data: exchange, error: exErr }, { count }] =
    await Promise.all([
      db
        .from("participant")
        .select("name, email, removed_at")
        .eq("id", pair.receiver_id)
        .single(),
      db
        .from("exchange")
        .select("title, kind, draw_generation")
        .eq("id", input.exchangeId)
        .single(),
      db
        .from("question")
        .select("id", { count: "exact", head: true })
        .eq("exchange_id", input.exchangeId)
        .eq("question_from", input.giverId),
    ]);

  if (!receiver || receiver.removed_at) {
    throw new QuestionError(
      "REMOVED: the person you are drawing has removed their data"
    );
  }
  if (exErr || !exchange) throw new QuestionError("Exchange not found");
  if ((count ?? 0) >= MAX_QUESTIONS_PER_PAIR) {
    throw new QuestionError(
      `LIMIT: you can ask up to ${MAX_QUESTIONS_PER_PAIR} questions per person`
    );
  }

  const { data: inserted, error } = await db
    .from("question")
    .insert({
      exchange_id: input.exchangeId,
      question_from: input.giverId,
      receiver_id: pair.receiver_id,
      question_text: text,
    })
    .select("id, question_text, answer_text, created_at, answered_at")
    .single();
  if (error || !inserted) {
    throw new Error(`insertQuestion failed: ${error?.message ?? "unknown"}`);
  }

  const kind = (exchange.kind as ExchangeKind) ?? "secret_santa";
  const receiverEmail = receiver.email as string | null;
  if (receiverEmail) {
    await enqueueEmails([
      {
        exchangeId: input.exchangeId,
        kind: "question",
        // Storing the receiver here means a GDPR removal also wipes the
        // pending notification (redactParticipant deletes by giver_id).
        giverId: pair.receiver_id,
        toEmail: receiverEmail,
        subject: `Anonymous question from your ${kindLabel(kind)}`,
        payload: {
          name: receiver.name as string,
          title: exchange.title as string,
          kind,
          question: text,
          token: signToken({
            t: "q",
            x: input.exchangeId,
            q: inserted.id as string,
          }),
          removeToken: signToken({
            t: "r",
            x: input.exchangeId,
            p: pair.receiver_id,
          }),
        },
      },
    ]);
  }

  return inserted as unknown as QuestionRow;
}

/**
 * Answer a question as its receiver. The answer email goes to the asker's
 * assignment inbox; the answer itself is also visible on the asker's page.
 */
export async function answerAnonymousQuestion(input: {
  exchangeId: string;
  receiverId: string;
  questionId: string;
  answerText: string;
}): Promise<QuestionRow> {
  const db = getSupabaseAdmin();
  const text = input.answerText.trim().slice(0, ANSWER_MAX_LEN);
  if (!text) throw new QuestionError("Answer text is required");

  const { data: question } = await db
    .from("question")
    .select("id, question_text, answer_text, question_from, answered_at")
    .eq("id", input.questionId)
    .eq("exchange_id", input.exchangeId)
    .eq("receiver_id", input.receiverId)
    .maybeSingle();
  if (!question) throw new QuestionError("Question not found");
  if (question.answer_text) {
    throw new QuestionError("ANSWERED: this question already has an answer");
  }

  const now = new Date().toISOString();
  const { error } = await db
    .from("question")
    .update({ answer_text: text, answered_at: now })
    .eq("id", input.questionId)
    .is("answer_text", null); // idempotent guard against double answers
  if (error) throw new Error(`answerQuestion failed: ${error.message}`);

  // Notify the asker. Their email lives on the participant row; if they have
  // none (private-link mode) they will see the answer on their page instead.
  const [{ data: asker }, { data: exchange }] = await Promise.all([
    db
      .from("participant")
      .select("name, email, removed_at")
      .eq("id", question.question_from)
      .single(),
    db
      .from("exchange")
      .select("kind, draw_generation")
      .eq("id", input.exchangeId)
      .single(),
  ]);

  if (asker && !asker.removed_at && asker.email && exchange) {
    const kind = (exchange.kind as ExchangeKind) ?? "secret_santa";
    await enqueueEmails([
      {
        exchangeId: input.exchangeId,
        kind: "answer",
        giverId: question.question_from as string,
        toEmail: asker.email as string,
        subject: `Your anonymous ${kindLabel(kind)} question was answered`,
        payload: {
          name: asker.name as string,
          kind,
          question: question.question_text as string,
          answer: text,
          token: signToken({
            t: "a",
            x: input.exchangeId,
            p: question.question_from as string,
            g: Number(exchange.draw_generation ?? 1),
          }),
          removeToken: signToken({
            t: "r",
            x: input.exchangeId,
            p: question.question_from as string,
          }),
        },
      },
    ]);
  }

  return {
    id: question.id as string,
    question_text: question.question_text as string,
    answer_text: text,
    created_at: "",
    answered_at: now,
  };
}

/** All questions a gifter has asked (with answers when they arrive). */
export async function questionsAskedBy(
  exchangeId: string,
  giverId: string
): Promise<QuestionRow[]> {
  const { data } = await getSupabaseAdmin()
    .from("question")
    .select("id, question_text, answer_text, created_at, answered_at")
    .eq("exchange_id", exchangeId)
    .eq("question_from", giverId)
    .order("created_at");
  return ((data ?? []) as unknown as QuestionRow[]).map((q) => ({
    ...q,
    // The answer page link is built by the caller; keep the row shape pure.
    id: q.id,
  }));
}

/** Unanswered questions waiting for `receiverId` (their inbox on /a). */
export async function openQuestionsFor(
  exchangeId: string,
  receiverId: string
): Promise<QuestionRow[]> {
  const { data } = await getSupabaseAdmin()
    .from("question")
    .select("id, question_text, answer_text, created_at, answered_at")
    .eq("exchange_id", exchangeId)
    .eq("receiver_id", receiverId)
    .is("answer_text", null)
    .order("created_at");
  return (data ?? []) as unknown as QuestionRow[];
}

/** Convenience for the email CTA: absolute answer URL for one question. */
export function answerUrlFor(exchangeId: string, questionId: string): string {
  return answerLink(exchangeId, questionId);
}
