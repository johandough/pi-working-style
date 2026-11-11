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

## Customize

To change the style texts, fork the repo and edit `STYLES` in `extensions/working-style.ts`.
