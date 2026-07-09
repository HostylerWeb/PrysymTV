import { LEGAL_CONTACT, PLATFORM_NAME } from '../company';
import type { LegalDocument } from '../types';

const P = PLATFORM_NAME;
const C = LEGAL_CONTACT;

export const guidelinesDocument: LegalDocument = {
  title: 'Community Guidelines',
  description: `Rules for participating safely and respectfully on ${P}. Violations may result in content removal, demonetization, or account termination.`,
  blocks: [
    {
      type: 'h2',
      text: '1. Purpose',
    },
    {
      type: 'p',
      text: `These Community Guidelines explain what is and is not allowed on ${P}. They apply to all users, viewers, creators, streamers, podcasters, advertisers, and storefront sellers. They supplement our [Terms of Service](/terms) and [Privacy Policy](/privacy).`,
    },
    {
      type: 'p',
      text: 'We may update these Guidelines as our Platform evolves, as laws change, or as new abuse patterns emerge. Creators and advertisers are responsible for staying informed of current rules.',
    },
    {
      type: 'h2',
      text: '2. Respect and Safety',
    },
    {
      type: 'p',
      text: 'Everyone on Prysym TV deserves to participate without fear of abuse, exploitation, or discrimination. We do not tolerate:',
    },
    {
      type: 'ul',
      items: [
        '**Hate speech:** Content that promotes violence or hatred against individuals or groups based on race, ethnicity, national origin, immigration status, religion, disability, serious disease, age, sexual orientation, sex, gender, gender identity, caste, or veteran status.',
        '**Harassment and bullying:** Targeted abuse, insults, threats, doxxing, stalking, sexual harassment, or coordinated harassment campaigns against individuals or groups.',
        '**Violence and graphic content:** Content that glorifies violence, encourages others to commit violent acts, or depicts gratuitous gore, torture, or animal cruelty intended primarily to shock or disgust.',
        '**Self-harm and suicide:** Content that promotes, instructs, or encourages self-harm or suicide. We may allow educational or documentary content with appropriate context and restrictions.',
        '**Child safety:** Any sexualization of minors, grooming, child endangerment, or content that exploits children. We report apparent child sexual abuse material (CSAM) and related illegal activity to the National Center for Missing & Exploited Children (NCMEC) and appropriate law enforcement where required.',
      ],
    },
    {
      type: 'h2',
      text: '3. Prohibited Content',
    },
    {
      type: 'ul',
      items: [
        '**Sexually explicit content:** Pornography, sexually explicit depictions intended primarily for sexual gratification, and non-consensual intimate imagery (including deepfakes). Limited mature or artistic content may be allowed only where permitted by product rules and properly age-restricted.',
        '**Illegal activity:** Content promoting or facilitating illegal drugs, unlawful weapons sales, human trafficking, fraud, terrorism, money laundering, or other criminal conduct.',
        '**Dangerous acts:** Instructions or challenges likely to cause serious injury or death, including dangerous stunts, eating disorders, or misuse of weapons or explosives.',
        '**Spam and scams:** Misleading metadata, phishing, pyramid schemes, fake giveaways, impersonation for financial gain, cryptocurrency scams, and deceptive engagement bait.',
        '**Malware and hacking:** Distribution of malicious software, credential theft, or instructions to compromise systems or accounts.',
        '**Elections and civic integrity:** Content that misleads voters about how to participate in elections, suppresses voting, or impersonates government agencies or election officials in the United States.',
        '**Misinformation that causes harm:** Demonstrably false content that poses a serious risk of physical harm, such as dangerous health cures or false emergency information, especially when presented as authoritative fact.',
      ],
    },
    {
      type: 'h2',
      text: '4. Intellectual Property',
    },
    {
      type: 'p',
      text: 'Upload only content you created or are authorized to use. Unauthorized re-uploads, piracy, bootleg recordings, leaked material, and copyright or trademark infringement violate these Guidelines and our DMCA policy in the [Terms of Service](/terms).',
    },
    {
      type: 'ul',
      items: [
        'Do not use music, footage, logos, or other materials without appropriate licenses or permissions.',
        'Do not falsely claim ownership of another creator\'s work.',
        'Repeat infringers may be permanently banned and demonetized.',
      ],
    },
    {
      type: 'h2',
      text: '5. Live Streaming and Chat',
    },
    {
      type: 'ul',
      items: [
        'Live streams and live chat must follow the same standards as uploaded content.',
        'Do not stream while driving or performing other activities that create a serious risk of harm.',
        'Creators are responsible for moderating their live chat and communities using available tools.',
        'Do not broadcast private conversations, confidential information, or content you do not have rights to share.',
        'Emergency services should be contacted directly in the United States by calling 911. Do not rely on the Platform for emergency response.',
      ],
    },
    {
      type: 'h2',
      text: '6. Monetization Integrity',
    },
    {
      type: 'p',
      text: 'Creators participating in monetization programs must not:',
    },
    {
      type: 'ul',
      items: [
        'Artificially inflate views, likes, comments, watch time, followers, or other engagement metrics.',
        'Use bots, click farms, view exchanges, or incentive schemes to manipulate rankings or payouts.',
        'Exploit the virtual gifting, coin, membership, or advertising systems through fraudulent or deceptive activity.',
        'Mislead viewers about sponsorships, paid promotions, affiliate relationships, or gifted products. U.S. FTC disclosure rules require clear and conspicuous identification of material connections.',
        'Publish content primarily designed to farm gifts, clicks, or ad revenue through deception or policy evasion.',
      ],
    },
    {
      type: 'h2',
      text: '7. Creator Storefronts and Commerce',
    },
    {
      type: 'ul',
      items: [
        'Product listings must be accurate and lawful. Do not sell counterfeit goods, stolen items, prohibited weapons, regulated substances, or items that violate our policies.',
        'Honor stated shipping times, refund policies, and customer communications.',
        'Do not use storefront features to facilitate scams or off-platform payment fraud.',
      ],
    },
    {
      type: 'h2',
      text: '8. Advertising Standards',
    },
    {
      type: 'p',
      text: 'Advertisers must provide accurate creative, truthful claims, and safe landing pages. Prohibited ad content includes illegal products or services, deceptive claims, malware, hate speech, sexually explicit material, and content that targets minors inappropriately. See our [Advertising page](/advertise) for more information.',
    },
    {
      type: 'h2',
      text: '9. Privacy and Personal Information',
    },
    {
      type: 'p',
      text: 'Do not share other people\'s private personal information without consent, including home addresses, phone numbers, financial account details, government ID numbers, or non-public login credentials. Respect reasonable expectations of privacy in public and private settings.',
    },
    {
      type: 'h2',
      text: '10. Enforcement',
    },
    {
      type: 'p',
      text: 'We use automated systems, user reports, and human review to enforce these Guidelines. Depending on severity, context, and account history, enforcement may include:',
    },
    {
      type: 'ul',
      items: [
        'Educational warnings or required policy training.',
        'Age-restriction or reduced distribution.',
        'Demonetization or removal from creator programs.',
        'Content removal or account feature limits.',
        'Temporary suspension or permanent account termination.',
        'Referral to law enforcement where appropriate.',
      ],
    },
    {
      type: 'p',
      text: `If you see violating content, use the in-app report feature or contact [support@prysym.tv](mailto:support@prysym.tv).`,
    },
    {
      type: 'h2',
      text: '11. Appeals',
    },
    {
      type: 'p',
      text: `If you believe enforcement action was taken in error, you may appeal by contacting [support@prysym.tv](mailto:support@prysym.tv) with your username, a link to the affected content if applicable, and a clear explanation of why you believe the action was incorrect. We review appeals in a reasonable timeframe but do not guarantee reversal.`,
    },
    {
      type: 'h2',
      text: '12. Reporting Illegal Activity',
    },
    {
      type: 'p',
      text: 'If you believe you have witnessed illegal activity on the Platform, contact local law enforcement. For child safety emergencies in the United States, contact 911 and report concerns to [support@prysym.tv](mailto:support@prysym.tv).',
    },
  ],
};
