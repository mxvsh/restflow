#!/usr/bin/env node

import { cli } from '../lib/cli.js';

cli().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});