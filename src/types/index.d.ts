// Theme interface for Material-UI
import { Theme } from '@mui/material/styles';

// FileRejection interface for react-dropzone
interface FileRejection {
  file: File;
  errors: Array<{
    code: string;
    message: string;
  }>;
}

// Form field interface
interface Field {
  onChange: (value: any) => void;
  onBlur: () => void;
  value: any;
  name: string;
}

declare module '@mui/material/styles' {
  interface Theme {
    // Add any custom theme properties here
  }
  interface ThemeOptions {
    // Add any custom theme options here
  }
}
