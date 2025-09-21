# Testing Patterns & Documentation

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
