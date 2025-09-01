import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ejs from "ejs";
import fs from "fs-extra";
import pc from "picocolors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface CreateProjectOptions {
	name: string;
	template: "basic" | "auth" | "advanced";
	installDeps: boolean;
}

export async function createProject(
	options: CreateProjectOptions,
): Promise<void> {
	const { name, template, installDeps } = options;
	const projectPath = path.resolve(process.cwd(), name);

	// Check if directory already exists
	if (await fs.pathExists(projectPath)) {
		throw new Error(`Directory ${name} already exists`);
	}

	console.log(pc.dim(`Creating project in ${projectPath}...`));

	// Create project directory
	await fs.ensureDir(projectPath);

	// Copy template files
	await copyTemplateFiles(projectPath, template, { name });

	// Install dependencies if requested
	if (installDeps) {
		console.log(pc.dim("Installing dependencies..."));
		await installDependencies(projectPath);
	}
}

async function copyTemplateFiles(
	projectPath: string,
	template: string,
	templateData: any,
): Promise<void> {
	const templatePath = path.resolve(__dirname, "../../templates", template);

	// Ensure template directory exists
	if (!(await fs.pathExists(templatePath))) {
		throw new Error(`Template "${template}" not found`);
	}

	// Get create-restflow version from package.json
	const packageJsonPath = path.resolve(__dirname, "../../package.json");
	const packageJson = await fs.readJson(packageJsonPath);
	const restflowVersion = packageJson.version;

	// Add version to template data
	const enhancedTemplateData = {
		...templateData,
		restflowVersion,
	};

	await copyDirectory(templatePath, projectPath, enhancedTemplateData);
}

async function copyDirectory(
	srcDir: string,
	destDir: string,
	templateData: any,
): Promise<void> {
	const entries = await fs.readdir(srcDir, { withFileTypes: true });

	for (const entry of entries) {
		const srcPath = path.join(srcDir, entry.name);
		const destPath = path.join(destDir, entry.name);

		if (entry.isDirectory()) {
			await fs.ensureDir(destPath);
			await copyDirectory(srcPath, destPath, templateData);
		} else {
			if (entry.name.endsWith(".ejs")) {
				// Process EJS template
				const template = await fs.readFile(srcPath, "utf-8");
				const rendered = ejs.render(template, templateData);
				const outputPath = destPath.replace(".ejs", "");
				await fs.writeFile(outputPath, rendered);
			} else {
				// Copy file as-is
				await fs.copy(srcPath, destPath);
			}
		}
	}
}

async function installDependencies(projectPath: string): Promise<void> {
	return new Promise((resolve, reject) => {
		const npm = spawn("npm", ["install"], {
			cwd: projectPath,
			stdio: "pipe",
		});

		npm.on("close", (code) => {
			if (code === 0) {
				resolve();
			} else {
				reject(new Error(`npm install failed with code ${code}`));
			}
		});

		npm.on("error", reject);
	});
}
