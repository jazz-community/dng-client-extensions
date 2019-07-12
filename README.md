# dng-client-extensions
Within this project we develop and share DNG (Doors Next Generation) Client Extensions.

## Overview
Starting in version 4.0.5 of the Requirements Management (RM) application, you can use a new client extension capability to add additional functionality for requirements management.

You can add the extensions to your mini dashboard and remove them as needed. Extensions are authored by using a combination of JavaScript, XML/HTML, and CSS files. The extensions access data within the RM application by using an RM API.
- For details and additional information [Extending the Requirements Management application](https://jazz.net/wiki/bin/view/Main/RMExtensionsMain) on Jazz.net.
- See also the presentation [RM-Client-Extensions.pptx](https://github.com/jazz-community/dng-client-extensions/blob/master/Documents/RM-Client-Extensions.pptx) in the document folder.

## Extension Catalog
Each extension contains a **help** folder providing further information/details about its functionality and usage.

Additional, you find in the root
- [WidgetCatalog.xml](http://jazz-community.org/dng-client-extensions/WidgetCatalog.xml) - the catalog file to be loaded into the Jazz server.
- the other files [RM_API.d.ts](#), [jsconfig.json](#), [package.json](#) are files used for development only.

### Provided Extensions
- **[change-link](http://jazz-community.org/dng-client-extensions/change-link/change-link.xml)** - modifies the link type for selected, or all artifacts within a module or a collection.
- **[set-attrs](http://jazz-community.org/dng-client-extensions/set-attrs/set-attrs)** - extracts data attributes provided in the requirements description and sets the specified attribute.

## Contributing
Please use the [Issue Tracker](https://github.com/jazz-community/dng-client-extensions/issues) of this repository to report issues or suggest enhancements.

For general contribution guidelines, please refer to [CONTRIBUTING.md](https://github.com/jazz-community/dng-client-extensions/blob/master/CONTRIBUTING.md)

## Licensing
Copyright (c) Siemens Schweiz AG. All rights reserved.<br>
Licensed under the [MIT](http://jazz-community.org/dng-client-extensions/LICENSE) License.

The examples are inspired by the examples provided on [jazz.net](https://jazz.net/wiki/bin/view/Main/RMExtensionsMain) and contains [icons published by IBM](https://github.com/jazz-community/dng-client-extensions/blob/master/IBM%20licensed%20material/ibm_licensed_items.md). The usage of these icons is governed by [this license](https://htmlpreview.github.io/?https://github.com/jazz-community/dng-client-extensions/blob/master/IBM%20licensed%20material/ibm_license_en.html).
