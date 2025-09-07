const { chromium } = require('@playwright/test');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function createDemo() {
  console.log('Starting demo creation...');
  
  // Launch browser with extension
  const browser = await chromium.launch({
    headless: false,
    args: [
      `--disable-extensions-except=${path.join(__dirname)}`,
      `--load-extension=${path.join(__dirname)}`,
      '--window-size=1280,720'
    ],
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: {
      dir: './videos',
      size: { width: 1280, height: 720 }
    }
  });

  const page = await context.newPage();
  
  // Navigate to a demo article
  await page.goto('https://www.bbc.com/news/articles/c0mzdj1n303o');
  await page.waitForTimeout(2000);

  // Enable the extension
  await page.keyboard.press('Control+e');
  await page.waitForTimeout(500);

  // Click on the article text to highlight a line
  const articleElement = await page.$('article p');
  if (articleElement) {
    await articleElement.click();
    await page.waitForTimeout(1000);
  }

  // Navigate down a few lines
  await page.keyboard.press('v');
  await page.waitForTimeout(500);
  await page.keyboard.press('v');
  await page.waitForTimeout(500);
  await page.keyboard.press('v');
  await page.waitForTimeout(1000);

  // Toggle cursor
  await page.keyboard.press('c');
  await page.waitForTimeout(1000);

  // Move cursor right
  await page.keyboard.press('l');
  await page.waitForTimeout(300);
  await page.keyboard.press('l');
  await page.waitForTimeout(300);
  await page.keyboard.press('l');
  await page.waitForTimeout(1000);

  // Move back up
  await page.keyboard.press('f');
  await page.waitForTimeout(500);
  await page.keyboard.press('f');
  await page.waitForTimeout(1000);

  // Move cursor left
  await page.keyboard.press('k');
  await page.waitForTimeout(300);
  await page.keyboard.press('k');
  await page.waitForTimeout(1000);

  // Hide cursor
  await page.keyboard.press('c');
  await page.waitForTimeout(1000);

  // Close and save video
  await context.close();
  await browser.close();

  console.log('Demo recording complete. Converting to GIF...');

  // Wait for video to be written
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Find the video file
  const fs = require('fs');
  const videoDir = path.join(__dirname, 'videos');
  const files = fs.readdirSync(videoDir);
  const videoFile = files.find(f => f.endsWith('.webm'));
  
  if (!videoFile) {
    console.error('No video file found!');
    return;
  }

  const videoPath = path.join(videoDir, videoFile);
  const gifPath = path.join(__dirname, 'demo.gif');

  // Convert to GIF using ffmpeg
  try {
    // Create a high-quality GIF with optimized palette
    await execAsync(`ffmpeg -i "${videoPath}" -vf "fps=10,scale=800:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" -loop 0 "${gifPath}"`);
    console.log('GIF created successfully at demo.gif');
    
    // Clean up video file
    fs.unlinkSync(videoPath);
    fs.rmdirSync(videoDir);
  } catch (error) {
    console.error('Error creating GIF:', error);
    console.log('Video saved at:', videoPath);
  }
}

createDemo().catch(console.error);