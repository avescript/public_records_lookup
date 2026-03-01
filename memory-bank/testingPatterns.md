# Testing Patterns & Documentation

## Comprehensive Unit Testing for New Features

### Testing Philosophy (Updated March 2026)

All new features are developed with comprehensive unit test coverage to ensure production readiness and prevent regressions. Tests are written alongside implementation, not as an afterthought.

### Testing Standards

#### Service Layer Testing

**Example: Agency Analytics Service (29 tests)**

1. **Functionality Tests**: Verify all public methods work correctly

   ```typescript
   it('should return comprehensive agency metrics', async () => {
     const metrics = await agencyAnalyticsService.getAgencyMetrics(
       agencyId,
       timeRange
     );
     expect(metrics).toBeDefined();
     expect(metrics.requestMetrics).toBeDefined();
     expect(metrics.documentMetrics).toBeDefined();
   });
   ```

2. **Edge Cases**: Test boundary conditions and empty states

   ```typescript
   it('should handle different time ranges', async () => {
     const hourlyRange: TimeRange = { granularity: 'hour', ... };
     const metrics = await agencyAnalyticsService.getAgencyMetrics(agencyId, hourlyRange);
     expect(metrics.timeRange.granularity).toBe('hour');
   });
   ```

3. **Performance**: Validate caching and optimization

   ```typescript
   it('should cache metrics for repeated calls', async () => {
     const metrics1 = await service.getAgencyMetrics(id, range);
     const metrics2 = await service.getAgencyMetrics(id, range);
     expect(metrics1).toBe(metrics2); // Same object reference
   });
   ```

4. **Data Validation**: Ensure returned data meets constraints

   ```typescript
   it('should return valid KPI values within ranges', async () => {
     const kpis = await service.getRealTimeKPIs(agencyId);
     expect(kpis.systemAvailability).toBeGreaterThanOrEqual(0);
     expect(kpis.systemAvailability).toBeLessThanOrEqual(100);
   });
   ```

5. **Integration Points**: Test interaction with other services
   ```typescript
   it('should integrate with alert system', async () => {
     const systemHealth = await service.getSystemHealth(agencyId);
     expect(systemHealth.activeAlerts).toBeInstanceOf(Array);
   });
   ```

#### Component Testing

**Example: Agency Dashboard Component (20 tests)**

1. **Rendering Tests**: Verify UI elements appear correctly

   ```typescript
   it('should render dashboard with agency name', async () => {
     render(<AgencyDashboard agencyId={mockAgencyId} />);
     await waitFor(() => {
       expect(screen.getByText('Test Agency Dashboard')).toBeInTheDocument();
     });
   });
   ```

2. **Loading States**: Test async data fetching

   ```typescript
   it('should show loading state initially', () => {
     render(<AgencyDashboard agencyId={mockAgencyId} />);
     expect(screen.getByText(/loading/i)).toBeInTheDocument();
   });
   ```

3. **Error Handling**: Verify graceful error display

   ```typescript
   it('should show error message on load failure', async () => {
     mockService.getAgencyMetrics.mockRejectedValue(new Error('Failed'));
     render(<AgencyDashboard agencyId={mockAgencyId} />);
     await waitFor(() => {
       expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
     });
   });
   ```

4. **User Interactions**: Test clicks, inputs, and controls

   ```typescript
   it('should reload data when refresh button clicked', async () => {
     render(<AgencyDashboard agencyId={mockAgencyId} />);
     const refreshButton = screen.getByText('Refresh');
     fireEvent.click(refreshButton);
     await waitFor(() => {
       expect(mockService.getAgencyMetrics).toHaveBeenCalledTimes(2);
     });
   });
   ```

5. **Data Display**: Verify correct values are shown
   ```typescript
   it('should display correct KPI values', async () => {
     render(<AgencyDashboard agencyId={mockAgencyId} />);
     await waitFor(() => {
       expect(screen.getByText('99.95%')).toBeInTheDocument();
       expect(screen.getByText('$2.45')).toBeInTheDocument();
     });
   });
   ```

### Test Coverage Requirements

For each new feature:

- ✅ **Service Layer**: 90%+ coverage of public methods
- ✅ **Component Layer**: All user-facing functionality tested
- ✅ **Happy Path**: Normal operation scenarios
- ✅ **Error Cases**: Graceful handling of failures
- ✅ **Edge Cases**: Boundary conditions and empty states
- ✅ **Integration**: Cross-service communication validated

### Testing Best Practices

1. **Descriptive Test Names**: Use clear, behavior-focused names
   - ✅ `should return valid KPI values within ranges`
   - ❌ `test getKPIs`

