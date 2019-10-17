"use strict";

/*global require*/
var createBingBaseMapOptions = require("./createBingBaseMapOptions");
var BaseMapViewModel = require("./BaseMapViewModel");
var WebMapServiceCatalogItem = require("../Models/WebMapServiceCatalogItem");
var OpenStreetMapCatalogItem = require("../Models/OpenStreetMapCatalogItem");

var createGlobalBaseMapOptions = function(terria, bingMapsKey) {
  var result = createBingBaseMapOptions(terria, bingMapsKey);

///////////////////////////////////////////////////////////////////////////////
  var naturalEarthII = new WebMapServiceCatalogItem(terria);
  naturalEarthII.name = "Natural Earth II";
  naturalEarthII.url =
    "http://geoserver.nationalmap.nicta.com.au/imagery/natural-earth-ii/wms";
  naturalEarthII.layers = "natural-earth-ii:NE2_HR_LC_SR_W_DR";
  naturalEarthII.parameters = {
    tiled: true
  };
  naturalEarthII.opacity = 1.0;
  naturalEarthII.isRequiredForRendering = true;

  result.push(
    new BaseMapViewModel({
      image: require("../../wwwroot/images/natural-earth.png"),
      catalogItem: naturalEarthII
    })
  );
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////NEW
var stamen_toner = new OpenStreetMapCatalogItem(terria);
  stamen_toner.name = "Stamen Toner";
  stamen_toner.url = "https://stamen-tiles.a.ssl.fastly.net/toner/";

  stamen_toner.attribution =
    "© Stamen";
  stamen_toner.opacity = 1.0;

  result.push(
    new BaseMapViewModel({
      image: require("../../wwwroot/images/stamen-toner.png"),
      catalogItem: stamen_toner
    })
  );
///////////////////////////////////////////////////////////////////////////////NEW

///////////////////////////////////////////////////////////////////////////////NEW
var stamen_watercolor = new OpenStreetMapCatalogItem(terria);
  stamen_watercolor.name = "Stamen Watercolor";
  stamen_watercolor.url = "https://stamen-tiles.a.ssl.fastly.net/watercolor/";

  stamen_watercolor.attribution =
    "© Stamen";
  stamen_watercolor.opacity = 1.0;

  result.push(
    new BaseMapViewModel({
      image: require("../../wwwroot/images/stamen-watercolor.png"),
      catalogItem: stamen_watercolor
    })
  );
///////////////////////////////////////////////////////////////////////////////NEW
  
  return result;
};

module.exports = createGlobalBaseMapOptions;