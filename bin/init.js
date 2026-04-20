#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { createInterface } from 'node:readline/promises'
import { stdin, stdout } from 'node:process'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const PKG_ROOT = resolve(HERE, '..')
const PKG = JSON.parse(readFileSync(join(PKG_ROOT, 'package.json'), 'utf8'))

const HOME = homedir()
const CLAUDE_DIR = join(HOME, '.claude')
const CLAUDE_COMMANDS = join(CLAUDE_DIR, 'commands')
const FAT_STATE = join(HOME, '.fat-stack')
const MANIFEST_PATH = join(FAT_STATE, 'manifest.json')
const COMMANDS_SRC = join(PKG_ROOT, 'commands')
const TEMPLATES_SRC = join(PKG_ROOT, 'templates')

const REPO_URL = 'https://github.com/rayepps/fat-stack'
const INIT_CONFIG_DOC = `${REPO_URL}/blob/main/docs/init-config.md`

const FAT_DOCS_VERSION = '^0.1.1'

const GREENFIELD_ALLOWED = new Set([
  '.git',
  '.gitignore',
  '.DS_Store',
  'README.md',
  'LICENSE',
  '.github',
])

const SCHEMA = {
  projectMode: {
    flag: '--project-mode',
    values: ['greenfield', 'existing', 'auto'],
    default: 'auto',
    summary: 'Whether this is a new (greenfield) or existing project.',
    detail: 'Greenfield scaffolds CLAUDE.md + .gitignore and expects an empty cwd. Existing installs skills into a project that already has code. Auto detects based on cwd contents.',
  },
  installCodexMcp: {
    flag: '--install-codex-mcp',
    values: ['yes', 'no'],
    default: 'no',
    summary: 'Register OpenAI Codex CLI as a second-opinion reviewer MCP.',
    detail: 'Codex often catches bugs Claude misses and runs reviews in parallel. Requires `npm install -g @openai/codex` (auto) and `codex login` once (user). Skipped entirely if codex is already registered in this project\'s .mcp.json.',
  },
  overwriteClaudeMd: {
    flag: '--overwrite-claude-md',
    values: ['no', 'ask', 'yes'],
    default: 'no',
    summary: 'What to do if CLAUDE.md already exists at project root.',
    detail: 'Greenfield mode writes a CLAUDE.md template. If one already exists, this controls behavior. "no" preserves the existing file. "yes" overwrites it. "ask" is reserved for interactive mode.',
  },
  skillPrefix: {
    flag: '--skill-prefix',
    values: ['no', 'yes'],
    default: 'no',
    summary: 'Install skills as /dev vs /fat-stack-dev.',
    detail: 'Default is flat names (/dev, /deep-review, etc.). Use yes if you run other command packs with colliding names.',
  },
  patterns: {
    flag: '--patterns',
    kind: 'csv',
    options: ['global', 'typescript', 'database', 'frontend', 'react'],
    aliases: {
      default: ['global'],
      none: [],
      all: ['global', 'typescript', 'database', 'frontend', 'react'],
    },
    default: 'default',
    summary: 'Which pattern packs to seed under docs/technical/patterns/.',
    detail: 'Comma-separated subset of: global, typescript, database, frontend, react. Or an alias: "default" (= global), "none", "all". Packs ship as starter rules the user edits. Detect-and-skip per file, so re-running is safe.',
  },
}

const PATTERN_PACKS = {
  global: ['index.md', 'wet-first-design.md', 'observability.md'],
  typescript: ['index.md', 'code-style.md', 'types.md'],
  database: ['index.md', 'queries.md', 'schema.md'],
  frontend: ['index.md', 'loading-states.md', 'error-handling.md'],
  react: ['index.md', 'components.md', 'state.md'],
}

const resolvePatternPacks = (raw) => {
  const spec = SCHEMA.patterns
  if (spec.aliases[raw]) return spec.aliases[raw]
  return raw.split(',').map((s) => s.trim()).filter(Boolean)
}

