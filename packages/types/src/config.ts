// Configuration
export interface RestflowConfig {
	timeout?: number;
	retries?: number;
	baseUrl?: string;
	headers?: Record<string, string>;
	variables?: Record<string, unknown>;
}

// Environment configuration
export interface Environment {
	name: string;
	variables: Record<string, string>;
}

// Reporter options
export interface ReporterOptions {
	format?: "console" | "json" | "summary" | "pretty";
	verbose?: boolean;
	showHeaders?: boolean;
	showBody?: boolean;
	colors?: boolean;
}
