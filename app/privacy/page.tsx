import { LegalPageShell } from "@/components/legal-page-shell"
import { LEGAL_CONTACT, LEGAL_ENTITY, PLATFORM_NAME } from "@/lib/legal/company"

export default function PrivacyPage() {
  return (
    <LegalPageShell
      title="Privacy Policy"
      description={`How ${PLATFORM_NAME} collects, uses, shares, and protects your personal information when you use our video streaming platform in the ${LEGAL_ENTITY} service areas.`}
    >
      <section>
        <h2>1. Introduction</h2>
        <p>
          {LEGAL_ENTITY} (&quot;{PLATFORM_NAME},&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;)
          operates an online video streaming and creator platform available at our website and
          related applications (collectively, the &quot;Platform&quot;). This Privacy Policy explains how we
          collect, use, disclose, and safeguard personal information about visitors, registered
          users, creators, advertisers, and other individuals who interact with the Platform.
        </p>
        <p>
          By accessing or using the Platform, you acknowledge that you have read this Privacy
          Policy. If you do not agree, please do not use the Platform.
        </p>
      </section>

      <section>
        <h2>2. Information We Collect</h2>
        <h3>2.1 Information You Provide Directly</h3>
        <ul>
          <li>
            <strong>Account information:</strong> username, display name, email address, password
            (stored in hashed form), profile photo, bio, and preferences.
          </li>
          <li>
            <strong>Creator and streamer applications:</strong> identity details, channel
            information, and materials you submit when applying to publish or broadcast.
          </li>
          <li>
            <strong>User-generated content:</strong> videos, shorts, live streams, podcasts,
            comments, messages, playlists, and metadata you upload or publish.
          </li>
          <li>
            <strong>Payments and monetization:</strong> billing-related information processed by
            our payment processor (Stripe). We do not store full payment card numbers on our
            servers.
          </li>
          <li>
            <strong>Advertiser accounts:</strong> company name, contact email, billing email, and
            campaign materials.
          </li>
          <li>
            <strong>Communications:</strong> support requests, reports, feedback, and correspondence
            with us.
          </li>
        </ul>

        <h3>2.2 Information Collected Automatically</h3>
        <ul>
          <li>
            <strong>Device and usage data:</strong> IP address, browser type, operating system,
            device identifiers, pages viewed, videos watched, watch history, likes, saves, search
            queries, referral URLs, and interaction timestamps.
          </li>
          <li>
            <strong>Live streaming data:</strong> stream titles, categories, viewer counts, chat
            messages, and technical stream metadata.
          </li>
          <li>
            <strong>Location information:</strong> approximate location derived from IP address or
            country/region settings. We do not collect precise GPS location unless you explicitly
            grant permission through your device.
          </li>
          <li>
            <strong>Cookies and similar technologies:</strong> see our{" "}
            <a href="/cookies">Cookie Policy</a> for details.
          </li>
        </ul>

        <h3>2.3 Information from Third Parties</h3>
        <ul>
          <li>Payment confirmation and fraud signals from Stripe.</li>
          <li>Analytics and infrastructure providers that help us operate the Platform.</li>
          <li>Publicly available information where permitted by law.</li>
        </ul>
      </section>

      <section>
        <h2>3. How We Use Your Information</h2>
        <p>We use personal information for the following purposes:</p>
        <ul>
          <li>Provide, operate, maintain, and improve the Platform.</li>
          <li>Create and manage your account and authenticate you.</li>
          <li>Deliver content, recommendations, and personalized experiences.</li>
          <li>Process purchases of virtual currency, memberships, and creator subscriptions.</li>
          <li>Calculate and distribute creator revenue, gifts, and payouts.</li>
          <li>Serve, measure, and limit advertising on the Platform.</li>
          <li>Enforce our Terms of Service, Community Guidelines, and legal obligations.</li>
          <li>Detect, investigate, and prevent fraud, abuse, security incidents, and illegal activity.</li>
          <li>Communicate with you about service updates, security alerts, and promotional messages (where permitted).</li>
          <li>Comply with law, respond to legal process, and protect rights, safety, and property.</li>
        </ul>
      </section>

      <section>
        <h2>4. How We Share Information</h2>
        <p>
          <strong>We do not sell your personal information.</strong> We also do not share personal
          information for cross-context behavioral advertising in a manner that constitutes a
          &quot;sale&quot; or &quot;sharing&quot; under applicable U.S. state privacy laws, except as described
          below or with your direction.
        </p>
        <p>We may share information with:</p>
        <ul>
          <li>
            <strong>Service providers:</strong> hosting, storage, encoding, analytics, email,
            customer support, payment processing (Stripe), and security vendors who process data on
            our behalf under contractual obligations.
          </li>
          <li>
            <strong>Creators and other users:</strong> information you choose to make public (profile,
            videos, comments, live chat, etc.).
          </li>
          <li>
            <strong>Advertisers:</strong> aggregated or de-identified campaign performance metrics.
            We do not provide advertisers with your name or contact details for ordinary ad delivery.
          </li>
          <li>
            <strong>Business transfers:</strong> in connection with a merger, acquisition,
            financing, or sale of assets, subject to appropriate safeguards.
          </li>
          <li>
            <strong>Legal and safety:</strong> when required by law, subpoena, court order, or
            government request, or when we believe disclosure is necessary to protect rights,
            safety, or investigate fraud or security issues.
          </li>
        </ul>
      </section>

      <section>
        <h2>5. Advertising</h2>
        <p>
          We and our advertising partners may use cookies, pixels, and similar technologies to
          deliver ads, measure impressions and clicks, cap frequency, and understand campaign
          performance. Prysym Membership subscribers may receive an ad-free experience on eligible
          placements. For more information, see our <a href="/cookies">Cookie Policy</a> and{" "}
          <a href="/advertise">Advertising page</a>.
        </p>
      </section>

      <section>
        <h2>6. Data Retention</h2>
        <p>
          We retain personal information for as long as necessary to provide the Platform, comply
          with legal obligations, resolve disputes, enforce agreements, and pursue legitimate
          business purposes. Retention periods vary depending on data type—for example, account data
          is kept while your account is active and for a reasonable period thereafter; transaction
          records may be retained longer for tax, accounting, and legal compliance.
        </p>
      </section>

      <section>
        <h2>7. Security</h2>
        <p>
          We implement administrative, technical, and organizational safeguards designed to protect
          personal information, including encryption in transit, access controls, and secure
          credential storage. No method of transmission or storage is completely secure; we cannot
          guarantee absolute security.
        </p>
      </section>

      <section>
        <h2>8. Children&apos;s Privacy (COPPA)</h2>
        <p>
          The Platform is not directed to children under 13 years of age, and we do not knowingly
          collect personal information from children under 13. If you are a parent or guardian and
          believe your child under 13 has provided us personal information, contact us at{" "}
          <a href={`mailto:${LEGAL_CONTACT.privacy}`}>{LEGAL_CONTACT.privacy}</a> and we will take
          steps to delete such information and terminate the associated account where appropriate.
        </p>
        <p>
          Users between 13 and 17 should use the Platform only with parental or guardian permission
          where required by applicable law.
        </p>
      </section>

      <section>
        <h2>9. Your U.S. State Privacy Rights</h2>
        <h3>9.1 California Residents (CCPA / CPRA)</h3>
        <p>
          If you are a California resident, you may have the right to: (a) know the categories and
          specific pieces of personal information we collect; (b) know the categories of sources,
          business purposes, and categories of third parties with whom we share information; (c)
          request deletion of personal information, subject to exceptions; (d) correct inaccurate
          personal information; (e) opt out of the sale or sharing of personal information (we do
          not sell personal information as defined by the CCPA/CPRA); and (f) not receive
          discriminatory treatment for exercising privacy rights.
        </p>
        <p>
          <strong>Categories collected (last 12 months):</strong> identifiers; commercial
          information; internet or network activity; geolocation (approximate); audio, visual, or
          similar information (user content); professional information (advertisers); and inferences
          drawn from the above for personalization and security.
        </p>
        <p>
          To submit a request, email{" "}
          <a href={`mailto:${LEGAL_CONTACT.privacy}`}>{LEGAL_CONTACT.privacy}</a> with
          &quot;California Privacy Request&quot; in the subject line. We will verify your request as
          required by law.
        </p>

        <h3>9.2 Other U.S. States</h3>
        <p>
          Residents of Virginia, Colorado, Connecticut, Utah, Texas, Oregon, and other states with
          comprehensive privacy laws may have similar rights to access, delete, correct, and obtain
          a portable copy of personal information, and to opt out of certain processing. Submit
          requests to{" "}
          <a href={`mailto:${LEGAL_CONTACT.privacy}`}>{LEGAL_CONTACT.privacy}</a>.
        </p>

        <h3>9.3 Nevada Residents</h3>
        <p>
          Nevada residents may submit a request to opt out of the sale of covered information. We do
          not currently sell covered information as defined under Nevada law. Contact{" "}
          <a href={`mailto:${LEGAL_CONTACT.privacy}`}>{LEGAL_CONTACT.privacy}</a> with questions.
        </p>
      </section>

      <section>
        <h2>10. Marketing Communications</h2>
        <p>
          We may send promotional emails or in-app messages where permitted. You may opt out of
          marketing emails by using the unsubscribe link in the message or contacting{" "}
          <a href={`mailto:${LEGAL_CONTACT.support}`}>{LEGAL_CONTACT.support}</a>. Transactional
          and service-related communications may still be sent.
        </p>
      </section>

      <section>
        <h2>11. International Users</h2>
        <p>
          The Platform is operated from the United States. If you access the Platform from outside
          the U.S., your information may be transferred to, stored in, and processed in the United
          States and other countries where we or our service providers operate. Those countries may
          have different data protection laws than your jurisdiction.
        </p>
      </section>

      <section>
        <h2>12. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will post the revised policy on
          this page and update the &quot;Last updated&quot; date. Material changes may be communicated
          through the Platform or by email where appropriate. Continued use after changes become
          effective constitutes acceptance of the updated policy.
        </p>
      </section>

      <section>
        <h2>13. Contact Us</h2>
        <p>
          For privacy questions or to exercise your rights, contact:
        </p>
        <p>
          {LEGAL_ENTITY}
          <br />
          Email: <a href={`mailto:${LEGAL_CONTACT.privacy}`}>{LEGAL_CONTACT.privacy}</a>
        </p>
      </section>
    </LegalPageShell>
  )
}
