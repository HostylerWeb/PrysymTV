import React from 'react';
import { LegalHeading, LegalPage, LegalParagraph } from '@/components/layout/LegalPage';

export default function TermsScreen() {
  return (
    <LegalPage title="Terms of Service">
      <LegalHeading>Agreement</LegalHeading>
      <LegalParagraph>
        By using Prysym TV, you agree to these terms. This summary covers the key points; the full legal text will be published on the website.
      </LegalParagraph>
      <LegalHeading>Your account</LegalHeading>
      <LegalParagraph>
        You are responsible for activity on your account. Do not share credentials or use the service for unlawful content.
      </LegalParagraph>
      <LegalHeading>Creator content</LegalHeading>
      <LegalParagraph>
        Uploads must follow our Community Guidelines. Prysym may remove content or suspend accounts that violate policy.
      </LegalParagraph>
    </LegalPage>
  );
}
