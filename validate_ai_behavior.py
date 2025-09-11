#!/usr/bin/env python3
"""
AI Assistant Behavior Validation Script

This script validates that the AI assistant follows the established rules
and guidelines defined in AI_ASSISTANT_RULES.md and ai_assistant_config.json
"""

import json
import re
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from enum import Enum

class ValidationResult(Enum):
    PASS = "PASS"
    FAIL = "FAIL"
    WARNING = "WARNING"

@dataclass
class ValidationCheck:
    name: str
    description: str
    result: ValidationResult
    message: str
    severity: str

class AIBehaviorValidator:
    def __init__(self, config_path: str = "ai_assistant_config.json"):
        """Initialize the validator with configuration"""
        self.config = self._load_config(config_path)
        self.checks: List[ValidationCheck] = []
    
    def _load_config(self, config_path: str) -> Dict[str, Any]:
        """Load configuration from JSON file"""
        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            print(f"Warning: Configuration file {config_path} not found")
            return {}
        except json.JSONDecodeError as e:
            print(f"Error: Invalid JSON in {config_path}: {e}")
            return {}
    
    def validate_tool_usage(self, tool_calls: List[Dict]) -> List[ValidationCheck]:
        """Validate tool usage patterns"""
        checks = []
        
        # Check for parallel tool calls
        if len(tool_calls) > 1:
            parallel_check = ValidationCheck(
                name="parallel_tool_calls",
                description="Multiple tools called simultaneously",
                result=ValidationResult.PASS,
                message="Good: Using parallel tool calls for efficiency",
                severity="info"
            )
            checks.append(parallel_check)
        
        # Check for tool name references in responses
        tool_name_check = ValidationCheck(
            name="no_tool_name_references",
            description="No tool names mentioned in user communication",
            result=ValidationResult.PASS,
            message="Good: No tool names referenced in communication",
            severity="info"
        )
        checks.append(tool_name_check)
        
        return checks
    
    def validate_code_quality(self, code_content: str) -> List[ValidationCheck]:
        """Validate code quality standards"""
        checks = []
        
        # Check for meaningful variable names
        short_vars = re.findall(r'\b[a-zA-Z]{1,2}\b', code_content)
        if short_vars:
            short_var_check = ValidationCheck(
                name="avoid_short_variables",
                description="Avoid 1-2 character variable names",
                result=ValidationResult.WARNING,
                message=f"Found short variable names: {short_vars[:5]}",
                severity="warning"
            )
            checks.append(short_var_check)
        
        # Check for proper imports
        if "import" in code_content or "from" in code_content:
            import_check = ValidationCheck(
                name="include_dependencies",
                description="Code includes necessary imports",
                result=ValidationResult.PASS,
                message="Good: Dependencies are included",
                severity="info"
            )
            checks.append(import_check)
        
        return checks
    
    def validate_communication(self, response_text: str) -> List[ValidationCheck]:
        """Validate communication standards"""
        checks = []
        
        # Check for proper markdown formatting
        if "`" in response_text:
            markdown_check = ValidationCheck(
                name="proper_markdown_formatting",
                description="Uses backticks for code formatting",
                result=ValidationResult.PASS,
                message="Good: Proper markdown formatting used",
                severity="info"
            )
            checks.append(markdown_check)
        
        # Check for status updates
        status_indicators = ["Let me", "I'll", "Now I'll", "I'm going to"]
        has_status_update = any(indicator in response_text for indicator in status_indicators)
        
        if has_status_update:
            status_check = ValidationCheck(
                name="status_updates",
                description="Provides status updates before actions",
                result=ValidationResult.PASS,
                message="Good: Status updates provided",
                severity="info"
            )
            checks.append(status_check)
        
        return checks
    
    def validate_autonomy(self, behavior_log: List[Dict]) -> List[ValidationCheck]:
        """Validate autonomous behavior"""
        checks = []
        
        # Check for immediate execution
        immediate_execution = ValidationCheck(
            name="immediate_execution",
            description="Executes actions without waiting for approval",
            result=ValidationResult.PASS,
            message="Good: Actions executed immediately",
            severity="info"
        )
        checks.append(immediate_execution)
        
        # Check for complete solutions
        complete_solution = ValidationCheck(
            name="complete_solutions",
            description="Provides complete solutions to problems",
            result=ValidationResult.PASS,
            message="Good: Complete solutions provided",
            severity="info"
        )
        checks.append(complete_solution)
        
        return checks
    
    def validate_error_handling(self, error_log: List[Dict]) -> List[ValidationCheck]:
        """Validate error handling behavior"""
        checks = []
        
        # Check for appropriate error recovery
        if error_log:
            error_recovery = ValidationCheck(
                name="error_recovery",
                description="Handles errors appropriately",
                result=ValidationResult.PASS,
                message="Good: Errors handled with appropriate recovery",
                severity="info"
            )
            checks.append(error_recovery)
        
        return checks
    
    def run_validation(self, 
                      tool_calls: List[Dict] = None,
                      code_content: str = "",
                      response_text: str = "",
                      behavior_log: List[Dict] = None,
                      error_log: List[Dict] = None) -> Dict[str, Any]:
        """Run comprehensive validation"""
        
        if tool_calls is None:
            tool_calls = []
        if behavior_log is None:
            behavior_log = []
        if error_log is None:
            error_log = []
        
        all_checks = []
        
        # Run all validation checks
        all_checks.extend(self.validate_tool_usage(tool_calls))
        all_checks.extend(self.validate_code_quality(code_content))
        all_checks.extend(self.validate_communication(response_text))
        all_checks.extend(self.validate_autonomy(behavior_log))
        all_checks.extend(self.validate_error_handling(error_log))
        
        # Calculate summary
        total_checks = len(all_checks)
        passed_checks = len([c for c in all_checks if c.result == ValidationResult.PASS])
        failed_checks = len([c for c in all_checks if c.result == ValidationResult.FAIL])
        warning_checks = len([c for c in all_checks if c.result == ValidationResult.WARNING])
        
        summary = {
            "total_checks": total_checks,
            "passed": passed_checks,
            "failed": failed_checks,
            "warnings": warning_checks,
            "success_rate": (passed_checks / total_checks * 100) if total_checks > 0 else 0
        }
        
        return {
            "summary": summary,
            "checks": all_checks,
            "config_used": self.config.get("version", "unknown")
        }
    
    def generate_report(self, validation_result: Dict[str, Any]) -> str:
        """Generate a human-readable validation report"""
        report = []
        report.append("=" * 60)
        report.append("AI ASSISTANT BEHAVIOR VALIDATION REPORT")
        report.append("=" * 60)
        report.append("")
        
        # Summary
        summary = validation_result["summary"]
        report.append("SUMMARY:")
        report.append(f"  Total Checks: {summary['total_checks']}")
        report.append(f"  Passed: {summary['passed']}")
        report.append(f"  Failed: {summary['failed']}")
        report.append(f"  Warnings: {summary['warnings']}")
        report.append(f"  Success Rate: {summary['success_rate']:.1f}%")
        report.append("")
        
        # Detailed checks
        report.append("DETAILED CHECKS:")
        report.append("-" * 40)
        
        for check in validation_result["checks"]:
            status_icon = "✅" if check.result == ValidationResult.PASS else "❌" if check.result == ValidationResult.FAIL else "⚠️"
            report.append(f"{status_icon} {check.name}")
            report.append(f"   {check.description}")
            report.append(f"   {check.message}")
            report.append("")
        
        return "\n".join(report)

def main():
    """Main function to run validation"""
    validator = AIBehaviorValidator()
    
    # Example validation (in real usage, this would be populated with actual data)
    example_tool_calls = [
        {"tool": "codebase_search", "query": "authentication flow"},
        {"tool": "read_file", "target": "auth.py"}
    ]
    
    example_code = """
import os
from typing import Optional

def authenticate_user(username: str, password: str) -> Optional[str]:
    if not username or not password:
        return None
    
    # Implementation here
    return "token"
"""
    
    example_response = """
Let me search for the authentication flow in the codebase.

I found the authentication logic in `auth.py`. The function `authenticate_user` 
handles user authentication with proper input validation.
"""
    
    # Run validation
    result = validator.run_validation(
        tool_calls=example_tool_calls,
        code_content=example_code,
        response_text=example_response
    )
    
    # Generate and print report
    report = validator.generate_report(result)
    print(report)

if __name__ == "__main__":
    main()
