import { request } from 'undici';
import { HttpRequest, HttpResponse } from '@restflow/types';

export interface HttpClientOptions {
  timeout?: number;
  retries?: number;
  followRedirects?: boolean;
}

export class HttpClient {
  private options: HttpClientOptions;

  constructor(options: HttpClientOptions = {}) {
    this.options = {
      timeout: 30000, // 30 seconds default
      retries: 0,
      followRedirects: true,
      ...options
    };
  }

  async execute(httpRequest: HttpRequest): Promise<HttpResponse> {
    const startTime = Date.now();

    try {
      const response = await request(httpRequest.url, {
        method: httpRequest.method,
        headers: httpRequest.headers,
        body: httpRequest.body,
        headersTimeout: httpRequest.timeout || this.options.timeout,
        bodyTimeout: httpRequest.timeout || this.options.timeout
      });

      const body = await response.body.text();
      const responseTime = Date.now() - startTime;

      // Convert headers to Record<string, string>
      const headers: Record<string, string> = {};
      for (const [key, value] of Object.entries(response.headers)) {
        if (typeof value === 'string') {
          headers[key] = value;
        } else if (Array.isArray(value)) {
          headers[key] = value.join(', ');
        } else if (value !== undefined) {
          headers[key] = String(value);
        }
      }

      return {
        status: response.statusCode,
        statusText: this.getStatusText(response.statusCode),
        headers,
        body,
        responseTime
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      if (error instanceof Error) {
        throw new HttpError(
          `HTTP request failed: ${error.message}`,
          httpRequest,
          responseTime,
          error
        );
      }
      
      throw new HttpError(
        `HTTP request failed: ${String(error)}`,
        httpRequest,
        responseTime
      );
    }
  }

  private getStatusText(statusCode: number): string {
    const statusTexts: Record<number, string> = {
      200: 'OK',
      201: 'Created',
      202: 'Accepted',
      204: 'No Content',
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      405: 'Method Not Allowed',
      409: 'Conflict',
      422: 'Unprocessable Entity',
      500: 'Internal Server Error',
      502: 'Bad Gateway',
      503: 'Service Unavailable',
      504: 'Gateway Timeout'
    };

    return statusTexts[statusCode] || 'Unknown';
  }
}

export class HttpError extends Error {
  public request: HttpRequest;
  public responseTime: number;
  public override cause?: Error;

  constructor(
    message: string,
    request: HttpRequest,
    responseTime: number,
    cause?: Error
  ) {
    super(message);
    this.name = 'HttpError';
    this.request = request;
    this.responseTime = responseTime;
    this.cause = cause;
  }
}

// Convenience function for single requests
export async function executeRequest(
  httpRequest: HttpRequest, 
  options?: HttpClientOptions
): Promise<HttpResponse> {
  const client = new HttpClient(options);
  return client.execute(httpRequest);
}
