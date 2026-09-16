import Hero from "../components/home/Hero.jsx";
import HowItWorks from "../components/home/HowItWorks.jsx";
import StartInterviewForm from "../components/home/StartInterviewForm.jsx";

function Home() {
  return (
    <div className="relative overflow-hidden">
      {/* Decorative background accents */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-32 -left-24 h-96 w-96 rounded-full bg-brand-200/40 blur-3xl" />
        <div className="absolute top-1/3 -right-24 h-96 w-96 rounded-full bg-brand-100/60 blur-3xl" />
      </div>

      <div className="relative mx-auto grid max-w-6xl gap-16 px-4 pb-16 pt-10 sm:px-6 sm:pt-12 lg:grid-cols-2 lg:items-start lg:pt-16">
        <Hero />
        <StartInterviewForm />
      </div>

      <HowItWorks />
    </div>
  );
}

export default Home;
