import { HomeHeader } from "@/components/home/HomeHeader";
import { HeroSection } from "@/components/home/HeroSection";
import { VideoWalkthroughSection } from "@/components/home/VideoWalkthroughSection";
import { EndorsementSection } from "@/components/home/EndorsementSection";
import { BlogSection } from "@/components/home/BlogSection";
import { HomeCtaBand } from "@/components/home/HomeCtaBand";
import { HomeFooter } from "@/components/home/HomeFooter";

export default function HomePage() {
  return (
    <main className="home-page">
      <HomeHeader />
      <div className="home-page-shell">
        <HeroSection />
        <VideoWalkthroughSection />
        <EndorsementSection />
        <BlogSection />
        <HomeCtaBand />
      </div>
      <HomeFooter />
    </main>
  );
}
