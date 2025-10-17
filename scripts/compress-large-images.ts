import { globby } from 'globby'
import { stat, readFile, writeFile, mkdir } from 'fs/promises'
import path from 'path'

// Lazy require imagemin to avoid hard failure if some plugins missing
let imagemin: any = null
let imageminMozjpeg: any = null
let imageminSvgo: any = null
try {
  imagemin = require('imagemin')
  imageminMozjpeg = require('imagemin-mozjpeg')
  imageminSvgo = require('imagemin-svgo')
} catch (e) {
  console.warn('[compress-large-images] imagemin modules not available, will only copy large files without compression. Reason:', (e as any)?.message)
}

const thresholdKB = parseInt(process.env.IMAGE_SIZE_THRESHOLD_KB || '50', 10) // default 50KB

async function run() {
  const srcDir = path.resolve(__dirname, '../src/assets/images')
  const outDir = path.resolve(__dirname, '../src/assets/images_optimized')
  await mkdir(outDir, { recursive: true })

  const patterns = ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.svg']
  const files = await globby(patterns, { cwd: srcDir })
  console.log(`Scanning ${files.length} images. Threshold: ${thresholdKB}KB`)

  let processed = 0
  let skipped = 0
  let totalSaved = 0

  for (const file of files) {
    const abs = path.join(srcDir, file)
    const info = await stat(abs)
    const sizeKB = info.size / 1024
    if (sizeKB < thresholdKB) {
      skipped++
      continue
    }

    const buf = await readFile(abs)
    let optimized = buf

    if (imagemin && (imageminMozjpeg || imageminSvgo)) {
      try {
        const plugins: any[] = []
        if (imageminMozjpeg && /jpe?g$/i.test(file)) plugins.push(imageminMozjpeg({ quality: 75 }))
        if (imageminSvgo && /svg$/i.test(file)) plugins.push(imageminSvgo({ plugins: [{ name: 'removeViewBox', active: false }] }))
        if (plugins.length) {
          optimized = await imagemin.buffer(buf, { plugins })
        }
      } catch (err) {
        console.warn(`Compression failed for ${file}, keeping original.`, err)
        optimized = buf
      }
    }

    const outPath = path.join(outDir, file)
    await mkdir(path.dirname(outPath), { recursive: true })
    await writeFile(outPath, optimized)

    const saved = buf.length - optimized.length
    totalSaved += saved > 0 ? saved : 0
    processed++

    const ratio = (optimized.length / buf.length * 100).toFixed(1)
    console.log(`${file} ${Math.round(buf.length/1024)}KB -> ${Math.round(optimized.length/1024)}KB (${ratio}%). Saved: ${Math.round(saved/1024)}KB`)
  }

  console.log(`Done. Processed: ${processed}, Skipped (below threshold): ${skipped}, Total saved: ${(totalSaved/1024).toFixed(2)}KB`)
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
