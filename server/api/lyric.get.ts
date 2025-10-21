import type { Subtitle } from '~/types'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

import process from 'node:process'

interface Query {
  name: string
  lang: string
}

let jsonData: Subtitle | null = null
export default defineEventHandler((event) => {
  try {
    const query: Query = getQuery(event)
    // 解析 assets 目录的绝对路径
    const filePath = resolve(join(process.cwd(), 'public', `lyric/${query.name}`, `${query.lang}.json`))
    // 读取文件内容
    const data = readFileSync(filePath, 'utf-8')
    // 解析 JSON
    jsonData = JSON.parse(data) as Subtitle
    return jsonData
  }
  catch (error) {
    console.error('Error reading JSON file:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to read JSON file',
    })
  }
})
