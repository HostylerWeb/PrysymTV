"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BottomNavigation } from "@/components/bottom-navigation"
import { SearchModal } from "@/components/search-modal"
import { useState } from "react"

export default function PrivacyPage() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  return (
    <main className="min-h-screen bg-background pb-24 md:pb-0 md:pl-20">
      <Header onSearchClick={() => setIsSearchOpen(true)} />
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-20">
        <h1 className="text-3xl md:text-5xl font-black text-foreground mb-8">Privacy Policy</h1>
        <div className="prose prose-invert max-w-none text-muted-foreground">
          <p className="mb-8">Last updated: {new Date().toLocaleDateString()}</p>
          
          <h2 className="text-xl font-bold text-foreground mt-8 mb-4">1. Information We Collect</h2>
          <p className="mb-4">We collect information to provide, maintain, and improve our services. This includes:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li><strong>Information you provide:</strong> Account details (email, username), profile information, user-generated content, and payment information (processed securely via Stripe).</li>
            <li><strong>Automatically collected information:</strong> IP addresses, device types, browser types, interaction data (watch history, likes, comments), and cookies.</li>
          </ul>

          <h2 className="text-xl font-bold text-foreground mt-8 mb-4">2. How We Use Your Information</h2>
          <p className="mb-4">We use the information we collect to:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Provide and personalize the Platform.</li>
            <li>Process transactions and payout creators.</li>
            <li>Analyze usage trends and improve performance.</li>
            <li>Communicate with you regarding updates, security alerts, and promotional offers.</li>
          </ul>

          <h2 className="text-xl font-bold text-foreground mt-8 mb-4">3. Sharing of Information</h2>
          <p className="mb-4">We do not sell your personal information to third parties. We may share information with trusted third-party service providers (e.g., cloud hosting, payment processors) who assist us in operating the Platform. We may also disclose information if required by law or to protect our rights and the safety of our users.</p>

          <h2 className="text-xl font-bold text-foreground mt-8 mb-4">4. California Privacy Rights (CCPA/CPRA)</h2>
          <p className="mb-4">If you are a California resident, you have the right to request access to the personal information we collect, request the deletion of your data, and opt-out of the sale or sharing of your personal information. To exercise these rights, please contact our privacy team.</p>

          <h2 className="text-xl font-bold text-foreground mt-8 mb-4">5. Children's Privacy (COPPA)</h2>
          <p className="mb-4">Prysym TV is not directed at children under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that a child under 13 has provided us with personal information, we will take steps to delete such information and terminate the child's account.</p>

          <h2 className="text-xl font-bold text-foreground mt-8 mb-4">6. Data Security and Retention</h2>
          <p className="mb-4">We implement industry-standard security measures to protect your data. We retain personal information only for as long as necessary to fulfill the purposes outlined in this policy or as required by law.</p>
        </div>
      </div>
      <Footer />
      <BottomNavigation activeTab="none" onTabChange={() => {}} />
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </main>
  )
}
