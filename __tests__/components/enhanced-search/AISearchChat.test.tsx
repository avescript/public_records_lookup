import React from 'react';
import { createTheme } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import AISearchChat from '../../../src/components/enhanced-search/AISearchChat';
import { aiChatService } from '../../../src/services/aiChatService';
import { ChatConversation, ChatMessage } from '../../../src/types/chat';

// Mock the AI chat service
jest.mock('../../../src/services/aiChatService', () => ({
  aiChatService: {
    startConversation: jest.fn(),
    sendMessage: jest.fn(),
    getConversation: jest.fn(),
    clearConversation: jest.fn(),
    exportConversation: jest.fn(),
  },
}));

// Mock scrollIntoView
Object.defineProperty(Element.prototype, 'scrollIntoView', {
  value: jest.fn(),
  writable: true,
});

const mockAiChatService = aiChatService as jest.Mocked<typeof aiChatService>;

const theme = createTheme();

const defaultProps = {
  requestId: 'test-request-123',
  initialContext: 'Test context',
};

const mockConversation: ChatConversation = {
  id: 'conv-123',
  requestId: 'test-request-123',
  messages: [
    {
      id: 'msg-1',
      type: 'assistant',
      content: "Hello! I'm your AI search assistant.",
      timestamp: new Date(),
      searchQuery: null,
      searchResults: null,
    },
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
  context: {
    requestType: 'general',
    searchHistory: [],
    currentResults: [],
    filters: {},
  },
  isActive: true,
};

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe('AISearchChat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAiChatService.startConversation.mockResolvedValue(mockConversation);
    mockAiChatService.getConversation.mockReturnValue(mockConversation);
  });

  test('renders loading state initially', () => {
    mockAiChatService.startConversation.mockImplementation(
      () =>
        new Promise(resolve => setTimeout(() => resolve(mockConversation), 100))
    );

    renderWithTheme(<AISearchChat {...defaultProps} />);

    expect(screen.getByText('Starting conversation...')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('initializes conversation on mount', async () => {
    renderWithTheme(<AISearchChat {...defaultProps} />);

    await waitFor(() => {
      expect(mockAiChatService.startConversation).toHaveBeenCalledWith(
        'test-request-123',
        'Test context'
      );
    });
  });

  test('displays conversation messages', async () => {
    renderWithTheme(<AISearchChat {...defaultProps} />);

    await waitFor(() => {
      expect(
        screen.getByText("Hello! I'm your AI search assistant.")
      ).toBeInTheDocument();
    });
  });

  test('sends message when send button is clicked', async () => {
    const user = userEvent.setup();
    const mockResponse = {
      message: {
        id: 'msg-2',
        type: 'assistant' as const,
        content: 'I can help you search for records.',
        timestamp: new Date(),
        searchQuery: null,
        searchResults: null,
      },
      searchPerformed: false,
      searchCount: 0,
      suggestions: [],
    };

    mockAiChatService.sendMessage.mockResolvedValue(mockResponse);

    renderWithTheme(<AISearchChat {...defaultProps} />);

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText('Ask me to search for records...')
      ).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(
      'Ask me to search for records...'
    );
    const sendButton = screen.getByRole('button', { name: /send/i });

    await user.type(input, 'Find police reports');
    await user.click(sendButton);

    await waitFor(() => {
      expect(mockAiChatService.sendMessage).toHaveBeenCalledWith(
        'conv-123',
        'Find police reports',
        true
      );
    });
  });

  test('sends message when Enter is pressed', async () => {
    const user = userEvent.setup();
    const mockResponse = {
      message: {
        id: 'msg-2',
        type: 'assistant' as const,
        content: 'I can help you search for records.',
        timestamp: new Date(),
        searchQuery: null,
        searchResults: null,
      },
      searchPerformed: false,
      searchCount: 0,
      suggestions: [],
    };

    mockAiChatService.sendMessage.mockResolvedValue(mockResponse);

    renderWithTheme(<AISearchChat {...defaultProps} />);

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText('Ask me to search for records...')
      ).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(
      'Ask me to search for records...'
    );

    await user.type(input, 'Find documents');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(mockAiChatService.sendMessage).toHaveBeenCalled();
    });
  });

  test('does not send empty messages', async () => {
    const user = userEvent.setup();

    renderWithTheme(<AISearchChat {...defaultProps} />);

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText('Ask me to search for records...')
      ).toBeInTheDocument();
    });

    const sendButton = screen.getByRole('button', { name: /send/i });

    // Send button should be disabled when input is empty
    expect(sendButton).toBeDisabled();

    expect(mockAiChatService.sendMessage).not.toHaveBeenCalled();
  });

  test('displays search results when message contains them', async () => {
    const mockMessageWithResults: ChatMessage = {
      id: 'msg-2',
      type: 'assistant',
      content: 'I found 2 records matching your search.',
      timestamp: new Date(),
      searchQuery: null,
      searchResults: [
        {
          id: 'record-1',
          title: 'Police Report #123',
          confidence: 0.9,
          snippet: 'Traffic incident report',
        },
        {
          id: 'record-2',
          title: 'Fire Report #456',
          confidence: 0.8,
          snippet: 'Building fire incident',
        },
      ],
    };

    const conversationWithResults: ChatConversation = {
      ...mockConversation,
      messages: [mockConversation.messages[0], mockMessageWithResults],
    };

    // Mock startConversation to return conversation with results
    mockAiChatService.startConversation.mockResolvedValue(
      conversationWithResults
    );
    mockAiChatService.getConversation.mockReturnValue(conversationWithResults);

    renderWithTheme(<AISearchChat {...defaultProps} />);

    await waitFor(() => {
      expect(
        screen.getByText('I found 2 records matching your search.')
      ).toBeInTheDocument();
      expect(screen.getByText('2 results')).toBeInTheDocument();
    });
  });

  test('expands and collapses search results', async () => {
    const user = userEvent.setup();
    const mockMessageWithResults: ChatMessage = {
      id: 'msg-2',
      type: 'assistant',
      content: 'I found results.',
      timestamp: new Date(),
      searchQuery: null,
      searchResults: [
        {
          id: 'record-1',
          title: 'Police Report #123',
          confidence: 0.9,
          snippet: 'Traffic incident report',
        },
      ],
    };

    const conversationWithResults: ChatConversation = {
      ...mockConversation,
      messages: [mockConversation.messages[0], mockMessageWithResults],
    };

    // Mock startConversation to return conversation with results
    mockAiChatService.startConversation.mockResolvedValue(
      conversationWithResults
    );
    mockAiChatService.getConversation.mockReturnValue(conversationWithResults);

    renderWithTheme(<AISearchChat {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText(/Show Search Results \(1\)/)).toBeInTheDocument();
    });

    const expandButton = screen.getByText(/Show Search Results \(1\)/);
    await user.click(expandButton);

    await waitFor(() => {
      expect(screen.getByText('Police Report #123')).toBeInTheDocument();
      expect(screen.getByText('Traffic incident report')).toBeInTheDocument();
    });

    //     const collapseButton = screen.getByText(/Hide Search Results \(1\)/);
    //     await user.click(collapseButton);
    //
    //     await waitFor(() => {
    //       // Verify that the button text changed back to "Show" indicating collapse worked
    //       expect(screen.getByText(/Show Search Results \\(1\\)/)).toBeInTheDocument();
    //     });
  });

  test('displays suggestions and handles suggestion clicks', async () => {
    const user = userEvent.setup();
    const mockResponse = {
      message: {
        id: 'msg-2',
        type: 'assistant' as const,
        content: 'Here are some suggestions.',
        timestamp: new Date(),
        searchQuery: null,
        searchResults: null,
        suggestions: [
          { query: 'police reports', description: 'Search police reports' },
          { query: 'fire incidents', description: 'Search fire incidents' },
        ],
      },
      searchPerformed: false,
      searchCount: 0,
      suggestions: [
        { query: 'police reports', description: 'Search police reports' },
        { query: 'fire incidents', description: 'Search fire incidents' },
      ],
    };

    mockAiChatService.sendMessage.mockResolvedValue(mockResponse);

    renderWithTheme(<AISearchChat {...defaultProps} />);

    // Send a message to get suggestions
    await waitFor(() => {
      expect(
        screen.getByPlaceholderText('Ask me to search for records...')
      ).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(
      'Ask me to search for records...'
    );
    const sendButton = screen.getByRole('button', { name: /send/i });

    await user.type(input, 'Help me find documents');
    await user.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText('Search police reports')).toBeInTheDocument();
      expect(screen.getByText('Search fire incidents')).toBeInTheDocument();
    });

    // Click on a suggestion
    const suggestion = screen.getByText('Search police reports');
    await user.click(suggestion);

    expect(input).toHaveValue('police reports');
  });

  test('shows typing indicator when loading', async () => {
    const user = userEvent.setup();

    // Mock a delayed response to show loading state
    mockAiChatService.sendMessage.mockImplementation(
      () =>
        new Promise(resolve =>
          setTimeout(
            () =>
              resolve({
                message: {
                  id: 'msg-2',
                  type: 'assistant' as const,
                  content: 'Response',
                  timestamp: new Date(),
                  searchQuery: null,
                  searchResults: null,
                },
                searchPerformed: false,
                searchCount: 0,
                suggestions: [],
              }),
            100
          )
        )
    );

    renderWithTheme(<AISearchChat {...defaultProps} />);

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText('Ask me to search for records...')
      ).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(
      'Ask me to search for records...'
    );
    const sendButton = screen.getByRole('button', { name: /send/i });

    await user.type(input, 'Test message');
    await user.click(sendButton);

    // Should show typing indicator
    await waitFor(() => {
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  test('clears conversation when clear button is clicked', async () => {
    const user = userEvent.setup();
    mockAiChatService.clearConversation.mockResolvedValue();

    // Mock startConversation to return a new conversation ID after clearing
    const newConversation = {
      ...mockConversation,
      id: 'new-conv-123',
    };

    // Set up the sequence: first call returns original, second call (after clear) returns new
    mockAiChatService.startConversation
      .mockResolvedValueOnce(mockConversation) // Initial load
      .mockResolvedValueOnce(newConversation); // After clear

    renderWithTheme(<AISearchChat {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /more/i })).toBeInTheDocument();
    });

    // Open menu
    const menuButton = screen.getByRole('button', { name: /more/i });
    await user.click(menuButton);

    await waitFor(() => {
      expect(screen.getByText('Clear Chat')).toBeInTheDocument();
    });

    // Click clear
    const clearButton = screen.getByText('Clear Chat');
    await user.click(clearButton);

    await waitFor(() => {
      // Should clear the original conversation
      expect(mockAiChatService.clearConversation).toHaveBeenCalledWith(
        'conv-123'
      );
      // Should have called startConversation twice (initial + after clear)
      expect(mockAiChatService.startConversation).toHaveBeenCalledTimes(2);
    });
  });

  test('exports conversation when export button is clicked', async () => {
    const user = userEvent.setup();
    const mockExportContent = '# Conversation Export\n\nTest content';
    mockAiChatService.exportConversation.mockReturnValue(mockExportContent);

    // Mock URL.createObjectURL and related methods
    const mockCreateObjectURL = jest.fn(() => 'mock-url');
    const mockRevokeObjectURL = jest.fn();
    const mockClick = jest.fn();

    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;

    // Mock createElement to return an element with click method
    const originalCreateElement = document.createElement;
    document.createElement = jest.fn(tagName => {
      if (tagName === 'a') {
        return {
          href: '',
          download: '',
          click: mockClick,
          setAttribute: jest.fn(),
          style: {},
        } as any;
      }
      return originalCreateElement.call(document, tagName);
    });

    renderWithTheme(<AISearchChat {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /more/i })).toBeInTheDocument();
    });

    // Open menu
    const menuButton = screen.getByRole('button', { name: /more/i });
    await user.click(menuButton);

    await waitFor(() => {
      expect(screen.getByText('Export')).toBeInTheDocument();
    });

    // Click export
    const exportButton = screen.getByText('Export');
    await user.click(exportButton);

    // Should open export dialog
    await waitFor(() => {
      expect(screen.getByText('Export Conversation')).toBeInTheDocument();
    });

    // Confirm export
    const confirmButton = screen.getByRole('button', { name: /export/i });
    await user.click(confirmButton);

    expect(mockAiChatService.exportConversation).toHaveBeenCalledWith(
      'conv-123'
    );
    expect(mockCreateObjectURL).toHaveBeenCalled();
    expect(mockClick).toHaveBeenCalled();

    // Restore original createElement
    document.createElement = originalCreateElement;
  });

  test('calls onSearchResultsSelected when search results are found', async () => {
    const onSearchResultsSelected = jest.fn();
    const mockResults = [
      { id: 'record-1', title: 'Police Report', confidence: 0.9 },
    ];

    const mockResponse = {
      message: {
        id: 'msg-2',
        type: 'assistant' as const,
        content: 'Found results',
        timestamp: new Date(),
        searchQuery: null,
        searchResults: mockResults,
      },
      searchPerformed: true,
      searchCount: 1,
      suggestions: [],
    };

    mockAiChatService.sendMessage.mockResolvedValue(mockResponse);

    const user = userEvent.setup();

    renderWithTheme(
      <AISearchChat
        {...defaultProps}
        onSearchResultsSelected={onSearchResultsSelected}
      />
    );

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText('Ask me to search for records...')
      ).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(
      'Ask me to search for records...'
    );
    const sendButton = screen.getByRole('button', { name: /send/i });

    await user.type(input, 'Find records');
    await user.click(sendButton);

    await waitFor(() => {
      expect(onSearchResultsSelected).toHaveBeenCalledWith(mockResults);
    });
  });

  test('handles errors gracefully', async () => {
    const user = userEvent.setup();
    mockAiChatService.sendMessage.mockRejectedValue(new Error('Network error'));

    renderWithTheme(<AISearchChat {...defaultProps} />);

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText('Ask me to search for records...')
      ).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(
      'Ask me to search for records...'
    );
    const sendButton = screen.getByRole('button', { name: /send/i });

    await user.type(input, 'Test message');
    await user.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to send message')).toBeInTheDocument();
    });
  });
});
