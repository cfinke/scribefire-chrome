Updating ScribeFire for Chrome
==============================
1. Log into your Chrome Webstore developer dashboard: https://chrome.google.com/webstore/developer/dashboard
1. Click "Edit" next to ScribeFire.
1. Click "Update File" in the "Upload" section.
1. Optionally run ../update-locales.sh
1. Run ./build-zip.sh and upload the resulting ZIP file.

Developing ScribeFire for Chrome
================================
1. In Chrome, open chrome://extensions
1. Choose "Load unpacked extension..."
1. Select the ./scribefire/ directory.
1. After making changes, reload ScribeFire to test.