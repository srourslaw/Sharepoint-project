import { Client } from '@microsoft/microsoft-graph-client';
import { 
  SharePointError, 
  RetryOptions, 
  BatchRequest, 
  BatchResponse,
  SharePointServiceConfig
} from '../types/sharepoint';

/**
 * SharePoint API Client with authentication, retry logic, and error handling
 */
export class SharePointClient {
  private graphClient: Client;
  private retryOptions: RetryOptions;

  constructor(graphClient: Client, config: SharePointServiceConfig) {
    this.graphClient = graphClient;
    this.retryOptions = config.retryOptions;
  }

  /**
   * Make authenticated request with retry logic
   */
  async makeRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    endpoint: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<T> {
    return this.executeWithRetry(async () => {
      try {
        let request = this.graphClient.api(endpoint);
        
        if (headers) {
          Object.entries(headers).forEach(([key, value]) => {
            request = request.header(key, value);
          });
        }

        switch (method) {
          case 'GET':
            return await request.get();
          case 'POST':
            return await request.post(body);
          case 'PUT':
            return await request.put(body);
          case 'DELETE':
            return await request.delete();
          case 'PATCH':
            return await request.patch(body);
          default:
            throw new Error(`Unsupported HTTP method: ${method}`);
        }
      } catch (error) {
        throw this.handleGraphError(error);
      }
    });
  }

  /**
   * Download file content with proper error handling
   */
  async downloadFile(downloadUrl: string): Promise<Buffer> {
    return this.executeWithRetry(async () => {
      try {
        const response = await fetch(downloadUrl, {
          method: 'GET',
          headers: await this.getAuthHeaders(),
        });

        if (!response.ok) {
          throw new SharePointError(
            'DOWNLOAD_FAILED',
            `Failed to download file: ${response.status} ${response.statusText}`,
            response.status
          );
        }

        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
      } catch (error) {
        if (error instanceof SharePointError) {
          throw error;
        }
        throw this.handleGraphError(error);
      }
    });
  }

  /**
   * Upload file content with chunking for large files
   */
  async uploadFile(
    endpoint: string,
    content: Buffer,
    fileName: string,
    mimeType?: string,
    chunkSize: number = 10 * 1024 * 1024 // 10MB chunks
  ): Promise<any> {
    return this.executeWithRetry(async () => {
      try {
        const fileSize = content.length;
        
        if (fileSize <= chunkSize) {
          // Simple upload for small files
          return await this.graphClient
            .api(endpoint)
            .header('Content-Type', mimeType || 'application/octet-stream')
            .put(content);
        } else {
          // Resumable upload for large files
          return await this.uploadLargeFile(endpoint, content, fileName, mimeType, chunkSize);
        }
      } catch (error) {
        throw this.handleGraphError(error);
      }
    });
  }

  /**
   * Batch requests for better performance
   */
  async batchRequests(requests: BatchRequest[]): Promise<BatchResponse[]> {
    return this.executeWithRetry(async () => {
      try {
        const batchPayload = {
          requests: requests.map(req => ({
            id: req.id,
            method: req.method,
            url: req.url.startsWith('/') ? req.url : `/${req.url}`,
            body: req.body,
            headers: req.headers || {}
          }))
        };

        const response = await this.graphClient
          .api('$batch')
          .post(batchPayload);

        return response.responses || [];
      } catch (error) {
        throw this.handleGraphError(error);
      }
    });
  }

  /**
   * Get paginated results
   */
  async getAllPages<T>(endpoint: string, maxPages: number = 10): Promise<T[]> {
    const allItems: T[] = [];
    let currentUrl = endpoint;
    let pageCount = 0;

    while (currentUrl && pageCount < maxPages) {
      const response = await this.makeRequest<any>('GET', currentUrl);
      
      if (response.value) {
        allItems.push(...response.value);
      }

      currentUrl = response['@odata.nextLink'] || null;
      pageCount++;
    }

    return allItems;
  }

  /**
   * Execute request with exponential backoff retry
   */
  private async executeWithRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: SharePointError;
    
