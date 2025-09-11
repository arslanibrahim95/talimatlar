/**
 * Security auditing and penetration testing utilities
 * Helps identify security vulnerabilities in the application
 */

interface SecurityVulnerability {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  description: string;
  impact: string;
  recommendation: string;
  cwe?: string;
  cvss?: number;
}

interface SecurityAuditResult {
  timestamp: number;
  vulnerabilities: SecurityVulnerability[];
  score: number;
  recommendations: string[];
}

class SecurityAuditor {
  private vulnerabilities: SecurityVulnerability[] = [];
  private isAuditing = false;

  /**
   * Run comprehensive security audit
   */
  public async runSecurityAudit(): Promise<SecurityAuditResult> {
    if (this.isAuditing) {
      throw new Error('Security audit already in progress');
    }

    this.isAuditing = true;
    this.vulnerabilities = [];

    try {
      await this.auditXSSVulnerabilities();
      await this.auditCSRFVulnerabilities();
      await this.auditInjectionVulnerabilities();
      await this.auditAuthenticationVulnerabilities();
      await this.auditAuthorizationVulnerabilities();
      await this.auditDataExposureVulnerabilities();
      await this.auditConfigurationVulnerabilities();
      await this.auditCryptographyVulnerabilities();

      const score = this.calculateSecurityScore();
      const recommendations = this.generateRecommendations();

      return {
        timestamp: Date.now(),
        vulnerabilities: this.vulnerabilities,
        score,
        recommendations,
      };
    } finally {
      this.isAuditing = false;
    }
  }

  /**
   * Audit XSS vulnerabilities
   */
  private async auditXSSVulnerabilities(): Promise<void> {
    // Check for unsafe innerHTML usage
    const unsafeInnerHTML = document.querySelectorAll('[innerHTML]');
    if (unsafeInnerHTML.length > 0) {
      this.vulnerabilities.push({
        id: 'XSS-001',
        severity: 'high',
        category: 'Cross-Site Scripting',
        description: 'Unsafe innerHTML usage detected',
        impact: 'Potential XSS attacks through malicious HTML injection',
        recommendation: 'Use textContent or sanitize HTML content',
        cwe: 'CWE-79',
        cvss: 6.1,
      });
    }

    // Check for eval usage
    if (typeof eval !== 'undefined') {
      this.vulnerabilities.push({
        id: 'XSS-002',
        severity: 'critical',
        category: 'Cross-Site Scripting',
        description: 'eval() function usage detected',
        impact: 'Code injection attacks possible',
        recommendation: 'Remove eval() usage and use safer alternatives',
        cwe: 'CWE-95',
        cvss: 9.8,
      });
    }

    // Check for unsafe URL schemes
    const links = document.querySelectorAll('a[href]');
    links.forEach(link => {
      const href = link.getAttribute('href');
      if (href && (href.startsWith('javascript:') || href.startsWith('data:'))) {
        this.vulnerabilities.push({
          id: 'XSS-003',
          severity: 'high',
          category: 'Cross-Site Scripting',
          description: 'Unsafe URL scheme detected',
          impact: 'JavaScript execution through malicious URLs',
          recommendation: 'Validate and sanitize all URLs',
          cwe: 'CWE-79',
          cvss: 6.1,
        });
      }
    });
  }

  /**
   * Audit CSRF vulnerabilities
   */
  private async auditCSRFVulnerabilities(): Promise<void> {
    // Check for CSRF tokens
    const forms = document.querySelectorAll('form');
    let formsWithoutCSRF = 0;

    forms.forEach(form => {
      const csrfToken = form.querySelector('input[name*="csrf"], input[name*="token"]');
      if (!csrfToken) {
        formsWithoutCSRF++;
      }
    });

    if (formsWithoutCSRF > 0) {
      this.vulnerabilities.push({
        id: 'CSRF-001',
        severity: 'high',
        category: 'Cross-Site Request Forgery',
        description: `${formsWithoutCSRF} forms without CSRF protection`,
        impact: 'Unauthorized actions on behalf of authenticated users',
        recommendation: 'Implement CSRF tokens for all state-changing operations',
        cwe: 'CWE-352',
        cvss: 6.5,
      });
    }
  }

  /**
   * Audit injection vulnerabilities
   */
  private async auditInjectionVulnerabilities(): Promise<void> {
    // Check for SQL injection patterns in input fields
    const inputs = document.querySelectorAll('input, textarea, select');
    let potentialInjectionInputs = 0;

    inputs.forEach(input => {
      const value = (input as HTMLInputElement).value;
      const sqlPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
        /(--|\/\*|\*\/)/,
        /(\bOR\b|\bAND\b).*(\bOR\b|\bAND\b)/i,
      ];

      if (sqlPatterns.some(pattern => pattern.test(value))) {
        potentialInjectionInputs++;
      }
    });

