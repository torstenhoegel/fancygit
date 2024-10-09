# CleanGit

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
npm install -g cleangit
```

## Usage

To initialize the cleangit configuration, run the following command:

```bash
cleangit init
```

This will create a .cleangit directory in your project, which will contain the configuration files.

Currently you can create custom formats for your commit messages and activate or deactivate Settings via the settings command.

The list of features will be expanded in the future. *Feel free to contribute!*

### Commit

```bash
cleangit run
```

### Format

```bash
cleangit format add <name>
cleangit format remove <name>
cleangit format export <name>
cleangit format export-all
```

### Settings

```bash
cleangit settings get
cleangit settings update
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request if you have any suggestions or improvements.

## License

This project is licensed under the MIT License.