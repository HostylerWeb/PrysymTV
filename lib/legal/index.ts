import { termsDocument } from './documents/terms';
import { privacyDocument } from './documents/privacy';
import { cookiesDocument } from './documents/cookies';
import { guidelinesDocument } from './documents/guidelines';

export { termsDocument, privacyDocument, cookiesDocument, guidelinesDocument };

export const legalDocuments = {
  terms: termsDocument,
  privacy: privacyDocument,
  cookies: cookiesDocument,
  guidelines: guidelinesDocument,
} as const;
