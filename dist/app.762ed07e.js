webpackJsonp([0],[
/* 0 */
/***/ (function(module, exports) {

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
// css base code, injected by the css-loader
module.exports = function(useSourceMap) {
	var list = [];

	// return the list of modules as css string
	list.toString = function toString() {
		return this.map(function (item) {
			var content = cssWithMappingToString(item, useSourceMap);
			if(item[2]) {
				return "@media " + item[2] + "{" + content + "}";
			} else {
				return content;
			}
		}).join("");
	};

	// import a list of modules into the list
	list.i = function(modules, mediaQuery) {
		if(typeof modules === "string")
			modules = [[null, modules, ""]];
		var alreadyImportedModules = {};
		for(var i = 0; i < this.length; i++) {
			var id = this[i][0];
			if(typeof id === "number")
				alreadyImportedModules[id] = true;
		}
		for(i = 0; i < modules.length; i++) {
			var item = modules[i];
			// skip already imported module
			// this implementation is not 100% perfect for weird media query combinations
			//  when a module is imported multiple times with different media queries.
			//  I hope this will never occur (Hey this way we have smaller bundles)
			if(typeof item[0] !== "number" || !alreadyImportedModules[item[0]]) {
				if(mediaQuery && !item[2]) {
					item[2] = mediaQuery;
				} else if(mediaQuery) {
					item[2] = "(" + item[2] + ") and (" + mediaQuery + ")";
				}
				list.push(item);
			}
		}
	};
	return list;
};

function cssWithMappingToString(item, useSourceMap) {
	var content = item[1] || '';
	var cssMapping = item[3];
	if (!cssMapping) {
		return content;
	}

	if (useSourceMap && typeof btoa === 'function') {
		var sourceMapping = toComment(cssMapping);
		var sourceURLs = cssMapping.sources.map(function (source) {
			return '/*# sourceURL=' + cssMapping.sourceRoot + source + ' */'
		});

		return [content].concat(sourceURLs).concat([sourceMapping]).join('\n');
	}

	return [content].join('\n');
}

// Adapted from convert-source-map (MIT)
function toComment(sourceMap) {
	// eslint-disable-next-line no-undef
	var base64 = btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap))));
	var data = 'sourceMappingURL=data:application/json;charset=utf-8;base64,' + base64;

	return '/*# ' + data + ' */';
}


/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
  Modified by Evan You @yyx990803
*/

var hasDocument = typeof document !== 'undefined'

if (typeof DEBUG !== 'undefined' && DEBUG) {
  if (!hasDocument) {
    throw new Error(
    'vue-style-loader cannot be used in a non-browser environment. ' +
    "Use { target: 'node' } in your Webpack config to indicate a server-rendering environment."
  ) }
}

var listToStyles = __webpack_require__(16)

/*
type StyleObject = {
  id: number;
  parts: Array<StyleObjectPart>
}

type StyleObjectPart = {
  css: string;
  media: string;
  sourceMap: ?string
}
*/

var stylesInDom = {/*
  [id: number]: {
    id: number,
    refs: number,
    parts: Array<(obj?: StyleObjectPart) => void>
  }
*/}

var head = hasDocument && (document.head || document.getElementsByTagName('head')[0])
var singletonElement = null
var singletonCounter = 0
var isProduction = false
var noop = function () {}

// Force single-tag solution on IE6-9, which has a hard limit on the # of <style>
// tags it will allow on a page
var isOldIE = typeof navigator !== 'undefined' && /msie [6-9]\b/.test(navigator.userAgent.toLowerCase())

module.exports = function (parentId, list, _isProduction) {
  isProduction = _isProduction

  var styles = listToStyles(parentId, list)
  addStylesToDom(styles)

  return function update (newList) {
    var mayRemove = []
    for (var i = 0; i < styles.length; i++) {
      var item = styles[i]
      var domStyle = stylesInDom[item.id]
      domStyle.refs--
      mayRemove.push(domStyle)
    }
    if (newList) {
      styles = listToStyles(parentId, newList)
      addStylesToDom(styles)
    } else {
      styles = []
    }
    for (var i = 0; i < mayRemove.length; i++) {
      var domStyle = mayRemove[i]
      if (domStyle.refs === 0) {
        for (var j = 0; j < domStyle.parts.length; j++) {
          domStyle.parts[j]()
        }
        delete stylesInDom[domStyle.id]
      }
    }
  }
}

function addStylesToDom (styles /* Array<StyleObject> */) {
  for (var i = 0; i < styles.length; i++) {
    var item = styles[i]
    var domStyle = stylesInDom[item.id]
    if (domStyle) {
      domStyle.refs++
      for (var j = 0; j < domStyle.parts.length; j++) {
        domStyle.parts[j](item.parts[j])
      }
      for (; j < item.parts.length; j++) {
        domStyle.parts.push(addStyle(item.parts[j]))
      }
      if (domStyle.parts.length > item.parts.length) {
        domStyle.parts.length = item.parts.length
      }
    } else {
      var parts = []
      for (var j = 0; j < item.parts.length; j++) {
        parts.push(addStyle(item.parts[j]))
      }
      stylesInDom[item.id] = { id: item.id, refs: 1, parts: parts }
    }
  }
}

function createStyleElement () {
  var styleElement = document.createElement('style')
  styleElement.type = 'text/css'
  head.appendChild(styleElement)
  return styleElement
}

