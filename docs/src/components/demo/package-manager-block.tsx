import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import CopyButton from "../copy-button";

const PACKAGE_MANAGERS = ["bun", "pnpm", "yarn", "npm"] as const;
type PackageManager = (typeof PACKAGE_MANAGERS)[number];

interface PackageManagerBlockProps {
	label?: string;
	commands: Record<PackageManager, string>;
}

export function PackageManagerBlock({
	label,
	commands,
}: PackageManagerBlockProps) {
	const [active, setActive] = useState<PackageManager>("bun");

	return (
		<div className="bg-bg border border-border-2 rounded-app overflow-hidden">
			{/* Header */}
			<div className="flex items-center justify-between px-3.5 py-2 bg-surface-2 border-b border-border">
				<div className="flex items-center gap-3">
					{label && (
						<>
							<span className="text-[10px] tracking-[0.1em] uppercase text-muted">
								{label}
							</span>
							<div className="w-px h-3 bg-border-2" />
						</>
					)}
					{PACKAGE_MANAGERS.map((pm) => (
						<button
							key={pm}
							onClick={() => setActive(pm)}
							className={`text-[10px] tracking-[0.1em] uppercase transition-colors ${
								active === pm
									? "text-text-bright"
									: "text-muted hover:text-text-dim"
							}`}
						>
							{pm}
						</button>
					))}
				</div>
				<CopyButton text={commands[active]} />
			</div>
			{/* Highlighted code */}
			<SyntaxHighlighter
				language="shell"
				style={atomDark}
				customStyle={{
					margin: 0,
					padding: "16px 18px",
					background: "transparent",
					fontSize: "12.5px",
					lineHeight: "1.7",
				}}
				codeTagProps={{
					style: { fontFamily: "var(--font-mono)" },
				}}
			>
				{`${commands[active]}`}
			</SyntaxHighlighter>
		</div>
	);
}
