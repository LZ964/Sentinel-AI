export interface AppScannerPlugin {
  getInstalledApps(): Promise<{ apps: Array<{ packageName: string, appName: string, permissions: string[] }> }>;
  getDeviceSecurityInfo(): Promise<{ securityPatch: string, sdkInt: number, release: string }>;
}

export const AppScanner: AppScannerPlugin = {
  getInstalledApps: async () => ({ apps: [] }),
  getDeviceSecurityInfo: async () => ({ securityPatch: "2023-01-01", sdkInt: 33, release: "13" })
};
