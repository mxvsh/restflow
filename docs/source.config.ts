import {
	defineConfig,
	defineDocs,
	frontmatterSchema,
	metaSchema,
} from "fumadocs-mdx/config";

// You can customise Zod schemas for frontmatter and `meta.json` here
// see https://fumadocs.dev/docs/mdx/collections#define-docs
export const docs = defineDocs({
	docs: {
		schema: frontmatterSchema,
	},
	meta: {
		schema: metaSchema,
	},
});

export default defineConfig({
	mdxOptions: {
		rehypeCodeOptions: {
			themes: {
				light: "github-light",
				dark: "github-dark",
			},
			langs: [
				"bash",
				"javascript",
				"typescript",
				"json",
				"dotenv",
				{
					name: "flow",
					scopeName: "source.flow",
					repository: {},
					patterns: [
						{
							name: "comment.line.flow",
							match: "^#.*$",
						},
						{
							name: "markup.heading.flow",
							match: "^###\\s+.*$",
						},
						{
							name: "keyword.control.flow",
							match: "\\b(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\\b",
						},
						{
							name: "string.interpolated.flow",
							begin: "\\{\\{",
							end: "\\}\\}",
							patterns: [
								{
									name: "variable.other.flow",
									match: "[a-zA-Z_][a-zA-Z0-9_]*",
								},
							],
						},
						{
							name: "keyword.operator.flow",
							match: "^>\\s+(assert|capture)\\b",
						},
						{
							name: "string.quoted.double.flow",
							begin: '"',
							end: '"',
							patterns: [
								{
									name: "constant.character.escape.flow",
									match: "\\\\.",
								},
							],
						},
						{
							name: "entity.name.tag.flow",
							match: "^[A-Za-z-]+:",
						},
					],
				},
			],
		},
	},
});
