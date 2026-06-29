import Link from "next/link";

const bookDemoHref = "mailto:partners@fulscann.com?subject=Book%20a%20Fulscann%20Demo";

export function HomeCtaBand() {
  return (
    <section className="home-cta-band" aria-labelledby="home-cta-title">
      <div>
        <h2 id="home-cta-title">Ready to scale with trust?</h2>
        <p>Join organizations building secure, compliant, and intelligent business ecosystems with Fulscann.</p>
      </div>
      <div className="home-cta-actions">
        <Link className="button secondary" href={bookDemoHref}>
          Book a demo
        </Link>
        <Link className="button primary" href="/help/getting-started">
          Get started now
        </Link>
      </div>
    </section>
  );
}
