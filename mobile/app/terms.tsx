import React from 'react';
import { LegalDocumentBody } from '@/components/layout/LegalDocumentBody';
import { LegalPage } from '@/components/layout/LegalPage';
import { termsDocument } from '@legal/documents/terms';

export default function TermsScreen() {
  return (
    <LegalPage title={termsDocument.title} description={termsDocument.description}>
      <LegalDocumentBody document={termsDocument} />
    </LegalPage>
  );
}
