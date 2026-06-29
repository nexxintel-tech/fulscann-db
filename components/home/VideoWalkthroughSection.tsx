import Link from "next/link";
import { homeVideos } from "@/lib/content/home-videos";

const featuredVideo = homeVideos[0];

export function VideoWalkthroughSection() {
  return (
    <section className="home-video" aria-labelledby="home-video-title">
      <div className="home-section-copy">
        <span className="section-eyebrow">How to use Fulscann</span>
        <h2 id="home-video-title">See how Fulscann works in just a few minutes.</h2>
        <p>{featuredVideo.description}</p>

        <div className="home-video-checklist">
          {featuredVideo.checklist.map((item) => (
            <div key={item} className="check-item">
              <span aria-hidden="true">✓</span>
              <p>{item}</p>
            </div>
          ))}
        </div>

        <a className="button primary" href={featuredVideo.ctaHref}>
          {featuredVideo.ctaLabel}
        </a>
      </div>

      <div className="home-video-card" aria-label="Video walkthrough placeholder">
        <div className="video-card-header">
          <span>{featuredVideo.eyebrow}</span>
          <small>{featuredVideo.duration}</small>
        </div>
        <div className="video-preview">
          <div className="video-playback">
            <button className="video-play-button" aria-label="Play walkthrough video">
              ▶
            </button>
          </div>
          <div className="video-dashboard">
            <div className="video-side-nav">
              <span>Overview</span>
              <span>Verifications</span>
              <span>Assessments</span>
              <span>Risk Intelligence</span>
              <span>Reports</span>
            </div>
            <div className="video-metrics">
              <div>
                <strong>VeriScore</strong>
                <span>82</span>
              </div>
              <div>
                <strong>IC Score</strong>
                <span>76</span>
              </div>
              <div>
                <strong>Evidence confidence</strong>
                <span>88%</span>
              </div>
              <div>
                <strong>Integrity Report</strong>
                <span>82/100</span>
              </div>
            </div>
            <div className="video-trend">
              <span />
              <span />
              <span />
              <span />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
