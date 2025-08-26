import { extname } from "path";
import { sync } from "./file-operations.js";

/**
 * Check if path is a .flow file
 */
export function isFlowFile(filePath: string): boolean {
	return extname(filePath) === ".flow";
}

/**
 * Get all .flow files from a path (file or directory)
 */
export function getFlowFiles(path: string): { files: string[]; error?: string } {
	try {
		if (sync.fileExists(path)) {
			if (isFlowFile(path)) {
				return { files: [path] };
			} else {
				return { files: [], error: `File is not a .flow file: ${path}` };
			}
		} else if (sync.directoryExists(path)) {
			const files = sync.findFilesWithExtension(path, ".flow");
			if (files.length === 0) {
				return { files: [], error: `No .flow files found in directory: ${path}` };
			}
			return { files };
		} else {
			return { files: [], error: `Path not found: ${path}` };
		}
	} catch (error) {
		return { 
			files: [], 
			error: `Failed to process path: ${error instanceof Error ? error.message : String(error)}` 
		};
	}
}