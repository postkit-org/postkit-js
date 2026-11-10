import { readFileSync } from 'node:fs';
import { parseArgs, type ParseArgsConfig } from 'node:util';

import {
  postkitAdd,
  postkitDiff,
  postkitEject,
  postkitManifest,
  postkitNew,
  type PostkitCliIo,
} from './commands.js';
import { PostkitCliError } from './names.js';

const usage = `Usage: postkit <command> [options]

Commands:
  add <kit|component>      Enable a kit or built-in component in your createPostkit config
  eject <component>        Copy a view (and its Chakra recipe) into your repo to own it
  diff [component]         Show what upstream changed since you ejected
  new <component>          Scaffold a component of your own (definition, views, styles)
  manifest                 Write the v2 manifest of your configured set

Options for every command:
  --config <file>          The createPostkit config (default: postkit.config.{ts,mts,js,mjs},
                           else the one file that calls createPostkit)
  -h, --help               Show help for a command

Run postkit <command> --help for a command's options.`;

const commandHelp: Record<string, string> = {
  add: `Usage: postkit add <kit|component> [--config <file>] [--dry-run]

Adds a kit (article, technical, media, discovery, engagement, publishing) to
kits, or a built-in component to components (or takes it out of exclude). When
the config can't be found or edited safely, prints the lines to add instead.`,
  eject: `Usage: postkit eject <component> [--renderer chakra|headless] [--to <dir>]
                     [--config <file>] [--dry-run] [--force] [--no-register]

Copies the renderer's view (and recipe, for chakra) to <dir>/<component>/,
records it in .postkit-eject.json and sets overrides.<Component>.view in your
createPostkit config. The definition stays in @postkit/core.

  --renderer     chakra or headless (default: from the config's renderer)
  --to           Where the folder goes (default: src/postkit)
  --dry-run      Show the files and config change without writing them
  --force        Overwrite files that already exist
  --no-register  Don't edit the createPostkit config`,
  diff: `Usage: postkit diff [component] [--accept] [--exit-code]

Prints a unified diff of what upstream changed between the version a copy was
ejected from and the installed version. Your copy isn't changed.

  --accept       Record the installed version as the new base, once you've
                 brought the changes you want across
  --exit-code    Exit with 1 when upstream changed`,
  new: `Usage: postkit new <component> [--to <dir>] [--chakra] [--spec]
                   [--category <id>] [--directive <name>] [--description <text>]
                   [--import-extension js|none] [--dry-run] [--force]

Scaffolds <dir>/<component>/ with a definition (definePostkitComponent), a
headless view and its CSS; --chakra adds a Chakra view and recipe, --spec a
spec per view. Prints how to register it with createPostkit({ components }).

  --to                Where the folder goes (default: src/postkit)
  --category          article-structure (default), technical-content, media,
                      discovery, engagement or publishing
  --directive         The Markdown directive (default: postkit-<component>)
  --import-extension  js for Node's nodenext resolution (default: none)`,
  manifest: `Usage: postkit manifest [--config <file>] [--out <file>]

Loads your config (TypeScript and TSX included) and writes the v2 manifest of
exactly the enabled set to stdout, or to --out.`,
};

const common = {
  config: { type: 'string' },
  help: { type: 'boolean', short: 'h' },
} as const satisfies ParseArgsConfig['options'];

const commandOptions = {
  add: { ...common, 'dry-run': { type: 'boolean' } },
  eject: {
    ...common,
    renderer: { type: 'string' },
    to: { type: 'string' },
    'dry-run': { type: 'boolean' },
    force: { type: 'boolean' },
    register: { type: 'boolean', default: true },
  },
  diff: {
    ...common,
    accept: { type: 'boolean' },
    'exit-code': { type: 'boolean' },
  },
  new: {
    ...common,
    to: { type: 'string' },
    chakra: { type: 'boolean' },
    spec: { type: 'boolean' },
    category: { type: 'string' },
    directive: { type: 'string' },
    description: { type: 'string' },
    'import-extension': { type: 'string' },
    'dry-run': { type: 'boolean' },
    force: { type: 'boolean' },
  },
  manifest: { ...common, out: { type: 'string' } },
} as const satisfies Record<string, ParseArgsConfig['options']>;

