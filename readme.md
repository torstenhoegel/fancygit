# FancyGit

A clean and structured way to make git commits.

## Features

- Commit message formatting
- NPM versioning
- Pushing to remote
- Committing staged changes
- Committing untracked files
- Committing uncommitted changes

## Installation

```bash
npm install -g fancygit
```

## Usage

To initialize the fancygit configuration, run the following command:

```bash
fancygit init
```

This will create a .fancygit directory in your project, which will contain the configuration files.

Currently you can create custom formats for your commit messages and activate or deactivate Settings via the settings command.

The list of features will be expanded in the future. *Feel free to contribute!*

### Commit

```bash
fancygit run
```

### Format

```bash
fancygit format add <name>
fancygit format remove <name>
fancygit format export <name>
fancygit format export-all
```

### Settings

```bash
fancygit settings get
fancygit settings update
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request if you have any suggestions or improvements.

## License

This project is licensed under the MIT License.