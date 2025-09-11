/**
 * Auto-generated documentation system
 * Automatically generates API documentation and code comments
 */

interface CodeElement {
  name: string;
  type: 'function' | 'class' | 'interface' | 'component' | 'hook' | 'service';
  description: string;
  parameters?: ParameterInfo[];
  returnType?: string;
  examples?: string[];
  tags?: string[];
  filePath: string;
  lineNumber: number;
}

interface ParameterInfo {
  name: string;
  type: string;
  description: string;
  required: boolean;
  defaultValue?: any;
}

interface DocumentationConfig {
  outputPath: string;
  includeExamples: boolean;
  includeTypes: boolean;
  includeLineNumbers: boolean;
  format: 'markdown' | 'html' | 'json';
}

class AutoDocumentation {
  private elements: CodeElement[] = [];
  private config: DocumentationConfig;

  constructor(config: DocumentationConfig) {
    this.config = config;
  }

  /**
   * Scan codebase for documentation
   */
  public async scanCodebase(): Promise<void> {
    this.elements = [];
    
    // Scan TypeScript/JavaScript files
    await this.scanFiles('**/*.{ts,tsx,js,jsx}');
    
    // Parse JSDoc comments
    this.parseJSDocComments();
    
    // Generate documentation
    await this.generateDocumentation();
  }

  /**
   * Scan files in the codebase
   */
  private async scanFiles(pattern: string): Promise<void> {
    // This would typically use a file system API
    // For now, we'll simulate scanning
    console.log(`Scanning files with pattern: ${pattern}`);
  }

  /**
   * Parse JSDoc comments from code
   */
  private parseJSDocComments(): void {
    // Parse function definitions
    this.parseFunctionDefinitions();
    
    // Parse class definitions
    this.parseClassDefinitions();
    
    // Parse interface definitions
    this.parseInterfaceDefinitions();
    
    // Parse React components
    this.parseReactComponents();
    
    // Parse custom hooks
    this.parseCustomHooks();
  }

  /**
   * Parse function definitions
   */
  private parseFunctionDefinitions(): void {
    // This would parse actual code
    // For demonstration, we'll add some examples
    this.elements.push({
      name: 'validateEmail',
      type: 'function',
      description: 'Validates email format and returns validation result',
      parameters: [
        {
          name: 'email',
          type: 'string',
          description: 'Email address to validate',
          required: true,
        },
      ],
      returnType: 'FieldValidationResult',
      examples: [
        'const result = validateEmail("user@example.com");',
        'if (result.isValid) { console.log("Valid email"); }',
      ],
      tags: ['validation', 'email'],
      filePath: 'src/utils/validation.ts',
      lineNumber: 73,
    });
  }

  /**
   * Parse class definitions
   */
  private parseClassDefinitions(): void {
    this.elements.push({
      name: 'BaseService',
      type: 'class',
      description: 'Base service class that provides common HTTP request functionality',
      parameters: [
        {
          name: 'serviceName',
          type: 'keyof typeof API_CONFIG',
          description: 'Name of the service to use',
          required: true,
        },
        {
          name: 'defaultConfig',
          type: 'RequestConfig',
          description: 'Default configuration for the service',
          required: false,
          defaultValue: '{}',
        },
      ],
      examples: [
        'class MyService extends BaseService {',
        '  constructor() {',
        '    super("MY_SERVICE", { timeout: 30000 });',
        '  }',
        '}',
      ],
      tags: ['service', 'http', 'base-class'],
      filePath: 'src/services/BaseService.ts',
      lineNumber: 29,
    });
  }

