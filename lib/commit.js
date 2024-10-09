import {confirm, input, select} from '@inquirer/prompts';
import ora from 'ora';
import {execSync} from 'child_process';
import fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import {getSettings} from './settings.js';
import {commitTypes, versionOptions} from './utils.js';

// Path to formats.json in .fancygit directory
const formatsFile = path.resolve(process.cwd(), '.fancygit/formats.json');
// Path to defaultFormatter.json in config directory
const defaultFormatterFile = path.resolve('./config/defaultFormatter.json');

// Helper to read default formatter file
function readDefaultFormatter() {
    return JSON.parse(fs.readFileSync(defaultFormatterFile, 'utf8') || '{}');
}

// Helper to read custom formats
function readFormats() {
    if (!fs.existsSync(formatsFile)) {
        return {};
    }
    return JSON.parse(fs.readFileSync(formatsFile, 'utf8') || '{}');
}

// Helper to check if the current directory is a Git repository
function isGitRepository() {
    try {
        execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });
        return true;
    } catch (error) {
        return false;
    }
}

// Helper to check if there are staged changes
function hasStagedChanges() {
    try {
        const statusOutput = execSync('git diff --cached --name-only').toString().trim();
        return statusOutput.length > 0;
    } catch (error) {
        return false;
    }
}

// Helper to check if there are uncommitted changes
function hasUncommittedChanges() {
    try {
        const statusOutput = execSync('git status --porcelain').toString().trim();
        return statusOutput.length > 0;
    } catch (error) {
        return false;
    }
}

// Helper to check if there are commits to push
function hasCommitsToPush() {
    try {
        if (!hasRemote()) {
            return false;
        }
        const statusOutput = execSync('git log origin/$(git branch --show-current)..HEAD --oneline').toString().trim();
        return statusOutput.length > 0;
    } catch (error) {
        return false;
    }
}

// Helper to check if the Git working directory is clean
function isGitWorkingDirectoryClean() {
    try {
        const statusOutput = execSync('git status --porcelain').toString().trim();
        return statusOutput.length === 0;
    } catch (error) {
        return false;
    }
}

// Helper to check if a remote exists
function hasRemote() {
    try {
        const remotes = execSync('git remote').toString().trim();
        return remotes.length > 0;
    } catch (error) {
        return false;
    }
}

// Helper to display project state
function displayProjectState() {
    try {
        const changedFiles = execSync('git status --porcelain').toString().trim()
            .split('\n')
            .filter(line => line.length > 0 && !line.startsWith('??')) // Exclude untracked files
            .join('\n');
        const stagedFiles = execSync('git diff --cached --name-only').toString().trim();
        const hasRemoteRepo = hasRemote();
        let commitsNotPushed = '';

        if (hasRemoteRepo) {
            try {
                commitsNotPushed = execSync('git log origin/$(git branch --show-current)..HEAD --oneline').toString().trim();
            } catch (error) {
                commitsNotPushed = '';
            }
        }

        console.log(chalk.bold("\nProject State:"));
        console.log(chalk.cyan("---------------------------"));

        // Changed Files
        if (changedFiles.length > 0) {
            console.log(`${chalk.green("Changed Files (Not Staged):")}`);
            console.log(changedFiles.split('\n').map(file => `  - ${file}`).join('\n'));
        } else {
            console.log(`${chalk.green("Changed Files (Not Staged):")} ${chalk.yellow("None")}`);
        }

        // Staged Files
        if (stagedFiles.length > 0) {
            console.log(`\n${chalk.green("Staged Files:")}`);
            console.log(stagedFiles.split('\n').map(file => `  - ${file}`).join('\n'));
        } else {
            console.log(`\n${chalk.green("Staged Files:")} ${chalk.yellow("None")}`);
        }

        // Commits Not Pushed
        if (hasRemoteRepo) {
            if (commitsNotPushed.length > 0) {
                console.log(`\n${chalk.green("Commits Not Pushed:")}`);
                console.log(commitsNotPushed.split('\n').map(commit => `  - ${commit}`).join('\n'));
            } else {
                console.log(`\n${chalk.green("Commits Not Pushed:")} ${chalk.yellow("None")}`);
            }
        } else {
            console.log(`\n${chalk.green("Commits Not Pushed:")} ${chalk.yellow("No remote configured")}`);
        }

        console.log(chalk.cyan("---------------------------\n"));
    } catch (error) {
        console.error(chalk.bold.red(`\nFailed to display project state: ${error.message}`));
    }
}

