import { LEGAL_CONTACT, LEGAL_ENTITY, PLATFORM_NAME } from '../company';
import type { LegalDocument } from '../types';

const P = PLATFORM_NAME;
const E = LEGAL_ENTITY;
const C = LEGAL_CONTACT;

export const cookiesDocument: LegalDocument = {
  title: 'Cookie Policy',
  description: `How ${P} uses cookies, pixels, local storage, mobile SDKs, and similar technologies.`,
  blocks: [
    {
      type: 'h2',
      text: '1. Introduction',
    },
    {
      type: 'p',
      text: `This Cookie Policy explains how ${E} ("${P}") uses cookies and similar technologies when you visit or use our website, mobile applications, and related services (collectively, the "Platform"). It should be read together with our [Privacy Policy](/privacy).`,
    },
    {
      type: 'p',
      text: 'By continuing to use the Platform, you consent to the use of cookies and similar technologies as described in this policy, except where your consent is required by law and you have not provided it.',
    },
    {
      type: 'h2',
      text: '2. What Are Cookies and Similar Technologies?',
    },
    {
      type: 'p',
      text: 'Cookies are small text files placed on your browser or device when you visit a website. We also use local storage, session storage, software development kits (SDKs), pixels, tags, and device identifiers that function similarly—for example, to remember your login session, store preferences, measure ad performance, or understand how features are used.',
    },
    {
      type: 'h2',
      text: '3. Types of Technologies We Use',
    },
    {
      type: 'table',
      headers: ['Category', 'Purpose', 'Examples'],
      rows: [
        ['Strictly necessary', 'Core functionality, security, authentication, load balancing, and fraud prevention', 'Session tokens, CSRF protection, login state, cookie consent preferences'],
        ['Functional', 'Remember preferences and improve your experience', 'Volume mute state, theme or UI preferences, language settings, dismissed notices'],
        ['Analytics', 'Understand usage, diagnose errors, and improve performance', 'Page views, watch events, feature usage metrics, crash reporting'],
        ['Advertising', 'Deliver ads, measure impressions and clicks, cap frequency, and attribute campaigns', 'Ad campaign IDs, impression counters, click attribution, audience measurement'],
      ],
    },
    {
      type: 'h2',
      text: '4. First-Party and Third-Party Technologies',
    },
    {
      type: 'p',
      text: `**First-party technologies** are set by ${P} when you use our website or apps.`,
    },
    {
      type: 'p',
      text: '**Third-party technologies** may be set by service providers when you use certain features, including:',
    },
    {
      type: 'ul',
      items: [
        '**Stripe** — payment processing, fraud prevention, and checkout functionality when you purchase coins, memberships, subscriptions, or storefront items.',
        '**Infrastructure and analytics partners** — hosting, content delivery, encoding, performance monitoring, and usage analytics that help us operate and improve the Platform.',
        '**Advertising partners** — technologies used to deliver, measure, and report on advertising campaigns where applicable.',
      ],
    },
    {
      type: 'p',
      text: 'We do not control third-party technologies. Please review the privacy policies of those providers for more information about their practices.',
    },
    {
      type: 'h2',
      text: '5. Local Storage and Authentication',
    },
    {
      type: 'p',
      text: 'When you log in, we may store access tokens, refresh tokens, or session identifiers in your browser\'s local storage or in secure mobile app storage to keep you signed in. These technologies are essential for account functionality. Logging out, uninstalling the app, or clearing site or app data generally removes them.',
    },
    {
      type: 'h2',
      text: '6. Mobile Applications',
    },
    {
      type: 'p',
      text: 'Our mobile apps may use device identifiers, secure storage, push notification tokens, and analytics SDKs to provide core functionality, deliver notifications you opt into, diagnose crashes, and understand feature usage. Mobile operating systems may provide settings to limit ad tracking, reset advertising identifiers, or manage app permissions.',
    },
    {
      type: 'h2',
      text: '7. Advertising Technologies',
    },
    {
      type: 'p',
      text: 'We serve ads in placements such as the home banner, shorts interstitials, movie prerolls, podcast breaks, and vertical episode gates. Advertising technologies help us:',
    },
    {
      type: 'ul',
      items: [
        'Count impressions and clicks for billing, reporting, and campaign optimization.',
        'Attribute ad performance to campaigns, creatives, and placements.',
        'Limit how often you see the same ad.',
        'Measure aggregate reach and effectiveness without unnecessarily identifying individual users to advertisers.',
      ],
    },
    {
      type: 'p',
      text: 'Prysym Premium subscribers may receive an ad-free experience on eligible placements. Learn more on our [Advertising page](/advertise).',
    },
    {
      type: 'h2',
      text: '8. Your Choices',
    },
    {
      type: 'h3',
      text: '8.1 Browser Controls',
    },
    {
      type: 'p',
      text: 'Most web browsers let you block, delete, or manage cookies through settings. Blocking strictly necessary cookies may prevent you from logging in or using core features of the Platform.',
    },
    {
      type: 'h3',
      text: '8.2 Mobile Device Settings',
    },
    {
      type: 'p',
      text: 'Mobile operating systems may offer controls for advertising identifiers, app tracking permissions, notification settings, and clearing app data. Refer to your device manufacturer\'s instructions for details.',
    },
    {
      type: 'h3',
      text: '8.3 Do Not Track',
    },
    {
      type: 'p',
      text: 'Some browsers transmit "Do Not Track" (DNT) signals. There is no uniform industry standard for responding to DNT. We currently do not respond to DNT signals, but you can manage cookies and similar technologies as described above.',
    },
    {
      type: 'h3',
      text: '8.4 U.S. State Opt-Out Rights',
    },
    {
      type: 'p',
      text: `Residents of certain U.S. states may have rights to opt out of the sale or sharing of personal information for targeted advertising. We do not sell personal information as defined under applicable state laws. For privacy requests, contact [privacy@prysym.tv](mailto:privacy@prysym.tv).`,
    },
    {
      type: 'h2',
      text: '9. Retention',
    },
    {
      type: 'p',
      text: 'Session cookies and similar session technologies expire when you close your browser or end your app session. Persistent cookies and stored identifiers remain until they expire or you delete them. Retention periods vary by technology type and purpose.',
    },
    {
      type: 'h2',
      text: '10. Updates',
    },
    {
      type: 'p',
      text: 'We may update this Cookie Policy from time to time. Changes will be posted on this page with an updated "Last updated" date. Material changes may be communicated through the Platform where appropriate.',
    },
    {
      type: 'h2',
      text: '11. Contact',
    },
    {
      type: 'p',
      text: `Questions about this Cookie Policy may be sent to [privacy@prysym.tv](mailto:privacy@prysym.tv).`,
    },
  ],
};
