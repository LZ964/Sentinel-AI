import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import AdbTab from './AdbTab';

// Mock AndroidBridge
vi.mock('../native/AndroidBridge', () => ({
  NativeBridge: {
    analyzeAdbLogs: vi.fn(),
  }
}));

describe('AdbTab', () => {
  it('renders adb connection prompt initially', () => {
    render(<AdbTab />);
    
    expect(screen.getByText('Advanced Tools : Phone Connection')).toBeInTheDocument();
    expect(screen.getByText('Via USB cable')).toBeInTheDocument();
  });

  it('can select USB connection and enter log analyzer', async () => {
    render(<AdbTab />);
    
    const usbButton = screen.getByRole('button', { name: /Via USB cable/i });
    expect(usbButton).toBeInTheDocument();
    
    fireEvent.click(usbButton);
    
    // We expect it to change state (maybe connecting -> accepted)
    await waitFor(() => {
        expect(screen.queryByText('Advanced Tools : Phone Connection')).not.toBeInTheDocument();
    });
    
    // Might transition to full analyzer
    // If there's an intermediate state (e.g., "Waiting for device"), we can check that instead
  });
});

