Developing ScribeFire
=====================
ScribeFire for Chrome, Firefox, Safari, and Opera uses the same base code for all four browsers. This base is found in chrome/scribefire/.  The build scripts for each browser copy the base code, add/remove any browser-specific files, and package ScribeFire for that browser.  Specific instructions on build for each browser are found in the browser subdirectories.

Localization
============
Locales are managed on http://interpr.it/  Currently, only Chrome and Firefox are able to utilize more than the default en_US locale.  A script for automatically syncing locales is found in this directory (update-locales-sample.sh); you will have to copy it to update-locales.sh and insert the proper API key.

Testing ScribeFire (Basic)
==========================
1. In Chrome, open the tests.html file in the extension's directory. (e.g., chrome-extension://ejcjmdcdolfbijhgipbhgeknknphlbmg/tests.html) This will run the test suite that doesn't interact with blogging services.

Testing ScribeFire (APIs)
=========================
1. Copy tests.config-template.js to tests.config.js
1. Populate the tests.config.js as follows:

    var passwords = {...};

1. where {...} is the value of extensions.scribefire.blogs in localStorage; find this value by clicking on "background.html" on chrome://extensions/ under ScribeFire and then clicking on the "Local Storage" entry in the left sidebar.
1. Open the tests.html file in the extension's directory with the ?filter=publish parameter. (e.g., chrome-extension://ejcjmdcdolfbijhgipbhgeknknphlbmg/tests.html) This will run all of the tests that interact with all of the blogs that you've added to ScribeFire. (Do not add production blogs to your tests.config.js file; only use blogs that can be edited/deleted/modified without any repurcussions.)
1. Not all tests pass; often, this is because of bugs in the blog server's API.  If the first half of each test section passes, you're close enough.