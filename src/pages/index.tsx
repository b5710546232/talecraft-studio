import { type NextPage } from 'next'
import Head from 'next/head'
import { MagicWandIcon, RocketIcon } from '@radix-ui/react-icons'
import { CiFloppyDisk } from 'react-icons/ci'
import { api } from '~/utils/api'
import { useRef } from 'react'
import { useState, useEffect } from 'react'
import { Navbar } from '../component/Navbar'
import { NoDataIcon } from '../svg/NoDataIcon'
import { BottomBar } from '../component/BottomBar'
import Image from 'next/image'
import { ProfileDropdownMenu } from '../component/ProfileDropdownMenu'
import {ImSpinner10} from 'react-icons/im'
import Link from 'next/link'

const Home: NextPage = (props) => {
  const { data, isLoading } = api.story.list.useQuery({})

  return (
    <>
      <Head>
        <title>TaleCraft Studio</title>
        <meta name="description" content="Craft and share your tales and stories" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="relative flex min-h-screen flex-1 flex-col justify-between bg-gray-50 text-gray-700 sm:h-screen">
        <div className="fixed z-10 w-full">
          <Navbar />
        </div>

        <div className="relative flex flex-1 flex-col justify-between pt-10 bg-gray-50">
          <div className="flex flex-1 flex-col">
            <div className="flex h-48 items-center justify-center bg-blue-500">
              <div className="text-3xl text-white">
                <div>Craft and share your tales and stories</div>
                <div className="mt-8 text-center">
                  By{' '}
                  <span className="font-figer-paint ml-2 rounded-xl border-none bg-white p-2 text-lg shadow-lg">
                    <span className="text-pink-500">Tale</span>
                    <span className="text-blue-500">Craft</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="my-8 px-10 text-xl">Explore</div>
            {!isLoading && data && (
              <>
                <div className="grid grid-cols-2 gap-5 px-10 py-8 pt-0 md:grid-cols-4 md:gap-10">
                  {data.list.map((i) => {
                    return (
                      <Link href={`/tale/${i.id}`} key={i.id} className="rounded-lg border bg-white p-4 shadow-lg">
                        <div className="h-full w-full ">
                          <Image
                            className="w-full rounded-lg"
                            src={i.thumbnailImageUrl}
                            alt="thumbnail"
                            width={512}
                            height={512}
                          />
                          <div className="mt-4 flex min-h-[64px] items-center justify-center">
                            <span className="line-clamp-2">{i.title}</span>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </>
            )}
            {!isLoading && data && data.list.length <= 0 && (
              <div className="flex h-full w-full flex-col  items-center justify-center text-xl text-gray-400">
                <div>There is no story yet.</div>
                <div>Create one!</div>
              </div>
            )}
            {isLoading && (
              <>
              <div className="flex h-full w-full flex-col  items-center justify-center text-xl text-gray-400">
                    <ImSpinner10 className='animate-spin'  size={128}/>
                    <div>loading...</div>
                </div>
              </>
            )}
          </div>

          <div>
            <BottomBar />
          </div>
        </div>
      </main>
    </>
  )
}
export default Home

// const Rendering: React.FC = () => {
//   output.map(i => {
//     return (
//       <div>
//         <p>{i.pageNum}</p>
//         <p>{i.text}</p>
//         <img src={i.image}></img>
//       </div>
//     )
//   });
// }

// const AuthShowcase: React.FC = () => {
//   const { data: sessionData } = useSession();

//   const { data: secretMessage } = api.example.getSecretMessage.useQuery(
//     undefined, // no input
//     { enabled: sessionData?.user !== undefined }
//   );

//   return (
//     <div className="flex flex-col items-center justify-center gap-4">
//       <p className="text-center text-2xl text-white">
//         {sessionData && <span>Logged in as {sessionData.user?.name}</span>}
//         {secretMessage && <span> - {secretMessage}</span>}
//       </p>
//       <button
//         className="rounded-full bg-white/10 px-10 py-3 font-semibold text-white no-underline transition hover:bg-white/20"
//         onClick={sessionData ? () => void signOut() : () => void signIn()}
//       >
//         {sessionData ? "Sign out" : "Sign in"}
//       </button>
//     </div>
//   );
// };