function addStyle (obj /* StyleObjectPart */) {
  var update, remove
  var styleElement = document.querySelector('style[data-vue-ssr-id~="' + obj.id + '"]')

  if (styleElement) {
    if (isProduction) {
      // has SSR styles and in production mode.
      // simply do nothing.
      return noop
    } else {
      // has SSR styles but in dev mode.
      // for some reason Chrome can't handle source map in server-rendered
      // style tags - source maps in <style> only works if the style tag is
      // created and inserted dynamically. So we remove the server rendered
      // styles and inject new ones.
      styleElement.parentNode.removeChild(styleElement)
    }
  }

  if (isOldIE) {
    // use singleton mode for IE9.
    var styleIndex = singletonCounter++
    styleElement = singletonElement || (singletonElement = createStyleElement())
    update = applyToSingletonTag.bind(null, styleElement, styleIndex, false)
    remove = applyToSingletonTag.bind(null, styleElement, styleIndex, true)
  } else {
    // use multi-style-tag mode in all other cases
    styleElement = createStyleElement()
    update = applyToTag.bind(null, styleElement)
    remove = function () {
      styleElement.parentNode.removeChild(styleElement)
    }
  }

  update(obj)

  return function updateStyle (newObj /* StyleObjectPart */) {
    if (newObj) {
      if (newObj.css === obj.css &&
          newObj.media === obj.media &&
          newObj.sourceMap === obj.sourceMap) {
        return
      }
      update(obj = newObj)
    } else {
      remove()
    }
  }
}

var replaceText = (function () {
  var textStore = []

  return function (index, replacement) {
    textStore[index] = replacement
    return textStore.filter(Boolean).join('\n')
  }
})()

function applyToSingletonTag (styleElement, index, remove, obj) {
  var css = remove ? '' : obj.css

  if (styleElement.styleSheet) {
    styleElement.styleSheet.cssText = replaceText(index, css)
  } else {
    var cssNode = document.createTextNode(css)
    var childNodes = styleElement.childNodes
    if (childNodes[index]) styleElement.removeChild(childNodes[index])
    if (childNodes.length) {
      styleElement.insertBefore(cssNode, childNodes[index])
    } else {
      styleElement.appendChild(cssNode)
    }
  }
}

function applyToTag (styleElement, obj) {
  var css = obj.css
  var media = obj.media
  var sourceMap = obj.sourceMap

  if (media) {
    styleElement.setAttribute('media', media)
  }

  if (sourceMap) {
    // https://developer.chrome.com/devtools/docs/javascript-debugging
    // this makes source maps inside style tags work properly in Chrome
    css += '\n/*# sourceURL=' + sourceMap.sources[0] + ' */'
    // http://stackoverflow.com/a/26603875
    css += '\n/*# sourceMappingURL=data:application/json;base64,' + btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))) + ' */'
  }

  if (styleElement.styleSheet) {
    styleElement.styleSheet.cssText = css
  } else {
    while (styleElement.firstChild) {
      styleElement.removeChild(styleElement.firstChild)
    }
    styleElement.appendChild(document.createTextNode(css))
  }
}


/***/ }),
/* 2 */
/***/ (function(module, exports) {

/* globals __VUE_SSR_CONTEXT__ */

// IMPORTANT: Do NOT use ES2015 features in this file.
// This module is a runtime utility for cleaner component module output and will
// be included in the final webpack user bundle.

module.exports = function normalizeComponent (
  rawScriptExports,
  compiledTemplate,
  functionalTemplate,
  injectStyles,
  scopeId,
  moduleIdentifier /* server only */
) {
  var esModule
  var scriptExports = rawScriptExports = rawScriptExports || {}

  // ES6 modules interop
  var type = typeof rawScriptExports.default
  if (type === 'object' || type === 'function') {
    esModule = rawScriptExports
    scriptExports = rawScriptExports.default
  }

  // Vue.extend constructor export interop
  var options = typeof scriptExports === 'function'
    ? scriptExports.options
    : scriptExports

  // render functions
  if (compiledTemplate) {
    options.render = compiledTemplate.render
    options.staticRenderFns = compiledTemplate.staticRenderFns
    options._compiled = true
  }

  // functional template
  if (functionalTemplate) {
    options.functional = true
  }

  // scopedId
  if (scopeId) {
    options._scopeId = scopeId
  }

  var hook
  if (moduleIdentifier) { // server build
    hook = function (context) {
      // 2.3 injection
      context =
        context || // cached call
        (this.$vnode && this.$vnode.ssrContext) || // stateful
        (this.parent && this.parent.$vnode && this.parent.$vnode.ssrContext) // functional
      // 2.2 with runInNewContext: true
      if (!context && typeof __VUE_SSR_CONTEXT__ !== 'undefined') {
        context = __VUE_SSR_CONTEXT__
      }
      // inject component styles
      if (injectStyles) {
        injectStyles.call(this, context)
      }
      // register component module identifier for async chunk inferrence
      if (context && context._registeredComponents) {
        context._registeredComponents.add(moduleIdentifier)
      }
    }
    // used by ssr in case component is cached and beforeCreate
    // never gets called
    options._ssrRegister = hook
  } else if (injectStyles) {
    hook = injectStyles
  }

  if (hook) {
    var functional = options.functional
    var existing = functional
      ? options.render
      : options.beforeCreate

    if (!functional) {
      // inject component registration as beforeCreate hook
      options.beforeCreate = existing
        ? [].concat(existing, hook)
        : [hook]
    } else {
      // for template-only hot-reload because in that case the render fn doesn't
      // go through the normalizer
      options._injectStyles = hook
      // register for functioal component in vue file
      options.render = function renderWithStyleInjection (h, context) {
        hook.call(context)
        return existing(h, context)
      }
    }
  }

  return {
    esModule: esModule,
    exports: scriptExports,
    options: options
  }
}


/***/ }),
/* 3 */,
/* 4 */,
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _header = __webpack_require__(17);

var _header2 = _interopRequireDefault(_header);

var _footer = __webpack_require__(21);

var _footer2 = _interopRequireDefault(_footer);

var _todo = __webpack_require__(23);

var _todo2 = _interopRequireDefault(_todo);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = {
  // data () {
  //   return {
  //     msg: 'welcome to vue and webpack'
  //   }
  // }
  components: {
    Header: _header2.default,
    Todo: _todo2.default,
    Footer: _footer2.default
  }
}; //
//
//
//
//
//
//
//
//

/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _items = __webpack_require__(26);

var _items2 = _interopRequireDefault(_items);

