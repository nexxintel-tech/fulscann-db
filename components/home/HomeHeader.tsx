import Link from "next/link";
import { LogoMark } from "@/components/home/LogoMark";

const bookDemoHref = "mailto:partners@fulscann.com?subject=Book%20a%20Fulscann%20Demo";

export function HomeHeader() {
  return (
    <header className="home-header">
      <div className="home-header-inner">
        <div className="home-header-logo">
          <LogoMark />
          <div>
            <strong>FULSCANN</strong>
            <span>Control intelligence for trust.</span>
          </div>
        </div>

        <nav className="home-nav" aria-label="Primary navigation">
          <Link href="#solutions">Solutions</Link>
          <Link href="#products">Products</Link>
          <Link href="#resources">Resources</Link>
          <Link href="#about">About Us</Link>
        </nav>

        <div className="home-header-actions">
          <a className="button secondary" href={bookDemoHref}>
            Book a demo
          </a>
          <Link className="button primary" href="/help/getting-started">
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
