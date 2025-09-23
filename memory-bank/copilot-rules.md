# Copilot Development Rules & Collaboration Guidelines

## 🚨 Security & Secrets Management

- **Never Upload Secrets**: Do not store API keys or `.env` in repo.
- **Use `.env.example`**: With placeholders for required environment variables.
- **If a secret is leaked**: Rotate credentials, purge history, notify team immediately.

## 🔀 Git Workflow & Collaboration

### Feature Branch Strategy
- **Always use feature branches** for user stories: `feature/US-XXX-description`
- **Main branch protection**: Keep main stable and production-ready
- **Regular integration**: Merge features frequently to avoid conflicts

### Code Review Process
- **Chat Reviews (Default)**: Conduct reviews in GitHub Copilot chat for speed and collaboration
- **Milestone PRs**: Copilot will prompt for formal GitHub PRs at critical junctures:
  - Epic completions
  - Architecture changes  
  - Release candidates
  - Security/performance milestones
  - Major integration points

### Testing Requirements
- **Unit tests required** for all new features (Demonstrated with US-031: 43 comprehensive tests)
- **Test-driven development**: Write tests during feature development, not after
- **Service layer testing**: Comprehensive CRUD operation coverage with edge cases
- **Component layer testing**: Full user interaction and state management coverage
- **Error scenario testing**: Robust error handling and recovery validation
- **100% test coverage goal**: Aim for complete coverage of critical functionality
- **React Testing Library standards**: Use best practices for component testing
- **Jest configuration**: Maintain consistent test environment and mocking patterns
=======


#### Core Testing Principles
- **Unit tests required** for all new features - no exceptions
- **Tests merge with code**: All tests must be included in feature branch and merge to main
- **Test-driven development**: Write tests during feature development, not after
- **Test coverage standards**: Maintain comprehensive coverage for critical user paths

#### Testing Workflow Integration
1. **During Feature Development**:
   - Write unit tests alongside implementation
   - Test files follow naming convention: `ComponentName.test.tsx` or `serviceName.test.ts`
   - Include tests in feature branch commits
   - Run tests locally before requesting review

2. **Before Feature Completion**:
   - All new tests must pass
   - Existing tests must continue to pass (no regressions)
   - Test coverage for new functionality verified
   - Edge cases and error scenarios covered

3. **At Merge Time**:
   - Tests become permanent part of main branch
   - Contribute to overall project test suite
   - Enable future regression testing
   - Support continuous integration pipelines

#### Testing Types & Standards
- **Unit Tests**: Individual component/function testing
- **Integration Tests**: Component interaction testing  
- **User Journey Tests**: End-to-end workflow validation
- **Error Handling Tests**: Failure scenario coverage
- **Edge Case Tests**: Boundary condition validation

#### Quality Gates
- **Chat Review**: Tests reviewed during feature development discussions
- **Milestone PR**: Full regression testing before major merges
- **Pre-deployment**: Complete test suite execution
- **Post-deployment**: Smoke tests for critical functionality

#### Test Organization
```
__tests__/
├── components/
│   ├── shared/
│   ├── staff/
│   └── public/
├── services/
├── utils/
└── integration/
```

#### Benefits of This Approach
- ✅ **Quality Assurance**: Continuous validation of functionality
- ✅ **Regression Prevention**: Early detection of breaking changes
- ✅ **Documentation**: Tests serve as usage examples
- ✅ **Confidence**: Safe refactoring and feature additions
- ✅ **Team Collaboration**: Clear expectations for code quality
- ✅ **CI/CD Ready**: Foundation for automated testing pipelines

## � Memory Bank Management Strategy

### Core Principle: Memory Bank Lives on Main
- **Single source of truth**: Memory bank files remain on main branch as authoritative project context
- **Clean separation**: Feature branches don't update memory bank during development
- **Completion updates**: Memory bank updated only when features are complete and ready to merge

### Feature Development Process
1. **Start feature branch**: Read memory bank from main for current context
2. **Track progress locally**: Use `FEATURE_PROGRESS.md` on feature branch for temporary tracking
3. **Maintain focus**: Don't update memory bank files during feature development
4. **Complete and merge**: Update memory bank on main, then merge feature branch