var _tabs = __webpack_require__(30);

var _tabs2 = _interopRequireDefault(_tabs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//

var id = 0;
exports.default = {
  data: function data() {
    return {
      todos: [],
      filter: 'all'
    };
  },

  components: {
    Item: _items2.default,
    Tabs: _tabs2.default
  },
  computed: {
    filterTodos: function filterTodos() {
      if (this.filter === 'all') {
        return this.todos;
      }
      var completed = this.filter === 'completed';
      return this.todos.filter(function (todo) {
        return completed === todo.completed;
      });
    }
  },
  methods: {
    addTodo: function addTodo(e) {
      this.todos.unshift({
        id: id++,
        content: e.target.value.trim(),
        completed: false
      });
      e.target.value = '';
    },
    deleteTodo: function deleteTodo(id) {
      this.todos.splice(this.todos.findIndex(function (todo) {
        return todo.id === id;
      }), 1);
    },
    toggleFilter: function toggleFilter(state) {
      this.filter = state;
    },
    clearAllcompleted: function clearAllcompleted() {
      this.todos = this.todos.filter(function (todo) {
        return !todo.completed;
      });
    }
  }
};

/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
//
//
//
//
//
//
//
//
//
//
//

exports.default = {
  props: {
    todo: {
      type: Object,
      required: true
    }
  },
  methods: {
    deleteTodo: function deleteTodo() {
      this.$emit('del', this.todo.id);
    }
  }
};

/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
//
//
//
//
//
//
//
//
//
//
//
//
//
//

exports.default = {
  props: {
    filter: {
      type: String,
      required: true
    },
    todos: {
      type: Array,
      required: true
    }
  },
  data: function data() {
    return {
      states: ['all', 'active', 'completed']
    };
  },

  computed: {
    unFinishedTodoLength: function unFinishedTodoLength() {
      return this.todos.filter(function (todo) {
        return !todo.completed;
      }).length;
    }
  },
  methods: {
    toggleFilter: function toggleFilter(state) {
      this.$emit('toggle', state);
    },
    clearAll: function clearAll() {
      this.$emit('clearAll');
    }
  }
};

/***/ }),
/* 9 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_vue__ = __webpack_require__(3);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__app_vue__ = __webpack_require__(13);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__assets_style_global_styl__ = __webpack_require__(36);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__assets_style_global_styl___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2__assets_style_global_styl__);





const root = document.createElement('div')
document.body.appendChild(root)

new __WEBPACK_IMPORTED_MODULE_0_vue__["default"]({
  render: (h) => h(__WEBPACK_IMPORTED_MODULE_1__app_vue__["default"])
}).$mount(root)

/***/ }),
/* 10 */,
/* 11 */,
/* 12 */,
/* 13 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__babel_loader_node_modules_13_7_0_vue_loader_lib_selector_type_script_index_0_app_vue__ = __webpack_require__(5);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__babel_loader_node_modules_13_7_0_vue_loader_lib_selector_type_script_index_0_app_vue___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0__babel_loader_node_modules_13_7_0_vue_loader_lib_selector_type_script_index_0_app_vue__);
/* unused harmony namespace reexport */
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__node_modules_13_7_0_vue_loader_lib_template_compiler_index_id_data_v_5ef48958_hasScoped_true_buble_transforms_node_modules_13_7_0_vue_loader_lib_selector_type_template_index_0_app_vue__ = __webpack_require__(35);
var disposed = false
function injectStyle (ssrContext) {
  if (disposed) return
  __webpack_require__(14)
}
var normalizeComponent = __webpack_require__(2)
/* script */


/* template */

/* template functional */
var __vue_template_functional__ = false
/* styles */
var __vue_styles__ = injectStyle
/* scopeId */
var __vue_scopeId__ = "data-v-5ef48958"
/* moduleIdentifier (server only) */
var __vue_module_identifier__ = null
var Component = normalizeComponent(
  __WEBPACK_IMPORTED_MODULE_0__babel_loader_node_modules_13_7_0_vue_loader_lib_selector_type_script_index_0_app_vue___default.a,
  __WEBPACK_IMPORTED_MODULE_1__node_modules_13_7_0_vue_loader_lib_template_compiler_index_id_data_v_5ef48958_hasScoped_true_buble_transforms_node_modules_13_7_0_vue_loader_lib_selector_type_template_index_0_app_vue__["a" /* default */],
  __vue_template_functional__,
  __vue_styles__,
  __vue_scopeId__,
  __vue_module_identifier__
)
Component.options.__file = "src/app.vue"

/* hot reload */
if (false) {(function () {
  var hotAPI = require("vue-loader/node_modules/vue-hot-reload-api")
  hotAPI.install(require("vue"), false)
  if (!hotAPI.compatible) return
  module.hot.accept()
  if (!module.hot.data) {
    hotAPI.createRecord("data-v-5ef48958", Component.options)
  } else {
    hotAPI.reload("data-v-5ef48958", Component.options)
  }
  module.hot.dispose(function (data) {
    disposed = true
  })
})()}

/* harmony default export */ __webpack_exports__["default"] = (Component.exports);


/***/ }),
/* 14 */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(15);
if(typeof content === 'string') content = [[module.i, content, '']];
if(content.locals) module.exports = content.locals;
// add the styles to the DOM
var update = __webpack_require__(1)("74b8ae24", content, false);
// Hot Module Replacement
if(false) {
 // When the styles change, update the <style> tags
 if(!content.locals) {
   module.hot.accept("!!../node_modules/.0.28.9@css-loader/index.js!../node_modules/.13.7.0@vue-loader/lib/style-compiler/index.js?{\"vue\":true,\"id\":\"data-v-5ef48958\",\"scoped\":true,\"hasInlineConfig\":false}!../node_modules/.3.0.1@stylus-loader/index.js!../node_modules/.13.7.0@vue-loader/lib/selector.js?type=styles&index=0!./app.vue", function() {
     var newContent = require("!!../node_modules/.0.28.9@css-loader/index.js!../node_modules/.13.7.0@vue-loader/lib/style-compiler/index.js?{\"vue\":true,\"id\":\"data-v-5ef48958\",\"scoped\":true,\"hasInlineConfig\":false}!../node_modules/.3.0.1@stylus-loader/index.js!../node_modules/.13.7.0@vue-loader/lib/selector.js?type=styles&index=0!./app.vue");
     if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
     update(newContent);
   });
 }
 // When the module is disposed, remove the <style> tags
 module.hot.dispose(function() { update(); });
}

