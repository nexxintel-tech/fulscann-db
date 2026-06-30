import Link from "next/link";

const bookDemoHref = "mailto:partners@fulscann.com?subject=Book%20a%20Fulscann%20Demo";
const heroCards = [
  { label: "Secure", description: "Protect access and control signals." },
  { label: "Intelligence", description: "Turn risk data into clear guidance." },
  { label: "Risk", description: "Monitor trust across your partner ecosystem." },
  { label: "Trust", description: "Build stronger credibility with stakeholders." },
];

export function HeroSection() {
  return (
    <section className="home-hero" aria-labelledby="home-hero-title">
      <div className="home-hero-blobs" aria-hidden="true">
        <span className="hero-blob blob-1" />
        <span className="hero-blob blob-2" />
        <span className="hero-blob blob-3" />
      </div>

      <div className="home-hero-copy">
        <span className="hero-pill">Trusted by businesses and institutions across Africa</span>
        <h1 id="home-hero-title">
          Ready To Scale, Get started with <span className="hero-trust">Trust</span>
        </h1>
        <p>
          Fulscann connects identity, compliance, risk, and intelligence infrastructure to help businesses prove trust and unlock growth.
        </p>

        <div className="home-hero-actions">
          <a className="button primary" href="https://verilab.fulscann.com/login?mode=create">
            Get started
          </a>
          <a className="button secondary" href={bookDemoHref}>
            Book a demo
          </a>
        </div>
      </div>

      <div className="home-hero-cards">
        {heroCards.map((card) => (
          <article key={card.label} className="hero-mini-card">
            <strong>{card.label}</strong>
            <p>{card.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
