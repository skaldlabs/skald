# Engineering Practices

## Development Philosophy

At Odin, we build reliable, scalable, and maintainable systems that delight our users and empower our content creators. Our engineering practices balance innovation with stability.

## Core Principles

### 1. User-Centric Development

- Every feature should serve a clear user need
- Performance matters: target <2s page loads
- Accessibility is non-negotiable (WCAG 2.1 AA minimum)
- Mobile-first design approach

### 2. Code Quality

- Code should be readable and self-documenting
- Prefer simple solutions over clever ones
- Write tests for critical paths
- Review your own PRs before requesting reviews from others

### 3. Iterative Improvement

- Ship small, ship often
- Gather feedback early
- Iterate based on data and user feedback
- Embrace continuous improvement

### 4. Knowledge Sharing

- Document architectural decisions
- Share learnings in team demos
- Mentor junior developers
- Contribute to internal tech blog

## Tech Stack

### Frontend

- **Framework**: React 18+ with TypeScript
- **State Management**: Zustand, React Query
- **Styling**: Tailwind CSS with custom design system
- **Build Tools**: Vite
- **Testing**: Vitest, React Testing Library, Playwright

### Backend

- **Primary Language**: Python 3.11+
- **Framework**: FastAPI
- **Database**: PostgreSQL 15+, Redis for caching
- **ORM**: SQLAlchemy
- **API**: REST and GraphQL (Apollo Server)
- **Testing**: pytest, faker

### Infrastructure

- **Cloud Provider**: AWS
- **Containerization**: Docker
- **Orchestration**: Kubernetes (EKS)
- **CI/CD**: GitHub Actions
- **Monitoring**: Datadog, Sentry
- **CDN**: CloudFront

### Data & ML

- **Data Warehouse**: Snowflake
- **ML Platforms**: AWS SageMaker
- **ML Framework**: PyTorch
- **Feature Store**: Feast
- **Orchestration**: Airflow

## Development Workflow

### 1. Planning

- Break down features into small, reviewable chunks
- Write technical specs for complex features
- Get early feedback from design and product
- Consider edge cases and error handling

### 2. Branching Strategy

```
main                    # Production-ready code
  └── develop           # Integration branch
       └── feature/*    # Feature branches
       └── bugfix/*     # Bug fix branches
       └── hotfix/*     # Production hotfixes
```

### 3. Commit Messages

Follow conventional commits:

```
feat: add Norse mythology quiz feature
fix: resolve authentication token expiration issue
docs: update API documentation for search endpoint
refactor: simplify user profile data fetching
test: add integration tests for payment flow
chore: upgrade dependencies
```

### 4. Pull Requests

**Before Creating PR:**

- [ ] Code is self-reviewed
- [ ] Tests added/updated and passing
- [ ] Documentation updated
- [ ] No console.logs or debugging code
- [ ] Branch is up-to-date with base branch

**PR Description Template:**

```markdown
## What

Brief description of changes

## Why

Context and motivation

## How

Technical approach and key decisions

## Testing

How this was tested

## Screenshots/Videos

If UI changes

## Checklist

- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] Breaking changes documented
- [ ] Database migrations included (if needed)
```

**Review Process:**

- Minimum 1 approval required (2 for major changes)
- Address all comments or mark as resolved
- Keep PRs under 400 lines when possible
- Reviewers should respond within 24 hours
- Author should respond to feedback within 24 hours

### 5. Code Review Guidelines

**As an Author:**

- Provide context in PR description
- Highlight areas needing extra attention
- Respond to feedback gracefully
- Ask questions if feedback is unclear
- Thank reviewers for their time

**As a Reviewer:**

- Be kind and constructive
- Explain the "why" behind suggestions
- Distinguish between "must fix" and "nice to have"
- Approve with minor comments if appropriate
- Use GitHub suggestions for small changes
- Focus on logic, readability, and maintainability

**Review Focus Areas:**

- Correctness: Does it solve the problem?
- Design: Is the approach sound?
- Tests: Adequate coverage and quality?
- Readability: Can others understand it?
- Security: Any vulnerabilities?
- Performance: Any concerns?
- Documentation: Is it clear?

## Testing Standards

### Test Pyramid

