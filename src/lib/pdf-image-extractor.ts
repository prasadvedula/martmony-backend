/**
 * Extract embedded JPEG images from a PDF, one per page.
 * Uses pdf-lib to read raw XObject streams — no native binaries needed.
 *
 * Only extracts DCTDecode (JPEG) images, which is what matrimonial
 * profile photos are almost always stored as.
 */

import { PDFDocument, PDFDict, PDFName, PDFRawStream, PDFRef, PDFArray } from 'pdf-lib'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { v4 as uuid } from 'uuid'

export interface ExtractedPageImage {
  urlPath: string   // /uploads/... for serving
  pageIndex: number // 0-based
}

export async function extractImagesFromPdf(
  buffer: Buffer,
  uploadsDir: string,
): Promise<(ExtractedPageImage | null)[]> {
  await mkdir(uploadsDir, { recursive: true })

  let pdf: PDFDocument
  try {
    pdf = await PDFDocument.load(buffer, {
      ignoreEncryption: true,
      updateMetadata: false,
      throwOnInvalidObject: false,
    } as any)
  } catch (err) {
    console.error('[pdf-image-extractor] load failed:', (err as Error).message)
    return []
  }

  const pages = pdf.getPages()
  const results: (ExtractedPageImage | null)[] = []

  for (let pageIdx = 0; pageIdx < pages.length; pageIdx++) {
    let bestImg: { data: Buffer; pixels: number } | null = null

    try {
      const page = pages[pageIdx]
      const resources = page.node.get(PDFName.of('Resources'))
      if (!resources) { results.push(null); continue }

      let xObjects: PDFDict | undefined
      if (resources instanceof PDFDict) {
        const xo = resources.get(PDFName.of('XObject'))
        if (xo instanceof PDFDict) xObjects = xo
        else if (xo instanceof PDFRef) {
          const resolved = pdf.context.lookup(xo)
          if (resolved instanceof PDFDict) xObjects = resolved
        }
      }

      if (!xObjects) { results.push(null); continue }

      for (const [, ref] of xObjects.entries()) {
        try {
          const xObj = ref instanceof PDFRef ? pdf.context.lookup(ref) : ref
          if (!(xObj instanceof PDFRawStream)) continue

          const subtype = xObj.dict.get(PDFName.of('Subtype'))
          if (!subtype || subtype.toString() !== '/Image') continue

          const widthObj = xObj.dict.get(PDFName.of('Width'))
          const heightObj = xObj.dict.get(PDFName.of('Height'))
          const width: number = (widthObj as any)?.numberValue ?? (widthObj as any)?.value?.() ?? 0
          const height: number = (heightObj as any)?.numberValue ?? (heightObj as any)?.value?.() ?? 0

          if (width < 50 || height < 50) continue  // skip tiny decorative images

          const filter = xObj.dict.get(PDFName.of('Filter'))
          if (!filter) continue

          const filterStr = filter.toString()
          // Only handle DCTDecode = JPEG
          if (!filterStr.includes('DCTDecode') && !filterStr.includes('/DCT')) continue

          const rawBytes = xObj.contents  // Uint8Array of the raw stream
          const pixels = width * height
          if (!bestImg || pixels > bestImg.pixels) {
            bestImg = { data: Buffer.from(rawBytes), pixels }
          }
        } catch {
          // skip this XObject
        }
      }
    } catch {
      // skip this page
    }

    if (!bestImg) {
      results.push(null)
      continue
    }

    try {
      const filename = `photo-${uuid()}.jpg`
      const filePath = path.join(uploadsDir, filename)
      await writeFile(filePath, bestImg.data)
      results.push({ urlPath: `/uploads/${filename}`, pageIndex: pageIdx })
    } catch (err) {
      console.error(`[pdf-image-extractor] save failed page ${pageIdx}:`, (err as Error).message)
      results.push(null)
    }
  }

  return results
}
