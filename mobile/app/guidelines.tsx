import React from 'react';
import { LegalDocumentBody } from '@/components/layout/LegalDocumentBody';
import { LegalPage } from '@/components/layout/LegalPage';
import { guidelinesDocument } from '@legal/documents/guidelines';

export default function GuidelinesScreen() {
  return (
    <LegalPage title={guidelinesDocument.title} description={guidelinesDocument.description}>
      <LegalDocumentBody document={guidelinesDocument} />
    </LegalPage>
  );
}
