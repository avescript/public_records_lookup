import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DateRangePicker from '../index';
import type { DateRange } from '../index';

describe('DateRangePicker', () => {
  const mockOnChange = jest.fn();
  const defaultProps = {
    onChange: mockOnChange,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders with default label and preset selector', () => {
      render(<DateRangePicker {...defaultProps} />);
      
      expect(screen.getByText('Date Range')).toBeInTheDocument();
      expect(screen.getByTestId('date-range-preset')).toBeInTheDocument();
    });

    it('renders with custom label', () => {
      render(<DateRangePicker {...defaultProps} label="Request Timeframe" />);
      
      expect(screen.getByText('Request Timeframe')).toBeInTheDocument();
    });

    it('shows error message when error prop is provided', () => {
      const errorMessage = 'Please select a valid date range';
      render(<DateRangePicker {...defaultProps} error={errorMessage} />);
      
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('disables inputs when disabled prop is true', () => {
      render(<DateRangePicker {...defaultProps} disabled />);
      
      const select = screen.getByTestId('date-range-preset').querySelector('[role="combobox"]');
      expect(select).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('Preset Selection', () => {
    it('shows all preset options', async () => {
      const user = userEvent.setup();
      render(<DateRangePicker {...defaultProps} />);
      
      const select = screen.getByTestId('date-range-preset').querySelector('[role="combobox"]')!;
      await user.click(select);
      
      expect(screen.getByText('Last 7 days')).toBeInTheDocument();
      expect(screen.getByText('Last 30 days')).toBeInTheDocument();
      expect(screen.getByText('Last 90 days')).toBeInTheDocument();
      expect(screen.getByText('Last year')).toBeInTheDocument();
      expect(screen.getByText('Custom range')).toBeInTheDocument();
    });

    it('calls onChange when preset is selected', async () => {
      const user = userEvent.setup();
      render(<DateRangePicker {...defaultProps} />);
      
      const select = screen.getByTestId('date-range-preset').querySelector('[role="combobox"]')!;
      await user.click(select);
      await user.click(screen.getByText('Last 30 days'));
      
      expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({
        preset: 'last-30-days',
        startDate: expect.any(String),
        endDate: expect.any(String),
      }));
    });
  });

  describe('Custom Date Range', () => {
    it('shows custom date inputs when "Custom range" is selected', async () => {
      const user = userEvent.setup();
      render(<DateRangePicker {...defaultProps} />);
      
      const select = screen.getByTestId('date-range-preset').querySelector('[role="combobox"]')!;
      await user.click(select);
      await user.click(screen.getByText('Custom range'));
      
      expect(screen.getByTestId('start-date-input')).toBeInTheDocument();
      expect(screen.getByTestId('end-date-input')).toBeInTheDocument();
    });

    it('calls onChange when custom dates are entered', async () => {
      const user = userEvent.setup();
      render(<DateRangePicker {...defaultProps} />);
      
      // Select custom range
      const select = screen.getByTestId('date-range-preset').querySelector('[role="combobox"]')!;
      await user.click(select);
      await user.click(screen.getByText('Custom range'));
      
      // Enter start date
      const startDateInput = screen.getByTestId('start-date-input').querySelector('input')!;
      await user.clear(startDateInput);
      await user.type(startDateInput, '2023-01-01');
      
      expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({
        startDate: '2023-01-01',
        preset: 'custom',
      }));
    });

    it('sets max date constraint on start date based on end date', async () => {
      const user = userEvent.setup();
      render(<DateRangePicker {...defaultProps} />);
      
      const select = screen.getByTestId('date-range-preset').querySelector('[role="combobox"]')!;
      await user.click(select);
      await user.click(screen.getByText('Custom range'));
      
      // Set end date first
      const endDateInput = screen.getByTestId('end-date-input').querySelector('input')!;
      await user.clear(endDateInput);
      await user.type(endDateInput, '2023-12-31');
      
      // Check start date has max constraint
      const startDateInput = screen.getByTestId('start-date-input').querySelector('input')!;
      expect(startDateInput).toHaveAttribute('max', '2023-12-31');
    });

    it('sets min date constraint on end date based on start date', async () => {
      const user = userEvent.setup();
      render(<DateRangePicker {...defaultProps} />);
      
      const select = screen.getByTestId('date-range-preset').querySelector('[role="combobox"]')!;
      await user.click(select);
      await user.click(screen.getByText('Custom range'));
      
      // Set start date first
      const startDateInput = screen.getByTestId('start-date-input').querySelector('input')!;
      await user.clear(startDateInput);
      await user.type(startDateInput, '2023-01-01');
      
      // Check end date has min constraint
      const endDateInput = screen.getByTestId('end-date-input').querySelector('input')!;
      expect(endDateInput).toHaveAttribute('min', '2023-01-01');
    });
  });

  describe('Controlled Component', () => {
    it('displays initial value correctly', () => {
      const initialValue: DateRange = {
        startDate: '2023-01-01',
        endDate: '2023-01-31',
        preset: 'custom',
      };
      
      render(<DateRangePicker {...defaultProps} value={initialValue} />);
      
      expect(screen.getByText('Custom range')).toBeInTheDocument();
    });

    it('shows date range summary for preset selections', async () => {
      const user = userEvent.setup();
      render(<DateRangePicker {...defaultProps} />);
      
      const select = screen.getByTestId('date-range-preset').querySelector('[role="combobox"]')!;
      await user.click(select);
      await user.click(screen.getByText('Last 7 days'));
      
      // Should show the calculated date range
      expect(screen.getByText(/Selected range:/)).toBeInTheDocument();
    });
  });
});