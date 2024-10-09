import { input } from '@inquirer/prompts';
import fs from 'fs';
import path from 'path';
import os from 'os';
import chalk from 'chalk';

// Define the paths for local and global config files
const localFormatsFile = path.resolve(process.cwd(), '.cleangit/formats.json');
const globalFormatsFile = path.resolve(os.homedir(), '.cleangit/config/formats.json');

// Determine whether to use the local or global file
function getFormatsFile() {
    return fs.existsSync(localFormatsFile) ? localFormatsFile : globalFormatsFile;
}

// Helper to read formats file
function readFormats() {
    const formatsFile = getFormatsFile();
    if (!fs.existsSync(formatsFile)) {
        return {};
    }
    return JSON.parse(fs.readFileSync(formatsFile, 'utf8') || '{}');
}

// Helper to write formats file
function writeFormats(formats, isGlobal = false) {
    const formatsFile = isGlobal ? globalFormatsFile : localFormatsFile;

    // Ensure the directory exists
    const dirPath = path.dirname(formatsFile);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }

    fs.writeFileSync(formatsFile, JSON.stringify(formats, null, 2));
}

// List available formats
function formatList() {
    const formats = readFormats();

    if (Object.keys(formats).length === 0) {
        console.log(chalk.yellow("No formats available. Use 'cleangit format add <name>' to add a new format."));
        return;
    }

    console.log(chalk.bold("Available Commit Message Formats:"));
    Object.keys(formats).forEach((name) => {
        console.log(chalk.cyan(`- ${name}`));
    });
}

// Add a new commit message format
async function formatAdd(name, isGlobal = false) {
    try {
        const formats = readFormats();

        if (formats[name]) {
            console.log(chalk.red(`Format "${name}" already exists.`));
            return;
        }

        const format = {};

        // Ask user for prefix for each commit type
        const commitTypes = ['feat', 'fix', 'chore', 'docs', 'style', 'refactor', 'test'];
        for (const type of commitTypes) {
            let prefix = await input({
                message: `Enter the prefix for commit type "${type}" (e.g., [${type}], ${type}:, <${type}>):`
            });
            prefix = prefix.trim();  // Remove leading and trailing spaces
            format[type] = prefix;
        }

        formats[name] = format;
        writeFormats(formats, isGlobal);
        console.log(chalk.green(`Format "${name}" added successfully!`));
    } catch (error) {
        if (error.name === 'ExitPromptError') {
            console.log(chalk.bold.red("\nGoodbye my friend 👋"));
        } else {
            console.error(chalk.bold.red(`\nAn unexpected error occurred: ${error.message}`));
        }
    }
}

// Remove a commit message format
async function formatRemove(name, isGlobal = false) {
    try {
        const formats = readFormats();

        if (!formats[name]) {
            console.log(chalk.red(`Format "${name}" does not exist.`));
            return;
        }

        delete formats[name];
        writeFormats(formats, isGlobal);
        console.log(chalk.green(`Format "${name}" removed successfully!`));
    } catch (error) {
        console.error(chalk.bold.red(`\nAn unexpected error occurred: ${error.message}`));
    }
}

// Export a specific format
function formatExport(name) {
    const formats = readFormats();

    if (!formats[name]) {
        console.log(chalk.red(`Format "${name}" does not exist.`));
        return;
    }

    console.log(chalk.bold(`Format "${name}":`));
    console.log(chalk.cyan(JSON.stringify(formats[name], null, 2)));
}

// Export all formats
function formatExportAll() {
    const formats = readFormats();
    if (Object.keys(formats).length === 0) {
        console.log(chalk.yellow("No formats available to export."));
        return;
    }

    console.log(chalk.bold("Available Formats:"));
    Object.entries(formats).forEach(([name, format]) => {
        console.log(chalk.cyan(`- ${name}:`));
        Object.entries(format).forEach(([commitType, prefix]) => {
            console.log(chalk.green(`  ${commitType}: ${prefix}`));
        });
    });
}

export { formatAdd, formatRemove, formatExport, formatExportAll, formatList };