const validatePatternsValue = (value) => {
  const spec = SCHEMA.patterns
  if (spec.aliases[value]) return true
  const parts = value.split(',').map((s) => s.trim()).filter(Boolean)
  if (parts.length === 0) return false
  return parts.every((p) => spec.options.includes(p))
}

const log = (msg = '') => stdout.write(`${msg}\n`)
const warn = (msg) => process.stderr.write(`warning: ${msg}\n`)
const fail = (msg) => {
  process.stderr.write(`error: ${msg}\n`)
  process.exit(1)
}

// ─── manifest ──────────────────────────────────────────────────
const readManifest = () => {
  if (!existsSync(MANIFEST_PATH)) return { version: null, installed: [] }
  return JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'))
}

const writeManifest = (manifest) => {
  if (!existsSync(FAT_STATE)) mkdirSync(FAT_STATE, { recursive: true })
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2))
}

// ─── skills ────────────────────────────────────────────────────
const removeManifestSkills = () => {
  const manifest = readManifest()
  for (const entry of manifest.installed) {
    if (existsSync(entry.path)) rmSync(entry.path)
  }
}

const listSkillSources = () => {
  const files = readdirSync(COMMANDS_SRC).filter((f) => f.endsWith('.md'))
  return files.map((f) => ({ file: f, name: f.replace(/\.md$/, '') }))
}

const installSkills = (skillPrefix) => {
  if (!existsSync(CLAUDE_DIR)) {
    fail(`Claude Code config directory not found at ${CLAUDE_DIR}. Install Claude Code first: https://docs.anthropic.com/en/docs/claude-code`)
  }
  if (!existsSync(CLAUDE_COMMANDS)) mkdirSync(CLAUDE_COMMANDS, { recursive: true })

  removeManifestSkills()
  const sources = listSkillSources()
  const installed = []
  for (const { file, name } of sources) {
    // Skills already prefixed with "fat-" (like fat-help) never get double-prefixed.
    const alreadyPrefixed = name.startsWith('fat-')
    const destName = skillPrefix === 'yes' && !alreadyPrefixed ? `fat-stack-${file}` : file
    const displayName = skillPrefix === 'yes' && !alreadyPrefixed ? `fat-stack-${name}` : name
    const destPath = join(CLAUDE_COMMANDS, destName)
    writeFileSync(destPath, readFileSync(join(COMMANDS_SRC, file), 'utf8'))
    installed.push({ name: displayName, path: destPath })
  }
  writeManifest({
    version: PKG.version,
    installedAt: new Date().toISOString(),
    skillPrefix,
    installed,
  })
  return installed
}

// ─── project mode detection ────────────────────────────────────
const detectProjectMode = (cwd) => {
  const entries = readdirSync(cwd)
  const significant = entries.filter((e) => !GREENFIELD_ALLOWED.has(e))
  return significant.length === 0 ? 'greenfield' : 'existing'
}

const resolveProjectMode = (cwd, configured) => {
  if (configured === 'greenfield' || configured === 'existing') return configured
  return detectProjectMode(cwd)
}

// ─── greenfield scaffolding ────────────────────────────────────
const writeIfAbsentOrOverwrite = (dest, contents, label, overwriteMode) => {
  if (!existsSync(dest)) {
    writeFileSync(dest, contents)
    log(`  created ${label}`)
    return 'created'
  }
  if (overwriteMode === 'yes') {
    writeFileSync(dest, contents)
    log(`  overwrote ${label}`)
    return 'overwritten'
  }
  warn(`${label} already exists at ${dest} — leaving it alone (use --overwrite-claude-md=yes to replace).`)
  return 'kept'
}

