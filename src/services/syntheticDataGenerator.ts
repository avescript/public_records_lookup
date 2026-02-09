/**
 * Synthetic Data Generator Service v2
 * Epic 8: Synthetic Data & Public Domain Corpus
 * US-080: Load synthetic dataset v2 for multi-agency testing
 *
 * Generates comprehensive synthetic datasets using templates for:
 * - Multi-agency requests with realistic complexity
 * - Enhanced document corpus with varied types
 * - Realistic personas and request patterns
 * - Edge cases and performance testing data
 */

import { RequestFormDataWithFiles } from '../components/request/RequestForm/types';
import {
  DOCUMENT_TEMPLATES,
  REQUEST_TEMPLATES,
  SYNTHETIC_AGENCIES,
  SYNTHETIC_PERSONAS,
  SyntheticAgency,
  SyntheticDocumentTemplate,
  SyntheticPersona,
  SyntheticRequestTemplate,
  TEMPLATE_VARIABLES,
} from '../data/syntheticDataTemplates';
import { MatchCandidate } from '../services/aiMatchingService';

export interface GeneratedRequest extends RequestFormDataWithFiles {
  id?: string;
  trackingId?: string;
  expectedMatches?: string[]; // Document IDs that should match this request
  complexity: 'simple' | 'medium' | 'complex';
  persona: SyntheticPersona;
  agency: SyntheticAgency;
  generatedAt: string;
  testScenario?: string;
}

export interface GeneratedDocument extends MatchCandidate {
  template: SyntheticDocumentTemplate;
  generatedAt: string;
  syntheticMetadata: {
    documentType: 'pdf' | 'email' | 'spreadsheet' | 'image' | 'form';
    classification: 'public' | 'standard' | 'restricted' | 'confidential';
    piiTypes: string[];
    relatedDocuments: string[];
    realismScore: number; // 0.0-1.0
  };
}

export interface SyntheticDataSet {
  metadata: {
    generatedAt: string;
    version: string;
    totalRequests: number;
    totalDocuments: number;
    agencies: string[];
    complexity: {
      simple: number;
      medium: number;
      complex: number;
    };
    testScenarios: string[];
  };
  requests: GeneratedRequest[];
  documents: GeneratedDocument[];
  analytics: {
    requestsByAgency: Record<string, number>;
    documentsByAgency: Record<string, number>;
    complexityDistribution: Record<string, number>;
    averageExpectedMatches: number;
  };
}

export class SyntheticDataGenerator {
  private usedTrackingIds: Set<string> = new Set();
  private usedDocumentIds: Set<string> = new Set();
  private requestCounter = 1;
  private documentCounter = 1;

  /**
   * Generate a complete synthetic dataset
   */
  generateDataset(options: {
    requestCount: number;
    documentsPerAgency: number;
    includeEdgeCases: boolean;
    includePerformanceData: boolean;
  }): SyntheticDataSet {
    console.log('🎯 [Synthetic Data] Generating enhanced dataset v2...');

    const startTime = Date.now();
    const requests: GeneratedRequest[] = [];
    const documents: GeneratedDocument[] = [];

    // Generate documents first (requests will reference them)
    for (const agency of SYNTHETIC_AGENCIES) {
      const agencyDocuments = this.generateDocumentsForAgency(
        agency,
        options.documentsPerAgency
      );
      documents.push(...agencyDocuments);
    }

    // Generate requests with realistic distribution
    const requestDistribution = this.calculateRequestDistribution(
      options.requestCount
    );

    for (const [agencyId, count] of Object.entries(requestDistribution)) {
      const agency = SYNTHETIC_AGENCIES.find(a => a.id === agencyId);
      if (agency) {
        const agencyRequests = this.generateRequestsForAgency(
          agency,
          count,
          documents
        );
        requests.push(...agencyRequests);
      }
    }

    // Add edge cases if requested
    if (options.includeEdgeCases) {
      const edgeCases = this.generateEdgeCaseRequests(documents);
      requests.push(...edgeCases);
    }

    // Add performance testing data if requested
    if (options.includePerformanceData) {
      const perfRequests = this.generatePerformanceTestRequests(documents);
      requests.push(...perfRequests);
    }

    const generationTime = Date.now() - startTime;
    console.log(
      `✅ [Synthetic Data] Generated ${requests.length} requests and ${documents.length} documents in ${generationTime}ms`
    );

    return this.createDataSet(requests, documents);
  }

