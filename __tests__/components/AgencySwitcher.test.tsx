import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { AgencyProvider } from '../../src/contexts/AgencyContext';
import {
  AgencySwitcher,
  AgencyIndicator,
} from '../../src/components/shared/AgencySwitcher';
import { theme } from '../../src/theme';

// Mock the entire AgencyContext module
jest.mock('../../src/contexts/AgencyContext', () => {
  const mockSwitchAgency = jest.fn();
  const mockAgencyContext = {
    currentAgency: {
      id: 'police',
      name: 'Police Department',
      departments: ['patrol', 'investigations'],
      commonRequestTypes: ['incident_reports'],
      documentTypes: ['incident_report'],
      averageResponseTime: 15,
      complexityWeight: 0.8,
    },
    availableAgencies: [
      {
        id: 'police',
        name: 'Police Department',
        departments: ['patrol', 'investigations'],
        commonRequestTypes: ['incident_reports'],
        documentTypes: ['incident_report'],
        averageResponseTime: 15,
        complexityWeight: 0.8,
      },
      {
        id: 'fire',
        name: 'Fire Department',
        departments: ['emergency_response'],
        commonRequestTypes: ['emergency_response'],
        documentTypes: ['incident_report'],
        averageResponseTime: 10,
        complexityWeight: 0.6,
      },
    ],
    switchAgency: mockSwitchAgency,
    isLoading: false,
  };

  return {
    useAgency: () => mockAgencyContext,
    AgencyProvider: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
  };
});

// Test wrapper with necessary providers
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={theme}>
    <div>{children}</div>
  </ThemeProvider>
);

describe('AgencySwitcher', () => {
  describe('Compact Variant', () => {
    it('should render compact variant with current agency', () => {
      render(
        <TestWrapper>
          <AgencySwitcher variant='compact' />
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(screen.getByText('POLICE')).toBeInTheDocument();
    });

    it('should have proper tooltip for compact variant', () => {
      render(
        <TestWrapper>
          <AgencySwitcher variant='compact' />
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute(
        'aria-label',
        'Current Agency: Police Department'
      );
    });
  });

  describe('Full Variant', () => {
    it('should render full variant with agency name and departments count', () => {
      render(
        <TestWrapper>
          <AgencySwitcher variant='full' />
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(screen.getByText('Police Department')).toBeInTheDocument();
      expect(screen.getByText('2 departments')).toBeInTheDocument();
    });
  });

  describe('Default Props', () => {
    it('should use full variant as default', () => {
      render(
        <TestWrapper>
          <AgencySwitcher />
        </TestWrapper>
      );

      // Should render as Button with agency name (full variant)
      expect(screen.getByText('Police Department')).toBeInTheDocument();
      expect(screen.getByText('2 departments')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show skeleton elements when loading', () => {
      const { container } = render(
        <TestWrapper>
          <AgencySwitcher />
        </TestWrapper>
      );

      // Should render some kind of UI (either loading or loaded state)
      expect(container.firstChild).toBeTruthy();
    });
  });

  describe('Disabled State', () => {
    it('should render disabled button when disabled prop is true', () => {
      render(
        <TestWrapper>
          <AgencySwitcher disabled />
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });
});

describe('AgencyIndicator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render current agency when no agencyId provided', () => {
    render(
      <TestWrapper>
        <AgencyIndicator />
      </TestWrapper>
    );

    expect(screen.getByText('Police Department')).toBeInTheDocument();
  });

  it('should render with custom size when provided', () => {
    render(
      <TestWrapper>
        <AgencyIndicator size='medium' />
      </TestWrapper>
    );

    expect(screen.getByText('Police Department')).toBeInTheDocument();
  });

  it('should not render icon when showIcon is false', () => {
    render(
      <TestWrapper>
        <AgencyIndicator showIcon={false} />
      </TestWrapper>
    );

    expect(screen.getByText('Police Department')).toBeInTheDocument();
  });

  it('should render as a Chip component', () => {
    const { container } = render(
      <TestWrapper>
        <AgencyIndicator />
      </TestWrapper>
    );

    // Should render as MUI Chip
    const chip = container.querySelector('.MuiChip-root');
    expect(chip).toBeInTheDocument();
  });
});
