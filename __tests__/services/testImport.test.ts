/**
 * Simple import test to verify module loading
 */

describe('Module Import Test', () => {
  test('should import agency redaction rules service', async () => {
    const module = await import(
      '../../src/services/agencyRedactionRulesService'
    );
    console.log('Module keys:', Object.keys(module));
    console.log('Service instance:', !!module.agencyRedactionRulesService);
    console.log(
      'Service methods:',
      Object.getOwnPropertyNames(
        Object.getPrototypeOf(module.agencyRedactionRulesService || {})
      )
    );

    expect(module).toBeDefined();
    expect(module.agencyRedactionRulesService).toBeDefined();
    expect(module.SensitivityLevel).toBeDefined();
  });
});
