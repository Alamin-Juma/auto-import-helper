# Auto Import Helper

A robust and flexible library for setting up absolute path imports with aliases like `@app/` in JavaScript and TypeScript projects.

## Features

- 🚀 Simple one-line setup for absolute imports
- 🔄 Automatic detection of `tsconfig.json` or `jsconfig.json`
- ⚙️ Support for custom configuration paths
- 🧰 Utility to create config files with common alias patterns
- 🎯 Support for custom aliases on top of config-defined ones
- 📝 Detailed logging option for debugging

## Installation

```bash
npm install auto-import-helper```

Basic Usage
In your entry file (e.g., index.js, app.js, or main.ts):

```javascript
// Register aliases at the very beginning of your app
const { setupAliases } = require('auto-import-helper');
setupAliases();

// Now you can use absolute imports:
const myModule = require('@app/modules/myModule');
// Or with ES imports:
// import { myComponent } from '@app/components/myComponent';
```

Configuration
Make sure your project has a tsconfig.json or jsconfig.json with paths configured:

```json
{
  "compilerOptions": {
    "baseUrl": "./",
    "paths": {
      "@app/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@utils/*": ["src/utils/*"]
    }
  }
}
```

Custom Setup Options
Customize the alias setup process:

```javascript
const { setupAliases } = require('auto-import-helper');

// Advanced setup with options
const registeredAliases = setupAliases({
  // Use a custom config file path
  configPath: './configs/my-tsconfig.json',
  
  // Enable verbose logging
  verbose: true,
  
  // Add custom aliases on top of those defined in the config
  customAliases: {
    '@lib': path.resolve(__dirname, 'lib'),
    '@external': path.resolve(__dirname, 'node_modules/some-module')
  }
});

console.log('Registered aliases:', registeredAliases);
```
Type Definitions
TypeScript type definitions are included and provide full IntelliSense support:

```javascript
import { setupAliases, createConfigWithAliases } from 'auto-import-helper';

// Full type support for options
setupAliases({
  verbose: true,
  customAliases: {
    '@models': './src/domain/models'
  }
});
```

Examples
Basic Node.js Example

```javascript
// index.js
const { setupAliases } = require('auto-import-helper');
setupAliases();

// Now use absolute imports
const { User } = require('@app/models/User');
```

Express.js Example
```javascript
// app.js
const { setupAliases } = require('auto-import-helper');
setupAliases();

const express = require('express');
const routes = require('@app/routes');
const middlewares = require('@app/middlewares');

const app = express();
// ... app setup
```
TypeScript Example
```javascript
// main.ts
import { setupAliases } from 'auto-import-helper';
setupAliases();

import { UserService } from '@app/services/UserService';
import { AppConfig } from '@app/config';

// ... application code
```


Compatibility
Works with Node.js applications

Compatible with TypeScript and JavaScript projects

Works with frameworks like Express, NestJS, etc.

Compatible with testing frameworks like Jest

Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

License
MIT


This `README.md` file provides a comprehensive guide to using the `auto-import-helper` library, including installation, basic and advanced usage, configuration, examples, and more. You can copy and paste this content directly into your project's `README.md` file.