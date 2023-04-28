import { getStorage } from 'firebase-admin/storage'
import axios from 'axios'

import admin from 'firebase-admin'

const firebaseKey = JSON.parse(process.env.FIREBASE_SECRET_SERVICE_ACCOUNT||'{}') as string
if (admin.apps.length === 0) {
  // eslint-disable-next-line
  const bucketName = 'talecraft-studio'
  admin.initializeApp({
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    credential: admin.credential.cert(firebaseKey),
    storageBucket: `gs://${bucketName}.appspot.com`,
  })
}

export async function downloadImage(url: string) {
  let b: null | ArrayBuffer = null
  let contentType = 'image/png'
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    const response = await axios<any>({
      method: 'GET',
      url: url,
      responseType: 'arraybuffer',
    })
    b = response.data as ArrayBuffer
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    contentType = response.headers['content-type']
  } catch (e) {
    console.error(e)
  } finally {
    return {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      b: b,
      contentType: contentType,
    }
  }
}

export async function uploadFileFromUrl(url: string, fileName: string) {
  const response = await downloadImage(url)
  const fileContent = response.b as Buffer
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  const bucket = getStorage().bucket()
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const file = bucket.file(fileName)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument
  await file.save(fileContent, {
    metadata: {
      contentType: 'image/png',
    },
  })
  const imageUrl = `https://firebasestorage.googleapis.com/v0/b/talecraft-studio.appspot.com/o/${fileName}?alt=media`
  return imageUrl
}
