import React from 'react';
import { LegalHeading, LegalPage, LegalParagraph } from '@/components/layout/LegalPage';

export default function CookiesScreen() {
  return (
    <LegalPage title="Cookie Policy">
      <LegalHeading>Cookies & similar technologies</LegalHeading>
      <LegalParagraph>
        Prysym TV uses cookies and local storage to keep you signed in, remember preferences such as theme, and measure how the app is used.
      </LegalParagraph>
      <LegalHeading>Essential cookies</LegalHeading>
      <LegalParagraph>
        Required for authentication, security, and core playback features. These cannot be disabled while using the service.
      </LegalParagraph>
      <LegalHeading>Analytics</LegalHeading>
      <LegalParagraph>
        We may use analytics to understand feature usage and improve performance. You can limit tracking in your device settings where available.
      </LegalParagraph>
    </LegalPage>
  );
}
