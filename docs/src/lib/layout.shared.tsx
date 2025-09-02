import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

export function baseOptions(): BaseLayoutProps {
	return {
		nav: {
			title: "Restflow Docs",
		},
		searchToggle: {
			enabled: true,
		},
	};
}
