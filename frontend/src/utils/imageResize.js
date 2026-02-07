/**
 * Resize and compress image for face detection.
 * Reduces upload size and speeds up API processing.
 * @param {string} dataUrl - Base64 data URL (e.g. from getScreenshot)
 * @param {number} maxSize - Max width/height in pixels (default 640 - matches InsightFace det_size)
 * @param {number} quality - JPEG quality 0-1 (default 0.7)
 * @returns {Promise<string>} Resized base64 data URL
 */
export function resizeImageForFaceDetection(dataUrl, maxSize = 640, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const { width, height } = img
      let w = width
      let h = height

      if (width > maxSize || height > maxSize) {
        if (width >= height) {
          w = maxSize
          h = Math.round((height / width) * maxSize)
        } else {
          h = maxSize
          w = Math.round((width / height) * maxSize)
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, w, h)

      const resized = canvas.toDataURL('image/jpeg', quality)
      resolve(resized)
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = dataUrl
  })
}