const scaffoldGreenfield = (cwd, overwriteClaudeMd) => {
  log('Scaffolding greenfield project files...')
  const claudeTemplate = readFileSync(join(TEMPLATES_SRC, 'CLAUDE.md'), 'utf8')
  const gitignoreTemplate = readFileSync(join(TEMPLATES_SRC, 'gitignore'), 'utf8')

  writeIfAbsentOrOverwrite(join(cwd, 'CLAUDE.md'), claudeTemplate, 'CLAUDE.md', overwriteClaudeMd)
  if (!existsSync(join(cwd, '.gitignore'))) {
    writeFileSync(join(cwd, '.gitignore'), gitignoreTemplate)
    log('  created .gitignore')
  } else {
    log('  .gitignore already exists — leaving it alone')
  }
}

// ─── fat-docs ──────────────────────────────────────────────────
const hasFatDocs = (cwd) => {
  const docsRoot = join(cwd, 'docs')
  return existsSync(join(docsRoot, 'product')) && existsSync(join(docsRoot, 'technical'))
}

const runFatDocsInit = (cwd) => {
  log('Running fat-docs init (registers MCP, scaffolds docs/, installs background service)...')
  const result = spawnSync('npx', ['--yes', `fat-docs@${FAT_DOCS_VERSION}`, 'init', '--yes'], {
    cwd,
    stdio: 'inherit',
  })
  if (result.status !== 0) {
    warn(`fat-docs init did not complete successfully. Re-run manually with \`npx fat-docs@${FAT_DOCS_VERSION} init\`.`)
    return 'failed'
  }
  return 'installed'
}

// ─── pattern packs ─────────────────────────────────────────────
const installPatternPacks = (cwd, packs) => {
  if (packs.length === 0) {
    log('Pattern packs: none requested.')
    return { packs: [], written: 0, skipped: 0 }
  }
  log(`Pattern packs: ${packs.join(', ')}`)
  const patternsRoot = join(cwd, 'docs', 'technical', 'patterns')
  let written = 0
  let skipped = 0
  for (const pack of packs) {
    const files = PATTERN_PACKS[pack]
    const sourceDir = join(TEMPLATES_SRC, 'patterns', pack)
    const targetDir = join(patternsRoot, pack)
    let packWritten = 0
    let packSkipped = 0
    for (const file of files) {
      const target = join(targetDir, file)
      if (existsSync(target)) {
        packSkipped += 1
        skipped += 1
        continue
      }
      mkdirSync(targetDir, { recursive: true })
      writeFileSync(target, readFileSync(join(sourceDir, file), 'utf8'))
      packWritten += 1
      written += 1
    }
    log(`  ${pack}/: ${packWritten} written, ${packSkipped} already present`)
  }
  return { packs, written, skipped }
}

// ─── codex ─────────────────────────────────────────────────────
const isCodexCliInstalled = () => {
  const result = spawnSync('which', ['codex'], { stdio: 'ignore' })
  return result.status === 0
}

const hasCodexInMcpJson = (cwd) => {
  const path = join(cwd, '.mcp.json')
  if (!existsSync(path)) return false
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8'))
    return parsed?.mcpServers?.codex !== undefined
  } catch {
    return false
  }
}

const installCodexCli = () => {
  log('  installing @openai/codex globally via npm...')
  const result = spawnSync('npm', ['install', '-g', '@openai/codex'], { stdio: 'inherit' })
  return result.status === 0
}

const registerCodexMcp = (cwd) => {
  const path = join(cwd, '.mcp.json')
  const existing = existsSync(path)
    ? JSON.parse(readFileSync(path, 'utf8'))
    : { mcpServers: {} }
  existing.mcpServers = existing.mcpServers || {}
  if (existing.mcpServers.codex) return false
  existing.mcpServers.codex = {
    type: 'stdio',
    command: 'codex',
    args: ['mcp-server'],
  }
  writeFileSync(path, `${JSON.stringify(existing, null, 2)}\n`)
  return true
}