- **70% Unit Tests**: Fast, isolated, test single functions/classes
- **20% Integration Tests**: Test component interactions
- **10% E2E Tests**: Critical user journeys

### Coverage Requirements

- Minimum 80% code coverage for new code
- 100% coverage for critical paths (auth, payments, data integrity)
- Test edge cases and error conditions
- Don't write tests just for coverage metrics

### Testing Best Practices

- Write tests before fixing bugs
- Use meaningful test names: `test_user_cannot_access_other_users_data`
- Keep tests independent and isolated
- Mock external dependencies
- Test behavior, not implementation details
- Use factories and fixtures for test data

### Types of Tests

**Unit Tests:**

```python
def test_calculate_lesson_progress():
    """Test lesson progress calculation with various completion states"""
    completed_lessons = [1, 2, 3]
    total_lessons = 10

    progress = calculate_progress(completed_lessons, total_lessons)

    assert progress == 30.0
```

**Integration Tests:**

```python
async def test_user_enrollment_flow():
    """Test complete user enrollment in a course"""
    user = await create_user()
    course = await create_course()

    enrollment = await enroll_user(user.id, course.id)

    assert enrollment.user_id == user.id
    assert enrollment.status == "active"
    assert enrollment.progress == 0
```

**E2E Tests:**

```typescript
test('user can complete a mythology quiz', async ({ page }) => {
    await page.goto('/courses/norse-mythology')
    await page.click('text=Start Quiz')

    // Answer questions
    await page.click('[data-testid="answer-1"]')
    await page.click('text=Next')

    // Verify results
    await expect(page.locator('.quiz-score')).toContainText('100%')
})
```

## Code Style

### Python

- Follow PEP 8
- Use Black for formatting
- Use mypy for type checking
- Maximum line length: 100 characters
- Use type hints for function signatures

```python
from typing import Optional, List

def get_user_courses(
    user_id: int,
    status: Optional[str] = None,
    limit: int = 10
) -> List[Course]:
    """
    Retrieve courses for a user with optional filtering.

    Args:
        user_id: The ID of the user
        status: Optional course status filter (e.g., 'active', 'completed')
        limit: Maximum number of courses to return

    Returns:
        List of Course objects

    Raises:
        UserNotFoundError: If user_id doesn't exist
    """
    # Implementation
    pass
```

### TypeScript/JavaScript

- Follow Airbnb style guide
- Use ESLint and Prettier
- Prefer functional components and hooks
- Use TypeScript for type safety

```typescript
interface UserCourse {
    id: string
    userId: string
    courseId: string
    progress: number
    status: 'active' | 'completed' | 'paused'
}

interface GetUserCoursesParams {
    userId: string
    status?: 'active' | 'completed' | 'paused'
    limit?: number
}

async function getUserCourses({ userId, status, limit = 10 }: GetUserCoursesParams): Promise<UserCourse[]> {
    // Implementation
}
```

### General Guidelines

