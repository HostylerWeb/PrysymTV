"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

export interface User {
  id: string
  name: string
  username: string
  email: string
  avatar: string
  coins: number
  isStreamer: boolean
  streamerStatus: "none" | "pending" | "approved" | "rejected"
  streamerApplication?: {
    description: string
    idPhotoUrl: string
    submittedAt: string
  }
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (name: string, email: string, password: string) => Promise<boolean>
  logout: () => void
  updateCoins: (amount: number) => void
  applyForStreamer: (description: string, idPhotoUrl: string) => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for saved user in localStorage on mount
    const savedUser = localStorage.getItem("streamverse_user")
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setIsLoading(false)
  }, [])

  const saveUser = (userData: User | null) => {
    if (userData) {
      localStorage.setItem("streamverse_user", JSON.stringify(userData))
    } else {
      localStorage.removeItem("streamverse_user")
    }
    setUser(userData)
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simulate API call - accept any email/password for demo
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const mockUser: User = {
      id: "user_" + Date.now(),
      name: email.split("@")[0].replace(/[^a-zA-Z]/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
      username: "@" + email.split("@")[0].toLowerCase(),
      email: email,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
      coins: 1500,
      isStreamer: false,
      streamerStatus: "none"
    }
    
    saveUser(mockUser)
    return true
  }

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const mockUser: User = {
      id: "user_" + Date.now(),
      name: name,
      username: "@" + name.toLowerCase().replace(/\s+/g, ""),
      email: email,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
      coins: 500, // New users get 500 coins
      isStreamer: false,
      streamerStatus: "none"
    }
    
    saveUser(mockUser)
    return true
  }

  const logout = () => {
    saveUser(null)
  }

  const updateCoins = (amount: number) => {
    if (user) {
      const updatedUser = { ...user, coins: user.coins + amount }
      saveUser(updatedUser)
    }
  }

  const applyForStreamer = async (description: string, idPhotoUrl: string): Promise<boolean> => {
    if (!user) return false
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const updatedUser: User = {
      ...user,
      streamerStatus: "pending",
      streamerApplication: {
        description,
        idPhotoUrl,
        submittedAt: new Date().toISOString()
      }
    }
    
    saveUser(updatedUser)
    
    // Auto-approve after 3 seconds for demo purposes
    setTimeout(() => {
      const currentUser = JSON.parse(localStorage.getItem("streamverse_user") || "null")
      if (currentUser && currentUser.streamerStatus === "pending") {
        const approvedUser = {
          ...currentUser,
          isStreamer: true,
          streamerStatus: "approved"
        }
        localStorage.setItem("streamverse_user", JSON.stringify(approvedUser))
        setUser(approvedUser)
      }
    }, 3000)
    
    return true
  }

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      logout,
      updateCoins,
      applyForStreamer
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
