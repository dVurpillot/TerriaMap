"use strict";

/*global require*/
var BaseMapViewModel = require("./BaseMapViewModel");
var WebMapServiceCatalogItem = require("../Models/WebMapServiceCatalogItem");

var createAustraliaBaseMapOptions = function(terria) {
  var result = [];

  var osm_base = new WebMapServiceCatalogItem(terria);
  osm_base.name = "OpenStreetMap Basic";
  osm_base.url =
    "http://ows.terrestris.de/osm/service?";
  osm_base.layers =
    "OSM-WMS";
  osm_base.parameters = {
    tiled: true
  };
  osm_base.opacity = 1.0;
  osm_base.isRequiredForRendering = true;

  result.push(
    new BaseMapViewModel({
      image: require("../../wwwroot/images/osm.png"),
      catalogItem: osm_base
    })
  );

  return result;
};

module.exports = createAustraliaBaseMapOptions;