- Use descriptive variable names
- Keep functions small and focused (max 50 lines)
- Avoid deep nesting (max 3 levels)
- Comment "why" not "what"
- Delete commented-out code (that's what git is for)

## Performance

### Frontend Performance

- Lazy load routes and components
- Optimize images (WebP format, responsive sizes)
- Minimize bundle size (<300KB initial load)
- Use React.memo and useMemo strategically
- Implement virtual scrolling for long lists
- Prefetch critical resources

### Backend Performance

- Use database indexes appropriately
- Implement caching (Redis) for frequently accessed data
- Paginate large result sets
- Use database connection pooling
- Optimize N+1 queries
- Monitor and optimize slow queries (>100ms)

### Performance Budgets

- First Contentful Paint: <1.8s
- Time to Interactive: <3.8s
- Lighthouse Score: >90
- API Response Time (p95): <200ms
- API Response Time (p99): <500ms

## Security

### Authentication & Authorization

- Use OAuth 2.0 / OpenID Connect
- Implement MFA for admin accounts
- Use JWT with short expiration times
- Validate all user input
- Follow principle of least privilege

### Data Protection

- Encrypt sensitive data at rest
- Use HTTPS everywhere
- Sanitize user input to prevent XSS
- Use parameterized queries to prevent SQL injection
- Implement rate limiting
- Log security events

### Dependencies

- Keep dependencies up-to-date
- Run security audits weekly (`npm audit`, `pip-audit`)
- Review dependency licenses
- Minimize dependency count

### Security Checklist

- [ ] Input validation on all user data
- [ ] Output encoding to prevent XSS
- [ ] CSRF tokens for state-changing operations
- [ ] Secure password storage (bcrypt, argon2)
- [ ] SQL injection prevention
- [ ] Access control checks
- [ ] Sensitive data not logged
- [ ] API rate limiting

## Database

### Schema Design

- Use migrations for all schema changes
- Include rollback migrations
- Add indexes for foreign keys and commonly queried fields
- Use appropriate data types
- Normalize when appropriate, denormalize for performance if needed

### Migration Process

1. Create migration locally
2. Test migration and rollback
3. Review migration in PR
4. Run on staging
5. Run on production during maintenance window
6. Monitor for issues

### Query Optimization

- Use EXPLAIN ANALYZE for complex queries
- Create indexes for WHERE, JOIN, and ORDER BY columns
- Avoid SELECT \*
- Use appropriate JOIN types
- Batch operations when possible

## Monitoring & Observability

### Logging

- Use structured logging (JSON format)
- Include correlation IDs for request tracing
- Log levels: DEBUG, INFO, WARNING, ERROR, CRITICAL
- Never log sensitive data (passwords, tokens, PII)

### Metrics

- Response time (p50, p95, p99)
- Error rates
- Database query performance
- Cache hit rates
- Background job queue depth

### Alerts

- Page for critical issues (payment failures, auth down)
- Slack for warnings (increased error rate, slow queries)
- Weekly reports for trends
- On-call rotation for after-hours

### Incident Response

1. Acknowledge alert
2. Assess impact and severity
3. Mitigate (rollback, scale, hotfix)
4. Communicate to stakeholders
5. Post-mortem within 48 hours
6. Implement preventive measures

## Documentation

### Required Documentation

- **README**: Setup instructions, architecture overview
- **API Docs**: OpenAPI/Swagger specs
- **Architecture Decision Records (ADRs)**: Major technical decisions
- **Runbooks**: Common operational tasks
- **Onboarding Guide**: Getting started for new engineers

### Code Documentation

- Public APIs and functions
- Complex algorithms or business logic
- Non-obvious code decisions
- Known limitations or edge cases

## Deployment

### Environments

- **Local**: Developer machines
- **Development**: Continuous deployment from `develop` branch
- **Staging**: Production-like environment for testing
- **Production**: Customer-facing environment

### Deployment Process

1. Merge to develop → Auto-deploy to development
2. Create release branch → Deploy to staging
3. QA approval → Deploy to production
4. Monitor for issues
5. Merge release to main

### Deployment Checklist

- [ ] All tests passing in CI
- [ ] Database migrations tested
- [ ] Feature flags configured
- [ ] Monitoring and alerts configured
- [ ] Rollback plan prepared
- [ ] Stakeholders notified
- [ ] Off-hours deployment for high-risk changes

### Feature Flags

- Use LaunchDarkly for feature flags
- Enable progressive rollouts
- Test in production safely
- Quick rollback capability

## On-Call

### On-Call Rotation

- 1-week shifts
- Primary and secondary on-call
- Handoff meeting at rotation change
- Compensated with time off

### Expectations

- Respond to pages within 15 minutes
- Access to laptop and stable internet
- Follow runbooks and escalation procedures
- Document incidents and resolutions

## Learning & Growth

### Continuous Learning

- 20% time for learning and experimentation
- Internal tech talks (bi-weekly)
- Conference attendance (1-2/year)
- Book club and study groups
- Pair programming encouraged

### Career Development

- Individual development plans
- Clear career ladders
- Mentorship program
- Internal mobility opportunities

## Tools & Access

### Required Tools

- GitHub (code repository)
- Slack (communication)
- Notion (documentation)
- Datadog (monitoring)
- AWS Console (infrastructure)
- Asana (project management)

### Getting Access

- Manager requests access via IT ticket
- Most access provisioned within 24 hours
- Follow least privilege principle
- Review access quarterly

## Questions?

- **General practices**: #engineering on Slack
- **Specific technical questions**: #help-engineering
- **Tool access**: IT support ticket
- **Process improvements**: engineering@odinlearn.com

---

_Last updated: January 2025_
