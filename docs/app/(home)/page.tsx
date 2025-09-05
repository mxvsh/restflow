import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
	title: "RestFlow",
	description:
		"A powerful CLI tool for API testing and workflow automation using a simple, human-readable DSL.",
};

export default function HomePage() {
	return (
		<main className="flex flex-1 flex-col">
			{/* Hero Section */}
			<section className="flex flex-col items-center justify-center px-4 py-16 text-center">
				<h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-6xl">
					RestFlow
				</h1>
				<p className="mb-8 max-w-2xl text-lg text-fd-muted-foreground sm:text-xl">
					A powerful CLI tool for API testing and workflow automation using a
					simple, human-readable DSL
				</p>
				<div className="flex gap-4">
					<Link
						href="/docs"
						className="rounded-md bg-fd-primary px-6 py-3 text-sm font-medium text-fd-primary-foreground hover:bg-fd-primary/90"
					>
						Get Started
					</Link>
					<Link
						href="https://github.com/mxvsh/restflow"
						className="rounded-md border border-fd-border px-6 py-3 text-sm font-medium hover:bg-fd-accent"
					>
						View on GitHub
					</Link>
				</div>
			</section>

			{/* Features Grid */}
			<section className="mx-auto max-w-6xl px-4 py-16">
				<h2 className="mb-12 text-center text-3xl font-bold">
					Why Choose RestFlow?
				</h2>
				<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
					{/* Card 1 */}
					<div className="rounded-lg border border-fd-border p-6">
						<div className="mb-4 text-2xl">🚀</div>
						<h3 className="mb-2 text-lg font-semibold">Simple DSL</h3>
						<p className="text-sm text-fd-muted-foreground">
							Write API tests in a human-readable format with intuitive syntax
							that anyone can understand
						</p>
					</div>

					{/* Card 2 */}
					<div className="rounded-lg border border-fd-border p-6">
						<div className="mb-4 text-2xl">⚡</div>
						<h3 className="mb-2 text-lg font-semibold">
							Variable Substitution
						</h3>
						<p className="text-sm text-fd-muted-foreground">
							Dynamic variables like uuid, timestamp, and environment-based
							substitution
						</p>
					</div>

					{/* Card 3 */}
					<div className="rounded-lg border border-fd-border p-6">
						<div className="mb-4 text-2xl">🔧</div>
						<h3 className="mb-2 text-lg font-semibold">Built-in Assertions</h3>
						<p className="text-sm text-fd-muted-foreground">
							Powerful assertion engine for validating response status, headers,
							and body content
						</p>
					</div>

					{/* Card 4 */}
					<div className="rounded-lg border border-fd-border p-6">
						<div className="mb-4 text-2xl">📊</div>
						<h3 className="mb-2 text-lg font-semibold">Multiple Outputs</h3>
						<p className="text-sm text-fd-muted-foreground">
							Console, JSON, and summary formats for different use cases and
							CI/CD integration
						</p>
					</div>

					{/* Card 5 */}
					<div className="rounded-lg border border-fd-border p-6">
						<div className="mb-4 text-2xl">🌍</div>
						<h3 className="mb-2 text-lg font-semibold">Environment Support</h3>
						<p className="text-sm text-fd-muted-foreground">
							Support for .env files and BASE_URL configuration for different
							environments
						</p>
					</div>

					{/* Card 6 */}
					<div className="rounded-lg border border-fd-border p-6">
						<div className="mb-4 text-2xl">🏗️</div>
						<h3 className="mb-2 text-lg font-semibold">Modular Architecture</h3>
						<p className="text-sm text-fd-muted-foreground">
							Built with NX monorepo structure for maintainability and
							extensibility
						</p>
					</div>

					{/* Card 7 */}
					<div className="rounded-lg border border-fd-border p-6">
						<div className="mb-4 text-2xl">📝</div>
						<h3 className="mb-2 text-lg font-semibold">Data Capture</h3>
						<p className="text-sm text-fd-muted-foreground">
							Capture response data for use in subsequent requests with simple
							capture syntax
						</p>
					</div>

					{/* Card 8 */}
					<div className="rounded-lg border border-fd-border p-6">
						<div className="mb-4 text-2xl">🔗</div>
						<h3 className="mb-2 text-lg font-semibold">Workflow Automation</h3>
						<p className="text-sm text-fd-muted-foreground">
							Chain multiple API calls together to create complex testing
							workflows
						</p>
					</div>

					{/* Card 9 */}
					<div className="rounded-lg border border-fd-border p-6">
						<div className="mb-4 text-2xl">⚙️</div>
						<h3 className="mb-2 text-lg font-semibold">TypeScript Ready</h3>
						<p className="text-sm text-fd-muted-foreground">
							Built with TypeScript for type safety and excellent developer
							experience
						</p>
					</div>
				</div>
			</section>

			{/* Example Section */}
			<section className="bg-fd-muted/30 px-4 py-16">
				<div className="mx-auto max-w-4xl text-center">
					<h2 className="mb-6 text-3xl font-bold">See RestFlow in Action</h2>
					<div className="rounded-lg bg-fd-background border border-fd-border p-6 text-left">
						<pre className="text-sm text-fd-muted-foreground overflow-x-auto">
							{`### Get Todo
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
> capture postId = body.id`}
						</pre>
					</div>
					<div className="mt-8">
						<Link
							href="/docs"
							className="rounded-md bg-fd-primary px-6 py-3 text-sm font-medium text-fd-primary-foreground hover:bg-fd-primary/90"
						>
							Learn More
						</Link>
					</div>
				</div>
			</section>
		</main>
	);
}
