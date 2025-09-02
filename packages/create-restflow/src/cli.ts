#!/usr/bin/env node

import {
	cancel,
	confirm,
	intro,
	isCancel,
	outro,
	select,
	text,
} from "@clack/prompts";
import pc from "picocolors";
import { createProject } from "./generators/create-restflow.js";

async function main() {
	console.clear();

	intro(pc.cyan("🌊 Create Restflow Project"));

	const projectName = await text({
		message: "What is your project name?",
		placeholder: "my-api-tests",
		validate: (value) => {
			if (!value) return "Project name is required";
			if (!/^[a-z0-9-]+$/.test(value))
				return "Project name must contain only lowercase letters, numbers, and hyphens";
			return undefined;
		},
	});

	if (isCancel(projectName)) {
		cancel("Operation cancelled");
		return;
	}

	const template = await select({
		message: "Which template would you like to use?",
		options: [
			{
				value: "basic",
				label: "Basic",
				hint: "Simple API testing setup",
			},
			{
				value: "auth",
				label: "Authentication",
				hint: "API testing with JWT auth flows",
			},
			{
				value: "advanced",
				label: "Advanced",
				hint: "Multi-environment setup with complex flows",
			},
		],
	});

	if (isCancel(template)) {
		cancel("Operation cancelled");
		return;
	}

	const shouldInstall = await confirm({
		message: "Install dependencies?",
		initialValue: true,
	});

	if (isCancel(shouldInstall)) {
		cancel("Operation cancelled");
		return;
	}

	try {
		await createProject({
			name: projectName,
			template,
			installDeps: shouldInstall,
		});

		outro(pc.green(`✅ Project ${pc.bold(projectName)} created successfully!`));

		console.log(`\n${pc.dim("Next steps:")}`);
		console.log(`  ${pc.cyan("cd")} ${projectName}`);
		if (!shouldInstall) {
			console.log(`  ${pc.cyan("npm install")} ${pc.dim("# or pnpm install")}`);
		}
		console.log(
			`  ${pc.cyan("restflow run flows/")} ${pc.dim("# run your flows")}`,
		);
	} catch (error) {
		outro(
			pc.red(
				`❌ Failed to create project: ${error instanceof Error ? error.message : String(error)}`,
			),
		);
		process.exit(1);
	}
}

main().catch(console.error);
