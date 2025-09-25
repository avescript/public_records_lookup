import { PIIDetectionService, PIIType, PIIFindingsResult } from '../../src/services/piiDetectionService';

// Mock fetch function
global.fetch = jest.fn();

describe('PIIDetectionService', () => {
  let service: PIIDetectionService;
  const mockCSVData = `recordId,fileName,pageNumber,piiType,confidence,x,y,width,height,text,reasoning
1,police_report_001.pdf,1,SSN,0.95,150,200,120,15,"123-45-6789","Pattern matches XXX-XX-XXXX format"
1,police_report_001.pdf,1,PHONE,0.88,275,200,100,15,"(555) 123-4567","Pattern matches US phone number format"
1,police_report_001.pdf,2,PERSON_NAME,0.91,100,150,150,15,"John Michael Smith","Named entity recognition - person"
2,incident_report_002.pdf,1,SSN,0.93,180,180,120,15,"987-65-4321","Pattern matches XXX-XX-XXXX format"
2,incident_report_002.pdf,1,DOB,0.87,200,220,80,15,"01/15/1985","Date pattern suggesting birth date"`;

  beforeEach(() => {
    service = new PIIDetectionService();
    // Reset the service state
    (service as any).initialized = false;
    (service as any).findings = [];
    
    // Mock successful fetch response
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(mockCSVData),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should load and parse CSV data successfully', async () => {
      await service.initialize();

      expect(fetch).toHaveBeenCalledWith('/mock-data/redactions.csv');
      expect((service as any).initialized).toBe(true);
      expect((service as any).findings).toHaveLength(5);
    });

    it('should not reinitialize if already initialized', async () => {
      await service.initialize();
      await service.initialize();

      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should handle fetch errors', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        statusText: 'Not Found',
      });

      await expect(service.initialize()).rejects.toThrow('Failed to load redactions.csv: Not Found');
    });

    it('should handle network errors', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(service.initialize()).rejects.toThrow('Network error');
    });
  });

  describe('parseCSV', () => {
    it('should correctly parse valid CSV data', async () => {
      await service.initialize();
      const findings = (service as any).findings;

      expect(findings[0]).toEqual({
        recordId: '1',
        fileName: 'police_report_001.pdf',
        pageNumber: 1,
        piiType: 'SSN',
        confidence: 0.95,
        x: 150,
        y: 200,
        width: 120,
        height: 15,
        text: '123-45-6789',
        reasoning: 'Pattern matches XXX-XX-XXXX format',
      });
    });

    it('should handle quoted values in CSV', async () => {
      const csvWithQuotes = `recordId,fileName,pageNumber,piiType,confidence,x,y,width,height,text,reasoning
1,test.pdf,1,ADDRESS,0.82,150,250,200,30,"123 Main St, Anytown, CA","Contains street address components"`;

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(csvWithQuotes),
      });

      await service.initialize();
      const findings = (service as any).findings;

      expect(findings[0].text).toBe('123 Main St, Anytown, CA');
      expect(findings[0].reasoning).toBe('Contains street address components');
    });

    it('should skip malformed CSV lines', async () => {
      const malformedCSV = `recordId,fileName,pageNumber,piiType,confidence,x,y,width,height,text,reasoning
1,test.pdf,1,SSN,0.95,150,200,120,15,"123-45-6789","Valid line"
invalid,line
2,test2.pdf,1,PHONE,0.88,100,100,100,15,"555-1234","Another valid line"`;

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(malformedCSV),
      });

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      await service.initialize();
      const findings = (service as any).findings;

      expect(findings).toHaveLength(2); // Should skip the malformed line
      expect(consoleSpy).toHaveBeenCalledWith('Skipping malformed CSV line 3');
      
      consoleSpy.mockRestore();
    });
  });

  describe('getFindingsForRecord', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should return findings for a specific record', async () => {
      const result = await service.getFindingsForRecord('1');

      expect(result.recordId).toBe('1');
      expect(result.totalFindings).toBe(3);
      expect(result.findings).toHaveLength(3);
      expect(result.highConfidenceFindings).toBe(3); // SSN (0.95), PHONE (0.88), and PERSON_NAME (0.91)
      expect(result.piiTypesDetected).toEqual(expect.arrayContaining([PIIType.SSN, PIIType.PHONE, PIIType.PERSON_NAME]));
    });

    it('should return empty result for non-existent record', async () => {
      const result = await service.getFindingsForRecord('999');

      expect(result.recordId).toBe('999');
      expect(result.totalFindings).toBe(0);
      expect(result.findings).toHaveLength(0);
      expect(result.highConfidenceFindings).toBe(0);
      expect(result.piiTypesDetected).toHaveLength(0);
    });

    it('should initialize service if not already initialized', async () => {
      const newService = new PIIDetectionService();
      const initSpy = jest.spyOn(newService, 'initialize');

      await newService.getFindingsForRecord('1');

      expect(initSpy).toHaveBeenCalled();
    });
  });

  describe('getFindingsForPage', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should return findings for a specific file and page', async () => {
      const findings = await service.getFindingsForPage('1', 'police_report_001.pdf', 1);

      expect(findings).toHaveLength(2); // SSN and PHONE on page 1
      expect(findings[0].piiType).toBe('SSN');
      expect(findings[1].piiType).toBe('PHONE');
    });

    it('should return empty array for non-matching criteria', async () => {
      const findings = await service.getFindingsForPage('1', 'nonexistent.pdf', 1);

      expect(findings).toHaveLength(0);
    });
  });

  describe('getAllPIITypes', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should return all unique PII types', async () => {
      const types = await service.getAllPIITypes();

      expect(types).toEqual(expect.arrayContaining([
        PIIType.SSN,
        PIIType.PHONE,
        PIIType.PERSON_NAME,
        PIIType.DOB,
      ]));
      expect(types).toHaveLength(4);
    });
  });

  describe('getConfidenceStats', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should return confidence statistics for all findings', async () => {
      const stats = await service.getConfidenceStats();

      expect(stats.totalCount).toBe(5);
      expect(stats.highConfidenceCount).toBe(5); // All ≥0.8: 0.95, 0.88, 0.91, 0.93, 0.87
      expect(stats.minimum).toBe(0.87);
      expect(stats.maximum).toBe(0.95);
      expect(stats.average).toBeCloseTo(0.908, 2); // (0.95 + 0.88 + 0.91 + 0.93 + 0.87) / 5
    });

    it('should return confidence statistics for specific record', async () => {
      const stats = await service.getConfidenceStats('1');

      expect(stats.totalCount).toBe(3);
      expect(stats.highConfidenceCount).toBe(3); // 0.95, 0.88, 0.91
      expect(stats.minimum).toBe(0.88);
      expect(stats.maximum).toBe(0.95);
      expect(stats.average).toBeCloseTo(0.913, 2); // (0.95 + 0.88 + 0.91) / 3
    });

    it('should return zero stats for empty results', async () => {
      const stats = await service.getConfidenceStats('999');

      expect(stats).toEqual({
        average: 0,
        minimum: 0,
        maximum: 0,
        highConfidenceCount: 0,
        totalCount: 0,
      });
    });
  });

  describe('parseCSVLine', () => {
    it('should handle simple comma-separated values', () => {
      const line = '1,test.pdf,1,SSN,0.95,100,200,50,20,123-45-6789,Pattern match';
      const result = (service as any).parseCSVLine(line);

      expect(result).toEqual([
        '1', 'test.pdf', '1', 'SSN', '0.95', '100', '200', '50', '20', '123-45-6789', 'Pattern match'
      ]);
    });

    it('should handle quoted values with commas', () => {
      const line = '1,test.pdf,1,ADDRESS,0.85,100,200,150,30,"123 Main St, City, State","Address with commas"';
      const result = (service as any).parseCSVLine(line);

      expect(result).toEqual([
        '1', 'test.pdf', '1', 'ADDRESS', '0.85', '100', '200', '150', '30', '123 Main St, City, State', 'Address with commas'
      ]);
    });

    it('should handle mixed quoted and unquoted values', () => {
      const line = '1,"file name.pdf",1,SSN,0.95,100,200,50,20,"123-45-6789",Pattern match';
      const result = (service as any).parseCSVLine(line);

      expect(result).toEqual([
        '1', 'file name.pdf', '1', 'SSN', '0.95', '100', '200', '50', '20', '123-45-6789', 'Pattern match'
      ]);
    });
  });

  describe('PIIType enum', () => {
    it('should have all expected PII types', () => {
      const expectedTypes = [
        'SSN', 'PHONE', 'ADDRESS', 'PERSON_NAME', 'EMAIL', 'DOB',
        'DRIVERS_LICENSE', 'ACCOUNT_NUMBER', 'ROUTING_NUMBER', 'MEDICAL_ID'
      ];

      expectedTypes.forEach(type => {
        expect(Object.values(PIIType)).toContain(type);
      });
    });
  });
});