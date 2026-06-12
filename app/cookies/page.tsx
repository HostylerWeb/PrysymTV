import { LegalPageShell } from "@/components/legal-page-shell"
import { LEGAL_CONTACT, LEGAL_ENTITY, PLATFORM_NAME } from "@/lib/legal/company"

export default function CookiesPage() {
  return (
    <LegalPageShell
      title="Cookie Policy"
      description={`How ${PLATFORM_NAME} uses cookies, pixels, local storage, and similar technologies.`}
    >
      <section>
        <h2>1. Introduction</h2>
        <p>
          This Cookie Policy explains how {LEGAL_ENTITY} (&quot;{PLATFORM_NAME}&quot;) uses cookies and
          similar technologies when you visit or use our Platform. It should be read together with
          our <a href="/privacy">Privacy Policy</a>.
        </p>
      </section>

      <section>
        <h2>2. What Are Cookies and Similar Technologies?</h2>
        <p>
          Cookies are small text files placed on your device when you visit a website. We also use
          local storage, session storage, pixels, and software development kits (SDKs) that
          function similarly—for example, to remember your login session or measure ad
          performance.
        </p>
      </section>

      <section>
        <h2>3. Types of Technologies We Use</h2>
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th>Purpose</th>
              <th>Examples</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Strictly necessary</strong></td>
              <td>Core functionality, security, authentication, load balancing</td>
              <td>Session tokens, CSRF protection, cookie consent state</td>
            </tr>
            <tr>
              <td><strong>Functional</strong></td>
              <td>Remember preferences and settings</td>
              <td>Volume mute state, UI preferences, language</td>
            </tr>
            <tr>
              <td><strong>Analytics</strong></td>
              <td>Understand usage, diagnose errors, improve performance</td>
              <td>Page views, watch events, feature usage metrics</td>
            </tr>
            <tr>
              <td><strong>Advertising</strong></td>
              <td>Deliver ads, measure impressions/clicks, frequency capping</td>
              <td>Ad campaign IDs, impression counters, attribution</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2>4. First-Party and Third-Party Cookies</h2>
        <p>
          <strong>First-party cookies</strong> are set by {PLATFORM_NAME} when you use our domain.
        </p>
        <p>
          <strong>Third-party cookies</strong> may be set by service providers such as:
        </p>
        <ul>
          <li>
            <strong>Stripe</strong> — payment processing and fraud prevention when you purchase
            coins, memberships, or subscriptions.
          </li>
          <li>
            <strong>Infrastructure and analytics partners</strong> — hosting, CDN, and usage
            analytics that help us operate the Platform.
          </li>
        </ul>
        <p>
          We do not control third-party cookies. Review the privacy policies of those providers for
          more information.
        </p>
      </section>

      <section>
        <h2>5. Local Storage and Authentication</h2>
        <p>
          When you log in, we may store access tokens in your browser&apos;s local storage to keep you
          signed in. These are essential for account functionality. Logging out or clearing site
          data removes them.
        </p>
      </section>

      <section>
        <h2>6. Advertising Cookies</h2>
        <p>
          We serve ads in placements such as the home banner, shorts interstitials, movie prerolls,
          and vertical episode gates. Advertising technologies help us:
        </p>
        <ul>
          <li>Count impressions and clicks for billing and reporting.</li>
          <li>Attribute ad performance to campaigns and placements.</li>
          <li>Limit how often you see the same ad.</li>
        </ul>
        <p>
          Prysym Membership may provide an ad-free experience on eligible placements. Learn more on
          our <a href="/advertise">Advertising page</a>.
        </p>
      </section>

      <section>
        <h2>7. Your Choices</h2>
        <h3>7.1 Browser Controls</h3>
        <p>
          Most browsers let you block or delete cookies through settings. Blocking strictly
          necessary cookies may prevent you from logging in or using core features.
        </p>
        <h3>7.2 Mobile Devices</h3>
        <p>
          Mobile operating systems may offer advertising identifiers and reset options in device
          settings.
        </p>
        <h3>7.3 Do Not Track</h3>
        <p>
          Some browsers send &quot;Do Not Track&quot; (DNT) signals. There is no uniform industry standard
          for responding to DNT. We currently do not respond to DNT signals, but you can manage
          cookies as described above.
        </p>
        <h3>7.4 U.S. State Opt-Out Rights</h3>
        <p>
          Residents of certain U.S. states may have rights to opt out of the sale or sharing of
          personal information for targeted advertising. We do not sell personal information as
          defined under applicable state laws. For privacy requests, contact{" "}
          <a href={`mailto:${LEGAL_CONTACT.privacy}`}>{LEGAL_CONTACT.privacy}</a>.
        </p>
      </section>

      <section>
        <h2>8. Cookie Retention</h2>
        <p>
          Session cookies expire when you close your browser. Persistent cookies remain until they
          expire or you delete them. Retention periods vary by cookie type and purpose.
        </p>
      </section>

      <section>
        <h2>9. Updates</h2>
        <p>
          We may update this Cookie Policy from time to time. Changes will be posted on this page
          with an updated &quot;Last updated&quot; date.
        </p>
      </section>

      <section>
        <h2>10. Contact</h2>
        <p>
          Questions about this Cookie Policy:
          <br />
          <a href={`mailto:${LEGAL_CONTACT.privacy}`}>{LEGAL_CONTACT.privacy}</a>
        </p>
      </section>
    </LegalPageShell>
  )
}
