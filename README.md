# sheets_map

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).

### How to create libraries

```
npm init
```

add to package.json

```
  "scripts": {
      /// ...
      "build-library": "vue-cli-service build --target lib --name [YOUR_COMPONENT_NAME] ./src/[YOUR_COMPONENT].js",
   }
```

### How to publish

1. Compile:
```
npm run build-library
```

2. Upgrade `"version"` in package.json.

3. Add changes, commit and push.

4. Publish:
```
npm publish
```