/***/ }),
/* 15 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(0)(false);
// imports


// module
exports.push([module.i, "\n#app[data-v-5ef48958] {\n  position: absolute;\n  left: 0;\n  right: 0;\n  top: 0;\n  bottom: 0;\n}\n#cover[data-v-5ef48958] {\n  position: absolute;\n  left: 0;\n  right: 0;\n  top: 0;\n  bottom: 0;\n  background-color: #999;\n  z-index: -1;\n  opacity: 0.2;\n}\n", ""]);

// exports


/***/ }),
/* 16 */
/***/ (function(module, exports) {

/**
 * Translates the list format produced by css-loader into something
 * easier to manipulate.
 */
module.exports = function listToStyles (parentId, list) {
  var styles = []
  var newStyles = {}
  for (var i = 0; i < list.length; i++) {
    var item = list[i]
    var id = item[0]
    var css = item[1]
    var media = item[2]
    var sourceMap = item[3]
    var part = {
      id: parentId + ':' + i,
      css: css,
      media: media,
      sourceMap: sourceMap
    }
    if (!newStyles[id]) {
      styles.push(newStyles[id] = { id: id, parts: [part] })
    } else {
      newStyles[id].parts.push(part)
    }
  }
  return styles
}


/***/ }),
/* 17 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__node_modules_13_7_0_vue_loader_lib_template_compiler_index_id_data_v_5712ee2d_hasScoped_true_buble_transforms_node_modules_13_7_0_vue_loader_lib_selector_type_template_index_0_header_vue__ = __webpack_require__(20);
var disposed = false
function injectStyle (ssrContext) {
  if (disposed) return
  __webpack_require__(18)
}
var normalizeComponent = __webpack_require__(2)
/* script */
var __vue_script__ = null
/* template */

/* template functional */
var __vue_template_functional__ = false
/* styles */
var __vue_styles__ = injectStyle
/* scopeId */
var __vue_scopeId__ = "data-v-5712ee2d"
/* moduleIdentifier (server only) */
var __vue_module_identifier__ = null
var Component = normalizeComponent(
  __vue_script__,
  __WEBPACK_IMPORTED_MODULE_0__node_modules_13_7_0_vue_loader_lib_template_compiler_index_id_data_v_5712ee2d_hasScoped_true_buble_transforms_node_modules_13_7_0_vue_loader_lib_selector_type_template_index_0_header_vue__["a" /* default */],
  __vue_template_functional__,
  __vue_styles__,
  __vue_scopeId__,
  __vue_module_identifier__
)
Component.options.__file = "src/todo/header.vue"

/* hot reload */
if (false) {(function () {
  var hotAPI = require("vue-loader/node_modules/vue-hot-reload-api")
  hotAPI.install(require("vue"), false)
  if (!hotAPI.compatible) return
  module.hot.accept()
  if (!module.hot.data) {
    hotAPI.createRecord("data-v-5712ee2d", Component.options)
  } else {
    hotAPI.reload("data-v-5712ee2d", Component.options)
  }
  module.hot.dispose(function (data) {
    disposed = true
  })
})()}

/* harmony default export */ __webpack_exports__["default"] = (Component.exports);


/***/ }),
/* 18 */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(19);
if(typeof content === 'string') content = [[module.i, content, '']];
if(content.locals) module.exports = content.locals;
// add the styles to the DOM
var update = __webpack_require__(1)("be3fa28a", content, false);
// Hot Module Replacement
if(false) {
 // When the styles change, update the <style> tags
 if(!content.locals) {
   module.hot.accept("!!../../node_modules/.0.28.9@css-loader/index.js!../../node_modules/.13.7.0@vue-loader/lib/style-compiler/index.js?{\"vue\":true,\"id\":\"data-v-5712ee2d\",\"scoped\":true,\"hasInlineConfig\":false}!../../node_modules/.3.0.1@stylus-loader/index.js!../../node_modules/.13.7.0@vue-loader/lib/selector.js?type=styles&index=0!./header.vue", function() {
     var newContent = require("!!../../node_modules/.0.28.9@css-loader/index.js!../../node_modules/.13.7.0@vue-loader/lib/style-compiler/index.js?{\"vue\":true,\"id\":\"data-v-5712ee2d\",\"scoped\":true,\"hasInlineConfig\":false}!../../node_modules/.3.0.1@stylus-loader/index.js!../../node_modules/.13.7.0@vue-loader/lib/selector.js?type=styles&index=0!./header.vue");
     if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
     update(newContent);
   });
 }
 // When the module is disposed, remove the <style> tags
 module.hot.dispose(function() { update(); });
}

/***/ }),
/* 19 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(0)(false);
// imports


// module
exports.push([module.i, "\n.main-header[data-v-5712ee2d] {\n  text-align: center;\n}\n.main-header h1[data-v-5712ee2d] {\n  font-size: 100px;\n  color: rgba(175,47,47,0.4);\n  font-weight: 300;\n  margin: 20px;\n}\n", ""]);

// exports


/***/ }),
/* 20 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
var render = function() {
  var _vm = this
  var _h = _vm.$createElement
  var _c = _vm._self._c || _h
  return _vm._m(0)
}
var staticRenderFns = [
  function() {
    var _vm = this
    var _h = _vm.$createElement
    var _c = _vm._self._c || _h
    return _c("header", { staticClass: "main-header" }, [
      _c("h1", [_vm._v("Todo")])
    ])
  }
]
render._withStripped = true
var esExports = { render: render, staticRenderFns: staticRenderFns }
/* harmony default export */ __webpack_exports__["a"] = (esExports);
if (false) {
  module.hot.accept()
  if (module.hot.data) {
    require("vue-loader/node_modules/vue-hot-reload-api")      .rerender("data-v-5712ee2d", esExports)
  }
}

