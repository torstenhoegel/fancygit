#!/usr/bin/env node

import { program } from 'commander';
import { commit } from '../lib/commit.js';
import { formatAdd, formatRemove, formatExport, formatExportAll, formatList } from '../lib/format.js';
import { getSettings, updateSettings } from '../lib/settings.js';
import { init } from '../lib/init.js';

// Define CLI commands
program
    .name('fancygit')
    .description('A clean and structured way to make git commits and more')
    .version('1.0.0');

// Commit command
program
    .command('run [path]')
    .description('Run a clean commit')
    .option('-n, --npm', 'Skip npm version bumping', false)
    .option('-m, --msg', 'Skip message formatting', false)
    .action((path = '.', options) => {
        commit(path, options);
    });

// Define the "format" parent command
const formatCommand = program
    .command('format')
    .description('Manage commit message formats');

// Add subcommands to "format"
formatCommand
    .command('list')
    .description('List all commit message formats')
    .action(() => formatList());

formatCommand
    .command('add <name>')
    .description('Add a commit message format')
    .action((name) => formatAdd(name));

formatCommand
    .command('remove <name>')
    .description('Remove a commit message format')
    .action((name) => formatRemove(name));

formatCommand
    .command('export <name>')
    .description('Export a commit format')
    .action((name) => formatExport(name));

formatCommand
    .command('export-all')
    .description('Export and display all commit message formats')
    .action(() => formatExportAll());

// Define the "settings" parent command
const settingsCommand = program
    .command('settings')
    .description('Get or update CLI settings');

// Add subcommands to "settings"
settingsCommand
    .command('get')
    .description('Get current settings')
    .action(() => getSettings());

settingsCommand
    .command('update')
    .description('Update settings interactively')
    .action(() => updateSettings());

// Define the "init" command
program
    .command('init')
    .description('Initialize .fancygit configuration in the current project')
    .action(() => init());

program.parse(process.argv);
