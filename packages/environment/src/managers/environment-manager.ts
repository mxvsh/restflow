import type { Environment } from "@restflow/types";
import { DotenvLoader, EnvLoadError, type EnvLoader } from "../loaders/env-loader.js";
import { DefaultEnvMerger, type EnvMerger } from "../mergers/env-merger.js";
import {
	EnvValidator,
	type ValidationResult,
	type ValidationRule,
} from "../validators/env-validator.js";

export interface EnvironmentManagerOptions {
	loader?: EnvLoader;
	merger?: EnvMerger;
	validator?: EnvValidator;
	includeProcessEnv?: boolean;
}

export class EnvironmentManager {
	private loader: EnvLoader;
	private merger: EnvMerger;
	private validator: EnvValidator;
	private includeProcessEnv: boolean;

	constructor(options: EnvironmentManagerOptions = {}) {
		this.loader = options.loader || new DotenvLoader();
		this.merger = options.merger || new DefaultEnvMerger();
		this.validator = options.validator || new EnvValidator();
		this.includeProcessEnv = options.includeProcessEnv ?? false;
	}

	async loadEnvironment(filePath?: string): Promise<Environment> {
		let fileVariables: Record<string, string> = {};

		if (filePath) {
			try {
				fileVariables = this.loader.load(filePath);
			} catch (error) {
				if (error instanceof EnvLoadError) {
					throw error;
				}
				throw new EnvLoadError(
					`Failed to load environment from ${filePath}: ${error}`,
				);
			}
		}

		const processVariables = this.includeProcessEnv
			? this.getProcessEnvVariables()
			: {};

		const mergedVariables = this.merger.merge(processVariables, fileVariables);

		return {
			name: filePath ? this.extractEnvironmentName(filePath) : "default",
			variables: mergedVariables,
		};
	}

	validateEnvironment(
		environment: Environment,
		rules: ValidationRule[],
	): ValidationResult {
		return this.validator.validate(environment.variables, rules);
	}

	mergeEnvironments(...environments: Environment[]): Environment {
		const allVariables = environments.map((env) => env.variables);
		const mergedVariables = this.merger.merge(...allVariables);

		return {
			name: "merged",
			variables: mergedVariables,
		};
	}

	private getProcessEnvVariables(): Record<string, string> {
		const result: Record<string, string> = {};

		for (const [key, value] of Object.entries(process.env)) {
			if (value !== undefined) {
				result[key] = value;
			}
		}

		return result;
	}

	private extractEnvironmentName(filePath: string): string {
		const fileName = filePath.split("/").pop() || filePath;
		return fileName.replace(/\.(env|environment)$/, "");
	}
}

// Convenience function for simple environment loading
export async function loadEnvironmentFile(
	filePath: string,
): Promise<Environment> {
	const manager = new EnvironmentManager();
	return manager.loadEnvironment(filePath);
}
