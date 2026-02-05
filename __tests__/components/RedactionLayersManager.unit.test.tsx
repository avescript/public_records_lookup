/**
 * Redaction Layers Manager - Unit Tests
 * US-V2-031: Focused unit tests for layer management functionality
 */

import { DragDropContext } from '@hello-pangea/dnd';
import { ThemeProvider } from '@mui/material/styles';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { RedactionLayersManager } from '../../src/components/staff/InteractiveRedactionEditor/RedactionLayersManager';
import { InteractiveRedaction } from '../../src/components/staff/InteractiveRedactionEditor/types';
import { theme } from '../../src/theme';

const mockRedactions: InteractiveRedaction[] = [
  {
    id: 'layer-1',
    recordId: 'test-record',
    fileName: 'test.pdf',
    pageNumber: 1,
    x: 100,
    y: 100,
    width: 150,
    height: 25,
    shape: 'rectangle' as const,
    createdAt: '2024-01-15T10:00:00Z',
    createdBy: 'user-1',
    type: 'manual' as const,
    layerId: 'layer-1',
    zIndex: 1,
    opacity: 1,
    visible: true,
    locked: false,
    label: 'SSN Redaction',
  },
  {
    id: 'layer-2',
    recordId: 'test-record',
    fileName: 'test.pdf',
    pageNumber: 1,
    x: 300,
    y: 200,
    width: 200,
    height: 30,
    shape: 'ellipse' as const,
    createdAt: '2024-01-15T11:00:00Z',
    createdBy: 'user-2',
    type: 'ai-assisted' as const,
    layerId: 'layer-2',
    zIndex: 2,
    opacity: 0.8,
    visible: false,
    locked: true,
    label: 'Address Redaction',
    isAISuggested: true,
  },
];

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={theme}>
    <DragDropContext onDragEnd={() => {}}>{children}</DragDropContext>
  </ThemeProvider>
);

