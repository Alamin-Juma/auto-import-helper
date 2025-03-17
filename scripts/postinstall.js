/**
 * Postinstall script for auto-import-helper
 * 
 * This script runs after the package is installed and:
 * 1. Detects or creates tsconfig.json or jsconfig.json in the user's project
 * 2. Adds required path alias configurations
 * 3. Preserves existing configurations
 */
const fs = require('fs');
const path = require('path');

/**
 * Gets the project root directory
 * @returns {string} The project root path
 */
function getProjectRoot() {
  // INIT_CWD is set by npm during install scripts to the directory where npm install was invoked
  // If not available, try to resolve the project root from the current directory
  let projectRoot = process.env.INIT_CWD;

  if (!projectRoot) {
    // Fallback: navigate up from node_modules
    // node_modules/<package>/scripts/postinstall.js -> ../../
    projectRoot = path.resolve(__dirname, '../../');
    
    // Confirm that we're actually in a project root and not deeper in node_modules
    const packageJsonPath = path.join(projectRoot, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      console.warn('Could not reliably detect project root. Using current directory as fallback.');
      projectRoot = process.cwd();
    }
  }
  
  return projectRoot;
}

/**
 * Updates or creates a config file (tsconfig.json or jsconfig.json)
 * @param {string} configType 'ts' or 'js'
 * @param {string} projectRoot Path to the project root
 */
function updateConfig(configType, projectRoot) {
  const isTypeScript = configType === 'ts';
  const configFileName = isTypeScript ? 'tsconfig.json' : 'jsconfig.json';
  const configPath = path.join(projectRoot, configFileName);
  
  // Default config structure
  let config = {
    compilerOptions: {
      baseUrl: './',
      paths: {
        '@app/*': ['src/*']
      }
    }
  };

  // TypeScript-specific default options
  if (isTypeScript) {
    Object.assign(config.compilerOptions, {
      target: 'es2020',
      module: 'commonjs',
      esModuleInterop: true,
      forceConsistentCasingInFileNames: true,
      strict: true,
      skipLibCheck: true
    });
  }
  
  // If config file exists, load and merge with it
  let existingConfig = null;
  
  if (fs.existsSync(configPath)) {
    try {
      const raw = fs.readFileSync(configPath, 'utf-8');
      existingConfig = JSON.parse(raw);
      console.log(`Found existing ${configFileName}. Updating configuration...`);
    } catch (err) {
      console.error(`Error parsing existing ${configFileName}:`, err.message);
      console.log(`Creating backup of existing ${configFileName} before modifying...`);
      
      // Create backup of malformed config
      const backupPath = `${configPath}.backup-${Date.now()}`;
      try {
        fs.copyFileSync(configPath, backupPath);
        console.log(`Backup created at ${backupPath}`);
      } catch (backupErr) {
        console.error('Failed to create backup:', backupErr.message);
        return false;
      }
    }
  } else {
    console.log(`No ${configFileName} found. Creating a new one...`);
  }

  // Merge configurations if we have an existing config
  if (existingConfig) {
    // Ensure compilerOptions exists
    if (!existingConfig.compilerOptions) {
      existingConfig.compilerOptions = {};
    }
    
    // Preserve existing baseUrl or set default
    if (!existingConfig.compilerOptions.baseUrl) {
      existingConfig.compilerOptions.baseUrl = './';
    }
    
    // Ensure paths object exists
    if (!existingConfig.compilerOptions.paths) {
      existingConfig.compilerOptions.paths = {};
    }
    
    // Add @app/* alias if it doesn't exist
    if (!existingConfig.compilerOptions.paths['@app/*']) {
      existingConfig.compilerOptions.paths['@app/*'] = ['src/*'];
    }
    
    // Use the merged config
    config = existingConfig;
  }
  
  // Write the updated or new config file
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(`Successfully ${existingConfig ? 'updated' : 'created'} ${configFileName} with path alias settings.`);
    
    // Offer some next steps guidance
    console.log('\n===== Auto Import Helper Setup =====');
    console.log('Your project is now configured with path aliases!\n');
    console.log('To use aliases in your code, add the following at the entry point of your application:');
    console.log('\nconst { setupAliases } = require("auto-import-helper");');
    console.log('setupAliases();\n');
    console.log('Then you can use imports like:');
    console.log('const myModule = require("@app/path/to/module");\n');
    
    return true;
  } catch (err) {
    console.error(`Error writing ${configFileName}:`, err.message);
    return false;
  }
}

/**
 * Main function to run postinstall configuration
 */
function runPostInstall() {
  try {
    console.log('🔧 Auto Import Helper: Setting up path aliases configuration...');
    
    const projectRoot = getProjectRoot();
    console.log(`Detected project root: ${projectRoot}`);
    
    // First check if there's a tsconfig.json
    const tsconfigPath = path.join(projectRoot, 'tsconfig.json');
    const jsconfigPath = path.join(projectRoot, 'jsconfig.json');
    
    if (fs.existsSync(tsconfigPath)) {
      // TypeScript project
      updateConfig('ts', projectRoot);
    } else if (fs.existsSync(jsconfigPath)) {
      // JavaScript project with jsconfig
      updateConfig('js', projectRoot);
    } else {
      // Detect project type based on package.json
      const packageJsonPath = path.join(projectRoot, 'package.json');
      
      if (fs.existsSync(packageJsonPath)) {
        try {
          const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
          
          // Check if TypeScript is a dependency
          const hasTypeScript = (
            (packageJson.dependencies && packageJson.dependencies.typescript) ||
            (packageJson.devDependencies && packageJson.devDependencies.typescript)
          );
          
          // Create appropriate config based on project type
          updateConfig(hasTypeScript ? 'ts' : 'js', projectRoot);
        } catch (err) {
          // If package.json can't be parsed, default to TypeScript
          console.warn('Could not parse package.json, defaulting to TypeScript configuration');
          updateConfig('ts', projectRoot);
        }
      } else {
        // No package.json found, default to TypeScript
        console.warn('No package.json found, defaulting to TypeScript configuration');
        updateConfig('ts', projectRoot);
      }
    }
    
  } catch (err) {
    console.error('Error during postinstall setup:', err);
    console.log('You can manually set up aliases by running:');
    console.log('const { createConfigWithAliases } = require("auto-import-helper");');
    console.log('createConfigWithAliases();');
  }
}

// Only run in non-production environments unless forced
const shouldRun = process.env.FORCE_POSTINSTALL === 'true' || process.env.NODE_ENV !== 'production';

if (shouldRun) {
  runPostInstall();
} else {
  console.log('Skipping auto-import-helper setup in production environment.');
  console.log('To force setup, set FORCE_POSTINSTALL=true');
}

module.exports = {
  runPostInstall,
  updateConfig,
  getProjectRoot,
};
