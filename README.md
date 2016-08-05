# Add-on Recommendation
Stand-alone add-on for use in Shield studies.

# To build an XPI
```bash
$ npm run build
```

This will create `@addon-recommendation-0.0.*.xpi`, which you can install in Firefox.

Alternatively, use jpm run to have jpm start a new instance of Firefox with add-on loaded:
```bash
$ npm run styles
$ jpm run
```

# To use
With the add-on installed, navigate to any of the domains listed in
in `data/recommendation/localData.json`. 

# License
This add-on is licensed under the MPLv2. See the `LICENSE` file for details.
