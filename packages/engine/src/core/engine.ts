import {
	DefaultAssertionEvaluator,
	DefaultValueExtractor,
} from "@restflow/assertions";
import { EnvironmentManager } from "@restflow/environment";
import { HttpClient } from "@restflow/http";
import { parseFlow } from "@restflow/parser";
import pc from "picocolors";
import type {
	AssertDirective,
	CaptureDirective,
	ConsoleDirective,
	DirectiveResult,
	ExecutionContext,
	Flow,
	FlowResult,
	FlowStep,
	HttpResponse,
	RestflowConfig,
	StepResult,
} from "@restflow/types";
import {
	createExecutionContext,
	DefaultVariableResolver,
} from "@restflow/variables";

export interface FlowExecutorOptions {
	config?: RestflowConfig;
	environmentPath?: string;
	variableResolver?: DefaultVariableResolver;
	httpClient?: HttpClient;
	assertionEvaluator?: DefaultAssertionEvaluator;
	environmentManager?: EnvironmentManager;
}

export class FlowExecutor {
	private config: RestflowConfig;
	private variableResolver: DefaultVariableResolver;
	private httpClient: HttpClient;
	private assertionEvaluator: DefaultAssertionEvaluator;
	private environmentManager: EnvironmentManager;
	private valueExtractor: DefaultValueExtractor;

	constructor(options: FlowExecutorOptions = {}) {
		this.config = {
			timeout: 30000,
			retries: 0,
			...options.config,
		};

		this.variableResolver =
			options.variableResolver || new DefaultVariableResolver();
		this.httpClient =
			options.httpClient ||
			new HttpClient({
				timeout: this.config.timeout,
				retries: this.config.retries,
			});
		this.assertionEvaluator =
			options.assertionEvaluator || new DefaultAssertionEvaluator();
		this.environmentManager =
			options.environmentManager || new EnvironmentManager();
		this.valueExtractor = new DefaultValueExtractor();
	}

	/**
	 * Parse and execute a flow from content string
	 */
	async executeFlow(
		flowContent: string,
		environmentPath?: string,
	): Promise<FlowResult> {
		const startTime = Date.now();

		try {
			// Parse the flow
			const parseResult = parseFlow(flowContent);
			if (parseResult.errors.length > 0) {
				throw new FlowExecutionError(
					`Flow parsing failed: ${parseResult.errors.join(", ")}`,
				);
			}

			// Execute the parsed flow
			return await this.executeFlowObject(parseResult.flow, environmentPath);
		} catch (error) {
			const duration = Date.now() - startTime;
			console.error(
				`Flow execution error: ${error instanceof Error ? error.message : String(error)}`,
			);
			return {
				flow: { steps: [] },
				steps: [],
				success: false,
				duration,
				context: { variables: {}, responses: [] },
			};
		}
	}

	/**
	 * Execute a pre-parsed Flow object
	 */
	async executeFlowObject(
		flow: Flow,
		environmentPath?: string,
	): Promise<FlowResult> {
		const startTime = Date.now();
		const stepResults: StepResult[] = [];
		let success = true;

		try {
			// Initialize execution context
			const context = await this.initializeContext(environmentPath);

			// Execute each step
			for (const step of flow.steps) {
				const stepResult = await this.executeStep(step, context);
				stepResults.push(stepResult);

				// Update context with response
				if (stepResult.response) {
					context.responses.push(stepResult.response);
				}

				// If step failed, mark overall execution as failed
				if (stepResult.error || stepResult.directives.some((d) => !d.success)) {
					success = false;
				}

				// Process capture directives to update context variables
				this.processCaptureDirectives(stepResult, context);
			}

			const duration = Date.now() - startTime;

			return {
				flow,
				steps: stepResults,
				success,
				duration,
				context,
			};
		} catch (error) {
			const duration = Date.now() - startTime;
			throw new FlowExecutionError(
				`Flow execution failed: ${error instanceof Error ? error.message : String(error)}`,
				{
					flow,
					steps: stepResults,
					success: false,
					duration,
					context: { variables: {}, responses: [] },
				},
			);
		}
	}

