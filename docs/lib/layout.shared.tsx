import Image from "next/image";
import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

/**
 * Shared layout configurations
 *
 * you can customise layouts individually from:
 * Home Layout: app/(home)/layout.tsx
 * Docs Layout: app/docs/layout.tsx
 */
export function baseOptions(): BaseLayoutProps {
	return {
		nav: {
			title: (
				<>
					<Image
						alt="logo"
						src="/restflow.png"
						width={100}
						height={100}
						className="h-8 w-8"
					/>
					RestFlow
				</>
			),
		},
		// see https://fumadocs.dev/docs/ui/navigation/links
		links: [],
		githubUrl: "https://github.com/mxvsh/restflow",
	};
}
