import type {
	AssertDirective,
	CaptureDirective,
	ConsoleDirective,
	Directive,
	Flow,
	FlowStep,
	HttpMethod,
	HttpRequest,
} from "@restflow/types";

export interface ParseResult {
	flow: Flow;
	errors: string[];
}

export function parseFlow(content: string): ParseResult {
	const errors: string[] = [];
	const steps: FlowStep[] = [];

	// Split content by ### (step delimiters)
	const sections = content
		.split(/^###\s*/m)
		.filter((section) => section.trim());

	for (const section of sections) {
		try {
			const step = parseStep(section);
			steps.push(step);
		} catch (error) {
			errors.push(
				`Error parsing step: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	return {
		flow: { steps },
		errors,
	};
}

function parseStep(section: string): FlowStep {
	const rawLines = section.split("\n");
	let bodyStarted = false;
	const lines = rawLines
		.map((line) => {
			if (line.trim().startsWith("{") || line.trim().startsWith("[")) {
				bodyStarted = true;
			}
			return bodyStarted ? line : line.trim();
		})
		.filter((line) => line.trim() && !line.trim().startsWith("#")); // Filter out comments

	if (lines.length === 0) {
		throw new Error("Empty step section");
	}

	// First line is the step name
	const name = lines[0];
	let currentIndex = 1;

	// Parse HTTP request
	const request = parseRequest(lines, currentIndex);
	currentIndex = request.nextIndex;

	// Parse directives (lines starting with >)
	const directives = parseDirectives(lines.slice(currentIndex));

	return {
		name,
		request: request.httpRequest,
		directives,
	};
}

function parseRequest(
	lines: string[],
	startIndex: number,
): { httpRequest: HttpRequest; nextIndex: number } {
	if (startIndex >= lines.length) {
		throw new Error("No HTTP request found");
	}

	// Parse method and URL (e.g., "POST {{baseUrl}}/login")
	const requestLine = lines[startIndex];
	const [methodStr, url] = requestLine.split(/\s+/, 2);

	if (!methodStr || !url) {
		throw new Error(`Invalid request line: ${requestLine}`);
	}

	const method = methodStr.toUpperCase() as HttpMethod;
	if (!isValidHttpMethod(method)) {
		throw new Error(`Invalid HTTP method: ${method}`);
	}

	let currentIndex = startIndex + 1;
	const headers: Record<string, string> = {};
	let body = "";

	// Parse headers (until we hit a blank line or body)
	while (currentIndex < lines.length) {
		const line = lines[currentIndex];

		// Check if this is a header (contains :)
		if (line.includes(":") && !line.startsWith("{") && !line.startsWith(">")) {
			const [key, ...valueParts] = line.split(":");
			headers[key.trim()] = valueParts.join(":").trim();
			currentIndex++;
		} else {
			break;
		}
	}

	// Parse body (JSON or text)
	const bodyLines: string[] = [];
	while (currentIndex < lines.length && !lines[currentIndex].startsWith(">")) {
		bodyLines.push(lines[currentIndex]);
		currentIndex++;
	}

	if (bodyLines.length > 0) {
		body = bodyLines.join("\n");
	}

	return {
		httpRequest: {
			method,
			url,
			headers: Object.keys(headers).length > 0 ? headers : undefined,
			body: body || undefined,
		},
		nextIndex: currentIndex,
	};
}

function parseDirectives(lines: string[]): Directive[] {
	const directives: Directive[] = [];

	for (const line of lines) {
		if (!line.startsWith(">")) continue;

		const directiveContent = line.substring(1).trim();

		if (directiveContent.startsWith("capture ")) {
			const captureMatch = directiveContent.match(
				/^capture\s+(\w+)\s*=\s*(.+)$/,
			);
			if (captureMatch) {
				const [, variable, expression] = captureMatch;
				directives.push({
					type: "capture",
					variable,
					expression,
				} as CaptureDirective);
			}
		} else if (directiveContent.startsWith("assert ")) {
			const expression = directiveContent.substring("assert ".length);
			directives.push({
				type: "assert",
				expression,
			} as AssertDirective);
		} else if (directiveContent.startsWith("console ")) {
			const expression = directiveContent.substring("console ".length);
			directives.push({
				type: "console",
				expression,
			} as ConsoleDirective);
		}
	}

	return directives;
}

function isValidHttpMethod(method: string): method is HttpMethod {
	return ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"].includes(
		method,
	);
}

// Utility function to parse flow files from file system
export async function parseFlowFile(filePath: string): Promise<ParseResult> {
	try {
		// In a real implementation, we'd read from filesystem
		// For now, this is a placeholder
		throw new Error("File system reading not implemented yet");
	} catch (error) {
		return {
			flow: { steps: [] },
			errors: [
				`Failed to read file ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
			],
		};
	}
}
