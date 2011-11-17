cd scribefire/
rm ../scribefire-locales.zip
zip -rq ../scribefire-locales.zip *
cd ..
curl -F "package=@scribefire-locales.zip" -F "api_key=INTERPIT_KEY_HERE" "http://interpr.it/api/upload"
rm scribefire-locales.zip
mkdir .tmp
curl -o ".locales.zip" "http://interpr.it/api/download?extension_id=2"
mv .locales.zip .tmp/
cd .tmp/
unzip .locales.zip
rm .locales.zip
cp -r * ../scribefire/_locales/
cd ..
rm -rf .tmp/