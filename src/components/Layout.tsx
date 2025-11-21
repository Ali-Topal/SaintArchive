import Link from "next/link";
import type { ReactNode } from "react";
import { Instagram, Music2 } from "lucide-react";

type LayoutProps = {
  children: ReactNode;
};

const navItems = [
  { href: "/", label: "Home" },
  { href: "/winners", label: "Winners" },
  { href: "/info", label: "How it Works" },
];

const socialLinks = [
  {
    href: "https://instagram.com/saintarchive88",
    label: "Instagram",
    Icon: Instagram,
  },
  {
    href: "https://tiktok.com/@saintarchive88",
    label: "TikTok",
    Icon: Music2,
  },
];

export default function Layout({ children }: LayoutProps) {
  const year = new Date().getFullYear();

  return (
    <div className="bg-[#0a0a0a] text-[#f5f5f5]">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-12 px-6 py-10 sm:px-10 lg:px-14">
        <header className="flex flex-col items-center gap-8 text-center">
          <Link
            href="/"
            className="text-3xl font-semibold uppercase tracking-[0.8em] text-white"
          >
            SAINT ARCHIVE
          </Link>
          <div className="flex w-full flex-col items-center gap-4 md:grid md:grid-cols-[1fr_auto_1fr] md:items-center">
            <div className="hidden md:block" aria-hidden="true" />
            <nav className="flex flex-wrap justify-center gap-5 text-base pb-4 md:pb-0">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-white/80 transition hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-4 md:justify-end">
              {socialLinks.map(({ href, label, Icon }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex items-center gap-2 text-white opacity-80 transition-opacity duration-200 hover:opacity-100"
                >
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </a>
              ))}
            </div>
          </div>
        </header>

        <main className="flex-1 space-y-10">{children}</main>

        <footer className="pt-8 text-center text-xs text-white/60">
          <div className="flex flex-col items-center gap-3 text-[#777] sm:flex-row sm:justify-center sm:space-x-6">
            <Link href="/faq" className="hover:text-white">
              FAQ
            </Link>
            <Link href="/terms" className="hover:text-white">
              Terms &amp; Conditions
            </Link>
            <Link href="/privacy" className="hover:text-white">
              Privacy Policy
            </Link>
            <Link href="/shipping" className="hover:text-white">
              Shipping &amp; Fulfilment
            </Link>
          </div>
          <p className="mt-4 text-[#777]">© {year} Lucian Saint Raffles. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}

