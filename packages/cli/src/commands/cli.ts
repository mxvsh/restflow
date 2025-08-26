// import { HttpClient } from '@restflow/http'; // TODO: Use when implementing execution
import { confirm, intro, outro, text } from "@clack/prompts";
import { parseFlow } from "@restflow/parser";
import { Command } from "commander";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import pc from "picocolors";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get package version
function getVersion(): string {
	try {
		const packagePath = join(__dirname, "../../package.json");
		const packageJson = JSON.parse(readFileSync(packagePath, "utf-8"));
		return packageJson.version;
	} catch {
		return "0.0.1";
	}
}

export async function cli(): Promise<void> {
	const program = new Command();

	program
		.name("restflow")
		.description("A lightweight CLI tool for API testing using .flow files")
		.version(getVersion());

	// Run command
	program
		.command("run")
		.description("Execute flow files")
		.argument("<path>", "Path to .flow file or directory")
		.option("-e, --env <file>", "Environment file to use")
		.option("--json", "Output results in JSON format")
		.option("-v, --verbose", "Verbose output")
		.action(async (path: string, options: any) => {
			await runFlows(path, options);
		});

	// Init command (for future use)
	program
		.command("init")
		.description("Initialize a new restflow project")
		.action(async () => {
			intro(pc.cyan("🌀 Restflow Init"));

			const projectName = await text({
				message: "What is your project name?",
				placeholder: "my-api-tests",
				validate: (value) => {
					if (!value) return "Project name is required";
					return undefined;
				},
			});

			if (!projectName || typeof projectName !== "string") {
				outro(pc.red("Invalid project name"));
				return;
			}

			const shouldContinue = await confirm({
				message: "This will create a new restflow project. Continue?",
			});

			if (shouldContinue) {
				outro(pc.green("✨ Project will be created! (Implementation pending)"));
			} else {
				outro(pc.gray("Operation cancelled."));
			}
		});

	await program.parseAsync();
}

async function runFlows(path: string, options: any): Promise<void> {
	try {
		intro(pc.cyan("🌀 Restflow"));

		// For now, just parse and validate the flow file
		console.log(pc.blue(`Running flows from: ${path}`));

		if (options.env) {
			console.log(pc.blue(`Using environment: ${options.env}`));
		}

		// Basic implementation - just parse the file
		if (path.endsWith(".flow")) {
			const content = readFileSync(path, "utf-8");
			const result = parseFlow(content);

			if (result.errors.length > 0) {
				console.log(pc.red("\nParsing errors:"));
				result.errors.forEach((error) => {
					console.log(pc.red(`  ❌ ${error}`));
				});
				process.exit(1);
			}

			console.log(
				pc.green(
					`\n✅ Parsed ${result.flow.steps.length} step(s) successfully`,
				),
			);

			if (options.verbose) {
				result.flow.steps.forEach((step, index) => {
					console.log(`\n${pc.cyan(`Step ${index + 1}:`)} ${step.name}`);
					console.log(`  ${step.request.method} ${step.request.url}`);
					if (step.directives.length > 0) {
						console.log(`  ${step.directives.length} directive(s)`);
					}
				});
			}

			// TODO: Actually execute the requests
			console.log(
				pc.yellow(
					"\n⚠️  Execution not implemented yet - this is just parsing validation",
				),
			);
		} else {
			console.log(pc.red("Directory execution not implemented yet"));
		}

		outro(pc.green("✨ Flow validation complete!"));
	} catch (error) {
		console.error(
			pc.red("\nError:"),
			error instanceof Error ? error.message : String(error),
		);
		process.exit(1);
	}
}
