import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fulscann-DB",
  description: "Control intelligence and SME trust infrastructure."
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <div className="shell">
          <header className="topbar">
            <Link href="/" className="brand">
              <strong>Fulscann-DB</strong>
              <span>Trust, risk, readiness, and ranking intelligence</span>
            </Link>
            <nav className="nav" aria-label="Primary navigation">
              <Link href="/dashboard/super-admin">Super Admin</Link>
              <Link href="/dashboard/analyst">Analyst</Link>
              <Link href="/dashboard/ceo">CEO</Link>
              <Link href="/dashboard/staff">Staff</Link>
              <Link href="/institution">Institution</Link>
            </nav>
          </header>
          <main className="main">{children}</main>
        </div>
      </body>
    </html>
  );
}
