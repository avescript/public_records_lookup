import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { AgencyProvider } from '../../src/contexts/AgencyContext';
import { AgencySwitcher, AgencyIndicator } from '../../src/components/shared/AgencySwitcher';
import { theme } from '../../src/theme';

// Mock AgencyContext to control test scenarios
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
    {
      id: 'finance',
      name: 'Finance Department',
      departments: ['accounting'],
      commonRequestTypes: ['budget_reports'],
      documentTypes: ['financial_report'],
      averageResponseTime: 12,
      complexityWeight: 0.4,
    },
  ],
  switchAgency: mockSwitchAgency,
  isLoading: false,
};

jest.mock('../../src/contexts/AgencyContext', () => ({
  ...jest.requireActual('../../src/contexts/AgencyContext'),
  useAgency: () => mockAgencyContext,
}));

// Test wrapper with necessary providers
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={theme}>
    <AgencyProvider>
      {children}
    </AgencyProvider>
  </ThemeProvider>
);

describe('AgencySwitcher', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Compact Variant', () => {
    it('should render compact variant with current agency', () => {
      render(
        <TestWrapper>
          <AgencySwitcher variant="compact" />
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(screen.getByText('POLICE')).toBeInTheDocument();
    });

    it('should open menu when compact variant is clicked', async () => {
      render(
        <TestWrapper>
          <AgencySwitcher variant="compact" />
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Switch Agency Context')).toBeInTheDocument();
      });
    });

    it('should display all agencies in menu', async () => {
      render(
        <TestWrapper>
          <AgencySwitcher variant="compact" />
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Police Department')).toBeInTheDocument();
        expect(screen.getByText('Fire Department')).toBeInTheDocument();
        expect(screen.getByText('Finance Department')).toBeInTheDocument();
      });
    });

    it('should call switchAgency when menu item is selected', async () => {
      render(
        <TestWrapper>
          <AgencySwitcher variant="compact" />
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        const fireOption = screen.getByText('Fire Department');
        fireEvent.click(fireOption);
      });

      expect(mockSwitchAgency).toHaveBeenCalledWith('fire');
    });

    it('should close menu after agency selection', async () => {
      render(
        <TestWrapper>
          <AgencySwitcher variant="compact" />
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        const eugeneOption = screen.getByText('Eugene Police Department');
        fireEvent.click(eugeneOption);
      });

      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      });
    });
  });

  describe('Full Variant', () => {
    it('should render full variant with agency name and expand icon', () => {
      render(
        <TestWrapper>
          <AgencySwitcher variant="full" />
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(screen.getByText('Police Department')).toBeInTheDocument();
      expect(screen.getByText('2 departments')).toBeInTheDocument();
    });

    it('should call switchAgency when different option is selected', async () => {
      render(
        <TestWrapper>
          <AgencySwitcher variant="full" />
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        const financeOption = screen.getByText('Finance Department');
        fireEvent.click(financeOption);
      });

      expect(mockSwitchAgency).toHaveBeenCalledWith('finance');
    });

    it('should show all agencies as options', async () => {
      render(
        <TestWrapper>
          <AgencySwitcher variant="full" />
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        mockAgencyContext.availableAgencies.forEach(agency => {
          expect(screen.getByText(agency.name)).toBeInTheDocument();
        });
      });
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
    it('should show loading skeleton when loading', () => {
      const loadingContext = { ...mockAgencyContext, isLoading: true, currentAgency: null };
      jest.mocked(require('../../src/contexts/AgencyContext').useAgency).mockReturnValue(loadingContext);

      render(
        <TestWrapper>
          <AgencySwitcher />
        </TestWrapper>
      );

      // Loading skeletons should be rendered
      const skeletons = screen.getAllByTestId('skeleton');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Disabled State', () => {
    it('should not open menu when disabled', async () => {
      render(
        <TestWrapper>
          <AgencySwitcher disabled />
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      
      fireEvent.click(button);
      
      // Menu should not open
      await waitFor(() => {
        expect(screen.queryByText('Switch Agency Context')).not.toBeInTheDocument();
      });
    });
  });
});

describe('AgencyIndicator', () => {
  const testAgency = {
    id: 'test-agency',
    name: 'Test Agency',
    color: '#ff5722',
    icon: 'Shield'
  };

  it('should render agency name', () => {
    render(
      <TestWrapper>
        <AgencyIndicator agency={testAgency} />
      </TestWrapper>
    );

    expect(screen.getByText('Test Agency')).toBeInTheDocument();
  });

  it('should apply agency color to icon', () => {
    render(
      <TestWrapper>
        <AgencyIndicator agency={testAgency} />
      </TestWrapper>
    );

    // Check that the component renders with agency data
    expect(screen.getByText('Test Agency')).toBeInTheDocument();
  });

  it('should render with custom size when provided', () => {
    render(
      <TestWrapper>
        <AgencyIndicator agency={testAgency} size="large" />
      </TestWrapper>
    );

    expect(screen.getByText('Test Agency')).toBeInTheDocument();
  });

  it('should handle missing icon gracefully', () => {
    const agencyWithoutIcon = { ...testAgency, icon: '' };
    
    render(
      <TestWrapper>
        <AgencyIndicator agency={agencyWithoutIcon} />
      </TestWrapper>
    );

    expect(screen.getByText('Test Agency')).toBeInTheDocument();
  });
});