function version(): string {
  try {
    return JSON.parse(
      readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
    ).version;
  } catch {
    return 'unknown';
  }
}

/** The default IO: the process's working directory and streams. */
export function processIo(): PostkitCliIo {
  return {
    cwd: process.cwd(),
    stdout: (text) => process.stdout.write(text),
    stderr: (text) => process.stderr.write(text),
  };
}

/**
 * Runs `postkit` with `argv` (without the node and script paths) and returns
 * the exit code. Errors the user can fix print as one line.
 */
export async function runPostkitCli(
  argv: readonly string[],
  io: PostkitCliIo = processIo(),
): Promise<number> {
  const [command, ...rest] = argv;
  if (
    !command ||
    command === '-h' ||
    command === '--help' ||
    command === 'help'
  ) {
    io.stdout(`${usage}\n`);
    return command ? 0 : 1;
  }
  if (command === '-v' || command === '--version') {
    io.stdout(`${version()}\n`);
    return 0;
  }
  if (!Object.hasOwn(commandOptions, command)) {
    io.stderr(`Unknown command "${command}".\n\n${usage}\n`);
    return 1;
  }
  const name = command as keyof typeof commandOptions;
  try {
    const { values, positionals } = parseArgs({
      args: [...rest],
      options: commandOptions[name],
      allowPositionals: true,
      allowNegative: true,
      strict: true,
    });
    const options = values as Record<string, string | boolean | undefined>;
    if (options['help']) {
      io.stdout(`${commandHelp[name]}\n`);
      return 0;
    }
    const [target, ...extra] = positionals;
    if (extra.length > 0) {
      throw new PostkitCliError(`Unexpected arguments: ${extra.join(' ')}.`);
    }
    const needsName = name !== 'diff' && name !== 'manifest';
    if (needsName && !target) {
      throw new PostkitCliError(
        `postkit ${name} needs a name.\n\n${commandHelp[name]}`,
      );
    }
    if (name === 'manifest' && target) {
      throw new PostkitCliError(`postkit manifest takes no name.`);
    }
    const string = (key: string) => options[key] as string | undefined;
    const flag = (key: string) => options[key] as boolean | undefined;
    switch (name) {
      case 'add':
        return postkitAdd(io, {
          name: target as string,
          config: string('config'),
          dryRun: flag('dry-run'),
        });
      case 'eject':
        return postkitEject(io, {
          name: target as string,
          config: string('config'),
          renderer: string('renderer'),
          to: string('to'),
          dryRun: flag('dry-run'),
          force: flag('force'),
          register: flag('register'),
        });
      case 'diff':
        return postkitDiff(io, {
          name: target,
          accept: flag('accept'),
          exitCode: flag('exit-code'),
        });
      case 'new':
        return postkitNew(io, {
          name: target as string,
          config: string('config'),
          to: string('to'),
          chakra: flag('chakra'),
          spec: flag('spec'),
          category: string('category'),
          directive: string('directive'),
          description: string('description'),
          importExtension: string('import-extension'),
          dryRun: flag('dry-run'),
          force: flag('force'),
        });
      case 'manifest':
        return await postkitManifest(io, {
          config: string('config'),
          out: string('out'),
        });
    }
  } catch (error) {
    if (
      error instanceof PostkitCliError ||
      (error instanceof TypeError &&
        (error as { code?: string }).code?.startsWith('ERR_PARSE_ARGS'))
    ) {
      io.stderr(`postkit ${name}: ${error.message}\n`);
      return 1;
    }
    throw error;
  }
}
