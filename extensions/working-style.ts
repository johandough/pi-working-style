/**
 * Working style: sets how much the agent works alone and how much it involves the user.
 * Usage: /working-style auto|pair|learn|<custom>  (no argument shows the active style)
 */
import { join } from "node:path";
import { type ExtensionAPI, type ExtensionContext, getAgentDir } from "@earendil-works/pi-coding-agent";
import { loadStyles } from "../src/load-styles.ts";

// Users add or replace styles with <agent-dir>/working-styles/<name>.md. Run /reload after a change.
const BUILTIN_STYLES = {
	auto: `Working style: auto.
- Work through the full task without stopping for approval.
- Make reasonable decisions and record them.
- Stop only for destructive actions, real ambiguity, or a big change of direction.
- At the end, report what you changed, why, and what you did not check.`,

	pair: `Working style: pair.
- Before a non-trivial change, give a short plan and wait for approval.
- Make small steps. Stop after each step so the user can review it.
- Ask instead of guessing.`,

	learn: `Working style: learn. The user learns by writing the important code.
- Do the routine work yourself: setup, boilerplate, plumbing.
- At a real design decision (error handling, data structure, business logic), stop and let the user write it.
- Involve the user in design decisions: ask for their view first, then give yours.
- Ask for one small piece at a time (2-10 lines). Mark it with a \`TODO(human): <task>\` comment.
- Say what to write, where, and which tradeoffs to consider. Then wait.
- Do not write the user's piece. If the user asks for help, give hints first and the solution last.
- Review the user's code. Give one short "Insight:" note about a choice, tradeoff, or codebase pattern.`,
};

const DEFAULT_STYLE = "pair";
const ENTRY_TYPE = "working-style";

export default function workingStyle(pi: ExtensionAPI) {
	let STYLES: Record<string, string> = BUILTIN_STYLES;
	let custom = new Set<string>();
	let active = DEFAULT_STYLE;

	const isStyleName = (value: string) => Object.hasOwn(STYLES, value);
	const label = (name: string) => (custom.has(name) ? `${name} (custom)` : name);

	const showStatus = (ctx: ExtensionContext) => ctx.ui.setStatus(ENTRY_TYPE, `style: ${active}`);

	// Read the last selection on the current branch, so /resume and /tree restore the correct style.
	const restore = (_event: unknown, ctx: ExtensionContext) => {
		active = DEFAULT_STYLE;
		for (const entry of ctx.sessionManager.getBranch()) {
			if (entry.type !== "custom" || entry.customType !== ENTRY_TYPE) continue;
			const name = (entry.data as { name?: unknown } | undefined)?.name;
			if (typeof name === "string") active = name;
		}
		if (!isStyleName(active)) {
			ctx.ui.notify(`Working style "${active}" no longer exists. Using ${DEFAULT_STYLE}.`, "warning");
			active = DEFAULT_STYLE;
		}
		showStatus(ctx);
	};
	pi.on("session_start", (event, ctx) => {
		const loaded = loadStyles(join(getAgentDir(), "working-styles"), BUILTIN_STYLES);
		STYLES = loaded.styles;
		custom = loaded.custom;
		for (const warning of loaded.warnings) ctx.ui.notify(`working-style: ${warning}`, "warning");
		restore(event, ctx);
	});
	pi.on("session_tree", restore);

	pi.registerCommand("working-style", {
		description: "Set the working style: auto | pair | learn | <custom>",
		getArgumentCompletions: (prefix: string) => {
			const items = Object.keys(STYLES)
				.filter((name) => name.startsWith(prefix))
				.map((name) => ({ value: name, label: label(name) }));
			return items.length > 0 ? items : null;
		},
		handler: async (args, ctx) => {
			const name = args.trim();
			if (!name) {
				ctx.ui.notify(`Working style: ${label(active)}`, "info");
				return;
			}
			if (!isStyleName(name)) {
				ctx.ui.notify(`Unknown working style "${name}". Use: ${Object.keys(STYLES).join(", ")}`, "error");
				return;
			}
			if (name === active) {
				ctx.ui.notify(`Working style is already ${active}`, "info");
				return;
			}
			const previous = active;
			active = name;
			pi.appendEntry(ENTRY_TYPE, { name });
			// A visible message marks the change in the history; a prompt section patch alone is easy to miss.
			pi.sendMessage(
				{
					customType: ENTRY_TYPE,
					content: `The user changed the working style from ${previous} to ${active}. Follow the ${active} rules from now on. Earlier messages used ${previous} rules. Do not copy their pattern. Begin your next reply with "Working style: ${active}."\n\n${STYLES[active]}`,
					display: true,
				},
				{ deliverAs: "nextTurn" },
			);
			showStatus(ctx);
			ctx.ui.notify(`Working style: ${active}`, "info");
		},
	});

	// Use a structured section so pi patches only this part and keeps the prompt cache.
	pi.on("before_agent_start", async (event) => {
		event.systemPromptOptions.sections.working_style = `This is the active working style. It overrides any earlier working style in this conversation.\n${STYLES[active]}`;
	});
}
