/**
 * Redaction Layers Manager
 * US-V2-031: Layer management for interactive redaction editor
 *
 * Features:
 * - Layer visibility toggle
 * - Z-index management with drag-and-drop reordering
 * - Layer grouping and categorization
 * - Batch layer operations
 */

import React, { useState } from 'react';
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import {
  ColorLens as ColorIcon,
  ContentCopy as DuplicateIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  Edit as EditIcon,
  Layers as LayersIcon,
  Lock as LockIcon,
  LockOpen as UnlockIcon,
  Visibility as VisibleIcon,
  VisibilityOff as HiddenIcon,
} from '@mui/icons-material';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  Chip,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  Menu,
  MenuItem,
  Slider,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';

import { InteractiveRedaction } from './InteractiveRedactionCanvas';

interface RedactionLayer {
  id: string;
  name: string;
  redactions: InteractiveRedaction[];
  visible: boolean;
  locked: boolean;
  opacity: number;
  color?: string;
  category: 'manual' | 'ai-suggested' | 'agency-rule' | 'imported';
}

interface RedactionLayersManagerProps {
  open: boolean;
  onClose: () => void;
  redactions: InteractiveRedaction[];
  onRedactionsChange: (redactions: InteractiveRedaction[]) => void;
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
}

export const RedactionLayersManager: React.FC<RedactionLayersManagerProps> = ({
  open,
  onClose,
  redactions,
  onRedactionsChange,
  selectedIds,
  onSelectionChange,
}) => {
  const [layers, setLayers] = useState<RedactionLayer[]>([]);
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    layerId: string;
  } | null>(null);

  // Group redactions into layers
  React.useEffect(() => {
    const groupedLayers: Record<string, RedactionLayer> = {};

    redactions.forEach(redaction => {
      const category = redaction.isAISuggested
        ? 'ai-suggested'
        : redaction.type === 'agency-rule'
          ? 'agency-rule'
          : 'manual';

      const layerId = `${category}_layer`;

      if (!groupedLayers[layerId]) {
        groupedLayers[layerId] = {
          id: layerId,
          name: category
            .replace('-', ' ')
            .replace(/\b\w/g, l => l.toUpperCase()),
          redactions: [],
          visible: true,
          locked: false,
          opacity: 1,
          category,
        };
      }

      groupedLayers[layerId].redactions.push(redaction);
    });

    setLayers(
      Object.values(groupedLayers).sort((a, b) => a.name.localeCompare(b.name))
    );
  }, [redactions]);

  /**
   * Handle layer reordering
   */
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const newLayers = Array.from(layers);
    const [reorderedLayer] = newLayers.splice(result.source.index, 1);
    newLayers.splice(result.destination.index, 0, reorderedLayer);

    // Update z-index based on layer order
    const updatedRedactions = redactions.map(redaction => {
      const layerIndex = newLayers.findIndex(layer =>
        layer.redactions.some(r => r.id === redaction.id)
      );
      return {
        ...redaction,
        zIndex: layerIndex * 100 + (redaction.zIndex % 100),
      };
    });

    setLayers(newLayers);
    onRedactionsChange(updatedRedactions);
  };

  /**
   * Toggle layer visibility
   */
  const toggleLayerVisibility = (layerId: string) => {
    setLayers(prev =>
      prev.map(layer =>
        layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
      )
    );

    const layer = layers.find(l => l.id === layerId);
    if (layer) {
      const updatedRedactions = redactions.map(redaction => {
        if (layer.redactions.some(r => r.id === redaction.id)) {
          return { ...redaction, opacity: layer.visible ? 0 : 0.8 };
        }
        return redaction;
      });
      onRedactionsChange(updatedRedactions);
    }
  };

  /**
   * Toggle layer lock
   */
  const toggleLayerLock = (layerId: string) => {
    setLayers(prev =>
      prev.map(layer =>
        layer.id === layerId ? { ...layer, locked: !layer.locked } : layer
      )
    );
  };

  /**
   * Update layer opacity
   */
  const updateLayerOpacity = (layerId: string, opacity: number) => {
    setLayers(prev =>
      prev.map(layer => (layer.id === layerId ? { ...layer, opacity } : layer))
    );

    const layer = layers.find(l => l.id === layerId);
    if (layer) {
      const updatedRedactions = redactions.map(redaction => {
        if (layer.redactions.some(r => r.id === redaction.id)) {
          return { ...redaction, opacity };
        }
        return redaction;
      });
      onRedactionsChange(updatedRedactions);
    }
  };

  /**
   * Select all redactions in layer
   */
  const selectLayer = (layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (layer) {
      const layerRedactionIds = new Set(layer.redactions.map(r => r.id));
      onSelectionChange(layerRedactionIds);
    }
  };

  /**
   * Delete layer and its redactions
   */
  const deleteLayer = (layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (layer) {
      const layerRedactionIds = new Set(layer.redactions.map(r => r.id));
      const remainingRedactions = redactions.filter(
        r => !layerRedactionIds.has(r.id)
      );
      onRedactionsChange(remainingRedactions);
    }
    setContextMenu(null);
  };

  /**
   * Duplicate layer
   */
  const duplicateLayer = (layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (layer) {
      const duplicatedRedactions = layer.redactions.map(redaction => ({
        ...redaction,
        id: `${redaction.id}_copy`,
        x: redaction.x + 10,
        y: redaction.y + 10,
        zIndex: redaction.zIndex + 1,
      }));
      onRedactionsChange([...redactions, ...duplicatedRedactions]);
    }
    setContextMenu(null);
  };

  /**
   * Handle context menu
   */
  const handleContextMenu = (event: React.MouseEvent, layerId: string) => {
    event.preventDefault();
    setContextMenu({
      mouseX: event.clientX - 2,
      mouseY: event.clientY - 4,
      layerId,
    });
  };

  return (
    <Drawer
      anchor='right'
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: 350 } }}
    >
      <Card sx={{ m: 0, borderRadius: 0, height: '100%' }}>
        <CardHeader
          title={
            <Box display='flex' alignItems='center' gap={1}>
              <LayersIcon />
              <Typography variant='h6'>Layers</Typography>
            </Box>
          }
          subheader={`${layers.length} layer(s), ${redactions.length} redaction(s)`}
        />

        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId='layers'>
              {provided => (
                <List {...provided.droppableProps} ref={provided.innerRef}>
                  {layers.map((layer, index) => (
                    <Draggable
                      key={layer.id}
                      draggableId={layer.id}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <ListItem
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          sx={{
                            borderBottom: '1px solid #eee',
                            bgcolor: snapshot.isDragging
                              ? 'action.hover'
                              : 'transparent',
                          }}
                          onContextMenu={e => handleContextMenu(e, layer.id)}
                        >
                          <ListItemIcon {...provided.dragHandleProps}>
                            <DragIcon />
                          </ListItemIcon>

                          <ListItemText
                            primary={
                              <Box display='flex' alignItems='center' gap={1}>
                                {editingLayerId === layer.id ? (
                                  <TextField
                                    size='small'
                                    value={layer.name}
                                    onBlur={() => setEditingLayerId(null)}
                                    onKeyDown={e => {
                                      if (e.key === 'Enter') {
                                        setEditingLayerId(null);
                                      }
                                    }}
                                    autoFocus
                                  />
                                ) : (
                                  <Typography
                                    variant='body2'
                                    onClick={() => selectLayer(layer.id)}
                                    sx={{ cursor: 'pointer', flex: 1 }}
                                  >
                                    {layer.name}
                                  </Typography>
                                )}
                                <Chip
                                  size='small'
                                  label={layer.redactions.length}
                                  color={
                                    layer.category === 'ai-suggested'
                                      ? 'warning'
                                      : 'default'
                                  }
                                />
                              </Box>
                            }
                            secondary={
                              <Box sx={{ mt: 1 }}>
                                <Typography variant='caption' display='block'>
                                  Opacity: {Math.round(layer.opacity * 100)}%
                                </Typography>
                                <Slider
                                  size='small'
                                  value={layer.opacity}
                                  onChange={(_, value) =>
                                    updateLayerOpacity(
                                      layer.id,
                                      value as number
                                    )
                                  }
                                  min={0}
                                  max={1}
                                  step={0.1}
                                  sx={{ width: '100%', mt: 0.5 }}
                                />
                              </Box>
                            }
                          />

                          <ListItemSecondaryAction>
                            <Box display='flex' alignItems='center'>
                              <Checkbox
                                edge='end'
                                checked={layer.redactions.some(r =>
                                  selectedIds.has(r.id)
                                )}
                                indeterminate={
                                  layer.redactions.some(r =>
                                    selectedIds.has(r.id)
                                  ) &&
                                  !layer.redactions.every(r =>
                                    selectedIds.has(r.id)
                                  )
                                }
                                onChange={() => selectLayer(layer.id)}
                                size='small'
                              />

                              <Tooltip
                                title={
                                  layer.visible ? 'Hide Layer' : 'Show Layer'
                                }
                              >
                                <IconButton
                                  size='small'
                                  onClick={() =>
                                    toggleLayerVisibility(layer.id)
                                  }
                                >
                                  {layer.visible ? (
                                    <VisibleIcon />
                                  ) : (
                                    <HiddenIcon />
                                  )}
                                </IconButton>
                              </Tooltip>

                              <Tooltip
                                title={
                                  layer.locked ? 'Unlock Layer' : 'Lock Layer'
                                }
                              >
                                <IconButton
                                  size='small'
                                  onClick={() => toggleLayerLock(layer.id)}
                                >
                                  {layer.locked ? <LockIcon /> : <UnlockIcon />}
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </ListItemSecondaryAction>
                        </ListItem>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </List>
              )}
            </Droppable>
          </DragDropContext>
        </CardContent>
      </Card>

      {/* Context menu */}
      <Menu
        open={contextMenu !== null}
        onClose={() => setContextMenu(null)}
        anchorReference='anchorPosition'
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        <MenuItem onClick={() => setEditingLayerId(contextMenu?.layerId || '')}>
          <ListItemIcon>
            <EditIcon fontSize='small' />
          </ListItemIcon>
          Rename Layer
        </MenuItem>
        <MenuItem
          onClick={() => contextMenu && duplicateLayer(contextMenu.layerId)}
        >
          <ListItemIcon>
            <DuplicateIcon fontSize='small' />
          </ListItemIcon>
          Duplicate Layer
        </MenuItem>
        <MenuItem
          onClick={() => contextMenu && deleteLayer(contextMenu.layerId)}
        >
          <ListItemIcon>
            <DeleteIcon fontSize='small' />
          </ListItemIcon>
          Delete Layer
        </MenuItem>
      </Menu>
    </Drawer>
  );
};
