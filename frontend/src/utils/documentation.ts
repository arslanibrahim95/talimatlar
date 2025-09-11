/**
 * Documentation utilities for generating API documentation and code comments
 */

export interface FunctionDocumentation {
  name: string;
  description: string;
  parameters: ParameterDocumentation[];
  returnType: string;
  returnDescription: string;
  examples?: string[];
  tags?: string[];
  deprecated?: boolean;
  since?: string;
}

export interface ParameterDocumentation {
  name: string;
  type: string;
  description: string;
  required: boolean;
  defaultValue?: any;
  options?: any[];
}

export interface ClassDocumentation {
  name: string;
  description: string;
  methods: FunctionDocumentation[];
  properties: PropertyDocumentation[];
  examples?: string[];
  tags?: string[];
}

export interface PropertyDocumentation {
  name: string;
  type: string;
  description: string;
  readonly?: boolean;
  optional?: boolean;
  defaultValue?: any;
}

/**
 * Generate JSDoc comment for a function
 */
export const generateFunctionJSDoc = (doc: FunctionDocumentation): string => {
  let jsdoc = '/**\n';
  
  // Description
  jsdoc += ` * ${doc.description}\n`;
  
  if (doc.deprecated) {
    jsdoc += ' * @deprecated\n';
  }
  
  if (doc.since) {
    jsdoc += ` * @since ${doc.since}\n`;
  }
  
  // Parameters
  doc.parameters.forEach(param => {
    const required = param.required ? '' : '[optional]';
    const defaultValue = param.defaultValue !== undefined ? ` Default: ${param.defaultValue}` : '';
    jsdoc += ` * @param {${param.type}} ${param.name} ${param.description}${required}${defaultValue}\n`;
  });
  
  // Return
  jsdoc += ` * @returns {${doc.returnType}} ${doc.returnDescription}\n`;
  
  // Tags
  if (doc.tags) {
    doc.tags.forEach(tag => {
      jsdoc += ` * @${tag}\n`;
    });
  }
  
  // Examples
  if (doc.examples) {
    doc.examples.forEach(example => {
      jsdoc += ` * @example\n * ${example}\n`;
    });
  }
  
  jsdoc += ' */';
  return jsdoc;
};

/**
 * Generate JSDoc comment for a class
 */
export const generateClassJSDoc = (doc: ClassDocumentation): string => {
  let jsdoc = '/**\n';
  
  // Description
  jsdoc += ` * ${doc.description}\n`;
  
  if (doc.deprecated) {
    jsdoc += ' * @deprecated\n';
  }
  
  if (doc.since) {
    jsdoc += ` * @since ${doc.since}\n`;
  }
  
  // Tags
  if (doc.tags) {
    doc.tags.forEach(tag => {
      jsdoc += ` * @${tag}\n`;
    });
  }
  
  // Examples
  if (doc.examples) {
    doc.examples.forEach(example => {
      jsdoc += ` * @example\n * ${example}\n`;
    });
  }
  
  jsdoc += ' */';
  return jsdoc;
};

/**
 * Generate API documentation in Markdown format
 */
export const generateAPIDocumentation = (classes: ClassDocumentation[]): string => {
  let markdown = '# API Documentation\n\n';
  
  classes.forEach(cls => {
    markdown += `## ${cls.name}\n\n`;
    markdown += `${cls.description}\n\n`;
    
    if (cls.examples) {
      markdown += '### Examples\n\n';
      cls.examples.forEach(example => {
        markdown += '```typescript\n';
        markdown += `${example}\n`;
        markdown += '```\n\n';
      });
    }
    
    if (cls.properties.length > 0) {
      markdown += '### Properties\n\n';
      markdown += '| Name | Type | Description |\n';
      markdown += '|------|------|-------------|\n';
      
      cls.properties.forEach(prop => {
        const optional = prop.optional ? '?' : '';
        const readonly = prop.readonly ? 'readonly ' : '';
        markdown += `| ${prop.name}${optional} | ${readonly}${prop.type} | ${prop.description} |\n`;
      });
      markdown += '\n';
    }
    
    if (cls.methods.length > 0) {
      markdown += '### Methods\n\n';
      
      cls.methods.forEach(method => {
        markdown += `#### ${method.name}\n\n`;
        markdown += `${method.description}\n\n`;
        
        if (method.parameters.length > 0) {
          markdown += '**Parameters:**\n\n';
          markdown += '| Name | Type | Description |\n';
          markdown += '|------|------|-------------|\n';
          
          method.parameters.forEach(param => {
            const required = param.required ? '' : ' (optional)';
            markdown += `| ${param.name} | ${param.type} | ${param.description}${required} |\n`;
          });
          markdown += '\n';
        }
        
        markdown += `**Returns:** \`${method.returnType}\` - ${method.returnDescription}\n\n`;
        
        if (method.examples) {
          markdown += '**Examples:**\n\n';
          method.examples.forEach(example => {
            markdown += '```typescript\n';
            markdown += `${example}\n`;
            markdown += '```\n\n';
          });
        }
      });
    }
    
    markdown += '---\n\n';
  });
  
  return markdown;
};