const CODEX_RULE_BEGIN = '<!-- fat-stack:codex-concurrency:begin -->'
const CODEX_RULE_END = '<!-- fat-stack:codex-concurrency:end -->'
const CODEX_RULE_BLOCK = `${CODEX_RULE_BEGIN}
## Codex MCP concurrency

Codex MCP calls (\`mcp__codex__codex\`, \`mcp__codex__codex-reply\`) serialize within a single conversation thread even when issued in one message. Batching them directly turns multi-question research into a long serial chain.

When you need **multiple** Codex calls, dispatch each through its own sub-agent (Agent tool) and launch all sub-agents in a single message so they run concurrently. A single Codex call has nothing to parallelize — call it directly. This rule applies to every agent, including sub-agents: if you have one Codex call to make, make it; only fan out when you have more than one.
${CODEX_RULE_END}`

const appendCodexRuleToClaudeMd = (cwd) => {
  const path = join(cwd, 'CLAUDE.md')
  if (!existsSync(path)) {
    writeFileSync(path, `${CODEX_RULE_BLOCK}\n`)
    return 'created'
  }
  const current = readFileSync(path, 'utf8')
  if (current.includes(CODEX_RULE_BEGIN)) return 'present'
  const suffix = current.endsWith('\n') ? '' : '\n'
  writeFileSync(path, `${current}${suffix}\n${CODEX_RULE_BLOCK}\n`)
  return 'appended'
}

const installCodex = (cwd) => {
  log('Codex MCP setup...')
  if (hasCodexInMcpJson(cwd)) {
    log('  codex already registered in .mcp.json — skipping entirely.')
    return 'skipped-already-configured'
  }
  if (isCodexCliInstalled()) {
    log('  codex CLI already installed — skipping npm install.')
  } else {
    const ok = installCodexCli()
    if (!ok) {
      warn('npm install -g @openai/codex failed. Install manually (brew install --cask codex or see https://github.com/openai/codex) and re-run with --install-codex-mcp=yes.')
      return 'failed-npm'
    }
  }
  registerCodexMcp(cwd)
  log('  registered codex in .mcp.json')
  const ruleStatus = appendCodexRuleToClaudeMd(cwd)
  log(`  concurrency rule: ${ruleStatus} in CLAUDE.md`)
  log('  → run `codex login` once to authenticate (opens browser for ChatGPT OAuth)')
  return 'installed'
}

// ─── flag parsing ──────────────────────────────────────────────
const parseFlags = (argv) => {
  const out = {}
  let agentMode = false
  const flagEntries = Object.entries(SCHEMA)

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--agent') {
      agentMode = true
      continue
    }
    const entry = flagEntries.find(([, spec]) => spec.flag === arg)
    if (!entry) {
      warn(`Unknown flag: ${arg}`)
      continue
    }
    const [key, spec] = entry
    const value = argv[++i]
    if (spec.kind === 'csv') {
      if (!validatePatternsValue(value)) {
        const accepted = [...Object.keys(spec.aliases), ...spec.options].join(', ')
        fail(`Invalid value for ${arg}: ${value} (expected "${spec.options.join(',')}" subset or alias: ${accepted})`)
      }
    } else if (!spec.values.includes(value)) {
      fail(`Invalid value for ${arg}: ${value} (expected one of ${spec.values.join(', ')})`)
    }
    out[key] = value
  }
  return { agentMode, flags: out }
}

const withDefaults = (flags) => {
  const out = {}
  for (const [key, spec] of Object.entries(SCHEMA)) {
    out[key] = flags[key] ?? spec.default
  }
  return out
}

