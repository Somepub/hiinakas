import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const INPUT_DIR = 'C:/Users/Godhaze/Downloads/SVG-cards';
const OUTPUT_DIR = './src/assets/cards';

// Card mapping
const SUIT_MAP = {
  'hearts': '0',
  'diamonds': '1',
  'clubs': '2',
  'spades': '3'
};

const RANK_MAP = {
  '2': '0',
  '3': '1',
  '4': '2',
  '5': '3',
  '6': '4',
  '7': '5',
  '8': '6',
  '9': '7',
  '10': '8',
  'jack': '9',
  'queen': '10',
  'king': '11',
  'ace': '12',
};

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Process SVG files
function processCards() {
  const files = fs.readdirSync(INPUT_DIR);
  
  files.forEach(file => {
    if (file.endsWith('.svg') && file.includes('_of_')) {
      const [rank, _, suit] = file.replace('.svg', '').split('_');
      
      if (SUIT_MAP[suit] !== undefined && RANK_MAP[rank] !== undefined) {
        const newFileName = `${SUIT_MAP[suit]}${RANK_MAP[rank]}.svg`;
        const inputPath = path.join(INPUT_DIR, file);
        const outputPath = path.join(OUTPUT_DIR, newFileName);
        
        // Optimize SVG using svgo
        try {
          execSync(`svgo "${inputPath}" -o "${outputPath}"`);
          console.log(`Processed: ${file} -> ${newFileName}`);
        } catch (error) {
          console.error(`Error processing ${file}:`, error);
        }
      }
    }
  });
}

processCards(); 