/**
 * Generate TypeScript interface documentation
 */
export const generateInterfaceDocumentation = (
  name: string,
  description: string,
  properties: PropertyDocumentation[]
): string => {
  let markdown = `## ${name}\n\n`;
  markdown += `${description}\n\n`;
  
  markdown += '### Properties\n\n';
  markdown += '| Name | Type | Description |\n';
  markdown += '|------|------|-------------|\n';
  
  properties.forEach(prop => {
    const optional = prop.optional ? '?' : '';
    const readonly = prop.readonly ? 'readonly ' : '';
    markdown += `| ${prop.name}${optional} | ${readonly}${prop.type} | ${prop.description} |\n`;
  });
  
  return markdown;
};

/**
 * Generate README content for a module
 */
export const generateModuleREADME = (
  moduleName: string,
  description: string,
  installation: string,
  usage: string,
  api: ClassDocumentation[],
  examples: string[]
): string => {
  let readme = `# ${moduleName}\n\n`;
  readme += `${description}\n\n`;
  
  readme += '## Installation\n\n';
  readme += '```bash\n';
  readme += `${installation}\n`;
  readme += '```\n\n';
  
  readme += '## Usage\n\n';
  readme += '```typescript\n';
  readme += `${usage}\n`;
  readme += '```\n\n';
  
  if (examples.length > 0) {
    readme += '## Examples\n\n';
    examples.forEach((example, index) => {
      readme += `### Example ${index + 1}\n\n`;
      readme += '```typescript\n';
      readme += `${example}\n`;
      readme += '```\n\n';
    });
  }
  
  readme += '## API Reference\n\n';
  readme += generateAPIDocumentation(api);
  
  return readme;
};

/**
 * Generate changelog entry
 */
export const generateChangelogEntry = (
  version: string,
  date: string,
  changes: {
    added?: string[];
    changed?: string[];
    deprecated?: string[];
    removed?: string[];
    fixed?: string[];
    security?: string[];
  }
): string => {
  let changelog = `## [${version}] - ${date}\n\n`;
  
  if (changes.added && changes.added.length > 0) {
    changelog += '### Added\n';
    changes.added.forEach(item => {
      changelog += `- ${item}\n`;
    });
    changelog += '\n';
  }
  
  if (changes.changed && changes.changed.length > 0) {
    changelog += '### Changed\n';
    changes.changed.forEach(item => {
      changelog += `- ${item}\n`;
    });
    changelog += '\n';
  }
  
  if (changes.deprecated && changes.deprecated.length > 0) {
    changelog += '### Deprecated\n';
    changes.deprecated.forEach(item => {
      changelog += `- ${item}\n`;
    });
    changelog += '\n';
  }
  
  if (changes.removed && changes.removed.length > 0) {
    changelog += '### Removed\n';
    changes.removed.forEach(item => {
      changelog += `- ${item}\n`;
    });
    changelog += '\n';
  }
  
  if (changes.fixed && changes.fixed.length > 0) {
    changelog += '### Fixed\n';
    changes.fixed.forEach(item => {
      changelog += `- ${item}\n`;
    });
    changelog += '\n';
  }
  
  if (changes.security && changes.security.length > 0) {
    changelog += '### Security\n';
    changes.security.forEach(item => {
      changelog += `- ${item}\n`;
    });
    changelog += '\n';
  }
  
  return changelog;
};

/**
 * Generate code comments for existing functions
 */
export const addJSDocToFunction = (code: string, functionName: string, documentation: FunctionDocumentation): string => {
  const jsdoc = generateFunctionJSDoc(documentation);
  const functionRegex = new RegExp(`(function\\s+${functionName}|const\\s+${functionName}\\s*=|${functionName}\\s*:)`, 'g');
  
  return code.replace(functionRegex, (match) => {
    return `${jsdoc}\n${match}`;
  });
};

/**
 * Generate code comments for existing classes
 */
export const addJSDocToClass = (code: string, className: string, documentation: ClassDocumentation): string => {
  const jsdoc = generateClassJSDoc(documentation);
  const classRegex = new RegExp(`(class\\s+${className})`, 'g');
  
  return code.replace(classRegex, (match) => {
    return `${jsdoc}\n${match}`;
  });
};

export default {
  generateFunctionJSDoc,
  generateClassJSDoc,
  generateAPIDocumentation,
  generateInterfaceDocumentation,
  generateModuleREADME,
  generateChangelogEntry,
  addJSDocToFunction,
  addJSDocToClass,
};
