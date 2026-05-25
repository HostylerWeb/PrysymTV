"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BottomNavigation } from "@/components/bottom-navigation"
import { SearchModal } from "@/components/search-modal"
import { useState } from "react"

export default function TermsPage() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  return (
    <main className="min-h-screen bg-background pb-24 md:pb-0 md:pl-20">
      <Header onSearchClick={() => setIsSearchOpen(true)} />
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-20">
        <h1 className="text-3xl md:text-5xl font-black text-foreground mb-8">Terms of Service</h1>
        <div className="prose prose-invert max-w-none text-muted-foreground">
          <p className="mb-8">Last updated: {new Date().toLocaleDateString()}</p>
          
          <h2 className="text-xl font-bold text-foreground mt-8 mb-4">1. Acceptance of Terms</h2>
          <p className="mb-4">By accessing, registering for, and using Prysym TV ("Platform", "we", "us", "our"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Platform. The Platform is operated primarily within the United States.</p>
          
          <h2 className="text-xl font-bold text-foreground mt-8 mb-4">2. Eligibility</h2>
          <p className="mb-4">You must be at least 13 years old to use the Platform. If you are under 18, you may use the Platform only with the involvement of a parent or guardian. By registering, you represent and warrant that you meet these eligibility requirements.</p>

          <h2 className="text-xl font-bold text-foreground mt-8 mb-4">3. User-Generated Content</h2>
          <p className="mb-4">You retain ownership of any content you upload, broadcast, or share on Prysym TV ("User Content"). By uploading, you grant Prysym TV a worldwide, non-exclusive, royalty-free license to use, reproduce, distribute, and display your User Content in connection with operating and providing the Platform.</p>
          <p className="mb-4">You are solely responsible for your User Content and agree not to upload content that is illegal, infringes on intellectual property rights, or violates our Community Guidelines.</p>

          <h2 className="text-xl font-bold text-foreground mt-8 mb-4">4. Digital Millennium Copyright Act (DMCA)</h2>
          <p className="mb-4">We respect the intellectual property rights of others. If you believe your copyright has been infringed, please submit a DMCA takedown notice to our designated Copyright Agent with the following information:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>A physical or electronic signature of the copyright owner.</li>
            <li>Identification of the copyrighted work claimed to have been infringed.</li>
            <li>Identification of the material that is claimed to be infringing and where it is located on the Platform.</li>
            <li>Your contact information (email and phone number).</li>
            <li>A statement of good faith belief that the use is not authorized by the copyright owner.</li>
          </ul>

          <h2 className="text-xl font-bold text-foreground mt-8 mb-4">5. Virtual Currency and Payments</h2>
          <p className="mb-4">Prysym TV allows users to purchase virtual currency ("Coins") to support creators. Coins have no real-world cash value and cannot be exchanged for fiat currency by standard users. All sales of Coins are final and non-refundable. Creators may exchange earned gifts for fiat currency subject to our Creator Payout Policy, which requires identity verification (KYC).</p>
          
          <h2 className="text-xl font-bold text-foreground mt-8 mb-4">6. Account Termination</h2>
          <p className="mb-4">We reserve the right to suspend or terminate your account at any time, without notice, for conduct that we believe violates these Terms, our Guidelines, or is harmful to other users of the Platform, us, or third parties.</p>

          <h2 className="text-xl font-bold text-foreground mt-8 mb-4">7. Disclaimer of Warranties and Limitation of Liability</h2>
          <p className="mb-4">The Platform is provided on an "AS IS" and "AS AVAILABLE" basis. Prysym TV makes no warranties, expressed or implied, regarding the operation of the Platform. To the maximum extent permitted by US law, Prysym TV will not be liable for any damages arising from the use of this Platform.</p>
          
          <h2 className="text-xl font-bold text-foreground mt-8 mb-4">8. Governing Law</h2>
          <p className="mb-4">These Terms shall be governed by and construed in accordance with the laws of the United States and the State of Delaware, without regard to its conflict of law provisions.</p>
        </div>
      </div>
      <Footer />
      <BottomNavigation activeTab="none" onTabChange={() => {}} onSearchClick={() => setIsSearchOpen(true)} />
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </main>
  )
}
