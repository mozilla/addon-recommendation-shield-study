#Add-on Recommendation
Stand-alone add-on for use in Shield studies.

To build the addon:
`$ jpm xpi`

This will create `@addon-recommendation-0.0.1.xpi`, which you can install in Firefox.

#Optional Prefs
By default the add-on will use a puzzle icon in the url bar to notify clients. This can be changed to box with text by setting the pref (in `about:config`) `extensions.@addon-rec.useTextButton` to `true`.

To change the text of the box (when `extensions.@addon-rec.useTextButton` is `true`), set the pref `extensions.@addon-rec.customButtonText` to the desired text. When this pref is not set, or is the empty string, the default text will be used. 

To change the icon (when `extensions.@addon-rec.useTextButton` is `false` or not set), change the pref `extensions.@addon-rec.customButtonImgURL` to the URL of the desired image. When this pref is not set, or the empty string, the default icon will be used. 