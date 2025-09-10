import { render, screen, fireEvent, waitFor, within } from '@testing-library/re    // Select department
    const departmentSelect = screen.getByTestId('department-select');
    fireEvent.mouseDown(departmentSelect);
    const deptPortal = await screen.findByRole('presentation');
    const policeDeptOption = within(deptPortal).getByText(/police department/i);
    fireEvent.click(policeDeptOption);
    
    // Select timeframe
    const timeframeSelect = screen.getByTestId('timeframe-select');
    fireEvent.mouseDown(timeframeSelect);
    const timePortal = await screen.findByRole('presentation');
    const lastMonthOption = within(timePortal).getByText(/last month/i);
    fireEvent.click(lastMonthOption);    await user.typeuserEvent from '@testing-library/user-event';
import axios from 'axios';
import { RequestForm } from '../index';

jest.mock('axios');

describe('RequestForm', () => {
  it('renders all form fields', () => {
    render(<RequestForm />);
    
    // Check for all input fields
    expect(screen.getByRole('textbox', { name: /request title/i })).toBeInTheDocument();
    const comboboxes = screen.getAllByRole('combobox');
    expect(comboboxes).toHaveLength(2); // Department and Timeframe selects
    expect(screen.getByRole('textbox', { name: /request description/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /contact email/i })).toBeInTheDocument();
    
    // Check for submit button
    expect(screen.getByRole('button', { name: /submit request/i })).toBeInTheDocument();
  });

  it('displays validation errors for empty required fields', async () => {
    render(<RequestForm />);
    
    // Click submit without filling out the form
    fireEvent.click(screen.getByRole('button', { name: /submit request/i }));
    
    // Check for validation error messages
    await waitFor(() => {
      expect(screen.getByText(/title must be at least 5 characters/i)).toBeInTheDocument();
      expect(screen.getByText(/please select a department/i)).toBeInTheDocument();
      expect(screen.getByText(/please provide a timeframe/i)).toBeInTheDocument();
      expect(screen.getByText(/description must be at least 20 characters/i)).toBeInTheDocument();
      expect(screen.getByText(/please provide a valid email/i)).toBeInTheDocument();
    });
  });

  it('allows selecting departments from dropdown', async () => {
    render(<RequestForm />);
    
    // Open department dropdown
    const departmentSelect = screen.getByTestId('department-select');
    fireEvent.mouseDown(departmentSelect);
    
    // Wait for the menu to be present in the portal
    const portal = await screen.findByRole('presentation');
    const policeDeptOption = within(portal).getByText(/police department/i);
    fireEvent.click(policeDeptOption);
    
    // Check if option is selected
    const departmentValue = screen.getByTestId('department-select');
    expect(departmentValue).toHaveTextContent('Police Department');
  });

  it('allows selecting timeframe from dropdown', async () => {
    render(<RequestForm />);
    
    // Open timeframe dropdown
    const timeframeSelect = screen.getByTestId('timeframe-select');
    fireEvent.mouseDown(timeframeSelect);
    
    // Wait for the menu to be present in the portal
    const portal = await screen.findByRole('presentation');
    const lastMonthOption = within(portal).getByText(/last month/i);
    fireEvent.click(lastMonthOption);
    
    // Check if option is selected
    const timeframeValue = screen.getByTestId('timeframe-select');
    expect(timeframeValue).toHaveTextContent('Last Month');
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    render(<RequestForm />);
    
    // Fill out the form
    await user.type(screen.getByLabelText(/request title/i), 'Test Request Title');
    
    // Select department
    const departmentSelect = screen.getByTestId('department-select');
    fireEvent.mouseDown(departmentSelect);
    const deptPortal = await screen.findByRole('presentation');
    const policeDeptOption = within(deptPortal).getByText(/police department/i);
    fireEvent.click(policeDeptOption);
    
    // Select timeframe
    const timeframeSelect = screen.getByTestId('timeframe-select');
    fireEvent.mouseDown(timeframeSelect);
    const timeListbox = await screen.findByRole('listbox');
    const lastMonthOption = within(timeListbox).getByText('Last Month');
    fireEvent.click(lastMonthOption);

    await user.type(screen.getByLabelText(/request description/i), 'This is a test description for the public records request.');
    await user.type(screen.getByLabelText(/contact email/i), 'test@example.com');
    
    // Submit form
    await user.click(screen.getByRole('button', { name: /submit request/i }));
    
    // Check loading state
    expect(screen.getByRole('button', { name: /submitting/i })).toBeDisabled();
    
    // Wait for success message
    await waitFor(() => {
      expect(screen.getByText(/request submitted successfully/i)).toBeInTheDocument();
    });
  });

  it('displays error message when submission fails', async () => {
    // Mock console.log to prevent error from being logged
    jest.spyOn(console, 'log').mockImplementation(() => {});
    // Mock console.error to prevent error from being logged
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Mock axios to simulate a failed request
    const mockAxios = axios as jest.Mocked<typeof axios>;
    mockAxios.post.mockRejectedValueOnce(new Error('Failed to submit request'));

    const user = userEvent.setup();
    render(<RequestForm />);
    
    // Fill out the form with valid data
    await user.type(screen.getByLabelText(/request title/i), 'Test Request Title');
    
    // Select department
    const departmentSelect = screen.getByTestId('department-select');
    fireEvent.mouseDown(departmentSelect);
    const deptPortal = await screen.findByRole('presentation');
    const policeDeptOption = within(deptPortal).getByText(/police department/i);
    fireEvent.click(policeDeptOption);
    
    // Select timeframe
    const timeframeSelect = screen.getByTestId('timeframe-select');
    fireEvent.mouseDown(timeframeSelect);
    const timePortal = await screen.findByRole('presentation');
    const lastMonthOption = within(timePortal).getByText(/last month/i);
    fireEvent.click(lastMonthOption);    await user.type(screen.getByLabelText(/request description/i), 'This is a test description for the public records request.');
    await user.type(screen.getByLabelText(/contact email/i), 'test@example.com');
    
    // Submit form
    await user.click(screen.getByRole('button', { name: /submit request/i }));
    
    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/failed to submit request/i)).toBeInTheDocument();
    });

    // Restore console.log and Promise
    jest.restoreAllMocks();
  });
});
