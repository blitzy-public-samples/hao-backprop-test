/**
 * Jest Test Setup File
 * 
 * This file runs after Jest is loaded but before tests execute.
 * It configures global test settings and utilities.
 */

// Increase timeout for integration tests
jest.setTimeout(10000);

// Clean up any open handles after tests
afterAll(async () => {
  // Allow any pending promises to resolve
  await new Promise(resolve => setTimeout(resolve, 100));
});
