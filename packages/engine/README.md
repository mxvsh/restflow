# @restflow/engine

The core execution engine for Restflow CLI that orchestrates the complete pipeline for executing .flow files.

## Features

- **Complete Pipeline Orchestration**: Integrates all Restflow packages (parser, variables, environment, HTTP, assertions, reporter)
- **Step-by-Step Execution**: Executes flow steps sequentially with proper context management
- **Variable Resolution**: Resolves {{variables}} in requests using environment and captured variables
- **HTTP Request Execution**: Makes HTTP requests with proper error handling and timing
- **Assertion Evaluation**: Evaluates assertions on responses
- **Capture Directives**: Captures values from responses for use in subsequent steps
- **Error Handling**: Comprehensive error handling with detailed error information
- **Timing Metrics**: Tracks execution duration for flows and individual steps

## Installation

```bash
npm install @restflow/engine
```

## Usage

### Basic Flow Execution

```typescript
import { FlowExecutor, executeFlowFromString } from '@restflow/engine';

// Simple execution from string
const flowContent = `
### Login
POST https://api.example.com/login
Content-Type: application/json

{
  "username": "{{username}}",
  "password": "{{password}}"
}

> capture token = body.access_token
> assert status == 200

### Get Profile
GET https://api.example.com/profile
Authorization: Bearer {{token}}

> assert status == 200
> assert body.id exists
`;

const result = await executeFlowFromString(flowContent, {
  config: {
    variables: {
      username: 'user@example.com',
      password: 'secret123'
    }
  }
});

console.log(`Flow ${result.success ? 'succeeded' : 'failed'}`);
console.log(`Duration: ${result.duration}ms`);
```

### Advanced Usage with Environment

```typescript
import { FlowExecutor } from '@restflow/engine';

const executor = new FlowExecutor({
  config: {
    timeout: 10000,
    retries: 3,
    baseUrl: 'https://api.example.com'
  }
});

// Execute with environment file
const result = await executor.executeFlow(flowContent, '.env');

// Process results
for (const step of result.steps) {
  console.log(`Step: ${step.step.name}`);
  console.log(`Duration: ${step.duration}ms`);
  
  if (step.error) {
    console.error(`Error: ${step.error.message}`);
  }
  
  if (step.response) {
    console.log(`Status: ${step.response.status}`);
    console.log(`Response Time: ${step.response.responseTime}ms`);
  }
  
  // Check directive results
  for (const directive of step.directives) {
    if (directive.directive.type === 'assert') {
      console.log(`Assertion: ${directive.success ? 'PASS' : 'FAIL'}`);
    } else if (directive.directive.type === 'capture') {
      console.log(`Captured: ${directive.capturedValue}`);
    }
  }
}
```

### Custom Configuration

```typescript
import { FlowExecutor } from '@restflow/engine';
import { HttpClient } from '@restflow/http';
import { DefaultVariableResolver } from '@restflow/variables';
import { EnvironmentManager } from '@restflow/environment';

const customHttpClient = new HttpClient({
  timeout: 30000,
  retries: 2,
  followRedirects: true
});

const customVariableResolver = new DefaultVariableResolver();
const customEnvironmentManager = new EnvironmentManager();

const executor = new FlowExecutor({
  httpClient: customHttpClient,
  variableResolver: customVariableResolver,
  environmentManager: customEnvironmentManager,
  config: {
    timeout: 30000,
    variables: {
      baseUrl: 'https://staging.api.example.com'
    }
  }
});
```

## API Reference

### FlowExecutor

Main class for executing flows.

#### Constructor

```typescript
new FlowExecutor(options?: FlowExecutorOptions)
```

**Options:**
- `config?: RestflowConfig` - Configuration for timeouts, retries, variables, etc.
- `environmentPath?: string` - Path to environment file
- `variableResolver?: DefaultVariableResolver` - Custom variable resolver
- `httpClient?: HttpClient` - Custom HTTP client
- `assertionEvaluator?: DefaultAssertionEvaluator` - Custom assertion evaluator
- `environmentManager?: EnvironmentManager` - Custom environment manager

#### Methods

**executeFlow(flowContent: string, environmentPath?: string): Promise&lt;FlowResult&gt;**

Parse and execute a flow from string content.

**executeFlowObject(flow: Flow, environmentPath?: string): Promise&lt;FlowResult&gt;**

Execute a pre-parsed Flow object.

### Convenience Functions

**executeFlowFromString(flowContent: string, options?: FlowExecutorOptions): Promise&lt;FlowResult&gt;**

Quick execution of a flow from string content.

**executeFlowWithEnvironment(flowContent: string, environmentPath: string, options?: FlowExecutorOptions): Promise&lt;FlowResult&gt;**

Execute a flow with an environment file.

## Building

Run `nx build @restflow/engine` to build the library.

## Testing

Run `nx test @restflow/engine` to run the tests.
