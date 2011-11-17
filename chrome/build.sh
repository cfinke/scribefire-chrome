rm -rf build
mkdir build
cp -r scribefire build/
cd build
rm -rf `find . -name ".svn"`
rm -rf `find . -name ".DS_Store"`
cd ..