// ─── agent guide ───────────────────────────────────────────────
const printAgentGuide = () => {
  log(`# fat-stack init — agent mode (v${PKG.version})`)
  log()
  log('You are guiding a user through fat-stack initialization. Collect the decisions')
  log('below, then re-invoke this CLI with the answers as flags:')
  log()
  log('  npx fat-stack@latest init --agent <flag> <value> <flag> <value> ...')
  log()
  log(`For a deep overview — what each option means, pros/cons, methodology impact — read:`)
  log(`  ${INIT_CONFIG_DOC}`)
  log()
  log('## Decisions')
  log()
  for (const spec of Object.values(SCHEMA)) {
    log(`### ${spec.flag}`)
    log(spec.summary)
    if (spec.kind === 'csv') {
      log(`  values:  csv subset of [${spec.options.join(', ')}] — or alias: ${Object.keys(spec.aliases).join(', ')}`)
    } else {
      log(`  values:  ${spec.values.join(' | ')}`)
    }
    log(`  default: ${spec.default}`)
    log(`  detail:  ${spec.detail}`)
    log()
  }
  log('## When you re-invoke')
  log()
  log('The CLI will:')
  log('  1. Install skills to ~/.claude/commands/.')
  log('  2. If --project-mode=greenfield (or auto-detected): scaffold CLAUDE.md + .gitignore from templates.')
  log('  3. Run `fat-docs init` to register the docs MCP and scaffold docs/ (idempotent).')
  log('  4. Seed the pattern packs selected via --patterns under `docs/technical/patterns/<pack>/` (detect-and-skip per file).')
  log('  5. If --install-codex-mcp=yes AND codex is not already in the project .mcp.json: install the Codex CLI (if not present), register the codex MCP, append a concurrency rule to CLAUDE.md. Remind the user to run `codex login` once.')
  log('  6. Print a next-step return prompt for you to act on.')
  log()
  log('## How to run the interview')
  log()
  log('The user is likely seeing fat-stack for the first time. Do not assume they know what')
  log('"greenfield", "MCP", "skill prefix", or "pattern pack" mean. Your job is to translate.')
  log()
  log('Structure your response in **two parts**:')
  log()
  log('### Part 1 — Full walkthrough')
  log()
  log('Walk through every decision below in depth. For each one, cover:')
  log()
  log('  - **What it is** — plain English, no jargon. "Do you want a second AI reviewer?" not')
  log('    "Install the Codex MCP."')
  log('  - **Why it matters** — one sentence on the real tradeoff, not the mechanism.')
  log('  - **Your recommendation** — pick one, name it, and give a one-line reason grounded in')
  log('    what you know about this user/project.')
  log()
  log('Use headings and short paragraphs, not bullet fire. Each decision should feel like a')
  log('moment the user can engage with, not a checkbox to tick.')
  log()
  log('Decisions to cover (skip the ones marked "auto-decide" unless the user asks):')
  log()
  log('- **--project-mode** _(auto-decide)_ — The CLI auto-detects from cwd contents. Mention')
  log('  what it detected ("looks like an existing project / empty directory") and move on.')
  log('  Only ask if detection seems wrong.')
  log('- **--install-codex-mcp** _(detect before asking)_ — Check whether Codex is already')
  log('  installed before prompting. Signals (any one is enough):')
  log('    - `which codex` returns a path (Codex CLI on PATH)')
  log('    - `~/.codex/auth.json` exists (authenticated)')
  log('    - `~/.codex/config.toml` exists (configured)')
  log('  If any signal is positive, silently set `yes` and mention it in the TL;DR ("I')
  log('  detected Codex — enabling second-opinion reviews"). Do not ask whether to install')
  log('  something they already have. If none of the signals are present, ask briefly:')
  log('  "Codex is an optional second-opinion reviewer (different model, different blind')
  log('  spots). Uses your ChatGPT plan compute. Want to set it up?" Recommend `yes` if')
  log('  they have ChatGPT Plus/Pro; `no` otherwise.')
  log('- **--patterns** — Ask. Patterns are the hard rules `/dev` follows when writing code')
  log('  and `/deep-review` enforces. Ask what they\'re building to recommend packs:')
  log('    - TypeScript/JS project → `global,typescript`')
  log('    - React app → `global,typescript,frontend,react`')
  log('    - SQL-heavy service → add `database`')
  log('    - Non-JS / exploratory → `global` alone (default)')
  log('- **--overwrite-claude-md** _(auto-decide)_ — Only relevant in greenfield if a CLAUDE.md')
  log('  already exists. Skip the question entirely if the file isn\'t there. If it is, ask')
  log('  whether to overwrite — default `no`.')
  log('- **--skill-prefix** _(auto-decide)_ — Default `no` (flat names like `/dev`, `/deep-review`).')
  log('  Only ask if the user mentions running other command packs (e.g., gstack) that might')
  log('  collide. For 99% of users, skip this.')
  log()
  log('### Part 2 — TL;DR recommendations')
  log()
  log('After the walkthrough, close with a compact summary block the user can scan in 5 seconds')
  log('and approve without re-reading anything above. Exact format:')
  log()
  log('  **TL;DR — my recommendations:**')
  log()
  log('  | Decision | Recommendation | Why |')
  log('  | --- | --- | --- |')
  log('  | Project mode | `auto` (detected: existing) | Your cwd has code already. |')
  log('  | Codex second-opinion reviewer | `yes` | High-leverage, catches bugs Claude alone misses. |')
  log('  | Pattern packs | `global,typescript` | Stack-agnostic rules + your TS stack. |')
  log('  | Overwrite CLAUDE.md | n/a | No existing file. |')
  log('  | Skill prefix | `no` | Flat names unless you run other command packs. |')
  log()
  log('  Ready to run with these, or want to change anything?')
  log()
  log('When the user confirms (or amends), re-invoke the CLI with all flags in one call.')
  log()
  log('## Tone')
  log()
  log('- No emoji. No bullet fire. Prose explanations over walls of lists.')
  log('- Opinions over menus. The user installed fat-stack to get your judgment; a recommendation')
  log('  they can override beats a list of five options with equal weight.')
  log('- When the user is obviously decisive ("just do the defaults"), skip Part 1, print the')
  log('  TL;DR with your recommendations, and move to confirmation.')
}