/***/ }),
/* 21 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

__webpack_require__(22);

exports.default = {
  data: function data() {
    return {
      author: 'Ioodu'
    };
  },
  render: function render() {
    var h = arguments[0];

    return h(
      'footer',
      {
        attrs: { id: 'footer' }
      },
      [h(
        'span',
        null,
        ['Written by ', this.author]
      )]
    );
  }
};

/***/ }),
/* 22 */
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ }),
/* 23 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__babel_loader_node_modules_13_7_0_vue_loader_lib_selector_type_script_index_0_todo_vue__ = __webpack_require__(6);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__babel_loader_node_modules_13_7_0_vue_loader_lib_selector_type_script_index_0_todo_vue___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0__babel_loader_node_modules_13_7_0_vue_loader_lib_selector_type_script_index_0_todo_vue__);
/* harmony namespace reexport (unknown) */ for(var __WEBPACK_IMPORT_KEY__ in __WEBPACK_IMPORTED_MODULE_0__babel_loader_node_modules_13_7_0_vue_loader_lib_selector_type_script_index_0_todo_vue__) if(__WEBPACK_IMPORT_KEY__ !== 'default') (function(key) { __webpack_require__.d(__webpack_exports__, key, function() { return __WEBPACK_IMPORTED_MODULE_0__babel_loader_node_modules_13_7_0_vue_loader_lib_selector_type_script_index_0_todo_vue__[key]; }) }(__WEBPACK_IMPORT_KEY__));
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__node_modules_13_7_0_vue_loader_lib_template_compiler_index_id_data_v_a0859d34_hasScoped_true_buble_transforms_node_modules_13_7_0_vue_loader_lib_selector_type_template_index_0_todo_vue__ = __webpack_require__(34);
var disposed = false
function injectStyle (ssrContext) {
  if (disposed) return
  __webpack_require__(24)
}
var normalizeComponent = __webpack_require__(2)
/* script */


/* template */

/* template functional */
var __vue_template_functional__ = false
/* styles */
var __vue_styles__ = injectStyle
/* scopeId */
var __vue_scopeId__ = "data-v-a0859d34"
/* moduleIdentifier (server only) */
var __vue_module_identifier__ = null
var Component = normalizeComponent(
  __WEBPACK_IMPORTED_MODULE_0__babel_loader_node_modules_13_7_0_vue_loader_lib_selector_type_script_index_0_todo_vue___default.a,
  __WEBPACK_IMPORTED_MODULE_1__node_modules_13_7_0_vue_loader_lib_template_compiler_index_id_data_v_a0859d34_hasScoped_true_buble_transforms_node_modules_13_7_0_vue_loader_lib_selector_type_template_index_0_todo_vue__["a" /* default */],
  __vue_template_functional__,
  __vue_styles__,
  __vue_scopeId__,
  __vue_module_identifier__
)
Component.options.__file = "src/todo/todo.vue"

/* hot reload */
if (false) {(function () {
  var hotAPI = require("vue-loader/node_modules/vue-hot-reload-api")
  hotAPI.install(require("vue"), false)
  if (!hotAPI.compatible) return
  module.hot.accept()
  if (!module.hot.data) {
    hotAPI.createRecord("data-v-a0859d34", Component.options)
  } else {
    hotAPI.reload("data-v-a0859d34", Component.options)
  }
  module.hot.dispose(function (data) {
    disposed = true
  })
})()}

/* harmony default export */ __webpack_exports__["default"] = (Component.exports);


/***/ }),
/* 24 */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(25);
if(typeof content === 'string') content = [[module.i, content, '']];
if(content.locals) module.exports = content.locals;
// add the styles to the DOM
var update = __webpack_require__(1)("0d872236", content, false);
// Hot Module Replacement
if(false) {
 // When the styles change, update the <style> tags
 if(!content.locals) {
   module.hot.accept("!!../../node_modules/.0.28.9@css-loader/index.js!../../node_modules/.13.7.0@vue-loader/lib/style-compiler/index.js?{\"vue\":true,\"id\":\"data-v-a0859d34\",\"scoped\":true,\"hasInlineConfig\":false}!../../node_modules/.3.0.1@stylus-loader/index.js!../../node_modules/.13.7.0@vue-loader/lib/selector.js?type=styles&index=0!./todo.vue", function() {
     var newContent = require("!!../../node_modules/.0.28.9@css-loader/index.js!../../node_modules/.13.7.0@vue-loader/lib/style-compiler/index.js?{\"vue\":true,\"id\":\"data-v-a0859d34\",\"scoped\":true,\"hasInlineConfig\":false}!../../node_modules/.3.0.1@stylus-loader/index.js!../../node_modules/.13.7.0@vue-loader/lib/selector.js?type=styles&index=0!./todo.vue");
     if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
     update(newContent);
   });
 }
 // When the module is disposed, remove the <style> tags
 module.hot.dispose(function() { update(); });
}