  /**
   * Generate documents for a specific agency
   */
  private generateDocumentsForAgency(
    agency: SyntheticAgency,
    count: number
  ): GeneratedDocument[] {
    const documents: GeneratedDocument[] = [];
    const agencyTemplates = DOCUMENT_TEMPLATES.filter(
      t => t.agency === agency.id
    );

    for (let i = 0; i < count; i++) {
      const template = this.selectRandomTemplate(agencyTemplates);
      const document = this.generateDocumentFromTemplate(template, agency);
      documents.push(document);
    }

    return documents;
  }

  /**
   * Generate a document from a template
   */
  private generateDocumentFromTemplate(
    template: SyntheticDocumentTemplate,
    agency: SyntheticAgency
  ): GeneratedDocument {
    const variables = this.generateTemplateVariables();
    const title = this.substituteVariables(template.title, variables);
    const description = this.substituteVariables(
      template.description,
      variables
    );

    const pageCount = this.randomInRange(
      template.pageRange[0],
      template.pageRange[1]
    );
    const fileSize = this.generateFileSize(
      template.fileSizeRange[0],
      template.fileSizeRange[1]
    );

    return {
      id: this.generateDocumentId(),
      title,
      description,
      source: template.source,
      recordType: template.recordType,
      dateCreated: this.generateRealisticDate(),
      agency: agency.name,
      relevanceScore: this.generateRelevanceScore(template.classification),
      confidence: this.generateConfidence(template.classification),
      keyPhrases: [...template.keyPhrases],
      distanceScore: Math.random() * 0.3, // Lower is better
      metadata: {
        fileSize,
        pageCount,
        lastModified: this.generateRecentDate(),
        classification: template.classification,
      },
      template,
      generatedAt: new Date().toISOString(),
      syntheticMetadata: {
        documentType: template.documentType,
        classification: template.classification,
        piiTypes: [...template.piiTypes],
        relatedDocuments: template.relatedDocuments || [],
        realismScore: this.calculateRealismScore(template, agency),
      },
    };
  }

  /**
   * Generate requests for a specific agency
   */
  private generateRequestsForAgency(
    agency: SyntheticAgency,
    count: number,
    documents: GeneratedDocument[]
  ): GeneratedRequest[] {
    const requests: GeneratedRequest[] = [];
    const agencyTemplates = REQUEST_TEMPLATES.filter(
      t => t.agency === agency.id
    );
    const agencyDocuments = documents.filter(
      d =>
        d.syntheticMetadata.classification !== 'confidential' ||
        Math.random() > 0.8
    );

    for (let i = 0; i < count; i++) {
      const template = this.selectRandomTemplate(agencyTemplates);
      const persona = this.selectPersonaForAgency(agency);
      const request = this.generateRequestFromTemplate(
        template,
        persona,
        agency,
        agencyDocuments
      );
      requests.push(request);
    }

    return requests;
  }

  /**
   * Generate a request from a template
   */
  private generateRequestFromTemplate(
    template: SyntheticRequestTemplate,
    persona: SyntheticPersona,
    agency: SyntheticAgency,
    availableDocuments: GeneratedDocument[]
  ): GeneratedRequest {
    const variables = this.generateTemplateVariables();
    const title = this.substituteVariables(template.title, variables);
    const description = this.substituteVariables(
      template.description,
      variables
    );

    // Find matching documents based on keywords
    const expectedMatches = this.findMatchingDocuments(
      template,
      availableDocuments
    );

    // Generate realistic date range
    const dateRange = this.generateDateRange(template.complexity);

    return {
      title,
      department: agency.name,
      description,
      dateRange,
      contactEmail: persona.email,
      files: [], // No files for synthetic data
      expectedMatches: expectedMatches.map(d => d.id),
      complexity: template.complexity,
      persona,
      agency,
      generatedAt: new Date().toISOString(),
      testScenario: this.generateTestScenario(template, persona),
    };
  }

