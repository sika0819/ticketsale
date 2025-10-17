import { globby } from 'globby'
import { readFile, writeFile, mkdir } from 'fs/promises'
import path from 'path'
import imagemin from 'imagemin'
import imageminMozjpeg from 'imagemin-mozjpeg'
import imageminPngquant from 'imagemin-pngquant'
import imageminGifsicle from 'imagemin-gifsicle'
import imageminSvgo from 'imagemin-svgo'

async function run() {
  const srcDir = path.resolve(__dirname, '../src/assets/images')
  const outDir = path.resolve(__dirname, '../src/assets/images_optimized')
  await mkdir(outDir, { recursive: true })

  const patterns = ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.svg']
  const files = await globby(patterns, { cwd: srcDir })

  console.log(`Found ${files.length} images.`)

  for (const file of files) {
    const abs = path.join(srcDir, file)
    const buf = await readFile(abs)
    const optimized = await imagemin.buffer(buf, {
      plugins: [
        imageminMozjpeg({ quality: 75 }),
        imageminPngquant({ quality: [0.65, 0.85] }),
        imageminGifsicle({ optimizationLevel: 2 }),
        imageminSvgo({ plugins: [{ name: 'removeViewBox', active: false }] })
      ]
    })
    const outPath = path.join(outDir, file)
    await mkdir(path.dirname(outPath), { recursive: true })
    await writeFile(outPath, optimized)
    const ratio = (optimized.length / buf.length * 100).toFixed(1)
    console.log(`${file} ${buf.length}B -> ${optimized.length}B (${ratio}%)`)
  }

  console.log('Done.')
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
