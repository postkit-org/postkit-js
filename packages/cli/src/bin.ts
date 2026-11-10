#!/usr/bin/env node
import { runPostkitCli } from './lib/cli.js';

process.exitCode = await runPostkitCli(process.argv.slice(2));
