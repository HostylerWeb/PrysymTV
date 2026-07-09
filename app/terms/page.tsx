import { LegalDocument } from '@/components/legal-document';
import { LegalPageShell } from '@/components/legal-page-shell';
import { termsDocument } from '@/lib/legal/documents/terms';

export default function TermsPage() {
  return (
    <LegalPageShell title={termsDocument.title} description={termsDocument.description}>
      <LegalDocument document={termsDocument} />
    </LegalPageShell>
  );
}
