import Link from "next/link";

export function HomeFooter() {
  return (
    <footer className="home-footer" aria-labelledby="footer-heading">
      <div className="footer-brand">
        <div className="footer-brand-mark" />
        <div>
          <strong>FULSCANN</strong>
          <p>Control intelligence for trust.</p>
        </div>
      </div>

      <div className="footer-grid">
        <div>
          <h3>Platform</h3>
          <Link href="#how-it-works">How it works</Link>
          <Link href="#solutions">Solutions</Link>
          <Link href="#products">Products</Link>
          <Link href="#security">Security</Link>
        </div>
        <div>
          <h3>Resources</h3>
          <Link href="/help/getting-started">Insights</Link>
          <Link href="/help/getting-started">Help Center</Link>
          <Link href="#guides">Guides</Link>
          <Link href="/ic">Developers</Link>
        </div>
        <div>
          <h3>Company</h3>
          <Link href="#about">About Us</Link>
          <Link href="#careers">Careers</Link>
          <Link href="#partners">Partners</Link>
          <Link href="#contact">Contact Us</Link>
        </div>
        <div className="footer-subscribe">
          <span>Get insights on trust, control, and SME readiness.</span>
          <div className="footer-subscribe-form">
            <input type="email" placeholder="Enter your email" aria-label="Email address" />
            <button type="button" aria-label="Subscribe">→</button>
          </div>
          <div className="footer-social">
            <a href="#" aria-label="LinkedIn">LinkedIn</a>
            <a href="#" aria-label="X">X</a>
            <a href="#" aria-label="YouTube">YouTube</a>
          </div>
        </div>
      </div>

      <div className="footer-credit">
        © 2026 Fulscann Technologies Ltd. All rights reserved.
      </div>
    </footer>
  );
}
