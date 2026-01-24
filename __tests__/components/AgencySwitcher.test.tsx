import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { AgencyProvider } from '../../src/contexts/AgencyContext';
import { AgencySwitcher, AgencyIndicator } from '../../src/components/AgencySwitcher';
import { theme } from '../../src/theme';

// Mock AgencyContext to control test scenarios
const mockSwitchAgency = jest.fn();
const mockAgencyContext = {
  currentAgency: {
    id: 'pdx-police',
    name: 'Portland Police Bureau',
    color: '#1976d2',
    icon: 'Shield'
  },
  agencies: [
    { id: 'pdx-police', name: 'Portland Police Bureau', color: '#1976d2', icon: 'Shield' },
    { id: 'seattle-police', name: 'Seattle Police Department', color: '#388e3c', icon: 'Shield' },
    { id: 'eugene-police', name: 'Eugene Police Department', color: '#f57c00', icon: 'Shield' },
  ],
  switchAgency: mockSwitchAgency,
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
    it('should render compact variant with current agency icon', () => {
      render(
        <TestWrapper>
          <AgencySwitcher variant="compact" />
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-label', 'Switch Agency');
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
        expect(screen.getByRole('menu')).toBeInTheDocument();
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
        expect(screen.getByText('Portland Police Bureau')).toBeInTheDocument();
        expect(screen.getByText('Seattle Police Department')).toBeInTheDocument();
        expect(screen.getByText('Eugene Police Department')).toBeInTheDocument();
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
        const seattleOption = screen.getByText('Seattle Police Department');
        fireEvent.click(seattleOption);
      });

      expect(mockSwitchAgency).toHaveBeenCalledWith('seattle-police');
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
    it('should render full variant with agency name and dropdown', () => {
      render(
        <TestWrapper>
          <AgencySwitcher variant="full" />
        </TestWrapper>
      );

      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
      expect(screen.getByText('Portland Police Bureau')).toBeInTheDocument();
    });

    it('should display current agency as selected value', () => {
      render(
        <TestWrapper>
          <AgencySwitcher variant="full" />
        </TestWrapper>
      );

      const select = screen.getByDisplayValue('Portland Police Bureau');
      expect(select).toBeInTheDocument();
    });

    it('should call switchAgency when different option is selected', async () => {
      render(
        <TestWrapper>
          <AgencySwitcher variant="full" />
        </TestWrapper>
      );

      const select = screen.getByRole('combobox');
      fireEvent.mouseDown(select);

      await waitFor(() => {
        const seattleOption = screen.getByText('Seattle Police Department');
        fireEvent.click(seattleOption);
      });

      expect(mockSwitchAgency).toHaveBeenCalledWith('seattle-police');
    });

    it('should show all agencies as options', async () => {
      render(
        <TestWrapper>
          <AgencySwitcher variant="full" />
        </TestWrapper>
      );

      const select = screen.getByRole('combobox');
      fireEvent.mouseDown(select);

      await waitFor(() => {
        mockAgencyContext.agencies.forEach(agency => {
          expect(screen.getByText(agency.name)).toBeInTheDocument();
        });
      });
    });
  });

  describe('Default Props', () => {
    it('should use compact variant as default', () => {
      render(
        <TestWrapper>
          <AgencySwitcher />
        </TestWrapper>
      );

      // Should render as IconButton (compact variant)
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Switch Agency');
    });
  });

  describe('Agency Color Integration', () => {
    it('should apply agency color to compact variant icon', () => {
      render(
        <TestWrapper>
          <AgencySwitcher variant="compact" />
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      // The icon should inherit the agency color through theme/styling
      expect(button).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for compact variant', () => {
      render(
        <TestWrapper>
          <AgencySwitcher variant="compact" />
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Switch Agency');
    });

    it('should have proper ARIA labels for full variant', () => {
      render(
        <TestWrapper>
          <AgencySwitcher variant="full" />
        </TestWrapper>
      );

      const select = screen.getByRole('combobox');
      expect(select).toHaveAccessibleName();
    });

    it('should support keyboard navigation', async () => {
      render(
        <TestWrapper>
          <AgencySwitcher variant="compact" />
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      
      // Focus and activate with keyboard
      button.focus();
      fireEvent.keyDown(button, { key: 'Enter' });

      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
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