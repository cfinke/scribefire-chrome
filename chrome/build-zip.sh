rm -rf build
mkdir build
cp -r scribefire build/
cd build
rm -rf `find . -name ".svn"`
rm -rf `find . -name ".DS_Store"`
rm scribefire/tests.config.js scribefire/tests.html
rm ~/Desktop/scribefire.zip
cd scribefire
zip -rq ~/Desktop/scribefire.zip *
cd ../../
rm -rf build