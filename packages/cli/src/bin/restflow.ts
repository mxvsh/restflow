#!/usr/bin/env node

import { cli } from "../commands/cli.js";

cli().catch((error: Error) => {
	console.error("Error:", error.message);
	process.exit(1);
});
