import { convertSRTorLRCtoCustomJSON } from '@guoxk/gplayer'

export default defineEventHandler(async (event) => {
  try {
    const formData = await readMultipartFormData(event)
    if (!formData)
      return { error: 'No form data received' }

    const filePart = formData.find(part => part.name === 'file')
    if (!filePart)
      return { error: 'No file uploaded' }

    // lang field should be provided by the client (ISO 639-3 code, e.g. 'cmn', 'kor', 'eng')
    const langPart = formData.find(part => part.name === 'lang')
    const lang = langPart?.data.toString('utf-8') ?? ''

    const lyricText = filePart.data.toString('utf-8')
    const format = filePart.filename?.split('.').pop() ?? 'srt'
    const lyricJson = convertSRTorLRCtoCustomJSON(lyricText, format, lang)

    return { statusCode: 200, message: lyricJson }
  }
  catch (error) {
    console.error('Error processing lyric file:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to process lyric file',
    })
  }
})
