import { AIChatService } from '../../src/services/aiChatService';
import {
  ChatConversation,
  ChatMessage,
  SearchIntent,
} from '../../src/types/chat';
import { EnhancedMatchCandidate } from '../../src/types/enhanced-search';

// Mock the enhanced AI record service
jest.mock('../../src/services/enhancedAIRecordService', () => ({
  enhancedAIRecordService: {
    searchRecords: jest.fn(),
  },
}));

describe('AIChatService', () => {
  let chatService: AIChatService;
  const mockRequestId = 'test-request-123';

  beforeEach(() => {
    chatService = new AIChatService('test-api-key');
    jest.clearAllMocks();
  });

  describe('Conversation Management', () => {
    test('should start a new conversation', async () => {
      const conversation = await chatService.startConversation(mockRequestId);

      expect(conversation).toBeDefined();
      expect(conversation.requestId).toBe(mockRequestId);
      expect(conversation.messages).toHaveLength(1);
      expect(conversation.messages[0].type).toBe('assistant');
      expect(conversation.messages[0].content).toContain('Hello');
      expect(conversation.isActive).toBe(true);
    });

    test('should start conversation with initial context', async () => {
      const initialContext = 'Police incident reports';
      const conversation = await chatService.startConversation(
        mockRequestId,
        initialContext
      );

      expect(conversation.messages[0].content).toContain(initialContext);
    });

    test('should retrieve conversation by id', async () => {
      const conversation = await chatService.startConversation(mockRequestId);
      const retrieved = chatService.getConversation(conversation.id);

      expect(retrieved).toBeDefined();
      expect(retrieved!.id).toBe(conversation.id);
    });

    test('should return null for non-existent conversation', () => {
      const retrieved = chatService.getConversation('non-existent-id');
      expect(retrieved).toBeNull();
    });

    test('should end conversation', async () => {
      const conversation = await chatService.startConversation(mockRequestId);
      chatService.endConversation(conversation.id);

      const retrieved = chatService.getConversation(conversation.id);
      expect(retrieved!.isActive).toBe(false);
    });

    test('should clear conversation', async () => {
      const conversation = await chatService.startConversation(mockRequestId);
      chatService.clearConversation(conversation.id);

      const retrieved = chatService.getConversation(conversation.id);
      expect(retrieved).toBeNull();
    });
  });

  describe('Message Processing', () => {
    let conversation: ChatConversation;

    beforeEach(async () => {
      conversation = await chatService.startConversation(mockRequestId);
    });

    test('should send user message and get AI response', async () => {
      const userMessage = 'Find police reports from last month';

      // Mock search results
      const mockResults: EnhancedMatchCandidate[] = [
        {
          id: 'record-1',
          title: 'Police Report #123',
          confidence: 0.9,
          snippet: 'Traffic incident report',
          metadata: { department: 'Police Department' },
        },
      ];

      const enhancedAIRecordService =
        require('../../src/services/enhancedAIRecordService').enhancedAIRecordService;
      enhancedAIRecordService.searchRecords.mockResolvedValue(mockResults);

      const response = await chatService.sendMessage(
        conversation.id,
        userMessage
      );

      expect(response.message.type).toBe('assistant');
      expect(response.searchPerformed).toBe(true);
      expect(response.searchCount).toBe(1);
      expect(response.message.searchResults).toEqual(mockResults);

      const updatedConversation = chatService.getConversation(conversation.id);
      expect(updatedConversation!.messages).toHaveLength(3); // Welcome + user + AI
    });

    test('should handle search with no results', async () => {
      const userMessage = 'Find documents about xyz';

      const enhancedAIRecordService =
        require('../../src/services/enhancedAIRecordService').enhancedAIRecordService;
      enhancedAIRecordService.searchRecords.mockResolvedValue([]);

      const response = await chatService.sendMessage(
        conversation.id,
        userMessage
      );

      expect(response.message.content).toContain("didn't find any records");
      expect(response.searchCount).toBe(0);
      expect(response.suggestions.length).toBeGreaterThan(0);
    });

    test('should handle help requests', async () => {
      const userMessage = 'How can you help me?';

      const response = await chatService.sendMessage(
        conversation.id,
        userMessage,
        false
      );

      expect(response.message.content).toContain('help you search');
      expect(response.searchPerformed).toBe(false);
    });

    test('should handle errors gracefully', async () => {
      const userMessage = 'Find something';

      const enhancedAIRecordService =
        require('../../src/services/enhancedAIRecordService').enhancedAIRecordService;
      enhancedAIRecordService.searchRecords.mockRejectedValue(
        new Error('Search failed')
      );

      const response = await chatService.sendMessage(
        conversation.id,
        userMessage
      );

      expect(response.message.content).toContain('error');
      expect(response.searchPerformed).toBe(false);
    });

    test('should throw error for non-existent conversation', async () => {
      await expect(
        chatService.sendMessage('non-existent-id', 'test message')
      ).rejects.toThrow('Conversation not found');
    });
  });

  describe('Search Intent Analysis', () => {
    test('should detect search intent with keywords', async () => {
      const message = 'Find all police reports from 2023';
      const intent = await chatService.analyzeSearchIntent(message, {
        requestType: 'general',
        searchHistory: [],
        currentResults: [],
        filters: {},
      });

      expect(intent.shouldSearch).toBe(true);
      expect(intent.searchTerms).toContain('police');
      expect(intent.searchTerms).toContain('reports');
      expect(intent.searchTerms).toContain('2023');
      expect(intent.confidence).toBeGreaterThan(0.8);
    });

    test('should extract date references', async () => {
      const message = 'Show me documents from last year';
      const intent = await chatService.analyzeSearchIntent(message, {
        requestType: 'general',
        searchHistory: [],
        currentResults: [],
        filters: {},
      });

      expect(intent.dateReferences).toContain('last year');
    });

    test('should extract department references', async () => {
      const message = 'Find fire department incident reports';
      const intent = await chatService.analyzeSearchIntent(message, {
        requestType: 'general',
        searchHistory: [],
        currentResults: [],
        filters: {},
      });

      expect(intent.departmentReferences).toContain('fire');
    });

    test('should categorize intent types', () => {
      const helpMessage = 'How do I search for documents?';
      const searchMessage = 'Find police reports';
      const filterMessage = 'Filter results by date';

      const helpIntent = chatService.categorizeIntent(
        helpMessage.toLowerCase()
      );
      const searchIntent = chatService.categorizeIntent(
        searchMessage.toLowerCase()
      );
      const filterIntent = chatService.categorizeIntent(
        filterMessage.toLowerCase()
      );

      expect(helpIntent).toBe('help');
      expect(searchIntent).toBe('search');
      expect(filterIntent).toBe('filter');
    });
  });

  describe('Search Term Extraction', () => {
    test('should extract meaningful search terms', () => {
      const message = 'Please find the police incident reports from last month';
      const terms = chatService.extractSearchTerms(message);

      expect(terms).toContain('police');
      expect(terms).toContain('incident');
      expect(terms).toContain('reports');
      expect(terms).toContain('month');
      expect(terms).not.toContain('the');
      expect(terms).not.toContain('from');
    });

    test('should remove duplicates', () => {
      const message = 'Find find police police reports';
      const terms = chatService.extractSearchTerms(message);

      expect(terms.filter(term => term === 'police')).toHaveLength(1);
    });

    test('should handle empty or short words', () => {
      const message = 'a the in on at to for of';
      const terms = chatService.extractSearchTerms(message);

      expect(terms).toHaveLength(0);
    });
  });

  describe('Filter Extraction', () => {
    test('should extract date range filters', () => {
      const message = 'Find documents from last year';
      const filters = chatService.extractFilters(message);

      expect(filters.dateRange).toBeDefined();
      expect(filters.dateRange!.start).toBeInstanceOf(Date);
      expect(filters.dateRange!.end).toBeInstanceOf(Date);
    });

    test('should extract department filters', () => {
      const message = 'Show me police department records';
      const filters = chatService.extractFilters(message);

      expect(filters.departments).toContain('Police Department');
    });

    test('should extract document type filters', () => {
      const message = 'Find email records';
      const filters = chatService.extractFilters(message);

      expect(filters.documentTypes).toContain('email');
    });
  });

  describe('Suggestions', () => {
    let conversation: ChatConversation;

    beforeEach(async () => {
      conversation = await chatService.startConversation(mockRequestId);

      // Add some mock search results to context
      const mockResults: EnhancedMatchCandidate[] = [
        {
          id: 'record-1',
          title: 'Police Report #123',
          confidence: 0.9,
          metadata: { department: 'Police Department' },
        },
        {
          id: 'record-2',
          title: 'Fire Report #456',
          confidence: 0.8,
          metadata: { department: 'Fire Department' },
        },
      ];
      conversation.context.currentResults = mockResults;
    });

    test('should generate refinement suggestions', async () => {
      const suggestions = await chatService.suggestRefinements(conversation.id);

      expect(suggestions.length).toBeGreaterThan(0);
      expect(
        suggestions.some(s => s.description.includes('Police Department'))
      ).toBe(true);
      expect(
        suggestions.some(s => s.description.includes('Fire Department'))
      ).toBe(true);
    });

    test('should limit suggestions count', async () => {
      const suggestions = await chatService.suggestRefinements(conversation.id);

      expect(suggestions.length).toBeLessThanOrEqual(5);
    });

    test('should return empty suggestions for invalid conversation', async () => {
      const suggestions = await chatService.suggestRefinements('invalid-id');

      expect(suggestions).toHaveLength(0);
    });
  });

  describe('Export Functionality', () => {
    test('should export conversation history', async () => {
      const conversation = await chatService.startConversation(mockRequestId);
      await chatService.sendMessage(conversation.id, 'Test message', false);

      const exportContent = chatService.exportConversation(conversation.id);

      expect(exportContent).toContain('# Chat Conversation Export');
      expect(exportContent).toContain(mockRequestId);
      expect(exportContent).toContain('Test message');
      expect(exportContent).toContain('Message 1 - Assistant');
      expect(exportContent).toContain('Message 2 - User');
    });

    test('should return empty string for invalid conversation', () => {
      const exportContent = chatService.exportConversation('invalid-id');

      expect(exportContent).toBe('');
    });
  });

  describe('Search Query Building', () => {
    test('should build search query from intent', () => {
      const intent: SearchIntent = {
        shouldSearch: true,
        searchTerms: ['police', 'reports'],
        dateReferences: ['2023'],
        departmentReferences: ['police'],
        confidence: 0.9,
        intent: 'search',
        filters: {
          departments: ['Police Department'],
        },
      };

      const query = chatService.buildSearchQuery(intent);

      expect(query.query).toBe('police reports');
      expect(query.searchMode).toBe('hybrid');
      expect(query.maxResults).toBe(10);
      expect(query.includeSnippets).toBe(true);
      expect(query.conversational).toBe(true);
      expect(query.departments).toContain('Police Department');
    });
  });

  describe('Conversation History', () => {
    test('should return conversation history', async () => {
      const conversation = await chatService.startConversation(mockRequestId);
      await chatService.sendMessage(conversation.id, 'Test message', false);

      const history = chatService.getConversationHistory(conversation.id);

      expect(history.length).toBe(3); // Welcome + user + AI response
      expect(history[0].type).toBe('assistant');
      expect(history[1].type).toBe('user');
      expect(history[2].type).toBe('assistant');
    });

    test('should return empty array for invalid conversation', () => {
      const history = chatService.getConversationHistory('invalid-id');

      expect(history).toHaveLength(0);
    });
  });
});
