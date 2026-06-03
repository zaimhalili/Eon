<div align="center">

# Eon

### A quiet focus timer with glassy controls, Qur'an reflections, and soft completion sounds.

![Eon forest mood](./src/assets/forest1.jpg)

`focus` / `breaks` / `minimal mode` / `qur'an quotes` / `ambient timer`

</div>

---

## The Mood

Eon is designed like a calm desk clock floating over a dark forest scene. The interface keeps the timer large, the controls compact, and the task menu translucent so the page feels focused instead of busy.

Each refresh brings in a fresh Qur'an quote through the quote API, placing a small reflective line above the clock before the work session begins.

```text
                 25:00

        a task, a breath, a quiet start
```

## What It Does

| Moment | Detail |
| --- | --- |
| Start a session | Add a task, tune the minutes with custom arrows, and begin. |
| Move between tasks | A soft sound plays when the next task is ready. |
| Finish everything | A fuller completion sound marks the end of the session. |
| Clear the visual field | Minimal mode hides the task panel and turns the main controls into icons. |
| Reset the room | Fullscreen mode gives it a clean clock-on-the-wall feel. |

## Interface Notes

- Big centered timer with a soft glow.
- Glassy task menu over the forest background.
- Custom minute steppers instead of browser number inputs.
- Icon-first controls for start, restart, and skip.
- Random Qur'an quote on every page refresh.
- Qur'an sidebar shortcut for opening a calm reading space.

## Tech

Built with:

- Vite
- Plain JavaScript
- Tailwind CSS
- Font Awesome icons
- AlQuran Cloud API

## Run It

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

<div align="center">

`Eon is for the kind of work session where the page should become quieter than your thoughts.`

</div>