  /**
   * Parse interface definitions
   */
  private parseInterfaceDefinitions(): void {
    this.elements.push({
      name: 'User',
      type: 'interface',
      description: 'User entity interface',
      parameters: [
        {
          name: 'id',
          type: 'string',
          description: 'Unique user identifier',
          required: true,
        },
        {
          name: 'email',
          type: 'string',
          description: 'User email address',
          required: true,
        },
        {
          name: 'role',
          type: '"admin" | "manager" | "user"',
          description: 'User role in the system',
          required: true,
        },
      ],
      examples: [
        'const user: User = {',
        '  id: "123",',
        '  email: "user@example.com",',
        '  role: "user"',
        '};',
      ],
      tags: ['entity', 'user', 'interface'],
      filePath: 'src/types/index.ts',
      lineNumber: 2,
    });
  }

  /**
   * Parse React components
   */
  private parseReactComponents(): void {
    this.elements.push({
      name: 'LoginForm',
      type: 'component',
      description: 'Login form component with validation',
      parameters: [
        {
          name: 'onSubmit',
          type: '(credentials: LoginCredentials) => void',
          description: 'Callback function when form is submitted',
          required: true,
        },
        {
          name: 'isLoading',
          type: 'boolean',
          description: 'Loading state of the form',
          required: false,
          defaultValue: 'false',
        },
      ],
      examples: [
        '<LoginForm',
        '  onSubmit={handleLogin}',
        '  isLoading={isSubmitting}',
        '/>',
      ],
      tags: ['react', 'component', 'form', 'authentication'],
      filePath: 'src/components/auth/LoginForm.tsx',
      lineNumber: 15,
    });
  }

  /**
   * Parse custom hooks
   */
  private parseCustomHooks(): void {
    this.elements.push({
      name: 'useAuth',
      type: 'hook',
      description: 'Authentication state management hook',
      parameters: [],
      returnType: 'AuthState',
      examples: [
        'const { user, login, logout } = useAuth();',
        'if (user) {',
        '  console.log("User logged in:", user.email);',
        '}',
      ],
      tags: ['react', 'hook', 'authentication', 'state'],
      filePath: 'src/stores/authStore.ts',
      lineNumber: 20,
    });
  }

  /**
   * Generate documentation
   */
  private async generateDocumentation(): Promise<void> {
    switch (this.config.format) {
      case 'markdown':
        await this.generateMarkdown();
        break;
      case 'html':
        await this.generateHTML();
        break;
      case 'json':
        await this.generateJSON();
        break;
    }
  }