// ─── interactive ───────────────────────────────────────────────
const runInteractive = async () => {
  if (!stdin.isTTY) {
    fail('Non-interactive terminal. Run with `--agent` for agent-driven init (no other args prints the guide; pass flags to execute).')
  }
  const rl = createInterface({ input: stdin, output: stdout })
  const askChoice = async (question, choices, defaultValue) => {
    while (true) {
      const prompt = `${question} (${choices.join('/')}) [${defaultValue}] `
      const raw = (await rl.question(prompt)).trim().toLowerCase()
      const answer = raw || defaultValue
      if (choices.includes(answer)) return answer
      log(`  invalid — expected one of: ${choices.join(', ')}`)
    }
  }
  const askYesNo = async (question, defaultValue = 'no') => {
    const normalized = defaultValue === 'yes' ? 'y' : 'n'
    const prompt = defaultValue === 'yes' ? '[Y/n]' : '[y/N]'
    const raw = (await rl.question(`${question} ${prompt} `)).trim().toLowerCase()
    if (!raw) return defaultValue
    return raw.startsWith('y') ? 'yes' : 'no'
  }

  try {
    const cwd = process.cwd()
    const detected = detectProjectMode(cwd)
    log(`fat-stack v${PKG.version} — interactive setup`)
    log()
    log(`Detected project mode: ${detected} (from contents of ${cwd})`)
    const confirm = await askYesNo('Use the detected mode?', 'yes')
    const projectMode = confirm === 'yes'
      ? detected
      : await askChoice('Project mode?', ['greenfield', 'existing'], detected)
    log()

    const codex = await askYesNo(
      'Install OpenAI Codex as an optional second-opinion reviewer MCP? (useful for /deep-review)',
      'no',
    )
    log()

    let overwriteClaudeMd = 'no'
    if (projectMode === 'greenfield' && existsSync(join(cwd, 'CLAUDE.md'))) {
      overwriteClaudeMd = await askYesNo('CLAUDE.md already exists — overwrite it?', 'no')
      log()
    }

    log('Pattern packs seed starter rules under docs/technical/patterns/. Options:')
    log('  global (WET-first design, observability) — recommended starter')
    log('  typescript, database, frontend, react — opt in per stack')
    const patternsRaw = (await rl.question(
      'Which packs to install? (comma-separated, or "default", "none", "all") [default] ',
    )).trim()
    const patterns = patternsRaw || 'default'
    if (!validatePatternsValue(patterns)) {
      fail(`Invalid patterns value: ${patterns}`)
    }
    log()

    rl.close()
    runInit({ projectMode, installCodexMcp: codex, overwriteClaudeMd, skillPrefix: 'no', patterns })
  } finally {
    rl.close()
  }
}

