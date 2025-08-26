import { confirm, intro, outro, text } from "@clack/prompts";
import pc from "picocolors";

/**
 * Handle the init command to create a new Restflow project
 */
export async function executeInitCommand(): Promise<void> {
	intro(pc.cyan("🌀 Restflow Init"));

	const projectName = await text({
		message: "What is your project name?",
		placeholder: "my-api-tests",
		validate: (value) => {
			if (!value) return "Project name is required";
			if (!/^[a-zA-Z0-9-_]+$/.test(value)) {
				return "Project name can only contain letters, numbers, hyphens, and underscores";
			}
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
		// TODO: Implement project scaffolding when create-restflow package is ready
		outro(pc.green("✨ Project will be created! (Implementation pending - use create-restflow package)"));
	} else {
		outro(pc.gray("Operation cancelled."));
	}
}