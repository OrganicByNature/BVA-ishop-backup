#######
# npm #
#######

# Obliterate package-lock.json
# rm ./package-lock.json

# Create package.json symlink and runs associated npm commands
# possibly use --no-shrinkwrap or --no-package-lock option in the future
if [ -L ./package.json ]
then
  npm prune && npm update && npm install --no-package-lock
else
  rm -rf ./{node_modules/,package.json}
  ln -s ./.build/package.json ./package.json && npm install
fi

# Obliterate package-lock.json again
# rm ./package-lock.json

###############
# gulpfile.js #
###############

# Delete any existing gulfile.js
if [ ! -L ./gulpfile.babel.js ]
then
  rm ./gulpfile.js
fi

# Then create gulpfile.babel.js symlink in project root
if [ ! -L ./gulpfile.babel.js ]
then
  rm ./gulpfile.babel.js
  ln -s ./.build/gulpfile.babel.js ./gulpfile.babel.js
fi

##############
# .gitignore #
##############

# Create .gitignore symlink in project root
if [ ! -L ./.gitignore ]
then
  rm ./.gitignore
  ln -s ./.build/gitignore ./.gitignore
fi

###########
# configs #
###########

# Overwrite existing config files with new ones
cp ./.build/babelrc ./.babelrc
cp ./.build/eslintrc.js ./.eslintrc.js
cp ./.build/stylelintrc ./.stylelintrc
cp ./.build/codeclimate.yml ./.codeclimate.yml

# Delete any old unused configs
rm ./.eslintrc

##########
# README #
##########

# Add updated README if one doesn't exist
if [ ! -e ./README.md ]
then
  cp ./.build/README.md ./README.md
fi

########
# test #
########

rm -rf ./test

# If test/ does exist, delete it
# if [ -d ./test ]
# then
#   rm -rf ./test
# fi

# # then create it and add test/ with symlinks to generic tests
# mkdir ./test ./test/tests ./test/screenshots ./test/mocks ./test/site

# for filename in ./.build/tests/*
# do
#   ln -s $(pwd)/.build/tests/${filename##*/} $(pwd)/test/tests/${filename##*/}
# done

########
# .env #
########

# Create .env file if doesn't exist
if [ ! -e ./.env ]
then
  cat > .env << EOF
API_KEY=xxxxxxxxxx
PASSWORD=xxxxxxxxxx
URL=xxxxxxxxxx.myshopify.com
THEME_ID=xxxxxxxxxx
EOF
fi

################
# .config.json #
################

# Create .config.json file if doesn't exist
if [ ! -e ./.config.json ]
then
  cat > .config.json << EOF
{
  "babel": true,
  "cssnano": false,
  "externalSourcemap": false,
  "rollup": false,
  "stripDebug": false
}
EOF
fi
