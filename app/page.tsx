import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import InfoSection from "@/components/InfoSection";
import HubungiSection from "@/components/HubungiSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="relative">
      <Navbar />
      <Hero />

      <section className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2.4fr_1fr]">
          <InfoSection />
          <HubungiSection />
        </div>
      </section>

      <Footer />
    </main>
  );
}
