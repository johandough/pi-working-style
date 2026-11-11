# pi-working-style

Switch how much the agent does alone.

- `auto` works through the task and reports at the end.
- `pair` plans first and stops after each small step.
- `learn` does the routine work and leaves the important design decisions for you to write, with hints and reviews.

## Install

```bash
pi install git:github.com/johandough/pi-working-style
```

## Use

- `/working-style auto|pair|learn` sets the style for the session.
- `/working-style` shows the active style.
- The default is `pair`. The footer shows `style: <name>`.
- The selection is saved in the session. `/resume` and `/tree` keep it.

## Custom styles

Add a Markdown file for each style to `~/.pi/agent/working-styles/`:

```bash
mkdir -p ~/.pi/agent/working-styles
printf 'Working style: review.\n- Do not edit files. Read the code and report problems, ranked by risk.\n' \
  > ~/.pi/agent/working-styles/review.md
```

- The file name is the style name: `/working-style review`.
- Use only `a-z`, `0-9` and `-` in the name.
- A file with a built-in name (`auto.md`, `pair.md`, `learn.md`) replaces that style. `/working-style` then shows `(custom)`.
- Run `/reload` after you add or change a file.