### FEATURE_PROGRESS.md Template
Create this file on each feature branch to track progress:
```markdown
# Feature Progress Tracker
## US-XXX: [User Story Title]

**Branch:** `feature/US-XXX-description`
**Started:** [Date]
**Status:** In Progress

### Implementation Tasks
- [ ] Core functionality implementation
- [ ] Component development
- [ ] Service layer integration
- [ ] Error handling and edge cases

### Testing Requirements (CRITICAL)
- [ ] Unit tests for new components
- [ ] Unit tests for new services/utilities  
- [ ] Integration tests for user workflows
- [ ] Error scenario testing
- [ ] Edge case coverage
- [ ] All tests passing locally
- [ ] No regression in existing tests

### Quality Checklist
- [ ] TypeScript compliance (no `any` types)
- [ ] ESLint checks passing
- [ ] Component accessibility (ARIA labels, keyboard nav)
- [ ] Mobile responsiveness verified
- [ ] Error boundaries implemented

### Notes
- Key decisions and blockers
- Dependencies and considerations
- Test coverage observations
- Performance considerations

### Memory Bank Updates Needed
- [ ] Update activeContext.md with completion
- [ ] Update progress.md with epic status  
- [ ] Document new patterns in systemPatterns.md (if applicable)
- [ ] Update test coverage metrics
```

### Context Commands for Feature Branches
```bash
# Read memory bank from main while on feature branch
git show main:memory-bank/activeContext.md
git show main:memory-bank/progress.md

# Update memory bank at completion (on main branch)
git checkout main
git pull origin main
# Update memory bank files
git add memory-bank/
git commit -m "docs: update memory bank for US-XXX completion"
git merge feature/US-XXX-description
```

### Benefits of This Strategy
- ✅ **Prevents context pollution**: Main branch memory bank stays clean and accurate
- ✅ **Enables parallel development**: Multiple features can work simultaneously
- ✅ **Maintains continuity**: Memory bank always reflects stable, completed state
- ✅ **Supports milestone tracking**: Clear updates at feature completion
- ✅ **Facilitates collaboration**: Consistent process across all feature development

## �📝 Code Quality Standards

### TypeScript & ESLint
- **Strict TypeScript**: Use proper typing, avoid `any` unless absolutely necessary
- **ESLint compliance**: All code must pass ESLint checks before merge
- **Consistent formatting**: Use Prettier for code formatting consistency

### Component Development
- **Material-UI patterns**: Follow established MUI component patterns
- **Responsive design**: Ensure mobile-first responsive implementation
- **Accessibility**: Implement proper ARIA labels and keyboard navigation
- **Error handling**: Implement comprehensive error boundaries and user feedback

### Documentation
- **Clear commit messages**: Use conventional commit format (`feat:`, `fix:`, `docs:`, etc.)
- **Code comments**: Document complex business logic and API integrations
- **Memory bank updates**: Update relevant memory bank files for significant changes

## 🚀 Development Practices

### Session Management
- **Read memory bank first**: Always read all memory bank files before starting work
- **Update active context**: Keep `activeContext.md` current with progress
- **Track dependencies**: Document new packages and version requirements
- **Feature completion**: Update memory bank immediately upon user story completion

### Quality Assurance
- **Local testing**: Run comprehensive test suites before marking features complete
- **Browser testing**: Verify functionality across different browser environments
- **Performance awareness**: Monitor bundle size and runtime performance
- **Mobile testing**: Ensure proper mobile responsiveness
- **Test automation**: Maintain and enhance automated test coverage

### Established Patterns (From US-031 Implementation)
- **Service-Component Architecture**: Separate business logic (services) from UI (components)
- **CRUD Service Pattern**: Complete Create, Read, Update, Delete operations with error handling
- **Material-UI Integration**: Consistent use of MUI components, themes, and styling patterns
- **State Management**: React hooks for local state, context for shared state
- **Error Handling**: Comprehensive error boundaries, user feedback, and recovery workflows
- **TypeScript Best Practices**: Strong typing, interface definitions, and type safety

## 🤝 Collaboration Guidelines

### Communication
- **Clear objectives**: State user story goals and acceptance criteria upfront
- **Progress updates**: Communicate blockers and progress regularly
- **Knowledge sharing**: Explain implementation decisions and technical choices
- **Review feedback**: Provide constructive, specific feedback during reviews

### Problem Resolution
- **Debug systematically**: Use browser dev tools and error logs effectively
- **Research solutions**: Check documentation and community resources first
- **Ask for help**: Communicate when stuck rather than struggling silently
- **Document solutions**: Record resolutions for future reference

## 📊 Project Management

### Epic & User Story Tracking
- **Follow Kiro-Lite workflow**: PRD → Design → Tasks → Code
- **Update progress.md**: Maintain accurate epic and user story completion status
- **Acceptance criteria**: Verify all criteria met before marking complete
- **Dependencies**: Track and communicate feature dependencies clearly

### Milestone Management
- **Epic completion**: Comprehensive testing and documentation review
- **Release readiness**: Performance, security, and functionality validation
- **Deployment preparation**: Environment configuration and deployment planning
