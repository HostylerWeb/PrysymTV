"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BottomNavigation } from "@/components/bottom-navigation"
import { SearchModal } from "@/components/search-modal"
import { useState } from "react"

export default function GuidelinesPage() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  return (
    <main className="min-h-screen bg-background pb-24 md:pb-0 md:pl-20">
      <Header onSearchClick={() => setIsSearchOpen(true)} />
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-20">
        <h1 className="text-3xl md:text-5xl font-black text-foreground mb-8">Community Guidelines</h1>
        <div className="prose prose-invert max-w-none text-muted-foreground">
          <p className="mb-8">Last updated: {new Date().toLocaleDateString()}</p>
          
          <h2 className="text-xl font-bold text-foreground mt-8 mb-4">1. Respect and Safety</h2>
          <p className="mb-4">Prysym TV is built on respect. We do not tolerate:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li><strong>Hate Speech:</strong> Content that promotes violence or incites hatred against individuals or groups based on race, ethnic origin, religion, disability, age, nationality, sexual orientation, gender, or gender identity.</li>
            <li><strong>Harassment and Bullying:</strong> Targeted attacks, malicious insults, threats, or coordinated harassment campaigns against any individual.</li>
            <li><strong>Violence and Graphic Content:</strong> Content that promotes violence, self-harm, or depicts gratuitous gore.</li>
          </ul>

          <h2 className="text-xl font-bold text-foreground mt-8 mb-4">2. Content Restrictions</h2>
          <p className="mb-4">To ensure a safe environment for all users, the following content is strictly prohibited:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li><strong>Sexually Explicit Content:</strong> Pornography, sexually explicit depictions, and non-consensual sexual content are banned.</li>
            <li><strong>Illegal Activities:</strong> Content promoting the sale of illegal goods, drug trafficking, terrorism, or other criminal acts.</li>
            <li><strong>Spam and Scams:</strong> Misleading metadata, mass automated posting, phishing attempts, or deceptive financial schemes.</li>
          </ul>

          <h2 className="text-xl font-bold text-foreground mt-8 mb-4">3. Originality and Copyright</h2>
          <p className="mb-4">We encourage original creations. Do not upload content that you did not create or do not have the legal right to use. Plagiarism, unauthorized re-uploads, and copyright infringement will result in content removal and potential account termination under our DMCA policy.</p>

          <h2 className="text-xl font-bold text-foreground mt-8 mb-4">4. Monetization Integrity</h2>
          <p className="mb-4">Creators participating in our monetization programs must adhere to strict integrity standards. Artificial inflation of views, engagement farming, or exploiting the virtual gifting system is strictly prohibited and will result in the forfeiture of earnings and account bans.</p>

          <h2 className="text-xl font-bold text-foreground mt-8 mb-4">5. Enforcement</h2>
          <p className="mb-4">We employ both automated systems and human moderators to enforce these guidelines. Violations may result in content removal, demonetization, account suspension, or permanent bans. If you encounter content that violates these guidelines, please use the in-app reporting tools.</p>
        </div>
      </div>
      <Footer />
      <BottomNavigation activeTab="none" onTabChange={() => {}} />
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </main>
  )
}
