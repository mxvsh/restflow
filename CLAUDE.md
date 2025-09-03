# CLAUDE.md

## Project Overview

**Restflow** - A declarative API testing framework using `.flow` files to define HTTP requests and assertions.

## Architecture

- **Monorepo**: NX workspace with multiple packages
- **Core packages**: `@restflow/cli`, `@restflow/engine`, `@restflow/variables`, `@restflow/parser`
- **Language**: TypeScript with ES modules
- **Build**: NX with TypeScript compiler

## Key Features

- Declarative `.flow` syntax for API tests
- Variable substitution (`{{variable}}`)
- Built-in variables: `{{uuid}}`, `{{timestamp}}`, `{{randomString}}`, `{{randomNumber}}`
- Environment file support (`.env`)
- BASE_URL auto-prefixing for relative URLs
- Multiple output formats (console, JSON, summary)
- Response assertions and data capture

## Development Guidelines

### Code Style
- Use TypeScript strict mode
- Prefer explicit types over `any`
- Use ES modules (`import`/`export`)
- Follow existing naming conventions
- Add JSDoc for public APIs
- Use pnpm for package management

### Testing
- Write tests for new features
- Run tests: `npx nx test <package-name>`
- Build: `npx nx build <package-name>`
- Lint: `npm run lint`

### File Organization
- Core logic in `src/` directories
- Tests alongside source files (`*.spec.ts`)
- Types in `@restflow/types` package
- Shared utilities in `@restflow/utils`

### Variable Resolution Priority
1. CLI variables (highest)
2. Captured variables
3. Environment variables
4. Built-in variables (lowest)

### Common Commands
- Test all: `npx nx run-many -t test`
- Build all: `npx nx run-many -t build`
- Run CLI: `node packages/cli/dist/bin/restflow.js`

## Documentation Requirements

### For API Changes
- Update relevant package README
- Add/update examples in `/docs`
- Update type definitions
- Add migration notes if breaking

### For New Features
- Document in main README
- Add usage examples
- Update CLI help text
- Consider adding to getting started guide

### For Bug Fixes
- Update tests to prevent regression
- Document fix in changelog

## Release Process

- Use semantic versioning
- Update package versions consistently
- Test in example projects before release
- Document breaking changes clearly
