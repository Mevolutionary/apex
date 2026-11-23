# Apex — Design Rules

Follow these rules in every UI change to Apex. If a rule conflicts with a direct request from Asher, ask before breaking it.

**Before building anything here, check the existing code first.** Some of these rules may already be in place. Only add what's missing, and don't rebuild or duplicate what already works.

**If something similar is already built, compare before changing it.** Work out whether the rule's approach would be more effective than what's there (faster, smoother, more reliable or easier to use). Don't swap it out on your own: explain the difference and the trade-offs to Asher (the developer), and ask whether to switch to the rule's approach or ignore the rule for that part of the app.

## Visual design
- **Nested rounded corners:** inner radius = outer radius − padding.
- **Borders:** use alpha colours like `rgb(0 0 0 / 0.12)` instead of solid hex so they blend into any background.
- **Palettes:** build colours in OKLCH, not HSL, so equal lightness actually looks equal.
- **Gradients:** interpolate in OKLCH, e.g. `linear-gradient(90deg in oklch, blue, orange)`, so they don't go grey in the middle.
- **Icons:** match icon stroke width to the weight of the text next to it.
- **Carousels:** fade the edges with `mask: linear-gradient(90deg, transparent, black 15% 85%, transparent)`.
- **Icon swaps:** blur the outgoing icon as it fades out (`filter: blur(4px)`).
- **Dark mode:** show depth with lighter surfaces; shadows barely show up.
- **Full-height sections:** use `100svh` for full-screen sections (stable). Use `100dvh` only for things that must resize with the browser toolbar, since `dvh` can jump while scrolling. Never plain `100vh`.
- **Product shots on white:** `mix-blend-mode: multiply` hides the white — **light backgrounds only**; switch it off in dark mode or the image goes muddy.

## Animation
- **Entrances:** start from `scale: 0.97` with `opacity: 0`, never from scale 0.
- **Buttons:** `button:active { scale: 0.97 }` with `transition: scale 150ms ease-out`.
- **Wrong input:** shake the field (translateX 0, −10, 10, −6, 6, −3, 0px over 360ms) as well as turning it red.
- **Steppers:** slide the next step in from the direction of travel instead of crossfading.
- **Accordions:** `:root { interpolate-size: allow-keywords }` so `height: auto` animates. Chrome/Edge only — Safari (iPhone) falls back to an instant open, which is acceptable.
- **Moving things:** animate `transform`/`opacity`, never `top`/`left`.
- **Theme switches:** disable transitions while the theme changes: `.theme-switching * { transition: none !important }`.
- **Tooltips:** delay only the first one; once one is open, show the rest instantly.
- **Flicks and drags:** on release, hand off to a spring that keeps the release velocity (Motion: `animate(y, 0, { type: "spring", duration: 0.5, bounce: 0, velocity })`) instead of a fixed-duration transition.
- **Carousels/sheets past their ends:** add resistance that grows the further you pull, then spring back.
- **Reduced motion:** respect `prefers-reduced-motion: reduce` — swap shakes, springs and slides for simple fades or no motion.

- **Easing:** never `ease-in` for UI. Default to a strong ease-out `cubic-bezier(0.23, 1, 0.32, 1)`; sheets and drawers use the iOS curve `cubic-bezier(0.32, 0.72, 0, 1)`.
- **Duration:** keep UI animations under 300ms (micro-interactions 100–150ms, dropdowns/tooltips 150–250ms, modals/sheets 200–300ms).
  - *Sole exception (approved by Asher, 22 Nov 2026):* a left/right page swipe slides 56px over 380ms (old page out in 300ms) so it reads as movement. Taps and dock changes stay under 300ms.
- **Origin-aware popovers:** popovers and menus scale out from the element that opened them (`transform-origin` at the trigger). Modals stay centred.

## Feedback
- Every action gets immediate feedback: loading state while saving, a success state when done (logging a set, saving a weigh-in, syncing).

## iPhone home-screen app
- **Safe areas:** `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`, then pad edges with `max(1rem, env(safe-area-inset-*))` so nothing hides behind the Dynamic Island or home bar.
- **Touch targets:** at least 44×44px, including small controls like the rest timer and plate calculator.

## Liquid glass
- Use `backdrop-filter` glass sparingly — nav bars, sheets, a hero card — never on long scrolling lists of cards (kills frame rate on phones).
- Check text contrast (4.5:1) against the worst-case background behind the glass, not the ideal one.
- Provide a solid fallback: wrap glass in `@supports (backdrop-filter: blur(1px))` and use an opaque background otherwise.

## Extra rules
- Tabular numbers (`font-variant-numeric: tabular-nums`) for weights, reps, timers and stats so digits don't jiggle.
- Number inputs use `inputmode="decimal"`, and all inputs are at least 16px so iOS doesn't zoom in.
- Optimistic, offline-first logging: a set appears logged instantly and syncs in the background; works with bad gym signal.
- Timers are calculated from start timestamps, not by counting ticks, so the rest timer stays right after the screen locks.
- Keep the screen awake during an active workout (Screen Wake Lock API, released when the workout ends); test on iPhone.
- One-handed gym use: main actions in the bottom thumb zone, big +/− steppers for weight and reps.
  - *Exception (Asher, 24 Nov 2026):* no +/− stepper bar above the keyboard in Apex; it covered the set rows. Tapping a weight or reps box highlights the whole value instead, so typing replaces it.
- Undo instead of "Are you sure?" for deleting sets, meals and workouts (toast with Undo for ~5s).
- Skeleton placeholders instead of spinners for loading lists and charts; no layout jumps when data arrives.
- Empty states that teach: the first time a screen has no data, show what goes there and one button to start.
- Charts: always show units, label lines directly, and use colours that work for colour-blind friends.
- Mobile polish: `touch-action: manipulation`, `-webkit-tap-highlight-color: transparent`, `overscroll-behavior: contain` on sheets.
- Headings use `text-wrap: balance`; paragraphs use `text-wrap: pretty`.

## Proposed additions
_(Waiting for Asher's approval — do not apply until moved above.)_
