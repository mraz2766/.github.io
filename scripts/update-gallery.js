import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import ExifReader from 'exifreader';
import sizeOf from 'image-size';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PHOTOS_DIR = path.join(__dirname, '../public/photos');
const THUMBS_DIR = path.join(__dirname, '../public/thumbnails');
const OUTPUT_FILE = path.join(__dirname, '../src/photos.json');

// Configuration
const CONFIG = {
    thumbnail: {
        width: 600,
        quality: 80,
        format: 'webp' // WebP is smaller and better for thumbnails
    },
    full: {
        maxWidth: 2500, // Downscale huge 20MB+ photos to reasonable 4K size
        quality: 90,    // High quality for full view
        keepExif: true
    }
};

// Ensure directories exist
if (!fs.existsSync(PHOTOS_DIR)) {
    fs.mkdirSync(PHOTOS_DIR, { recursive: true });
}
if (!fs.existsSync(THUMBS_DIR)) {
    fs.mkdirSync(THUMBS_DIR, { recursive: true });
}

async function generateGallery() {
    const photos = [];
    let photoId = 1;

    console.log('Scanning for photos in:', PHOTOS_DIR);

    const processDirectory = async (directory, categoryPath) => {
        const entries = fs.readdirSync(directory, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(directory, entry.name);
            const relativePath = path.relative(PHOTOS_DIR, fullPath);

            // Create corresponding thumbnail directory structure
            const thumbDir = path.join(THUMBS_DIR, path.dirname(relativePath));
            if (!fs.existsSync(thumbDir)) {
                fs.mkdirSync(thumbDir, { recursive: true });
            }

            if (entry.isDirectory()) {
                await processDirectory(fullPath, relativePath);
            } else {
                const ext = path.extname(entry.name).toLowerCase();
                if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
                    continue;
                }

                console.log(`Processing: ${relativePath}...`);

                let fileBuffer = fs.readFileSync(fullPath);
                let needsUpdate = false;

                // 1. Optimize Original Image (Auto-rotate + Resize huge images + Compress)
                try {
                    const image = sharp(fileBuffer);
                    const metadata = await image.metadata();

                    // Check if optimization is needed
                    const isTooLarge = metadata.width > CONFIG.full.maxWidth || metadata.height > CONFIG.full.maxWidth;
                    const needsRotation = metadata.orientation && metadata.orientation !== 1;

                    // We only process the original if it needs rotation OR is too large
                    // This prevents re-compressing already optimized images repeatedly
                    if (needsRotation || isTooLarge) {
                        console.log(`  - Optimizing original (Rotate: ${needsRotation}, Resize: ${isTooLarge})...`);

                        let pipeline = image.rotate(); // Auto-rotate

                        if (isTooLarge) {
                            pipeline = pipeline.resize(CONFIG.full.maxWidth, CONFIG.full.maxWidth, {
                                fit: 'inside',
                                withoutEnlargement: true
                            });
                        }

                        // Keep EXIF!
                        pipeline = pipeline.withMetadata().jpeg({ quality: CONFIG.full.quality });

                        const optimizedBuffer = await pipeline.toBuffer();
                        fs.writeFileSync(fullPath, optimizedBuffer);
                        fileBuffer = optimizedBuffer; // Update buffer for next steps
                        needsUpdate = true;
                    }
                } catch (e) {
                    console.warn(`  - Warning: Optimization failed for ${entry.name}: ${e.message}`);
                }

                // 2. Generate Thumbnail (WebP format, No EXIF)
                // Change extension to .webp for thumbnail path
                const thumbName = path.basename(relativePath, ext) + '.webp';
                const thumbRelativePath = path.join(path.dirname(relativePath), thumbName);
                const thumbPath = path.join(THUMBS_DIR, thumbRelativePath);
                const thumbUrl = `/thumbnails/${thumbRelativePath.replace(/\\/g, '/')}`;

                try {
                    // Only generate if missing or if original was updated
                    if (!fs.existsSync(thumbPath) || needsUpdate) {
                        // console.log(`  - Generating WebP thumbnail...`);
                        await sharp(fileBuffer)
                            .resize(CONFIG.thumbnail.width, null, { withoutEnlargement: true })
                            .webp({ quality: CONFIG.thumbnail.quality }) // WebP is efficient
                            .toFile(thumbPath);
                    }
                } catch (e) {
                    console.warn(`  - Warning: Thumbnail generation failed: ${e.message}`);
                }

                // 3. Read EXIF
                let tags = {};
                try {
                    tags = ExifReader.load(fileBuffer);
                } catch (error) {
                    // console.warn(`  - Warning: Could not read EXIF: ${error.message}`);
                }

                const getTag = (name) => {
                    if (tags[name]) {
                        return tags[name].description || tags[name].value || '';
                    }
                    return '';
                };

                // Helper to format shutter speed (e.g., 0.004 -> 1/250)
                const formatShutter = (val) => {
                    if (!val) return '';
                    if (val.toString().includes('/')) return val; // Already fraction
                    const num = parseFloat(val);
                    if (num >= 1 || num === 0) return val;
                    return `1/${Math.round(1 / num)}`;
                };

                // Helper to format aperture (e.g., f/1.8)
                const formatAperture = (val) => {
                    if (!val) return '';
                    const s = val.toString();
                    return s.toLowerCase().startsWith('f') ? s : `f/${s}`;
                };

                // 4. Get Dimensions
                let width = 0;
                let height = 0;
                try {
                    const dimensions = sizeOf(fileBuffer);
                    width = dimensions.width;
                    height = dimensions.height;
                } catch (e) { }

                // 5. Determine Category
                let category = 'General';
                if (categoryPath) {
                    category = categoryPath.split(path.sep)[0];
                    category = category.charAt(0).toUpperCase() + category.slice(1);
                }

                // 6. Build Photo Object
                const photo = {
                    id: photoId++,
                    src: `/photos/${relativePath.replace(/\\/g, '/')}`,
                    thumbnail: thumbUrl,
                    title: entry.name.replace(/\.[^/.]+$/, "").replace(/-/g, ' '),
                    width,
                    height,
                    category,
                    exif: {
                        camera: getTag('Model') || getTag('Make') || 'Unknown Camera',
                        lens: getTag('LensModel') || getTag('Lens') || getTag('LensInfo') || 'Unknown Lens',
                        iso: getTag('ISOSpeedRatings') || getTag('ISO') || '',
                        aperture: formatAperture(getTag('FNumber') || getTag('ApertureValue')),
                        shutter: formatShutter(getTag('ExposureTime') || getTag('ShutterSpeedValue')),
                    }
                };

                photos.push(photo);
            }
        }
    };

    if (fs.existsSync(PHOTOS_DIR)) {
        await processDirectory(PHOTOS_DIR, '');
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(photos, null, 2));
        console.log(`\nSuccessfully generated gallery with ${photos.length} photos!`);
        console.log(`Data saved to: ${OUTPUT_FILE}`);
    } else {
        console.log('Photos directory not found.');
    }
}

generateGallery().catch(console.error);