// ─── init execution ────────────────────────────────────────────
const runInit = (flags) => {
  const cwd = process.cwd()
  const config = withDefaults(flags)
  const mode = resolveProjectMode(cwd, config.projectMode)

  const patternPacks = resolvePatternPacks(config.patterns)

  log(`fat-stack v${PKG.version} — init`)
  log(`  project-mode:         ${mode}${config.projectMode === 'auto' ? ' (detected)' : ''}`)
  log(`  install-codex-mcp:    ${config.installCodexMcp}`)
  log(`  overwrite-claude-md:  ${config.overwriteClaudeMd}`)
  log(`  skill-prefix:         ${config.skillPrefix}`)
  log(`  patterns:             ${patternPacks.length === 0 ? 'none' : patternPacks.join(', ')}`)
  log()

  log(`Installing skills to ${CLAUDE_COMMANDS}...`)
  const skills = installSkills(config.skillPrefix)
  log(`  installed ${skills.length} skills`)
  log()

  if (mode === 'greenfield') {
    scaffoldGreenfield(cwd, config.overwriteClaudeMd)
    log()
  }

  const docsStatus = hasFatDocs(cwd) ? 'present' : runFatDocsInit(cwd)
  log()

  const patternsResult = installPatternPacks(cwd, patternPacks)
  log()

  const codexStatus = config.installCodexMcp === 'yes' ? installCodex(cwd) : 'not-requested'
  if (config.installCodexMcp === 'yes') log()

  printReturnPrompt({ mode, skills, docsStatus, patternsResult, codexStatus, cwd })
}

