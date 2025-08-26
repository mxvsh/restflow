// HTTP Method types
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

// HTTP Request representation
export interface HttpRequest {
  method: HttpMethod;
  url: string;
  headers?: Record<string, string>;
  body?: string;
  timeout?: number;
}

// HTTP Response representation
export interface HttpResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  responseTime: number;
}

// Flow directive types
export type DirectiveType = 'capture' | 'assert';

export interface CaptureDirective {
  type: 'capture';
  variable: string;
  expression: string; // JSONPath expression
}

export interface AssertDirective {
  type: 'assert';
  expression: string; // e.g., "status == 200" or "body.name == 'test'"
}

export type Directive = CaptureDirective | AssertDirective;

// Flow step representation
export interface FlowStep {
  name: string;
  request: HttpRequest;
  directives: Directive[];
}

// Complete flow representation
export interface Flow {
  name?: string;
  steps: FlowStep[];
}

// Execution context for variables
export interface ExecutionContext {
  variables: Record<string, any>;
  responses: HttpResponse[];
}

// Execution result
export interface StepResult {
  step: FlowStep;
  request: HttpRequest; // Resolved request with variables
  response?: HttpResponse;
  error?: Error;
  directives: DirectiveResult[];
  duration: number;
}

export interface DirectiveResult {
  directive: Directive;
  success: boolean;
  error?: string;
  capturedValue?: any;
}

export interface FlowResult {
  flow: Flow;
  steps: StepResult[];
  success: boolean;
  duration: number;
  context: ExecutionContext;
}

// Configuration
export interface RestflowConfig {
  timeout?: number;
  retries?: number;
  baseUrl?: string;
  headers?: Record<string, string>;
  variables?: Record<string, any>;
}

// Environment configuration
export interface Environment {
  name: string;
  variables: Record<string, string>;
}

// Reporter configuration
export interface ReporterOptions {
  format: 'pretty' | 'json';
  verbose?: boolean;
  showHeaders?: boolean;
  showBody?: boolean;
}
