// __tests__/index.test.js

// Mock the necessary modules
jest.mock('module-alias');
jest.mock('tsconfig-paths');
jest.mock('fs');
jest.mock('path');

const fs = require('fs');
const path = require('path');
const moduleAlias = require('module-alias');
const tsconfigPaths = require('tsconfig-paths');

// Import the main module
const autoImportHelper = require('../index');

describe('Auto Import Helper', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('module exports expected functions', () => {
    expect(typeof autoImportHelper).toBe('object');
    expect(typeof autoImportHelper.setupAliases).toBe('function');
    expect(typeof autoImportHelper.registerTSPaths).toBe('function');
    expect(typeof autoImportHelper.registerJSPaths).toBe('function');
  });

  test('setupAliases detects TypeScript project and sets up correctly', () => {
    // Mock fs.existsSync to return true for tsconfig.json
    fs.existsSync.mockImplementation((filePath) => filePath.endsWith('tsconfig.json'));

    // For TypeScript, return a fixed path when looking for tsconfig.json,
    // but let other calls join the arguments:
    path.resolve.mockImplementation((...args) => {
      // If looking for tsconfig.json, return a specific value:
      if (args[args.length - 1] === 'tsconfig.json') {
        return '/test/project/tsconfig.json';
      }
      // Otherwise join the arguments (simulate real path resolution)
      return args.join('/');
    });

    // Mock fs.readFileSync to return a valid tsconfig
    fs.readFileSync.mockReturnValue(JSON.stringify({
      compilerOptions: {
        baseUrl: './',
        paths: {
          '@app/*': ['src/*']
        }
      }
    }));

    // Call the function
    autoImportHelper.setupAliases();

    // Verify tsconfigPaths.register was called
    expect(tsconfigPaths.register).toHaveBeenCalled();
  });

  test('setupAliases detects JavaScript project and sets up correctly', () => {
    // Mock fs.existsSync: false for tsconfig.json, true for jsconfig.json
    fs.existsSync.mockImplementation((filePath) => filePath.endsWith('jsconfig.json'));

    // Adjust path.resolve:
    path.resolve.mockImplementation((...args) => {
      // If the file is jsconfig.json, return a fixed path:
      if (args[args.length - 1] === 'jsconfig.json') {
        return '/test/project/jsconfig.json';
      }
      // For alias resolution, join arguments to simulate a real path:
      return args.join('/');
    });

    // Mock fs.readFileSync to return a valid jsconfig
    fs.readFileSync.mockReturnValue(JSON.stringify({
      compilerOptions: {
        baseUrl: './',
        paths: {
          '@app/*': ['src/*']
        }
      }
    }));

    // Call the function
    autoImportHelper.setupAliases();

    // Verify that moduleAlias.addAliases was called (the registerJSPaths branch)
    expect(moduleAlias.addAliases).toHaveBeenCalled();
  });

  test('registerTSPaths registers TypeScript paths correctly', () => {
    fs.readFileSync.mockReturnValue(JSON.stringify({
      compilerOptions: {
        baseUrl: './',
        paths: {
          '@app/*': ['src/*'],
          '@utils/*': ['utils/*']
        }
      }
    }));

    autoImportHelper.registerTSPaths('/test/project/tsconfig.json');

    expect(tsconfigPaths.register).toHaveBeenCalledWith({
      baseUrl: expect.any(String),
      paths: expect.objectContaining({
        '@app/*': expect.any(Array),
        '@utils/*': expect.any(Array)
      })
    });
  });

  test('registerJSPaths registers JavaScript paths correctly', () => {
    fs.readFileSync.mockReturnValue(JSON.stringify({
      compilerOptions: {
        baseUrl: './',
        paths: {
          '@app/*': ['src/*'],
          '@utils/*': ['utils/*']
        }
      }
    }));

    autoImportHelper.registerJSPaths('/test/project/jsconfig.json');

    expect(moduleAlias.addAliases).toHaveBeenCalledWith(expect.objectContaining({
      '@app': expect.any(String),
      '@utils': expect.any(String)
    }));
  });
});
