// index.js
const moduleAlias = require('module-alias');
const tsconfigPaths = require('tsconfig-paths');
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
  
  try {
    // If configPath is specified, try to load that
    if (configPath) {
      const configFile = path.resolve(process.cwd(), configPath);
      if (!fs.existsSync(configFile)) {
        throw new Error(`Config file not found: ${configFile}`);
      }
      log(`Using config file: ${configFile}`);
      
      if (configFile.endsWith('tsconfig.json')) {
        return registerTSPaths(configFile, { verbose, customAliases });
      } else if (configFile.endsWith('jsconfig.json')) {
        return registerJSPaths(configFile, { verbose, customAliases });
      } else {
        throw new Error('Config file must be either tsconfig.json or jsconfig.json');
      }
    } 
    // Otherwise look for tsconfig.json or jsconfig.json
    else {
      const tsConfigPath = path.resolve(process.cwd(), 'tsconfig.json');
      const jsConfigPath = path.resolve(process.cwd(), 'jsconfig.json');
      
      if (fs.existsSync(tsConfigPath)) {
        log('Using tsconfig.json');
        return registerTSPaths(tsConfigPath, { verbose, customAliases });
      } else if (fs.existsSync(jsConfigPath)) {
        log('Using jsconfig.json');
        return registerJSPaths(jsConfigPath, { verbose, customAliases });
      } else {
        throw new Error('No tsconfig.json or jsconfig.json found');
      }
    }
  } catch (error) {
    console.error('Error setting up auto-import aliases:', error.message);
    return {};
  }
}

/**
 * Registers TypeScript path aliases from a tsconfig.json file
 * @param {string} configPath Path to the tsconfig.json file
 * @param {Object} options Configuration options
 * @param {boolean} options.verbose Whether to log detailed information
 * @param {Object} options.customAliases Custom aliases to add
 * @returns {Object} The registered paths and aliases
 */
function registerTSPaths(configPath, options = {}) {
  const { verbose = false, customAliases = {} } = options;
  const log = verbose ? console.log : () => {};
  
  try {
    const configContent = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configContent);
    
    const { paths, baseUrl } = config.compilerOptions || {};
    
    if (!paths || !baseUrl) {
      throw new Error('No paths or baseUrl found in tsconfig.json');
    }
    
    log(`Found baseUrl: ${baseUrl}`);
    log('Found paths:', paths);
    
    // Register with tsconfig-paths
    tsconfigPaths.register({
      baseUrl: path.resolve(path.dirname(configPath), baseUrl),
      paths: paths
    });
    
    // Also register for module-alias if custom aliases are provided
    if (Object.keys(customAliases).length > 0) {
      moduleAlias.addAliases(customAliases);
    }
    
    if (verbose) {
      console.log('TypeScript path aliases have been set up successfully!');
    }
    
    return { paths, baseUrl };
  } catch (error) {
    console.error('Error registering TypeScript paths:', error.message);
    return {};
  }
}

/**
 * Registers JavaScript path aliases from a jsconfig.json file
 * @param {string} configPath Path to the jsconfig.json file
 * @param {Object} options Configuration options
 * @param {boolean} options.verbose Whether to log detailed information
 * @param {Object} options.customAliases Custom aliases to add
 * @returns {Object} The registered aliases
 */
function registerJSPaths(configPath, options = {}) {
  const { verbose = false, customAliases = {} } = options;
  const log = verbose ? console.log : () => {};
  
  try {
    const configContent = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configContent);
    
    const { paths, baseUrl } = config.compilerOptions || {};
    
    if (!paths || !baseUrl) {
      throw new Error('No paths or baseUrl found in jsconfig.json');
    }
    
    log(`Found baseUrl: ${baseUrl}`);
    log('Found paths:', paths);
    
    const aliases = { ...customAliases };
    
    // Process each alias defined in config
    Object.keys(paths).forEach((alias) => {
      // Remove trailing wildcards (/*) for the key and value
      const cleanAlias = alias.replace(/\/\*$/, '');
      const aliasPath = paths[alias][0].replace(/\/\*$/, '');
      const fullPath = path.resolve(path.dirname(configPath), baseUrl, aliasPath);
      
      aliases[cleanAlias] = fullPath;
      log(`Registered alias: ${cleanAlias} -> ${fullPath}`);
    });
    
    // Register the aliases with module-alias
    moduleAlias.addAliases(aliases);
    
    if (verbose) {
      console.log('JavaScript path aliases have been set up successfully!');
    }
    
    return aliases;
  } catch (error) {
    console.error('Error registering JavaScript paths:', error.message);
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
  registerTSPaths,
  registerJSPaths,
  createConfigWithAliases
};