import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import { Select, SelectOption } from './Select';

// Sample data for stories
const departments: SelectOption[] = [
  { value: 'hr', label: 'Human Resources' },
  {
    value: 'it',
    label: 'Information Technology',
    description: 'Technical support and development',
  },
  { value: 'finance', label: 'Finance & Accounting' },
  {
    value: 'legal',
    label: 'Legal Department',
    description: 'Compliance and legal affairs',
  },
  { value: 'marketing', label: 'Marketing & Communications' },
  { value: 'ops', label: 'Operations' },
  { value: 'disabled', label: 'Disabled Department', disabled: true },
];

const priorities: SelectOption[] = [
  { value: 'low', label: 'Low Priority' },
  { value: 'medium', label: 'Medium Priority' },
  { value: 'high', label: 'High Priority' },
  { value: 'critical', label: 'Critical Priority' },
];

const skills: SelectOption[] = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'react', label: 'React' },
  { value: 'nodejs', label: 'Node.js' },
  { value: 'python', label: 'Python' },
  { value: 'sql', label: 'SQL' },
  { value: 'aws', label: 'Amazon Web Services' },
  { value: 'docker', label: 'Docker' },
  { value: 'kubernetes', label: 'Kubernetes' },
  { value: 'git', label: 'Git Version Control' },
];

const meta = {
  title: 'Design System/Select',
  component: Select,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Accessible select component for choosing options from a dropdown list. Supports single and multiple selection, search functionality, and custom rendering.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['small', 'medium'],
      description: 'Size variant of the select',
    },
    multiple: {
      control: 'boolean',
      description: 'Enable multiple selection',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable the select component',
    },
    required: {
      control: 'boolean',
      description: 'Mark the field as required',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Take full width of container',
    },
    searchable: {
      control: 'boolean',
      description: 'Enable search/filter functionality',
    },
    error: {
      control: 'text',
      description: 'Error message to display',
    },
    helperText: {
      control: 'text',
      description: 'Helper text to display below the select',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text when no option is selected',
    },
    onChange: { action: 'changed' },
    onOpen: { action: 'opened' },
    onClose: { action: 'closed' },
  },
  args: {
    options: departments,
    onChange: () => {},
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic select stories
export const Default: Story = {
  args: {
    label: 'Department',
    placeholder: 'Select a department...',
  },
};

export const WithValue: Story = {
  args: {
    label: 'Department',
    value: 'it',
  },
};

export const WithHelperText: Story = {
  args: {
    label: 'Department',
    helperText: 'Choose the department for your request',
    placeholder: 'Select a department...',
  },
};

export const Required: Story = {
  args: {
    label: 'Department',
    required: true,
    placeholder: 'Select a department...',
  },
};

// Error states
export const WithError: Story = {
  args: {
    label: 'Department',
    error: 'Please select a valid department',
    value: '',
  },
};

export const ErrorWithValue: Story = {
  args: {
    label: 'Department',
    error: 'This department is not available for new requests',
    value: 'disabled',
  },
};

// Size variants
export const SmallSize: Story = {
  args: {
    label: 'Priority Level',
    options: priorities,
    size: 'small',
    value: 'medium',
  },
};

export const MediumSize: Story = {
  args: {
    label: 'Priority Level',
    options: priorities,
    size: 'medium',
    value: 'high',
  },
};

// Disabled states
export const Disabled: Story = {
  args: {
    label: 'Department',
    disabled: true,
    value: 'it',
    helperText: 'Department selection is locked during processing',
  },
};

export const DisabledEmpty: Story = {
  args: {
    label: 'Department',
    disabled: true,
    placeholder: 'No departments available',
  },
};

// Multiple selection
export const MultipleSelection: Story = {
  args: {
    label: 'Skills',
    options: skills,
    multiple: true,
    value: ['javascript', 'react', 'typescript'],
    helperText: 'Select all skills that apply',
  },
};

export const MultipleEmpty: Story = {
  args: {
    label: 'Skills',
    options: skills,
    multiple: true,
    value: [],
    placeholder: 'Select your skills...',
  },
};

// Searchable select
export const Searchable: Story = {
  args: {
    label: 'Skills',
    options: skills,
    searchable: true,
    placeholder: 'Search and select skills...',
    helperText: 'Type to filter options',
  },
};

export const SearchableMultiple: Story = {
  args: {
    label: 'Skills',
    options: skills,
    multiple: true,
    searchable: true,
    value: ['javascript', 'react'],
    helperText: 'Search and select multiple skills',
  },
};

// Layout variants
export const FullWidth: Story = {
  args: {
    label: 'Department',
    fullWidth: true,
    value: 'hr',
  },
  parameters: {
    layout: 'padded',
  },
};

// Custom rendering
export const WithDescriptions: Story = {
  args: {
    label: 'Department',
    options: departments.filter(dept => dept.description),
    helperText: 'Departments with detailed descriptions',
  },
};

// Complex example
export const ComplexExample: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        width: '400px',
      }}
    >
      <Select
        label='Department'
        options={departments}
        required
        fullWidth
        helperText='Choose the department handling your request'
        placeholder='Select department...'
      />

      <Select
        label='Priority Level'
        options={priorities}
        size='small'
        value='medium'
        fullWidth
        helperText='Set request priority'
      />

      <Select
        label='Required Skills'
        options={skills}
        multiple
        searchable
        value={['javascript', 'react', 'typescript']}
        fullWidth
        helperText='Search and select relevant skills'
      />

      <Select
        label='Locked Field'
        options={departments}
        disabled
        value='it'
        fullWidth
        helperText='This field cannot be changed'
      />
    </div>
  ),
  parameters: {
    layout: 'centered',
  },
};

