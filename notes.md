# Notes

## 2026-10-26: Design

What I built:

- Shared header in `root.tsx` with the app name and a "Practice" link.
- A new home page with a short intro and a "Start practising" button.
- Practice page: the passage on a card in a monospace font, a progress bar, a colour legend, and the results as stat tiles.

Things I learned:

- **Focus hint without React state.** The textarea has Tailwind's `peer` class. The passage and the hint come after it, so `peer-focus:blur-none` and `peer-focus:hidden` let them react to whether the textarea has focus. CSS only works on elements that come _after_ the peer, which is why the textarea is first.
- **Normal spaces, not ` `.** No-break spaces stopped the text wrapping between words, so on a phone words split in the middle. With `whitespace-pre-wrap`, normal spaces stay visible and lines wrap between words.
- **Wrong characters are underlined, not just red,** so someone who can't tell red from green still sees the mistake.
