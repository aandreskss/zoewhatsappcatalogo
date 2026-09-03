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

          {/* Slide panel */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "290px",
              height: "100vh",
              zIndex: 10,
              display: "flex",
              flexDirection: "column",
              backgroundColor: "#ffffff",
              boxShadow: "4px 0 24px rgba(0,0,0,0.15)",
              transform: open ? "translateX(0)" : "translateX(-100%)",
              transition: "transform 280ms ease-out",
            }}
          >
            {/* Cabecera */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #F0D8E8", flexShrink: 0 }}>
              <Link href="/" onClick={closeMenu}>
                <Image src="/logo.jpeg" alt="Zoe Shop" width={90} height={36} className="h-9 w-auto rounded-sm" />
              </Link>
              <button
                onClick={closeMenu}
                aria-label="Cerrar menú"
                style={{ width: 36, height: 36, borderRadius: 10, background: "#F9F4F7", display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer" }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 1l12 12M13 1L1 13" stroke="#29252A" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Links */}
            <nav style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
              {navItems.map((item) => (
                <Link
                  key={item.href + item.label}
                  href={item.href}
                  onClick={closeMenu}
                  style={{ display: "flex", alignItems: "center", padding: "14px 16px", borderRadius: 12, fontSize: 15, fontWeight: 500, color: "#29252A", textDecoration: "none" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#FDF4F9"; e.currentTarget.style.color = "#7B1847"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#29252A"; }}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Pie */}
            <div style={{ borderTop: "1px solid #F0D8E8", padding: "20px 24px", flexShrink: 0 }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#7B1847", marginBottom: 6 }}>Encuéntranos</p>
              <p style={{ fontSize: 12, color: "rgba(41,37,42,0.55)", lineHeight: 1.6 }}>C.C. ilduomo, Valencia<br />Av. Bolívar Norte, Valencia</p>
              <a href="https://www.instagram.com/Zoe_dist" target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", marginTop: 8, fontSize: 12, fontWeight: 600, color: "#7B1847" }}>@Zoe_dist</a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
