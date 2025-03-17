// __tests__/postinstall.test.js

// Mock the fs module before requiring any modules that use it
jest.mock('fs');

const fs = require('fs');
const path = require('path');
const postinstall = require('../scripts/postinstall');

describe('Postinstall Script', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('checks for config files', () => {
    // Setup the mock implementation
    fs.existsSync.mockImplementation((filePath) => {
      if (filePath.includes('tsconfig.json')) {
        return true;
      }
      return false;
    });

    // Create a spy on console.log to verify output
    const consoleSpy = jest.spyOn(console, 'log');
    
    // Run the postinstall script
    postinstall.runPostInstall();
    
    // Verify that existsSync was called
    expect(fs.existsSync).toHaveBeenCalled();
    
    // Verify that it was called with the expected arguments
    expect(fs.existsSync).toHaveBeenCalledWith(expect.stringContaining('tsconfig.json'));
  });

  test('getProjectRoot returns expected directory', () => {
    // Mock process.env.INIT_CWD
    const originalEnv = process.env;
    process.env = { ...originalEnv, INIT_CWD: '/test/project/root' };
    
    const result = postinstall.getProjectRoot();
    
    expect(result).toBe('/test/project/root');
    
    // Restore original env
    process.env = originalEnv;
  });

  test('updateConfig creates config file when none exists', () => {
    // Mock fs.existsSync to return false (file doesn't exist)
    fs.existsSync.mockReturnValue(false);
    
    // Mock fs.writeFileSync
    fs.writeFileSync = jest.fn();
    
    postinstall.updateConfig('ts', '/test/project');
    
    // Verify writeFileSync was called with correct arguments
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      path.join('/test/project', 'tsconfig.json'),
      expect.any(String)
    );
  });

  test('updateConfig merges with existing config', () => {
    // Mock fs.existsSync to return true (file exists)
    fs.existsSync.mockReturnValue(true);
    
    // Mock fs.readFileSync to return a valid JSON string
    fs.readFileSync.mockReturnValue(JSON.stringify({
      compilerOptions: {
        target: 'es2022',
        paths: {
          '@existing/*': ['existing/*']
        }
      }
    }));
    
    // Mock fs.writeFileSync
    fs.writeFileSync = jest.fn();
    
    postinstall.updateConfig('ts', '/test/project');
    
    // Verify writeFileSync was called with correct arguments
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      path.join('/test/project', 'tsconfig.json'),
      expect.any(String)
    );
    
    // Get the written config
    const writtenConfig = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
    
    // Verify paths were merged correctly
    expect(writtenConfig.compilerOptions.paths['@existing/*']).toEqual(['existing/*']);
    expect(writtenConfig.compilerOptions.paths['@app/*']).toEqual(['src/*']);
    // Verify original settings were preserved
    expect(writtenConfig.compilerOptions.target).toBe('es2022');
  });
});