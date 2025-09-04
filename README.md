<p align="center">
  <a href="https://github.com/drivebase/drivebase">
    <img src="https://github.com/user-attachments/assets/86cc00a6-c358-4ec3-991c-20c4ea61c343" width="80px" alt="Restflow Logo" />
  </a>
</p>

<h3 align="center">
  Restflow
</h3>
<p align="center">
A powerful CLI tool for API testing and workflow automation using a simple, human-readable DSL.
</p>
<p align="center">
  <a href="https://restflow.vercel.app/docs">📖 Documentation</a>
</p>

## 📦 Installation

### Global Install

```bash
npm install -g @restflow/cli
# or
pnpm add -g @restflow/cli
```

### Project Install

```bash
npm install @restflow/cli
# or
pnpm add @restflow/cli
```

## 📝 Example Flow

```bash
### Get Todo
GET https://jsonplaceholder.typicode.com/todos/1

> assert status == 200
> assert body.id == 1
> assert body.title contains "delectus"

### Create Post
POST https://jsonplaceholder.typicode.com/posts
Content-Type: application/json

{
  "title": "My New Post",
  "body": "This is the content of my post",
  "userId": 1
}

> assert status == 201
> assert body.title == "My New Post"
> capture postId = body.id
```

## 🛠️ Development

This project uses Nx monorepo architecture:

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm nx run-many -t build --all

# Run tests
pnpm nx run-many -t test --all

# Build CLI
pnpm nx build cli
```

### 📁 Package Structure

- `@restflow/cli` - Command line interface
- `@restflow/parser` - Flow file parser
- `@restflow/engine` - Flow execution engine
- `@restflow/http` - HTTP client
- `@restflow/variables` - Variable resolution
- `@restflow/environment` - Environment loading
- `@restflow/assertions` - Response validation
- `@restflow/reporter` - Output formatting
- `@restflow/types` - TypeScript definitions
- `@restflow/utils` - Shared utilities

## 💡 Examples

Check out the [examples/basic](./examples/basic) directory for a complete working example with:

- Express.js server with authentication
- Health check flows
- User registration and login flows
- JWT token handling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

---

**Built for API testing and automation**
