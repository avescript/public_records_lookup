import React from 'react';
import { createTheme } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ChatWidget from '../../../src/components/enhanced-search/ChatWidget';

// Mock AISearchChat component
jest.mock('../../../src/components/enhanced-search/AISearchChat', () => {
  return function MockAISearchChat({
    requestId,
    onSearchResultsSelected,
  }: any) {
    return (
      <div data-testid='ai-search-chat'>
        Mock AI Search Chat for {requestId}
        <button
          onClick={() =>
            onSearchResultsSelected &&
            onSearchResultsSelected([{ id: 'test', title: 'Test Result' }])
          }
        >
          Send Test Results
        </button>
      </div>
    );
  };
});

const theme = createTheme();

const defaultProps = {
  requestId: 'test-request-123',
};

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

// Mock window.matchMedia for useMediaQuery
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe('ChatWidget', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders floating action button when closed', () => {
    renderWithTheme(<ChatWidget {...defaultProps} />);

    const fab = screen.getByRole('button');
    expect(fab).toBeInTheDocument();
    expect(screen.queryByTestId('ai-search-chat')).not.toBeInTheDocument();
  });

  test('shows tooltip on hover', async () => {
    const user = userEvent.setup();
    renderWithTheme(<ChatWidget {...defaultProps} />);

    const fab = screen.getByRole('button');
    await user.hover(fab);

    await waitFor(() => {
      expect(screen.getByText('Open AI Search Assistant')).toBeInTheDocument();
    });
  });

  test('opens chat dialog when FAB is clicked', async () => {
    const user = userEvent.setup();
    renderWithTheme(<ChatWidget {...defaultProps} />);

    const fab = screen.getByRole('button');
    await user.click(fab);

    await waitFor(() => {
      expect(screen.getByTestId('ai-search-chat')).toBeInTheDocument();
      expect(screen.getByText('AI Search Assistant')).toBeInTheDocument();
    });
  });

  test('closes chat when close button is clicked', async () => {
    const user = userEvent.setup();
    renderWithTheme(<ChatWidget {...defaultProps} />);

    // Open chat
    const fab = screen.getByRole('button');
    await user.click(fab);

    await waitFor(() => {
      expect(screen.getByTestId('ai-search-chat')).toBeInTheDocument();
    });

    // Close chat
    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByTestId('ai-search-chat')).not.toBeInTheDocument();
    });
  });

  test('minimizes chat when minimize button is clicked', async () => {
    const user = userEvent.setup();
    renderWithTheme(<ChatWidget {...defaultProps} />);

    // Open chat
    const fab = screen.getByRole('button');
    await user.click(fab);

    await waitFor(() => {
      expect(screen.getByTestId('ai-search-chat')).toBeInTheDocument();
    });

    // Minimize chat
    const minimizeButton = screen.getByRole('button', { name: /minimize/i });
    await user.click(minimizeButton);

    await waitFor(() => {
      expect(screen.getByText('Click to restore')).toBeInTheDocument();
      expect(screen.queryByTestId('ai-search-chat')).not.toBeInTheDocument();
    });
  });

  test('restores chat when minimized window is clicked', async () => {
    const user = userEvent.setup();
    renderWithTheme(<ChatWidget {...defaultProps} />);

    // Open and minimize chat
    const fab = screen.getByRole('button');
    await user.click(fab);

    await waitFor(() => {
      expect(screen.getByTestId('ai-search-chat')).toBeInTheDocument();
    });

    const minimizeButton = screen.getByRole('button', { name: /minimize/i });
    await user.click(minimizeButton);

    await waitFor(() => {
      expect(screen.getByText('Click to restore')).toBeInTheDocument();
    });

    // Click on minimized window to restore
    const minimizedWindow = screen.getByText('Click to restore').closest('div');
    await user.click(minimizedWindow!);

    await waitFor(() => {
      expect(screen.getByTestId('ai-search-chat')).toBeInTheDocument();
      expect(screen.queryByText('Click to restore')).not.toBeInTheDocument();
    });
  });

  test('toggles full screen mode', async () => {
    const user = userEvent.setup();
    renderWithTheme(<ChatWidget {...defaultProps} />);

    // Open chat
    const fab = screen.getByRole('button');
    await user.click(fab);

    await waitFor(() => {
      expect(screen.getByTestId('ai-search-chat')).toBeInTheDocument();
    });

    // Toggle full screen
    const fullScreenButton = screen.getByRole('button', {
      name: /full screen/i,
    });
    await user.click(fullScreenButton);

    // The dialog should still be present but in full screen mode
    await waitFor(() => {
      expect(screen.getByTestId('ai-search-chat')).toBeInTheDocument();
    });
  });

  test('shows badge count when provided', () => {
    renderWithTheme(<ChatWidget {...defaultProps} badgeCount={5} />);

    const badge = screen.getByText('5');
    expect(badge).toBeInTheDocument();
  });

  test('disables FAB when disabled prop is true', () => {
    renderWithTheme(<ChatWidget {...defaultProps} disabled={true} />);

    const fab = screen.getByRole('button');
    expect(fab).toBeDisabled();
  });

  test('positions FAB correctly based on position prop', () => {
    const { rerender } = renderWithTheme(
      <ChatWidget {...defaultProps} position='bottom-left' />
    );

    let fab = screen.getByRole('button').closest('div');
    expect(fab).toHaveStyle({ left: '16px', bottom: '16px' });

    rerender(
      <ThemeProvider theme={theme}>
        <ChatWidget {...defaultProps} position='top-right' />
      </ThemeProvider>
    );

    fab = screen.getByRole('button').closest('div');
    expect(fab).toHaveStyle({ top: '16px', right: '16px' });
  });

  test('passes initial context to AISearchChat', async () => {
    const user = userEvent.setup();
    const initialContext = 'Test context for search';

    renderWithTheme(
      <ChatWidget {...defaultProps} initialContext={initialContext} />
    );

    const fab = screen.getByRole('button');
    await user.click(fab);

    await waitFor(() => {
      expect(screen.getByTestId('ai-search-chat')).toBeInTheDocument();
    });

    // The mock component should receive the props
    expect(
      screen.getByText('Mock AI Search Chat for test-request-123')
    ).toBeInTheDocument();
  });

  test('handles search results selection', async () => {
    const onSearchResultsSelected = jest.fn();
    const user = userEvent.setup();

    renderWithTheme(
      <ChatWidget
        {...defaultProps}
        onSearchResultsSelected={onSearchResultsSelected}
      />
    );

    // Open chat
    const fab = screen.getByRole('button');
    await user.click(fab);

    await waitFor(() => {
      expect(screen.getByTestId('ai-search-chat')).toBeInTheDocument();
    });

    // Trigger search results from mock component
    const testButton = screen.getByText('Send Test Results');
    await user.click(testButton);

    expect(onSearchResultsSelected).toHaveBeenCalledWith([
      { id: 'test', title: 'Test Result' },
    ]);
  });

  test('handles mobile screen size', () => {
    // Mock mobile screen size
    (window.matchMedia as jest.Mock).mockImplementation(query => ({
      matches: query.includes('down'),
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    const user = userEvent.setup();
    renderWithTheme(<ChatWidget {...defaultProps} />);

    const fab = screen.getByRole('button');

    // The component should still render and be functional
    expect(fab).toBeInTheDocument();
  });

  test('closes minimized window with close button', async () => {
    const user = userEvent.setup();
    renderWithTheme(<ChatWidget {...defaultProps} />);

    // Open and minimize chat
    const fab = screen.getByRole('button');
    await user.click(fab);

    await waitFor(() => {
      expect(screen.getByTestId('ai-search-chat')).toBeInTheDocument();
    });

    const minimizeButton = screen.getByRole('button', { name: /minimize/i });
    await user.click(minimizeButton);

    await waitFor(() => {
      expect(screen.getByText('Click to restore')).toBeInTheDocument();
    });

    // Close minimized window
    const closeMinimizedButton = screen.getByRole('button');
    // Find the close button within the minimized window (not the restore area)
    const minimizedWindow = screen.getByText('Click to restore').closest('div');
    const closeButton = minimizedWindow!
      .querySelector(
        'button[aria-label*="Close"], button svg[data-testid="CloseIcon"]'
      )
      ?.closest('button');

    if (closeButton) {
      await user.click(closeButton as HTMLElement);
    }

    // After closing, should show FAB again
    await waitFor(() => {
      expect(screen.queryByText('Click to restore')).not.toBeInTheDocument();
      // The main FAB should be visible again
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  test('maintains state across minimize/restore cycles', async () => {
    const user = userEvent.setup();
    renderWithTheme(<ChatWidget {...defaultProps} />);

    // Open chat
    const fab = screen.getByRole('button');
    await user.click(fab);

    await waitFor(() => {
      expect(screen.getByTestId('ai-search-chat')).toBeInTheDocument();
    });

    // Minimize
    const minimizeButton = screen.getByRole('button', { name: /minimize/i });
    await user.click(minimizeButton);

    await waitFor(() => {
      expect(screen.getByText('Click to restore')).toBeInTheDocument();
    });

    // Restore
    const minimizedWindow = screen.getByText('Click to restore').closest('div');
    await user.click(minimizedWindow!);

    await waitFor(() => {
      expect(screen.getByTestId('ai-search-chat')).toBeInTheDocument();
    });

    // Chat should still be functional
    expect(
      screen.getByText('Mock AI Search Chat for test-request-123')
    ).toBeInTheDocument();
  });
});