  /**
   * Generate Markdown documentation
   */
  private async generateMarkdown(): Promise<void> {
    let markdown = `# Auto-Generated Documentation\n\n`;
    markdown += `**Generated:** ${new Date().toISOString()}\n`;
    markdown += `**Total Elements:** ${this.elements.length}\n\n`;

    // Group by type
    const byType = this.groupByType();
    
    Object.entries(byType).forEach(([type, elements]) => {
      markdown += `## ${type.charAt(0).toUpperCase() + type.slice(1)}s (${elements.length})\n\n`;
      
      elements.forEach(element => {
        markdown += `### ${element.name}\n\n`;
        markdown += `${element.description}\n\n`;
        
        if (element.parameters && element.parameters.length > 0) {
          markdown += `**Parameters:**\n\n`;
          markdown += '| Name | Type | Description | Required | Default |\n';
          markdown += '|------|------|-------------|----------|--------|\n';
          
          element.parameters.forEach(param => {
            const required = param.required ? 'Yes' : 'No';
            const defaultValue = param.defaultValue || '-';
            markdown += `| ${param.name} | \`${param.type}\` | ${param.description} | ${required} | ${defaultValue} |\n`;
          });
          markdown += '\n';
        }
        
        if (element.returnType) {
          markdown += `**Returns:** \`${element.returnType}\`\n\n`;
        }
        
        if (element.examples && element.examples.length > 0) {
          markdown += `**Examples:**\n\n`;
          element.examples.forEach(example => {
            markdown += '```typescript\n';
            markdown += `${example}\n`;
            markdown += '```\n\n';
          });
        }
        
        if (element.tags && element.tags.length > 0) {
          markdown += `**Tags:** ${element.tags.map(tag => `\`${tag}\``).join(', ')}\n\n`;
        }
        
        if (this.config.includeLineNumbers) {
          markdown += `**Location:** \`${element.filePath}:${element.lineNumber}\`\n\n`;
        }
        
        markdown += '---\n\n';
      });
    });

    await this.writeFile('documentation.md', markdown);
  }

  /**
   * Generate HTML documentation
   */
  private async generateHTML(): Promise<void> {
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Auto-Generated Documentation</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .element { background: white; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
        .element h3 { color: #495057; margin-top: 0; }
        .parameters { margin: 20px 0; }
        .examples { margin: 20px 0; }
        .tags { margin: 20px 0; }
        .tag { background: #007bff; color: white; padding: 4px 8px; border-radius: 4px; margin-right: 8px; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #dee2e6; }
        th { background: #f8f9fa; }
        code { background: #f8f9fa; padding: 2px 4px; border-radius: 4px; }
        pre { background: #f8f9fa; padding: 15px; border-radius: 4px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Auto-Generated Documentation</h1>
            <p><strong>Generated:</strong> ${new Date().toISOString()}</p>
            <p><strong>Total Elements:</strong> ${this.elements.length}</p>
        </div>`;

    // Group by type
    const byType = this.groupByType();
    
    Object.entries(byType).forEach(([type, elements]) => {
      html += `<h2>${type.charAt(0).toUpperCase() + type.slice(1)}s (${elements.length})</h2>`;
      
      elements.forEach(element => {
        html += `<div class="element">
            <h3>${element.name}</h3>
            <p>${element.description}</p>`;
        
        if (element.parameters && element.parameters.length > 0) {
          html += `<div class="parameters">
                <h4>Parameters</h4>
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Type</th>
                            <th>Description</th>
                            <th>Required</th>
                            <th>Default</th>
                        </tr>
                    </thead>
                    <tbody>`;
          
          element.parameters.forEach(param => {
            const required = param.required ? 'Yes' : 'No';
            const defaultValue = param.defaultValue || '-';
            html += `<tr>
                        <td><code>${param.name}</code></td>
                        <td><code>${param.type}</code></td>
                        <td>${param.description}</td>
                        <td>${required}</td>
                        <td>${defaultValue}</td>
                    </tr>`;
          });
          
          html += `</tbody></table></div>`;
        }
        
        if (element.returnType) {
          html += `<p><strong>Returns:</strong> <code>${element.returnType}</code></p>`;
        }
        
        if (element.examples && element.examples.length > 0) {
          html += `<div class="examples">
                <h4>Examples</h4>`;
          
          element.examples.forEach(example => {
            html += `<pre><code>${example}</code></pre>`;
          });
          
          html += `</div>`;
        }
        
        if (element.tags && element.tags.length > 0) {
          html += `<div class="tags">
                <h4>Tags</h4>`;
          
          element.tags.forEach(tag => {
            html += `<span class="tag">${tag}</span>`;
          });
          
          html += `</div>`;
        }
        
        if (this.config.includeLineNumbers) {
          html += `<p><strong>Location:</strong> <code>${element.filePath}:${element.lineNumber}</code></p>`;
        }
        
        html += `</div>`;
      });
    });

    html += `</div></body></html>`;

    await this.writeFile('documentation.html', html);
  }

  /**
   * Generate JSON documentation
   */
  private async generateJSON(): Promise<void> {
    const jsonData = {
      metadata: {
        generated: new Date().toISOString(),
        totalElements: this.elements.length,
        config: this.config,
      },
      elements: this.elements,
    };

    await this.writeFile('documentation.json', JSON.stringify(jsonData, null, 2));
  }

  /**
   * Group elements by type
   */
  private groupByType(): Record<string, CodeElement[]> {
    const grouped: Record<string, CodeElement[]> = {};
    
    this.elements.forEach(element => {
      if (!grouped[element.type]) {
        grouped[element.type] = [];
      }
      grouped[element.type].push(element);
    });
    
    return grouped;
  }

  /**
   * Write file to output
   */
  private async writeFile(filename: string, content: string): Promise<void> {
    // In a real implementation, this would write to the file system
    console.log(`Generated documentation: ${filename}`);
    console.log(`Content length: ${content.length} characters`);
    
    // For demonstration, we'll create a download link
    if (typeof window !== 'undefined') {
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  /**
   * Generate API documentation
   */
  public async generateAPIDocumentation(): Promise<void> {
    const apiElements = this.elements.filter(element => 
      element.type === 'service' || element.type === 'function'
    );

    let apiDoc = `# API Documentation\n\n`;
    apiDoc += `**Generated:** ${new Date().toISOString()}\n`;
    apiDoc += `**Total Endpoints:** ${apiElements.length}\n\n`;

    apiElements.forEach(element => {
      apiDoc += `## ${element.name}\n\n`;
      apiDoc += `${element.description}\n\n`;
      
      if (element.parameters && element.parameters.length > 0) {
        apiDoc += `### Parameters\n\n`;
        apiDoc += '| Name | Type | Required | Description |\n';
        apiDoc += '|------|------|----------|-------------|\n';
        
        element.parameters.forEach(param => {
          const required = param.required ? 'Yes' : 'No';
          apiDoc += `| ${param.name} | \`${param.type}\` | ${required} | ${param.description} |\n`;
        });
        apiDoc += '\n';
      }
      
      if (element.returnType) {
        apiDoc += `### Response\n\n`;
        apiDoc += `Type: \`${element.returnType}\`\n\n`;
      }
      
      if (element.examples && element.examples.length > 0) {
        apiDoc += `### Examples\n\n`;
        element.examples.forEach(example => {
          apiDoc += '```typescript\n';
          apiDoc += `${example}\n`;
          apiDoc += '```\n\n';
        });
      }
      
      apiDoc += '---\n\n';
    });

    await this.writeFile('api-documentation.md', apiDoc);
  }

  /**
   * Generate component documentation
   */
  public async generateComponentDocumentation(): Promise<void> {
    const componentElements = this.elements.filter(element => 
      element.type === 'component'
    );

    let componentDoc = `# Component Documentation\n\n`;
    componentDoc += `**Generated:** ${new Date().toISOString()}\n`;
    componentDoc += `**Total Components:** ${componentElements.length}\n\n`;

    componentElements.forEach(element => {
      componentDoc += `## ${element.name}\n\n`;
      componentDoc += `${element.description}\n\n`;
      
      if (element.parameters && element.parameters.length > 0) {
        componentDoc += `### Props\n\n`;
        componentDoc += '| Name | Type | Required | Default | Description |\n';
        componentDoc += '|------|------|----------|---------|-------------|\n';
        
        element.parameters.forEach(param => {
          const required = param.required ? 'Yes' : 'No';
          const defaultValue = param.defaultValue || '-';
          componentDoc += `| ${param.name} | \`${param.type}\` | ${required} | ${defaultValue} | ${param.description} |\n`;
        });
        componentDoc += '\n';
      }
      
      if (element.examples && element.examples.length > 0) {
        componentDoc += `### Usage\n\n`;
        element.examples.forEach(example => {
          componentDoc += '```tsx\n';
          componentDoc += `${example}\n`;
          componentDoc += '```\n\n';
        });
      }
      
      componentDoc += '---\n\n';
    });

    await this.writeFile('component-documentation.md', componentDoc);
  }
}

// Export the class
export default AutoDocumentation;

// Helper function to generate documentation
export const generateDocumentation = async (config: DocumentationConfig) => {
  const docGenerator = new AutoDocumentation(config);
  await docGenerator.scanCodebase();
  
  // Generate different types of documentation
  await docGenerator.generateAPIDocumentation();
  await docGenerator.generateComponentDocumentation();
  
  return docGenerator;
};
