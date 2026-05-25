"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BottomNavigation } from "@/components/bottom-navigation"
import { SearchModal } from "@/components/search-modal"
import { useState } from "react"

export default function CookiesPage() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  return (
    <main className="min-h-screen bg-background pb-24 md:pb-0 md:pl-20">
      <Header onSearchClick={() => setIsSearchOpen(true)} />
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-20">
        <h1 className="text-3xl md:text-5xl font-black text-foreground mb-8">Cookie Policy</h1>
        <div className="prose prose-invert max-w-none text-muted-foreground">
          <p className="mb-8">Last updated: {new Date().toLocaleDateString()}</p>
          
          <h2 className="text-xl font-bold text-foreground mt-8 mb-4">1. What are cookies?</h2>
          <p className="mb-4">Cookies are small text files stored on your device (computer, tablet, or mobile) when you visit a website. They are widely used to make websites work more efficiently and provide a better, more personalized user experience.</p>
          
          <h2 className="text-xl font-bold text-foreground mt-8 mb-4">2. Types of Cookies We Use</h2>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li><strong>Essential Cookies:</strong> These are strictly necessary for the operation of Prysym TV. They enable core functions like security, network management, and account login.</li>
            <li><strong>Performance & Analytics Cookies:</strong> These cookies help us understand how visitors interact with our Platform by collecting and reporting information anonymously (e.g., page views, load times).</li>
            <li><strong>Functionality Cookies:</strong> These allow the Platform to remember choices you make (such as your language preference or region) and provide enhanced, personalized features.</li>
            <li><strong>Targeting & Advertising Cookies:</strong> These cookies are used to deliver advertisements more relevant to you and your interests. They are also used to limit the number of times you see an advertisement and measure the effectiveness of advertising campaigns.</li>
          </ul>

          <h2 className="text-xl font-bold text-foreground mt-8 mb-4">3. Third-Party Cookies</h2>
          <p className="mb-4">In addition to our own cookies, we may also use various third-party cookies to report usage statistics, deliver advertisements on and through the Platform, and integrate social media features. We do not control these third-party cookies and encourage you to read the privacy policies of these third-party providers.</p>

          <h2 className="text-xl font-bold text-foreground mt-8 mb-4">4. Managing Your Cookie Preferences</h2>
          <p className="mb-4">Most web browsers allow you to control cookies through their settings preferences. You can configure your browser to refuse all cookies or to indicate when a cookie is being sent. However, please note that disabling certain cookies may affect the functionality and your experience on Prysym TV.</p>
        </div>
      </div>
      <Footer />
      <BottomNavigation activeTab="none" onTabChange={() => {}} onSearchClick={() => setIsSearchOpen(true)} />
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </main>
  )
}
