import { convertSRTorLRCtoCustomJSON } from '~/utils/lyric'; // 用 ~ 指向根目录

export default defineEventHandler(async (event) => {
  try {
    const formData = await readMultipartFormData(event);

    if (!formData) {
      return { error: 'No form data received' };
    }

    const filePart = formData.find((part) => part.name === 'file');

    if (!filePart || !filePart.data) {
      return { error: 'No file uploaded' };
    }

    // 你可以在这里保存文件到磁盘、云存储，或者进一步处理
    // 示例：打印文件信息
    const lyricData = filePart.data.toString('utf-8');
    // const lyricData = JSON.parse(lyricText);
    const lyricJson = convertSRTorLRCtoCustomJSON(lyricData, filePart.filename!.split('.').pop());

    return lyricJson;
  }
  catch (error) {
    console.error('Error reading JSON file:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to read JSON file',
    })
  }
})
