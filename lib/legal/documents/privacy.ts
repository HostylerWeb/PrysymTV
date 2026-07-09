import { LEGAL_CONTACT, LEGAL_ENTITY, PLATFORM_NAME } from '../company';
import type { LegalDocument } from '../types';

const P = PLATFORM_NAME;
const E = LEGAL_ENTITY;
const C = LEGAL_CONTACT;

export const privacyDocument: LegalDocument = {
  title: 'Privacy Policy',
  description: `How ${P} collects, uses, shares, and protects your personal information when you use our video streaming platform in the United States.`,
  blocks: [
    {
      type: 'h2',
      text: '1. Introduction',
    },
    {
      type: 'p',
      text: `${E} ("${P}," "we," "us," or "our") operates an online video streaming and creator platform available through our website, mobile applications, and related services (collectively, the "Platform"). This Privacy Policy explains how we collect, use, disclose, retain, and safeguard personal information about visitors, registered users, creators, advertisers, and other individuals who interact with the Platform.`,
    },
    {
      type: 'p',
      text: 'This Privacy Policy applies to personal information we process in connection with the Platform. It should be read together with our [Cookie Policy](/cookies) and [Terms of Service](/terms).',
    },
    {
      type: 'p',
      text: 'By accessing or using the Platform, you acknowledge that you have read this Privacy Policy. If you do not agree with our practices, please do not use the Platform.',
    },
    {
      type: 'h2',
      text: '2. Information We Collect',
    },
    {
      type: 'h3',
      text: '2.1 Information You Provide Directly',
    },
    {
      type: 'ul',
      items: [
        '**Account information:** username, display name, email address, password (stored in hashed form), profile photo, bio, preferences, and account settings.',
        '**Creator and streamer applications:** identity details, channel information, tax or payout information where required, and materials you submit when applying to publish, broadcast, or monetize.',
        '**User-generated content:** videos, shorts, live streams, podcasts, comments, messages, playlists, storefront listings, and associated metadata you upload or publish.',
        '**Payments and monetization:** billing name, billing address, transaction history, and payment-related information processed by our payment processor (Stripe). We do not store full payment card numbers on our servers.',
        '**Advertiser accounts:** company name, contact name, contact email, billing email, campaign materials, and verification information.',
        '**Communications:** support requests, abuse reports, appeals, survey responses, feedback, and other correspondence with us.',
      ],
    },
    {
      type: 'h3',
      text: '2.2 Information Collected Automatically',
    },
    {
      type: 'ul',
      items: [
        '**Device and usage data:** IP address, browser type, operating system, device type, device identifiers, app version, pages or screens viewed, videos watched, watch history, likes, saves, subscriptions, search queries, referral URLs, crash logs, and interaction timestamps.',
        '**Live streaming data:** stream titles, categories, viewer counts, chat messages, moderation actions, and technical stream metadata.',
        '**Location information:** approximate location derived from IP address, country or region settings, or billing address. We do not collect precise GPS location from mobile devices unless you explicitly grant permission through your device settings for a feature that requires it.',
        '**Cookies and similar technologies:** see our [Cookie Policy](/cookies) for details on cookies, local storage, pixels, and mobile SDKs.',
      ],
    },
    {
      type: 'h3',
      text: '2.3 Information from Third Parties',
    },
    {
      type: 'ul',
      items: [
        'Payment confirmation, fraud signals, and dispute information from Stripe and other payment processors.',
        'Hosting, encoding, analytics, email delivery, customer support, and security vendors that help us operate the Platform.',
        'Publicly available information where permitted by law, such as information associated with a reported infringement or abuse investigation.',
        'Information from authentication providers if you choose to sign in through a supported third-party login method.',
      ],
    },
    {
      type: 'h3',
      text: '2.4 Sensitive Information',
    },
    {
      type: 'p',
      text: 'We do not intentionally collect sensitive personal information such as government ID numbers, financial account credentials, precise geolocation, racial or ethnic origin, religious beliefs, health information, or biometric identifiers except where you voluntarily provide such information in connection with creator verification, tax compliance, fraud prevention, or as otherwise required to provide the Platform.',
    },
    {
      type: 'h2',
      text: '3. How We Use Your Information',
    },
    {
      type: 'p',
      text: 'We use personal information for the following purposes:',
    },
    {
      type: 'ul',
      items: [
        'Provide, operate, maintain, personalize, and improve the Platform.',
        'Create and manage your account, authenticate you, and secure access.',
        'Deliver content, recommendations, search results, and social features.',
        'Process purchases of virtual currency, memberships, subscriptions, and storefront orders.',
        'Calculate, report, and distribute creator revenue, gifts, and payouts.',
        'Serve, measure, cap frequency of, and improve advertising on the Platform.',
        'Enforce our [Terms of Service](/terms), [Community Guidelines](/guidelines), and legal obligations.',
        'Detect, investigate, and prevent fraud, abuse, security incidents, spam, and illegal activity.',
        'Communicate with you about service updates, security alerts, policy changes, and promotional messages where permitted by law.',
        'Conduct analytics, research, debugging, and product development.',
        'Comply with law, respond to legal process, and protect the rights, safety, and property of users, the public, and Prysym TV.',
      ],
    },
    {
      type: 'h2',
      text: '4. How We Share Information',
    },
    {
      type: 'p',
      text: '**We do not sell your personal information.** We also do not share personal information for cross-context behavioral advertising in a manner that constitutes a "sale" or "sharing" under applicable U.S. state privacy laws, except as described below or with your direction.',
    },
    {
      type: 'p',
      text: 'We may share information in the following circumstances:',
    },
    {
      type: 'ul',
      items: [
        '**Service providers:** hosting, storage, encoding, analytics, email, customer support, payment processing (Stripe), moderation tools, and security vendors that process data on our behalf under contractual confidentiality and data protection obligations.',
        '**Creators and other users:** information you choose to make public, such as your profile, videos, comments, live chat messages, playlists, and storefront listings.',
        '**Advertisers:** aggregated or de-identified campaign performance metrics. We do not provide advertisers with your name, email address, or direct contact details for ordinary ad delivery.',
        '**Business transfers:** in connection with a merger, acquisition, financing, reorganization, or sale of assets, subject to appropriate confidentiality and notice requirements.',
        '**Legal and safety:** when required by law, subpoena, court order, or government request, or when we believe disclosure is necessary to investigate fraud, enforce our policies, respond to an emergency, or protect rights, safety, or property.',
        '**With your consent:** when you direct us to share information or connect with a third-party service.',
      ],
    },
    {
      type: 'h2',
      text: '5. Advertising and Analytics',
    },
    {
      type: 'p',
      text: 'We and our advertising and analytics partners may use cookies, pixels, mobile advertising identifiers, and similar technologies to deliver ads, measure impressions and clicks, cap frequency, understand campaign performance, and improve the Platform. Prysym Premium subscribers may receive an ad-free experience on eligible placements. For more information, see our [Cookie Policy](/cookies) and [Advertising page](/advertise).',
    },
    {
      type: 'h2',
      text: '6. Data Retention',
    },
    {
      type: 'p',
      text: 'We retain personal information for as long as necessary to provide the Platform, comply with legal obligations, resolve disputes, enforce agreements, and pursue legitimate business purposes. Retention periods vary depending on the type of information. For example, account data is generally retained while your account is active and for a reasonable period thereafter; transaction and payout records may be retained longer for tax, accounting, fraud prevention, and legal compliance; and removed User Content may persist in backups for a limited period before deletion.',
    },
    {
      type: 'h2',
      text: '7. Security',
    },
    {
      type: 'p',
      text: 'We implement administrative, technical, and organizational safeguards designed to protect personal information, including encryption in transit, access controls, and secure credential storage. No method of transmission or storage is completely secure, and we cannot guarantee absolute security. You are responsible for maintaining the confidentiality of your account credentials.',
    },
    {
      type: 'h2',
      text: '8. Children\'s Privacy (COPPA)',
    },
    {
      type: 'p',
      text: `The Platform is not directed to children under 13 years of age, and we do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child under 13 has provided us personal information, contact us at [privacy@prysym.tv](mailto:privacy@prysym.tv) and we will take steps to delete such information and terminate the associated account where appropriate.`,
    },
    {
      type: 'p',
      text: 'Users between 13 and 17 should use the Platform only with parental or guardian permission where required by applicable law.',
    },
    {
      type: 'h2',
      text: '9. Your U.S. State Privacy Rights',
    },
    {
      type: 'h3',
      text: '9.1 California Residents (CCPA / CPRA)',
    },
    {
      type: 'p',
      text: 'If you are a California resident, you may have the right to: (a) know the categories and specific pieces of personal information we collect about you; (b) know the categories of sources from which personal information is collected, the business or commercial purposes for collecting it, and the categories of third parties with whom we share it; (c) request deletion of personal information, subject to exceptions; (d) request correction of inaccurate personal information; (e) opt out of the sale or sharing of personal information (we do not sell personal information as defined by the CCPA/CPRA); (f) limit the use and disclosure of sensitive personal information where applicable; and (g) not receive discriminatory treatment for exercising privacy rights.',
    },
    {
      type: 'p',
      text: '**Categories of personal information collected (last 12 months):** identifiers; California customer records; commercial information; internet or other electronic network activity; approximate geolocation data; audio, electronic, visual, or similar information (user content); professional or employment-related information (advertisers and creators); and inferences drawn from the above to personalize content, security, and advertising.',
    },
    {
      type: 'p',
      text: `To submit a request, email [privacy@prysym.tv](mailto:privacy@prysym.tv) with "California Privacy Request" in the subject line. We will verify your request as required by law. You may designate an authorized agent to submit a request on your behalf where permitted.`,
    },
    {
      type: 'h3',
      text: '9.2 Other U.S. States',
    },
    {
      type: 'p',
      text: `Residents of Virginia, Colorado, Connecticut, Utah, Texas, Oregon, Montana, and other states with comprehensive privacy laws may have similar rights to access, delete, correct, obtain a portable copy of personal information, and opt out of certain processing, including targeted advertising, profiling in furtherance of decisions that produce legal or similarly significant effects, and the sale of personal information. Submit requests to [privacy@prysym.tv](mailto:privacy@prysym.tv). If we deny your request, you may have the right to appeal by replying to our response with "Privacy Appeal."`,
    },
    {
      type: 'h3',
      text: '9.3 Nevada Residents',
    },
    {
      type: 'p',
      text: `Nevada residents may submit a request to opt out of the sale of covered information. We do not currently sell covered information as defined under Nevada law. Contact [privacy@prysym.tv](mailto:privacy@prysym.tv) with questions.`,
    },
    {
      type: 'h2',
      text: '10. Marketing Communications',
    },
    {
      type: 'p',
      text: `We may send promotional emails, push notifications, or in-app messages where permitted by law and your settings. You may opt out of marketing emails by using the unsubscribe link in the message or by contacting [support@prysym.tv](mailto:support@prysym.tv). Transactional, security, and service-related communications may still be sent even if you opt out of marketing.`,
    },
    {
      type: 'h2',
      text: '11. International Users',
    },
    {
      type: 'p',
      text: 'The Platform is operated from the United States. If you access the Platform from outside the U.S., your information may be transferred to, stored in, and processed in the United States and other countries where we or our service providers operate. Those countries may have data protection laws that differ from the laws of your jurisdiction.',
    },
    {
      type: 'h2',
      text: '12. Changes to This Policy',
    },
    {
      type: 'p',
      text: 'We may update this Privacy Policy from time to time. We will post the revised policy on this page and update the "Last updated" date. Where required by law or where changes are material, we may provide additional notice through the Platform or by email. Continued use after changes become effective constitutes acceptance of the updated policy.',
    },
    {
      type: 'h2',
      text: '13. Contact Us',
    },
    {
      type: 'p',
      text: `For privacy questions or to exercise your rights, contact ${E} at [privacy@prysym.tv](mailto:privacy@prysym.tv). General support: [support@prysym.tv](mailto:support@prysym.tv).`,
    },
  ],
};
