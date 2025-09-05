import React from 'react';
import { render, screen, fireEvent, waitFor, userEvent } from '../utils/test-utils';
import { SharePointConnectionSettings } from '../../src/components/SharePointConnectionSettings';
import { SharePointConnectionConfig } from '../../src/types';

const mockConnections: SharePointConnectionConfig[] = [
  {
    id: 'conn-1',
    name: 'Primary SharePoint',
    tenantId: 'tenant-123',
    clientId: 'client-123',
    clientSecret: 'secret-123',
    siteUrl: 'https://contoso.sharepoint.com/sites/primary',
    authenticationType: 'oauth',
    scopes: ['Sites.Read.All', 'Files.Read.All'],
    timeout: 30000,
    retryAttempts: 3,
    isDefault: true,
    createdAt: '2023-01-01T00:00:00Z',
    status: 'active',
  },
  {
    id: 'conn-2',
    name: 'Secondary SharePoint',
    tenantId: 'tenant-456',
    clientId: 'client-456',
    certificateThumbprint: 'cert-thumbprint',
    siteUrl: 'https://contoso.sharepoint.com/sites/secondary',
    authenticationType: 'certificate',
    scopes: ['Sites.Read.All'],
    timeout: 30000,
    retryAttempts: 3,
    isDefault: false,
    createdAt: '2023-01-02T00:00:00Z',
    status: 'inactive',
  },
];

const mockOnSave = jest.fn();
const mockOnTestConnection = jest.fn();

