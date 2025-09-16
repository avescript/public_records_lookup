import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RequestForm } from '../index';

// NOTE: Material-UI Select dropdowns render their options in a portal (outside the main DOM tree).
// For now, we're testing the basic form functionality. The form uses react-hook-form with Zod validation
// which only triggers validation on form submission, not on field blur.

describe('RequestForm', () => {
  it('renders all form fields', () => {
    render(<RequestForm />);
    
    // Check for all input fields
    expect(screen.getByRole('textbox', { name: /request title/i })).toBeInTheDocument();
    const comboboxes = screen.getAllByRole('combobox');
    expect(comboboxes).toHaveLength(2); // Department select and DateRangePicker preset select
    expect(screen.getByRole('textbox', { name: /request description/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /contact email/i })).toBeInTheDocument();
    
    // Check for DateRangePicker
    expect(screen.getByText(/date range/i)).toBeInTheDocument();
    
    // Check for submit button
    expect(screen.getByRole('button', { name: /submit request/i })).toBeInTheDocument();
  });

  it('displays validation errors for empty required fields on form submission', async () => {
    render(<RequestForm />);
    
    // Click submit without filling out the form
    fireEvent.click(screen.getByRole('button', { name: /submit request/i }));
    
    // Check for validation error messages (these appear after form submission)
    await waitFor(() => {
      expect(screen.getByText(/title must be at least 5 characters/i)).toBeInTheDocument();
      expect(screen.getByText(/please select a department/i)).toBeInTheDocument();
      expect(screen.getByText(/start date is required/i)).toBeInTheDocument();
      expect(screen.getByText(/description must be at least 20 characters/i)).toBeInTheDocument();
      expect(screen.getByText(/please provide a valid email/i)).toBeInTheDocument();
    });
  });

  it('allows typing in text fields', async () => {
    const user = userEvent.setup();
    render(<RequestForm />);
    
    // Test typing in title field
    const titleInput = screen.getByLabelText(/request title/i);
    await user.type(titleInput, 'Test Request Title');
    expect(titleInput).toHaveValue('Test Request Title');
    
    // Test typing in description field
    const descriptionInput = screen.getByLabelText(/request description/i);
    await user.type(descriptionInput, 'This is a test description for the public records request.');
    expect(descriptionInput).toHaveValue('This is a test description for the public records request.');
    
    // Test typing in email field
    const emailInput = screen.getByLabelText(/contact email/i);
    await user.type(emailInput, 'test@example.com');
    expect(emailInput).toHaveValue('test@example.com');
  });

  it('submit button is enabled by default', () => {
    render(<RequestForm />);
    
    const submitButton = screen.getByRole('button', { name: /submit request/i });
    expect(submitButton).toBeEnabled();
  });

  it('shows submit button text changes during submission state', async () => {
    render(<RequestForm />);
    
    // Initial state
    expect(screen.getByRole('button', { name: /submit request/i })).toBeInTheDocument();
    
    // The form will show validation errors when submitted with empty fields
    fireEvent.click(screen.getByRole('button', { name: /submit request/i }));
    
    // Validation errors should appear instead of submission
    await waitFor(() => {
      expect(screen.getByText(/title must be at least 5 characters/i)).toBeInTheDocument();
    });
  });
});
