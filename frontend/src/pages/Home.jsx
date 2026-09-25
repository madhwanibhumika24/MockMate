import Features from "../components/home/Features.jsx";
import FinalCta from "../components/home/FinalCta.jsx";
import Hero from "../components/home/Hero.jsx";
import HowItWorks from "../components/home/HowItWorks.jsx";
import QuoteBanner from "../components/home/QuoteBanner.jsx";
import Support from "../components/home/Support.jsx";

function Home() {
  return (
    <div className="relative overflow-hidden">
      {/* Decorative background accents */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-32 -left-24 h-96 w-96 rounded-full bg-brand-200/40 dark:bg-brand-700/30 blur-3xl" />
        <div className="absolute top-1/3 -right-24 h-96 w-96 rounded-full bg-brand-100/60 dark:bg-brand-800/30 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 sm:pt-20">
        <Hero />
      </div>

      <Features />
      <QuoteBanner />
      <HowItWorks />
      <FinalCta />
      <Support />
    </div>
  );
}

export default Home;
