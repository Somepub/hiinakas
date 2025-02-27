import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const INPUT_DIR = './src/assets/sounds';
const OUTPUT_DIR = './src/assets/sounds';

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function convertToMp3() {
  const files = fs.readdirSync(INPUT_DIR);

  console.log(files);
  files.forEach(file => {
    // Handle common audio formats
    if (file.endsWith('.wav') || file.endsWith('.ogg') || file.endsWith('.m4a') || file.endsWith('.aac')) {
      const inputPath = path.join(INPUT_DIR, file);
      const outputPath = path.join(OUTPUT_DIR, file.replace(/\.(wav|ogg|m4a|aac)$/, '.mp3'));

      try {
        // Convert to MP3 using FFmpeg with good quality settings
        // -q:a 2 provides high quality (0 is highest, 9 is lowest)
        // -b:a 192k sets bitrate to 192kbps which is good for most web audio
        execSync(`ffmpeg -i "${inputPath}" -q:a 2 -b:a 192k "${outputPath}"`);
        console.log(`Converted: ${file} -> ${path.basename(outputPath)}`);
        
        // Remove original file after successful conversion
        fs.unlinkSync(inputPath);
        console.log(`Removed original: ${file}`);
      } catch (error) {
        console.error(`Error processing ${file}:`, error);
      }
    }
  });
}

convertToMp3(); 