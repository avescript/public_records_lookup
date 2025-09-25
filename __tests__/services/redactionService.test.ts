/**
 * RedactionService Tests
 * Comprehensive test suite for redaction storage, versioning, and management
 */

import { RedactionService, ManualRedaction, RedactionVersion } from '../../src/services/redactionService';

describe('RedactionService', () => {
  let redactionService: RedactionService;
  const mockRecordId = 'test_record_123';
  const mockFileName = 'test_document.pdf';
  const mockUserId = 'staff_user_001';

  beforeEach(() => {
    redactionService = new RedactionService();
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Basic CRUD Operations', () => {
    test('should add a new redaction', async () => {
      const coordinates = { x: 100, y: 200, width: 150, height: 50 };
      const reason = 'Contains SSN';

      const redaction = await redactionService.addRedaction(
        mockRecordId,
        mockFileName,
        1,
        coordinates,
        reason
      );

      expect(redaction).toMatchObject({
        recordId: mockRecordId,
        fileName: mockFileName,
        pageNumber: 1,
        x: coordinates.x,
        y: coordinates.y,
        width: coordinates.width,
        height: coordinates.height,
        reason: reason,
        createdBy: mockUserId,
        type: 'manual',
      });
      expect(redaction.id).toBeDefined();
      expect(redaction.createdAt).toBeDefined();
    });

    test('should retrieve redactions for a record', async () => {
      const coordinates1 = { x: 100, y: 200, width: 150, height: 50 };
      const coordinates2 = { x: 300, y: 400, width: 100, height: 30 };

      await redactionService.addRedaction(mockRecordId, mockFileName, 1, coordinates1);
      await redactionService.addRedaction(mockRecordId, mockFileName, 2, coordinates2);

      const redactions = await redactionService.getRedactionsForRecord(mockRecordId, mockFileName);

      expect(redactions).toHaveLength(2);
      expect(redactions[0].pageNumber).toBe(1);
      expect(redactions[1].pageNumber).toBe(2);
    });

    test('should update an existing redaction', async () => {
      const originalCoordinates = { x: 100, y: 200, width: 150, height: 50 };
      const newCoordinates = { x: 120, y: 220, width: 170, height: 60 };

      const redaction = await redactionService.addRedaction(
        mockRecordId,
        mockFileName,
        1,
        originalCoordinates
      );

      const updatedRedaction = await redactionService.updateRedaction(
        mockRecordId,
        mockFileName,
        redaction.id,
        newCoordinates
      );

      expect(updatedRedaction).toMatchObject({
        ...redaction,
        ...newCoordinates,
      });
    });

    test('should delete a redaction', async () => {
      const coordinates = { x: 100, y: 200, width: 150, height: 50 };
      const redaction = await redactionService.addRedaction(
        mockRecordId,
        mockFileName,
        1,
        coordinates
      );

      const result = await redactionService.removeRedaction(
        mockRecordId,
        mockFileName,
        redaction.id
      );

      expect(result).toBe(true);

      const redactions = await redactionService.getRedactionsForRecord(mockRecordId, mockFileName);
      expect(redactions).toHaveLength(0);
    });

    test('should return null for non-existent redaction update', async () => {
      const result = await redactionService.updateRedaction(
        mockRecordId,
        mockFileName,
        'non_existent_id',
        { x: 0, y: 0, width: 10, height: 10 }
      );

      expect(result).toBeNull();
    });

    test('should return false for non-existent redaction deletion', async () => {
      const result = await redactionService.removeRedaction(
        mockRecordId,
        mockFileName,
        'non_existent_id'
      );

      expect(result).toBe(false);
    });
  });

  describe('Page-specific Operations', () => {
    test('should retrieve redactions for a specific page', async () => {
      const page1Coords = { x: 100, y: 200, width: 150, height: 50 };
      const page2Coords = { x: 300, y: 400, width: 100, height: 30 };

      await redactionService.addRedaction(mockRecordId, mockFileName, 1, page1Coords);
      await redactionService.addRedaction(mockRecordId, mockFileName, 2, page2Coords);
      await redactionService.addRedaction(mockRecordId, mockFileName, 1, page1Coords);

      const page1Redactions = await redactionService.getRedactionsForPage(
        mockRecordId,
        mockFileName,
        1
      );
      const page2Redactions = await redactionService.getRedactionsForPage(
        mockRecordId,
        mockFileName,
        2
      );

      expect(page1Redactions).toHaveLength(2);
      expect(page2Redactions).toHaveLength(1);
      expect(page1Redactions[0].pageNumber).toBe(1);
      expect(page2Redactions[0].pageNumber).toBe(2);
    });
  });

  describe('Version Management', () => {
    test('should create a version when adding redaction', async () => {
      const coordinates = { x: 100, y: 200, width: 150, height: 50 };
      await redactionService.addRedaction(mockRecordId, mockFileName, 1, coordinates);

      const versions = await redactionService.getVersionHistory(mockRecordId, mockFileName);

      expect(versions).toHaveLength(1);
      expect(versions[0]).toMatchObject({
        recordId: mockRecordId,
        fileName: mockFileName,
        status: 'draft',
        createdBy: mockUserId,
      });
      expect(versions[0].redactions).toHaveLength(1);
    });

    test('should save a version explicitly', async () => {
      const coordinates = { x: 100, y: 200, width: 150, height: 50 };
      await redactionService.addRedaction(mockRecordId, mockFileName, 1, coordinates);

      const notes = 'Initial redaction set';
      const savedVersion = await redactionService.saveVersion(mockRecordId, mockFileName, notes);

      expect(savedVersion).toMatchObject({
        status: 'saved',
        notes: notes,
      });

      const versions = await redactionService.getVersionHistory(mockRecordId, mockFileName);
      // Should have both the draft version and the saved version
      expect(versions.length).toBeGreaterThanOrEqual(1);
      expect(versions.some((v: RedactionVersion) => v.status === 'saved')).toBe(true);
    });

    test('should load a specific version', async () => {
      // Add initial redactions
      const coords1 = { x: 100, y: 200, width: 150, height: 50 };
      const coords2 = { x: 300, y: 400, width: 100, height: 30 };
      await redactionService.addRedaction(mockRecordId, mockFileName, 1, coords1);
      await redactionService.addRedaction(mockRecordId, mockFileName, 1, coords2);

      // Save version
      const version = await redactionService.saveVersion(mockRecordId, mockFileName);

      // Add more redactions
      const coords3 = { x: 500, y: 600, width: 75, height: 25 };
      await redactionService.addRedaction(mockRecordId, mockFileName, 2, coords3);

      // Load the saved version
      const loadedRedactions = await redactionService.loadVersion(
        mockRecordId,
        mockFileName,
        version.versionId
      );

      expect(loadedRedactions).toHaveLength(2);
      expect(loadedRedactions.every((r: ManualRedaction) => r.pageNumber === 1)).toBe(true);

      // Verify current redactions match the loaded version
      const currentRedactions = await redactionService.getRedactionsForRecord(
        mockRecordId,
        mockFileName
      );
      expect(currentRedactions).toEqual(loadedRedactions);
    });

    test('should mark version as exported', async () => {
      const coordinates = { x: 100, y: 200, width: 150, height: 50 };
      await redactionService.addRedaction(mockRecordId, mockFileName, 1, coordinates);
      const version = await redactionService.saveVersion(mockRecordId, mockFileName);

      const result = await redactionService.markVersionExported(
        mockRecordId,
        mockFileName,
        version.versionId
      );

      expect(result).toBe(true);

      const versions = await redactionService.getVersionHistory(mockRecordId, mockFileName);
      const exportedVersion = versions.find((v: RedactionVersion) => v.versionId === version.versionId);
      expect(exportedVersion?.status).toBe('exported');
    });
  });

  describe('Overlap Detection', () => {
    test('should detect overlapping redactions', async () => {
      const existing = { x: 100, y: 100, width: 100, height: 50 };
      const overlapping = { x: 150, y: 120, width: 100, height: 50 };

      await redactionService.addRedaction(mockRecordId, mockFileName, 1, existing);

      const overlaps = await redactionService.checkOverlap(
        mockRecordId,
        mockFileName,
        1,
        overlapping
      );

      expect(overlaps).toHaveLength(1);
    });

    test('should not detect non-overlapping redactions', async () => {
      const existing = { x: 100, y: 100, width: 100, height: 50 };
      const separate = { x: 300, y: 300, width: 100, height: 50 };

      await redactionService.addRedaction(mockRecordId, mockFileName, 1, existing);

      const overlaps = await redactionService.checkOverlap(
        mockRecordId,
        mockFileName,
        1,
        separate
      );

      expect(overlaps).toHaveLength(0);
    });

    test('should respect overlap threshold', async () => {
      const existing = { x: 100, y: 100, width: 100, height: 50 };
      const slightOverlap = { x: 195, y: 145, width: 100, height: 50 }; // ~5% overlap

      await redactionService.addRedaction(mockRecordId, mockFileName, 1, existing);

      // With 10% threshold, should not detect
      const overlaps10 = await redactionService.checkOverlap(
        mockRecordId,
        mockFileName,
        1,
        slightOverlap,
        0.1
      );

      // With 2% threshold, should detect
      const overlaps2 = await redactionService.checkOverlap(
        mockRecordId,
        mockFileName,
        1,
        slightOverlap,
        0.02
      );

      expect(overlaps10).toHaveLength(0);
      expect(overlaps2).toHaveLength(1);
    });
  });

  describe('Summary Statistics', () => {
    test('should generate correct redaction summary', async () => {
      // Add redactions on different pages
      await redactionService.addRedaction(mockRecordId, mockFileName, 1, { x: 100, y: 100, width: 50, height: 50 });
      await redactionService.addRedaction(mockRecordId, mockFileName, 1, { x: 200, y: 200, width: 50, height: 50 });
      await redactionService.addRedaction(mockRecordId, mockFileName, 2, { x: 150, y: 150, width: 50, height: 50 });

      const summary = await redactionService.getRedactionSummary(mockRecordId, mockFileName);

      expect(summary).toMatchObject({
        recordId: mockRecordId,
        totalRedactions: 3,
        byPage: {
          '1': 2,
          '2': 1,
        },
        byType: {
          'manual': 3,
        },
      });
      expect(summary.lastModified).toBeDefined();
      expect(summary.versions).toBeDefined();
    });

    test('should handle empty redactions in summary', async () => {
      const summary = await redactionService.getRedactionSummary(mockRecordId, mockFileName);

      expect(summary).toMatchObject({
        recordId: mockRecordId,
        totalRedactions: 0,
        byPage: {},
        byType: {},
        currentVersion: '',
        versions: [],
      });
    });
  });

  describe('Data Persistence', () => {
    test('should persist redactions in localStorage', async () => {
      const coordinates = { x: 100, y: 200, width: 150, height: 50 };
      await redactionService.addRedaction(mockRecordId, mockFileName, 1, coordinates);

      const storageKey = `redactions_${mockRecordId}_${mockFileName}`;
      const stored = localStorage.getItem(storageKey);
      expect(stored).toBeTruthy();

      const parsedRedactions = JSON.parse(stored!) as ManualRedaction[];
      expect(parsedRedactions).toHaveLength(1);
      expect(parsedRedactions[0]).toMatchObject({
        recordId: mockRecordId,
        fileName: mockFileName,
        pageNumber: 1,
        ...coordinates,
      });
    });

    test('should persist versions in localStorage', async () => {
      const coordinates = { x: 100, y: 200, width: 150, height: 50 };
      await redactionService.addRedaction(mockRecordId, mockFileName, 1, coordinates);
      await redactionService.saveVersion(mockRecordId, mockFileName, 'Test version');

      const versionKey = `redaction_versions_${mockRecordId}_${mockFileName}`;
      const stored = localStorage.getItem(versionKey);
      expect(stored).toBeTruthy();

      const parsedVersions = JSON.parse(stored!) as RedactionVersion[];
      expect(parsedVersions.length).toBeGreaterThan(0);
      expect(parsedVersions.some(v => v.notes === 'Test version')).toBe(true);
    });

    test('should handle corrupted localStorage data gracefully', async () => {
      // Corrupt the localStorage data
      const storageKey = `redactions_${mockRecordId}_${mockFileName}`;
      localStorage.setItem(storageKey, 'invalid json');

      const redactions = await redactionService.getRedactionsForRecord(mockRecordId, mockFileName);
      expect(redactions).toEqual([]);
    });
  });

  describe('Bulk Operations', () => {
    test('should clear all redactions', async () => {
      const coords1 = { x: 100, y: 200, width: 150, height: 50 };
      const coords2 = { x: 300, y: 400, width: 100, height: 30 };
      await redactionService.addRedaction(mockRecordId, mockFileName, 1, coords1);
      await redactionService.addRedaction(mockRecordId, mockFileName, 2, coords2);

      const result = await redactionService.clearAllRedactions(mockRecordId, mockFileName);
      expect(result).toBe(true);

      const redactions = await redactionService.getRedactionsForRecord(mockRecordId, mockFileName);
      expect(redactions).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid version ID gracefully', async () => {
      await expect(
        redactionService.loadVersion(mockRecordId, mockFileName, 'invalid_version_id')
      ).rejects.toThrow('Version invalid_version_id not found');
    });

    test('should handle localStorage quota exceeded', async () => {
      // Mock localStorage to throw quota exceeded error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = jest.fn(() => {
        throw new Error('QuotaExceededError');
      });

      const coordinates = { x: 100, y: 200, width: 150, height: 50 };

      await expect(
        redactionService.addRedaction(mockRecordId, mockFileName, 1, coordinates)
      ).rejects.toThrow();

      // Restore original method
      localStorage.setItem = originalSetItem;
    });
  });
});