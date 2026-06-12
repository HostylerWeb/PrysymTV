import { LegalPageShell } from "@/components/legal-page-shell"
import { LEGAL_CONTACT, PLATFORM_NAME } from "@/lib/legal/company"

export default function GuidelinesPage() {
  return (
    <LegalPageShell
      title="Community Guidelines"
      description={`Rules for participating safely and respectfully on ${PLATFORM_NAME}. Violations may result in content removal, demonetization, or account termination.`}
    >
      <section>
        <h2>1. Purpose</h2>
        <p>
          These Community Guidelines explain what is and is not allowed on {PLATFORM_NAME}. They
          apply to all users, creators, streamers, and advertisers. They supplement our{" "}
          <a href="/terms">Terms of Service</a>.
        </p>
      </section>

      <section>
        <h2>2. Respect and Safety</h2>
        <p>We do not tolerate:</p>
        <ul>
          <li>
            <strong>Hate speech:</strong> Content that promotes violence or hatred against
            individuals or groups based on race, ethnicity, national origin, religion, disability,
            age, sexual orientation, gender, gender identity, or other protected characteristics.
          </li>
          <li>
            <strong>Harassment and bullying:</strong> Targeted abuse, threats, doxxing, stalking, or
            coordinated harassment campaigns.
          </li>
          <li>
            <strong>Violence and graphic content:</strong> Content that glorifies violence,
            encourages self-harm, or depicts gratuitous gore intended to shock.
          </li>
          <li>
            <strong>Child safety:</strong> Any sexualization of minors, grooming, or endangerment of
            children. We report illegal content to appropriate authorities where required.
          </li>
        </ul>
      </section>

      <section>
        <h2>3. Prohibited Content</h2>
        <ul>
          <li>
            <strong>Sexually explicit content:</strong> Pornography, sexually explicit depictions,
            and non-consensual intimate imagery.
          </li>
          <li>
            <strong>Illegal activity:</strong> Content promoting illegal drugs, weapons sales where
            prohibited, fraud, terrorism, or other criminal conduct.
          </li>
          <li>
            <strong>Dangerous acts:</strong> Instructions for activities likely to cause serious
            injury or death.
          </li>
          <li>
            <strong>Spam and scams:</strong> Misleading metadata, phishing, pyramid schemes, fake
            giveaways, and impersonation for financial gain.
          </li>
          <li>
            <strong>Malware and hacking:</strong> Distribution of malicious software or instructions
            to compromise systems.
          </li>
        </ul>
      </section>

      <section>
        <h2>4. Intellectual Property</h2>
        <p>
          Upload only content you created or are authorized to use. Unauthorized re-uploads,
          piracy, and copyright infringement violate these Guidelines and our DMCA policy. Repeat
          infringers may be permanently banned.
        </p>
      </section>

      <section>
        <h2>5. Live Streaming and Chat</h2>
        <ul>
          <li>Live chat must follow the same standards as uploaded content.</li>
          <li>Do not stream while driving or performing other dangerous activities.</li>
          <li>Moderate your community and report violations using in-app tools.</li>
        </ul>
      </section>

      <section>
        <h2>6. Monetization Integrity</h2>
        <p>Creators participating in monetization programs must not:</p>
        <ul>
          <li>Artificially inflate views, likes, comments, or watch time.</li>
          <li>Use bots, click farms, or incentive schemes to manipulate metrics.</li>
          <li>Exploit the virtual gifting or ad systems through fraudulent activity.</li>
          <li>Mislead viewers about sponsorships or paid promotions (FTC disclosure required).</li>
        </ul>
      </section>

      <section>
        <h2>7. Advertising Standards</h2>
        <p>
          Advertisers must provide accurate creative and landing pages. Prohibited ad content
          includes illegal products, deceptive claims, malware, hate speech, and adult content.
          See our <a href="/advertise">Advertising page</a> for more information.
        </p>
      </section>

      <section>
        <h2>8. Enforcement</h2>
        <p>
          We use automated systems and human review to enforce these Guidelines. Depending on
          severity and history, enforcement may include warnings, age-restriction, demonetization,
          content removal, temporary suspension, or permanent account termination.
        </p>
        <p>
          If you see violating content, use the in-app report feature or contact{" "}
          <a href={`mailto:${LEGAL_CONTACT.support}`}>{LEGAL_CONTACT.support}</a>.
        </p>
      </section>

      <section>
        <h2>9. Appeals</h2>
        <p>
          If you believe enforcement action was taken in error, you may appeal by contacting{" "}
          <a href={`mailto:${LEGAL_CONTACT.support}`}>{LEGAL_CONTACT.support}</a> with your
          username and a description of the issue. We review appeals in a reasonable timeframe but
          do not guarantee reversal.
        </p>
      </section>
    </LegalPageShell>
  )
}
