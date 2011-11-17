Updating ScribeFire for Safari
==============================
1. Run ./build-safari.sh
1. Open Safari
1. Choose Develop > Show Extension Builder
1. Click "+" and then "Add Extension".
1. Choose the ScribeFire.safariextension directory.
1. Click "Build Package".
1. Upload the resulting .safariextz file to http://code.google.com/p/scribefire-chrome/downloads/entry
1. Email safariextupdates@group.apple.com with a list of changes since the previous version and a link to the new version.
1. When they approve, upload the new version to the permanent location (TBD).

Developing ScribeFire for Firefox
==============================
1. Run ./build-safari-testing.sh
1. In the Extension Builder, click "Reload."

Notes About Safari
==================
ScribeFire for Safari does not yet support image uploads because Safari has yet to implement all of the JavaScript File API interfaces.