# Contributing to Claude Talimat

Thank you for your interest in contributing to Claude Talimat! This document provides guidelines and information for contributors.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Process](#development-process)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)
- [Issue Reporting](#issue-reporting)

## 🤝 Code of Conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). By participating, you agree to uphold this code.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- Go 1.21+
- Deno 1.35+
- Docker & Docker Compose
- Git

### Setup Development Environment

1. **Fork the repository**
   ```bash
   # Click the "Fork" button on GitHub
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/talimatlar.git
   cd talimatlar
   ```

3. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/arslanibrahim95/talimatlar.git
   ```

4. **Install dependencies**
   ```bash
   # Frontend
   cd frontend
   npm install
   
   # Backend services
   cd ../services
   pip install -r requirements.txt
   
   # Go services
   go mod download
   ```

5. **Setup environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

6. **Start development servers**
   ```bash
   # Start all services
   docker-compose up -d
   
   # Start frontend in development mode
   cd frontend
   npm run dev
   ```

## 🔄 Development Process

### Branch Naming

Use descriptive branch names:
- `feature/add-user-authentication`
- `bugfix/fix-login-validation`
- `hotfix/security-patch`
- `docs/update-readme`
- `refactor/optimize-database-queries`

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(auth): add OTP verification
fix(api): resolve CORS issue
docs(readme): update installation instructions
```

## 🔀 Pull Request Process

### Before Submitting

1. **Update your fork**
   ```bash
   git fetch upstream
   git checkout main
   git merge upstream/main
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Write clean, readable code
   - Add tests for new functionality
   - Update documentation if needed
   - Follow coding standards

4. **Test your changes**
   ```bash
   # Run all tests
   npm run test:all
   
   # Run specific tests
   npm run test:frontend
   npm run test:backend
   ```

5. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

### Submitting a Pull Request

1. **Create Pull Request**
   - Go to your fork on GitHub
   - Click "New Pull Request"
   - Fill out the PR template

2. **PR Requirements**
   - [ ] Code follows project style guidelines
   - [ ] Self-review completed
   - [ ] Tests added/updated
   - [ ] Documentation updated
   - [ ] No breaking changes (or clearly documented)
   - [ ] CI/CD checks pass

3. **Review Process**
   - Maintainers will review your PR
   - Address any feedback promptly
   - Keep PRs focused and reasonably sized
   - Respond to review comments

## 📝 Coding Standards

### Frontend (TypeScript/React)

```typescript
// Use TypeScript strict mode
// Prefer functional components with hooks
// Use proper prop types and interfaces

interface UserProps {
  id: string;
  name: string;
  email: string;
}

const UserComponent: React.FC<UserProps> = ({ id, name, email }) => {
  return (
    <div className="user-card">
      <h3>{name}</h3>
      <p>{email}</p>
    </div>
  );
};
```

### Backend (Python/FastAPI)

```python
# Use type hints
# Follow PEP 8
# Use async/await for I/O operations

from typing import List, Optional
from pydantic import BaseModel

class UserCreate(BaseModel):
    name: str
    email: str

async def create_user(user_data: UserCreate) -> User:
    # Implementation
    pass
```

### Backend (Go)

```go
// Use proper error handling
// Follow Go naming conventions
// Add godoc comments

// User represents a user in the system
type User struct {
    ID    string `json:"id"`
    Name  string `json:"name"`
    Email string `json:"email"`
}

// CreateUser creates a new user
func CreateUser(userData UserCreate) (*User, error) {
    // Implementation
}
```

## 🧪 Testing

### Frontend Tests

```bash
# Unit tests
npm run test:unit

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

### Backend Tests

```bash
# Python tests
pytest tests/ --cov=src/

# Go tests
go test -v ./...

# Deno tests
deno test --allow-all src/
```

### Test Requirements

- New features must include tests
- Bug fixes must include regression tests
- Aim for >80% code coverage
- Tests should be fast and reliable

## 📚 Documentation

### Code Documentation

- Add docstrings/comments for complex logic
- Update README.md for new features
- Keep API documentation current
- Add inline comments for non-obvious code

### Documentation Types

- **API Documentation**: OpenAPI/Swagger specs
- **User Documentation**: README, Wiki
- **Developer Documentation**: CONTRIBUTING.md, code comments
- **Architecture Documentation**: ADR (Architecture Decision Records)

## 🐛 Issue Reporting

### Before Creating an Issue

1. Search existing issues
2. Check if it's already fixed
3. Verify it's not a duplicate

### Bug Reports

Use the bug report template and include:
- Clear description
- Steps to reproduce
- Expected vs actual behavior
- Environment details
- Screenshots/logs if applicable

### Feature Requests

Use the feature request template and include:
- Clear description
- Use cases
- Proposed solution
- Alternatives considered

## 🏷️ Labels

We use the following labels:

- `bug`: Something isn't working
- `enhancement`: New feature or request
- `documentation`: Improvements to documentation
- `good first issue`: Good for newcomers
- `help wanted`: Extra attention is needed
- `priority: high`: High priority
- `priority: low`: Low priority
- `status: blocked`: Blocked by another issue
- `status: in progress`: Currently being worked on

## 🎯 Good First Issues

Look for issues labeled `good first issue` if you're new to the project.

## 📞 Getting Help

- **GitHub Discussions**: For questions and general discussion
- **GitHub Issues**: For bug reports and feature requests
- **Email**: ibrahim1995412@gmail.com

## 🙏 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Project documentation

Thank you for contributing to Claude Talimat! 🎉