2. **Arrange-Act-Assert Pattern**: Structure tests clearly

   ```typescript
   it('should filter requests by agency', async () => {
     // Arrange
     const mockRequests = [...];

     // Act
     const filtered = filterByAgency(mockRequests, 'agency-001');

     // Assert
     expect(filtered).toHaveLength(5);
   });
   ```

3. **Mock External Dependencies**: Isolate unit under test

   ```typescript
   jest.mock('../../services/agencyAnalyticsService');
   ```

4. **Test User Behavior, Not Implementation**: Focus on outcomes
   - ✅ Test that clicking refresh reloads data
   - ❌ Test that setState was called with specific arguments

5. **Use waitFor for Async Operations**: Handle timing properly
   ```typescript
   await waitFor(() => {
     expect(screen.getByText('Data loaded')).toBeInTheDocument();
   });
   ```

### Recent Test Additions (March 2026)

**Agency Dashboard & Analytics**: 49 tests, 100% passing

- `__tests__/services/agencyAnalyticsService.test.ts` (29 tests)
- `__tests__/components/admin/AgencyDashboard.test.tsx` (20 tests)

**Coverage**: Services (getAgencyMetrics, getRealTimeKPIs, analytics functions, export, configuration) and UI (rendering, controls, charts, interactions, responsive behavior)

## Material-UI Select Testing

### Challenge

Material-UI Select components render their dropdown options in a portal (outside the main DOM tree), making them difficult to test with standard React Testing Library queries.

### Current Approach

For the RequestForm component tests, we've implemented a pragmatic approach that focuses on testable functionality:

1. **Basic Rendering Tests**: Verify all form fields are present
2. **Form Validation Tests**: Test validation on form submission (not on field blur)
3. **User Interaction Tests**: Test typing in text fields
4. **State Management Tests**: Verify button states and form behavior

### Testing Patterns Used

#### Form Field Validation

```typescript
it('displays validation errors for empty required fields on form submission', async () => {
  render(<RequestForm />);

  // Click submit without filling out the form
  fireEvent.click(screen.getByRole('button', { name: /submit request/i }));

  // Check for validation error messages (these appear after form submission)
  await waitFor(() => {
    expect(screen.getByText(/title must be at least 5 characters/i)).toBeInTheDocument();
    expect(screen.getByText(/please select a department/i)).toBeInTheDocument();
    // ... other validation checks
  });
});
```

#### Text Input Testing

```typescript
it('allows typing in text fields', async () => {
  const user = userEvent.setup();
  render(<RequestForm />);

  const titleInput = screen.getByLabelText(/request title/i);
  await user.type(titleInput, 'Test Request Title');
  expect(titleInput).toHaveValue('Test Request Title');
});
```

### Known Limitations

1. **Dropdown Selection Testing**: Currently skipped due to Material-UI portal complexity
2. **Real Form Submission**: Mocked due to API dependencies
3. **File Upload Integration**: Not yet implemented in tests

### Future Improvements

1. **Portal Testing**: Implement proper Material-UI Select testing with portal queries
2. **Integration Tests**: Add end-to-end tests for complete form workflows
3. **Accessibility Testing**: Add screen reader and keyboard navigation tests
4. **Visual Regression Testing**: Add screenshot testing for UI consistency

### Best Practices Established

1. **Focus on User Behavior**: Test what users actually do, not implementation details
2. **Pragmatic Approach**: Skip complex integration scenarios in unit tests
3. **Clear Documentation**: Document testing limitations and decisions
4. **Realistic Expectations**: Test actual form behavior (validation on submit, not blur)

## React Hook Form + Zod Integration

The RequestForm uses react-hook-form with Zod validation, which has specific behavior:

- **Validation Timing**: Validation only occurs on form submission by default
- **Error Display**: Errors are shown after submission attempt
- **Field State**: Individual field validation doesn't trigger on blur without additional configuration

This affects our testing strategy and explains why field-level validation tests were not implemented.

## Test Coverage Summary

Current test coverage includes:

- ✅ Form rendering and field presence
- ✅ Form validation on submission
- ✅ Text input functionality
- ✅ Button state management
- ❌ Dropdown selection (Material-UI Select)
- ❌ File upload integration
- ❌ Successful form submission flow
- ❌ Error handling for API failures

## Recommendations

1. **Keep Current Approach**: The pragmatic testing strategy works well for current needs
2. **Add Integration Tests**: Use Cypress or Playwright for full user workflows
3. **Mock Strategically**: Mock external dependencies but test real user interactions
4. **Document Decisions**: Keep clear records of testing trade-offs and limitations
