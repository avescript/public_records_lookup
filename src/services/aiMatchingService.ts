// Mock AI matching service for Phase 0 development
// In production, this would connect to Vertex Matching Engine

export interface MatchCandidate {
  id: string;
  title: string;
  description: string;
  source: string; // e.g., "Police Reports", "Fire Incident Reports"
  relevanceScore: number; // 0.0 to 1.0
  confidence: 'high' | 'medium' | 'low';
  keyPhrases: string[]; // Phrases that contributed to the match
  distanceScore: number; // Lower is better (semantic distance)
  recordType: string;
  dateCreated: string;
  agency: string;
  metadata: {
    fileSize?: string;
    pageCount?: number;
    lastModified?: string;
    classification?: string;
  };
}

export interface MatchExplanation {
  queryTerms: string[];
  matchedPhrases: string[];
  semanticSimilarity: number;
  keywordOverlap: number;
  contextualRelevance: number;
  reasoningSummary: string;
}

export interface MatchResult {
  requestId: string;
  candidates: MatchCandidate[];
  explanation: MatchExplanation;
  searchMetadata: {
    totalCandidatesScanned: number;
    processingTimeMs: number;
    confidenceThreshold: number;
    searchTimestamp: string;
  };
}

// Mock data simulating various types of records that might match requests
const MOCK_RECORD_CANDIDATES: MatchCandidate[] = [
  {
    id: 'rec-001',
    title: 'Traffic Incident Report - Vehicle Collision',
    description: 'Detailed report of two-vehicle collision at Main St and Oak Ave intersection on January 15, 2024. Includes officer observations, witness statements, and preliminary findings.',
    source: 'Police Reports',
    relevanceScore: 0.92,
    confidence: 'high',
    keyPhrases: ['vehicle collision', 'traffic incident', 'Main Street', 'January 15'],
    distanceScore: 0.08,
    recordType: 'Police Report',
    dateCreated: '2024-01-15',
    agency: 'Police',
    metadata: {
      fileSize: '2.3 MB',
      pageCount: 8,
      lastModified: '2024-01-16',
      classification: 'Standard',
    },
  },
  {
    id: 'rec-002',
    title: 'Fire Department Response Log',
    description: 'Emergency response documentation for structure fire at 123 Oak Avenue. Includes timeline, equipment deployed, and damage assessment.',
    source: 'Fire Department Records',
    relevanceScore: 0.76,
    confidence: 'medium',
    keyPhrases: ['emergency response', 'Oak Avenue', 'structure fire'],
    distanceScore: 0.24,
    recordType: 'Fire Report',
    dateCreated: '2024-01-15',
    agency: 'Fire',
    metadata: {
      fileSize: '1.8 MB',
      pageCount: 5,
      lastModified: '2024-01-15',
      classification: 'Standard',
    },
  },
  {
    id: 'rec-003',
    title: 'Building Permit Application - 123 Oak Avenue',
    description: 'Construction permit application for residential renovations including structural modifications and electrical updates.',
    source: 'Building Department',
    relevanceScore: 0.68,
    confidence: 'medium',
    keyPhrases: ['building permit', 'Oak Avenue', 'construction'],
    distanceScore: 0.32,
    recordType: 'Permit',
    dateCreated: '2024-01-10',
    agency: 'Public Works',
    metadata: {
      fileSize: '956 KB',
      pageCount: 12,
      lastModified: '2024-01-12',
      classification: 'Standard',
    },
  },
  {
    id: 'rec-004',
    title: 'Code Enforcement Notice - Property Violation',
    description: 'Municipal code violation notice for property maintenance issues and required corrective actions.',
    source: 'Code Enforcement',
    relevanceScore: 0.54,
    confidence: 'low',
    keyPhrases: ['code enforcement', 'property violation', 'municipal'],
    distanceScore: 0.46,
    recordType: 'Enforcement Notice',
    dateCreated: '2024-01-08',
    agency: 'Public Works',
    metadata: {
      fileSize: '234 KB',
      pageCount: 2,
      lastModified: '2024-01-08',
      classification: 'Standard',
    },
  },
  {
    id: 'rec-005',
    title: 'Environmental Impact Assessment',
    description: 'Environmental review documentation for proposed development project including soil analysis and water quality testing.',
    source: 'Environmental Services',
    relevanceScore: 0.42,
    confidence: 'low',
    keyPhrases: ['environmental', 'development project', 'assessment'],
    distanceScore: 0.58,
    recordType: 'Environmental Report',
    dateCreated: '2024-01-05',
    agency: 'Public Works',
    metadata: {
      fileSize: '4.7 MB',
      pageCount: 24,
      lastModified: '2024-01-07',
      classification: 'Standard',
    },
  },
];

/**
 * Simulates AI-powered matching against a corpus of government records
 * In production, this would call Vertex Matching Engine
 */
