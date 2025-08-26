import { config } from "dotenv";
import { existsSync } from "fs";
import { resolve } from "path";

export interface EnvLoader {
	load(filePath: string): Record<string, string>;
	loadFromString(content: string): Record<string, string>;
}

export class DotenvLoader implements EnvLoader {
	load(filePath: string): Record<string, string> {
		const resolvedPath = resolve(filePath);

		if (!existsSync(resolvedPath)) {
			throw new EnvLoadError(`Environment file not found: ${resolvedPath}`);
		}

		try {
			const result = config({ path: resolvedPath });

			if (result.error) {
				throw new EnvLoadError(
					`Failed to parse environment file: ${result.error.message}`,
				);
			}

			return result.parsed || {};
		} catch (error) {
			if (error instanceof EnvLoadError) {
				throw error;
			}
			throw new EnvLoadError(
				`Error loading environment file: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	loadFromString(content: string): Record<string, string> {
		const lines = content.split("\n");
		const result: Record<string, string> = {};

		for (const line of lines) {
			const trimmedLine = line.trim();

			// Skip empty lines and comments
			if (!trimmedLine || trimmedLine.startsWith("#")) {
				continue;
			}

			const equalIndex = trimmedLine.indexOf("=");
			if (equalIndex === -1) {
				continue; // Skip invalid lines
			}

			const key = trimmedLine.substring(0, equalIndex).trim();
			const value = trimmedLine.substring(equalIndex + 1).trim();

			// Remove quotes if present
			const unquotedValue = this.removeQuotes(value);
			result[key] = unquotedValue;
		}

		return result;
	}

	private removeQuotes(value: string): string {
		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			return value.slice(1, -1);
		}
		return value;
	}
}

export class EnvLoadError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "EnvLoadError";
	}
}
