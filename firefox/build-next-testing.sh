rm -rf .xpi_work_dir/
mkdir .xpi_work_dir
chmod -R 0777 scribefire
cp -r scribefire/* .xpi_work_dir/
cp -r ../chrome/scribefire/* .xpi_work_dir/chrome/content/
rm .xpi_work_dir/chrome/content/{background.html,content_helper.js}
cp -r scribefire/* .xpi_work_dir/
cd .xpi_work_dir/
rm -rf `find . -name ".svn"`
rm -rf `find . -name ".DS_Store"`
rm -rf `find . -name "Thumbs.db"`
rm -rf ~/Desktop/scribefire-next.xpi
zip -rq ~/Desktop/scribefire-next.xpi *
cd ..
rm -rf .xpi_work_dir/