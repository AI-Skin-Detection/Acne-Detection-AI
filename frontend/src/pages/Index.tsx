import AcneDetector from '@/components/AcneDetector';
import StaticHero from '@/components/StaticHero';
import HowItWorks from '@/components/HowItWorks';
import AcneTypes from '@/components/AcneTypes';
import About from '@/components/About';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';

const Index = () => {
  return (
    <div className="min-h-screen bg-background relative">
      <Navbar />
      <StaticHero />
      <AcneDetector />
      <HowItWorks />
      <AcneTypes />
      <About />
      <Footer />
    </div>
  );
};

export default Index;
