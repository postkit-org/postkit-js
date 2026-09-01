import { runNpm } from './release-commands.mjs';

runNpm(['exec', '--', 'nx', 'format:check', '--all']);
runNpm(['run', 'check']);
runNpm(['run', 'types:performance:check']);
runNpm(['run', 'catalog:check']);
runNpm(['run', 'examples:check']);
runNpm(['run', 'docs:check']);
runNpm(['run', 'package:check']);
runNpm(['run', 'consumer:check']);
runNpm(['run', 'yalc:test']);
