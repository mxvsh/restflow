import type { DirectiveResult } from "./directives.js";
import type { Flow, FlowStep } from "./flow.js";
import type { HttpRequest, HttpResponse } from "./http.js";

// Execution context for variables
export interface ExecutionContext {
	variables: Record<string, unknown>;
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

export interface FlowResult {
	flow: Flow;
	steps: StepResult[];
	success: boolean;
	duration: number;
	context: ExecutionContext;
}