	/**
	 * Execute a single flow step
	 */
	private async executeStep(
		step: FlowStep,
		context: ExecutionContext,
	): Promise<StepResult> {
		const startTime = Date.now();

		try {
			// Resolve variables in the request
			const resolvedRequest = this.variableResolver.resolveRequest(
				step.request,
				context,
			);

			// Execute the HTTP request
			const response = await this.httpClient.execute(resolvedRequest);

			// Evaluate directives
			const directiveResults = this.evaluateDirectives(
				step.directives,
				response,
				context,
			);

			const duration = Date.now() - startTime;

			return {
				step,
				request: resolvedRequest,
				response,
				directives: directiveResults,
				duration,
			};
		} catch (error) {
			const duration = Date.now() - startTime;

			return {
				step,
				request: step.request,
				error: error instanceof Error ? error : new Error(String(error)),
				directives: step.directives.map((directive) => ({
					directive,
					success: false,
					error: `Step execution failed: ${error instanceof Error ? error.message : String(error)}`,
				})),
				duration,
			};
		}
	}

	/**
	 * Initialize execution context with environment variables
	 */
	private async initializeContext(
		environmentPath?: string,
	): Promise<ExecutionContext> {
		try {
			let environmentVariables: Record<string, string> = {};

			if (environmentPath) {
				const environment =
					await this.environmentManager.loadEnvironment(environmentPath);
				environmentVariables = environment.variables;
			}

			return createExecutionContext(
				environmentVariables,
				{}, // No captured variables initially
				this.config.variables || {}, // CLI variables
			);
		} catch (error) {
			// If environment loading fails, continue with empty environment
			console.warn(
				`Warning: Failed to load environment: ${error instanceof Error ? error.message : String(error)}`,
			);
			return createExecutionContext({}, {}, this.config.variables || {});
		}
	}

	/**
	 * Evaluate all directives for a response
	 */
	private evaluateDirectives(
		directives: Array<CaptureDirective | AssertDirective | ConsoleDirective>,
		response: HttpResponse,
		context: ExecutionContext,
	): DirectiveResult[] {
		const results: DirectiveResult[] = [];
		
		for (const directive of directives) {
			try {
				let result: DirectiveResult;
				
				if (directive.type === "capture") {
					result = this.evaluateCaptureDirective(directive, response);
					// Immediately store captured variable in context for subsequent directives
					if (result.success && result.capturedValue !== undefined) {
						context.variables[directive.variable] = result.capturedValue;
					}
				} else if (directive.type === "assert") {
					result = this.evaluateAssertDirective(directive, response, context);
				} else if (directive.type === "console") {
					result = this.evaluateConsoleDirective(directive, response, context);
				} else {
					result = {
						directive,
						success: false,
						error: `Unknown directive type: ${
							// biome-ignore lint/suspicious/noExplicitAny: _
							(directive as any).type
						}`,
					};
				}
				
				results.push(result);
			} catch (error) {
				results.push({
					directive,
					success: false,
					error: error instanceof Error ? error.message : String(error),
				});
			}
		}
		
		return results;
	}

	/**
	 * Evaluate a capture directive
	 */
	private evaluateCaptureDirective(
		directive: CaptureDirective,
		response: HttpResponse,
	): DirectiveResult {
		try {
			const capturedValue = this.valueExtractor.extract(
				directive.expression,
				response,
			);

			return {
				directive,
				success: true,
				capturedValue,
			};
		} catch (error) {
			return {
				directive,
				success: false,
				error: `Failed to capture value: ${error instanceof Error ? error.message : String(error)}`,
			};
		}
	}

