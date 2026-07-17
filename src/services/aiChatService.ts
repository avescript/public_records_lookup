import {
  AISearchQuery,
  ChatConversation,
  ChatMessage,
  ChatResponse,
  ConversationContext,
  SearchIntent,
  SearchSuggestion,
} from '../types/chat';
import {
  EnhancedMatchCandidate,
  EnhancedSearchOptions,
} from '../types/enhanced-search';

import { enhancedAIRecordService } from './enhancedAIRecordService';

/**
 * AI Chat Service for conversational search assistance
 * Provides OpenAI integration for natural language processing and search guidance
 */
export class AIChatService {
  private provider: 'mock' | 'openai' | 'vertex';
  private apiKey: string;
  private apiEndpoint: string;
  private openAIModel: string;
  private vertexEndpoint: string;
  private conversations: Map<string, ChatConversation> = new Map();
  private searchHistory: Map<string, EnhancedMatchCandidate[]> = new Map();

  constructor(apiKey?: string) {
    this.provider =
      (process.env.NEXT_PUBLIC_AI_CHAT_PROVIDER as
        | 'mock'
        | 'openai'
        | 'vertex') || 'mock';
    this.apiKey = apiKey || process.env.NEXT_PUBLIC_OPENAI_API_KEY || '';
    this.apiEndpoint = 'https://api.openai.com/v1/chat/completions';
    this.openAIModel = process.env.NEXT_PUBLIC_OPENAI_MODEL || 'gpt-4o-mini';
    this.vertexEndpoint = process.env.NEXT_PUBLIC_VERTEX_CHAT_ENDPOINT || '';
  }

  /**
   * Start a new chat conversation
   */
  async startConversation(
    requestId: string,
    initialContext?: string
  ): Promise<ChatConversation> {
    const conversation: ChatConversation = {
      id: `chat-${requestId}-${Date.now()}`,
      requestId,
      messages: [],
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

    // Add welcome message
    const welcomeMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      type: 'assistant',
      content: `Hello! I'm your AI search assistant. I can help you find relevant records for this request. ${initialContext ? `I see you're working with: ${initialContext}` : 'What would you like to search for?'}`,
      timestamp: new Date(),
      searchQuery: null,
      searchResults: null,
    };

    conversation.messages.push(welcomeMessage);
    this.conversations.set(conversation.id, conversation);

    return conversation;
  }

