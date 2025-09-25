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
  // Decision tracking for US-031
  decision?: {
    status: 'pending' | 'accepted' | 'rejected';
    decidedBy?: string; // Staff member who made the decision
    decidedAt?: string; // ISO timestamp
    notes?: string; // Optional decision notes
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
  // Police Records
  {
    id: 'rec-001',
    title: 'Use of Force Report - July 2025',
    description: 'Police use of force incident report dated July 15, 2025. Includes officer statements, witness accounts, body camera footage log, and administrative review documentation.',
    source: 'Police Reports',
    relevanceScore: 0.95,
    confidence: 'high',
    keyPhrases: ['use of force', 'police report', 'body camera', 'incident report'],
    distanceScore: 0.05,
    recordType: 'Use of Force Report',
    dateCreated: '2025-07-15',
    agency: 'Police',
    metadata: {
      fileSize: '3.2 MB',
      pageCount: 12,
      lastModified: '2025-07-16',
      classification: 'Restricted',
    },
  },
  {
    id: 'rec-002',
    title: 'Criminal Case File #2025-4387 - Police Report',
    description: 'Initial police report for burglary case #2025-4387. Includes incident details, evidence collection log, witness statements, and officer observations. Suspect: Marcus Johnson.',
    source: 'Police Reports',
    relevanceScore: 0.98,
    confidence: 'high',
    keyPhrases: ['criminal case', 'burglary', 'Marcus Johnson', 'evidence', 'case 4387'],
    distanceScore: 0.02,
    recordType: 'Criminal Case File',
    dateCreated: '2025-08-15',
    agency: 'Police',
    metadata: {
      fileSize: '2.8 MB',
      pageCount: 15,
      lastModified: '2025-08-20',
      classification: 'Restricted',
    },
  },
  {
    id: 'rec-003',
    title: 'Traffic Citation Records - Highway 99 Speed Enforcement',
    description: 'Traffic citation database records for speeding violations on Highway 99 between Main Street and Oak Avenue, August 2025. Includes citation numbers, dates, violation codes, and fine amounts.',
    source: 'Traffic Citations',
    relevanceScore: 0.92,
    confidence: 'high',
    keyPhrases: ['traffic citation', 'speed enforcement', 'Highway 99', 'Main Street', 'Oak Avenue'],
    distanceScore: 0.08,
    recordType: 'Traffic Citation',
    dateCreated: '2025-08-31',
    agency: 'Police',
    metadata: {
      fileSize: '1.2 MB',
      pageCount: 45,
      lastModified: '2025-09-01',
      classification: 'Standard',
    },
  },
  {
    id: 'rec-004',
    title: 'Officer Training Records - De-escalation Certification',
    description: 'Police officer training completion records for de-escalation techniques, mental health crisis intervention, and use of force protocols. Anonymized records for 2024-2025 training cycle.',
    source: 'Personnel Training',
    relevanceScore: 0.88,
    confidence: 'high',
    keyPhrases: ['officer training', 'de-escalation', 'mental health', 'training completion'],
    distanceScore: 0.12,
    recordType: 'Training Record',
    dateCreated: '2025-01-15',
    agency: 'Police',
    metadata: {
      fileSize: '890 KB',
      pageCount: 8,
      lastModified: '2025-09-01',
      classification: 'Standard',
    },
  },
  // Fire Department Records
  {
    id: 'rec-005',
    title: 'Emergency Response Time Analysis - 2024-2025',
    description: 'Fire department emergency response data including call volumes, response times by district, incident types, and resource allocation patterns. Anonymized data for academic research purposes.',
    source: 'Fire Department Records',
    relevanceScore: 0.91,
    confidence: 'high',
    keyPhrases: ['emergency response', 'response times', 'call volumes', 'incident types'],
    distanceScore: 0.09,
    recordType: 'Statistical Report',
    dateCreated: '2025-08-31',
    agency: 'Fire',
    metadata: {
      fileSize: '2.4 MB',
      pageCount: 28,
      lastModified: '2025-09-01',
      classification: 'Standard',
    },
  },
  // City Council Records
  {
    id: 'rec-006',
    title: 'City Council Executive Session Minutes - Development Projects',
    description: 'Executive session minutes from city council meetings discussing development projects, zoning variances, and personnel matters. Legal review completed for public release.',
    source: 'City Clerk Records',
    relevanceScore: 0.87,
    confidence: 'high',
    keyPhrases: ['city council', 'executive session', 'development projects', 'minutes'],
    distanceScore: 0.13,
    recordType: 'Meeting Minutes',
    dateCreated: '2024-12-15',
    agency: 'City Clerk',
    metadata: {
      fileSize: '1.8 MB',
      pageCount: 22,
      lastModified: '2025-01-10',
      classification: 'Standard',
    },
  },
  // Financial Records
  {
    id: 'rec-007',
    title: 'Public Works Department Expenditure Report - FY 2025',
    description: 'Detailed expenditure report for Department of Public Works including contractor payments, equipment purchases, overtime records, and infrastructure spending breakdown.',
    source: 'Finance Department',
    relevanceScore: 0.93,
    confidence: 'high',
    keyPhrases: ['public works', 'expenditure', 'contractor payments', 'infrastructure spending'],
    distanceScore: 0.07,
    recordType: 'Financial Report',
    dateCreated: '2025-06-30',
    agency: 'Finance',
    metadata: {
      fileSize: '3.1 MB',
      pageCount: 67,
      lastModified: '2025-07-15',
      classification: 'Standard',
    },
  },
  // Environmental Records
  {
    id: 'rec-008',
    title: 'Environmental Impact Assessment - Riverside Development',
    description: 'Complete environmental impact assessment for proposed Riverside Development Project including consultant reports, public comments, agency correspondence, and permits.',
    source: 'Environmental Services',
    relevanceScore: 0.89,
    confidence: 'high',
    keyPhrases: ['environmental impact', 'Riverside Development', 'consultant reports', 'permits'],
    distanceScore: 0.11,
    recordType: 'Environmental Report',
    dateCreated: '2024-06-15',
    agency: 'Public Works',
    metadata: {
      fileSize: '8.7 MB',
      pageCount: 156,
      lastModified: '2025-03-20',
      classification: 'Standard',
    },
  },
  {
    id: 'rec-009',
    title: 'Municipal Water Quality Test Results - 2024-2025',
    description: 'Comprehensive water quality testing results for municipal water supply including lab reports, EPA compliance documentation, and corrective action records.',
    source: 'Environmental Services',
    relevanceScore: 0.94,
    confidence: 'high',
    keyPhrases: ['water quality', 'test results', 'lab reports', 'EPA compliance'],
    distanceScore: 0.06,
    recordType: 'Lab Report',
    dateCreated: '2025-07-31',
    agency: 'Public Works',
    metadata: {
      fileSize: '2.6 MB',
      pageCount: 34,
      lastModified: '2025-08-15',
      classification: 'Standard',
    },
  },
  // Building/Code Enforcement
  {
    id: 'rec-010',
    title: 'Building Code Violations - Downtown District (Zip 12345)',
    description: 'Building code violation notices, citations, and inspection reports for downtown district properties. Includes violation types, correction timelines, and compliance status.',
    source: 'Code Enforcement',
    relevanceScore: 0.96,
    confidence: 'high',
    keyPhrases: ['building code violations', 'downtown district', 'inspection reports', 'citations'],
    distanceScore: 0.04,
    recordType: 'Code Violation',
    dateCreated: '2024-12-31',
    agency: 'Public Works',
    metadata: {
      fileSize: '4.2 MB',
      pageCount: 89,
      lastModified: '2025-09-15',
      classification: 'Standard',
    },
  },
  {
    id: 'rec-011',
    title: 'Building Permit Processing Data - Residential Construction',
    description: 'Building permit database including fees collected, processing times, approval rates, and permit types for residential construction. Statistical analysis ready data.',
    source: 'Building Department',
    relevanceScore: 0.91,
    confidence: 'high',
    keyPhrases: ['building permit', 'processing times', 'residential construction', 'approval rates'],
    distanceScore: 0.09,
    recordType: 'Statistical Data',
    dateCreated: '2025-09-01',
    agency: 'Public Works',
    metadata: {
      fileSize: '1.9 MB',
      pageCount: 45,
      lastModified: '2025-09-20',
      classification: 'Standard',
    },
  },
  // Additional Supporting Records
  {
    id: 'rec-012',
    title: 'Officer Body Camera Footage Logs - Q3 2025',
    description: 'Index of body camera footage recordings with timestamps, incident references, and retention schedules. Actual footage requires separate request and review process.',
    source: 'Police Records',
    relevanceScore: 0.85,
    confidence: 'medium',
    keyPhrases: ['body camera', 'footage logs', 'incident references', 'recordings'],
    distanceScore: 0.15,
    recordType: 'Media Index',
    dateCreated: '2025-09-30',
    agency: 'Police',
    metadata: {
      fileSize: '652 KB',
      pageCount: 12,
      lastModified: '2025-10-01',
      classification: 'Restricted',
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