import type { Metadata } from 'next';
import { LandingPage } from '@/modules/landing';
import { BRAND_NAME } from '@/lib/brand';

export const metadata: Metadata = {
  title: {
    absolute: `EDI 837P Claims Scrubber | ${BRAND_NAME}`,
  },
  description: `Validate professional healthcare claims, review structured validation findings, and manage your claim-processing workflow with ${BRAND_NAME}.`,
  openGraph: {
    title: `EDI 837P Claims Scrubber | ${BRAND_NAME}`,
    description: `Validate professional healthcare claims, review structured validation findings, and manage your claim-processing workflow with ${BRAND_NAME}.`,
    type: 'website',
  },
};

export default function Home() {
  return <LandingPage />;
}
