import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import ScannerTab from './ScannerTab';

// Mock localAi and appScanner packages to avoid running slow browser models in tests
vi.mock('../lib/localAi', () => ({
  LocalAIService: {
    initialize: vi.fn().mockResolvedValue(true),
    generateReport: vi.fn().mockResolvedValue({
      results: [],
      logs: [{ message: "Test analysis finished", type: "success" }]
    }),
  }
}));

vi.mock('../lib/appScanner', () => ({
  AppScanner: {
    getInstalledApps: vi.fn().mockResolvedValue({ apps: [] }),
  }
}));

describe('ScannerTab', () => {
  it('renders system security audit tab elements correctly', () => {
    render(<ScannerTab />);
    
    expect(screen.getByText('System Security Audit')).toBeInTheDocument();
    expect(screen.getByText('Scan Apps')).toBeInTheDocument();
    expect(screen.getAllByText('Full Audit')[0]).toBeInTheDocument();
  });

  it('allows tab switching between overview, results and terminal', () => {
    render(<ScannerTab />);

    const resultsTab = screen.getByText('Audit Results');
    const terminalTab = screen.getByText('Audit Terminal');

    expect(resultsTab).toBeInTheDocument();
    expect(terminalTab).toBeInTheDocument();
    
    // Switch to results
    fireEvent.click(resultsTab);
    expect(screen.queryByText('Firmware verification limits')).not.toBeInTheDocument();
  });

  it('can trigger a scan', async () => {
    render(<ScannerTab />);
    
    const scanButton = screen.getAllByRole('button').find(btn => btn.textContent?.includes('Full Audit'));
    expect(scanButton).toBeInTheDocument();
    
    fireEvent.click(scanButton!);
    
    await waitFor(() => {
      expect(screen.getByText('In progress...')).toBeInTheDocument();
    });
  });
});
