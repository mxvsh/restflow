// HTTP Method types
export type HttpMethod =
	| "GET"
	| "POST"
	| "PUT"
	| "DELETE"
	| "PATCH"
	| "HEAD"
	| "OPTIONS";

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