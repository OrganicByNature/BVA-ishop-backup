# ⚒ Shopify Theme Boilerplate


## Gulpfile
The gulpfile.js included is intended for use with Shopify theme builds.

### What it does:
- Auto update your build files to the most recent version (if all else fails, run `bower update`)
- Build a proper directory structure from `dev/` to `deploy/` for your theme to uploaded or deployed to a Shopify environment
- Compile, autoprefix, and minify your .scss to `bvaccel.css.liquid` with sourcemapping
- Concatenate and minify your JavaScript modules into `bvaccel.js.liquid` with sourcemapping and the option to transpile to ES6 using babel (enable in `.config.json`)
- Compile, concatenate, autoprefix, and minify all your js and css vendor libraries into their own `vendor.js` and `vendor.css` files
- Watch changed theme files in `deploy/` and directly upload or delete them to the theme specified in your `.env` file
- Automatically open your dev environment for you by passing `gulp` the `-o` flag!
- Crawl your .liquid templates, locate `<img>` tags without `alt` attributes and add an `alt` attribute using the file name as the value

### Installation
After copying the files to your new project directory, run `bower install` once and you should be good to go forever. If you *do* happen to run into issues, first try running `bower update`, and if that doesn't work try running `npm install`, and if *that* doesn't work, delete your `.build/` directory and run `bower install`.

### Tasks
**Usage**

`gulp [TASK] [OPTIONS]`

#### Available Tasks
- `alt-tags` -- scan liquid templates and adds `alt` attribute to `<img>` tags without them
- `styles` -- compile, autoprefix, and minify .scss files to `deploy/assets/` with sourcemapping
- `scripts` -- concatenates and minifies JavaScript modules into `bvaccel.js.liquid` with sourcemapping and the option to transpile to ES6 using babel (enable in `.config.json`)
- `vendor` -- compile, concatenate, autoprefix, and minify all your js and css vendor libraries into their own `vendor.js` and `vendor.css` files
- `build` -- runs and completes `clean` before running `copy` `styles` `scripts` `vendor` and `imagemin` asynchronously
- `gulp` -- creates a build and then starts the watcher to upload to the Shopify theme in `.env` (optionally pass `-o` flag to open dev environment in browser)


## `.env` File
This is where the environment variables are stored for uploading directly to a Shopify development theme

```
API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PASSWORD=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
URL=xxxxxxxxx.myshopify.com
THEME_ID=xxxxxxxxx
```

## `dev/` Directory Structure

### icon
Read more about the `icon/` directory here: https://docs.bvaccel.com/technology/technology/sop/svg-icon-store

### liquid
This is a parent directory for a number of different files. It follows the same directory structure required for a shopify theme.

- **assets**
  - Place any files you want to end up in `deploy/assets` here (remember to put images in `dev/images/`)
  - There should be an `images/` sub-directory here where images can be placed into to

- **config**
  - Theme settings and theme settings scheme i.e. `settings_data.json` and `settings_schema.json`
- **layout**
  - Layout files, typically `theme.liquid` and `checkout.liquid`
- **sections**
  - Like snippets, but on steroids
- **snippets**
  - Any snippets used in your layout and template files
- **templates**
  - Templates used in your theme. At a minimum you'll need:
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
- JavaScript modules that get concatenated into `bvaccel.js.liquid`. JavaScript is written using [module pattern](https://github.com/BVAccel/Module-Example)

### styles
- **helpers**
  - Mixins, variables, functions, etc.  --  Ideally nothing here should output CSS
- **base**
  - Global, generic, boilerplate styles and `_shame.scss` where hacks and orphan styles go
- **layout**
  - Contains everything that takes part in laying out the site or application
- **components**
  - Can be anything, as long as they: do one thing and one thing only, are re-usable and re-used across the project, and are independent.
  - e.g. `_buttons.scss`, `_carousel.scss`, `_hero.scss`, `_dropdown.scss`, `_inline-cart.scss`, etc.
- **pages**
  - Page specific styles and overrides for components


### vendor
- Any required JavaScript libraries (not including jQuery) or vendor css files get concatenated into `vendor.js` and `vendor.css`


## `.eslintrc.js`, `.stylelintrc`, and `.codeclimate.yml`
These are configuration files for [stylelint](https://stylelint.io/), [eslint](https://eslint.org/), [CodeClimate](https://codeclimate.com/). While we currently don't use the linting asspect of stylelint and eslint, we do use their some of their rules as the criteria we grade our codebases against on CodeClimate. You can look in the the two .rc files for more detail on what rules exactly are being used.