  /**
   * Find documents that should match a request template
   */
  private findMatchingDocuments(
    template: SyntheticRequestTemplate,
    documents: GeneratedDocument[]
  ): GeneratedDocument[] {
    const matches: GeneratedDocument[] = [];

    // Look for documents with overlapping keywords
    for (const document of documents) {
      const keywordOverlap = this.calculateKeywordOverlap(
        template.commonKeywords,
        document.keyPhrases
      );
      const agencyMatch = document.template.agency === template.agency;

      // Higher chance of match if same agency and good keyword overlap
      const matchProbability = agencyMatch
        ? keywordOverlap * 0.8 + 0.2
        : keywordOverlap * 0.3;

      if (matchProbability > 0.4 && Math.random() < matchProbability) {
        matches.push(document);
      }

      // Ensure we have at least some matches for each request
      if (matches.length >= template.expectedRecordCount) {
        break;
      }
    }

    // If we don't have enough matches, add some random ones from the same agency
    if (matches.length < Math.max(1, template.expectedRecordCount * 0.3)) {
      const agencyDocs = documents.filter(
        d => d.template.agency === template.agency && !matches.includes(d)
      );

      const additionalMatches = this.selectRandomItems(
        agencyDocs,
        Math.max(1, template.expectedRecordCount * 0.3) - matches.length
      );

      matches.push(...additionalMatches);
    }

    return matches.slice(0, template.expectedRecordCount);
  }

  /**
   * Generate edge case requests for testing
   */
  private generateEdgeCaseRequests(
    documents: GeneratedDocument[]
  ): GeneratedRequest[] {
    const edgeCases: GeneratedRequest[] = [];

    // Edge case 1: Very broad request with many potential matches
    edgeCases.push(
      this.createEdgeCaseRequest(
        'Broad Multi-Agency Request',
        'All records related to public safety, emergency response, and budget expenditures for 2024-2025',
        'All agencies and departments - comprehensive records review',
        documents.slice(0, 50), // Many potential matches
        'citizen',
        'broad_scope_test'
      )
    );

    // Edge case 2: Very specific request with no matches
    edgeCases.push(
      this.createEdgeCaseRequest(
        'Highly Specific No-Match Request',
        'UFO sighting reports filed with the Department of Extraterrestrial Affairs on February 30, 2025',
        "Looking for documentation of alien encounters reported to the city's UFO investigation unit",
        [], // No matches expected
        'citizen',
        'no_matches_test'
      )
    );

    // Edge case 3: High-sensitivity request
    edgeCases.push(
      this.createEdgeCaseRequest(
        'High-Sensitivity Legal Request',
        'All internal affairs investigations involving excessive force allegations',
        'Complete files for all internal affairs cases involving use of force complaints, officer discipline records, and related legal documentation for 2024-2025',
        documents
          .filter(d => d.template.classification === 'confidential')
          .slice(0, 15),
        'lawyer',
        'high_sensitivity_test'
      )
    );

    // Edge case 4: Performance test request
    edgeCases.push(
      this.createEdgeCaseRequest(
        'Large Volume Performance Test',
        'All city records and documents - Complete Database Export',
        'Request for every document in the city database for comprehensive analysis - testing system performance with maximum load',
        documents, // All documents
        'researcher',
        'performance_load_test'
      )
    );

    return edgeCases;
  }

  /**
   * Generate performance testing requests
   */
  private generatePerformanceTestRequests(
    documents: GeneratedDocument[]
  ): GeneratedRequest[] {
    const perfRequests: GeneratedRequest[] = [];

    // Generate requests with various performance characteristics
    const scenarios = [
      { name: 'high_frequency_user', count: 25, persona: 'journalist' },
      { name: 'bulk_researcher', count: 15, persona: 'researcher' },
      { name: 'legal_discovery', count: 12, persona: 'lawyer' },
    ];

    scenarios.forEach(scenario => {
      for (let i = 0; i < scenario.count; i++) {
        const persona =
          SYNTHETIC_PERSONAS.find(p => p.type === scenario.persona) ||
          SYNTHETIC_PERSONAS[0];
        const template = this.selectRandomTemplate(REQUEST_TEMPLATES);

        perfRequests.push(
          this.createEdgeCaseRequest(
            `Performance Test ${scenario.name} #${i + 1}`,
            `Performance testing scenario: ${scenario.name}`,
            `Automated performance test request for scenario ${scenario.name}`,
            this.selectRandomItems(
              documents,
              Math.floor(Math.random() * 20) + 5
            ),
            persona.type,
            `performance_${scenario.name}`
          )
        );
      }
    });

    return perfRequests;
  }

