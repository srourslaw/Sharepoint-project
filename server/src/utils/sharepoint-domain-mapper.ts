import { sharepointConfig } from './config';

/**
 * SharePoint Domain Mapping Utility
 *
 * Maps technical SharePoint tenant domains to business-friendly domains
 * Example: netorgft18344752.sharepoint.com -> bluewaveintelligence.sharepoint.com
 */

export interface SharePointDomainMapper {
  mapTechnicalToBusiness(url: string): string;
  mapBusinessToTechnical(url: string): string;
  isEnabled(): boolean;
}

class SharePointDomainMapperImpl implements SharePointDomainMapper {
  private readonly technicalDomain: string;
  private readonly businessDomain: string;
  private readonly enabled: boolean;

  constructor() {
    this.technicalDomain = sharepointConfig.domainMapping.technicalDomain;
    this.businessDomain = sharepointConfig.domainMapping.businessDomain;
    this.enabled = sharepointConfig.domainMapping.enabled;
  }

  /**
   * Map technical SharePoint URLs to business-friendly URLs
   * @param url The technical SharePoint URL
   * @returns The business-friendly URL
   */
  mapTechnicalToBusiness(url: string): string {
    if (!this.enabled || !url) {
      return url;
    }

    // Replace technical domain with business domain
    return url.replace(this.technicalDomain, this.businessDomain);
  }

  /**
   * Map business-friendly URLs back to technical URLs for API calls
   * @param url The business-friendly SharePoint URL
   * @returns The technical URL for API calls
   */
  mapBusinessToTechnical(url: string): string {
    if (!this.enabled || !url) {
      return url;
    }

    // Replace business domain with technical domain
    return url.replace(this.businessDomain, this.technicalDomain);
  }

  /**
   * Check if domain mapping is enabled
   * @returns true if domain mapping is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Transform SharePoint response objects to use business-friendly domains
   * @param obj The SharePoint response object
   * @returns The transformed object with business-friendly URLs
   */
  transformResponseObject(obj: any): any {
    if (!this.enabled || !obj) {
      return obj;
    }

    // Create a deep copy to avoid mutating the original
    const transformed = JSON.parse(JSON.stringify(obj));

    // Recursively transform all URL properties
    this.transformObjectUrls(transformed);

    return transformed;
  }

  /**
   * Recursively transform URLs in an object
   * @param obj The object to transform
   */
  private transformObjectUrls(obj: any): void {
    if (typeof obj !== 'object' || obj === null) {
      return;
    }

    // Handle arrays
    if (Array.isArray(obj)) {
      obj.forEach(item => this.transformObjectUrls(item));
      return;
    }

    // Handle objects
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];

        // Transform URL strings
        if (typeof value === 'string' && value.includes(this.technicalDomain)) {
          obj[key] = this.mapTechnicalToBusiness(value);
        }
        // Recursively transform nested objects
        else if (typeof value === 'object' && value !== null) {
          this.transformObjectUrls(value);
        }
      }
    }
  }

  /**
   * Log domain mapping information for debugging
   */
  logMappingInfo(): void {
    console.log('🔗 SharePoint Domain Mapping:', {
      enabled: this.enabled,
      technicalDomain: this.technicalDomain,
      businessDomain: this.businessDomain
    });
  }
}

// Create singleton instance
export const sharePointDomainMapper = new SharePointDomainMapperImpl();

// Export utility functions for direct use
export const mapTechnicalToBusiness = (url: string): string => {
  return sharePointDomainMapper.mapTechnicalToBusiness(url);
};

export const mapBusinessToTechnical = (url: string): string => {
  return sharePointDomainMapper.mapBusinessToTechnical(url);
};

export const transformSharePointResponse = (obj: any): any => {
  return sharePointDomainMapper.transformResponseObject(obj);
};

export const isSharePointDomainMappingEnabled = (): boolean => {
  return sharePointDomainMapper.isEnabled();
};