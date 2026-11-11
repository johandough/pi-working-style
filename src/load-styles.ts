import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const NAME = /^[a-z0-9-]+$/;

/** Merge `<dir>/*.md` over the built-in styles. A file with a built-in name replaces that style. */
export function loadStyles(dir: string, builtins: Record<string, string>) {
	const styles: Record<string, string> = { ...builtins };
	const custom = new Set<string>();
	const warnings: string[] = [];

	let files: string[];
	try {
		files = readdirSync(dir).filter((file) => file.endsWith(".md"));
	} catch {
		return { styles, custom, warnings }; // No folder: built-in styles only.
	}

	for (const file of files) {
		const name = file.slice(0, -3);
		if (!NAME.test(name)) {
			warnings.push(`Skipped ${file}: use only a-z, 0-9 and "-" in the name.`);
			continue;
		}
		let text: string;
		try {
			text = readFileSync(join(dir, file), "utf8").trim();
		} catch (error) {
			warnings.push(`Skipped ${file}: ${(error as Error).message}`);
			continue;
		}
		if (!text) {
			warnings.push(`Skipped ${file}: the file is empty.`);
			continue;
		}
		styles[name] = text;
		custom.add(name);
	}
	return { styles, custom, warnings };
}
