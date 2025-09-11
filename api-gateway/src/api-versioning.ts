import { logger } from './logger.ts';

interface VersionInfo {
  version: string;
  supported: boolean;
  deprecated: boolean;
  deprecationDate?: string;
  sunsetDate?: string;
  migrationGuide?: string;
}

export class ApiVersioning {
  private versions = new Map<string, VersionInfo>();

  constructor() {
    this.initializeDefaultVersions();
  }

  private initializeDefaultVersions(): void {
    // Current supported versions
    this.versions.set('v1', {
      version: 'v1',
      supported: true,
      deprecated: false
    });

    // Future versions can be added here
    this.versions.set('v2', {
      version: 'v2',
      supported: false,
      deprecated: false
    });
  }

  isValidVersion(version: string): boolean {
    const versionInfo = this.versions.get(version);
    return versionInfo ? versionInfo.supported : false;
  }

  isDeprecated(version: string): boolean {
    const versionInfo = this.versions.get(version);
    return versionInfo ? versionInfo.deprecated : false;
  }

  getVersionInfo(version: string): VersionInfo | null {
    return this.versions.get(version) || null;
  }

  getSupportedVersions(): string[] {
    return Array.from(this.versions.values())
      .filter(v => v.supported)
      .map(v => v.version);
  }

  getAllVersions(): VersionInfo[] {
    return Array.from(this.versions.values());
  }

  addVersion(version: string, info: VersionInfo): void {
    this.versions.set(version, info);
    logger.info('API version added', { version, info });
  }

  deprecateVersion(version: string, deprecationDate: string, sunsetDate?: string): void {
    const versionInfo = this.versions.get(version);
    if (versionInfo) {
      versionInfo.deprecated = true;
      versionInfo.deprecationDate = deprecationDate;
      versionInfo.sunsetDate = sunsetDate;
      logger.info('API version deprecated', { version, deprecationDate, sunsetDate });
    }
  }

  removeVersion(version: string): void {
    this.versions.delete(version);
    logger.info('API version removed', { version });
  }

  // Version compatibility helpers
  getCompatibleVersions(targetVersion: string): string[] {
    const target = this.versions.get(targetVersion);
    if (!target) return [];

    // For now, return all supported versions
    // In a real implementation, you might have more sophisticated compatibility logic
    return this.getSupportedVersions();
  }

  // Version migration helpers
  getMigrationPath(fromVersion: string, toVersion: string): string[] {
    const supportedVersions = this.getSupportedVersions();
    const fromIndex = supportedVersions.indexOf(fromVersion);
    const toIndex = supportedVersions.indexOf(toVersion);

    if (fromIndex === -1 || toIndex === -1) {
      return [];
    }

    if (fromIndex <= toIndex) {
      return supportedVersions.slice(fromIndex, toIndex + 1);
    } else {
      // Downgrade path
      return supportedVersions.slice(toIndex, fromIndex + 1).reverse();
    }
  }

  // Version header helpers
  getVersionFromHeader(header: string): string | null {
    // Extract version from header like "application/vnd.api+json;version=1"
    const match = header.match(/version=(\d+)/);
    return match ? `v${match[1]}` : null;
  }

  getVersionFromPath(path: string): string | null {
    // Extract version from path like "/api/v1/service"
    const match = path.match(/\/api\/(v\d+)\//);
    return match ? match[1] : null;
  }

  // Version negotiation
  negotiateVersion(requestedVersions: string[]): string | null {
    const supportedVersions = this.getSupportedVersions();
    
    // Find the highest supported version that the client can accept
    for (const requested of requestedVersions) {
      if (supportedVersions.includes(requested)) {
        return requested;
      }
    }

    // If no exact match, try to find a compatible version
    for (const supported of supportedVersions) {
      if (this.isCompatible(requestedVersions[0], supported)) {
        return supported;
      }
    }

    return null;
  }

  private isCompatible(requested: string, supported: string): boolean {
    // Simple compatibility check - can be enhanced
    const requestedMajor = parseInt(requested.replace('v', ''));
    const supportedMajor = parseInt(supported.replace('v', ''));
    
    return requestedMajor <= supportedMajor;
  }

  // Version statistics
  getVersionStats(): any {
    const total = this.versions.size;
    const supported = Array.from(this.versions.values()).filter(v => v.supported).length;
    const deprecated = Array.from(this.versions.values()).filter(v => v.deprecated).length;

    return {
      total,
      supported,
      deprecated,
      versions: this.getAllVersions()
    };
  }
}
