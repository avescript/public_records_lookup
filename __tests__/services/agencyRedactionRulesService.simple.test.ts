/**
 * Agency Redaction Rules Service Tests (Simplified)
 * Epic 9 Task 4: Agency-Specific Redaction Rules
 */

// Mock localStorage
const mockLocalStorage = {
  store: {} as Record<string, string>,
  getItem: jest.fn((key: string) => mockLocalStorage.store[key] || null),
  setItem: jest.fn((key: string, value: string) => {
    mockLocalStorage.store[key] = value;
  }),
  removeItem: jest.fn((key: string) => {
    delete mockLocalStorage.store[key];
  }),
  clear: jest.fn(() => {
    mockLocalStorage.store = {};
  }),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('AgencyRedactionRulesService - Basic Tests', () => {
  let agencyRedactionRulesService: any;

  beforeAll(async () => {
    const module = await import('../../src/services/agencyRedactionRulesService');
    agencyRedactionRulesService = module.agencyRedactionRulesService;
  });

  beforeEach(() => {
    mockLocalStorage.clear();
  });

  test('should load service successfully', () => {
    expect(agencyRedactionRulesService).toBeDefined();
    expect(typeof agencyRedactionRulesService.getAgencyTemplate).toBe('function');
  });

  test('should get default template for police agency', async () => {
    const template = await agencyRedactionRulesService.getAgencyTemplate('police');
    
    expect(template).toBeDefined();
    expect(template.agencyId).toBe('police');
    expect(template.agencyName).toBe('Police Department');
    expect(Array.isArray(template.rules)).toBe(true);
    expect(template.rules.length).toBeGreaterThan(0);
    expect(template.version).toBe('1.0.0');
  });

  test('should get default template for fire agency', async () => {
    const template = await agencyRedactionRulesService.getAgencyTemplate('fire');
    
    expect(template).toBeDefined();
    expect(template.agencyId).toBe('fire');
    expect(template.agencyName).toBe('Fire Department');
    expect(Array.isArray(template.rules)).toBe(true);
    expect(template.rules.length).toBeGreaterThan(0);
    expect(template.version).toBe('1.0.0');
  });

  test('should return null for unknown agency', async () => {
    const template = await agencyRedactionRulesService.getAgencyTemplate('unknown-agency');
    expect(template).toBeNull();
  });

  test('should get all templates', async () => {
    const templates = await agencyRedactionRulesService.getAllTemplates();
    
    expect(Array.isArray(templates)).toBe(true);
    expect(templates.length).toBe(5);
    
    const agencyIds = templates.map((t: any) => t.agencyId);
    expect(agencyIds).toContain('police');
    expect(agencyIds).toContain('fire');
    expect(agencyIds).toContain('finance');
    expect(agencyIds).toContain('parks');
    expect(agencyIds).toContain('health');
  });

  test('should get agency rules summary', async () => {
    const testAgencyId = 'police';
    const summary = await agencyRedactionRulesService.getAgencyRulesSummary(testAgencyId);
    
    expect(summary).toBeDefined();
    expect(typeof summary.totalRules).toBe('number');
    expect(typeof summary.autoApplyRules).toBe('number');
    expect(typeof summary.approvalRequiredRules).toBe('number');
    expect(summary.bySensitivity).toBeDefined();
    expect(summary.byPIIType).toBeDefined();
  });

  test('should get auto-apply rules', async () => {
    const testAgencyId = 'police';
    const autoApplyRules = await agencyRedactionRulesService.getAutoApplyRules(testAgencyId);
    
    expect(Array.isArray(autoApplyRules)).toBe(true);
    autoApplyRules.forEach((rule: any) => {
      expect(rule.autoApply).toBe(true);
    });
  });

  test('should get approval required rules', async () => {
    const testAgencyId = 'police';
    const approvalRules = await agencyRedactionRulesService.getApprovalRequiredRules(testAgencyId);
    
    expect(Array.isArray(approvalRules)).toBe(true);
    approvalRules.forEach((rule: any) => {
      expect(rule.requiresApproval).toBe(true);
    });
  });
});