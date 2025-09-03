// Flow directive types
export type DirectiveType = "capture" | "assert" | "console";

export interface CaptureDirective {
	type: "capture";
	variable: string;
	expression: string; // JSONPath expression
}

export interface AssertDirective {
	type: "assert";
	expression: string; // e.g., "status == 200" or "body.name == 'test'"
}

export interface ConsoleDirective {
	type: "console";
	expression: string; // e.g., "body", "cookies.sessionId", "headers.content-type"
}

export type Directive = CaptureDirective | AssertDirective | ConsoleDirective;

export interface DirectiveResult {
	directive: Directive;
	success: boolean;
	error?: string;
	capturedValue?: unknown;
}
