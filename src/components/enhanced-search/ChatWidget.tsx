import React, { useState } from 'react';
import {
  Close as CloseIcon,
  Minimize as MinimizeIcon,
  OpenInFull as ExpandIcon,
  SmartToy as BotIcon,
} from '@mui/icons-material';
import {
  Badge,
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Fab,
  IconButton,
  Paper,
  Slide,
  Tooltip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';

import { EnhancedMatchCandidate } from '../../types/enhanced-search';

import AISearchChat from './AISearchChat';

interface ChatWidgetProps {
  requestId: string;
  initialContext?: string;
  onSearchResultsSelected?: (results: EnhancedMatchCandidate[]) => void;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  disabled?: boolean;
  badgeCount?: number;
}

// Slide transition component
const SlideTransition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction='up' ref={ref} {...props} />;
});

export const ChatWidget: React.FC<ChatWidgetProps> = ({
  requestId,
  initialContext,
  onSearchResultsSelected,
  position = 'bottom-right',
  disabled = false,
  badgeCount = 0,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Get position styles
  const getPositionStyles = () => {
    const baseStyles = {
      position: 'fixed' as const,
      zIndex: 1300,
    };

    switch (position) {
      case 'bottom-right':
        return { ...baseStyles, bottom: 16, right: 16 };
      case 'bottom-left':
        return { ...baseStyles, bottom: 16, left: 16 };
      case 'top-right':
        return { ...baseStyles, top: 16, right: 16 };
      case 'top-left':
        return { ...baseStyles, top: 16, left: 16 };
      default:
        return { ...baseStyles, bottom: 16, right: 16 };
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    setIsMinimized(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
    setIsFullScreen(false);
  };

  const handleMinimize = () => {
    setIsMinimized(true);
  };

  const handleRestore = () => {
    setIsMinimized(false);
  };

  const handleToggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  const handleSearchResultsSelected = (results: EnhancedMatchCandidate[]) => {
    if (onSearchResultsSelected) {
      onSearchResultsSelected(results);
    }
  };

  // Floating Action Button
  const ChatFAB = () => (
    <Box sx={getPositionStyles()}>
      <Tooltip title='Open AI Search Assistant'>
        <Badge badgeContent={badgeCount} color='error'>
          <Fab
            color='primary'
            onClick={handleOpen}
            disabled={disabled}
            sx={{
              boxShadow: theme.shadows[6],
              '&:hover': {
                transform: 'scale(1.1)',
                transition: 'transform 0.2s ease-in-out',
              },
            }}
          >
            <BotIcon />
          </Fab>
        </Badge>
      </Tooltip>
    </Box>
  );

  // Minimized chat window
  const MinimizedChat = () => (
    <Paper
      elevation={8}
      sx={{
        ...getPositionStyles(),
        width: 280,
        height: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        p: 2,
        cursor: 'pointer',
        '&:hover': {
          transform: 'translateY(-2px)',
          transition: 'transform 0.2s ease-in-out',
        },
      }}
      onClick={handleRestore}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <BotIcon color='primary' />
        <Box>
          <Box sx={{ fontSize: '0.875rem', fontWeight: 'medium' }}>
            AI Search Assistant
          </Box>
          <Box sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
            Click to restore
          </Box>
        </Box>
      </Box>

      <IconButton
        size='small'
        onClick={e => {
          e.stopPropagation();
          handleClose();
        }}
      >
        <CloseIcon fontSize='small' />
      </IconButton>
    </Paper>
  );

  // Regular dialog (desktop)
  const RegularDialog = () => (
    <Dialog
      open={isOpen && !isMinimized}
      onClose={handleClose}
      maxWidth={isFullScreen ? false : 'md'}
      fullWidth={!isFullScreen}
      fullScreen={isFullScreen}
      TransitionComponent={SlideTransition}
      PaperProps={{
        sx: {
          height: isFullScreen ? '100vh' : 700,
          maxHeight: isFullScreen ? '100vh' : '90vh',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BotIcon color='primary' />
          AI Search Assistant
        </Box>

        <Box>
          <Tooltip title={isFullScreen ? 'Exit Full Screen' : 'Full Screen'}>
            <IconButton onClick={handleToggleFullScreen} size='small'>
              <ExpandIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title='Minimize'>
            <IconButton onClick={handleMinimize} size='small'>
              <MinimizeIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title='Close'>
            <IconButton onClick={handleClose} size='small'>
              <CloseIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0, height: '100%' }}>
        <AISearchChat
          requestId={requestId}
          initialContext={initialContext}
          onSearchResultsSelected={handleSearchResultsSelected}
          maxHeight={isFullScreen ? window.innerHeight - 100 : 600}
          fullScreen={isFullScreen}
        />
      </DialogContent>
    </Dialog>
  );

  // Mobile full screen dialog
  const MobileDialog = () => (
    <Dialog
      open={isOpen && !isMinimized}
      onClose={handleClose}
      fullScreen={true}
      TransitionComponent={SlideTransition}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BotIcon color='primary' />
          AI Search Assistant
        </Box>

        <IconButton onClick={handleClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0, height: '100%' }}>
        <AISearchChat
          requestId={requestId}
          initialContext={initialContext}
          onSearchResultsSelected={handleSearchResultsSelected}
          maxHeight={window.innerHeight - 100}
          fullScreen={true}
        />
      </DialogContent>
    </Dialog>
  );

  return (
    <>
      {/* Show FAB when chat is closed */}
      {!isOpen && <ChatFAB />}

      {/* Show minimized window when minimized */}
      {isMinimized && <MinimizedChat />}

      {/* Show appropriate dialog based on device */}
      {isMobile ? <MobileDialog /> : <RegularDialog />}
    </>
  );
};

export default ChatWidget;
