"use client"

import {
  createContext,
  useContext,
  useLayoutEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react"
import { ApiError, loadStoredAccessToken, setAccessToken } from "@/lib/api-client"
import * as authApi from "@/lib/api/auth"
import { fetchMe, applyStreamer as applyStreamerApi } from "@/lib/api/users"
import { mapMeToUser } from "@/lib/api/map-user"

export interface User {
  id: string
  name: string
  username: string
  email: string
  avatar: string
  bio: string
  coins: number
  isStreamer: boolean
  streamerStatus: "none" | "pending" | "approved" | "rejected"
  followersCount: number
  followingCount: number
  videosCount: number
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
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  updateCoins: (amount: number) => void
  applyForStreamer: (description: string, idPhotoUrl: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    const me = await fetchMe()
    setUser(mapMeToUser(me))
  }, [])

  useLayoutEffect(() => {
    let cancelled = false

    async function hydrate() {
      loadStoredAccessToken()
      try {
        const me = await fetchMe()
        if (!cancelled) setUser(mapMeToUser(me))
      } catch {
        setAccessToken(null)
        if (!cancelled) setUser(null)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void hydrate()
    return () => {
      cancelled = true
    }
  }, [])

  const login = async (email: string, password: string) => {
    await authApi.login(email, password)
    const me = await fetchMe()
    setUser(mapMeToUser(me))
  }

  const register = async (name: string, email: string, password: string) => {
    const username = authApi.deriveUsername(name, email)
    await authApi.register({
      email,
      username,
      password,
      displayName: name,
    })
    const me = await fetchMe()
    setUser(mapMeToUser(me))
  }

  const logout = async () => {
    await authApi.logout()
    setUser(null)
  }

  const updateCoins = (amount: number) => {
    setUser((prev) =>
      prev ? { ...prev, coins: Math.max(0, prev.coins + amount) } : null,
    )
  }

  const applyForStreamer = async (description: string, idPhotoUrl: string) => {
    await applyStreamerApi(description, idPhotoUrl)
    const me = await fetchMe()
    setUser(mapMeToUser(me))
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
        updateCoins,
        applyForStreamer,
      }}
    >
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

export function getAuthErrorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message
  if (err instanceof Error) return err.message
  return "An error occurred. Please try again."
}
