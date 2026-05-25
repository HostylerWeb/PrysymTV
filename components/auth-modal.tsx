"use client"

import { useState } from "react"
import { X, Mail, Lock, User, Eye, EyeOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: "login" | "register"
}

export function AuthModal({ isOpen, onClose, initialMode = "login" }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register" | "forgot_email" | "forgot_code" | "forgot_new">(initialMode)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  
  const [resetCode, setResetCode] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  
  const { login, register } = useAuth()

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      if (mode === "login") {
        if (!email || !password) {
          setError("Please fill in all fields")
          setIsLoading(false)
          return
        }
        const success = await login(email, password)
        if (success) {
          onClose()
          resetForm()
        }
      } else if (mode === "register") {
        if (!name || !email || !password) {
          setError("Please fill in all fields")
          setIsLoading(false)
          return
        }
        const success = await register(name, email, password)
        if (success) {
          onClose()
          resetForm()
        }
      } else if (mode === "forgot_email") {
        if (!email) {
          setError("Please enter your email")
          setIsLoading(false)
          return
        }
        // Simulate sending code
        await new Promise(resolve => setTimeout(resolve, 1000))
        setMode("forgot_code")
      } else if (mode === "forgot_code") {
        if (resetCode.length !== 6) {
          setError("Please enter a 6-digit code")
          setIsLoading(false)
          return
        }
        setMode("forgot_new")
      } else if (mode === "forgot_new") {
        if (!password || !confirmPassword) {
          setError("Please fill in all fields")
          setIsLoading(false)
          return
        }
        if (password !== confirmPassword) {
          setError("Passwords do not match")
          setIsLoading(false)
          return
        }
        // Simulate password reset and login
        await new Promise(resolve => setTimeout(resolve, 1000))
        const success = await login(email, password)
        if (success) {
          onClose()
          resetForm()
        }
      }
    } catch {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setName("")
    setEmail("")
    setPassword("")
    setResetCode("")
    setConfirmPassword("")
    setError("")
    setMode("login")
  }

  const switchMode = () => {
    setMode(mode === "login" ? "register" : "login")
    setError("")
  }

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/70 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div 
        className="w-full sm:max-w-md bg-background rounded-t-3xl sm:rounded-2xl overflow-hidden animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4 text-center">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
          
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🎬</span>
          </div>
          <h2 className="text-2xl font-bold text-foreground">
            {mode === "login" ? "Welcome Back" : 
             mode === "register" ? "Create Account" : 
             mode === "forgot_email" ? "Reset Password" :
             mode === "forgot_code" ? "Enter Code" : "New Password"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "login" ? "Sign in to continue to Prysym TV" : 
             mode === "register" ? "Join Prysym TV and start watching" :
             mode === "forgot_email" ? "Enter your email to receive a reset code" :
             mode === "forgot_code" ? "Enter the 6-digit code sent to your email" :
             "Create a new password for your account"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 pb-8 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive text-center">{error}</p>
            </div>
          )}

          {mode === "register" && (
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                className="w-full h-12 pl-12 pr-4 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}

          {(mode === "login" || mode === "register" || mode === "forgot_email") && (
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full h-12 pl-12 pr-4 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}

          {mode === "forgot_code" && (
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="6-digit code"
                className="w-full h-12 pl-12 pr-4 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary tracking-[0.5em] text-center"
              />
            </div>
          )}

          {(mode === "login" || mode === "register" || mode === "forgot_new") && (
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "forgot_new" ? "New Password" : "Password"}
                className="w-full h-12 pl-12 pr-12 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <Eye className="w-5 h-5 text-muted-foreground" />
                )}
              </button>
            </div>
          )}

          {mode === "forgot_new" && (
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm New Password"
                className="w-full h-12 pl-12 pr-12 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}

          {mode === "login" && (
            <button 
              type="button"
              onClick={() => {
                setMode("forgot_email")
                setError("")
              }}
              className="text-sm text-primary font-medium w-full text-right"
            >
              Forgot password?
            </button>
          )}

          <Button 
            type="submit" 
            className="w-full h-12 rounded-xl text-base font-semibold"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : mode === "login" ? (
              "Sign In"
            ) : mode === "register" ? (
              "Create Account"
            ) : mode === "forgot_email" ? (
              "Send Code"
            ) : mode === "forgot_code" ? (
              "Verify Code"
            ) : (
              "Reset Password & Sign In"
            )}
          </Button>

          {(mode === "login" || mode === "register") && (
            <>
              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  className="flex-1 h-12 rounded-xl bg-secondary flex items-center justify-center gap-2 hover:bg-secondary/80 transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="text-sm font-medium text-foreground">Google</span>
                </button>
                <button
                  type="button"
                  className="flex-1 h-12 rounded-xl bg-secondary flex items-center justify-center gap-2 hover:bg-secondary/80 transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
                  </svg>
                  <span className="text-sm font-medium text-foreground">GitHub</span>
                </button>
              </div>
            </>
          )}

          <p className="text-center text-sm text-muted-foreground pt-4">
            {mode === "login" ? "Don't have an account? " : 
             mode === "register" ? "Already have an account? " :
             "Remember your password? "}
            <button 
              type="button"
              onClick={() => mode === "login" ? setMode("register") : setMode("login")}
              className="text-primary font-semibold"
            >
              {mode === "login" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </form>
      </div>
    </div>
  )
}
