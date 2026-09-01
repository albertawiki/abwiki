// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Visual review for the published figures.
 *
 * These tests answer the question the unit tests cannot: does the site look
 * right? jsdom has no layout engine and does not deliver ResizeObserver, so a
 * chart can pass every unit test and still render blank, overflow its card, or
 * collapse on a phone. This runs a real browser at real viewports.
 *
 * Baselines are committed per platform. Font rasterisation differs between
 * Windows, macOS and Linux, so a baseline recorded on a laptop will not match
 * one recorded on a CI runner. CI records and compares Linux baselines; run
 * `npm run review:visual:docker` locally to produce comparable ones.
 */
module.exports = defineConfig({
  testDir: './e2e',
  outputDir: './e2e/.results',
  // projectName keeps the desktop and mobile baselines apart; platform keeps
  // a Windows recording from being compared against a Linux one.
  snapshotPathTemplate: '{testDir}/__screenshots__/{projectName}-{platform}/{arg}{ext}',

  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],

  expect: {
    toHaveScreenshot: {
      // Anti-aliasing differs by a hair between runs of the same browser.
      // Two-tenths of a percent absorbs that without hiding a real change:
      // a shifted axis, a dropped series or a blank chart moves far more.
      maxDiffPixelRatio: 0.002,
      animations: 'disabled',
      scale: 'css',
    },
  },

  use: {
    baseURL: process.env.REVIEW_BASE_URL || 'http://127.0.0.1:4173',
    // The figures disable their mount animation under this preference, so a
    // screenshot captures the chart rather than a frame part-way through it.
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } },
    },
    {
      name: 'mobile',
      // The layout most readers will actually use, and the one the jsdom
      // tests are structurally incapable of exercising.
      use: { ...devices['Pixel 7'] },
    },
  ],

  webServer: process.env.REVIEW_BASE_URL
    ? undefined
    : {
        command: 'npx serve -s build -l 4173',
        url: 'http://127.0.0.1:4173',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
