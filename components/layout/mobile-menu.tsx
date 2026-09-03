"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";

export function MobileMenu({
  categories,
  navLinks,
}: {
  categories: { name: string; slug: string }[];
  navLinks: { label: string; href: string }[];
}) {
  const [open, setOpen] = React.useState(false);
  const [visible, setVisible] = React.useState(false);

  const navItems = [
    ...navLinks,
    ...categories.map((c) => ({ label: c.name, href: `/categoria/${c.slug}` })),
  ];

  function openMenu() {
    setVisible(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setOpen(true)));
  }

  function closeMenu() {
    setOpen(false);
    setTimeout(() => setVisible(false), 280);
  }

  return (
    <>
      {/* ── Hamburger button ── */}
      <button
        type="button"
        onClick={openMenu}
        aria-label="Abrir menú"
        className="md:hidden relative flex h-10 w-10 items-center justify-center rounded-xl hover:bg-[#F0D8E8] transition-colors"
      >
        <svg width="22" height="16" viewBox="0 0 22 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect y="0" width="22" height="2" rx="1" fill="#29252A"/>
          <rect y="7" width="22" height="2" rx="1" fill="#29252A"/>
          <rect y="14" width="15" height="2" rx="1" fill="#29252A"/>
        </svg>
      </button>

      {/* ── Drawer ── */}
      {visible && (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div
            onClick={closeMenu}
            className="absolute inset-0"
            style={{
              backgroundColor: "rgba(41,37,42,0.5)",
              opacity: open ? 1 : 0,
              transition: "opacity 280ms ease",
            }}
          />

          {/* Slide panel — z-10 garantiza que queda SOBRE el backdrop */}
          <div
            className="absolute inset-y-0 left-0 z-10 flex w-[290px] flex-col overflow-hidden shadow-2xl"
            style={{
              backgroundColor: "#ffffff",
              transform: open ? "translateX(0)" : "translateX(-100%)",
              transition: "transform 280ms ease-out",
            }}
          >
            {/* Panel header */}
            <div className="flex items-center justify-between border-b border-[#F0D8E8] px-5 py-4">
              <Link href="/" onClick={closeMenu} className="flex items-center">
                <Image
                  src="/logo.jpeg"
                  alt="Zoe Shop"
                  width={90}
                  height={36}
                  className="h-9 w-auto rounded-sm"
                />
              </Link>
              <button
                onClick={closeMenu}
                aria-label="Cerrar menú"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F9F4F7] hover:bg-[#F0D8E8] transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 1l12 12M13 1L1 13" stroke="#29252A" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex-1 overflow-y-auto px-3 py-3">
              {navItems.map((item) => (
                <Link
                  key={item.href + item.label}
                  href={item.href}
                  onClick={closeMenu}
                  className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-[15px] font-medium text-[#29252A] hover:bg-[#FDF4F9] hover:text-[#7B1847] transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Footer */}
            <div className="border-t border-[#F0D8E8] px-6 py-5">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#7B1847]">
                Encuéntranos
              </p>
              <p className="text-xs leading-relaxed text-[#29252A]/55">
                C.C. ilduomo, Valencia<br />
                Av. Bolívar Norte, Valencia
              </p>
              <a
                href="https://www.instagram.com/Zoe_dist"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-[#7B1847]"
              >
                @Zoe_dist
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
