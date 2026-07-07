import React from 'react';
import { LegalHeading, LegalPage, LegalParagraph } from '@/components/layout/LegalPage';

export default function GuidelinesScreen() {
  return (
    <LegalPage title="Community Guidelines">
      <LegalHeading>Be respectful</LegalHeading>
      <LegalParagraph>
        Treat creators and viewers with respect. Harassment, hate speech, and threats are not allowed.
      </LegalParagraph>
      <LegalHeading>Original & lawful content</LegalHeading>
      <LegalParagraph>
        Upload content you have rights to share. Do not post illegal material, spam, or misleading impersonations.
      </LegalParagraph>
      <LegalHeading>Monetization & gifts</LegalHeading>
      <LegalParagraph>
        Coins, memberships, and ads must follow platform rules. Fraudulent engagement or deceptive promotions may result in account action.
      </LegalParagraph>
      <LegalHeading>Enforcement</LegalHeading>
      <LegalParagraph>
        Reports are reviewed by our team. Violations may lead to content removal, demonetization, or account suspension.
      </LegalParagraph>
    </LegalPage>
  );
}