  /**
   * Send a message to the chat and get AI response
   */
  async sendMessage(
    conversationId: string,
    userMessage: string,
    includeSearch: boolean = true
  ): Promise<ChatResponse> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Add user message
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      type: 'user',
      content: userMessage,
      timestamp: new Date(),
      searchQuery: null,
      searchResults: null,
    };

    conversation.messages.push(userMsg);

    try {
      // Analyze user intent and extract search parameters
      const searchIntent = await this.analyzeSearchIntent(
        userMessage,
        conversation.context
      );

      let searchResults: EnhancedMatchCandidate[] | null = null;
      let searchQuery: AISearchQuery | null = null;

      // Perform search if intent detected and requested
      if (includeSearch && searchIntent.shouldSearch) {
        searchQuery = this.buildSearchQuery(searchIntent);
        searchResults = await this.executeSearch(searchQuery);

        // Update conversation context
        conversation.context.searchHistory.push(searchQuery);
        conversation.context.currentResults = searchResults;
        this.searchHistory.set(conversationId, searchResults);
      }

      // Generate AI response
      const aiResponse = await this.generateAIResponse(
        userMessage,
        conversation,
        searchIntent,
        searchResults
      );

      // Add AI message
      const aiMsg: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        type: 'assistant',
        content: aiResponse.content,
        timestamp: new Date(),
        searchQuery,
        searchResults,
        suggestions: aiResponse.suggestions,
      };

      conversation.messages.push(aiMsg);
      conversation.updatedAt = new Date();

      return {
        message: aiMsg,
        searchPerformed: searchResults !== null,
        searchCount: searchResults?.length || 0,
        suggestions: aiResponse.suggestions || [],
      };
    } catch (error) {
      console.error('Error processing chat message:', error);

      const errorMsg: ChatMessage = {
        id: `msg-${Date.now()}-error`,
        type: 'assistant',
        content:
          'I apologize, but I encountered an error processing your request. Please try rephrasing your question or contact support if the issue persists.',
        timestamp: new Date(),
        searchQuery: null,
        searchResults: null,
      };

      conversation.messages.push(errorMsg);

      return {
        message: errorMsg,
        searchPerformed: false,
        searchCount: 0,
        suggestions: [],
      };
    }
  }

  /**
   * Analyze user message to determine search intent
   */
  public async analyzeSearchIntent(
    message: string,
    context: ConversationContext
  ): Promise<SearchIntent> {
    // Enhanced intent detection with mock AI analysis
    // In production, this would call OpenAI API

    const lowerMessage = message.toLowerCase();
    const searchKeywords = [
      'find',
      'search',
      'look for',
      'show me',
      'get',
      'locate',
      'retrieve',
    ];
    const hasSearchKeyword = searchKeywords.some(keyword =>
      lowerMessage.includes(keyword)
    );

    // Extract potential search terms
    const searchTerms = this.extractSearchTerms(message);

    // Detect date references
    const datePattern =
      /(\d{4}|\d{1,2}\/\d{1,2}\/\d{2,4}|last year|this month|yesterday)/gi;
    const dateReferences = message.match(datePattern) || [];

    // Detect department/category references
    const departmentPattern =
      /(police|fire|public works|planning|finance|hr|human resources)/gi;
    const departmentReferences = message.match(departmentPattern) || [];

    return {
      shouldSearch: hasSearchKeyword || searchTerms.length > 0,
      searchTerms,
      dateReferences,
      departmentReferences,
      confidence: hasSearchKeyword ? 0.9 : searchTerms.length > 0 ? 0.7 : 0.3,
      intent: this.categorizeIntent(lowerMessage),
      filters: this.extractFilters(message),
    };
  }

  /**
   * Extract search terms from natural language
   */
  public extractSearchTerms(message: string): string[] {
    // Remove common words and extract meaningful terms
    const stopWords = [
      'the',
      'a',
      'an',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
      'of',
      'with',
      'by',
      'from',
      'up',
      'about',
      'into',
      'through',
      'during',
      'before',
      'after',
      'above',
      'below',
      'i',
      'you',
      'he',
      'she',
      'it',
      'we',
      'they',
      'find',
      'search',
      'look',
      'show',
      'get',
    ];

    const words = message
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word));

    return [...new Set(words)]; // Remove duplicates
  }

  /**
   * Categorize user intent
   */
  public categorizeIntent(
    message: string
  ): 'search' | 'filter' | 'help' | 'clarification' | 'general' {
    if (message.includes('help') || message.includes('how')) return 'help';
    if (
      message.includes('filter') ||
      message.includes('narrow') ||
      message.includes('refine')
    )
      return 'filter';
    if (
      message.includes('what') ||
      message.includes('explain') ||
      message.includes('clarify')
    )
      return 'clarification';
    if (
      message.includes('find') ||
      message.includes('search') ||
      message.includes('show')
    )
      return 'search';
    return 'general';
  }

  /**
   * Extract filters from natural language
   */
  public extractFilters(message: string): Partial<EnhancedSearchOptions> {
    const filters: Partial<EnhancedSearchOptions> = {};

    // Date range extraction
    if (message.includes('last year')) {
      const lastYear = new Date();
      lastYear.setFullYear(lastYear.getFullYear() - 1);
      filters.dateRange = {
        start: new Date(lastYear.getFullYear(), 0, 1),
        end: new Date(lastYear.getFullYear(), 11, 31),
      };
    } else if (message.includes('this year')) {
      const thisYear = new Date();
      filters.dateRange = {
        start: new Date(thisYear.getFullYear(), 0, 1),
        end: new Date(thisYear.getFullYear(), 11, 31),
      };
    }

    // Department extraction
    const departmentMap: { [key: string]: string } = {
      police: 'Police Department',
      fire: 'Fire Department',
      'public works': 'Public Works',
      planning: 'Planning Department',
      finance: 'Finance Department',
    };

    for (const [key, value] of Object.entries(departmentMap)) {
      if (message.toLowerCase().includes(key)) {
        filters.departments = [value];
        break;
      }
    }

    // Document type extraction
    if (message.includes('email')) filters.documentTypes = ['email'];
    if (message.includes('report')) filters.documentTypes = ['report'];
    if (message.includes('invoice')) filters.documentTypes = ['invoice'];

    return filters;
  }

  /**
   * Build search query from intent
   */
  public buildSearchQuery(intent: SearchIntent): AISearchQuery {
    return {
      query: intent.searchTerms.join(' '),
      searchMode: 'hybrid' as const,
      maxResults: 10,
      includeSnippets: true,
      conversational: true,
      intent: intent.intent,
      confidence: intent.confidence,
      ...intent.filters, // Spread the filters into the query
    };
  }

  /**
   * Execute search using enhanced AI service
   */
  private async executeSearch(
    query: AISearchQuery
  ): Promise<EnhancedMatchCandidate[]> {
    const searchOptions: EnhancedSearchOptions = {
      query: query.query,
      searchMode: query.searchMode,
      maxResults: query.maxResults,
      includeSnippets: query.includeSnippets,
      ...query.filters,
    };

    return await enhancedAIRecordService.searchRecords(searchOptions);
  }

  /**
   * Generate AI response using OpenAI (mocked for now)
   */
  private async generateAIResponse(
    userMessage: string,
    conversation: ChatConversation,
    intent: SearchIntent,
    searchResults: EnhancedMatchCandidate[] | null
  ): Promise<{ content: string; suggestions?: SearchSuggestion[] }> {
    if (this.provider === 'openai' && this.apiKey) {
      const providerResponse = await this.generateOpenAIResponse(
        userMessage,
        conversation,
        searchResults
      );
      if (providerResponse) return providerResponse;
    }

    if (this.provider === 'vertex' && this.vertexEndpoint) {
      const providerResponse = await this.generateVertexResponse(
        userMessage,
        conversation,
        searchResults
      );
      if (providerResponse) return providerResponse;
    }

    return this.generateMockAIResponse(userMessage, intent, searchResults);
  }

  private async generateOpenAIResponse(
    userMessage: string,
    conversation: ChatConversation,
    searchResults: EnhancedMatchCandidate[] | null
  ): Promise<{ content: string; suggestions?: SearchSuggestion[] } | null> {
    try {
      const systemPrompt =
        'You are an AI search assistant for public records staff. ' +
        'Return concise guidance for refining queries and selecting relevant records. ' +
        'When possible, suggest 2-4 refined search queries.';

      const contextSnippet = searchResults
        ? `Current result count: ${searchResults.length}. Top titles: ${searchResults
            .slice(0, 3)
            .map(result => result.title)
            .join('; ')}`
        : 'No search results available yet.';

      const messages = [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content:
            `Request ${conversation.requestId}. ${contextSnippet}\n` +
            `User query: ${userMessage}\n` +
            'Respond with practical next steps and include refined queries.',
        },
      ];

      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.openAIModel,
          messages,
          temperature: 0.3,
        }),
      });

      if (!response.ok) return null;

      const payload = (await response.json()) as {
        choices?: { message?: { content?: string } }[];
      };

      const content = payload.choices?.[0]?.message?.content?.trim();
      if (!content) return null;

      return {
        content,
        suggestions: this.deriveSuggestionsFromText(content, userMessage),
      };
    } catch {
      return null;
    }
  }

  private async generateVertexResponse(
    userMessage: string,
    conversation: ChatConversation,
    searchResults: EnhancedMatchCandidate[] | null
  ): Promise<{ content: string; suggestions?: SearchSuggestion[] } | null> {
    try {
      // Vertex calls should go through a backend endpoint/proxy to avoid exposing credentials.
      const response = await fetch(this.vertexEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: conversation.requestId,
          prompt: userMessage,
          searchResults: searchResults?.slice(0, 5).map(result => ({
            id: result.id,
            title: result.title,
            confidence: result.confidence,
          })),
        }),
      });

      if (!response.ok) return null;

      const payload = (await response.json()) as {
        content?: string;
        suggestions?: string[];
      };

      if (!payload.content) return null;

      return {
        content: payload.content,
        suggestions: (payload.suggestions || []).map(query => ({
          query,
          description: 'Suggested refinement from Vertex response',
        })),
      };
    } catch {
      return null;
    }
  }

  private deriveSuggestionsFromText(
    content: string,
    fallbackSeed: string
  ): SearchSuggestion[] {
    const lines = content
      .split('\n')
      .map(line => line.replace(/^[-*\d.\s]+/, '').trim())
      .filter(Boolean)
      .filter(line => line.length > 8)
      .slice(0, 3);

    if (lines.length === 0) {
      return [
        {
          query: `${fallbackSeed} high confidence`,
          description: 'Filter to strongest relevance matches',
        },
      ];
    }

    return lines.map(line => ({
      query: line,
      description: 'Refined query suggestion',
    }));
  }

  private generateMockAIResponse(
    userMessage: string,
    intent: SearchIntent,
    searchResults: EnhancedMatchCandidate[] | null
  ): { content: string; suggestions?: SearchSuggestion[] } {
    let content = '';
    const suggestions: SearchSuggestion[] = [];

    if (intent.shouldSearch && searchResults) {
      if (searchResults.length === 0) {
        content = `I didn't find any records matching "${intent.searchTerms.join(' ')}". Would you like me to try a broader search or look for related terms?`;

        suggestions.push(
          {
            query: intent.searchTerms[0],
            description: `Search for "${intent.searchTerms[0]}" only`,
          },
          {
            query: `*${intent.searchTerms[0]}*`,
            description: 'Broader search with wildcards',
          }
        );
      } else {
        content = `I found ${searchResults.length} records matching your search. Here are the top results:\n\n`;

        searchResults.slice(0, 3).forEach((result, index) => {
          content += `**${index + 1}. ${result.title}**\n`;
          content += `Confidence: ${(result.confidence * 100).toFixed(0)}%\n`;
          if (result.snippet) {
            content += `${result.snippet}\n`;
          }
          content += '\n';
        });

        if (searchResults.length > 3) {
          content += `...and ${searchResults.length - 3} more results. `;
        }

        content +=
          '\nWould you like me to refine the search or help you with something else?';

        // Add refinement suggestions
        suggestions.push(
          {
            query: `${intent.searchTerms.join(' ')} high priority`,
            description: 'Filter to high priority records',
          },
          {
            query: `${intent.searchTerms.join(' ')} recent`,
            description: 'Show only recent records',
          }
        );
      }
    } else if (intent.intent === 'help') {
      content = `I can help you search for records using natural language. Here are some examples:

• "Find all police reports from last month"
• "Show me emails about budget planning"
• "Look for documents containing incident reports"
• "Search for records from the fire department"

Just tell me what you're looking for and I'll help you find it!`;
    } else {
      content = `I understand you're asking about "${userMessage}". Could you provide more specific details about what records you'd like me to search for?`;

      suggestions.push(
        { query: 'recent documents', description: 'Show recent documents' },
        {
          query: 'all departments',
          description: 'Search across all departments',
        }
      );
    }

    return { content, suggestions };
  }

  /**
   * Get conversation by ID
   */
  getConversation(conversationId: string): ChatConversation | null {
    return this.conversations.get(conversationId) || null;
  }

  /**
   * Get conversation history
   */
  getConversationHistory(conversationId: string): ChatMessage[] {
    const conversation = this.conversations.get(conversationId);
    return conversation?.messages || [];
  }

  /**
   * End conversation
   */
  endConversation(conversationId: string): void {
    const conversation = this.conversations.get(conversationId);
    if (conversation) {
      conversation.isActive = false;
      conversation.updatedAt = new Date();
    }
  }

  /**
   * Clear conversation
   */
  clearConversation(conversationId: string): void {
    this.conversations.delete(conversationId);
    this.searchHistory.delete(conversationId);
  }

  /**
   * Suggest search refinements
   */
  async suggestRefinements(
    conversationId: string
  ): Promise<SearchSuggestion[]> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation || !conversation.context.currentResults) {
      return [];
    }

    const suggestions: SearchSuggestion[] = [];
    const context = conversation.context;

    // Suggest based on current results
    if (context.currentResults.length > 0) {
      // Get common departments from results
      const departments = new Set(
        context.currentResults
          .flatMap(r => r.metadata?.department)
          .filter(Boolean)
      );

      departments.forEach(dept => {
        suggestions.push({
          query: `department:"${dept}"`,
          description: `Filter to ${dept} only`,
        });
      });

      // Suggest date refinements
      suggestions.push(
        { query: 'last 30 days', description: 'Show only recent records' },
        {
          query: 'high confidence',
          description: 'Show only high-confidence matches',
        }
      );
    }

    return suggestions.slice(0, 5); // Limit to 5 suggestions
  }

  /**
   * Export conversation history
   */
  exportConversation(conversationId: string): string {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      return '';
    }

    let export_content = '# Chat Conversation Export\n\n';
    export_content += `**Request ID:** ${conversation.requestId}\n`;
    export_content += `**Started:** ${conversation.createdAt.toLocaleString()}\n`;
    export_content += `**Updated:** ${conversation.updatedAt.toLocaleString()}\n\n`;

    conversation.messages.forEach((msg, index) => {
      export_content += `## Message ${index + 1} - ${msg.type.charAt(0).toUpperCase() + msg.type.slice(1)}\n`;
      export_content += `**Time:** ${msg.timestamp.toLocaleString()}\n\n`;
      export_content += `${msg.content}\n\n`;

      if (msg.searchResults && msg.searchResults.length > 0) {
        export_content += `**Search Results:** ${msg.searchResults.length} records found\n\n`;
      }
    });

    return export_content;
  }
}

// Singleton instance
export const aiChatService = new AIChatService();
