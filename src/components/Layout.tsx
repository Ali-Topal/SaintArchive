import Link from "next/link";
import type { ReactNode } from "react";
import CartIcon from "./CartIcon";
import MenuButton from "./MenuButton";
import SilkBackground from "./SilkBackground";
import TopBlur from "./TopBlur";

type LayoutProps = {
  children: ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  const year = new Date().getFullYear();

  return (
    <div className="relative min-h-screen text-[#f5f5f5]">
      <SilkBackground speed={3.5} scale={1} color="#2c2a36" noiseIntensity={0.7} rotation={0} />
      {/* Top blur strip */}
      <TopBlur height="4.7rem" mobileHeight="3.2rem" strength={2} divCount={5} exponential />
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 pb-10 pt-8 sm:px-10 sm:pt-14 lg:px-14">
        <header className="flex items-center justify-between">
          <div className="w-10">
            <MenuButton />
          </div>
          <Link
            href="/"
            className="pl-2 text-xl font-semibold uppercase tracking-[0.4em] text-white sm:pl-0 sm:text-3xl sm:tracking-[0.8em]"
          >
            SAINT ARCHIVE
          </Link>
          <div className="w-10 flex justify-end">
            <CartIcon />
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
              Shipping &amp; Returns
            </Link>
          </div>
          <p className="mt-4 text-[#777]">© {year} Saint Archive. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
