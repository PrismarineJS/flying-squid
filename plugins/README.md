## Do you really need to use this folder??

If you know of a plugin on npm or git, simply use in console

```
npm install --save flying-squid-plugin-name
```

Or for a git repository:

```
npm install --save git+https://git@github.com/yourname/repo.git
```

## Using /plugins

Simply create a folder inside of /plugins with the name of your plugin. Inside, do `npm init` and create your index.js!

You need this because npm complains about modules inside of node_modules that are not inside package.json.

**USE THIS SPARINGLY!**

## Contributors

.gitignore ignores everything in this folder except for README.md. Don't worry about removing contents in order to push!