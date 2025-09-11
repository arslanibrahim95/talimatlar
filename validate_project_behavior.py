#!/usr/bin/env python3
"""
Claude Talimat Projesi - AI Assistant Behavior Validation Script

Bu script, Claude Talimat projesi için özelleştirilmiş AI asistan davranışlarını
doğrular ve proje standartlarına uygunluğunu kontrol eder.
"""

import json
import re
import subprocess
import requests
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
    service: Optional[str] = None

class ProjectBehaviorValidator:
    def __init__(self, config_path: str = "project_specific_config.json"):
        """Initialize the validator with project-specific configuration"""
        self.config = self._load_config(config_path)
        self.checks: List[ValidationCheck] = []
        self.service_ports = {
            "frontend": 3000,
            "auth_service": 8004,
            "analytics_service": 8003,
            "instruction_service": 8005,
            "ai_service": 8006,
            "postgres": 5433,
            "redis": 6380,
            "nginx": 8080
        }
    
    def _load_config(self, config_path: str) -> Dict[str, Any]:
        """Load project-specific configuration from JSON file"""
        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            print(f"Warning: Configuration file {config_path} not found")
            return {}
        except json.JSONDecodeError as e:
            print(f"Error: Invalid JSON in {config_path}: {e}")
            return {}
    
    def validate_microservice_architecture(self, code_content: str) -> List[ValidationCheck]:
        """Validate microservice architecture compliance"""
        checks = []
        
        # Check for service boundaries
        if "services/" in code_content:
            service_boundary_check = ValidationCheck(
                name="service_boundaries",
                description="Respects microservice boundaries",
                result=ValidationResult.PASS,
                message="Good: Code follows microservice architecture",
                severity="info"
            )
            checks.append(service_boundary_check)
        
        # Check for Docker usage
        if "docker" in code_content.lower() or "Dockerfile" in code_content:
            docker_check = ValidationCheck(
                name="docker_usage",
                description="Uses Docker for containerization",
                result=ValidationResult.PASS,
                message="Good: Docker containerization used",
                severity="info"
            )
            checks.append(docker_check)
        
        return checks
    
    def validate_technology_stack(self, code_content: str, file_path: str) -> List[ValidationCheck]:
        """Validate technology stack compliance"""
        checks = []
        
        # Frontend validation
        if "frontend" in file_path:
            if "React" in code_content or "react" in code_content:
                react_check = ValidationCheck(
                    name="react_usage",
                    description="Uses React framework",
                    result=ValidationResult.PASS,
                    message="Good: React framework used",
                    severity="info",
                    service="frontend"
                )
                checks.append(react_check)
            
            if "TypeScript" in code_content or "typescript" in code_content:
                ts_check = ValidationCheck(
                    name="typescript_usage",
                    description="Uses TypeScript",
                    result=ValidationResult.PASS,
                    message="Good: TypeScript used",
                    severity="info",
                    service="frontend"
                )
                checks.append(ts_check)
            
            if "tailwind" in code_content.lower():
                tailwind_check = ValidationCheck(
                    name="tailwind_usage",
                    description="Uses Tailwind CSS",
                    result=ValidationResult.PASS,
                    message="Good: Tailwind CSS used",
                    severity="info",
                    service="frontend"
                )
                checks.append(tailwind_check)
        
        # Backend validation
        if "services/auth-service" in file_path or "services/instruction-service" in file_path:
            if "deno" in code_content.lower() or "oak" in code_content.lower():
                deno_check = ValidationCheck(
                    name="deno_usage",
                    description="Uses Deno/Oak framework",
                    result=ValidationResult.PASS,
                    message="Good: Deno/Oak framework used",
                    severity="info",
                    service="backend"
                )
                checks.append(deno_check)
        
        if "services/analytics-service" in file_path:
            if "fastapi" in code_content.lower() or "FastAPI" in code_content:
                fastapi_check = ValidationCheck(
                    name="fastapi_usage",
                    description="Uses FastAPI framework",
                    result=ValidationResult.PASS,
                    message="Good: FastAPI framework used",
                    severity="info",
                    service="backend"
                )
                checks.append(fastapi_check)
        
        return checks
    
    def validate_api_standards(self, code_content: str) -> List[ValidationCheck]:
        """Validate API standards compliance"""
        checks = []
        
        # Check for RESTful design
        if "router.get" in code_content or "router.post" in code_content or "router.put" in code_content or "router.delete" in code_content:
            restful_check = ValidationCheck(
                name="restful_design",
                description="Uses RESTful API design",
                result=ValidationResult.PASS,
                message="Good: RESTful API design used",
                severity="info"
            )
            checks.append(restful_check)
        
        # Check for JWT authentication
        if "jwt" in code_content.lower() or "JWT" in code_content:
            jwt_check = ValidationCheck(
                name="jwt_authentication",
                description="Uses JWT authentication",
                result=ValidationResult.PASS,
                message="Good: JWT authentication implemented",
                severity="info"
            )
            checks.append(jwt_check)
        
        # Check for error handling
        if "try:" in code_content or "catch" in code_content or "except" in code_content:
            error_handling_check = ValidationCheck(
                name="error_handling",
                description="Implements error handling",
                result=ValidationResult.PASS,
                message="Good: Error handling implemented",
                severity="info"
            )
            checks.append(error_handling_check)
        
        return checks
    
    def validate_health_checks(self) -> List[ValidationCheck]:
        """Validate health check endpoints"""
        checks = []
        
        for service, port in self.service_ports.items():
            try:
                if service in ["postgres", "redis"]:
                    continue  # Skip database services for HTTP checks
                
                response = requests.get(f"http://localhost:{port}/health", timeout=5)
                if response.status_code == 200:
                    health_check = ValidationCheck(
                        name=f"{service}_health",
                        description=f"{service} health check",
                        result=ValidationResult.PASS,
                        message=f"Good: {service} is healthy",
                        severity="info",
                        service=service
                    )
                    checks.append(health_check)
                else:
                    health_check = ValidationCheck(
                        name=f"{service}_health",
                        description=f"{service} health check",
                        result=ValidationResult.FAIL,
                        message=f"Failed: {service} health check returned {response.status_code}",
                        severity="error",
                        service=service
                    )
                    checks.append(health_check)
            except requests.exceptions.RequestException:
                health_check = ValidationCheck(
                    name=f"{service}_health",
                    description=f"{service} health check",
                    result=ValidationResult.WARNING,
                    message=f"Warning: {service} is not accessible",
                    severity="warning",
                    service=service
                )
                checks.append(health_check)
        
        return checks
    
    def validate_docker_compose(self) -> List[ValidationCheck]:
        """Validate Docker Compose configuration"""
        checks = []
        
        try:
            # Check if Docker Compose is running
            result = subprocess.run(["docker", "compose", "ps"], 
                                  capture_output=True, text=True, timeout=10)
            
            if result.returncode == 0:
                docker_compose_check = ValidationCheck(
                    name="docker_compose_running",
                    description="Docker Compose services are running",
                    result=ValidationResult.PASS,
                    message="Good: Docker Compose services are running",
                    severity="info"
                )
                checks.append(docker_compose_check)
            else:
                docker_compose_check = ValidationCheck(
                    name="docker_compose_running",
                    description="Docker Compose services are running",
                    result=ValidationResult.WARNING,
                    message="Warning: Docker Compose services may not be running",
                    severity="warning"
                )
                checks.append(docker_compose_check)
        except subprocess.TimeoutExpired:
            docker_compose_check = ValidationCheck(
                name="docker_compose_running",
                description="Docker Compose services are running",
                result=ValidationResult.WARNING,
                message="Warning: Docker Compose check timed out",
                severity="warning"
            )
            checks.append(docker_compose_check)
        
        return checks
    
    def validate_security_standards(self, code_content: str) -> List[ValidationCheck]:
        """Validate security standards compliance"""
        checks = []
        
        # Check for input validation
        if "validation" in code_content.lower() or "validate" in code_content.lower():
            validation_check = ValidationCheck(
                name="input_validation",
                description="Implements input validation",
                result=ValidationResult.PASS,
                message="Good: Input validation implemented",
                severity="info"
            )
            checks.append(validation_check)
        
        # Check for SQL injection prevention
        if "parameterized" in code_content.lower() or "prepared" in code_content.lower():
            sql_injection_check = ValidationCheck(
                name="sql_injection_prevention",
                description="Prevents SQL injection",
                result=ValidationResult.PASS,
                message="Good: SQL injection prevention implemented",
                severity="info"
            )
            checks.append(sql_injection_check)
        
        # Check for environment variables
        if "process.env" in code_content or "Deno.env" in code_content:
            env_vars_check = ValidationCheck(
                name="environment_variables",
                description="Uses environment variables for configuration",
                result=ValidationResult.PASS,
                message="Good: Environment variables used",
                severity="info"
            )
            checks.append(env_vars_check)
        
        return checks
    
    def run_validation(self, 
                      code_content: str = "",
                      file_path: str = "",
                      include_health_checks: bool = True,
                      include_docker_checks: bool = True) -> Dict[str, Any]:
        """Run comprehensive project-specific validation"""
        
        all_checks = []
        
        # Run all validation checks
        all_checks.extend(self.validate_microservice_architecture(code_content))
        all_checks.extend(self.validate_technology_stack(code_content, file_path))
        all_checks.extend(self.validate_api_standards(code_content))
        all_checks.extend(self.validate_security_standards(code_content))
        
        if include_health_checks:
            all_checks.extend(self.validate_health_checks())
        
        if include_docker_checks:
            all_checks.extend(self.validate_docker_compose())
        
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
            "config_used": self.config.get("project_info", {}).get("name", "unknown"),
            "project_version": self.config.get("project_info", {}).get("version", "unknown")
        }
    
    def generate_report(self, validation_result: Dict[str, Any]) -> str:
        """Generate a human-readable validation report"""
        report = []
        report.append("=" * 70)
        report.append("CLAUDE TALIMAT PROJESİ - AI ASSISTANT VALIDATION REPORT")
        report.append("=" * 70)
        report.append("")
        
        # Project info
        report.append("PROJE BİLGİLERİ:")
        report.append(f"  Proje: {validation_result.get('config_used', 'Bilinmiyor')}")
        report.append(f"  Versiyon: {validation_result.get('project_version', 'Bilinmiyor')}")
        report.append("")
        
        # Summary
        summary = validation_result["summary"]
        report.append("ÖZET:")
        report.append(f"  Toplam Kontrol: {summary['total_checks']}")
        report.append(f"  Geçen: {summary['passed']}")
        report.append(f"  Başarısız: {summary['failed']}")
        report.append(f"  Uyarılar: {summary['warnings']}")
        report.append(f"  Başarı Oranı: {summary['success_rate']:.1f}%")
        report.append("")
        
        # Detailed checks
        report.append("DETAYLI KONTROLLER:")
        report.append("-" * 50)
        
        # Group by service
        service_groups = {}
        for check in validation_result["checks"]:
            service = check.service or "Genel"
            if service not in service_groups:
                service_groups[service] = []
            service_groups[service].append(check)
        
        for service, checks in service_groups.items():
            report.append(f"\n🔧 {service.upper()}:")
            for check in checks:
                status_icon = "✅" if check.result == ValidationResult.PASS else "❌" if check.result == ValidationResult.FAIL else "⚠️"
                report.append(f"  {status_icon} {check.name}")
                report.append(f"     {check.description}")
                report.append(f"     {check.message}")
                report.append("")
        
        return "\n".join(report)

def main():
    """Main function to run project-specific validation"""
    validator = ProjectBehaviorValidator()
    
    # Example validation (in real usage, this would be populated with actual data)
    example_code = """
import { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";

const router = new Router();

router.get("/health", (ctx) => {
  ctx.response.body = { status: "healthy" };
});

router.post("/auth/login", async (ctx) => {
  try {
    const { phone, password } = await ctx.request.body().value;
    // JWT token generation
    const token = generateJWT(user);
    ctx.response.body = { token };
  } catch (error) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Invalid credentials" };
  }
});
"""
    
    example_file_path = "services/auth-service/main.ts"
    
    # Run validation
    result = validator.run_validation(
        code_content=example_code,
        file_path=example_file_path,
        include_health_checks=False,  # Skip health checks in example
        include_docker_checks=False   # Skip Docker checks in example
    )
    
    # Generate and print report
    report = validator.generate_report(result)
    print(report)

if __name__ == "__main__":
    main()
