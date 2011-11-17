Developing ScribeFire
=====================
ScribeFire for Chrome, Firefox, Safari, and Opera uses the same base code for all four browsers. This base is found in chrome/scribefire/.  The build scripts for each browser copy the base code, add/remove any browser-specific files, and package ScribeFire for that browser.  Specific instructions on build for each browser are found in the browser subdirectories.

Localization
============
Locales are managed on http://interpr.it/  Currently, only Chrome and Firefox are able to utilize more than the default en_US locale.  A script for automatically syncing locales is found in this directory (update-locales-sample.sh); you will have to copy it to update-locales.sh and insert the proper API key.