/***/ }),
/* 25 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(0)(false);
// imports


// module
exports.push([module.i, "\n.rel-app[data-v-a0859d34] {\n  width: 600px;\n  margin: 0 auto;\n  -webkit-box-shadow: 0 0 5px #666;\n          box-shadow: 0 0 5px #666;\n}\n.add-input[data-v-a0859d34] {\n  position: relative;\n  width: 100%;\n  font-size: 24px;\n  font-family: inherit;\n  font-weight: inherit;\n  line-height: 1.4em;\n  outline: none;\n  color: inherit;\n  padding: 6px;\n  border: 1px solid #999;\n  -webkit-box-shadow: inset 0 -1px 5px 0 rgba(0,0,0,0.5);\n          box-shadow: inset 0 -1px 5px 0 rgba(0,0,0,0.5);\n  -webkit-box-sizing: border-box;\n          box-sizing: border-box;\n  padding: 16px 16px 16px 60px;\n}\n", ""]);

// exports


/***/ }),
/* 26 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__babel_loader_node_modules_13_7_0_vue_loader_lib_selector_type_script_index_0_items_vue__ = __webpack_require__(7);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__babel_loader_node_modules_13_7_0_vue_loader_lib_selector_type_script_index_0_items_vue___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0__babel_loader_node_modules_13_7_0_vue_loader_lib_selector_type_script_index_0_items_vue__);
/* harmony namespace reexport (unknown) */ for(var __WEBPACK_IMPORT_KEY__ in __WEBPACK_IMPORTED_MODULE_0__babel_loader_node_modules_13_7_0_vue_loader_lib_selector_type_script_index_0_items_vue__) if(__WEBPACK_IMPORT_KEY__ !== 'default') (function(key) { __webpack_require__.d(__webpack_exports__, key, function() { return __WEBPACK_IMPORTED_MODULE_0__babel_loader_node_modules_13_7_0_vue_loader_lib_selector_type_script_index_0_items_vue__[key]; }) }(__WEBPACK_IMPORT_KEY__));
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__node_modules_13_7_0_vue_loader_lib_template_compiler_index_id_data_v_258641d0_hasScoped_true_buble_transforms_node_modules_13_7_0_vue_loader_lib_selector_type_template_index_0_items_vue__ = __webpack_require__(29);
var disposed = false
function injectStyle (ssrContext) {
  if (disposed) return
  __webpack_require__(27)
}
var normalizeComponent = __webpack_require__(2)
/* script */


/* template */

/* template functional */
var __vue_template_functional__ = false
/* styles */
var __vue_styles__ = injectStyle
/* scopeId */
var __vue_scopeId__ = "data-v-258641d0"
/* moduleIdentifier (server only) */
var __vue_module_identifier__ = null
var Component = normalizeComponent(
  __WEBPACK_IMPORTED_MODULE_0__babel_loader_node_modules_13_7_0_vue_loader_lib_selector_type_script_index_0_items_vue___default.a,
  __WEBPACK_IMPORTED_MODULE_1__node_modules_13_7_0_vue_loader_lib_template_compiler_index_id_data_v_258641d0_hasScoped_true_buble_transforms_node_modules_13_7_0_vue_loader_lib_selector_type_template_index_0_items_vue__["a" /* default */],
  __vue_template_functional__,
  __vue_styles__,
  __vue_scopeId__,
  __vue_module_identifier__
)
Component.options.__file = "src/todo/items.vue"

/* hot reload */
if (false) {(function () {
  var hotAPI = require("vue-loader/node_modules/vue-hot-reload-api")
  hotAPI.install(require("vue"), false)
  if (!hotAPI.compatible) return
  module.hot.accept()
  if (!module.hot.data) {
    hotAPI.createRecord("data-v-258641d0", Component.options)
  } else {
    hotAPI.reload("data-v-258641d0", Component.options)
  }
  module.hot.dispose(function (data) {
    disposed = true
  })
})()}

/* harmony default export */ __webpack_exports__["default"] = (Component.exports);


/***/ }),
/* 27 */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(28);
if(typeof content === 'string') content = [[module.i, content, '']];
if(content.locals) module.exports = content.locals;
// add the styles to the DOM
var update = __webpack_require__(1)("690d5c52", content, false);
// Hot Module Replacement
if(false) {
 // When the styles change, update the <style> tags
 if(!content.locals) {
   module.hot.accept("!!../../node_modules/.0.28.9@css-loader/index.js!../../node_modules/.13.7.0@vue-loader/lib/style-compiler/index.js?{\"vue\":true,\"id\":\"data-v-258641d0\",\"scoped\":true,\"hasInlineConfig\":false}!../../node_modules/.3.0.1@stylus-loader/index.js!../../node_modules/.13.7.0@vue-loader/lib/selector.js?type=styles&index=0!./items.vue", function() {
     var newContent = require("!!../../node_modules/.0.28.9@css-loader/index.js!../../node_modules/.13.7.0@vue-loader/lib/style-compiler/index.js?{\"vue\":true,\"id\":\"data-v-258641d0\",\"scoped\":true,\"hasInlineConfig\":false}!../../node_modules/.3.0.1@stylus-loader/index.js!../../node_modules/.13.7.0@vue-loader/lib/selector.js?type=styles&index=0!./items.vue");
     if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
     update(newContent);
   });
 }
 // When the module is disposed, remove the <style> tags
 module.hot.dispose(function() { update(); });
}

