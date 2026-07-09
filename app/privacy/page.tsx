import { LegalDocument } from '@/components/legal-document';
import { LegalPageShell } from '@/components/legal-page-shell';
import { privacyDocument } from '@/lib/legal/documents/privacy';

export default function PrivacyPage() {
  return (
    <LegalPageShell title={privacyDocument.title} description={privacyDocument.description}>
      <LegalDocument document={privacyDocument} />
    </LegalPageShell>
  );
}
