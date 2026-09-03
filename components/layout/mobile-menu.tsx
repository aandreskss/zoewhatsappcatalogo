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
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setOpen(true));
    });
  }

  function closeMenu() {
    setOpen(false);
    setTimeout(() => setVisible(false), 300);
  }

  return (
    <>
      {/* Hamburger button */}
      <button
        type="button"
        onClick={openMenu}
        aria-label="Abrir menú"
        className="md:hidden flex flex-col gap-[5px] w-10 h-10 items-center justify-center rounded-full hover:bg-[#F0D8E8] transition-colors"
      >
        <span className="block w-5 h-[1.5px] bg-[#29252A]" />
        <span className="block w-5 h-[1.5px] bg-[#29252A]" />
        <span className="block w-3.5 h-[1.5px] bg-[#29252A]" />
      </button>

      {/* Drawer overlay */}
      {visible && (
        <div
          className="fixed inset-0 z-[60] flex"
          aria-modal="true"
          role="dialog"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 transition-opacity duration-300"
            style={{
              backgroundColor: "rgba(41,37,42,0.45)",
              opacity: open ? 1 : 0,
            }}
            onClick={closeMenu}
          />

          {/* Panel */}
          <div
            className="relative flex h-full w-[280px] flex-col bg-[#FDF8FB] shadow-2xl transition-transform duration-300 ease-out"
            style={{ transform: open ? "translateX(0)" : "translateX(-100%)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#EBE0E7]">
              <Link href="/" onClick={closeMenu} className="flex items-center gap-2.5">
                <Image
                  src="/logo.jpeg"
                  alt="Zoe Shop"
                  width={80}
                  height={32}
                  className="h-8 w-auto rounded-sm"
                />
              </Link>
              <button
                onClick={closeMenu}
                aria-label="Cerrar menú"
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[#F0D8E8] transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#29252A" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto px-4 py-4">
              {navItems.map((item) => (
                <Link
                  key={item.href + item.label}
                  href={item.href}
                  onClick={closeMenu}
                  className="flex items-center py-3.5 px-2 text-[15px] font-medium text-[#29252A] border-b border-[#EBE0E7] last:border-0 hover:text-[#7B1847] transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Footer */}
            <div className="px-6 py-5 border-t border-[#EBE0E7]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#7B1847] mb-2">
                Encuéntranos
              </p>
              <p className="text-xs text-[#29252A]/60 leading-relaxed">
                C.C. ilduomo, Valencia<br />
                Av. Bolívar Norte, Valencia
              </p>
              <p className="text-xs text-[#29252A]/60 mt-2">@Zoe_dist</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
