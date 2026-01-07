const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  console.log('Starting sidebar color theme test...');

  // Create screenshots directory if it doesn't exist
  const screenshotsDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
  }

  // Launch browser
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Step 1-2: Navigate to localhost:3000/dashboard (webapp) and wait for page to load
    console.log('Step 1-2: Navigating to http://localhost:3000/dashboard...');
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000); // Wait for any animations

    // Step 3: Take screenshot of default state
    console.log('Step 3: Taking screenshot of default state...');
    await page.screenshot({
      path: path.join(screenshotsDir, '01-default-sidebar.png'),
      fullPage: true
    });

    // Get initial sidebar background color
    const initialSidebarColor = await page.evaluate(() => {
      const sidebar = document.querySelector('aside') || document.querySelector('[class*="sidebar"]');
      if (sidebar) {
        return window.getComputedStyle(sidebar).backgroundColor;
      }
      return 'sidebar not found';
    });
    console.log('Initial sidebar color:', initialSidebarColor);

    // Step 4: Click the theme toggle button in the sidebar
    console.log('Step 4: Looking for theme toggle button in sidebar...');

    // The theme toggle should be in the sidebar at the bottom
    const themeToggleSelectors = [
      'aside button[aria-label="Toggle theme"]',
      'aside button[aria-label*="theme" i]',
      'aside button:has(svg)',  // The toggle has Sun/Moon icon
    ];

    let themeButton = null;
    for (const selector of themeToggleSelectors) {
      try {
        themeButton = await page.locator(selector).last(); // Get the last one (at bottom of sidebar)
        if (await themeButton.count() > 0) {
          console.log(`Found theme button with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    if (!themeButton || await themeButton.count() === 0) {
      // Take a screenshot to help debug
      console.log('Theme button not found with known selectors, searching in sidebar...');
      await page.screenshot({
        path: path.join(screenshotsDir, '02-debug-before-click.png'),
        fullPage: true
      });

      const sidebarButtons = await page.locator('aside button').all();
      console.log(`Found ${sidebarButtons.length} buttons in sidebar`);

      if (sidebarButtons.length > 0) {
        for (let i = 0; i < sidebarButtons.length; i++) {
          const ariaLabel = await sidebarButtons[i].getAttribute('aria-label');
          console.log(`Sidebar button ${i}: aria-label="${ariaLabel}"`);
        }
        // Try the last button in sidebar (likely theme toggle)
        themeButton = sidebarButtons[sidebarButtons.length - 1];
        console.log('Using last button in sidebar as theme toggle');
      } else {
        throw new Error('Could not find theme toggle button in sidebar');
      }
    }

    await themeButton.click();
    console.log('Clicked theme toggle button');
    await page.waitForTimeout(1000);

    // Step 5: Click "Colors" to open color picker
    console.log('Step 5: Looking for Colors option...');

    const colorsSelectors = [
      'text="Colors"',
      'button:has-text("Colors")',
      '[role="menuitem"]:has-text("Colors")',
      'div:has-text("Colors")',
      'span:has-text("Colors")'
    ];

    let colorsOption = null;
    for (const selector of colorsSelectors) {
      try {
        colorsOption = await page.locator(selector).first();
        if (await colorsOption.count() > 0) {
          console.log(`Found Colors option with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    if (!colorsOption || await colorsOption.count() === 0) {
      console.log('Colors option not found, might already be in color picker view');
    } else {
      await colorsOption.click();
      console.log('Clicked Colors option');
      await page.waitForTimeout(1000);
    }

    // Step 6: Select a different color theme (blue)
    console.log('Step 6: Looking for color theme options...');

    const colorThemeSelectors = [
      'button[class*="blue"]',
      'div[class*="blue"]',
      '[data-color="blue"]',
      '[aria-label*="blue" i]',
      'button:has-text("Blue")',
      // Generic color selectors
      'button[class*="color"]',
      'div[role="button"][class*="color"]'
    ];

    // Take a screenshot to see available options
    await page.screenshot({
      path: path.join(screenshotsDir, '03-color-picker-view.png'),
      fullPage: true
    });

    let blueThemeButton = null;
    for (const selector of colorThemeSelectors) {
      try {
        blueThemeButton = await page.locator(selector).first();
        if (await blueThemeButton.count() > 0) {
          console.log(`Found color theme option with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    if (blueThemeButton && await blueThemeButton.count() > 0) {
      await blueThemeButton.click();
      console.log('Clicked blue color theme');
      await page.waitForTimeout(1500);

      // Step 7: Take screenshot after first color change
      console.log('Step 7: Taking screenshot after color change to blue...');
      await page.screenshot({
        path: path.join(screenshotsDir, '04-sidebar-after-blue.png'),
        fullPage: true
      });

      // Get sidebar color after first change
      const sidebarColorAfterBlue = await page.evaluate(() => {
        const sidebar = document.querySelector('nav') || document.querySelector('[class*="sidebar"]') || document.querySelector('header');
        if (sidebar) {
          return window.getComputedStyle(sidebar).backgroundColor;
        }
        return 'sidebar not found';
      });
      console.log('Sidebar color after blue theme:', sidebarColorAfterBlue);

      // Step 8: Select another color theme (red)
      console.log('Step 8: Looking for red color theme...');

      const redThemeSelectors = [
        'button[class*="red"]',
        'div[class*="red"]',
        '[data-color="red"]',
        '[aria-label*="red" i]',
        'button:has-text("Red")'
      ];

      let redThemeButton = null;
      for (const selector of redThemeSelectors) {
        try {
          redThemeButton = await page.locator(selector).first();
          if (await redThemeButton.count() > 0) {
            console.log(`Found red theme option with selector: ${selector}`);
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }

      if (redThemeButton && await redThemeButton.count() > 0) {
        await redThemeButton.click();
        console.log('Clicked red color theme');
        await page.waitForTimeout(1500);

        // Step 9: Take screenshot after second color change
        console.log('Step 9: Taking screenshot after color change to red...');
        await page.screenshot({
          path: path.join(screenshotsDir, '05-sidebar-after-red.png'),
          fullPage: true
        });

        // Get sidebar color after second change
        const sidebarColorAfterRed = await page.evaluate(() => {
          const sidebar = document.querySelector('nav') || document.querySelector('[class*="sidebar"]') || document.querySelector('header');
          if (sidebar) {
            return window.getComputedStyle(sidebar).backgroundColor;
          }
          return 'sidebar not found';
        });
        console.log('Sidebar color after red theme:', sidebarColorAfterRed);

        // Step 10: Report results
        console.log('\n=== TEST RESULTS ===');
        console.log('Initial sidebar color:', initialSidebarColor);
        console.log('Sidebar color after blue theme:', sidebarColorAfterBlue);
        console.log('Sidebar color after red theme:', sidebarColorAfterRed);

        const colorChanged1 = initialSidebarColor !== sidebarColorAfterBlue;
        const colorChanged2 = sidebarColorAfterBlue !== sidebarColorAfterRed;

        console.log('\nColor change verification:');
        console.log('- Default to Blue:', colorChanged1 ? '✓ PASSED' : '✗ FAILED');
        console.log('- Blue to Red:', colorChanged2 ? '✓ PASSED' : '✗ FAILED');

        if (colorChanged1 && colorChanged2) {
          console.log('\n✓ SUCCESS: Sidebar successfully changes colors with each theme selection!');
        } else {
          console.log('\n✗ FAILURE: Sidebar did not change colors as expected');
        }
      } else {
        console.log('Could not find red color theme option');
      }
    } else {
      console.log('Could not find blue color theme option');
    }

    // Keep browser open for a few seconds to observe
    await page.waitForTimeout(3000);

  } catch (error) {
    console.error('Error during test:', error);

    // Take error screenshot
    await page.screenshot({
      path: path.join(screenshotsDir, 'error-screenshot.png'),
      fullPage: true
    });
  } finally {
    await browser.close();
    console.log('\nTest completed. Screenshots saved in:', screenshotsDir);
  }
})();
