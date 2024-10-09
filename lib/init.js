import { confirm } from '@inquirer/prompts';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { getSettings, updateSettings, writeSettings } from './settings.js';
import { formatAdd } from './format.js';

// Define the path for the .cleangit folder
const cleangitDir = path.resolve(process.cwd(), '.cleangit');

// Helper to create the .cleangit directory if it doesn't exist
function createCleangitDirectory() {
    if (!fs.existsSync(cleangitDir)) {
        fs.mkdirSync(cleangitDir, { recursive: true });
        console.log(chalk.green(`Directory ${cleangitDir} created successfully!`));
    } else {
        console.log(chalk.yellow(`Directory ${cleangitDir} already exists.`));
    }
}

// Initialize the .cleangit configuration
async function init() {
    try {
        // Step 1: Create the .cleangit directory
        createCleangitDirectory();

        // Step 2: Ask if the user wants to create a new format
        const createFormat = await confirm({
            message: 'Would you like to create a new commit message format?',
            default: false
        });

        if (createFormat) {
            const formatName = await input({
                message: 'Enter the name of the new format:'
            });
            await formatAdd(formatName);
        }

        // Step 3: Show current settings and ask if the user wants to update
        const settings = getSettings();
        const updateSettingsPrompt = await confirm({
            message: 'Would you like to update the settings?',
            default: false
        });

        if (updateSettingsPrompt) {
            await updateSettings();
        } else {
            writeSettings(settings);
            console.log(chalk.green('Default settings saved successfully!'));
        }

    } catch (error) {
        if (error.name === 'ExitPromptError') {
            console.log(chalk.bold.red("\nGoodbye my friend 👋"));
        } else {
            console.error(chalk.bold.red(`\nAn unexpected error occurred: ${error.message}`));
        }
    }
}

export { init };
