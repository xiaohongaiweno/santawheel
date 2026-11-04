import Link from "next/link";

const items = [
  {
    href: "/",
    label: "Home",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 10.5 12 3l9 7.5M5 9.5V21h5v-6h4v6h5V9.5"
      />
    ),
  },
  {
    href: "/gift-exchange-generator/",
    label: "Gift Exchange",
    icon: (
      <>
        <rect x="3.5" y="8" width="17" height="12.5" rx="1.5" />
        <path d="M3.5 12h17M12 8v12.5" />
        <path d="M12 8c-1.5 0-4-1-4-2.8C8 3.9 9.3 3.4 10 4c1 .8 2 4 2 4Zm0 0c1.5 0 4-1 4-2.8C16 3.9 14.7 3.4 14 4c-1 .8-2 4-2 4Z" />
      </>
    ),
  },
  {
    href: "/",
    label: "Secret Santa",
    icon: (
      <>
        <circle cx="5" cy="12" r="1.6" />
        <circle cx="12" cy="12" r="1.6" />
        <circle cx="19" cy="12" r="1.6" />
      </>
    ),
  },
];

export default function BottomNav() {
  return (
    <nav
      aria-label="Bottom navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto grid max-w-md grid-cols-3">
        {items.map((item, i) => (
          <li key={item.label}>
            <Link
              href={item.href}
              aria-current={i === 0 ? "page" : undefined}
              className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium ${
                i === 0 ? "text-accent" : "text-muted"
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                {item.icon}
              </svg>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
