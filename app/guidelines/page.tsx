import { LegalDocument } from '@/components/legal-document';
import { LegalPageShell } from '@/components/legal-page-shell';
import { guidelinesDocument } from '@/lib/legal/documents/guidelines';

export default function GuidelinesPage() {
  return (
    <LegalPageShell title={guidelinesDocument.title} description={guidelinesDocument.description}>
      <LegalDocument document={guidelinesDocument} />
    </LegalPageShell>
  );
}
