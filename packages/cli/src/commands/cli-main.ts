import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { EXIT_CODES } from "@restflow/utils";
import { Command } from "commander";
import {
	parseRunOptions,
	type RunCommandOptions,
	validateFlowPathArgument,
} from "../utils/option-parser.js";
import { formatError } from "../utils/output-helpers.js";
import { executeInitCommand } from "./init-command.js";
import { executeRunCommand } from "./run-command.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Get package version from package.json
 */
function getVersion(): string {
	try {
		const packagePath = join(__dirname, "../../package.json");
		const packageJson = JSON.parse(readFileSync(packagePath, "utf-8"));
		return packageJson.version;
	} catch {
		return "0.0.1";
	}
}

/**
 * Main CLI entry point
 */
export async function cli(): Promise<void> {
	const program = new Command();

	program
		.name("restflow")
		.description("A lightweight CLI tool for API testing using .flow files")
		.version(getVersion());

	// Run command - execute flow files
	program
		.command("run")
		.description("Execute flow files")
		.argument("<path>", "Path to .flow file or directory")
		.option("-e, --env <file>", "Environment file to use")
		.option("--json", "Output results in JSON format")
		.option("-v, --verbose", "Verbose output with detailed information")
		.option(
			"--format <type>",
			"Output format (pretty, json, summary)",
			"pretty",
		)
		.option("--timeout <ms>", "Request timeout in milliseconds")
		.option("--show-headers", "Show HTTP headers in output")
		.option("--show-body", "Show HTTP request/response bodies")
		.option("--no-color", "Disable colored output")
		.action(async (path: string, rawOptions: RunCommandOptions) => {
			// Validate flow path
			const pathValidation = validateFlowPathArgument(path);
			if (!pathValidation.valid) {
				console.error(formatError(pathValidation.error!));
				process.exit(EXIT_CODES.VALIDATION_ERROR);
			}

			// Parse and validate options
			const { options, errors } = parseRunOptions(rawOptions);
			if (errors.length > 0) {
				console.error(formatError(`Invalid options: ${errors.join(", ")}`));
				process.exit(EXIT_CODES.VALIDATION_ERROR);
			}

			// Execute the run command
			await executeRunCommand(path, options);
		});

	// Init command - create new project
	program
		.command("init")
		.description("Initialize a new restflow project")
		.action(executeInitCommand);

	await program.parseAsync();
}