  /**
   * Create an edge case request
   */
  private createEdgeCaseRequest(
    title: string,
    description: string,
    detailedDescription: string,
    expectedMatches: GeneratedDocument[],
    personaType: string,
    scenario: string
  ): GeneratedRequest {
    const persona =
      SYNTHETIC_PERSONAS.find(p => p.type === personaType) ||
      SYNTHETIC_PERSONAS[0];
    const agency = SYNTHETIC_AGENCIES[0]; // Default agency

    return {
      title,
      department: 'Multiple Departments',
      description: detailedDescription,
      dateRange: this.generateDateRange('complex'),
      contactEmail: persona.email,
      files: [],
      expectedMatches: expectedMatches.map(d => d.id),
      complexity: 'complex',
      persona,
      agency,
      generatedAt: new Date().toISOString(),
      testScenario: scenario,
    };
  }

  /**
   * Utility methods
   */
  private selectRandomTemplate<T>(templates: T[]): T {
    return templates[Math.floor(Math.random() * templates.length)];
  }

  private selectRandomItems<T>(items: T[], count: number): T[] {
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  private selectPersonaForAgency(agency: SyntheticAgency): SyntheticPersona {
    // Find personas that prefer this agency
    const preferredPersonas = SYNTHETIC_PERSONAS.filter(p =>
      p.requestPatterns.preferredAgencies.includes(agency.id)
    );

    if (preferredPersonas.length > 0) {
      return this.selectRandomTemplate(preferredPersonas);
    }

    return this.selectRandomTemplate(SYNTHETIC_PERSONAS);
  }

  private generateTemplateVariables(): Record<string, string> {
    const variables: Record<string, string> = {};

    Object.entries(TEMPLATE_VARIABLES).forEach(([key, values]) => {
      variables[key] = this.selectRandomTemplate(values);
    });

    // Add some dynamic variables
    variables.reportNumber = Math.floor(Math.random() * 9999) + 1000;
    variables.callNumber = Math.floor(Math.random() * 999999) + 100000;
    variables.officerName = this.generateOfficerName();
    variables.businessName = this.generateBusinessName();
    variables.vendorName = this.generateVendorName();
    variables.roadName = this.generateRoadName();
    variables.projectName = this.generateProjectName();
    variables.caseName = this.generateCaseName();
    variables.facilityName = this.generateFacilityName();
    variables.programName = this.generateProgramName();
    variables.month = this.generateMonth();
    variables.year = this.generateYear();

    return variables;
  }

  private substituteVariables(
    template: string,
    variables: Record<string, string>
  ): string {
    let result = template;

    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{${key}}`, 'g');
      result = result.replace(regex, value.toString());
    });

    return result;
  }

  private calculateRequestDistribution(
    totalRequests: number
  ): Record<string, number> {
    const distribution: Record<string, number> = {};

    // Weight distribution based on agency complexity and typical volume
    const weights = {
      police: 0.25,
      fire: 0.15,
      finance: 0.2,
      public_works: 0.2,
      legal: 0.1,
      parks: 0.1,
    };

    Object.entries(weights).forEach(([agencyId, weight]) => {
      distribution[agencyId] = Math.max(1, Math.round(totalRequests * weight));
    });

    return distribution;
  }

  private calculateKeywordOverlap(
    keywords1: string[],
    keywords2: string[]
  ): number {
    const set1 = new Set(keywords1.map(k => k.toLowerCase()));
    const set2 = new Set(keywords2.map(k => k.toLowerCase()));

    const intersection = new Set([...set1].filter(k => set2.has(k)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
  }

  private generateDocumentId(): string {
    let id: string;
    do {
      id = `doc-synth-${String(this.documentCounter++).padStart(4, '0')}`;
    } while (this.usedDocumentIds.has(id));

    this.usedDocumentIds.add(id);
    return id;
  }

  private generateRealisticDate(): string {
    // Generate dates within the last 2 years
    const now = new Date();
    const twoYearsAgo = new Date(
      now.getFullYear() - 2,
      now.getMonth(),
      now.getDate()
    );
    const randomTime =
      twoYearsAgo.getTime() +
      Math.random() * (now.getTime() - twoYearsAgo.getTime());
    return new Date(randomTime).toISOString().split('T')[0];
  }

  private generateRecentDate(): string {
    // Generate dates within the last 6 months
    const now = new Date();
    const sixMonthsAgo = new Date(
      now.getFullYear(),
      now.getMonth() - 6,
      now.getDate()
    );
    const randomTime =
      sixMonthsAgo.getTime() +
      Math.random() * (now.getTime() - sixMonthsAgo.getTime());
    return new Date(randomTime).toISOString();
  }

  private generateDateRange(complexity: 'simple' | 'medium' | 'complex'): {
    startDate: string;
    endDate: string;
    preset?: string;
  } {
    const end = new Date();
    const start = new Date();

    // Adjust range based on complexity
    const daysBack =
      complexity === 'simple' ? 90 : complexity === 'medium' ? 180 : 365;
    start.setDate(end.getDate() - Math.floor(Math.random() * daysBack) - 30);

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      preset: 'custom',
    };
  }

  private generateRelevanceScore(classification: string): number {
    const baseScore = Math.random() * 0.4 + 0.6; // 0.6-1.0

    // Adjust based on classification
    switch (classification) {
      case 'public':
        return Math.min(0.95, baseScore + 0.1);
      case 'standard':
        return baseScore;
      case 'restricted':
        return Math.max(0.7, baseScore - 0.1);
      case 'confidential':
        return Math.max(0.8, baseScore - 0.05);
      default:
        return baseScore;
    }
  }

  private generateConfidence(
    classification: string
  ): 'high' | 'medium' | 'low' {
    const rand = Math.random();

    if (classification === 'confidential') {
      return rand > 0.7 ? 'high' : rand > 0.3 ? 'medium' : 'low';
    } else if (classification === 'public') {
      return rand > 0.2 ? 'high' : rand > 0.1 ? 'medium' : 'low';
    } else {
      return rand > 0.5 ? 'high' : rand > 0.2 ? 'medium' : 'low';
    }
  }

  private generateFileSize(minSize: string, maxSize: string): string {
    const min = this.parseFileSize(minSize);
    const max = this.parseFileSize(maxSize);
    const randomSize = min + Math.random() * (max - min);

    if (randomSize > 1024 * 1024) {
      return `${(randomSize / (1024 * 1024)).toFixed(1)} MB`;
    } else {
      return `${Math.round(randomSize / 1024)} KB`;
    }
  }

  private parseFileSize(sizeStr: string): number {
    const [value, unit] = sizeStr.split(' ');
    const numValue = parseFloat(value);

    switch (unit) {
      case 'KB':
        return numValue * 1024;
      case 'MB':
        return numValue * 1024 * 1024;
      case 'GB':
        return numValue * 1024 * 1024 * 1024;
      default:
        return numValue;
    }
  }

  private randomInRange(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private calculateRealismScore(
    template: SyntheticDocumentTemplate,
    agency: SyntheticAgency
  ): number {
    let score = 0.8; // Base realism score

    // Boost for agency-specific templates
    if (template.agency === agency.id) score += 0.1;

    // Adjust for classification appropriateness
    if (
      agency.complexityWeight > 0.7 &&
      template.classification === 'confidential'
    )
      score += 0.1;
    if (agency.complexityWeight < 0.4 && template.classification === 'public')
      score += 0.1;

    return Math.min(1.0, score);
  }

  private generateTestScenario(
    template: SyntheticRequestTemplate,
    persona: SyntheticPersona
  ): string {
    const scenarios = [
      `${persona.type}_${template.complexity}_request`,
      `${template.agency}_department_inquiry`,
      `${template.complexity}_complexity_test`,
    ];

    return this.selectRandomTemplate(scenarios);
  }

  private createDataSet(
    requests: GeneratedRequest[],
    documents: GeneratedDocument[]
  ): SyntheticDataSet {
    const complexityCount = requests.reduce(
      (acc, req) => {
        acc[req.complexity] = (acc[req.complexity] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const requestsByAgency = requests.reduce(
      (acc, req) => {
        acc[req.agency.id] = (acc[req.agency.id] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const documentsByAgency = documents.reduce(
      (acc, doc) => {
        acc[doc.template.agency] = (acc[doc.template.agency] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const totalExpectedMatches = requests.reduce(
      (sum, req) => sum + req.expectedMatches!.length,
      0
    );

    return {
      metadata: {
        generatedAt: new Date().toISOString(),
        version: '2.0',
        totalRequests: requests.length,
        totalDocuments: documents.length,
        agencies: SYNTHETIC_AGENCIES.map(a => a.id),
        complexity: {
          simple: complexityCount.simple || 0,
          medium: complexityCount.medium || 0,
          complex: complexityCount.complex || 0,
        },
        testScenarios: [
          ...new Set(requests.map(r => r.testScenario || 'standard')),
        ],
      },
      requests,
      documents,
      analytics: {
        requestsByAgency,
        documentsByAgency,
        complexityDistribution: complexityCount,
        averageExpectedMatches: totalExpectedMatches / requests.length,
      },
    };
  }

  // Name generators for realistic data
  private generateOfficerName(): string {
    const firstNames = [
      'John',
      'Sarah',
      'Michael',
      'Jennifer',
      'David',
      'Lisa',
      'Robert',
      'Mary',
    ];
    const lastNames = [
      'Johnson',
      'Smith',
      'Williams',
      'Brown',
      'Jones',
      'Garcia',
      'Miller',
      'Davis',
    ];
    return `${this.selectRandomTemplate(firstNames)} ${this.selectRandomTemplate(lastNames)}`;
  }

  private generateBusinessName(): string {
    const businesses = [
      'Downtown Cafe',
      'City Mall',
      'Metro Hospital',
      'Tech Solutions Inc',
      'Green Valley School',
    ];
    return this.selectRandomTemplate(businesses);
  }

  private generateVendorName(): string {
    const vendors = [
      'ABC Construction',
      'Tech Services LLC',
      'Professional Consulting Group',
      'City Maintenance Co',
    ];
    return this.selectRandomTemplate(vendors);
  }

  private generateRoadName(): string {
    const roads = [
      'Main Street Bridge',
      'Highway 99 Corridor',
      'Oak Avenue Infrastructure',
      'Downtown Traffic System',
    ];
    return this.selectRandomTemplate(roads);
  }

  private generateProjectName(): string {
    const projects = [
      'Riverside Development',
      'Downtown Revitalization',
      'Green Infrastructure Initiative',
      'Transit Hub Project',
    ];
    return this.selectRandomTemplate(projects);
  }

  private generateCaseName(): string {
    const cases = [
      'Johnson',
      'Smith',
      'Environmental Group',
      'Citizens Coalition',
      'Local Business Alliance',
    ];
    return this.selectRandomTemplate(cases);
  }

  private generateFacilityName(): string {
    const facilities = [
      'Community Center',
      'Sports Complex',
      'Senior Center',
      'Aquatic Facility',
      'Park Pavilion',
    ];
    return this.selectRandomTemplate(facilities);
  }

  private generateProgramName(): string {
    const programs = [
      'Youth Sports League',
      'Senior Fitness Program',
      'Summer Camp',
      'Art Classes',
      'Swimming Lessons',
    ];
    return this.selectRandomTemplate(programs);
  }

  private generateMonth(): string {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return this.selectRandomTemplate(months);
  }

  private generateYear(): string {
    const years = ['2024', '2025', '2026'];
    return this.selectRandomTemplate(years);
  }
}

export default SyntheticDataGenerator;
