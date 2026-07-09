import React from 'react';
import { LegalDocumentBody } from '@/components/layout/LegalDocumentBody';
import { LegalPage } from '@/components/layout/LegalPage';
import { privacyDocument } from '@legal/documents/privacy';

export default function PrivacyScreen() {
  return (
    <LegalPage title={privacyDocument.title} description={privacyDocument.description}>
      <LegalDocumentBody document={privacyDocument} />
    </LegalPage>
  );
}
