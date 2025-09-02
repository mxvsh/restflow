// Flow directive types
export type DirectiveType = "capture" | "assert";

export interface CaptureDirective {
	type: "capture";
	variable: string;
	expression: string; // JSONPath expression
}

export interface AssertDirective {
	type: "assert";
	expression: string; // e.g., "status == 200" or "body.name == 'test'"
}

export type Directive = CaptureDirective | AssertDirective;

export interface DirectiveResult {
	directive: Directive;
	success: boolean;
	error?: string;
	capturedValue?: unknown;
}
