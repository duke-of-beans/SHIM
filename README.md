# SHIM

Autonomous code quality analysis and multi-model coordination infrastructure.

## The problem

Getting useful code review from an AI assistant usually means asking it directly and taking whatever it says. There's no structural check on that — no second opinion, no consistency pass across a whole codebase, no coordination when more than one model is involved in producing or reviewing the same work.

## What it does

SHIM handles two related jobs: automated code-quality analysis that runs independently of any single conversation, and coordination logic for when multiple models need to work on or evaluate the same code without stepping on each other. Distributed-systems patterns applied to a problem that's usually solved with a single ad-hoc prompt.

## Part of a system

SHIM is one piece of a larger cognitive-infrastructure stack — memory, maintenance, adversarial testing, and session continuity as separate, composable layers. See [davidkirsch.me/builds](https://davidkirsch.me/builds) for the rest.