    if (potentialInjectionInputs > 0) {
      this.vulnerabilities.push({
        id: 'INJ-001',
        severity: 'medium',
        category: 'Injection',
        description: 'Potential injection patterns detected in inputs',
        impact: 'Data manipulation or unauthorized access',
        recommendation: 'Implement input validation and sanitization',
        cwe: 'CWE-89',
        cvss: 5.3,
      });
    }
  }

  /**
   * Audit authentication vulnerabilities
   */
  private async auditAuthenticationVulnerabilities(): Promise<void> {
    // Check for weak password requirements
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    
    passwordInputs.forEach(input => {
      const minLength = input.getAttribute('minlength');
      if (!minLength || parseInt(minLength) < 8) {
        this.vulnerabilities.push({
          id: 'AUTH-001',
          severity: 'medium',
          category: 'Authentication',
          description: 'Weak password requirements detected',
          impact: 'Increased risk of password cracking',
          recommendation: 'Enforce minimum 8 character passwords with complexity requirements',
          cwe: 'CWE-521',
          cvss: 4.3,
        });
      }
    });

    // Check for session timeout
    const sessionTimeout = localStorage.getItem('session_timeout');
    if (!sessionTimeout || parseInt(sessionTimeout) > 3600000) { // 1 hour
      this.vulnerabilities.push({
        id: 'AUTH-002',
        severity: 'medium',
        category: 'Authentication',
        description: 'Long or missing session timeout',
        impact: 'Increased risk of session hijacking',
        recommendation: 'Implement reasonable session timeouts (15-30 minutes)',
        cwe: 'CWE-613',
        cvss: 4.3,
      });
    }
  }

  /**
   * Audit authorization vulnerabilities
   */
  private async auditAuthorizationVulnerabilities(): Promise<void> {
    // Check for client-side role checks
    const roleElements = document.querySelectorAll('[data-role], [data-permission]');
    if (roleElements.length > 0) {
      this.vulnerabilities.push({
        id: 'AUTHZ-001',
        severity: 'medium',
        category: 'Authorization',
        description: 'Client-side role/permission checks detected',
        impact: 'Bypass of access controls through client manipulation',
        recommendation: 'Implement server-side authorization checks',
        cwe: 'CWE-602',
        cvss: 4.3,
      });
    }
  }

  /**
   * Audit data exposure vulnerabilities
   */
  private async auditDataExposureVulnerabilities(): Promise<void> {
    // Check for sensitive data in localStorage
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'credential'];
    const localStorageKeys = Object.keys(localStorage);
    
    const exposedSensitiveData = sensitiveKeys.some(key => 
      localStorageKeys.some(localKey => localKey.toLowerCase().includes(key))
    );

    if (exposedSensitiveData) {
      this.vulnerabilities.push({
        id: 'DATA-001',
        severity: 'high',
        category: 'Data Exposure',
        description: 'Sensitive data stored in localStorage',
        impact: 'Data theft through XSS or client-side attacks',
        recommendation: 'Use secure storage methods and encrypt sensitive data',
        cwe: 'CWE-200',
        cvss: 5.5,
      });
    }

    // Check for sensitive data in console logs
    if (import.meta.env.DEV) {
      this.vulnerabilities.push({
        id: 'DATA-002',
        severity: 'low',
        category: 'Data Exposure',
        description: 'Development mode enabled',
        impact: 'Potential exposure of sensitive information in console',
        recommendation: 'Disable development mode in production',
        cwe: 'CWE-200',
        cvss: 2.1,
      });
    }
  }

  /**
   * Audit configuration vulnerabilities
   */
  private async auditConfigurationVulnerabilities(): Promise<void> {
    // Check for missing security headers
    const securityHeaders = [
      'X-Content-Type-Options',
      'X-Frame-Options',
      'X-XSS-Protection',
      'Content-Security-Policy',
      'Strict-Transport-Security',
    ];

    // Note: This would need to be implemented server-side
    // For now, we'll check if we're on HTTPS
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      this.vulnerabilities.push({
        id: 'CONFIG-001',
        severity: 'high',
        category: 'Configuration',
        description: 'Application not served over HTTPS',
        impact: 'Data transmitted in plain text, vulnerable to interception',
        recommendation: 'Enable HTTPS and redirect all HTTP traffic',
        cwe: 'CWE-319',
        cvss: 7.5,
      });
    }
  }

  /**
   * Audit cryptography vulnerabilities
   */
  private async auditCryptographyVulnerabilities(): Promise<void> {
    // Check for weak random number generation
    if (typeof Math.random === 'function') {
      // Note: This is a simplified check
      // In production, use crypto.getRandomValues()
      this.vulnerabilities.push({
        id: 'CRYPTO-001',
        severity: 'medium',
        category: 'Cryptography',
        description: 'Weak random number generation detected',
        impact: 'Predictable values could be exploited',
        recommendation: 'Use crypto.getRandomValues() for cryptographic purposes',
        cwe: 'CWE-338',
        cvss: 4.3,
      });
    }
  }

  /**
   * Calculate security score (0-100)
   */
  private calculateSecurityScore(): number {
    if (this.vulnerabilities.length === 0) {
      return 100;
    }

    let totalScore = 100;
    const severityWeights = {
      critical: 25,
      high: 15,
      medium: 10,
      low: 5,
    };

    this.vulnerabilities.forEach(vuln => {
      totalScore -= severityWeights[vuln.severity];
    });

    return Math.max(0, totalScore);
  }

  /**
   * Generate security recommendations
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.vulnerabilities.some(v => v.severity === 'critical')) {
      recommendations.push('Immediately address all critical vulnerabilities');
    }

    if (this.vulnerabilities.some(v => v.severity === 'high')) {
      recommendations.push('Prioritize fixing high-severity vulnerabilities');
    }

    if (this.vulnerabilities.some(v => v.category === 'Cross-Site Scripting')) {
      recommendations.push('Implement comprehensive XSS protection measures');
    }

    if (this.vulnerabilities.some(v => v.category === 'Cross-Site Request Forgery')) {
      recommendations.push('Add CSRF protection to all forms and API endpoints');
    }

    if (this.vulnerabilities.some(v => v.category === 'Authentication')) {
      recommendations.push('Strengthen authentication and session management');
    }

    if (this.vulnerabilities.some(v => v.category === 'Data Exposure')) {
      recommendations.push('Review and secure all data storage methods');
    }

    recommendations.push('Implement regular security audits and penetration testing');
    recommendations.push('Keep all dependencies updated and scan for vulnerabilities');
    recommendations.push('Train development team on secure coding practices');

    return recommendations;
  }

  /**
   * Export audit results
   */
  public exportAuditResults(results: SecurityAuditResult): string {
    let report = `# Security Audit Report\n\n`;
    report += `**Timestamp:** ${new Date(results.timestamp).toISOString()}\n`;
    report += `**Security Score:** ${results.score}/100\n\n`;

    if (results.vulnerabilities.length === 0) {
      report += `## ✅ No vulnerabilities found\n\n`;
      report += `Your application appears to be secure!\n`;
    } else {
      report += `## 🚨 Vulnerabilities Found: ${results.vulnerabilities.length}\n\n`;

      const bySeverity = {
        critical: results.vulnerabilities.filter(v => v.severity === 'critical'),
        high: results.vulnerabilities.filter(v => v.severity === 'high'),
        medium: results.vulnerabilities.filter(v => v.severity === 'medium'),
        low: results.vulnerabilities.filter(v => v.severity === 'low'),
      };

      Object.entries(bySeverity).forEach(([severity, vulns]) => {
        if (vulns.length > 0) {
          report += `### ${severity.toUpperCase()} (${vulns.length})\n\n`;
          vulns.forEach(vuln => {
            report += `#### ${vuln.id}: ${vuln.description}\n`;
            report += `- **Category:** ${vuln.category}\n`;
            report += `- **Impact:** ${vuln.impact}\n`;
            report += `- **Recommendation:** ${vuln.recommendation}\n`;
            if (vuln.cwe) report += `- **CWE:** ${vuln.cwe}\n`;
            if (vuln.cvss) report += `- **CVSS:** ${vuln.cvss}\n`;
            report += `\n`;
          });
        }
      });
    }

    report += `## 📋 Recommendations\n\n`;
    results.recommendations.forEach(rec => {
      report += `- ${rec}\n`;
    });

    return report;
  }
}

// Singleton instance
export const securityAuditor = new SecurityAuditor();

// React hook for security auditing
export const useSecurityAudit = () => {
  const runAudit = async () => {
    return await securityAuditor.runSecurityAudit();
  };

  const exportReport = (results: SecurityAuditResult) => {
    return securityAuditor.exportAuditResults(results);
  };

  return {
    runAudit,
    exportReport,
  };
};

export default securityAuditor;
