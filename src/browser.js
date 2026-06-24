const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

class BrowserManager {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
  }

  async open_browser(headless = false) {
    console.log(`[Browser] Initializing browser (headless: ${headless})...`);
    this.browser = await chromium.launch({ headless });
    this.context = await this.browser.newContext({
      viewport: { width: 1280, height: 720 },
    });
    this.page = await this.context.newPage();
    console.log('[Browser] Browser opened successfully.');
  }

  async navigate_to_url(url) {
    if (!this.page) throw new Error('Browser is not open. Call open_browser first.');
    console.log(`[Browser] Navigating to: ${url}`);
    await this.page.goto(url, { waitUntil: 'networkidle' });
    console.log(`[Browser] Navigation complete.`);
  }

  async take_screenshot(filepath = 'screenshot.png') {
    if (!this.page) throw new Error('Browser is not open.');
    console.log(`[Browser] Taking screenshot: ${filepath}`);
    await this.page.screenshot({ path: filepath, fullPage: true });
    console.log(`[Browser] Screenshot saved.`);
    return filepath;
  }

  async click_on_screen(x, y) {
    if (!this.page) throw new Error('Browser is not open.');
    console.log(`[Browser] Clicking on screen at (${x}, ${y})`);
    await this.page.mouse.click(x, y);
    // Add a small delay to allow for any animations or resulting navigation
    await this.page.waitForTimeout(500); 
  }

  async send_keys(text) {
    if (!this.page) throw new Error('Browser is not open.');
    console.log(`[Browser] Sending keys: "${text}"`);
    // Assuming the element is already focused (e.g., via a preceding click_on_screen)
    await this.page.keyboard.type(text, { delay: 50 });
  }

  async scroll(deltaY = 500) {
    if (!this.page) throw new Error('Browser is not open.');
    console.log(`[Browser] Scrolling by ${deltaY}px`);
    await this.page.mouse.wheel(0, deltaY);
    await this.page.waitForTimeout(500);
  }

  async double_click(x, y) {
    if (!this.page) throw new Error('Browser is not open.');
    console.log(`[Browser] Double clicking at (${x}, ${y})`);
    await this.page.mouse.dblclick(x, y);
    await this.page.waitForTimeout(500);
  }

  async close_browser() {
    console.log('[Browser] Closing browser...');
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
      this.context = null;
      console.log('[Browser] Browser closed.');
    }
  }

  // Utility needed for the agent loop to extract elements
  async evaluate(script, args) {
    if (!this.page) throw new Error('Browser is not open.');
    return await this.page.evaluate(script, args);
  }
}

module.exports = BrowserManager;