// Edge cases
export const EmptyOptions: Story = {
  args: {
    label: 'Empty Select',
    options: [],
    placeholder: 'No options available',
    helperText: 'This select has no options to choose from',
  },
};

export const LongOptionsList: Story = {
  args: {
    label: 'Long List',
    options: Array.from({ length: 50 }, (_, i) => ({
      value: `option-${i}`,
      label: `Option ${i + 1}`,
      description: i % 3 === 0 ? `Description for option ${i + 1}` : undefined,
    })),
    searchable: true,
    placeholder: 'Search through many options...',
    helperText:
      'This select has many options - use search to find what you need',
  },
  parameters: {
    layout: 'padded',
  },
};

// Form integration example
export const FormIntegration: Story = {
  render: () => {
    const [formData, setFormData] = React.useState({
      department: '',
      priority: 'medium',
      skills: [] as (string | number)[],
    });

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          width: '400px',
        }}
      >
        <h3 style={{ margin: 0, marginBottom: '16px' }}>Request Form</h3>

        <Select
          label='Department'
          options={departments}
          value={formData.department}
          onChange={value =>
            setFormData(prev => ({ ...prev, department: value as string }))
          }
          required
          fullWidth
          error={!formData.department ? 'Department is required' : ''}
        />

        <Select
          label='Priority'
          options={priorities}
          value={formData.priority}
          onChange={value =>
            setFormData(prev => ({ ...prev, priority: value as string }))
          }
          size='small'
          fullWidth
        />

        <Select
          label='Skills'
          options={skills.slice(0, 6)}
          multiple
          searchable
          value={formData.skills}
          onChange={value =>
            setFormData(prev => ({
              ...prev,
              skills: value as (string | number)[],
            }))
          }
          fullWidth
          helperText='Select relevant skills for this request'
        />

        <div
          style={{
            padding: '16px',
            backgroundColor: '#f5f5f5',
            borderRadius: '8px',
            fontSize: '14px',
            fontFamily: 'monospace',
          }}
        >
          <strong>Form Data:</strong>
          <pre>{JSON.stringify(formData, null, 2)}</pre>
        </div>
      </div>
    );
  },
  parameters: {
    layout: 'centered',
  },
};
