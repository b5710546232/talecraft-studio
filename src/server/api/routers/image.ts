import { z } from 'zod'

import { createTRPCRouter, publicProcedure } from '~/server/api/trpc'

import Replicate from 'replicate'
import { uploadFileFromUrl } from '../../../utils/upload'
import dayjs from 'dayjs'
import shortUUID from 'short-uuid'

export const imageRouter = createTRPCRouter({
  generate: publicProcedure
    .input(z.object({ text: z.string(), seq: z.number().optional() }))
    .mutation(async ({ input }) => {
      const seqOut = input.seq || 0
      try {
        const prompt = input.text + '  digital art,digital painting, storybook , watercolor and pen ,illustration style'
        const imageUrl = await generateImage(prompt)
        return { image: imageUrl, seq: seqOut, text: input.text, prompt: prompt }
      } catch (error) {
        console.error(error)
      }
    }),
})

export async function generateImage(prompt: string) {
  const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN || '',
  })
  let imageUrl = ''
  const output = (await replicate.run(
    'ai-forever/kandinsky-2:601eea49d49003e6ea75a11527209c4f510a93e2112c969d548fbb45b9c4f19f',
    {
      input: {
        prompt: prompt,
      },
    },
  )) as string[]

  if (output && output.length > 0) {
    imageUrl = output.map((i) => i.split(' ')[0]).join('')
  }
  const newFileName =
      shortUUID.generate() + `-${dayjs(new Date()).format('YYYY-MM-DD')}` +'.png'
  const imgUrl = await uploadFileFromUrl(imageUrl, newFileName)
  return imgUrl
}
