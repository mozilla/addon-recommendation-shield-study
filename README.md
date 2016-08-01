#Add-on Recommendation
Stand-alone add-on for use in Shield studies.

#To build
`sass data/recommendation/style.scss data/recommendation/style.css --sourcemap=none`
`$ jpm xpi`

This will create `@addon-recommendation-0.0.1.xpi`, which you can install in Firefox.

#To use
With the add-on installed, navigate to any of the domains listed in
in `data/recommendation/localData.json`. Currently recommendations are provided
on Reddit, Wikipedia, and SoundCloud.

# License
This add-on is licensed under the MPLv2. See the `LICENSE` file for details.
