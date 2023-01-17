Shopify Build Tool
=====================

The gulpfile.js included is intended for use with Shopify theme builds. It also includes the accompanying directory structure used alongside the build tool, as well as a number of blank or very basic `.scss`, `.js`, and `.liquid` files commonly used in a Shopify theme build.

#### Things this build tool includes and/or will do:
- Build a proper directory structure for your theme to be uploaded
- Compile, autoprefix, and minify your .scss to .css (strictly using libsass)
- Concatenate and minify your JavaScript files
- Compile, concatenate, autoprefix, and minify all your vendor JavaScript and .scss/.css into their own vendor.js/vendor.css files
- Inline sourcemaps to both main.js and main.css to help with debugging
- After initial build, will watch your theme files and preforming the necessary tasks on change
- Optionally upload any changed file to a Shopify store of your choosing

## Installation

From the command line run `npm install`. After the installation completes, you'll have access to to all of the gulp tasks.

## Tasks

#### Usage
`gulp [TASK] [OPTIONS...]`

### Available tasks
- `clean`  clears out everything in the deploy/ directory
- `styles`  compiles, autoprefixes, minifies, attaches sourcemap, and renames main.scss manifest located in dev/styles to deploy/assets/main.css.liquid
- `scripts`  concatenates, minifies, attaches sourcemap, and renames every .js file located in dev/scripts to deploy/assets/scripts.js.liquid
- `vendor` compiles, concatenates, autoprefixes, and minifies every .scss file located in vendor/styles and every .js file located in vendor/scripts into deploy/assets/vendor.css and deploy/assets/vendor.js
- `copy`  copies every file in dev/liquid into deploy/ carrying the same directory structure
- `build`  runs and completes `clean` before running `copy` `styles` `scripts` `vendor` and `imagemin` asynchronously
- 

### Available options
`--env [environment name]`, where `[environment name]` is the attribute inside of "./config.js that holds all the relavent data for the store you want to upload to (e.g. api key).
`--bs` spin up browser sync instance for even faster development

### Commonly run tasks
- `gulp build` -rebuilds deploy/ directory with most recent versions of files in dev/
- `gulp --env [environment name]` -cleans, rebuilds, watches theme files, and uploads to [environment name] in config.json



## Project Directory Structure

### images
- Every image that's used in the project should go in this directory
- File names should follow the pattern `[location]-[image_name].[extension]` e.g. `homepage-tile_1.jpg` or `global-logo.png`

### liquid
- This is a parent directory for a number of different files. It follows the same directory structure required for a shopify theme.
- **assets**
  - Place any files you want to end up in `deploy/assets` but don't want or need to be run through some sort of build task e.g. font files
- **config**
  - Theme settings and theme settings scheme i.e. `settings_data.json` and `settings_schema.json`
- **layout**
  - Most commonly `theme.liquid`
- **snippets**
  - Any snippets used in your theme files
- **templates**
  - Any templates used in your theme. The bare minimum is:
  - 404.liquid
  - article.liquid
  - blog.liquid
  - cart.liquid
  - collection.liquid
  - index.liquid
  - page.liquid
  - password.liquid
  - product.liquid
  - search.liquid

### scripts
- JavaScript files that will be concatenated into `main.js`. Preferably, JavaScript is written in [module pattern](https://github.com/BVAccel/Module-Example)

### styles
- **helpers**
  - Tools & Config. - Ideally nothing here should output CSS
- **base**
  - Boilerplate Sheet
- **components**
  - Modules + Objects  Widgets
- **page**
  - Page-specific styles

### vendor
- Any required JavaScript libraries (not including jQuery) or vendor css files that will be concatenated into `vendor.js` and `vendor.css` respectively.
-
