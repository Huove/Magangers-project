"use client";
import Image from "next/image";

import { ArrowRight, Menu, X } from "lucide-react";
import { useState } from "react";

const NAV_LINKS = [
  { label: "Informasi", href: "/#informasi" },
  { label: "Hubungi", href: "/#hubungi" },
  { label: "Masuk", href: "/masuk" },
];

type NavbarProps = {
  ctaLabel?: string;
  ctaHref?: string;
};

export default function Navbar({
  ctaLabel = "Daftar Sekarang",
  ctaHref = "/register",
}: NavbarProps) {
  const [open, setOpen] = useState(false);

  return (
    <header className="absolute top-4 left-1/2 z-30 w-[95%] max-w-7xl -translate-x-1/2 rounded-2xl bg-white/90 px-5 py-3 shadow-sm backdrop-blur-md sm:px-8">
      <nav className="flex items-center justify-between">
        {/* Logo */}
        <a href="#top" className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="Logo Magang-ers"
            width={36}
            height={36}
            className="h-9 w-9 object-contain"
          />
          <span className="text-lg font-bold text-slate-900">
            Magang-ers
          </span>
        </a>

        {/* Desktop links */}
        <ul className="hidden items-center gap-10 md:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                className="text-sm font-medium text-slate-700 transition-colors hover:text-brand-blue"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <a
          href={ctaHref}
          className="hidden items-center gap-2 rounded-full bg-brand-blue px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition-transform hover:-translate-y-0.5 hover:bg-blue-700 md:inline-flex"
        >
          {ctaLabel}
          <ArrowRight className="h-4 w-4" />
        </a>

        {/* Mobile toggle */}
        <button
          className="md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Buka menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="mt-4 flex flex-col gap-4 border-t border-slate-100 pt-4 md:hidden">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-slate-700"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <a
            href={ctaHref}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-blue px-5 py-2.5 text-sm font-semibold text-white"
          >
            {ctaLabel}
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      )}
    </header>
  );
}
