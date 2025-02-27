import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const INPUT_DIR = './src/assets/cards';
const OUTPUT_DIR = './src/assets/cards';
const TEMP_DIR = './temp-png';
console.log(INPUT_DIR, OUTPUT_DIR, TEMP_DIR);

// Ensure directories exist
[OUTPUT_DIR, TEMP_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

async function convertToWebp() {
  const files = fs.readdirSync(INPUT_DIR);
console.log(files);
  files.forEach(file => {
    console.log(file);
    if (file.endsWith('.svg')) {
      const baseName = path.basename(file, '.svg');
      const tempPngPath = path.join(TEMP_DIR, `${baseName}.png`);
      const outputPath = path.join(OUTPUT_DIR, `${baseName}.webp`);

      try {
        // Step 1: Convert SVG to PNG with high resolution
        execSync(`inkscape "${path.join(INPUT_DIR, file)}" --export-filename="${tempPngPath}" --export-width=128`);
        console.log(`Converted to PNG: ${file}`);

        // Step 2: Convert PNG to WebP with good quality
        execSync(`cwebp -q 60 "${tempPngPath}" -o "${outputPath}"`);
        console.log(`Converted to WebP: ${baseName}.webp`);

        // Step 3: Remove temporary PNG file
        fs.unlinkSync(tempPngPath);
      } catch (error) {
        console.error(`Error processing ${file}:`, error);
      }
    }
  });

  // Clean up temp directory
  if (fs.existsSync(TEMP_DIR)) {
    fs.rmdirSync(TEMP_DIR, { recursive: true });
  }
}

convertToWebp(); 