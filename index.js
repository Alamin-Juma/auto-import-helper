// index.js
const moduleAlias = require('module-alias');
const path = require('path');
const fs = require('fs');

/**
 * Sets up module aliases based on tsconfig.json, jsconfig.json, or custom configuration
 * @param {Object} options Configuration options
 * @param {string} options.configPath Path to the config file (defaults to searching for tsconfig.json or jsconfig.json)
 * @param {boolean} options.verbose Whether to log detailed information (defaults to false)
 * @param {Object} options.customAliases Custom aliases to add regardless of config file
 * @returns {Object} The registered aliases
 */
function setupAliases(options = {}) {
  const {
    configPath,
    verbose = false,
    customAliases = {}
  } = options;
  
  const log = verbose ? console.log : () => {};
  let config;
  let configFile;
  
  try {
    // If configPath is specified, try to load that
    if (configPath) {
      configFile = path.resolve(process.cwd(), configPath);
      if (!fs.existsSync(configFile)) {
        throw new Error(`Config file not found: ${configFile}`);
      }
      config = require(configFile);
      log(`Using config file: ${configFile}`);
    } 
    // Otherwise look for tsconfig.json or jsconfig.json
    else {
      const tsConfigPath = path.resolve(process.cwd(), 'tsconfig.json');
      const jsConfigPath = path.resolve(process.cwd(), 'jsconfig.json');
      
      if (fs.existsSync(tsConfigPath)) {
        configFile = tsConfigPath;
        config = require(tsConfigPath);
        log('Using tsconfig.json');
      } else if (fs.existsSync(jsConfigPath)) {
        configFile = jsConfigPath;
        config = require(jsConfigPath);
        log('Using jsconfig.json');
      } else {
        throw new Error('No tsconfig.json or jsconfig.json found');
      }
    }

    const { paths, baseUrl } = config.compilerOptions || {};
    const aliases = { ...customAliases };
    
    if (paths && baseUrl) {
      log(`Found baseUrl: ${baseUrl}`);
      log('Found paths:', paths);
      
      // Process each alias defined in config
      Object.keys(paths).forEach((alias) => {
        // Remove trailing wildcards (/*) for the key and value
        const cleanAlias = alias.replace(/\/\*$/, '');
        const aliasPath = paths[alias][0].replace(/\/\*$/, '');
        const fullPath = path.resolve(process.cwd(), baseUrl, aliasPath);
        
        aliases[cleanAlias] = fullPath;
        log(`Registered alias: ${cleanAlias} -> ${fullPath}`);
      });
    } else if (Object.keys(customAliases).length === 0) {
      console.warn('No paths or baseUrl found in config file. No aliases will be set up.');
      return {};
    }

    // Register the aliases
    moduleAlias.addAliases(aliases);
    
    if (verbose) {
      console.log('Auto-import aliases have been set up successfully!');
      console.log('Registered aliases:', aliases);
    }
    
    return aliases;
  } catch (error) {
    console.error('Error setting up auto-import aliases:', error.message);
    return {};
  }
}

/**
 * Creates a tsconfig.json or jsconfig.json file with common alias configurations
 * @param {Object} options Configuration options
 * @param {string} options.type Type of config file to create ('ts' or 'js')
 * @param {string} options.srcDir Source directory for aliases (defaults to 'src')
 * @param {string[]} options.additionalAliases Additional aliases to add (e.g. ['@components', '@utils'])
 * @returns {boolean} Whether the creation was successful
 */
function createConfigWithAliases(options = {}) {
  const {
    type = 'ts',
    srcDir = 'src',
    additionalAliases = []
  } = options;
  
  const configFileName = type === 'js' ? 'jsconfig.json' : 'tsconfig.json';
  const configPath = path.resolve(process.cwd(), configFileName);
  
  // Don't overwrite existing config
  if (fs.existsSync(configPath)) {
    console.error(`${configFileName} already exists. Will not overwrite.`);
    return false;
  }
  
  // Create paths object
  const paths = {
    "@app/*": [`${srcDir}/*`]
  };
  
  // Add additional aliases
  additionalAliases.forEach(alias => {
    // Remove @ if present
    const cleanAlias = alias.startsWith('@') ? alias : `@${alias}`;
    paths[`${cleanAlias}/*`] = [`${srcDir}/${alias.replace(/^@/, '')}/*`];
  });
  
  const baseConfig = {
    compilerOptions: {
      "baseUrl": "./",
      "paths": paths
    }
  };
  
  // Add TypeScript specific options
  if (type === 'ts') {
    Object.assign(baseConfig.compilerOptions, {
      "target": "es2020",
      "module": "commonjs",
      "esModuleInterop": true,
      "forceConsistentCasingInFileNames": true,
      "strict": true,
      "skipLibCheck": true
    });
  }
  
  try {
    fs.writeFileSync(configPath, JSON.stringify(baseConfig, null, 2));
    console.log(`Created ${configFileName} with alias configurations.`);
    return true;
  } catch (error) {
    console.error(`Error creating ${configFileName}:`, error.message);
    return false;
  }
}

module.exports = { 
  setupAliases,
  createConfigWithAliases
};