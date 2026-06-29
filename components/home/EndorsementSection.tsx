import { endorsements } from "@/lib/content/endorsements";

export function EndorsementSection() {
  return (
    <section className="home-endorsements" aria-labelledby="home-endorsements-title">
      <div className="section-header">
        <div>
          <span className="section-eyebrow">Trusted by leaders</span>
          <h2 id="home-endorsements-title">Endorsed by forward-thinking organizations</h2>
          <p>
            Leading businesses and institutions trust Fulscann to build safer, smarter, and more transparent ecosystems.
          </p>
        </div>
      </div>

      <div className="endorsement-grid">
        {endorsements.map((partner) => (
          <div key={partner} className="endorsement-card">
            {partner}
          </div>
        ))}
      </div>

      <p className="endorsement-note">
        Sample endorsement layout. Replace with confirmed partners before production launch.
      </p>
    </section>
  );
}
