#!/usr/bin/env node

/**
 * Functional Test Runner
 * Executes all functional tests and generates comprehensive reports
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

interface TestSuite {
  name: string;
  file: string;
  description: string;
  critical: boolean;
}

interface TestResult {
  suite: string;
  passed: boolean;
  duration: number;
  output: string;
  errors: string[];
}

class FunctionalTestRunner {
  private testSuites: TestSuite[] = [
    {
      name: 'API Functional Tests',
      file: 'api-functional-tests.ts',
      description: 'Tests all API endpoints and their functionality',
      critical: true
    },
    {
      name: 'Integration Functional Tests',
      file: 'integration-functional-tests.ts',
      description: 'Tests integration between different services',
      critical: true
    },
    {
      name: 'Performance Functional Tests',
      file: 'performance-functional-tests.ts',
      description: 'Tests system performance under various load conditions',
      critical: false
    },
    {
      name: 'Security Functional Tests',
      file: 'security-functional-tests.ts',
      description: 'Tests security aspects of the application',
      critical: true
    }
  ];

  private results: TestResult[] = [];
  private startTime: number = 0;
  private endTime: number = 0;

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Functional Test Suite');
    console.log('=====================================\n');

    this.startTime = Date.now();

    // Check if all services are running
    await this.checkServicesHealth();

    // Run each test suite
    for (const suite of this.testSuites) {
      await this.runTestSuite(suite);
    }

    this.endTime = Date.now();
    
    // Generate reports
    await this.generateReports();
    
    // Print summary
    this.printSummary();
  }

  async checkServicesHealth(): Promise<void> {
    console.log('🔍 Checking services health...');
    
    const services = [
      { name: 'Frontend', url: 'http://localhost:3000' },
      { name: 'Auth Service', url: 'http://localhost:8004' },
      { name: 'Analytics Service', url: 'http://localhost:8003' },
      { name: 'Instruction Service', url: 'http://localhost:8005' },
      { name: 'AI Service', url: 'http://localhost:8006' },
      { name: 'API Gateway', url: 'http://localhost:8080' }
    ];

    const axios = require('axios');
    
    for (const service of services) {
      try {
        const response = await axios.get(`${service.url}/health`, { timeout: 5000 });
        if (response.status === 200) {
          console.log(`✅ ${service.name} is healthy`);
        } else {
          throw new Error(`${service.name} returned status ${response.status}`);
        }
      } catch (error) {
        console.error(`❌ ${service.name} is not accessible:`, error.message);
        throw new Error(`${service.name} health check failed`);
      }
    }
    
    console.log('✅ All services are healthy\n');
  }

  async runTestSuite(suite: TestSuite): Promise<void> {
    console.log(`🧪 Running ${suite.name}...`);
    console.log(`   ${suite.description}`);
    
    const startTime = Date.now();
    let passed = false;
    let output = '';
    let errors: string[] = [];

    try {
      const testFile = path.join(__dirname, suite.file);
      
      // Run the test using vitest
      const command = `npx vitest run ${testFile} --reporter=verbose --reporter=json --outputFile=test-results/${suite.name.toLowerCase().replace(/\s+/g, '-')}-results.json`;
      
      output = execSync(command, { 
        encoding: 'utf8',
        cwd: process.cwd(),
        stdio: 'pipe'
      }).toString();
      
      passed = true;
      console.log(`✅ ${suite.name} passed`);
      
    } catch (error) {
      passed = false;
      errors.push(error.message);
      output = error.stdout || error.message;
      console.log(`❌ ${suite.name} failed`);
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    this.results.push({
      suite: suite.name,
      passed,
      duration,
      output,
      errors
    });

    console.log(`   Duration: ${duration}ms\n`);
  }

  async generateReports(): Promise<void> {
    console.log('📊 Generating reports...');
    
    // Create test-results directory if it doesn't exist
    const resultsDir = path.join(process.cwd(), 'test-results');
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    // Generate HTML report
    await this.generateHTMLReport();
    
    // Generate JSON report
    await this.generateJSONReport();
    
    // Generate Markdown report
    await this.generateMarkdownReport();
    
    console.log('✅ Reports generated successfully\n');
  }

  async generateHTMLReport(): Promise<void> {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Functional Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .summary-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .summary-card h3 { margin: 0 0 10px 0; color: #333; }
        .summary-card .number { font-size: 2em; font-weight: bold; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .test-suite { margin-bottom: 30px; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }
        .test-suite-header { background: #f8f9fa; padding: 15px; border-bottom: 1px solid #ddd; }
        .test-suite-header h3 { margin: 0; }
        .test-suite-content { padding: 15px; }
        .status { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 0.8em; font-weight: bold; }
        .status.passed { background: #d4edda; color: #155724; }
        .status.failed { background: #f8d7da; color: #721c24; }
        .details { margin-top: 10px; }
        .error { background: #f8d7da; color: #721c24; padding: 10px; border-radius: 4px; margin-top: 10px; }
        .output { background: #f8f9fa; padding: 10px; border-radius: 4px; margin-top: 10px; font-family: monospace; white-space: pre-wrap; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 Functional Test Report</h1>
            <p>Generated on ${new Date().toLocaleString()}</p>
        </div>
        
        <div class="summary">
            <div class="summary-card">
                <h3>Total Tests</h3>
                <div class="number">${this.results.length}</div>
            </div>
            <div class="summary-card">
                <h3>Passed</h3>
                <div class="number passed">${this.results.filter(r => r.passed).length}</div>
            </div>
            <div class="summary-card">
                <h3>Failed</h3>
                <div class="number failed">${this.results.filter(r => !r.passed).length}</div>
            </div>
            <div class="summary-card">
                <h3>Duration</h3>
                <div class="number">${((this.endTime - this.startTime) / 1000).toFixed(2)}s</div>
            </div>
        </div>
        
        ${this.results.map(result => `
            <div class="test-suite">
                <div class="test-suite-header">
                    <h3>${result.suite}</h3>
                    <span class="status ${result.passed ? 'passed' : 'failed'}">
                        ${result.passed ? 'PASSED' : 'FAILED'}
                    </span>
                    <span style="float: right;">${(result.duration / 1000).toFixed(2)}s</span>
                </div>
                <div class="test-suite-content">
                    <div class="details">
                        <strong>Duration:</strong> ${result.duration}ms<br>
                        <strong>Status:</strong> ${result.passed ? 'All tests passed' : 'Some tests failed'}
                    </div>
                    ${result.errors.length > 0 ? `
                        <div class="error">
                            <strong>Errors:</strong><br>
                            ${result.errors.map(error => `• ${error}`).join('<br>')}
                        </div>
                    ` : ''}
                    ${result.output ? `
                        <div class="output">${result.output}</div>
                    ` : ''}
                </div>
            </div>
        `).join('')}
    </div>
</body>
</html>`;

    fs.writeFileSync(path.join(process.cwd(), 'test-results/functional-test-report.html'), html);
  }

  async generateJSONReport(): Promise<void> {
    const report = {
      timestamp: new Date().toISOString(),
      duration: this.endTime - this.startTime,
      summary: {
        total: this.results.length,
        passed: this.results.filter(r => r.passed).length,
        failed: this.results.filter(r => !r.passed).length,
        successRate: (this.results.filter(r => r.passed).length / this.results.length) * 100
      },
      results: this.results.map(result => ({
        suite: result.suite,
        passed: result.passed,
        duration: result.duration,
        errors: result.errors
      }))
    };

    fs.writeFileSync(
      path.join(process.cwd(), 'test-results/functional-test-report.json'), 
      JSON.stringify(report, null, 2)
    );
  }

  async generateMarkdownReport(): Promise<void> {
    const markdown = `# 🧪 Functional Test Report

**Generated:** ${new Date().toLocaleString()}  
**Duration:** ${((this.endTime - this.startTime) / 1000).toFixed(2)}s

## 📊 Summary

| Metric | Value |
|--------|-------|
| Total Test Suites | ${this.results.length} |
| Passed | ${this.results.filter(r => r.passed).length} |
| Failed | ${this.results.filter(r => !r.passed).length} |
| Success Rate | ${((this.results.filter(r => r.passed).length / this.results.length) * 100).toFixed(2)}% |

## 📋 Test Results

${this.results.map(result => `
### ${result.suite}

- **Status:** ${result.passed ? '✅ PASSED' : '❌ FAILED'}
- **Duration:** ${(result.duration / 1000).toFixed(2)}s
- **Errors:** ${result.errors.length}

${result.errors.length > 0 ? `
#### Errors:
${result.errors.map(error => `- ${error}`).join('\n')}
` : ''}
`).join('\n')}

## 🎯 Recommendations

${this.results.filter(r => !r.passed).length > 0 ? `
### Critical Issues
- ${this.results.filter(r => !r.passed).length} test suite(s) failed
- Review failed tests and fix underlying issues
- Consider running tests in isolated environments
` : `
### All Tests Passed! 🎉
- All functional tests are passing
- System is ready for production deployment
- Continue monitoring in production environment
`}

---
*Report generated by Functional Test Runner*
`;

    fs.writeFileSync(path.join(process.cwd(), 'test-results/functional-test-report.md'), markdown);
  }

  printSummary(): void {
    console.log('📊 Test Summary');
    console.log('================');
    console.log(`Total Test Suites: ${this.results.length}`);
    console.log(`Passed: ${this.results.filter(r => r.passed).length}`);
    console.log(`Failed: ${this.results.filter(r => !r.passed).length}`);
    console.log(`Success Rate: ${((this.results.filter(r => r.passed).length / this.results.length) * 100).toFixed(2)}%`);
    console.log(`Total Duration: ${((this.endTime - this.startTime) / 1000).toFixed(2)}s`);
    console.log('\n📁 Reports generated:');
    console.log('- test-results/functional-test-report.html');
    console.log('- test-results/functional-test-report.json');
    console.log('- test-results/functional-test-report.md');
    
    if (this.results.filter(r => !r.passed).length > 0) {
      console.log('\n❌ Failed Test Suites:');
      this.results.filter(r => !r.passed).forEach(result => {
        console.log(`- ${result.suite}`);
      });
    } else {
      console.log('\n🎉 All tests passed!');
    }
  }
}

// Run the tests if this file is executed directly
if (require.main === module) {
  const runner = new FunctionalTestRunner();
  runner.runAllTests().catch(error => {
    console.error('❌ Test runner failed:', error.message);
    process.exit(1);
  });
}

export default FunctionalTestRunner;
