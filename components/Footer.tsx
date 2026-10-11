import { Mail } from "lucide-react";

const LINKS = ["Tentang Kami", "Syarat & Ketentuan", "Kebijakan Privasi"];

// Instagram and LinkedIn are drawn as inline SVGs instead of imported from
// lucide-react, since newer lucide-react versions (1.x) removed brand/logo
// icons for trademark reasons. This keeps the footer stable regardless of
// which lucide-react version ends up installed.
function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function LinkedinIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8h4V23h-4V8zM8.5 8h3.84v2.05h.05c.53-1 1.84-2.05 3.79-2.05 4.05 0 4.8 2.67 4.8 6.14V23h-4v-6.84c0-1.63-.03-3.73-2.27-3.73-2.27 0-2.62 1.77-2.62 3.6V23h-4V8z" />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="mx-6 mb-6 rounded-3xl bg-brand-navy px-6 py-6 text-slate-200 sm:px-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
        <p className="text-sm text-slate-400">
          © 2024 Magang-ers. All rights reserved.
        </p>

        <ul className="flex flex-wrap items-center justify-center gap-6">
          {LINKS.map((link) => (
            <li key={link}>
              <a
                href="#"
                className="text-sm text-slate-300 transition-colors hover:text-white"
              >
                {link}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          {[InstagramIcon, LinkedinIcon, Mail].map((Icon, i) => (
            <a
              key={i}
              href="#"
              aria-label="Social link"
              className="grid h-8 w-8 place-items-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
            >
              <Icon className="h-4 w-4" />
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