	/**
	 * Evaluate an assert directive
	 */
	private evaluateAssertDirective(
		directive: AssertDirective,
		response: HttpResponse,
		context: ExecutionContext,
	): DirectiveResult {
		try {
			const result = this.assertionEvaluator.evaluate(
				directive.expression,
				response,
				context,
			);

			return {
				directive,
				success: result.passed,
				error: result.passed
					? undefined
					: `Assertion failed: expected ${result.expected}, got ${result.actual}`,
			};
		} catch (error) {
			return {
				directive,
				success: false,
				error: `Failed to evaluate assertion: ${error instanceof Error ? error.message : String(error)}`,
			};
		}
	}

	/**
	 * Evaluate a console directive
	 */
	private evaluateConsoleDirective(
		directive: ConsoleDirective,
		response: HttpResponse,
		context: ExecutionContext,
	): DirectiveResult {
		try {
			let value: unknown;

			// Check if it's a captured variable first
			if (directive.expression in context.variables) {
				value = context.variables[directive.expression];
			} else {
				// Otherwise, extract from response
				value = this.valueExtractor.extract(
					directive.expression,
					response,
				);
			}

			// Generate formatted console output without printing
			const consoleOutput = this.formatConsoleValue(directive.expression, value);

			return {
				directive,
				success: true,
				consoleOutput,
			};
		} catch (error) {
			return {
				directive,
				success: false,
				error: `Failed to console log value: ${error instanceof Error ? error.message : String(error)}`,
			};
		}
	}

	/**
	 * Format a value for console output with colors and formatting
	 */
	private formatConsoleValue(expression: string, value: unknown): string {
		const lines: string[] = [];
		
		if (value === null) {
			lines.push(pc.gray('null'));
		} else if (value === undefined) {
			lines.push(pc.gray('undefined'));
		} else if (typeof value === 'string') {
			lines.push(pc.green(`"${value}"`));
		} else if (typeof value === 'number') {
			lines.push(pc.yellow(String(value)));
		} else if (typeof value === 'boolean') {
			lines.push(pc.magenta(String(value)));
		} else if (typeof value === 'object') {
			try {
				const formatted = JSON.stringify(value, null, 2);
				// Basic JSON syntax highlighting
				const highlighted = formatted
					.replace(/"([^"]+)":/g, `${pc.cyan('"$1"')}:`) // Keys
					.replace(/: "([^"]+)"/g, `: ${pc.green('"$1"')}`) // String values
					.replace(/: (\d+)/g, `: ${pc.yellow('$1')}`) // Numbers
					.replace(/: (true|false)/g, `: ${pc.magenta('$1')}`) // Booleans
					.replace(/: null/g, `: ${pc.gray('null')}`); // Null

				lines.push(...highlighted.split('\n'));
			} catch {
				lines.push(pc.white(String(value)));
			}
		} else {
			lines.push(pc.white(String(value)));
		}

		return lines.join('\n');
	}

	/**
	 * Process capture directives to update execution context variables
	 */
	private processCaptureDirectives(
		stepResult: StepResult,
		context: ExecutionContext,
	): void {
		for (const directiveResult of stepResult.directives) {
			if (
				directiveResult.directive.type === "capture" &&
				directiveResult.success &&
				directiveResult.capturedValue !== undefined
			) {
				const captureDirective = directiveResult.directive as CaptureDirective;
				context.variables[captureDirective.variable] =
					directiveResult.capturedValue;
			}
		}
	}
}

export class FlowExecutionError extends Error {
	public flowResult?: FlowResult;

	constructor(message: string, flowResult?: FlowResult) {
		super(message);
		this.name = "FlowExecutionError";
		this.flowResult = flowResult;
	}
}

// Convenience functions for common use cases
export async function executeFlowFromString(
	flowContent: string,
	options?: FlowExecutorOptions,
): Promise<FlowResult> {
	const executor = new FlowExecutor(options);
	return executor.executeFlow(flowContent);
}

export async function executeFlowWithEnvironment(
	flowContent: string,
	environmentPath: string,
	options?: FlowExecutorOptions,
): Promise<FlowResult> {
	const executor = new FlowExecutor(options);
	return executor.executeFlow(flowContent, environmentPath);
}
