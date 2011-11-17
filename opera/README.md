Updating ScribeFire for Opera
==============================
1. Log into your Opera Addons developer dashboard: https://addons.opera.com/en/developer/
1. Click "Upgrade" next to ScribeFire.
1. Select the previous version and check the "Copy information" checkbox.
1. Click "Update File" in the "Upload" section.
1. Click "Save and Continue"
1. When prompted, run ./build-opera.sh and upload the resulting .oex file.
1. Continue as prompted.

Developing ScribeFire for Opera
===============================
1. Open Opera
1. Go to Tools > Extensions > Manage Extensions
1. Run ./build-opera-testing.sh
1. Drag ./scribefire-build/config.xml onto the Extension Management page
1. After you make any changes in ../chrome/scribefire/ or ./scribefire/, run ./build-opera-testing.sh and click "Reload" on the Extension Management page.