/***/ }),
/* 28 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(0)(false);
// imports


// module
exports.push([module.i, "\n.todo-item[data-v-258641d0] {\n  position: relative;\n  background: #fff;\n  font-size: 24px;\n  border-bottom: 1px solid rgba(0,0,0,0.06);\n}\n.todo-item:hover .delete[data-v-258641d0]:after {\n  content: 'x';\n}\n.todo-item label[data-v-258641d0] {\n  white-space: pre-line;\n  word-break: break-all;\n  padding: 15px 60px 15px 15px;\n  margin-left: 45px;\n  display: block;\n  line-height: 1.2;\n  -webkit-transition: color 0.4s;\n  transition: color 0.4s;\n}\n.completed label[data-v-258641d0] {\n  color: #d9d9d9;\n  text-decoration: line-through;\n}\n.toggle[data-v-258641d0] {\n  text-align: center;\n  width: 400px;\n  height: 40px;\n  position: absolute;\n  top: 0;\n  bottom: 0;\n  margin: auto 0;\n  border: none;\n  outline: none;\n  -webkit-appearance: none;\n     -moz-appearance: none;\n          appearance: none;\n}\n.delete[data-v-258641d0] {\n  position: absolute;\n  top: 50%;\n  right: 10px;\n}\n", ""]);

// exports


/***/ }),
/* 29 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
var render = function() {
  var _vm = this
  var _h = _vm.$createElement
  var _c = _vm._self._c || _h
  return _c(
    "div",
    { class: ["todo-item", _vm.todo.completed ? "completed" : ""] },
    [
      _c("input", {
        directives: [
          {
            name: "model",
            rawName: "v-model",
            value: _vm.todo.completed,
            expression: "todo.completed"
          }
        ],
        staticClass: "toggle",
        attrs: { type: "checkbox" },
        domProps: {
          checked: Array.isArray(_vm.todo.completed)
            ? _vm._i(_vm.todo.completed, null) > -1
            : _vm.todo.completed
        },
        on: {
          change: function($event) {
            var $$a = _vm.todo.completed,
              $$el = $event.target,
              $$c = $$el.checked ? true : false
            if (Array.isArray($$a)) {
              var $$v = null,
                $$i = _vm._i($$a, $$v)
              if ($$el.checked) {
                $$i < 0 && (_vm.todo.completed = $$a.concat([$$v]))
              } else {
                $$i > -1 &&
                  (_vm.todo.completed = $$a
                    .slice(0, $$i)
                    .concat($$a.slice($$i + 1)))
              }
            } else {
              _vm.$set(_vm.todo, "completed", $$c)
            }
          }
        }
      }),
      _vm._v(" "),
      _c("label", { attrs: { for: "" } }, [_vm._v(_vm._s(_vm.todo.content))]),
      _vm._v(" "),
      _c("button", { staticClass: "delete", on: { click: _vm.deleteTodo } })
    ]
  )
}
var staticRenderFns = []
render._withStripped = true
var esExports = { render: render, staticRenderFns: staticRenderFns }
/* harmony default export */ __webpack_exports__["a"] = (esExports);
if (false) {
  module.hot.accept()
  if (module.hot.data) {
    require("vue-loader/node_modules/vue-hot-reload-api")      .rerender("data-v-258641d0", esExports)
  }
}

/***/ }),
/* 30 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__babel_loader_node_modules_13_7_0_vue_loader_lib_selector_type_script_index_0_tabs_vue__ = __webpack_require__(8);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__babel_loader_node_modules_13_7_0_vue_loader_lib_selector_type_script_index_0_tabs_vue___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0__babel_loader_node_modules_13_7_0_vue_loader_lib_selector_type_script_index_0_tabs_vue__);
/* harmony namespace reexport (unknown) */ for(var __WEBPACK_IMPORT_KEY__ in __WEBPACK_IMPORTED_MODULE_0__babel_loader_node_modules_13_7_0_vue_loader_lib_selector_type_script_index_0_tabs_vue__) if(__WEBPACK_IMPORT_KEY__ !== 'default') (function(key) { __webpack_require__.d(__webpack_exports__, key, function() { return __WEBPACK_IMPORTED_MODULE_0__babel_loader_node_modules_13_7_0_vue_loader_lib_selector_type_script_index_0_tabs_vue__[key]; }) }(__WEBPACK_IMPORT_KEY__));
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__node_modules_13_7_0_vue_loader_lib_template_compiler_index_id_data_v_7016bec4_hasScoped_true_buble_transforms_node_modules_13_7_0_vue_loader_lib_selector_type_template_index_0_tabs_vue__ = __webpack_require__(33);
var disposed = false
function injectStyle (ssrContext) {
  if (disposed) return
  __webpack_require__(31)
}
var normalizeComponent = __webpack_require__(2)
/* script */


/* template */

/* template functional */
var __vue_template_functional__ = false
/* styles */
var __vue_styles__ = injectStyle
/* scopeId */
var __vue_scopeId__ = "data-v-7016bec4"
/* moduleIdentifier (server only) */
var __vue_module_identifier__ = null
var Component = normalizeComponent(
  __WEBPACK_IMPORTED_MODULE_0__babel_loader_node_modules_13_7_0_vue_loader_lib_selector_type_script_index_0_tabs_vue___default.a,
  __WEBPACK_IMPORTED_MODULE_1__node_modules_13_7_0_vue_loader_lib_template_compiler_index_id_data_v_7016bec4_hasScoped_true_buble_transforms_node_modules_13_7_0_vue_loader_lib_selector_type_template_index_0_tabs_vue__["a" /* default */],
  __vue_template_functional__,
  __vue_styles__,
  __vue_scopeId__,
  __vue_module_identifier__
)
Component.options.__file = "src/todo/tabs.vue"

/* hot reload */
if (false) {(function () {
  var hotAPI = require("vue-loader/node_modules/vue-hot-reload-api")
  hotAPI.install(require("vue"), false)
  if (!hotAPI.compatible) return
  module.hot.accept()
  if (!module.hot.data) {
    hotAPI.createRecord("data-v-7016bec4", Component.options)
  } else {
    hotAPI.reload("data-v-7016bec4", Component.options)
  }
  module.hot.dispose(function (data) {
    disposed = true
  })
})()}

/* harmony default export */ __webpack_exports__["default"] = (Component.exports);


/***/ }),
/* 31 */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(32);
if(typeof content === 'string') content = [[module.i, content, '']];
if(content.locals) module.exports = content.locals;
// add the styles to the DOM
var update = __webpack_require__(1)("1f9ba907", content, false);
// Hot Module Replacement
if(false) {
 // When the styles change, update the <style> tags
 if(!content.locals) {
   module.hot.accept("!!../../node_modules/.0.28.9@css-loader/index.js!../../node_modules/.13.7.0@vue-loader/lib/style-compiler/index.js?{\"vue\":true,\"id\":\"data-v-7016bec4\",\"scoped\":true,\"hasInlineConfig\":false}!../../node_modules/.3.0.1@stylus-loader/index.js!../../node_modules/.13.7.0@vue-loader/lib/selector.js?type=styles&index=0!./tabs.vue", function() {
     var newContent = require("!!../../node_modules/.0.28.9@css-loader/index.js!../../node_modules/.13.7.0@vue-loader/lib/style-compiler/index.js?{\"vue\":true,\"id\":\"data-v-7016bec4\",\"scoped\":true,\"hasInlineConfig\":false}!../../node_modules/.3.0.1@stylus-loader/index.js!../../node_modules/.13.7.0@vue-loader/lib/selector.js?type=styles&index=0!./tabs.vue");
     if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
     update(newContent);
   });
 }
 // When the module is disposed, remove the <style> tags
 module.hot.dispose(function() { update(); });
}

