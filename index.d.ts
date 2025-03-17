declare module 'import-aliases' {
  /**
     * Options for setting up module aliases
     */
    export interface SetupAliasesOptions {
      /**
       * Path to the config file (defaults to searching for tsconfig.json or jsconfig.json)
       */
      configPath?: string;
      
      /**
       * Whether to log detailed information (defaults to false)
       */
      verbose?: boolean;
      
      /**
       * Custom aliases to add regardless of config file
       */
      customAliases?: Record<string, string>;
    }
  
    /**
     * Options for creating a config file with aliases
     */
    export interface CreateConfigOptions {
      /**
       * Type of config file to create ('ts' or 'js')
       */
      type?: 'ts' | 'js';
      
      /**
       * Source directory for aliases (defaults to 'src')
       */
      srcDir?: string;
      
      /**
       * Additional aliases to add (e.g. ['@components', '@utils'])
       */
      additionalAliases?: string[];
    }
  
    /**
     * Sets up module aliases based on tsconfig.json, jsconfig.json, or custom configuration
     * @param options Configuration options
     * @returns The registered aliases
     */
    export function setupAliases(options?: SetupAliasesOptions): Record<string, string>;
  
    /**
     * Creates a tsconfig.json or jsconfig.json file with common alias configurations
     * @param options Configuration options
     * @returns Whether the creation was successful
     */
    export function createConfigWithAliases(options?: CreateConfigOptions): boolean;
  }