async function commit(path, options = {}) {
    // Check if the current directory is a Git repository
    if (!isGitRepository()) {
        console.log(chalk.bold.red('\nError: Not a git repository. Please initialize a git repository first.'));
        return;
    }

    try {
        // Load settings and set default values
        const settings = getSettings();
        const defaultFormatter = readDefaultFormatter();
        const customFormats = readFormats();

        // Display project state before starting the commit process
        displayProjectState();

        while (true) {
            const spinner = ora('Preparing commit...').start();

            // Step 1: Add specific/all files or no files (only if triggerGitAdd is enabled and there are changed files not staged)
            const changedFiles = execSync('git status --porcelain')
                .toString()
                .trim()
                .split('\n')
                .filter(line => line.length > 0 && !line.startsWith('??')) // Include all tracked changes, exclude untracked files
                .join('\n');

            if (settings.triggerGitAdd && changedFiles.length > 0) {
                spinner.stop();
                const filesChoice = await select({
                    message: 'What files would you like to add?',
                    choices: [
                        {name: 'All files', value: 'All files'},
                        {name: 'Specific files', value: 'Specific files'},
                        {name: 'No files', value: 'No files'}
                    ]
                });
                spinner.start();

                if (filesChoice === 'Specific files') {
                    spinner.stop();
                    const specificFiles = await input({
                        message: 'Enter the files to add (comma separated):'
                    });
                    spinner.start();
                    execSync(`git add ${specificFiles}`);
                } else if (filesChoice === 'All files') {
                    execSync('git add .');
                }
            }

            // Step 2: Check if there are no changes staged and no uncommitted changes
            if (!settings.triggerGitAdd && !hasStagedChanges() && !hasUncommittedChanges()) {
                spinner.stop();
                console.log(chalk.yellow('\nNo changes to commit.'));

                // Prompt to update npm version or push existing commits if there are any
                if (hasCommitsToPush()) {
                    const pushOrUpdate = await select({
                        message: 'There are no changes to commit. What would you like to do?',
                        choices: [
                            {name: 'Push existing commits to remote', value: 'push'},
                            {name: 'Update npm version', value: 'npm'},
                            {name: 'Cancel', value: 'cancel'}
                        ]
                    });

                    if (pushOrUpdate === 'push') {
                        spinner.start('Pushing changes...');
                        const branch = execSync('git branch --show-current').toString().trim();
                        execSync(`git push origin ${branch}`);
                        spinner.succeed('Changes pushed successfully!');
                    } else if (pushOrUpdate === 'npm') {
                        await updateNpmVersion(spinner);
                    }
                } else {
                    const updateNpm = await confirm({
                        message: 'No changes to commit. Would you like to update the npm version?',
                        default: false
                    });

                    if (updateNpm) {
                        await updateNpmVersion(spinner);
                    } else {
                        console.log(chalk.yellow('No action taken. Exiting.'));
                    }
                }
                return;
            }

            // Step 3: Enter commit message (depending on triggerMessageFormatter setting)

            let commitType = '';
            let commitMessage = '';
            let commitDescription = '';

            if (changedFiles.length > 0) {
                if (settings.triggerMessageFormatter) {
                    // Use the commit type and formatting
                    spinner.stop();
                    commitType = await select({
                        message: 'Select the type of commit:',
                        choices: commitTypes.map(type => ({name: type.name, value: type.value}))
                    });
                    spinner.start();

                    spinner.stop();
                    commitMessage = await input({
                        message: 'Enter your commit message:',
                        validate: (input) => input.length > 5 || 'Commit message is too short'
                    });
                    spinner.start();

                    spinner.stop();
                    commitDescription = await input({
                        message: 'Optional commit description (or press Enter to skip):',
                        default: ''
                    });
                    spinner.start();
                } else {
                    // Use a simple input for commit message
                    spinner.stop();
                    commitMessage = await input({
                        message: 'Enter your commit message:',
                        validate: (input) => input.length > 0 || 'Commit message cannot be empty'
                    });
                    spinner.start();
                }
            }

            if (changedFiles.length > 0) {

                // Step 4: Format the commit message based on settings
                let formattedMessage = '';
                const formatterKey = settings.commitMessageStyle || 'clean';

                if (defaultFormatter[formatterKey]) {
                    formattedMessage = defaultFormatter[formatterKey]
                        .replace('[type]', commitType)
                        .replace('[message]', commitMessage)
                        .replace('[description]', commitDescription ? commitDescription : '');
                } else if (customFormats[formatterKey]) {
                    // Custom formats are structured differently - get the prefix for the commit type
                    if (customFormats[formatterKey][commitType]) {
                        const prefix = customFormats[formatterKey][commitType];
                        formattedMessage = `${prefix} ${commitMessage}`;
                        if (commitDescription) {
                            formattedMessage += ` -- ${commitDescription}`;
                        }
                    } else {
                        console.warn(chalk.yellow(`Warning: Commit type "${commitType}" not found in custom format "${formatterKey}". Using "clean" format.`));
                        formattedMessage = defaultFormatter['clean']
                            .replace('[type]', commitType)
                            .replace('[message]', commitMessage)
                            .replace('[description]', commitDescription ? commitDescription : '');
                    }
                } else {
                    console.warn(chalk.yellow(`Warning: Format "${formatterKey}" not found. Using the "clean" format.`));
                    formattedMessage = defaultFormatter['clean']
                        .replace('[type]', commitType)
                        .replace('[message]', commitMessage)
                        .replace('[description]', commitDescription ? commitDescription : '');
                }

                // Step 5: Display an overview (only if triggerMessageFormatter is enabled)
                if (settings.triggerMessageFormatter) {
                    spinner.stop();
                    console.log(chalk.bold.cyan("\nFormatted Commit Message:"));
                    console.log(chalk.magenta(`${formattedMessage}\n`));
                    const confirmCommit = await confirm({
                        message: 'Does the commit look good?'
                    });

                    if (!confirmCommit) {
                        console.log(chalk.yellow('Commit aborted. Let\'s try again...\n'));
                        continue;
                    }
                }

                // Step 6: Create the commit
                if (hasStagedChanges()) {
                    spinner.start('Creating commit...');
                    execSync(`git commit -m "${formattedMessage.trim()}"`);
                    spinner.succeed('Commit created successfully!');
                } else {
                    spinner.stop();
                    console.log(chalk.yellow('\nNo changes staged for commit. Skipping commit step.'));
                }

            }

            // Step 7: (Optional) npm version bump (only if triggerNpm is enabled)
            if (settings.triggerNpm && !options.npm && execSync('test -f package.json && echo "yes" || echo "no"').toString().trim() === 'yes') {
                spinner.stop();
                await updateNpmVersion(spinner);
            }

            // Step 8: Ask to push changes (only if triggerPush is enabled and there's a remote)
            if (settings.triggerPush && hasRemote()) {
                spinner.stop();
                const pushChanges = await confirm({
                    message: 'Would you like to push the changes?',
                    default: true
                });

                if (pushChanges) {
                    spinner.start('Pushing changes...');
                    const branch = execSync('git branch --show-current').toString().trim();
                    execSync(`git push origin ${branch}`);
                    spinner.succeed('Changes pushed successfully!');
                }
            } else {
                if (!hasRemote()) {
                    spinner.succeed('No remote configured. Skipping push.');
                } else {
                    spinner.succeed('Alright, skipping push.');
                }
            }

            break; // Break the loop once commit is confirmed and completed
        }
    } catch (error) {
        if (error.name === 'ExitPromptError') {
            console.log(chalk.bold.red("\nGoodbye my friend 👋"));
        } else {
            console.error(chalk.bold.red(`\nAn unexpected error occurred: ${error.message}`));
        }
    }
}

// Helper function to handle npm version update
async function updateNpmVersion(spinner) {
    try {
        if (!isGitWorkingDirectoryClean()) {
            console.log(chalk.red('Cannot update npm version: Git working directory is not clean. Please commit or stash your changes first.'));
            return;
        }

        const versionUpdate = await confirm({
            message: 'Would you like to update the npm version?',
            default: true
        });

        if (versionUpdate) {
            const versionType = await select({
                message: 'Select the version type:',
                choices: versionOptions.map(option => ({name: option, value: option}))
            });
            spinner.start('Updating npm version...');
            execSync(`npm version ${versionType}`);
            spinner.succeed('NPM version updated successfully!');
        }
    } catch (error) {
        console.error(chalk.bold.red(`\nFailed to update npm version: ${error.message}`));
    }
}

export {commit};
