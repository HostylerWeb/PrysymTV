import React from 'react';
import { LegalHeading, LegalPage, LegalParagraph } from '@/components/layout/LegalPage';

export default function PrivacyScreen() {
  return (
    <LegalPage title="Privacy Policy">
      <LegalHeading>What we collect</LegalHeading>
      <LegalParagraph>
        We collect account information, usage data, and content you upload to provide and improve Prysym TV.
      </LegalParagraph>
      <LegalHeading>How we use it</LegalHeading>
      <LegalParagraph>
        Data is used to operate the service, personalize recommendations, process payments, and communicate with you about your account.
      </LegalParagraph>
      <LegalHeading>Your choices</LegalHeading>
      <LegalParagraph>
        You can update profile details in Settings, manage notification preferences, and contact support@prysym.tv for privacy requests.
      </LegalParagraph>
    </LegalPage>
  );
}
