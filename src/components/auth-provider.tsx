
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

const publicRoutes = ['/login', '/api/auth/login', '/api/auth/logout']

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {

    const checkAuth = async () => {
      const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

      if (isPublicRoute) {
        setIsAuthenticated(true)
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch('/api/auth/session')

        if (!response.ok) {
          router.push('/login')
          return
        }

        setIsAuthenticated(true)
        setIsLoading(false)
      } catch (error) {
        console.error('Auth check error:', error)
        router.push('/login')
      }
    }

    checkAuth()
  }, [pathname, router])

  if (isLoading && !publicRoutes.some(route => pathname.startsWith(route))) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated && !publicRoutes.some(route => pathname.startsWith(route))) {
    return null
  }

  return <>{children}</>
}
