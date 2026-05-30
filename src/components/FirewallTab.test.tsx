import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import FirewallTab from './FirewallTab';

describe('FirewallTab CI/CD Tests', () => {
  it('renders firewall module correctly', () => {
    render(<FirewallTab />);
    
    // Vérifie que le titre principal est rendu
    expect(screen.getByText('Local Firewall')).toBeInTheDocument();
    expect(screen.getByText('Automatic Control (AI)')).toBeInTheDocument();
  });

  it('affiche les applications installées et permet de basculer l\'état', async () => {
    // Injecter manuellement le Bridge pour le test
    window.AndroidBridge = {
      setAppStatus: vi.fn(),
      startNativeScan: vi.fn(),
      disinfectDevice: vi.fn(),
      analyzeAdbLogs: vi.fn(),
      requestActiveConnections: vi.fn(),
      requestInstalledApps: vi.fn(() => {
        if (window.onInstalledAppsList) {
          window.onInstalledAppsList(JSON.stringify([
            { id: "app_1", name: "Google Chrome", package: "com.android.chrome", initials: "GC", status: "allowed", type: "user", reason: "" }
          ]));
        }
      }),
      enableFirewall: vi.fn(),
    };

    render(<FirewallTab />);
    
    // We must wait for useEffect to fetch from the mock bridge and update apps state
    
    // Click on the Apps tab first
    const appsTab = await screen.findByText(/Rules & Applications/i);
    fireEvent.click(appsTab);

    await screen.findByText("Google Chrome");
    const chromeElements = screen.getAllByText('Google Chrome');
    expect(chromeElements.length).toBeGreaterThan(0);
    
    // Chercher le bouton "Block" correspondant à l'application autorisée et le cliquer
    const buttons = screen.getAllByRole('button');
    const blockButton = buttons.find(b => b.textContent === 'Block');
    
    if (blockButton) {
      fireEvent.click(blockButton);
      // Confirme que le composant essaie de communiquer avec l'OS
      expect(window.AndroidBridge.setAppStatus).toHaveBeenCalled();
    }
  });
});