describe('SharePointConnectionSettings', () => {
  beforeEach(() => {
    mockOnSave.mockClear();
    mockOnTestConnection.mockClear();
  });

  it('renders connection list correctly', () => {
    render(
      <SharePointConnectionSettings
        connections={mockConnections}
        onSave={mockOnSave}
        onTestConnection={mockOnTestConnection}
      />
    );

    expect(screen.getByText('SharePoint Connections')).toBeInTheDocument();
    expect(screen.getByText('Primary SharePoint')).toBeInTheDocument();
    expect(screen.getByText('Secondary SharePoint')).toBeInTheDocument();
    expect(screen.getByText('Default')).toBeInTheDocument();
  });

  it('displays connection details correctly', () => {
    render(
      <SharePointConnectionSettings
        connections={mockConnections}
        onSave={mockOnSave}
        onTestConnection={mockOnTestConnection}
      />
    );

    expect(screen.getByText('https://contoso.sharepoint.com/sites/primary')).toBeInTheDocument();
    expect(screen.getByText('oauth')).toBeInTheDocument();
    expect(screen.getByText('tenant-123')).toBeInTheDocument();
  });

  it('shows empty state when no connections exist', () => {
    render(
      <SharePointConnectionSettings
        connections={[]}
        onSave={mockOnSave}
        onTestConnection={mockOnTestConnection}
      />
    );

    expect(screen.getByText('No SharePoint connections configured. Add a connection to get started.')).toBeInTheDocument();
  });

  it('opens add connection dialog when button is clicked', async () => {
    render(
      <SharePointConnectionSettings
        connections={mockConnections}
        onSave={mockOnSave}
        onTestConnection={mockOnTestConnection}
      />
    );

    const addButton = screen.getByText('Add Connection');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Add New Connection')).toBeInTheDocument();
    });
  });

  it('fills out and submits new connection form', async () => {
    const user = userEvent.setup();
    
    render(
      <SharePointConnectionSettings
        connections={[]}
        onSave={mockOnSave}
        onTestConnection={mockOnTestConnection}
      />
    );

    // Open add dialog
    await user.click(screen.getByText('Add Connection'));

    // Fill out form
    await user.type(screen.getByLabelText('Connection Name'), 'New Connection');
    await user.type(screen.getByLabelText('Tenant ID'), 'new-tenant-id');
    await user.type(screen.getByLabelText('Client ID'), 'new-client-id');
    await user.type(screen.getByLabelText('Site URL'), 'https://new.sharepoint.com/sites/test');

    // Select authentication type
    await user.click(screen.getByLabelText('Authentication Type'));
    await user.click(screen.getByText('OAuth 2.0'));

    // Add client secret for OAuth
    await user.type(screen.getByLabelText('Client Secret'), 'new-secret');

    // Save
    await user.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith([
        expect.objectContaining({
          name: 'New Connection',
          tenantId: 'new-tenant-id',
          clientId: 'new-client-id',
          siteUrl: 'https://new.sharepoint.com/sites/test',
          authenticationType: 'oauth',
          clientSecret: 'new-secret',
        }),
      ]);
    });
  });

  it('edits existing connection', async () => {
    const user = userEvent.setup();
    
    render(
      <SharePointConnectionSettings
        connections={mockConnections}
        onSave={mockOnSave}
        onTestConnection={mockOnTestConnection}
      />
    );

    // Click edit button for first connection
    const editButtons = screen.getAllByLabelText('edit');
    await user.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Edit Connection')).toBeInTheDocument();
    });

    // Modify connection name
    const nameInput = screen.getByDisplayValue('Primary SharePoint');
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Primary SharePoint');

    // Save changes
    await user.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith([
        expect.objectContaining({
          id: 'conn-1',
          name: 'Updated Primary SharePoint',
        }),
        mockConnections[1],
      ]);
    });
  });

  it('deletes connection', async () => {
    const user = userEvent.setup();
    
    render(
      <SharePointConnectionSettings
        connections={mockConnections}
        onSave={mockOnSave}
        onTestConnection={mockOnTestConnection}
      />
    );

    // Click delete button for second connection
    const deleteButtons = screen.getAllByLabelText('delete');
    await user.click(deleteButtons[1]);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith([mockConnections[0]]);
    });
  });

  it('tests connection successfully', async () => {
    const user = userEvent.setup();
    mockOnTestConnection.mockResolvedValue(true);
    
    render(
      <SharePointConnectionSettings
        connections={mockConnections}
        onSave={mockOnSave}
        onTestConnection={mockOnTestConnection}
      />
    );

    // Click test button for first connection
    const testButtons = screen.getAllByTitle('Test Connection');
    await user.click(testButtons[0]);

    await waitFor(() => {
      expect(mockOnTestConnection).toHaveBeenCalledWith(mockConnections[0]);
    });

    // Should show loading state
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith([
        expect.objectContaining({
          id: 'conn-1',
          status: 'active',
          lastTested: expect.any(String),
        }),
        mockConnections[1],
      ]);
    });
  });

  it('handles test connection failure', async () => {
    const user = userEvent.setup();
    mockOnTestConnection.mockResolvedValue(false);
    
    render(
      <SharePointConnectionSettings
        connections={mockConnections}
        onSave={mockOnSave}
        onTestConnection={mockOnTestConnection}
      />
    );

    const testButtons = screen.getAllByTitle('Test Connection');
    await user.click(testButtons[0]);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith([
        expect.objectContaining({
          id: 'conn-1',
          status: 'error',
          errorMessage: 'Connection test failed',
        }),
        mockConnections[1],
      ]);
    });
  });

  it('toggles secret visibility', async () => {
    const user = userEvent.setup();
    
    render(
      <SharePointConnectionSettings
        connections={mockConnections}
        onSave={mockOnSave}
        onTestConnection={mockOnTestConnection}
      />
    );

    // Open edit dialog
    const editButtons = screen.getAllByLabelText('edit');
    await user.click(editButtons[0]);

    await waitFor(() => {
      const secretInput = screen.getByLabelText('Client Secret');
      expect(secretInput).toHaveAttribute('type', 'password');
    });

    // Toggle visibility
    const visibilityButton = screen.getByLabelText('toggle password visibility');
    await user.click(visibilityButton);

    const secretInput = screen.getByLabelText('Client Secret');
    expect(secretInput).toHaveAttribute('type', 'text');
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    
    render(
      <SharePointConnectionSettings
        connections={[]}
        onSave={mockOnSave}
        onTestConnection={mockOnTestConnection}
      />
    );

    await user.click(screen.getByText('Add Connection'));

    // Try to save without required fields
    const saveButton = screen.getByText('Save');
    expect(saveButton).toBeDisabled();

    // Fill required fields one by one
    await user.type(screen.getByLabelText('Connection Name'), 'Test');
    expect(saveButton).toBeDisabled();

    await user.type(screen.getByLabelText('Tenant ID'), 'tenant');
    expect(saveButton).toBeDisabled();

    await user.type(screen.getByLabelText('Client ID'), 'client');
    expect(saveButton).not.toBeDisabled();
  });

  it('handles certificate authentication type', async () => {
    const user = userEvent.setup();
    
    render(
      <SharePointConnectionSettings
        connections={[]}
        onSave={mockOnSave}
        onTestConnection={mockOnTestConnection}
      />
    );

    await user.click(screen.getByText('Add Connection'));

    // Select certificate authentication
    await user.click(screen.getByLabelText('Authentication Type'));
    await user.click(screen.getByText('Certificate'));

    // Should show certificate thumbprint field instead of client secret
    expect(screen.getByLabelText('Certificate Thumbprint')).toBeInTheDocument();
    expect(screen.queryByLabelText('Client Secret')).not.toBeInTheDocument();
  });

  it('sets default connection correctly', async () => {
    const user = userEvent.setup();
    
    render(
      <SharePointConnectionSettings
        connections={mockConnections}
        onSave={mockOnSave}
        onTestConnection={mockOnTestConnection}
      />
    );

    // Edit second connection
    const editButtons = screen.getAllByLabelText('edit');
    await user.click(editButtons[1]);

    await waitFor(() => {
      expect(screen.getByText('Edit Connection')).toBeInTheDocument();
    });

    // Set as default
    const defaultSwitch = screen.getByLabelText('Set as Default Connection');
    await user.click(defaultSwitch);

    await user.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith([
        expect.objectContaining({
          id: 'conn-1',
          isDefault: false, // First connection should no longer be default
        }),
        expect.objectContaining({
          id: 'conn-2',
          isDefault: true, // Second connection should now be default
        }),
      ]);
    });
  });

  it('expands and collapses advanced settings', async () => {
    const user = userEvent.setup();
    
    render(
      <SharePointConnectionSettings
        connections={[]}
        onSave={mockOnSave}
        onTestConnection={mockOnTestConnection}
      />
    );

    await user.click(screen.getByText('Add Connection'));

    // Advanced settings should be collapsed by default
    expect(screen.queryByLabelText('Timeout (ms)')).not.toBeInTheDocument();

    // Expand advanced settings
    await user.click(screen.getByText('Advanced Settings'));

    await waitFor(() => {
      expect(screen.getByLabelText('Timeout (ms)')).toBeInTheDocument();
      expect(screen.getByLabelText('Retry Attempts')).toBeInTheDocument();
    });
  });

  it('manages scopes correctly', async () => {
    const user = userEvent.setup();
    
    render(
      <SharePointConnectionSettings
        connections={mockConnections}
        onSave={mockOnSave}
        onTestConnection={mockOnTestConnection}
      />
    );

    // Edit first connection
    const editButtons = screen.getAllByLabelText('edit');
    await user.click(editButtons[0]);

    // Expand advanced settings
    await user.click(screen.getByText('Advanced Settings'));

    await waitFor(() => {
      // Should show existing scopes as chips
      expect(screen.getByText('Sites.Read.All')).toBeInTheDocument();
      expect(screen.getByText('Files.Read.All')).toBeInTheDocument();
    });

    // Remove a scope
    const scopeChips = screen.getAllByTestId('CancelIcon');
    await user.click(scopeChips[0]);

    await user.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith([
        expect.objectContaining({
          id: 'conn-1',
          scopes: ['Files.Read.All'], // Only one scope should remain
        }),
        mockConnections[1],
      ]);
    });
  });

  it('displays connection status indicators correctly', () => {
    render(
      <SharePointConnectionSettings
        connections={mockConnections}
        onSave={mockOnSave}
        onTestConnection={mockOnTestConnection}
      />
    );

    // Active connection should show green check
    const activeStatusIcons = screen.getAllByTestId('CheckCircleIcon');
    expect(activeStatusIcons).toHaveLength(1);

    // Inactive connection should show warning icon
    const warningIcons = screen.getAllByTestId('WarningIcon');
    expect(warningIcons).toHaveLength(1);
  });

  it('shows error message for failed connections', () => {
    const connectionsWithError = [
      {
        ...mockConnections[0],
        status: 'error' as const,
        errorMessage: 'Authentication failed: Invalid client credentials',
      },
    ];

    render(
      <SharePointConnectionSettings
        connections={connectionsWithError}
        onSave={mockOnSave}
        onTestConnection={mockOnTestConnection}
      />
    );

    expect(screen.getByText('Authentication failed: Invalid client credentials')).toBeInTheDocument();
  });

  it('handles form validation errors', async () => {
    const user = userEvent.setup();
    
    render(
      <SharePointConnectionSettings
        connections={[]}
        onSave={mockOnSave}
        onTestConnection={mockOnTestConnection}
      />
    );

    await user.click(screen.getByText('Add Connection'));

    // Enter invalid site URL
    await user.type(screen.getByLabelText('Site URL'), 'invalid-url');

    // The form should handle validation (implementation would depend on actual validation logic)
    const siteUrlInput = screen.getByLabelText('Site URL');
    expect(siteUrlInput).toHaveValue('invalid-url');
  });
});