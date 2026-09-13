"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";

import { SiteFooter } from "@/components/layout/SiteFooter";

const STEPS = [
  {
    n: "01",
    title: "Request",
    body: "Customers describe the package, pickup, and drop-off. TumaNow validates the shipment.",
  },
  {
    n: "02",
    title: "Match",
    body: "Eligible operators appear based on coverage, package limits, and the services they support.",
  },
  {
    n: "03",
    title: "Deliver",
    body: "Dispatch, live tracking, and proof of delivery — one lifecycle every partner shares.",
  },
];

const AUDIENCES = [
  {
    title: "For logistics operators",
    body: "Onboard your riders, set coverage and pricing, and run deliveries without building software from scratch.",
    href: "/login",
    cta: "Operator sign in",
  },
  {
    title: "For customers",
    body: "Send documents, parcels, or specialty goods. Compare partners, pay, and track with one number.",
    href: "/track",
    cta: "Track a shipment",
  },
];

export function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="landing min-h-dvh bg-[var(--background)] text-[var(--foreground)]">
      <header
        className={`landing-nav fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-300 ${
          scrolled
            ? "border-b border-[var(--tn-border-subtle)] bg-[color-mix(in_srgb,var(--background)_88%,transparent)] backdrop-blur-md"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5">
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
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/track"
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-[var(--foreground)]/80 transition-colors hover:text-[var(--foreground)] sm:inline-flex"
            >
              Track
            </Link>
            <Link
              href="/login"
              className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[var(--tn-primary)] px-4 text-sm font-medium text-white transition-[background-color,transform] duration-150 hover:bg-[var(--tn-primary-dark)] active:scale-[0.98]"
            >
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative grid min-h-dvh lg:grid-cols-2">
        <div className="landing-fade relative z-10 order-2 flex flex-col justify-end bg-[var(--background)] px-5 pb-14 pt-10 sm:px-10 sm:pb-20 lg:order-1 lg:justify-center lg:px-14 lg:pb-24 lg:pt-24 xl:px-20">
          <p
            className="landing-fade-delay-1 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-[var(--tn-primary)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Delivery platform
          </p>
          <h1
            className="landing-fade-delay-2 mt-4 max-w-[14ch] text-[clamp(2.75rem,7vw,4.75rem)] font-bold leading-[0.95] tracking-[-0.04em] text-[var(--foreground)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            TumaNow
          </h1>
          <p className="landing-fade-delay-3 mt-5 max-w-[32rem] text-[1.05rem] leading-relaxed text-[var(--tn-muted)] sm:text-lg">
            Shared logistics infrastructure for Rwanda — partner fleets, not a
            single courier pool.
          </p>
          <div className="landing-fade-delay-4 mt-9 flex flex-wrap items-center gap-3">
            <Link
              href="/login"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[var(--tn-primary)] px-6 text-[0.95rem] font-medium text-white transition-[background-color,transform] duration-150 hover:bg-[var(--tn-primary-dark)] active:scale-[0.98]"
            >
              Get started
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/track"
              className="inline-flex min-h-12 items-center justify-center rounded-lg border border-[var(--tn-border)] bg-transparent px-6 text-[0.95rem] font-medium text-[var(--foreground)] transition-[background-color,border-color] duration-150 hover:border-[var(--tn-primary)]/40 hover:bg-[color-mix(in_srgb,var(--tn-accent)_28%,transparent)]"
            >
              Track shipment
            </Link>
          </div>
        </div>

        <div className="relative order-1 min-h-[52vh] overflow-hidden lg:order-2 lg:min-h-dvh">
          <Image
            src="/hero-delivery-hd.jpg"
            alt="Courier handing a package to a customer on a city street"
            fill
            priority
            quality={90}
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="landing-hero-media object-cover object-[center_20%]"
          />
          <div
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(251,247,244,0.72),transparent_38%)] lg:bg-[linear-gradient(to_right,rgb(251,247,244)_0%,rgba(251,247,244,0.55)_8%,transparent_22%)]"
            aria-hidden
          />
        </div>
      </section>

      {/* Who it's for */}
      <section className="border-t border-[var(--tn-border-subtle)] bg-[color-mix(in_srgb,var(--page-bg)_55%,var(--background))]">
        <div className="mx-auto grid max-w-[1200px] gap-12 px-5 py-20 sm:px-8 lg:grid-cols-2 lg:gap-20 lg:py-28">
          {AUDIENCES.map((item) => (
            <div key={item.title} className="max-w-md">
              <h2
                className="text-2xl font-bold tracking-tight sm:text-[1.75rem]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {item.title}
              </h2>
              <p className="mt-3 text-[0.98rem] leading-relaxed text-[var(--tn-muted)]">
                {item.body}
              </p>
              <Link
                href={item.href}
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--tn-primary)] transition-colors hover:text-[var(--tn-primary-dark)]"
              >
                {item.cta}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-[var(--tn-border-subtle)]">
        <div className="mx-auto max-w-[1200px] px-5 py-20 sm:px-8 lg:py-28">
          <div className="max-w-xl">
            <h2
              className="text-2xl font-bold tracking-tight sm:text-3xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              One lifecycle. Many operators.
            </h2>
            <p className="mt-3 text-[0.98rem] leading-relaxed text-[var(--tn-muted)]">
              Configuration-driven matching keeps every company on the same rails
              — without forcing identical businesses into identical rules.
            </p>
          </div>

          <ol className="mt-14 grid gap-10 sm:grid-cols-3 sm:gap-8">
            {STEPS.map((step) => (
              <li key={step.n} className="relative">
                <span
                  className="block text-[2.5rem] font-bold leading-none tracking-tight text-[color-mix(in_srgb,var(--tn-accent)_70%,var(--tn-primary))]"
                  style={{ fontFamily: "var(--font-display)" }}
                  aria-hidden
                >
                  {step.n}
                </span>
                <h3
                  className="mt-4 text-lg font-semibold tracking-tight"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--tn-muted)]">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Network visual — full-bleed */}
      <section className="relative min-h-[min(72vh,640px)] overflow-hidden">
        <Image
          src="/network-riders-hd.jpg"
          alt="Delivery riders on motorcycles moving through the city"
          fill
          quality={88}
          sizes="100vw"
          className="object-cover object-center"
        />
        <div
          className="absolute inset-0 bg-[linear-gradient(105deg,rgba(26,35,50,0.92)_0%,rgba(26,35,50,0.72)_42%,rgba(26,35,50,0.28)_100%)]"
          aria-hidden
        />
        <div className="relative z-10 mx-auto flex min-h-[min(72vh,640px)] max-w-[1200px] items-end px-5 py-16 sm:px-8 lg:py-20">
          <div className="max-w-xl text-white">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-[var(--tn-accent)]">
              Product principle
            </p>
            <blockquote
              className="mt-4 text-[clamp(1.35rem,3vw,2.1rem)] font-semibold leading-snug tracking-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Build reusable capabilities once, then let operators configure and
              combine them to fit their businesses.
            </blockquote>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-white/70">
              From motorcycle couriers to national logistics companies — same
              platform, different configurations.
            </p>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="border-t border-[var(--tn-border-subtle)]">
        <div className="mx-auto flex max-w-[1200px] flex-col items-start justify-between gap-8 px-5 py-20 sm:px-8 lg:flex-row lg:items-end lg:py-24">
          <div className="max-w-lg">
            <h2
              className="text-2xl font-bold tracking-tight sm:text-3xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Ready to move with the network?
            </h2>
            <p className="mt-3 text-[0.98rem] leading-relaxed text-[var(--tn-muted)]">
              Sign in to manage operators and shipments, or track a package with
              a public tracking number.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/login"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[var(--tn-primary)] px-6 text-sm font-medium text-white transition-[background-color,transform] duration-150 hover:bg-[var(--tn-primary-dark)] active:scale-[0.98]"
            >
              Sign in
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/track"
              className="inline-flex min-h-12 items-center justify-center rounded-lg border border-[var(--tn-border)] px-6 text-sm font-medium transition-colors hover:border-[var(--tn-primary)]/40"
            >
              Track shipment
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
