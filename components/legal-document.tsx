'use client';

import Link from 'next/link';
import { renderLegalDocumentWeb } from '@/lib/legal/render-web';
import type { LegalDocument } from '@/lib/legal/types';

type Props = {
  document: LegalDocument;
};

export function LegalDocument({ document }: Props) {
  return (
    <>
      {renderLegalDocumentWeb(document, {
        Link: ({ href, children }) => {
          if (href.startsWith('mailto:')) {
            return <a href={href}>{children}</a>;
          }
          return <Link href={href}>{children}</Link>;
        },
      })}
    </>
  );
}
