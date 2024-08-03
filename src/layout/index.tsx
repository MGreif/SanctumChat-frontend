import { FC, PropsWithChildren, useState } from 'react'
import { useAuth } from '../auth/useAuth'
import { Link } from 'react-router-dom'
import { Button } from '@mantine/core'
import { Footer } from './Footer'

type TLayoutProps = PropsWithChildren<{
  title?: string
  className?: string
}>

export const Layout: FC<TLayoutProps> = ({ children, title, className }) => {
  const auth = useAuth()
  const [mode, _] = useState<'dark' | 'light'>('light')
  return (
    <div
      className={`h-lvh justify-stretch grid grid-rows-layout ${mode === 'dark' ? 'dark' : ''}`}
    >
      <div className="h-full flex justify-between items-center p-4 bg-white dark:bg-stone-900">
        {title && <h2 className="text-2xl">{title}</h2>}
        <span>
          {auth.isLoggedIn && (
            <>
              <Link className="mr-2 text-indigo-500 underline" to={'/'}>
                Chat
              </Link>
              <Link
                to={'/friend-requests'}
                className="mr-2 text-indigo-500 underline"
              >
                Friend Requests
              </Link>
              <span className="mr-2 hidden md:inline">Logged in as {auth.token?.sub}</span>
              <Button
                className="bg-red-500 hover:bg-red-700"
                onClick={auth.logout}
              >
                Logout
              </Button>
            </>
          )}
        </span>
      </div>

      <div className={`h-full overflow-auto grid min-h-0 pt-10 ${className || ''}`}>{children}</div>
      <Footer />
    </div>
  )
}
