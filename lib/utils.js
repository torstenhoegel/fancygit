const commitTypes = [
    { name: 'feat', value: 'feat' },
    { name: 'fix', value: 'fix' },
    { name: 'chore', value: 'chore' },
    { name: 'docs', value: 'docs' },
    { name: 'style', value: 'style' },
    { name: 'refactor', value: 'refactor' }
];

const versionOptions = ['patch', 'minor', 'major', 'prepatch', 'preminor', 'premajor', 'prerelease'];

export { commitTypes, versionOptions };
