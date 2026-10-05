import Image from "next/image";

export function AuthHeroPanel() {
  return (
    <div className="auth-hero relative h-full min-h-dvh w-full overflow-hidden bg-[#1a2332]">
      <Image
        src="/hero-delivery-hd.jpg"
        alt=""
        fill
        priority
        quality={92}
        sizes="(max-width: 1024px) 100vw, 60vw"
        className="object-cover object-[center_22%]"
      />
      <div
        className="absolute inset-0 bg-[linear-gradient(160deg,rgba(26,35,50,0.18)_0%,rgba(26,35,50,0.45)_42%,rgba(26,35,50,0.88)_100%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_70%_20%,rgba(232,93,4,0.18),transparent_55%)]"
        aria-hidden
      />

      <div className="relative z-10 flex h-full min-h-dvh flex-col justify-end px-10 pb-12 pt-10 xl:px-14 xl:pb-16">
        <p className="mb-3 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-[var(--tn-accent)]">
          Delivery
        </p>
        <h2
          className="max-w-lg text-[clamp(1.75rem,3vw,2.65rem)] font-bold leading-[1.15] tracking-tight text-white"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Partner fleets, not a single courier pool
        </h2>
        <ul className="mt-6 max-w-md space-y-2.5 text-[0.95rem] text-white/88">
          <li className="flex items-start gap-2.5">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--tn-primary)]" />
            On-demand pickup and drop-off
          </li>
          <li className="flex items-start gap-2.5">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--tn-primary)]" />
            Live rider tracking and proof of delivery
          </li>
          <li className="flex items-start gap-2.5">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--tn-primary)]" />
            Multi-company logistics infrastructure for Rwanda
          </li>
        </ul>
      </div>
    </div>
  );
}
