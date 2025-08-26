export interface EnvMerger {
	merge(...envSources: Record<string, string>[]): Record<string, string>;
	mergeWithPrecedence(
		base: Record<string, string>,
		overrides: Record<string, string>,
	): Record<string, string>;
}

export class DefaultEnvMerger implements EnvMerger {
	merge(...envSources: Record<string, string>[]): Record<string, string> {
		return Object.assign({}, ...envSources);
	}

	mergeWithPrecedence(
		base: Record<string, string>,
		overrides: Record<string, string>,
	): Record<string, string> {
		return { ...base, ...overrides };
	}
}

// Utility function to merge environment variables with CLI overrides
export function mergeEnvironments(
	processEnv: Record<string, string> = {},
	fileEnv: Record<string, string> = {},
	cliOverrides: Record<string, string> = {},
): Record<string, string> {
	const merger = new DefaultEnvMerger();

	// CLI overrides have highest precedence, then file env, then process env
	return merger.merge(processEnv, fileEnv, cliOverrides);
}