    for (let attempt = 0; attempt <= this.retryOptions.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as SharePointError;
        
        if (attempt === this.retryOptions.maxRetries) {
          throw lastError;
        }

        if (!this.shouldRetry(lastError, attempt)) {
          throw lastError;
        }

        const delay = this.calculateDelay(attempt);
        console.log(`SharePoint API retry ${attempt + 1}/${this.retryOptions.maxRetries} after ${delay}ms: ${lastError.message}`);
        
        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  /**
   * Determine if error should be retried
   */
  private shouldRetry(error: SharePointError, attempt: number): boolean {
    // Don't retry if we've exceeded max retries
    if (attempt >= this.retryOptions.maxRetries) {
      return false;
    }

    // Retry on specific status codes
    if (error.statusCode && this.retryOptions.retryableStatusCodes.includes(error.statusCode)) {
      return true;
    }

    // Retry on specific error codes
    if (this.retryOptions.retryableErrors.some(code => error.code.includes(code))) {
      return true;
    }

    // Retry on rate limiting
    if (error.statusCode === 429 || error.code === 'TooManyRequests') {
      return true;
    }

    // Retry on temporary server errors
    if (error.statusCode && error.statusCode >= 500) {
      return true;
    }

    return false;
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateDelay(attempt: number): number {
    const delay = this.retryOptions.baseDelay * Math.pow(this.retryOptions.backoffMultiplier, attempt);
    return Math.min(delay, this.retryOptions.maxDelay);
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Handle Microsoft Graph errors
   */
  private handleGraphError(error: any): SharePointError {
    if (error instanceof SharePointError) {
      return error;
    }

    // Handle Graph SDK errors
    if (error.code) {
      return new SharePointError(
        error.code,
        error.message || 'SharePoint API error',
        error.statusCode,
        error.innerError
      );
    }

    // Handle HTTP errors
    if (error.response) {
      return new SharePointError(
        'HTTP_ERROR',
        error.message || `HTTP ${error.response.status}: ${error.response.statusText}`,
        error.response.status
      );
    }

    // Handle network errors
    if (error.message && error.message.includes('network')) {
      return new SharePointError(
        'NETWORK_ERROR',
        'Network connection failed',
        0
      );
    }

    // Generic error
    return new SharePointError(
      'UNKNOWN_ERROR',
      error.message || 'Unknown SharePoint error occurred',
      500
    );
  }

  /**
   * Get authentication headers
   */
  private async getAuthHeaders(): Promise<Record<string, string>> {
    try {
      // Get access token from the Graph client's authentication provider
      const accessToken = await this.getAccessToken();
      
      return {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      };
    } catch (error) {
      throw new SharePointError(
        'AUTH_ERROR',
        'Failed to get authentication headers',
        401
      );
    }
  }

  /**
   * Extract access token from Graph client
   */
  private async getAccessToken(): Promise<string> {
    try {
      // Access the Graph client's internal authentication provider
      // Note: This is a workaround since the Graph SDK doesn't expose auth provider directly
      const clientInternal = this.graphClient as any;
      
      if (clientInternal._authenticationProvider && 
          typeof clientInternal._authenticationProvider.getAccessToken === 'function') {
        return await clientInternal._authenticationProvider.getAccessToken();
      }
      
      // Alternative approach: try to use the middleware pattern for auth
      // In production, the access token would typically be passed from middleware
      throw new SharePointError(
        'AUTH_TOKEN_UNAVAILABLE',
        'Unable to retrieve access token from Graph client. Ensure authentication middleware is properly configured.',
        401
      );
    } catch (error) {
      if (error instanceof SharePointError) {
        throw error;
      }
      throw new SharePointError(
        'AUTH_TOKEN_EXTRACTION_FAILED',
        `Failed to extract access token: ${error instanceof Error ? error.message : 'Unknown error'}`,
        401
      );
    }
  }

  /**
   * Upload large file with resumable upload
   */
  private async uploadLargeFile(
    endpoint: string,
    content: Buffer,
    fileName: string,
    mimeType?: string,
    chunkSize: number = 10 * 1024 * 1024
  ): Promise<any> {
    // Create upload session
    const uploadSession = await this.graphClient
      .api(`${endpoint}:/createUploadSession`)
      .post({
        item: {
          '@microsoft.graph.conflictBehavior': 'replace',
          name: fileName
        }
      });

    const uploadUrl = uploadSession.uploadUrl;
    const fileSize = content.length;
    let uploadedBytes = 0;

    // Upload chunks
    while (uploadedBytes < fileSize) {
      const chunkStart = uploadedBytes;
      const chunkEnd = Math.min(uploadedBytes + chunkSize - 1, fileSize - 1);
      const chunk = content.slice(chunkStart, chunkEnd + 1);

      const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Range': `bytes ${chunkStart}-${chunkEnd}/${fileSize}`,
          'Content-Length': chunk.length.toString()
        },
        body: chunk
      });

      if (response.status === 201 || response.status === 200) {
        // Upload complete
        return await response.json();
      } else if (response.status === 202) {
        // Continue uploading
        uploadedBytes = chunkEnd + 1;
      } else {
        throw new SharePointError(
          'UPLOAD_CHUNK_FAILED',
          `Failed to upload chunk: ${response.status} ${response.statusText}`,
          response.status
        );
      }
    }

    throw new SharePointError('UPLOAD_INCOMPLETE', 'File upload did not complete successfully');
  }
}