import type { Subtitle } from '@guoxk/gplayer'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import process from 'node:process'

interface Query {
  name: string
  lang: string
}

export default defineEventHandler((event) => {
  try {
    const query: Query = getQuery(event)
    const filePath = resolve(
      join(
        process.cwd(),
        'public',
        `lyric/${query.name}`,
        `${query.lang}.json`,
      ),
    )
    const data = readFileSync(filePath, 'utf-8')
    return JSON.parse(data) as Subtitle
  }
  catch (error) {
    console.error('Error reading lyric file:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to read lyric file',
    })
  }
})
