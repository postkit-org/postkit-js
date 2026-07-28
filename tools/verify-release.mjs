import { runNpm } from './release-commands.mjs';

runNpm(['exec', '--', 'nx', 'format:check']);
runNpm(['run', 'check']);
runNpm(['exec', '--', 'nx', 'run', '@postkit/astro:build-fixture']);
runNpm(['run', 'package:check']);
runNpm(['run', 'consumer:check']);
