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
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { ImSpinner10 } from 'react-icons/im'

// please refactor
interface FinalOutput {
  pageNum: number
  text: string
  image: string
  imagePrompt: string
}

interface StoryProps {
  text: string
  title: string
  thumbnailPrompt: string
  thumbnailImgUrl: string | null
  paragraphs: string[]
}
const CreatePage: NextPage = (props) => {
  const isDev = false
  const inputImageRef = useRef<HTMLTextAreaElement>(null)
  const inputTellMeTextRef = useRef<HTMLTextAreaElement>(null)
  const [loadingGeneateImage, setLoadingGenerateImage] = useState(false)
  // const hello = api.example.hello.useQuery({ text: "from tRPC" });
  const imageMutation = api.image.generate.useMutation()
  const { mutateAsync: storyMutationAsync, isLoading: storyLoading } = api.story.generate.useMutation()
  const { mutateAsync: saveStoryMutationAysnc, isLoading: saveLoading } = api.story.save.useMutation()
  const [story, setStory] = useState<StoryProps | null>(null)
  const [output, setOutput] = useState<FinalOutput[]>([])
  const leftPlaneRef = useRef<HTMLDivElement>(null)
  const rightPlaneRef = useRef<HTMLDivElement>(null)
  const session = useSession()

  useEffect(() => {
    if (leftPlaneRef.current) {
      // change style width 100px
      leftPlaneRef.current.style.width = 'width: 300px;'
    }
    if (rightPlaneRef.current) {
      rightPlaneRef.current.style.width = '100%'
    }
  }, [])

  useEffect(() => {
    if (inputTellMeTextRef.current) {
      inputTellMeTextRef.current.value = 'cat and dog'
    }
  }, [])

  const onSubmitTellMeText = async () => {
    if (session.status !== 'authenticated') {
      void signIn()
      return
    }
    if (inputTellMeTextRef.current) {
      setStory(null)
      setOutput([])
      try {
        const value = inputTellMeTextRef.current.value
        console.log('submit for tell me text', value)
        const resp = await storyMutationAsync({
          prompt: 'Please help generate a less-than-250-words night time story for kids about ' + value,
        })
        const newStoryState = {
          text: resp.story,
          title: resp.title,
          thumbnailPrompt: resp.thumbnailPrompt,
          thumbnailImgUrl: resp.thumbnailImgUrl,
          paragraphs: resp.paragraphs,
        }
        setStory(newStoryState)
      } finally {
      }
    }
  }
  const router = useRouter()
  const onSaveStory = async () => {
    if (session.status !== 'authenticated') {
      void signIn()
      return
    }
    if (story == null) {
      return
    }

    const storyContents = output.map((o) => {
      return {
        pageNumber: o.pageNum,
        imagePrompt: o.imagePrompt,
        imageUrl: o.image,
        content: o.text,
        image: o.image,
      }
    })

    const resp = await saveStoryMutationAysnc({
      title: story.title,
      storyText: story.text,
      thumbnailPrompt: story.thumbnailPrompt,
      thumbnailImageUrl: story.thumbnailImgUrl || '',
      storyContents: storyContents,
    })
    const path = `/tale/${resp.id}`
    void router.push(path)
  }

  const onGenerateImg = async () => {
    if (session.status !== 'authenticated') {
      void signIn()
      return
    }
    if (story == null) {
      return
    }
    const tempOutput: FinalOutput[] = []
    if (story.text != '' && story.paragraphs.length > 0) {
      console.log('sentences', story.paragraphs)
      const ps = []
      for (const [index, value] of story.paragraphs.entries()) {
        const promiseImageMutate = imageMutation.mutateAsync({ text: value, seq: index + 1 })
        ps.push(promiseImageMutate)
      }

      try {
        setLoadingGenerateImage(true)
        const responseList = await Promise.all(ps)
        for (const imageResp of responseList) {
          if (imageResp) {
            tempOutput.push({
              pageNum: imageResp.seq,
              text: imageResp.text,
              image: imageResp.image,
              imagePrompt: imageResp.prompt,
            })
          }
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoadingGenerateImage(false)
      }

      setOutput(tempOutput)
    }
  }

  const onSubmitTextToImage = () => {
    const value = inputImageRef.current?.value
    console.log('submit for image', value)
    imageMutation.mutate({ text: value || '' })
  }

  return (
    <>
      <Head>
        <title>TaleCraft Studio</title>
        <meta name="description" content="Craft and share your tales and stories" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="relative flex min-h-screen flex-1 flex-col justify-between bg-gray-50 text-gray-700 sm:h-screen">
        <div className="fixed w-full">
          <Navbar />
        </div>
        <div className="h-full pb-10 pt-10 sm:px-10 lg:px-28">
          <div className="hidden sm:col-span-12 sm:grid sm:grid-cols-12 ">
            <div className="font-school-bell col-span-4 my-4 px-8 text-2xl font-bold text-gray-900">Concept</div>
            <div className="font-school-bell col-span-8 my-4 px-8 text-2xl font-bold text-gray-900">Result</div>
          </div>
          <div className="flex flex-col pb-20 sm:grid sm:h-[90%] sm:grid-cols-12">
            {/* left plane */}
            <div
              ref={leftPlaneRef}
              className="w-full justify-center overflow-y-auto border-gray-100 pb-5 sm:col-span-4 sm:px-8"
            >
              {isDev && (
                <div>
                  <div className="rounded-lg border bg-white px-4 py-4">
                    <div className="mb-2 text-xs font-semibold">Input Image</div>
                    <form
                      action=""
                      className="w-full space-y-2"
                      onSubmit={(event) => {
                        event.preventDefault()
                        onSubmitTextToImage()
                      }}
                    >
                      <div className="w-full">
                        <textarea
                          ref={inputImageRef}
                          className="w-full rounded-lg border border-gray-300 px-3 py-1 text-xs text-gray-700"
                          placeholder={'image prompt...'}
                        />
                      </div>
                      <div>
                        <button
                          className="rounded border 
                      border-gray-200 bg-blue-700 px-3 py-1 text-center
                      text-xs text-xxs
                      text-white transition-all
                      hover:bg-blue-900
                      "
                          type="button"
                          onClick={() => onSubmitTextToImage()}
                        >
                          <span>submit</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
              <div className="mt-4 rounded-lg border bg-white px-4 py-3 sm:mt-0">
                <div className="mb-2 text-xs font-semibold">Tell me a tale about</div>
                <form
                  className="w-full space-y-2"
                  action=""
                  onSubmit={(event) => {
                    event.preventDefault()
                    void onSubmitTellMeText()
                  }}
                >
                  <div>
                    <textarea
                      rows={4}
                      ref={inputTellMeTextRef}
                      className="w-full rounded-lg border border-gray-300 px-3 py-1 text-xs text-gray-700"
                      placeholder={'Please type prompt text here'}
                    />
                  </div>
                  <div className="flex flex-col space-y-2">
                    <button
                      className="rounded border 
                      border-gray-200 bg-pink-500 px-3 py-2 text-center
                      text-xs
                      text-white transition-all
                      hover:bg-pink-700"
                      type="button"
                      onClick={() => void onSubmitTellMeText()}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        {storyLoading && <ImSpinner10 className="animate-spin" />}
                        {!storyLoading && <MagicWandIcon />}
                        <span>Craft story</span>
                      </div>
                    </button>
                    <button
                      disabled={story === null}
                      className="rounded border 
                      border-gray-200 bg-blue-500 px-3 py-2 text-center
                      text-xs
                      text-white transition-all
                      hover:bg-blue-700 disabled:cursor-not-allowed
                      disabled:opacity-50"
                      type="button"
                      onClick={() => void onGenerateImg()}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        {loadingGeneateImage && <ImSpinner10 className="animate-spin" />}
                        {!loadingGeneateImage && <RocketIcon />}
                        <span>Craft images</span>
                      </div>
                    </button>
                  </div>
                </form>
              </div>
            </div>
            {/* right plane */}
            <div ref={rightPlaneRef} className="col-span-8 overflow-y-auto rounded-lg border bg-white px-8 pb-8">
              {/* for testing */}
              {/* <div className="mb-4">
                <img className="rounded-lg" src={imageMutation.data?.image}></img>
              </div> */}

              <div className="relative my-8 min-h-[300px] rounded-lg border bg-white shadow-lg">
                <div className="border-b p-4 text-xl font-semibold">Story overview</div>
                <div className="h-full p-4">
                  {story === null && (
                    <>
                      <div className=" absolute left-[50%] top-[50%] w-full -translate-x-1/2 -translate-y-1/2">
                        <div className="w-full text-center text-sm text-gray-400">
                          <div className="mb-2 flex justify-center">
                            <NoDataIcon size={96} />
                          </div>
                          {storyLoading ? (
                            <div className="flex items-center justify-center">Loading...</div>
                          ) : (
                            <>Create a story by typing a prompt in the left panel</>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                  {story !== null && (
                    <>
                      <div className="mb-4 font-semibold text-gray-700">{story.title}</div>

                      {story.thumbnailImgUrl && (
                        <>
                          <Image
                            className="mx-auto rounded-lg"
                            src={story.thumbnailImgUrl}
                            width={512}
                            height={512}
                            alt="thumbnail"
                          />
                          <div className="my-4 text-sm text-blue-700">
                            thumbnailImagePrompt :<div className="text-xs text-blue-500">{story.thumbnailPrompt}</div>
                          </div>
                        </>
                      )}
                      <p className="text-gray-500">{story.text}</p>
                    </>
                  )}
                </div>
              </div>
              <div className="space-y-4">
                {output.map((i) => {
                  return (
                    <div className="rounded-lg border bg-white shadow-lg" key={i.pageNum}>
                      <p className="mb-4 border-b px-4 py-2">Page no. {i.pageNum}</p>
                      <div className="px-4 py-6">
                        <div className="flex justify-center">
                          <Image className="rounded-lg" alt="image" src={i.image} width={512} height={512} />
                        </div>
                        <p className="mt-4 flex justify-center">{i.text}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="col-span-12 px-6 py-4 lg:px-0">
              <div className="flex justify-end">
                <button
                  disabled={story === null || output.length === 0}
                  onClick={() => void onSaveStory()}
                  className="rounded bg-blue-500 px-4 py-2 text-xs
                    text-white
                    hover:bg-blue-700
                   disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <div className="flex w-full items-center space-x-2">
                    {saveLoading && <ImSpinner10 className="animate-spin" />}
                    {!saveLoading && <CiFloppyDisk />}
                    <div>Save</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* desktop */}
        <div className="hidden w-full sm:fixed sm:bottom-0 sm:block">
          <BottomBar />
        </div>
        {/* mobile */}
        <div className="sm:hidden">
          <BottomBar />
        </div>
      </main>
    </>
  )
}
export default CreatePage
