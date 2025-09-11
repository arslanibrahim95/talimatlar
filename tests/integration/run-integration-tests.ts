#!/usr/bin/env tsx

import { exec } from 'child_process';
import { promisify } from 'util';
import { startTestServices, stopTestServices, setupTestDatabase, cleanupTestDatabase } from './test-config';

const execAsync = promisify(exec);

interface TestResult {
  testFile: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
}

interface TestSuite {
  name: string;
  tests: TestResult[];
  totalDuration: number;
  passed: number;
  failed: number;
  skipped: number;
}

class IntegrationTestRunner {
  private testFiles: string[] = [
    'tests/integration/auth-service.test.ts',
    'tests/integration/analytics-service.test.ts',
    'tests/integration/instruction-service.test.ts',
    'tests/integration/api-gateway.test.ts',
    'tests/integration/ai-service.test.ts',
    'tests/integration/database.test.ts',
    'tests/integration/redis.test.ts',
    'tests/integration/end-to-end-workflow.test.ts'
  ];

  private results: TestSuite[] = [];

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Integration Test Suite');
    console.log('=====================================');

    try {
      // Setup
      await this.setup();
      
      // Run tests
      await this.runTests();
      
      // Generate report
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      process.exit(1);
    } finally {
      // Cleanup
      await this.cleanup();
    }
  }

  private async setup(): Promise<void> {
    console.log('\n🔧 Setting up test environment...');
    
    try {
      await startTestServices();
      await setupTestDatabase();
      console.log('✅ Test environment ready');
    } catch (error) {
      console.error('❌ Setup failed:', error);
      throw error;
    }
  }

  private async runTests(): Promise<void> {
    console.log('\n🧪 Running integration tests...');
    
    for (const testFile of this.testFiles) {
      await this.runTestFile(testFile);
    }
  }

  private async runTestFile(testFile: string): Promise<void> {
    console.log(`\n📋 Running ${testFile}...`);
    
    const startTime = Date.now();
    const testSuite: TestSuite = {
      name: testFile,
      tests: [],
      totalDuration: 0,
      passed: 0,
      failed: 0,
      skipped: 0
    };

    try {
      const { stdout, stderr } = await execAsync(`npx vitest run ${testFile} --reporter=verbose`);
      
      const duration = Date.now() - startTime;
      testSuite.totalDuration = duration;
      
      // Parse test results from stdout
      this.parseTestResults(stdout, testSuite);
      
      console.log(`✅ ${testFile} completed in ${duration}ms`);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      testSuite.totalDuration = duration;
      
      console.error(`❌ ${testFile} failed:`, error);
      
      testSuite.tests.push({
        testFile,
        status: 'failed',
        duration,
        error: error.message
      });
      testSuite.failed++;
    }

    this.results.push(testSuite);
  }

  private parseTestResults(stdout: string, testSuite: TestSuite): void {
    const lines = stdout.split('\n');
    
    for (const line of lines) {
      if (line.includes('✓')) {
        const testName = line.trim();
        testSuite.tests.push({
          testFile: testSuite.name,
          status: 'passed',
          duration: 0
        });
        testSuite.passed++;
      } else if (line.includes('✗') || line.includes('×')) {
        const testName = line.trim();
        testSuite.tests.push({
          testFile: testSuite.name,
          status: 'failed',
          duration: 0,
          error: 'Test failed'
        });
        testSuite.failed++;
      } else if (line.includes('○')) {
        const testName = line.trim();
        testSuite.tests.push({
          testFile: testSuite.name,
          status: 'skipped',
          duration: 0
        });
        testSuite.skipped++;
      }
    }
  }

  private generateReport(): void {
    console.log('\n📊 Test Results Summary');
    console.log('========================');

    const totalTests = this.results.reduce((sum, suite) => sum + suite.tests.length, 0);
    const totalPassed = this.results.reduce((sum, suite) => sum + suite.passed, 0);
    const totalFailed = this.results.reduce((sum, suite) => sum + suite.failed, 0);
    const totalSkipped = this.results.reduce((sum, suite) => sum + suite.skipped, 0);
    const totalDuration = this.results.reduce((sum, suite) => sum + suite.totalDuration, 0);

    console.log(`\n📈 Overall Statistics:`);
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   Passed: ${totalPassed} ✅`);
    console.log(`   Failed: ${totalFailed} ❌`);
    console.log(`   Skipped: ${totalSkipped} ⏭️`);
    console.log(`   Duration: ${totalDuration}ms`);
    console.log(`   Success Rate: ${((totalPassed / totalTests) * 100).toFixed(2)}%`);

    console.log(`\n📋 Test Suite Details:`);
    for (const suite of this.results) {
      const status = suite.failed > 0 ? '❌' : '✅';
      console.log(`   ${status} ${suite.name}`);
      console.log(`      Tests: ${suite.tests.length}, Passed: ${suite.passed}, Failed: ${suite.failed}, Skipped: ${suite.skipped}`);
      console.log(`      Duration: ${suite.totalDuration}ms`);
    }

    // Generate detailed report
    this.generateDetailedReport();

    // Exit with appropriate code
    if (totalFailed > 0) {
      console.log('\n❌ Some tests failed!');
      process.exit(1);
    } else {
      console.log('\n🎉 All tests passed!');
      process.exit(0);
    }
  }

  private generateDetailedReport(): void {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: this.results.reduce((sum, suite) => sum + suite.tests.length, 0),
        passed: this.results.reduce((sum, suite) => sum + suite.passed, 0),
        failed: this.results.reduce((sum, suite) => sum + suite.failed, 0),
        skipped: this.results.reduce((sum, suite) => sum + suite.skipped, 0),
        duration: this.results.reduce((sum, suite) => sum + suite.totalDuration, 0)
      },
      suites: this.results
    };

    // Write report to file
    const fs = require('fs');
    const path = require('path');
    
    const reportPath = path.join(process.cwd(), 'test-results', 'integration-test-report.json');
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  }

  private async cleanup(): Promise<void> {
    console.log('\n🧹 Cleaning up test environment...');
    
    try {
      await cleanupTestDatabase();
      await stopTestServices();
      console.log('✅ Cleanup complete');
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
    }
  }
}

// Run the test suite
if (require.main === module) {
  const runner = new IntegrationTestRunner();
  runner.runAllTests().catch(console.error);
}

export default IntegrationTestRunner;
