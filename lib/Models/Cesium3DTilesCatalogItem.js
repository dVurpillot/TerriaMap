"use strict";

/*global require*/

var CatalogItem = require("./CatalogItem");
var Cesium3DTileset = require("terriajs-cesium/Source/Scene/Cesium3DTileset");
var combine = require("terriajs-cesium/Source/Core/combine");
var defined = require("terriajs-cesium/Source/Core/defined");
var defineProperties = require("terriajs-cesium/Source/Core/defineProperties");
var inherit = require("../Core/inherit");
var IonResource = require("terriajs-cesium/Source/Core/IonResource");
var proxyCatalogItemUrl = require("./proxyCatalogItemUrl");
var raiseErrorToUser = require("./raiseErrorToUser");
var TerriaError = require("../Core/TerriaError");
var when = require("terriajs-cesium/Source/ThirdParty/when");

const Cesium3DTileStyle = require("terriajs-cesium/Source/Scene/Cesium3DTileStyle");
const clone = require("terriajs-cesium/Source/Core/clone");
const freezeObject = require("terriajs-cesium/Source/Core/freezeObject");
const knockout = require("terriajs-cesium/Source/ThirdParty/knockout");

/**
 * A {@link CatalogItem} that is added to the map as Cesium 3D Tiles.
 *
 * @alias Cesium3DTilesCatalogItem
 * @constructor
 * @extends CatalogItem
 * @abstract
 *
 * @param {Terria} terria The Terria instance.
 */
