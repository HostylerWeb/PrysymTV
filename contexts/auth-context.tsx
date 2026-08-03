"use client"

import {
  createContext,
  useContext,
  useLayoutEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react"
import {
  ApiError,
  ACCESS_TOKEN_STORAGE_KEY,
  ensureAccessToken,
  refreshSession,
  setAccessToken,
} from "@/lib/api-client"
import * as authApi from "@/lib/api/auth"
import {
  fetchMe,
  applyStreamer as applyStreamerApi,
  applyVerticalCreator as applyVerticalCreatorApi,
} from "@/lib/api/users"
import { mapMeToUser } from "@/lib/api/map-user"
import type { UserGenderValue } from "@/lib/user-gender"

export interface User {
  id: string
  role: string
  name: string
  username: string
  email: string
  avatar: string
  bannerUrl: string | null
  bio: string
  coins: number
  premiumTier: string
  premiumExpiresAt: string | null
  insiderActive: boolean
  insiderPeriodEnd: string | null
  isStreamer: boolean
  streamerStatus: "none" | "pending" | "approved" | "rejected"
  isVerticalCreator: boolean
  verticalCreatorStatus: "none" | "pending" | "approved" | "rejected"
  storeCreatorStatus: "none" | "pending" | "approved" | "rejected"
  followersCount: number
  followingCount: number
  videosCount: number
  gender: string | null
  birthDate: string | null
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
  register: (
    name: string,
    email: string,
    password: string,
    gender: UserGenderValue,
  ) => Promise<void>
  loginWithGoogle: (idToken: string) => Promise<void>
  loginWithApple: (
    identityToken: string,
    authorizationCode?: string,
  ) => Promise<void>
  loginWithFacebook: (accessToken: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  updateCoins: (amount: number) => void
  applyForStreamer: (description: string, idPhotoUrl: string) => Promise<void>
  applyForVerticalCreator: (
    description: string,
    idDocumentUrl: string,
    portfolioUrl?: string,
  ) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    const token = await ensureAccessToken()
    if (!token) {
      setUser(null)
      return
    }
    const me = await fetchMe()
    setUser(mapMeToUser(me))
  }, [])

  useLayoutEffect(() => {
    let cancelled = false

    async function hydrateFromToken(token: string | null) {
      if (!token) {
        if (!cancelled) {
          setUser(null)
          setIsLoading(false)
        }
        return
      }

      try {
        const me = await fetchMe()
        if (!cancelled) setUser(mapMeToUser(me))
      } catch {
        try {
          const refreshed = await refreshSession()
          if (!refreshed) throw new Error("refresh failed")
          const me = await fetchMe()
          if (!cancelled) setUser(mapMeToUser(me))
        } catch {
          setAccessToken(null)
          if (!cancelled) setUser(null)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    async function hydrate() {
      const token = await ensureAccessToken()
      await hydrateFromToken(token)
    }

    function onStorage(event: StorageEvent) {
      if (event.key !== ACCESS_TOKEN_STORAGE_KEY || cancelled) return
      if (event.newValue) {
        setAccessToken(event.newValue)
        void hydrateFromToken(event.newValue)
      } else {
        setAccessToken(null)
        setUser(null)
      }
    }

    void hydrate()
    window.addEventListener("storage", onStorage)
    return () => {
      cancelled = true
      window.removeEventListener("storage", onStorage)
    }
  }, [])

  const login = async (email: string, password: string) => {
    await authApi.login(email, password)
    const me = await fetchMe()
    setUser(mapMeToUser(me))
  }

  const register = async (
    name: string,
    email: string,
    password: string,
    gender: UserGenderValue,
  ) => {
    await authApi.register({
      email,
      password,
      displayName: name,
      gender,
    })
    const me = await fetchMe()
    setUser(mapMeToUser(me))
  }

  const loginWithGoogle = async (idToken: string) => {
    await authApi.oauthGoogle(idToken)
    const me = await fetchMe()
    setUser(mapMeToUser(me))
  }

  const loginWithApple = async (
    identityToken: string,
    authorizationCode?: string,
  ) => {
    await authApi.oauthApple(identityToken, authorizationCode)
    const me = await fetchMe()
    setUser(mapMeToUser(me))
  }

  const loginWithFacebook = async (accessToken: string) => {
    await authApi.oauthFacebook(accessToken)
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

  const applyForVerticalCreator = async (
    description: string,
    idDocumentUrl: string,
    portfolioUrl?: string,
  ) => {
    await applyVerticalCreatorApi(description, idDocumentUrl, portfolioUrl)
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
        loginWithGoogle,
        loginWithApple,
        loginWithFacebook,
        logout,
        refreshUser,
        updateCoins,
        applyForStreamer,
        applyForVerticalCreator,
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
