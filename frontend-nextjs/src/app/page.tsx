export const dynamic = "force-dynamic";

import Header from "@/components/Header";
import Hero from "@/components/Hero";
import CategoryBar from "@/components/CategoryBar";
import FeaturedCourses from "@/components/FeaturedCourses";
import TrustSection from "@/components/TrustSection";
import CTABanner from "@/components/CTABanner";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <CategoryBar />
        <FeaturedCourses />
        <TrustSection />
        <CTABanner />
      </main>
      <Footer />
    </>
  );
}
