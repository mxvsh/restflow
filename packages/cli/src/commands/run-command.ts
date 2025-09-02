import { outro } from "@clack/prompts";
import { FlowExecutor } from "@restflow/engine";
import type { FlowResult } from "@restflow/types";
import { EXIT_CODES, exitWithError, getFlowFiles, sync } from "@restflow/utils";
import { Formatter } from "../utils/formatter.js";
import type { ParsedRunOptions } from "../utils/option-parser.js";
import {
	formatError,
	formatInfo,
	formatPath,
	formatSuccess,
	formatWarning,
} from "../utils/output-helpers.js";
import { createCLIReporter } from "../utils/reporter-factory.js";

/**
 * Execute flow files with the given options
 */
export async function executeRunCommand(
	path: string,
	options: ParsedRunOptions,
): Promise<void> {
	const formatter = new Formatter(options.colors);

	// Create a beautiful header
	const header = formatter.createHeader("🌀 RESTFLOW");
	console.log(header);

	try {
		// Get flow files to execute
		const { files, error: filesError } = getFlowFiles(path);
		if (filesError) {
			exitWithError(formatter.formatError(filesError), EXIT_CODES.FILE_ERROR);
		}

		console.log(
			formatter.formatInfo(`Found ${files.length} flow file(s) to execute`),
		);

		if (options.environmentFile) {
			console.log(
				formatter.formatInfo(
					`Using environment: ${formatter.formatPath(options.environmentFile)}`,
				),
			);
		}

		// Create reporter
		const reporter = createCLIReporter({
			format: options.format,
			verbose: options.verbose,
			showHeaders: options.showHeaders,
			showBody: options.showBody,
			colors: options.colors,
		});

		// Create executor
		const executor = new FlowExecutor({
			config: {
				timeout: options.timeout,
			},
		});

		const allResults: FlowResult[] = [];
		let hasFailures = false;

		// Execute each flow file
		for (let i = 0; i < files.length; i++) {
			const flowFile = files[i];

			if (files.length > 1) {
				console.log(
					`\n${formatInfo(`[${i + 1}/${files.length}] Executing: ${formatPath(flowFile)}`)}`,
				);
			}

			try {
				// Read flow file content
				const { content, error: readError } = sync.readFileContent(flowFile);
				if (readError) {
					console.error(
						formatError(`Failed to read ${flowFile}: ${readError}`),
					);
					hasFailures = true;
					continue;
				}

				// Execute flow
				const result = await executor.executeFlow(
					content,
					options.environmentFile,
				);
				allResults.push(result);

				// Report results
				if (result.flow.name) {
					reporter.onFlowStart(result.flow.name);
				}

				// Report each step
				for (let stepIndex = 0; stepIndex < result.steps.length; stepIndex++) {
					const stepResult = result.steps[stepIndex];
					reporter.onStepStart(
						stepResult.step.name,
						stepIndex,
						result.steps.length,
					);
					reporter.onStepComplete(stepResult);
				}

				reporter.onFlowComplete(result);

				if (!result.success) {
					hasFailures = true;
				}
			} catch (error) {
				console.error(
					formatError(
						`Execution failed for ${flowFile}: ${error instanceof Error ? error.message : String(error)}`,
					),
				);
				hasFailures = true;
			}
		}

		// Final summary for multiple files
		if (files.length > 1) {
			const totalSteps = allResults.reduce(
				(sum, result) => sum + result.steps.length,
				0,
			);
			const passedSteps = allResults.reduce(
				(sum, result) =>
					sum + result.steps.filter((step) => !step.error).length,
				0,
			);
			const totalDirectives = allResults.reduce(
				(sum, result) =>
					sum +
					result.steps.reduce(
						(stepSum, step) => stepSum + step.directives.length,
						0,
					),
				0,
			);
			const passedDirectives = allResults.reduce(
				(sum, result) =>
					sum +
					result.steps.reduce(
						(stepSum, step) =>
							stepSum + step.directives.filter((d) => d.success).length,
						0,
					),
				0,
			);
			const totalDuration = allResults.reduce(
				(sum, result) => sum + result.duration,
				0,
			);

			console.log(
				"\n" +
					formatter.createOverallSummaryTable(
						totalSteps,
						passedSteps,
						totalDirectives,
						passedDirectives,
						totalDuration,
					),
			);
		}

		if (hasFailures) {
			outro(formatWarning("Some flows failed - check output above"));
			process.exit(EXIT_CODES.GENERAL_ERROR);
		} else {
			outro(formatSuccess("All flows executed successfully"));
		}
	} catch (error) {
		console.error(
			formatError(
				`Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
			),
		);
		process.exit(EXIT_CODES.GENERAL_ERROR);
	}
}
