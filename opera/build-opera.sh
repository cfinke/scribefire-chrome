rm ~/Desktop/scribefire-testing.oex
rm -rf scribefire-build
mkdir scribefire-build
cp -r scribefire/* scribefire-build/
touch scribefire-build/io.js
touch scribefire-build/messages.js
echo "var SCRIBEFIRE_MESSAGES = " | cat >> scribefire-build/messages.js
cat scribefire-build/_locales/en_US/messages.json >> scribefire-build/messages.js
echo ";" | cat >> scribefire-build/messages.js
rm -rf scribefire-build/_locales/
cp -r scribefire/* scribefire-build/
cd scribefire-build/
rm -rf `find . -name ".svn"`
rm -rf `find . -name ".DS_Store"`
rm -rf `find . -name "Thumbs.db"`
rm content_helper.js tests.config.js tests.html
zip -rq ~/Desktop/scribefire-testing.oex *
cd ../