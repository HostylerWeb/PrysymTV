import { LegalPageShell } from "@/components/legal-page-shell"
import { GOVERNING_STATE, LEGAL_CONTACT, LEGAL_ENTITY, PLATFORM_NAME } from "@/lib/legal/company"

export default function TermsPage() {
  return (
    <LegalPageShell
      title="Terms of Service"
      description={`The binding agreement between you and ${LEGAL_ENTITY} governing use of ${PLATFORM_NAME}.`}
    >
      <section>
        <h2>1. Agreement to Terms</h2>
        <p>
          These Terms of Service (&quot;Terms&quot;) constitute a legally binding agreement between you and{" "}
          {LEGAL_ENTITY} (&quot;{PLATFORM_NAME},&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) governing your access to and
          use of our websites, applications, APIs, and related services (collectively, the
          &quot;Platform&quot;). By creating an account, accessing, or using the Platform, you agree to
          these Terms and our <a href="/privacy">Privacy Policy</a>,{" "}
          <a href="/cookies">Cookie Policy</a>, and <a href="/guidelines">Community Guidelines</a>,
          which are incorporated by reference.
        </p>
        <p>If you do not agree, do not use the Platform.</p>
      </section>

      <section>
        <h2>2. Eligibility</h2>
        <p>
          You must be at least 13 years old to use the Platform. If you are between 13 and the age
          of majority in your jurisdiction, you may use the Platform only with the consent and
          supervision of a parent or legal guardian who agrees to these Terms on your behalf.
        </p>
        <p>
          You represent that you have the legal capacity to enter into these Terms and that all
          registration information you provide is accurate and current.
        </p>
      </section>

      <section>
        <h2>3. The Platform and Services</h2>
        <p>
          {PLATFORM_NAME} provides a user-generated content platform for watching and publishing
          videos, shorts, movies, podcasts, live streams, vertical series, and related social
          features. Features may change, be added, or removed at any time. We do not guarantee
          uninterrupted or error-free operation.
        </p>
      </section>

      <section>
        <h2>4. Accounts and Security</h2>
        <ul>
          <li>You are responsible for maintaining the confidentiality of your login credentials.</li>
          <li>You are responsible for all activity under your account.</li>
          <li>Notify us immediately of unauthorized access at{" "}
            <a href={`mailto:${LEGAL_CONTACT.support}`}>{LEGAL_CONTACT.support}</a>.
          </li>
          <li>We may suspend or terminate accounts that violate these Terms or pose security risks.</li>
        </ul>
      </section>

      <section>
        <h2>5. User-Generated Content</h2>
        <h3>5.1 Your Content</h3>
        <p>
          You retain ownership of content you upload, stream, or publish (&quot;User Content&quot;). By
          submitting User Content, you grant {PLATFORM_NAME} a worldwide, non-exclusive,
          royalty-free, sublicensable, and transferable license to host, store, reproduce, distribute,
          publicly perform, publicly display, adapt, and otherwise use your User Content in
          connection with operating, promoting, and improving the Platform and our business. This
          license continues for a commercially reasonable period after removal to the extent
          necessary for backups, legal compliance, and completed transactions.
        </p>
        <h3>5.2 Your Responsibilities</h3>
        <p>You represent and warrant that:</p>
        <ul>
          <li>You own or have all necessary rights to your User Content and its publication.</li>
          <li>Your User Content does not violate law or third-party rights.</li>
          <li>Your User Content complies with our Community Guidelines.</li>
        </ul>
        <h3>5.3 Moderation</h3>
        <p>
          We may review, remove, restrict, or disable access to User Content at our discretion,
          including for violations of these Terms or applicable law. We are not obligated to monitor
          all User Content.
        </p>
      </section>

      <section>
        <h2>6. Creator, Streamer, and Monetization Terms</h2>
        <ul>
          <li>
            Creators and streamers must comply with additional program requirements, tax obligations,
            and identity verification (KYC) for payouts.
          </li>
          <li>
            Revenue shares, gift conversions, and payout schedules are governed by in-platform
            policies and admin-configured rules, which may change with notice where required.
          </li>
          <li>
            Artificial inflation of views, engagement, gifts, or ad impressions is prohibited and
            may result in forfeiture of earnings and account termination.
          </li>
          <li>
            We may withhold or reverse payouts associated with fraud, chargebacks, or Terms violations.
          </li>
        </ul>
      </section>

      <section>
        <h2>7. Virtual Currency, Gifts, and Payments</h2>
        <ul>
          <li>
            <strong>Coins:</strong> Virtual currency purchased on the Platform has no cash value
            outside the Platform, is non-transferable except as we expressly permit, and is
            generally non-refundable except where required by law.
          </li>
          <li>
            <strong>Gifts:</strong> Virtual gifts sent to creators have no monetary value to senders
            and are not redeemable for cash by senders.
          </li>
          <li>
            <strong>Memberships and subscriptions:</strong> Prysym Membership and creator channel
            subscriptions are billed through Stripe or dev-mode equivalents. Subscription terms,
            renewal, and cancellation are disclosed at purchase.
          </li>
          <li>
            <strong>Chargebacks:</strong> Fraudulent chargebacks may result in account suspension
            and recovery of associated virtual items or earnings.
          </li>
        </ul>
      </section>

      <section>
        <h2>8. Advertising</h2>
        <p>
          The Platform may display third-party and first-party advertisements. Advertisers are
          subject to separate requirements. See our <a href="/advertise">Advertising page</a>.
          Prysym Membership may provide ad-free access to eligible placements as described at
          purchase.
        </p>
      </section>

      <section>
        <h2>9. Prohibited Conduct</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Violate law, regulation, or third-party rights.</li>
          <li>Upload malware, spam, phishing content, or deceptive schemes.</li>
          <li>Harass, threaten, dox, or exploit others.</li>
          <li>Circumvent access controls, rate limits, or security measures.</li>
          <li>Scrape, crawl, or harvest data except as permitted by our APIs or written consent.</li>
          <li>Use bots or automation to manipulate metrics, ads, or rankings.</li>
          <li>Impersonate any person or entity.</li>
          <li>Reverse engineer the Platform except where prohibited by law.</li>
        </ul>
      </section>

      <section>
        <h2>10. Intellectual Property</h2>
        <p>
          The Platform, including its software, design, trademarks, logos, and proprietary content
          (excluding User Content), is owned by {LEGAL_ENTITY} or its licensors and protected by
          intellectual property laws. No rights are granted except as expressly stated in these
          Terms.
        </p>
      </section>

      <section>
        <h2>11. DMCA Copyright Policy</h2>
        <p>
          We respect intellectual property rights and respond to notices of alleged infringement
          under the Digital Millennium Copyright Act (17 U.S.C. § 512).
        </p>
        <p>
          <strong>Designated Copyright Agent:</strong>
          <br />
          {LEGAL_ENTITY} — DMCA Agent
          <br />
          Email: <a href={`mailto:${LEGAL_CONTACT.dmca}`}>{LEGAL_CONTACT.dmca}</a>
        </p>
        <p>A valid DMCA notice must include:</p>
        <ol>
          <li>Physical or electronic signature of the copyright owner or authorized agent.</li>
          <li>Identification of the copyrighted work claimed to be infringed.</li>
          <li>
            Identification of the infringing material and information reasonably sufficient to
            locate it on the Platform (URL or ID).
          </li>
          <li>Your contact information (address, telephone, email).</li>
          <li>
            A statement of good-faith belief that the use is not authorized by the copyright owner,
            its agent, or the law.
          </li>
          <li>
            A statement, under penalty of perjury, that the information in the notice is accurate
            and that you are authorized to act on behalf of the copyright owner.
          </li>
        </ol>
        <p>
          Counter-notices must comply with 17 U.S.C. § 512(g). We may terminate repeat infringers
          in appropriate circumstances.
        </p>
      </section>

      <section>
        <h2>12. Third-Party Links and Services</h2>
        <p>
          The Platform may contain links to third-party websites, including advertiser destinations
          that open in a new browser tab. We are not responsible for third-party content, policies,
          or practices. Your use of third-party services (including Stripe) is subject to their
          terms.
        </p>
      </section>

      <section>
        <h2>13. Disclaimers</h2>
        <p>
          THE PLATFORM IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND,
          WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY,
          FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT
          THE PLATFORM WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE, OR THAT USER CONTENT WILL BE
          ACCURATE OR RELIABLE.
        </p>
        <p>
          SOME JURISDICTIONS DO NOT ALLOW EXCLUSION OF IMPLIED WARRANTIES; IN SUCH CASES, THE
          ABOVE EXCLUSIONS APPLY TO THE MAXIMUM EXTENT PERMITTED BY LAW.
        </p>
      </section>

      <section>
        <h2>14. Limitation of Liability</h2>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, {LEGAL_ENTITY.toUpperCase()} AND ITS
          OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, AND AFFILIATES WILL NOT BE LIABLE FOR ANY
          INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, OR ANY LOSS
          OF PROFITS, REVENUE, DATA, OR GOODWILL, ARISING FROM OR RELATED TO YOUR USE OF THE
          PLATFORM, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
        </p>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, OUR TOTAL LIABILITY FOR ANY CLAIM ARISING OUT OF
          OR RELATING TO THESE TERMS OR THE PLATFORM WILL NOT EXCEED THE GREATER OF (A) ONE HUNDRED
          U.S. DOLLARS ($100) OR (B) THE AMOUNT YOU PAID US IN THE TWELVE (12) MONTHS BEFORE THE
          EVENT GIVING RISE TO THE CLAIM.
        </p>
        <p>
          SOME JURISDICTIONS DO NOT ALLOW LIMITATIONS OF LIABILITY; IN SUCH CASES, OUR LIABILITY IS
          LIMITED TO THE MAXIMUM EXTENT PERMITTED BY LAW.
        </p>
      </section>

      <section>
        <h2>15. Indemnification</h2>
        <p>
          You agree to defend, indemnify, and hold harmless {LEGAL_ENTITY} and its affiliates,
          officers, directors, employees, and agents from any claims, damages, losses, liabilities,
          and expenses (including reasonable attorneys&apos; fees) arising from your User Content, your
          use of the Platform, or your violation of these Terms or applicable law.
        </p>
      </section>

      <section>
        <h2>16. Dispute Resolution and Governing Law</h2>
        <p>
          These Terms are governed by the laws of the State of {GOVERNING_STATE} and the federal
          laws of the United States, without regard to conflict-of-law principles.
        </p>
        <p>
          Except where prohibited by law, you and {PLATFORM_NAME} agree that any dispute arising
          out of or relating to these Terms or the Platform will be resolved exclusively in the
          state or federal courts located in {GOVERNING_STATE}, and you consent to personal
          jurisdiction in those courts.
        </p>
        <p>
          You may have the right to bring claims in your local courts under mandatory consumer
          protection laws that cannot be waived by contract.
        </p>
      </section>

      <section>
        <h2>17. Termination</h2>
        <p>
          You may stop using the Platform at any time. We may suspend or terminate your access,
          with or without notice, for any reason, including violation of these Terms. Upon
          termination, provisions that by their nature should survive (including intellectual
          property, disclaimers, limitations of liability, and indemnification) will survive.
        </p>
      </section>

      <section>
        <h2>18. Changes to Terms</h2>
        <p>
          We may modify these Terms at any time. We will post updated Terms on this page and update
          the &quot;Last updated&quot; date. Material changes may be communicated through the Platform or
          email. Continued use after changes become effective constitutes acceptance.
        </p>
      </section>

      <section>
        <h2>19. Contact</h2>
        <p>
          {LEGAL_ENTITY}
          <br />
          Email: <a href={`mailto:${LEGAL_CONTACT.legal}`}>{LEGAL_CONTACT.legal}</a>
        </p>
      </section>
    </LegalPageShell>
  )
}
