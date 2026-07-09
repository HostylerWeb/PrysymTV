import { LegalDocument } from '@/components/legal-document';
import { LegalPageShell } from '@/components/legal-page-shell';
import { cookiesDocument } from '@/lib/legal/documents/cookies';

export default function CookiesPage() {
  return (
    <LegalPageShell title={cookiesDocument.title} description={cookiesDocument.description}>
      <LegalDocument document={cookiesDocument} />
    </LegalPageShell>
  );
}