var Cesium3DTilesCatalogItem = function(terria) {
  CatalogItem.call(this, terria);

  /**
   * Gets or sets additional options to pass to Cesium's Cesium3DTileset constructor.
   * @type {Object}
   */
  this.options = undefined;

  /**
   * Gets or sets the ID of the Cesium Ion asset to access. If this property is set, the {@link Cesium3DTilesCatalogItem#url}
   * property is ignored.
   * @type {Number}
   */
  this.ionAssetId = undefined;

  /**
   * Gets or sets the Cesium Ion access token to use to access the tileset. If not specified, the token specified
   * using the `cesiumIonAccessToken` property in `config.json` is used. This property is ignored if
   * {@link Cesium3DTilesCatalogItem#ionAssetId} is not set.
   * @type {String}
   */
  this.ionAccessToken = undefined;

  /**
   * Gets or sets the Cesium Ion access token to use to access the tileset. If not specified, the default Ion
   * server, `https://api.cesium.com/`, is used. This property is ignored if
   * {@link Cesium3DTilesCatalogItem#ionAssetId} is not set.
   * @type {String}
   */
  this.ionServer = undefined;

  /**
   * The style to use, specified according to the [Cesium 3D Tiles Styling Language](https://github.com/AnalyticalGraphicsInc/3d-tiles/tree/master/specification/Styling).
   * @type {Object}
   */
  this.style = undefined;

  /**
   * The filters to apply to this catalog item.
   */
  this.filters = [];



  this.featureInfoUrlTemplate = undefined;

  this._tileset = undefined;

  knockout.track(this, [
    "options",
    "ionAssetId",
    "ionAccessToken",
    "ionServer",
    "style",
    "filters",
    "featureInfoUrlTemplate"
  ]);

  this._subscriptions = [];

  knockout.defineProperty(this, "_computedStyle", {
    get: function() {
      if (!this.style && (!this.filters || this.filters.length === 0)) {
        return undefined;
      }

      const style = clone(this.style || {});
      if (this.filters) {
        const terms = this.filters.map(filter => {
          const property =
            "${feature['" + filter.property.replace(/'/g, "\\'") + "']}";
          const min =
            defined(filter.minimumShown) &&
            filter.minimumShown > filter.minimumValue
              ? property + " >= " + filter.minimumShown
              : "";
          const max =
            defined(filter.maximumShown) &&
            filter.maximumShown < filter.maximumValue
              ? property + " <= " + filter.maximumShown
              : "";
          return [min, max].filter(x => x.length > 0).join("&&");
        });
        const joined = terms.join("&&");
        if (joined.length > 0) {
          style.show = terms.join("&&");
        } else {
          style.show = undefined;
        }
      }
      return new Cesium3DTileStyle(style);
    }
  });
  
 /**AJOUT**/  
};

inherit(CatalogItem, Cesium3DTilesCatalogItem);

defineProperties(Cesium3DTilesCatalogItem.prototype, {
  /**
   * Gets the type of data item represented by this instance.
   * @memberOf CesiumTerrainCatalogItem.prototype
   * @type {String}
   */
  type: {
    get: function() {
      return "3d-tiles";
    }
  },

  /**
   * Gets a human-readable name for this type of data source, 'Cesium 3D Tiles'.
   * @memberOf CesiumTerrainCatalogItem.prototype
   * @type {String}
   */
  typeName: {
    get: function() {
      return "Cesium 3D Tiles";
    }
  },

  /**
   * Gets a value indicating whether this data source, when enabled, can be reordered with respect to other data sources.
   * Data sources that cannot be reordered are typically displayed above reorderable data sources.
   * @memberOf Cesium3DTilesCatalogItem.prototype
   * @type {Boolean}
   */
  supportsReordering: {
    get: function() {
      return false;
    }
  },

  /**
   * Gets a value indicating whether the opacity of this data source can be changed.
   * @memberOf Cesium3DTilesCatalogItem.prototype
   * @type {Boolean}
   */
  supportsOpacity: {
    get: function() {
      return false;
    }
  },

  /**
   * Returns true if we can zoom to this item. Depends on observable properties, and so updates once loaded.
   * @memberOf Cesium3DTilesCatalogItem.prototype
   * @type {Boolean}
   */
  canZoomTo: {
    get: function() {
      return true;
    }
  },

  /**
   * Gets the set of functions used to update individual properties in {@link CatalogMember#updateFromJson}.
   * When a property name in the returned object literal matches the name of a property on this instance, the value
   * will be called as a function and passed a reference to this instance, a reference to the source JSON object
   * literal, and the name of the property.
   * @memberOf ImageryLayerCatalogItem.prototype
   * @type {Object}
   */
  updaters: {
    get: function() {
      return Cesium3DTilesCatalogItem.defaultUpdaters;
    }
  }
});

Cesium3DTilesCatalogItem.defaultUpdaters = clone(CatalogItem.defaultUpdaters);

Cesium3DTilesCatalogItem.defaultUpdaters.filters = function(
  catalogItem,
  json,
  propertyName
) {
  if (defined(json.filters)) {
    json.filters.forEach(function(filterItem) {
      var existingItem = catalogItem.filters.filter(
        item => item.property === filterItem.property
      )[0];
      if (defined(existingItem)) {
        existingItem.minimumValue = filterItem.minimumValue;
        existingItem.maximumValue = filterItem.maximumValue;
        existingItem.minimumShown = filterItem.minimumShown;
        existingItem.maximumShown = filterItem.maximumShown;
      } else {
        catalogItem.filters.push(filterItem);
        knockout.track(filterItem, [
          "minimumShown",
          "maximumShown",
          "minimumValue",
          "maximumValue"
        ]);
      }
    });
  }
};

freezeObject(Cesium3DTilesCatalogItem.defaultUpdaters);

Cesium3DTilesCatalogItem.prototype._showInCesium = function() {
  if (defined(this._tileset)) {
    this._tileset.show = true;
  }
};

Cesium3DTilesCatalogItem.prototype._hideInCesium = function() {
  if (defined(this._tileset)) {
    this._tileset.show = false;
  }
};

Cesium3DTilesCatalogItem.prototype._showInLeaflet = function() {
  this.isShown = false;
  throw new TerriaError({
    sender: this,
    title: "Not supported in 2D",
    message:
      '"' +
      this.name +
      '" cannot be show in the 2D view.  Switch to 3D and try again.'
  });
};

Cesium3DTilesCatalogItem.prototype._hideInLeaflet = function() {
  // Nothing to be done.
};

Cesium3DTilesCatalogItem.prototype._enableInCesium = function() {
  if (!defined(this._tileset)) {
    let resource = proxyCatalogItemUrl(this, this.url);
    if (defined(this.ionAssetId)) {
      resource = IonResource.fromAssetId(this.ionAssetId, {
        accessToken:
          this.ionAccessToken ||
          this.terria.configParameters.cesiumIonAccessToken,
        server: this.ionServer
      }).otherwise(e => {
        raiseErrorToUser(this.terria, e);
      });
    }

    let options = {
      show: this.isShown,
      url: resource
    };

    if (this.options) {
      options = combine(options, this.options);
    }

    this._tileset = new Cesium3DTileset(options);
    this._tileset._catalogItem = this;

    const style = this._computedStyle;
    if (defined(style)) {
      this._tileset.style = style;
    }

    this._subscriptions.forEach(subscription => subscription.dispose());
    this._subscriptions.length = 0;

    this._subscriptions.push(
      knockout.getObservable(this, "_computedStyle").subscribe(value => {
        this._tileset.style = this._computedStyle;
      })
    );
    this._subscriptions.push(
      knockout.getObservable(this, "_cesiumShadows").subscribe(value => {
        this._tileset.shadows = this._cesiumShadows;
      })
    );
  }
  /**AJOUTE**/

  const primitives = this.terria.cesium.scene.primitives;
  if (!primitives.contains(this._tileset)) {
    primitives.add(this._tileset);
  }
};

Cesium3DTilesCatalogItem.prototype._disableInCesium = function() {
  this._subscriptions.forEach(subscription => subscription.dispose());
  this._subscriptions.length = 0;

  if (defined(this._tileset)) {
    this.terria.cesium.scene.primitives.removeAndDestroy(this._tileset);
    this._tileset = undefined;
  }
};

Cesium3DTilesCatalogItem.prototype._enableInLeaflet = function() {
  // Nothing to be done.
};

Cesium3DTilesCatalogItem.prototype._disableInLeaflet = function() {
  // Nothing to be done.
};

/**
 * Moves the camera so that the item's bounding rectangle is visible.  If {@link CatalogItem#rectangle} is
 * undefined or covers more than about half the world in the longitude direction, or if the data item is not enabled
 * or not shown, this method zooms to the {@link DataSourceCatalogItem#dataSource} instead.  Because the zoom may
 * happen asynchronously (for example, if the item's rectangle is not yet known), this method returns a Promise that
 * resolves when the zoom animation starts.
 * @returns {Promise} A promise that resolves when the zoom animation starts.
 */
Cesium3DTilesCatalogItem.prototype.zoomTo = function() {
  var that = this;
  return when(this.load(), function() {
    if (defined(that.nowViewingCatalogItem)) {
      return that.nowViewingCatalogItem.zoomTo();
    }

    if (defined(that.rectangle)) {
      return CatalogItem.prototype.zoomTo.call(that);
    }

    if (!defined(that._tileset)) {
      return;
    }

    return that.terria.currentViewer.zoomTo(that._tileset);
  });
};

module.exports = Cesium3DTilesCatalogItem;
