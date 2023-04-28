import { type NextPage } from 'next'
import { useRouter } from 'next/router'
import { Navbar } from '../../component/Navbar'
import { BottomBar } from '../../component/BottomBar'
import Head from 'next/head'
import { api } from '../../utils/api'
import Image from 'next/image'

const TaleByIDPage: NextPage = (props) => {
  const router = useRouter()

  const taleId = router.query.id as string
  const { data } = api.story.get.useQuery({ id: taleId })
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
        <div className="relative flex flex-1 flex-col justify-between pt-10">
          <div className="flex flex-1 flex-col">
            <div className="">
              {data && data?.item && (
                <>
                  <div className="min-h-40">
                    <div className="mt-4 grid grid-cols-12">
                      <div className="col-span-12 sm:col-span-3 flex flex-1 flex-col items-center justify-center p-4">
                        <Image
                          className="mx-auto h-40 w-40 rounded shadow-lg"
                          src={data?.item.thumbnailImageUrl}
                          width={512}
                          height={512}
                          alt="thumbnail"
                        />
                      </div>
                      <div className="col-span-12 sm:col-span-9">
                        <div className="px-6 pb-4">
                          <div className="rounded-lg border bg-white p-6 shadow-lg">
                            <div className="font-semibold text-gray-700">{data?.item.title}</div>
                            <div className="text-sm  text-gray-500">{data.item.text}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>


                  <div className="space-y-4 px-6 pb-8">
                    {data.item.storyContents.map((content) => {
                      return (
                        <div className="rounded-lg border bg-white shadow-lg" key={content.createdAt.toISOString()}>
                          <p className="mb-4 border-b px-4 py-2">Page no. {content.pageNumber}</p>
                          <div className="px-4 py-6">
                            <div className="flex justify-center">
                              <Image className="rounded-lg" 
                              alt="image"
                              src={content.imageUrl} width={512} height={512} />
                            </div>
                            <p className="mt-4 flex justify-center">{content.text}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        <div>
          <BottomBar />
        </div>
      </main>
    </>
  )
}

export default TaleByIDPage
