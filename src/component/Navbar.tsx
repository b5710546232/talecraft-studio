import { signIn, useSession } from 'next-auth/react'
import { ProfileDropdownMenu } from './ProfileDropdownMenu'
import Link from 'next/link'

export const Navbar = () => {
  const session = useSession()
  const onSignIn = () => {
    void signIn()
  }
  return (
    <>
      <nav className="flex h-10 w-full justify-between bg-white px-4">
        {/* banner */}
        <Link className="flex cursor-pointer items-center font-semibold" href="/">
          <div>
            <div className="font-figer-paint">
              <span className="text-pink-500">Tale</span>
              <span className="text-blue-500">Craft</span> <span>Studio</span>
            </div>
          </div>
        </Link>
        <div className="flex items-center space-x-2">
          <Link href="/create">
            <button className="rounded border bg-blue-500 px-2 py-1 text-white">
              <div className="text-xs">Create</div>
            </button>
          </Link>

          {!(session?.status === 'authenticated') && (
            <>
              <button onClick={() => onSignIn()} className="rounded border px-2 py-1 text-gray-700">
                <div className="text-xs">Sign in</div>
              </button>
            </>
          )}
          {session?.status === 'authenticated' && (
            <>{session?.data?.user?.image && <ProfileDropdownMenu userImg={session?.data?.user?.image} />}</>
          )}
        </div>
      </nav>
    </>
  )
}
