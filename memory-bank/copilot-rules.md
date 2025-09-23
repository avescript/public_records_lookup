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

## 📝 Code Quality Standards

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