const printReturnPrompt = ({ mode, skills, docsStatus, patternsResult, codexStatus, cwd }) => {
  const names = skills.map((s) => `/${s.name}`).join(', ')
  log('─────────────────────────────────────────────────────────────')
  log()
  log(`# fat-stack installed — ${mode} project`)
  log()
  log(`Version ${PKG.version}. ${skills.length} skills installed to \`~/.claude/commands/\`:`)
  log()
  log(names)
  log()
  log('# What happened')
  if (mode === 'greenfield') {
    log(`- Scaffolded \`CLAUDE.md\` and \`.gitignore\` in \`${cwd}\`.`)
  }
  log(`- fat-docs: ${docsStatus}.`)
  if (patternsResult.packs.length === 0) {
    log('- Pattern packs: none requested.')
  } else {
    log(`- Pattern packs (${patternsResult.packs.join(', ')}): ${patternsResult.written} files written, ${patternsResult.skipped} already present under \`docs/technical/patterns/\`.`)
  }
  if (codexStatus === 'installed') {
    log('- Codex MCP: installed, registered in `.mcp.json`, concurrency rule appended to `CLAUDE.md`. User must run `codex login` once.')
  } else if (codexStatus === 'skipped-already-configured') {
    log('- Codex MCP: already configured, left alone.')
  } else if (codexStatus === 'failed-npm') {
    log('- Codex MCP: npm install failed. Install manually and re-run.')
  } else {
    log('- Codex MCP: not requested.')
  }
  log()
  log('# What to do now')
  if (mode === 'greenfield') {
    log('1. Tell the user: "Your fat-stack project is set up. Next we\'ll run `/fresh-start` together. It will interview you about what you\'re building, help you pick a stack, and produce the first product and technical docs. Ready?"')
    log('2. When the user is ready, run `/fresh-start`. The skill owns the interview — don\'t improvise the questions. It will write `docs/product/overview.md`, `docs/technical/stack.md`, and populate the `## Project` section of `CLAUDE.md`.')
    log('3. After fresh-start, ask the user whether they want to expand product docs (`/product-author`), technical docs (`/technical-author`), or implement the first feature (`/dev`). Do not start writing code before `/fresh-start` runs.')
  } else {
    log('1. Open this project\'s `CLAUDE.md` (create it at the project root if missing). Add a section titled "fat-stack" that names the skills, describes the loop (product → technical → dev → review → gaps → iterate), and states that `docs/product/` and `docs/technical/` are the sources of truth.')
    log('2. Confirm `docs/product/` and `docs/technical/` have at least an overview. Backfill with `/product-author` and `/technical-author` if sparse.')
    log('3. Ask the user which feature, refactor, or fix they want to run through the fat-stack loop first.')
  }
  if (codexStatus === 'installed') {
    log()
    log('⚠ Remind the user to run `codex login` in their terminal once before using Codex-powered skills.')
  }
  log()
  log('─────────────────────────────────────────────────────────────')
}

// ─── commands ──────────────────────────────────────────────────
const runUninstall = () => {
  const manifest = readManifest()
  if (manifest.installed.length === 0) {
    log('Nothing to uninstall.')
    return
  }
  let removed = 0
  for (const entry of manifest.installed) {
    if (existsSync(entry.path)) {
      rmSync(entry.path)
      removed += 1
    }
  }
  if (existsSync(MANIFEST_PATH)) rmSync(MANIFEST_PATH)
  log(`Removed ${removed} skill files. Project-level files (CLAUDE.md, .mcp.json) left alone.`)
}

const runHelp = () => {
  log(`fat-stack v${PKG.version} — Fully Aligned Tooling for Claude Code`)
  log()
  log('Usage:')
  log('  npx fat-stack@latest init                Interactive setup (TTY).')
  log('  npx fat-stack@latest init --agent        Print agent-mode guide and exit.')
  log('  npx fat-stack@latest init --agent \\     Execute init with the given config.')
  log('    --project-mode greenfield|existing|auto \\')
  log('    --install-codex-mcp yes|no \\')
  log('    --overwrite-claude-md no|yes \\')
  log('    --skill-prefix no|yes \\')
  log('    --patterns default|none|all|<csv of: global,typescript,database,frontend,react>')
  log('  npx fat-stack@latest uninstall           Remove skills fat-stack installed.')
  log('  npx fat-stack@latest --version           Print version.')
  log('  npx fat-stack@latest --help              Print this help.')
  log()
  log(`Config reference: ${INIT_CONFIG_DOC}`)
}

// ─── entry ─────────────────────────────────────────────────────
const main = async () => {
  const argv = process.argv.slice(2)
  const cmd = argv[0]

  if (cmd === 'uninstall') return runUninstall()
  if (cmd === '--version' || cmd === '-v') return log(PKG.version)
  if (cmd === '--help' || cmd === '-h' || cmd === 'help') return runHelp()

  const rest = cmd === 'init' ? argv.slice(1) : argv
  const { agentMode, flags } = parseFlags(rest)

  if (agentMode) {
    if (Object.keys(flags).length === 0) return printAgentGuide()
    return runInit(flags)
  }
  return runInteractive()
}

main().catch((err) => fail(err?.message ?? String(err)))
