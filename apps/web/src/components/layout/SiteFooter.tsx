import Link from "next/link";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "/track", label: "Track shipment" },
      { href: "/login", label: "Sign in" },
      { href: "/login", label: "Create account" },
    ],
  },
  {
    title: "Operators",
    links: [
      { href: "/login", label: "Operator portal" },
      { href: "/login", label: "Onboard your fleet" },
      { href: "/#", label: "API & integrations", soon: true },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "mailto:hello@tumanow.rw", label: "Contact" },
      { href: "/#", label: "About", soon: true },
      { href: "/#", label: "Support", soon: true },
    ],
  },
] as const;

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--tn-border-subtle)] bg-[var(--tn-sidebar-bg)] text-white">
      <div className="mx-auto max-w-[1200px] px-5 pt-14 pb-10 sm:px-8 lg:pt-16">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.35fr)_repeat(3,minmax(0,1fr))] lg:gap-10">
          <div className="max-w-sm">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--tn-primary)] text-sm font-bold text-white">
                TN
              </span>
              <span
                className="text-[1.05rem] font-bold tracking-tight"
                style={{ fontFamily: "var(--font-display)" }}
              >
                TumaNow
              </span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-white/60">
              Multi-company courier & delivery infrastructure for Rwanda —
              partner fleets on one shared platform.
            </p>
            <p className="mt-5 text-sm text-white/45">
              <a
                href="mailto:hello@tumanow.rw"
                className="transition-colors hover:text-[var(--tn-accent)]"
              >
                hello@tumanow.rw
              </a>
              <span className="mx-2 text-white/25">·</span>
              Kigali, Rwanda
            </p>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.title}>
              <p
                className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-white/40"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {column.title}
              </p>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={`${column.title}-${link.label}`}>
                    {"soon" in link && link.soon ? (
                      <span className="inline-flex items-center gap-2 text-sm text-white/35">
                        {link.label}
                        <span className="rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/30 ring-1 ring-white/15">
                          Soon
                        </span>
                      </span>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm text-white/70 transition-colors hover:text-white"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} TumaNow. All rights reserved.</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <span className="cursor-default">Privacy</span>
            <span className="cursor-default">Terms</span>
            <Link href="/track" className="transition-colors hover:text-white/70">
              Track
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
