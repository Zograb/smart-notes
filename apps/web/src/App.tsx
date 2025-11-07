import { useAuth } from '@clerk/clerk-react'
import { RouterProvider } from '@tanstack/react-router'

import { Spinner } from '@nexly/ui/components/Spinner'

import { useCurrentUser } from './hooks/useCurrentUser'
import { router } from './lib/router'

export const App = () => {
  const { isLoaded, isSignedIn } = useAuth()

  const { user, loading } = useCurrentUser({
    skip: !isLoaded,
  })

  if (!isLoaded || loading) {
    return (
      <div className="bg-background flex items-center justify-center h-screen">
        <Spinner className="text-foreground-primary size-14" />
      </div>
    )
  }

  return (
    <RouterProvider
      router={router}
      context={{
        auth: {
          isSignedIn,
          currentUser: user || null,
        },
      }}
    />
  )
}
