rm -rf ScribeFire.safariextension/*
mkdir ScribeFire.safariextension
cp -r ../chrome/scribefire/* ScribeFire.safariextension/
touch ScribeFire.safariextension/{messages.js,io.js,migrate.js}
echo "var SCRIBEFIRE_MESSAGES = " | cat >> ScribeFire.safariextension/messages.js
cat ScribeFire.safariextension/_locales/en_US/messages.json >> ScribeFire.safariextension/messages.js
echo ";" | cat >> ScribeFire.safariextension/messages.js
rm -rf ScribeFire.safariextension/_locales/
cp -r scribefire/* ScribeFire.safariextension/
cd ScribeFire.safariextension/
rm -rf `find . -name ".svn"`
rm manifest.json content_helper.js tests.config.js tests.html
