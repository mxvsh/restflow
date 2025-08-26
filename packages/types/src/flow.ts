import type { Directive } from "./directives.js";
import type { HttpRequest } from "./http.js";

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
