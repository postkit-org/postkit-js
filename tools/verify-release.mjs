import { runNpm } from './release-commands.mjs';

runNpm(['exec', '--', 'nx', 'format:check', '--all']);
runNpm(['run', 'check']);
runNpm(['run', 'catalog:check']);
runNpm(['run', 'examples:check']);
runNpm(['run', 'package:check']);
runNpm(['run', 'consumer:check']);
