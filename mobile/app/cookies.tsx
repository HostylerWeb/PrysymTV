import React from 'react';
import { LegalDocumentBody } from '@/components/layout/LegalDocumentBody';
import { LegalPage } from '@/components/layout/LegalPage';
import { cookiesDocument } from '@legal/documents/cookies';

export default function CookiesScreen() {
  return (
    <LegalPage title={cookiesDocument.title} description={cookiesDocument.description}>
      <LegalDocumentBody document={cookiesDocument} />
    </LegalPage>
  );
}
