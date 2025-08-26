import { resolve, relative, dirname, join } from "path";

/**
 * Resolve a path relative to the current working directory
 */
export function resolvePath(path: string): string {
	return resolve(process.cwd(), path);
}

/**
 * Get relative path from current working directory
 */
export function getRelativePath(path: string): string {
	return relative(process.cwd(), path);
}

/**
 * Get directory name of a file path
 */
export function getDirectoryPath(filePath: string): string {
	return dirname(filePath);
}

/**
 * Join paths safely
 */
export function joinPaths(...paths: string[]): string {
	return join(...paths);
}

/**
 * Normalize path for display (shorten if too long)
 */
export function normalizePathForDisplay(path: string, maxLength = 60): string {
	const relativePath = getRelativePath(path);
	
	if (relativePath.length <= maxLength) {
		return relativePath;
	}
	
	// Truncate in the middle with ellipsis
	const start = relativePath.substring(0, Math.floor(maxLength / 2) - 2);
	const end = relativePath.substring(relativePath.length - Math.floor(maxLength / 2) + 2);
	return `${start}...${end}`;
}