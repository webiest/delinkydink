del delinkydink.xpi
del delinkydink.zip
zip -r delinkydink * -x \create_xpi.bat \.svn* \delinkydink@mozilla.doslash.org \*.bak \Thumbs.db
mv delinkydink.zip delinkydink.xpi