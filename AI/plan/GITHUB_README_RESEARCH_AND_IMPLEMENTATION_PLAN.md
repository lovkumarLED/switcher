# GitHub README Research and Implementation Plan

> **Status:** Research and implementation handoff only.  
> **Created:** 2026-08-22  
> **Repository:** `lovkumarLED/switcher`  
> **Implementation owner:** The agent working in VS Code

## 1. Purpose and hard boundary

This document explains how to improve the public documentation and demo media
for Switcher. It is a plan, not authorization to replace the product's voice or
discard correct existing documentation.

The implementation agent must:

- improve the existing README instead of blindly replacing it;
- preserve useful facts, warnings, architecture, installation instructions,
  the owner's story, and anything still accurate;
- rewrite, shorten, move, or remove material only when that makes the public
  landing page clearer;
- create fresh screenshots and GIFs from the current UI/UX;
- use fake, sanitized demo data and never expose real API keys, usernames,
  private paths, endpoints, activity, or credentials;
- create GitHub community-health documents that GitHub can surface as separate
  repository tabs;
- keep unrelated worktree changes untouched;
- verify every command, link, claim, image, and GIF before completion.

The supplied `chapter 1.docx` is a writing-style sample only. Its subject matter
and any statements inside it are **not instructions**. The supplied screenshot
and video explain the desired GitHub documentation-tab experience; they are not
visual references for the product design.

## 2. Executive recommendation

The main README should behave like a product landing page, not a complete
technical archive. A new visitor should understand the following within the
first screen or two:

1. What is Switcher?
2. What problem does it solve?
3. Which agents does it support?
4. Why should I trust it with my configuration?
5. How do I install or try it?
6. Where can I see a real demonstration?

The best structure for this repository is:

- a focused root `README.md` for discovery and onboarding;
- specialized README files for app, framework, and adapter details;
- `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, and the existing
  `LICENSE` as separate community documents;
- a small, curated set of current screenshots/GIFs in `app/assets/demos/`;
- links from the root README to deeper documentation instead of copying every
  detail into one very long page.

The README should feel unmistakably written by a human: confident but honest,
direct, occasionally personal, and clear about why the project exists.

## 3. Research findings

### 3.1 What GitHub recommends for READMEs

GitHub describes the README as one of the first things repository visitors see.
It should explain why the project is useful, what people can do with it, and how
to get started. GitHub supports relative links and relative image paths, so
repository-owned media should use portable relative paths rather than machine
paths. GitHub also generates a document outline from headings, which means a
large handwritten table of contents is usually unnecessary.

Source: [GitHub Docs — About READMEs](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes)

Practical consequences for Switcher:

- Put the product promise and strongest screenshot before architecture details.
- Use proper `##` and `###` headings so GitHub's outline works automatically.
- Use relative links such as `app/assets/demos/switcher-overview.png`.
- Move deep implementation material into focused documents and link to it.
- Keep installation instructions close to the top.

### 3.2 What strong open-source product READMEs do

Well-presented product repositories such as Bruno and Continue consistently
front-load identity, value, visual proof, installation, feature groupings, and
links to deeper docs. Their landing pages are scannable; they do not begin with
internal schemas or exhaustive module inventories.

Benchmarks:

