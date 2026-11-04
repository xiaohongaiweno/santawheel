import Link from "next/link";

export default function Watermark({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <p className="mt-10 border-t border-border pt-4 text-center text-xs text-muted">
      Made with SantaWheel ·{" "}
      <Link href="/" className="underline decoration-border underline-offset-2 hover:text-accent">
        Create your own
      </Link>
    </p>
  );
}
