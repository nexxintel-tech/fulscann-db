import type { Metadata } from "next";
import type { ReactNode } from "react";
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
          <main className="main">{children}</main>
        </div>
      </body>
    </html>
  );
}
