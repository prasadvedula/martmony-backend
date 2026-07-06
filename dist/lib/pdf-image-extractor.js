"use strict";
/**
 * Extract embedded JPEG images from a PDF, one per page.
 * Uses pdf-lib to read raw XObject streams — no native binaries needed.
 *
 * Only extracts DCTDecode (JPEG) images, which is what matrimonial
 * profile photos are almost always stored as.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractImagesFromPdf = extractImagesFromPdf;
const pdf_lib_1 = require("pdf-lib");
const promises_1 = require("fs/promises");
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
async function extractImagesFromPdf(buffer, uploadsDir) {
    await (0, promises_1.mkdir)(uploadsDir, { recursive: true });
    let pdf;
    try {
        pdf = await pdf_lib_1.PDFDocument.load(buffer, {
            ignoreEncryption: true,
            updateMetadata: false,
            throwOnInvalidObject: false,
        });
    }
    catch (err) {
        console.error('[pdf-image-extractor] load failed:', err.message);
        return [];
    }
    const pages = pdf.getPages();
    const results = [];
    for (let pageIdx = 0; pageIdx < pages.length; pageIdx++) {
        let bestImg = null;
        try {
            const page = pages[pageIdx];
            const resources = page.node.get(pdf_lib_1.PDFName.of('Resources'));
            if (!resources) {
                results.push(null);
                continue;
            }
            let xObjects;
            if (resources instanceof pdf_lib_1.PDFDict) {
                const xo = resources.get(pdf_lib_1.PDFName.of('XObject'));
                if (xo instanceof pdf_lib_1.PDFDict)
                    xObjects = xo;
                else if (xo instanceof pdf_lib_1.PDFRef) {
                    const resolved = pdf.context.lookup(xo);
                    if (resolved instanceof pdf_lib_1.PDFDict)
                        xObjects = resolved;
                }
            }
            if (!xObjects) {
                results.push(null);
                continue;
            }
            for (const [, ref] of xObjects.entries()) {
                try {
                    const xObj = ref instanceof pdf_lib_1.PDFRef ? pdf.context.lookup(ref) : ref;
                    if (!(xObj instanceof pdf_lib_1.PDFRawStream))
                        continue;
                    const subtype = xObj.dict.get(pdf_lib_1.PDFName.of('Subtype'));
                    if (!subtype || subtype.toString() !== '/Image')
                        continue;
                    const widthObj = xObj.dict.get(pdf_lib_1.PDFName.of('Width'));
                    const heightObj = xObj.dict.get(pdf_lib_1.PDFName.of('Height'));
                    const width = widthObj?.numberValue ?? widthObj?.value?.() ?? 0;
                    const height = heightObj?.numberValue ?? heightObj?.value?.() ?? 0;
                    if (width < 50 || height < 50)
                        continue; // skip tiny decorative images
                    const filter = xObj.dict.get(pdf_lib_1.PDFName.of('Filter'));
                    if (!filter)
                        continue;
                    const filterStr = filter.toString();
                    // Only handle DCTDecode = JPEG
                    if (!filterStr.includes('DCTDecode') && !filterStr.includes('/DCT'))
                        continue;
                    const rawBytes = xObj.contents; // Uint8Array of the raw stream
                    const pixels = width * height;
                    if (!bestImg || pixels > bestImg.pixels) {
                        bestImg = { data: Buffer.from(rawBytes), pixels };
                    }
                }
                catch {
                    // skip this XObject
                }
            }
        }
        catch {
            // skip this page
        }
        if (!bestImg) {
            results.push(null);
            continue;
        }
        try {
            const filename = `photo-${(0, uuid_1.v4)()}.jpg`;
            const filePath = path_1.default.join(uploadsDir, filename);
            await (0, promises_1.writeFile)(filePath, bestImg.data);
            results.push({ urlPath: `/uploads/${filename}`, pageIndex: pageIdx });
        }
        catch (err) {
            console.error(`[pdf-image-extractor] save failed page ${pageIdx}:`, err.message);
            results.push(null);
        }
    }
    return results;
}
