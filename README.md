# Stopwatch

A simple stopwatch with lap support. Fully local — no network.

## Features
- Start / Pause / Reset
- Lap button records split times (shown below the main timer)
- Millisecond precision display

## Build & install
Requires Node ≥ 14 and the Zeus CLI (`npm i -g @zeppos/zeus-cli`).

```
npm install
zeus build
```

Sideload `dist/*.zab` via Developer Mode, or use `zeus dev` with a connected watch.
