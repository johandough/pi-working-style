/**
 * Working style: sets how much the agent works alone and how much it involves the user.
 * Usage: /working-style auto|pair|learn  (no argument shows the active style)
 */
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

// Edit the style texts here. Run /reload after a change.
const STYLES = {
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
- Ask for one small piece at a time (2-10 lines). Mark it with a \`TODO(human): <task>\` comment.
- Say what to write, where, and which tradeoffs to consider. Then wait.
- Do not write the user's piece. If the user asks for help, give hints first and the solution last.
- Review the user's code. Give one short "Insight:" note about a choice, tradeoff, or codebase pattern.`,
} as const;

type StyleName = keyof typeof STYLES;
const DEFAULT_STYLE: StyleName = "pair";
const ENTRY_TYPE = "working-style";

const isStyleName = (value: string): value is StyleName => value in STYLES;

export default function workingStyle(pi: ExtensionAPI) {
	let active: StyleName = DEFAULT_STYLE;

	const showStatus = (ctx: ExtensionContext) => ctx.ui.setStatus(ENTRY_TYPE, `style: ${active}`);

	// Read the last selection on the current branch, so /resume and /tree restore the correct style.
	const restore = (_event: unknown, ctx: ExtensionContext) => {
		active = DEFAULT_STYLE;
		for (const entry of ctx.sessionManager.getBranch()) {
			if (entry.type !== "custom" || entry.customType !== ENTRY_TYPE) continue;
			const name = (entry.data as { name?: unknown } | undefined)?.name;
			if (typeof name === "string" && isStyleName(name)) active = name;
		}
		showStatus(ctx);
	};
	pi.on("session_start", restore);
	pi.on("session_tree", restore);

	pi.registerCommand("working-style", {
		description: "Set the working style: auto | pair | learn",
		getArgumentCompletions: (prefix: string) => {
			const items = Object.keys(STYLES)
				.filter((name) => name.startsWith(prefix))
				.map((name) => ({ value: name, label: name }));
			return items.length > 0 ? items : null;
		},
		handler: async (args, ctx) => {
			const name = args.trim();
			if (!name) {
				ctx.ui.notify(`Working style: ${active}`, "info");
				return;
			}
			if (!isStyleName(name)) {
				ctx.ui.notify(`Unknown working style "${name}". Use: ${Object.keys(STYLES).join(", ")}`, "error");
				return;
			}
			active = name;
			pi.appendEntry(ENTRY_TYPE, { name });
			showStatus(ctx);
			ctx.ui.notify(`Working style: ${active}`, "info");
		},
	});

	// Use a structured section so pi patches only this part and keeps the prompt cache.
	pi.on("before_agent_start", async (event) => {
		event.systemPromptOptions.sections.working_style = STYLES[active];
	});
}
