import { GOVERNING_STATE, LEGAL_CONTACT, LEGAL_ENTITY, PLATFORM_NAME } from '../company';
import type { LegalDocument } from '../types';

const P = PLATFORM_NAME;
const E = LEGAL_ENTITY;
const G = GOVERNING_STATE;
const C = LEGAL_CONTACT;

export const termsDocument: LegalDocument = {
  title: 'Terms of Service',
  description: `The binding agreement between you and ${E} governing use of ${P}.`,
  blocks: [
    {
      type: 'h2',
      text: '1. Agreement to Terms',
    },
    {
      type: 'p',
      text: `These Terms of Service ("Terms") constitute a legally binding agreement between you and ${E} ("${P}," "we," "us," or "our") governing your access to and use of our websites, mobile applications, APIs, embeds, and related services (collectively, the "Platform"). By creating an account, accessing, or using the Platform, you agree to these Terms and our [Privacy Policy](/privacy), [Cookie Policy](/cookies), and [Community Guidelines](/guidelines), which are incorporated by reference.`,
    },
    {
      type: 'p',
      text: 'If you do not agree to these Terms, you may not access or use the Platform.',
    },
    {
      type: 'h2',
      text: '2. Eligibility',
    },
    {
      type: 'p',
      text: 'You must be at least 13 years of age to use the Platform. If you are between 13 and the age of majority in your state of residence, you may use the Platform only with the consent and supervision of a parent or legal guardian who agrees to these Terms on your behalf and accepts responsibility for your activity.',
    },
    {
      type: 'p',
      text: 'You represent and warrant that: (a) you have the legal capacity to enter into these Terms; (b) all registration information you provide is accurate, current, and complete; and (c) you will maintain and promptly update your account information as needed.',
    },
    {
      type: 'p',
      text: 'We may refuse service, suspend registration, or cancel accounts at our discretion, including where we believe a user does not meet eligibility requirements or poses a risk to the Platform or other users.',
    },
    {
      type: 'h2',
      text: '3. The Platform and Services',
    },
    {
      type: 'p',
      text: `${P} is a United States–based user-generated content and streaming platform that enables users to watch, upload, publish, live stream, and interact with videos, shorts, movies, podcasts, vertical series, playlists, creator storefronts, and related social features.`,
    },
    {
      type: 'p',
      text: 'Features, content libraries, monetization programs, and product offerings may change, be added, limited, or removed at any time. Beta or experimental features may be offered "as is" without warranties. We do not guarantee uninterrupted, secure, or error-free operation of the Platform.',
    },
    {
      type: 'h2',
      text: '4. Accounts and Security',
    },
    {
      type: 'ul',
      items: [
        'You are responsible for maintaining the confidentiality of your login credentials and for all activity that occurs under your account.',
        'You must notify us promptly of any unauthorized access to or use of your account at [support@prysym.tv](mailto:support@prysym.tv).',
        'You may not create multiple accounts to evade enforcement, manipulate metrics, abuse promotions, or circumvent suspensions.',
        'You may not sell, transfer, or share your account except as expressly permitted by us in writing.',
        'We may suspend or terminate accounts that violate these Terms, pose security risks, or remain inactive for an extended period, subject to applicable law.',
      ],
    },
    {
      type: 'h2',
      text: '5. User-Generated Content',
    },
    {
      type: 'h3',
      text: '5.1 Your Content',
    },
    {
      type: 'p',
      text: `You retain ownership of content you upload, stream, publish, or otherwise make available through the Platform ("User Content"), subject to the licenses granted below. Nothing in these Terms transfers ownership of your User Content to ${P}.`,
    },
    {
      type: 'p',
      text: `By submitting User Content, you grant ${P} a worldwide, non-exclusive, royalty-free, sublicensable, and transferable license to host, store, reproduce, distribute, publicly perform, publicly display, adapt, translate, create derivative works from, and otherwise use your User Content in connection with operating, promoting, securing, and improving the Platform and our business. This license includes the right to make User Content available to other users and to use your name, username, likeness, and channel branding as displayed on the Platform in connection with such use.`,
    },
    {
      type: 'p',
      text: 'This license continues for a commercially reasonable period after you remove User Content to the extent necessary for backups, caching, legal compliance, fraud prevention, dispute resolution, and completed transactions. Removed content may persist in backup systems for a limited time before deletion.',
    },
    {
      type: 'h3',
      text: '5.2 Your Responsibilities',
    },
    {
      type: 'p',
      text: 'You represent and warrant that:',
    },
    {
      type: 'ul',
      items: [
        'You own or have obtained all rights, licenses, consents, and permissions necessary to submit User Content and to grant the licenses in these Terms.',
        'Your User Content does not violate any law, regulation, court order, or third-party right, including intellectual property, privacy, publicity, and contractual rights.',
        'Your User Content complies with our [Community Guidelines](/guidelines) and all applicable platform policies.',
        'If your User Content includes music, footage, trademarks, or other third-party materials, you have secured all necessary clearances.',
      ],
    },
    {
      type: 'h3',
      text: '5.3 Moderation and Removal',
    },
    {
      type: 'p',
      text: 'We may review, remove, restrict, age-gate, demonetize, or disable access to User Content at any time, with or without notice, including for violations of these Terms, our Community Guidelines, applicable law, or rights of others. We are not obligated to monitor all User Content and do not guarantee that objectionable content will be identified or removed.',
    },
    {
      type: 'h3',
      text: '5.4 Feedback',
    },
    {
      type: 'p',
      text: 'If you submit ideas, suggestions, or feedback about the Platform, you grant us a perpetual, irrevocable, worldwide, royalty-free license to use that feedback for any purpose without compensation or attribution.',
    },
    {
      type: 'h2',
      text: '6. Creator, Streamer, and Monetization Programs',
    },
    {
      type: 'p',
      text: 'Creators, streamers, podcasters, and other publishers may apply for or be invited to monetization features, including advertising revenue sharing, virtual gifts, channel memberships, storefront sales, and payout programs. Participation is subject to additional eligibility requirements, tax documentation, identity verification (KYC), and program policies communicated in-product or in writing.',
    },
    {
      type: 'ul',
      items: [
        'You are solely responsible for all taxes, filings, and regulatory obligations arising from your earnings on the Platform.',
        'Revenue shares, gift conversion rates, payout thresholds, and schedules are governed by in-platform policies and admin-configured rules, which may change with notice where required by law.',
        'Artificial inflation of views, watch time, likes, comments, followers, gifts, ad impressions, or other metrics is strictly prohibited and may result in forfeiture of earnings, demonetization, and permanent account termination.',
        'We may withhold, offset, or reverse payouts associated with fraud, chargebacks, refunds, policy violations, legal process, or accounting errors.',
        'Sponsored or paid promotional content must comply with U.S. Federal Trade Commission (FTC) endorsement and disclosure requirements.',
      ],
    },
    {
      type: 'h2',
      text: '7. Virtual Currency, Gifts, Subscriptions, and Payments',
    },
    {
      type: 'h3',
      text: '7.1 Coins and Virtual Items',
    },
    {
      type: 'ul',
      items: [
        '**Coins:** Virtual currency purchased on the Platform has no cash value outside the Platform, is non-transferable except as we expressly permit, and is generally non-refundable except where required by law or expressly stated at purchase.',
        '**Gifts:** Virtual gifts sent to creators have no monetary value to senders and are not redeemable for cash by senders. Gift values displayed in the product are for informational purposes and do not represent guaranteed creator earnings.',
        'We may modify virtual item pricing, availability, conversion mechanics, or gift catalogs at any time.',
      ],
    },
    {
      type: 'h3',
      text: '7.2 Memberships and Subscriptions',
    },
    {
      type: 'p',
      text: 'Prysym Premium, Platform Insider, and creator channel memberships or subscriptions are billed on a recurring basis through Stripe or other authorized payment processors. Subscription terms, pricing, renewal dates, cancellation methods, and refund policies are disclosed at purchase and in your account settings. You authorize us and our payment processors to charge your selected payment method for recurring fees until you cancel in accordance with the disclosed process.',
    },
    {
      type: 'h3',
      text: '7.3 Creator Storefronts',
    },
    {
      type: 'p',
      text: 'Where creators offer merchandise or digital goods through storefront features, checkout may be processed by us or third-party providers. Creators are responsible for accurate product descriptions, fulfillment, and compliance with consumer protection laws. Additional seller terms may apply.',
    },
    {
      type: 'h3',
      text: '7.4 Chargebacks and Refunds',
    },
    {
      type: 'p',
      text: 'Fraudulent chargebacks, payment disputes filed in bad faith, or abuse of refund mechanisms may result in account suspension, removal of associated virtual items, reversal of creator earnings, and permanent termination.',
    },
    {
      type: 'h2',
      text: '8. Advertising',
    },
    {
      type: 'p',
      text: `The Platform may display first-party and third-party advertisements in placements such as home banners, shorts interstitials, movie prerolls, podcast breaks, and vertical episode gates. Advertisers are subject to separate requirements. See our [Advertising page](/advertise). Prysym Premium subscribers may receive an ad-free experience on eligible placements as described at purchase.`,
    },
    {
      type: 'p',
      text: 'You may not interfere with ad delivery, block required ad experiences except through authorized subscription features, or click or encourage clicks on ads in a deceptive or fraudulent manner.',
    },
    {
      type: 'h2',
      text: '9. Prohibited Conduct',
    },
    {
      type: 'p',
      text: 'You agree not to:',
    },
    {
      type: 'ul',
      items: [
        'Violate any federal, state, or local law, regulation, or third-party right.',
        'Upload malware, viruses, spam, phishing content, or deceptive schemes.',
        'Harass, threaten, stalk, dox, exploit, or endanger any person.',
        'Sexualize minors or engage in grooming, child exploitation, or child endangerment.',
        'Circumvent access controls, rate limits, geographic restrictions, or security measures.',
        'Scrape, crawl, harvest, or collect data from the Platform except through authorized APIs or our written consent.',
        'Use bots, scripts, emulators, or automation to manipulate metrics, rankings, ads, gifts, or engagement.',
        'Impersonate any person, entity, or brand, or misrepresent your affiliation.',
        'Reverse engineer, decompile, or attempt to extract source code except where prohibited by law.',
        'Use the Platform to send unsolicited commercial messages in violation of the CAN-SPAM Act or similar laws.',
      ],
    },
    {
      type: 'h2',
      text: '10. Intellectual Property',
    },
    {
      type: 'p',
      text: `The Platform, including its software, design, user interface, trademarks, logos, and proprietary content (excluding User Content), is owned by ${E} or its licensors and is protected by U.S. and international intellectual property laws. No rights are granted to you except as expressly stated in these Terms.`,
    },
    {
      type: 'p',
      text: 'If you believe content on the Platform infringes your copyright, please see Section 11 (DMCA Copyright Policy) below.',
    },
    {
      type: 'h2',
      text: '11. DMCA Copyright Policy',
    },
    {
      type: 'p',
      text: 'We respect intellectual property rights and respond to notices of alleged copyright infringement under the Digital Millennium Copyright Act, 17 U.S.C. § 512 ("DMCA").',
    },
    {
      type: 'p',
      text: `**Designated Copyright Agent:** ${E} — DMCA Agent. Email: [dmca@prysym.tv](mailto:dmca@prysym.tv).`,
    },
    {
      type: 'p',
      text: 'A valid DMCA takedown notice must include:',
    },
    {
      type: 'ol',
      items: [
        'A physical or electronic signature of the copyright owner or a person authorized to act on the owner\'s behalf.',
        'Identification of the copyrighted work claimed to have been infringed.',
        'Identification of the material claimed to be infringing and information reasonably sufficient to permit us to locate it on the Platform (such as a URL, video ID, or channel name).',
        'Your contact information, including mailing address, telephone number, and email address.',
        'A statement that you have a good-faith belief that use of the material is not authorized by the copyright owner, its agent, or the law.',
        'A statement, under penalty of perjury, that the information in the notice is accurate and that you are authorized to act on behalf of the copyright owner.',
      ],
    },
    {
      type: 'p',
      text: 'If you believe material was removed or disabled by mistake or misidentification, you may submit a DMCA counter-notification that complies with 17 U.S.C. § 512(g). We may restore removed content in accordance with the DMCA. We may terminate, in appropriate circumstances, the accounts of users who are repeat infringers.',
    },
    {
      type: 'h2',
      text: '12. Third-Party Links and Services',
    },
    {
      type: 'p',
      text: 'The Platform may contain links to third-party websites, applications, products, or services, including advertiser landing pages and creator storefront checkout flows. We do not control and are not responsible for third-party content, policies, or practices. Your use of third-party services, including Stripe and other payment processors, is subject to their terms and privacy policies.',
    },
    {
      type: 'h2',
      text: '13. Disclaimers',
    },
    {
      type: 'p',
      text: 'THE PLATFORM AND ALL CONTENT AND SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE PLATFORM WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE, THAT DEFECTS WILL BE CORRECTED, OR THAT USER CONTENT WILL BE ACCURATE, COMPLETE, OR RELIABLE.',
    },
    {
      type: 'p',
      text: 'SOME JURISDICTIONS DO NOT ALLOW THE EXCLUSION OF IMPLIED WARRANTIES; IN SUCH CASES, THE ABOVE EXCLUSIONS APPLY TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW.',
    },
    {
      type: 'h2',
      text: '14. Limitation of Liability',
    },
    {
      type: 'p',
      text: `TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, ${E.toUpperCase()} AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, AFFILIATES, AND LICENSORS WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, REVENUE, DATA, GOODWILL, OR OTHER INTANGIBLE LOSSES, ARISING OUT OF OR RELATED TO YOUR USE OF OR INABILITY TO USE THE PLATFORM, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.`,
    },
    {
      type: 'p',
      text: 'TO THE MAXIMUM EXTENT PERMITTED BY LAW, OUR TOTAL LIABILITY FOR ANY CLAIM ARISING OUT OF OR RELATING TO THESE TERMS OR THE PLATFORM WILL NOT EXCEED THE GREATER OF (A) ONE HUNDRED U.S. DOLLARS ($100) OR (B) THE AMOUNT YOU PAID US IN THE TWELVE (12) MONTHS BEFORE THE EVENT GIVING RISE TO THE CLAIM.',
    },
    {
      type: 'p',
      text: 'SOME JURISDICTIONS DO NOT ALLOW LIMITATIONS OF LIABILITY FOR CERTAIN DAMAGES; IN SUCH CASES, OUR LIABILITY IS LIMITED TO THE MAXIMUM EXTENT PERMITTED BY LAW.',
    },
    {
      type: 'h2',
      text: '15. Indemnification',
    },
    {
      type: 'p',
      text: `You agree to defend, indemnify, and hold harmless ${E} and its affiliates, officers, directors, employees, agents, and licensors from and against any claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys' fees) arising out of or related to your User Content, your use of the Platform, your violation of these Terms or applicable law, or your violation of any third-party right.`,
    },
    {
      type: 'h2',
      text: '16. Dispute Resolution and Governing Law',
    },
    {
      type: 'p',
      text: `These Terms are governed by the laws of the State of ${G} and the federal laws of the United States, without regard to conflict-of-law principles that would require application of another jurisdiction's laws.`,
    },
    {
      type: 'p',
      text: `Except where prohibited by applicable law, you and ${P} agree that any dispute, claim, or controversy arising out of or relating to these Terms or the Platform will be brought exclusively in the state or federal courts located in ${G}, and you consent to personal jurisdiction and venue in those courts.`,
    },
    {
      type: 'p',
      text: 'Nothing in this section limits either party\'s right to seek injunctive or other equitable relief in any court of competent jurisdiction. You may have rights under mandatory consumer protection laws in your state that cannot be waived by contract.',
    },
    {
      type: 'h2',
      text: '17. Termination',
    },
    {
      type: 'p',
      text: 'You may stop using the Platform at any time. You may delete your account through available account settings or by contacting support. We may suspend or terminate your access to the Platform, in whole or in part, with or without notice, for any reason, including if we believe you have violated these Terms or pose a risk to the Platform or other users.',
    },
    {
      type: 'p',
      text: 'Upon termination, your right to use the Platform ceases immediately. Provisions that by their nature should survive termination will survive, including intellectual property licenses granted to us with respect to content already distributed, disclaimers, limitations of liability, indemnification, and dispute resolution.',
    },
    {
      type: 'h2',
      text: '18. Changes to Terms',
    },
    {
      type: 'p',
      text: 'We may modify these Terms at any time. We will post updated Terms on this page and update the "Last updated" date. Where required by law or where changes are material, we may provide additional notice through the Platform, by email, or by other reasonable means. Your continued use of the Platform after the effective date of revised Terms constitutes acceptance. If you do not agree to revised Terms, you must stop using the Platform.',
    },
    {
      type: 'h2',
      text: '19. General',
    },
    {
      type: 'ul',
      items: [
        '**Entire agreement:** These Terms, together with incorporated policies, constitute the entire agreement between you and us regarding the Platform.',
        '**Severability:** If any provision is held invalid or unenforceable, the remaining provisions remain in full force and effect.',
        '**No waiver:** Our failure to enforce any right or provision is not a waiver of that right or provision.',
        '**Assignment:** You may not assign these Terms without our prior written consent. We may assign these Terms in connection with a merger, acquisition, or sale of assets.',
        '**Export control:** You agree to comply with U.S. export control and sanctions laws and not to use the Platform in embargoed countries or for prohibited end uses.',
      ],
    },
    {
      type: 'h2',
      text: '20. Contact',
    },
    {
      type: 'p',
      text: `${E}. Email: [legal@prysym.tv](mailto:legal@prysym.tv). General support: [support@prysym.tv](mailto:support@prysym.tv).`,
    },
  ],
};
