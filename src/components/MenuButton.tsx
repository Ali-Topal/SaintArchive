"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Instagram, Music2 } from "lucide-react";

const navItems = [
  { href: "/", label: "Shop" },
  { href: "/about", label: "About" },
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

export default function MenuButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex h-10 w-10 items-center justify-start text-white/80 transition hover:text-white"
        aria-label="Open menu"
      >
        <Menu className="h-6 w-6" strokeWidth={1.5} />
      </button>

      {/* Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Menu panel */}
      <div
        className={`fixed left-0 top-0 z-50 flex h-full w-72 flex-col bg-[#0a0a0a] px-8 py-10 shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          onClick={() => setIsOpen(false)}
          className="mb-12 flex h-10 w-10 items-center justify-start text-white/80 transition hover:text-white"
          aria-label="Close menu"
        >
          <X className="h-6 w-6" strokeWidth={1.5} />
        </button>

        <nav className="flex flex-col gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className="text-2xl font-light uppercase tracking-widest text-white/80 transition hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto flex items-center gap-5 pt-10">
          {socialLinks.map(({ href, label, Icon }) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="text-white/60 transition hover:text-white"
            >
              <Icon className="h-5 w-5" strokeWidth={1.5} />
            </a>
          ))}
        </div>
      </div>
    </>
  );
}