describe('RedactionLayersManager Unit Tests', () => {
  const defaultProps = {
    redactions: mockRedactions,
    onRedactionsChange: jest.fn(),
    onLayerSelect: jest.fn(),
    selectedLayerId: undefined,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Initialization', () => {
    it('should render with provided redactions', () => {
      render(<RedactionLayersManager {...defaultProps} />, {
        wrapper: TestWrapper,
      });

      expect(screen.getByText('SSN Redaction')).toBeInTheDocument();
      expect(screen.getByText('Address Redaction')).toBeInTheDocument();
    });

    it('should display correct layer count', () => {
      render(<RedactionLayersManager {...defaultProps} />, {
        wrapper: TestWrapper,
      });

      const layerItems = screen.getAllByRole('listitem');
      expect(layerItems).toHaveLength(2);
    });

    it('should handle empty redactions list', () => {
      render(<RedactionLayersManager {...defaultProps} redactions={[]} />, {
        wrapper: TestWrapper,
      });

      expect(
        screen.getByText(/no redaction layers found/i)
      ).toBeInTheDocument();
    });
  });

  describe('Layer Information Display', () => {
    beforeEach(() => {
      render(<RedactionLayersManager {...defaultProps} />, {
        wrapper: TestWrapper,
      });
    });

    it('should display layer labels', () => {
      expect(screen.getByText('SSN Redaction')).toBeInTheDocument();
      expect(screen.getByText('Address Redaction')).toBeInTheDocument();
    });

    it('should display layer types', () => {
      expect(screen.getByText('Manual')).toBeInTheDocument();
      expect(screen.getByText('AI-Assisted')).toBeInTheDocument();
    });

    it('should show AI suggestion indicators', () => {
      const aiIndicators = screen.getAllByTestId('AutoAwesomeIcon');
      expect(aiIndicators).toHaveLength(1); // Only one AI-assisted redaction
    });

    it('should display opacity values', () => {
      const opacitySliders = screen.getAllByRole('slider', {
        name: /opacity/i,
      });
      expect(opacitySliders[0]).toHaveValue('100'); // First layer at 100%
      expect(opacitySliders[1]).toHaveValue('80'); // Second layer at 80%
    });
  });

  describe('Layer Visibility Controls', () => {
    beforeEach(() => {
      render(<RedactionLayersManager {...defaultProps} />, {
        wrapper: TestWrapper,
      });
    });

    it('should display visibility status correctly', () => {
      const visibilityButtons = screen.getAllByRole('button', {
        name: /toggle visibility/i,
      });

      // First layer should be visible (not pressed = visible)
      expect(visibilityButtons[0]).not.toHaveAttribute('aria-pressed', 'false');
      // Second layer should be hidden (pressed = hidden)
      expect(visibilityButtons[1]).toHaveAttribute('aria-pressed', 'false');
    });

    it('should toggle visibility when clicked', async () => {
      const onRedactionsChange = jest.fn();
      render(
        <RedactionLayersManager
          {...defaultProps}
          onRedactionsChange={onRedactionsChange}
        />,
        { wrapper: TestWrapper }
      );

      const visibilityButtons = screen.getAllByRole('button', {
        name: /toggle visibility/i,
      });
      await userEvent.click(visibilityButtons[0]);

      expect(onRedactionsChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'layer-1',
            visible: false, // Should toggle from true to false
          }),
        ])
      );
    });

    it('should show correct visibility icons', () => {
      const visibleIcons = screen.getAllByTestId('VisibilityIcon');
      const hiddenIcons = screen.getAllByTestId('VisibilityOffIcon');

      expect(visibleIcons).toHaveLength(1); // One visible layer
      expect(hiddenIcons).toHaveLength(1); // One hidden layer
    });
  });

  describe('Layer Lock Controls', () => {
    beforeEach(() => {
      render(<RedactionLayersManager {...defaultProps} />, {
        wrapper: TestWrapper,
      });
    });

    it('should display lock status correctly', () => {
      const lockButtons = screen.getAllByRole('button', {
        name: /toggle lock/i,
      });

      // First layer should be unlocked
      expect(lockButtons[0]).not.toHaveAttribute('aria-pressed', 'true');
      // Second layer should be locked
      expect(lockButtons[1]).toHaveAttribute('aria-pressed', 'true');
    });

    it('should toggle lock when clicked', async () => {
      const onRedactionsChange = jest.fn();
      render(
        <RedactionLayersManager
          {...defaultProps}
          onRedactionsChange={onRedactionsChange}
        />,
        { wrapper: TestWrapper }
      );

      const lockButtons = screen.getAllByRole('button', {
        name: /toggle lock/i,
      });
      await userEvent.click(lockButtons[0]);

      expect(onRedactionsChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'layer-1',
            locked: true, // Should toggle from false to true
          }),
        ])
      );
    });

    it('should disable opacity control for locked layers', () => {
      const opacitySliders = screen.getAllByRole('slider', {
        name: /opacity/i,
      });

      expect(opacitySliders[0]).not.toBeDisabled(); // Unlocked layer
      expect(opacitySliders[1]).toBeDisabled(); // Locked layer
    });
  });

  describe('Opacity Control', () => {
    beforeEach(() => {
      render(<RedactionLayersManager {...defaultProps} />, {
        wrapper: TestWrapper,
      });
    });

    it('should display opacity sliders', () => {
      const opacitySliders = screen.getAllByRole('slider', {
        name: /opacity/i,
      });
      expect(opacitySliders).toHaveLength(2);
    });

    it('should update opacity when slider changes', async () => {
      const onRedactionsChange = jest.fn();
      render(
        <RedactionLayersManager
          {...defaultProps}
          onRedactionsChange={onRedactionsChange}
        />,
        { wrapper: TestWrapper }
      );

      const opacitySliders = screen.getAllByRole('slider', {
        name: /opacity/i,
      });
      fireEvent.change(opacitySliders[0], { target: { value: '50' } });

      expect(onRedactionsChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'layer-1',
            opacity: 0.5, // 50% as decimal
          }),
        ])
      );
    });

    it('should display opacity percentage labels', () => {
      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByText('80%')).toBeInTheDocument();
    });
  });

  describe('Layer Selection', () => {
    it('should highlight selected layer', () => {
      render(
        <RedactionLayersManager {...defaultProps} selectedLayerId='layer-1' />,
        { wrapper: TestWrapper }
      );

      const layerItems = screen.getAllByRole('listitem');
      expect(layerItems[0]).toHaveClass('selected');
    });

    it('should call onLayerSelect when layer is clicked', async () => {
      const onLayerSelect = jest.fn();
      render(
        <RedactionLayersManager
          {...defaultProps}
          onLayerSelect={onLayerSelect}
        />,
        { wrapper: TestWrapper }
      );

      const layerItem = screen
        .getByText('SSN Redaction')
        .closest('[role="listitem"]');
      if (layerItem) {
        await userEvent.click(layerItem);
        expect(onLayerSelect).toHaveBeenCalledWith('layer-1');
      }
    });

    it('should not highlight any layer when none selected', () => {
      render(<RedactionLayersManager {...defaultProps} />, {
        wrapper: TestWrapper,
      });

      const layerItems = screen.getAllByRole('listitem');
      layerItems.forEach(item => {
        expect(item).not.toHaveClass('selected');
      });
    });
  });

  describe('Layer Actions Menu', () => {
    beforeEach(() => {
      render(<RedactionLayersManager {...defaultProps} />, {
        wrapper: TestWrapper,
      });
    });

    it('should show layer action buttons', () => {
      const menuButtons = screen.getAllByRole('button', {
        name: /layer actions/i,
      });
      expect(menuButtons).toHaveLength(2); // One for each layer
    });

    it('should open actions menu when clicked', async () => {
      const menuButtons = screen.getAllByRole('button', {
        name: /layer actions/i,
      });
      await userEvent.click(menuButtons[0]);

      expect(screen.getByText('Duplicate')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
      expect(screen.getByText('Rename')).toBeInTheDocument();
    });

    it('should delete layer when delete is clicked', async () => {
      const onRedactionsChange = jest.fn();
      render(
        <RedactionLayersManager
          {...defaultProps}
          onRedactionsChange={onRedactionsChange}
        />,
        { wrapper: TestWrapper }
      );

      const menuButtons = screen.getAllByRole('button', {
        name: /layer actions/i,
      });
      await userEvent.click(menuButtons[0]);

      const deleteButton = screen.getByText('Delete');
      await userEvent.click(deleteButton);

      expect(onRedactionsChange).toHaveBeenCalledWith(
        expect.not.arrayContaining([expect.objectContaining({ id: 'layer-1' })])
      );
    });

    it('should duplicate layer when duplicate is clicked', async () => {
      const onRedactionsChange = jest.fn();
      render(
        <RedactionLayersManager
          {...defaultProps}
          onRedactionsChange={onRedactionsChange}
        />,
        { wrapper: TestWrapper }
      );

      const menuButtons = screen.getAllByRole('button', {
        name: /layer actions/i,
      });
      await userEvent.click(menuButtons[0]);

      const duplicateButton = screen.getByText('Duplicate');
      await userEvent.click(duplicateButton);

      expect(onRedactionsChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            label: 'SSN Redaction (Copy)',
            type: 'manual',
          }),
        ])
      );
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      render(<RedactionLayersManager {...defaultProps} />, {
        wrapper: TestWrapper,
      });
    });

    it('should have proper ARIA labels', () => {
      expect(
        screen.getByRole('list', { name: /redaction layers/i })
      ).toBeInTheDocument();
    });

    it('should have accessible visibility toggle buttons', () => {
      const visibilityButtons = screen.getAllByRole('button', {
        name: /toggle visibility for/i,
      });
      expect(visibilityButtons).toHaveLength(2);
    });

    it('should have accessible lock toggle buttons', () => {
      const lockButtons = screen.getAllByRole('button', {
        name: /toggle lock for/i,
      });
      expect(lockButtons).toHaveLength(2);
    });

    it('should have accessible opacity sliders', () => {
      const opacitySliders = screen.getAllByRole('slider', {
        name: /opacity/i,
      });
      opacitySliders.forEach(slider => {
        expect(slider).toHaveAttribute('aria-label');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle missing layer properties gracefully', () => {
      const incompleteRedactions = [
        {
          id: 'incomplete-layer',
          recordId: 'test',
          fileName: 'test.pdf',
          pageNumber: 1,
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          shape: 'rectangle' as const,
          createdAt: '2024-01-15T10:00:00Z',
          createdBy: 'user-1',
          type: 'manual' as const,
          // Missing some optional properties
        },
      ] as InteractiveRedaction[];

      render(
        <RedactionLayersManager
          {...defaultProps}
          redactions={incompleteRedactions}
        />,
        { wrapper: TestWrapper }
      );

      // Should render without crashing
      expect(screen.getByRole('list')).toBeInTheDocument();
    });

    it('should handle callback errors gracefully', async () => {
      const onRedactionsChange = jest.fn(() => {
        throw new Error('Callback error');
      });

      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      render(
        <RedactionLayersManager
          {...defaultProps}
          onRedactionsChange={onRedactionsChange}
        />,
        { wrapper: TestWrapper }
      );

      const visibilityButtons = screen.getAllByRole('button', {
        name: /toggle visibility/i,
      });

      // Should not crash when callback throws
      await userEvent.click(visibilityButtons[0]);

      consoleSpy.mockRestore();
    });
  });

  describe('Statistics Display', () => {
    it('should show layer statistics when enabled', () => {
      render(<RedactionLayersManager {...defaultProps} showStats={true} />, {
        wrapper: TestWrapper,
      });

      expect(screen.getByText('Total: 2 layers')).toBeInTheDocument();
      expect(screen.getByText('Visible: 1')).toBeInTheDocument();
      expect(screen.getByText('Hidden: 1')).toBeInTheDocument();
      expect(screen.getByText('Locked: 1')).toBeInTheDocument();
    });
  });
});
