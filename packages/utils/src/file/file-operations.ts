import { extname, join } from "node:path";
import fs from "fs-extra";

/**
 * Check if a file exists and is readable
 */
export async function fileExists(filePath: string): Promise<boolean> {
	try {
		const stat = await fs.stat(filePath);
		return stat.isFile();
	} catch {
		return false;
	}
}

/**
 * Check if a directory exists
 */
export async function directoryExists(dirPath: string): Promise<boolean> {
	try {
		const stat = await fs.stat(dirPath);
		return stat.isDirectory();
	} catch {
		return false;
	}
}

/**
 * Read file content safely with error handling
 */
export async function readFileContent(
	filePath: string,
): Promise<{ content: string; error?: string }> {
	try {
		if (!(await fileExists(filePath))) {
			return { content: "", error: `File not found: ${filePath}` };
		}
		const content = await fs.readFile(filePath, "utf-8");
		return { content };
	} catch (error) {
		return {
			content: "",
			error: `Failed to read file: ${error instanceof Error ? error.message : String(error)}`,
		};
	}
}

/**
 * Find all files with specific extension in a directory recursively
 */
export async function findFilesWithExtension(
	dirPath: string,
	extension: string,
): Promise<string[]> {
	try {
		if (!(await directoryExists(dirPath))) {
			return [];
		}

		const files: string[] = [];
		const entries = await fs.readdir(dirPath);

		for (const entry of entries) {
			const fullPath = join(dirPath, entry);
			const stat = await fs.stat(fullPath);

			if (stat.isFile() && extname(entry) === extension) {
				files.push(fullPath);
			} else if (stat.isDirectory()) {
				// Recursively search subdirectories
				files.push(...(await findFilesWithExtension(fullPath, extension)));
			}
		}

		return files;
	} catch {
		return [];
	}
}

/**
 * Synchronous versions for CLI usage where async is not practical
 */
export const sync = {
	fileExists(filePath: string): boolean {
		try {
			return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
		} catch {
			return false;
		}
	},

	directoryExists(dirPath: string): boolean {
		try {
			return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
		} catch {
			return false;
		}
	},

	readFileContent(filePath: string): { content: string; error?: string } {
		try {
			if (!this.fileExists(filePath)) {
				return { content: "", error: `File not found: ${filePath}` };
			}
			const content = fs.readFileSync(filePath, "utf-8");
			return { content };
		} catch (error) {
			return {
				content: "",
				error: `Failed to read file: ${error instanceof Error ? error.message : String(error)}`,
			};
		}
	},

	findFilesWithExtension(dirPath: string, extension: string): string[] {
		try {
			if (!this.directoryExists(dirPath)) {
				return [];
			}

			const files: string[] = [];
			const entries = fs.readdirSync(dirPath);

			for (const entry of entries) {
				const fullPath = join(dirPath, entry);
				const stat = fs.statSync(fullPath);

				if (stat.isFile() && extname(entry) === extension) {
					files.push(fullPath);
				} else if (stat.isDirectory()) {
					// Recursively search subdirectories
					files.push(...this.findFilesWithExtension(fullPath, extension));
				}
			}

			return files;
		} catch {
			return [];
		}
	},
};
