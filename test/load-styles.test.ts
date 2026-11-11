import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { loadStyles } from "../src/load-styles.ts";

const builtins = { pair: "built-in pair", auto: "built-in auto" };

test("no folder gives the built-in styles", () => {
	const result = loadStyles(join(tmpdir(), "does-not-exist-ws"), builtins);
	assert.deepEqual(result.styles, builtins);
	assert.equal(result.warnings.length, 0);
});

test("adds new styles, replaces built-ins, and skips bad files", () => {
	const dir = mkdtempSync(join(tmpdir(), "ws-"));
	writeFileSync(join(dir, "review.md"), "  review text \n");
	writeFileSync(join(dir, "pair.md"), "my pair");
	writeFileSync(join(dir, "Bad Name.md"), "x");
	writeFileSync(join(dir, "empty.md"), "   ");
	writeFileSync(join(dir, "notes.txt"), "ignored");

	const { styles, custom, warnings } = loadStyles(dir, builtins);
	assert.deepEqual(styles, { pair: "my pair", auto: "built-in auto", review: "review text" });
	assert.deepEqual([...custom].sort(), ["pair", "review"]);
	assert.equal(warnings.length, 2);
});
