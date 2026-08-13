import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Zoe Shoes",
    template: "%s · Zoe Shoes",
  },
  description:
    "Catálogo de zapatos Zoe — encuentra tu talla y arma tu pedido para coordinarlo por WhatsApp.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-VE">
      <body>{children}</body>
    </html>
  );
}
