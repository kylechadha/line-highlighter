/**
 * Test configuration shared across all test files
 * Set HEADLESS=true environment variable to run tests in headless mode
 */

const isHeadless = process.env.HEADLESS === 'true';

// Note: Chrome extensions require headless: false to work properly
// But we allow override for CI environments that might have special setup
module.exports = {
  isHeadless: isHeadless,
  browserArgs: (extensionPath) => {
    const args = [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`
    ];
    
    if (isHeadless) {
      // Additional args for headless if needed
      args.push('--disable-gpu');
    }
    
    return args;
  }
};