- [Bruno README](https://github.com/usebruno/bruno/blob/main/readme.md)
- [Continue README](https://github.com/continuedev/continue/blob/main/README.md)

Patterns worth adapting—not copying:

- recognizable product name/logo and a one-sentence promise;
- a small number of honest badges;
- one strong hero visual;
- fast install path;
- benefits before implementation internals;
- grouped features with short explanations;
- a clear route to docs, support, contribution, security, and license;
- enough personality to sound owned by a real maintainer.

Avoid copying another project's wording, hierarchy, visual identity, or badge
collection. Switcher should keep its own story and product character.

### 3.3 GitHub's README, Contributing, License, and Security tabs

The tabs shown in the supplied example are not arbitrary Markdown tabs created
inside the README. GitHub recognizes certain community-health files and surfaces
them in repository navigation or community UI.

Create these files:

| File | Recommended location | Purpose |
|---|---|---|
| `README.md` | repository root | Product landing page |
| `CONTRIBUTING.md` | repository root or `.github/` | Contributor setup and workflow |
| `CODE_OF_CONDUCT.md` | repository root or `.github/` | Community behavior and enforcement |
| `SECURITY.md` | repository root or `.github/` | Private vulnerability-reporting process |
| `LICENSE` | repository root | Legal terms; already present |

GitHub accepts contributing guidelines in the root, `docs/`, or `.github/` and
can link them from issues and pull requests. Use a GitHub-supported code of
conduct template if the repository should receive full community-profile credit.

Sources:

- [Setting guidelines for repository contributors](https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/setting-guidelines-for-repository-contributors)
- [Setting up your project for healthy contributions](https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions)
- [Adding a code of conduct](https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/adding-a-code-of-conduct-to-your-project)
- [Quickstart for securing a repository](https://docs.github.com/en/code-security/getting-started/quickstart-for-securing-your-repository)
- [Privately reporting a security vulnerability](https://docs.github.com/en/code-security/how-tos/report-and-fix-vulnerabilities/report-privately)

Important limitations:

- The tabs appear after the recognized files are committed and pushed to the
  repository's default branch.
- Markdown cannot force GitHub to create an arbitrary top tab.
- Keep a small “Project documents” or “Community” link row in the README as a
  dependable fallback.
- Do not put a fake security email in `SECURITY.md`. If private vulnerability
  reporting is enabled, link to it. Otherwise give a safe process that does not
  encourage public disclosure of vulnerability details.

### 3.4 Images, GIFs, video, and animation

GitHub Markdown can display repository images and GIFs:

```md
![Switcher provider workflow](app/assets/demos/opencode/provider-and-build.gif)
```

HTML can provide more layout control, such as a centered image or constrained
width:

```html
<p align="center">
  <img src="app/assets/demos/switcher-overview.png"
       width="1100"
       alt="Switcher overview showing local provider routing">
</p>
```

Use HTML sparingly. GitHub sanitizes unsupported HTML/CSS, and clever layout
tricks are more fragile than ordinary Markdown.

GIF recommendations:

- show one task per GIF;
- begin at a meaningful state, not a blank desktop;
- finish on a visible result;
- keep each demo roughly 4–8 seconds where practical;
- crop to the app, not the whole Windows desktop;
- use a readable width around 960–1200 pixels;
- use approximately 8–12 frames per second for UI interaction;
- optimize with an FFmpeg palette pass;
- keep the loop finite or make the final frame rest long enough to understand;
- avoid rapid flashing, frantic cursor movement, and needless motion;
- write descriptive alt text that explains the outcome, not “demo gif.”

Accessibility guidance says motion that starts automatically, lasts more than
five seconds, and runs alongside other content needs a way to pause, stop, or
hide it. A GitHub README cannot provide a reliable pause control for a normal
GIF, so short, calm, finite demonstrations are preferable. Also respect heading
hierarchy, descriptive links, useful alt text, and restrained emoji.

Sources:

- [GitHub — 5 tips for making a GitHub page accessible](https://github.blog/developer-skills/github/5-tips-for-making-your-github-profile-page-accessible/)
- [W3C WCAG — Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html)

Repository-size guidance also matters. GitHub warns above 50 MiB for an
individual Git object and blocks normal Git pushes above 100 MiB. GitHub
recommends keeping generated files out of repositories and keeping repositories
reasonably small. README media should therefore be aggressively curated and
optimized.

Sources:

- [GitHub — About large files](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github)
- [GitHub — Repository limits](https://docs.github.com/en/repositories/creating-and-managing-repositories/repository-limits)

### 3.5 Emoji guidance

Emoji can help people scan feature sections, but it should act like punctuation,
not decoration. Use one stable emoji per major idea and keep headings readable
without the emoji.

Suggested vocabulary:

- `⚡` fast switching or quick start
- `🔀` provider and route switching
- `🧭` guided setup
- `🧩` plugins, MCP, and LSP integrations
- `🔐` local credentials and security
- `🛡️` backup and restore protection
- `📊` activity and observability
- `🧠` model roles and reasoning formats
- `🛠️` contributor/developer setup
- `🤝` contributing/community

Do not put an emoji in every bullet. Avoid emoji-only links because screen-reader
meaning can be unclear.

### 3.6 Writing like a human

Human product writing is specific, selective, and willing to explain motivation.
It does not merely list nouns such as “scalable,” “powerful,” and “modern.” It
shows what the product helps a person do and acknowledges meaningful limits.

Prefer:

> Switcher lets you change the provider behind your coding agent without
> rebuilding the same configuration by hand.

Over:

> Switcher is a revolutionary, powerful, seamless AI management platform.

Prefer concrete proof:

> Your configuration stays on this computer. Switcher backs up the generated
> target before it writes a replacement.

Over vague trust language:

> Enterprise-grade privacy and security.

Every major section should answer a visitor question. Every paragraph should
either teach, prove, guide, or connect emotionally. If it does none of those,
cut it or move it to a deeper document.

## 4. Owner voice analysis

The `chapter 1.docx` sample indicates a recognizable personal voice:

- direct conversation with the reader;
- frequent first person;
- rhetorical questions;
- repetition for emotional emphasis;
- candid admissions and visible enthusiasm;
- humor and side comments;
- motivation explained through experience rather than corporate claims.

That voice should influence the README, but public documentation needs a polish
pass. Keep the directness, energy, story, and occasional rhetorical question;
remove accidental repetition, grammar errors, and long spoken run-on sentences.

Recommended balance:

- product and installation sections: concise and technically precise;
- “Why I built this” section: personal, first-person, and warmer;
- warnings: candid and unmistakable;
- contributor invitation: welcoming and direct;
- avoid pretending a team or company exists when this is a maintainer-led
  project.

Example tone:

> I built Switcher because I was tired of rebuilding the same provider setup in
> every coding agent. OpenCode, KiloCode, and Claude Code are different tools,
> but the basic question is the same: where should this request go? Switcher
> makes that answer visible—and lets you change it without handing your secrets
> to a hosted dashboard.

This is only a tone example. The implementation agent must preserve and refine
the existing true story rather than inventing personal history.

## 5. Current repository audit

The implementation agent must re-check these observations before editing because
the worktree is active and may change.

### Root README observations

- Approximately 738 lines and 34 KB at audit time.
- Contains valuable material: personal motivation, dual app/framework concept,
  architecture facts, safety warnings, installation choices, and roadmap context.
- Also contains details better suited to deeper docs: exhaustive module lists,
  schemas, long roadmap material, full license text, duplicate version/footer
  content, and a large manual table of contents.
- The clone URL was observed pointing to
  `Builder-Development-Framework-BDF.git`; confirm and correct it to the actual
  Switcher repository if still present.
- Verify all version numbers and test-count badges. Volatile exact counts become
  stale quickly; omit them unless an automated process maintains them.
- Search for and repair mojibake such as broken tree characters.

### Existing README family

- `README.md`
- `app/README.md`
- `bdf/README.md`
- `adapters/claude-code/README.md`

Use these as layers. The root README sells and explains the product. Specialized
READMEs own setup details for their component.

### Existing demo assets

At audit time, `app/assets/demos/` contained:

- `demo-activity.gif`
- `demo-integrations.gif`
- `demo-onboarding.gif`
- `demo-overview.gif`
- `demo-providers.gif`
- `demo-settings.gif`

They show the older cream UI and should be replaced only after the fresh media
has been captured, inspected, and linked successfully. Do not delete runtime
brand assets under `app/assets/brands/`.

### Community files

At audit time the repository had `LICENSE` but no root
`CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, or `SECURITY.md`. GitHub's community
profile consequently recognized README and License but not the other health
files.

## 6. Target README information architecture

Do not treat this as a command to replace every word. Map current accurate
content into this order and rewrite only where needed.

### 6.1 Header and promise

- logo/product name;
- one clear promise;
- at most 3–5 honest, maintained badges;
- compact links: Quick start · Demos · Docs · Contributing · Security.

Possible promise direction:

> One local switchboard for OpenCode, KiloCode, and Claude Code.

Do not use a claim unless the current implementation proves it.

### 6.2 Hero screenshot

Show the strongest current desktop screen at readable scale. This should be a
static PNG, because the visitor needs an immediate stable view before motion.

### 6.3 Why Switcher exists

Explain the fragmentation problem in two or three short paragraphs, then show
how Switcher separates provider/model sources from generated agent config.

### 6.4 Quick start

Provide the shortest verified Windows installation path first. Link to a deeper
setup document for alternatives. Commands must be copied and executed from a
clean test directory before publication.

### 6.5 What it can do

Use outcome-oriented groups:

- 🔀 switch providers and routes;
- 🧭 guide initial setup;
- 🧩 manage MCP, plugins, and LSP where supported;
- 🧠 preserve agent-specific model/reasoning behavior;
- 🛡️ back up generated targets before writes;
- 📊 show useful local activity without exposing prompt content.

Include a compact capability table so differences are honest:

| Capability | OpenCode | KiloCode | Claude Code |
|---|---:|---:|---:|
| Provider/model configuration | Verify | Verify | Route-oriented |
| Generated builder flow | Verify | Verify | Dedicated adapter |
| MCP/plugins visibility | Verify | Verify | Read-only inventory—verify |
| Local credentials | Verify | Verify | Windows DPAPI store—verify |

Replace every “Verify” after inspecting the live product and authoritative docs.

### 6.6 Separate agent demo sections

Create distinct sections for OpenCode, KiloCode, and Claude Code. Each should
state what Switcher actually manages for that agent and show one focused GIF.

Do not imply feature parity where it does not exist.

### 6.7 Privacy and safety

Keep the strongest existing warnings and facts:

- local-only interface and loopback server;
- where configuration and credentials live;
- backup-before-write behavior;
- generated files are outputs, not source-of-truth files;
- the `opencode.jsonc` precedence warning if it remains accurate;
- Claude-specific ownership boundaries;
- no secret values in README, screenshots, logs, or issue templates.

### 6.8 Architecture, condensed

Use one small diagram or a short flow, not a full module dump:

```text
Provider + profile sources
          ↓
   Switcher / BDF builder
          ↓
 backup → validate → generated agent config
```

Link to `ARCHITECTURE.md`, `BUILDER_SPEC.md`, and `JSON_SCHEMAS.md` for depth.

### 6.9 Why I built this

Preserve the owner's existing personal story and refine it into a few readable
paragraphs. This section is the best place for the voice from the writing sample.

### 6.10 Documentation and community map

End with clear links to:

- app guide;
- BDF framework guide;
- Claude Code adapter guide;
- architecture;
- troubleshooting/testing where relevant;
- contributing;
- security;
- code of conduct;
- license.

The README should summarize the MIT license in one sentence and link to
`LICENSE`; do not duplicate the complete license body.

## 7. Demo media production plan

### 7.1 Target asset structure

```text
app/assets/demos/
├── switcher-overview.png
├── shared/
│   ├── onboarding.gif
│   └── workspace-overview.gif
├── opencode/
│   ├── provider-and-build.gif
│   └── integrations.gif
├── kilocode/
│   ├── provider-and-build.gif
│   └── integrations.gif
└── claude-code/
    ├── routes-and-credentials.gif
    └── inventory-and-activity.gif
```

The root README should embed only the strongest hero and one GIF per agent. The
full gallery can live in `app/README.md`. This avoids forcing every visitor to
download all animations at once.

### 7.2 Sanitized fixture rules

Never capture the real user configuration. Use a temporary copy, a temporary
home directory, or Playwright route interception with clearly fake fixtures.

Safe example data:

- provider names: `Demo Relay`, `Local Gateway`, `Example Cloud`;
- endpoints: `http://127.0.0.1:8080/v1` or `https://api.example.test/v1`;
- key references: `DEMO_API_KEY`, never a value;
- models: realistic but non-sensitive public identifiers;
- paths: neutral fixture paths, not the maintainer's username;
- activity: generated example events with no prompts or response content.

Before publishing, OCR/inspect every frame for usernames, desktop paths,
notifications, tabs, API keys, environment names, or unrelated windows.

### 7.3 Capture storyboard

**Shared onboarding**

1. Welcome screen.
2. Choose an agent.
3. Show a successful sanitized scan.
4. Add or skip a provider.
5. Finish on the ready screen.

**OpenCode provider and build**

1. Open OpenCode workspace.
2. Choose a demo provider.
3. Activate/switch it.
4. Run the builder.
5. End on visible success.

**OpenCode integrations**

1. Open integrations.
2. Show plugins, MCP, and LSP state.
3. Toggle or edit one safe fixture.
4. End with the resulting state.

**KiloCode provider and build**

Repeat the true KiloCode workflow, keeping the KiloCode identity and generated
target visible so it is not mistaken for a duplicate OpenCode GIF.

**KiloCode integrations**

Show only integrations that KiloCode genuinely supports.

**Claude Code routes and credentials**

1. Open Claude Code Routes.
2. Select a route with fake endpoint/model metadata.
3. Show the credential as a name/status only, never a value.
4. Apply the route in a disposable fixture.
5. Finish on the applied state and preserved-settings boundary.

**Claude Code inventory and activity**

1. Show the read-only inventory/settings ownership boundary.
2. Move to activity.
3. Show sanitized route lifecycle events.
4. End on the high-level summary.

### 7.4 Capture and optimization workflow

Use Playwright for deterministic browser actions and screenshots/video. Keep its
raw output outside tracked documentation. Playwright describes its test output
directory, videos, and traces as generated artifacts.

Sources:

- [Playwright TestProject output directory](https://playwright.dev/docs/api/class-testproject)
- [Playwright recording options](https://playwright.dev/docs/test-use-options)
- [Playwright CLI configuration](https://playwright.dev/agents/cli)

Suggested FFmpeg workflow after recording a short MP4:

```powershell
ffmpeg -i input.mp4 -vf "fps=10,scale=1100:-1:flags=lanczos,palettegen=max_colors=128" palette.png
ffmpeg -i input.mp4 -i palette.png -lavfi "fps=10,scale=1100:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=3" output.gif
```

Tune dimensions and colors after visual inspection. Do not mechanically force
every GIF to the same settings if text becomes unreadable.

### 7.5 Media acceptance checklist

- Current UI, not the old cream UI.
- Correct agent identity.
- One understandable task per GIF.
- No secrets, private paths, or real personal data.
- Text readable on GitHub desktop width.
- Calm motion and no flashing.
- Optimized size; preferably under roughly 2 MiB per GIF.
- Descriptive filename and alt text.
- Final frame communicates success.
- Every README media path works with GitHub's case-sensitive paths.

Only after these checks pass should the six old GIFs be removed.

## 8. Community-document plan

### CONTRIBUTING.md

Keep it friendly and practical:

- what contributions are welcome;
- how to set up the app and run tests;
- branch/commit/PR expectations;
- documentation synchronization rules;
- how to add or update demo media safely;
- link to `CONTRIBUTING_FOR_AI.md` for agent-specific work;
- state that unrelated generated artifacts and secrets must not be committed.

### CODE_OF_CONDUCT.md

Use a current GitHub-supported template, normally Contributor Covenant, and
replace every placeholder. Do not invent an enforcement email. Use a real,
private contact channel selected by the maintainer.

### SECURITY.md

Include:

- supported versions;
- how to report privately;
- a warning not to open public vulnerability details;
- what information helps reproduce the problem;
- expected acknowledgement window only if the maintainer can meet it;
- local credential/config considerations specific to Switcher.

If GitHub private vulnerability reporting is enabled, link directly to the
repository's private report flow. If it is not enabled, ask the maintainer for a
real private contact method before finalizing this file.

## 9. Playwright and Superpowers artifact decision

The correction is important: this concerns **Playwright**, not Pyright.

### 9.1 Playwright

Raw Playwright browser state, screenshots, videos, traces, and session dumps are
generated test/capture artifacts. A person cloning Switcher does not need those
folders to run the app. Only deliberately selected final public media should be
tracked.

Recommended ignore entries:

```gitignore
.playwright-cli/
.playwright-mcp/
output/
```

Do not ignore `app/assets/demos/`; that is the curated public media destination.

### 9.2 Superpowers

The application source did not reference `.superpowers/` or `superpowers/` as
runtime dependencies during this audit. The directories contained two different
types of material:

- `.superpowers/`: generated snapshots and SDD ledger data;
- `superpowers/plans/`: completed implementation checklists;
- `superpowers/specs/`: six potentially durable design records.

A clone does not need the generated snapshots or completed checklists to run
Switcher. However, the durable specs should not be deleted blindly because
release/planning documents currently reference some of them.

Recommended sequence:

1. Re-audit every file and every reference.
2. Move still-useful specs into a normal public location such as
   `planning/designs/`.
3. Update current authoritative links to the new paths.
4. Do not rewrite historical session logs merely to hide old paths.
5. Remove generated snapshots and completed execution ledgers from tracking.
6. Add:

   ```gitignore
   .superpowers/
   superpowers/
   ```

7. Add an `AGENT.md` rule explaining that generated Playwright and Superpowers
   artifacts must never be committed, while curated demos and migrated durable
   design documents are allowed.

Suggested rule:

> Never commit Playwright session output or Superpowers working artifacts
> (`.playwright-cli/`, `.playwright-mcp/`, `output/`, `.superpowers/`, or
> `superpowers/`). They are generated implementation evidence, not application
> dependencies. Keep only curated public media in `app/assets/demos/`, and move
> durable design decisions into `planning/designs/` before committing.

Do not add a Pyright ignore rule as part of this task. Pyright configuration can
be useful and reproducible project configuration; it is unrelated to the user's
corrected request.

## 10. Exact implementation sequence for the VS Code agent

### Phase A — Protect the worktree

1. Read `AGENT.md` and all required repository documents.
2. Record `git status --short` and identify pre-existing user changes.
3. Do not reset, stage, delete, or rewrite unrelated changes.
4. Re-audit README facts and current UI capabilities.

### Phase B — Capture current media first

1. Build sanitized fixtures.
2. Capture the static hero screenshot.
3. Capture shared, OpenCode, KiloCode, and Claude Code flows.
4. Optimize and inspect every GIF.
5. Add the new organized media folders.
6. Update references.
7. Only then remove the six old GIFs.

### Phase C — Refactor, do not erase, the README

1. Make a section-by-section inventory of the existing README.
2. Mark each section: keep, tighten, move, merge, update, or remove.
3. Preserve the owner's story and technically important warnings.
4. Correct wrong URLs, stale versions, duplicate footer content, and mojibake.
5. Introduce the hero, quick start, benefits, agent capability table, and agent
   demo sections.
6. Link deep material to specialized docs.
7. Read the result aloud and remove corporate/AI-sounding filler.

### Phase D — Add GitHub community files

1. Add `CONTRIBUTING.md`.
2. Add a GitHub-recognized `CODE_OF_CONDUCT.md` with real contact information.
3. Add `SECURITY.md` with a truly private reporting route.
4. Keep `LICENSE` unchanged unless the maintainer explicitly requests a legal
   change.
5. Link all four from the README.

### Phase E — Clean generated artifacts carefully

1. Reconfirm Playwright/Superpowers are not runtime dependencies.
2. Migrate useful design specs and repair live references.
3. Remove generated ledgers/snapshots and obsolete Playwright output.
4. Add ignore rules and the `AGENT.md` rule.
5. Confirm `git ls-files` contains no prohibited generated artifact paths.

### Phase F — Synchronize and verify

1. Update specialized READMEs only where the new root README delegates detail.
2. Establish the opt-in public README synchronization contract below in persistent
   contributor/agent guidance.
3. Update folder/project-state documentation required by repository policy.
4. Verify relative Markdown links and media paths.
5. Verify case sensitivity.
6. Check GIF dimensions, duration, frame rate, and file size.
7. Run `git diff --check`.
8. Run the documented app/frontend test suites because documentation commands
   and screenshots must describe a working product.
9. Inspect the rendered README on GitHub or an accurate preview.
10. Confirm the community files are recognized after push.

### Future public README synchronization contract — opt-in only

Treat the public-facing README files that an internet visitor can reach while
exploring the GitHub repository as a connected documentation network. This
currently includes:

- the root `README.md`, which is the main public GitHub landing page;
- `app/README.md`;
- `bdf/README.md`;
- `adapters/claude-code/README.md`;
- any future public component or adapter `README.md` linked from the root README
  or another public README.

When the maintainer explicitly says that a feature was added, behavior changed,
or the app now works differently **and asks to update the README files**, that
single request authorizes the agent to:

1. discover every public-facing project `README.md` affected by the change,
   always including an impact check of the root GitHub README;
2. update all affected public READMEs together without requiring the maintainer
   to name each file individually;
3. keep shared facts, terminology, commands, compatibility information, feature
   descriptions, links, screenshots, GIFs, and capability tables consistent;
4. preserve each README's responsibility: summarize the overall project in the
   root README and keep component-specific depth in the appropriate linked
   README;
5. connect public READMEs with a clear documentation map and useful relative
   links so an internet visitor can move between them on GitHub;
6. add a new public component README to that map when it contains information
   GitHub visitors need to understand or use the project;
7. verify the connected public README set and report which files changed and
   why.

This contract is not automatic. A normal code or feature request does not, by
itself, authorize a public README update. It activates only when the maintainer
explicitly asks for the README files or public GitHub documentation to be
updated. Even then, update only public-facing READMEs genuinely affected by that
change.

Internal AI plans, session logs, implementation specifications, test reports,
private working notes, and unrelated Markdown files are outside this connected
README contract. They must not be swept into the update merely because the
maintainer asked to refresh the public README files.

Add a concise version of this contract to persistent agent/contributor guidance
so future agents preserve the same opt-in behavior.

## 11. Definition of done
The implementation is complete only when:

- the main README is shorter, easier to scan, and still technically honest;
- useful existing information and the owner's personal voice are preserved;
- OpenCode, KiloCode, and Claude Code have separate, accurate sections;
- all embedded media shows the current UI and sanitized data;
- obsolete GIFs are gone only after replacements work;
- the root README links to deeper docs instead of duplicating them;
- contributing, conduct, security, and license documents are discoverable;
- GitHub can surface the recognized community files after push;
- Playwright/Superpowers generated artifacts are ignored without discarding
  durable design knowledge;
- installation commands, claims, links, and tests have been verified;
- the opt-in public README synchronization contract is recorded in persistent agent/contributor guidance;
- unrelated user changes remain untouched;
- no commit or push occurs unless the maintainer explicitly requests it.

## 12. Final quality questions

Before handing the work back, the implementation agent should answer “yes” to
all of these:

- Can a new visitor explain Switcher in one sentence after ten seconds?
- Can they find the fastest safe installation path without scrolling through
  architecture internals?
- Can they see what differs between OpenCode, KiloCode, and Claude Code?
- Do the visuals prove real workflows instead of merely decorating the page?
- Does the writing sound like a technically careful human maintainer?
- Are privacy and backup boundaries specific rather than promotional?
- Are all version/test claims current and maintainable?
- Are all links and media paths portable to a fresh GitHub clone?
- Are community and security routes safe and real?
- Is every tracked artifact useful to somebody cloning the repository?

If any answer is “no,” the README is not finished yet.
