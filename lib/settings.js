import { confirm, select } from '@inquirer/prompts';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

// Path to settings.json file in .cleangit directory
const settingsFile = path.resolve(process.cwd(), '.cleangit/settings.json');

// Path to formats.json file in .cleangit directory
const formatsFile = path.resolve(process.cwd(), '.cleangit/formats.json');

// Default settings
const defaultSettings = {
    logSettings: false,
    triggerGitAdd: true,
    triggerNpm: true,
    triggerMessageFormatter: true,
    triggerPush: true,
    commitMessageStyle: 'clean' // 'clean', 'compact', 'modern', or custom
};

// Helper to read settings file
function readSettings() {
    if (!fs.existsSync(settingsFile)) {
        return { ...defaultSettings };
    }
    return JSON.parse(fs.readFileSync(settingsFile, 'utf8') || '{}');
}

// Helper to write settings file
function writeSettings(settings) {
    // Ensure the directory exists
    const dirPath = path.dirname(settingsFile);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }

    fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2));
}

// Helper to read formats file
function readFormats() {
    if (!fs.existsSync(formatsFile)) {
        return {};
    }
    return JSON.parse(fs.readFileSync(formatsFile, 'utf8') || '{}');
}

// Get current settings
function getSettings() {
    const settings = readSettings();
    if (settings.logSettings) {
        console.log(chalk.bold("\nCurrent Settings:"));
        console.log(chalk.cyan("---------------------------"));
        console.log(`${chalk.green("Enable logging settings:")} ${settings.logSettings ? chalk.yellow("Enabled") : chalk.red("Disabled")}`);
        console.log(`${chalk.green("Enable Git add feature:")} ${settings.triggerGitAdd ? chalk.yellow("Enabled") : chalk.red("Disabled")}`);
        console.log(`${chalk.green("Enable NPM versioning feature:")} ${settings.triggerNpm ? chalk.yellow("Enabled") : chalk.red("Disabled")}`);
        console.log(`${chalk.green("Enable Commit Message Formatter feature:")} ${settings.triggerMessageFormatter ? chalk.yellow("Enabled") : chalk.red("Disabled")}`);
        console.log(`${chalk.green("Enable Push to Server feature:")} ${settings.triggerPush ? chalk.yellow("Enabled") : chalk.red("Disabled")}`);
        console.log(`${chalk.green("Commit Message Style:")} ${chalk.magenta(settings.commitMessageStyle)}`);
        console.log(chalk.cyan("---------------------------"));
    }
    return settings;
}

// Update settings interactively
async function updateSettings() {
    try {
        const settings = readSettings();
        const formats = readFormats();
        const formatOptions = Object.keys(formats);

        // Prompt user for confirmation of each setting
        const logSettings = await confirm({
            message: 'Enable log settings?',
            default: settings.logSettings
        });

        const triggerGitAdd = await confirm({
            message: 'Enable the git add feature?',
            default: settings.triggerGitAdd
        });

        const triggerNpm = await confirm({
            message: 'Enable the npm versioning feature?',
            default: settings.triggerNpm
        });

        const triggerMessageFormatter = await confirm({
            message: 'Enable the commit message formatter feature?',
            default: settings.triggerMessageFormatter
        });

        const triggerPush = await confirm({
            message: 'Enable the push to server feature?',
            default: settings.triggerPush
        });

        // Adding available formats to the selection options
        const commitMessageStyleChoices = [
            ...formatOptions.map((name) => ({ name, value: name })),
            { name: 'clean', value: 'clean' },
            { name: 'compact', value: 'compact' },
            { name: 'modern', value: 'modern' },
        ];

        const commitMessageStyle = await select({
            message: 'Select the default commit message style:',
            choices: commitMessageStyleChoices,
            default: settings.commitMessageStyle
        });

        // Update settings with the new values
        const updatedSettings = {
            logSettings,
            triggerGitAdd,
            triggerNpm,
            triggerMessageFormatter,
            triggerPush,
            commitMessageStyle
        };

        writeSettings(updatedSettings);
        console.log(chalk.green('Settings updated successfully!'));

    } catch (error) {
        if (error.name === 'ExitPromptError') {
            console.log(chalk.bold.red("\nGoodbye my friend 👋"));
        } else {
            console.error(chalk.bold.red(`\nAn unexpected error occurred: ${error.message}`));
        }
    }
}

export { getSettings, updateSettings, writeSettings };
