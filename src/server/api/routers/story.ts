import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import { createTRPCRouter, protectedProcedure, publicProcedure } from '~/server/api/trpc'
import { type AI21CompleteResponse } from '~/server/types/ai21/response'
import { type OpenAICompletionResponse } from '~/server/types/openai/response'
import { generateImage } from './image'

export interface ListStoryResponse {
  list: {
    id: string
    title: string
    thumbnailImageUrl: string
  }[]
}

interface storyContentItem {
  imageUrl: string
  text: string
  imagePrompt: string
  pageNumber: number
  createdAt: Date
  updatedAt: Date
}
export interface GetStoryResponse {
  item: {
    id: string
    title: string
    text: string
    thumbnailImageUrl: string
    storyContents: storyContentItem[]
  }
}

export const storyRouter = createTRPCRouter({
  generate: protectedProcedure.input(z.object({ prompt: z.string() })).mutation(async ({ input }) => {
    const jsonResp = await createAI21Completetion(input.prompt)

    let paragraphs: string[] = []
    let story = ''
    let title = ''
    let thumbnailPrompt = ''
    let thumbnailImgUrl = ''
    if (jsonResp && jsonResp.completions.length > 0 && jsonResp.completions[0]) {
      story = jsonResp.completions[0].data.text
      try {
        const ps = Promise.all([
          separateStoryIntoParagraph(story),
          generateTitleFromStory(story),
          generateThumbnailPrompt(story),
        ])
        const respList = await ps
        paragraphs = respList[0]
        title = respList[1]
        thumbnailPrompt = respList[2]
        thumbnailImgUrl = await generateImage(thumbnailPrompt)
        console.log(respList[2])
      } catch (e) {
        console.error(e)
      }
    }
    return {
      title,
      story: story,
      paragraphs: paragraphs,
      thumbnailPrompt: thumbnailPrompt,
      thumbnailImgUrl: thumbnailImgUrl,
    }
  }),
  save: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        storyText: z.string(),
        thumbnailImageUrl: z.string(),
        thumbnailPrompt: z.string(),
        storyContents: z.array(
          z.object({
            imageUrl: z.string(),
            content: z.string(),
            imagePrompt: z.string(),
            pageNumber: z.number(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = ctx.session?.user
      if (!user) {
        throw new Error('Not logged in')
      }
      const userId = user.id

      // create story
      const resp = await ctx.prisma.taleStory.create({
        data: {
          title: input.title,
          text: input.storyText,
          thumbnailImageUrl: input.thumbnailImageUrl,
          thumbnailPrompt: input.thumbnailPrompt,
          author: {
            connect: {
              id: userId,
            },
          },
          published: true,
        },
      })
      // create story contents
      for (const content of input.storyContents) {
        await ctx.prisma.storyContent.create({
          data: {
            imageUrl: content.imageUrl,
            content: content.content,
            imagePrompt: content.imagePrompt,
            pageNumber: content.pageNumber,
            taleStory: {
              connect: {
                id: resp.id,
              },
            },
          },
        })
      }
      console.log('save story', input, resp)
      return { success: true, id: resp.id }
    }),
  list: publicProcedure.input(z.object({})).query(async ({ ctx }) => {
    const resp = await ctx.prisma.taleStory.findMany({
      where: {
        published: true,
      },
    })

    const taleStories = resp.map((story) => {
      return {
        id: story.id,
        title: story.title,
        thumbnailImageUrl: story.thumbnailImageUrl,
      }
    })

    const result: ListStoryResponse = {
      list: taleStories,
    }
    return result
  }),
  get: publicProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const resp = await ctx.prisma.taleStory.findUnique({
      where: {
        id: input.id,
      },
      include: {
        contents: true,
      },
    })
    if (!resp) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Story not found' })
    }
    const result: GetStoryResponse = {
      item: {
        id: resp.id,
        title: resp.title,
        text: resp.text,
        thumbnailImageUrl: resp.thumbnailImageUrl,
        storyContents: resp.contents.map((item) => {
          return {
            imageUrl: item.imageUrl,
            text: item.content,
            imagePrompt: item.imagePrompt,
            pageNumber: item.pageNumber,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
          }
        }),
      },
    }
    return result
  }),
})
async function generateThumbnailPrompt(story: string): Promise<string> {
  const promptTemplate = `{story} digital art,digital painting, storybook , watercolor and pen ,illustration style`
  const prompt = `I give you a story, you will create prompt for ai generate image for me with this template ${promptTemplate} \n\nInput: {story} is \n${story} \n\n Output:`
  console.log(prompt)
  const resp = await fetch('https://api.openai.com/v1/completions', {
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY || ''}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-davinci-003',
      prompt: prompt,
      max_tokens: 2000,
      temperature: 0,
    }),
    method: 'POST',
  })
  const respJSON = (await resp.json()) as OpenAICompletionResponse
  console.log('generateTitleFromStory:respJSON', respJSON)
  if (respJSON && respJSON.choices.length > 0 && respJSON.choices[0]) {
    return respJSON.choices[0].text
  }
  return ''
}

async function generateTitleFromStory(story: string): Promise<string> {
  const storyTheme = `children's story or tales`
  const prompt = `I give you a story, you will name to story to title theme is ${storyTheme} \n\nInput: \n${story} \n\n Output:`
  let result = ''
  const resp = await createAI21Completetion(prompt)
  if(resp.completions && resp.completions.length > 0){
    result = resp.completions[0]?.data.text  || ''
  }
  return result
}

async function separateStoryIntoParagraph(story: string): Promise<string[]> {
  const prompt = `I would like to tokenize given a story into smaller paragraph 
  separated by \"|\" which consists of a few sentences. \n\nInput: \n${story} \n\n Output:`
  console.log(prompt)
  const paragraphJsonResp = await createAI21Completetion(prompt)
  console.log('paragraphJsonResp', paragraphJsonResp)
  let paragraph: string[] = []
  if (paragraphJsonResp && paragraphJsonResp.completions.length > 0 && paragraphJsonResp.completions[0]) {
    const resp = paragraphJsonResp.completions[0].data.text
    paragraph = resp.split('|')
  }
  return paragraph
}


async function createAI21Completetion(prompt: string): Promise<AI21CompleteResponse> {
  const resp = await fetch('https://api.ai21.com/studio/v1/j2-grande-instruct/complete', {
    headers: {
      Authorization: `Bearer ${process.env.AI21_API_TOKEN || ''}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: prompt,
      numResults: 1,
      maxTokens: 4000,
      temperature: 0.7,
      topKReturn: 0,
      topP: 1,
      countPenalty: {
        scale: 0,
        applyToNumbers: false,
        applyToPunctuations: false,
        applyToStopwords: false,
        applyToWhitespaces: false,
        applyToEmojis: false,
      },
      frequencyPenalty: {
        scale: 0,
        applyToNumbers: false,
        applyToPunctuations: false,
        applyToStopwords: false,
        applyToWhitespaces: false,
        applyToEmojis: false,
      },
      presencePenalty: {
        scale: 0,
        applyToNumbers: false,
        applyToPunctuations: false,
        applyToStopwords: false,
        applyToWhitespaces: false,
        applyToEmojis: false,
      },
      stopSequences: [],
    }),
    method: 'POST',
  })

  const jsonResp = (await resp.json()) as AI21CompleteResponse
  return jsonResp
}