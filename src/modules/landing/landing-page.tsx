import './landing.css';
import { FeatureSection } from './components/features-section';
import { FAQSection } from './components/faq-section';
import { FinalCTASection } from './components/final-cta';
import { GetStartedSection } from './components/get-started-section';
import { HeroSection } from './components/hero-section';
import { HowItWorksSection } from './components/how-it-works';
import { LandingFooter } from './components/landing-footer';
import { LandingHeader } from './components/landing-header';
import { PackagesSection } from './components/packages-section';
import { ProductShowcase } from './components/product-showcase';
import { SecuritySection } from './components/security-section';
import { TrustStrip } from './components/trust-strip';
import { ValuePropositionSection } from './components/value-section';

export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <LandingHeader />
      <main id="main-content" className="flex-1">
        <HeroSection />
        <TrustStrip />
        <ValuePropositionSection />
        <HowItWorksSection />
        <GetStartedSection />
        <ProductShowcase />
        <FeatureSection />
        <PackagesSection />
        <SecuritySection />
        <FAQSection />
        <FinalCTASection />
      </main>
      <LandingFooter />
    </div>
  );
}