/***/ }),
/* 32 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(0)(false);
// imports


// module
exports.push([module.i, "\n.helper[data-v-7016bec4] {\n  font-weight: 100;\n  display: -webkit-box;\n  display: -ms-flexbox;\n  display: flex;\n  -ms-flex-pack: distribute;\n      justify-content: space-around;\n  padding: 5px 0;\n  line-height: 30px;\n  background-color: #fff;\n  font-size: 14px;\n  font-smoothing: antialiased;\n}\n.left[data-v-7016bec4],\n.clear[data-v-7016bec4],\n.tabs[data-v-7016bec4] {\n  padding: 0 10px;\n  -webkit-box-sizing: border-box;\n          box-sizing: border-box;\n}\n.left[data-v-7016bec4],\n.clear[data-v-7016bec4] {\n  width: 150px;\n}\n.left[data-v-7016bec4] {\n  text-align: left;\n}\n.clear[data-v-7016bec4] {\n  text-align: right;\n  cursor: pointer;\n}\n.tabs[data-v-7016bec4] {\n  width: 200px;\n  display: -webkit-box;\n  display: -ms-flexbox;\n  display: flex;\n  -ms-flex-pack: distribute;\n      justify-content: space-around;\n}\n.tabs *[data-v-7016bec4] {\n  display: inline-block;\n  padding: 0 10px;\n  cursor: pointer;\n  border: 1px solid rgba(175,47,47,0);\n}\n.tabs *.actived[data-v-7016bec4] {\n  border-color: rgba(175,47,47,0.4);\n  border-radius: 5px;\n}\n", ""]);

// exports


/***/ }),
/* 33 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
var render = function() {
  var _vm = this
  var _h = _vm.$createElement
  var _c = _vm._self._c || _h
  return _c("div", { staticClass: "helper" }, [
    _c("span", { staticClass: "left" }, [
      _vm._v(_vm._s(_vm.unFinishedTodoLength) + " items left")
    ]),
    _vm._v(" "),
    _c(
      "span",
      { staticClass: "tabs" },
      _vm._l(_vm.states, function(state) {
        return _c(
          "span",
          {
            key: state,
            class: [state, _vm.filter === state ? "actived" : ""],
            on: {
              click: function($event) {
                _vm.toggleFilter(state)
              }
            }
          },
          [_vm._v(_vm._s(state))]
        )
      })
    ),
    _vm._v(" "),
    _c("span", { staticClass: "clear", on: { click: _vm.clearAll } }, [
      _vm._v("Clear All completed")
    ])
  ])
}
var staticRenderFns = []
render._withStripped = true
var esExports = { render: render, staticRenderFns: staticRenderFns }
/* harmony default export */ __webpack_exports__["a"] = (esExports);
if (false) {
  module.hot.accept()
  if (module.hot.data) {
    require("vue-loader/node_modules/vue-hot-reload-api")      .rerender("data-v-7016bec4", esExports)
  }
}

/***/ }),
/* 34 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
var render = function() {
  var _vm = this
  var _h = _vm.$createElement
  var _c = _vm._self._c || _h
  return _c(
    "section",
    { staticClass: "rel-app" },
    [
      _c("input", {
        staticClass: "add-input",
        attrs: {
          type: "text",
          autofocus: "autofocus",
          placeholder: "What's to do next? "
        },
        on: {
          keyup: function($event) {
            if (
              !("button" in $event) &&
              _vm._k($event.keyCode, "enter", 13, $event.key)
            ) {
              return null
            }
            _vm.addTodo($event)
          }
        }
      }),
      _vm._v(" "),
      _vm._l(_vm.filterTodos, function(todo) {
        return _c("item", {
          key: todo.id,
          attrs: { todo: todo },
          on: { del: _vm.deleteTodo }
        })
      }),
      _vm._v(" "),
      _c("Tabs", {
        attrs: { filter: _vm.filter, todos: _vm.todos },
        on: { toggle: _vm.toggleFilter, clearAll: _vm.clearAllcompleted }
      })
    ],
    2
  )
}
var staticRenderFns = []
render._withStripped = true
var esExports = { render: render, staticRenderFns: staticRenderFns }
/* harmony default export */ __webpack_exports__["a"] = (esExports);
if (false) {
  module.hot.accept()
  if (module.hot.data) {
    require("vue-loader/node_modules/vue-hot-reload-api")      .rerender("data-v-a0859d34", esExports)
  }
}

/***/ }),
/* 35 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
var render = function() {
  var _vm = this
  var _h = _vm.$createElement
  var _c = _vm._self._c || _h
  return _c(
    "div",
    { attrs: { id: "app" } },
    [
      _c("div", { attrs: { id: "cover" } }),
      _vm._v(" "),
      _c("Header"),
      _vm._v(" "),
      _c("Todo"),
      _vm._v(" "),
      _c("Footer")
    ],
    1
  )
}
var staticRenderFns = []
render._withStripped = true
var esExports = { render: render, staticRenderFns: staticRenderFns }
/* harmony default export */ __webpack_exports__["a"] = (esExports);
if (false) {
  module.hot.accept()
  if (module.hot.data) {
    require("vue-loader/node_modules/vue-hot-reload-api")      .rerender("data-v-5ef48958", esExports)
  }
}

/***/ }),
/* 36 */
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ })
],[9]);