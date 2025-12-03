import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const photosJsonPath = path.join(process.cwd(), 'src', 'photos.json');
const publicPhotosDir = path.join(process.cwd(), 'public', 'photos');

// A few helper functions
const getFileBaseName = (filePath) => path.basename(filePath, path.extname(filePath));

const formatShutterSpeed = (value) => {
    if (typeof value === 'number' && value < 1) {
        return `1/${Math.round(1 / value)}`;
    }
    return value;
};

const formatAperture = (value) => {
    if (typeof value === 'number') {
        return `f/${value.toFixed(1)}`;
    }
    return value;
}


// --- Main script ---

console.log('Starting photo processing script...');

// 1. Get all AVIF and WebP files
const imageFiles = execSync(`find ${publicPhotosDir} -name "*.avif" -o -name "*.webp" -o -name "*.jpg"`)
    .toString()
    .split('\n')
    .filter(line => line.length > 0 && !line.includes('.temp.'));

if (imageFiles.length === 0) {
    console.log('No image files found. Exiting.');
    process.exit(0);
}
console.log(`Found ${imageFiles.length} image files to process.`);

// 2. Load existing photos.json
let photos = [];
if (fs.existsSync(photosJsonPath)) {
    photos = JSON.parse(fs.readFileSync(photosJsonPath, 'utf-8'));
}
console.log(`Loaded ${photos.length} existing photo entries.`);

// 3. Create a map for quick lookups and find max ID
const photoMap = new Map();
let maxId = 0;
photos.forEach(p => {
    const baseName = getFileBaseName(p.src);
    photoMap.set(baseName, p);
    if (p.id > maxId) {
        maxId = p.id;
    }
});
console.log(`Max existing ID is ${maxId}.`);


// 4. Process each image file
for (const filePath of imageFiles) {
    const baseName = getFileBaseName(filePath);
    const webPath = filePath.replace(path.join(process.cwd(), 'public'), '');

    console.log(`Processing ${baseName}...`);

    try {
        const exifDataJson = execSync(`exiftool -json -n -Make -Model -Lens -ISO -FNumber -ExposureTime -ImageWidth -ImageHeight "${filePath}"`).toString();
        const exifData = JSON.parse(exifDataJson)[0];

        const cameraModel = exifData.Model || 'Unknown Camera';
        const lensModel = exifData.Lens || 'Unknown Lens';

        const newPhotoData = {
            src: webPath,
            title: baseName,
            width: exifData.ImageWidth,
            height: exifData.ImageHeight,
            category: path.basename(path.dirname(filePath)), // 'pets' or 'toys'
            exif: {
                camera: cameraModel,
                lens: lensModel,
                iso: exifData.ISO || '',
                aperture: exifData.FNumber ? `f/${exifData.FNumber}`: '',
                shutter: exifData.ExposureTime ? formatShutterSpeed(exifData.ExposureTime) : '',
            }
        };

        const existingPhoto = photoMap.get(baseName);
        if (existingPhoto) {
            // Update existing entry
            console.log(`  Updating existing entry for ${baseName}`);
            existingPhoto.src = newPhotoData.src;
            existingPhoto.width = newPhotoData.width;
            existingPhoto.height = newPhotoData.height;
            existingPhoto.exif = newPhotoData.exif;
        } else {
            // Add new entry
            maxId++;
            console.log(`  Adding new entry for ${baseName} with ID ${maxId}`);
            const newEntry = {
                id: maxId,
                ...newPhotoData
            };
            photos.push(newEntry);
            photoMap.set(baseName, newEntry); // Add to map to avoid duplicates in same run
        }

    } catch (e) {
        console.error(`  Failed to process ${filePath}: ${e.message}`);
    }
}

// 5. Sort the final array by ID for consistency
photos.sort((a, b) => a.id - b.id);

// 6. Write back to photos.json
fs.writeFileSync(photosJsonPath, JSON.stringify(photos, null, 2));

console.log('Successfully updated photos.json!');