export const findMatches = async (
  requestId: string,
  description: string,
  searchTerms?: string[]
): Promise<MatchResult> => {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));

  // Extract key terms from description for mock matching
  const queryTerms = extractKeyTerms(description, searchTerms);
  
  // Simulate semantic matching by scoring candidates
  const candidates = MOCK_RECORD_CANDIDATES
    .map(candidate => ({
      ...candidate,
      relevanceScore: calculateMockRelevance(queryTerms, candidate),
    }))
    .filter(candidate => candidate.relevanceScore > 0.3) // Filter low-relevance matches
    .sort((a, b) => b.relevanceScore - a.relevanceScore) // Sort by relevance
    .slice(0, 6); // Return top 6 matches

  // Generate mock explanation
  const explanation: MatchExplanation = {
    queryTerms,
    matchedPhrases: candidates.flatMap(c => c.keyPhrases).slice(0, 8),
    semanticSimilarity: Math.max(...candidates.map(c => c.relevanceScore)),
    keywordOverlap: calculateKeywordOverlap(queryTerms, candidates),
    contextualRelevance: candidates.length > 0 ? 0.75 : 0.2,
    reasoningSummary: generateReasoningSummary(queryTerms, candidates.length),
  };

  return {
    requestId,
    candidates,
    explanation,
    searchMetadata: {
      totalCandidatesScanned: MOCK_RECORD_CANDIDATES.length,
      processingTimeMs: Math.floor(1200 + Math.random() * 800),
      confidenceThreshold: 0.3,
      searchTimestamp: new Date().toISOString(),
    },
  };
};

/**
 * Extract key terms from request description for matching
 */
function extractKeyTerms(description: string, additionalTerms?: string[]): string[] {
  const commonWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
    'between', 'among', 'under', 'over', 'i', 'me', 'my', 'myself', 'we', 'our', 'ours',
    'ourselves', 'you', 'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his',
    'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them',
    'their', 'theirs', 'themselves', 'request', 'please', 'need', 'want', 'would', 'like',
  ]);

  const terms = description
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !commonWords.has(word))
    .slice(0, 10); // Limit to top 10 terms

  return [...terms, ...(additionalTerms || [])];
}

/**
 * Calculate mock relevance score based on term matching
 */
function calculateMockRelevance(queryTerms: string[], candidate: MatchCandidate): number {
  const candidateText = `${candidate.title} ${candidate.description}`.toLowerCase();
  const keyPhraseText = candidate.keyPhrases.join(' ').toLowerCase();
  
  let score = 0;
  let matches = 0;

  for (const term of queryTerms) {
    if (candidateText.includes(term) || keyPhraseText.includes(term)) {
      matches++;
      score += 0.1;
    }
  }

  // Add bonus for exact phrase matches
  const queryPhrase = queryTerms.slice(0, 3).join(' ');
  if (candidateText.includes(queryPhrase)) {
    score += 0.3;
  }

  // Normalize and add some randomness for realistic variation
  const normalizedScore = Math.min(score, 1.0);
  const withVariation = normalizedScore + (Math.random() - 0.5) * 0.1;
  
  return Math.max(0, Math.min(1, withVariation));
}

/**
 * Calculate keyword overlap percentage
 */
function calculateKeywordOverlap(queryTerms: string[], candidates: MatchCandidate[]): number {
  if (candidates.length === 0) return 0;
  
  const totalKeyPhrases = candidates.flatMap(c => c.keyPhrases);
  const overlap = queryTerms.filter(term => 
    totalKeyPhrases.some(phrase => phrase.toLowerCase().includes(term.toLowerCase()))
  );
  
  return overlap.length / queryTerms.length;
}

/**
 * Generate human-readable reasoning for the search results
 */
function generateReasoningSummary(queryTerms: string[], matchCount: number): string {
  if (matchCount === 0) {
    return `No high-confidence matches found for query terms: "${queryTerms.slice(0, 3).join(', ')}". Consider broadening search terms or checking spelling.`;
  }
  
  if (matchCount >= 5) {
    return `Found ${matchCount} relevant records with strong semantic similarity to your request. Matches based on key terms: "${queryTerms.slice(0, 3).join(', ')}" and contextual relevance.`;
  }
  
  return `Found ${matchCount} potential matches with moderate to high confidence. Results ranked by semantic similarity and keyword relevance.`;
}

/**
 * Simulate "no matches" scenario for testing
 */
export const findMatchesEmpty = async (requestId: string): Promise<MatchResult> => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    requestId,
    candidates: [],
    explanation: {
      queryTerms: ['unique', 'nonexistent', 'query'],
      matchedPhrases: [],
      semanticSimilarity: 0,
      keywordOverlap: 0,
      contextualRelevance: 0,
      reasoningSummary: 'No matches found. The request may be too specific, or relevant records may not be digitized yet.',
    },
    searchMetadata: {
      totalCandidatesScanned: MOCK_RECORD_CANDIDATES.length,
      processingTimeMs: 850,
      confidenceThreshold: 0.3,
      searchTimestamp: new Date().toISOString(),
    },
  };
};