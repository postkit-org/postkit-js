import { runNpm } from './release-commands.mjs';

runNpm(['exec', '--', 'nx', 'format:check', '--all']);
runNpm(['run', 'check']);
runNpm(['run', 'catalog:check']);
runNpm(['exec', '--', 'nx', 'run', '@postkit/astro:build-fixture']);
runNpm(['run', 'package:check']);
runNpm(['run', 'consumer:check']);
