/******/ (function() { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 9662:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var global = __webpack_require__(7854);
var isCallable = __webpack_require__(614);
var tryToString = __webpack_require__(6330);

var TypeError = global.TypeError;

// `Assert: IsCallable(argument) is true`
module.exports = function (argument) {
  if (isCallable(argument)) return argument;
  throw TypeError(tryToString(argument) + ' is not a function');
};


/***/ }),

/***/ 9483:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var global = __webpack_require__(7854);
var isConstructor = __webpack_require__(4411);
var tryToString = __webpack_require__(6330);

var TypeError = global.TypeError;

// `Assert: IsConstructor(argument) is true`
module.exports = function (argument) {
  if (isConstructor(argument)) return argument;
  throw TypeError(tryToString(argument) + ' is not a constructor');
};


/***/ }),

/***/ 6077:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var global = __webpack_require__(7854);
var isCallable = __webpack_require__(614);

var String = global.String;
var TypeError = global.TypeError;

module.exports = function (argument) {
  if (typeof argument == 'object' || isCallable(argument)) return argument;
  throw TypeError("Can't set " + String(argument) + ' as a prototype');
};


/***/ }),

/***/ 1223:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var wellKnownSymbol = __webpack_require__(5112);
var create = __webpack_require__(30);
var definePropertyModule = __webpack_require__(3070);

var UNSCOPABLES = wellKnownSymbol('unscopables');
var ArrayPrototype = Array.prototype;

// Array.prototype[@@unscopables]
// https://tc39.es/ecma262/#sec-array.prototype-@@unscopables
if (ArrayPrototype[UNSCOPABLES] == undefined) {
  definePropertyModule.f(ArrayPrototype, UNSCOPABLES, {
    configurable: true,
    value: create(null)
  });
}

// add a key to Array.prototype[@@unscopables]
module.exports = function (key) {
  ArrayPrototype[UNSCOPABLES][key] = true;
};


/***/ }),

/***/ 1530:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

"use strict";

var charAt = (__webpack_require__(8710).charAt);

// `AdvanceStringIndex` abstract operation
// https://tc39.es/ecma262/#sec-advancestringindex
module.exports = function (S, index, unicode) {
  return index + (unicode ? charAt(S, index).length : 1);
};


/***/ }),

/***/ 5787:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var global = __webpack_require__(7854);
var isPrototypeOf = __webpack_require__(7976);

var TypeError = global.TypeError;

module.exports = function (it, Prototype) {
  if (isPrototypeOf(Prototype, it)) return it;
  throw TypeError('Incorrect invocation');
};


/***/ }),

/***/ 9670:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var global = __webpack_require__(7854);
var isObject = __webpack_require__(111);

var String = global.String;
var TypeError = global.TypeError;

// `Assert: Type(argument) is Object`
module.exports = function (argument) {
  if (isObject(argument)) return argument;
  throw TypeError(String(argument) + ' is not an object');
};


/***/ }),

/***/ 4019:
/***/ (function(module) {

// eslint-disable-next-line es-x/no-typed-arrays -- safe
module.exports = typeof ArrayBuffer != 'undefined' && typeof DataView != 'undefined';


/***/ }),

/***/ 7556:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

// FF26- bug: ArrayBuffers are non-extensible, but Object.isExtensible does not report it
var fails = __webpack_require__(7293);

module.exports = fails(function () {
  if (typeof ArrayBuffer == 'function') {
    var buffer = new ArrayBuffer(8);
    // eslint-disable-next-line es-x/no-object-isextensible, es-x/no-object-defineproperty -- safe
    if (Object.isExtensible(buffer)) Object.defineProperty(buffer, 'a', { value: 8 });
  }
});


/***/ }),

/***/ 260:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

"use strict";

var NATIVE_ARRAY_BUFFER = __webpack_require__(4019);
var DESCRIPTORS = __webpack_require__(9781);
var global = __webpack_require__(7854);
var isCallable = __webpack_require__(614);
var isObject = __webpack_require__(111);
var hasOwn = __webpack_require__(2597);
var classof = __webpack_require__(648);
var tryToString = __webpack_require__(6330);
var createNonEnumerableProperty = __webpack_require__(8880);
var defineBuiltIn = __webpack_require__(8052);
var defineProperty = (__webpack_require__(3070).f);
var isPrototypeOf = __webpack_require__(7976);
var getPrototypeOf = __webpack_require__(9518);
var setPrototypeOf = __webpack_require__(7674);
var wellKnownSymbol = __webpack_require__(5112);
var uid = __webpack_require__(9711);

var Int8Array = global.Int8Array;
var Int8ArrayPrototype = Int8Array && Int8Array.prototype;
var Uint8ClampedArray = global.Uint8ClampedArray;
var Uint8ClampedArrayPrototype = Uint8ClampedArray && Uint8ClampedArray.prototype;
var TypedArray = Int8Array && getPrototypeOf(Int8Array);
var TypedArrayPrototype = Int8ArrayPrototype && getPrototypeOf(Int8ArrayPrototype);
var ObjectPrototype = Object.prototype;
var TypeError = global.TypeError;

var TO_STRING_TAG = wellKnownSymbol('toStringTag');
var TYPED_ARRAY_TAG = uid('TYPED_ARRAY_TAG');
var TYPED_ARRAY_CONSTRUCTOR = uid('TYPED_ARRAY_CONSTRUCTOR');
// Fixing native typed arrays in Opera Presto crashes the browser, see #595
var NATIVE_ARRAY_BUFFER_VIEWS = NATIVE_ARRAY_BUFFER && !!setPrototypeOf && classof(global.opera) !== 'Opera';
var TYPED_ARRAY_TAG_REQUIRED = false;
var NAME, Constructor, Prototype;

var TypedArrayConstructorsList = {
  Int8Array: 1,
  Uint8Array: 1,
  Uint8ClampedArray: 1,
  Int16Array: 2,
  Uint16Array: 2,
  Int32Array: 4,
  Uint32Array: 4,
  Float32Array: 4,
  Float64Array: 8
};

var BigIntArrayConstructorsList = {
  BigInt64Array: 8,
  BigUint64Array: 8
};

var isView = function isView(it) {
  if (!isObject(it)) return false;
  var klass = classof(it);
  return klass === 'DataView'
    || hasOwn(TypedArrayConstructorsList, klass)
    || hasOwn(BigIntArrayConstructorsList, klass);
};

var isTypedArray = function (it) {
  if (!isObject(it)) return false;
  var klass = classof(it);
  return hasOwn(TypedArrayConstructorsList, klass)
    || hasOwn(BigIntArrayConstructorsList, klass);
};

var aTypedArray = function (it) {
  if (isTypedArray(it)) return it;
  throw TypeError('Target is not a typed array');
};

var aTypedArrayConstructor = function (C) {
  if (isCallable(C) && (!setPrototypeOf || isPrototypeOf(TypedArray, C))) return C;
  throw TypeError(tryToString(C) + ' is not a typed array constructor');
};

var exportTypedArrayMethod = function (KEY, property, forced, options) {
  if (!DESCRIPTORS) return;
  if (forced) for (var ARRAY in TypedArrayConstructorsList) {
    var TypedArrayConstructor = global[ARRAY];
    if (TypedArrayConstructor && hasOwn(TypedArrayConstructor.prototype, KEY)) try {
      delete TypedArrayConstructor.prototype[KEY];
    } catch (error) {
      // old WebKit bug - some methods are non-configurable
      try {
        TypedArrayConstructor.prototype[KEY] = property;
      } catch (error2) { /* empty */ }
    }
  }
  if (!TypedArrayPrototype[KEY] || forced) {
    defineBuiltIn(TypedArrayPrototype, KEY, forced ? property
      : NATIVE_ARRAY_BUFFER_VIEWS && Int8ArrayPrototype[KEY] || property, options);
  }
};

var exportTypedArrayStaticMethod = function (KEY, property, forced) {
  var ARRAY, TypedArrayConstructor;
  if (!DESCRIPTORS) return;
  if (setPrototypeOf) {
    if (forced) for (ARRAY in TypedArrayConstructorsList) {
      TypedArrayConstructor = global[ARRAY];
      if (TypedArrayConstructor && hasOwn(TypedArrayConstructor, KEY)) try {
        delete TypedArrayConstructor[KEY];
      } catch (error) { /* empty */ }
    }
    if (!TypedArray[KEY] || forced) {
      // V8 ~ Chrome 49-50 `%TypedArray%` methods are non-writable non-configurable
      try {
        return defineBuiltIn(TypedArray, KEY, forced ? property : NATIVE_ARRAY_BUFFER_VIEWS && TypedArray[KEY] || property);
      } catch (error) { /* empty */ }
    } else return;
  }
  for (ARRAY in TypedArrayConstructorsList) {
    TypedArrayConstructor = global[ARRAY];
    if (TypedArrayConstructor && (!TypedArrayConstructor[KEY] || forced)) {
      defineBuiltIn(TypedArrayConstructor, KEY, property);
    }
  }
};

for (NAME in TypedArrayConstructorsList) {
  Constructor = global[NAME];
  Prototype = Constructor && Constructor.prototype;
  if (Prototype) createNonEnumerableProperty(Prototype, TYPED_ARRAY_CONSTRUCTOR, Constructor);
  else NATIVE_ARRAY_BUFFER_VIEWS = false;
}

for (NAME in BigIntArrayConstructorsList) {
  Constructor = global[NAME];
  Prototype = Constructor && Constructor.prototype;
  if (Prototype) createNonEnumerableProperty(Prototype, TYPED_ARRAY_CONSTRUCTOR, Constructor);
}

// WebKit bug - typed arrays constructors prototype is Object.prototype
if (!NATIVE_ARRAY_BUFFER_VIEWS || !isCallable(TypedArray) || TypedArray === Function.prototype) {
  // eslint-disable-next-line no-shadow -- safe
  TypedArray = function TypedArray() {
    throw TypeError('Incorrect invocation');
  };
  if (NATIVE_ARRAY_BUFFER_VIEWS) for (NAME in TypedArrayConstructorsList) {
    if (global[NAME]) setPrototypeOf(global[NAME], TypedArray);
  }
}

if (!NATIVE_ARRAY_BUFFER_VIEWS || !TypedArrayPrototype || TypedArrayPrototype === ObjectPrototype) {
  TypedArrayPrototype = TypedArray.prototype;
  if (NATIVE_ARRAY_BUFFER_VIEWS) for (NAME in TypedArrayConstructorsList) {
    if (global[NAME]) setPrototypeOf(global[NAME].prototype, TypedArrayPrototype);
  }
}

// WebKit bug - one more object in Uint8ClampedArray prototype chain
if (NATIVE_ARRAY_BUFFER_VIEWS && getPrototypeOf(Uint8ClampedArrayPrototype) !== TypedArrayPrototype) {
  setPrototypeOf(Uint8ClampedArrayPrototype, TypedArrayPrototype);
}

if (DESCRIPTORS && !hasOwn(TypedArrayPrototype, TO_STRING_TAG)) {
  TYPED_ARRAY_TAG_REQUIRED = true;
  defineProperty(TypedArrayPrototype, TO_STRING_TAG, { get: function () {
    return isObject(this) ? this[TYPED_ARRAY_TAG] : undefined;
  } });
  for (NAME in TypedArrayConstructorsList) if (global[NAME]) {
    createNonEnumerableProperty(global[NAME], TYPED_ARRAY_TAG, NAME);
  }
}

module.exports = {
  NATIVE_ARRAY_BUFFER_VIEWS: NATIVE_ARRAY_BUFFER_VIEWS,
  TYPED_ARRAY_CONSTRUCTOR: TYPED_ARRAY_CONSTRUCTOR,
  TYPED_ARRAY_TAG: TYPED_ARRAY_TAG_REQUIRED && TYPED_ARRAY_TAG,
  aTypedArray: aTypedArray,
  aTypedArrayConstructor: aTypedArrayConstructor,
  exportTypedArrayMethod: exportTypedArrayMethod,
  exportTypedArrayStaticMethod: exportTypedArrayStaticMethod,
  isView: isView,
  isTypedArray: isTypedArray,
  TypedArray: TypedArray,
  TypedArrayPrototype: TypedArrayPrototype
};


/***/ }),

/***/ 3331:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

"use strict";

var global = __webpack_require__(7854);
var uncurryThis = __webpack_require__(1702);
var DESCRIPTORS = __webpack_require__(9781);
var NATIVE_ARRAY_BUFFER = __webpack_require__(4019);
var FunctionName = __webpack_require__(6530);
var createNonEnumerableProperty = __webpack_require__(8880);
var defineBuiltIns = __webpack_require__(9190);
var fails = __webpack_require__(7293);
var anInstance = __webpack_require__(5787);
var toIntegerOrInfinity = __webpack_require__(9303);
var toLength = __webpack_require__(7466);
var toIndex = __webpack_require__(7067);
var IEEE754 = __webpack_require__(1179);
var getPrototypeOf = __webpack_require__(9518);
var setPrototypeOf = __webpack_require__(7674);
var getOwnPropertyNames = (__webpack_require__(8006).f);
var defineProperty = (__webpack_require__(3070).f);
var arrayFill = __webpack_require__(1285);
var arraySlice = __webpack_require__(1589);
var setToStringTag = __webpack_require__(8003);
var InternalStateModule = __webpack_require__(9909);

var PROPER_FUNCTION_NAME = FunctionName.PROPER;
var CONFIGURABLE_FUNCTION_NAME = FunctionName.CONFIGURABLE;
var getInternalState = InternalStateModule.get;
var setInternalState = InternalStateModule.set;
var ARRAY_BUFFER = 'ArrayBuffer';
var DATA_VIEW = 'DataView';
var PROTOTYPE = 'prototype';
var WRONG_LENGTH = 'Wrong length';
var WRONG_INDEX = 'Wrong index';
var NativeArrayBuffer = global[ARRAY_BUFFER];
var $ArrayBuffer = NativeArrayBuffer;
var ArrayBufferPrototype = $ArrayBuffer && $ArrayBuffer[PROTOTYPE];
var $DataView = global[DATA_VIEW];
var DataViewPrototype = $DataView && $DataView[PROTOTYPE];
var ObjectPrototype = Object.prototype;
var Array = global.Array;
var RangeError = global.RangeError;
var fill = uncurryThis(arrayFill);
var reverse = uncurryThis([].reverse);

var packIEEE754 = IEEE754.pack;
var unpackIEEE754 = IEEE754.unpack;

var packInt8 = function (number) {
  return [number & 0xFF];
};

var packInt16 = function (number) {
  return [number & 0xFF, number >> 8 & 0xFF];
};

var packInt32 = function (number) {
  return [number & 0xFF, number >> 8 & 0xFF, number >> 16 & 0xFF, number >> 24 & 0xFF];
};

var unpackInt32 = function (buffer) {
  return buffer[3] << 24 | buffer[2] << 16 | buffer[1] << 8 | buffer[0];
};

var packFloat32 = function (number) {
  return packIEEE754(number, 23, 4);
};

var packFloat64 = function (number) {
  return packIEEE754(number, 52, 8);
};

var addGetter = function (Constructor, key) {
  defineProperty(Constructor[PROTOTYPE], key, { get: function () { return getInternalState(this)[key]; } });
};

var get = function (view, count, index, isLittleEndian) {
  var intIndex = toIndex(index);
  var store = getInternalState(view);
  if (intIndex + count > store.byteLength) throw RangeError(WRONG_INDEX);
  var bytes = getInternalState(store.buffer).bytes;
  var start = intIndex + store.byteOffset;
  var pack = arraySlice(bytes, start, start + count);
  return isLittleEndian ? pack : reverse(pack);
};

var set = function (view, count, index, conversion, value, isLittleEndian) {
  var intIndex = toIndex(index);
  var store = getInternalState(view);
  if (intIndex + count > store.byteLength) throw RangeError(WRONG_INDEX);
  var bytes = getInternalState(store.buffer).bytes;
  var start = intIndex + store.byteOffset;
  var pack = conversion(+value);
  for (var i = 0; i < count; i++) bytes[start + i] = pack[isLittleEndian ? i : count - i - 1];
};

if (!NATIVE_ARRAY_BUFFER) {
  $ArrayBuffer = function ArrayBuffer(length) {
    anInstance(this, ArrayBufferPrototype);
    var byteLength = toIndex(length);
    setInternalState(this, {
      bytes: fill(Array(byteLength), 0),
      byteLength: byteLength
    });
    if (!DESCRIPTORS) this.byteLength = byteLength;
  };

  ArrayBufferPrototype = $ArrayBuffer[PROTOTYPE];

  $DataView = function DataView(buffer, byteOffset, byteLength) {
    anInstance(this, DataViewPrototype);
    anInstance(buffer, ArrayBufferPrototype);
    var bufferLength = getInternalState(buffer).byteLength;
    var offset = toIntegerOrInfinity(byteOffset);
    if (offset < 0 || offset > bufferLength) throw RangeError('Wrong offset');
    byteLength = byteLength === undefined ? bufferLength - offset : toLength(byteLength);
    if (offset + byteLength > bufferLength) throw RangeError(WRONG_LENGTH);
    setInternalState(this, {
      buffer: buffer,
      byteLength: byteLength,
      byteOffset: offset
    });
    if (!DESCRIPTORS) {
      this.buffer = buffer;
      this.byteLength = byteLength;
      this.byteOffset = offset;
    }
  };

  DataViewPrototype = $DataView[PROTOTYPE];

  if (DESCRIPTORS) {
    addGetter($ArrayBuffer, 'byteLength');
    addGetter($DataView, 'buffer');
    addGetter($DataView, 'byteLength');
    addGetter($DataView, 'byteOffset');
  }

  defineBuiltIns(DataViewPrototype, {
    getInt8: function getInt8(byteOffset) {
      return get(this, 1, byteOffset)[0] << 24 >> 24;
    },
    getUint8: function getUint8(byteOffset) {
      return get(this, 1, byteOffset)[0];
    },
    getInt16: function getInt16(byteOffset /* , littleEndian */) {
      var bytes = get(this, 2, byteOffset, arguments.length > 1 ? arguments[1] : undefined);
      return (bytes[1] << 8 | bytes[0]) << 16 >> 16;
    },
    getUint16: function getUint16(byteOffset /* , littleEndian */) {
      var bytes = get(this, 2, byteOffset, arguments.length > 1 ? arguments[1] : undefined);
      return bytes[1] << 8 | bytes[0];
    },
    getInt32: function getInt32(byteOffset /* , littleEndian */) {
      return unpackInt32(get(this, 4, byteOffset, arguments.length > 1 ? arguments[1] : undefined));
    },
    getUint32: function getUint32(byteOffset /* , littleEndian */) {
      return unpackInt32(get(this, 4, byteOffset, arguments.length > 1 ? arguments[1] : undefined)) >>> 0;
    },
    getFloat32: function getFloat32(byteOffset /* , littleEndian */) {
      return unpackIEEE754(get(this, 4, byteOffset, arguments.length > 1 ? arguments[1] : undefined), 23);
    },
    getFloat64: function getFloat64(byteOffset /* , littleEndian */) {
      return unpackIEEE754(get(this, 8, byteOffset, arguments.length > 1 ? arguments[1] : undefined), 52);
    },
    setInt8: function setInt8(byteOffset, value) {
      set(this, 1, byteOffset, packInt8, value);
    },
    setUint8: function setUint8(byteOffset, value) {
      set(this, 1, byteOffset, packInt8, value);
    },
    setInt16: function setInt16(byteOffset, value /* , littleEndian */) {
      set(this, 2, byteOffset, packInt16, value, arguments.length > 2 ? arguments[2] : undefined);
    },
    setUint16: function setUint16(byteOffset, value /* , littleEndian */) {
      set(this, 2, byteOffset, packInt16, value, arguments.length > 2 ? arguments[2] : undefined);
    },
    setInt32: function setInt32(byteOffset, value /* , littleEndian */) {
      set(this, 4, byteOffset, packInt32, value, arguments.length > 2 ? arguments[2] : undefined);
    },
    setUint32: function setUint32(byteOffset, value /* , littleEndian */) {
      set(this, 4, byteOffset, packInt32, value, arguments.length > 2 ? arguments[2] : undefined);
    },
    setFloat32: function setFloat32(byteOffset, value /* , littleEndian */) {
      set(this, 4, byteOffset, packFloat32, value, arguments.length > 2 ? arguments[2] : undefined);
    },
    setFloat64: function setFloat64(byteOffset, value /* , littleEndian */) {
      set(this, 8, byteOffset, packFloat64, value, arguments.length > 2 ? arguments[2] : undefined);
    }
  });
} else {
  var INCORRECT_ARRAY_BUFFER_NAME = PROPER_FUNCTION_NAME && NativeArrayBuffer.name !== ARRAY_BUFFER;
  /* eslint-disable no-new -- required for testing */
  if (!fails(function () {
    NativeArrayBuffer(1);
  }) || !fails(function () {
    new NativeArrayBuffer(-1);
  }) || fails(function () {
    new NativeArrayBuffer();
    new NativeArrayBuffer(1.5);
    new NativeArrayBuffer(NaN);
    return INCORRECT_ARRAY_BUFFER_NAME && !CONFIGURABLE_FUNCTION_NAME;
  })) {
  /* eslint-enable no-new -- required for testing */
    $ArrayBuffer = function ArrayBuffer(length) {
      anInstance(this, ArrayBufferPrototype);
      return new NativeArrayBuffer(toIndex(length));
    };

    $ArrayBuffer[PROTOTYPE] = ArrayBufferPrototype;

    for (var keys = getOwnPropertyNames(NativeArrayBuffer), j = 0, key; keys.length > j;) {
      if (!((key = keys[j++]) in $ArrayBuffer)) {
        createNonEnumerableProperty($ArrayBuffer, key, NativeArrayBuffer[key]);
      }
    }

    ArrayBufferPrototype.constructor = $ArrayBuffer;
  } else if (INCORRECT_ARRAY_BUFFER_NAME && CONFIGURABLE_FUNCTION_NAME) {
    createNonEnumerableProperty(NativeArrayBuffer, 'name', ARRAY_BUFFER);
  }

  // WebKit bug - the same parent prototype for typed arrays and data view
  if (setPrototypeOf && getPrototypeOf(DataViewPrototype) !== ObjectPrototype) {
    setPrototypeOf(DataViewPrototype, ObjectPrototype);
  }

  // iOS Safari 7.x bug
  var testView = new $DataView(new $ArrayBuffer(2));
  var $setInt8 = uncurryThis(DataViewPrototype.setInt8);
  testView.setInt8(0, 2147483648);
  testView.setInt8(1, 2147483649);
  if (testView.getInt8(0) || !testView.getInt8(1)) defineBuiltIns(DataViewPrototype, {
    setInt8: function setInt8(byteOffset, value) {
      $setInt8(this, byteOffset, value << 24 >> 24);
    },
    setUint8: function setUint8(byteOffset, value) {
      $setInt8(this, byteOffset, value << 24 >> 24);
    }
  }, { unsafe: true });
}

setToStringTag($ArrayBuffer, ARRAY_BUFFER);
setToStringTag($DataView, DATA_VIEW);

module.exports = {
  ArrayBuffer: $ArrayBuffer,
  DataView: $DataView
};


/***/ }),

/***/ 1048:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

"use strict";

var toObject = __webpack_require__(7908);
var toAbsoluteIndex = __webpack_require__(1400);
var lengthOfArrayLike = __webpack_require__(6244);

var min = Math.min;

// `Array.prototype.copyWithin` method implementation
// https://tc39.es/ecma262/#sec-array.prototype.copywithin
// eslint-disable-next-line es-x/no-array-prototype-copywithin -- safe
module.exports = [].copyWithin || function copyWithin(target /* = 0 */, start /* = 0, end = @length */) {
  var O = toObject(this);
  var len = lengthOfArrayLike(O);
  var to = toAbsoluteIndex(target, len);
  var from = toAbsoluteIndex(start, len);
  var end = arguments.length > 2 ? arguments[2] : undefined;
  var count = min((end === undefined ? len : toAbsoluteIndex(end, len)) - from, len - to);
  var inc = 1;
  if (from < to && to < from + count) {
    inc = -1;
    from += count - 1;
    to += count - 1;
  }
  while (count-- > 0) {
    if (from in O) O[to] = O[from];
    else delete O[to];
    to += inc;
    from += inc;
  } return O;
};


/***/ }),

/***/ 1285:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

"use strict";

var toObject = __webpack_require__(7908);
var toAbsoluteIndex = __webpack_require__(1400);
var lengthOfArrayLike = __webpack_require__(6244);

// `Array.prototype.fill` method implementation
// https://tc39.es/ecma262/#sec-array.prototype.fill
module.exports = function fill(value /* , start = 0, end = @length */) {
  var O = toObject(this);
  var length = lengthOfArrayLike(O);
  var argumentsLength = arguments.length;
  var index = toAbsoluteIndex(argumentsLength > 1 ? arguments[1] : undefined, length);
  var end = argumentsLength > 2 ? arguments[2] : undefined;
  var endPos = end === undefined ? length : toAbsoluteIndex(end, length);
  while (endPos > index) O[index++] = value;
  return O;
};


/***/ }),

/***/ 8533:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

"use strict";

var $forEach = (__webpack_require__(2092).forEach);
var arrayMethodIsStrict = __webpack_require__(9341);

var STRICT_METHOD = arrayMethodIsStrict('forEach');

// `Array.prototype.forEach` method implementation
// https://tc39.es/ecma262/#sec-array.prototype.foreach
module.exports = !STRICT_METHOD ? function forEach(callbackfn /* , thisArg */) {
  return $forEach(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
// eslint-disable-next-line es-x/no-array-prototype-foreach -- safe
} : [].forEach;


/***/ }),

/***/ 7745:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var lengthOfArrayLike = __webpack_require__(6244);

module.exports = function (Constructor, list) {
  var index = 0;
  var length = lengthOfArrayLike(list);
  var result = new Constructor(length);
  while (length > index) result[index] = list[index++];
  return result;
};


/***/ }),

/***/ 1318:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var toIndexedObject = __webpack_require__(5656);
var toAbsoluteIndex = __webpack_require__(1400);
var lengthOfArrayLike = __webpack_require__(6244);

// `Array.prototype.{ indexOf, includes }` methods implementation
var createMethod = function (IS_INCLUDES) {
  return function ($this, el, fromIndex) {
    var O = toIndexedObject($this);
    var length = lengthOfArrayLike(O);
    var index = toAbsoluteIndex(fromIndex, length);
    var value;
    // Array#includes uses SameValueZero equality algorithm
    // eslint-disable-next-line no-self-compare -- NaN check
    if (IS_INCLUDES && el != el) while (length > index) {
      value = O[index++];
      // eslint-disable-next-line no-self-compare -- NaN check
      if (value != value) return true;
    // Array#indexOf ignores holes, Array#includes - not
    } else for (;length > index; index++) {
      if ((IS_INCLUDES || index in O) && O[index] === el) return IS_INCLUDES || index || 0;
    } return !IS_INCLUDES && -1;
  };
};

module.exports = {
  // `Array.prototype.includes` method
  // https://tc39.es/ecma262/#sec-array.prototype.includes
  includes: createMethod(true),
  // `Array.prototype.indexOf` method
  // https://tc39.es/ecma262/#sec-array.prototype.indexof
  indexOf: createMethod(false)
};


/***/ }),

/***/ 2092:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var bind = __webpack_require__(9974);
var uncurryThis = __webpack_require__(1702);
var IndexedObject = __webpack_require__(8361);
var toObject = __webpack_require__(7908);
var lengthOfArrayLike = __webpack_require__(6244);
var arraySpeciesCreate = __webpack_require__(5417);

var push = uncurryThis([].push);

// `Array.prototype.{ forEach, map, filter, some, every, find, findIndex, filterReject }` methods implementation
var createMethod = function (TYPE) {
  var IS_MAP = TYPE == 1;
  var IS_FILTER = TYPE == 2;
  var IS_SOME = TYPE == 3;
  var IS_EVERY = TYPE == 4;
  var IS_FIND_INDEX = TYPE == 6;
  var IS_FILTER_REJECT = TYPE == 7;
  var NO_HOLES = TYPE == 5 || IS_FIND_INDEX;
  return function ($this, callbackfn, that, specificCreate) {
    var O = toObject($this);
    var self = IndexedObject(O);
    var boundFunction = bind(callbackfn, that);
    var length = lengthOfArrayLike(self);
    var index = 0;
    var create = specificCreate || arraySpeciesCreate;
    var target = IS_MAP ? create($this, length) : IS_FILTER || IS_FILTER_REJECT ? create($this, 0) : undefined;
    var value, result;
    for (;length > index; index++) if (NO_HOLES || index in self) {
      value = self[index];
      result = boundFunction(value, index, O);
      if (TYPE) {
        if (IS_MAP) target[index] = result; // map
        else if (result) switch (TYPE) {
          case 3: return true;              // some
          case 5: return value;             // find
          case 6: return index;             // findIndex
          case 2: push(target, value);      // filter
        } else switch (TYPE) {
          case 4: return false;             // every
          case 7: push(target, value);      // filterReject
        }
      }
    }
    return IS_FIND_INDEX ? -1 : IS_SOME || IS_EVERY ? IS_EVERY : target;
  };
};

module.exports = {
  // `Array.prototype.forEach` method
  // https://tc39.es/ecma262/#sec-array.prototype.foreach
  forEach: createMethod(0),
  // `Array.prototype.map` method
  // https://tc39.es/ecma262/#sec-array.prototype.map
  map: createMethod(1),
  // `Array.prototype.filter` method
  // https://tc39.es/ecma262/#sec-array.prototype.filter
  filter: createMethod(2),
  // `Array.prototype.some` method
  // https://tc39.es/ecma262/#sec-array.prototype.some
  some: createMethod(3),
  // `Array.prototype.every` method
  // https://tc39.es/ecma262/#sec-array.prototype.every
  every: createMethod(4),
  // `Array.prototype.find` method
  // https://tc39.es/ecma262/#sec-array.prototype.find
  find: createMethod(5),
  // `Array.prototype.findIndex` method
  // https://tc39.es/ecma262/#sec-array.prototype.findIndex
  findIndex: createMethod(6),
  // `Array.prototype.filterReject` method
  // https://github.com/tc39/proposal-array-filtering
  filterReject: createMethod(7)
};


/***/ }),

/***/ 6583:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

"use strict";

/* eslint-disable es-x/no-array-prototype-lastindexof -- safe */
var apply = __webpack_require__(2104);
var toIndexedObject = __webpack_require__(5656);
var toIntegerOrInfinity = __webpack_require__(9303);
var lengthOfArrayLike = __webpack_require__(6244);
var arrayMethodIsStrict = __webpack_require__(9341);

var min = Math.min;
var $lastIndexOf = [].lastIndexOf;
var NEGATIVE_ZERO = !!$lastIndexOf && 1 / [1].lastIndexOf(1, -0) < 0;
var STRICT_METHOD = arrayMethodIsStrict('lastIndexOf');
var FORCED = NEGATIVE_ZERO || !STRICT_METHOD;

// `Array.prototype.lastIndexOf` method implementation
// https://tc39.es/ecma262/#sec-array.prototype.lastindexof
module.exports = FORCED ? function lastIndexOf(searchElement /* , fromIndex = @[*-1] */) {
  // convert -0 to +0
  if (NEGATIVE_ZERO) return apply($lastIndexOf, this, arguments) || 0;
  var O = toIndexedObject(this);
  var length = lengthOfArrayLike(O);
  var index = length - 1;
  if (arguments.length > 1) index = min(index, toIntegerOrInfinity(arguments[1]));
  if (index < 0) index = length + index;
  for (;index >= 0; index--) if (index in O && O[index] === searchElement) return index || 0;
  return -1;
} : $lastIndexOf;


/***/ }),

/***/ 1194:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var fails = __webpack_require__(7293);
var wellKnownSymbol = __webpack_require__(5112);
var V8_VERSION = __webpack_require__(7392);

var SPECIES = wellKnownSymbol('species');

module.exports = function (METHOD_NAME) {
  // We can't use this feature detection in V8 since it causes
  // deoptimization and serious performance degradation
  // https://github.com/zloirock/core-js/issues/677
  return V8_VERSION >= 51 || !fails(function () {
    var array = [];
    var constructor = array.constructor = {};
    constructor[SPECIES] = function () {
      return { foo: 1 };
    };
    return array[METHOD_NAME](Boolean).foo !== 1;
  });
};


/***/ }),

/***/ 9341:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

"use strict";

var fails = __webpack_require__(7293);

module.exports = function (METHOD_NAME, argument) {
  var method = [][METHOD_NAME];
  return !!method && fails(function () {
    // eslint-disable-next-line no-useless-call -- required for testing
    method.call(null, argument || function () { return 1; }, 1);
  });
};


/***/ }),

/***/ 3671:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var global = __webpack_require__(7854);
var aCallable = __webpack_require__(9662);
var toObject = __webpack_require__(7908);
var IndexedObject = __webpack_require__(8361);
var lengthOfArrayLike = __webpack_require__(6244);

var TypeError = global.TypeError;

// `Array.prototype.{ reduce, reduceRight }` methods implementation
var createMethod = function (IS_RIGHT) {
  return function (that, callbackfn, argumentsLength, memo) {
    aCallable(callbackfn);
    var O = toObject(that);
    var self = IndexedObject(O);
    var length = lengthOfArrayLike(O);
    var index = IS_RIGHT ? length - 1 : 0;
    var i = IS_RIGHT ? -1 : 1;
    if (argumentsLength < 2) while (true) {
      if (index in self) {
        memo = self[index];
        index += i;
        break;
      }
      index += i;
      if (IS_RIGHT ? index < 0 : length <= index) {
        throw TypeError('Reduce of empty array with no initial value');
      }
    }
    for (;IS_RIGHT ? index >= 0 : length > index; index += i) if (index in self) {
      memo = callbackfn(memo, self[index], index, O);
    }
    return memo;
  };
};

module.exports = {
  // `Array.prototype.reduce` method
  // https://tc39.es/ecma262/#sec-array.prototype.reduce
  left: createMethod(false),
  // `Array.prototype.reduceRight` method
  // https://tc39.es/ecma262/#sec-array.prototype.reduceright
  right: createMethod(true)
};


/***/ }),

/***/ 1589:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var global = __webpack_require__(7854);
var toAbsoluteIndex = __webpack_require__(1400);
var lengthOfArrayLike = __webpack_require__(6244);
var createProperty = __webpack_require__(6135);

var Array = global.Array;
var max = Math.max;

module.exports = function (O, start, end) {
  var length = lengthOfArrayLike(O);
  var k = toAbsoluteIndex(start, length);
  var fin = toAbsoluteIndex(end === undefined ? length : end, length);
  var result = Array(max(fin - k, 0));
  for (var n = 0; k < fin; k++, n++) createProperty(result, n, O[k]);
  result.length = n;
  return result;
};


/***/ }),

/***/ 206:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var uncurryThis = __webpack_require__(1702);

module.exports = uncurryThis([].slice);


/***/ }),

/***/ 4362:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var arraySlice = __webpack_require__(1589);

var floor = Math.floor;

var mergeSort = function (array, comparefn) {
  var length = array.length;
  var middle = floor(length / 2);
  return length < 8 ? insertionSort(array, comparefn) : merge(
    array,
    mergeSort(arraySlice(array, 0, middle), comparefn),
    mergeSort(arraySlice(array, middle), comparefn),
    comparefn
  );
};

var insertionSort = function (array, comparefn) {
  var length = array.length;
  var i = 1;
  var element, j;

  while (i < length) {
    j = i;
    element = array[i];
    while (j && comparefn(array[j - 1], element) > 0) {
      array[j] = array[--j];
    }
    if (j !== i++) array[j] = element;
  } return array;
};

var merge = function (array, left, right, comparefn) {
  var llength = left.length;
  var rlength = right.length;
  var lindex = 0;
  var rindex = 0;

  while (lindex < llength || rindex < rlength) {
    array[lindex + rindex] = (lindex < llength && rindex < rlength)
      ? comparefn(left[lindex], right[rindex]) <= 0 ? left[lindex++] : right[rindex++]
      : lindex < llength ? left[lindex++] : right[rindex++];
  } return array;
};

module.exports = mergeSort;


/***/ }),

/***/ 7475:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var global = __webpack_require__(7854);
var isArray = __webpack_require__(3157);
var isConstructor = __webpack_require__(4411);
var isObject = __webpack_require__(111);
var wellKnownSymbol = __webpack_require__(5112);

var SPECIES = wellKnownSymbol('species');
var Array = global.Array;

// a part of `ArraySpeciesCreate` abstract operation
// https://tc39.es/ecma262/#sec-arrayspeciescreate
module.exports = function (originalArray) {
  var C;
  if (isArray(originalArray)) {
    C = originalArray.constructor;
    // cross-realm fallback
    if (isConstructor(C) && (C === Array || isArray(C.prototype))) C = undefined;
    else if (isObject(C)) {
      C = C[SPECIES];
      if (C === null) C = undefined;
    }
  } return C === undefined ? Array : C;
};


/***/ }),

/***/ 5417:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var arraySpeciesConstructor = __webpack_require__(7475);

// `ArraySpeciesCreate` abstract operation
// https://tc39.es/ecma262/#sec-arrayspeciescreate
module.exports = function (originalArray, length) {
  return new (arraySpeciesConstructor(originalArray))(length === 0 ? 0 : length);
};


/***/ }),

/***/ 4170:
/***/ (function(module) {

var itoc = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
var ctoi = {};

for (var index = 0; index < 66; index++) ctoi[itoc.charAt(index)] = index;

module.exports = {
  itoc: itoc,
  ctoi: ctoi
};


/***/ }),

/***/ 7072:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var wellKnownSymbol = __webpack_require__(5112);

var ITERATOR = wellKnownSymbol('iterator');
var SAFE_CLOSING = false;

try {
  var called = 0;
  var iteratorWithReturn = {
    next: function () {
      return { done: !!called++ };
    },
    'return': function () {
      SAFE_CLOSING = true;
    }
  };
  iteratorWithReturn[ITERATOR] = function () {
    return this;
  };
  // eslint-disable-next-line es-x/no-array-from, no-throw-literal -- required for testing
  Array.from(iteratorWithReturn, function () { throw 2; });
} catch (error) { /* empty */ }

module.exports = function (exec, SKIP_CLOSING) {
  if (!SKIP_CLOSING && !SAFE_CLOSING) return false;
  var ITERATION_SUPPORT = false;
  try {
    var object = {};
    object[ITERATOR] = function () {
      return {
        next: function () {
          return { done: ITERATION_SUPPORT = true };
        }
      };
    };
    exec(object);
  } catch (error) { /* empty */ }
  return ITERATION_SUPPORT;
};


/***/ }),

/***/ 4326:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var uncurryThis = __webpack_require__(1702);

var toString = uncurryThis({}.toString);
var stringSlice = uncurryThis(''.slice);

module.exports = function (it) {
  return stringSlice(toString(it), 8, -1);
};


/***/ }),

/***/ 648:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var global = __webpack_require__(7854);
var TO_STRING_TAG_SUPPORT = __webpack_require__(1694);
var isCallable = __webpack_require__(614);
var classofRaw = __webpack_require__(4326);
var wellKnownSymbol = __webpack_require__(5112);

var TO_STRING_TAG = wellKnownSymbol('toStringTag');
var Object = global.Object;

// ES3 wrong here
var CORRECT_ARGUMENTS = classofRaw(function () { return arguments; }()) == 'Arguments';

// fallback for IE11 Script Access Denied error
var tryGet = function (it, key) {
  try {
    return it[key];
  } catch (error) { /* empty */ }
};

// getting tag from ES6+ `Object.prototype.toString`
module.exports = TO_STRING_TAG_SUPPORT ? classofRaw : function (it) {
  var O, tag, result;
  return it === undefined ? 'Undefined' : it === null ? 'Null'
    // @@toStringTag case
    : typeof (tag = tryGet(O = Object(it), TO_STRING_TAG)) == 'string' ? tag
    // builtinTag case
    : CORRECT_ARGUMENTS ? classofRaw(O)
    // ES3 arguments fallback
    : (result = classofRaw(O)) == 'Object' && isCallable(O.callee) ? 'Arguments' : result;
};


/***/ }),

/***/ 7741:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var uncurryThis = __webpack_require__(1702);

var $Error = Error;
var replace = uncurryThis(''.replace);

var TEST = (function (arg) { return String($Error(arg).stack); })('zxcasd');
var V8_OR_CHAKRA_STACK_ENTRY = /\n\s*at [^:]*:[^\n]*/;
var IS_V8_OR_CHAKRA_STACK = V8_OR_CHAKRA_STACK_ENTRY.test(TEST);

module.exports = function (stack, dropEntries) {
  if (IS_V8_OR_CHAKRA_STACK && typeof stack == 'string' && !$Error.prepareStackTrace) {
    while (dropEntries--) stack = replace(stack, V8_OR_CHAKRA_STACK_ENTRY, '');
  } return stack;
};


/***/ }),

/***/ 5631:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

"use strict";

var defineProperty = (__webpack_require__(3070).f);
var create = __webpack_require__(30);
var defineBuiltIns = __webpack_require__(9190);
var bind = __webpack_require__(9974);
var anInstance = __webpack_require__(5787);
var iterate = __webpack_require__(408);
var defineIterator = __webpack_require__(654);
var setSpecies = __webpack_require__(6340);
var DESCRIPTORS = __webpack_require__(9781);
var fastKey = (__webpack_require__(2423).fastKey);
var InternalStateModule = __webpack_require__(9909);

var setInternalState = InternalStateModule.set;
var internalStateGetterFor = InternalStateModule.getterFor;

module.exports = {
  getConstructor: function (wrapper, CONSTRUCTOR_NAME, IS_MAP, ADDER) {
    var Constructor = wrapper(function (that, iterable) {
      anInstance(that, Prototype);
      setInternalState(that, {
        type: CONSTRUCTOR_NAME,
        index: create(null),
        first: undefined,
        last: undefined,
        size: 0
      });
      if (!DESCRIPTORS) that.size = 0;
      if (iterable != undefined) iterate(iterable, that[ADDER], { that: that, AS_ENTRIES: IS_MAP });
    });

    var Prototype = Constructor.prototype;

    var getInternalState = internalStateGetterFor(CONSTRUCTOR_NAME);

    var define = function (that, key, value) {
      var state = getInternalState(that);
      var entry = getEntry(that, key);
      var previous, index;
      // change existing entry
      if (entry) {
        entry.value = value;
      // create new entry
      } else {
        state.last = entry = {
          index: index = fastKey(key, true),
          key: key,
          value: value,
          previous: previous = state.last,
          next: undefined,
          removed: false
        };
        if (!state.first) state.first = entry;
        if (previous) previous.next = entry;
        if (DESCRIPTORS) state.size++;
        else that.size++;
        // add to index
        if (index !== 'F') state.index[index] = entry;
      } return that;
    };

    var getEntry = function (that, key) {
      var state = getInternalState(that);
      // fast case
      var index = fastKey(key);
      var entry;
      if (index !== 'F') return state.index[index];
      // frozen object case
      for (entry = state.first; entry; entry = entry.next) {
        if (entry.key == key) return entry;
      }
    };

    defineBuiltIns(Prototype, {
      // `{ Map, Set }.prototype.clear()` methods
      // https://tc39.es/ecma262/#sec-map.prototype.clear
      // https://tc39.es/ecma262/#sec-set.prototype.clear
      clear: function clear() {
        var that = this;
        var state = getInternalState(that);
        var data = state.index;
        var entry = state.first;
        while (entry) {
          entry.removed = true;
          if (entry.previous) entry.previous = entry.previous.next = undefined;
          delete data[entry.index];
          entry = entry.next;
        }
        state.first = state.last = undefined;
        if (DESCRIPTORS) state.size = 0;
        else that.size = 0;
      },
      // `{ Map, Set }.prototype.delete(key)` methods
      // https://tc39.es/ecma262/#sec-map.prototype.delete
      // https://tc39.es/ecma262/#sec-set.prototype.delete
      'delete': function (key) {
        var that = this;
        var state = getInternalState(that);
        var entry = getEntry(that, key);
        if (entry) {
          var next = entry.next;
          var prev = entry.previous;
          delete state.index[entry.index];
          entry.removed = true;
          if (prev) prev.next = next;
          if (next) next.previous = prev;
          if (state.first == entry) state.first = next;
          if (state.last == entry) state.last = prev;
          if (DESCRIPTORS) state.size--;
          else that.size--;
        } return !!entry;
      },
      // `{ Map, Set }.prototype.forEach(callbackfn, thisArg = undefined)` methods
      // https://tc39.es/ecma262/#sec-map.prototype.foreach
      // https://tc39.es/ecma262/#sec-set.prototype.foreach
      forEach: function forEach(callbackfn /* , that = undefined */) {
        var state = getInternalState(this);
        var boundFunction = bind(callbackfn, arguments.length > 1 ? arguments[1] : undefined);
        var entry;
        while (entry = entry ? entry.next : state.first) {
          boundFunction(entry.value, entry.key, this);
          // revert to the last existing entry
          while (entry && entry.removed) entry = entry.previous;
        }
      },
      // `{ Map, Set}.prototype.has(key)` methods
      // https://tc39.es/ecma262/#sec-map.prototype.has
      // https://tc39.es/ecma262/#sec-set.prototype.has
      has: function has(key) {
        return !!getEntry(this, key);
      }
    });

    defineBuiltIns(Prototype, IS_MAP ? {
      // `Map.prototype.get(key)` method
      // https://tc39.es/ecma262/#sec-map.prototype.get
      get: function get(key) {
        var entry = getEntry(this, key);
        return entry && entry.value;
      },
      // `Map.prototype.set(key, value)` method
      // https://tc39.es/ecma262/#sec-map.prototype.set
      set: function set(key, value) {
        return define(this, key === 0 ? 0 : key, value);
      }
    } : {
      // `Set.prototype.add(value)` method
      // https://tc39.es/ecma262/#sec-set.prototype.add
      add: function add(value) {
        return define(this, value = value === 0 ? 0 : value, value);
      }
    });
    if (DESCRIPTORS) defineProperty(Prototype, 'size', {
      get: function () {
        return getInternalState(this).size;
      }
    });
    return Constructor;
  },
  setStrong: function (Constructor, CONSTRUCTOR_NAME, IS_MAP) {
    var ITERATOR_NAME = CONSTRUCTOR_NAME + ' Iterator';
    var getInternalCollectionState = internalStateGetterFor(CONSTRUCTOR_NAME);
    var getInternalIteratorState = internalStateGetterFor(ITERATOR_NAME);
    // `{ Map, Set }.prototype.{ keys, values, entries, @@iterator }()` methods
    // https://tc39.es/ecma262/#sec-map.prototype.entries
    // https://tc39.es/ecma262/#sec-map.prototype.keys
    // https://tc39.es/ecma262/#sec-map.prototype.values
    // https://tc39.es/ecma262/#sec-map.prototype-@@iterator
    // https://tc39.es/ecma262/#sec-set.prototype.entries
    // https://tc39.es/ecma262/#sec-set.prototype.keys
    // https://tc39.es/ecma262/#sec-set.prototype.values
    // https://tc39.es/ecma262/#sec-set.prototype-@@iterator
    defineIterator(Constructor, CONSTRUCTOR_NAME, function (iterated, kind) {
      setInternalState(this, {
        type: ITERATOR_NAME,
        target: iterated,
        state: getInternalCollectionState(iterated),
        kind: kind,
        last: undefined
      });
    }, function () {
      var state = getInternalIteratorState(this);
      var kind = state.kind;
      var entry = state.last;
      // revert to the last existing entry
      while (entry && entry.removed) entry = entry.previous;
      // get next entry
      if (!state.target || !(state.last = entry = entry ? entry.next : state.state.first)) {
        // or finish the iteration
        state.target = undefined;
        return { value: undefined, done: true };
      }
      // return step by kind
      if (kind == 'keys') return { value: entry.key, done: false };
      if (kind == 'values') return { value: entry.value, done: false };
      return { value: [entry.key, entry.value], done: false };
    }, IS_MAP ? 'entries' : 'values', !IS_MAP, true);

    // `{ Map, Set }.prototype[@@species]` accessors
    // https://tc39.es/ecma262/#sec-get-map-@@species
    // https://tc39.es/ecma262/#sec-get-set-@@species
    setSpecies(CONSTRUCTOR_NAME);
  }
};


/***/ }),

/***/ 7710:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

"use strict";

var $ = __webpack_require__(2109);
var global = __webpack_require__(7854);
var uncurryThis = __webpack_require__(1702);
var isForced = __webpack_require__(4705);
var defineBuiltIn = __webpack_require__(8052);
var InternalMetadataModule = __webpack_require__(2423);
var iterate = __webpack_require__(408);
var anInstance = __webpack_require__(5787);
var isCallable = __webpack_require__(614);
var isObject = __webpack_require__(111);
var fails = __webpack_require__(7293);
var checkCorrectnessOfIteration = __webpack_require__(7072);
var setToStringTag = __webpack_require__(8003);
var inheritIfRequired = __webpack_require__(9587);

module.exports = function (CONSTRUCTOR_NAME, wrapper, common) {
  var IS_MAP = CONSTRUCTOR_NAME.indexOf('Map') !== -1;
  var IS_WEAK = CONSTRUCTOR_NAME.indexOf('Weak') !== -1;
  var ADDER = IS_MAP ? 'set' : 'add';
  var NativeConstructor = global[CONSTRUCTOR_NAME];
  var NativePrototype = NativeConstructor && NativeConstructor.prototype;
  var Constructor = NativeConstructor;
  var exported = {};

  var fixMethod = function (KEY) {
    var uncurriedNativeMethod = uncurryThis(NativePrototype[KEY]);
    defineBuiltIn(NativePrototype, KEY,
      KEY == 'add' ? function add(value) {
        uncurriedNativeMethod(this, value === 0 ? 0 : value);
        return this;
      } : KEY == 'delete' ? function (key) {
        return IS_WEAK && !isObject(key) ? false : uncurriedNativeMethod(this, key === 0 ? 0 : key);
      } : KEY == 'get' ? function get(key) {
        return IS_WEAK && !isObject(key) ? undefined : uncurriedNativeMethod(this, key === 0 ? 0 : key);
      } : KEY == 'has' ? function has(key) {
        return IS_WEAK && !isObject(key) ? false : uncurriedNativeMethod(this, key === 0 ? 0 : key);
      } : function set(key, value) {
        uncurriedNativeMethod(this, key === 0 ? 0 : key, value);
        return this;
      }
    );
  };

  var REPLACE = isForced(
    CONSTRUCTOR_NAME,
    !isCallable(NativeConstructor) || !(IS_WEAK || NativePrototype.forEach && !fails(function () {
      new NativeConstructor().entries().next();
    }))
  );

  if (REPLACE) {
    // create collection constructor
    Constructor = common.getConstructor(wrapper, CONSTRUCTOR_NAME, IS_MAP, ADDER);
    InternalMetadataModule.enable();
  } else if (isForced(CONSTRUCTOR_NAME, true)) {
    var instance = new Constructor();
    // early implementations not supports chaining
    var HASNT_CHAINING = instance[ADDER](IS_WEAK ? {} : -0, 1) != instance;
    // V8 ~ Chromium 40- weak-collections throws on primitives, but should return false
    var THROWS_ON_PRIMITIVES = fails(function () { instance.has(1); });
    // most early implementations doesn't supports iterables, most modern - not close it correctly
    // eslint-disable-next-line no-new -- required for testing
    var ACCEPT_ITERABLES = checkCorrectnessOfIteration(function (iterable) { new NativeConstructor(iterable); });
    // for early implementations -0 and +0 not the same
    var BUGGY_ZERO = !IS_WEAK && fails(function () {
      // V8 ~ Chromium 42- fails only with 5+ elements
      var $instance = new NativeConstructor();
      var index = 5;
      while (index--) $instance[ADDER](index, index);
      return !$instance.has(-0);
    });

    if (!ACCEPT_ITERABLES) {
      Constructor = wrapper(function (dummy, iterable) {
        anInstance(dummy, NativePrototype);
        var that = inheritIfRequired(new NativeConstructor(), dummy, Constructor);
        if (iterable != undefined) iterate(iterable, that[ADDER], { that: that, AS_ENTRIES: IS_MAP });
        return that;
      });
      Constructor.prototype = NativePrototype;
      NativePrototype.constructor = Constructor;
    }

    if (THROWS_ON_PRIMITIVES || BUGGY_ZERO) {
      fixMethod('delete');
      fixMethod('has');
      IS_MAP && fixMethod('get');
    }

    if (BUGGY_ZERO || HASNT_CHAINING) fixMethod(ADDER);

    // weak collections should not contains .clear method
    if (IS_WEAK && NativePrototype.clear) delete NativePrototype.clear;
  }

  exported[CONSTRUCTOR_NAME] = Constructor;
  $({ global: true, constructor: true, forced: Constructor != NativeConstructor }, exported);

  setToStringTag(Constructor, CONSTRUCTOR_NAME);

  if (!IS_WEAK) common.setStrong(Constructor, CONSTRUCTOR_NAME, IS_MAP);

  return Constructor;
};


/***/ }),

/***/ 9920:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var hasOwn = __webpack_require__(2597);
var ownKeys = __webpack_require__(3887);
var getOwnPropertyDescriptorModule = __webpack_require__(1236);
var definePropertyModule = __webpack_require__(3070);

module.exports = function (target, source, exceptions) {
  var keys = ownKeys(source);
  var defineProperty = definePropertyModule.f;
  var getOwnPropertyDescriptor = getOwnPropertyDescriptorModule.f;
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    if (!hasOwn(target, key) && !(exceptions && hasOwn(exceptions, key))) {
      defineProperty(target, key, getOwnPropertyDescriptor(source, key));
    }
  }
};


/***/ }),

/***/ 4964:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var wellKnownSymbol = __webpack_require__(5112);

var MATCH = wellKnownSymbol('match');

module.exports = function (METHOD_NAME) {
  var regexp = /./;
  try {
    '/./'[METHOD_NAME](regexp);
  } catch (error1) {
    try {
      regexp[MATCH] = false;
      return '/./'[METHOD_NAME](regexp);
    } catch (error2) { /* empty */ }
  } return false;
};


/***/ }),

/***/ 8544:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var fails = __webpack_require__(7293);

module.exports = !fails(function () {
  function F() { /* empty */ }
  F.prototype.constructor = null;
  // eslint-disable-next-line es-x/no-object-getprototypeof -- required for testing
  return Object.getPrototypeOf(new F()) !== F.prototype;
});


/***/ }),

/***/ 4994:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

"use strict";

var IteratorPrototype = (__webpack_require__(3383).IteratorPrototype);
var create = __webpack_require__(30);
var createPropertyDescriptor = __webpack_require__(9114);
var setToStringTag = __webpack_require__(8003);
var Iterators = __webpack_require__(7497);

var returnThis = function () { return this; };

module.exports = function (IteratorConstructor, NAME, next, ENUMERABLE_NEXT) {
  var TO_STRING_TAG = NAME + ' Iterator';
  IteratorConstructor.prototype = create(IteratorPrototype, { next: createPropertyDescriptor(+!ENUMERABLE_NEXT, next) });
  setToStringTag(IteratorConstructor, TO_STRING_TAG, false, true);
  Iterators[TO_STRING_TAG] = returnThis;
  return IteratorConstructor;
};


/***/ }),

/***/ 8880:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var DESCRIPTORS = __webpack_require__(9781);
var definePropertyModule = __webpack_require__(3070);
var createPropertyDescriptor = __webpack_require__(9114);

module.exports = DESCRIPTORS ? function (object, key, value) {
  return definePropertyModule.f(object, key, createPropertyDescriptor(1, value));
} : function (object, key, value) {
  object[key] = value;
  return object;
};


/***/ }),

/***/ 9114:
/***/ (function(module) {

module.exports = function (bitmap, value) {
  return {
    enumerable: !(bitmap & 1),
    configurable: !(bitmap & 2),
    writable: !(bitmap & 4),
    value: value
  };
};


/***/ }),

/***/ 6135:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

"use strict";

var toPropertyKey = __webpack_require__(4948);
var definePropertyModule = __webpack_require__(3070);
var createPropertyDescriptor = __webpack_require__(9114);

module.exports = function (object, key, value) {
  var propertyKey = toPropertyKey(key);
  if (propertyKey in object) definePropertyModule.f(object, propertyKey, createPropertyDescriptor(0, value));
  else object[propertyKey] = value;
};


/***/ }),

/***/ 7045:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var makeBuiltIn = __webpack_require__(6339);
var defineProperty = __webpack_require__(3070);

module.exports = function (target, name, descriptor) {
  if (descriptor.get) makeBuiltIn(descriptor.get, name, { getter: true });
  if (descriptor.set) makeBuiltIn(descriptor.set, name, { setter: true });
  return defineProperty.f(target, name, descriptor);
};


/***/ }),

/***/ 8052:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var global = __webpack_require__(7854);
var isCallable = __webpack_require__(614);
var createNonEnumerableProperty = __webpack_require__(8880);
var makeBuiltIn = __webpack_require__(6339);
var setGlobal = __webpack_require__(3505);

module.exports = function (O, key, value, options) {
  var unsafe = options ? !!options.unsafe : false;
  var simple = options ? !!options.enumerable : false;
  var noTargetGet = options ? !!options.noTargetGet : false;
  var name = options && options.name !== undefined ? options.name : key;
  if (isCallable(value)) makeBuiltIn(value, name, options);
  if (O === global) {
    if (simple) O[key] = value;
    else setGlobal(key, value);
    return O;
  } else if (!unsafe) {
    delete O[key];
  } else if (!noTargetGet && O[key]) {
    simple = true;
  }
  if (simple) O[key] = value;
  else createNonEnumerableProperty(O, key, value);
  return O;
};


/***/ }),

/***/ 9190:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var defineBuiltIn = __webpack_require__(8052);

module.exports = function (target, src, options) {
  for (var key in src) defineBuiltIn(target, key, src[key], options);
  return target;
};


/***/ }),

/***/ 654:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

"use strict";

var $ = __webpack_require__(2109);
var call = __webpack_require__(6916);
var IS_PURE = __webpack_require__(1913);
var FunctionName = __webpack_require__(6530);
var isCallable = __webpack_require__(614);
var createIteratorConstructor = __webpack_require__(4994);
var getPrototypeOf = __webpack_require__(9518);
var setPrototypeOf = __webpack_require__(7674);
var setToStringTag = __webpack_require__(8003);
var createNonEnumerableProperty = __webpack_require__(8880);
var defineBuiltIn = __webpack_require__(8052);
var wellKnownSymbol = __webpack_require__(5112);
var Iterators = __webpack_require__(7497);
var IteratorsCore = __webpack_require__(3383);

var PROPER_FUNCTION_NAME = FunctionName.PROPER;
var CONFIGURABLE_FUNCTION_NAME = FunctionName.CONFIGURABLE;
var IteratorPrototype = IteratorsCore.IteratorPrototype;
var BUGGY_SAFARI_ITERATORS = IteratorsCore.BUGGY_SAFARI_ITERATORS;
var ITERATOR = wellKnownSymbol('iterator');
var KEYS = 'keys';
var VALUES = 'values';
var ENTRIES = 'entries';

var returnThis = function () { return this; };

module.exports = function (Iterable, NAME, IteratorConstructor, next, DEFAULT, IS_SET, FORCED) {
  createIteratorConstructor(IteratorConstructor, NAME, next);

  var getIterationMethod = function (KIND) {
    if (KIND === DEFAULT && defaultIterator) return defaultIterator;
    if (!BUGGY_SAFARI_ITERATORS && KIND in IterablePrototype) return IterablePrototype[KIND];
    switch (KIND) {
      case KEYS: return function keys() { return new IteratorConstructor(this, KIND); };
      case VALUES: return function values() { return new IteratorConstructor(this, KIND); };
      case ENTRIES: return function entries() { return new IteratorConstructor(this, KIND); };
    } return function () { return new IteratorConstructor(this); };
  };

  var TO_STRING_TAG = NAME + ' Iterator';
  var INCORRECT_VALUES_NAME = false;
  var IterablePrototype = Iterable.prototype;
  var nativeIterator = IterablePrototype[ITERATOR]
    || IterablePrototype['@@iterator']
    || DEFAULT && IterablePrototype[DEFAULT];
  var defaultIterator = !BUGGY_SAFARI_ITERATORS && nativeIterator || getIterationMethod(DEFAULT);
  var anyNativeIterator = NAME == 'Array' ? IterablePrototype.entries || nativeIterator : nativeIterator;
  var CurrentIteratorPrototype, methods, KEY;

  // fix native
  if (anyNativeIterator) {
    CurrentIteratorPrototype = getPrototypeOf(anyNativeIterator.call(new Iterable()));
    if (CurrentIteratorPrototype !== Object.prototype && CurrentIteratorPrototype.next) {
      if (!IS_PURE && getPrototypeOf(CurrentIteratorPrototype) !== IteratorPrototype) {
        if (setPrototypeOf) {
          setPrototypeOf(CurrentIteratorPrototype, IteratorPrototype);
        } else if (!isCallable(CurrentIteratorPrototype[ITERATOR])) {
          defineBuiltIn(CurrentIteratorPrototype, ITERATOR, returnThis);
        }
      }
      // Set @@toStringTag to native iterators
      setToStringTag(CurrentIteratorPrototype, TO_STRING_TAG, true, true);
      if (IS_PURE) Iterators[TO_STRING_TAG] = returnThis;
    }
  }

  // fix Array.prototype.{ values, @@iterator }.name in V8 / FF
  if (PROPER_FUNCTION_NAME && DEFAULT == VALUES && nativeIterator && nativeIterator.name !== VALUES) {
    if (!IS_PURE && CONFIGURABLE_FUNCTION_NAME) {
      createNonEnumerableProperty(IterablePrototype, 'name', VALUES);
    } else {
      INCORRECT_VALUES_NAME = true;
      defaultIterator = function values() { return call(nativeIterator, this); };
    }
  }

  // export additional methods
  if (DEFAULT) {
    methods = {
      values: getIterationMethod(VALUES),
      keys: IS_SET ? defaultIterator : getIterationMethod(KEYS),
      entries: getIterationMethod(ENTRIES)
    };
    if (FORCED) for (KEY in methods) {
      if (BUGGY_SAFARI_ITERATORS || INCORRECT_VALUES_NAME || !(KEY in IterablePrototype)) {
        defineBuiltIn(IterablePrototype, KEY, methods[KEY]);
      }
    } else $({ target: NAME, proto: true, forced: BUGGY_SAFARI_ITERATORS || INCORRECT_VALUES_NAME }, methods);
  }

  // define iterator
  if ((!IS_PURE || FORCED) && IterablePrototype[ITERATOR] !== defaultIterator) {
    defineBuiltIn(IterablePrototype, ITERATOR, defaultIterator, { name: DEFAULT });
  }
  Iterators[NAME] = defaultIterator;

  return methods;
};


/***/ }),

/***/ 7235:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var path = __webpack_require__(857);
var hasOwn = __webpack_require__(2597);
var wrappedWellKnownSymbolModule = __webpack_require__(6061);
var defineProperty = (__webpack_require__(3070).f);

module.exports = function (NAME) {
  var Symbol = path.Symbol || (path.Symbol = {});
  if (!hasOwn(Symbol, NAME)) defineProperty(Symbol, NAME, {
    value: wrappedWellKnownSymbolModule.f(NAME)
  });
};


/***/ }),

/***/ 9781:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var fails = __webpack_require__(7293);

// Detect IE8's incomplete defineProperty implementation
module.exports = !fails(function () {
  // eslint-disable-next-line es-x/no-object-defineproperty -- required for testing
  return Object.defineProperty({}, 1, { get: function () { return 7; } })[1] != 7;
});


/***/ }),

/***/ 317:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var global = __webpack_require__(7854);
var isObject = __webpack_require__(111);

var document = global.document;
// typeof document.createElement is 'object' in old IE
var EXISTS = isObject(document) && isObject(document.createElement);

module.exports = function (it) {
  return EXISTS ? document.createElement(it) : {};
};


/***/ }),

/***/ 3678:
/***/ (function(module) {

module.exports = {
  IndexSizeError: { s: 'INDEX_SIZE_ERR', c: 1, m: 1 },
  DOMStringSizeError: { s: 'DOMSTRING_SIZE_ERR', c: 2, m: 0 },
  HierarchyRequestError: { s: 'HIERARCHY_REQUEST_ERR', c: 3, m: 1 },
  WrongDocumentError: { s: 'WRONG_DOCUMENT_ERR', c: 4, m: 1 },
  InvalidCharacterError: { s: 'INVALID_CHARACTER_ERR', c: 5, m: 1 },
  NoDataAllowedError: { s: 'NO_DATA_ALLOWED_ERR', c: 6, m: 0 },
  NoModificationAllowedError: { s: 'NO_MODIFICATION_ALLOWED_ERR', c: 7, m: 1 },
  NotFoundError: { s: 'NOT_FOUND_ERR', c: 8, m: 1 },
  NotSupportedError: { s: 'NOT_SUPPORTED_ERR', c: 9, m: 1 },
  InUseAttributeError: { s: 'INUSE_ATTRIBUTE_ERR', c: 10, m: 1 },
  InvalidStateError: { s: 'INVALID_STATE_ERR', c: 11, m: 1 },
  SyntaxError: { s: 'SYNTAX_ERR', c: 12, m: 1 },
  InvalidModificationError: { s: 'INVALID_MODIFICATION_ERR', c: 13, m: 1 },
  NamespaceError: { s: 'NAMESPACE_ERR', c: 14, m: 1 },
  InvalidAccessError: { s: 'INVALID_ACCESS_ERR', c: 15, m: 1 },
  ValidationError: { s: 'VALIDATION_ERR', c: 16, m: 0 },
  TypeMismatchError: { s: 'TYPE_MISMATCH_ERR', c: 17, m: 1 },
  SecurityError: { s: 'SECURITY_ERR', c: 18, m: 1 },
  NetworkError: { s: 'NETWORK_ERR', c: 19, m: 1 },
  AbortError: { s: 'ABORT_ERR', c: 20, m: 1 },
  URLMismatchError: { s: 'URL_MISMATCH_ERR', c: 21, m: 1 },
  QuotaExceededError: { s: 'QUOTA_EXCEEDED_ERR', c: 22, m: 1 },
  TimeoutError: { s: 'TIMEOUT_ERR', c: 23, m: 1 },
  InvalidNodeTypeError: { s: 'INVALID_NODE_TYPE_ERR', c: 24, m: 1 },
  DataCloneError: { s: 'DATA_CLONE_ERR', c: 25, m: 1 }
};


/***/ }),

/***/ 8324:
/***/ (function(module) {

// iterable DOM collections
// flag - `iterable` interface - 'entries', 'keys', 'values', 'forEach' methods
module.exports = {
  CSSRuleList: 0,
  CSSStyleDeclaration: 0,
  CSSValueList: 0,
  ClientRectList: 0,
  DOMRectList: 0,
  DOMStringList: 0,
  DOMTokenList: 1,
  DataTransferItemList: 0,
  FileList: 0,
  HTMLAllCollection: 0,
  HTMLCollection: 0,
  HTMLFormElement: 0,
  HTMLSelectElement: 0,
  MediaList: 0,
  MimeTypeArray: 0,
  NamedNodeMap: 0,
  NodeList: 1,
  PaintRequestList: 0,
  Plugin: 0,
  PluginArray: 0,
  SVGLengthList: 0,
  SVGNumberList: 0,
  SVGPathSegList: 0,
  SVGPointList: 0,
  SVGStringList: 0,
  SVGTransformList: 0,
  SourceBufferList: 0,
  StyleSheetList: 0,
  TextTrackCueList: 0,
  TextTrackList: 0,
  TouchList: 0
};


/***/ }),

/***/ 8509:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

// in old WebKit versions, `element.classList` is not an instance of global `DOMTokenList`
var documentCreateElement = __webpack_require__(317);

var classList = documentCreateElement('span').classList;
var DOMTokenListPrototype = classList && classList.constructor && classList.constructor.prototype;

module.exports = DOMTokenListPrototype === Object.prototype ? undefined : DOMTokenListPrototype;


/***/ }),

/***/ 8886:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var userAgent = __webpack_require__(8113);

var firefox = userAgent.match(/firefox\/(\d+)/i);

module.exports = !!firefox && +firefox[1];


/***/ }),

/***/ 256:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var UA = __webpack_require__(8113);

module.exports = /MSIE|Trident/.test(UA);


/***/ }),

/***/ 5268:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var classof = __webpack_require__(4326);
var global = __webpack_require__(7854);

module.exports = classof(global.process) == 'process';


/***/ }),

/***/ 8113:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var getBuiltIn = __webpack_require__(5005);

module.exports = getBuiltIn('navigator', 'userAgent') || '';


/***/ }),

/***/ 7392:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var global = __webpack_require__(7854);
var userAgent = __webpack_require__(8113);

var process = global.process;
var Deno = global.Deno;
var versions = process && process.versions || Deno && Deno.version;
var v8 = versions && versions.v8;
var match, version;

if (v8) {
  match = v8.split('.');
  // in old Chrome, versions of V8 isn't V8 = Chrome / 10
  // but their correct versions are not interesting for us
  version = match[0] > 0 && match[0] < 4 ? 1 : +(match[0] + match[1]);
}

// BrowserFS NodeJS `process` polyfill incorrectly set `.v8` to `0.0`
// so check `userAgent` even if `.v8` exists, but 0
if (!version && userAgent) {
  match = userAgent.match(/Edge\/(\d+)/);
  if (!match || match[1] >= 74) {
    match = userAgent.match(/Chrome\/(\d+)/);
    if (match) version = +match[1];
  }
}

module.exports = version;


/***/ }),

/***/ 8008:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var userAgent = __webpack_require__(8113);

var webkit = userAgent.match(/AppleWebKit\/(\d+)\./);

module.exports = !!webkit && +webkit[1];


/***/ }),

/***/ 748:
/***/ (function(module) {

// IE8- don't enum bug keys
module.exports = [
  'constructor',
  'hasOwnProperty',
  'isPrototypeOf',
  'propertyIsEnumerable',
  'toLocaleString',
  'toString',
  'valueOf'
];


/***/ }),

/***/ 2914:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var fails = __webpack_require__(7293);
var createPropertyDescriptor = __webpack_require__(9114);

module.exports = !fails(function () {
  var error = Error('a');
  if (!('stack' in error)) return true;
  // eslint-disable-next-line es-x/no-object-defineproperty -- safe
  Object.defineProperty(error, 'stack', createPropertyDescriptor(1, 7));
  return error.stack !== 7;
});


/***/ }),

/***/ 7762:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

"use strict";

var DESCRIPTORS = __webpack_require__(9781);
var fails = __webpack_require__(7293);
var anObject = __webpack_require__(9670);
var create = __webpack_require__(30);
var normalizeStringArgument = __webpack_require__(6277);

var nativeErrorToString = Error.prototype.toString;

var INCORRECT_TO_STRING = fails(function () {
  if (DESCRIPTORS) {
    // Chrome 32- incorrectly call accessor
    // eslint-disable-next-line es-x/no-object-defineproperty -- safe
    var object = create(Object.defineProperty({}, 'name', { get: function () {
      return this === object;
    } }));
    if (nativeErrorToString.call(object) !== 'true') return true;
  }
  // FF10- does not properly handle non-strings
  return nativeErrorToString.call({ message: 1, name: 2 }) !== '2: 1'
    // IE8 does not properly handle defaults
    || nativeErrorToString.call({}) !== 'Error';
});

module.exports = INCORRECT_TO_STRING ? function toString() {
  var O = anObject(this);
  var name = normalizeStringArgument(O.name, 'Error');
  var message = normalizeStringArgument(O.message);
  return !name ? message : !message ? name : name + ': ' + message;
} : nativeErrorToString;


/***/ }),

/***/ 2109:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var global = __webpack_require__(7854);
var getOwnPropertyDescriptor = (__webpack_require__(1236).f);
var createNonEnumerableProperty = __webpack_require__(8880);
var defineBuiltIn = __webpack_require__(8052);
var setGlobal = __webpack_require__(3505);
var copyConstructorProperties = __webpack_require__(9920);
var isForced = __webpack_require__(4705);

/*
  options.target      - name of the target object
  options.global      - target is the global object
  options.stat        - export as static methods of target
  options.proto       - export as prototype methods of target
  options.real        - real prototype method for the `pure` version
  options.forced      - export even if the native feature is available
  options.bind        - bind methods to the target, required for the `pure` version
  options.wrap        - wrap constructors to preventing global pollution, required for the `pure` version
  options.unsafe      - use the simple assignment of property instead of delete + defineProperty
  options.sham        - add a flag to not completely full polyfills
  options.enumerable  - export as enumerable property
  options.noTargetGet - prevent calling a getter on target
  options.name        - the .name of the function if it does not match the key
*/
module.exports = function (options, source) {
  var TARGET = options.target;
  var GLOBAL = options.global;
  var STATIC = options.stat;
  var FORCED, target, key, targetProperty, sourceProperty, descriptor;
  if (GLOBAL) {
    target = global;
  } else if (STATIC) {
    target = global[TARGET] || setGlobal(TARGET, {});
  } else {
    target = (global[TARGET] || {}).prototype;
  }
  if (target) for (key in source) {
    sourceProperty = source[key];
    if (options.noTargetGet) {
      descriptor = getOwnPropertyDescriptor(target, key);
      targetProperty = descriptor && descriptor.value;
    } else targetProperty = target[key];
    FORCED = isForced(GLOBAL ? key : TARGET + (STATIC ? '.' : '#') + key, options.forced);
    // contained in target
    if (!FORCED && targetProperty !== undefined) {
      if (typeof sourceProperty == typeof targetProperty) continue;
      copyConstructorProperties(sourceProperty, targetProperty);
    }
    // add a flag to not completely full polyfills
    if (options.sham || (targetProperty && targetProperty.sham)) {
      createNonEnumerableProperty(sourceProperty, 'sham', true);
    }
    defineBuiltIn(target, key, sourceProperty, options);
  }
};


/***/ }),

/***/ 7293:
/***/ (function(module) {

module.exports = function (exec) {
  try {
    return !!exec();
  } catch (error) {
    return true;
  }
};


/***/ }),

/***/ 7007:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

"use strict";

// TODO: Remove from `core-js@4` since it's moved to entry points
__webpack_require__(4916);
var uncurryThis = __webpack_require__(1702);
var defineBuiltIn = __webpack_require__(8052);
var regexpExec = __webpack_require__(2261);
var fails = __webpack_require__(7293);
var wellKnownSymbol = __webpack_require__(5112);
var createNonEnumerableProperty = __webpack_require__(8880);

var SPECIES = wellKnownSymbol('species');
var RegExpPrototype = RegExp.prototype;

module.exports = function (KEY, exec, FORCED, SHAM) {
  var SYMBOL = wellKnownSymbol(KEY);

  var DELEGATES_TO_SYMBOL = !fails(function () {
    // String methods call symbol-named RegEp methods
    var O = {};
    O[SYMBOL] = function () { return 7; };
    return ''[KEY](O) != 7;
  });

  var DELEGATES_TO_EXEC = DELEGATES_TO_SYMBOL && !fails(function () {
    // Symbol-named RegExp methods call .exec
    var execCalled = false;
    var re = /a/;

    if (KEY === 'split') {
      // We can't use real regex here since it causes deoptimization
      // and serious performance degradation in V8
      // https://github.com/zloirock/core-js/issues/306
      re = {};
      // RegExp[@@split] doesn't call the regex's exec method, but first creates
      // a new one. We need to return the patched regex when creating the new one.
      re.constructor = {};
      re.constructor[SPECIES] = function () { return re; };
      re.flags = '';
      re[SYMBOL] = /./[SYMBOL];
    }

    re.exec = function () { execCalled = true; return null; };

    re[SYMBOL]('');
    return !execCalled;
  });

  if (
    !DELEGATES_TO_SYMBOL ||
    !DELEGATES_TO_EXEC ||
    FORCED
  ) {
    var uncurriedNativeRegExpMethod = uncurryThis(/./[SYMBOL]);
    var methods = exec(SYMBOL, ''[KEY], function (nativeMethod, regexp, str, arg2, forceStringMethod) {
      var uncurriedNativeMethod = uncurryThis(nativeMethod);
      var $exec = regexp.exec;
      if ($exec === regexpExec || $exec === RegExpPrototype.exec) {
        if (DELEGATES_TO_SYMBOL && !forceStringMethod) {
          // The native String method already delegates to @@method (this
          // polyfilled function), leasing to infinite recursion.
          // We avoid it by directly calling the native @@method method.
          return { done: true, value: uncurriedNativeRegExpMethod(regexp, str, arg2) };
        }
        return { done: true, value: uncurriedNativeMethod(str, regexp, arg2) };
      }
      return { done: false };
    });

    defineBuiltIn(String.prototype, KEY, methods[0]);
    defineBuiltIn(RegExpPrototype, SYMBOL, methods[1]);
  }

  if (SHAM) createNonEnumerableProperty(RegExpPrototype[SYMBOL], 'sham', true);
};


/***/ }),

/***/ 6677:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var fails = __webpack_require__(7293);

module.exports = !fails(function () {
  // eslint-disable-next-line es-x/no-object-isextensible, es-x/no-object-preventextensions -- required for testing
  return Object.isExtensible(Object.preventExtensions({}));
});


/***/ }),

/***/ 2104:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var NATIVE_BIND = __webpack_require__(4374);

var FunctionPrototype = Function.prototype;
var apply = FunctionPrototype.apply;
var call = FunctionPrototype.call;

// eslint-disable-next-line es-x/no-reflect -- safe
module.exports = typeof Reflect == 'object' && Reflect.apply || (NATIVE_BIND ? call.bind(apply) : function () {
  return call.apply(apply, arguments);
});


/***/ }),

/***/ 9974:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var uncurryThis = __webpack_require__(1702);
var aCallable = __webpack_require__(9662);
var NATIVE_BIND = __webpack_require__(4374);

var bind = uncurryThis(uncurryThis.bind);

// optional / simple context binding
module.exports = function (fn, that) {
  aCallable(fn);
  return that === undefined ? fn : NATIVE_BIND ? bind(fn, that) : function (/* ...args */) {
    return fn.apply(that, arguments);
  };
};


/***/ }),

/***/ 4374:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var fails = __webpack_require__(7293);

module.exports = !fails(function () {
  // eslint-disable-next-line es-x/no-function-prototype-bind -- safe
  var test = (function () { /* empty */ }).bind();
  // eslint-disable-next-line no-prototype-builtins -- safe
  return typeof test != 'function' || test.hasOwnProperty('prototype');
});


/***/ }),

/***/ 6916:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var NATIVE_BIND = __webpack_require__(4374);

var call = Function.prototype.call;

module.exports = NATIVE_BIND ? call.bind(call) : function () {
  return call.apply(call, arguments);
};


/***/ }),

/***/ 6530:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var DESCRIPTORS = __webpack_require__(9781);
var hasOwn = __webpack_require__(2597);

var FunctionPrototype = Function.prototype;
// eslint-disable-next-line es-x/no-object-getownpropertydescriptor -- safe
var getDescriptor = DESCRIPTORS && Object.getOwnPropertyDescriptor;

var EXISTS = hasOwn(FunctionPrototype, 'name');
// additional protection from minified / mangled / dropped function names
var PROPER = EXISTS && (function something() { /* empty */ }).name === 'something';
var CONFIGURABLE = EXISTS && (!DESCRIPTORS || (DESCRIPTORS && getDescriptor(FunctionPrototype, 'name').configurable));

module.exports = {
  EXISTS: EXISTS,
  PROPER: PROPER,
  CONFIGURABLE: CONFIGURABLE
};


/***/ }),

/***/ 1702:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var NATIVE_BIND = __webpack_require__(4374);

var FunctionPrototype = Function.prototype;
var bind = FunctionPrototype.bind;
var call = FunctionPrototype.call;
var uncurryThis = NATIVE_BIND && bind.bind(call, call);

module.exports = NATIVE_BIND ? function (fn) {
  return fn && uncurryThis(fn);
} : function (fn) {
  return fn && function () {
    return call.apply(fn, arguments);
  };
};


/***/ }),

/***/ 5005:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var global = __webpack_require__(7854);
var isCallable = __webpack_require__(614);

var aFunction = function (argument) {
  return isCallable(argument) ? argument : undefined;
};

module.exports = function (namespace, method) {
  return arguments.length < 2 ? aFunction(global[namespace]) : global[namespace] && global[namespace][method];
};


/***/ }),

/***/ 1246:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var classof = __webpack_require__(648);
var getMethod = __webpack_require__(8173);
var Iterators = __webpack_require__(7497);
var wellKnownSymbol = __webpack_require__(5112);

var ITERATOR = wellKnownSymbol('iterator');

module.exports = function (it) {
  if (it != undefined) return getMethod(it, ITERATOR)
    || getMethod(it, '@@iterator')
    || Iterators[classof(it)];
};


/***/ }),

/***/ 8554:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var global = __webpack_require__(7854);
var call = __webpack_require__(6916);
var aCallable = __webpack_require__(9662);
var anObject = __webpack_require__(9670);
var tryToString = __webpack_require__(6330);
var getIteratorMethod = __webpack_require__(1246);

var TypeError = global.TypeError;

module.exports = function (argument, usingIterator) {
  var iteratorMethod = arguments.length < 2 ? getIteratorMethod(argument) : usingIterator;
  if (aCallable(iteratorMethod)) return anObject(call(iteratorMethod, argument));
  throw TypeError(tryToString(argument) + ' is not iterable');
};


/***/ }),

/***/ 8173:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var aCallable = __webpack_require__(9662);

// `GetMethod` abstract operation
// https://tc39.es/ecma262/#sec-getmethod
module.exports = function (V, P) {
  var func = V[P];
  return func == null ? undefined : aCallable(func);
};


/***/ }),

/***/ 647:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var uncurryThis = __webpack_require__(1702);
var toObject = __webpack_require__(7908);

var floor = Math.floor;
var charAt = uncurryThis(''.charAt);
var replace = uncurryThis(''.replace);
var stringSlice = uncurryThis(''.slice);
var SUBSTITUTION_SYMBOLS = /\$([$&'`]|\d{1,2}|<[^>]*>)/g;
var SUBSTITUTION_SYMBOLS_NO_NAMED = /\$([$&'`]|\d{1,2})/g;

// `GetSubstitution` abstract operation
// https://tc39.es/ecma262/#sec-getsubstitution
module.exports = function (matched, str, position, captures, namedCaptures, replacement) {
  var tailPos = position + matched.length;
  var m = captures.length;
  var symbols = SUBSTITUTION_SYMBOLS_NO_NAMED;
  if (namedCaptures !== undefined) {
    namedCaptures = toObject(namedCaptures);
    symbols = SUBSTITUTION_SYMBOLS;
  }
  return replace(replacement, symbols, function (match, ch) {
    var capture;
    switch (charAt(ch, 0)) {
      case '$': return '$';
      case '&': return matched;
      case '`': return stringSlice(str, 0, position);
      case "'": return stringSlice(str, tailPos);
      case '<':
        capture = namedCaptures[stringSlice(ch, 1, -1)];
        break;
      default: // \d\d?
        var n = +ch;
        if (n === 0) return match;
        if (n > m) {
          var f = floor(n / 10);
          if (f === 0) return match;
          if (f <= m) return captures[f - 1] === undefined ? charAt(ch, 1) : captures[f - 1] + charAt(ch, 1);
          return match;
        }
        capture = captures[n - 1];
    }
    return capture === undefined ? '' : capture;
  });
};


/***/ }),

/***/ 7854:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var check = function (it) {
  return it && it.Math == Math && it;
};

// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
module.exports =
  // eslint-disable-next-line es-x/no-global-this -- safe
  check(typeof globalThis == 'object' && globalThis) ||
  check(typeof window == 'object' && window) ||
  // eslint-disable-next-line no-restricted-globals -- safe
  check(typeof self == 'object' && self) ||
  check(typeof __webpack_require__.g == 'object' && __webpack_require__.g) ||
  // eslint-disable-next-line no-new-func -- fallback
  (function () { return this; })() || Function('return this')();


/***/ }),

/***/ 2597:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var uncurryThis = __webpack_require__(1702);
var toObject = __webpack_require__(7908);

var hasOwnProperty = uncurryThis({}.hasOwnProperty);

// `HasOwnProperty` abstract operation
// https://tc39.es/ecma262/#sec-hasownproperty
// eslint-disable-next-line es-x/no-object-hasown -- safe
module.exports = Object.hasOwn || function hasOwn(it, key) {
  return hasOwnProperty(toObject(it), key);
};


/***/ }),

/***/ 3501:
/***/ (function(module) {

module.exports = {};


/***/ }),

/***/ 490:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var getBuiltIn = __webpack_require__(5005);

module.exports = getBuiltIn('document', 'documentElement');


/***/ }),

/***/ 4664:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var DESCRIPTORS = __webpack_require__(9781);
var fails = __webpack_require__(7293);
var createElement = __webpack_require__(317);

// Thanks to IE8 for its funny defineProperty
module.exports = !DESCRIPTORS && !fails(function () {
  // eslint-disable-next-line es-x/no-object-defineproperty -- required for testing
  return Object.defineProperty(createElement('div'), 'a', {
    get: function () { return 7; }
  }).a != 7;
});


/***/ }),

/***/ 1179:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

// IEEE754 conversions based on https://github.com/feross/ieee754
var global = __webpack_require__(7854);

var Array = global.Array;
var abs = Math.abs;
var pow = Math.pow;
var floor = Math.floor;
var log = Math.log;
var LN2 = Math.LN2;

var pack = function (number, mantissaLength, bytes) {
  var buffer = Array(bytes);
  var exponentLength = bytes * 8 - mantissaLength - 1;
  var eMax = (1 << exponentLength) - 1;
  var eBias = eMax >> 1;
  var rt = mantissaLength === 23 ? pow(2, -24) - pow(2, -77) : 0;
  var sign = number < 0 || number === 0 && 1 / number < 0 ? 1 : 0;
  var index = 0;
  var exponent, mantissa, c;
  number = abs(number);
  // eslint-disable-next-line no-self-compare -- NaN check
  if (number != number || number === Infinity) {
    // eslint-disable-next-line no-self-compare -- NaN check
    mantissa = number != number ? 1 : 0;
    exponent = eMax;
  } else {
    exponent = floor(log(number) / LN2);
    c = pow(2, -exponent);
    if (number * c < 1) {
      exponent--;
      c *= 2;
    }
    if (exponent + eBias >= 1) {
      number += rt / c;
    } else {
      number += rt * pow(2, 1 - eBias);
    }
    if (number * c >= 2) {
      exponent++;
      c /= 2;
    }
    if (exponent + eBias >= eMax) {
      mantissa = 0;
      exponent = eMax;
    } else if (exponent + eBias >= 1) {
      mantissa = (number * c - 1) * pow(2, mantissaLength);
      exponent = exponent + eBias;
    } else {
      mantissa = number * pow(2, eBias - 1) * pow(2, mantissaLength);
      exponent = 0;
    }
  }
  while (mantissaLength >= 8) {
    buffer[index++] = mantissa & 255;
    mantissa /= 256;
    mantissaLength -= 8;
  }
  exponent = exponent << mantissaLength | mantissa;
  exponentLength += mantissaLength;
  while (exponentLength > 0) {
    buffer[index++] = exponent & 255;
    exponent /= 256;
    exponentLength -= 8;
  }
  buffer[--index] |= sign * 128;
  return buffer;
};

var unpack = function (buffer, mantissaLength) {
  var bytes = buffer.length;
  var exponentLength = bytes * 8 - mantissaLength - 1;
  var eMax = (1 << exponentLength) - 1;
  var eBias = eMax >> 1;
  var nBits = exponentLength - 7;
  var index = bytes - 1;
  var sign = buffer[index--];
  var exponent = sign & 127;
  var mantissa;
  sign >>= 7;
  while (nBits > 0) {
    exponent = exponent * 256 + buffer[index--];
    nBits -= 8;
  }
  mantissa = exponent & (1 << -nBits) - 1;
  exponent >>= -nBits;
  nBits += mantissaLength;
  while (nBits > 0) {
    mantissa = mantissa * 256 + buffer[index--];
    nBits -= 8;
  }
  if (exponent === 0) {
    exponent = 1 - eBias;
  } else if (exponent === eMax) {
    return mantissa ? NaN : sign ? -Infinity : Infinity;
  } else {
    mantissa = mantissa + pow(2, mantissaLength);
    exponent = exponent - eBias;
  } return (sign ? -1 : 1) * mantissa * pow(2, exponent - mantissaLength);
};

module.exports = {
  pack: pack,
  unpack: unpack
};


/***/ }),

/***/ 8361:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var global = __webpack_require__(7854);
var uncurryThis = __webpack_require__(1702);
var fails = __webpack_require__(7293);
var classof = __webpack_require__(4326);

var Object = global.Object;
var split = uncurryThis(''.split);

// fallback for non-array-like ES3 and non-enumerable old V8 strings
module.exports = fails(function () {
  // throws an error in rhino, see https://github.com/mozilla/rhino/issues/346
  // eslint-disable-next-line no-prototype-builtins -- safe
  return !Object('z').propertyIsEnumerable(0);
}) ? function (it) {
  return classof(it) == 'String' ? split(it, '') : Object(it);
} : Object;


/***/ }),

/***/ 9587:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var isCallable = __webpack_require__(614);
var isObject = __webpack_require__(111);
var setPrototypeOf = __webpack_require__(7674);

// makes subclassing work correct for wrapped built-ins
module.exports = function ($this, dummy, Wrapper) {
  var NewTarget, NewTargetPrototype;
  if (
    // it can work only with native `setPrototypeOf`
    setPrototypeOf &&
    // we haven't completely correct pre-ES6 way for getting `new.target`, so use this
    isCallable(NewTarget = dummy.constructor) &&
    NewTarget !== Wrapper &&
    isObject(NewTargetPrototype = NewTarget.prototype) &&
    NewTargetPrototype !== Wrapper.prototype
  ) setPrototypeOf($this, NewTargetPrototype);
  return $this;
};


/***/ }),

/***/ 2788:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var uncurryThis = __webpack_require__(1702);
var isCallable = __webpack_require__(614);
var store = __webpack_require__(5465);

var functionToString = uncurryThis(Function.toString);

// this helper broken in `core-js@3.4.1-3.4.4`, so we can't use `shared` helper
if (!isCallable(store.inspectSource)) {
  store.inspectSource = function (it) {
    return functionToString(it);
  };
}

module.exports = store.inspectSource;


/***/ }),

/***/ 8340:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var isObject = __webpack_require__(111);
var createNonEnumerableProperty = __webpack_require__(8880);

// `InstallErrorCause` abstract operation
// https://tc39.es/proposal-error-cause/#sec-errorobjects-install-error-cause
module.exports = function (O, options) {
  if (isObject(options) && 'cause' in options) {
    createNonEnumerableProperty(O, 'cause', options.cause);
  }
};


/***/ }),

/***/ 2423:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var $ = __webpack_require__(2109);
var uncurryThis = __webpack_require__(1702);
var hiddenKeys = __webpack_require__(3501);
var isObject = __webpack_require__(111);
var hasOwn = __webpack_require__(2597);
var defineProperty = (__webpack_require__(3070).f);
var getOwnPropertyNamesModule = __webpack_require__(8006);
var getOwnPropertyNamesExternalModule = __webpack_require__(1156);
var isExtensible = __webpack_require__(2050);
var uid = __webpack_require__(9711);
var FREEZING = __webpack_require__(6677);

var REQUIRED = false;
var METADATA = uid('meta');
var id = 0;

var setMetadata = function (it) {
  defineProperty(it, METADATA, { value: {
    objectID: 'O' + id++, // object ID
    weakData: {}          // weak collections IDs
  } });
};

var fastKey = function (it, create) {
  // return a primitive with prefix
  if (!isObject(it)) return typeof it == 'symbol' ? it : (typeof it == 'string' ? 'S' : 'P') + it;
  if (!hasOwn(it, METADATA)) {
    // can't set metadata to uncaught frozen object
    if (!isExtensible(it)) return 'F';
    // not necessary to add metadata
    if (!create) return 'E';
    // add missing metadata
    setMetadata(it);
  // return object ID
  } return it[METADATA].objectID;
};

var getWeakData = function (it, create) {
  if (!hasOwn(it, METADATA)) {
    // can't set metadata to uncaught frozen object
    if (!isExtensible(it)) return true;
    // not necessary to add metadata
    if (!create) return false;
    // add missing metadata
    setMetadata(it);
  // return the store of weak collections IDs
  } return it[METADATA].weakData;
};

// add metadata on freeze-family methods calling
var onFreeze = function (it) {
  if (FREEZING && REQUIRED && isExtensible(it) && !hasOwn(it, METADATA)) setMetadata(it);
  return it;
};

var enable = function () {
  meta.enable = function () { /* empty */ };
  REQUIRED = true;
  var getOwnPropertyNames = getOwnPropertyNamesModule.f;
  var splice = uncurryThis([].splice);
  var test = {};
  test[METADATA] = 1;

  // prevent exposing of metadata key
  if (getOwnPropertyNames(test).length) {
    getOwnPropertyNamesModule.f = function (it) {
      var result = getOwnPropertyNames(it);
      for (var i = 0, length = result.length; i < length; i++) {
        if (result[i] === METADATA) {
          splice(result, i, 1);
          break;
        }
      } return result;
    };

    $({ target: 'Object', stat: true, forced: true }, {
      getOwnPropertyNames: getOwnPropertyNamesExternalModule.f
    });
  }
};

var meta = module.exports = {
  enable: enable,
  fastKey: fastKey,
  getWeakData: getWeakData,
  onFreeze: onFreeze
};

hiddenKeys[METADATA] = true;


/***/ }),

/***/ 9909:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var NATIVE_WEAK_MAP = __webpack_require__(8536);
var global = __webpack_require__(7854);
var uncurryThis = __webpack_require__(1702);
var isObject = __webpack_require__(111);
var createNonEnumerableProperty = __webpack_require__(8880);
var hasOwn = __webpack_require__(2597);
var shared = __webpack_require__(5465);
var sharedKey = __webpack_require__(6200);
var hiddenKeys = __webpack_require__(3501);

var OBJECT_ALREADY_INITIALIZED = 'Object already initialized';
var TypeError = global.TypeError;
var WeakMap = global.WeakMap;
var set, get, has;

var enforce = function (it) {
  return has(it) ? get(it) : set(it, {});
};

var getterFor = function (TYPE) {
  return function (it) {
    var state;
    if (!isObject(it) || (state = get(it)).type !== TYPE) {
      throw TypeError('Incompatible receiver, ' + TYPE + ' required');
    } return state;
  };
};

if (NATIVE_WEAK_MAP || shared.state) {
  var store = shared.state || (shared.state = new WeakMap());
  var wmget = uncurryThis(store.get);
  var wmhas = uncurryThis(store.has);
  var wmset = uncurryThis(store.set);
  set = function (it, metadata) {
    if (wmhas(store, it)) throw new TypeError(OBJECT_ALREADY_INITIALIZED);
    metadata.facade = it;
    wmset(store, it, metadata);
    return metadata;
  };
  get = function (it) {
    return wmget(store, it) || {};
  };
  has = function (it) {
    return wmhas(store, it);
  };
} else {
  var STATE = sharedKey('state');
  hiddenKeys[STATE] = true;
  set = function (it, metadata) {
    if (hasOwn(it, STATE)) throw new TypeError(OBJECT_ALREADY_INITIALIZED);
    metadata.facade = it;
    createNonEnumerableProperty(it, STATE, metadata);
    return metadata;
  };
  get = function (it) {
    return hasOwn(it, STATE) ? it[STATE] : {};
  };
  has = function (it) {
    return hasOwn(it, STATE);
  };
}

module.exports = {
  set: set,
  get: get,
  has: has,
  enforce: enforce,
  getterFor: getterFor
};


/***/ }),

/***/ 7659:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var wellKnownSymbol = __webpack_require__(5112);
var Iterators = __webpack_require__(7497);

var ITERATOR = wellKnownSymbol('iterator');
var ArrayPrototype = Array.prototype;

// check on default Array iterator
module.exports = function (it) {
  return it !== undefined && (Iterators.Array === it || ArrayPrototype[ITERATOR] === it);
};


/***/ }),

/***/ 3157:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var classof = __webpack_require__(4326);

// `IsArray` abstract operation
// https://tc39.es/ecma262/#sec-isarray
// eslint-disable-next-line es-x/no-array-isarray -- safe
module.exports = Array.isArray || function isArray(argument) {
  return classof(argument) == 'Array';
};


/***/ }),

/***/ 614:
/***/ (function(module) {

// `IsCallable` abstract operation
// https://tc39.es/ecma262/#sec-iscallable
module.exports = function (argument) {
  return typeof argument == 'function';
};


/***/ }),

/***/ 4411:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var uncurryThis = __webpack_require__(1702);
var fails = __webpack_require__(7293);
var isCallable = __webpack_require__(614);
var classof = __webpack_require__(648);
var getBuiltIn = __webpack_require__(5005);
var inspectSource = __webpack_require__(2788);

var noop = function () { /* empty */ };
var empty = [];
var construct = getBuiltIn('Reflect', 'construct');
var constructorRegExp = /^\s*(?:class|function)\b/;
var exec = uncurryThis(constructorRegExp.exec);
var INCORRECT_TO_STRING = !constructorRegExp.exec(noop);

var isConstructorModern = function isConstructor(argument) {
  if (!isCallable(argument)) return false;
  try {
    construct(noop, empty, argument);
    return true;
  } catch (error) {
    return false;
  }
};

var isConstructorLegacy = function isConstructor(argument) {
  if (!isCallable(argument)) return false;
  switch (classof(argument)) {
    case 'AsyncFunction':
    case 'GeneratorFunction':
    case 'AsyncGeneratorFunction': return false;
  }
  try {
    // we can't check .prototype since constructors produced by .bind haven't it
    // `Function#toString` throws on some built-it function in some legacy engines
    // (for example, `DOMQuad` and similar in FF41-)
    return INCORRECT_TO_STRING || !!exec(constructorRegExp, inspectSource(argument));
  } catch (error) {
    return true;
  }
};

isConstructorLegacy.sham = true;

// `IsConstructor` abstract operation
// https://tc39.es/ecma262/#sec-isconstructor
module.exports = !construct || fails(function () {
  var called;
  return isConstructorModern(isConstructorModern.call)
    || !isConstructorModern(Object)
    || !isConstructorModern(function () { called = true; })
    || called;
}) ? isConstructorLegacy : isConstructorModern;


/***/ }),

/***/ 4705:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var fails = __webpack_require__(7293);
var isCallable = __webpack_require__(614);

var replacement = /#|\.prototype\./;

var isForced = function (feature, detection) {
  var value = data[normalize(feature)];
  return value == POLYFILL ? true
    : value == NATIVE ? false
    : isCallable(detection) ? fails(detection)
    : !!detection;
};

var normalize = isForced.normalize = function (string) {
  return String(string).replace(replacement, '.').toLowerCase();
};

var data = isForced.data = {};
var NATIVE = isForced.NATIVE = 'N';
var POLYFILL = isForced.POLYFILL = 'P';

module.exports = isForced;


/***/ }),

/***/ 5988:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var isObject = __webpack_require__(111);

var floor = Math.floor;

// `IsIntegralNumber` abstract operation
// https://tc39.es/ecma262/#sec-isintegralnumber
// eslint-disable-next-line es-x/no-number-isinteger -- safe
module.exports = Number.isInteger || function isInteger(it) {
  return !isObject(it) && isFinite(it) && floor(it) === it;
};


/***/ }),

/***/ 111:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var isCallable = __webpack_require__(614);

module.exports = function (it) {
  return typeof it == 'object' ? it !== null : isCallable(it);
};


/***/ }),

/***/ 1913:
/***/ (function(module) {

module.exports = false;


/***/ }),

/***/ 7850:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var isObject = __webpack_require__(111);
var classof = __webpack_require__(4326);
var wellKnownSymbol = __webpack_require__(5112);

var MATCH = wellKnownSymbol('match');

// `IsRegExp` abstract operation
// https://tc39.es/ecma262/#sec-isregexp
module.exports = function (it) {
  var isRegExp;
  return isObject(it) && ((isRegExp = it[MATCH]) !== undefined ? !!isRegExp : classof(it) == 'RegExp');
};


/***/ }),

/***/ 2190:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var global = __webpack_require__(7854);
var getBuiltIn = __webpack_require__(5005);
var isCallable = __webpack_require__(614);
var isPrototypeOf = __webpack_require__(7976);
var USE_SYMBOL_AS_UID = __webpack_require__(3307);

var Object = global.Object;

module.exports = USE_SYMBOL_AS_UID ? function (it) {
  return typeof it == 'symbol';
} : function (it) {
  var $Symbol = getBuiltIn('Symbol');
  return isCallable($Symbol) && isPrototypeOf($Symbol.prototype, Object(it));
};


/***/ }),

/***/ 408:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var global = __webpack_require__(7854);
var bind = __webpack_require__(9974);
var call = __webpack_require__(6916);
var anObject = __webpack_require__(9670);
var tryToString = __webpack_require__(6330);
var isArrayIteratorMethod = __webpack_require__(7659);
var lengthOfArrayLike = __webpack_require__(6244);
var isPrototypeOf = __webpack_require__(7976);
var getIterator = __webpack_require__(8554);
var getIteratorMethod = __webpack_require__(1246);
var iteratorClose = __webpack_require__(9212);

var TypeError = global.TypeError;

var Result = function (stopped, result) {
  this.stopped = stopped;
  this.result = result;
};

var ResultPrototype = Result.prototype;

module.exports = function (iterable, unboundFunction, options) {
  var that = options && options.that;
  var AS_ENTRIES = !!(options && options.AS_ENTRIES);
  var IS_ITERATOR = !!(options && options.IS_ITERATOR);
  var INTERRUPTED = !!(options && options.INTERRUPTED);
  var fn = bind(unboundFunction, that);
  var iterator, iterFn, index, length, result, next, step;

  var stop = function (condition) {
    if (iterator) iteratorClose(iterator, 'normal', condition);
    return new Result(true, condition);
  };

  var callFn = function (value) {
    if (AS_ENTRIES) {
      anObject(value);
      return INTERRUPTED ? fn(value[0], value[1], stop) : fn(value[0], value[1]);
    } return INTERRUPTED ? fn(value, stop) : fn(value);
  };

  if (IS_ITERATOR) {
    iterator = iterable;
  } else {
    iterFn = getIteratorMethod(iterable);
    if (!iterFn) throw TypeError(tryToString(iterable) + ' is not iterable');
    // optimisation for array iterators
    if (isArrayIteratorMethod(iterFn)) {
      for (index = 0, length = lengthOfArrayLike(iterable); length > index; index++) {
        result = callFn(iterable[index]);
        if (result && isPrototypeOf(ResultPrototype, result)) return result;
      } return new Result(false);
    }
    iterator = getIterator(iterable, iterFn);
  }

  next = iterator.next;
  while (!(step = call(next, iterator)).done) {
    try {
      result = callFn(step.value);
    } catch (error) {
      iteratorClose(iterator, 'throw', error);
    }
    if (typeof result == 'object' && result && isPrototypeOf(ResultPrototype, result)) return result;
  } return new Result(false);
};


/***/ }),

/***/ 9212:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var call = __webpack_require__(6916);
var anObject = __webpack_require__(9670);
var getMethod = __webpack_require__(8173);

module.exports = function (iterator, kind, value) {
  var innerResult, innerError;
  anObject(iterator);
  try {
    innerResult = getMethod(iterator, 'return');
    if (!innerResult) {
      if (kind === 'throw') throw value;
      return value;
    }
    innerResult = call(innerResult, iterator);
  } catch (error) {
    innerError = true;
    innerResult = error;
  }
  if (kind === 'throw') throw value;
  if (innerError) throw innerResult;
  anObject(innerResult);
  return value;
};


/***/ }),

/***/ 3383:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

"use strict";

var fails = __webpack_require__(7293);
var isCallable = __webpack_require__(614);
var create = __webpack_require__(30);
var getPrototypeOf = __webpack_require__(9518);
var defineBuiltIn = __webpack_require__(8052);
var wellKnownSymbol = __webpack_require__(5112);
var IS_PURE = __webpack_require__(1913);

var ITERATOR = wellKnownSymbol('iterator');
var BUGGY_SAFARI_ITERATORS = false;

// `%IteratorPrototype%` object
// https://tc39.es/ecma262/#sec-%iteratorprototype%-object
var IteratorPrototype, PrototypeOfArrayIteratorPrototype, arrayIterator;

/* eslint-disable es-x/no-array-prototype-keys -- safe */
if ([].keys) {
  arrayIterator = [].keys();
  // Safari 8 has buggy iterators w/o `next`
  if (!('next' in arrayIterator)) BUGGY_SAFARI_ITERATORS = true;
  else {
    PrototypeOfArrayIteratorPrototype = getPrototypeOf(getPrototypeOf(arrayIterator));
    if (PrototypeOfArrayIteratorPrototype !== Object.prototype) IteratorPrototype = PrototypeOfArrayIteratorPrototype;
  }
}

var NEW_ITERATOR_PROTOTYPE = IteratorPrototype == undefined || fails(function () {
  var test = {};
  // FF44- legacy iterators case
  return IteratorPrototype[ITERATOR].call(test) !== test;
});

if (NEW_ITERATOR_PROTOTYPE) IteratorPrototype = {};
else if (IS_PURE) IteratorPrototype = create(IteratorPrototype);

// `%IteratorPrototype%[@@iterator]()` method
// https://tc39.es/ecma262/#sec-%iteratorprototype%-@@iterator
if (!isCallable(IteratorPrototype[ITERATOR])) {
  defineBuiltIn(IteratorPrototype, ITERATOR, function () {
    return this;
  });
}

module.exports = {
  IteratorPrototype: IteratorPrototype,
  BUGGY_SAFARI_ITERATORS: BUGGY_SAFARI_ITERATORS
};


/***/ }),

/***/ 7497:
/***/ (function(module) {

module.exports = {};


/***/ }),

/***/ 6244:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var toLength = __webpack_require__(7466);

// `LengthOfArrayLike` abstract operation
// https://tc39.es/ecma262/#sec-lengthofarraylike
module.exports = function (obj) {
  return toLength(obj.length);
};


/***/ }),

/***/ 6339:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var fails = __webpack_require__(7293);
var isCallable = __webpack_require__(614);
var hasOwn = __webpack_require__(2597);
var DESCRIPTORS = __webpack_require__(9781);
var CONFIGURABLE_FUNCTION_NAME = (__webpack_require__(6530).CONFIGURABLE);
var inspectSource = __webpack_require__(2788);
var InternalStateModule = __webpack_require__(9909);

var enforceInternalState = InternalStateModule.enforce;
var getInternalState = InternalStateModule.get;
// eslint-disable-next-line es-x/no-object-defineproperty -- safe
var defineProperty = Object.defineProperty;

var CONFIGURABLE_LENGTH = DESCRIPTORS && !fails(function () {
  return defineProperty(function () { /* empty */ }, 'length', { value: 8 }).length !== 8;
});

var TEMPLATE = String(String).split('String');

var makeBuiltIn = module.exports = function (value, name, options) {
  if (String(name).slice(0, 7) === 'Symbol(') {
    name = '[' + String(name).replace(/^Symbol\(([^)]*)\)/, '$1') + ']';
  }
  if (options && options.getter) name = 'get ' + name;
  if (options && options.setter) name = 'set ' + name;
  if (!hasOwn(value, 'name') || (CONFIGURABLE_FUNCTION_NAME && value.name !== name)) {
    defineProperty(value, 'name', { value: name, configurable: true });
  }
  if (CONFIGURABLE_LENGTH && options && hasOwn(options, 'arity') && value.length !== options.arity) {
    defineProperty(value, 'length', { value: options.arity });
  }
  if (options && hasOwn(options, 'constructor') && options.constructor) {
    if (DESCRIPTORS) try {
      defineProperty(value, 'prototype', { writable: false });
    } catch (error) { /* empty */ }
  } else value.prototype = undefined;
  var state = enforceInternalState(value);
  if (!hasOwn(state, 'source')) {
    state.source = TEMPLATE.join(typeof name == 'string' ? name : '');
  } return value;
};

// add fake Function#toString for correct work wrapped methods / constructors with methods like LoDash isNative
// eslint-disable-next-line no-extend-native -- required
Function.prototype.toString = makeBuiltIn(function toString() {
  return isCallable(this) && getInternalState(this).source || inspectSource(this);
}, 'toString');


/***/ }),

/***/ 735:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var NATIVE_SYMBOL = __webpack_require__(133);

/* eslint-disable es-x/no-symbol -- safe */
module.exports = NATIVE_SYMBOL && !!Symbol['for'] && !!Symbol.keyFor;


/***/ }),

/***/ 133:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

/* eslint-disable es-x/no-symbol -- required for testing */
var V8_VERSION = __webpack_require__(7392);
var fails = __webpack_require__(7293);

// eslint-disable-next-line es-x/no-object-getownpropertysymbols -- required for testing
module.exports = !!Object.getOwnPropertySymbols && !fails(function () {
  var symbol = Symbol();
  // Chrome 38 Symbol has incorrect toString conversion
  // `get-own-property-symbols` polyfill symbols converted to object are not Symbol instances
  return !String(symbol) || !(Object(symbol) instanceof Symbol) ||
    // Chrome 38-40 symbols are not inherited from DOM collections prototypes to instances
    !Symbol.sham && V8_VERSION && V8_VERSION < 41;
});


/***/ }),

/***/ 8536:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var global = __webpack_require__(7854);
var isCallable = __webpack_require__(614);
var inspectSource = __webpack_require__(2788);

var WeakMap = global.WeakMap;

module.exports = isCallable(WeakMap) && /native code/.test(inspectSource(WeakMap));


/***/ }),

/***/ 6277:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var toString = __webpack_require__(1340);

module.exports = function (argument, $default) {
  return argument === undefined ? arguments.length < 2 ? '' : $default : toString(argument);
};


/***/ }),

/***/ 3929:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var global = __webpack_require__(7854);
var isRegExp = __webpack_require__(7850);

var TypeError = global.TypeError;

module.exports = function (it) {
  if (isRegExp(it)) {
    throw TypeError("The method doesn't accept regular expressions");
  } return it;
};


/***/ }),

/***/ 1574:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

"use strict";

var DESCRIPTORS = __webpack_require__(9781);
var uncurryThis = __webpack_require__(1702);
var call = __webpack_require__(6916);
var fails = __webpack_require__(7293);
var objectKeys = __webpack_require__(1956);
var getOwnPropertySymbolsModule = __webpack_require__(5181);
var propertyIsEnumerableModule = __webpack_require__(5296);
var toObject = __webpack_require__(7908);
var IndexedObject = __webpack_require__(8361);

// eslint-disable-next-line es-x/no-object-assign -- safe
var $assign = Object.assign;
// eslint-disable-next-line es-x/no-object-defineproperty -- required for testing
var defineProperty = Object.defineProperty;
var concat = uncurryThis([].concat);

// `Object.assign` method
// https://tc39.es/ecma262/#sec-object.assign
module.exports = !$assign || fails(function () {
  // should have correct order of operations (Edge bug)
  if (DESCRIPTORS && $assign({ b: 1 }, $assign(defineProperty({}, 'a', {
    enumerable: true,
    get: function () {
      defineProperty(this, 'b', {
        value: 3,
        enumerable: false
      });
    }
  }), { b: 2 })).b !== 1) return true;
  // should work with symbols and should have deterministic property order (V8 bug)
  var A = {};
  var B = {};
  // eslint-disable-next-line es-x/no-symbol -- safe
  var symbol = Symbol();
  var alphabet = 'abcdefghijklmnopqrst';
  A[symbol] = 7;
  alphabet.split('').forEach(function (chr) { B[chr] = chr; });
  return $assign({}, A)[symbol] != 7 || objectKeys($assign({}, B)).join('') != alphabet;
}) ? function assign(target, source) { // eslint-disable-line no-unused-vars -- required for `.length`
  var T = toObject(target);
  var argumentsLength = arguments.length;
  var index = 1;
  var getOwnPropertySymbols = getOwnPropertySymbolsModule.f;
  var propertyIsEnumerable = propertyIsEnumerableModule.f;
  while (argumentsLength > index) {
    var S = IndexedObject(arguments[index++]);
    var keys = getOwnPropertySymbols ? concat(objectKeys(S), getOwnPropertySymbols(S)) : objectKeys(S);
    var length = keys.length;
    var j = 0;
    var key;
    while (length > j) {
      key = keys[j++];
      if (!DESCRIPTORS || call(propertyIsEnumerable, S, key)) T[key] = S[key];
    }
  } return T;
} : $assign;


/***/ }),

/***/ 30:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

/* global ActiveXObject -- old IE, WSH */
var anObject = __webpack_require__(9670);
var definePropertiesModule = __webpack_require__(6048);
var enumBugKeys = __webpack_require__(748);
var hiddenKeys = __webpack_require__(3501);
var html = __webpack_require__(490);
var documentCreateElement = __webpack_require__(317);
var sharedKey = __webpack_require__(6200);

var GT = '>';
var LT = '<';
var PROTOTYPE = 'prototype';
var SCRIPT = 'script';
var IE_PROTO = sharedKey('IE_PROTO');

var EmptyConstructor = function () { /* empty */ };

var scriptTag = function (content) {
  return LT + SCRIPT + GT + content + LT + '/' + SCRIPT + GT;
};

// Create object with fake `null` prototype: use ActiveX Object with cleared prototype
var NullProtoObjectViaActiveX = function (activeXDocument) {
  activeXDocument.write(scriptTag(''));
  activeXDocument.close();
  var temp = activeXDocument.parentWindow.Object;
  activeXDocument = null; // avoid memory leak
  return temp;
};

// Create object with fake `null` prototype: use iframe Object with cleared prototype
var NullProtoObjectViaIFrame = function () {
  // Thrash, waste and sodomy: IE GC bug
  var iframe = documentCreateElement('iframe');
  var JS = 'java' + SCRIPT + ':';
  var iframeDocument;
  iframe.style.display = 'none';
  html.appendChild(iframe);
  // https://github.com/zloirock/core-js/issues/475
  iframe.src = String(JS);
  iframeDocument = iframe.contentWindow.document;
  iframeDocument.open();
  iframeDocument.write(scriptTag('document.F=Object'));
  iframeDocument.close();
  return iframeDocument.F;
};

// Check for document.domain and active x support
// No need to use active x approach when document.domain is not set
// see https://github.com/es-shims/es5-shim/issues/150
// variation of https://github.com/kitcambridge/es5-shim/commit/4f738ac066346
// avoid IE GC bug
var activeXDocument;
var NullProtoObject = function () {
  try {
    activeXDocument = new ActiveXObject('htmlfile');
  } catch (error) { /* ignore */ }
  NullProtoObject = typeof document != 'undefined'
    ? document.domain && activeXDocument
      ? NullProtoObjectViaActiveX(activeXDocument) // old IE
      : NullProtoObjectViaIFrame()
    : NullProtoObjectViaActiveX(activeXDocument); // WSH
  var length = enumBugKeys.length;
  while (length--) delete NullProtoObject[PROTOTYPE][enumBugKeys[length]];
  return NullProtoObject();
};

hiddenKeys[IE_PROTO] = true;

// `Object.create` method
// https://tc39.es/ecma262/#sec-object.create
// eslint-disable-next-line es-x/no-object-create -- safe
module.exports = Object.create || function create(O, Properties) {
  var result;
  if (O !== null) {
    EmptyConstructor[PROTOTYPE] = anObject(O);
    result = new EmptyConstructor();
    EmptyConstructor[PROTOTYPE] = null;
    // add "__proto__" for Object.getPrototypeOf polyfill
    result[IE_PROTO] = O;
  } else result = NullProtoObject();
  return Properties === undefined ? result : definePropertiesModule.f(result, Properties);
};


/***/ }),

/***/ 6048:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

var DESCRIPTORS = __webpack_require__(9781);
var V8_PROTOTYPE_DEFINE_BUG = __webpack_require__(3353);
var definePropertyModule = __webpack_require__(3070);
var anObject = __webpack_require__(9670);
var toIndexedObject = __webpack_require__(5656);
var objectKeys = __webpack_require__(1956);

// `Object.defineProperties` method
// https://tc39.es/ecma262/#sec-object.defineproperties
// eslint-disable-next-line es-x/no-object-defineproperties -- safe
exports.f = DESCRIPTORS && !V8_PROTOTYPE_DEFINE_BUG ? Object.defineProperties : function defineProperties(O, Properties) {
  anObject(O);
  var props = toIndexedObject(Properties);
  var keys = objectKeys(Properties);
  var length = keys.length;
  var index = 0;
  var key;
  while (length > index) definePropertyModule.f(O, key = keys[index++], props[key]);
  return O;
};


/***/ }),

/***/ 3070:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

var global = __webpack_require__(7854);
var DESCRIPTORS = __webpack_require__(9781);
var IE8_DOM_DEFINE = __webpack_require__(4664);
var V8_PROTOTYPE_DEFINE_BUG = __webpack_require__(3353);
var anObject = __webpack_require__(9670);
var toPropertyKey = __webpack_require__(4948);

var TypeError = global.TypeError;
// eslint-disable-next-line es-x/no-object-defineproperty -- safe
var $defineProperty = Object.defineProperty;
// eslint-disable-next-line es-x/no-object-getownpropertydescriptor -- safe
var $getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
var ENUMERABLE = 'enumerable';
var CONFIGURABLE = 'configurable';
var WRITABLE = 'writable';

// `Object.defineProperty` method
// https://tc39.es/ecma262/#sec-object.defineproperty
exports.f = DESCRIPTORS ? V8_PROTOTYPE_DEFINE_BUG ? function defineProperty(O, P, Attributes) {
  anObject(O);
  P = toPropertyKey(P);
  anObject(Attributes);
  if (typeof O === 'function' && P === 'prototype' && 'value' in Attributes && WRITABLE in Attributes && !Attributes[WRITABLE]) {
    var current = $getOwnPropertyDescriptor(O, P);
    if (current && current[WRITABLE]) {
      O[P] = Attributes.value;
      Attributes = {
        configurable: CONFIGURABLE in Attributes ? Attributes[CONFIGURABLE] : current[CONFIGURABLE],
        enumerable: ENUMERABLE in Attributes ? Attributes[ENUMERABLE] : current[ENUMERABLE],
        writable: false
      };
    }
  } return $defineProperty(O, P, Attributes);
} : $defineProperty : function defineProperty(O, P, Attributes) {
  anObject(O);
  P = toPropertyKey(P);
  anObject(Attributes);
  if (IE8_DOM_DEFINE) try {
    return $defineProperty(O, P, Attributes);
  } catch (error) { /* empty */ }
  if ('get' in Attributes || 'set' in Attributes) throw TypeError('Accessors not supported');
  if ('value' in Attributes) O[P] = Attributes.value;
  return O;
};


/***/ }),

/***/ 1236:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

var DESCRIPTORS = __webpack_require__(9781);
var call = __webpack_require__(6916);
var propertyIsEnumerableModule = __webpack_require__(5296);
var createPropertyDescriptor = __webpack_require__(9114);
var toIndexedObject = __webpack_require__(5656);
var toPropertyKey = __webpack_require__(4948);
var hasOwn = __webpack_require__(2597);
var IE8_DOM_DEFINE = __webpack_require__(4664);

// eslint-disable-next-line es-x/no-object-getownpropertydescriptor -- safe
var $getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;

// `Object.getOwnPropertyDescriptor` method
// https://tc39.es/ecma262/#sec-object.getownpropertydescriptor
exports.f = DESCRIPTORS ? $getOwnPropertyDescriptor : function getOwnPropertyDescriptor(O, P) {
  O = toIndexedObject(O);
  P = toPropertyKey(P);
  if (IE8_DOM_DEFINE) try {
    return $getOwnPropertyDescriptor(O, P);
  } catch (error) { /* empty */ }
  if (hasOwn(O, P)) return createPropertyDescriptor(!call(propertyIsEnumerableModule.f, O, P), O[P]);
};


/***/ }),

/***/ 1156:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

/* eslint-disable es-x/no-object-getownpropertynames -- safe */
var classof = __webpack_require__(4326);
var toIndexedObject = __webpack_require__(5656);
var $getOwnPropertyNames = (__webpack_require__(8006).f);
var arraySlice = __webpack_require__(1589);

var windowNames = typeof window == 'object' && window && Object.getOwnPropertyNames
  ? Object.getOwnPropertyNames(window) : [];

var getWindowNames = function (it) {
  try {
    return $getOwnPropertyNames(it);
  } catch (error) {
    return arraySlice(windowNames);
  }
};

// fallback for IE11 buggy Object.getOwnPropertyNames with iframe and window
module.exports.f = function getOwnPropertyNames(it) {
  return windowNames && classof(it) == 'Window'
    ? getWindowNames(it)
    : $getOwnPropertyNames(toIndexedObject(it));
};


/***/ }),

/***/ 8006:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

var internalObjectKeys = __webpack_require__(6324);
var enumBugKeys = __webpack_require__(748);

var hiddenKeys = enumBugKeys.concat('length', 'prototype');

// `Object.getOwnPropertyNames` method
// https://tc39.es/ecma262/#sec-object.getownpropertynames
// eslint-disable-next-line es-x/no-object-getownpropertynames -- safe
exports.f = Object.getOwnPropertyNames || function getOwnPropertyNames(O) {
  return internalObjectKeys(O, hiddenKeys);
};


/***/ }),

/***/ 5181:
/***/ (function(__unused_webpack_module, exports) {

// eslint-disable-next-line es-x/no-object-getownpropertysymbols -- safe
exports.f = Object.getOwnPropertySymbols;


/***/ }),

/***/ 9518:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var global = __webpack_require__(7854);
var hasOwn = __webpack_require__(2597);
var isCallable = __webpack_require__(614);
var toObject = __webpack_require__(7908);
var sharedKey = __webpack_require__(6200);
var CORRECT_PROTOTYPE_GETTER = __webpack_require__(8544);

var IE_PROTO = sharedKey('IE_PROTO');
var Object = global.Object;
var ObjectPrototype = Object.prototype;

// `Object.getPrototypeOf` method
// https://tc39.es/ecma262/#sec-object.getprototypeof
module.exports = CORRECT_PROTOTYPE_GETTER ? Object.getPrototypeOf : function (O) {
  var object = toObject(O);
  if (hasOwn(object, IE_PROTO)) return object[IE_PROTO];
  var constructor = object.constructor;
  if (isCallable(constructor) && object instanceof constructor) {
    return constructor.prototype;
  } return object instanceof Object ? ObjectPrototype : null;
};


/***/ }),

/***/ 2050:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var fails = __webpack_require__(7293);
var isObject = __webpack_require__(111);
var classof = __webpack_require__(4326);
var ARRAY_BUFFER_NON_EXTENSIBLE = __webpack_require__(7556);

// eslint-disable-next-line es-x/no-object-isextensible -- safe
var $isExtensible = Object.isExtensible;
var FAILS_ON_PRIMITIVES = fails(function () { $isExtensible(1); });

// `Object.isExtensible` method
// https://tc39.es/ecma262/#sec-object.isextensible
module.exports = (FAILS_ON_PRIMITIVES || ARRAY_BUFFER_NON_EXTENSIBLE) ? function isExtensible(it) {
  if (!isObject(it)) return false;
  if (ARRAY_BUFFER_NON_EXTENSIBLE && classof(it) == 'ArrayBuffer') return false;
  return $isExtensible ? $isExtensible(it) : true;
} : $isExtensible;


/***/ }),

/***/ 7976:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var uncurryThis = __webpack_require__(1702);

module.exports = uncurryThis({}.isPrototypeOf);


/***/ }),

/***/ 6324:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var uncurryThis = __webpack_require__(1702);
var hasOwn = __webpack_require__(2597);
var toIndexedObject = __webpack_require__(5656);
var indexOf = (__webpack_require__(1318).indexOf);
var hiddenKeys = __webpack_require__(3501);

var push = uncurryThis([].push);

module.exports = function (object, names) {
  var O = toIndexedObject(object);
  var i = 0;
  var result = [];
  var key;
  for (key in O) !hasOwn(hiddenKeys, key) && hasOwn(O, key) && push(result, key);
  // Don't enum bug & hidden keys
  while (names.length > i) if (hasOwn(O, key = names[i++])) {
    ~indexOf(result, key) || push(result, key);
  }
  return result;
};


/***/ }),

/***/ 1956:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var internalObjectKeys = __webpack_require__(6324);
var enumBugKeys = __webpack_require__(748);

// `Object.keys` method
// https://tc39.es/ecma262/#sec-object.keys
// eslint-disable-next-line es-x/no-object-keys -- safe
module.exports = Object.keys || function keys(O) {
  return internalObjectKeys(O, enumBugKeys);
};


/***/ }),

/***/ 5296:
/***/ (function(__unused_webpack_module, exports) {

"use strict";

var $propertyIsEnumerable = {}.propertyIsEnumerable;
// eslint-disable-next-line es-x/no-object-getownpropertydescriptor -- safe
var getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;

// Nashorn ~ JDK8 bug
var NASHORN_BUG = getOwnPropertyDescriptor && !$propertyIsEnumerable.call({ 1: 2 }, 1);

// `Object.prototype.propertyIsEnumerable` method implementation
// https://tc39.es/ecma262/#sec-object.prototype.propertyisenumerable
exports.f = NASHORN_BUG ? function propertyIsEnumerable(V) {
  var descriptor = getOwnPropertyDescriptor(this, V);
  return !!descriptor && descriptor.enumerable;
} : $propertyIsEnumerable;


/***/ }),

/***/ 7674:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

/* eslint-disable no-proto -- safe */
var uncurryThis = __webpack_require__(1702);
var anObject = __webpack_require__(9670);
var aPossiblePrototype = __webpack_require__(6077);

// `Object.setPrototypeOf` method
// https://tc39.es/ecma262/#sec-object.setprototypeof
// Works with __proto__ only. Old v8 can't work with null proto objects.
// eslint-disable-next-line es-x/no-object-setprototypeof -- safe
module.exports = Object.setPrototypeOf || ('__proto__' in {} ? function () {
  var CORRECT_SETTER = false;
  var test = {};
  var setter;
  try {
    // eslint-disable-next-line es-x/no-object-getownpropertydescriptor -- safe
    setter = uncurryThis(Object.getOwnPropertyDescriptor(Object.prototype, '__proto__').set);
    setter(test, []);
    CORRECT_SETTER = test instanceof Array;
  } catch (error) { /* empty */ }
  return function setPrototypeOf(O, proto) {
    anObject(O);
    aPossiblePrototype(proto);
    if (CORRECT_SETTER) setter(O, proto);
    else O.__proto__ = proto;
    return O;
  };
}() : undefined);


/***/ }),

/***/ 288:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

"use strict";

var TO_STRING_TAG_SUPPORT = __webpack_require__(1694);
var classof = __webpack_require__(648);

// `Object.prototype.toString` method implementation
// https://tc39.es/ecma262/#sec-object.prototype.tostring
module.exports = TO_STRING_TAG_SUPPORT ? {}.toString : function toString() {
  return '[object ' + classof(this) + ']';
};


/***/ }),

/***/ 2140:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var global = __webpack_require__(7854);
var call = __webpack_require__(6916);
var isCallable = __webpack_require__(614);
var isObject = __webpack_require__(111);

var TypeError = global.TypeError;

// `OrdinaryToPrimitive` abstract operation
// https://tc39.es/ecma262/#sec-ordinarytoprimitive
module.exports = function (input, pref) {
  var fn, val;
  if (pref === 'string' && isCallable(fn = input.toString) && !isObject(val = call(fn, input))) return val;
  if (isCallable(fn = input.valueOf) && !isObject(val = call(fn, input))) return val;
  if (pref !== 'string' && isCallable(fn = input.toString) && !isObject(val = call(fn, input))) return val;
  throw TypeError("Can't convert object to primitive value");
};


/***/ }),

/***/ 3887:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var getBuiltIn = __webpack_require__(5005);
var uncurryThis = __webpack_require__(1702);
var getOwnPropertyNamesModule = __webpack_require__(8006);
var getOwnPropertySymbolsModule = __webpack_require__(5181);
var anObject = __webpack_require__(9670);

var concat = uncurryThis([].concat);

// all object keys, includes non-enumerable and symbols
module.exports = getBuiltIn('Reflect', 'ownKeys') || function ownKeys(it) {
  var keys = getOwnPropertyNamesModule.f(anObject(it));
  var getOwnPropertySymbols = getOwnPropertySymbolsModule.f;
  return getOwnPropertySymbols ? concat(keys, getOwnPropertySymbols(it)) : keys;
};


/***/ }),

/***/ 857:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var global = __webpack_require__(7854);

module.exports = global;


/***/ }),

/***/ 2626:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var defineProperty = (__webpack_require__(3070).f);

module.exports = function (Target, Source, key) {
  key in Target || defineProperty(Target, key, {
    configurable: true,
    get: function () { return Source[key]; },
    set: function (it) { Source[key] = it; }
  });
};


/***/ }),

/***/ 7651:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var global = __webpack_require__(7854);
var call = __webpack_require__(6916);
var anObject = __webpack_require__(9670);
var isCallable = __webpack_require__(614);
var classof = __webpack_require__(4326);
var regexpExec = __webpack_require__(2261);

var TypeError = global.TypeError;

// `RegExpExec` abstract operation
// https://tc39.es/ecma262/#sec-regexpexec
module.exports = function (R, S) {
  var exec = R.exec;
  if (isCallable(exec)) {
    var result = call(exec, R, S);
    if (result !== null) anObject(result);
    return result;
  }
  if (classof(R) === 'RegExp') return call(regexpExec, R, S);
  throw TypeError('RegExp#exec called on incompatible receiver');
};


/***/ }),

/***/ 2261:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

"use strict";

/* eslint-disable regexp/no-empty-capturing-group, regexp/no-empty-group, regexp/no-lazy-ends -- testing */
/* eslint-disable regexp/no-useless-quantifier -- testing */
var call = __webpack_require__(6916);
var uncurryThis = __webpack_require__(1702);
var toString = __webpack_require__(1340);
var regexpFlags = __webpack_require__(7066);
var stickyHelpers = __webpack_require__(2999);
var shared = __webpack_require__(2309);
var create = __webpack_require__(30);
var getInternalState = (__webpack_require__(9909).get);
var UNSUPPORTED_DOT_ALL = __webpack_require__(9441);
var UNSUPPORTED_NCG = __webpack_require__(7168);

var nativeReplace = shared('native-string-replace', String.prototype.replace);
var nativeExec = RegExp.prototype.exec;
var patchedExec = nativeExec;
var charAt = uncurryThis(''.charAt);
var indexOf = uncurryThis(''.indexOf);
var replace = uncurryThis(''.replace);
var stringSlice = uncurryThis(''.slice);

var UPDATES_LAST_INDEX_WRONG = (function () {
  var re1 = /a/;
  var re2 = /b*/g;
  call(nativeExec, re1, 'a');
  call(nativeExec, re2, 'a');
  return re1.lastIndex !== 0 || re2.lastIndex !== 0;
})();

var UNSUPPORTED_Y = stickyHelpers.BROKEN_CARET;

// nonparticipating capturing group, copied from es5-shim's String#split patch.
var NPCG_INCLUDED = /()??/.exec('')[1] !== undefined;

var PATCH = UPDATES_LAST_INDEX_WRONG || NPCG_INCLUDED || UNSUPPORTED_Y || UNSUPPORTED_DOT_ALL || UNSUPPORTED_NCG;

if (PATCH) {
  patchedExec = function exec(string) {
    var re = this;
    var state = getInternalState(re);
    var str = toString(string);
    var raw = state.raw;
    var result, reCopy, lastIndex, match, i, object, group;

    if (raw) {
      raw.lastIndex = re.lastIndex;
      result = call(patchedExec, raw, str);
      re.lastIndex = raw.lastIndex;
      return result;
    }

    var groups = state.groups;
    var sticky = UNSUPPORTED_Y && re.sticky;
    var flags = call(regexpFlags, re);
    var source = re.source;
    var charsAdded = 0;
    var strCopy = str;

    if (sticky) {
      flags = replace(flags, 'y', '');
      if (indexOf(flags, 'g') === -1) {
        flags += 'g';
      }

      strCopy = stringSlice(str, re.lastIndex);
      // Support anchored sticky behavior.
      if (re.lastIndex > 0 && (!re.multiline || re.multiline && charAt(str, re.lastIndex - 1) !== '\n')) {
        source = '(?: ' + source + ')';
        strCopy = ' ' + strCopy;
        charsAdded++;
      }
      // ^(? + rx + ) is needed, in combination with some str slicing, to
      // simulate the 'y' flag.
      reCopy = new RegExp('^(?:' + source + ')', flags);
    }

    if (NPCG_INCLUDED) {
      reCopy = new RegExp('^' + source + '$(?!\\s)', flags);
    }
    if (UPDATES_LAST_INDEX_WRONG) lastIndex = re.lastIndex;

    match = call(nativeExec, sticky ? reCopy : re, strCopy);

    if (sticky) {
      if (match) {
        match.input = stringSlice(match.input, charsAdded);
        match[0] = stringSlice(match[0], charsAdded);
        match.index = re.lastIndex;
        re.lastIndex += match[0].length;
      } else re.lastIndex = 0;
    } else if (UPDATES_LAST_INDEX_WRONG && match) {
      re.lastIndex = re.global ? match.index + match[0].length : lastIndex;
    }
    if (NPCG_INCLUDED && match && match.length > 1) {
      // Fix browsers whose `exec` methods don't consistently return `undefined`
      // for NPCG, like IE8. NOTE: This doesn' work for /(.?)?/
      call(nativeReplace, match[0], reCopy, function () {
        for (i = 1; i < arguments.length - 2; i++) {
          if (arguments[i] === undefined) match[i] = undefined;
        }
      });
    }

    if (match && groups) {
      match.groups = object = create(null);
      for (i = 0; i < groups.length; i++) {
        group = groups[i];
        object[group[0]] = match[group[1]];
      }
    }

    return match;
  };
}

module.exports = patchedExec;


/***/ }),

/***/ 7066:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

"use strict";

var anObject = __webpack_require__(9670);

// `RegExp.prototype.flags` getter implementation
// https://tc39.es/ecma262/#sec-get-regexp.prototype.flags
module.exports = function () {
  var that = anObject(this);
  var result = '';
  if (that.hasIndices) result += 'd';
  if (that.global) result += 'g';
  if (that.ignoreCase) result += 'i';
  if (that.multiline) result += 'm';
  if (that.dotAll) result += 's';
  if (that.unicode) result += 'u';
  if (that.sticky) result += 'y';
  return result;
};


/***/ }),

/***/ 4706:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var call = __webpack_require__(6916);
var hasOwn = __webpack_require__(2597);
var isPrototypeOf = __webpack_require__(7976);
var regExpFlags = __webpack_require__(7066);

var RegExpPrototype = RegExp.prototype;

module.exports = function (R) {
  var flags = R.flags;
  return flags === undefined && !('flags' in RegExpPrototype) && !hasOwn(R, 'flags') && isPrototypeOf(RegExpPrototype, R)
    ? call(regExpFlags, R) : flags;
};


/***/ }),

/***/ 2999:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var fails = __webpack_require__(7293);
var global = __webpack_require__(7854);

// babel-minify and Closure Compiler transpiles RegExp('a', 'y') -> /a/y and it causes SyntaxError
var $RegExp = global.RegExp;

var UNSUPPORTED_Y = fails(function () {
  var re = $RegExp('a', 'y');
  re.lastIndex = 2;
  return re.exec('abcd') != null;
});

// UC Browser bug
// https://github.com/zloirock/core-js/issues/1008
var MISSED_STICKY = UNSUPPORTED_Y || fails(function () {
  return !$RegExp('a', 'y').sticky;
});

var BROKEN_CARET = UNSUPPORTED_Y || fails(function () {
  // https://bugzilla.mozilla.org/show_bug.cgi?id=773687
  var re = $RegExp('^r', 'gy');
  re.lastIndex = 2;
  return re.exec('str') != null;
});

module.exports = {
  BROKEN_CARET: BROKEN_CARET,
  MISSED_STICKY: MISSED_STICKY,
  UNSUPPORTED_Y: UNSUPPORTED_Y
};


/***/ }),

/***/ 9441:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var fails = __webpack_require__(7293);
var global = __webpack_require__(7854);

// babel-minify and Closure Compiler transpiles RegExp('.', 's') -> /./s and it causes SyntaxError
var $RegExp = global.RegExp;

module.exports = fails(function () {
  var re = $RegExp('.', 's');
  return !(re.dotAll && re.exec('\n') && re.flags === 's');
});


/***/ }),

/***/ 7168:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var fails = __webpack_require__(7293);
var global = __webpack_require__(7854);

// babel-minify and Closure Compiler transpiles RegExp('(?<a>b)', 'g') -> /(?<a>b)/g and it causes SyntaxError
var $RegExp = global.RegExp;

module.exports = fails(function () {
  var re = $RegExp('(?<a>b)', 'g');
  return re.exec('b').groups.a !== 'b' ||
    'b'.replace(re, '$<a>c') !== 'bc';
});


/***/ }),

/***/ 4488:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var global = __webpack_require__(7854);

var TypeError = global.TypeError;

// `RequireObjectCoercible` abstract operation
// https://tc39.es/ecma262/#sec-requireobjectcoercible
module.exports = function (it) {
  if (it == undefined) throw TypeError("Can't call method on " + it);
  return it;
};


/***/ }),

/***/ 3505:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var global = __webpack_require__(7854);

// eslint-disable-next-line es-x/no-object-defineproperty -- safe
var defineProperty = Object.defineProperty;

module.exports = function (key, value) {
  try {
    defineProperty(global, key, { value: value, configurable: true, writable: true });
  } catch (error) {
    global[key] = value;
  } return value;
};


/***/ }),

/***/ 6340:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

"use strict";

var getBuiltIn = __webpack_require__(5005);
var definePropertyModule = __webpack_require__(3070);
var wellKnownSymbol = __webpack_require__(5112);
var DESCRIPTORS = __webpack_require__(9781);

var SPECIES = wellKnownSymbol('species');

module.exports = function (CONSTRUCTOR_NAME) {
  var Constructor = getBuiltIn(CONSTRUCTOR_NAME);
  var defineProperty = definePropertyModule.f;

  if (DESCRIPTORS && Constructor && !Constructor[SPECIES]) {
    defineProperty(Constructor, SPECIES, {
      configurable: true,
      get: function () { return this; }
    });
  }
};


/***/ }),

/***/ 8003:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var defineProperty = (__webpack_require__(3070).f);
var hasOwn = __webpack_require__(2597);
var wellKnownSymbol = __webpack_require__(5112);

var TO_STRING_TAG = wellKnownSymbol('toStringTag');

module.exports = function (target, TAG, STATIC) {
  if (target && !STATIC) target = target.prototype;
  if (target && !hasOwn(target, TO_STRING_TAG)) {
    defineProperty(target, TO_STRING_TAG, { configurable: true, value: TAG });
  }
};


/***/ }),

/***/ 6200:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var shared = __webpack_require__(2309);
var uid = __webpack_require__(9711);

var keys = shared('keys');

module.exports = function (key) {
  return keys[key] || (keys[key] = uid(key));
};


/***/ }),

/***/ 5465:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var global = __webpack_require__(7854);
var setGlobal = __webpack_require__(3505);

var SHARED = '__core-js_shared__';
var store = global[SHARED] || setGlobal(SHARED, {});

module.exports = store;


/***/ }),

/***/ 2309:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var IS_PURE = __webpack_require__(1913);
var store = __webpack_require__(5465);

(module.exports = function (key, value) {
  return store[key] || (store[key] = value !== undefined ? value : {});
})('versions', []).push({
  version: '3.22.5',
  mode: IS_PURE ? 'pure' : 'global',
  copyright: '© 2014-2022 Denis Pushkarev (zloirock.ru)',
  license: 'https://github.com/zloirock/core-js/blob/v3.22.5/LICENSE',
  source: 'https://github.com/zloirock/core-js'
});


/***/ }),

/***/ 6707:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var anObject = __webpack_require__(9670);
var aConstructor = __webpack_require__(9483);
var wellKnownSymbol = __webpack_require__(5112);

var SPECIES = wellKnownSymbol('species');

// `SpeciesConstructor` abstract operation
// https://tc39.es/ecma262/#sec-speciesconstructor
module.exports = function (O, defaultConstructor) {
  var C = anObject(O).constructor;
  var S;
  return C === undefined || (S = anObject(C)[SPECIES]) == undefined ? defaultConstructor : aConstructor(S);
};


/***/ }),

/***/ 8710:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var uncurryThis = __webpack_require__(1702);
var toIntegerOrInfinity = __webpack_require__(9303);
var toString = __webpack_require__(1340);
var requireObjectCoercible = __webpack_require__(4488);

var charAt = uncurryThis(''.charAt);
var charCodeAt = uncurryThis(''.charCodeAt);
var stringSlice = uncurryThis(''.slice);

var createMethod = function (CONVERT_TO_STRING) {
  return function ($this, pos) {
    var S = toString(requireObjectCoercible($this));
    var position = toIntegerOrInfinity(pos);
    var size = S.length;
    var first, second;
    if (position < 0 || position >= size) return CONVERT_TO_STRING ? '' : undefined;
    first = charCodeAt(S, position);
    return first < 0xD800 || first > 0xDBFF || position + 1 === size
      || (second = charCodeAt(S, position + 1)) < 0xDC00 || second > 0xDFFF
        ? CONVERT_TO_STRING
          ? charAt(S, position)
          : first
        : CONVERT_TO_STRING
          ? stringSlice(S, position, position + 2)
          : (first - 0xD800 << 10) + (second - 0xDC00) + 0x10000;
  };
};

module.exports = {
  // `String.prototype.codePointAt` method
  // https://tc39.es/ecma262/#sec-string.prototype.codepointat
  codeAt: createMethod(false),
  // `String.prototype.at` method
  // https://github.com/mathiasbynens/String.prototype.at
  charAt: createMethod(true)
};


/***/ }),

/***/ 6091:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var PROPER_FUNCTION_NAME = (__webpack_require__(6530).PROPER);
var fails = __webpack_require__(7293);
var whitespaces = __webpack_require__(1361);

var non = '\u200B\u0085\u180E';

// check that a method works with the correct list
// of whitespaces and has a correct name
module.exports = function (METHOD_NAME) {
  return fails(function () {
    return !!whitespaces[METHOD_NAME]()
      || non[METHOD_NAME]() !== non
      || (PROPER_FUNCTION_NAME && whitespaces[METHOD_NAME].name !== METHOD_NAME);
  });
};


/***/ }),

/***/ 3111:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var uncurryThis = __webpack_require__(1702);
var requireObjectCoercible = __webpack_require__(4488);
var toString = __webpack_require__(1340);
var whitespaces = __webpack_require__(1361);

var replace = uncurryThis(''.replace);
var whitespace = '[' + whitespaces + ']';
var ltrim = RegExp('^' + whitespace + whitespace + '*');
var rtrim = RegExp(whitespace + whitespace + '*$');

// `String.prototype.{ trim, trimStart, trimEnd, trimLeft, trimRight }` methods implementation
var createMethod = function (TYPE) {
  return function ($this) {
    var string = toString(requireObjectCoercible($this));
    if (TYPE & 1) string = replace(string, ltrim, '');
    if (TYPE & 2) string = replace(string, rtrim, '');
    return string;
  };
};

module.exports = {
  // `String.prototype.{ trimLeft, trimStart }` methods
  // https://tc39.es/ecma262/#sec-string.prototype.trimstart
  start: createMethod(1),
  // `String.prototype.{ trimRight, trimEnd }` methods
  // https://tc39.es/ecma262/#sec-string.prototype.trimend
  end: createMethod(2),
  // `String.prototype.trim` method
  // https://tc39.es/ecma262/#sec-string.prototype.trim
  trim: createMethod(3)
};


/***/ }),

/***/ 6532:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var call = __webpack_require__(6916);
var getBuiltIn = __webpack_require__(5005);
var wellKnownSymbol = __webpack_require__(5112);
var defineBuiltIn = __webpack_require__(8052);

module.exports = function () {
  var Symbol = getBuiltIn('Symbol');
  var SymbolPrototype = Symbol && Symbol.prototype;
  var valueOf = SymbolPrototype && SymbolPrototype.valueOf;
  var TO_PRIMITIVE = wellKnownSymbol('toPrimitive');

  if (SymbolPrototype && !SymbolPrototype[TO_PRIMITIVE]) {
    // `Symbol.prototype[@@toPrimitive]` method
    // https://tc39.es/ecma262/#sec-symbol.prototype-@@toprimitive
    // eslint-disable-next-line no-unused-vars -- required for .length
    defineBuiltIn(SymbolPrototype, TO_PRIMITIVE, function (hint) {
      return call(valueOf, this);
    }, { arity: 1 });
  }
};


/***/ }),

/***/ 863:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var uncurryThis = __webpack_require__(1702);

// `thisNumberValue` abstract operation
// https://tc39.es/ecma262/#sec-thisnumbervalue
module.exports = uncurryThis(1.0.valueOf);


/***/ }),

/***/ 1400:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var toIntegerOrInfinity = __webpack_require__(9303);

var max = Math.max;
var min = Math.min;

// Helper for a popular repeating case of the spec:
// Let integer be ? ToInteger(index).
// If integer < 0, let result be max((length + integer), 0); else let result be min(integer, length).
module.exports = function (index, length) {
  var integer = toIntegerOrInfinity(index);
  return integer < 0 ? max(integer + length, 0) : min(integer, length);
};


/***/ }),

/***/ 7067:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var global = __webpack_require__(7854);
var toIntegerOrInfinity = __webpack_require__(9303);
var toLength = __webpack_require__(7466);

var RangeError = global.RangeError;

// `ToIndex` abstract operation
// https://tc39.es/ecma262/#sec-toindex
module.exports = function (it) {
  if (it === undefined) return 0;
  var number = toIntegerOrInfinity(it);
  var length = toLength(number);
  if (number !== length) throw RangeError('Wrong length or index');
  return length;
};


/***/ }),

/***/ 5656:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

// toObject with fallback for non-array-like ES3 strings
var IndexedObject = __webpack_require__(8361);
var requireObjectCoercible = __webpack_require__(4488);

module.exports = function (it) {
  return IndexedObject(requireObjectCoercible(it));
};


/***/ }),

/***/ 9303:
/***/ (function(module) {

var ceil = Math.ceil;
var floor = Math.floor;

// `ToIntegerOrInfinity` abstract operation
// https://tc39.es/ecma262/#sec-tointegerorinfinity
module.exports = function (argument) {
  var number = +argument;
  // eslint-disable-next-line no-self-compare -- safe
  return number !== number || number === 0 ? 0 : (number > 0 ? floor : ceil)(number);
};


/***/ }),

/***/ 7466:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var toIntegerOrInfinity = __webpack_require__(9303);

var min = Math.min;

// `ToLength` abstract operation
// https://tc39.es/ecma262/#sec-tolength
module.exports = function (argument) {
  return argument > 0 ? min(toIntegerOrInfinity(argument), 0x1FFFFFFFFFFFFF) : 0; // 2 ** 53 - 1 == 9007199254740991
};


/***/ }),

/***/ 7908:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var global = __webpack_require__(7854);
var requireObjectCoercible = __webpack_require__(4488);

var Object = global.Object;

// `ToObject` abstract operation
// https://tc39.es/ecma262/#sec-toobject
module.exports = function (argument) {
  return Object(requireObjectCoercible(argument));
};


/***/ }),

/***/ 4590:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var global = __webpack_require__(7854);
var toPositiveInteger = __webpack_require__(3002);

var RangeError = global.RangeError;

module.exports = function (it, BYTES) {
  var offset = toPositiveInteger(it);
  if (offset % BYTES) throw RangeError('Wrong offset');
  return offset;
};


/***/ }),

/***/ 3002:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var global = __webpack_require__(7854);
var toIntegerOrInfinity = __webpack_require__(9303);

var RangeError = global.RangeError;

module.exports = function (it) {
  var result = toIntegerOrInfinity(it);
  if (result < 0) throw RangeError("The argument can't be less than 0");
  return result;
};


/***/ }),

/***/ 7593:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var global = __webpack_require__(7854);
var call = __webpack_require__(6916);
var isObject = __webpack_require__(111);
var isSymbol = __webpack_require__(2190);
var getMethod = __webpack_require__(8173);
var ordinaryToPrimitive = __webpack_require__(2140);
var wellKnownSymbol = __webpack_require__(5112);

var TypeError = global.TypeError;
var TO_PRIMITIVE = wellKnownSymbol('toPrimitive');

// `ToPrimitive` abstract operation
// https://tc39.es/ecma262/#sec-toprimitive
module.exports = function (input, pref) {
  if (!isObject(input) || isSymbol(input)) return input;
  var exoticToPrim = getMethod(input, TO_PRIMITIVE);
  var result;
  if (exoticToPrim) {
    if (pref === undefined) pref = 'default';
    result = call(exoticToPrim, input, pref);
    if (!isObject(result) || isSymbol(result)) return result;
    throw TypeError("Can't convert object to primitive value");
  }
  if (pref === undefined) pref = 'number';
  return ordinaryToPrimitive(input, pref);
};


/***/ }),

/***/ 4948:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var toPrimitive = __webpack_require__(7593);
var isSymbol = __webpack_require__(2190);

// `ToPropertyKey` abstract operation
// https://tc39.es/ecma262/#sec-topropertykey
module.exports = function (argument) {
  var key = toPrimitive(argument, 'string');
  return isSymbol(key) ? key : key + '';
};


/***/ }),

/***/ 1694:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var wellKnownSymbol = __webpack_require__(5112);

var TO_STRING_TAG = wellKnownSymbol('toStringTag');
var test = {};

test[TO_STRING_TAG] = 'z';

module.exports = String(test) === '[object z]';


/***/ }),

/***/ 1340:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var global = __webpack_require__(7854);
var classof = __webpack_require__(648);

var String = global.String;

module.exports = function (argument) {
  if (classof(argument) === 'Symbol') throw TypeError('Cannot convert a Symbol value to a string');
  return String(argument);
};


/***/ }),

/***/ 4038:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var IS_NODE = __webpack_require__(5268);

module.exports = function (name) {
  try {
    // eslint-disable-next-line no-new-func -- safe
    if (IS_NODE) return Function('return require("' + name + '")')();
  } catch (error) { /* empty */ }
};


/***/ }),

/***/ 6330:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var global = __webpack_require__(7854);

var String = global.String;

module.exports = function (argument) {
  try {
    return String(argument);
  } catch (error) {
    return 'Object';
  }
};


/***/ }),

/***/ 9843:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

"use strict";

var $ = __webpack_require__(2109);
var global = __webpack_require__(7854);
var call = __webpack_require__(6916);
var DESCRIPTORS = __webpack_require__(9781);
var TYPED_ARRAYS_CONSTRUCTORS_REQUIRES_WRAPPERS = __webpack_require__(3832);
var ArrayBufferViewCore = __webpack_require__(260);
var ArrayBufferModule = __webpack_require__(3331);
var anInstance = __webpack_require__(5787);
var createPropertyDescriptor = __webpack_require__(9114);
var createNonEnumerableProperty = __webpack_require__(8880);
var isIntegralNumber = __webpack_require__(5988);
var toLength = __webpack_require__(7466);
var toIndex = __webpack_require__(7067);
var toOffset = __webpack_require__(4590);
var toPropertyKey = __webpack_require__(4948);
var hasOwn = __webpack_require__(2597);
var classof = __webpack_require__(648);
var isObject = __webpack_require__(111);
var isSymbol = __webpack_require__(2190);
var create = __webpack_require__(30);
var isPrototypeOf = __webpack_require__(7976);
var setPrototypeOf = __webpack_require__(7674);
var getOwnPropertyNames = (__webpack_require__(8006).f);
var typedArrayFrom = __webpack_require__(7321);
var forEach = (__webpack_require__(2092).forEach);
var setSpecies = __webpack_require__(6340);
var definePropertyModule = __webpack_require__(3070);
var getOwnPropertyDescriptorModule = __webpack_require__(1236);
var InternalStateModule = __webpack_require__(9909);
var inheritIfRequired = __webpack_require__(9587);

var getInternalState = InternalStateModule.get;
var setInternalState = InternalStateModule.set;
var nativeDefineProperty = definePropertyModule.f;
var nativeGetOwnPropertyDescriptor = getOwnPropertyDescriptorModule.f;
var round = Math.round;
var RangeError = global.RangeError;
var ArrayBuffer = ArrayBufferModule.ArrayBuffer;
var ArrayBufferPrototype = ArrayBuffer.prototype;
var DataView = ArrayBufferModule.DataView;
var NATIVE_ARRAY_BUFFER_VIEWS = ArrayBufferViewCore.NATIVE_ARRAY_BUFFER_VIEWS;
var TYPED_ARRAY_CONSTRUCTOR = ArrayBufferViewCore.TYPED_ARRAY_CONSTRUCTOR;
var TYPED_ARRAY_TAG = ArrayBufferViewCore.TYPED_ARRAY_TAG;
var TypedArray = ArrayBufferViewCore.TypedArray;
var TypedArrayPrototype = ArrayBufferViewCore.TypedArrayPrototype;
var aTypedArrayConstructor = ArrayBufferViewCore.aTypedArrayConstructor;
var isTypedArray = ArrayBufferViewCore.isTypedArray;
var BYTES_PER_ELEMENT = 'BYTES_PER_ELEMENT';
var WRONG_LENGTH = 'Wrong length';

var fromList = function (C, list) {
  aTypedArrayConstructor(C);
  var index = 0;
  var length = list.length;
  var result = new C(length);
  while (length > index) result[index] = list[index++];
  return result;
};

var addGetter = function (it, key) {
  nativeDefineProperty(it, key, { get: function () {
    return getInternalState(this)[key];
  } });
};

var isArrayBuffer = function (it) {
  var klass;
  return isPrototypeOf(ArrayBufferPrototype, it) || (klass = classof(it)) == 'ArrayBuffer' || klass == 'SharedArrayBuffer';
};

var isTypedArrayIndex = function (target, key) {
  return isTypedArray(target)
    && !isSymbol(key)
    && key in target
    && isIntegralNumber(+key)
    && key >= 0;
};

var wrappedGetOwnPropertyDescriptor = function getOwnPropertyDescriptor(target, key) {
  key = toPropertyKey(key);
  return isTypedArrayIndex(target, key)
    ? createPropertyDescriptor(2, target[key])
    : nativeGetOwnPropertyDescriptor(target, key);
};

var wrappedDefineProperty = function defineProperty(target, key, descriptor) {
  key = toPropertyKey(key);
  if (isTypedArrayIndex(target, key)
    && isObject(descriptor)
    && hasOwn(descriptor, 'value')
    && !hasOwn(descriptor, 'get')
    && !hasOwn(descriptor, 'set')
    // TODO: add validation descriptor w/o calling accessors
    && !descriptor.configurable
    && (!hasOwn(descriptor, 'writable') || descriptor.writable)
    && (!hasOwn(descriptor, 'enumerable') || descriptor.enumerable)
  ) {
    target[key] = descriptor.value;
    return target;
  } return nativeDefineProperty(target, key, descriptor);
};

if (DESCRIPTORS) {
  if (!NATIVE_ARRAY_BUFFER_VIEWS) {
    getOwnPropertyDescriptorModule.f = wrappedGetOwnPropertyDescriptor;
    definePropertyModule.f = wrappedDefineProperty;
    addGetter(TypedArrayPrototype, 'buffer');
    addGetter(TypedArrayPrototype, 'byteOffset');
    addGetter(TypedArrayPrototype, 'byteLength');
    addGetter(TypedArrayPrototype, 'length');
  }

  $({ target: 'Object', stat: true, forced: !NATIVE_ARRAY_BUFFER_VIEWS }, {
    getOwnPropertyDescriptor: wrappedGetOwnPropertyDescriptor,
    defineProperty: wrappedDefineProperty
  });

  module.exports = function (TYPE, wrapper, CLAMPED) {
    var BYTES = TYPE.match(/\d+$/)[0] / 8;
    var CONSTRUCTOR_NAME = TYPE + (CLAMPED ? 'Clamped' : '') + 'Array';
    var GETTER = 'get' + TYPE;
    var SETTER = 'set' + TYPE;
    var NativeTypedArrayConstructor = global[CONSTRUCTOR_NAME];
    var TypedArrayConstructor = NativeTypedArrayConstructor;
    var TypedArrayConstructorPrototype = TypedArrayConstructor && TypedArrayConstructor.prototype;
    var exported = {};

    var getter = function (that, index) {
      var data = getInternalState(that);
      return data.view[GETTER](index * BYTES + data.byteOffset, true);
    };

    var setter = function (that, index, value) {
      var data = getInternalState(that);
      if (CLAMPED) value = (value = round(value)) < 0 ? 0 : value > 0xFF ? 0xFF : value & 0xFF;
      data.view[SETTER](index * BYTES + data.byteOffset, value, true);
    };

    var addElement = function (that, index) {
      nativeDefineProperty(that, index, {
        get: function () {
          return getter(this, index);
        },
        set: function (value) {
          return setter(this, index, value);
        },
        enumerable: true
      });
    };

    if (!NATIVE_ARRAY_BUFFER_VIEWS) {
      TypedArrayConstructor = wrapper(function (that, data, offset, $length) {
        anInstance(that, TypedArrayConstructorPrototype);
        var index = 0;
        var byteOffset = 0;
        var buffer, byteLength, length;
        if (!isObject(data)) {
          length = toIndex(data);
          byteLength = length * BYTES;
          buffer = new ArrayBuffer(byteLength);
        } else if (isArrayBuffer(data)) {
          buffer = data;
          byteOffset = toOffset(offset, BYTES);
          var $len = data.byteLength;
          if ($length === undefined) {
            if ($len % BYTES) throw RangeError(WRONG_LENGTH);
            byteLength = $len - byteOffset;
            if (byteLength < 0) throw RangeError(WRONG_LENGTH);
          } else {
            byteLength = toLength($length) * BYTES;
            if (byteLength + byteOffset > $len) throw RangeError(WRONG_LENGTH);
          }
          length = byteLength / BYTES;
        } else if (isTypedArray(data)) {
          return fromList(TypedArrayConstructor, data);
        } else {
          return call(typedArrayFrom, TypedArrayConstructor, data);
        }
        setInternalState(that, {
          buffer: buffer,
          byteOffset: byteOffset,
          byteLength: byteLength,
          length: length,
          view: new DataView(buffer)
        });
        while (index < length) addElement(that, index++);
      });

      if (setPrototypeOf) setPrototypeOf(TypedArrayConstructor, TypedArray);
      TypedArrayConstructorPrototype = TypedArrayConstructor.prototype = create(TypedArrayPrototype);
    } else if (TYPED_ARRAYS_CONSTRUCTORS_REQUIRES_WRAPPERS) {
      TypedArrayConstructor = wrapper(function (dummy, data, typedArrayOffset, $length) {
        anInstance(dummy, TypedArrayConstructorPrototype);
        return inheritIfRequired(function () {
          if (!isObject(data)) return new NativeTypedArrayConstructor(toIndex(data));
          if (isArrayBuffer(data)) return $length !== undefined
            ? new NativeTypedArrayConstructor(data, toOffset(typedArrayOffset, BYTES), $length)
            : typedArrayOffset !== undefined
              ? new NativeTypedArrayConstructor(data, toOffset(typedArrayOffset, BYTES))
              : new NativeTypedArrayConstructor(data);
          if (isTypedArray(data)) return fromList(TypedArrayConstructor, data);
          return call(typedArrayFrom, TypedArrayConstructor, data);
        }(), dummy, TypedArrayConstructor);
      });

      if (setPrototypeOf) setPrototypeOf(TypedArrayConstructor, TypedArray);
      forEach(getOwnPropertyNames(NativeTypedArrayConstructor), function (key) {
        if (!(key in TypedArrayConstructor)) {
          createNonEnumerableProperty(TypedArrayConstructor, key, NativeTypedArrayConstructor[key]);
        }
      });
      TypedArrayConstructor.prototype = TypedArrayConstructorPrototype;
    }

    if (TypedArrayConstructorPrototype.constructor !== TypedArrayConstructor) {
      createNonEnumerableProperty(TypedArrayConstructorPrototype, 'constructor', TypedArrayConstructor);
    }

    createNonEnumerableProperty(TypedArrayConstructorPrototype, TYPED_ARRAY_CONSTRUCTOR, TypedArrayConstructor);

    if (TYPED_ARRAY_TAG) {
      createNonEnumerableProperty(TypedArrayConstructorPrototype, TYPED_ARRAY_TAG, CONSTRUCTOR_NAME);
    }

    var FORCED = TypedArrayConstructor != NativeTypedArrayConstructor;

    exported[CONSTRUCTOR_NAME] = TypedArrayConstructor;

    $({ global: true, constructor: true, forced: FORCED, sham: !NATIVE_ARRAY_BUFFER_VIEWS }, exported);

    if (!(BYTES_PER_ELEMENT in TypedArrayConstructor)) {
      createNonEnumerableProperty(TypedArrayConstructor, BYTES_PER_ELEMENT, BYTES);
    }

    if (!(BYTES_PER_ELEMENT in TypedArrayConstructorPrototype)) {
      createNonEnumerableProperty(TypedArrayConstructorPrototype, BYTES_PER_ELEMENT, BYTES);
    }

    setSpecies(CONSTRUCTOR_NAME);
  };
} else module.exports = function () { /* empty */ };


/***/ }),

/***/ 3832:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

/* eslint-disable no-new -- required for testing */
var global = __webpack_require__(7854);
var fails = __webpack_require__(7293);
var checkCorrectnessOfIteration = __webpack_require__(7072);
var NATIVE_ARRAY_BUFFER_VIEWS = (__webpack_require__(260).NATIVE_ARRAY_BUFFER_VIEWS);

var ArrayBuffer = global.ArrayBuffer;
var Int8Array = global.Int8Array;

module.exports = !NATIVE_ARRAY_BUFFER_VIEWS || !fails(function () {
  Int8Array(1);
}) || !fails(function () {
  new Int8Array(-1);
}) || !checkCorrectnessOfIteration(function (iterable) {
  new Int8Array();
  new Int8Array(null);
  new Int8Array(1.5);
  new Int8Array(iterable);
}, true) || fails(function () {
  // Safari (11+) bug - a reason why even Safari 13 should load a typed array polyfill
  return new Int8Array(new ArrayBuffer(2), 1, undefined).length !== 1;
});


/***/ }),

/***/ 3074:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var arrayFromConstructorAndList = __webpack_require__(7745);
var typedArraySpeciesConstructor = __webpack_require__(6304);

module.exports = function (instance, list) {
  return arrayFromConstructorAndList(typedArraySpeciesConstructor(instance), list);
};


/***/ }),

/***/ 7321:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var bind = __webpack_require__(9974);
var call = __webpack_require__(6916);
var aConstructor = __webpack_require__(9483);
var toObject = __webpack_require__(7908);
var lengthOfArrayLike = __webpack_require__(6244);
var getIterator = __webpack_require__(8554);
var getIteratorMethod = __webpack_require__(1246);
var isArrayIteratorMethod = __webpack_require__(7659);
var aTypedArrayConstructor = (__webpack_require__(260).aTypedArrayConstructor);

module.exports = function from(source /* , mapfn, thisArg */) {
  var C = aConstructor(this);
  var O = toObject(source);
  var argumentsLength = arguments.length;
  var mapfn = argumentsLength > 1 ? arguments[1] : undefined;
  var mapping = mapfn !== undefined;
  var iteratorMethod = getIteratorMethod(O);
  var i, length, result, step, iterator, next;
  if (iteratorMethod && !isArrayIteratorMethod(iteratorMethod)) {
    iterator = getIterator(O, iteratorMethod);
    next = iterator.next;
    O = [];
    while (!(step = call(next, iterator)).done) {
      O.push(step.value);
    }
  }
  if (mapping && argumentsLength > 2) {
    mapfn = bind(mapfn, arguments[2]);
  }
  length = lengthOfArrayLike(O);
  result = new (aTypedArrayConstructor(C))(length);
  for (i = 0; length > i; i++) {
    result[i] = mapping ? mapfn(O[i], i) : O[i];
  }
  return result;
};


/***/ }),

/***/ 6304:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var ArrayBufferViewCore = __webpack_require__(260);
var speciesConstructor = __webpack_require__(6707);

var TYPED_ARRAY_CONSTRUCTOR = ArrayBufferViewCore.TYPED_ARRAY_CONSTRUCTOR;
var aTypedArrayConstructor = ArrayBufferViewCore.aTypedArrayConstructor;

// a part of `TypedArraySpeciesCreate` abstract operation
// https://tc39.es/ecma262/#typedarray-species-create
module.exports = function (originalArray) {
  return aTypedArrayConstructor(speciesConstructor(originalArray, originalArray[TYPED_ARRAY_CONSTRUCTOR]));
};


/***/ }),

/***/ 9711:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var uncurryThis = __webpack_require__(1702);

var id = 0;
var postfix = Math.random();
var toString = uncurryThis(1.0.toString);

module.exports = function (key) {
  return 'Symbol(' + (key === undefined ? '' : key) + ')_' + toString(++id + postfix, 36);
};


/***/ }),

/***/ 3307:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

/* eslint-disable es-x/no-symbol -- required for testing */
var NATIVE_SYMBOL = __webpack_require__(133);

module.exports = NATIVE_SYMBOL
  && !Symbol.sham
  && typeof Symbol.iterator == 'symbol';


/***/ }),

/***/ 3353:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var DESCRIPTORS = __webpack_require__(9781);
var fails = __webpack_require__(7293);

// V8 ~ Chrome 36-
// https://bugs.chromium.org/p/v8/issues/detail?id=3334
module.exports = DESCRIPTORS && fails(function () {
  // eslint-disable-next-line es-x/no-object-defineproperty -- required for testing
  return Object.defineProperty(function () { /* empty */ }, 'prototype', {
    value: 42,
    writable: false
  }).prototype != 42;
});


/***/ }),

/***/ 8053:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var global = __webpack_require__(7854);

var TypeError = global.TypeError;

module.exports = function (passed, required) {
  if (passed < required) throw TypeError('Not enough arguments');
  return passed;
};


/***/ }),

/***/ 6061:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

var wellKnownSymbol = __webpack_require__(5112);

exports.f = wellKnownSymbol;


/***/ }),

/***/ 5112:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

var global = __webpack_require__(7854);
var shared = __webpack_require__(2309);
var hasOwn = __webpack_require__(2597);
var uid = __webpack_require__(9711);
var NATIVE_SYMBOL = __webpack_require__(133);
var USE_SYMBOL_AS_UID = __webpack_require__(3307);

var WellKnownSymbolsStore = shared('wks');
var Symbol = global.Symbol;
var symbolFor = Symbol && Symbol['for'];
var createWellKnownSymbol = USE_SYMBOL_AS_UID ? Symbol : Symbol && Symbol.withoutSetter || uid;

module.exports = function (name) {
  if (!hasOwn(WellKnownSymbolsStore, name) || !(NATIVE_SYMBOL || typeof WellKnownSymbolsStore[name] == 'string')) {
    var description = 'Symbol.' + name;
    if (NATIVE_SYMBOL && hasOwn(Symbol, name)) {
      WellKnownSymbolsStore[name] = Symbol[name];
    } else if (USE_SYMBOL_AS_UID && symbolFor) {
      WellKnownSymbolsStore[name] = symbolFor(description);
    } else {
      WellKnownSymbolsStore[name] = createWellKnownSymbol(description);
    }
  } return WellKnownSymbolsStore[name];
};


/***/ }),

/***/ 1361:
/***/ (function(module) {

// a string of all valid unicode whitespaces
module.exports = '\u0009\u000A\u000B\u000C\u000D\u0020\u00A0\u1680\u2000\u2001\u2002' +
  '\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028\u2029\uFEFF';


/***/ }),

/***/ 9191:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

"use strict";

var getBuiltIn = __webpack_require__(5005);
var hasOwn = __webpack_require__(2597);
var createNonEnumerableProperty = __webpack_require__(8880);
var isPrototypeOf = __webpack_require__(7976);
var setPrototypeOf = __webpack_require__(7674);
var copyConstructorProperties = __webpack_require__(9920);
var proxyAccessor = __webpack_require__(2626);
var inheritIfRequired = __webpack_require__(9587);
var normalizeStringArgument = __webpack_require__(6277);
var installErrorCause = __webpack_require__(8340);
var clearErrorStack = __webpack_require__(7741);
var ERROR_STACK_INSTALLABLE = __webpack_require__(2914);
var DESCRIPTORS = __webpack_require__(9781);
var IS_PURE = __webpack_require__(1913);

module.exports = function (FULL_NAME, wrapper, FORCED, IS_AGGREGATE_ERROR) {
  var STACK_TRACE_LIMIT = 'stackTraceLimit';
  var OPTIONS_POSITION = IS_AGGREGATE_ERROR ? 2 : 1;
  var path = FULL_NAME.split('.');
  var ERROR_NAME = path[path.length - 1];
  var OriginalError = getBuiltIn.apply(null, path);

  if (!OriginalError) return;

  var OriginalErrorPrototype = OriginalError.prototype;

  // V8 9.3- bug https://bugs.chromium.org/p/v8/issues/detail?id=12006
  if (!IS_PURE && hasOwn(OriginalErrorPrototype, 'cause')) delete OriginalErrorPrototype.cause;

  if (!FORCED) return OriginalError;

  var BaseError = getBuiltIn('Error');

  var WrappedError = wrapper(function (a, b) {
    var message = normalizeStringArgument(IS_AGGREGATE_ERROR ? b : a, undefined);
    var result = IS_AGGREGATE_ERROR ? new OriginalError(a) : new OriginalError();
    if (message !== undefined) createNonEnumerableProperty(result, 'message', message);
    if (ERROR_STACK_INSTALLABLE) createNonEnumerableProperty(result, 'stack', clearErrorStack(result.stack, 2));
    if (this && isPrototypeOf(OriginalErrorPrototype, this)) inheritIfRequired(result, this, WrappedError);
    if (arguments.length > OPTIONS_POSITION) installErrorCause(result, arguments[OPTIONS_POSITION]);
    return result;
  });

  WrappedError.prototype = OriginalErrorPrototype;

  if (ERROR_NAME !== 'Error') {
    if (setPrototypeOf) setPrototypeOf(WrappedError, BaseError);
    else copyConstructorProperties(WrappedError, BaseError, { name: true });
  } else if (DESCRIPTORS && STACK_TRACE_LIMIT in OriginalError) {
    proxyAccessor(WrappedError, OriginalError, STACK_TRACE_LIMIT);
    proxyAccessor(WrappedError, OriginalError, 'prepareStackTrace');
  }

  copyConstructorProperties(WrappedError, OriginalError);

  if (!IS_PURE) try {
    // Safari 13- bug: WebAssembly errors does not have a proper `.name`
    if (OriginalErrorPrototype.name !== ERROR_NAME) {
      createNonEnumerableProperty(OriginalErrorPrototype, 'name', ERROR_NAME);
    }
    OriginalErrorPrototype.constructor = WrappedError;
  } catch (error) { /* empty */ }

  return WrappedError;
};


/***/ }),

/***/ 2222:
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

"use strict";

var $ = __webpack_require__(2109);
var global = __webpack_require__(7854);
var fails = __webpack_require__(7293);
var isArray = __webpack_require__(3157);
var isObject = __webpack_require__(111);
var toObject = __webpack_require__(7908);
var lengthOfArrayLike = __webpack_require__(6244);
var createProperty = __webpack_require__(6135);
var arraySpeciesCreate = __webpack_require__(5417);
var arrayMethodHasSpeciesSupport = __webpack_require__(1194);
var wellKnownSymbol = __webpack_require__(5112);
var V8_VERSION = __webpack_require__(7392);

var IS_CONCAT_SPREADABLE = wellKnownSymbol('isConcatSpreadable');
var MAX_SAFE_INTEGER = 0x1FFFFFFFFFFFFF;
var MAXIMUM_ALLOWED_INDEX_EXCEEDED = 'Maximum allowed index exceeded';
var TypeError = global.TypeError;

// We can't use this feature detection in V8 since it causes
// deoptimization and serious performance degradation
// https://github.com/zloirock/core-js/issues/679
var IS_CONCAT_SPREADABLE_SUPPORT = V8_VERSION >= 51 || !fails(function () {
  var array = [];
  array[IS_CONCAT_SPREADABLE] = false;
  return array.concat()[0] !== array;
});

var SPECIES_SUPPORT = arrayMethodHasSpeciesSupport('concat');

var isConcatSpreadable = function (O) {
  if (!isObject(O)) return false;
  var spreadable = O[IS_CONCAT_SPREADABLE];
  return spreadable !== undefined ? !!spreadable : isArray(O);
};

var FORCED = !IS_CONCAT_SPREADABLE_SUPPORT || !SPECIES_SUPPORT;

// `Array.prototype.concat` method
// https://tc39.es/ecma262/#sec-array.prototype.concat
// with adding support of @@isConcatSpreadable and @@species
$({ target: 'Array', proto: true, arity: 1, forced: FORCED }, {
  // eslint-disable-next-line no-unused-vars -- required for `.length`
  concat: function concat(arg) {
    var O = toObject(this);
    var A = arraySpeciesCreate(O, 0);
    var n = 0;
    var i, k, length, len, E;
    for (i = -1, length = arguments.length; i < length; i++) {
      E = i === -1 ? O : arguments[i];
      if (isConcatSpreadable(E)) {
        len = lengthOfArrayLike(E);
        if (n + len > MAX_SAFE_INTEGER) throw TypeError(MAXIMUM_ALLOWED_INDEX_EXCEEDED);
        for (k = 0; k < len; k++, n++) if (k in E) createProperty(A, n, E[k]);
      } else {
        if (n >= MAX_SAFE_INTEGER) throw TypeError(MAXIMUM_ALLOWED_INDEX_EXCEEDED);
        createProperty(A, n++, E);
      }
    }
    A.length = n;
    return A;
  }
});


/***/ }),

/***/ 3290:
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

var $ = __webpack_require__(2109);
var fill = __webpack_require__(1285);
var addToUnscopables = __webpack_require__(1223);

// `Array.prototype.fill` method
// https://tc39.es/ecma262/#sec-array.prototype.fill
$({ target: 'Array', proto: true }, {
  fill: fill
});

// https://tc39.es/ecma262/#sec-array.prototype-@@unscopables
addToUnscopables('fill');


/***/ }),

/***/ 7327:
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

"use strict";

var $ = __webpack_require__(2109);
var $filter = (__webpack_require__(2092).filter);
var arrayMethodHasSpeciesSupport = __webpack_require__(1194);

var HAS_SPECIES_SUPPORT = arrayMethodHasSpeciesSupport('filter');

// `Array.prototype.filter` method
// https://tc39.es/ecma262/#sec-array.prototype.filter
// with adding support of @@species
$({ target: 'Array', proto: true, forced: !HAS_SPECIES_SUPPORT }, {
  filter: function filter(callbackfn /* , thisArg */) {
    return $filter(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
  }
});


/***/ }),

/***/ 9826:
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

"use strict";

var $ = __webpack_require__(2109);
var $find = (__webpack_require__(2092).find);
var addToUnscopables = __webpack_require__(1223);

var FIND = 'find';
var SKIPS_HOLES = true;

// Shouldn't skip holes
if (FIND in []) Array(1)[FIND](function () { SKIPS_HOLES = false; });

// `Array.prototype.find` method
// https://tc39.es/ecma262/#sec-array.prototype.find
$({ target: 'Array', proto: true, forced: SKIPS_HOLES }, {
  find: function find(callbackfn /* , that = undefined */) {
    return $find(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
  }
});

// https://tc39.es/ecma262/#sec-array.prototype-@@unscopables
addToUnscopables(FIND);


/***/ }),

/***/ 6699:
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

"use strict";

var $ = __webpack_require__(2109);
var $includes = (__webpack_require__(1318).includes);
var fails = __webpack_require__(7293);
var addToUnscopables = __webpack_require__(1223);

// FF99+ bug
var BROKEN_ON_SPARSE = fails(function () {
  return !Array(1).includes();
});

// `Array.prototype.includes` method
// https://tc39.es/ecma262/#sec-array.prototype.includes
$({ target: 'Array', proto: true, forced: BROKEN_ON_SPARSE }, {
  includes: function includes(el /* , fromIndex = 0 */) {
    return $includes(this, el, arguments.length > 1 ? arguments[1] : undefined);
  }
});

// https://tc39.es/ecma262/#sec-array.prototype-@@unscopables
addToUnscopables('includes');


/***/ }),

/***/ 6992:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

"use strict";

var toIndexedObject = __webpack_require__(5656);
var addToUnscopables = __webpack_require__(1223);
var Iterators = __webpack_require__(7497);
var InternalStateModule = __webpack_require__(9909);
var defineProperty = (__webpack_require__(3070).f);
var defineIterator = __webpack_require__(654);
var IS_PURE = __webpack_require__(1913);
var DESCRIPTORS = __webpack_require__(9781);

var ARRAY_ITERATOR = 'Array Iterator';
var setInternalState = InternalStateModule.set;
var getInternalState = InternalStateModule.getterFor(ARRAY_ITERATOR);

// `Array.prototype.entries` method
// https://tc39.es/ecma262/#sec-array.prototype.entries
// `Array.prototype.keys` method
// https://tc39.es/ecma262/#sec-array.prototype.keys
// `Array.prototype.values` method
// https://tc39.es/ecma262/#sec-array.prototype.values
// `Array.prototype[@@iterator]` method
// https://tc39.es/ecma262/#sec-array.prototype-@@iterator
// `CreateArrayIterator` internal method
// https://tc39.es/ecma262/#sec-createarrayiterator
module.exports = defineIterator(Array, 'Array', function (iterated, kind) {
  setInternalState(this, {
    type: ARRAY_ITERATOR,
    target: toIndexedObject(iterated), // target
    index: 0,                          // next index
    kind: kind                         // kind
  });
// `%ArrayIteratorPrototype%.next` method
// https://tc39.es/ecma262/#sec-%arrayiteratorprototype%.next
}, function () {
  var state = getInternalState(this);
  var target = state.target;
  var kind = state.kind;
  var index = state.index++;
  if (!target || index >= target.length) {
    state.target = undefined;
    return { value: undefined, done: true };
  }
  if (kind == 'keys') return { value: index, done: false };
  if (kind == 'values') return { value: target[index], done: false };
  return { value: [index, target[index]], done: false };
}, 'values');

// argumentsList[@@iterator] is %ArrayProto_values%
// https://tc39.es/ecma262/#sec-createunmappedargumentsobject
// https://tc39.es/ecma262/#sec-createmappedargumentsobject
var values = Iterators.Arguments = Iterators.Array;

// https://tc39.es/ecma262/#sec-array.prototype-@@unscopables
addToUnscopables('keys');
addToUnscopables('values');
addToUnscopables('entries');

// V8 ~ Chrome 45- bug
if (!IS_PURE && DESCRIPTORS && values.name !== 'values') try {
  defineProperty(values, 'name', { value: 'values' });
} catch (error) { /* empty */ }


/***/ }),

/***/ 9600:
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

"use strict";

var $ = __webpack_require__(2109);
var uncurryThis = __webpack_require__(1702);
var IndexedObject = __webpack_require__(8361);
var toIndexedObject = __webpack_require__(5656);
var arrayMethodIsStrict = __webpack_require__(9341);

var un$Join = uncurryThis([].join);

var ES3_STRINGS = IndexedObject != Object;
var STRICT_METHOD = arrayMethodIsStrict('join', ',');

// `Array.prototype.join` method
// https://tc39.es/ecma262/#sec-array.prototype.join
$({ target: 'Array', proto: true, forced: ES3_STRINGS || !STRICT_METHOD }, {
  join: function join(separator) {
    return un$Join(toIndexedObject(this), separator === undefined ? ',' : separator);
  }
});


/***/ }),

/***/ 1249:
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

"use strict";

var $ = __webpack_require__(2109);
var $map = (__webpack_require__(2092).map);
var arrayMethodHasSpeciesSupport = __webpack_require__(1194);

var HAS_SPECIES_SUPPORT = arrayMethodHasSpeciesSupport('map');

// `Array.prototype.map` method
// https://tc39.es/ecma262/#sec-array.prototype.map
// with adding support of @@species
$({ target: 'Array', proto: true, forced: !HAS_SPECIES_SUPPORT }, {
  map: function map(callbackfn /* , thisArg */) {
    return $map(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
  }
});


/***/ }),

/***/ 7042:
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

"use strict";

var $ = __webpack_require__(2109);
var global = __webpack_require__(7854);
var isArray = __webpack_require__(3157);
var isConstructor = __webpack_require__(4411);
var isObject = __webpack_require__(111);
var toAbsoluteIndex = __webpack_require__(1400);
var lengthOfArrayLike = __webpack_require__(6244);
var toIndexedObject = __webpack_require__(5656);
var createProperty = __webpack_require__(6135);
var wellKnownSymbol = __webpack_require__(5112);
var arrayMethodHasSpeciesSupport = __webpack_require__(1194);
var un$Slice = __webpack_require__(206);

var HAS_SPECIES_SUPPORT = arrayMethodHasSpeciesSupport('slice');

var SPECIES = wellKnownSymbol('species');
var Array = global.Array;
var max = Math.max;

// `Array.prototype.slice` method
// https://tc39.es/ecma262/#sec-array.prototype.slice
// fallback for not array-like ES3 strings and DOM objects
$({ target: 'Array', proto: true, forced: !HAS_SPECIES_SUPPORT }, {
  slice: function slice(start, end) {
    var O = toIndexedObject(this);
    var length = lengthOfArrayLike(O);
    var k = toAbsoluteIndex(start, length);
    var fin = toAbsoluteIndex(end === undefined ? length : end, length);
    // inline `ArraySpeciesCreate` for usage native `Array#slice` where it's possible
    var Constructor, result, n;
    if (isArray(O)) {
      Constructor = O.constructor;
      // cross-realm fallback
      if (isConstructor(Constructor) && (Constructor === Array || isArray(Constructor.prototype))) {
        Constructor = undefined;
      } else if (isObject(Constructor)) {
        Constructor = Constructor[SPECIES];
        if (Constructor === null) Constructor = undefined;
      }
      if (Constructor === Array || Constructor === undefined) {
        return un$Slice(O, k, fin);
      }
    }
    result = new (Constructor === undefined ? Array : Constructor)(max(fin - k, 0));
    for (n = 0; k < fin; k++, n++) if (k in O) createProperty(result, n, O[k]);
    result.length = n;
    return result;
  }
});


/***/ }),

/***/ 2707:
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

"use strict";

var $ = __webpack_require__(2109);
var uncurryThis = __webpack_require__(1702);
var aCallable = __webpack_require__(9662);
var toObject = __webpack_require__(7908);
var lengthOfArrayLike = __webpack_require__(6244);
var toString = __webpack_require__(1340);
var fails = __webpack_require__(7293);
var internalSort = __webpack_require__(4362);
var arrayMethodIsStrict = __webpack_require__(9341);
var FF = __webpack_require__(8886);
var IE_OR_EDGE = __webpack_require__(256);
var V8 = __webpack_require__(7392);
var WEBKIT = __webpack_require__(8008);

var test = [];
var un$Sort = uncurryThis(test.sort);
var push = uncurryThis(test.push);

// IE8-
var FAILS_ON_UNDEFINED = fails(function () {
  test.sort(undefined);
});
// V8 bug
var FAILS_ON_NULL = fails(function () {
  test.sort(null);
});
// Old WebKit
var STRICT_METHOD = arrayMethodIsStrict('sort');

var STABLE_SORT = !fails(function () {
  // feature detection can be too slow, so check engines versions
  if (V8) return V8 < 70;
  if (FF && FF > 3) return;
  if (IE_OR_EDGE) return true;
  if (WEBKIT) return WEBKIT < 603;

  var result = '';
  var code, chr, value, index;

  // generate an array with more 512 elements (Chakra and old V8 fails only in this case)
  for (code = 65; code < 76; code++) {
    chr = String.fromCharCode(code);

    switch (code) {
      case 66: case 69: case 70: case 72: value = 3; break;
      case 68: case 71: value = 4; break;
      default: value = 2;
    }

    for (index = 0; index < 47; index++) {
      test.push({ k: chr + index, v: value });
    }
  }

  test.sort(function (a, b) { return b.v - a.v; });

  for (index = 0; index < test.length; index++) {
    chr = test[index].k.charAt(0);
    if (result.charAt(result.length - 1) !== chr) result += chr;
  }

  return result !== 'DGBEFHACIJK';
});

var FORCED = FAILS_ON_UNDEFINED || !FAILS_ON_NULL || !STRICT_METHOD || !STABLE_SORT;

var getSortCompare = function (comparefn) {
  return function (x, y) {
    if (y === undefined) return -1;
    if (x === undefined) return 1;
    if (comparefn !== undefined) return +comparefn(x, y) || 0;
    return toString(x) > toString(y) ? 1 : -1;
  };
};

// `Array.prototype.sort` method
// https://tc39.es/ecma262/#sec-array.prototype.sort
$({ target: 'Array', proto: true, forced: FORCED }, {
  sort: function sort(comparefn) {
    if (comparefn !== undefined) aCallable(comparefn);

    var array = toObject(this);

    if (STABLE_SORT) return comparefn === undefined ? un$Sort(array) : un$Sort(array, comparefn);

    var items = [];
    var arrayLength = lengthOfArrayLike(array);
    var itemsLength, index;

    for (index = 0; index < arrayLength; index++) {
      if (index in array) push(items, array[index]);
    }

    internalSort(items, getSortCompare(comparefn));

    itemsLength = items.length;
    index = 0;

    while (index < itemsLength) array[index] = items[index++];
    while (index < arrayLength) delete array[index++];

    return array;
  }
});


/***/ }),

/***/ 561:
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

"use strict";

var $ = __webpack_require__(2109);
var global = __webpack_require__(7854);
var toAbsoluteIndex = __webpack_require__(1400);
var toIntegerOrInfinity = __webpack_require__(9303);
var lengthOfArrayLike = __webpack_require__(6244);
var toObject = __webpack_require__(7908);
var arraySpeciesCreate = __webpack_require__(5417);
var createProperty = __webpack_require__(6135);
var arrayMethodHasSpeciesSupport = __webpack_require__(1194);

var HAS_SPECIES_SUPPORT = arrayMethodHasSpeciesSupport('splice');

var TypeError = global.TypeError;
var max = Math.max;
var min = Math.min;
var MAX_SAFE_INTEGER = 0x1FFFFFFFFFFFFF;
var MAXIMUM_ALLOWED_LENGTH_EXCEEDED = 'Maximum allowed length exceeded';

// `Array.prototype.splice` method
// https://tc39.es/ecma262/#sec-array.prototype.splice
// with adding support of @@species
$({ target: 'Array', proto: true, forced: !HAS_SPECIES_SUPPORT }, {
  splice: function splice(start, deleteCount /* , ...items */) {
    var O = toObject(this);
    var len = lengthOfArrayLike(O);
    var actualStart = toAbsoluteIndex(start, len);
    var argumentsLength = arguments.length;
    var insertCount, actualDeleteCount, A, k, from, to;
    if (argumentsLength === 0) {
      insertCount = actualDeleteCount = 0;
    } else if (argumentsLength === 1) {
      insertCount = 0;
      actualDeleteCount = len - actualStart;
    } else {
      insertCount = argumentsLength - 2;
      actualDeleteCount = min(max(toIntegerOrInfinity(deleteCount), 0), len - actualStart);
    }
    if (len + insertCount - actualDeleteCount > MAX_SAFE_INTEGER) {
      throw TypeError(MAXIMUM_ALLOWED_LENGTH_EXCEEDED);
    }
    A = arraySpeciesCreate(O, actualDeleteCount);
    for (k = 0; k < actualDeleteCount; k++) {
      from = actualStart + k;
      if (from in O) createProperty(A, k, O[from]);
    }
    A.length = actualDeleteCount;
    if (insertCount < actualDeleteCount) {
      for (k = actualStart; k < len - actualDeleteCount; k++) {
        from = k + actualDeleteCount;
        to = k + insertCount;
        if (from in O) O[to] = O[from];
        else delete O[to];
      }
      for (k = len; k > len - actualDeleteCount + insertCount; k--) delete O[k - 1];
    } else if (insertCount > actualDeleteCount) {
      for (k = len - actualDeleteCount; k > actualStart; k--) {
        from = k + actualDeleteCount - 1;
        to = k + insertCount - 1;
        if (from in O) O[to] = O[from];
        else delete O[to];
      }
    }
    for (k = 0; k < insertCount; k++) {
      O[k + actualStart] = arguments[k + 2];
    }
    O.length = len - actualDeleteCount + insertCount;
    return A;
  }
});


/***/ }),

/***/ 1703:
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

/* eslint-disable no-unused-vars -- required for functions `.length` */
var $ = __webpack_require__(2109);
var global = __webpack_require__(7854);
var apply = __webpack_require__(2104);
var wrapErrorConstructorWithCause = __webpack_require__(9191);

var WEB_ASSEMBLY = 'WebAssembly';
var WebAssembly = global[WEB_ASSEMBLY];

var FORCED = Error('e', { cause: 7 }).cause !== 7;

var exportGlobalErrorCauseWrapper = function (ERROR_NAME, wrapper) {
  var O = {};
  O[ERROR_NAME] = wrapErrorConstructorWithCause(ERROR_NAME, wrapper, FORCED);
  $({ global: true, constructor: true, arity: 1, forced: FORCED }, O);
};

var exportWebAssemblyErrorCauseWrapper = function (ERROR_NAME, wrapper) {
  if (WebAssembly && WebAssembly[ERROR_NAME]) {
    var O = {};
    O[ERROR_NAME] = wrapErrorConstructorWithCause(WEB_ASSEMBLY + '.' + ERROR_NAME, wrapper, FORCED);
    $({ target: WEB_ASSEMBLY, stat: true, constructor: true, arity: 1, forced: FORCED }, O);
  }
};

// https://github.com/tc39/proposal-error-cause
exportGlobalErrorCauseWrapper('Error', function (init) {
  return function Error(message) { return apply(init, this, arguments); };
});
exportGlobalErrorCauseWrapper('EvalError', function (init) {
  return function EvalError(message) { return apply(init, this, arguments); };
});
exportGlobalErrorCauseWrapper('RangeError', function (init) {
  return function RangeError(message) { return apply(init, this, arguments); };
});
exportGlobalErrorCauseWrapper('ReferenceError', function (init) {
  return function ReferenceError(message) { return apply(init, this, arguments); };
});
exportGlobalErrorCauseWrapper('SyntaxError', function (init) {
  return function SyntaxError(message) { return apply(init, this, arguments); };
});
exportGlobalErrorCauseWrapper('TypeError', function (init) {
  return function TypeError(message) { return apply(init, this, arguments); };
});
exportGlobalErrorCauseWrapper('URIError', function (init) {
  return function URIError(message) { return apply(init, this, arguments); };
});
exportWebAssemblyErrorCauseWrapper('CompileError', function (init) {
  return function CompileError(message) { return apply(init, this, arguments); };
});
exportWebAssemblyErrorCauseWrapper('LinkError', function (init) {
  return function LinkError(message) { return apply(init, this, arguments); };
});
exportWebAssemblyErrorCauseWrapper('RuntimeError', function (init) {
  return function RuntimeError(message) { return apply(init, this, arguments); };
});


/***/ }),

/***/ 8309:
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

var DESCRIPTORS = __webpack_require__(9781);
var FUNCTION_NAME_EXISTS = (__webpack_require__(6530).EXISTS);
var uncurryThis = __webpack_require__(1702);
var defineProperty = (__webpack_require__(3070).f);

var FunctionPrototype = Function.prototype;
var functionToString = uncurryThis(FunctionPrototype.toString);
var nameRE = /function\b(?:\s|\/\*[\S\s]*?\*\/|\/\/[^\n\r]*[\n\r]+)*([^\s(/]*)/;
var regExpExec = uncurryThis(nameRE.exec);
var NAME = 'name';

// Function instances `.name` property
// https://tc39.es/ecma262/#sec-function-instances-name
if (DESCRIPTORS && !FUNCTION_NAME_EXISTS) {
  defineProperty(FunctionPrototype, NAME, {
    configurable: true,
    get: function () {
      try {
        return regExpExec(nameRE, functionToString(this))[1];
      } catch (error) {
        return '';
      }
    }
  });
}


/***/ }),

/***/ 5837:
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

var $ = __webpack_require__(2109);
var global = __webpack_require__(7854);

// `globalThis` object
// https://tc39.es/ecma262/#sec-globalthis
$({ global: true }, {
  globalThis: global
});


/***/ }),

/***/ 8862:
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

var $ = __webpack_require__(2109);
var getBuiltIn = __webpack_require__(5005);
var apply = __webpack_require__(2104);
var call = __webpack_require__(6916);
var uncurryThis = __webpack_require__(1702);
var fails = __webpack_require__(7293);
var isArray = __webpack_require__(3157);
var isCallable = __webpack_require__(614);
var isObject = __webpack_require__(111);
var isSymbol = __webpack_require__(2190);
var arraySlice = __webpack_require__(206);
var NATIVE_SYMBOL = __webpack_require__(133);

var $stringify = getBuiltIn('JSON', 'stringify');
var exec = uncurryThis(/./.exec);
var charAt = uncurryThis(''.charAt);
var charCodeAt = uncurryThis(''.charCodeAt);
var replace = uncurryThis(''.replace);
var numberToString = uncurryThis(1.0.toString);

var tester = /[\uD800-\uDFFF]/g;
var low = /^[\uD800-\uDBFF]$/;
var hi = /^[\uDC00-\uDFFF]$/;

var WRONG_SYMBOLS_CONVERSION = !NATIVE_SYMBOL || fails(function () {
  var symbol = getBuiltIn('Symbol')();
  // MS Edge converts symbol values to JSON as {}
  return $stringify([symbol]) != '[null]'
    // WebKit converts symbol values to JSON as null
    || $stringify({ a: symbol }) != '{}'
    // V8 throws on boxed symbols
    || $stringify(Object(symbol)) != '{}';
});

// https://github.com/tc39/proposal-well-formed-stringify
var ILL_FORMED_UNICODE = fails(function () {
  return $stringify('\uDF06\uD834') !== '"\\udf06\\ud834"'
    || $stringify('\uDEAD') !== '"\\udead"';
});

var stringifyWithSymbolsFix = function (it, replacer) {
  var args = arraySlice(arguments);
  var $replacer = replacer;
  if (!isObject(replacer) && it === undefined || isSymbol(it)) return; // IE8 returns string on undefined
  if (!isArray(replacer)) replacer = function (key, value) {
    if (isCallable($replacer)) value = call($replacer, this, key, value);
    if (!isSymbol(value)) return value;
  };
  args[1] = replacer;
  return apply($stringify, null, args);
};

var fixIllFormed = function (match, offset, string) {
  var prev = charAt(string, offset - 1);
  var next = charAt(string, offset + 1);
  if ((exec(low, match) && !exec(hi, next)) || (exec(hi, match) && !exec(low, prev))) {
    return '\\u' + numberToString(charCodeAt(match, 0), 16);
  } return match;
};

if ($stringify) {
  // `JSON.stringify` method
  // https://tc39.es/ecma262/#sec-json.stringify
  $({ target: 'JSON', stat: true, arity: 3, forced: WRONG_SYMBOLS_CONVERSION || ILL_FORMED_UNICODE }, {
    // eslint-disable-next-line no-unused-vars -- required for `.length`
    stringify: function stringify(it, replacer, space) {
      var args = arraySlice(arguments);
      var result = apply(WRONG_SYMBOLS_CONVERSION ? stringifyWithSymbolsFix : $stringify, null, args);
      return ILL_FORMED_UNICODE && typeof result == 'string' ? replace(result, tester, fixIllFormed) : result;
    }
  });
}


/***/ }),

/***/ 3689:
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

var $ = __webpack_require__(2109);

var ceil = Math.ceil;
var floor = Math.floor;

// `Math.trunc` method
// https://tc39.es/ecma262/#sec-math.trunc
$({ target: 'Math', stat: true }, {
  trunc: function trunc(it) {
    return (it > 0 ? floor : ceil)(it);
  }
});


/***/ }),

/***/ 9653:
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

"use strict";

var DESCRIPTORS = __webpack_require__(9781);
var global = __webpack_require__(7854);
var uncurryThis = __webpack_require__(1702);
var isForced = __webpack_require__(4705);
var defineBuiltIn = __webpack_require__(8052);
var hasOwn = __webpack_require__(2597);
var inheritIfRequired = __webpack_require__(9587);
var isPrototypeOf = __webpack_require__(7976);
var isSymbol = __webpack_require__(2190);
var toPrimitive = __webpack_require__(7593);
var fails = __webpack_require__(7293);
var getOwnPropertyNames = (__webpack_require__(8006).f);
var getOwnPropertyDescriptor = (__webpack_require__(1236).f);
var defineProperty = (__webpack_require__(3070).f);
var thisNumberValue = __webpack_require__(863);
var trim = (__webpack_require__(3111).trim);

var NUMBER = 'Number';
var NativeNumber = global[NUMBER];
var NumberPrototype = NativeNumber.prototype;
var TypeError = global.TypeError;
var arraySlice = uncurryThis(''.slice);
var charCodeAt = uncurryThis(''.charCodeAt);

// `ToNumeric` abstract operation
// https://tc39.es/ecma262/#sec-tonumeric
var toNumeric = function (value) {
  var primValue = toPrimitive(value, 'number');
  return typeof primValue == 'bigint' ? primValue : toNumber(primValue);
};

// `ToNumber` abstract operation
// https://tc39.es/ecma262/#sec-tonumber
var toNumber = function (argument) {
  var it = toPrimitive(argument, 'number');
  var first, third, radix, maxCode, digits, length, index, code;
  if (isSymbol(it)) throw TypeError('Cannot convert a Symbol value to a number');
  if (typeof it == 'string' && it.length > 2) {
    it = trim(it);
    first = charCodeAt(it, 0);
    if (first === 43 || first === 45) {
      third = charCodeAt(it, 2);
      if (third === 88 || third === 120) return NaN; // Number('+0x1') should be NaN, old V8 fix
    } else if (first === 48) {
      switch (charCodeAt(it, 1)) {
        case 66: case 98: radix = 2; maxCode = 49; break; // fast equal of /^0b[01]+$/i
        case 79: case 111: radix = 8; maxCode = 55; break; // fast equal of /^0o[0-7]+$/i
        default: return +it;
      }
      digits = arraySlice(it, 2);
      length = digits.length;
      for (index = 0; index < length; index++) {
        code = charCodeAt(digits, index);
        // parseInt parses a string to a first unavailable symbol
        // but ToNumber should return NaN if a string contains unavailable symbols
        if (code < 48 || code > maxCode) return NaN;
      } return parseInt(digits, radix);
    }
  } return +it;
};

// `Number` constructor
// https://tc39.es/ecma262/#sec-number-constructor
if (isForced(NUMBER, !NativeNumber(' 0o1') || !NativeNumber('0b1') || NativeNumber('+0x1'))) {
  var NumberWrapper = function Number(value) {
    var n = arguments.length < 1 ? 0 : NativeNumber(toNumeric(value));
    var dummy = this;
    // check on 1..constructor(foo) case
    return isPrototypeOf(NumberPrototype, dummy) && fails(function () { thisNumberValue(dummy); })
      ? inheritIfRequired(Object(n), dummy, NumberWrapper) : n;
  };
  for (var keys = DESCRIPTORS ? getOwnPropertyNames(NativeNumber) : (
    // ES3:
    'MAX_VALUE,MIN_VALUE,NaN,NEGATIVE_INFINITY,POSITIVE_INFINITY,' +
    // ES2015 (in case, if modules with ES2015 Number statics required before):
    'EPSILON,MAX_SAFE_INTEGER,MIN_SAFE_INTEGER,isFinite,isInteger,isNaN,isSafeInteger,parseFloat,parseInt,' +
    // ESNext
    'fromString,range'
  ).split(','), j = 0, key; keys.length > j; j++) {
    if (hasOwn(NativeNumber, key = keys[j]) && !hasOwn(NumberWrapper, key)) {
      defineProperty(NumberWrapper, key, getOwnPropertyDescriptor(NativeNumber, key));
    }
  }
  NumberWrapper.prototype = NumberPrototype;
  NumberPrototype.constructor = NumberWrapper;
  defineBuiltIn(global, NUMBER, NumberWrapper, { constructor: true });
}


/***/ }),

/***/ 9601:
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

var $ = __webpack_require__(2109);
var assign = __webpack_require__(1574);

// `Object.assign` method
// https://tc39.es/ecma262/#sec-object.assign
// eslint-disable-next-line es-x/no-object-assign -- required for testing
$({ target: 'Object', stat: true, arity: 2, forced: Object.assign !== assign }, {
  assign: assign
});


/***/ }),

/***/ 5003:
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

var $ = __webpack_require__(2109);
var fails = __webpack_require__(7293);
var toIndexedObject = __webpack_require__(5656);
var nativeGetOwnPropertyDescriptor = (__webpack_require__(1236).f);
var DESCRIPTORS = __webpack_require__(9781);

var FAILS_ON_PRIMITIVES = fails(function () { nativeGetOwnPropertyDescriptor(1); });
var FORCED = !DESCRIPTORS || FAILS_ON_PRIMITIVES;

// `Object.getOwnPropertyDescriptor` method
// https://tc39.es/ecma262/#sec-object.getownpropertydescriptor
$({ target: 'Object', stat: true, forced: FORCED, sham: !DESCRIPTORS }, {
  getOwnPropertyDescriptor: function getOwnPropertyDescriptor(it, key) {
    return nativeGetOwnPropertyDescriptor(toIndexedObject(it), key);
  }
});


/***/ }),

/***/ 9660:
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

var $ = __webpack_require__(2109);
var NATIVE_SYMBOL = __webpack_require__(133);
var fails = __webpack_require__(7293);
var getOwnPropertySymbolsModule = __webpack_require__(5181);
var toObject = __webpack_require__(7908);

// V8 ~ Chrome 38 and 39 `Object.getOwnPropertySymbols` fails on primitives
// https://bugs.chromium.org/p/v8/issues/detail?id=3443
var FORCED = !NATIVE_SYMBOL || fails(function () { getOwnPropertySymbolsModule.f(1); });

// `Object.getOwnPropertySymbols` method
// https://tc39.es/ecma262/#sec-object.getownpropertysymbols
$({ target: 'Object', stat: true, forced: FORCED }, {
  getOwnPropertySymbols: function getOwnPropertySymbols(it) {
    var $getOwnPropertySymbols = getOwnPropertySymbolsModule.f;
    return $getOwnPropertySymbols ? $getOwnPropertySymbols(toObject(it)) : [];
  }
});


/***/ }),

/***/ 1539:
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

var TO_STRING_TAG_SUPPORT = __webpack_require__(1694);
var defineBuiltIn = __webpack_require__(8052);
var toString = __webpack_require__(288);

// `Object.prototype.toString` method
// https://tc39.es/ecma262/#sec-object.prototype.tostring
if (!TO_STRING_TAG_SUPPORT) {
  defineBuiltIn(Object.prototype, 'toString', toString, { unsafe: true });
}


/***/ }),

/***/ 4603:
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

var DESCRIPTORS = __webpack_require__(9781);
var global = __webpack_require__(7854);
var uncurryThis = __webpack_require__(1702);
var isForced = __webpack_require__(4705);
var inheritIfRequired = __webpack_require__(9587);
var createNonEnumerableProperty = __webpack_require__(8880);
var getOwnPropertyNames = (__webpack_require__(8006).f);
var isPrototypeOf = __webpack_require__(7976);
var isRegExp = __webpack_require__(7850);
var toString = __webpack_require__(1340);
var getRegExpFlags = __webpack_require__(4706);
var stickyHelpers = __webpack_require__(2999);
var proxyAccessor = __webpack_require__(2626);
var defineBuiltIn = __webpack_require__(8052);
var fails = __webpack_require__(7293);
var hasOwn = __webpack_require__(2597);
var enforceInternalState = (__webpack_require__(9909).enforce);
var setSpecies = __webpack_require__(6340);
var wellKnownSymbol = __webpack_require__(5112);
var UNSUPPORTED_DOT_ALL = __webpack_require__(9441);
var UNSUPPORTED_NCG = __webpack_require__(7168);

var MATCH = wellKnownSymbol('match');
var NativeRegExp = global.RegExp;
var RegExpPrototype = NativeRegExp.prototype;
var SyntaxError = global.SyntaxError;
var exec = uncurryThis(RegExpPrototype.exec);
var charAt = uncurryThis(''.charAt);
var replace = uncurryThis(''.replace);
var stringIndexOf = uncurryThis(''.indexOf);
var stringSlice = uncurryThis(''.slice);
// TODO: Use only propper RegExpIdentifierName
var IS_NCG = /^\?<[^\s\d!#%&*+<=>@^][^\s!#%&*+<=>@^]*>/;
var re1 = /a/g;
var re2 = /a/g;

// "new" should create a new object, old webkit bug
var CORRECT_NEW = new NativeRegExp(re1) !== re1;

var MISSED_STICKY = stickyHelpers.MISSED_STICKY;
var UNSUPPORTED_Y = stickyHelpers.UNSUPPORTED_Y;

var BASE_FORCED = DESCRIPTORS &&
  (!CORRECT_NEW || MISSED_STICKY || UNSUPPORTED_DOT_ALL || UNSUPPORTED_NCG || fails(function () {
    re2[MATCH] = false;
    // RegExp constructor can alter flags and IsRegExp works correct with @@match
    return NativeRegExp(re1) != re1 || NativeRegExp(re2) == re2 || NativeRegExp(re1, 'i') != '/a/i';
  }));

var handleDotAll = function (string) {
  var length = string.length;
  var index = 0;
  var result = '';
  var brackets = false;
  var chr;
  for (; index <= length; index++) {
    chr = charAt(string, index);
    if (chr === '\\') {
      result += chr + charAt(string, ++index);
      continue;
    }
    if (!brackets && chr === '.') {
      result += '[\\s\\S]';
    } else {
      if (chr === '[') {
        brackets = true;
      } else if (chr === ']') {
        brackets = false;
      } result += chr;
    }
  } return result;
};

var handleNCG = function (string) {
  var length = string.length;
  var index = 0;
  var result = '';
  var named = [];
  var names = {};
  var brackets = false;
  var ncg = false;
  var groupid = 0;
  var groupname = '';
  var chr;
  for (; index <= length; index++) {
    chr = charAt(string, index);
    if (chr === '\\') {
      chr = chr + charAt(string, ++index);
    } else if (chr === ']') {
      brackets = false;
    } else if (!brackets) switch (true) {
      case chr === '[':
        brackets = true;
        break;
      case chr === '(':
        if (exec(IS_NCG, stringSlice(string, index + 1))) {
          index += 2;
          ncg = true;
        }
        result += chr;
        groupid++;
        continue;
      case chr === '>' && ncg:
        if (groupname === '' || hasOwn(names, groupname)) {
          throw new SyntaxError('Invalid capture group name');
        }
        names[groupname] = true;
        named[named.length] = [groupname, groupid];
        ncg = false;
        groupname = '';
        continue;
    }
    if (ncg) groupname += chr;
    else result += chr;
  } return [result, named];
};

// `RegExp` constructor
// https://tc39.es/ecma262/#sec-regexp-constructor
if (isForced('RegExp', BASE_FORCED)) {
  var RegExpWrapper = function RegExp(pattern, flags) {
    var thisIsRegExp = isPrototypeOf(RegExpPrototype, this);
    var patternIsRegExp = isRegExp(pattern);
    var flagsAreUndefined = flags === undefined;
    var groups = [];
    var rawPattern = pattern;
    var rawFlags, dotAll, sticky, handled, result, state;

    if (!thisIsRegExp && patternIsRegExp && flagsAreUndefined && pattern.constructor === RegExpWrapper) {
      return pattern;
    }

    if (patternIsRegExp || isPrototypeOf(RegExpPrototype, pattern)) {
      pattern = pattern.source;
      if (flagsAreUndefined) flags = getRegExpFlags(rawPattern);
    }

    pattern = pattern === undefined ? '' : toString(pattern);
    flags = flags === undefined ? '' : toString(flags);
    rawPattern = pattern;

    if (UNSUPPORTED_DOT_ALL && 'dotAll' in re1) {
      dotAll = !!flags && stringIndexOf(flags, 's') > -1;
      if (dotAll) flags = replace(flags, /s/g, '');
    }

    rawFlags = flags;

    if (MISSED_STICKY && 'sticky' in re1) {
      sticky = !!flags && stringIndexOf(flags, 'y') > -1;
      if (sticky && UNSUPPORTED_Y) flags = replace(flags, /y/g, '');
    }

    if (UNSUPPORTED_NCG) {
      handled = handleNCG(pattern);
      pattern = handled[0];
      groups = handled[1];
    }

    result = inheritIfRequired(NativeRegExp(pattern, flags), thisIsRegExp ? this : RegExpPrototype, RegExpWrapper);

    if (dotAll || sticky || groups.length) {
      state = enforceInternalState(result);
      if (dotAll) {
        state.dotAll = true;
        state.raw = RegExpWrapper(handleDotAll(pattern), rawFlags);
      }
      if (sticky) state.sticky = true;
      if (groups.length) state.groups = groups;
    }

    if (pattern !== rawPattern) try {
      // fails in old engines, but we have no alternatives for unsupported regex syntax
      createNonEnumerableProperty(result, 'source', rawPattern === '' ? '(?:)' : rawPattern);
    } catch (error) { /* empty */ }

    return result;
  };

  for (var keys = getOwnPropertyNames(NativeRegExp), index = 0; keys.length > index;) {
    proxyAccessor(RegExpWrapper, NativeRegExp, keys[index++]);
  }

  RegExpPrototype.constructor = RegExpWrapper;
  RegExpWrapper.prototype = RegExpPrototype;
  defineBuiltIn(global, 'RegExp', RegExpWrapper, { constructor: true });
}

// https://tc39.es/ecma262/#sec-get-regexp-@@species
setSpecies('RegExp');


/***/ }),

/***/ 8450:
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

var global = __webpack_require__(7854);
var DESCRIPTORS = __webpack_require__(9781);
var UNSUPPORTED_DOT_ALL = __webpack_require__(9441);
var classof = __webpack_require__(4326);
var defineBuiltInAccessor = __webpack_require__(7045);
var getInternalState = (__webpack_require__(9909).get);

var RegExpPrototype = RegExp.prototype;
var TypeError = global.TypeError;

// `RegExp.prototype.dotAll` getter
// https://tc39.es/ecma262/#sec-get-regexp.prototype.dotall
if (DESCRIPTORS && UNSUPPORTED_DOT_ALL) {
  defineBuiltInAccessor(RegExpPrototype, 'dotAll', {
    configurable: true,
    get: function dotAll() {
      if (this === RegExpPrototype) return undefined;
      // We can't use InternalStateModule.getterFor because
      // we don't add metadata for regexps created by a literal.
      if (classof(this) === 'RegExp') {
        return !!getInternalState(this).dotAll;
      }
      throw TypeError('Incompatible receiver, RegExp required');
    }
  });
}


/***/ }),

/***/ 4916:
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

"use strict";

var $ = __webpack_require__(2109);
var exec = __webpack_require__(2261);

// `RegExp.prototype.exec` method
// https://tc39.es/ecma262/#sec-regexp.prototype.exec
$({ target: 'RegExp', proto: true, forced: /./.exec !== exec }, {
  exec: exec
});


/***/ }),

/***/ 8386:
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

var global = __webpack_require__(7854);
var DESCRIPTORS = __webpack_require__(9781);
var MISSED_STICKY = (__webpack_require__(2999).MISSED_STICKY);
var classof = __webpack_require__(4326);
var defineBuiltInAccessor = __webpack_require__(7045);
var getInternalState = (__webpack_require__(9909).get);

var RegExpPrototype = RegExp.prototype;
var TypeError = global.TypeError;

// `RegExp.prototype.sticky` getter
// https://tc39.es/ecma262/#sec-get-regexp.prototype.sticky
if (DESCRIPTORS && MISSED_STICKY) {
  defineBuiltInAccessor(RegExpPrototype, 'sticky', {
    configurable: true,
    get: function sticky() {
      if (this === RegExpPrototype) return undefined;
      // We can't use InternalStateModule.getterFor because
      // we don't add metadata for regexps created by a literal.
      if (classof(this) === 'RegExp') {
        return !!getInternalState(this).sticky;
      }
      throw TypeError('Incompatible receiver, RegExp required');
    }
  });
}


/***/ }),

/***/ 7601:
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

"use strict";

// TODO: Remove from `core-js@4` since it's moved to entry points
__webpack_require__(4916);
var $ = __webpack_require__(2109);
var global = __webpack_require__(7854);
var call = __webpack_require__(6916);
var uncurryThis = __webpack_require__(1702);
var isCallable = __webpack_require__(614);
var isObject = __webpack_require__(111);

var DELEGATES_TO_EXEC = function () {
  var execCalled = false;
  var re = /[ac]/;
  re.exec = function () {
    execCalled = true;
    return /./.exec.apply(this, arguments);
  };
  return re.test('abc') === true && execCalled;
}();

var Error = global.Error;
var un$Test = uncurryThis(/./.test);

// `RegExp.prototype.test` method
// https://tc39.es/ecma262/#sec-regexp.prototype.test
$({ target: 'RegExp', proto: true, forced: !DELEGATES_TO_EXEC }, {
  test: function (str) {
    var exec = this.exec;
    if (!isCallable(exec)) return un$Test(this, str);
    var result = call(exec, this, str);
    if (result !== null && !isObject(result)) {
      throw new Error('RegExp exec method returned something other than an Object or null');
    }
    return !!result;
  }
});


/***/ }),

/***/ 9714:
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

"use strict";

var PROPER_FUNCTION_NAME = (__webpack_require__(6530).PROPER);
var defineBuiltIn = __webpack_require__(8052);
var anObject = __webpack_require__(9670);
var $toString = __webpack_require__(1340);
var fails = __webpack_require__(7293);
var getRegExpFlags = __webpack_require__(4706);

var TO_STRING = 'toString';
var RegExpPrototype = RegExp.prototype;
var n$ToString = RegExpPrototype[TO_STRING];

var NOT_GENERIC = fails(function () { return n$ToString.call({ source: 'a', flags: 'b' }) != '/a/b'; });
// FF44- RegExp#toString has a wrong name
var INCORRECT_NAME = PROPER_FUNCTION_NAME && n$ToString.name != TO_STRING;

// `RegExp.prototype.toString` method
// https://tc39.es/ecma262/#sec-regexp.prototype.tostring
if (NOT_GENERIC || INCORRECT_NAME) {
  defineBuiltIn(RegExp.prototype, TO_STRING, function toString() {
    var R = anObject(this);
    var pattern = $toString(R.source);
    var flags = $toString(getRegExpFlags(R));
    return '/' + pattern + '/' + flags;
  }, { unsafe: true });
}


/***/ }),

/***/ 7227:
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

"use strict";

var collection = __webpack_require__(7710);
var collectionStrong = __webpack_require__(5631);

// `Set` constructor
// https://tc39.es/ecma262/#sec-set-objects
collection('Set', function (init) {
  return function Set() { return init(this, arguments.length ? arguments[0] : undefined); };
}, collectionStrong);


/***/ }),

/***/ 189:
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

// TODO: Remove this module from `core-js@4` since it's replaced to module below
__webpack_require__(7227);


/***/ }),

/***/ 2023:
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

"use strict";

var $ = __webpack_require__(2109);
var uncurryThis = __webpack_require__(1702);
var notARegExp = __webpack_require__(3929);
var requireObjectCoercible = __webpack_require__(4488);
var toString = __webpack_require__(1340);
var correctIsRegExpLogic = __webpack_require__(4964);

var stringIndexOf = uncurryThis(''.indexOf);

// `String.prototype.includes` method
// https://tc39.es/ecma262/#sec-string.prototype.includes
$({ target: 'String', proto: true, forced: !correctIsRegExpLogic('includes') }, {
  includes: function includes(searchString /* , position = 0 */) {
    return !!~stringIndexOf(
      toString(requireObjectCoercible(this)),
      toString(notARegExp(searchString)),
      arguments.length > 1 ? arguments[1] : undefined
    );
  }
});


/***/ }),

/***/ 8783:
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

"use strict";

var charAt = (__webpack_require__(8710).charAt);
var toString = __webpack_require__(1340);
var InternalStateModule = __webpack_require__(9909);
var defineIterator = __webpack_require__(654);

var STRING_ITERATOR = 'String Iterator';
var setInternalState = InternalStateModule.set;
var getInternalState = InternalStateModule.getterFor(STRING_ITERATOR);

// `String.prototype[@@iterator]` method
// https://tc39.es/ecma262/#sec-string.prototype-@@iterator
defineIterator(String, 'String', function (iterated) {
  setInternalState(this, {
    type: STRING_ITERATOR,
    string: toString(iterated),
    index: 0
  });
// `%StringIteratorPrototype%.next` method
// https://tc39.es/ecma262/#sec-%stringiteratorprototype%.next
}, function next() {
  var state = getInternalState(this);
  var string = state.string;
  var index = state.index;
  var point;
  if (index >= string.length) return { value: undefined, done: true };
  point = charAt(string, index);
  state.index += point.length;
  return { value: point, done: false };
});


/***/ }),

/***/ 5306:
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

"use strict";

var apply = __webpack_require__(2104);
var call = __webpack_require__(6916);
var uncurryThis = __webpack_require__(1702);
var fixRegExpWellKnownSymbolLogic = __webpack_require__(7007);
var fails = __webpack_require__(7293);
var anObject = __webpack_require__(9670);
var isCallable = __webpack_require__(614);
var toIntegerOrInfinity = __webpack_require__(9303);
var toLength = __webpack_require__(7466);
var toString = __webpack_require__(1340);
var requireObjectCoercible = __webpack_require__(4488);
var advanceStringIndex = __webpack_require__(1530);
var getMethod = __webpack_require__(8173);
var getSubstitution = __webpack_require__(647);
var regExpExec = __webpack_require__(7651);
var wellKnownSymbol = __webpack_require__(5112);

var REPLACE = wellKnownSymbol('replace');
var max = Math.max;
var min = Math.min;
var concat = uncurryThis([].concat);
var push = uncurryThis([].push);
var stringIndexOf = uncurryThis(''.indexOf);
var stringSlice = uncurryThis(''.slice);

var maybeToString = function (it) {
  return it === undefined ? it : String(it);
};

// IE <= 11 replaces $0 with the whole match, as if it was $&
// https://stackoverflow.com/questions/6024666/getting-ie-to-replace-a-regex-with-the-literal-string-0
var REPLACE_KEEPS_$0 = (function () {
  // eslint-disable-next-line regexp/prefer-escape-replacement-dollar-char -- required for testing
  return 'a'.replace(/./, '$0') === '$0';
})();

// Safari <= 13.0.3(?) substitutes nth capture where n>m with an empty string
var REGEXP_REPLACE_SUBSTITUTES_UNDEFINED_CAPTURE = (function () {
  if (/./[REPLACE]) {
    return /./[REPLACE]('a', '$0') === '';
  }
  return false;
})();

var REPLACE_SUPPORTS_NAMED_GROUPS = !fails(function () {
  var re = /./;
  re.exec = function () {
    var result = [];
    result.groups = { a: '7' };
    return result;
  };
  // eslint-disable-next-line regexp/no-useless-dollar-replacements -- false positive
  return ''.replace(re, '$<a>') !== '7';
});

// @@replace logic
fixRegExpWellKnownSymbolLogic('replace', function (_, nativeReplace, maybeCallNative) {
  var UNSAFE_SUBSTITUTE = REGEXP_REPLACE_SUBSTITUTES_UNDEFINED_CAPTURE ? '$' : '$0';

  return [
    // `String.prototype.replace` method
    // https://tc39.es/ecma262/#sec-string.prototype.replace
    function replace(searchValue, replaceValue) {
      var O = requireObjectCoercible(this);
      var replacer = searchValue == undefined ? undefined : getMethod(searchValue, REPLACE);
      return replacer
        ? call(replacer, searchValue, O, replaceValue)
        : call(nativeReplace, toString(O), searchValue, replaceValue);
    },
    // `RegExp.prototype[@@replace]` method
    // https://tc39.es/ecma262/#sec-regexp.prototype-@@replace
    function (string, replaceValue) {
      var rx = anObject(this);
      var S = toString(string);

      if (
        typeof replaceValue == 'string' &&
        stringIndexOf(replaceValue, UNSAFE_SUBSTITUTE) === -1 &&
        stringIndexOf(replaceValue, '$<') === -1
      ) {
        var res = maybeCallNative(nativeReplace, rx, S, replaceValue);
        if (res.done) return res.value;
      }

      var functionalReplace = isCallable(replaceValue);
      if (!functionalReplace) replaceValue = toString(replaceValue);

      var global = rx.global;
      if (global) {
        var fullUnicode = rx.unicode;
        rx.lastIndex = 0;
      }
      var results = [];
      while (true) {
        var result = regExpExec(rx, S);
        if (result === null) break;

        push(results, result);
        if (!global) break;

        var matchStr = toString(result[0]);
        if (matchStr === '') rx.lastIndex = advanceStringIndex(S, toLength(rx.lastIndex), fullUnicode);
      }

      var accumulatedResult = '';
      var nextSourcePosition = 0;
      for (var i = 0; i < results.length; i++) {
        result = results[i];

        var matched = toString(result[0]);
        var position = max(min(toIntegerOrInfinity(result.index), S.length), 0);
        var captures = [];
        // NOTE: This is equivalent to
        //   captures = result.slice(1).map(maybeToString)
        // but for some reason `nativeSlice.call(result, 1, result.length)` (called in
        // the slice polyfill when slicing native arrays) "doesn't work" in safari 9 and
        // causes a crash (https://pastebin.com/N21QzeQA) when trying to debug it.
        for (var j = 1; j < result.length; j++) push(captures, maybeToString(result[j]));
        var namedCaptures = result.groups;
        if (functionalReplace) {
          var replacerArgs = concat([matched], captures, position, S);
          if (namedCaptures !== undefined) push(replacerArgs, namedCaptures);
          var replacement = toString(apply(replaceValue, undefined, replacerArgs));
        } else {
          replacement = getSubstitution(matched, S, position, captures, namedCaptures, replaceValue);
        }
        if (position >= nextSourcePosition) {
          accumulatedResult += stringSlice(S, nextSourcePosition, position) + replacement;
          nextSourcePosition = position + matched.length;
        }
      }
      return accumulatedResult + stringSlice(S, nextSourcePosition);
    }
  ];
}, !REPLACE_SUPPORTS_NAMED_GROUPS || !REPLACE_KEEPS_$0 || REGEXP_REPLACE_SUBSTITUTES_UNDEFINED_CAPTURE);


/***/ }),

/***/ 3123:
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

"use strict";

var apply = __webpack_require__(2104);
var call = __webpack_require__(6916);
var uncurryThis = __webpack_require__(1702);
var fixRegExpWellKnownSymbolLogic = __webpack_require__(7007);
var isRegExp = __webpack_require__(7850);
var anObject = __webpack_require__(9670);
var requireObjectCoercible = __webpack_require__(4488);
var speciesConstructor = __webpack_require__(6707);
var advanceStringIndex = __webpack_require__(1530);
var toLength = __webpack_require__(7466);
var toString = __webpack_require__(1340);
var getMethod = __webpack_require__(8173);
var arraySlice = __webpack_require__(1589);
var callRegExpExec = __webpack_require__(7651);
var regexpExec = __webpack_require__(2261);
var stickyHelpers = __webpack_require__(2999);
var fails = __webpack_require__(7293);

var UNSUPPORTED_Y = stickyHelpers.UNSUPPORTED_Y;
var MAX_UINT32 = 0xFFFFFFFF;
var min = Math.min;
var $push = [].push;
var exec = uncurryThis(/./.exec);
var push = uncurryThis($push);
var stringSlice = uncurryThis(''.slice);

// Chrome 51 has a buggy "split" implementation when RegExp#exec !== nativeExec
// Weex JS has frozen built-in prototypes, so use try / catch wrapper
var SPLIT_WORKS_WITH_OVERWRITTEN_EXEC = !fails(function () {
  // eslint-disable-next-line regexp/no-empty-group -- required for testing
  var re = /(?:)/;
  var originalExec = re.exec;
  re.exec = function () { return originalExec.apply(this, arguments); };
  var result = 'ab'.split(re);
  return result.length !== 2 || result[0] !== 'a' || result[1] !== 'b';
});

// @@split logic
fixRegExpWellKnownSymbolLogic('split', function (SPLIT, nativeSplit, maybeCallNative) {
  var internalSplit;
  if (
    'abbc'.split(/(b)*/)[1] == 'c' ||
    // eslint-disable-next-line regexp/no-empty-group -- required for testing
    'test'.split(/(?:)/, -1).length != 4 ||
    'ab'.split(/(?:ab)*/).length != 2 ||
    '.'.split(/(.?)(.?)/).length != 4 ||
    // eslint-disable-next-line regexp/no-empty-capturing-group, regexp/no-empty-group -- required for testing
    '.'.split(/()()/).length > 1 ||
    ''.split(/.?/).length
  ) {
    // based on es5-shim implementation, need to rework it
    internalSplit = function (separator, limit) {
      var string = toString(requireObjectCoercible(this));
      var lim = limit === undefined ? MAX_UINT32 : limit >>> 0;
      if (lim === 0) return [];
      if (separator === undefined) return [string];
      // If `separator` is not a regex, use native split
      if (!isRegExp(separator)) {
        return call(nativeSplit, string, separator, lim);
      }
      var output = [];
      var flags = (separator.ignoreCase ? 'i' : '') +
                  (separator.multiline ? 'm' : '') +
                  (separator.unicode ? 'u' : '') +
                  (separator.sticky ? 'y' : '');
      var lastLastIndex = 0;
      // Make `global` and avoid `lastIndex` issues by working with a copy
      var separatorCopy = new RegExp(separator.source, flags + 'g');
      var match, lastIndex, lastLength;
      while (match = call(regexpExec, separatorCopy, string)) {
        lastIndex = separatorCopy.lastIndex;
        if (lastIndex > lastLastIndex) {
          push(output, stringSlice(string, lastLastIndex, match.index));
          if (match.length > 1 && match.index < string.length) apply($push, output, arraySlice(match, 1));
          lastLength = match[0].length;
          lastLastIndex = lastIndex;
          if (output.length >= lim) break;
        }
        if (separatorCopy.lastIndex === match.index) separatorCopy.lastIndex++; // Avoid an infinite loop
      }
      if (lastLastIndex === string.length) {
        if (lastLength || !exec(separatorCopy, '')) push(output, '');
      } else push(output, stringSlice(string, lastLastIndex));
      return output.length > lim ? arraySlice(output, 0, lim) : output;
    };
  // Chakra, V8
  } else if ('0'.split(undefined, 0).length) {
    internalSplit = function (separator, limit) {
      return separator === undefined && limit === 0 ? [] : call(nativeSplit, this, separator, limit);
    };
  } else internalSplit = nativeSplit;

  return [
    // `String.prototype.split` method
    // https://tc39.es/ecma262/#sec-string.prototype.split
    function split(separator, limit) {
      var O = requireObjectCoercible(this);
      var splitter = separator == undefined ? undefined : getMethod(separator, SPLIT);
      return splitter
        ? call(splitter, separator, O, limit)
        : call(internalSplit, toString(O), separator, limit);
    },
    // `RegExp.prototype[@@split]` method
    // https://tc39.es/ecma262/#sec-regexp.prototype-@@split
    //
    // NOTE: This cannot be properly polyfilled in engines that don't support
    // the 'y' flag.
    function (string, limit) {
      var rx = anObject(this);
      var S = toString(string);
      var res = maybeCallNative(internalSplit, rx, S, limit, internalSplit !== nativeSplit);

      if (res.done) return res.value;

      var C = speciesConstructor(rx, RegExp);

      var unicodeMatching = rx.unicode;
      var flags = (rx.ignoreCase ? 'i' : '') +
                  (rx.multiline ? 'm' : '') +
                  (rx.unicode ? 'u' : '') +
                  (UNSUPPORTED_Y ? 'g' : 'y');

      // ^(? + rx + ) is needed, in combination with some S slicing, to
      // simulate the 'y' flag.
      var splitter = new C(UNSUPPORTED_Y ? '^(?:' + rx.source + ')' : rx, flags);
      var lim = limit === undefined ? MAX_UINT32 : limit >>> 0;
      if (lim === 0) return [];
      if (S.length === 0) return callRegExpExec(splitter, S) === null ? [S] : [];
      var p = 0;
      var q = 0;
      var A = [];
      while (q < S.length) {
        splitter.lastIndex = UNSUPPORTED_Y ? 0 : q;
        var z = callRegExpExec(splitter, UNSUPPORTED_Y ? stringSlice(S, q) : S);
        var e;
        if (
          z === null ||
          (e = min(toLength(splitter.lastIndex + (UNSUPPORTED_Y ? q : 0)), S.length)) === p
        ) {
          q = advanceStringIndex(S, q, unicodeMatching);
        } else {
          push(A, stringSlice(S, p, q));
          if (A.length === lim) return A;
          for (var i = 1; i <= z.length - 1; i++) {
            push(A, z[i]);
            if (A.length === lim) return A;
          }
          q = p = e;
        }
      }
      push(A, stringSlice(S, p));
      return A;
    }
  ];
}, !SPLIT_WORKS_WITH_OVERWRITTEN_EXEC, UNSUPPORTED_Y);


/***/ }),

/***/ 3210:
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

"use strict";

var $ = __webpack_require__(2109);
var $trim = (__webpack_require__(3111).trim);
var forcedStringTrimMethod = __webpack_require__(6091);

// `String.prototype.trim` method
// https://tc39.es/ecma262/#sec-string.prototype.trim
$({ target: 'String', proto: true, forced: forcedStringTrimMethod('trim') }, {
  trim: function trim() {
    return $trim(this);
  }
});


/***/ }),

/***/ 4032:
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

"use strict";

var $ = __webpack_require__(2109);
var global = __webpack_require__(7854);
var call = __webpack_require__(6916);
var uncurryThis = __webpack_require__(1702);
var IS_PURE = __webpack_require__(1913);
var DESCRIPTORS = __webpack_require__(9781);
var NATIVE_SYMBOL = __webpack_require__(133);
var fails = __webpack_require__(7293);
var hasOwn = __webpack_require__(2597);
var isPrototypeOf = __webpack_require__(7976);
var anObject = __webpack_require__(9670);
var toIndexedObject = __webpack_require__(5656);
var toPropertyKey = __webpack_require__(4948);
var $toString = __webpack_require__(1340);
var createPropertyDescriptor = __webpack_require__(9114);
var nativeObjectCreate = __webpack_require__(30);
var objectKeys = __webpack_require__(1956);
var getOwnPropertyNamesModule = __webpack_require__(8006);
var getOwnPropertyNamesExternal = __webpack_require__(1156);
var getOwnPropertySymbolsModule = __webpack_require__(5181);
var getOwnPropertyDescriptorModule = __webpack_require__(1236);
var definePropertyModule = __webpack_require__(3070);
var definePropertiesModule = __webpack_require__(6048);
var propertyIsEnumerableModule = __webpack_require__(5296);
var defineBuiltIn = __webpack_require__(8052);
var shared = __webpack_require__(2309);
var sharedKey = __webpack_require__(6200);
var hiddenKeys = __webpack_require__(3501);
var uid = __webpack_require__(9711);
var wellKnownSymbol = __webpack_require__(5112);
var wrappedWellKnownSymbolModule = __webpack_require__(6061);
var defineWellKnownSymbol = __webpack_require__(7235);
var defineSymbolToPrimitive = __webpack_require__(6532);
var setToStringTag = __webpack_require__(8003);
var InternalStateModule = __webpack_require__(9909);
var $forEach = (__webpack_require__(2092).forEach);

var HIDDEN = sharedKey('hidden');
var SYMBOL = 'Symbol';
var PROTOTYPE = 'prototype';

var setInternalState = InternalStateModule.set;
var getInternalState = InternalStateModule.getterFor(SYMBOL);

var ObjectPrototype = Object[PROTOTYPE];
var $Symbol = global.Symbol;
var SymbolPrototype = $Symbol && $Symbol[PROTOTYPE];
var TypeError = global.TypeError;
var QObject = global.QObject;
var nativeGetOwnPropertyDescriptor = getOwnPropertyDescriptorModule.f;
var nativeDefineProperty = definePropertyModule.f;
var nativeGetOwnPropertyNames = getOwnPropertyNamesExternal.f;
var nativePropertyIsEnumerable = propertyIsEnumerableModule.f;
var push = uncurryThis([].push);

var AllSymbols = shared('symbols');
var ObjectPrototypeSymbols = shared('op-symbols');
var WellKnownSymbolsStore = shared('wks');

// Don't use setters in Qt Script, https://github.com/zloirock/core-js/issues/173
var USE_SETTER = !QObject || !QObject[PROTOTYPE] || !QObject[PROTOTYPE].findChild;

// fallback for old Android, https://code.google.com/p/v8/issues/detail?id=687
var setSymbolDescriptor = DESCRIPTORS && fails(function () {
  return nativeObjectCreate(nativeDefineProperty({}, 'a', {
    get: function () { return nativeDefineProperty(this, 'a', { value: 7 }).a; }
  })).a != 7;
}) ? function (O, P, Attributes) {
  var ObjectPrototypeDescriptor = nativeGetOwnPropertyDescriptor(ObjectPrototype, P);
  if (ObjectPrototypeDescriptor) delete ObjectPrototype[P];
  nativeDefineProperty(O, P, Attributes);
  if (ObjectPrototypeDescriptor && O !== ObjectPrototype) {
    nativeDefineProperty(ObjectPrototype, P, ObjectPrototypeDescriptor);
  }
} : nativeDefineProperty;

var wrap = function (tag, description) {
  var symbol = AllSymbols[tag] = nativeObjectCreate(SymbolPrototype);
  setInternalState(symbol, {
    type: SYMBOL,
    tag: tag,
    description: description
  });
  if (!DESCRIPTORS) symbol.description = description;
  return symbol;
};

var $defineProperty = function defineProperty(O, P, Attributes) {
  if (O === ObjectPrototype) $defineProperty(ObjectPrototypeSymbols, P, Attributes);
  anObject(O);
  var key = toPropertyKey(P);
  anObject(Attributes);
  if (hasOwn(AllSymbols, key)) {
    if (!Attributes.enumerable) {
      if (!hasOwn(O, HIDDEN)) nativeDefineProperty(O, HIDDEN, createPropertyDescriptor(1, {}));
      O[HIDDEN][key] = true;
    } else {
      if (hasOwn(O, HIDDEN) && O[HIDDEN][key]) O[HIDDEN][key] = false;
      Attributes = nativeObjectCreate(Attributes, { enumerable: createPropertyDescriptor(0, false) });
    } return setSymbolDescriptor(O, key, Attributes);
  } return nativeDefineProperty(O, key, Attributes);
};

var $defineProperties = function defineProperties(O, Properties) {
  anObject(O);
  var properties = toIndexedObject(Properties);
  var keys = objectKeys(properties).concat($getOwnPropertySymbols(properties));
  $forEach(keys, function (key) {
    if (!DESCRIPTORS || call($propertyIsEnumerable, properties, key)) $defineProperty(O, key, properties[key]);
  });
  return O;
};

var $create = function create(O, Properties) {
  return Properties === undefined ? nativeObjectCreate(O) : $defineProperties(nativeObjectCreate(O), Properties);
};

var $propertyIsEnumerable = function propertyIsEnumerable(V) {
  var P = toPropertyKey(V);
  var enumerable = call(nativePropertyIsEnumerable, this, P);
  if (this === ObjectPrototype && hasOwn(AllSymbols, P) && !hasOwn(ObjectPrototypeSymbols, P)) return false;
  return enumerable || !hasOwn(this, P) || !hasOwn(AllSymbols, P) || hasOwn(this, HIDDEN) && this[HIDDEN][P]
    ? enumerable : true;
};

var $getOwnPropertyDescriptor = function getOwnPropertyDescriptor(O, P) {
  var it = toIndexedObject(O);
  var key = toPropertyKey(P);
  if (it === ObjectPrototype && hasOwn(AllSymbols, key) && !hasOwn(ObjectPrototypeSymbols, key)) return;
  var descriptor = nativeGetOwnPropertyDescriptor(it, key);
  if (descriptor && hasOwn(AllSymbols, key) && !(hasOwn(it, HIDDEN) && it[HIDDEN][key])) {
    descriptor.enumerable = true;
  }
  return descriptor;
};

var $getOwnPropertyNames = function getOwnPropertyNames(O) {
  var names = nativeGetOwnPropertyNames(toIndexedObject(O));
  var result = [];
  $forEach(names, function (key) {
    if (!hasOwn(AllSymbols, key) && !hasOwn(hiddenKeys, key)) push(result, key);
  });
  return result;
};

var $getOwnPropertySymbols = function (O) {
  var IS_OBJECT_PROTOTYPE = O === ObjectPrototype;
  var names = nativeGetOwnPropertyNames(IS_OBJECT_PROTOTYPE ? ObjectPrototypeSymbols : toIndexedObject(O));
  var result = [];
  $forEach(names, function (key) {
    if (hasOwn(AllSymbols, key) && (!IS_OBJECT_PROTOTYPE || hasOwn(ObjectPrototype, key))) {
      push(result, AllSymbols[key]);
    }
  });
  return result;
};

// `Symbol` constructor
// https://tc39.es/ecma262/#sec-symbol-constructor
if (!NATIVE_SYMBOL) {
  $Symbol = function Symbol() {
    if (isPrototypeOf(SymbolPrototype, this)) throw TypeError('Symbol is not a constructor');
    var description = !arguments.length || arguments[0] === undefined ? undefined : $toString(arguments[0]);
    var tag = uid(description);
    var setter = function (value) {
      if (this === ObjectPrototype) call(setter, ObjectPrototypeSymbols, value);
      if (hasOwn(this, HIDDEN) && hasOwn(this[HIDDEN], tag)) this[HIDDEN][tag] = false;
      setSymbolDescriptor(this, tag, createPropertyDescriptor(1, value));
    };
    if (DESCRIPTORS && USE_SETTER) setSymbolDescriptor(ObjectPrototype, tag, { configurable: true, set: setter });
    return wrap(tag, description);
  };

  SymbolPrototype = $Symbol[PROTOTYPE];

  defineBuiltIn(SymbolPrototype, 'toString', function toString() {
    return getInternalState(this).tag;
  });

  defineBuiltIn($Symbol, 'withoutSetter', function (description) {
    return wrap(uid(description), description);
  });

  propertyIsEnumerableModule.f = $propertyIsEnumerable;
  definePropertyModule.f = $defineProperty;
  definePropertiesModule.f = $defineProperties;
  getOwnPropertyDescriptorModule.f = $getOwnPropertyDescriptor;
  getOwnPropertyNamesModule.f = getOwnPropertyNamesExternal.f = $getOwnPropertyNames;
  getOwnPropertySymbolsModule.f = $getOwnPropertySymbols;

  wrappedWellKnownSymbolModule.f = function (name) {
    return wrap(wellKnownSymbol(name), name);
  };

  if (DESCRIPTORS) {
    // https://github.com/tc39/proposal-Symbol-description
    nativeDefineProperty(SymbolPrototype, 'description', {
      configurable: true,
      get: function description() {
        return getInternalState(this).description;
      }
    });
    if (!IS_PURE) {
      defineBuiltIn(ObjectPrototype, 'propertyIsEnumerable', $propertyIsEnumerable, { unsafe: true });
    }
  }
}

$({ global: true, constructor: true, wrap: true, forced: !NATIVE_SYMBOL, sham: !NATIVE_SYMBOL }, {
  Symbol: $Symbol
});

$forEach(objectKeys(WellKnownSymbolsStore), function (name) {
  defineWellKnownSymbol(name);
});

$({ target: SYMBOL, stat: true, forced: !NATIVE_SYMBOL }, {
  useSetter: function () { USE_SETTER = true; },
  useSimple: function () { USE_SETTER = false; }
});

$({ target: 'Object', stat: true, forced: !NATIVE_SYMBOL, sham: !DESCRIPTORS }, {
  // `Object.create` method
  // https://tc39.es/ecma262/#sec-object.create
  create: $create,
  // `Object.defineProperty` method
  // https://tc39.es/ecma262/#sec-object.defineproperty
  defineProperty: $defineProperty,
  // `Object.defineProperties` method
  // https://tc39.es/ecma262/#sec-object.defineproperties
  defineProperties: $defineProperties,
  // `Object.getOwnPropertyDescriptor` method
  // https://tc39.es/ecma262/#sec-object.getownpropertydescriptors
  getOwnPropertyDescriptor: $getOwnPropertyDescriptor
});

$({ target: 'Object', stat: true, forced: !NATIVE_SYMBOL }, {
  // `Object.getOwnPropertyNames` method
  // https://tc39.es/ecma262/#sec-object.getownpropertynames
  getOwnPropertyNames: $getOwnPropertyNames
});

// `Symbol.prototype[@@toPrimitive]` method
// https://tc39.es/ecma262/#sec-symbol.prototype-@@toprimitive
defineSymbolToPrimitive();

// `Symbol.prototype[@@toStringTag]` property
// https://tc39.es/ecma262/#sec-symbol.prototype-@@tostringtag
setToStringTag($Symbol, SYMBOL);

hiddenKeys[HIDDEN] = true;


/***/ }),

/***/ 1817:
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

"use strict";
// `Symbol.prototype.description` getter
// https://tc39.es/ecma262/#sec-symbol.prototype.description

var $ = __webpack_require__(2109);
var DESCRIPTORS = __webpack_require__(9781);
var global = __webpack_require__(7854);
var uncurryThis = __webpack_require__(1702);
var hasOwn = __webpack_require__(2597);
var isCallable = __webpack_require__(614);
var isPrototypeOf = __webpack_require__(7976);
var toString = __webpack_require__(1340);
var defineProperty = (__webpack_require__(3070).f);
var copyConstructorProperties = __webpack_require__(9920);

var NativeSymbol = global.Symbol;
var SymbolPrototype = NativeSymbol && NativeSymbol.prototype;

if (DESCRIPTORS && isCallable(NativeSymbol) && (!('description' in SymbolPrototype) ||
  // Safari 12 bug
  NativeSymbol().description !== undefined
)) {
  var EmptyStringDescriptionStore = {};
  // wrap Symbol constructor for correct work with undefined description
  var SymbolWrapper = function Symbol() {
    var description = arguments.length < 1 || arguments[0] === undefined ? undefined : toString(arguments[0]);
    var result = isPrototypeOf(SymbolPrototype, this)
      ? new NativeSymbol(description)
      // in Edge 13, String(Symbol(undefined)) === 'Symbol(undefined)'
      : description === undefined ? NativeSymbol() : NativeSymbol(description);
    if (description === '') EmptyStringDescriptionStore[result] = true;
    return result;
  };

  copyConstructorProperties(SymbolWrapper, NativeSymbol);
  SymbolWrapper.prototype = SymbolPrototype;
  SymbolPrototype.constructor = SymbolWrapper;

  var NATIVE_SYMBOL = String(NativeSymbol('test')) == 'Symbol(test)';
  var symbolToString = uncurryThis(SymbolPrototype.toString);
  var symbolValueOf = uncurryThis(SymbolPrototype.valueOf);
  var regexp = /^Symbol\((.*)\)[^)]+$/;
  var replace = uncurryThis(''.replace);
  var stringSlice = uncurryThis(''.slice);

  defineProperty(SymbolPrototype, 'description', {
    configurable: true,
    get: function description() {
      var symbol = symbolValueOf(this);
      var string = symbolToString(symbol);
      if (hasOwn(EmptyStringDescriptionStore, symbol)) return '';
      var desc = NATIVE_SYMBOL ? stringSlice(string, 7, -1) : replace(string, regexp, '$1');
      return desc === '' ? undefined : desc;
    }
  });

  $({ global: true, constructor: true, forced: true }, {
    Symbol: SymbolWrapper
  });
}


/***/ }),

/***/ 763:
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

var $ = __webpack_require__(2109);
var getBuiltIn = __webpack_require__(5005);
var hasOwn = __webpack_require__(2597);
var toString = __webpack_require__(1340);
var shared = __webpack_require__(2309);
var NATIVE_SYMBOL_REGISTRY = __webpack_require__(735);

var StringToSymbolRegistry = shared('string-to-symbol-registry');
var SymbolToStringRegistry = shared('symbol-to-string-registry');

// `Symbol.for` method
// https://tc39.es/ecma262/#sec-symbol.for
$({ target: 'Symbol', stat: true, forced: !NATIVE_SYMBOL_REGISTRY }, {
  'for': function (key) {
    var string = toString(key);
    if (hasOwn(StringToSymbolRegistry, string)) return StringToSymbolRegistry[string];
    var symbol = getBuiltIn('Symbol')(string);
    StringToSymbolRegistry[string] = symbol;
    SymbolToStringRegistry[symbol] = string;
    return symbol;
  }
});


/***/ }),

/***/ 2165:
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

var defineWellKnownSymbol = __webpack_require__(7235);

// `Symbol.iterator` well-known symbol
// https://tc39.es/ecma262/#sec-symbol.iterator
defineWellKnownSymbol('iterator');


/***/ }),

/***/ 2526:
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

// TODO: Remove this module from `core-js@4` since it's split to modules listed below
__webpack_require__(4032);
__webpack_require__(763);
__webpack_require__(6620);
__webpack_require__(8862);
__webpack_require__(9660);


/***/ }),

/***/ 6620:
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

var $ = __webpack_require__(2109);
var hasOwn = __webpack_require__(2597);
var isSymbol = __webpack_require__(2190);
var tryToString = __webpack_require__(6330);
var shared = __webpack_require__(2309);
var NATIVE_SYMBOL_REGISTRY = __webpack_require__(735);

var SymbolToStringRegistry = shared('symbol-to-string-registry');

// `Symbol.keyFor` method
// https://tc39.es/ecma262/#sec-symbol.keyfor
$({ target: 'Symbol', stat: true, forced: !NATIVE_SYMBOL_REGISTRY }, {
  keyFor: function keyFor(sym) {
    if (!isSymbol(sym)) throw TypeError(tryToString(sym) + ' is not a symbol');
    if (hasOwn(SymbolToStringRegistry, sym)) return SymbolToStringRegistry[sym];
  }
});


/***/ }),

/***/ 8675:
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

"use strict";

var ArrayBufferViewCore = __webpack_require__(260);
var lengthOfArrayLike = __webpack_require__(6244);
var toIntegerOrInfinity = __webpack_require__(9303);

var aTypedArray = ArrayBufferViewCore.aTypedArray;
var exportTypedArrayMethod = ArrayBufferViewCore.exportTypedArrayMethod;

// `%TypedArray%.prototype.at` method
// https://github.com/tc39/proposal-relative-indexing-method
exportTypedArrayMethod('at', function at(index) {
  var O = aTypedArray(this);
  var len = lengthOfArrayLike(O);
  var relativeIndex = toIntegerOrInfinity(index);
  var k = relativeIndex >= 0 ? relativeIndex : len + relativeIndex;
  return (k < 0 || k >= len) ? undefined : O[k];
});


/***/ }),

/***/ 2990:
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

"use strict";

var uncurryThis = __webpack_require__(1702);
var ArrayBufferViewCore = __webpack_require__(260);
var $ArrayCopyWithin = __webpack_require__(1048);

var u$ArrayCopyWithin = uncurryThis($ArrayCopyWithin);
var aTypedArray = ArrayBufferViewCore.aTypedArray;
var exportTypedArrayMethod = ArrayBufferViewCore.exportTypedArrayMethod;

// `%TypedArray%.prototype.copyWithin` method
// https://tc39.es/ecma262/#sec-%typedarray%.prototype.copywithin
exportTypedArrayMethod('copyWithin', function copyWithin(target, start /* , end */) {
  return u$ArrayCopyWithin(aTypedArray(this), target, start, arguments.length > 2 ? arguments[2] : undefined);
});


/***/ }),

/***/ 8927:
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

"use strict";

var ArrayBufferViewCore = __webpack_require__(260);
var $every = (__webpack_require__(2092).every);

var aTypedArray = ArrayBufferViewCore.aTypedArray;
var exportTypedArrayMethod = ArrayBufferViewCore.exportTypedArrayMethod;

// `%TypedArray%.prototype.every` method
// https://tc39.es/ecma262/#sec-%typedarray%.prototype.every
exportTypedArrayMethod('every', function every(callbackfn /* , thisArg */) {
  return $every(aTypedArray(this), callbackfn, arguments.length > 1 ? arguments[1] : undefined);
});


/***/ }),

/***/ 3105:
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

"use strict";

var ArrayBufferViewCore = __webpack_require__(260);
var call = __webpack_require__(6916);
var $fill = __webpack_require__(1285);

var aTypedArray = ArrayBufferViewCore.aTypedArray;
var exportTypedArrayMethod = ArrayBufferViewCore.exportTypedArrayMethod;

// `%TypedArray%.prototype.fill` method
// https://tc39.es/ecma262/#sec-%typedarray%.prototype.fill
exportTypedArrayMethod('fill', function fill(value /* , start, end */) {
  var length = arguments.length;
  return call(
    $fill,
    aTypedArray(this),
    value,
    length > 1 ? arguments[1] : undefined,
    length > 2 ? arguments[2] : undefined
  );
});


/***/ }),

/***/ 5035:
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

"use strict";

var ArrayBufferViewCore = __webpack_require__(260);
var $filter = (__webpack_require__(2092).filter);
var fromSpeciesAndList = __webpack_require__(3074);

var aTypedArray = ArrayBufferViewCore.aTypedArray;
var exportTypedArrayMethod = ArrayBufferViewCore.exportTypedArrayMethod;

// `%TypedArray%.prototype.filter` method
// https://tc39.es/ecma262/#sec-%typedarray%.prototype.filter
exportTypedArrayMethod('filter', function filter(callbackfn /* , thisArg */) {
  var list = $filter(aTypedArray(this), callbackfn, arguments.length > 1 ? arguments[1] : undefined);
  return fromSpeciesAndList(this, list);
});


/***/ }),

/***/ 7174:
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

"use strict";

var ArrayBufferViewCore = __webpack_require__(260);
var $findIndex = (__webpack_require__(2092).findIndex);

var aTypedArray = ArrayBufferViewCore.aTypedArray;
var exportTypedArrayMethod = ArrayBufferViewCore.exportTypedArrayMethod;

// `%TypedArray%.prototype.findIndex` method
// https://tc39.es/ecma262/#sec-%typedarray%.prototype.findindex
exportTypedArrayMethod('findIndex', function findIndex(predicate /* , thisArg */) {
  return $findIndex(aTypedArray(this), predicate, arguments.length > 1 ? arguments[1] : undefined);
});


/***/ }),

/***/ 4345:
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

"use strict";

var ArrayBufferViewCore = __webpack_require__(260);
var $find = (__webpack_require__(2092).find);

var aTypedArray = ArrayBufferViewCore.aTypedArray;
var exportTypedArrayMethod = ArrayBufferViewCore.exportTypedArrayMethod;

// `%TypedArray%.prototype.find` method
// https://tc39.es/ecma262/#sec-%typedarray%.prototype.find
exportTypedArrayMethod('find', function find(predicate /* , thisArg */) {
  return $find(aTypedArray(this), predicate, arguments.length > 1 ? arguments[1] : undefined);
});


/***/ }),

/***/ 2846:
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

"use strict";

var ArrayBufferViewCore = __webpack_require__(260);
var $forEach = (__webpack_require__(2092).forEach);

var aTypedArray = ArrayBufferViewCore.aTypedArray;
var exportTypedArrayMethod = ArrayBufferViewCore.exportTypedArrayMethod;

// `%TypedArray%.prototype.forEach` method
// https://tc39.es/ecma262/#sec-%typedarray%.prototype.foreach
exportTypedArrayMethod('forEach', function forEach(callbackfn /* , thisArg */) {
  $forEach(aTypedArray(this), callbackfn, arguments.length > 1 ? arguments[1] : undefined);
});


/***/ }),

/***/ 4731:
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

"use strict";

var ArrayBufferViewCore = __webpack_require__(260);
var $includes = (__webpack_require__(1318).includes);

var aTypedArray = ArrayBufferViewCore.aTypedArray;
var exportTypedArrayMethod = ArrayBufferViewCore.exportTypedArrayMethod;

// `%TypedArray%.prototype.includes` method
// https://tc39.es/ecma262/#sec-%typedarray%.prototype.includes
exportTypedArrayMethod('includes', function includes(searchElement /* , fromIndex */) {
  return $includes(aTypedArray(this), searchElement, arguments.length > 1 ? arguments[1] : undefined);
});


/***/ }),

/***/ 7209:
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

"use strict";

var ArrayBufferViewCore = __webpack_require__(260);
var $indexOf = (__webpack_require__(1318).indexOf);

var aTypedArray = ArrayBufferViewCore.aTypedArray;
var exportTypedArrayMethod = ArrayBufferViewCore.exportTypedArrayMethod;

// `%TypedArray%.prototype.indexOf` method
// https://tc39.es/ecma262/#sec-%typedarray%.prototype.indexof
exportTypedArrayMethod('indexOf', function indexOf(searchElement /* , fromIndex */) {
  return $indexOf(aTypedArray(this), searchElement, arguments.length > 1 ? arguments[1] : undefined);
});


/***/ }),

/***/ 6319:
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

"use strict";

var global = __webpack_require__(7854);
var fails = __webpack_require__(7293);
var uncurryThis = __webpack_require__(1702);
var ArrayBufferViewCore = __webpack_require__(260);
var ArrayIterators = __webpack_require__(6992);
var wellKnownSymbol = __webpack_require__(5112);

var ITERATOR = wellKnownSymbol('iterator');
var Uint8Array = global.Uint8Array;
var arrayValues = uncurryThis(ArrayIterators.values);
var arrayKeys = uncurryThis(ArrayIterators.keys);
var arrayEntries = uncurryThis(ArrayIterators.entries);
var aTypedArray = ArrayBufferViewCore.aTypedArray;
var exportTypedArrayMethod = ArrayBufferViewCore.exportTypedArrayMethod;
var TypedArrayPrototype = Uint8Array && Uint8Array.prototype;

var GENERIC = !fails(function () {
  TypedArrayPrototype[ITERATOR].call([1]);
});

var ITERATOR_IS_VALUES = !!TypedArrayPrototype
  && TypedArrayPrototype.values
  && TypedArrayPrototype[ITERATOR] === TypedArrayPrototype.values
  && TypedArrayPrototype.values.name === 'values';

var typedArrayValues = function values() {
  return arrayValues(aTypedArray(this));
};

// `%TypedArray%.prototype.entries` method
// https://tc39.es/ecma262/#sec-%typedarray%.prototype.entries
exportTypedArrayMethod('entries', function entries() {
  return arrayEntries(aTypedArray(this));
}, GENERIC);
// `%TypedArray%.prototype.keys` method
// https://tc39.es/ecma262/#sec-%typedarray%.prototype.keys
exportTypedArrayMethod('keys', function keys() {
  return arrayKeys(aTypedArray(this));
}, GENERIC);
// `%TypedArray%.prototype.values` method
// https://tc39.es/ecma262/#sec-%typedarray%.prototype.values
exportTypedArrayMethod('values', typedArrayValues, GENERIC || !ITERATOR_IS_VALUES, { name: 'values' });
// `%TypedArray%.prototype[@@iterator]` method
// https://tc39.es/ecma262/#sec-%typedarray%.prototype-@@iterator
exportTypedArrayMethod(ITERATOR, typedArrayValues, GENERIC || !ITERATOR_IS_VALUES, { name: 'values' });


/***/ }),

/***/ 8867:
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

"use strict";

var ArrayBufferViewCore = __webpack_require__(260);
var uncurryThis = __webpack_require__(1702);

var aTypedArray = ArrayBufferViewCore.aTypedArray;
var exportTypedArrayMethod = ArrayBufferViewCore.exportTypedArrayMethod;
var $join = uncurryThis([].join);

// `%TypedArray%.prototype.join` method
// https://tc39.es/ecma262/#sec-%typedarray%.prototype.join
exportTypedArrayMethod('join', function join(separator) {
  return $join(aTypedArray(this), separator);
});


/***/ }),

/***/ 7789:
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

"use strict";

var ArrayBufferViewCore = __webpack_require__(260);
var apply = __webpack_require__(2104);
var $lastIndexOf = __webpack_require__(6583);

var aTypedArray = ArrayBufferViewCore.aTypedArray;
var exportTypedArrayMethod = ArrayBufferViewCore.exportTypedArrayMethod;

// `%TypedArray%.prototype.lastIndexOf` method
// https://tc39.es/ecma262/#sec-%typedarray%.prototype.lastindexof
exportTypedArrayMethod('lastIndexOf', function lastIndexOf(searchElement /* , fromIndex */) {
  var length = arguments.length;
  return apply($lastIndexOf, aTypedArray(this), length > 1 ? [searchElement, arguments[1]] : [searchElement]);
});


/***/ }),

/***/ 3739:
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

"use strict";

var ArrayBufferViewCore = __webpack_require__(260);
var $map = (__webpack_require__(2092).map);
var typedArraySpeciesConstructor = __webpack_require__(6304);

var aTypedArray = ArrayBufferViewCore.aTypedArray;
var exportTypedArrayMethod = ArrayBufferViewCore.exportTypedArrayMethod;

// `%TypedArray%.prototype.map` method
// https://tc39.es/ecma262/#sec-%typedarray%.prototype.map
exportTypedArrayMethod('map', function map(mapfn /* , thisArg */) {
  return $map(aTypedArray(this), mapfn, arguments.length > 1 ? arguments[1] : undefined, function (O, length) {
    return new (typedArraySpeciesConstructor(O))(length);
  });
});


/***/ }),

/***/ 4483:
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

"use strict";

var ArrayBufferViewCore = __webpack_require__(260);
var $reduceRight = (__webpack_require__(3671).right);

var aTypedArray = ArrayBufferViewCore.aTypedArray;
var exportTypedArrayMethod = ArrayBufferViewCore.exportTypedArrayMethod;

// `%TypedArray%.prototype.reduceRicht` method
// https://tc39.es/ecma262/#sec-%typedarray%.prototype.reduceright
exportTypedArrayMethod('reduceRight', function reduceRight(callbackfn /* , initialValue */) {
  var length = arguments.length;
  return $reduceRight(aTypedArray(this), callbackfn, length, length > 1 ? arguments[1] : undefined);
});


/***/ }),

/***/ 9368:
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

"use strict";

var ArrayBufferViewCore = __webpack_require__(260);
var $reduce = (__webpack_require__(3671).left);

var aTypedArray = ArrayBufferViewCore.aTypedArray;
var exportTypedArrayMethod = ArrayBufferViewCore.exportTypedArrayMethod;

// `%TypedArray%.prototype.reduce` method
// https://tc39.es/ecma262/#sec-%typedarray%.prototype.reduce
exportTypedArrayMethod('reduce', function reduce(callbackfn /* , initialValue */) {
  var length = arguments.length;
  return $reduce(aTypedArray(this), callbackfn, length, length > 1 ? arguments[1] : undefined);
});


/***/ }),

/***/ 2056:
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

"use strict";

var ArrayBufferViewCore = __webpack_require__(260);

var aTypedArray = ArrayBufferViewCore.aTypedArray;
var exportTypedArrayMethod = ArrayBufferViewCore.exportTypedArrayMethod;
var floor = Math.floor;

// `%TypedArray%.prototype.reverse` method
// https://tc39.es/ecma262/#sec-%typedarray%.prototype.reverse
exportTypedArrayMethod('reverse', function reverse() {
  var that = this;
  var length = aTypedArray(that).length;
  var middle = floor(length / 2);
  var index = 0;
  var value;
  while (index < middle) {
    value = that[index];
    that[index++] = that[--length];
    that[length] = value;
  } return that;
});


/***/ }),

/***/ 3462:
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

"use strict";

var global = __webpack_require__(7854);
var call = __webpack_require__(6916);
var ArrayBufferViewCore = __webpack_require__(260);
var lengthOfArrayLike = __webpack_require__(6244);
var toOffset = __webpack_require__(4590);
var toIndexedObject = __webpack_require__(7908);
var fails = __webpack_require__(7293);

var RangeError = global.RangeError;
var Int8Array = global.Int8Array;
var Int8ArrayPrototype = Int8Array && Int8Array.prototype;
var $set = Int8ArrayPrototype && Int8ArrayPrototype.set;
var aTypedArray = ArrayBufferViewCore.aTypedArray;
var exportTypedArrayMethod = ArrayBufferViewCore.exportTypedArrayMethod;

var WORKS_WITH_OBJECTS_AND_GEERIC_ON_TYPED_ARRAYS = !fails(function () {
  // eslint-disable-next-line es-x/no-typed-arrays -- required for testing
  var array = new Uint8ClampedArray(2);
  call($set, array, { length: 1, 0: 3 }, 1);
  return array[1] !== 3;
});

// https://bugs.chromium.org/p/v8/issues/detail?id=11294 and other
var TO_OBJECT_BUG = WORKS_WITH_OBJECTS_AND_GEERIC_ON_TYPED_ARRAYS && ArrayBufferViewCore.NATIVE_ARRAY_BUFFER_VIEWS && fails(function () {
  var array = new Int8Array(2);
  array.set(1);
  array.set('2', 1);
  return array[0] !== 0 || array[1] !== 2;
});

// `%TypedArray%.prototype.set` method
// https://tc39.es/ecma262/#sec-%typedarray%.prototype.set
exportTypedArrayMethod('set', function set(arrayLike /* , offset */) {
  aTypedArray(this);
  var offset = toOffset(arguments.length > 1 ? arguments[1] : undefined, 1);
  var src = toIndexedObject(arrayLike);
  if (WORKS_WITH_OBJECTS_AND_GEERIC_ON_TYPED_ARRAYS) return call($set, this, src, offset);
  var length = this.length;
  var len = lengthOfArrayLike(src);
  var index = 0;
  if (len + offset > length) throw RangeError('Wrong length');
  while (index < len) this[offset + index] = src[index++];
}, !WORKS_WITH_OBJECTS_AND_GEERIC_ON_TYPED_ARRAYS || TO_OBJECT_BUG);


/***/ }),

/***/ 678:
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

"use strict";

var ArrayBufferViewCore = __webpack_require__(260);
var typedArraySpeciesConstructor = __webpack_require__(6304);
var fails = __webpack_require__(7293);
var arraySlice = __webpack_require__(206);

var aTypedArray = ArrayBufferViewCore.aTypedArray;
var exportTypedArrayMethod = ArrayBufferViewCore.exportTypedArrayMethod;

var FORCED = fails(function () {
  // eslint-disable-next-line es-x/no-typed-arrays -- required for testing
  new Int8Array(1).slice();
});

// `%TypedArray%.prototype.slice` method
// https://tc39.es/ecma262/#sec-%typedarray%.prototype.slice
exportTypedArrayMethod('slice', function slice(start, end) {
  var list = arraySlice(aTypedArray(this), start, end);
  var C = typedArraySpeciesConstructor(this);
  var index = 0;
  var length = list.length;
  var result = new C(length);
  while (length > index) result[index] = list[index++];
  return result;
}, FORCED);


/***/ }),

/***/ 7462:
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

"use strict";

var ArrayBufferViewCore = __webpack_require__(260);
var $some = (__webpack_require__(2092).some);

var aTypedArray = ArrayBufferViewCore.aTypedArray;
var exportTypedArrayMethod = ArrayBufferViewCore.exportTypedArrayMethod;

// `%TypedArray%.prototype.some` method
// https://tc39.es/ecma262/#sec-%typedarray%.prototype.some
exportTypedArrayMethod('some', function some(callbackfn /* , thisArg */) {
  return $some(aTypedArray(this), callbackfn, arguments.length > 1 ? arguments[1] : undefined);
});


/***/ }),

/***/ 3824:
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

"use strict";

var global = __webpack_require__(7854);
var uncurryThis = __webpack_require__(1702);
var fails = __webpack_require__(7293);
var aCallable = __webpack_require__(9662);
var internalSort = __webpack_require__(4362);
var ArrayBufferViewCore = __webpack_require__(260);
var FF = __webpack_require__(8886);
var IE_OR_EDGE = __webpack_require__(256);
var V8 = __webpack_require__(7392);
var WEBKIT = __webpack_require__(8008);

var aTypedArray = ArrayBufferViewCore.aTypedArray;
var exportTypedArrayMethod = ArrayBufferViewCore.exportTypedArrayMethod;
var Uint16Array = global.Uint16Array;
var un$Sort = Uint16Array && uncurryThis(Uint16Array.prototype.sort);

// WebKit
var ACCEPT_INCORRECT_ARGUMENTS = !!un$Sort && !(fails(function () {
  un$Sort(new Uint16Array(2), null);
}) && fails(function () {
  un$Sort(new Uint16Array(2), {});
}));

var STABLE_SORT = !!un$Sort && !fails(function () {
  // feature detection can be too slow, so check engines versions
  if (V8) return V8 < 74;
  if (FF) return FF < 67;
  if (IE_OR_EDGE) return true;
  if (WEBKIT) return WEBKIT < 602;

  var array = new Uint16Array(516);
  var expected = Array(516);
  var index, mod;

  for (index = 0; index < 516; index++) {
    mod = index % 4;
    array[index] = 515 - index;
    expected[index] = index - 2 * mod + 3;
  }

  un$Sort(array, function (a, b) {
    return (a / 4 | 0) - (b / 4 | 0);
  });

  for (index = 0; index < 516; index++) {
    if (array[index] !== expected[index]) return true;
  }
});

var getSortCompare = function (comparefn) {
  return function (x, y) {
    if (comparefn !== undefined) return +comparefn(x, y) || 0;
    // eslint-disable-next-line no-self-compare -- NaN check
    if (y !== y) return -1;
    // eslint-disable-next-line no-self-compare -- NaN check
    if (x !== x) return 1;
    if (x === 0 && y === 0) return 1 / x > 0 && 1 / y < 0 ? 1 : -1;
    return x > y;
  };
};

// `%TypedArray%.prototype.sort` method
// https://tc39.es/ecma262/#sec-%typedarray%.prototype.sort
exportTypedArrayMethod('sort', function sort(comparefn) {
  if (comparefn !== undefined) aCallable(comparefn);
  if (STABLE_SORT) return un$Sort(this, comparefn);

  return internalSort(aTypedArray(this), getSortCompare(comparefn));
}, !STABLE_SORT || ACCEPT_INCORRECT_ARGUMENTS);


/***/ }),

/***/ 5021:
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

"use strict";

var ArrayBufferViewCore = __webpack_require__(260);
var toLength = __webpack_require__(7466);
var toAbsoluteIndex = __webpack_require__(1400);
var typedArraySpeciesConstructor = __webpack_require__(6304);

var aTypedArray = ArrayBufferViewCore.aTypedArray;
var exportTypedArrayMethod = ArrayBufferViewCore.exportTypedArrayMethod;

// `%TypedArray%.prototype.subarray` method
// https://tc39.es/ecma262/#sec-%typedarray%.prototype.subarray
exportTypedArrayMethod('subarray', function subarray(begin, end) {
  var O = aTypedArray(this);
  var length = O.length;
  var beginIndex = toAbsoluteIndex(begin, length);
  var C = typedArraySpeciesConstructor(O);
  return new C(
    O.buffer,
    O.byteOffset + beginIndex * O.BYTES_PER_ELEMENT,
    toLength((end === undefined ? length : toAbsoluteIndex(end, length)) - beginIndex)
  );
});


/***/ }),

/***/ 2974:
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

"use strict";

var global = __webpack_require__(7854);
var apply = __webpack_require__(2104);
var ArrayBufferViewCore = __webpack_require__(260);
var fails = __webpack_require__(7293);
var arraySlice = __webpack_require__(206);

var Int8Array = global.Int8Array;
var aTypedArray = ArrayBufferViewCore.aTypedArray;
var exportTypedArrayMethod = ArrayBufferViewCore.exportTypedArrayMethod;
var $toLocaleString = [].toLocaleString;

// iOS Safari 6.x fails here
var TO_LOCALE_STRING_BUG = !!Int8Array && fails(function () {
  $toLocaleString.call(new Int8Array(1));
});

var FORCED = fails(function () {
  return [1, 2].toLocaleString() != new Int8Array([1, 2]).toLocaleString();
}) || !fails(function () {
  Int8Array.prototype.toLocaleString.call([1, 2]);
});

// `%TypedArray%.prototype.toLocaleString` method
// https://tc39.es/ecma262/#sec-%typedarray%.prototype.tolocalestring
exportTypedArrayMethod('toLocaleString', function toLocaleString() {
  return apply(
    $toLocaleString,
    TO_LOCALE_STRING_BUG ? arraySlice(aTypedArray(this)) : aTypedArray(this),
    arraySlice(arguments)
  );
}, FORCED);


/***/ }),

/***/ 5016:
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

"use strict";

var exportTypedArrayMethod = (__webpack_require__(260).exportTypedArrayMethod);
var fails = __webpack_require__(7293);
var global = __webpack_require__(7854);
var uncurryThis = __webpack_require__(1702);

var Uint8Array = global.Uint8Array;
var Uint8ArrayPrototype = Uint8Array && Uint8Array.prototype || {};
var arrayToString = [].toString;
var join = uncurryThis([].join);

if (fails(function () { arrayToString.call({}); })) {
  arrayToString = function toString() {
    return join(this);
  };
}

var IS_NOT_ARRAY_METHOD = Uint8ArrayPrototype.toString != arrayToString;

// `%TypedArray%.prototype.toString` method
// https://tc39.es/ecma262/#sec-%typedarray%.prototype.tostring
exportTypedArrayMethod('toString', arrayToString, IS_NOT_ARRAY_METHOD);


/***/ }),

/***/ 2472:
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

var createTypedArrayConstructor = __webpack_require__(9843);

// `Uint8Array` constructor
// https://tc39.es/ecma262/#sec-typedarray-objects
createTypedArrayConstructor('Uint8', function (init) {
  return function Uint8Array(data, byteOffset, length) {
    return init(this, data, byteOffset, length);
  };
});


/***/ }),

/***/ 7479:
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

var $ = __webpack_require__(2109);
var getBuiltIn = __webpack_require__(5005);
var uncurryThis = __webpack_require__(1702);
var fails = __webpack_require__(7293);
var toString = __webpack_require__(1340);
var validateArgumentsLength = __webpack_require__(8053);
var itoc = (__webpack_require__(4170).itoc);

var $btoa = getBuiltIn('btoa');
var charAt = uncurryThis(''.charAt);
var charCodeAt = uncurryThis(''.charCodeAt);

var NO_ARG_RECEIVING_CHECK = !!$btoa && !fails(function () {
  $btoa();
});

var WRONG_ARG_CONVERSION = !!$btoa && fails(function () {
  return $btoa(null) !== 'bnVsbA==';
});

var WRONG_ARITY = !!$btoa && $btoa.length !== 1;

// `btoa` method
// https://html.spec.whatwg.org/multipage/webappapis.html#dom-btoa
$({ global: true, enumerable: true, forced: NO_ARG_RECEIVING_CHECK || WRONG_ARG_CONVERSION || WRONG_ARITY }, {
  btoa: function btoa(data) {
    validateArgumentsLength(arguments.length, 1);
    if (NO_ARG_RECEIVING_CHECK || WRONG_ARG_CONVERSION || WRONG_ARITY) return $btoa(toString(data));
    var string = toString(data);
    var output = '';
    var position = 0;
    var map = itoc;
    var block, charCode;
    while (charAt(string, position) || (map = '=', position % 1)) {
      charCode = charCodeAt(string, position += 3 / 4);
      if (charCode > 0xFF) {
        throw new (getBuiltIn('DOMException'))('The string contains characters outside of the Latin1 range', 'InvalidCharacterError');
      }
      block = block << 8 | charCode;
      output += charAt(map, 63 & block >> 8 - position % 1 * 8);
    } return output;
  }
});


/***/ }),

/***/ 4747:
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

var global = __webpack_require__(7854);
var DOMIterables = __webpack_require__(8324);
var DOMTokenListPrototype = __webpack_require__(8509);
var forEach = __webpack_require__(8533);
var createNonEnumerableProperty = __webpack_require__(8880);

var handlePrototype = function (CollectionPrototype) {
  // some Chrome versions have non-configurable methods on DOMTokenList
  if (CollectionPrototype && CollectionPrototype.forEach !== forEach) try {
    createNonEnumerableProperty(CollectionPrototype, 'forEach', forEach);
  } catch (error) {
    CollectionPrototype.forEach = forEach;
  }
};

for (var COLLECTION_NAME in DOMIterables) {
  if (DOMIterables[COLLECTION_NAME]) {
    handlePrototype(global[COLLECTION_NAME] && global[COLLECTION_NAME].prototype);
  }
}

handlePrototype(DOMTokenListPrototype);


/***/ }),

/***/ 3948:
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

var global = __webpack_require__(7854);
var DOMIterables = __webpack_require__(8324);
var DOMTokenListPrototype = __webpack_require__(8509);
var ArrayIteratorMethods = __webpack_require__(6992);
var createNonEnumerableProperty = __webpack_require__(8880);
var wellKnownSymbol = __webpack_require__(5112);

var ITERATOR = wellKnownSymbol('iterator');
var TO_STRING_TAG = wellKnownSymbol('toStringTag');
var ArrayValues = ArrayIteratorMethods.values;

var handlePrototype = function (CollectionPrototype, COLLECTION_NAME) {
  if (CollectionPrototype) {
    // some Chrome versions have non-configurable methods on DOMTokenList
    if (CollectionPrototype[ITERATOR] !== ArrayValues) try {
      createNonEnumerableProperty(CollectionPrototype, ITERATOR, ArrayValues);
    } catch (error) {
      CollectionPrototype[ITERATOR] = ArrayValues;
    }
    if (!CollectionPrototype[TO_STRING_TAG]) {
      createNonEnumerableProperty(CollectionPrototype, TO_STRING_TAG, COLLECTION_NAME);
    }
    if (DOMIterables[COLLECTION_NAME]) for (var METHOD_NAME in ArrayIteratorMethods) {
      // some Chrome versions have non-configurable methods on DOMTokenList
      if (CollectionPrototype[METHOD_NAME] !== ArrayIteratorMethods[METHOD_NAME]) try {
        createNonEnumerableProperty(CollectionPrototype, METHOD_NAME, ArrayIteratorMethods[METHOD_NAME]);
      } catch (error) {
        CollectionPrototype[METHOD_NAME] = ArrayIteratorMethods[METHOD_NAME];
      }
    }
  }
};

for (var COLLECTION_NAME in DOMIterables) {
  handlePrototype(global[COLLECTION_NAME] && global[COLLECTION_NAME].prototype, COLLECTION_NAME);
}

handlePrototype(DOMTokenListPrototype, 'DOMTokenList');


/***/ }),

/***/ 7714:
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

"use strict";

var $ = __webpack_require__(2109);
var tryNodeRequire = __webpack_require__(4038);
var getBuiltIn = __webpack_require__(5005);
var fails = __webpack_require__(7293);
var create = __webpack_require__(30);
var createPropertyDescriptor = __webpack_require__(9114);
var defineProperty = (__webpack_require__(3070).f);
var defineBuiltIn = __webpack_require__(8052);
var defineBuiltInAccessor = __webpack_require__(7045);
var hasOwn = __webpack_require__(2597);
var anInstance = __webpack_require__(5787);
var anObject = __webpack_require__(9670);
var errorToString = __webpack_require__(7762);
var normalizeStringArgument = __webpack_require__(6277);
var DOMExceptionConstants = __webpack_require__(3678);
var clearErrorStack = __webpack_require__(7741);
var InternalStateModule = __webpack_require__(9909);
var DESCRIPTORS = __webpack_require__(9781);
var IS_PURE = __webpack_require__(1913);

var DOM_EXCEPTION = 'DOMException';
var DATA_CLONE_ERR = 'DATA_CLONE_ERR';
var Error = getBuiltIn('Error');
// NodeJS < 17.0 does not expose `DOMException` to global
var NativeDOMException = getBuiltIn(DOM_EXCEPTION) || (function () {
  try {
    // NodeJS < 15.0 does not expose `MessageChannel` to global
    var MessageChannel = getBuiltIn('MessageChannel') || tryNodeRequire('worker_threads').MessageChannel;
    // eslint-disable-next-line es-x/no-weak-map, unicorn/require-post-message-target-origin -- safe
    new MessageChannel().port1.postMessage(new WeakMap());
  } catch (error) {
    if (error.name == DATA_CLONE_ERR && error.code == 25) return error.constructor;
  }
})();
var NativeDOMExceptionPrototype = NativeDOMException && NativeDOMException.prototype;
var ErrorPrototype = Error.prototype;
var setInternalState = InternalStateModule.set;
var getInternalState = InternalStateModule.getterFor(DOM_EXCEPTION);
var HAS_STACK = 'stack' in Error(DOM_EXCEPTION);

var codeFor = function (name) {
  return hasOwn(DOMExceptionConstants, name) && DOMExceptionConstants[name].m ? DOMExceptionConstants[name].c : 0;
};

var $DOMException = function DOMException() {
  anInstance(this, DOMExceptionPrototype);
  var argumentsLength = arguments.length;
  var message = normalizeStringArgument(argumentsLength < 1 ? undefined : arguments[0]);
  var name = normalizeStringArgument(argumentsLength < 2 ? undefined : arguments[1], 'Error');
  var code = codeFor(name);
  setInternalState(this, {
    type: DOM_EXCEPTION,
    name: name,
    message: message,
    code: code
  });
  if (!DESCRIPTORS) {
    this.name = name;
    this.message = message;
    this.code = code;
  }
  if (HAS_STACK) {
    var error = Error(message);
    error.name = DOM_EXCEPTION;
    defineProperty(this, 'stack', createPropertyDescriptor(1, clearErrorStack(error.stack, 1)));
  }
};

var DOMExceptionPrototype = $DOMException.prototype = create(ErrorPrototype);

var createGetterDescriptor = function (get) {
  return { enumerable: true, configurable: true, get: get };
};

var getterFor = function (key) {
  return createGetterDescriptor(function () {
    return getInternalState(this)[key];
  });
};

if (DESCRIPTORS) {
  defineBuiltInAccessor(DOMExceptionPrototype, 'code', getterFor('code'));
  defineBuiltInAccessor(DOMExceptionPrototype, 'message', getterFor('message'));
  defineBuiltInAccessor(DOMExceptionPrototype, 'name', getterFor('name'));
}

defineProperty(DOMExceptionPrototype, 'constructor', createPropertyDescriptor(1, $DOMException));

// FF36- DOMException is a function, but can't be constructed
var INCORRECT_CONSTRUCTOR = fails(function () {
  return !(new NativeDOMException() instanceof Error);
});

// Safari 10.1 / Chrome 32- / IE8- DOMException.prototype.toString bugs
var INCORRECT_TO_STRING = INCORRECT_CONSTRUCTOR || fails(function () {
  return ErrorPrototype.toString !== errorToString || String(new NativeDOMException(1, 2)) !== '2: 1';
});

// Deno 1.6.3- DOMException.prototype.code just missed
var INCORRECT_CODE = INCORRECT_CONSTRUCTOR || fails(function () {
  return new NativeDOMException(1, 'DataCloneError').code !== 25;
});

// Deno 1.6.3- DOMException constants just missed
var MISSED_CONSTANTS = INCORRECT_CONSTRUCTOR
  || NativeDOMException[DATA_CLONE_ERR] !== 25
  || NativeDOMExceptionPrototype[DATA_CLONE_ERR] !== 25;

var FORCED_CONSTRUCTOR = IS_PURE ? INCORRECT_TO_STRING || INCORRECT_CODE || MISSED_CONSTANTS : INCORRECT_CONSTRUCTOR;

// `DOMException` constructor
// https://webidl.spec.whatwg.org/#idl-DOMException
$({ global: true, constructor: true, forced: FORCED_CONSTRUCTOR }, {
  DOMException: FORCED_CONSTRUCTOR ? $DOMException : NativeDOMException
});

var PolyfilledDOMException = getBuiltIn(DOM_EXCEPTION);
var PolyfilledDOMExceptionPrototype = PolyfilledDOMException.prototype;

if (INCORRECT_TO_STRING && (IS_PURE || NativeDOMException === PolyfilledDOMException)) {
  defineBuiltIn(PolyfilledDOMExceptionPrototype, 'toString', errorToString);
}

if (INCORRECT_CODE && DESCRIPTORS && NativeDOMException === PolyfilledDOMException) {
  defineBuiltInAccessor(PolyfilledDOMExceptionPrototype, 'code', createGetterDescriptor(function () {
    return codeFor(anObject(this).name);
  }));
}

for (var key in DOMExceptionConstants) if (hasOwn(DOMExceptionConstants, key)) {
  var constant = DOMExceptionConstants[key];
  var constantName = constant.s;
  var descriptor = createPropertyDescriptor(6, constant.c);
  if (!hasOwn(PolyfilledDOMException, constantName)) {
    defineProperty(PolyfilledDOMException, constantName, descriptor);
  }
  if (!hasOwn(PolyfilledDOMExceptionPrototype, constantName)) {
    defineProperty(PolyfilledDOMExceptionPrototype, constantName, descriptor);
  }
}


/***/ }),

/***/ 2801:
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

"use strict";

var $ = __webpack_require__(2109);
var getBuiltIn = __webpack_require__(5005);
var createPropertyDescriptor = __webpack_require__(9114);
var defineProperty = (__webpack_require__(3070).f);
var hasOwn = __webpack_require__(2597);
var anInstance = __webpack_require__(5787);
var inheritIfRequired = __webpack_require__(9587);
var normalizeStringArgument = __webpack_require__(6277);
var DOMExceptionConstants = __webpack_require__(3678);
var clearErrorStack = __webpack_require__(7741);
var IS_PURE = __webpack_require__(1913);

var DOM_EXCEPTION = 'DOMException';
var Error = getBuiltIn('Error');
var NativeDOMException = getBuiltIn(DOM_EXCEPTION);

var $DOMException = function DOMException() {
  anInstance(this, DOMExceptionPrototype);
  var argumentsLength = arguments.length;
  var message = normalizeStringArgument(argumentsLength < 1 ? undefined : arguments[0]);
  var name = normalizeStringArgument(argumentsLength < 2 ? undefined : arguments[1], 'Error');
  var that = new NativeDOMException(message, name);
  var error = Error(message);
  error.name = DOM_EXCEPTION;
  defineProperty(that, 'stack', createPropertyDescriptor(1, clearErrorStack(error.stack, 1)));
  inheritIfRequired(that, this, $DOMException);
  return that;
};

var DOMExceptionPrototype = $DOMException.prototype = NativeDOMException.prototype;

var ERROR_HAS_STACK = 'stack' in Error(DOM_EXCEPTION);
var DOM_EXCEPTION_HAS_STACK = 'stack' in new NativeDOMException(1, 2);
var FORCED_CONSTRUCTOR = ERROR_HAS_STACK && !DOM_EXCEPTION_HAS_STACK;

// `DOMException` constructor patch for `.stack` where it's required
// https://webidl.spec.whatwg.org/#es-DOMException-specialness
$({ global: true, constructor: true, forced: IS_PURE || FORCED_CONSTRUCTOR }, { // TODO: fix export logic
  DOMException: FORCED_CONSTRUCTOR ? $DOMException : NativeDOMException
});

var PolyfilledDOMException = getBuiltIn(DOM_EXCEPTION);
var PolyfilledDOMExceptionPrototype = PolyfilledDOMException.prototype;

if (PolyfilledDOMExceptionPrototype.constructor !== PolyfilledDOMException) {
  if (!IS_PURE) {
    defineProperty(PolyfilledDOMExceptionPrototype, 'constructor', createPropertyDescriptor(1, PolyfilledDOMException));
  }

  for (var key in DOMExceptionConstants) if (hasOwn(DOMExceptionConstants, key)) {
    var constant = DOMExceptionConstants[key];
    var constantName = constant.s;
    if (!hasOwn(PolyfilledDOMException, constantName)) {
      defineProperty(PolyfilledDOMException, constantName, createPropertyDescriptor(6, constant.c));
    }
  }
}


/***/ }),

/***/ 1174:
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

var getBuiltIn = __webpack_require__(5005);
var setToStringTag = __webpack_require__(8003);

var DOM_EXCEPTION = 'DOMException';

setToStringTag(getBuiltIn(DOM_EXCEPTION), DOM_EXCEPTION);


/***/ }),

/***/ 7964:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

__webpack_require__(2526);

__webpack_require__(1817);

__webpack_require__(1539);

__webpack_require__(2165);

__webpack_require__(6992);

__webpack_require__(8783);

__webpack_require__(3948);

function _typeof(obj) {
  "@babel/helpers - typeof";

  return (module.exports = _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) {
    return typeof obj;
  } : function (obj) {
    return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
  }, module.exports.__esModule = true, module.exports["default"] = module.exports), _typeof(obj);
}

module.exports = _typeof, module.exports.__esModule = true, module.exports["default"] = module.exports;

/***/ }),

/***/ 858:
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;var _typeof = (__webpack_require__(7964)["default"]);

__webpack_require__(5003);

__webpack_require__(1703);

__webpack_require__(4916);

__webpack_require__(5306);

__webpack_require__(4603);

__webpack_require__(8450);

__webpack_require__(8386);

__webpack_require__(9714);

__webpack_require__(3210);

// addapted from the document.currentScript polyfill by Adam Miller
// MIT license
// source: https://github.com/amiller-gh/currentScript-polyfill
// added support for Firefox https://bugzilla.mozilla.org/show_bug.cgi?id=1620505
(function (root, factory) {
  if (true) {
    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory),
		__WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ?
		(__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
  } else {}
})(typeof self !== 'undefined' ? self : this, function () {
  function getCurrentScript() {
    var descriptor = Object.getOwnPropertyDescriptor(document, 'currentScript'); // for chrome

    if (!descriptor && 'currentScript' in document && document.currentScript) {
      return document.currentScript;
    } // for other browsers with native support for currentScript


    if (descriptor && descriptor.get !== getCurrentScript && document.currentScript) {
      return document.currentScript;
    } // IE 8-10 support script readyState
    // IE 11+ & Firefox support stack trace


    try {
      throw new Error();
    } catch (err) {
      // Find the second match for the "at" string to get file src url from stack.
      var ieStackRegExp = /.*at [^(]*\((.*):(.+):(.+)\)$/ig,
          ffStackRegExp = /@([^@]*):(\d+):(\d+)\s*$/ig,
          stackDetails = ieStackRegExp.exec(err.stack) || ffStackRegExp.exec(err.stack),
          scriptLocation = stackDetails && stackDetails[1] || false,
          line = stackDetails && stackDetails[2] || false,
          currentLocation = document.location.href.replace(document.location.hash, ''),
          pageSource,
          inlineScriptSourceRegExp,
          inlineScriptSource,
          scripts = document.getElementsByTagName('script'); // Live NodeList collection

      if (scriptLocation === currentLocation) {
        pageSource = document.documentElement.outerHTML;
        inlineScriptSourceRegExp = new RegExp('(?:[^\\n]+?\\n){0,' + (line - 2) + '}[^<]*<script>([\\d\\D]*?)<\\/script>[\\d\\D]*', 'i');
        inlineScriptSource = pageSource.replace(inlineScriptSourceRegExp, '$1').trim();
      }

      for (var i = 0; i < scripts.length; i++) {
        // If ready state is interactive, return the script tag
        if (scripts[i].readyState === 'interactive') {
          return scripts[i];
        } // If src matches, return the script tag


        if (scripts[i].src === scriptLocation) {
          return scripts[i];
        } // If inline source matches, return the script tag


        if (scriptLocation === currentLocation && scripts[i].innerHTML && scripts[i].innerHTML.trim() === inlineScriptSource) {
          return scripts[i];
        }
      } // If no match, return null


      return null;
    }
  }

  ;
  return getCurrentScript;
});

/***/ }),

/***/ 9014:
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;var _typeof = (__webpack_require__(7964)["default"]);

__webpack_require__(5837);

__webpack_require__(7042);

__webpack_require__(2222);

__webpack_require__(3210);

__webpack_require__(4916);

__webpack_require__(5306);

__webpack_require__(3123);

__webpack_require__(9600);

__webpack_require__(1703);

__webpack_require__(1539);

__webpack_require__(6699);

__webpack_require__(2023);

__webpack_require__(561);

__webpack_require__(3689);

__webpack_require__(7601);

__webpack_require__(4603);

__webpack_require__(8450);

__webpack_require__(8386);

__webpack_require__(9714);

__webpack_require__(7327);

__webpack_require__(2707);

__webpack_require__(8309);

__webpack_require__(6992);

__webpack_require__(2472);

__webpack_require__(8675);

__webpack_require__(2990);

__webpack_require__(8927);

__webpack_require__(3105);

__webpack_require__(5035);

__webpack_require__(4345);

__webpack_require__(7174);

__webpack_require__(2846);

__webpack_require__(4731);

__webpack_require__(7209);

__webpack_require__(6319);

__webpack_require__(8867);

__webpack_require__(7789);

__webpack_require__(3739);

__webpack_require__(9368);

__webpack_require__(4483);

__webpack_require__(2056);

__webpack_require__(3462);

__webpack_require__(678);

__webpack_require__(7462);

__webpack_require__(3824);

__webpack_require__(5021);

__webpack_require__(2974);

__webpack_require__(5016);

__webpack_require__(9653);

__webpack_require__(3290);

__webpack_require__(1249);

/* @preserve
 * Leaflet 1.8.0, a JS library for interactive maps. https://leafletjs.com
 * (c) 2010-2022 Vladimir Agafonkin, (c) 2010-2011 CloudMade
 */
(function (global, factory) {
  ( false ? 0 : _typeof(exports)) === 'object' && "object" !== 'undefined' ? factory(exports) :  true ? !(__WEBPACK_AMD_DEFINE_ARRAY__ = [exports], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory),
		__WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ?
		(__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)) : (0);
})(this, function (exports) {
  'use strict';

  var version = "1.8.0";
  /*
   * @namespace Util
   *
   * Various utility functions, used by Leaflet internally.
   */
  // @function extend(dest: Object, src?: Object): Object
  // Merges the properties of the `src` object (or multiple objects) into `dest` object and returns the latter. Has an `L.extend` shortcut.

  function extend(dest) {
    var i, j, len, src;

    for (j = 1, len = arguments.length; j < len; j++) {
      src = arguments[j];

      for (i in src) {
        dest[i] = src[i];
      }
    }

    return dest;
  } // @function create(proto: Object, properties?: Object): Object
  // Compatibility polyfill for [Object.create](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/create)


  var create$2 = Object.create || function () {
    function F() {}

    return function (proto) {
      F.prototype = proto;
      return new F();
    };
  }(); // @function bind(fn: Function, …): Function
  // Returns a new function bound to the arguments passed, like [Function.prototype.bind](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Function/bind).
  // Has a `L.bind()` shortcut.


  function bind(fn, obj) {
    var slice = Array.prototype.slice;

    if (fn.bind) {
      return fn.bind.apply(fn, slice.call(arguments, 1));
    }

    var args = slice.call(arguments, 2);
    return function () {
      return fn.apply(obj, args.length ? args.concat(slice.call(arguments)) : arguments);
    };
  } // @property lastId: Number
  // Last unique ID used by [`stamp()`](#util-stamp)


  var lastId = 0; // @function stamp(obj: Object): Number
  // Returns the unique ID of an object, assigning it one if it doesn't have it.

  function stamp(obj) {
    if (!('_leaflet_id' in obj)) {
      obj['_leaflet_id'] = ++lastId;
    }

    return obj._leaflet_id;
  } // @function throttle(fn: Function, time: Number, context: Object): Function
  // Returns a function which executes function `fn` with the given scope `context`
  // (so that the `this` keyword refers to `context` inside `fn`'s code). The function
  // `fn` will be called no more than one time per given amount of `time`. The arguments
  // received by the bound function will be any arguments passed when binding the
  // function, followed by any arguments passed when invoking the bound function.
  // Has an `L.throttle` shortcut.


  function throttle(fn, time, context) {
    var lock, args, wrapperFn, later;

    later = function later() {
      // reset lock and call if queued
      lock = false;

      if (args) {
        wrapperFn.apply(context, args);
        args = false;
      }
    };

    wrapperFn = function wrapperFn() {
      if (lock) {
        // called too soon, queue to call later
        args = arguments;
      } else {
        // call and lock until later
        fn.apply(context, arguments);
        setTimeout(later, time);
        lock = true;
      }
    };

    return wrapperFn;
  } // @function wrapNum(num: Number, range: Number[], includeMax?: Boolean): Number
  // Returns the number `num` modulo `range` in such a way so it lies within
  // `range[0]` and `range[1]`. The returned value will be always smaller than
  // `range[1]` unless `includeMax` is set to `true`.


  function wrapNum(x, range, includeMax) {
    var max = range[1],
        min = range[0],
        d = max - min;
    return x === max && includeMax ? x : ((x - min) % d + d) % d + min;
  } // @function falseFn(): Function
  // Returns a function which always returns `false`.


  function falseFn() {
    return false;
  } // @function formatNum(num: Number, precision?: Number|false): Number
  // Returns the number `num` rounded with specified `precision`.
  // The default `precision` value is 6 decimal places.
  // `false` can be passed to skip any processing (can be useful to avoid round-off errors).


  function formatNum(num, precision) {
    if (precision === false) {
      return num;
    }

    var pow = Math.pow(10, precision === undefined ? 6 : precision);
    return Math.round(num * pow) / pow;
  } // @function trim(str: String): String
  // Compatibility polyfill for [String.prototype.trim](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String/Trim)


  function trim(str) {
    return str.trim ? str.trim() : str.replace(/^\s+|\s+$/g, '');
  } // @function splitWords(str: String): String[]
  // Trims and splits the string on whitespace and returns the array of parts.


  function splitWords(str) {
    return trim(str).split(/\s+/);
  } // @function setOptions(obj: Object, options: Object): Object
  // Merges the given properties to the `options` of the `obj` object, returning the resulting options. See `Class options`. Has an `L.setOptions` shortcut.


  function setOptions(obj, options) {
    if (!Object.prototype.hasOwnProperty.call(obj, 'options')) {
      obj.options = obj.options ? create$2(obj.options) : {};
    }

    for (var i in options) {
      obj.options[i] = options[i];
    }

    return obj.options;
  } // @function getParamString(obj: Object, existingUrl?: String, uppercase?: Boolean): String
  // Converts an object into a parameter URL string, e.g. `{a: "foo", b: "bar"}`
  // translates to `'?a=foo&b=bar'`. If `existingUrl` is set, the parameters will
  // be appended at the end. If `uppercase` is `true`, the parameter names will
  // be uppercased (e.g. `'?A=foo&B=bar'`)


  function getParamString(obj, existingUrl, uppercase) {
    var params = [];

    for (var i in obj) {
      params.push(encodeURIComponent(uppercase ? i.toUpperCase() : i) + '=' + encodeURIComponent(obj[i]));
    }

    return (!existingUrl || existingUrl.indexOf('?') === -1 ? '?' : '&') + params.join('&');
  }

  var templateRe = /\{ *([\w_ -]+) *\}/g; // @function template(str: String, data: Object): String
  // Simple templating facility, accepts a template string of the form `'Hello {a}, {b}'`
  // and a data object like `{a: 'foo', b: 'bar'}`, returns evaluated string
  // `('Hello foo, bar')`. You can also specify functions instead of strings for
  // data values — they will be evaluated passing `data` as an argument.

  function template(str, data) {
    return str.replace(templateRe, function (str, key) {
      var value = data[key];

      if (value === undefined) {
        throw new Error('No value provided for variable ' + str);
      } else if (typeof value === 'function') {
        value = value(data);
      }

      return value;
    });
  } // @function isArray(obj): Boolean
  // Compatibility polyfill for [Array.isArray](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray)


  var isArray = Array.isArray || function (obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
  }; // @function indexOf(array: Array, el: Object): Number
  // Compatibility polyfill for [Array.prototype.indexOf](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array/indexOf)


  function indexOf(array, el) {
    for (var i = 0; i < array.length; i++) {
      if (array[i] === el) {
        return i;
      }
    }

    return -1;
  } // @property emptyImageUrl: String
  // Data URI string containing a base64-encoded empty GIF image.
  // Used as a hack to free memory from unused images on WebKit-powered
  // mobile devices (by setting image `src` to this string).


  var emptyImageUrl = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='; // inspired by https://paulirish.com/2011/requestanimationframe-for-smart-animating/

  function getPrefixed(name) {
    return window['webkit' + name] || window['moz' + name] || window['ms' + name];
  }

  var lastTime = 0; // fallback for IE 7-8

  function timeoutDefer(fn) {
    var time = +new Date(),
        timeToCall = Math.max(0, 16 - (time - lastTime));
    lastTime = time + timeToCall;
    return window.setTimeout(fn, timeToCall);
  }

  var requestFn = window.requestAnimationFrame || getPrefixed('RequestAnimationFrame') || timeoutDefer;

  var cancelFn = window.cancelAnimationFrame || getPrefixed('CancelAnimationFrame') || getPrefixed('CancelRequestAnimationFrame') || function (id) {
    window.clearTimeout(id);
  }; // @function requestAnimFrame(fn: Function, context?: Object, immediate?: Boolean): Number
  // Schedules `fn` to be executed when the browser repaints. `fn` is bound to
  // `context` if given. When `immediate` is set, `fn` is called immediately if
  // the browser doesn't have native support for
  // [`window.requestAnimationFrame`](https://developer.mozilla.org/docs/Web/API/window/requestAnimationFrame),
  // otherwise it's delayed. Returns a request ID that can be used to cancel the request.


  function requestAnimFrame(fn, context, immediate) {
    if (immediate && requestFn === timeoutDefer) {
      fn.call(context);
    } else {
      return requestFn.call(window, bind(fn, context));
    }
  } // @function cancelAnimFrame(id: Number): undefined
  // Cancels a previous `requestAnimFrame`. See also [window.cancelAnimationFrame](https://developer.mozilla.org/docs/Web/API/window/cancelAnimationFrame).


  function cancelAnimFrame(id) {
    if (id) {
      cancelFn.call(window, id);
    }
  }

  var Util = {
    __proto__: null,
    extend: extend,
    create: create$2,
    bind: bind,

    get lastId() {
      return lastId;
    },

    stamp: stamp,
    throttle: throttle,
    wrapNum: wrapNum,
    falseFn: falseFn,
    formatNum: formatNum,
    trim: trim,
    splitWords: splitWords,
    setOptions: setOptions,
    getParamString: getParamString,
    template: template,
    isArray: isArray,
    indexOf: indexOf,
    emptyImageUrl: emptyImageUrl,
    requestFn: requestFn,
    cancelFn: cancelFn,
    requestAnimFrame: requestAnimFrame,
    cancelAnimFrame: cancelAnimFrame
  }; // @class Class
  // @aka L.Class
  // @section
  // @uninheritable
  // Thanks to John Resig and Dean Edwards for inspiration!

  function Class() {}

  Class.extend = function (props) {
    // @function extend(props: Object): Function
    // [Extends the current class](#class-inheritance) given the properties to be included.
    // Returns a Javascript function that is a class constructor (to be called with `new`).
    var NewClass = function NewClass() {
      setOptions(this); // call the constructor

      if (this.initialize) {
        this.initialize.apply(this, arguments);
      } // call all constructor hooks


      this.callInitHooks();
    };

    var parentProto = NewClass.__super__ = this.prototype;
    var proto = create$2(parentProto);
    proto.constructor = NewClass;
    NewClass.prototype = proto; // inherit parent's statics

    for (var i in this) {
      if (Object.prototype.hasOwnProperty.call(this, i) && i !== 'prototype' && i !== '__super__') {
        NewClass[i] = this[i];
      }
    } // mix static properties into the class


    if (props.statics) {
      extend(NewClass, props.statics);
    } // mix includes into the prototype


    if (props.includes) {
      checkDeprecatedMixinEvents(props.includes);
      extend.apply(null, [proto].concat(props.includes));
    } // mix given properties into the prototype


    extend(proto, props);
    delete proto.statics;
    delete proto.includes; // merge options

    if (proto.options) {
      proto.options = parentProto.options ? create$2(parentProto.options) : {};
      extend(proto.options, props.options);
    }

    proto._initHooks = []; // add method for calling all hooks

    proto.callInitHooks = function () {
      if (this._initHooksCalled) {
        return;
      }

      if (parentProto.callInitHooks) {
        parentProto.callInitHooks.call(this);
      }

      this._initHooksCalled = true;

      for (var i = 0, len = proto._initHooks.length; i < len; i++) {
        proto._initHooks[i].call(this);
      }
    };

    return NewClass;
  }; // @function include(properties: Object): this
  // [Includes a mixin](#class-includes) into the current class.


  Class.include = function (props) {
    var parentOptions = this.prototype.options;
    extend(this.prototype, props);

    if (props.options) {
      this.prototype.options = parentOptions;
      this.mergeOptions(props.options);
    }

    return this;
  }; // @function mergeOptions(options: Object): this
  // [Merges `options`](#class-options) into the defaults of the class.


  Class.mergeOptions = function (options) {
    extend(this.prototype.options, options);
    return this;
  }; // @function addInitHook(fn: Function): this
  // Adds a [constructor hook](#class-constructor-hooks) to the class.


  Class.addInitHook = function (fn) {
    // (Function) || (String, args...)
    var args = Array.prototype.slice.call(arguments, 1);
    var init = typeof fn === 'function' ? fn : function () {
      this[fn].apply(this, args);
    };
    this.prototype._initHooks = this.prototype._initHooks || [];

    this.prototype._initHooks.push(init);

    return this;
  };

  function checkDeprecatedMixinEvents(includes) {
    if (typeof L === 'undefined' || !L || !L.Mixin) {
      return;
    }

    includes = isArray(includes) ? includes : [includes];

    for (var i = 0; i < includes.length; i++) {
      if (includes[i] === L.Mixin.Events) {
        console.warn('Deprecated include of L.Mixin.Events: ' + 'this property will be removed in future releases, ' + 'please inherit from L.Evented instead.', new Error().stack);
      }
    }
  }
  /*
   * @class Evented
   * @aka L.Evented
   * @inherits Class
   *
   * A set of methods shared between event-powered classes (like `Map` and `Marker`). Generally, events allow you to execute some function when something happens with an object (e.g. the user clicks on the map, causing the map to fire `'click'` event).
   *
   * @example
   *
   * ```js
   * map.on('click', function(e) {
   * 	alert(e.latlng);
   * } );
   * ```
   *
   * Leaflet deals with event listeners by reference, so if you want to add a listener and then remove it, define it as a function:
   *
   * ```js
   * function onClick(e) { ... }
   *
   * map.on('click', onClick);
   * map.off('click', onClick);
   * ```
   */


  var Events = {
    /* @method on(type: String, fn: Function, context?: Object): this
     * Adds a listener function (`fn`) to a particular event type of the object. You can optionally specify the context of the listener (object the this keyword will point to). You can also pass several space-separated types (e.g. `'click dblclick'`).
     *
     * @alternative
     * @method on(eventMap: Object): this
     * Adds a set of type/listener pairs, e.g. `{click: onClick, mousemove: onMouseMove}`
     */
    on: function on(types, fn, context) {
      // types can be a map of types/handlers
      if (_typeof(types) === 'object') {
        for (var type in types) {
          // we don't process space-separated events here for performance;
          // it's a hot path since Layer uses the on(obj) syntax
          this._on(type, types[type], fn);
        }
      } else {
        // types can be a string of space-separated words
        types = splitWords(types);

        for (var i = 0, len = types.length; i < len; i++) {
          this._on(types[i], fn, context);
        }
      }

      return this;
    },

    /* @method off(type: String, fn?: Function, context?: Object): this
     * Removes a previously added listener function. If no function is specified, it will remove all the listeners of that particular event from the object. Note that if you passed a custom context to `on`, you must pass the same context to `off` in order to remove the listener.
     *
     * @alternative
     * @method off(eventMap: Object): this
     * Removes a set of type/listener pairs.
     *
     * @alternative
     * @method off: this
     * Removes all listeners to all events on the object. This includes implicitly attached events.
     */
    off: function off(types, fn, context) {
      if (!arguments.length) {
        // clear all listeners if called without arguments
        delete this._events;
      } else if (_typeof(types) === 'object') {
        for (var type in types) {
          this._off(type, types[type], fn);
        }
      } else {
        types = splitWords(types);
        var removeAll = arguments.length === 1;

        for (var i = 0, len = types.length; i < len; i++) {
          if (removeAll) {
            this._off(types[i]);
          } else {
            this._off(types[i], fn, context);
          }
        }
      }

      return this;
    },
    // attach listener (without syntactic sugar now)
    _on: function _on(type, fn, context) {
      if (typeof fn !== 'function') {
        console.warn('wrong listener type: ' + _typeof(fn));
        return;
      }

      this._events = this._events || {};
      /* get/init listeners for type */

      var typeListeners = this._events[type];

      if (!typeListeners) {
        typeListeners = [];
        this._events[type] = typeListeners;
      }

      if (context === this) {
        // Less memory footprint.
        context = undefined;
      }

      var newListener = {
        fn: fn,
        ctx: context
      },
          listeners = typeListeners; // check if fn already there

      for (var i = 0, len = listeners.length; i < len; i++) {
        if (listeners[i].fn === fn && listeners[i].ctx === context) {
          return;
        }
      }

      listeners.push(newListener);
    },
    _off: function _off(type, fn, context) {
      var listeners, i, len;

      if (!this._events) {
        return;
      }

      listeners = this._events[type];

      if (!listeners) {
        return;
      }

      if (arguments.length === 1) {
        // remove all
        if (this._firingCount) {
          // Set all removed listeners to noop
          // so they are not called if remove happens in fire
          for (i = 0, len = listeners.length; i < len; i++) {
            listeners[i].fn = falseFn;
          }
        } // clear all listeners for a type if function isn't specified


        delete this._events[type];
        return;
      }

      if (context === this) {
        context = undefined;
      }

      if (typeof fn !== 'function') {
        console.warn('wrong listener type: ' + _typeof(fn));
        return;
      } // find fn and remove it


      for (i = 0, len = listeners.length; i < len; i++) {
        var l = listeners[i];

        if (l.ctx !== context) {
          continue;
        }

        if (l.fn === fn) {
          if (this._firingCount) {
            // set the removed listener to noop so that's not called if remove happens in fire
            l.fn = falseFn;
            /* copy array in case events are being fired */

            this._events[type] = listeners = listeners.slice();
          }

          listeners.splice(i, 1);
          return;
        }
      }

      console.warn('listener not found');
    },
    // @method fire(type: String, data?: Object, propagate?: Boolean): this
    // Fires an event of the specified type. You can optionally provide a data
    // object — the first argument of the listener function will contain its
    // properties. The event can optionally be propagated to event parents.
    fire: function fire(type, data, propagate) {
      if (!this.listens(type, propagate)) {
        return this;
      }

      var event = extend({}, data, {
        type: type,
        target: this,
        sourceTarget: data && data.sourceTarget || this
      });

      if (this._events) {
        var listeners = this._events[type];

        if (listeners) {
          this._firingCount = this._firingCount + 1 || 1;

          for (var i = 0, len = listeners.length; i < len; i++) {
            var l = listeners[i];
            l.fn.call(l.ctx || this, event);
          }

          this._firingCount--;
        }
      }

      if (propagate) {
        // propagate the event to parents (set with addEventParent)
        this._propagateEvent(event);
      }

      return this;
    },
    // @method listens(type: String, propagate?: Boolean): Boolean
    // Returns `true` if a particular event type has any listeners attached to it.
    // The verification can optionally be propagated, it will return `true` if parents have the listener attached to it.
    listens: function listens(type, propagate) {
      if (typeof type !== 'string') {
        console.warn('"string" type argument expected');
      }

      var listeners = this._events && this._events[type];

      if (listeners && listeners.length) {
        return true;
      }

      if (propagate) {
        // also check parents for listeners if event propagates
        for (var id in this._eventParents) {
          if (this._eventParents[id].listens(type, propagate)) {
            return true;
          }
        }
      }

      return false;
    },
    // @method once(…): this
    // Behaves as [`on(…)`](#evented-on), except the listener will only get fired once and then removed.
    once: function once(types, fn, context) {
      if (_typeof(types) === 'object') {
        for (var type in types) {
          this.once(type, types[type], fn);
        }

        return this;
      }

      var handler = bind(function () {
        this.off(types, fn, context).off(types, handler, context);
      }, this); // add a listener that's executed once and removed after that

      return this.on(types, fn, context).on(types, handler, context);
    },
    // @method addEventParent(obj: Evented): this
    // Adds an event parent - an `Evented` that will receive propagated events
    addEventParent: function addEventParent(obj) {
      this._eventParents = this._eventParents || {};
      this._eventParents[stamp(obj)] = obj;
      return this;
    },
    // @method removeEventParent(obj: Evented): this
    // Removes an event parent, so it will stop receiving propagated events
    removeEventParent: function removeEventParent(obj) {
      if (this._eventParents) {
        delete this._eventParents[stamp(obj)];
      }

      return this;
    },
    _propagateEvent: function _propagateEvent(e) {
      for (var id in this._eventParents) {
        this._eventParents[id].fire(e.type, extend({
          layer: e.target,
          propagatedFrom: e.target
        }, e), true);
      }
    }
  }; // aliases; we should ditch those eventually
  // @method addEventListener(…): this
  // Alias to [`on(…)`](#evented-on)

  Events.addEventListener = Events.on; // @method removeEventListener(…): this
  // Alias to [`off(…)`](#evented-off)
  // @method clearAllEventListeners(…): this
  // Alias to [`off()`](#evented-off)

  Events.removeEventListener = Events.clearAllEventListeners = Events.off; // @method addOneTimeEventListener(…): this
  // Alias to [`once(…)`](#evented-once)

  Events.addOneTimeEventListener = Events.once; // @method fireEvent(…): this
  // Alias to [`fire(…)`](#evented-fire)

  Events.fireEvent = Events.fire; // @method hasEventListeners(…): Boolean
  // Alias to [`listens(…)`](#evented-listens)

  Events.hasEventListeners = Events.listens;
  var Evented = Class.extend(Events);
  /*
   * @class Point
   * @aka L.Point
   *
   * Represents a point with `x` and `y` coordinates in pixels.
   *
   * @example
   *
   * ```js
   * var point = L.point(200, 300);
   * ```
   *
   * All Leaflet methods and options that accept `Point` objects also accept them in a simple Array form (unless noted otherwise), so these lines are equivalent:
   *
   * ```js
   * map.panBy([200, 300]);
   * map.panBy(L.point(200, 300));
   * ```
   *
   * Note that `Point` does not inherit from Leaflet's `Class` object,
   * which means new classes can't inherit from it, and new methods
   * can't be added to it with the `include` function.
   */

  function Point(x, y, round) {
    // @property x: Number; The `x` coordinate of the point
    this.x = round ? Math.round(x) : x; // @property y: Number; The `y` coordinate of the point

    this.y = round ? Math.round(y) : y;
  }

  var trunc = Math.trunc || function (v) {
    return v > 0 ? Math.floor(v) : Math.ceil(v);
  };

  Point.prototype = {
    // @method clone(): Point
    // Returns a copy of the current point.
    clone: function clone() {
      return new Point(this.x, this.y);
    },
    // @method add(otherPoint: Point): Point
    // Returns the result of addition of the current and the given points.
    add: function add(point) {
      // non-destructive, returns a new point
      return this.clone()._add(toPoint(point));
    },
    _add: function _add(point) {
      // destructive, used directly for performance in situations where it's safe to modify existing point
      this.x += point.x;
      this.y += point.y;
      return this;
    },
    // @method subtract(otherPoint: Point): Point
    // Returns the result of subtraction of the given point from the current.
    subtract: function subtract(point) {
      return this.clone()._subtract(toPoint(point));
    },
    _subtract: function _subtract(point) {
      this.x -= point.x;
      this.y -= point.y;
      return this;
    },
    // @method divideBy(num: Number): Point
    // Returns the result of division of the current point by the given number.
    divideBy: function divideBy(num) {
      return this.clone()._divideBy(num);
    },
    _divideBy: function _divideBy(num) {
      this.x /= num;
      this.y /= num;
      return this;
    },
    // @method multiplyBy(num: Number): Point
    // Returns the result of multiplication of the current point by the given number.
    multiplyBy: function multiplyBy(num) {
      return this.clone()._multiplyBy(num);
    },
    _multiplyBy: function _multiplyBy(num) {
      this.x *= num;
      this.y *= num;
      return this;
    },
    // @method scaleBy(scale: Point): Point
    // Multiply each coordinate of the current point by each coordinate of
    // `scale`. In linear algebra terms, multiply the point by the
    // [scaling matrix](https://en.wikipedia.org/wiki/Scaling_%28geometry%29#Matrix_representation)
    // defined by `scale`.
    scaleBy: function scaleBy(point) {
      return new Point(this.x * point.x, this.y * point.y);
    },
    // @method unscaleBy(scale: Point): Point
    // Inverse of `scaleBy`. Divide each coordinate of the current point by
    // each coordinate of `scale`.
    unscaleBy: function unscaleBy(point) {
      return new Point(this.x / point.x, this.y / point.y);
    },
    // @method round(): Point
    // Returns a copy of the current point with rounded coordinates.
    round: function round() {
      return this.clone()._round();
    },
    _round: function _round() {
      this.x = Math.round(this.x);
      this.y = Math.round(this.y);
      return this;
    },
    // @method floor(): Point
    // Returns a copy of the current point with floored coordinates (rounded down).
    floor: function floor() {
      return this.clone()._floor();
    },
    _floor: function _floor() {
      this.x = Math.floor(this.x);
      this.y = Math.floor(this.y);
      return this;
    },
    // @method ceil(): Point
    // Returns a copy of the current point with ceiled coordinates (rounded up).
    ceil: function ceil() {
      return this.clone()._ceil();
    },
    _ceil: function _ceil() {
      this.x = Math.ceil(this.x);
      this.y = Math.ceil(this.y);
      return this;
    },
    // @method trunc(): Point
    // Returns a copy of the current point with truncated coordinates (rounded towards zero).
    trunc: function trunc() {
      return this.clone()._trunc();
    },
    _trunc: function _trunc() {
      this.x = trunc(this.x);
      this.y = trunc(this.y);
      return this;
    },
    // @method distanceTo(otherPoint: Point): Number
    // Returns the cartesian distance between the current and the given points.
    distanceTo: function distanceTo(point) {
      point = toPoint(point);
      var x = point.x - this.x,
          y = point.y - this.y;
      return Math.sqrt(x * x + y * y);
    },
    // @method equals(otherPoint: Point): Boolean
    // Returns `true` if the given point has the same coordinates.
    equals: function equals(point) {
      point = toPoint(point);
      return point.x === this.x && point.y === this.y;
    },
    // @method contains(otherPoint: Point): Boolean
    // Returns `true` if both coordinates of the given point are less than the corresponding current point coordinates (in absolute values).
    contains: function contains(point) {
      point = toPoint(point);
      return Math.abs(point.x) <= Math.abs(this.x) && Math.abs(point.y) <= Math.abs(this.y);
    },
    // @method toString(): String
    // Returns a string representation of the point for debugging purposes.
    toString: function toString() {
      return 'Point(' + formatNum(this.x) + ', ' + formatNum(this.y) + ')';
    }
  }; // @factory L.point(x: Number, y: Number, round?: Boolean)
  // Creates a Point object with the given `x` and `y` coordinates. If optional `round` is set to true, rounds the `x` and `y` values.
  // @alternative
  // @factory L.point(coords: Number[])
  // Expects an array of the form `[x, y]` instead.
  // @alternative
  // @factory L.point(coords: Object)
  // Expects a plain object of the form `{x: Number, y: Number}` instead.

  function toPoint(x, y, round) {
    if (x instanceof Point) {
      return x;
    }

    if (isArray(x)) {
      return new Point(x[0], x[1]);
    }

    if (x === undefined || x === null) {
      return x;
    }

    if (_typeof(x) === 'object' && 'x' in x && 'y' in x) {
      return new Point(x.x, x.y);
    }

    return new Point(x, y, round);
  }
  /*
   * @class Bounds
   * @aka L.Bounds
   *
   * Represents a rectangular area in pixel coordinates.
   *
   * @example
   *
   * ```js
   * var p1 = L.point(10, 10),
   * p2 = L.point(40, 60),
   * bounds = L.bounds(p1, p2);
   * ```
   *
   * All Leaflet methods that accept `Bounds` objects also accept them in a simple Array form (unless noted otherwise), so the bounds example above can be passed like this:
   *
   * ```js
   * otherBounds.intersects([[10, 10], [40, 60]]);
   * ```
   *
   * Note that `Bounds` does not inherit from Leaflet's `Class` object,
   * which means new classes can't inherit from it, and new methods
   * can't be added to it with the `include` function.
   */


  function Bounds(a, b) {
    if (!a) {
      return;
    }

    var points = b ? [a, b] : a;

    for (var i = 0, len = points.length; i < len; i++) {
      this.extend(points[i]);
    }
  }

  Bounds.prototype = {
    // @method extend(point: Point): this
    // Extends the bounds to contain the given point.
    extend: function extend(point) {
      // (Point)
      point = toPoint(point); // @property min: Point
      // The top left corner of the rectangle.
      // @property max: Point
      // The bottom right corner of the rectangle.

      if (!this.min && !this.max) {
        this.min = point.clone();
        this.max = point.clone();
      } else {
        this.min.x = Math.min(point.x, this.min.x);
        this.max.x = Math.max(point.x, this.max.x);
        this.min.y = Math.min(point.y, this.min.y);
        this.max.y = Math.max(point.y, this.max.y);
      }

      return this;
    },
    // @method getCenter(round?: Boolean): Point
    // Returns the center point of the bounds.
    getCenter: function getCenter(round) {
      return new Point((this.min.x + this.max.x) / 2, (this.min.y + this.max.y) / 2, round);
    },
    // @method getBottomLeft(): Point
    // Returns the bottom-left point of the bounds.
    getBottomLeft: function getBottomLeft() {
      return new Point(this.min.x, this.max.y);
    },
    // @method getTopRight(): Point
    // Returns the top-right point of the bounds.
    getTopRight: function getTopRight() {
      // -> Point
      return new Point(this.max.x, this.min.y);
    },
    // @method getTopLeft(): Point
    // Returns the top-left point of the bounds (i.e. [`this.min`](#bounds-min)).
    getTopLeft: function getTopLeft() {
      return this.min; // left, top
    },
    // @method getBottomRight(): Point
    // Returns the bottom-right point of the bounds (i.e. [`this.max`](#bounds-max)).
    getBottomRight: function getBottomRight() {
      return this.max; // right, bottom
    },
    // @method getSize(): Point
    // Returns the size of the given bounds
    getSize: function getSize() {
      return this.max.subtract(this.min);
    },
    // @method contains(otherBounds: Bounds): Boolean
    // Returns `true` if the rectangle contains the given one.
    // @alternative
    // @method contains(point: Point): Boolean
    // Returns `true` if the rectangle contains the given point.
    contains: function contains(obj) {
      var min, max;

      if (typeof obj[0] === 'number' || obj instanceof Point) {
        obj = toPoint(obj);
      } else {
        obj = toBounds(obj);
      }

      if (obj instanceof Bounds) {
        min = obj.min;
        max = obj.max;
      } else {
        min = max = obj;
      }

      return min.x >= this.min.x && max.x <= this.max.x && min.y >= this.min.y && max.y <= this.max.y;
    },
    // @method intersects(otherBounds: Bounds): Boolean
    // Returns `true` if the rectangle intersects the given bounds. Two bounds
    // intersect if they have at least one point in common.
    intersects: function intersects(bounds) {
      // (Bounds) -> Boolean
      bounds = toBounds(bounds);
      var min = this.min,
          max = this.max,
          min2 = bounds.min,
          max2 = bounds.max,
          xIntersects = max2.x >= min.x && min2.x <= max.x,
          yIntersects = max2.y >= min.y && min2.y <= max.y;
      return xIntersects && yIntersects;
    },
    // @method overlaps(otherBounds: Bounds): Boolean
    // Returns `true` if the rectangle overlaps the given bounds. Two bounds
    // overlap if their intersection is an area.
    overlaps: function overlaps(bounds) {
      // (Bounds) -> Boolean
      bounds = toBounds(bounds);
      var min = this.min,
          max = this.max,
          min2 = bounds.min,
          max2 = bounds.max,
          xOverlaps = max2.x > min.x && min2.x < max.x,
          yOverlaps = max2.y > min.y && min2.y < max.y;
      return xOverlaps && yOverlaps;
    },
    isValid: function isValid() {
      return !!(this.min && this.max);
    }
  }; // @factory L.bounds(corner1: Point, corner2: Point)
  // Creates a Bounds object from two corners coordinate pairs.
  // @alternative
  // @factory L.bounds(points: Point[])
  // Creates a Bounds object from the given array of points.

  function toBounds(a, b) {
    if (!a || a instanceof Bounds) {
      return a;
    }

    return new Bounds(a, b);
  }
  /*
   * @class LatLngBounds
   * @aka L.LatLngBounds
   *
   * Represents a rectangular geographical area on a map.
   *
   * @example
   *
   * ```js
   * var corner1 = L.latLng(40.712, -74.227),
   * corner2 = L.latLng(40.774, -74.125),
   * bounds = L.latLngBounds(corner1, corner2);
   * ```
   *
   * All Leaflet methods that accept LatLngBounds objects also accept them in a simple Array form (unless noted otherwise), so the bounds example above can be passed like this:
   *
   * ```js
   * map.fitBounds([
   * 	[40.712, -74.227],
   * 	[40.774, -74.125]
   * ]);
   * ```
   *
   * Caution: if the area crosses the antimeridian (often confused with the International Date Line), you must specify corners _outside_ the [-180, 180] degrees longitude range.
   *
   * Note that `LatLngBounds` does not inherit from Leaflet's `Class` object,
   * which means new classes can't inherit from it, and new methods
   * can't be added to it with the `include` function.
   */


  function LatLngBounds(corner1, corner2) {
    // (LatLng, LatLng) or (LatLng[])
    if (!corner1) {
      return;
    }

    var latlngs = corner2 ? [corner1, corner2] : corner1;

    for (var i = 0, len = latlngs.length; i < len; i++) {
      this.extend(latlngs[i]);
    }
  }

  LatLngBounds.prototype = {
    // @method extend(latlng: LatLng): this
    // Extend the bounds to contain the given point
    // @alternative
    // @method extend(otherBounds: LatLngBounds): this
    // Extend the bounds to contain the given bounds
    extend: function extend(obj) {
      var sw = this._southWest,
          ne = this._northEast,
          sw2,
          ne2;

      if (obj instanceof LatLng) {
        sw2 = obj;
        ne2 = obj;
      } else if (obj instanceof LatLngBounds) {
        sw2 = obj._southWest;
        ne2 = obj._northEast;

        if (!sw2 || !ne2) {
          return this;
        }
      } else {
        return obj ? this.extend(toLatLng(obj) || toLatLngBounds(obj)) : this;
      }

      if (!sw && !ne) {
        this._southWest = new LatLng(sw2.lat, sw2.lng);
        this._northEast = new LatLng(ne2.lat, ne2.lng);
      } else {
        sw.lat = Math.min(sw2.lat, sw.lat);
        sw.lng = Math.min(sw2.lng, sw.lng);
        ne.lat = Math.max(ne2.lat, ne.lat);
        ne.lng = Math.max(ne2.lng, ne.lng);
      }

      return this;
    },
    // @method pad(bufferRatio: Number): LatLngBounds
    // Returns bounds created by extending or retracting the current bounds by a given ratio in each direction.
    // For example, a ratio of 0.5 extends the bounds by 50% in each direction.
    // Negative values will retract the bounds.
    pad: function pad(bufferRatio) {
      var sw = this._southWest,
          ne = this._northEast,
          heightBuffer = Math.abs(sw.lat - ne.lat) * bufferRatio,
          widthBuffer = Math.abs(sw.lng - ne.lng) * bufferRatio;
      return new LatLngBounds(new LatLng(sw.lat - heightBuffer, sw.lng - widthBuffer), new LatLng(ne.lat + heightBuffer, ne.lng + widthBuffer));
    },
    // @method getCenter(): LatLng
    // Returns the center point of the bounds.
    getCenter: function getCenter() {
      return new LatLng((this._southWest.lat + this._northEast.lat) / 2, (this._southWest.lng + this._northEast.lng) / 2);
    },
    // @method getSouthWest(): LatLng
    // Returns the south-west point of the bounds.
    getSouthWest: function getSouthWest() {
      return this._southWest;
    },
    // @method getNorthEast(): LatLng
    // Returns the north-east point of the bounds.
    getNorthEast: function getNorthEast() {
      return this._northEast;
    },
    // @method getNorthWest(): LatLng
    // Returns the north-west point of the bounds.
    getNorthWest: function getNorthWest() {
      return new LatLng(this.getNorth(), this.getWest());
    },
    // @method getSouthEast(): LatLng
    // Returns the south-east point of the bounds.
    getSouthEast: function getSouthEast() {
      return new LatLng(this.getSouth(), this.getEast());
    },
    // @method getWest(): Number
    // Returns the west longitude of the bounds
    getWest: function getWest() {
      return this._southWest.lng;
    },
    // @method getSouth(): Number
    // Returns the south latitude of the bounds
    getSouth: function getSouth() {
      return this._southWest.lat;
    },
    // @method getEast(): Number
    // Returns the east longitude of the bounds
    getEast: function getEast() {
      return this._northEast.lng;
    },
    // @method getNorth(): Number
    // Returns the north latitude of the bounds
    getNorth: function getNorth() {
      return this._northEast.lat;
    },
    // @method contains(otherBounds: LatLngBounds): Boolean
    // Returns `true` if the rectangle contains the given one.
    // @alternative
    // @method contains (latlng: LatLng): Boolean
    // Returns `true` if the rectangle contains the given point.
    contains: function contains(obj) {
      // (LatLngBounds) or (LatLng) -> Boolean
      if (typeof obj[0] === 'number' || obj instanceof LatLng || 'lat' in obj) {
        obj = toLatLng(obj);
      } else {
        obj = toLatLngBounds(obj);
      }

      var sw = this._southWest,
          ne = this._northEast,
          sw2,
          ne2;

      if (obj instanceof LatLngBounds) {
        sw2 = obj.getSouthWest();
        ne2 = obj.getNorthEast();
      } else {
        sw2 = ne2 = obj;
      }

      return sw2.lat >= sw.lat && ne2.lat <= ne.lat && sw2.lng >= sw.lng && ne2.lng <= ne.lng;
    },
    // @method intersects(otherBounds: LatLngBounds): Boolean
    // Returns `true` if the rectangle intersects the given bounds. Two bounds intersect if they have at least one point in common.
    intersects: function intersects(bounds) {
      bounds = toLatLngBounds(bounds);
      var sw = this._southWest,
          ne = this._northEast,
          sw2 = bounds.getSouthWest(),
          ne2 = bounds.getNorthEast(),
          latIntersects = ne2.lat >= sw.lat && sw2.lat <= ne.lat,
          lngIntersects = ne2.lng >= sw.lng && sw2.lng <= ne.lng;
      return latIntersects && lngIntersects;
    },
    // @method overlaps(otherBounds: LatLngBounds): Boolean
    // Returns `true` if the rectangle overlaps the given bounds. Two bounds overlap if their intersection is an area.
    overlaps: function overlaps(bounds) {
      bounds = toLatLngBounds(bounds);
      var sw = this._southWest,
          ne = this._northEast,
          sw2 = bounds.getSouthWest(),
          ne2 = bounds.getNorthEast(),
          latOverlaps = ne2.lat > sw.lat && sw2.lat < ne.lat,
          lngOverlaps = ne2.lng > sw.lng && sw2.lng < ne.lng;
      return latOverlaps && lngOverlaps;
    },
    // @method toBBoxString(): String
    // Returns a string with bounding box coordinates in a 'southwest_lng,southwest_lat,northeast_lng,northeast_lat' format. Useful for sending requests to web services that return geo data.
    toBBoxString: function toBBoxString() {
      return [this.getWest(), this.getSouth(), this.getEast(), this.getNorth()].join(',');
    },
    // @method equals(otherBounds: LatLngBounds, maxMargin?: Number): Boolean
    // Returns `true` if the rectangle is equivalent (within a small margin of error) to the given bounds. The margin of error can be overridden by setting `maxMargin` to a small number.
    equals: function equals(bounds, maxMargin) {
      if (!bounds) {
        return false;
      }

      bounds = toLatLngBounds(bounds);
      return this._southWest.equals(bounds.getSouthWest(), maxMargin) && this._northEast.equals(bounds.getNorthEast(), maxMargin);
    },
    // @method isValid(): Boolean
    // Returns `true` if the bounds are properly initialized.
    isValid: function isValid() {
      return !!(this._southWest && this._northEast);
    }
  }; // TODO International date line?
  // @factory L.latLngBounds(corner1: LatLng, corner2: LatLng)
  // Creates a `LatLngBounds` object by defining two diagonally opposite corners of the rectangle.
  // @alternative
  // @factory L.latLngBounds(latlngs: LatLng[])
  // Creates a `LatLngBounds` object defined by the geographical points it contains. Very useful for zooming the map to fit a particular set of locations with [`fitBounds`](#map-fitbounds).

  function toLatLngBounds(a, b) {
    if (a instanceof LatLngBounds) {
      return a;
    }

    return new LatLngBounds(a, b);
  }
  /* @class LatLng
   * @aka L.LatLng
   *
   * Represents a geographical point with a certain latitude and longitude.
   *
   * @example
   *
   * ```
   * var latlng = L.latLng(50.5, 30.5);
   * ```
   *
   * All Leaflet methods that accept LatLng objects also accept them in a simple Array form and simple object form (unless noted otherwise), so these lines are equivalent:
   *
   * ```
   * map.panTo([50, 30]);
   * map.panTo({lon: 30, lat: 50});
   * map.panTo({lat: 50, lng: 30});
   * map.panTo(L.latLng(50, 30));
   * ```
   *
   * Note that `LatLng` does not inherit from Leaflet's `Class` object,
   * which means new classes can't inherit from it, and new methods
   * can't be added to it with the `include` function.
   */


  function LatLng(lat, lng, alt) {
    if (isNaN(lat) || isNaN(lng)) {
      throw new Error('Invalid LatLng object: (' + lat + ', ' + lng + ')');
    } // @property lat: Number
    // Latitude in degrees


    this.lat = +lat; // @property lng: Number
    // Longitude in degrees

    this.lng = +lng; // @property alt: Number
    // Altitude in meters (optional)

    if (alt !== undefined) {
      this.alt = +alt;
    }
  }

  LatLng.prototype = {
    // @method equals(otherLatLng: LatLng, maxMargin?: Number): Boolean
    // Returns `true` if the given `LatLng` point is at the same position (within a small margin of error). The margin of error can be overridden by setting `maxMargin` to a small number.
    equals: function equals(obj, maxMargin) {
      if (!obj) {
        return false;
      }

      obj = toLatLng(obj);
      var margin = Math.max(Math.abs(this.lat - obj.lat), Math.abs(this.lng - obj.lng));
      return margin <= (maxMargin === undefined ? 1.0E-9 : maxMargin);
    },
    // @method toString(): String
    // Returns a string representation of the point (for debugging purposes).
    toString: function toString(precision) {
      return 'LatLng(' + formatNum(this.lat, precision) + ', ' + formatNum(this.lng, precision) + ')';
    },
    // @method distanceTo(otherLatLng: LatLng): Number
    // Returns the distance (in meters) to the given `LatLng` calculated using the [Spherical Law of Cosines](https://en.wikipedia.org/wiki/Spherical_law_of_cosines).
    distanceTo: function distanceTo(other) {
      return Earth.distance(this, toLatLng(other));
    },
    // @method wrap(): LatLng
    // Returns a new `LatLng` object with the longitude wrapped so it's always between -180 and +180 degrees.
    wrap: function wrap() {
      return Earth.wrapLatLng(this);
    },
    // @method toBounds(sizeInMeters: Number): LatLngBounds
    // Returns a new `LatLngBounds` object in which each boundary is `sizeInMeters/2` meters apart from the `LatLng`.
    toBounds: function toBounds(sizeInMeters) {
      var latAccuracy = 180 * sizeInMeters / 40075017,
          lngAccuracy = latAccuracy / Math.cos(Math.PI / 180 * this.lat);
      return toLatLngBounds([this.lat - latAccuracy, this.lng - lngAccuracy], [this.lat + latAccuracy, this.lng + lngAccuracy]);
    },
    clone: function clone() {
      return new LatLng(this.lat, this.lng, this.alt);
    }
  }; // @factory L.latLng(latitude: Number, longitude: Number, altitude?: Number): LatLng
  // Creates an object representing a geographical point with the given latitude and longitude (and optionally altitude).
  // @alternative
  // @factory L.latLng(coords: Array): LatLng
  // Expects an array of the form `[Number, Number]` or `[Number, Number, Number]` instead.
  // @alternative
  // @factory L.latLng(coords: Object): LatLng
  // Expects an plain object of the form `{lat: Number, lng: Number}` or `{lat: Number, lng: Number, alt: Number}` instead.

  function toLatLng(a, b, c) {
    if (a instanceof LatLng) {
      return a;
    }

    if (isArray(a) && _typeof(a[0]) !== 'object') {
      if (a.length === 3) {
        return new LatLng(a[0], a[1], a[2]);
      }

      if (a.length === 2) {
        return new LatLng(a[0], a[1]);
      }

      return null;
    }

    if (a === undefined || a === null) {
      return a;
    }

    if (_typeof(a) === 'object' && 'lat' in a) {
      return new LatLng(a.lat, 'lng' in a ? a.lng : a.lon, a.alt);
    }

    if (b === undefined) {
      return null;
    }

    return new LatLng(a, b, c);
  }
  /*
   * @namespace CRS
   * @crs L.CRS.Base
   * Object that defines coordinate reference systems for projecting
   * geographical points into pixel (screen) coordinates and back (and to
   * coordinates in other units for [WMS](https://en.wikipedia.org/wiki/Web_Map_Service) services). See
   * [spatial reference system](https://en.wikipedia.org/wiki/Spatial_reference_system).
   *
   * Leaflet defines the most usual CRSs by default. If you want to use a
   * CRS not defined by default, take a look at the
   * [Proj4Leaflet](https://github.com/kartena/Proj4Leaflet) plugin.
   *
   * Note that the CRS instances do not inherit from Leaflet's `Class` object,
   * and can't be instantiated. Also, new classes can't inherit from them,
   * and methods can't be added to them with the `include` function.
   */


  var CRS = {
    // @method latLngToPoint(latlng: LatLng, zoom: Number): Point
    // Projects geographical coordinates into pixel coordinates for a given zoom.
    latLngToPoint: function latLngToPoint(latlng, zoom) {
      var projectedPoint = this.projection.project(latlng),
          scale = this.scale(zoom);
      return this.transformation._transform(projectedPoint, scale);
    },
    // @method pointToLatLng(point: Point, zoom: Number): LatLng
    // The inverse of `latLngToPoint`. Projects pixel coordinates on a given
    // zoom into geographical coordinates.
    pointToLatLng: function pointToLatLng(point, zoom) {
      var scale = this.scale(zoom),
          untransformedPoint = this.transformation.untransform(point, scale);
      return this.projection.unproject(untransformedPoint);
    },
    // @method project(latlng: LatLng): Point
    // Projects geographical coordinates into coordinates in units accepted for
    // this CRS (e.g. meters for EPSG:3857, for passing it to WMS services).
    project: function project(latlng) {
      return this.projection.project(latlng);
    },
    // @method unproject(point: Point): LatLng
    // Given a projected coordinate returns the corresponding LatLng.
    // The inverse of `project`.
    unproject: function unproject(point) {
      return this.projection.unproject(point);
    },
    // @method scale(zoom: Number): Number
    // Returns the scale used when transforming projected coordinates into
    // pixel coordinates for a particular zoom. For example, it returns
    // `256 * 2^zoom` for Mercator-based CRS.
    scale: function scale(zoom) {
      return 256 * Math.pow(2, zoom);
    },
    // @method zoom(scale: Number): Number
    // Inverse of `scale()`, returns the zoom level corresponding to a scale
    // factor of `scale`.
    zoom: function zoom(scale) {
      return Math.log(scale / 256) / Math.LN2;
    },
    // @method getProjectedBounds(zoom: Number): Bounds
    // Returns the projection's bounds scaled and transformed for the provided `zoom`.
    getProjectedBounds: function getProjectedBounds(zoom) {
      if (this.infinite) {
        return null;
      }

      var b = this.projection.bounds,
          s = this.scale(zoom),
          min = this.transformation.transform(b.min, s),
          max = this.transformation.transform(b.max, s);
      return new Bounds(min, max);
    },
    // @method distance(latlng1: LatLng, latlng2: LatLng): Number
    // Returns the distance between two geographical coordinates.
    // @property code: String
    // Standard code name of the CRS passed into WMS services (e.g. `'EPSG:3857'`)
    //
    // @property wrapLng: Number[]
    // An array of two numbers defining whether the longitude (horizontal) coordinate
    // axis wraps around a given range and how. Defaults to `[-180, 180]` in most
    // geographical CRSs. If `undefined`, the longitude axis does not wrap around.
    //
    // @property wrapLat: Number[]
    // Like `wrapLng`, but for the latitude (vertical) axis.
    // wrapLng: [min, max],
    // wrapLat: [min, max],
    // @property infinite: Boolean
    // If true, the coordinate space will be unbounded (infinite in both axes)
    infinite: false,
    // @method wrapLatLng(latlng: LatLng): LatLng
    // Returns a `LatLng` where lat and lng has been wrapped according to the
    // CRS's `wrapLat` and `wrapLng` properties, if they are outside the CRS's bounds.
    wrapLatLng: function wrapLatLng(latlng) {
      var lng = this.wrapLng ? wrapNum(latlng.lng, this.wrapLng, true) : latlng.lng,
          lat = this.wrapLat ? wrapNum(latlng.lat, this.wrapLat, true) : latlng.lat,
          alt = latlng.alt;
      return new LatLng(lat, lng, alt);
    },
    // @method wrapLatLngBounds(bounds: LatLngBounds): LatLngBounds
    // Returns a `LatLngBounds` with the same size as the given one, ensuring
    // that its center is within the CRS's bounds.
    // Only accepts actual `L.LatLngBounds` instances, not arrays.
    wrapLatLngBounds: function wrapLatLngBounds(bounds) {
      var center = bounds.getCenter(),
          newCenter = this.wrapLatLng(center),
          latShift = center.lat - newCenter.lat,
          lngShift = center.lng - newCenter.lng;

      if (latShift === 0 && lngShift === 0) {
        return bounds;
      }

      var sw = bounds.getSouthWest(),
          ne = bounds.getNorthEast(),
          newSw = new LatLng(sw.lat - latShift, sw.lng - lngShift),
          newNe = new LatLng(ne.lat - latShift, ne.lng - lngShift);
      return new LatLngBounds(newSw, newNe);
    }
  };
  /*
   * @namespace CRS
   * @crs L.CRS.Earth
   *
   * Serves as the base for CRS that are global such that they cover the earth.
   * Can only be used as the base for other CRS and cannot be used directly,
   * since it does not have a `code`, `projection` or `transformation`. `distance()` returns
   * meters.
   */

  var Earth = extend({}, CRS, {
    wrapLng: [-180, 180],
    // Mean Earth Radius, as recommended for use by
    // the International Union of Geodesy and Geophysics,
    // see https://rosettacode.org/wiki/Haversine_formula
    R: 6371000,
    // distance between two geographical points using spherical law of cosines approximation
    distance: function distance(latlng1, latlng2) {
      var rad = Math.PI / 180,
          lat1 = latlng1.lat * rad,
          lat2 = latlng2.lat * rad,
          sinDLat = Math.sin((latlng2.lat - latlng1.lat) * rad / 2),
          sinDLon = Math.sin((latlng2.lng - latlng1.lng) * rad / 2),
          a = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon,
          c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return this.R * c;
    }
  });
  /*
   * @namespace Projection
   * @projection L.Projection.SphericalMercator
   *
   * Spherical Mercator projection — the most common projection for online maps,
   * used by almost all free and commercial tile providers. Assumes that Earth is
   * a sphere. Used by the `EPSG:3857` CRS.
   */

  var earthRadius = 6378137;
  var SphericalMercator = {
    R: earthRadius,
    MAX_LATITUDE: 85.0511287798,
    project: function project(latlng) {
      var d = Math.PI / 180,
          max = this.MAX_LATITUDE,
          lat = Math.max(Math.min(max, latlng.lat), -max),
          sin = Math.sin(lat * d);
      return new Point(this.R * latlng.lng * d, this.R * Math.log((1 + sin) / (1 - sin)) / 2);
    },
    unproject: function unproject(point) {
      var d = 180 / Math.PI;
      return new LatLng((2 * Math.atan(Math.exp(point.y / this.R)) - Math.PI / 2) * d, point.x * d / this.R);
    },
    bounds: function () {
      var d = earthRadius * Math.PI;
      return new Bounds([-d, -d], [d, d]);
    }()
  };
  /*
   * @class Transformation
   * @aka L.Transformation
   *
   * Represents an affine transformation: a set of coefficients `a`, `b`, `c`, `d`
   * for transforming a point of a form `(x, y)` into `(a*x + b, c*y + d)` and doing
   * the reverse. Used by Leaflet in its projections code.
   *
   * @example
   *
   * ```js
   * var transformation = L.transformation(2, 5, -1, 10),
   * 	p = L.point(1, 2),
   * 	p2 = transformation.transform(p), //  L.point(7, 8)
   * 	p3 = transformation.untransform(p2); //  L.point(1, 2)
   * ```
   */
  // factory new L.Transformation(a: Number, b: Number, c: Number, d: Number)
  // Creates a `Transformation` object with the given coefficients.

  function Transformation(a, b, c, d) {
    if (isArray(a)) {
      // use array properties
      this._a = a[0];
      this._b = a[1];
      this._c = a[2];
      this._d = a[3];
      return;
    }

    this._a = a;
    this._b = b;
    this._c = c;
    this._d = d;
  }

  Transformation.prototype = {
    // @method transform(point: Point, scale?: Number): Point
    // Returns a transformed point, optionally multiplied by the given scale.
    // Only accepts actual `L.Point` instances, not arrays.
    transform: function transform(point, scale) {
      // (Point, Number) -> Point
      return this._transform(point.clone(), scale);
    },
    // destructive transform (faster)
    _transform: function _transform(point, scale) {
      scale = scale || 1;
      point.x = scale * (this._a * point.x + this._b);
      point.y = scale * (this._c * point.y + this._d);
      return point;
    },
    // @method untransform(point: Point, scale?: Number): Point
    // Returns the reverse transformation of the given point, optionally divided
    // by the given scale. Only accepts actual `L.Point` instances, not arrays.
    untransform: function untransform(point, scale) {
      scale = scale || 1;
      return new Point((point.x / scale - this._b) / this._a, (point.y / scale - this._d) / this._c);
    }
  }; // factory L.transformation(a: Number, b: Number, c: Number, d: Number)
  // @factory L.transformation(a: Number, b: Number, c: Number, d: Number)
  // Instantiates a Transformation object with the given coefficients.
  // @alternative
  // @factory L.transformation(coefficients: Array): Transformation
  // Expects an coefficients array of the form
  // `[a: Number, b: Number, c: Number, d: Number]`.

  function toTransformation(a, b, c, d) {
    return new Transformation(a, b, c, d);
  }
  /*
   * @namespace CRS
   * @crs L.CRS.EPSG3857
   *
   * The most common CRS for online maps, used by almost all free and commercial
   * tile providers. Uses Spherical Mercator projection. Set in by default in
   * Map's `crs` option.
   */


  var EPSG3857 = extend({}, Earth, {
    code: 'EPSG:3857',
    projection: SphericalMercator,
    transformation: function () {
      var scale = 0.5 / (Math.PI * SphericalMercator.R);
      return toTransformation(scale, 0.5, -scale, 0.5);
    }()
  });
  var EPSG900913 = extend({}, EPSG3857, {
    code: 'EPSG:900913'
  }); // @namespace SVG; @section
  // There are several static functions which can be called without instantiating L.SVG:
  // @function create(name: String): SVGElement
  // Returns a instance of [SVGElement](https://developer.mozilla.org/docs/Web/API/SVGElement),
  // corresponding to the class name passed. For example, using 'line' will return
  // an instance of [SVGLineElement](https://developer.mozilla.org/docs/Web/API/SVGLineElement).

  function svgCreate(name) {
    return document.createElementNS('http://www.w3.org/2000/svg', name);
  } // @function pointsToPath(rings: Point[], closed: Boolean): String
  // Generates a SVG path string for multiple rings, with each ring turning
  // into "M..L..L.." instructions


  function pointsToPath(rings, closed) {
    var str = '',
        i,
        j,
        len,
        len2,
        points,
        p;

    for (i = 0, len = rings.length; i < len; i++) {
      points = rings[i];

      for (j = 0, len2 = points.length; j < len2; j++) {
        p = points[j];
        str += (j ? 'L' : 'M') + p.x + ' ' + p.y;
      } // closes the ring for polygons; "x" is VML syntax


      str += closed ? Browser.svg ? 'z' : 'x' : '';
    } // SVG complains about empty path strings


    return str || 'M0 0';
  }
  /*
   * @namespace Browser
   * @aka L.Browser
   *
   * A namespace with static properties for browser/feature detection used by Leaflet internally.
   *
   * @example
   *
   * ```js
   * if (L.Browser.ielt9) {
   *   alert('Upgrade your browser, dude!');
   * }
   * ```
   */


  var style = document.documentElement.style; // @property ie: Boolean; `true` for all Internet Explorer versions (not Edge).

  var ie = ('ActiveXObject' in window); // @property ielt9: Boolean; `true` for Internet Explorer versions less than 9.

  var ielt9 = ie && !document.addEventListener; // @property edge: Boolean; `true` for the Edge web browser.

  var edge = 'msLaunchUri' in navigator && !('documentMode' in document); // @property webkit: Boolean;
  // `true` for webkit-based browsers like Chrome and Safari (including mobile versions).

  var webkit = userAgentContains('webkit'); // @property android: Boolean
  // **Deprecated.** `true` for any browser running on an Android platform.

  var android = userAgentContains('android'); // @property android23: Boolean; **Deprecated.** `true` for browsers running on Android 2 or Android 3.

  var android23 = userAgentContains('android 2') || userAgentContains('android 3');
  /* See https://stackoverflow.com/a/17961266 for details on detecting stock Android */

  var webkitVer = parseInt(/WebKit\/([0-9]+)|$/.exec(navigator.userAgent)[1], 10); // also matches AppleWebKit
  // @property androidStock: Boolean; **Deprecated.** `true` for the Android stock browser (i.e. not Chrome)

  var androidStock = android && userAgentContains('Google') && webkitVer < 537 && !('AudioNode' in window); // @property opera: Boolean; `true` for the Opera browser

  var opera = !!window.opera; // @property chrome: Boolean; `true` for the Chrome browser.

  var chrome = !edge && userAgentContains('chrome'); // @property gecko: Boolean; `true` for gecko-based browsers like Firefox.

  var gecko = userAgentContains('gecko') && !webkit && !opera && !ie; // @property safari: Boolean; `true` for the Safari browser.

  var safari = !chrome && userAgentContains('safari');
  var phantom = userAgentContains('phantom'); // @property opera12: Boolean
  // `true` for the Opera browser supporting CSS transforms (version 12 or later).

  var opera12 = ('OTransition' in style); // @property win: Boolean; `true` when the browser is running in a Windows platform

  var win = navigator.platform.indexOf('Win') === 0; // @property ie3d: Boolean; `true` for all Internet Explorer versions supporting CSS transforms.

  var ie3d = ie && 'transition' in style; // @property webkit3d: Boolean; `true` for webkit-based browsers supporting CSS transforms.

  var webkit3d = 'WebKitCSSMatrix' in window && 'm11' in new window.WebKitCSSMatrix() && !android23; // @property gecko3d: Boolean; `true` for gecko-based browsers supporting CSS transforms.

  var gecko3d = ('MozPerspective' in style); // @property any3d: Boolean
  // `true` for all browsers supporting CSS transforms.

  var any3d = !window.L_DISABLE_3D && (ie3d || webkit3d || gecko3d) && !opera12 && !phantom; // @property mobile: Boolean; `true` for all browsers running in a mobile device.

  var mobile = typeof orientation !== 'undefined' || userAgentContains('mobile'); // @property mobileWebkit: Boolean; `true` for all webkit-based browsers in a mobile device.

  var mobileWebkit = mobile && webkit; // @property mobileWebkit3d: Boolean
  // `true` for all webkit-based browsers in a mobile device supporting CSS transforms.

  var mobileWebkit3d = mobile && webkit3d; // @property msPointer: Boolean
  // `true` for browsers implementing the Microsoft touch events model (notably IE10).

  var msPointer = !window.PointerEvent && window.MSPointerEvent; // @property pointer: Boolean
  // `true` for all browsers supporting [pointer events](https://msdn.microsoft.com/en-us/library/dn433244%28v=vs.85%29.aspx).

  var pointer = !!(window.PointerEvent || msPointer); // @property touchNative: Boolean
  // `true` for all browsers supporting [touch events](https://developer.mozilla.org/docs/Web/API/Touch_events).
  // **This does not necessarily mean** that the browser is running in a computer with
  // a touchscreen, it only means that the browser is capable of understanding
  // touch events.

  var touchNative = 'ontouchstart' in window || !!window.TouchEvent; // @property touch: Boolean
  // `true` for all browsers supporting either [touch](#browser-touch) or [pointer](#browser-pointer) events.
  // Note: pointer events will be preferred (if available), and processed for all `touch*` listeners.

  var touch = !window.L_NO_TOUCH && (touchNative || pointer); // @property mobileOpera: Boolean; `true` for the Opera browser in a mobile device.

  var mobileOpera = mobile && opera; // @property mobileGecko: Boolean
  // `true` for gecko-based browsers running in a mobile device.

  var mobileGecko = mobile && gecko; // @property retina: Boolean
  // `true` for browsers on a high-resolution "retina" screen or on any screen when browser's display zoom is more than 100%.

  var retina = (window.devicePixelRatio || window.screen.deviceXDPI / window.screen.logicalXDPI) > 1; // @property passiveEvents: Boolean
  // `true` for browsers that support passive events.

  var passiveEvents = function () {
    var supportsPassiveOption = false;

    try {
      var opts = Object.defineProperty({}, 'passive', {
        get: function get() {
          // eslint-disable-line getter-return
          supportsPassiveOption = true;
        }
      });
      window.addEventListener('testPassiveEventSupport', falseFn, opts);
      window.removeEventListener('testPassiveEventSupport', falseFn, opts);
    } catch (e) {// Errors can safely be ignored since this is only a browser support test.
    }

    return supportsPassiveOption;
  }(); // @property canvas: Boolean
  // `true` when the browser supports [`<canvas>`](https://developer.mozilla.org/docs/Web/API/Canvas_API).


  var canvas$1 = function () {
    return !!document.createElement('canvas').getContext;
  }(); // @property svg: Boolean
  // `true` when the browser supports [SVG](https://developer.mozilla.org/docs/Web/SVG).


  var svg$1 = !!(document.createElementNS && svgCreate('svg').createSVGRect);

  var inlineSvg = !!svg$1 && function () {
    var div = document.createElement('div');
    div.innerHTML = '<svg/>';
    return (div.firstChild && div.firstChild.namespaceURI) === 'http://www.w3.org/2000/svg';
  }(); // @property vml: Boolean
  // `true` if the browser supports [VML](https://en.wikipedia.org/wiki/Vector_Markup_Language).


  var vml = !svg$1 && function () {
    try {
      var div = document.createElement('div');
      div.innerHTML = '<v:shape adj="1"/>';
      var shape = div.firstChild;
      shape.style.behavior = 'url(#default#VML)';
      return shape && _typeof(shape.adj) === 'object';
    } catch (e) {
      return false;
    }
  }();

  function userAgentContains(str) {
    return navigator.userAgent.toLowerCase().indexOf(str) >= 0;
  }

  var Browser = {
    ie: ie,
    ielt9: ielt9,
    edge: edge,
    webkit: webkit,
    android: android,
    android23: android23,
    androidStock: androidStock,
    opera: opera,
    chrome: chrome,
    gecko: gecko,
    safari: safari,
    phantom: phantom,
    opera12: opera12,
    win: win,
    ie3d: ie3d,
    webkit3d: webkit3d,
    gecko3d: gecko3d,
    any3d: any3d,
    mobile: mobile,
    mobileWebkit: mobileWebkit,
    mobileWebkit3d: mobileWebkit3d,
    msPointer: msPointer,
    pointer: pointer,
    touch: touch,
    touchNative: touchNative,
    mobileOpera: mobileOpera,
    mobileGecko: mobileGecko,
    retina: retina,
    passiveEvents: passiveEvents,
    canvas: canvas$1,
    svg: svg$1,
    vml: vml,
    inlineSvg: inlineSvg
  };
  /*
   * Extends L.DomEvent to provide touch support for Internet Explorer and Windows-based devices.
   */

  var POINTER_DOWN = Browser.msPointer ? 'MSPointerDown' : 'pointerdown';
  var POINTER_MOVE = Browser.msPointer ? 'MSPointerMove' : 'pointermove';
  var POINTER_UP = Browser.msPointer ? 'MSPointerUp' : 'pointerup';
  var POINTER_CANCEL = Browser.msPointer ? 'MSPointerCancel' : 'pointercancel';
  var pEvent = {
    touchstart: POINTER_DOWN,
    touchmove: POINTER_MOVE,
    touchend: POINTER_UP,
    touchcancel: POINTER_CANCEL
  };
  var handle = {
    touchstart: _onPointerStart,
    touchmove: _handlePointer,
    touchend: _handlePointer,
    touchcancel: _handlePointer
  };
  var _pointers = {};
  var _pointerDocListener = false; // Provides a touch events wrapper for (ms)pointer events.
  // ref https://www.w3.org/TR/pointerevents/ https://www.w3.org/Bugs/Public/show_bug.cgi?id=22890

  function addPointerListener(obj, type, handler) {
    if (type === 'touchstart') {
      _addPointerDocListener();
    }

    if (!handle[type]) {
      console.warn('wrong event specified:', type);
      return L.Util.falseFn;
    }

    handler = handle[type].bind(this, handler);
    obj.addEventListener(pEvent[type], handler, false);
    return handler;
  }

  function removePointerListener(obj, type, handler) {
    if (!pEvent[type]) {
      console.warn('wrong event specified:', type);
      return;
    }

    obj.removeEventListener(pEvent[type], handler, false);
  }

  function _globalPointerDown(e) {
    _pointers[e.pointerId] = e;
  }

  function _globalPointerMove(e) {
    if (_pointers[e.pointerId]) {
      _pointers[e.pointerId] = e;
    }
  }

  function _globalPointerUp(e) {
    delete _pointers[e.pointerId];
  }

  function _addPointerDocListener() {
    // need to keep track of what pointers and how many are active to provide e.touches emulation
    if (!_pointerDocListener) {
      // we listen document as any drags that end by moving the touch off the screen get fired there
      document.addEventListener(POINTER_DOWN, _globalPointerDown, true);
      document.addEventListener(POINTER_MOVE, _globalPointerMove, true);
      document.addEventListener(POINTER_UP, _globalPointerUp, true);
      document.addEventListener(POINTER_CANCEL, _globalPointerUp, true);
      _pointerDocListener = true;
    }
  }

  function _handlePointer(handler, e) {
    if (e.pointerType === (e.MSPOINTER_TYPE_MOUSE || 'mouse')) {
      return;
    }

    e.touches = [];

    for (var i in _pointers) {
      e.touches.push(_pointers[i]);
    }

    e.changedTouches = [e];
    handler(e);
  }

  function _onPointerStart(handler, e) {
    // IE10 specific: MsTouch needs preventDefault. See #2000
    if (e.MSPOINTER_TYPE_TOUCH && e.pointerType === e.MSPOINTER_TYPE_TOUCH) {
      preventDefault(e);
    }

    _handlePointer(handler, e);
  }
  /*
   * Extends the event handling code with double tap support for mobile browsers.
   *
   * Note: currently most browsers fire native dblclick, with only a few exceptions
   * (see https://github.com/Leaflet/Leaflet/issues/7012#issuecomment-595087386)
   */


  function makeDblclick(event) {
    // in modern browsers `type` cannot be just overridden:
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/Getter_only
    var newEvent = {},
        prop,
        i;

    for (i in event) {
      prop = event[i];
      newEvent[i] = prop && prop.bind ? prop.bind(event) : prop;
    }

    event = newEvent;
    newEvent.type = 'dblclick';
    newEvent.detail = 2;
    newEvent.isTrusted = false;
    newEvent._simulated = true; // for debug purposes

    return newEvent;
  }

  var delay = 200;

  function addDoubleTapListener(obj, handler) {
    // Most browsers handle double tap natively
    obj.addEventListener('dblclick', handler); // On some platforms the browser doesn't fire native dblclicks for touch events.
    // It seems that in all such cases `detail` property of `click` event is always `1`.
    // So here we rely on that fact to avoid excessive 'dblclick' simulation when not needed.

    var last = 0,
        detail;

    function simDblclick(e) {
      if (e.detail !== 1) {
        detail = e.detail; // keep in sync to avoid false dblclick in some cases

        return;
      }

      if (e.pointerType === 'mouse' || e.sourceCapabilities && !e.sourceCapabilities.firesTouchEvents) {
        return;
      }

      var now = Date.now();

      if (now - last <= delay) {
        detail++;

        if (detail === 2) {
          handler(makeDblclick(e));
        }
      } else {
        detail = 1;
      }

      last = now;
    }

    obj.addEventListener('click', simDblclick);
    return {
      dblclick: handler,
      simDblclick: simDblclick
    };
  }

  function removeDoubleTapListener(obj, handlers) {
    obj.removeEventListener('dblclick', handlers.dblclick);
    obj.removeEventListener('click', handlers.simDblclick);
  }
  /*
   * @namespace DomUtil
   *
   * Utility functions to work with the [DOM](https://developer.mozilla.org/docs/Web/API/Document_Object_Model)
   * tree, used by Leaflet internally.
   *
   * Most functions expecting or returning a `HTMLElement` also work for
   * SVG elements. The only difference is that classes refer to CSS classes
   * in HTML and SVG classes in SVG.
   */
  // @property TRANSFORM: String
  // Vendor-prefixed transform style name (e.g. `'webkitTransform'` for WebKit).


  var TRANSFORM = testProp(['transform', 'webkitTransform', 'OTransform', 'MozTransform', 'msTransform']); // webkitTransition comes first because some browser versions that drop vendor prefix don't do
  // the same for the transitionend event, in particular the Android 4.1 stock browser
  // @property TRANSITION: String
  // Vendor-prefixed transition style name.

  var TRANSITION = testProp(['webkitTransition', 'transition', 'OTransition', 'MozTransition', 'msTransition']); // @property TRANSITION_END: String
  // Vendor-prefixed transitionend event name.

  var TRANSITION_END = TRANSITION === 'webkitTransition' || TRANSITION === 'OTransition' ? TRANSITION + 'End' : 'transitionend'; // @function get(id: String|HTMLElement): HTMLElement
  // Returns an element given its DOM id, or returns the element itself
  // if it was passed directly.

  function get(id) {
    return typeof id === 'string' ? document.getElementById(id) : id;
  } // @function getStyle(el: HTMLElement, styleAttrib: String): String
  // Returns the value for a certain style attribute on an element,
  // including computed values or values set through CSS.


  function getStyle(el, style) {
    var value = el.style[style] || el.currentStyle && el.currentStyle[style];

    if ((!value || value === 'auto') && document.defaultView) {
      var css = document.defaultView.getComputedStyle(el, null);
      value = css ? css[style] : null;
    }

    return value === 'auto' ? null : value;
  } // @function create(tagName: String, className?: String, container?: HTMLElement): HTMLElement
  // Creates an HTML element with `tagName`, sets its class to `className`, and optionally appends it to `container` element.


  function create$1(tagName, className, container) {
    var el = document.createElement(tagName);
    el.className = className || '';

    if (container) {
      container.appendChild(el);
    }

    return el;
  } // @function remove(el: HTMLElement)
  // Removes `el` from its parent element


  function _remove(el) {
    var parent = el.parentNode;

    if (parent) {
      parent.removeChild(el);
    }
  } // @function empty(el: HTMLElement)
  // Removes all of `el`'s children elements from `el`


  function empty(el) {
    while (el.firstChild) {
      el.removeChild(el.firstChild);
    }
  } // @function toFront(el: HTMLElement)
  // Makes `el` the last child of its parent, so it renders in front of the other children.


  function toFront(el) {
    var parent = el.parentNode;

    if (parent && parent.lastChild !== el) {
      parent.appendChild(el);
    }
  } // @function toBack(el: HTMLElement)
  // Makes `el` the first child of its parent, so it renders behind the other children.


  function toBack(el) {
    var parent = el.parentNode;

    if (parent && parent.firstChild !== el) {
      parent.insertBefore(el, parent.firstChild);
    }
  } // @function hasClass(el: HTMLElement, name: String): Boolean
  // Returns `true` if the element's class attribute contains `name`.


  function hasClass(el, name) {
    if (el.classList !== undefined) {
      return el.classList.contains(name);
    }

    var className = getClass(el);
    return className.length > 0 && new RegExp('(^|\\s)' + name + '(\\s|$)').test(className);
  } // @function addClass(el: HTMLElement, name: String)
  // Adds `name` to the element's class attribute.


  function addClass(el, name) {
    if (el.classList !== undefined) {
      var classes = splitWords(name);

      for (var i = 0, len = classes.length; i < len; i++) {
        el.classList.add(classes[i]);
      }
    } else if (!hasClass(el, name)) {
      var className = getClass(el);
      setClass(el, (className ? className + ' ' : '') + name);
    }
  } // @function removeClass(el: HTMLElement, name: String)
  // Removes `name` from the element's class attribute.


  function removeClass(el, name) {
    if (el.classList !== undefined) {
      el.classList.remove(name);
    } else {
      setClass(el, trim((' ' + getClass(el) + ' ').replace(' ' + name + ' ', ' ')));
    }
  } // @function setClass(el: HTMLElement, name: String)
  // Sets the element's class.


  function setClass(el, name) {
    if (el.className.baseVal === undefined) {
      el.className = name;
    } else {
      // in case of SVG element
      el.className.baseVal = name;
    }
  } // @function getClass(el: HTMLElement): String
  // Returns the element's class.


  function getClass(el) {
    // Check if the element is an SVGElementInstance and use the correspondingElement instead
    // (Required for linked SVG elements in IE11.)
    if (el.correspondingElement) {
      el = el.correspondingElement;
    }

    return el.className.baseVal === undefined ? el.className : el.className.baseVal;
  } // @function setOpacity(el: HTMLElement, opacity: Number)
  // Set the opacity of an element (including old IE support).
  // `opacity` must be a number from `0` to `1`.


  function _setOpacity(el, value) {
    if ('opacity' in el.style) {
      el.style.opacity = value;
    } else if ('filter' in el.style) {
      _setOpacityIE(el, value);
    }
  }

  function _setOpacityIE(el, value) {
    var filter = false,
        filterName = 'DXImageTransform.Microsoft.Alpha'; // filters collection throws an error if we try to retrieve a filter that doesn't exist

    try {
      filter = el.filters.item(filterName);
    } catch (e) {
      // don't set opacity to 1 if we haven't already set an opacity,
      // it isn't needed and breaks transparent pngs.
      if (value === 1) {
        return;
      }
    }

    value = Math.round(value * 100);

    if (filter) {
      filter.Enabled = value !== 100;
      filter.Opacity = value;
    } else {
      el.style.filter += ' progid:' + filterName + '(opacity=' + value + ')';
    }
  } // @function testProp(props: String[]): String|false
  // Goes through the array of style names and returns the first name
  // that is a valid style name for an element. If no such name is found,
  // it returns false. Useful for vendor-prefixed styles like `transform`.


  function testProp(props) {
    var style = document.documentElement.style;

    for (var i = 0; i < props.length; i++) {
      if (props[i] in style) {
        return props[i];
      }
    }

    return false;
  } // @function setTransform(el: HTMLElement, offset: Point, scale?: Number)
  // Resets the 3D CSS transform of `el` so it is translated by `offset` pixels
  // and optionally scaled by `scale`. Does not have an effect if the
  // browser doesn't support 3D CSS transforms.


  function setTransform(el, offset, scale) {
    var pos = offset || new Point(0, 0);
    el.style[TRANSFORM] = (Browser.ie3d ? 'translate(' + pos.x + 'px,' + pos.y + 'px)' : 'translate3d(' + pos.x + 'px,' + pos.y + 'px,0)') + (scale ? ' scale(' + scale + ')' : '');
  } // @function setPosition(el: HTMLElement, position: Point)
  // Sets the position of `el` to coordinates specified by `position`,
  // using CSS translate or top/left positioning depending on the browser
  // (used by Leaflet internally to position its layers).


  function setPosition(el, point) {
    /*eslint-disable */
    el._leaflet_pos = point;
    /* eslint-enable */

    if (Browser.any3d) {
      setTransform(el, point);
    } else {
      el.style.left = point.x + 'px';
      el.style.top = point.y + 'px';
    }
  } // @function getPosition(el: HTMLElement): Point
  // Returns the coordinates of an element previously positioned with setPosition.


  function getPosition(el) {
    // this method is only used for elements previously positioned using setPosition,
    // so it's safe to cache the position for performance
    return el._leaflet_pos || new Point(0, 0);
  } // @function disableTextSelection()
  // Prevents the user from generating `selectstart` DOM events, usually generated
  // when the user drags the mouse through a page with text. Used internally
  // by Leaflet to override the behaviour of any click-and-drag interaction on
  // the map. Affects drag interactions on the whole document.
  // @function enableTextSelection()
  // Cancels the effects of a previous [`L.DomUtil.disableTextSelection`](#domutil-disabletextselection).


  var disableTextSelection;
  var enableTextSelection;

  var _userSelect;

  if ('onselectstart' in document) {
    disableTextSelection = function disableTextSelection() {
      on(window, 'selectstart', preventDefault);
    };

    enableTextSelection = function enableTextSelection() {
      off(window, 'selectstart', preventDefault);
    };
  } else {
    var userSelectProperty = testProp(['userSelect', 'WebkitUserSelect', 'OUserSelect', 'MozUserSelect', 'msUserSelect']);

    disableTextSelection = function disableTextSelection() {
      if (userSelectProperty) {
        var style = document.documentElement.style;
        _userSelect = style[userSelectProperty];
        style[userSelectProperty] = 'none';
      }
    };

    enableTextSelection = function enableTextSelection() {
      if (userSelectProperty) {
        document.documentElement.style[userSelectProperty] = _userSelect;
        _userSelect = undefined;
      }
    };
  } // @function disableImageDrag()
  // As [`L.DomUtil.disableTextSelection`](#domutil-disabletextselection), but
  // for `dragstart` DOM events, usually generated when the user drags an image.


  function disableImageDrag() {
    on(window, 'dragstart', preventDefault);
  } // @function enableImageDrag()
  // Cancels the effects of a previous [`L.DomUtil.disableImageDrag`](#domutil-disabletextselection).


  function enableImageDrag() {
    off(window, 'dragstart', preventDefault);
  }

  var _outlineElement, _outlineStyle; // @function preventOutline(el: HTMLElement)
  // Makes the [outline](https://developer.mozilla.org/docs/Web/CSS/outline)
  // of the element `el` invisible. Used internally by Leaflet to prevent
  // focusable elements from displaying an outline when the user performs a
  // drag interaction on them.


  function preventOutline(element) {
    while (element.tabIndex === -1) {
      element = element.parentNode;
    }

    if (!element.style) {
      return;
    }

    restoreOutline();
    _outlineElement = element;
    _outlineStyle = element.style.outline;
    element.style.outline = 'none';
    on(window, 'keydown', restoreOutline);
  } // @function restoreOutline()
  // Cancels the effects of a previous [`L.DomUtil.preventOutline`]().


  function restoreOutline() {
    if (!_outlineElement) {
      return;
    }

    _outlineElement.style.outline = _outlineStyle;
    _outlineElement = undefined;
    _outlineStyle = undefined;
    off(window, 'keydown', restoreOutline);
  } // @function getSizedParentNode(el: HTMLElement): HTMLElement
  // Finds the closest parent node which size (width and height) is not null.


  function getSizedParentNode(element) {
    do {
      element = element.parentNode;
    } while ((!element.offsetWidth || !element.offsetHeight) && element !== document.body);

    return element;
  } // @function getScale(el: HTMLElement): Object
  // Computes the CSS scale currently applied on the element.
  // Returns an object with `x` and `y` members as horizontal and vertical scales respectively,
  // and `boundingClientRect` as the result of [`getBoundingClientRect()`](https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect).


  function getScale(element) {
    var rect = element.getBoundingClientRect(); // Read-only in old browsers.

    return {
      x: rect.width / element.offsetWidth || 1,
      y: rect.height / element.offsetHeight || 1,
      boundingClientRect: rect
    };
  }

  var DomUtil = {
    __proto__: null,
    TRANSFORM: TRANSFORM,
    TRANSITION: TRANSITION,
    TRANSITION_END: TRANSITION_END,
    get: get,
    getStyle: getStyle,
    create: create$1,
    remove: _remove,
    empty: empty,
    toFront: toFront,
    toBack: toBack,
    hasClass: hasClass,
    addClass: addClass,
    removeClass: removeClass,
    setClass: setClass,
    getClass: getClass,
    setOpacity: _setOpacity,
    testProp: testProp,
    setTransform: setTransform,
    setPosition: setPosition,
    getPosition: getPosition,

    get disableTextSelection() {
      return disableTextSelection;
    },

    get enableTextSelection() {
      return enableTextSelection;
    },

    disableImageDrag: disableImageDrag,
    enableImageDrag: enableImageDrag,
    preventOutline: preventOutline,
    restoreOutline: restoreOutline,
    getSizedParentNode: getSizedParentNode,
    getScale: getScale
  };
  /*
   * @namespace DomEvent
   * Utility functions to work with the [DOM events](https://developer.mozilla.org/docs/Web/API/Event), used by Leaflet internally.
   */
  // Inspired by John Resig, Dean Edwards and YUI addEvent implementations.
  // @function on(el: HTMLElement, types: String, fn: Function, context?: Object): this
  // Adds a listener function (`fn`) to a particular DOM event type of the
  // element `el`. You can optionally specify the context of the listener
  // (object the `this` keyword will point to). You can also pass several
  // space-separated types (e.g. `'click dblclick'`).
  // @alternative
  // @function on(el: HTMLElement, eventMap: Object, context?: Object): this
  // Adds a set of type/listener pairs, e.g. `{click: onClick, mousemove: onMouseMove}`

  function on(obj, types, fn, context) {
    if (types && _typeof(types) === 'object') {
      for (var type in types) {
        addOne(obj, type, types[type], fn);
      }
    } else {
      types = splitWords(types);

      for (var i = 0, len = types.length; i < len; i++) {
        addOne(obj, types[i], fn, context);
      }
    }

    return this;
  }

  var eventsKey = '_leaflet_events'; // @function off(el: HTMLElement, types: String, fn: Function, context?: Object): this
  // Removes a previously added listener function.
  // Note that if you passed a custom context to on, you must pass the same
  // context to `off` in order to remove the listener.
  // @alternative
  // @function off(el: HTMLElement, eventMap: Object, context?: Object): this
  // Removes a set of type/listener pairs, e.g. `{click: onClick, mousemove: onMouseMove}`
  // @alternative
  // @function off(el: HTMLElement, types: String): this
  // Removes all previously added listeners of given types.
  // @alternative
  // @function off(el: HTMLElement): this
  // Removes all previously added listeners from given HTMLElement

  function off(obj, types, fn, context) {
    if (arguments.length === 1) {
      batchRemove(obj);
      delete obj[eventsKey];
    } else if (types && _typeof(types) === 'object') {
      for (var type in types) {
        removeOne(obj, type, types[type], fn);
      }
    } else {
      types = splitWords(types);

      if (arguments.length === 2) {
        batchRemove(obj, function (type) {
          return indexOf(types, type) !== -1;
        });
      } else {
        for (var i = 0, len = types.length; i < len; i++) {
          removeOne(obj, types[i], fn, context);
        }
      }
    }

    return this;
  }

  function batchRemove(obj, filterFn) {
    for (var id in obj[eventsKey]) {
      var type = id.split(/\d/)[0];

      if (!filterFn || filterFn(type)) {
        removeOne(obj, type, null, null, id);
      }
    }
  }

  var mouseSubst = {
    mouseenter: 'mouseover',
    mouseleave: 'mouseout',
    wheel: !('onwheel' in window) && 'mousewheel'
  };

  function addOne(obj, type, fn, context) {
    var id = type + stamp(fn) + (context ? '_' + stamp(context) : '');

    if (obj[eventsKey] && obj[eventsKey][id]) {
      return this;
    }

    var handler = function handler(e) {
      return fn.call(context || obj, e || window.event);
    };

    var originalHandler = handler;

    if (!Browser.touchNative && Browser.pointer && type.indexOf('touch') === 0) {
      // Needs DomEvent.Pointer.js
      handler = addPointerListener(obj, type, handler);
    } else if (Browser.touch && type === 'dblclick') {
      handler = addDoubleTapListener(obj, handler);
    } else if ('addEventListener' in obj) {
      if (type === 'touchstart' || type === 'touchmove' || type === 'wheel' || type === 'mousewheel') {
        obj.addEventListener(mouseSubst[type] || type, handler, Browser.passiveEvents ? {
          passive: false
        } : false);
      } else if (type === 'mouseenter' || type === 'mouseleave') {
        handler = function handler(e) {
          e = e || window.event;

          if (isExternalTarget(obj, e)) {
            originalHandler(e);
          }
        };

        obj.addEventListener(mouseSubst[type], handler, false);
      } else {
        obj.addEventListener(type, originalHandler, false);
      }
    } else {
      obj.attachEvent('on' + type, handler);
    }

    obj[eventsKey] = obj[eventsKey] || {};
    obj[eventsKey][id] = handler;
  }

  function removeOne(obj, type, fn, context, id) {
    id = id || type + stamp(fn) + (context ? '_' + stamp(context) : '');
    var handler = obj[eventsKey] && obj[eventsKey][id];

    if (!handler) {
      return this;
    }

    if (!Browser.touchNative && Browser.pointer && type.indexOf('touch') === 0) {
      removePointerListener(obj, type, handler);
    } else if (Browser.touch && type === 'dblclick') {
      removeDoubleTapListener(obj, handler);
    } else if ('removeEventListener' in obj) {
      obj.removeEventListener(mouseSubst[type] || type, handler, false);
    } else {
      obj.detachEvent('on' + type, handler);
    }

    obj[eventsKey][id] = null;
  } // @function stopPropagation(ev: DOMEvent): this
  // Stop the given event from propagation to parent elements. Used inside the listener functions:
  // ```js
  // L.DomEvent.on(div, 'click', function (ev) {
  // 	L.DomEvent.stopPropagation(ev);
  // });
  // ```


  function stopPropagation(e) {
    if (e.stopPropagation) {
      e.stopPropagation();
    } else if (e.originalEvent) {
      // In case of Leaflet event.
      e.originalEvent._stopped = true;
    } else {
      e.cancelBubble = true;
    }

    return this;
  } // @function disableScrollPropagation(el: HTMLElement): this
  // Adds `stopPropagation` to the element's `'wheel'` events (plus browser variants).


  function disableScrollPropagation(el) {
    addOne(el, 'wheel', stopPropagation);
    return this;
  } // @function disableClickPropagation(el: HTMLElement): this
  // Adds `stopPropagation` to the element's `'click'`, `'dblclick'`, `'contextmenu'`,
  // `'mousedown'` and `'touchstart'` events (plus browser variants).


  function disableClickPropagation(el) {
    on(el, 'mousedown touchstart dblclick contextmenu', stopPropagation);
    el['_leaflet_disable_click'] = true;
    return this;
  } // @function preventDefault(ev: DOMEvent): this
  // Prevents the default action of the DOM Event `ev` from happening (such as
  // following a link in the href of the a element, or doing a POST request
  // with page reload when a `<form>` is submitted).
  // Use it inside listener functions.


  function preventDefault(e) {
    if (e.preventDefault) {
      e.preventDefault();
    } else {
      e.returnValue = false;
    }

    return this;
  } // @function stop(ev: DOMEvent): this
  // Does `stopPropagation` and `preventDefault` at the same time.


  function stop(e) {
    preventDefault(e);
    stopPropagation(e);
    return this;
  } // @function getMousePosition(ev: DOMEvent, container?: HTMLElement): Point
  // Gets normalized mouse position from a DOM event relative to the
  // `container` (border excluded) or to the whole page if not specified.


  function getMousePosition(e, container) {
    if (!container) {
      return new Point(e.clientX, e.clientY);
    }

    var scale = getScale(container),
        offset = scale.boundingClientRect; // left and top  values are in page scale (like the event clientX/Y)

    return new Point( // offset.left/top values are in page scale (like clientX/Y),
    // whereas clientLeft/Top (border width) values are the original values (before CSS scale applies).
    (e.clientX - offset.left) / scale.x - container.clientLeft, (e.clientY - offset.top) / scale.y - container.clientTop);
  } // Chrome on Win scrolls double the pixels as in other platforms (see #4538),
  // and Firefox scrolls device pixels, not CSS pixels


  var wheelPxFactor = Browser.win && Browser.chrome ? 2 * window.devicePixelRatio : Browser.gecko ? window.devicePixelRatio : 1; // @function getWheelDelta(ev: DOMEvent): Number
  // Gets normalized wheel delta from a wheel DOM event, in vertical
  // pixels scrolled (negative if scrolling down).
  // Events from pointing devices without precise scrolling are mapped to
  // a best guess of 60 pixels.

  function getWheelDelta(e) {
    return Browser.edge ? e.wheelDeltaY / 2 : // Don't trust window-geometry-based delta
    e.deltaY && e.deltaMode === 0 ? -e.deltaY / wheelPxFactor : // Pixels
    e.deltaY && e.deltaMode === 1 ? -e.deltaY * 20 : // Lines
    e.deltaY && e.deltaMode === 2 ? -e.deltaY * 60 : // Pages
    e.deltaX || e.deltaZ ? 0 : // Skip horizontal/depth wheel events
    e.wheelDelta ? (e.wheelDeltaY || e.wheelDelta) / 2 : // Legacy IE pixels
    e.detail && Math.abs(e.detail) < 32765 ? -e.detail * 20 : // Legacy Moz lines
    e.detail ? e.detail / -32765 * 60 : // Legacy Moz pages
    0;
  } // check if element really left/entered the event target (for mouseenter/mouseleave)


  function isExternalTarget(el, e) {
    var related = e.relatedTarget;

    if (!related) {
      return true;
    }

    try {
      while (related && related !== el) {
        related = related.parentNode;
      }
    } catch (err) {
      return false;
    }

    return related !== el;
  }

  var DomEvent = {
    __proto__: null,
    on: on,
    off: off,
    stopPropagation: stopPropagation,
    disableScrollPropagation: disableScrollPropagation,
    disableClickPropagation: disableClickPropagation,
    preventDefault: preventDefault,
    stop: stop,
    getMousePosition: getMousePosition,
    getWheelDelta: getWheelDelta,
    isExternalTarget: isExternalTarget,
    addListener: on,
    removeListener: off
  };
  /*
   * @class PosAnimation
   * @aka L.PosAnimation
   * @inherits Evented
   * Used internally for panning animations, utilizing CSS3 Transitions for modern browsers and a timer fallback for IE6-9.
   *
   * @example
   * ```js
   * var fx = new L.PosAnimation();
   * fx.run(el, [300, 500], 0.5);
   * ```
   *
   * @constructor L.PosAnimation()
   * Creates a `PosAnimation` object.
   *
   */

  var PosAnimation = Evented.extend({
    // @method run(el: HTMLElement, newPos: Point, duration?: Number, easeLinearity?: Number)
    // Run an animation of a given element to a new position, optionally setting
    // duration in seconds (`0.25` by default) and easing linearity factor (3rd
    // argument of the [cubic bezier curve](https://cubic-bezier.com/#0,0,.5,1),
    // `0.5` by default).
    run: function run(el, newPos, duration, easeLinearity) {
      this.stop();
      this._el = el;
      this._inProgress = true;
      this._duration = duration || 0.25;
      this._easeOutPower = 1 / Math.max(easeLinearity || 0.5, 0.2);
      this._startPos = getPosition(el);
      this._offset = newPos.subtract(this._startPos);
      this._startTime = +new Date(); // @event start: Event
      // Fired when the animation starts

      this.fire('start');

      this._animate();
    },
    // @method stop()
    // Stops the animation (if currently running).
    stop: function stop() {
      if (!this._inProgress) {
        return;
      }

      this._step(true);

      this._complete();
    },
    _animate: function _animate() {
      // animation loop
      this._animId = requestAnimFrame(this._animate, this);

      this._step();
    },
    _step: function _step(round) {
      var elapsed = +new Date() - this._startTime,
          duration = this._duration * 1000;

      if (elapsed < duration) {
        this._runFrame(this._easeOut(elapsed / duration), round);
      } else {
        this._runFrame(1);

        this._complete();
      }
    },
    _runFrame: function _runFrame(progress, round) {
      var pos = this._startPos.add(this._offset.multiplyBy(progress));

      if (round) {
        pos._round();
      }

      setPosition(this._el, pos); // @event step: Event
      // Fired continuously during the animation.

      this.fire('step');
    },
    _complete: function _complete() {
      cancelAnimFrame(this._animId);
      this._inProgress = false; // @event end: Event
      // Fired when the animation ends.

      this.fire('end');
    },
    _easeOut: function _easeOut(t) {
      return 1 - Math.pow(1 - t, this._easeOutPower);
    }
  });
  /*
   * @class Map
   * @aka L.Map
   * @inherits Evented
   *
   * The central class of the API — it is used to create a map on a page and manipulate it.
   *
   * @example
   *
   * ```js
   * // initialize the map on the "map" div with a given center and zoom
   * var map = L.map('map', {
   * 	center: [51.505, -0.09],
   * 	zoom: 13
   * });
   * ```
   *
   */

  var Map = Evented.extend({
    options: {
      // @section Map State Options
      // @option crs: CRS = L.CRS.EPSG3857
      // The [Coordinate Reference System](#crs) to use. Don't change this if you're not
      // sure what it means.
      crs: EPSG3857,
      // @option center: LatLng = undefined
      // Initial geographic center of the map
      center: undefined,
      // @option zoom: Number = undefined
      // Initial map zoom level
      zoom: undefined,
      // @option minZoom: Number = *
      // Minimum zoom level of the map.
      // If not specified and at least one `GridLayer` or `TileLayer` is in the map,
      // the lowest of their `minZoom` options will be used instead.
      minZoom: undefined,
      // @option maxZoom: Number = *
      // Maximum zoom level of the map.
      // If not specified and at least one `GridLayer` or `TileLayer` is in the map,
      // the highest of their `maxZoom` options will be used instead.
      maxZoom: undefined,
      // @option layers: Layer[] = []
      // Array of layers that will be added to the map initially
      layers: [],
      // @option maxBounds: LatLngBounds = null
      // When this option is set, the map restricts the view to the given
      // geographical bounds, bouncing the user back if the user tries to pan
      // outside the view. To set the restriction dynamically, use
      // [`setMaxBounds`](#map-setmaxbounds) method.
      maxBounds: undefined,
      // @option renderer: Renderer = *
      // The default method for drawing vector layers on the map. `L.SVG`
      // or `L.Canvas` by default depending on browser support.
      renderer: undefined,
      // @section Animation Options
      // @option zoomAnimation: Boolean = true
      // Whether the map zoom animation is enabled. By default it's enabled
      // in all browsers that support CSS3 Transitions except Android.
      zoomAnimation: true,
      // @option zoomAnimationThreshold: Number = 4
      // Won't animate zoom if the zoom difference exceeds this value.
      zoomAnimationThreshold: 4,
      // @option fadeAnimation: Boolean = true
      // Whether the tile fade animation is enabled. By default it's enabled
      // in all browsers that support CSS3 Transitions except Android.
      fadeAnimation: true,
      // @option markerZoomAnimation: Boolean = true
      // Whether markers animate their zoom with the zoom animation, if disabled
      // they will disappear for the length of the animation. By default it's
      // enabled in all browsers that support CSS3 Transitions except Android.
      markerZoomAnimation: true,
      // @option transform3DLimit: Number = 2^23
      // Defines the maximum size of a CSS translation transform. The default
      // value should not be changed unless a web browser positions layers in
      // the wrong place after doing a large `panBy`.
      transform3DLimit: 8388608,
      // Precision limit of a 32-bit float
      // @section Interaction Options
      // @option zoomSnap: Number = 1
      // Forces the map's zoom level to always be a multiple of this, particularly
      // right after a [`fitBounds()`](#map-fitbounds) or a pinch-zoom.
      // By default, the zoom level snaps to the nearest integer; lower values
      // (e.g. `0.5` or `0.1`) allow for greater granularity. A value of `0`
      // means the zoom level will not be snapped after `fitBounds` or a pinch-zoom.
      zoomSnap: 1,
      // @option zoomDelta: Number = 1
      // Controls how much the map's zoom level will change after a
      // [`zoomIn()`](#map-zoomin), [`zoomOut()`](#map-zoomout), pressing `+`
      // or `-` on the keyboard, or using the [zoom controls](#control-zoom).
      // Values smaller than `1` (e.g. `0.5`) allow for greater granularity.
      zoomDelta: 1,
      // @option trackResize: Boolean = true
      // Whether the map automatically handles browser window resize to update itself.
      trackResize: true
    },
    initialize: function initialize(id, options) {
      // (HTMLElement or String, Object)
      options = setOptions(this, options); // Make sure to assign internal flags at the beginning,
      // to avoid inconsistent state in some edge cases.

      this._handlers = [];
      this._layers = {};
      this._zoomBoundLayers = {};
      this._sizeChanged = true;

      this._initContainer(id);

      this._initLayout(); // hack for https://github.com/Leaflet/Leaflet/issues/1980


      this._onResize = bind(this._onResize, this);

      this._initEvents();

      if (options.maxBounds) {
        this.setMaxBounds(options.maxBounds);
      }

      if (options.zoom !== undefined) {
        this._zoom = this._limitZoom(options.zoom);
      }

      if (options.center && options.zoom !== undefined) {
        this.setView(toLatLng(options.center), options.zoom, {
          reset: true
        });
      }

      this.callInitHooks(); // don't animate on browsers without hardware-accelerated transitions or old Android/Opera

      this._zoomAnimated = TRANSITION && Browser.any3d && !Browser.mobileOpera && this.options.zoomAnimation; // zoom transitions run with the same duration for all layers, so if one of transitionend events
      // happens after starting zoom animation (propagating to the map pane), we know that it ended globally

      if (this._zoomAnimated) {
        this._createAnimProxy();

        on(this._proxy, TRANSITION_END, this._catchTransitionEnd, this);
      }

      this._addLayers(this.options.layers);
    },
    // @section Methods for modifying map state
    // @method setView(center: LatLng, zoom: Number, options?: Zoom/pan options): this
    // Sets the view of the map (geographical center and zoom) with the given
    // animation options.
    setView: function setView(center, zoom, options) {
      zoom = zoom === undefined ? this._zoom : this._limitZoom(zoom);
      center = this._limitCenter(toLatLng(center), zoom, this.options.maxBounds);
      options = options || {};

      this._stop();

      if (this._loaded && !options.reset && options !== true) {
        if (options.animate !== undefined) {
          options.zoom = extend({
            animate: options.animate
          }, options.zoom);
          options.pan = extend({
            animate: options.animate,
            duration: options.duration
          }, options.pan);
        } // try animating pan or zoom


        var moved = this._zoom !== zoom ? this._tryAnimatedZoom && this._tryAnimatedZoom(center, zoom, options.zoom) : this._tryAnimatedPan(center, options.pan);

        if (moved) {
          // prevent resize handler call, the view will refresh after animation anyway
          clearTimeout(this._sizeTimer);
          return this;
        }
      } // animation didn't start, just reset the map view


      this._resetView(center, zoom);

      return this;
    },
    // @method setZoom(zoom: Number, options?: Zoom/pan options): this
    // Sets the zoom of the map.
    setZoom: function setZoom(zoom, options) {
      if (!this._loaded) {
        this._zoom = zoom;
        return this;
      }

      return this.setView(this.getCenter(), zoom, {
        zoom: options
      });
    },
    // @method zoomIn(delta?: Number, options?: Zoom options): this
    // Increases the zoom of the map by `delta` ([`zoomDelta`](#map-zoomdelta) by default).
    zoomIn: function zoomIn(delta, options) {
      delta = delta || (Browser.any3d ? this.options.zoomDelta : 1);
      return this.setZoom(this._zoom + delta, options);
    },
    // @method zoomOut(delta?: Number, options?: Zoom options): this
    // Decreases the zoom of the map by `delta` ([`zoomDelta`](#map-zoomdelta) by default).
    zoomOut: function zoomOut(delta, options) {
      delta = delta || (Browser.any3d ? this.options.zoomDelta : 1);
      return this.setZoom(this._zoom - delta, options);
    },
    // @method setZoomAround(latlng: LatLng, zoom: Number, options: Zoom options): this
    // Zooms the map while keeping a specified geographical point on the map
    // stationary (e.g. used internally for scroll zoom and double-click zoom).
    // @alternative
    // @method setZoomAround(offset: Point, zoom: Number, options: Zoom options): this
    // Zooms the map while keeping a specified pixel on the map (relative to the top-left corner) stationary.
    setZoomAround: function setZoomAround(latlng, zoom, options) {
      var scale = this.getZoomScale(zoom),
          viewHalf = this.getSize().divideBy(2),
          containerPoint = latlng instanceof Point ? latlng : this.latLngToContainerPoint(latlng),
          centerOffset = containerPoint.subtract(viewHalf).multiplyBy(1 - 1 / scale),
          newCenter = this.containerPointToLatLng(viewHalf.add(centerOffset));
      return this.setView(newCenter, zoom, {
        zoom: options
      });
    },
    _getBoundsCenterZoom: function _getBoundsCenterZoom(bounds, options) {
      options = options || {};
      bounds = bounds.getBounds ? bounds.getBounds() : toLatLngBounds(bounds);
      var paddingTL = toPoint(options.paddingTopLeft || options.padding || [0, 0]),
          paddingBR = toPoint(options.paddingBottomRight || options.padding || [0, 0]),
          zoom = this.getBoundsZoom(bounds, false, paddingTL.add(paddingBR));
      zoom = typeof options.maxZoom === 'number' ? Math.min(options.maxZoom, zoom) : zoom;

      if (zoom === Infinity) {
        return {
          center: bounds.getCenter(),
          zoom: zoom
        };
      }

      var paddingOffset = paddingBR.subtract(paddingTL).divideBy(2),
          swPoint = this.project(bounds.getSouthWest(), zoom),
          nePoint = this.project(bounds.getNorthEast(), zoom),
          center = this.unproject(swPoint.add(nePoint).divideBy(2).add(paddingOffset), zoom);
      return {
        center: center,
        zoom: zoom
      };
    },
    // @method fitBounds(bounds: LatLngBounds, options?: fitBounds options): this
    // Sets a map view that contains the given geographical bounds with the
    // maximum zoom level possible.
    fitBounds: function fitBounds(bounds, options) {
      bounds = toLatLngBounds(bounds);

      if (!bounds.isValid()) {
        throw new Error('Bounds are not valid.');
      }

      var target = this._getBoundsCenterZoom(bounds, options);

      return this.setView(target.center, target.zoom, options);
    },
    // @method fitWorld(options?: fitBounds options): this
    // Sets a map view that mostly contains the whole world with the maximum
    // zoom level possible.
    fitWorld: function fitWorld(options) {
      return this.fitBounds([[-90, -180], [90, 180]], options);
    },
    // @method panTo(latlng: LatLng, options?: Pan options): this
    // Pans the map to a given center.
    panTo: function panTo(center, options) {
      // (LatLng)
      return this.setView(center, this._zoom, {
        pan: options
      });
    },
    // @method panBy(offset: Point, options?: Pan options): this
    // Pans the map by a given number of pixels (animated).
    panBy: function panBy(offset, options) {
      offset = toPoint(offset).round();
      options = options || {};

      if (!offset.x && !offset.y) {
        return this.fire('moveend');
      } // If we pan too far, Chrome gets issues with tiles
      // and makes them disappear or appear in the wrong place (slightly offset) #2602


      if (options.animate !== true && !this.getSize().contains(offset)) {
        this._resetView(this.unproject(this.project(this.getCenter()).add(offset)), this.getZoom());

        return this;
      }

      if (!this._panAnim) {
        this._panAnim = new PosAnimation();

        this._panAnim.on({
          'step': this._onPanTransitionStep,
          'end': this._onPanTransitionEnd
        }, this);
      } // don't fire movestart if animating inertia


      if (!options.noMoveStart) {
        this.fire('movestart');
      } // animate pan unless animate: false specified


      if (options.animate !== false) {
        addClass(this._mapPane, 'leaflet-pan-anim');

        var newPos = this._getMapPanePos().subtract(offset).round();

        this._panAnim.run(this._mapPane, newPos, options.duration || 0.25, options.easeLinearity);
      } else {
        this._rawPanBy(offset);

        this.fire('move').fire('moveend');
      }

      return this;
    },
    // @method flyTo(latlng: LatLng, zoom?: Number, options?: Zoom/pan options): this
    // Sets the view of the map (geographical center and zoom) performing a smooth
    // pan-zoom animation.
    flyTo: function flyTo(targetCenter, targetZoom, options) {
      options = options || {};

      if (options.animate === false || !Browser.any3d) {
        return this.setView(targetCenter, targetZoom, options);
      }

      this._stop();

      var from = this.project(this.getCenter()),
          to = this.project(targetCenter),
          size = this.getSize(),
          startZoom = this._zoom;
      targetCenter = toLatLng(targetCenter);
      targetZoom = targetZoom === undefined ? startZoom : targetZoom;
      var w0 = Math.max(size.x, size.y),
          w1 = w0 * this.getZoomScale(startZoom, targetZoom),
          u1 = to.distanceTo(from) || 1,
          rho = 1.42,
          rho2 = rho * rho;

      function r(i) {
        var s1 = i ? -1 : 1,
            s2 = i ? w1 : w0,
            t1 = w1 * w1 - w0 * w0 + s1 * rho2 * rho2 * u1 * u1,
            b1 = 2 * s2 * rho2 * u1,
            b = t1 / b1,
            sq = Math.sqrt(b * b + 1) - b; // workaround for floating point precision bug when sq = 0, log = -Infinite,
        // thus triggering an infinite loop in flyTo

        var log = sq < 0.000000001 ? -18 : Math.log(sq);
        return log;
      }

      function sinh(n) {
        return (Math.exp(n) - Math.exp(-n)) / 2;
      }

      function cosh(n) {
        return (Math.exp(n) + Math.exp(-n)) / 2;
      }

      function tanh(n) {
        return sinh(n) / cosh(n);
      }

      var r0 = r(0);

      function w(s) {
        return w0 * (cosh(r0) / cosh(r0 + rho * s));
      }

      function u(s) {
        return w0 * (cosh(r0) * tanh(r0 + rho * s) - sinh(r0)) / rho2;
      }

      function easeOut(t) {
        return 1 - Math.pow(1 - t, 1.5);
      }

      var start = Date.now(),
          S = (r(1) - r0) / rho,
          duration = options.duration ? 1000 * options.duration : 1000 * S * 0.8;

      function frame() {
        var t = (Date.now() - start) / duration,
            s = easeOut(t) * S;

        if (t <= 1) {
          this._flyToFrame = requestAnimFrame(frame, this);

          this._move(this.unproject(from.add(to.subtract(from).multiplyBy(u(s) / u1)), startZoom), this.getScaleZoom(w0 / w(s), startZoom), {
            flyTo: true
          });
        } else {
          this._move(targetCenter, targetZoom)._moveEnd(true);
        }
      }

      this._moveStart(true, options.noMoveStart);

      frame.call(this);
      return this;
    },
    // @method flyToBounds(bounds: LatLngBounds, options?: fitBounds options): this
    // Sets the view of the map with a smooth animation like [`flyTo`](#map-flyto),
    // but takes a bounds parameter like [`fitBounds`](#map-fitbounds).
    flyToBounds: function flyToBounds(bounds, options) {
      var target = this._getBoundsCenterZoom(bounds, options);

      return this.flyTo(target.center, target.zoom, options);
    },
    // @method setMaxBounds(bounds: LatLngBounds): this
    // Restricts the map view to the given bounds (see the [maxBounds](#map-maxbounds) option).
    setMaxBounds: function setMaxBounds(bounds) {
      bounds = toLatLngBounds(bounds);

      if (!bounds.isValid()) {
        this.options.maxBounds = null;
        return this.off('moveend', this._panInsideMaxBounds);
      } else if (this.options.maxBounds) {
        this.off('moveend', this._panInsideMaxBounds);
      }

      this.options.maxBounds = bounds;

      if (this._loaded) {
        this._panInsideMaxBounds();
      }

      return this.on('moveend', this._panInsideMaxBounds);
    },
    // @method setMinZoom(zoom: Number): this
    // Sets the lower limit for the available zoom levels (see the [minZoom](#map-minzoom) option).
    setMinZoom: function setMinZoom(zoom) {
      var oldZoom = this.options.minZoom;
      this.options.minZoom = zoom;

      if (this._loaded && oldZoom !== zoom) {
        this.fire('zoomlevelschange');

        if (this.getZoom() < this.options.minZoom) {
          return this.setZoom(zoom);
        }
      }

      return this;
    },
    // @method setMaxZoom(zoom: Number): this
    // Sets the upper limit for the available zoom levels (see the [maxZoom](#map-maxzoom) option).
    setMaxZoom: function setMaxZoom(zoom) {
      var oldZoom = this.options.maxZoom;
      this.options.maxZoom = zoom;

      if (this._loaded && oldZoom !== zoom) {
        this.fire('zoomlevelschange');

        if (this.getZoom() > this.options.maxZoom) {
          return this.setZoom(zoom);
        }
      }

      return this;
    },
    // @method panInsideBounds(bounds: LatLngBounds, options?: Pan options): this
    // Pans the map to the closest view that would lie inside the given bounds (if it's not already), controlling the animation using the options specific, if any.
    panInsideBounds: function panInsideBounds(bounds, options) {
      this._enforcingBounds = true;

      var center = this.getCenter(),
          newCenter = this._limitCenter(center, this._zoom, toLatLngBounds(bounds));

      if (!center.equals(newCenter)) {
        this.panTo(newCenter, options);
      }

      this._enforcingBounds = false;
      return this;
    },
    // @method panInside(latlng: LatLng, options?: padding options): this
    // Pans the map the minimum amount to make the `latlng` visible. Use
    // padding options to fit the display to more restricted bounds.
    // If `latlng` is already within the (optionally padded) display bounds,
    // the map will not be panned.
    panInside: function panInside(latlng, options) {
      options = options || {};
      var paddingTL = toPoint(options.paddingTopLeft || options.padding || [0, 0]),
          paddingBR = toPoint(options.paddingBottomRight || options.padding || [0, 0]),
          pixelCenter = this.project(this.getCenter()),
          pixelPoint = this.project(latlng),
          pixelBounds = this.getPixelBounds(),
          paddedBounds = toBounds([pixelBounds.min.add(paddingTL), pixelBounds.max.subtract(paddingBR)]),
          paddedSize = paddedBounds.getSize();

      if (!paddedBounds.contains(pixelPoint)) {
        this._enforcingBounds = true;
        var centerOffset = pixelPoint.subtract(paddedBounds.getCenter());
        var offset = paddedBounds.extend(pixelPoint).getSize().subtract(paddedSize);
        pixelCenter.x += centerOffset.x < 0 ? -offset.x : offset.x;
        pixelCenter.y += centerOffset.y < 0 ? -offset.y : offset.y;
        this.panTo(this.unproject(pixelCenter), options);
        this._enforcingBounds = false;
      }

      return this;
    },
    // @method invalidateSize(options: Zoom/pan options): this
    // Checks if the map container size changed and updates the map if so —
    // call it after you've changed the map size dynamically, also animating
    // pan by default. If `options.pan` is `false`, panning will not occur.
    // If `options.debounceMoveend` is `true`, it will delay `moveend` event so
    // that it doesn't happen often even if the method is called many
    // times in a row.
    // @alternative
    // @method invalidateSize(animate: Boolean): this
    // Checks if the map container size changed and updates the map if so —
    // call it after you've changed the map size dynamically, also animating
    // pan by default.
    invalidateSize: function invalidateSize(options) {
      if (!this._loaded) {
        return this;
      }

      options = extend({
        animate: false,
        pan: true
      }, options === true ? {
        animate: true
      } : options);
      var oldSize = this.getSize();
      this._sizeChanged = true;
      this._lastCenter = null;
      var newSize = this.getSize(),
          oldCenter = oldSize.divideBy(2).round(),
          newCenter = newSize.divideBy(2).round(),
          offset = oldCenter.subtract(newCenter);

      if (!offset.x && !offset.y) {
        return this;
      }

      if (options.animate && options.pan) {
        this.panBy(offset);
      } else {
        if (options.pan) {
          this._rawPanBy(offset);
        }

        this.fire('move');

        if (options.debounceMoveend) {
          clearTimeout(this._sizeTimer);
          this._sizeTimer = setTimeout(bind(this.fire, this, 'moveend'), 200);
        } else {
          this.fire('moveend');
        }
      } // @section Map state change events
      // @event resize: ResizeEvent
      // Fired when the map is resized.


      return this.fire('resize', {
        oldSize: oldSize,
        newSize: newSize
      });
    },
    // @section Methods for modifying map state
    // @method stop(): this
    // Stops the currently running `panTo` or `flyTo` animation, if any.
    stop: function stop() {
      this.setZoom(this._limitZoom(this._zoom));

      if (!this.options.zoomSnap) {
        this.fire('viewreset');
      }

      return this._stop();
    },
    // @section Geolocation methods
    // @method locate(options?: Locate options): this
    // Tries to locate the user using the Geolocation API, firing a [`locationfound`](#map-locationfound)
    // event with location data on success or a [`locationerror`](#map-locationerror) event on failure,
    // and optionally sets the map view to the user's location with respect to
    // detection accuracy (or to the world view if geolocation failed).
    // Note that, if your page doesn't use HTTPS, this method will fail in
    // modern browsers ([Chrome 50 and newer](https://sites.google.com/a/chromium.org/dev/Home/chromium-security/deprecating-powerful-features-on-insecure-origins))
    // See `Locate options` for more details.
    locate: function locate(options) {
      options = this._locateOptions = extend({
        timeout: 10000,
        watch: false // setView: false
        // maxZoom: <Number>
        // maximumAge: 0
        // enableHighAccuracy: false

      }, options);

      if (!('geolocation' in navigator)) {
        this._handleGeolocationError({
          code: 0,
          message: 'Geolocation not supported.'
        });

        return this;
      }

      var onResponse = bind(this._handleGeolocationResponse, this),
          onError = bind(this._handleGeolocationError, this);

      if (options.watch) {
        this._locationWatchId = navigator.geolocation.watchPosition(onResponse, onError, options);
      } else {
        navigator.geolocation.getCurrentPosition(onResponse, onError, options);
      }

      return this;
    },
    // @method stopLocate(): this
    // Stops watching location previously initiated by `map.locate({watch: true})`
    // and aborts resetting the map view if map.locate was called with
    // `{setView: true}`.
    stopLocate: function stopLocate() {
      if (navigator.geolocation && navigator.geolocation.clearWatch) {
        navigator.geolocation.clearWatch(this._locationWatchId);
      }

      if (this._locateOptions) {
        this._locateOptions.setView = false;
      }

      return this;
    },
    _handleGeolocationError: function _handleGeolocationError(error) {
      if (!this._container._leaflet_id) {
        return;
      }

      var c = error.code,
          message = error.message || (c === 1 ? 'permission denied' : c === 2 ? 'position unavailable' : 'timeout');

      if (this._locateOptions.setView && !this._loaded) {
        this.fitWorld();
      } // @section Location events
      // @event locationerror: ErrorEvent
      // Fired when geolocation (using the [`locate`](#map-locate) method) failed.


      this.fire('locationerror', {
        code: c,
        message: 'Geolocation error: ' + message + '.'
      });
    },
    _handleGeolocationResponse: function _handleGeolocationResponse(pos) {
      if (!this._container._leaflet_id) {
        return;
      }

      var lat = pos.coords.latitude,
          lng = pos.coords.longitude,
          latlng = new LatLng(lat, lng),
          bounds = latlng.toBounds(pos.coords.accuracy * 2),
          options = this._locateOptions;

      if (options.setView) {
        var zoom = this.getBoundsZoom(bounds);
        this.setView(latlng, options.maxZoom ? Math.min(zoom, options.maxZoom) : zoom);
      }

      var data = {
        latlng: latlng,
        bounds: bounds,
        timestamp: pos.timestamp
      };

      for (var i in pos.coords) {
        if (typeof pos.coords[i] === 'number') {
          data[i] = pos.coords[i];
        }
      } // @event locationfound: LocationEvent
      // Fired when geolocation (using the [`locate`](#map-locate) method)
      // went successfully.


      this.fire('locationfound', data);
    },
    // TODO Appropriate docs section?
    // @section Other Methods
    // @method addHandler(name: String, HandlerClass: Function): this
    // Adds a new `Handler` to the map, given its name and constructor function.
    addHandler: function addHandler(name, HandlerClass) {
      if (!HandlerClass) {
        return this;
      }

      var handler = this[name] = new HandlerClass(this);

      this._handlers.push(handler);

      if (this.options[name]) {
        handler.enable();
      }

      return this;
    },
    // @method remove(): this
    // Destroys the map and clears all related event listeners.
    remove: function remove() {
      this._initEvents(true);

      if (this.options.maxBounds) {
        this.off('moveend', this._panInsideMaxBounds);
      }

      if (this._containerId !== this._container._leaflet_id) {
        throw new Error('Map container is being reused by another instance');
      }

      try {
        // throws error in IE6-8
        delete this._container._leaflet_id;
        delete this._containerId;
      } catch (e) {
        /*eslint-disable */
        this._container._leaflet_id = undefined;
        /* eslint-enable */

        this._containerId = undefined;
      }

      if (this._locationWatchId !== undefined) {
        this.stopLocate();
      }

      this._stop();

      _remove(this._mapPane);

      if (this._clearControlPos) {
        this._clearControlPos();
      }

      if (this._resizeRequest) {
        cancelAnimFrame(this._resizeRequest);
        this._resizeRequest = null;
      }

      this._clearHandlers();

      if (this._loaded) {
        // @section Map state change events
        // @event unload: Event
        // Fired when the map is destroyed with [remove](#map-remove) method.
        this.fire('unload');
      }

      var i;

      for (i in this._layers) {
        this._layers[i].remove();
      }

      for (i in this._panes) {
        _remove(this._panes[i]);
      }

      this._layers = [];
      this._panes = [];
      delete this._mapPane;
      delete this._renderer;
      return this;
    },
    // @section Other Methods
    // @method createPane(name: String, container?: HTMLElement): HTMLElement
    // Creates a new [map pane](#map-pane) with the given name if it doesn't exist already,
    // then returns it. The pane is created as a child of `container`, or
    // as a child of the main map pane if not set.
    createPane: function createPane(name, container) {
      var className = 'leaflet-pane' + (name ? ' leaflet-' + name.replace('Pane', '') + '-pane' : ''),
          pane = create$1('div', className, container || this._mapPane);

      if (name) {
        this._panes[name] = pane;
      }

      return pane;
    },
    // @section Methods for Getting Map State
    // @method getCenter(): LatLng
    // Returns the geographical center of the map view
    getCenter: function getCenter() {
      this._checkIfLoaded();

      if (this._lastCenter && !this._moved()) {
        return this._lastCenter;
      }

      return this.layerPointToLatLng(this._getCenterLayerPoint());
    },
    // @method getZoom(): Number
    // Returns the current zoom level of the map view
    getZoom: function getZoom() {
      return this._zoom;
    },
    // @method getBounds(): LatLngBounds
    // Returns the geographical bounds visible in the current map view
    getBounds: function getBounds() {
      var bounds = this.getPixelBounds(),
          sw = this.unproject(bounds.getBottomLeft()),
          ne = this.unproject(bounds.getTopRight());
      return new LatLngBounds(sw, ne);
    },
    // @method getMinZoom(): Number
    // Returns the minimum zoom level of the map (if set in the `minZoom` option of the map or of any layers), or `0` by default.
    getMinZoom: function getMinZoom() {
      return this.options.minZoom === undefined ? this._layersMinZoom || 0 : this.options.minZoom;
    },
    // @method getMaxZoom(): Number
    // Returns the maximum zoom level of the map (if set in the `maxZoom` option of the map or of any layers).
    getMaxZoom: function getMaxZoom() {
      return this.options.maxZoom === undefined ? this._layersMaxZoom === undefined ? Infinity : this._layersMaxZoom : this.options.maxZoom;
    },
    // @method getBoundsZoom(bounds: LatLngBounds, inside?: Boolean, padding?: Point): Number
    // Returns the maximum zoom level on which the given bounds fit to the map
    // view in its entirety. If `inside` (optional) is set to `true`, the method
    // instead returns the minimum zoom level on which the map view fits into
    // the given bounds in its entirety.
    getBoundsZoom: function getBoundsZoom(bounds, inside, padding) {
      // (LatLngBounds[, Boolean, Point]) -> Number
      bounds = toLatLngBounds(bounds);
      padding = toPoint(padding || [0, 0]);
      var zoom = this.getZoom() || 0,
          min = this.getMinZoom(),
          max = this.getMaxZoom(),
          nw = bounds.getNorthWest(),
          se = bounds.getSouthEast(),
          size = this.getSize().subtract(padding),
          boundsSize = toBounds(this.project(se, zoom), this.project(nw, zoom)).getSize(),
          snap = Browser.any3d ? this.options.zoomSnap : 1,
          scalex = size.x / boundsSize.x,
          scaley = size.y / boundsSize.y,
          scale = inside ? Math.max(scalex, scaley) : Math.min(scalex, scaley);
      zoom = this.getScaleZoom(scale, zoom);

      if (snap) {
        zoom = Math.round(zoom / (snap / 100)) * (snap / 100); // don't jump if within 1% of a snap level

        zoom = inside ? Math.ceil(zoom / snap) * snap : Math.floor(zoom / snap) * snap;
      }

      return Math.max(min, Math.min(max, zoom));
    },
    // @method getSize(): Point
    // Returns the current size of the map container (in pixels).
    getSize: function getSize() {
      if (!this._size || this._sizeChanged) {
        this._size = new Point(this._container.clientWidth || 0, this._container.clientHeight || 0);
        this._sizeChanged = false;
      }

      return this._size.clone();
    },
    // @method getPixelBounds(): Bounds
    // Returns the bounds of the current map view in projected pixel
    // coordinates (sometimes useful in layer and overlay implementations).
    getPixelBounds: function getPixelBounds(center, zoom) {
      var topLeftPoint = this._getTopLeftPoint(center, zoom);

      return new Bounds(topLeftPoint, topLeftPoint.add(this.getSize()));
    },
    // TODO: Check semantics - isn't the pixel origin the 0,0 coord relative to
    // the map pane? "left point of the map layer" can be confusing, specially
    // since there can be negative offsets.
    // @method getPixelOrigin(): Point
    // Returns the projected pixel coordinates of the top left point of
    // the map layer (useful in custom layer and overlay implementations).
    getPixelOrigin: function getPixelOrigin() {
      this._checkIfLoaded();

      return this._pixelOrigin;
    },
    // @method getPixelWorldBounds(zoom?: Number): Bounds
    // Returns the world's bounds in pixel coordinates for zoom level `zoom`.
    // If `zoom` is omitted, the map's current zoom level is used.
    getPixelWorldBounds: function getPixelWorldBounds(zoom) {
      return this.options.crs.getProjectedBounds(zoom === undefined ? this.getZoom() : zoom);
    },
    // @section Other Methods
    // @method getPane(pane: String|HTMLElement): HTMLElement
    // Returns a [map pane](#map-pane), given its name or its HTML element (its identity).
    getPane: function getPane(pane) {
      return typeof pane === 'string' ? this._panes[pane] : pane;
    },
    // @method getPanes(): Object
    // Returns a plain object containing the names of all [panes](#map-pane) as keys and
    // the panes as values.
    getPanes: function getPanes() {
      return this._panes;
    },
    // @method getContainer: HTMLElement
    // Returns the HTML element that contains the map.
    getContainer: function getContainer() {
      return this._container;
    },
    // @section Conversion Methods
    // @method getZoomScale(toZoom: Number, fromZoom: Number): Number
    // Returns the scale factor to be applied to a map transition from zoom level
    // `fromZoom` to `toZoom`. Used internally to help with zoom animations.
    getZoomScale: function getZoomScale(toZoom, fromZoom) {
      // TODO replace with universal implementation after refactoring projections
      var crs = this.options.crs;
      fromZoom = fromZoom === undefined ? this._zoom : fromZoom;
      return crs.scale(toZoom) / crs.scale(fromZoom);
    },
    // @method getScaleZoom(scale: Number, fromZoom: Number): Number
    // Returns the zoom level that the map would end up at, if it is at `fromZoom`
    // level and everything is scaled by a factor of `scale`. Inverse of
    // [`getZoomScale`](#map-getZoomScale).
    getScaleZoom: function getScaleZoom(scale, fromZoom) {
      var crs = this.options.crs;
      fromZoom = fromZoom === undefined ? this._zoom : fromZoom;
      var zoom = crs.zoom(scale * crs.scale(fromZoom));
      return isNaN(zoom) ? Infinity : zoom;
    },
    // @method project(latlng: LatLng, zoom: Number): Point
    // Projects a geographical coordinate `LatLng` according to the projection
    // of the map's CRS, then scales it according to `zoom` and the CRS's
    // `Transformation`. The result is pixel coordinate relative to
    // the CRS origin.
    project: function project(latlng, zoom) {
      zoom = zoom === undefined ? this._zoom : zoom;
      return this.options.crs.latLngToPoint(toLatLng(latlng), zoom);
    },
    // @method unproject(point: Point, zoom: Number): LatLng
    // Inverse of [`project`](#map-project).
    unproject: function unproject(point, zoom) {
      zoom = zoom === undefined ? this._zoom : zoom;
      return this.options.crs.pointToLatLng(toPoint(point), zoom);
    },
    // @method layerPointToLatLng(point: Point): LatLng
    // Given a pixel coordinate relative to the [origin pixel](#map-getpixelorigin),
    // returns the corresponding geographical coordinate (for the current zoom level).
    layerPointToLatLng: function layerPointToLatLng(point) {
      var projectedPoint = toPoint(point).add(this.getPixelOrigin());
      return this.unproject(projectedPoint);
    },
    // @method latLngToLayerPoint(latlng: LatLng): Point
    // Given a geographical coordinate, returns the corresponding pixel coordinate
    // relative to the [origin pixel](#map-getpixelorigin).
    latLngToLayerPoint: function latLngToLayerPoint(latlng) {
      var projectedPoint = this.project(toLatLng(latlng))._round();

      return projectedPoint._subtract(this.getPixelOrigin());
    },
    // @method wrapLatLng(latlng: LatLng): LatLng
    // Returns a `LatLng` where `lat` and `lng` has been wrapped according to the
    // map's CRS's `wrapLat` and `wrapLng` properties, if they are outside the
    // CRS's bounds.
    // By default this means longitude is wrapped around the dateline so its
    // value is between -180 and +180 degrees.
    wrapLatLng: function wrapLatLng(latlng) {
      return this.options.crs.wrapLatLng(toLatLng(latlng));
    },
    // @method wrapLatLngBounds(bounds: LatLngBounds): LatLngBounds
    // Returns a `LatLngBounds` with the same size as the given one, ensuring that
    // its center is within the CRS's bounds.
    // By default this means the center longitude is wrapped around the dateline so its
    // value is between -180 and +180 degrees, and the majority of the bounds
    // overlaps the CRS's bounds.
    wrapLatLngBounds: function wrapLatLngBounds(latlng) {
      return this.options.crs.wrapLatLngBounds(toLatLngBounds(latlng));
    },
    // @method distance(latlng1: LatLng, latlng2: LatLng): Number
    // Returns the distance between two geographical coordinates according to
    // the map's CRS. By default this measures distance in meters.
    distance: function distance(latlng1, latlng2) {
      return this.options.crs.distance(toLatLng(latlng1), toLatLng(latlng2));
    },
    // @method containerPointToLayerPoint(point: Point): Point
    // Given a pixel coordinate relative to the map container, returns the corresponding
    // pixel coordinate relative to the [origin pixel](#map-getpixelorigin).
    containerPointToLayerPoint: function containerPointToLayerPoint(point) {
      // (Point)
      return toPoint(point).subtract(this._getMapPanePos());
    },
    // @method layerPointToContainerPoint(point: Point): Point
    // Given a pixel coordinate relative to the [origin pixel](#map-getpixelorigin),
    // returns the corresponding pixel coordinate relative to the map container.
    layerPointToContainerPoint: function layerPointToContainerPoint(point) {
      // (Point)
      return toPoint(point).add(this._getMapPanePos());
    },
    // @method containerPointToLatLng(point: Point): LatLng
    // Given a pixel coordinate relative to the map container, returns
    // the corresponding geographical coordinate (for the current zoom level).
    containerPointToLatLng: function containerPointToLatLng(point) {
      var layerPoint = this.containerPointToLayerPoint(toPoint(point));
      return this.layerPointToLatLng(layerPoint);
    },
    // @method latLngToContainerPoint(latlng: LatLng): Point
    // Given a geographical coordinate, returns the corresponding pixel coordinate
    // relative to the map container.
    latLngToContainerPoint: function latLngToContainerPoint(latlng) {
      return this.layerPointToContainerPoint(this.latLngToLayerPoint(toLatLng(latlng)));
    },
    // @method mouseEventToContainerPoint(ev: MouseEvent): Point
    // Given a MouseEvent object, returns the pixel coordinate relative to the
    // map container where the event took place.
    mouseEventToContainerPoint: function mouseEventToContainerPoint(e) {
      return getMousePosition(e, this._container);
    },
    // @method mouseEventToLayerPoint(ev: MouseEvent): Point
    // Given a MouseEvent object, returns the pixel coordinate relative to
    // the [origin pixel](#map-getpixelorigin) where the event took place.
    mouseEventToLayerPoint: function mouseEventToLayerPoint(e) {
      return this.containerPointToLayerPoint(this.mouseEventToContainerPoint(e));
    },
    // @method mouseEventToLatLng(ev: MouseEvent): LatLng
    // Given a MouseEvent object, returns geographical coordinate where the
    // event took place.
    mouseEventToLatLng: function mouseEventToLatLng(e) {
      // (MouseEvent)
      return this.layerPointToLatLng(this.mouseEventToLayerPoint(e));
    },
    // map initialization methods
    _initContainer: function _initContainer(id) {
      var container = this._container = get(id);

      if (!container) {
        throw new Error('Map container not found.');
      } else if (container._leaflet_id) {
        throw new Error('Map container is already initialized.');
      }

      on(container, 'scroll', this._onScroll, this);
      this._containerId = stamp(container);
    },
    _initLayout: function _initLayout() {
      var container = this._container;
      this._fadeAnimated = this.options.fadeAnimation && Browser.any3d;
      addClass(container, 'leaflet-container' + (Browser.touch ? ' leaflet-touch' : '') + (Browser.retina ? ' leaflet-retina' : '') + (Browser.ielt9 ? ' leaflet-oldie' : '') + (Browser.safari ? ' leaflet-safari' : '') + (this._fadeAnimated ? ' leaflet-fade-anim' : ''));
      var position = getStyle(container, 'position');

      if (position !== 'absolute' && position !== 'relative' && position !== 'fixed') {
        container.style.position = 'relative';
      }

      this._initPanes();

      if (this._initControlPos) {
        this._initControlPos();
      }
    },
    _initPanes: function _initPanes() {
      var panes = this._panes = {};
      this._paneRenderers = {}; // @section
      //
      // Panes are DOM elements used to control the ordering of layers on the map. You
      // can access panes with [`map.getPane`](#map-getpane) or
      // [`map.getPanes`](#map-getpanes) methods. New panes can be created with the
      // [`map.createPane`](#map-createpane) method.
      //
      // Every map has the following default panes that differ only in zIndex.
      //
      // @pane mapPane: HTMLElement = 'auto'
      // Pane that contains all other map panes

      this._mapPane = this.createPane('mapPane', this._container);
      setPosition(this._mapPane, new Point(0, 0)); // @pane tilePane: HTMLElement = 200
      // Pane for `GridLayer`s and `TileLayer`s

      this.createPane('tilePane'); // @pane overlayPane: HTMLElement = 400
      // Pane for vectors (`Path`s, like `Polyline`s and `Polygon`s), `ImageOverlay`s and `VideoOverlay`s

      this.createPane('overlayPane'); // @pane shadowPane: HTMLElement = 500
      // Pane for overlay shadows (e.g. `Marker` shadows)

      this.createPane('shadowPane'); // @pane markerPane: HTMLElement = 600
      // Pane for `Icon`s of `Marker`s

      this.createPane('markerPane'); // @pane tooltipPane: HTMLElement = 650
      // Pane for `Tooltip`s.

      this.createPane('tooltipPane'); // @pane popupPane: HTMLElement = 700
      // Pane for `Popup`s.

      this.createPane('popupPane');

      if (!this.options.markerZoomAnimation) {
        addClass(panes.markerPane, 'leaflet-zoom-hide');
        addClass(panes.shadowPane, 'leaflet-zoom-hide');
      }
    },
    // private methods that modify map state
    // @section Map state change events
    _resetView: function _resetView(center, zoom) {
      setPosition(this._mapPane, new Point(0, 0));
      var loading = !this._loaded;
      this._loaded = true;
      zoom = this._limitZoom(zoom);
      this.fire('viewprereset');
      var zoomChanged = this._zoom !== zoom;

      this._moveStart(zoomChanged, false)._move(center, zoom)._moveEnd(zoomChanged); // @event viewreset: Event
      // Fired when the map needs to redraw its content (this usually happens
      // on map zoom or load). Very useful for creating custom overlays.


      this.fire('viewreset'); // @event load: Event
      // Fired when the map is initialized (when its center and zoom are set
      // for the first time).

      if (loading) {
        this.fire('load');
      }
    },
    _moveStart: function _moveStart(zoomChanged, noMoveStart) {
      // @event zoomstart: Event
      // Fired when the map zoom is about to change (e.g. before zoom animation).
      // @event movestart: Event
      // Fired when the view of the map starts changing (e.g. user starts dragging the map).
      if (zoomChanged) {
        this.fire('zoomstart');
      }

      if (!noMoveStart) {
        this.fire('movestart');
      }

      return this;
    },
    _move: function _move(center, zoom, data, supressEvent) {
      if (zoom === undefined) {
        zoom = this._zoom;
      }

      var zoomChanged = this._zoom !== zoom;
      this._zoom = zoom;
      this._lastCenter = center;
      this._pixelOrigin = this._getNewPixelOrigin(center);

      if (!supressEvent) {
        // @event zoom: Event
        // Fired repeatedly during any change in zoom level,
        // including zoom and fly animations.
        if (zoomChanged || data && data.pinch) {
          // Always fire 'zoom' if pinching because #3530
          this.fire('zoom', data);
        } // @event move: Event
        // Fired repeatedly during any movement of the map,
        // including pan and fly animations.


        this.fire('move', data);
      } else if (data && data.pinch) {
        // Always fire 'zoom' if pinching because #3530
        this.fire('zoom', data);
      }

      return this;
    },
    _moveEnd: function _moveEnd(zoomChanged) {
      // @event zoomend: Event
      // Fired when the map zoom changed, after any animations.
      if (zoomChanged) {
        this.fire('zoomend');
      } // @event moveend: Event
      // Fired when the center of the map stops changing
      // (e.g. user stopped dragging the map or after non-centered zoom).


      return this.fire('moveend');
    },
    _stop: function _stop() {
      cancelAnimFrame(this._flyToFrame);

      if (this._panAnim) {
        this._panAnim.stop();
      }

      return this;
    },
    _rawPanBy: function _rawPanBy(offset) {
      setPosition(this._mapPane, this._getMapPanePos().subtract(offset));
    },
    _getZoomSpan: function _getZoomSpan() {
      return this.getMaxZoom() - this.getMinZoom();
    },
    _panInsideMaxBounds: function _panInsideMaxBounds() {
      if (!this._enforcingBounds) {
        this.panInsideBounds(this.options.maxBounds);
      }
    },
    _checkIfLoaded: function _checkIfLoaded() {
      if (!this._loaded) {
        throw new Error('Set map center and zoom first.');
      }
    },
    // DOM event handling
    // @section Interaction events
    _initEvents: function _initEvents(remove) {
      this._targets = {};
      this._targets[stamp(this._container)] = this;
      var onOff = remove ? off : on; // @event click: MouseEvent
      // Fired when the user clicks (or taps) the map.
      // @event dblclick: MouseEvent
      // Fired when the user double-clicks (or double-taps) the map.
      // @event mousedown: MouseEvent
      // Fired when the user pushes the mouse button on the map.
      // @event mouseup: MouseEvent
      // Fired when the user releases the mouse button on the map.
      // @event mouseover: MouseEvent
      // Fired when the mouse enters the map.
      // @event mouseout: MouseEvent
      // Fired when the mouse leaves the map.
      // @event mousemove: MouseEvent
      // Fired while the mouse moves over the map.
      // @event contextmenu: MouseEvent
      // Fired when the user pushes the right mouse button on the map, prevents
      // default browser context menu from showing if there are listeners on
      // this event. Also fired on mobile when the user holds a single touch
      // for a second (also called long press).
      // @event keypress: KeyboardEvent
      // Fired when the user presses a key from the keyboard that produces a character value while the map is focused.
      // @event keydown: KeyboardEvent
      // Fired when the user presses a key from the keyboard while the map is focused. Unlike the `keypress` event,
      // the `keydown` event is fired for keys that produce a character value and for keys
      // that do not produce a character value.
      // @event keyup: KeyboardEvent
      // Fired when the user releases a key from the keyboard while the map is focused.

      onOff(this._container, 'click dblclick mousedown mouseup ' + 'mouseover mouseout mousemove contextmenu keypress keydown keyup', this._handleDOMEvent, this);

      if (this.options.trackResize) {
        onOff(window, 'resize', this._onResize, this);
      }

      if (Browser.any3d && this.options.transform3DLimit) {
        (remove ? this.off : this.on).call(this, 'moveend', this._onMoveEnd);
      }
    },
    _onResize: function _onResize() {
      cancelAnimFrame(this._resizeRequest);
      this._resizeRequest = requestAnimFrame(function () {
        this.invalidateSize({
          debounceMoveend: true
        });
      }, this);
    },
    _onScroll: function _onScroll() {
      this._container.scrollTop = 0;
      this._container.scrollLeft = 0;
    },
    _onMoveEnd: function _onMoveEnd() {
      var pos = this._getMapPanePos();

      if (Math.max(Math.abs(pos.x), Math.abs(pos.y)) >= this.options.transform3DLimit) {
        // https://bugzilla.mozilla.org/show_bug.cgi?id=1203873 but Webkit also have
        // a pixel offset on very high values, see: https://jsfiddle.net/dg6r5hhb/
        this._resetView(this.getCenter(), this.getZoom());
      }
    },
    _findEventTargets: function _findEventTargets(e, type) {
      var targets = [],
          target,
          isHover = type === 'mouseout' || type === 'mouseover',
          src = e.target || e.srcElement,
          dragging = false;

      while (src) {
        target = this._targets[stamp(src)];

        if (target && (type === 'click' || type === 'preclick') && this._draggableMoved(target)) {
          // Prevent firing click after you just dragged an object.
          dragging = true;
          break;
        }

        if (target && target.listens(type, true)) {
          if (isHover && !isExternalTarget(src, e)) {
            break;
          }

          targets.push(target);

          if (isHover) {
            break;
          }
        }

        if (src === this._container) {
          break;
        }

        src = src.parentNode;
      }

      if (!targets.length && !dragging && !isHover && this.listens(type, true)) {
        targets = [this];
      }

      return targets;
    },
    _isClickDisabled: function _isClickDisabled(el) {
      while (el !== this._container) {
        if (el['_leaflet_disable_click']) {
          return true;
        }

        el = el.parentNode;
      }
    },
    _handleDOMEvent: function _handleDOMEvent(e) {
      var el = e.target || e.srcElement;

      if (!this._loaded || el['_leaflet_disable_events'] || e.type === 'click' && this._isClickDisabled(el)) {
        return;
      }

      var type = e.type;

      if (type === 'mousedown') {
        // prevents outline when clicking on keyboard-focusable element
        preventOutline(el);
      }

      this._fireDOMEvent(e, type);
    },
    _mouseEvents: ['click', 'dblclick', 'mouseover', 'mouseout', 'contextmenu'],
    _fireDOMEvent: function _fireDOMEvent(e, type, canvasTargets) {
      if (e.type === 'click') {
        // Fire a synthetic 'preclick' event which propagates up (mainly for closing popups).
        // @event preclick: MouseEvent
        // Fired before mouse click on the map (sometimes useful when you
        // want something to happen on click before any existing click
        // handlers start running).
        var synth = extend({}, e);
        synth.type = 'preclick';

        this._fireDOMEvent(synth, synth.type, canvasTargets);
      } // Find the layer the event is propagating from and its parents.


      var targets = this._findEventTargets(e, type);

      if (canvasTargets) {
        var filtered = []; // pick only targets with listeners

        for (var i = 0; i < canvasTargets.length; i++) {
          if (canvasTargets[i].listens(type, true)) {
            filtered.push(canvasTargets[i]);
          }
        }

        targets = filtered.concat(targets);
      }

      if (!targets.length) {
        return;
      }

      if (type === 'contextmenu') {
        preventDefault(e);
      }

      var target = targets[0];
      var data = {
        originalEvent: e
      };

      if (e.type !== 'keypress' && e.type !== 'keydown' && e.type !== 'keyup') {
        var isMarker = target.getLatLng && (!target._radius || target._radius <= 10);
        data.containerPoint = isMarker ? this.latLngToContainerPoint(target.getLatLng()) : this.mouseEventToContainerPoint(e);
        data.layerPoint = this.containerPointToLayerPoint(data.containerPoint);
        data.latlng = isMarker ? target.getLatLng() : this.layerPointToLatLng(data.layerPoint);
      }

      for (i = 0; i < targets.length; i++) {
        targets[i].fire(type, data, true);

        if (data.originalEvent._stopped || targets[i].options.bubblingMouseEvents === false && indexOf(this._mouseEvents, type) !== -1) {
          return;
        }
      }
    },
    _draggableMoved: function _draggableMoved(obj) {
      obj = obj.dragging && obj.dragging.enabled() ? obj : this;
      return obj.dragging && obj.dragging.moved() || this.boxZoom && this.boxZoom.moved();
    },
    _clearHandlers: function _clearHandlers() {
      for (var i = 0, len = this._handlers.length; i < len; i++) {
        this._handlers[i].disable();
      }
    },
    // @section Other Methods
    // @method whenReady(fn: Function, context?: Object): this
    // Runs the given function `fn` when the map gets initialized with
    // a view (center and zoom) and at least one layer, or immediately
    // if it's already initialized, optionally passing a function context.
    whenReady: function whenReady(callback, context) {
      if (this._loaded) {
        callback.call(context || this, {
          target: this
        });
      } else {
        this.on('load', callback, context);
      }

      return this;
    },
    // private methods for getting map state
    _getMapPanePos: function _getMapPanePos() {
      return getPosition(this._mapPane) || new Point(0, 0);
    },
    _moved: function _moved() {
      var pos = this._getMapPanePos();

      return pos && !pos.equals([0, 0]);
    },
    _getTopLeftPoint: function _getTopLeftPoint(center, zoom) {
      var pixelOrigin = center && zoom !== undefined ? this._getNewPixelOrigin(center, zoom) : this.getPixelOrigin();
      return pixelOrigin.subtract(this._getMapPanePos());
    },
    _getNewPixelOrigin: function _getNewPixelOrigin(center, zoom) {
      var viewHalf = this.getSize()._divideBy(2);

      return this.project(center, zoom)._subtract(viewHalf)._add(this._getMapPanePos())._round();
    },
    _latLngToNewLayerPoint: function _latLngToNewLayerPoint(latlng, zoom, center) {
      var topLeft = this._getNewPixelOrigin(center, zoom);

      return this.project(latlng, zoom)._subtract(topLeft);
    },
    _latLngBoundsToNewLayerBounds: function _latLngBoundsToNewLayerBounds(latLngBounds, zoom, center) {
      var topLeft = this._getNewPixelOrigin(center, zoom);

      return toBounds([this.project(latLngBounds.getSouthWest(), zoom)._subtract(topLeft), this.project(latLngBounds.getNorthWest(), zoom)._subtract(topLeft), this.project(latLngBounds.getSouthEast(), zoom)._subtract(topLeft), this.project(latLngBounds.getNorthEast(), zoom)._subtract(topLeft)]);
    },
    // layer point of the current center
    _getCenterLayerPoint: function _getCenterLayerPoint() {
      return this.containerPointToLayerPoint(this.getSize()._divideBy(2));
    },
    // offset of the specified place to the current center in pixels
    _getCenterOffset: function _getCenterOffset(latlng) {
      return this.latLngToLayerPoint(latlng).subtract(this._getCenterLayerPoint());
    },
    // adjust center for view to get inside bounds
    _limitCenter: function _limitCenter(center, zoom, bounds) {
      if (!bounds) {
        return center;
      }

      var centerPoint = this.project(center, zoom),
          viewHalf = this.getSize().divideBy(2),
          viewBounds = new Bounds(centerPoint.subtract(viewHalf), centerPoint.add(viewHalf)),
          offset = this._getBoundsOffset(viewBounds, bounds, zoom); // If offset is less than a pixel, ignore.
      // This prevents unstable projections from getting into
      // an infinite loop of tiny offsets.


      if (offset.round().equals([0, 0])) {
        return center;
      }

      return this.unproject(centerPoint.add(offset), zoom);
    },
    // adjust offset for view to get inside bounds
    _limitOffset: function _limitOffset(offset, bounds) {
      if (!bounds) {
        return offset;
      }

      var viewBounds = this.getPixelBounds(),
          newBounds = new Bounds(viewBounds.min.add(offset), viewBounds.max.add(offset));
      return offset.add(this._getBoundsOffset(newBounds, bounds));
    },
    // returns offset needed for pxBounds to get inside maxBounds at a specified zoom
    _getBoundsOffset: function _getBoundsOffset(pxBounds, maxBounds, zoom) {
      var projectedMaxBounds = toBounds(this.project(maxBounds.getNorthEast(), zoom), this.project(maxBounds.getSouthWest(), zoom)),
          minOffset = projectedMaxBounds.min.subtract(pxBounds.min),
          maxOffset = projectedMaxBounds.max.subtract(pxBounds.max),
          dx = this._rebound(minOffset.x, -maxOffset.x),
          dy = this._rebound(minOffset.y, -maxOffset.y);

      return new Point(dx, dy);
    },
    _rebound: function _rebound(left, right) {
      return left + right > 0 ? Math.round(left - right) / 2 : Math.max(0, Math.ceil(left)) - Math.max(0, Math.floor(right));
    },
    _limitZoom: function _limitZoom(zoom) {
      var min = this.getMinZoom(),
          max = this.getMaxZoom(),
          snap = Browser.any3d ? this.options.zoomSnap : 1;

      if (snap) {
        zoom = Math.round(zoom / snap) * snap;
      }

      return Math.max(min, Math.min(max, zoom));
    },
    _onPanTransitionStep: function _onPanTransitionStep() {
      this.fire('move');
    },
    _onPanTransitionEnd: function _onPanTransitionEnd() {
      removeClass(this._mapPane, 'leaflet-pan-anim');
      this.fire('moveend');
    },
    _tryAnimatedPan: function _tryAnimatedPan(center, options) {
      // difference between the new and current centers in pixels
      var offset = this._getCenterOffset(center)._trunc(); // don't animate too far unless animate: true specified in options


      if ((options && options.animate) !== true && !this.getSize().contains(offset)) {
        return false;
      }

      this.panBy(offset, options);
      return true;
    },
    _createAnimProxy: function _createAnimProxy() {
      var proxy = this._proxy = create$1('div', 'leaflet-proxy leaflet-zoom-animated');

      this._panes.mapPane.appendChild(proxy);

      this.on('zoomanim', function (e) {
        var prop = TRANSFORM,
            transform = this._proxy.style[prop];
        setTransform(this._proxy, this.project(e.center, e.zoom), this.getZoomScale(e.zoom, 1)); // workaround for case when transform is the same and so transitionend event is not fired

        if (transform === this._proxy.style[prop] && this._animatingZoom) {
          this._onZoomTransitionEnd();
        }
      }, this);
      this.on('load moveend', this._animMoveEnd, this);

      this._on('unload', this._destroyAnimProxy, this);
    },
    _destroyAnimProxy: function _destroyAnimProxy() {
      _remove(this._proxy);

      this.off('load moveend', this._animMoveEnd, this);
      delete this._proxy;
    },
    _animMoveEnd: function _animMoveEnd() {
      var c = this.getCenter(),
          z = this.getZoom();
      setTransform(this._proxy, this.project(c, z), this.getZoomScale(z, 1));
    },
    _catchTransitionEnd: function _catchTransitionEnd(e) {
      if (this._animatingZoom && e.propertyName.indexOf('transform') >= 0) {
        this._onZoomTransitionEnd();
      }
    },
    _nothingToAnimate: function _nothingToAnimate() {
      return !this._container.getElementsByClassName('leaflet-zoom-animated').length;
    },
    _tryAnimatedZoom: function _tryAnimatedZoom(center, zoom, options) {
      if (this._animatingZoom) {
        return true;
      }

      options = options || {}; // don't animate if disabled, not supported or zoom difference is too large

      if (!this._zoomAnimated || options.animate === false || this._nothingToAnimate() || Math.abs(zoom - this._zoom) > this.options.zoomAnimationThreshold) {
        return false;
      } // offset is the pixel coords of the zoom origin relative to the current center


      var scale = this.getZoomScale(zoom),
          offset = this._getCenterOffset(center)._divideBy(1 - 1 / scale); // don't animate if the zoom origin isn't within one screen from the current center, unless forced


      if (options.animate !== true && !this.getSize().contains(offset)) {
        return false;
      }

      requestAnimFrame(function () {
        this._moveStart(true, false)._animateZoom(center, zoom, true);
      }, this);
      return true;
    },
    _animateZoom: function _animateZoom(center, zoom, startAnim, noUpdate) {
      if (!this._mapPane) {
        return;
      }

      if (startAnim) {
        this._animatingZoom = true; // remember what center/zoom to set after animation

        this._animateToCenter = center;
        this._animateToZoom = zoom;
        addClass(this._mapPane, 'leaflet-zoom-anim');
      } // @section Other Events
      // @event zoomanim: ZoomAnimEvent
      // Fired at least once per zoom animation. For continuous zoom, like pinch zooming, fired once per frame during zoom.


      this.fire('zoomanim', {
        center: center,
        zoom: zoom,
        noUpdate: noUpdate
      });

      if (!this._tempFireZoomEvent) {
        this._tempFireZoomEvent = this._zoom !== this._animateToZoom;
      }

      this._move(this._animateToCenter, this._animateToZoom, undefined, true); // Work around webkit not firing 'transitionend', see https://github.com/Leaflet/Leaflet/issues/3689, 2693


      setTimeout(bind(this._onZoomTransitionEnd, this), 250);
    },
    _onZoomTransitionEnd: function _onZoomTransitionEnd() {
      if (!this._animatingZoom) {
        return;
      }

      if (this._mapPane) {
        removeClass(this._mapPane, 'leaflet-zoom-anim');
      }

      this._animatingZoom = false;

      this._move(this._animateToCenter, this._animateToZoom, undefined, true);

      if (this._tempFireZoomEvent) {
        this.fire('zoom');
      }

      delete this._tempFireZoomEvent;
      this.fire('move');

      this._moveEnd(true);
    }
  }); // @section
  // @factory L.map(id: String, options?: Map options)
  // Instantiates a map object given the DOM ID of a `<div>` element
  // and optionally an object literal with `Map options`.
  //
  // @alternative
  // @factory L.map(el: HTMLElement, options?: Map options)
  // Instantiates a map object given an instance of a `<div>` HTML element
  // and optionally an object literal with `Map options`.

  function createMap(id, options) {
    return new Map(id, options);
  }
  /*
   * @class Control
   * @aka L.Control
   * @inherits Class
   *
   * L.Control is a base class for implementing map controls. Handles positioning.
   * All other controls extend from this class.
   */


  var Control = Class.extend({
    // @section
    // @aka Control Options
    options: {
      // @option position: String = 'topright'
      // The position of the control (one of the map corners). Possible values are `'topleft'`,
      // `'topright'`, `'bottomleft'` or `'bottomright'`
      position: 'topright'
    },
    initialize: function initialize(options) {
      setOptions(this, options);
    },

    /* @section
     * Classes extending L.Control will inherit the following methods:
     *
     * @method getPosition: string
     * Returns the position of the control.
     */
    getPosition: function getPosition() {
      return this.options.position;
    },
    // @method setPosition(position: string): this
    // Sets the position of the control.
    setPosition: function setPosition(position) {
      var map = this._map;

      if (map) {
        map.removeControl(this);
      }

      this.options.position = position;

      if (map) {
        map.addControl(this);
      }

      return this;
    },
    // @method getContainer: HTMLElement
    // Returns the HTMLElement that contains the control.
    getContainer: function getContainer() {
      return this._container;
    },
    // @method addTo(map: Map): this
    // Adds the control to the given map.
    addTo: function addTo(map) {
      this.remove();
      this._map = map;
      var container = this._container = this.onAdd(map),
          pos = this.getPosition(),
          corner = map._controlCorners[pos];
      addClass(container, 'leaflet-control');

      if (pos.indexOf('bottom') !== -1) {
        corner.insertBefore(container, corner.firstChild);
      } else {
        corner.appendChild(container);
      }

      this._map.on('unload', this.remove, this);

      return this;
    },
    // @method remove: this
    // Removes the control from the map it is currently active on.
    remove: function remove() {
      if (!this._map) {
        return this;
      }

      _remove(this._container);

      if (this.onRemove) {
        this.onRemove(this._map);
      }

      this._map.off('unload', this.remove, this);

      this._map = null;
      return this;
    },
    _refocusOnMap: function _refocusOnMap(e) {
      // if map exists and event is not a keyboard event
      if (this._map && e && e.screenX > 0 && e.screenY > 0) {
        this._map.getContainer().focus();
      }
    }
  });

  var control = function control(options) {
    return new Control(options);
  };
  /* @section Extension methods
   * @uninheritable
   *
   * Every control should extend from `L.Control` and (re-)implement the following methods.
   *
   * @method onAdd(map: Map): HTMLElement
   * Should return the container DOM element for the control and add listeners on relevant map events. Called on [`control.addTo(map)`](#control-addTo).
   *
   * @method onRemove(map: Map)
   * Optional method. Should contain all clean up code that removes the listeners previously added in [`onAdd`](#control-onadd). Called on [`control.remove()`](#control-remove).
   */

  /* @namespace Map
   * @section Methods for Layers and Controls
   */


  Map.include({
    // @method addControl(control: Control): this
    // Adds the given control to the map
    addControl: function addControl(control) {
      control.addTo(this);
      return this;
    },
    // @method removeControl(control: Control): this
    // Removes the given control from the map
    removeControl: function removeControl(control) {
      control.remove();
      return this;
    },
    _initControlPos: function _initControlPos() {
      var corners = this._controlCorners = {},
          l = 'leaflet-',
          container = this._controlContainer = create$1('div', l + 'control-container', this._container);

      function createCorner(vSide, hSide) {
        var className = l + vSide + ' ' + l + hSide;
        corners[vSide + hSide] = create$1('div', className, container);
      }

      createCorner('top', 'left');
      createCorner('top', 'right');
      createCorner('bottom', 'left');
      createCorner('bottom', 'right');
    },
    _clearControlPos: function _clearControlPos() {
      for (var i in this._controlCorners) {
        _remove(this._controlCorners[i]);
      }

      _remove(this._controlContainer);

      delete this._controlCorners;
      delete this._controlContainer;
    }
  });
  /*
   * @class Control.Layers
   * @aka L.Control.Layers
   * @inherits Control
   *
   * The layers control gives users the ability to switch between different base layers and switch overlays on/off (check out the [detailed example](https://leafletjs.com/examples/layers-control/)). Extends `Control`.
   *
   * @example
   *
   * ```js
   * var baseLayers = {
   * 	"Mapbox": mapbox,
   * 	"OpenStreetMap": osm
   * };
   *
   * var overlays = {
   * 	"Marker": marker,
   * 	"Roads": roadsLayer
   * };
   *
   * L.control.layers(baseLayers, overlays).addTo(map);
   * ```
   *
   * The `baseLayers` and `overlays` parameters are object literals with layer names as keys and `Layer` objects as values:
   *
   * ```js
   * {
   *     "<someName1>": layer1,
   *     "<someName2>": layer2
   * }
   * ```
   *
   * The layer names can contain HTML, which allows you to add additional styling to the items:
   *
   * ```js
   * {"<img src='my-layer-icon' /> <span class='my-layer-item'>My Layer</span>": myLayer}
   * ```
   */

  var Layers = Control.extend({
    // @section
    // @aka Control.Layers options
    options: {
      // @option collapsed: Boolean = true
      // If `true`, the control will be collapsed into an icon and expanded on mouse hover, touch, or keyboard activation.
      collapsed: true,
      position: 'topright',
      // @option autoZIndex: Boolean = true
      // If `true`, the control will assign zIndexes in increasing order to all of its layers so that the order is preserved when switching them on/off.
      autoZIndex: true,
      // @option hideSingleBase: Boolean = false
      // If `true`, the base layers in the control will be hidden when there is only one.
      hideSingleBase: false,
      // @option sortLayers: Boolean = false
      // Whether to sort the layers. When `false`, layers will keep the order
      // in which they were added to the control.
      sortLayers: false,
      // @option sortFunction: Function = *
      // A [compare function](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array/sort)
      // that will be used for sorting the layers, when `sortLayers` is `true`.
      // The function receives both the `L.Layer` instances and their names, as in
      // `sortFunction(layerA, layerB, nameA, nameB)`.
      // By default, it sorts layers alphabetically by their name.
      sortFunction: function sortFunction(layerA, layerB, nameA, nameB) {
        return nameA < nameB ? -1 : nameB < nameA ? 1 : 0;
      }
    },
    initialize: function initialize(baseLayers, overlays, options) {
      setOptions(this, options);
      this._layerControlInputs = [];
      this._layers = [];
      this._lastZIndex = 0;
      this._handlingClick = false;

      for (var i in baseLayers) {
        this._addLayer(baseLayers[i], i);
      }

      for (i in overlays) {
        this._addLayer(overlays[i], i, true);
      }
    },
    onAdd: function onAdd(map) {
      this._initLayout();

      this._update();

      this._map = map;
      map.on('zoomend', this._checkDisabledLayers, this);

      for (var i = 0; i < this._layers.length; i++) {
        this._layers[i].layer.on('add remove', this._onLayerChange, this);
      }

      return this._container;
    },
    addTo: function addTo(map) {
      Control.prototype.addTo.call(this, map); // Trigger expand after Layers Control has been inserted into DOM so that is now has an actual height.

      return this._expandIfNotCollapsed();
    },
    onRemove: function onRemove() {
      this._map.off('zoomend', this._checkDisabledLayers, this);

      for (var i = 0; i < this._layers.length; i++) {
        this._layers[i].layer.off('add remove', this._onLayerChange, this);
      }
    },
    // @method addBaseLayer(layer: Layer, name: String): this
    // Adds a base layer (radio button entry) with the given name to the control.
    addBaseLayer: function addBaseLayer(layer, name) {
      this._addLayer(layer, name);

      return this._map ? this._update() : this;
    },
    // @method addOverlay(layer: Layer, name: String): this
    // Adds an overlay (checkbox entry) with the given name to the control.
    addOverlay: function addOverlay(layer, name) {
      this._addLayer(layer, name, true);

      return this._map ? this._update() : this;
    },
    // @method removeLayer(layer: Layer): this
    // Remove the given layer from the control.
    removeLayer: function removeLayer(layer) {
      layer.off('add remove', this._onLayerChange, this);

      var obj = this._getLayer(stamp(layer));

      if (obj) {
        this._layers.splice(this._layers.indexOf(obj), 1);
      }

      return this._map ? this._update() : this;
    },
    // @method expand(): this
    // Expand the control container if collapsed.
    expand: function expand() {
      addClass(this._container, 'leaflet-control-layers-expanded');
      this._section.style.height = null;
      var acceptableHeight = this._map.getSize().y - (this._container.offsetTop + 50);

      if (acceptableHeight < this._section.clientHeight) {
        addClass(this._section, 'leaflet-control-layers-scrollbar');
        this._section.style.height = acceptableHeight + 'px';
      } else {
        removeClass(this._section, 'leaflet-control-layers-scrollbar');
      }

      this._checkDisabledLayers();

      return this;
    },
    // @method collapse(): this
    // Collapse the control container if expanded.
    collapse: function collapse() {
      removeClass(this._container, 'leaflet-control-layers-expanded');
      return this;
    },
    _initLayout: function _initLayout() {
      var className = 'leaflet-control-layers',
          container = this._container = create$1('div', className),
          collapsed = this.options.collapsed; // makes this work on IE touch devices by stopping it from firing a mouseout event when the touch is released

      container.setAttribute('aria-haspopup', true);
      disableClickPropagation(container);
      disableScrollPropagation(container);
      var section = this._section = create$1('section', className + '-list');

      if (collapsed) {
        this._map.on('click', this.collapse, this);

        on(container, {
          mouseenter: function mouseenter() {
            on(section, 'click', preventDefault);
            this.expand();
            setTimeout(function () {
              off(section, 'click', preventDefault);
            });
          },
          mouseleave: this.collapse
        }, this);
      }

      var link = this._layersLink = create$1('a', className + '-toggle', container);
      link.href = '#';
      link.title = 'Layers';
      link.setAttribute('role', 'button');
      on(link, 'click', preventDefault); // prevent link function

      on(link, 'focus', this.expand, this);

      if (!collapsed) {
        this.expand();
      }

      this._baseLayersList = create$1('div', className + '-base', section);
      this._separator = create$1('div', className + '-separator', section);
      this._overlaysList = create$1('div', className + '-overlays', section);
      container.appendChild(section);
    },
    _getLayer: function _getLayer(id) {
      for (var i = 0; i < this._layers.length; i++) {
        if (this._layers[i] && stamp(this._layers[i].layer) === id) {
          return this._layers[i];
        }
      }
    },
    _addLayer: function _addLayer(layer, name, overlay) {
      if (this._map) {
        layer.on('add remove', this._onLayerChange, this);
      }

      this._layers.push({
        layer: layer,
        name: name,
        overlay: overlay
      });

      if (this.options.sortLayers) {
        this._layers.sort(bind(function (a, b) {
          return this.options.sortFunction(a.layer, b.layer, a.name, b.name);
        }, this));
      }

      if (this.options.autoZIndex && layer.setZIndex) {
        this._lastZIndex++;
        layer.setZIndex(this._lastZIndex);
      }

      this._expandIfNotCollapsed();
    },
    _update: function _update() {
      if (!this._container) {
        return this;
      }

      empty(this._baseLayersList);
      empty(this._overlaysList);
      this._layerControlInputs = [];
      var baseLayersPresent,
          overlaysPresent,
          i,
          obj,
          baseLayersCount = 0;

      for (i = 0; i < this._layers.length; i++) {
        obj = this._layers[i];

        this._addItem(obj);

        overlaysPresent = overlaysPresent || obj.overlay;
        baseLayersPresent = baseLayersPresent || !obj.overlay;
        baseLayersCount += !obj.overlay ? 1 : 0;
      } // Hide base layers section if there's only one layer.


      if (this.options.hideSingleBase) {
        baseLayersPresent = baseLayersPresent && baseLayersCount > 1;
        this._baseLayersList.style.display = baseLayersPresent ? '' : 'none';
      }

      this._separator.style.display = overlaysPresent && baseLayersPresent ? '' : 'none';
      return this;
    },
    _onLayerChange: function _onLayerChange(e) {
      if (!this._handlingClick) {
        this._update();
      }

      var obj = this._getLayer(stamp(e.target)); // @namespace Map
      // @section Layer events
      // @event baselayerchange: LayersControlEvent
      // Fired when the base layer is changed through the [layers control](#control-layers).
      // @event overlayadd: LayersControlEvent
      // Fired when an overlay is selected through the [layers control](#control-layers).
      // @event overlayremove: LayersControlEvent
      // Fired when an overlay is deselected through the [layers control](#control-layers).
      // @namespace Control.Layers


      var type = obj.overlay ? e.type === 'add' ? 'overlayadd' : 'overlayremove' : e.type === 'add' ? 'baselayerchange' : null;

      if (type) {
        this._map.fire(type, obj);
      }
    },
    // IE7 bugs out if you create a radio dynamically, so you have to do it this hacky way (see https://stackoverflow.com/a/119079)
    _createRadioElement: function _createRadioElement(name, checked) {
      var radioHtml = '<input type="radio" class="leaflet-control-layers-selector" name="' + name + '"' + (checked ? ' checked="checked"' : '') + '/>';
      var radioFragment = document.createElement('div');
      radioFragment.innerHTML = radioHtml;
      return radioFragment.firstChild;
    },
    _addItem: function _addItem(obj) {
      var label = document.createElement('label'),
          checked = this._map.hasLayer(obj.layer),
          input;

      if (obj.overlay) {
        input = document.createElement('input');
        input.type = 'checkbox';
        input.className = 'leaflet-control-layers-selector';
        input.defaultChecked = checked;
      } else {
        input = this._createRadioElement('leaflet-base-layers_' + stamp(this), checked);
      }

      this._layerControlInputs.push(input);

      input.layerId = stamp(obj.layer);
      on(input, 'click', this._onInputClick, this);
      var name = document.createElement('span');
      name.innerHTML = ' ' + obj.name; // Helps from preventing layer control flicker when checkboxes are disabled
      // https://github.com/Leaflet/Leaflet/issues/2771

      var holder = document.createElement('span');
      label.appendChild(holder);
      holder.appendChild(input);
      holder.appendChild(name);
      var container = obj.overlay ? this._overlaysList : this._baseLayersList;
      container.appendChild(label);

      this._checkDisabledLayers();

      return label;
    },
    _onInputClick: function _onInputClick() {
      var inputs = this._layerControlInputs,
          input,
          layer;
      var addedLayers = [],
          removedLayers = [];
      this._handlingClick = true;

      for (var i = inputs.length - 1; i >= 0; i--) {
        input = inputs[i];
        layer = this._getLayer(input.layerId).layer;

        if (input.checked) {
          addedLayers.push(layer);
        } else if (!input.checked) {
          removedLayers.push(layer);
        }
      } // Bugfix issue 2318: Should remove all old layers before readding new ones


      for (i = 0; i < removedLayers.length; i++) {
        if (this._map.hasLayer(removedLayers[i])) {
          this._map.removeLayer(removedLayers[i]);
        }
      }

      for (i = 0; i < addedLayers.length; i++) {
        if (!this._map.hasLayer(addedLayers[i])) {
          this._map.addLayer(addedLayers[i]);
        }
      }

      this._handlingClick = false;

      this._refocusOnMap();
    },
    _checkDisabledLayers: function _checkDisabledLayers() {
      var inputs = this._layerControlInputs,
          input,
          layer,
          zoom = this._map.getZoom();

      for (var i = inputs.length - 1; i >= 0; i--) {
        input = inputs[i];
        layer = this._getLayer(input.layerId).layer;
        input.disabled = layer.options.minZoom !== undefined && zoom < layer.options.minZoom || layer.options.maxZoom !== undefined && zoom > layer.options.maxZoom;
      }
    },
    _expandIfNotCollapsed: function _expandIfNotCollapsed() {
      if (this._map && !this.options.collapsed) {
        this.expand();
      }

      return this;
    }
  }); // @factory L.control.layers(baselayers?: Object, overlays?: Object, options?: Control.Layers options)
  // Creates a layers control with the given layers. Base layers will be switched with radio buttons, while overlays will be switched with checkboxes. Note that all base layers should be passed in the base layers object, but only one should be added to the map during map instantiation.

  var layers = function layers(baseLayers, overlays, options) {
    return new Layers(baseLayers, overlays, options);
  };
  /*
   * @class Control.Zoom
   * @aka L.Control.Zoom
   * @inherits Control
   *
   * A basic zoom control with two buttons (zoom in and zoom out). It is put on the map by default unless you set its [`zoomControl` option](#map-zoomcontrol) to `false`. Extends `Control`.
   */


  var Zoom = Control.extend({
    // @section
    // @aka Control.Zoom options
    options: {
      position: 'topleft',
      // @option zoomInText: String = '<span aria-hidden="true">+</span>'
      // The text set on the 'zoom in' button.
      zoomInText: '<span aria-hidden="true">+</span>',
      // @option zoomInTitle: String = 'Zoom in'
      // The title set on the 'zoom in' button.
      zoomInTitle: 'Zoom in',
      // @option zoomOutText: String = '<span aria-hidden="true">&#x2212;</span>'
      // The text set on the 'zoom out' button.
      zoomOutText: '<span aria-hidden="true">&#x2212;</span>',
      // @option zoomOutTitle: String = 'Zoom out'
      // The title set on the 'zoom out' button.
      zoomOutTitle: 'Zoom out'
    },
    onAdd: function onAdd(map) {
      var zoomName = 'leaflet-control-zoom',
          container = create$1('div', zoomName + ' leaflet-bar'),
          options = this.options;
      this._zoomInButton = this._createButton(options.zoomInText, options.zoomInTitle, zoomName + '-in', container, this._zoomIn);
      this._zoomOutButton = this._createButton(options.zoomOutText, options.zoomOutTitle, zoomName + '-out', container, this._zoomOut);

      this._updateDisabled();

      map.on('zoomend zoomlevelschange', this._updateDisabled, this);
      return container;
    },
    onRemove: function onRemove(map) {
      map.off('zoomend zoomlevelschange', this._updateDisabled, this);
    },
    disable: function disable() {
      this._disabled = true;

      this._updateDisabled();

      return this;
    },
    enable: function enable() {
      this._disabled = false;

      this._updateDisabled();

      return this;
    },
    _zoomIn: function _zoomIn(e) {
      if (!this._disabled && this._map._zoom < this._map.getMaxZoom()) {
        this._map.zoomIn(this._map.options.zoomDelta * (e.shiftKey ? 3 : 1));
      }
    },
    _zoomOut: function _zoomOut(e) {
      if (!this._disabled && this._map._zoom > this._map.getMinZoom()) {
        this._map.zoomOut(this._map.options.zoomDelta * (e.shiftKey ? 3 : 1));
      }
    },
    _createButton: function _createButton(html, title, className, container, fn) {
      var link = create$1('a', className, container);
      link.innerHTML = html;
      link.href = '#';
      link.title = title;
      /*
       * Will force screen readers like VoiceOver to read this as "Zoom in - button"
       */

      link.setAttribute('role', 'button');
      link.setAttribute('aria-label', title);
      disableClickPropagation(link);
      on(link, 'click', stop);
      on(link, 'click', fn, this);
      on(link, 'click', this._refocusOnMap, this);
      return link;
    },
    _updateDisabled: function _updateDisabled() {
      var map = this._map,
          className = 'leaflet-disabled';
      removeClass(this._zoomInButton, className);
      removeClass(this._zoomOutButton, className);

      this._zoomInButton.setAttribute('aria-disabled', 'false');

      this._zoomOutButton.setAttribute('aria-disabled', 'false');

      if (this._disabled || map._zoom === map.getMinZoom()) {
        addClass(this._zoomOutButton, className);

        this._zoomOutButton.setAttribute('aria-disabled', 'true');
      }

      if (this._disabled || map._zoom === map.getMaxZoom()) {
        addClass(this._zoomInButton, className);

        this._zoomInButton.setAttribute('aria-disabled', 'true');
      }
    }
  }); // @namespace Map
  // @section Control options
  // @option zoomControl: Boolean = true
  // Whether a [zoom control](#control-zoom) is added to the map by default.

  Map.mergeOptions({
    zoomControl: true
  });
  Map.addInitHook(function () {
    if (this.options.zoomControl) {
      // @section Controls
      // @property zoomControl: Control.Zoom
      // The default zoom control (only available if the
      // [`zoomControl` option](#map-zoomcontrol) was `true` when creating the map).
      this.zoomControl = new Zoom();
      this.addControl(this.zoomControl);
    }
  }); // @namespace Control.Zoom
  // @factory L.control.zoom(options: Control.Zoom options)
  // Creates a zoom control

  var zoom = function zoom(options) {
    return new Zoom(options);
  };
  /*
   * @class Control.Scale
   * @aka L.Control.Scale
   * @inherits Control
   *
   * A simple scale control that shows the scale of the current center of screen in metric (m/km) and imperial (mi/ft) systems. Extends `Control`.
   *
   * @example
   *
   * ```js
   * L.control.scale().addTo(map);
   * ```
   */


  var Scale = Control.extend({
    // @section
    // @aka Control.Scale options
    options: {
      position: 'bottomleft',
      // @option maxWidth: Number = 100
      // Maximum width of the control in pixels. The width is set dynamically to show round values (e.g. 100, 200, 500).
      maxWidth: 100,
      // @option metric: Boolean = True
      // Whether to show the metric scale line (m/km).
      metric: true,
      // @option imperial: Boolean = True
      // Whether to show the imperial scale line (mi/ft).
      imperial: true // @option updateWhenIdle: Boolean = false
      // If `true`, the control is updated on [`moveend`](#map-moveend), otherwise it's always up-to-date (updated on [`move`](#map-move)).

    },
    onAdd: function onAdd(map) {
      var className = 'leaflet-control-scale',
          container = create$1('div', className),
          options = this.options;

      this._addScales(options, className + '-line', container);

      map.on(options.updateWhenIdle ? 'moveend' : 'move', this._update, this);
      map.whenReady(this._update, this);
      return container;
    },
    onRemove: function onRemove(map) {
      map.off(this.options.updateWhenIdle ? 'moveend' : 'move', this._update, this);
    },
    _addScales: function _addScales(options, className, container) {
      if (options.metric) {
        this._mScale = create$1('div', className, container);
      }

      if (options.imperial) {
        this._iScale = create$1('div', className, container);
      }
    },
    _update: function _update() {
      var map = this._map,
          y = map.getSize().y / 2;
      var maxMeters = map.distance(map.containerPointToLatLng([0, y]), map.containerPointToLatLng([this.options.maxWidth, y]));

      this._updateScales(maxMeters);
    },
    _updateScales: function _updateScales(maxMeters) {
      if (this.options.metric && maxMeters) {
        this._updateMetric(maxMeters);
      }

      if (this.options.imperial && maxMeters) {
        this._updateImperial(maxMeters);
      }
    },
    _updateMetric: function _updateMetric(maxMeters) {
      var meters = this._getRoundNum(maxMeters),
          label = meters < 1000 ? meters + ' m' : meters / 1000 + ' km';

      this._updateScale(this._mScale, label, meters / maxMeters);
    },
    _updateImperial: function _updateImperial(maxMeters) {
      var maxFeet = maxMeters * 3.2808399,
          maxMiles,
          miles,
          feet;

      if (maxFeet > 5280) {
        maxMiles = maxFeet / 5280;
        miles = this._getRoundNum(maxMiles);

        this._updateScale(this._iScale, miles + ' mi', miles / maxMiles);
      } else {
        feet = this._getRoundNum(maxFeet);

        this._updateScale(this._iScale, feet + ' ft', feet / maxFeet);
      }
    },
    _updateScale: function _updateScale(scale, text, ratio) {
      scale.style.width = Math.round(this.options.maxWidth * ratio) + 'px';
      scale.innerHTML = text;
    },
    _getRoundNum: function _getRoundNum(num) {
      var pow10 = Math.pow(10, (Math.floor(num) + '').length - 1),
          d = num / pow10;
      d = d >= 10 ? 10 : d >= 5 ? 5 : d >= 3 ? 3 : d >= 2 ? 2 : 1;
      return pow10 * d;
    }
  }); // @factory L.control.scale(options?: Control.Scale options)
  // Creates an scale control with the given options.

  var scale = function scale(options) {
    return new Scale(options);
  };

  var ukrainianFlag = '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="12" height="8"><path fill="#4C7BE1" d="M0 0h12v4H0z"/><path fill="#FFD500" d="M0 4h12v3H0z"/><path fill="#E0BC00" d="M0 7h12v1H0z"/></svg>';
  /*
   * @class Control.Attribution
   * @aka L.Control.Attribution
   * @inherits Control
   *
   * The attribution control allows you to display attribution data in a small text box on a map. It is put on the map by default unless you set its [`attributionControl` option](#map-attributioncontrol) to `false`, and it fetches attribution texts from layers with the [`getAttribution` method](#layer-getattribution) automatically. Extends Control.
   */

  var Attribution = Control.extend({
    // @section
    // @aka Control.Attribution options
    options: {
      position: 'bottomright',
      // @option prefix: String|false = 'Leaflet'
      // The HTML text shown before the attributions. Pass `false` to disable.
      prefix: '<a href="https://leafletjs.com" title="A JavaScript library for interactive maps">' + (Browser.inlineSvg ? ukrainianFlag + ' ' : '') + 'Leaflet</a>'
    },
    initialize: function initialize(options) {
      setOptions(this, options);
      this._attributions = {};
    },
    onAdd: function onAdd(map) {
      map.attributionControl = this;
      this._container = create$1('div', 'leaflet-control-attribution');
      disableClickPropagation(this._container); // TODO ugly, refactor

      for (var i in map._layers) {
        if (map._layers[i].getAttribution) {
          this.addAttribution(map._layers[i].getAttribution());
        }
      }

      this._update();

      map.on('layeradd', this._addAttribution, this);
      return this._container;
    },
    onRemove: function onRemove(map) {
      map.off('layeradd', this._addAttribution, this);
    },
    _addAttribution: function _addAttribution(ev) {
      if (ev.layer.getAttribution) {
        this.addAttribution(ev.layer.getAttribution());
        ev.layer.once('remove', function () {
          this.removeAttribution(ev.layer.getAttribution());
        }, this);
      }
    },
    // @method setPrefix(prefix: String|false): this
    // The HTML text shown before the attributions. Pass `false` to disable.
    setPrefix: function setPrefix(prefix) {
      this.options.prefix = prefix;

      this._update();

      return this;
    },
    // @method addAttribution(text: String): this
    // Adds an attribution text (e.g. `'Vector data &copy; Mapbox'`).
    addAttribution: function addAttribution(text) {
      if (!text) {
        return this;
      }

      if (!this._attributions[text]) {
        this._attributions[text] = 0;
      }

      this._attributions[text]++;

      this._update();

      return this;
    },
    // @method removeAttribution(text: String): this
    // Removes an attribution text.
    removeAttribution: function removeAttribution(text) {
      if (!text) {
        return this;
      }

      if (this._attributions[text]) {
        this._attributions[text]--;

        this._update();
      }

      return this;
    },
    _update: function _update() {
      if (!this._map) {
        return;
      }

      var attribs = [];

      for (var i in this._attributions) {
        if (this._attributions[i]) {
          attribs.push(i);
        }
      }

      var prefixAndAttribs = [];

      if (this.options.prefix) {
        prefixAndAttribs.push(this.options.prefix);
      }

      if (attribs.length) {
        prefixAndAttribs.push(attribs.join(', '));
      }

      this._container.innerHTML = prefixAndAttribs.join(' <span aria-hidden="true">|</span> ');
    }
  }); // @namespace Map
  // @section Control options
  // @option attributionControl: Boolean = true
  // Whether a [attribution control](#control-attribution) is added to the map by default.

  Map.mergeOptions({
    attributionControl: true
  });
  Map.addInitHook(function () {
    if (this.options.attributionControl) {
      new Attribution().addTo(this);
    }
  }); // @namespace Control.Attribution
  // @factory L.control.attribution(options: Control.Attribution options)
  // Creates an attribution control.

  var attribution = function attribution(options) {
    return new Attribution(options);
  };

  Control.Layers = Layers;
  Control.Zoom = Zoom;
  Control.Scale = Scale;
  Control.Attribution = Attribution;
  control.layers = layers;
  control.zoom = zoom;
  control.scale = scale;
  control.attribution = attribution;
  /*
  	L.Handler is a base class for handler classes that are used internally to inject
  	interaction features like dragging to classes like Map and Marker.
  */
  // @class Handler
  // @aka L.Handler
  // Abstract class for map interaction handlers

  var Handler = Class.extend({
    initialize: function initialize(map) {
      this._map = map;
    },
    // @method enable(): this
    // Enables the handler
    enable: function enable() {
      if (this._enabled) {
        return this;
      }

      this._enabled = true;
      this.addHooks();
      return this;
    },
    // @method disable(): this
    // Disables the handler
    disable: function disable() {
      if (!this._enabled) {
        return this;
      }

      this._enabled = false;
      this.removeHooks();
      return this;
    },
    // @method enabled(): Boolean
    // Returns `true` if the handler is enabled
    enabled: function enabled() {
      return !!this._enabled;
    } // @section Extension methods
    // Classes inheriting from `Handler` must implement the two following methods:
    // @method addHooks()
    // Called when the handler is enabled, should add event hooks.
    // @method removeHooks()
    // Called when the handler is disabled, should remove the event hooks added previously.

  }); // @section There is static function which can be called without instantiating L.Handler:
  // @function addTo(map: Map, name: String): this
  // Adds a new Handler to the given map with the given name.

  Handler.addTo = function (map, name) {
    map.addHandler(name, this);
    return this;
  };

  var Mixin = {
    Events: Events
  };
  /*
   * @class Draggable
   * @aka L.Draggable
   * @inherits Evented
   *
   * A class for making DOM elements draggable (including touch support).
   * Used internally for map and marker dragging. Only works for elements
   * that were positioned with [`L.DomUtil.setPosition`](#domutil-setposition).
   *
   * @example
   * ```js
   * var draggable = new L.Draggable(elementToDrag);
   * draggable.enable();
   * ```
   */

  var START = Browser.touch ? 'touchstart mousedown' : 'mousedown';
  var Draggable = Evented.extend({
    options: {
      // @section
      // @aka Draggable options
      // @option clickTolerance: Number = 3
      // The max number of pixels a user can shift the mouse pointer during a click
      // for it to be considered a valid click (as opposed to a mouse drag).
      clickTolerance: 3
    },
    // @constructor L.Draggable(el: HTMLElement, dragHandle?: HTMLElement, preventOutline?: Boolean, options?: Draggable options)
    // Creates a `Draggable` object for moving `el` when you start dragging the `dragHandle` element (equals `el` itself by default).
    initialize: function initialize(element, dragStartTarget, preventOutline, options) {
      setOptions(this, options);
      this._element = element;
      this._dragStartTarget = dragStartTarget || element;
      this._preventOutline = preventOutline;
    },
    // @method enable()
    // Enables the dragging ability
    enable: function enable() {
      if (this._enabled) {
        return;
      }

      on(this._dragStartTarget, START, this._onDown, this);
      this._enabled = true;
    },
    // @method disable()
    // Disables the dragging ability
    disable: function disable() {
      if (!this._enabled) {
        return;
      } // If we're currently dragging this draggable,
      // disabling it counts as first ending the drag.


      if (Draggable._dragging === this) {
        this.finishDrag(true);
      }

      off(this._dragStartTarget, START, this._onDown, this);
      this._enabled = false;
      this._moved = false;
    },
    _onDown: function _onDown(e) {
      // Ignore the event if disabled; this happens in IE11
      // under some circumstances, see #3666.
      if (!this._enabled) {
        return;
      }

      this._moved = false;

      if (hasClass(this._element, 'leaflet-zoom-anim')) {
        return;
      }

      if (e.touches && e.touches.length !== 1) {
        // Finish dragging to avoid conflict with touchZoom
        if (Draggable._dragging === this) {
          this.finishDrag();
        }

        return;
      }

      if (Draggable._dragging || e.shiftKey || e.which !== 1 && e.button !== 1 && !e.touches) {
        return;
      }

      Draggable._dragging = this; // Prevent dragging multiple objects at once.

      if (this._preventOutline) {
        preventOutline(this._element);
      }

      disableImageDrag();
      disableTextSelection();

      if (this._moving) {
        return;
      } // @event down: Event
      // Fired when a drag is about to start.


      this.fire('down');
      var first = e.touches ? e.touches[0] : e,
          sizedParent = getSizedParentNode(this._element);
      this._startPoint = new Point(first.clientX, first.clientY);
      this._startPos = getPosition(this._element); // Cache the scale, so that we can continuously compensate for it during drag (_onMove).

      this._parentScale = getScale(sizedParent);
      var mouseevent = e.type === 'mousedown';
      on(document, mouseevent ? 'mousemove' : 'touchmove', this._onMove, this);
      on(document, mouseevent ? 'mouseup' : 'touchend touchcancel', this._onUp, this);
    },
    _onMove: function _onMove(e) {
      // Ignore the event if disabled; this happens in IE11
      // under some circumstances, see #3666.
      if (!this._enabled) {
        return;
      }

      if (e.touches && e.touches.length > 1) {
        this._moved = true;
        return;
      }

      var first = e.touches && e.touches.length === 1 ? e.touches[0] : e,
          offset = new Point(first.clientX, first.clientY)._subtract(this._startPoint);

      if (!offset.x && !offset.y) {
        return;
      }

      if (Math.abs(offset.x) + Math.abs(offset.y) < this.options.clickTolerance) {
        return;
      } // We assume that the parent container's position, border and scale do not change for the duration of the drag.
      // Therefore there is no need to account for the position and border (they are eliminated by the subtraction)
      // and we can use the cached value for the scale.


      offset.x /= this._parentScale.x;
      offset.y /= this._parentScale.y;
      preventDefault(e);

      if (!this._moved) {
        // @event dragstart: Event
        // Fired when a drag starts
        this.fire('dragstart');
        this._moved = true;
        addClass(document.body, 'leaflet-dragging');
        this._lastTarget = e.target || e.srcElement; // IE and Edge do not give the <use> element, so fetch it
        // if necessary

        if (window.SVGElementInstance && this._lastTarget instanceof window.SVGElementInstance) {
          this._lastTarget = this._lastTarget.correspondingUseElement;
        }

        addClass(this._lastTarget, 'leaflet-drag-target');
      }

      this._newPos = this._startPos.add(offset);
      this._moving = true;
      this._lastEvent = e;

      this._updatePosition();
    },
    _updatePosition: function _updatePosition() {
      var e = {
        originalEvent: this._lastEvent
      }; // @event predrag: Event
      // Fired continuously during dragging *before* each corresponding
      // update of the element's position.

      this.fire('predrag', e);
      setPosition(this._element, this._newPos); // @event drag: Event
      // Fired continuously during dragging.

      this.fire('drag', e);
    },
    _onUp: function _onUp() {
      // Ignore the event if disabled; this happens in IE11
      // under some circumstances, see #3666.
      if (!this._enabled) {
        return;
      }

      this.finishDrag();
    },
    finishDrag: function finishDrag(noInertia) {
      removeClass(document.body, 'leaflet-dragging');

      if (this._lastTarget) {
        removeClass(this._lastTarget, 'leaflet-drag-target');
        this._lastTarget = null;
      }

      off(document, 'mousemove touchmove', this._onMove, this);
      off(document, 'mouseup touchend touchcancel', this._onUp, this);
      enableImageDrag();
      enableTextSelection();

      if (this._moved && this._moving) {
        // @event dragend: DragEndEvent
        // Fired when the drag ends.
        this.fire('dragend', {
          noInertia: noInertia,
          distance: this._newPos.distanceTo(this._startPos)
        });
      }

      this._moving = false;
      Draggable._dragging = false;
    }
  });
  /*
   * @namespace LineUtil
   *
   * Various utility functions for polyline points processing, used by Leaflet internally to make polylines lightning-fast.
   */
  // Simplify polyline with vertex reduction and Douglas-Peucker simplification.
  // Improves rendering performance dramatically by lessening the number of points to draw.
  // @function simplify(points: Point[], tolerance: Number): Point[]
  // Dramatically reduces the number of points in a polyline while retaining
  // its shape and returns a new array of simplified points, using the
  // [Ramer-Douglas-Peucker algorithm](https://en.wikipedia.org/wiki/Ramer-Douglas-Peucker_algorithm).
  // Used for a huge performance boost when processing/displaying Leaflet polylines for
  // each zoom level and also reducing visual noise. tolerance affects the amount of
  // simplification (lesser value means higher quality but slower and with more points).
  // Also released as a separated micro-library [Simplify.js](https://mourner.github.io/simplify-js/).

  function simplify(points, tolerance) {
    if (!tolerance || !points.length) {
      return points.slice();
    }

    var sqTolerance = tolerance * tolerance; // stage 1: vertex reduction

    points = _reducePoints(points, sqTolerance); // stage 2: Douglas-Peucker simplification

    points = _simplifyDP(points, sqTolerance);
    return points;
  } // @function pointToSegmentDistance(p: Point, p1: Point, p2: Point): Number
  // Returns the distance between point `p` and segment `p1` to `p2`.


  function pointToSegmentDistance(p, p1, p2) {
    return Math.sqrt(_sqClosestPointOnSegment(p, p1, p2, true));
  } // @function closestPointOnSegment(p: Point, p1: Point, p2: Point): Number
  // Returns the closest point from a point `p` on a segment `p1` to `p2`.


  function closestPointOnSegment(p, p1, p2) {
    return _sqClosestPointOnSegment(p, p1, p2);
  } // Ramer-Douglas-Peucker simplification, see https://en.wikipedia.org/wiki/Ramer-Douglas-Peucker_algorithm


  function _simplifyDP(points, sqTolerance) {
    var len = points.length,
        ArrayConstructor = (typeof Uint8Array === "undefined" ? "undefined" : _typeof(Uint8Array)) !== undefined + '' ? Uint8Array : Array,
        markers = new ArrayConstructor(len);
    markers[0] = markers[len - 1] = 1;

    _simplifyDPStep(points, markers, sqTolerance, 0, len - 1);

    var i,
        newPoints = [];

    for (i = 0; i < len; i++) {
      if (markers[i]) {
        newPoints.push(points[i]);
      }
    }

    return newPoints;
  }

  function _simplifyDPStep(points, markers, sqTolerance, first, last) {
    var maxSqDist = 0,
        index,
        i,
        sqDist;

    for (i = first + 1; i <= last - 1; i++) {
      sqDist = _sqClosestPointOnSegment(points[i], points[first], points[last], true);

      if (sqDist > maxSqDist) {
        index = i;
        maxSqDist = sqDist;
      }
    }

    if (maxSqDist > sqTolerance) {
      markers[index] = 1;

      _simplifyDPStep(points, markers, sqTolerance, first, index);

      _simplifyDPStep(points, markers, sqTolerance, index, last);
    }
  } // reduce points that are too close to each other to a single point


  function _reducePoints(points, sqTolerance) {
    var reducedPoints = [points[0]];

    for (var i = 1, prev = 0, len = points.length; i < len; i++) {
      if (_sqDist(points[i], points[prev]) > sqTolerance) {
        reducedPoints.push(points[i]);
        prev = i;
      }
    }

    if (prev < len - 1) {
      reducedPoints.push(points[len - 1]);
    }

    return reducedPoints;
  }

  var _lastCode; // @function clipSegment(a: Point, b: Point, bounds: Bounds, useLastCode?: Boolean, round?: Boolean): Point[]|Boolean
  // Clips the segment a to b by rectangular bounds with the
  // [Cohen-Sutherland algorithm](https://en.wikipedia.org/wiki/Cohen%E2%80%93Sutherland_algorithm)
  // (modifying the segment points directly!). Used by Leaflet to only show polyline
  // points that are on the screen or near, increasing performance.


  function clipSegment(a, b, bounds, useLastCode, round) {
    var codeA = useLastCode ? _lastCode : _getBitCode(a, bounds),
        codeB = _getBitCode(b, bounds),
        codeOut,
        p,
        newCode; // save 2nd code to avoid calculating it on the next segment


    _lastCode = codeB;

    while (true) {
      // if a,b is inside the clip window (trivial accept)
      if (!(codeA | codeB)) {
        return [a, b];
      } // if a,b is outside the clip window (trivial reject)


      if (codeA & codeB) {
        return false;
      } // other cases


      codeOut = codeA || codeB;
      p = _getEdgeIntersection(a, b, codeOut, bounds, round);
      newCode = _getBitCode(p, bounds);

      if (codeOut === codeA) {
        a = p;
        codeA = newCode;
      } else {
        b = p;
        codeB = newCode;
      }
    }
  }

  function _getEdgeIntersection(a, b, code, bounds, round) {
    var dx = b.x - a.x,
        dy = b.y - a.y,
        min = bounds.min,
        max = bounds.max,
        x,
        y;

    if (code & 8) {
      // top
      x = a.x + dx * (max.y - a.y) / dy;
      y = max.y;
    } else if (code & 4) {
      // bottom
      x = a.x + dx * (min.y - a.y) / dy;
      y = min.y;
    } else if (code & 2) {
      // right
      x = max.x;
      y = a.y + dy * (max.x - a.x) / dx;
    } else if (code & 1) {
      // left
      x = min.x;
      y = a.y + dy * (min.x - a.x) / dx;
    }

    return new Point(x, y, round);
  }

  function _getBitCode(p, bounds) {
    var code = 0;

    if (p.x < bounds.min.x) {
      // left
      code |= 1;
    } else if (p.x > bounds.max.x) {
      // right
      code |= 2;
    }

    if (p.y < bounds.min.y) {
      // bottom
      code |= 4;
    } else if (p.y > bounds.max.y) {
      // top
      code |= 8;
    }

    return code;
  } // square distance (to avoid unnecessary Math.sqrt calls)


  function _sqDist(p1, p2) {
    var dx = p2.x - p1.x,
        dy = p2.y - p1.y;
    return dx * dx + dy * dy;
  } // return closest point on segment or distance to that point


  function _sqClosestPointOnSegment(p, p1, p2, sqDist) {
    var x = p1.x,
        y = p1.y,
        dx = p2.x - x,
        dy = p2.y - y,
        dot = dx * dx + dy * dy,
        t;

    if (dot > 0) {
      t = ((p.x - x) * dx + (p.y - y) * dy) / dot;

      if (t > 1) {
        x = p2.x;
        y = p2.y;
      } else if (t > 0) {
        x += dx * t;
        y += dy * t;
      }
    }

    dx = p.x - x;
    dy = p.y - y;
    return sqDist ? dx * dx + dy * dy : new Point(x, y);
  } // @function isFlat(latlngs: LatLng[]): Boolean
  // Returns true if `latlngs` is a flat array, false is nested.


  function isFlat(latlngs) {
    return !isArray(latlngs[0]) || _typeof(latlngs[0][0]) !== 'object' && typeof latlngs[0][0] !== 'undefined';
  }

  function _flat(latlngs) {
    console.warn('Deprecated use of _flat, please use L.LineUtil.isFlat instead.');
    return isFlat(latlngs);
  }

  var LineUtil = {
    __proto__: null,
    simplify: simplify,
    pointToSegmentDistance: pointToSegmentDistance,
    closestPointOnSegment: closestPointOnSegment,
    clipSegment: clipSegment,
    _getEdgeIntersection: _getEdgeIntersection,
    _getBitCode: _getBitCode,
    _sqClosestPointOnSegment: _sqClosestPointOnSegment,
    isFlat: isFlat,
    _flat: _flat
  };
  /*
   * @namespace PolyUtil
   * Various utility functions for polygon geometries.
   */

  /* @function clipPolygon(points: Point[], bounds: Bounds, round?: Boolean): Point[]
   * Clips the polygon geometry defined by the given `points` by the given bounds (using the [Sutherland-Hodgman algorithm](https://en.wikipedia.org/wiki/Sutherland%E2%80%93Hodgman_algorithm)).
   * Used by Leaflet to only show polygon points that are on the screen or near, increasing
   * performance. Note that polygon points needs different algorithm for clipping
   * than polyline, so there's a separate method for it.
   */

  function clipPolygon(points, bounds, round) {
    var clippedPoints,
        edges = [1, 4, 2, 8],
        i,
        j,
        k,
        a,
        b,
        len,
        edge,
        p;

    for (i = 0, len = points.length; i < len; i++) {
      points[i]._code = _getBitCode(points[i], bounds);
    } // for each edge (left, bottom, right, top)


    for (k = 0; k < 4; k++) {
      edge = edges[k];
      clippedPoints = [];

      for (i = 0, len = points.length, j = len - 1; i < len; j = i++) {
        a = points[i];
        b = points[j]; // if a is inside the clip window

        if (!(a._code & edge)) {
          // if b is outside the clip window (a->b goes out of screen)
          if (b._code & edge) {
            p = _getEdgeIntersection(b, a, edge, bounds, round);
            p._code = _getBitCode(p, bounds);
            clippedPoints.push(p);
          }

          clippedPoints.push(a); // else if b is inside the clip window (a->b enters the screen)
        } else if (!(b._code & edge)) {
          p = _getEdgeIntersection(b, a, edge, bounds, round);
          p._code = _getBitCode(p, bounds);
          clippedPoints.push(p);
        }
      }

      points = clippedPoints;
    }

    return points;
  }

  var PolyUtil = {
    __proto__: null,
    clipPolygon: clipPolygon
  };
  /*
   * @namespace Projection
   * @section
   * Leaflet comes with a set of already defined Projections out of the box:
   *
   * @projection L.Projection.LonLat
   *
   * Equirectangular, or Plate Carree projection — the most simple projection,
   * mostly used by GIS enthusiasts. Directly maps `x` as longitude, and `y` as
   * latitude. Also suitable for flat worlds, e.g. game maps. Used by the
   * `EPSG:4326` and `Simple` CRS.
   */

  var LonLat = {
    project: function project(latlng) {
      return new Point(latlng.lng, latlng.lat);
    },
    unproject: function unproject(point) {
      return new LatLng(point.y, point.x);
    },
    bounds: new Bounds([-180, -90], [180, 90])
  };
  /*
   * @namespace Projection
   * @projection L.Projection.Mercator
   *
   * Elliptical Mercator projection — more complex than Spherical Mercator. Assumes that Earth is an ellipsoid. Used by the EPSG:3395 CRS.
   */

  var Mercator = {
    R: 6378137,
    R_MINOR: 6356752.314245179,
    bounds: new Bounds([-20037508.34279, -15496570.73972], [20037508.34279, 18764656.23138]),
    project: function project(latlng) {
      var d = Math.PI / 180,
          r = this.R,
          y = latlng.lat * d,
          tmp = this.R_MINOR / r,
          e = Math.sqrt(1 - tmp * tmp),
          con = e * Math.sin(y);
      var ts = Math.tan(Math.PI / 4 - y / 2) / Math.pow((1 - con) / (1 + con), e / 2);
      y = -r * Math.log(Math.max(ts, 1E-10));
      return new Point(latlng.lng * d * r, y);
    },
    unproject: function unproject(point) {
      var d = 180 / Math.PI,
          r = this.R,
          tmp = this.R_MINOR / r,
          e = Math.sqrt(1 - tmp * tmp),
          ts = Math.exp(-point.y / r),
          phi = Math.PI / 2 - 2 * Math.atan(ts);

      for (var i = 0, dphi = 0.1, con; i < 15 && Math.abs(dphi) > 1e-7; i++) {
        con = e * Math.sin(phi);
        con = Math.pow((1 - con) / (1 + con), e / 2);
        dphi = Math.PI / 2 - 2 * Math.atan(ts * con) - phi;
        phi += dphi;
      }

      return new LatLng(phi * d, point.x * d / r);
    }
  };
  /*
   * @class Projection
    * An object with methods for projecting geographical coordinates of the world onto
   * a flat surface (and back). See [Map projection](https://en.wikipedia.org/wiki/Map_projection).
    * @property bounds: Bounds
   * The bounds (specified in CRS units) where the projection is valid
    * @method project(latlng: LatLng): Point
   * Projects geographical coordinates into a 2D point.
   * Only accepts actual `L.LatLng` instances, not arrays.
    * @method unproject(point: Point): LatLng
   * The inverse of `project`. Projects a 2D point into a geographical location.
   * Only accepts actual `L.Point` instances, not arrays.
    * Note that the projection instances do not inherit from Leaflet's `Class` object,
   * and can't be instantiated. Also, new classes can't inherit from them,
   * and methods can't be added to them with the `include` function.
    */

  var index = {
    __proto__: null,
    LonLat: LonLat,
    Mercator: Mercator,
    SphericalMercator: SphericalMercator
  };
  /*
   * @namespace CRS
   * @crs L.CRS.EPSG3395
   *
   * Rarely used by some commercial tile providers. Uses Elliptical Mercator projection.
   */

  var EPSG3395 = extend({}, Earth, {
    code: 'EPSG:3395',
    projection: Mercator,
    transformation: function () {
      var scale = 0.5 / (Math.PI * Mercator.R);
      return toTransformation(scale, 0.5, -scale, 0.5);
    }()
  });
  /*
   * @namespace CRS
   * @crs L.CRS.EPSG4326
   *
   * A common CRS among GIS enthusiasts. Uses simple Equirectangular projection.
   *
   * Leaflet 1.0.x complies with the [TMS coordinate scheme for EPSG:4326](https://wiki.osgeo.org/wiki/Tile_Map_Service_Specification#global-geodetic),
   * which is a breaking change from 0.7.x behaviour.  If you are using a `TileLayer`
   * with this CRS, ensure that there are two 256x256 pixel tiles covering the
   * whole earth at zoom level zero, and that the tile coordinate origin is (-180,+90),
   * or (-180,-90) for `TileLayer`s with [the `tms` option](#tilelayer-tms) set.
   */

  var EPSG4326 = extend({}, Earth, {
    code: 'EPSG:4326',
    projection: LonLat,
    transformation: toTransformation(1 / 180, 1, -1 / 180, 0.5)
  });
  /*
   * @namespace CRS
   * @crs L.CRS.Simple
   *
   * A simple CRS that maps longitude and latitude into `x` and `y` directly.
   * May be used for maps of flat surfaces (e.g. game maps). Note that the `y`
   * axis should still be inverted (going from bottom to top). `distance()` returns
   * simple euclidean distance.
   */

  var Simple = extend({}, CRS, {
    projection: LonLat,
    transformation: toTransformation(1, 0, -1, 0),
    scale: function scale(zoom) {
      return Math.pow(2, zoom);
    },
    zoom: function zoom(scale) {
      return Math.log(scale) / Math.LN2;
    },
    distance: function distance(latlng1, latlng2) {
      var dx = latlng2.lng - latlng1.lng,
          dy = latlng2.lat - latlng1.lat;
      return Math.sqrt(dx * dx + dy * dy);
    },
    infinite: true
  });
  CRS.Earth = Earth;
  CRS.EPSG3395 = EPSG3395;
  CRS.EPSG3857 = EPSG3857;
  CRS.EPSG900913 = EPSG900913;
  CRS.EPSG4326 = EPSG4326;
  CRS.Simple = Simple;
  /*
   * @class Layer
   * @inherits Evented
   * @aka L.Layer
   * @aka ILayer
   *
   * A set of methods from the Layer base class that all Leaflet layers use.
   * Inherits all methods, options and events from `L.Evented`.
   *
   * @example
   *
   * ```js
   * var layer = L.marker(latlng).addTo(map);
   * layer.addTo(map);
   * layer.remove();
   * ```
   *
   * @event add: Event
   * Fired after the layer is added to a map
   *
   * @event remove: Event
   * Fired after the layer is removed from a map
   */

  var Layer = Evented.extend({
    // Classes extending `L.Layer` will inherit the following options:
    options: {
      // @option pane: String = 'overlayPane'
      // By default the layer will be added to the map's [overlay pane](#map-overlaypane). Overriding this option will cause the layer to be placed on another pane by default.
      pane: 'overlayPane',
      // @option attribution: String = null
      // String to be shown in the attribution control, e.g. "© OpenStreetMap contributors". It describes the layer data and is often a legal obligation towards copyright holders and tile providers.
      attribution: null,
      bubblingMouseEvents: true
    },

    /* @section
     * Classes extending `L.Layer` will inherit the following methods:
     *
     * @method addTo(map: Map|LayerGroup): this
     * Adds the layer to the given map or layer group.
     */
    addTo: function addTo(map) {
      map.addLayer(this);
      return this;
    },
    // @method remove: this
    // Removes the layer from the map it is currently active on.
    remove: function remove() {
      return this.removeFrom(this._map || this._mapToAdd);
    },
    // @method removeFrom(map: Map): this
    // Removes the layer from the given map
    //
    // @alternative
    // @method removeFrom(group: LayerGroup): this
    // Removes the layer from the given `LayerGroup`
    removeFrom: function removeFrom(obj) {
      if (obj) {
        obj.removeLayer(this);
      }

      return this;
    },
    // @method getPane(name? : String): HTMLElement
    // Returns the `HTMLElement` representing the named pane on the map. If `name` is omitted, returns the pane for this layer.
    getPane: function getPane(name) {
      return this._map.getPane(name ? this.options[name] || name : this.options.pane);
    },
    addInteractiveTarget: function addInteractiveTarget(targetEl) {
      this._map._targets[stamp(targetEl)] = this;
      return this;
    },
    removeInteractiveTarget: function removeInteractiveTarget(targetEl) {
      delete this._map._targets[stamp(targetEl)];
      return this;
    },
    // @method getAttribution: String
    // Used by the `attribution control`, returns the [attribution option](#gridlayer-attribution).
    getAttribution: function getAttribution() {
      return this.options.attribution;
    },
    _layerAdd: function _layerAdd(e) {
      var map = e.target; // check in case layer gets added and then removed before the map is ready

      if (!map.hasLayer(this)) {
        return;
      }

      this._map = map;
      this._zoomAnimated = map._zoomAnimated;

      if (this.getEvents) {
        var events = this.getEvents();
        map.on(events, this);
        this.once('remove', function () {
          map.off(events, this);
        }, this);
      }

      this.onAdd(map);
      this.fire('add');
      map.fire('layeradd', {
        layer: this
      });
    }
  });
  /* @section Extension methods
   * @uninheritable
   *
   * Every layer should extend from `L.Layer` and (re-)implement the following methods.
   *
   * @method onAdd(map: Map): this
   * Should contain code that creates DOM elements for the layer, adds them to `map panes` where they should belong and puts listeners on relevant map events. Called on [`map.addLayer(layer)`](#map-addlayer).
   *
   * @method onRemove(map: Map): this
   * Should contain all clean up code that removes the layer's elements from the DOM and removes listeners previously added in [`onAdd`](#layer-onadd). Called on [`map.removeLayer(layer)`](#map-removelayer).
   *
   * @method getEvents(): Object
   * This optional method should return an object like `{ viewreset: this._reset }` for [`addEventListener`](#evented-addeventlistener). The event handlers in this object will be automatically added and removed from the map with your layer.
   *
   * @method getAttribution(): String
   * This optional method should return a string containing HTML to be shown on the `Attribution control` whenever the layer is visible.
   *
   * @method beforeAdd(map: Map): this
   * Optional method. Called on [`map.addLayer(layer)`](#map-addlayer), before the layer is added to the map, before events are initialized, without waiting until the map is in a usable state. Use for early initialization only.
   */

  /* @namespace Map
   * @section Layer events
   *
   * @event layeradd: LayerEvent
   * Fired when a new layer is added to the map.
   *
   * @event layerremove: LayerEvent
   * Fired when some layer is removed from the map
   *
   * @section Methods for Layers and Controls
   */

  Map.include({
    // @method addLayer(layer: Layer): this
    // Adds the given layer to the map
    addLayer: function addLayer(layer) {
      if (!layer._layerAdd) {
        throw new Error('The provided object is not a Layer.');
      }

      var id = stamp(layer);

      if (this._layers[id]) {
        return this;
      }

      this._layers[id] = layer;
      layer._mapToAdd = this;

      if (layer.beforeAdd) {
        layer.beforeAdd(this);
      }

      this.whenReady(layer._layerAdd, layer);
      return this;
    },
    // @method removeLayer(layer: Layer): this
    // Removes the given layer from the map.
    removeLayer: function removeLayer(layer) {
      var id = stamp(layer);

      if (!this._layers[id]) {
        return this;
      }

      if (this._loaded) {
        layer.onRemove(this);
      }

      delete this._layers[id];

      if (this._loaded) {
        this.fire('layerremove', {
          layer: layer
        });
        layer.fire('remove');
      }

      layer._map = layer._mapToAdd = null;
      return this;
    },
    // @method hasLayer(layer: Layer): Boolean
    // Returns `true` if the given layer is currently added to the map
    hasLayer: function hasLayer(layer) {
      return stamp(layer) in this._layers;
    },

    /* @method eachLayer(fn: Function, context?: Object): this
     * Iterates over the layers of the map, optionally specifying context of the iterator function.
     * ```
     * map.eachLayer(function(layer){
     *     layer.bindPopup('Hello');
     * });
     * ```
     */
    eachLayer: function eachLayer(method, context) {
      for (var i in this._layers) {
        method.call(context, this._layers[i]);
      }

      return this;
    },
    _addLayers: function _addLayers(layers) {
      layers = layers ? isArray(layers) ? layers : [layers] : [];

      for (var i = 0, len = layers.length; i < len; i++) {
        this.addLayer(layers[i]);
      }
    },
    _addZoomLimit: function _addZoomLimit(layer) {
      if (!isNaN(layer.options.maxZoom) || !isNaN(layer.options.minZoom)) {
        this._zoomBoundLayers[stamp(layer)] = layer;

        this._updateZoomLevels();
      }
    },
    _removeZoomLimit: function _removeZoomLimit(layer) {
      var id = stamp(layer);

      if (this._zoomBoundLayers[id]) {
        delete this._zoomBoundLayers[id];

        this._updateZoomLevels();
      }
    },
    _updateZoomLevels: function _updateZoomLevels() {
      var minZoom = Infinity,
          maxZoom = -Infinity,
          oldZoomSpan = this._getZoomSpan();

      for (var i in this._zoomBoundLayers) {
        var options = this._zoomBoundLayers[i].options;
        minZoom = options.minZoom === undefined ? minZoom : Math.min(minZoom, options.minZoom);
        maxZoom = options.maxZoom === undefined ? maxZoom : Math.max(maxZoom, options.maxZoom);
      }

      this._layersMaxZoom = maxZoom === -Infinity ? undefined : maxZoom;
      this._layersMinZoom = minZoom === Infinity ? undefined : minZoom; // @section Map state change events
      // @event zoomlevelschange: Event
      // Fired when the number of zoomlevels on the map is changed due
      // to adding or removing a layer.

      if (oldZoomSpan !== this._getZoomSpan()) {
        this.fire('zoomlevelschange');
      }

      if (this.options.maxZoom === undefined && this._layersMaxZoom && this.getZoom() > this._layersMaxZoom) {
        this.setZoom(this._layersMaxZoom);
      }

      if (this.options.minZoom === undefined && this._layersMinZoom && this.getZoom() < this._layersMinZoom) {
        this.setZoom(this._layersMinZoom);
      }
    }
  });
  /*
   * @class LayerGroup
   * @aka L.LayerGroup
   * @inherits Interactive layer
   *
   * Used to group several layers and handle them as one. If you add it to the map,
   * any layers added or removed from the group will be added/removed on the map as
   * well. Extends `Layer`.
   *
   * @example
   *
   * ```js
   * L.layerGroup([marker1, marker2])
   * 	.addLayer(polyline)
   * 	.addTo(map);
   * ```
   */

  var LayerGroup = Layer.extend({
    initialize: function initialize(layers, options) {
      setOptions(this, options);
      this._layers = {};
      var i, len;

      if (layers) {
        for (i = 0, len = layers.length; i < len; i++) {
          this.addLayer(layers[i]);
        }
      }
    },
    // @method addLayer(layer: Layer): this
    // Adds the given layer to the group.
    addLayer: function addLayer(layer) {
      var id = this.getLayerId(layer);
      this._layers[id] = layer;

      if (this._map) {
        this._map.addLayer(layer);
      }

      return this;
    },
    // @method removeLayer(layer: Layer): this
    // Removes the given layer from the group.
    // @alternative
    // @method removeLayer(id: Number): this
    // Removes the layer with the given internal ID from the group.
    removeLayer: function removeLayer(layer) {
      var id = layer in this._layers ? layer : this.getLayerId(layer);

      if (this._map && this._layers[id]) {
        this._map.removeLayer(this._layers[id]);
      }

      delete this._layers[id];
      return this;
    },
    // @method hasLayer(layer: Layer): Boolean
    // Returns `true` if the given layer is currently added to the group.
    // @alternative
    // @method hasLayer(id: Number): Boolean
    // Returns `true` if the given internal ID is currently added to the group.
    hasLayer: function hasLayer(layer) {
      var layerId = typeof layer === 'number' ? layer : this.getLayerId(layer);
      return layerId in this._layers;
    },
    // @method clearLayers(): this
    // Removes all the layers from the group.
    clearLayers: function clearLayers() {
      return this.eachLayer(this.removeLayer, this);
    },
    // @method invoke(methodName: String, …): this
    // Calls `methodName` on every layer contained in this group, passing any
    // additional parameters. Has no effect if the layers contained do not
    // implement `methodName`.
    invoke: function invoke(methodName) {
      var args = Array.prototype.slice.call(arguments, 1),
          i,
          layer;

      for (i in this._layers) {
        layer = this._layers[i];

        if (layer[methodName]) {
          layer[methodName].apply(layer, args);
        }
      }

      return this;
    },
    onAdd: function onAdd(map) {
      this.eachLayer(map.addLayer, map);
    },
    onRemove: function onRemove(map) {
      this.eachLayer(map.removeLayer, map);
    },
    // @method eachLayer(fn: Function, context?: Object): this
    // Iterates over the layers of the group, optionally specifying context of the iterator function.
    // ```js
    // group.eachLayer(function (layer) {
    // 	layer.bindPopup('Hello');
    // });
    // ```
    eachLayer: function eachLayer(method, context) {
      for (var i in this._layers) {
        method.call(context, this._layers[i]);
      }

      return this;
    },
    // @method getLayer(id: Number): Layer
    // Returns the layer with the given internal ID.
    getLayer: function getLayer(id) {
      return this._layers[id];
    },
    // @method getLayers(): Layer[]
    // Returns an array of all the layers added to the group.
    getLayers: function getLayers() {
      var layers = [];
      this.eachLayer(layers.push, layers);
      return layers;
    },
    // @method setZIndex(zIndex: Number): this
    // Calls `setZIndex` on every layer contained in this group, passing the z-index.
    setZIndex: function setZIndex(zIndex) {
      return this.invoke('setZIndex', zIndex);
    },
    // @method getLayerId(layer: Layer): Number
    // Returns the internal ID for a layer
    getLayerId: function getLayerId(layer) {
      return stamp(layer);
    }
  }); // @factory L.layerGroup(layers?: Layer[], options?: Object)
  // Create a layer group, optionally given an initial set of layers and an `options` object.

  var layerGroup = function layerGroup(layers, options) {
    return new LayerGroup(layers, options);
  };
  /*
   * @class FeatureGroup
   * @aka L.FeatureGroup
   * @inherits LayerGroup
   *
   * Extended `LayerGroup` that makes it easier to do the same thing to all its member layers:
   *  * [`bindPopup`](#layer-bindpopup) binds a popup to all of the layers at once (likewise with [`bindTooltip`](#layer-bindtooltip))
   *  * Events are propagated to the `FeatureGroup`, so if the group has an event
   * handler, it will handle events from any of the layers. This includes mouse events
   * and custom events.
   *  * Has `layeradd` and `layerremove` events
   *
   * @example
   *
   * ```js
   * L.featureGroup([marker1, marker2, polyline])
   * 	.bindPopup('Hello world!')
   * 	.on('click', function() { alert('Clicked on a member of the group!'); })
   * 	.addTo(map);
   * ```
   */


  var FeatureGroup = LayerGroup.extend({
    addLayer: function addLayer(layer) {
      if (this.hasLayer(layer)) {
        return this;
      }

      layer.addEventParent(this);
      LayerGroup.prototype.addLayer.call(this, layer); // @event layeradd: LayerEvent
      // Fired when a layer is added to this `FeatureGroup`

      return this.fire('layeradd', {
        layer: layer
      });
    },
    removeLayer: function removeLayer(layer) {
      if (!this.hasLayer(layer)) {
        return this;
      }

      if (layer in this._layers) {
        layer = this._layers[layer];
      }

      layer.removeEventParent(this);
      LayerGroup.prototype.removeLayer.call(this, layer); // @event layerremove: LayerEvent
      // Fired when a layer is removed from this `FeatureGroup`

      return this.fire('layerremove', {
        layer: layer
      });
    },
    // @method setStyle(style: Path options): this
    // Sets the given path options to each layer of the group that has a `setStyle` method.
    setStyle: function setStyle(style) {
      return this.invoke('setStyle', style);
    },
    // @method bringToFront(): this
    // Brings the layer group to the top of all other layers
    bringToFront: function bringToFront() {
      return this.invoke('bringToFront');
    },
    // @method bringToBack(): this
    // Brings the layer group to the back of all other layers
    bringToBack: function bringToBack() {
      return this.invoke('bringToBack');
    },
    // @method getBounds(): LatLngBounds
    // Returns the LatLngBounds of the Feature Group (created from bounds and coordinates of its children).
    getBounds: function getBounds() {
      var bounds = new LatLngBounds();

      for (var id in this._layers) {
        var layer = this._layers[id];
        bounds.extend(layer.getBounds ? layer.getBounds() : layer.getLatLng());
      }

      return bounds;
    }
  }); // @factory L.featureGroup(layers?: Layer[], options?: Object)
  // Create a feature group, optionally given an initial set of layers and an `options` object.

  var featureGroup = function featureGroup(layers, options) {
    return new FeatureGroup(layers, options);
  };
  /*
   * @class Icon
   * @aka L.Icon
   *
   * Represents an icon to provide when creating a marker.
   *
   * @example
   *
   * ```js
   * var myIcon = L.icon({
   *     iconUrl: 'my-icon.png',
   *     iconRetinaUrl: 'my-icon@2x.png',
   *     iconSize: [38, 95],
   *     iconAnchor: [22, 94],
   *     popupAnchor: [-3, -76],
   *     shadowUrl: 'my-icon-shadow.png',
   *     shadowRetinaUrl: 'my-icon-shadow@2x.png',
   *     shadowSize: [68, 95],
   *     shadowAnchor: [22, 94]
   * });
   *
   * L.marker([50.505, 30.57], {icon: myIcon}).addTo(map);
   * ```
   *
   * `L.Icon.Default` extends `L.Icon` and is the blue icon Leaflet uses for markers by default.
   *
   */


  var Icon = Class.extend({
    /* @section
     * @aka Icon options
     *
     * @option iconUrl: String = null
     * **(required)** The URL to the icon image (absolute or relative to your script path).
     *
     * @option iconRetinaUrl: String = null
     * The URL to a retina sized version of the icon image (absolute or relative to your
     * script path). Used for Retina screen devices.
     *
     * @option iconSize: Point = null
     * Size of the icon image in pixels.
     *
     * @option iconAnchor: Point = null
     * The coordinates of the "tip" of the icon (relative to its top left corner). The icon
     * will be aligned so that this point is at the marker's geographical location. Centered
     * by default if size is specified, also can be set in CSS with negative margins.
     *
     * @option popupAnchor: Point = [0, 0]
     * The coordinates of the point from which popups will "open", relative to the icon anchor.
     *
     * @option tooltipAnchor: Point = [0, 0]
     * The coordinates of the point from which tooltips will "open", relative to the icon anchor.
     *
     * @option shadowUrl: String = null
     * The URL to the icon shadow image. If not specified, no shadow image will be created.
     *
     * @option shadowRetinaUrl: String = null
     *
     * @option shadowSize: Point = null
     * Size of the shadow image in pixels.
     *
     * @option shadowAnchor: Point = null
     * The coordinates of the "tip" of the shadow (relative to its top left corner) (the same
     * as iconAnchor if not specified).
     *
     * @option className: String = ''
     * A custom class name to assign to both icon and shadow images. Empty by default.
     */
    options: {
      popupAnchor: [0, 0],
      tooltipAnchor: [0, 0],
      // @option crossOrigin: Boolean|String = false
      // Whether the crossOrigin attribute will be added to the tiles.
      // If a String is provided, all tiles will have their crossOrigin attribute set to the String provided. This is needed if you want to access tile pixel data.
      // Refer to [CORS Settings](https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_settings_attributes) for valid String values.
      crossOrigin: false
    },
    initialize: function initialize(options) {
      setOptions(this, options);
    },
    // @method createIcon(oldIcon?: HTMLElement): HTMLElement
    // Called internally when the icon has to be shown, returns a `<img>` HTML element
    // styled according to the options.
    createIcon: function createIcon(oldIcon) {
      return this._createIcon('icon', oldIcon);
    },
    // @method createShadow(oldIcon?: HTMLElement): HTMLElement
    // As `createIcon`, but for the shadow beneath it.
    createShadow: function createShadow(oldIcon) {
      return this._createIcon('shadow', oldIcon);
    },
    _createIcon: function _createIcon(name, oldIcon) {
      var src = this._getIconUrl(name);

      if (!src) {
        if (name === 'icon') {
          throw new Error('iconUrl not set in Icon options (see the docs).');
        }

        return null;
      }

      var img = this._createImg(src, oldIcon && oldIcon.tagName === 'IMG' ? oldIcon : null);

      this._setIconStyles(img, name);

      if (this.options.crossOrigin || this.options.crossOrigin === '') {
        img.crossOrigin = this.options.crossOrigin === true ? '' : this.options.crossOrigin;
      }

      return img;
    },
    _setIconStyles: function _setIconStyles(img, name) {
      var options = this.options;
      var sizeOption = options[name + 'Size'];

      if (typeof sizeOption === 'number') {
        sizeOption = [sizeOption, sizeOption];
      }

      var size = toPoint(sizeOption),
          anchor = toPoint(name === 'shadow' && options.shadowAnchor || options.iconAnchor || size && size.divideBy(2, true));
      img.className = 'leaflet-marker-' + name + ' ' + (options.className || '');

      if (anchor) {
        img.style.marginLeft = -anchor.x + 'px';
        img.style.marginTop = -anchor.y + 'px';
      }

      if (size) {
        img.style.width = size.x + 'px';
        img.style.height = size.y + 'px';
      }
    },
    _createImg: function _createImg(src, el) {
      el = el || document.createElement('img');
      el.src = src;
      return el;
    },
    _getIconUrl: function _getIconUrl(name) {
      return Browser.retina && this.options[name + 'RetinaUrl'] || this.options[name + 'Url'];
    }
  }); // @factory L.icon(options: Icon options)
  // Creates an icon instance with the given options.

  function icon(options) {
    return new Icon(options);
  }
  /*
   * @miniclass Icon.Default (Icon)
   * @aka L.Icon.Default
   * @section
   *
   * A trivial subclass of `Icon`, represents the icon to use in `Marker`s when
   * no icon is specified. Points to the blue marker image distributed with Leaflet
   * releases.
   *
   * In order to customize the default icon, just change the properties of `L.Icon.Default.prototype.options`
   * (which is a set of `Icon options`).
   *
   * If you want to _completely_ replace the default icon, override the
   * `L.Marker.prototype.options.icon` with your own icon instead.
   */


  var IconDefault = Icon.extend({
    options: {
      iconUrl: 'marker-icon.png',
      iconRetinaUrl: 'marker-icon-2x.png',
      shadowUrl: 'marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41]
    },
    _getIconUrl: function _getIconUrl(name) {
      if (typeof IconDefault.imagePath !== 'string') {
        // Deprecated, backwards-compatibility only
        IconDefault.imagePath = this._detectIconPath();
      } // @option imagePath: String
      // `Icon.Default` will try to auto-detect the location of the
      // blue icon images. If you are placing these images in a non-standard
      // way, set this option to point to the right path.


      return (this.options.imagePath || IconDefault.imagePath) + Icon.prototype._getIconUrl.call(this, name);
    },
    _stripUrl: function _stripUrl(path) {
      // separate function to use in tests
      var strip = function strip(str, re, idx) {
        var match = re.exec(str);
        return match && match[idx];
      };

      path = strip(path, /^url\((['"])?(.+)\1\)$/, 2);
      return path && strip(path, /^(.*)marker-icon\.png$/, 1);
    },
    _detectIconPath: function _detectIconPath() {
      var el = create$1('div', 'leaflet-default-icon-path', document.body);
      var path = getStyle(el, 'background-image') || getStyle(el, 'backgroundImage'); // IE8

      document.body.removeChild(el);
      path = this._stripUrl(path);

      if (path) {
        return path;
      }

      var link = document.querySelector('link[href$="leaflet.css"]');

      if (!link) {
        return '';
      }

      return link.href.substring(0, link.href.length - 'leaflet.css'.length - 1);
    }
  });
  /*
   * L.Handler.MarkerDrag is used internally by L.Marker to make the markers draggable.
   */

  /* @namespace Marker
   * @section Interaction handlers
   *
   * Interaction handlers are properties of a marker instance that allow you to control interaction behavior in runtime, enabling or disabling certain features such as dragging (see `Handler` methods). Example:
   *
   * ```js
   * marker.dragging.disable();
   * ```
   *
   * @property dragging: Handler
   * Marker dragging handler (by both mouse and touch). Only valid when the marker is on the map (Otherwise set [`marker.options.draggable`](#marker-draggable)).
   */

  var MarkerDrag = Handler.extend({
    initialize: function initialize(marker) {
      this._marker = marker;
    },
    addHooks: function addHooks() {
      var icon = this._marker._icon;

      if (!this._draggable) {
        this._draggable = new Draggable(icon, icon, true);
      }

      this._draggable.on({
        dragstart: this._onDragStart,
        predrag: this._onPreDrag,
        drag: this._onDrag,
        dragend: this._onDragEnd
      }, this).enable();

      addClass(icon, 'leaflet-marker-draggable');
    },
    removeHooks: function removeHooks() {
      this._draggable.off({
        dragstart: this._onDragStart,
        predrag: this._onPreDrag,
        drag: this._onDrag,
        dragend: this._onDragEnd
      }, this).disable();

      if (this._marker._icon) {
        removeClass(this._marker._icon, 'leaflet-marker-draggable');
      }
    },
    moved: function moved() {
      return this._draggable && this._draggable._moved;
    },
    _adjustPan: function _adjustPan(e) {
      var marker = this._marker,
          map = marker._map,
          speed = this._marker.options.autoPanSpeed,
          padding = this._marker.options.autoPanPadding,
          iconPos = getPosition(marker._icon),
          bounds = map.getPixelBounds(),
          origin = map.getPixelOrigin();
      var panBounds = toBounds(bounds.min._subtract(origin).add(padding), bounds.max._subtract(origin).subtract(padding));

      if (!panBounds.contains(iconPos)) {
        // Compute incremental movement
        var movement = toPoint((Math.max(panBounds.max.x, iconPos.x) - panBounds.max.x) / (bounds.max.x - panBounds.max.x) - (Math.min(panBounds.min.x, iconPos.x) - panBounds.min.x) / (bounds.min.x - panBounds.min.x), (Math.max(panBounds.max.y, iconPos.y) - panBounds.max.y) / (bounds.max.y - panBounds.max.y) - (Math.min(panBounds.min.y, iconPos.y) - panBounds.min.y) / (bounds.min.y - panBounds.min.y)).multiplyBy(speed);
        map.panBy(movement, {
          animate: false
        });

        this._draggable._newPos._add(movement);

        this._draggable._startPos._add(movement);

        setPosition(marker._icon, this._draggable._newPos);

        this._onDrag(e);

        this._panRequest = requestAnimFrame(this._adjustPan.bind(this, e));
      }
    },
    _onDragStart: function _onDragStart() {
      // @section Dragging events
      // @event dragstart: Event
      // Fired when the user starts dragging the marker.
      // @event movestart: Event
      // Fired when the marker starts moving (because of dragging).
      this._oldLatLng = this._marker.getLatLng(); // When using ES6 imports it could not be set when `Popup` was not imported as well

      this._marker.closePopup && this._marker.closePopup();

      this._marker.fire('movestart').fire('dragstart');
    },
    _onPreDrag: function _onPreDrag(e) {
      if (this._marker.options.autoPan) {
        cancelAnimFrame(this._panRequest);
        this._panRequest = requestAnimFrame(this._adjustPan.bind(this, e));
      }
    },
    _onDrag: function _onDrag(e) {
      var marker = this._marker,
          shadow = marker._shadow,
          iconPos = getPosition(marker._icon),
          latlng = marker._map.layerPointToLatLng(iconPos); // update shadow position


      if (shadow) {
        setPosition(shadow, iconPos);
      }

      marker._latlng = latlng;
      e.latlng = latlng;
      e.oldLatLng = this._oldLatLng; // @event drag: Event
      // Fired repeatedly while the user drags the marker.

      marker.fire('move', e).fire('drag', e);
    },
    _onDragEnd: function _onDragEnd(e) {
      // @event dragend: DragEndEvent
      // Fired when the user stops dragging the marker.
      cancelAnimFrame(this._panRequest); // @event moveend: Event
      // Fired when the marker stops moving (because of dragging).

      delete this._oldLatLng;

      this._marker.fire('moveend').fire('dragend', e);
    }
  });
  /*
   * @class Marker
   * @inherits Interactive layer
   * @aka L.Marker
   * L.Marker is used to display clickable/draggable icons on the map. Extends `Layer`.
   *
   * @example
   *
   * ```js
   * L.marker([50.5, 30.5]).addTo(map);
   * ```
   */

  var Marker = Layer.extend({
    // @section
    // @aka Marker options
    options: {
      // @option icon: Icon = *
      // Icon instance to use for rendering the marker.
      // See [Icon documentation](#L.Icon) for details on how to customize the marker icon.
      // If not specified, a common instance of `L.Icon.Default` is used.
      icon: new IconDefault(),
      // Option inherited from "Interactive layer" abstract class
      interactive: true,
      // @option keyboard: Boolean = true
      // Whether the marker can be tabbed to with a keyboard and clicked by pressing enter.
      keyboard: true,
      // @option title: String = ''
      // Text for the browser tooltip that appear on marker hover (no tooltip by default).
      // [Useful for accessibility](https://leafletjs.com/examples/accessibility/#markers-must-be-labelled).
      title: '',
      // @option alt: String = 'Marker'
      // Text for the `alt` attribute of the icon image.
      // [Useful for accessibility](https://leafletjs.com/examples/accessibility/#markers-must-be-labelled).
      alt: 'Marker',
      // @option zIndexOffset: Number = 0
      // By default, marker images zIndex is set automatically based on its latitude. Use this option if you want to put the marker on top of all others (or below), specifying a high value like `1000` (or high negative value, respectively).
      zIndexOffset: 0,
      // @option opacity: Number = 1.0
      // The opacity of the marker.
      opacity: 1,
      // @option riseOnHover: Boolean = false
      // If `true`, the marker will get on top of others when you hover the mouse over it.
      riseOnHover: false,
      // @option riseOffset: Number = 250
      // The z-index offset used for the `riseOnHover` feature.
      riseOffset: 250,
      // @option pane: String = 'markerPane'
      // `Map pane` where the markers icon will be added.
      pane: 'markerPane',
      // @option shadowPane: String = 'shadowPane'
      // `Map pane` where the markers shadow will be added.
      shadowPane: 'shadowPane',
      // @option bubblingMouseEvents: Boolean = false
      // When `true`, a mouse event on this marker will trigger the same event on the map
      // (unless [`L.DomEvent.stopPropagation`](#domevent-stoppropagation) is used).
      bubblingMouseEvents: false,
      // @option autoPanOnFocus: Boolean = true
      // When `true`, the map will pan whenever the marker is focused (via
      // e.g. pressing `tab` on the keyboard) to ensure the marker is
      // visible within the map's bounds
      autoPanOnFocus: true,
      // @section Draggable marker options
      // @option draggable: Boolean = false
      // Whether the marker is draggable with mouse/touch or not.
      draggable: false,
      // @option autoPan: Boolean = false
      // Whether to pan the map when dragging this marker near its edge or not.
      autoPan: false,
      // @option autoPanPadding: Point = Point(50, 50)
      // Distance (in pixels to the left/right and to the top/bottom) of the
      // map edge to start panning the map.
      autoPanPadding: [50, 50],
      // @option autoPanSpeed: Number = 10
      // Number of pixels the map should pan by.
      autoPanSpeed: 10
    },

    /* @section
     *
     * In addition to [shared layer methods](#Layer) like `addTo()` and `remove()` and [popup methods](#Popup) like bindPopup() you can also use the following methods:
     */
    initialize: function initialize(latlng, options) {
      setOptions(this, options);
      this._latlng = toLatLng(latlng);
    },
    onAdd: function onAdd(map) {
      this._zoomAnimated = this._zoomAnimated && map.options.markerZoomAnimation;

      if (this._zoomAnimated) {
        map.on('zoomanim', this._animateZoom, this);
      }

      this._initIcon();

      this.update();
    },
    onRemove: function onRemove(map) {
      if (this.dragging && this.dragging.enabled()) {
        this.options.draggable = true;
        this.dragging.removeHooks();
      }

      delete this.dragging;

      if (this._zoomAnimated) {
        map.off('zoomanim', this._animateZoom, this);
      }

      this._removeIcon();

      this._removeShadow();
    },
    getEvents: function getEvents() {
      return {
        zoom: this.update,
        viewreset: this.update
      };
    },
    // @method getLatLng: LatLng
    // Returns the current geographical position of the marker.
    getLatLng: function getLatLng() {
      return this._latlng;
    },
    // @method setLatLng(latlng: LatLng): this
    // Changes the marker position to the given point.
    setLatLng: function setLatLng(latlng) {
      var oldLatLng = this._latlng;
      this._latlng = toLatLng(latlng);
      this.update(); // @event move: Event
      // Fired when the marker is moved via [`setLatLng`](#marker-setlatlng) or by [dragging](#marker-dragging). Old and new coordinates are included in event arguments as `oldLatLng`, `latlng`.

      return this.fire('move', {
        oldLatLng: oldLatLng,
        latlng: this._latlng
      });
    },
    // @method setZIndexOffset(offset: Number): this
    // Changes the [zIndex offset](#marker-zindexoffset) of the marker.
    setZIndexOffset: function setZIndexOffset(offset) {
      this.options.zIndexOffset = offset;
      return this.update();
    },
    // @method getIcon: Icon
    // Returns the current icon used by the marker
    getIcon: function getIcon() {
      return this.options.icon;
    },
    // @method setIcon(icon: Icon): this
    // Changes the marker icon.
    setIcon: function setIcon(icon) {
      this.options.icon = icon;

      if (this._map) {
        this._initIcon();

        this.update();
      }

      if (this._popup) {
        this.bindPopup(this._popup, this._popup.options);
      }

      return this;
    },
    getElement: function getElement() {
      return this._icon;
    },
    update: function update() {
      if (this._icon && this._map) {
        var pos = this._map.latLngToLayerPoint(this._latlng).round();

        this._setPos(pos);
      }

      return this;
    },
    _initIcon: function _initIcon() {
      var options = this.options,
          classToAdd = 'leaflet-zoom-' + (this._zoomAnimated ? 'animated' : 'hide');
      var icon = options.icon.createIcon(this._icon),
          addIcon = false; // if we're not reusing the icon, remove the old one and init new one

      if (icon !== this._icon) {
        if (this._icon) {
          this._removeIcon();
        }

        addIcon = true;

        if (options.title) {
          icon.title = options.title;
        }

        if (icon.tagName === 'IMG') {
          icon.alt = options.alt || '';
        }
      }

      addClass(icon, classToAdd);

      if (options.keyboard) {
        icon.tabIndex = '0';
        icon.setAttribute('role', 'button');
      }

      this._icon = icon;

      if (options.riseOnHover) {
        this.on({
          mouseover: this._bringToFront,
          mouseout: this._resetZIndex
        });
      }

      if (this.options.autoPanOnFocus) {
        on(icon, 'focus', this._panOnFocus, this);
      }

      var newShadow = options.icon.createShadow(this._shadow),
          addShadow = false;

      if (newShadow !== this._shadow) {
        this._removeShadow();

        addShadow = true;
      }

      if (newShadow) {
        addClass(newShadow, classToAdd);
        newShadow.alt = '';
      }

      this._shadow = newShadow;

      if (options.opacity < 1) {
        this._updateOpacity();
      }

      if (addIcon) {
        this.getPane().appendChild(this._icon);
      }

      this._initInteraction();

      if (newShadow && addShadow) {
        this.getPane(options.shadowPane).appendChild(this._shadow);
      }
    },
    _removeIcon: function _removeIcon() {
      if (this.options.riseOnHover) {
        this.off({
          mouseover: this._bringToFront,
          mouseout: this._resetZIndex
        });
      }

      if (this.options.autoPanOnFocus) {
        off(this._icon, 'focus', this._panOnFocus, this);
      }

      _remove(this._icon);

      this.removeInteractiveTarget(this._icon);
      this._icon = null;
    },
    _removeShadow: function _removeShadow() {
      if (this._shadow) {
        _remove(this._shadow);
      }

      this._shadow = null;
    },
    _setPos: function _setPos(pos) {
      if (this._icon) {
        setPosition(this._icon, pos);
      }

      if (this._shadow) {
        setPosition(this._shadow, pos);
      }

      this._zIndex = pos.y + this.options.zIndexOffset;

      this._resetZIndex();
    },
    _updateZIndex: function _updateZIndex(offset) {
      if (this._icon) {
        this._icon.style.zIndex = this._zIndex + offset;
      }
    },
    _animateZoom: function _animateZoom(opt) {
      var pos = this._map._latLngToNewLayerPoint(this._latlng, opt.zoom, opt.center).round();

      this._setPos(pos);
    },
    _initInteraction: function _initInteraction() {
      if (!this.options.interactive) {
        return;
      }

      addClass(this._icon, 'leaflet-interactive');
      this.addInteractiveTarget(this._icon);

      if (MarkerDrag) {
        var draggable = this.options.draggable;

        if (this.dragging) {
          draggable = this.dragging.enabled();
          this.dragging.disable();
        }

        this.dragging = new MarkerDrag(this);

        if (draggable) {
          this.dragging.enable();
        }
      }
    },
    // @method setOpacity(opacity: Number): this
    // Changes the opacity of the marker.
    setOpacity: function setOpacity(opacity) {
      this.options.opacity = opacity;

      if (this._map) {
        this._updateOpacity();
      }

      return this;
    },
    _updateOpacity: function _updateOpacity() {
      var opacity = this.options.opacity;

      if (this._icon) {
        _setOpacity(this._icon, opacity);
      }

      if (this._shadow) {
        _setOpacity(this._shadow, opacity);
      }
    },
    _bringToFront: function _bringToFront() {
      this._updateZIndex(this.options.riseOffset);
    },
    _resetZIndex: function _resetZIndex() {
      this._updateZIndex(0);
    },
    _panOnFocus: function _panOnFocus() {
      var map = this._map;

      if (!map) {
        return;
      }

      var iconOpts = this.options.icon.options;
      var size = iconOpts.iconSize ? toPoint(iconOpts.iconSize) : toPoint(0, 0);
      var anchor = iconOpts.iconAnchor ? toPoint(iconOpts.iconAnchor) : toPoint(0, 0);
      map.panInside(this._latlng, {
        paddingTopLeft: anchor,
        paddingBottomRight: size.subtract(anchor)
      });
    },
    _getPopupAnchor: function _getPopupAnchor() {
      return this.options.icon.options.popupAnchor;
    },
    _getTooltipAnchor: function _getTooltipAnchor() {
      return this.options.icon.options.tooltipAnchor;
    }
  }); // factory L.marker(latlng: LatLng, options? : Marker options)
  // @factory L.marker(latlng: LatLng, options? : Marker options)
  // Instantiates a Marker object given a geographical point and optionally an options object.

  function marker(latlng, options) {
    return new Marker(latlng, options);
  }
  /*
   * @class Path
   * @aka L.Path
   * @inherits Interactive layer
   *
   * An abstract class that contains options and constants shared between vector
   * overlays (Polygon, Polyline, Circle). Do not use it directly. Extends `Layer`.
   */


  var Path = Layer.extend({
    // @section
    // @aka Path options
    options: {
      // @option stroke: Boolean = true
      // Whether to draw stroke along the path. Set it to `false` to disable borders on polygons or circles.
      stroke: true,
      // @option color: String = '#3388ff'
      // Stroke color
      color: '#3388ff',
      // @option weight: Number = 3
      // Stroke width in pixels
      weight: 3,
      // @option opacity: Number = 1.0
      // Stroke opacity
      opacity: 1,
      // @option lineCap: String= 'round'
      // A string that defines [shape to be used at the end](https://developer.mozilla.org/docs/Web/SVG/Attribute/stroke-linecap) of the stroke.
      lineCap: 'round',
      // @option lineJoin: String = 'round'
      // A string that defines [shape to be used at the corners](https://developer.mozilla.org/docs/Web/SVG/Attribute/stroke-linejoin) of the stroke.
      lineJoin: 'round',
      // @option dashArray: String = null
      // A string that defines the stroke [dash pattern](https://developer.mozilla.org/docs/Web/SVG/Attribute/stroke-dasharray). Doesn't work on `Canvas`-powered layers in [some old browsers](https://developer.mozilla.org/docs/Web/API/CanvasRenderingContext2D/setLineDash#Browser_compatibility).
      dashArray: null,
      // @option dashOffset: String = null
      // A string that defines the [distance into the dash pattern to start the dash](https://developer.mozilla.org/docs/Web/SVG/Attribute/stroke-dashoffset). Doesn't work on `Canvas`-powered layers in [some old browsers](https://developer.mozilla.org/docs/Web/API/CanvasRenderingContext2D/setLineDash#Browser_compatibility).
      dashOffset: null,
      // @option fill: Boolean = depends
      // Whether to fill the path with color. Set it to `false` to disable filling on polygons or circles.
      fill: false,
      // @option fillColor: String = *
      // Fill color. Defaults to the value of the [`color`](#path-color) option
      fillColor: null,
      // @option fillOpacity: Number = 0.2
      // Fill opacity.
      fillOpacity: 0.2,
      // @option fillRule: String = 'evenodd'
      // A string that defines [how the inside of a shape](https://developer.mozilla.org/docs/Web/SVG/Attribute/fill-rule) is determined.
      fillRule: 'evenodd',
      // className: '',
      // Option inherited from "Interactive layer" abstract class
      interactive: true,
      // @option bubblingMouseEvents: Boolean = true
      // When `true`, a mouse event on this path will trigger the same event on the map
      // (unless [`L.DomEvent.stopPropagation`](#domevent-stoppropagation) is used).
      bubblingMouseEvents: true
    },
    beforeAdd: function beforeAdd(map) {
      // Renderer is set here because we need to call renderer.getEvents
      // before this.getEvents.
      this._renderer = map.getRenderer(this);
    },
    onAdd: function onAdd() {
      this._renderer._initPath(this);

      this._reset();

      this._renderer._addPath(this);
    },
    onRemove: function onRemove() {
      this._renderer._removePath(this);
    },
    // @method redraw(): this
    // Redraws the layer. Sometimes useful after you changed the coordinates that the path uses.
    redraw: function redraw() {
      if (this._map) {
        this._renderer._updatePath(this);
      }

      return this;
    },
    // @method setStyle(style: Path options): this
    // Changes the appearance of a Path based on the options in the `Path options` object.
    setStyle: function setStyle(style) {
      setOptions(this, style);

      if (this._renderer) {
        this._renderer._updateStyle(this);

        if (this.options.stroke && style && Object.prototype.hasOwnProperty.call(style, 'weight')) {
          this._updateBounds();
        }
      }

      return this;
    },
    // @method bringToFront(): this
    // Brings the layer to the top of all path layers.
    bringToFront: function bringToFront() {
      if (this._renderer) {
        this._renderer._bringToFront(this);
      }

      return this;
    },
    // @method bringToBack(): this
    // Brings the layer to the bottom of all path layers.
    bringToBack: function bringToBack() {
      if (this._renderer) {
        this._renderer._bringToBack(this);
      }

      return this;
    },
    getElement: function getElement() {
      return this._path;
    },
    _reset: function _reset() {
      // defined in child classes
      this._project();

      this._update();
    },
    _clickTolerance: function _clickTolerance() {
      // used when doing hit detection for Canvas layers
      return (this.options.stroke ? this.options.weight / 2 : 0) + (this._renderer.options.tolerance || 0);
    }
  });
  /*
   * @class CircleMarker
   * @aka L.CircleMarker
   * @inherits Path
   *
   * A circle of a fixed size with radius specified in pixels. Extends `Path`.
   */

  var CircleMarker = Path.extend({
    // @section
    // @aka CircleMarker options
    options: {
      fill: true,
      // @option radius: Number = 10
      // Radius of the circle marker, in pixels
      radius: 10
    },
    initialize: function initialize(latlng, options) {
      setOptions(this, options);
      this._latlng = toLatLng(latlng);
      this._radius = this.options.radius;
    },
    // @method setLatLng(latLng: LatLng): this
    // Sets the position of a circle marker to a new location.
    setLatLng: function setLatLng(latlng) {
      var oldLatLng = this._latlng;
      this._latlng = toLatLng(latlng);
      this.redraw(); // @event move: Event
      // Fired when the marker is moved via [`setLatLng`](#circlemarker-setlatlng). Old and new coordinates are included in event arguments as `oldLatLng`, `latlng`.

      return this.fire('move', {
        oldLatLng: oldLatLng,
        latlng: this._latlng
      });
    },
    // @method getLatLng(): LatLng
    // Returns the current geographical position of the circle marker
    getLatLng: function getLatLng() {
      return this._latlng;
    },
    // @method setRadius(radius: Number): this
    // Sets the radius of a circle marker. Units are in pixels.
    setRadius: function setRadius(radius) {
      this.options.radius = this._radius = radius;
      return this.redraw();
    },
    // @method getRadius(): Number
    // Returns the current radius of the circle
    getRadius: function getRadius() {
      return this._radius;
    },
    setStyle: function setStyle(options) {
      var radius = options && options.radius || this._radius;
      Path.prototype.setStyle.call(this, options);
      this.setRadius(radius);
      return this;
    },
    _project: function _project() {
      this._point = this._map.latLngToLayerPoint(this._latlng);

      this._updateBounds();
    },
    _updateBounds: function _updateBounds() {
      var r = this._radius,
          r2 = this._radiusY || r,
          w = this._clickTolerance(),
          p = [r + w, r2 + w];

      this._pxBounds = new Bounds(this._point.subtract(p), this._point.add(p));
    },
    _update: function _update() {
      if (this._map) {
        this._updatePath();
      }
    },
    _updatePath: function _updatePath() {
      this._renderer._updateCircle(this);
    },
    _empty: function _empty() {
      return this._radius && !this._renderer._bounds.intersects(this._pxBounds);
    },
    // Needed by the `Canvas` renderer for interactivity
    _containsPoint: function _containsPoint(p) {
      return p.distanceTo(this._point) <= this._radius + this._clickTolerance();
    }
  }); // @factory L.circleMarker(latlng: LatLng, options?: CircleMarker options)
  // Instantiates a circle marker object given a geographical point, and an optional options object.

  function circleMarker(latlng, options) {
    return new CircleMarker(latlng, options);
  }
  /*
   * @class Circle
   * @aka L.Circle
   * @inherits CircleMarker
   *
   * A class for drawing circle overlays on a map. Extends `CircleMarker`.
   *
   * It's an approximation and starts to diverge from a real circle closer to poles (due to projection distortion).
   *
   * @example
   *
   * ```js
   * L.circle([50.5, 30.5], {radius: 200}).addTo(map);
   * ```
   */


  var Circle = CircleMarker.extend({
    initialize: function initialize(latlng, options, legacyOptions) {
      if (typeof options === 'number') {
        // Backwards compatibility with 0.7.x factory (latlng, radius, options?)
        options = extend({}, legacyOptions, {
          radius: options
        });
      }

      setOptions(this, options);
      this._latlng = toLatLng(latlng);

      if (isNaN(this.options.radius)) {
        throw new Error('Circle radius cannot be NaN');
      } // @section
      // @aka Circle options
      // @option radius: Number; Radius of the circle, in meters.


      this._mRadius = this.options.radius;
    },
    // @method setRadius(radius: Number): this
    // Sets the radius of a circle. Units are in meters.
    setRadius: function setRadius(radius) {
      this._mRadius = radius;
      return this.redraw();
    },
    // @method getRadius(): Number
    // Returns the current radius of a circle. Units are in meters.
    getRadius: function getRadius() {
      return this._mRadius;
    },
    // @method getBounds(): LatLngBounds
    // Returns the `LatLngBounds` of the path.
    getBounds: function getBounds() {
      var half = [this._radius, this._radiusY || this._radius];
      return new LatLngBounds(this._map.layerPointToLatLng(this._point.subtract(half)), this._map.layerPointToLatLng(this._point.add(half)));
    },
    setStyle: Path.prototype.setStyle,
    _project: function _project() {
      var lng = this._latlng.lng,
          lat = this._latlng.lat,
          map = this._map,
          crs = map.options.crs;

      if (crs.distance === Earth.distance) {
        var d = Math.PI / 180,
            latR = this._mRadius / Earth.R / d,
            top = map.project([lat + latR, lng]),
            bottom = map.project([lat - latR, lng]),
            p = top.add(bottom).divideBy(2),
            lat2 = map.unproject(p).lat,
            lngR = Math.acos((Math.cos(latR * d) - Math.sin(lat * d) * Math.sin(lat2 * d)) / (Math.cos(lat * d) * Math.cos(lat2 * d))) / d;

        if (isNaN(lngR) || lngR === 0) {
          lngR = latR / Math.cos(Math.PI / 180 * lat); // Fallback for edge case, #2425
        }

        this._point = p.subtract(map.getPixelOrigin());
        this._radius = isNaN(lngR) ? 0 : p.x - map.project([lat2, lng - lngR]).x;
        this._radiusY = p.y - top.y;
      } else {
        var latlng2 = crs.unproject(crs.project(this._latlng).subtract([this._mRadius, 0]));
        this._point = map.latLngToLayerPoint(this._latlng);
        this._radius = this._point.x - map.latLngToLayerPoint(latlng2).x;
      }

      this._updateBounds();
    }
  }); // @factory L.circle(latlng: LatLng, options?: Circle options)
  // Instantiates a circle object given a geographical point, and an options object
  // which contains the circle radius.
  // @alternative
  // @factory L.circle(latlng: LatLng, radius: Number, options?: Circle options)
  // Obsolete way of instantiating a circle, for compatibility with 0.7.x code.
  // Do not use in new applications or plugins.

  function circle(latlng, options, legacyOptions) {
    return new Circle(latlng, options, legacyOptions);
  }
  /*
   * @class Polyline
   * @aka L.Polyline
   * @inherits Path
   *
   * A class for drawing polyline overlays on a map. Extends `Path`.
   *
   * @example
   *
   * ```js
   * // create a red polyline from an array of LatLng points
   * var latlngs = [
   * 	[45.51, -122.68],
   * 	[37.77, -122.43],
   * 	[34.04, -118.2]
   * ];
   *
   * var polyline = L.polyline(latlngs, {color: 'red'}).addTo(map);
   *
   * // zoom the map to the polyline
   * map.fitBounds(polyline.getBounds());
   * ```
   *
   * You can also pass a multi-dimensional array to represent a `MultiPolyline` shape:
   *
   * ```js
   * // create a red polyline from an array of arrays of LatLng points
   * var latlngs = [
   * 	[[45.51, -122.68],
   * 	 [37.77, -122.43],
   * 	 [34.04, -118.2]],
   * 	[[40.78, -73.91],
   * 	 [41.83, -87.62],
   * 	 [32.76, -96.72]]
   * ];
   * ```
   */


  var Polyline = Path.extend({
    // @section
    // @aka Polyline options
    options: {
      // @option smoothFactor: Number = 1.0
      // How much to simplify the polyline on each zoom level. More means
      // better performance and smoother look, and less means more accurate representation.
      smoothFactor: 1.0,
      // @option noClip: Boolean = false
      // Disable polyline clipping.
      noClip: false
    },
    initialize: function initialize(latlngs, options) {
      setOptions(this, options);

      this._setLatLngs(latlngs);
    },
    // @method getLatLngs(): LatLng[]
    // Returns an array of the points in the path, or nested arrays of points in case of multi-polyline.
    getLatLngs: function getLatLngs() {
      return this._latlngs;
    },
    // @method setLatLngs(latlngs: LatLng[]): this
    // Replaces all the points in the polyline with the given array of geographical points.
    setLatLngs: function setLatLngs(latlngs) {
      this._setLatLngs(latlngs);

      return this.redraw();
    },
    // @method isEmpty(): Boolean
    // Returns `true` if the Polyline has no LatLngs.
    isEmpty: function isEmpty() {
      return !this._latlngs.length;
    },
    // @method closestLayerPoint(p: Point): Point
    // Returns the point closest to `p` on the Polyline.
    closestLayerPoint: function closestLayerPoint(p) {
      var minDistance = Infinity,
          minPoint = null,
          closest = _sqClosestPointOnSegment,
          p1,
          p2;

      for (var j = 0, jLen = this._parts.length; j < jLen; j++) {
        var points = this._parts[j];

        for (var i = 1, len = points.length; i < len; i++) {
          p1 = points[i - 1];
          p2 = points[i];
          var sqDist = closest(p, p1, p2, true);

          if (sqDist < minDistance) {
            minDistance = sqDist;
            minPoint = closest(p, p1, p2);
          }
        }
      }

      if (minPoint) {
        minPoint.distance = Math.sqrt(minDistance);
      }

      return minPoint;
    },
    // @method getCenter(): LatLng
    // Returns the center ([centroid](https://en.wikipedia.org/wiki/Centroid)) of the polyline.
    getCenter: function getCenter() {
      // throws error when not yet added to map as this center calculation requires projected coordinates
      if (!this._map) {
        throw new Error('Must add layer to map before using getCenter()');
      }

      var i,
          halfDist,
          segDist,
          dist,
          p1,
          p2,
          ratio,
          points = this._rings[0],
          len = points.length;

      if (!len) {
        return null;
      } // polyline centroid algorithm; only uses the first ring if there are multiple


      for (i = 0, halfDist = 0; i < len - 1; i++) {
        halfDist += points[i].distanceTo(points[i + 1]) / 2;
      } // The line is so small in the current view that all points are on the same pixel.


      if (halfDist === 0) {
        return this._map.layerPointToLatLng(points[0]);
      }

      for (i = 0, dist = 0; i < len - 1; i++) {
        p1 = points[i];
        p2 = points[i + 1];
        segDist = p1.distanceTo(p2);
        dist += segDist;

        if (dist > halfDist) {
          ratio = (dist - halfDist) / segDist;
          return this._map.layerPointToLatLng([p2.x - ratio * (p2.x - p1.x), p2.y - ratio * (p2.y - p1.y)]);
        }
      }
    },
    // @method getBounds(): LatLngBounds
    // Returns the `LatLngBounds` of the path.
    getBounds: function getBounds() {
      return this._bounds;
    },
    // @method addLatLng(latlng: LatLng, latlngs?: LatLng[]): this
    // Adds a given point to the polyline. By default, adds to the first ring of
    // the polyline in case of a multi-polyline, but can be overridden by passing
    // a specific ring as a LatLng array (that you can earlier access with [`getLatLngs`](#polyline-getlatlngs)).
    addLatLng: function addLatLng(latlng, latlngs) {
      latlngs = latlngs || this._defaultShape();
      latlng = toLatLng(latlng);
      latlngs.push(latlng);

      this._bounds.extend(latlng);

      return this.redraw();
    },
    _setLatLngs: function _setLatLngs(latlngs) {
      this._bounds = new LatLngBounds();
      this._latlngs = this._convertLatLngs(latlngs);
    },
    _defaultShape: function _defaultShape() {
      return isFlat(this._latlngs) ? this._latlngs : this._latlngs[0];
    },
    // recursively convert latlngs input into actual LatLng instances; calculate bounds along the way
    _convertLatLngs: function _convertLatLngs(latlngs) {
      var result = [],
          flat = isFlat(latlngs);

      for (var i = 0, len = latlngs.length; i < len; i++) {
        if (flat) {
          result[i] = toLatLng(latlngs[i]);

          this._bounds.extend(result[i]);
        } else {
          result[i] = this._convertLatLngs(latlngs[i]);
        }
      }

      return result;
    },
    _project: function _project() {
      var pxBounds = new Bounds();
      this._rings = [];

      this._projectLatlngs(this._latlngs, this._rings, pxBounds);

      if (this._bounds.isValid() && pxBounds.isValid()) {
        this._rawPxBounds = pxBounds;

        this._updateBounds();
      }
    },
    _updateBounds: function _updateBounds() {
      var w = this._clickTolerance(),
          p = new Point(w, w);

      if (!this._rawPxBounds) {
        return;
      }

      this._pxBounds = new Bounds([this._rawPxBounds.min.subtract(p), this._rawPxBounds.max.add(p)]);
    },
    // recursively turns latlngs into a set of rings with projected coordinates
    _projectLatlngs: function _projectLatlngs(latlngs, result, projectedBounds) {
      var flat = latlngs[0] instanceof LatLng,
          len = latlngs.length,
          i,
          ring;

      if (flat) {
        ring = [];

        for (i = 0; i < len; i++) {
          ring[i] = this._map.latLngToLayerPoint(latlngs[i]);
          projectedBounds.extend(ring[i]);
        }

        result.push(ring);
      } else {
        for (i = 0; i < len; i++) {
          this._projectLatlngs(latlngs[i], result, projectedBounds);
        }
      }
    },
    // clip polyline by renderer bounds so that we have less to render for performance
    _clipPoints: function _clipPoints() {
      var bounds = this._renderer._bounds;
      this._parts = [];

      if (!this._pxBounds || !this._pxBounds.intersects(bounds)) {
        return;
      }

      if (this.options.noClip) {
        this._parts = this._rings;
        return;
      }

      var parts = this._parts,
          i,
          j,
          k,
          len,
          len2,
          segment,
          points;

      for (i = 0, k = 0, len = this._rings.length; i < len; i++) {
        points = this._rings[i];

        for (j = 0, len2 = points.length; j < len2 - 1; j++) {
          segment = clipSegment(points[j], points[j + 1], bounds, j, true);

          if (!segment) {
            continue;
          }

          parts[k] = parts[k] || [];
          parts[k].push(segment[0]); // if segment goes out of screen, or it's the last one, it's the end of the line part

          if (segment[1] !== points[j + 1] || j === len2 - 2) {
            parts[k].push(segment[1]);
            k++;
          }
        }
      }
    },
    // simplify each clipped part of the polyline for performance
    _simplifyPoints: function _simplifyPoints() {
      var parts = this._parts,
          tolerance = this.options.smoothFactor;

      for (var i = 0, len = parts.length; i < len; i++) {
        parts[i] = simplify(parts[i], tolerance);
      }
    },
    _update: function _update() {
      if (!this._map) {
        return;
      }

      this._clipPoints();

      this._simplifyPoints();

      this._updatePath();
    },
    _updatePath: function _updatePath() {
      this._renderer._updatePoly(this);
    },
    // Needed by the `Canvas` renderer for interactivity
    _containsPoint: function _containsPoint(p, closed) {
      var i,
          j,
          k,
          len,
          len2,
          part,
          w = this._clickTolerance();

      if (!this._pxBounds || !this._pxBounds.contains(p)) {
        return false;
      } // hit detection for polylines


      for (i = 0, len = this._parts.length; i < len; i++) {
        part = this._parts[i];

        for (j = 0, len2 = part.length, k = len2 - 1; j < len2; k = j++) {
          if (!closed && j === 0) {
            continue;
          }

          if (pointToSegmentDistance(p, part[k], part[j]) <= w) {
            return true;
          }
        }
      }

      return false;
    }
  }); // @factory L.polyline(latlngs: LatLng[], options?: Polyline options)
  // Instantiates a polyline object given an array of geographical points and
  // optionally an options object. You can create a `Polyline` object with
  // multiple separate lines (`MultiPolyline`) by passing an array of arrays
  // of geographic points.

  function polyline(latlngs, options) {
    return new Polyline(latlngs, options);
  } // Retrocompat. Allow plugins to support Leaflet versions before and after 1.1.


  Polyline._flat = _flat;
  /*
   * @class Polygon
   * @aka L.Polygon
   * @inherits Polyline
   *
   * A class for drawing polygon overlays on a map. Extends `Polyline`.
   *
   * Note that points you pass when creating a polygon shouldn't have an additional last point equal to the first one — it's better to filter out such points.
   *
   *
   * @example
   *
   * ```js
   * // create a red polygon from an array of LatLng points
   * var latlngs = [[37, -109.05],[41, -109.03],[41, -102.05],[37, -102.04]];
   *
   * var polygon = L.polygon(latlngs, {color: 'red'}).addTo(map);
   *
   * // zoom the map to the polygon
   * map.fitBounds(polygon.getBounds());
   * ```
   *
   * You can also pass an array of arrays of latlngs, with the first array representing the outer shape and the other arrays representing holes in the outer shape:
   *
   * ```js
   * var latlngs = [
   *   [[37, -109.05],[41, -109.03],[41, -102.05],[37, -102.04]], // outer ring
   *   [[37.29, -108.58],[40.71, -108.58],[40.71, -102.50],[37.29, -102.50]] // hole
   * ];
   * ```
   *
   * Additionally, you can pass a multi-dimensional array to represent a MultiPolygon shape.
   *
   * ```js
   * var latlngs = [
   *   [ // first polygon
   *     [[37, -109.05],[41, -109.03],[41, -102.05],[37, -102.04]], // outer ring
   *     [[37.29, -108.58],[40.71, -108.58],[40.71, -102.50],[37.29, -102.50]] // hole
   *   ],
   *   [ // second polygon
   *     [[41, -111.03],[45, -111.04],[45, -104.05],[41, -104.05]]
   *   ]
   * ];
   * ```
   */

  var Polygon = Polyline.extend({
    options: {
      fill: true
    },
    isEmpty: function isEmpty() {
      return !this._latlngs.length || !this._latlngs[0].length;
    },
    getCenter: function getCenter() {
      // throws error when not yet added to map as this center calculation requires projected coordinates
      if (!this._map) {
        throw new Error('Must add layer to map before using getCenter()');
      }

      var i,
          j,
          p1,
          p2,
          f,
          area,
          x,
          y,
          center,
          points = this._rings[0],
          len = points.length;

      if (!len) {
        return null;
      } // polygon centroid algorithm; only uses the first ring if there are multiple


      area = x = y = 0;

      for (i = 0, j = len - 1; i < len; j = i++) {
        p1 = points[i];
        p2 = points[j];
        f = p1.y * p2.x - p2.y * p1.x;
        x += (p1.x + p2.x) * f;
        y += (p1.y + p2.y) * f;
        area += f * 3;
      }

      if (area === 0) {
        // Polygon is so small that all points are on same pixel.
        center = points[0];
      } else {
        center = [x / area, y / area];
      }

      return this._map.layerPointToLatLng(center);
    },
    _convertLatLngs: function _convertLatLngs(latlngs) {
      var result = Polyline.prototype._convertLatLngs.call(this, latlngs),
          len = result.length; // remove last point if it equals first one


      if (len >= 2 && result[0] instanceof LatLng && result[0].equals(result[len - 1])) {
        result.pop();
      }

      return result;
    },
    _setLatLngs: function _setLatLngs(latlngs) {
      Polyline.prototype._setLatLngs.call(this, latlngs);

      if (isFlat(this._latlngs)) {
        this._latlngs = [this._latlngs];
      }
    },
    _defaultShape: function _defaultShape() {
      return isFlat(this._latlngs[0]) ? this._latlngs[0] : this._latlngs[0][0];
    },
    _clipPoints: function _clipPoints() {
      // polygons need a different clipping algorithm so we redefine that
      var bounds = this._renderer._bounds,
          w = this.options.weight,
          p = new Point(w, w); // increase clip padding by stroke width to avoid stroke on clip edges

      bounds = new Bounds(bounds.min.subtract(p), bounds.max.add(p));
      this._parts = [];

      if (!this._pxBounds || !this._pxBounds.intersects(bounds)) {
        return;
      }

      if (this.options.noClip) {
        this._parts = this._rings;
        return;
      }

      for (var i = 0, len = this._rings.length, clipped; i < len; i++) {
        clipped = clipPolygon(this._rings[i], bounds, true);

        if (clipped.length) {
          this._parts.push(clipped);
        }
      }
    },
    _updatePath: function _updatePath() {
      this._renderer._updatePoly(this, true);
    },
    // Needed by the `Canvas` renderer for interactivity
    _containsPoint: function _containsPoint(p) {
      var inside = false,
          part,
          p1,
          p2,
          i,
          j,
          k,
          len,
          len2;

      if (!this._pxBounds || !this._pxBounds.contains(p)) {
        return false;
      } // ray casting algorithm for detecting if point is in polygon


      for (i = 0, len = this._parts.length; i < len; i++) {
        part = this._parts[i];

        for (j = 0, len2 = part.length, k = len2 - 1; j < len2; k = j++) {
          p1 = part[j];
          p2 = part[k];

          if (p1.y > p.y !== p2.y > p.y && p.x < (p2.x - p1.x) * (p.y - p1.y) / (p2.y - p1.y) + p1.x) {
            inside = !inside;
          }
        }
      } // also check if it's on polygon stroke


      return inside || Polyline.prototype._containsPoint.call(this, p, true);
    }
  }); // @factory L.polygon(latlngs: LatLng[], options?: Polyline options)

  function polygon(latlngs, options) {
    return new Polygon(latlngs, options);
  }
  /*
   * @class GeoJSON
   * @aka L.GeoJSON
   * @inherits FeatureGroup
   *
   * Represents a GeoJSON object or an array of GeoJSON objects. Allows you to parse
   * GeoJSON data and display it on the map. Extends `FeatureGroup`.
   *
   * @example
   *
   * ```js
   * L.geoJSON(data, {
   * 	style: function (feature) {
   * 		return {color: feature.properties.color};
   * 	}
   * }).bindPopup(function (layer) {
   * 	return layer.feature.properties.description;
   * }).addTo(map);
   * ```
   */


  var GeoJSON = FeatureGroup.extend({
    /* @section
     * @aka GeoJSON options
     *
     * @option pointToLayer: Function = *
     * A `Function` defining how GeoJSON points spawn Leaflet layers. It is internally
     * called when data is added, passing the GeoJSON point feature and its `LatLng`.
     * The default is to spawn a default `Marker`:
     * ```js
     * function(geoJsonPoint, latlng) {
     * 	return L.marker(latlng);
     * }
     * ```
     *
     * @option style: Function = *
     * A `Function` defining the `Path options` for styling GeoJSON lines and polygons,
     * called internally when data is added.
     * The default value is to not override any defaults:
     * ```js
     * function (geoJsonFeature) {
     * 	return {}
     * }
     * ```
     *
     * @option onEachFeature: Function = *
     * A `Function` that will be called once for each created `Feature`, after it has
     * been created and styled. Useful for attaching events and popups to features.
     * The default is to do nothing with the newly created layers:
     * ```js
     * function (feature, layer) {}
     * ```
     *
     * @option filter: Function = *
     * A `Function` that will be used to decide whether to include a feature or not.
     * The default is to include all features:
     * ```js
     * function (geoJsonFeature) {
     * 	return true;
     * }
     * ```
     * Note: dynamically changing the `filter` option will have effect only on newly
     * added data. It will _not_ re-evaluate already included features.
     *
     * @option coordsToLatLng: Function = *
     * A `Function` that will be used for converting GeoJSON coordinates to `LatLng`s.
     * The default is the `coordsToLatLng` static method.
     *
     * @option markersInheritOptions: Boolean = false
     * Whether default Markers for "Point" type Features inherit from group options.
     */
    initialize: function initialize(geojson, options) {
      setOptions(this, options);
      this._layers = {};

      if (geojson) {
        this.addData(geojson);
      }
    },
    // @method addData( <GeoJSON> data ): this
    // Adds a GeoJSON object to the layer.
    addData: function addData(geojson) {
      var features = isArray(geojson) ? geojson : geojson.features,
          i,
          len,
          feature;

      if (features) {
        for (i = 0, len = features.length; i < len; i++) {
          // only add this if geometry or geometries are set and not null
          feature = features[i];

          if (feature.geometries || feature.geometry || feature.features || feature.coordinates) {
            this.addData(feature);
          }
        }

        return this;
      }

      var options = this.options;

      if (options.filter && !options.filter(geojson)) {
        return this;
      }

      var layer = geometryToLayer(geojson, options);

      if (!layer) {
        return this;
      }

      layer.feature = asFeature(geojson);
      layer.defaultOptions = layer.options;
      this.resetStyle(layer);

      if (options.onEachFeature) {
        options.onEachFeature(geojson, layer);
      }

      return this.addLayer(layer);
    },
    // @method resetStyle( <Path> layer? ): this
    // Resets the given vector layer's style to the original GeoJSON style, useful for resetting style after hover events.
    // If `layer` is omitted, the style of all features in the current layer is reset.
    resetStyle: function resetStyle(layer) {
      if (layer === undefined) {
        return this.eachLayer(this.resetStyle, this);
      } // reset any custom styles


      layer.options = extend({}, layer.defaultOptions);

      this._setLayerStyle(layer, this.options.style);

      return this;
    },
    // @method setStyle( <Function> style ): this
    // Changes styles of GeoJSON vector layers with the given style function.
    setStyle: function setStyle(style) {
      return this.eachLayer(function (layer) {
        this._setLayerStyle(layer, style);
      }, this);
    },
    _setLayerStyle: function _setLayerStyle(layer, style) {
      if (layer.setStyle) {
        if (typeof style === 'function') {
          style = style(layer.feature);
        }

        layer.setStyle(style);
      }
    }
  }); // @section
  // There are several static functions which can be called without instantiating L.GeoJSON:
  // @function geometryToLayer(featureData: Object, options?: GeoJSON options): Layer
  // Creates a `Layer` from a given GeoJSON feature. Can use a custom
  // [`pointToLayer`](#geojson-pointtolayer) and/or [`coordsToLatLng`](#geojson-coordstolatlng)
  // functions if provided as options.

  function geometryToLayer(geojson, options) {
    var geometry = geojson.type === 'Feature' ? geojson.geometry : geojson,
        coords = geometry ? geometry.coordinates : null,
        layers = [],
        pointToLayer = options && options.pointToLayer,
        _coordsToLatLng = options && options.coordsToLatLng || coordsToLatLng,
        latlng,
        latlngs,
        i,
        len;

    if (!coords && !geometry) {
      return null;
    }

    switch (geometry.type) {
      case 'Point':
        latlng = _coordsToLatLng(coords);
        return _pointToLayer(pointToLayer, geojson, latlng, options);

      case 'MultiPoint':
        for (i = 0, len = coords.length; i < len; i++) {
          latlng = _coordsToLatLng(coords[i]);
          layers.push(_pointToLayer(pointToLayer, geojson, latlng, options));
        }

        return new FeatureGroup(layers);

      case 'LineString':
      case 'MultiLineString':
        latlngs = coordsToLatLngs(coords, geometry.type === 'LineString' ? 0 : 1, _coordsToLatLng);
        return new Polyline(latlngs, options);

      case 'Polygon':
      case 'MultiPolygon':
        latlngs = coordsToLatLngs(coords, geometry.type === 'Polygon' ? 1 : 2, _coordsToLatLng);
        return new Polygon(latlngs, options);

      case 'GeometryCollection':
        for (i = 0, len = geometry.geometries.length; i < len; i++) {
          var layer = geometryToLayer({
            geometry: geometry.geometries[i],
            type: 'Feature',
            properties: geojson.properties
          }, options);

          if (layer) {
            layers.push(layer);
          }
        }

        return new FeatureGroup(layers);

      default:
        throw new Error('Invalid GeoJSON object.');
    }
  }

  function _pointToLayer(pointToLayerFn, geojson, latlng, options) {
    return pointToLayerFn ? pointToLayerFn(geojson, latlng) : new Marker(latlng, options && options.markersInheritOptions && options);
  } // @function coordsToLatLng(coords: Array): LatLng
  // Creates a `LatLng` object from an array of 2 numbers (longitude, latitude)
  // or 3 numbers (longitude, latitude, altitude) used in GeoJSON for points.


  function coordsToLatLng(coords) {
    return new LatLng(coords[1], coords[0], coords[2]);
  } // @function coordsToLatLngs(coords: Array, levelsDeep?: Number, coordsToLatLng?: Function): Array
  // Creates a multidimensional array of `LatLng`s from a GeoJSON coordinates array.
  // `levelsDeep` specifies the nesting level (0 is for an array of points, 1 for an array of arrays of points, etc., 0 by default).
  // Can use a custom [`coordsToLatLng`](#geojson-coordstolatlng) function.


  function coordsToLatLngs(coords, levelsDeep, _coordsToLatLng) {
    var latlngs = [];

    for (var i = 0, len = coords.length, latlng; i < len; i++) {
      latlng = levelsDeep ? coordsToLatLngs(coords[i], levelsDeep - 1, _coordsToLatLng) : (_coordsToLatLng || coordsToLatLng)(coords[i]);
      latlngs.push(latlng);
    }

    return latlngs;
  } // @function latLngToCoords(latlng: LatLng, precision?: Number|false): Array
  // Reverse of [`coordsToLatLng`](#geojson-coordstolatlng)
  // Coordinates values are rounded with [`formatNum`](#util-formatnum) function.


  function latLngToCoords(latlng, precision) {
    latlng = toLatLng(latlng);
    return latlng.alt !== undefined ? [formatNum(latlng.lng, precision), formatNum(latlng.lat, precision), formatNum(latlng.alt, precision)] : [formatNum(latlng.lng, precision), formatNum(latlng.lat, precision)];
  } // @function latLngsToCoords(latlngs: Array, levelsDeep?: Number, closed?: Boolean, precision?: Number|false): Array
  // Reverse of [`coordsToLatLngs`](#geojson-coordstolatlngs)
  // `closed` determines whether the first point should be appended to the end of the array to close the feature, only used when `levelsDeep` is 0. False by default.
  // Coordinates values are rounded with [`formatNum`](#util-formatnum) function.


  function latLngsToCoords(latlngs, levelsDeep, closed, precision) {
    var coords = [];

    for (var i = 0, len = latlngs.length; i < len; i++) {
      coords.push(levelsDeep ? latLngsToCoords(latlngs[i], levelsDeep - 1, closed, precision) : latLngToCoords(latlngs[i], precision));
    }

    if (!levelsDeep && closed) {
      coords.push(coords[0]);
    }

    return coords;
  }

  function getFeature(layer, newGeometry) {
    return layer.feature ? extend({}, layer.feature, {
      geometry: newGeometry
    }) : asFeature(newGeometry);
  } // @function asFeature(geojson: Object): Object
  // Normalize GeoJSON geometries/features into GeoJSON features.


  function asFeature(geojson) {
    if (geojson.type === 'Feature' || geojson.type === 'FeatureCollection') {
      return geojson;
    }

    return {
      type: 'Feature',
      properties: {},
      geometry: geojson
    };
  }

  var PointToGeoJSON = {
    toGeoJSON: function toGeoJSON(precision) {
      return getFeature(this, {
        type: 'Point',
        coordinates: latLngToCoords(this.getLatLng(), precision)
      });
    }
  }; // @namespace Marker
  // @section Other methods
  // @method toGeoJSON(precision?: Number|false): Object
  // Coordinates values are rounded with [`formatNum`](#util-formatnum) function with given `precision`.
  // Returns a [`GeoJSON`](https://en.wikipedia.org/wiki/GeoJSON) representation of the marker (as a GeoJSON `Point` Feature).

  Marker.include(PointToGeoJSON); // @namespace CircleMarker
  // @method toGeoJSON(precision?: Number|false): Object
  // Coordinates values are rounded with [`formatNum`](#util-formatnum) function with given `precision`.
  // Returns a [`GeoJSON`](https://en.wikipedia.org/wiki/GeoJSON) representation of the circle marker (as a GeoJSON `Point` Feature).

  Circle.include(PointToGeoJSON);
  CircleMarker.include(PointToGeoJSON); // @namespace Polyline
  // @method toGeoJSON(precision?: Number|false): Object
  // Coordinates values are rounded with [`formatNum`](#util-formatnum) function with given `precision`.
  // Returns a [`GeoJSON`](https://en.wikipedia.org/wiki/GeoJSON) representation of the polyline (as a GeoJSON `LineString` or `MultiLineString` Feature).

  Polyline.include({
    toGeoJSON: function toGeoJSON(precision) {
      var multi = !isFlat(this._latlngs);
      var coords = latLngsToCoords(this._latlngs, multi ? 1 : 0, false, precision);
      return getFeature(this, {
        type: (multi ? 'Multi' : '') + 'LineString',
        coordinates: coords
      });
    }
  }); // @namespace Polygon
  // @method toGeoJSON(precision?: Number|false): Object
  // Coordinates values are rounded with [`formatNum`](#util-formatnum) function with given `precision`.
  // Returns a [`GeoJSON`](https://en.wikipedia.org/wiki/GeoJSON) representation of the polygon (as a GeoJSON `Polygon` or `MultiPolygon` Feature).

  Polygon.include({
    toGeoJSON: function toGeoJSON(precision) {
      var holes = !isFlat(this._latlngs),
          multi = holes && !isFlat(this._latlngs[0]);
      var coords = latLngsToCoords(this._latlngs, multi ? 2 : holes ? 1 : 0, true, precision);

      if (!holes) {
        coords = [coords];
      }

      return getFeature(this, {
        type: (multi ? 'Multi' : '') + 'Polygon',
        coordinates: coords
      });
    }
  }); // @namespace LayerGroup

  LayerGroup.include({
    toMultiPoint: function toMultiPoint(precision) {
      var coords = [];
      this.eachLayer(function (layer) {
        coords.push(layer.toGeoJSON(precision).geometry.coordinates);
      });
      return getFeature(this, {
        type: 'MultiPoint',
        coordinates: coords
      });
    },
    // @method toGeoJSON(precision?: Number|false): Object
    // Coordinates values are rounded with [`formatNum`](#util-formatnum) function with given `precision`.
    // Returns a [`GeoJSON`](https://en.wikipedia.org/wiki/GeoJSON) representation of the layer group (as a GeoJSON `FeatureCollection`, `GeometryCollection`, or `MultiPoint`).
    toGeoJSON: function toGeoJSON(precision) {
      var type = this.feature && this.feature.geometry && this.feature.geometry.type;

      if (type === 'MultiPoint') {
        return this.toMultiPoint(precision);
      }

      var isGeometryCollection = type === 'GeometryCollection',
          jsons = [];
      this.eachLayer(function (layer) {
        if (layer.toGeoJSON) {
          var json = layer.toGeoJSON(precision);

          if (isGeometryCollection) {
            jsons.push(json.geometry);
          } else {
            var feature = asFeature(json); // Squash nested feature collections

            if (feature.type === 'FeatureCollection') {
              jsons.push.apply(jsons, feature.features);
            } else {
              jsons.push(feature);
            }
          }
        }
      });

      if (isGeometryCollection) {
        return getFeature(this, {
          geometries: jsons,
          type: 'GeometryCollection'
        });
      }

      return {
        type: 'FeatureCollection',
        features: jsons
      };
    }
  }); // @namespace GeoJSON
  // @factory L.geoJSON(geojson?: Object, options?: GeoJSON options)
  // Creates a GeoJSON layer. Optionally accepts an object in
  // [GeoJSON format](https://tools.ietf.org/html/rfc7946) to display on the map
  // (you can alternatively add it later with `addData` method) and an `options` object.

  function geoJSON(geojson, options) {
    return new GeoJSON(geojson, options);
  } // Backward compatibility.


  var geoJson = geoJSON;
  /*
   * @class ImageOverlay
   * @aka L.ImageOverlay
   * @inherits Interactive layer
   *
   * Used to load and display a single image over specific bounds of the map. Extends `Layer`.
   *
   * @example
   *
   * ```js
   * var imageUrl = 'https://maps.lib.utexas.edu/maps/historical/newark_nj_1922.jpg',
   * 	imageBounds = [[40.712216, -74.22655], [40.773941, -74.12544]];
   * L.imageOverlay(imageUrl, imageBounds).addTo(map);
   * ```
   */

  var ImageOverlay = Layer.extend({
    // @section
    // @aka ImageOverlay options
    options: {
      // @option opacity: Number = 1.0
      // The opacity of the image overlay.
      opacity: 1,
      // @option alt: String = ''
      // Text for the `alt` attribute of the image (useful for accessibility).
      alt: '',
      // @option interactive: Boolean = false
      // If `true`, the image overlay will emit [mouse events](#interactive-layer) when clicked or hovered.
      interactive: false,
      // @option crossOrigin: Boolean|String = false
      // Whether the crossOrigin attribute will be added to the image.
      // If a String is provided, the image will have its crossOrigin attribute set to the String provided. This is needed if you want to access image pixel data.
      // Refer to [CORS Settings](https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_settings_attributes) for valid String values.
      crossOrigin: false,
      // @option errorOverlayUrl: String = ''
      // URL to the overlay image to show in place of the overlay that failed to load.
      errorOverlayUrl: '',
      // @option zIndex: Number = 1
      // The explicit [zIndex](https://developer.mozilla.org/docs/Web/CSS/CSS_Positioning/Understanding_z_index) of the overlay layer.
      zIndex: 1,
      // @option className: String = ''
      // A custom class name to assign to the image. Empty by default.
      className: ''
    },
    initialize: function initialize(url, bounds, options) {
      // (String, LatLngBounds, Object)
      this._url = url;
      this._bounds = toLatLngBounds(bounds);
      setOptions(this, options);
    },
    onAdd: function onAdd() {
      if (!this._image) {
        this._initImage();

        if (this.options.opacity < 1) {
          this._updateOpacity();
        }
      }

      if (this.options.interactive) {
        addClass(this._image, 'leaflet-interactive');
        this.addInteractiveTarget(this._image);
      }

      this.getPane().appendChild(this._image);

      this._reset();
    },
    onRemove: function onRemove() {
      _remove(this._image);

      if (this.options.interactive) {
        this.removeInteractiveTarget(this._image);
      }
    },
    // @method setOpacity(opacity: Number): this
    // Sets the opacity of the overlay.
    setOpacity: function setOpacity(opacity) {
      this.options.opacity = opacity;

      if (this._image) {
        this._updateOpacity();
      }

      return this;
    },
    setStyle: function setStyle(styleOpts) {
      if (styleOpts.opacity) {
        this.setOpacity(styleOpts.opacity);
      }

      return this;
    },
    // @method bringToFront(): this
    // Brings the layer to the top of all overlays.
    bringToFront: function bringToFront() {
      if (this._map) {
        toFront(this._image);
      }

      return this;
    },
    // @method bringToBack(): this
    // Brings the layer to the bottom of all overlays.
    bringToBack: function bringToBack() {
      if (this._map) {
        toBack(this._image);
      }

      return this;
    },
    // @method setUrl(url: String): this
    // Changes the URL of the image.
    setUrl: function setUrl(url) {
      this._url = url;

      if (this._image) {
        this._image.src = url;
      }

      return this;
    },
    // @method setBounds(bounds: LatLngBounds): this
    // Update the bounds that this ImageOverlay covers
    setBounds: function setBounds(bounds) {
      this._bounds = toLatLngBounds(bounds);

      if (this._map) {
        this._reset();
      }

      return this;
    },
    getEvents: function getEvents() {
      var events = {
        zoom: this._reset,
        viewreset: this._reset
      };

      if (this._zoomAnimated) {
        events.zoomanim = this._animateZoom;
      }

      return events;
    },
    // @method setZIndex(value: Number): this
    // Changes the [zIndex](#imageoverlay-zindex) of the image overlay.
    setZIndex: function setZIndex(value) {
      this.options.zIndex = value;

      this._updateZIndex();

      return this;
    },
    // @method getBounds(): LatLngBounds
    // Get the bounds that this ImageOverlay covers
    getBounds: function getBounds() {
      return this._bounds;
    },
    // @method getElement(): HTMLElement
    // Returns the instance of [`HTMLImageElement`](https://developer.mozilla.org/docs/Web/API/HTMLImageElement)
    // used by this overlay.
    getElement: function getElement() {
      return this._image;
    },
    _initImage: function _initImage() {
      var wasElementSupplied = this._url.tagName === 'IMG';
      var img = this._image = wasElementSupplied ? this._url : create$1('img');
      addClass(img, 'leaflet-image-layer');

      if (this._zoomAnimated) {
        addClass(img, 'leaflet-zoom-animated');
      }

      if (this.options.className) {
        addClass(img, this.options.className);
      }

      img.onselectstart = falseFn;
      img.onmousemove = falseFn; // @event load: Event
      // Fired when the ImageOverlay layer has loaded its image

      img.onload = bind(this.fire, this, 'load');
      img.onerror = bind(this._overlayOnError, this, 'error');

      if (this.options.crossOrigin || this.options.crossOrigin === '') {
        img.crossOrigin = this.options.crossOrigin === true ? '' : this.options.crossOrigin;
      }

      if (this.options.zIndex) {
        this._updateZIndex();
      }

      if (wasElementSupplied) {
        this._url = img.src;
        return;
      }

      img.src = this._url;
      img.alt = this.options.alt;
    },
    _animateZoom: function _animateZoom(e) {
      var scale = this._map.getZoomScale(e.zoom),
          offset = this._map._latLngBoundsToNewLayerBounds(this._bounds, e.zoom, e.center).min;

      setTransform(this._image, offset, scale);
    },
    _reset: function _reset() {
      var image = this._image,
          bounds = new Bounds(this._map.latLngToLayerPoint(this._bounds.getNorthWest()), this._map.latLngToLayerPoint(this._bounds.getSouthEast())),
          size = bounds.getSize();
      setPosition(image, bounds.min);
      image.style.width = size.x + 'px';
      image.style.height = size.y + 'px';
    },
    _updateOpacity: function _updateOpacity() {
      _setOpacity(this._image, this.options.opacity);
    },
    _updateZIndex: function _updateZIndex() {
      if (this._image && this.options.zIndex !== undefined && this.options.zIndex !== null) {
        this._image.style.zIndex = this.options.zIndex;
      }
    },
    _overlayOnError: function _overlayOnError() {
      // @event error: Event
      // Fired when the ImageOverlay layer fails to load its image
      this.fire('error');
      var errorUrl = this.options.errorOverlayUrl;

      if (errorUrl && this._url !== errorUrl) {
        this._url = errorUrl;
        this._image.src = errorUrl;
      }
    },
    // @method getCenter(): LatLng
    // Returns the center of the ImageOverlay.
    getCenter: function getCenter() {
      return this._bounds.getCenter();
    }
  }); // @factory L.imageOverlay(imageUrl: String, bounds: LatLngBounds, options?: ImageOverlay options)
  // Instantiates an image overlay object given the URL of the image and the
  // geographical bounds it is tied to.

  var imageOverlay = function imageOverlay(url, bounds, options) {
    return new ImageOverlay(url, bounds, options);
  };
  /*
   * @class VideoOverlay
   * @aka L.VideoOverlay
   * @inherits ImageOverlay
   *
   * Used to load and display a video player over specific bounds of the map. Extends `ImageOverlay`.
   *
   * A video overlay uses the [`<video>`](https://developer.mozilla.org/docs/Web/HTML/Element/video)
   * HTML5 element.
   *
   * @example
   *
   * ```js
   * var videoUrl = 'https://www.mapbox.com/bites/00188/patricia_nasa.webm',
   * 	videoBounds = [[ 32, -130], [ 13, -100]];
   * L.videoOverlay(videoUrl, videoBounds ).addTo(map);
   * ```
   */


  var VideoOverlay = ImageOverlay.extend({
    // @section
    // @aka VideoOverlay options
    options: {
      // @option autoplay: Boolean = true
      // Whether the video starts playing automatically when loaded.
      // On some browsers autoplay will only work with `muted: true`
      autoplay: true,
      // @option loop: Boolean = true
      // Whether the video will loop back to the beginning when played.
      loop: true,
      // @option keepAspectRatio: Boolean = true
      // Whether the video will save aspect ratio after the projection.
      // Relevant for supported browsers. See [browser compatibility](https://developer.mozilla.org/en-US/docs/Web/CSS/object-fit)
      keepAspectRatio: true,
      // @option muted: Boolean = false
      // Whether the video starts on mute when loaded.
      muted: false,
      // @option playsInline: Boolean = true
      // Mobile browsers will play the video right where it is instead of open it up in fullscreen mode.
      playsInline: true
    },
    _initImage: function _initImage() {
      var wasElementSupplied = this._url.tagName === 'VIDEO';
      var vid = this._image = wasElementSupplied ? this._url : create$1('video');
      addClass(vid, 'leaflet-image-layer');

      if (this._zoomAnimated) {
        addClass(vid, 'leaflet-zoom-animated');
      }

      if (this.options.className) {
        addClass(vid, this.options.className);
      }

      vid.onselectstart = falseFn;
      vid.onmousemove = falseFn; // @event load: Event
      // Fired when the video has finished loading the first frame

      vid.onloadeddata = bind(this.fire, this, 'load');

      if (wasElementSupplied) {
        var sourceElements = vid.getElementsByTagName('source');
        var sources = [];

        for (var j = 0; j < sourceElements.length; j++) {
          sources.push(sourceElements[j].src);
        }

        this._url = sourceElements.length > 0 ? sources : [vid.src];
        return;
      }

      if (!isArray(this._url)) {
        this._url = [this._url];
      }

      if (!this.options.keepAspectRatio && Object.prototype.hasOwnProperty.call(vid.style, 'objectFit')) {
        vid.style['objectFit'] = 'fill';
      }

      vid.autoplay = !!this.options.autoplay;
      vid.loop = !!this.options.loop;
      vid.muted = !!this.options.muted;
      vid.playsInline = !!this.options.playsInline;

      for (var i = 0; i < this._url.length; i++) {
        var source = create$1('source');
        source.src = this._url[i];
        vid.appendChild(source);
      }
    } // @method getElement(): HTMLVideoElement
    // Returns the instance of [`HTMLVideoElement`](https://developer.mozilla.org/docs/Web/API/HTMLVideoElement)
    // used by this overlay.

  }); // @factory L.videoOverlay(video: String|Array|HTMLVideoElement, bounds: LatLngBounds, options?: VideoOverlay options)
  // Instantiates an image overlay object given the URL of the video (or array of URLs, or even a video element) and the
  // geographical bounds it is tied to.

  function videoOverlay(video, bounds, options) {
    return new VideoOverlay(video, bounds, options);
  }
  /*
   * @class SVGOverlay
   * @aka L.SVGOverlay
   * @inherits ImageOverlay
   *
   * Used to load, display and provide DOM access to an SVG file over specific bounds of the map. Extends `ImageOverlay`.
   *
   * An SVG overlay uses the [`<svg>`](https://developer.mozilla.org/docs/Web/SVG/Element/svg) element.
   *
   * @example
   *
   * ```js
   * var svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
   * svgElement.setAttribute('xmlns', "http://www.w3.org/2000/svg");
   * svgElement.setAttribute('viewBox', "0 0 200 200");
   * svgElement.innerHTML = '<rect width="200" height="200"/><rect x="75" y="23" width="50" height="50" style="fill:red"/><rect x="75" y="123" width="50" height="50" style="fill:#0013ff"/>';
   * var svgElementBounds = [ [ 32, -130 ], [ 13, -100 ] ];
   * L.svgOverlay(svgElement, svgElementBounds).addTo(map);
   * ```
   */


  var SVGOverlay = ImageOverlay.extend({
    _initImage: function _initImage() {
      var el = this._image = this._url;
      addClass(el, 'leaflet-image-layer');

      if (this._zoomAnimated) {
        addClass(el, 'leaflet-zoom-animated');
      }

      if (this.options.className) {
        addClass(el, this.options.className);
      }

      el.onselectstart = falseFn;
      el.onmousemove = falseFn;
    } // @method getElement(): SVGElement
    // Returns the instance of [`SVGElement`](https://developer.mozilla.org/docs/Web/API/SVGElement)
    // used by this overlay.

  }); // @factory L.svgOverlay(svg: String|SVGElement, bounds: LatLngBounds, options?: SVGOverlay options)
  // Instantiates an image overlay object given an SVG element and the geographical bounds it is tied to.
  // A viewBox attribute is required on the SVG element to zoom in and out properly.

  function svgOverlay(el, bounds, options) {
    return new SVGOverlay(el, bounds, options);
  }
  /*
   * @class DivOverlay
   * @inherits Interactive layer
   * @aka L.DivOverlay
   * Base model for L.Popup and L.Tooltip. Inherit from it for custom overlays like plugins.
   */
  // @namespace DivOverlay


  var DivOverlay = Layer.extend({
    // @section
    // @aka DivOverlay options
    options: {
      // @option interactive: Boolean = false
      // If true, the popup/tooltip will listen to the mouse events.
      interactive: false,
      // @option offset: Point = Point(0, 0)
      // The offset of the overlay position.
      offset: [0, 0],
      // @option className: String = ''
      // A custom CSS class name to assign to the overlay.
      className: '',
      // @option pane: String = undefined
      // `Map pane` where the overlay will be added.
      pane: undefined
    },
    initialize: function initialize(options, source) {
      setOptions(this, options);
      this._source = source;
    },
    // @method openOn(map: Map): this
    // Adds the overlay to the map.
    // Alternative to `map.openPopup(popup)`/`.openTooltip(tooltip)`.
    openOn: function openOn(map) {
      map = arguments.length ? map : this._source._map; // experimental, not the part of public api

      if (!map.hasLayer(this)) {
        map.addLayer(this);
      }

      return this;
    },
    // @method close(): this
    // Closes the overlay.
    // Alternative to `map.closePopup(popup)`/`.closeTooltip(tooltip)`
    // and `layer.closePopup()`/`.closeTooltip()`.
    close: function close() {
      if (this._map) {
        this._map.removeLayer(this);
      }

      return this;
    },
    // @method toggle(layer?: Layer): this
    // Opens or closes the overlay bound to layer depending on its current state.
    // Argument may be omitted only for overlay bound to layer.
    // Alternative to `layer.togglePopup()`/`.toggleTooltip()`.
    toggle: function toggle(layer) {
      if (this._map) {
        this.close();
      } else {
        if (arguments.length) {
          this._source = layer;
        } else {
          layer = this._source;
        }

        this._prepareOpen(); // open the overlay on the map


        this.openOn(layer._map);
      }

      return this;
    },
    onAdd: function onAdd(map) {
      this._zoomAnimated = map._zoomAnimated;

      if (!this._container) {
        this._initLayout();
      }

      if (map._fadeAnimated) {
        _setOpacity(this._container, 0);
      }

      clearTimeout(this._removeTimeout);
      this.getPane().appendChild(this._container);
      this.update();

      if (map._fadeAnimated) {
        _setOpacity(this._container, 1);
      }

      this.bringToFront();

      if (this.options.interactive) {
        addClass(this._container, 'leaflet-interactive');
        this.addInteractiveTarget(this._container);
      }
    },
    onRemove: function onRemove(map) {
      if (map._fadeAnimated) {
        _setOpacity(this._container, 0);

        this._removeTimeout = setTimeout(bind(_remove, undefined, this._container), 200);
      } else {
        _remove(this._container);
      }

      if (this.options.interactive) {
        removeClass(this._container, 'leaflet-interactive');
        this.removeInteractiveTarget(this._container);
      }
    },
    // @namespace DivOverlay
    // @method getLatLng: LatLng
    // Returns the geographical point of the overlay.
    getLatLng: function getLatLng() {
      return this._latlng;
    },
    // @method setLatLng(latlng: LatLng): this
    // Sets the geographical point where the overlay will open.
    setLatLng: function setLatLng(latlng) {
      this._latlng = toLatLng(latlng);

      if (this._map) {
        this._updatePosition();

        this._adjustPan();
      }

      return this;
    },
    // @method getContent: String|HTMLElement
    // Returns the content of the overlay.
    getContent: function getContent() {
      return this._content;
    },
    // @method setContent(htmlContent: String|HTMLElement|Function): this
    // Sets the HTML content of the overlay. If a function is passed the source layer will be passed to the function.
    // The function should return a `String` or `HTMLElement` to be used in the overlay.
    setContent: function setContent(content) {
      this._content = content;
      this.update();
      return this;
    },
    // @method getElement: String|HTMLElement
    // Returns the HTML container of the overlay.
    getElement: function getElement() {
      return this._container;
    },
    // @method update: null
    // Updates the overlay content, layout and position. Useful for updating the overlay after something inside changed, e.g. image loaded.
    update: function update() {
      if (!this._map) {
        return;
      }

      this._container.style.visibility = 'hidden';

      this._updateContent();

      this._updateLayout();

      this._updatePosition();

      this._container.style.visibility = '';

      this._adjustPan();
    },
    getEvents: function getEvents() {
      var events = {
        zoom: this._updatePosition,
        viewreset: this._updatePosition
      };

      if (this._zoomAnimated) {
        events.zoomanim = this._animateZoom;
      }

      return events;
    },
    // @method isOpen: Boolean
    // Returns `true` when the overlay is visible on the map.
    isOpen: function isOpen() {
      return !!this._map && this._map.hasLayer(this);
    },
    // @method bringToFront: this
    // Brings this overlay in front of other overlays (in the same map pane).
    bringToFront: function bringToFront() {
      if (this._map) {
        toFront(this._container);
      }

      return this;
    },
    // @method bringToBack: this
    // Brings this overlay to the back of other overlays (in the same map pane).
    bringToBack: function bringToBack() {
      if (this._map) {
        toBack(this._container);
      }

      return this;
    },
    // prepare bound overlay to open: update latlng pos / content source (for FeatureGroup)
    _prepareOpen: function _prepareOpen(latlng) {
      var source = this._source;

      if (!source._map) {
        return false;
      }

      if (source instanceof FeatureGroup) {
        source = null;
        var layers = this._source._layers;

        for (var id in layers) {
          if (layers[id]._map) {
            source = layers[id];
            break;
          }
        }

        if (!source) {
          return false;
        } // Unable to get source layer.
        // set overlay source to this layer


        this._source = source;
      }

      if (!latlng) {
        if (source.getCenter) {
          latlng = source.getCenter();
        } else if (source.getLatLng) {
          latlng = source.getLatLng();
        } else if (source.getBounds) {
          latlng = source.getBounds().getCenter();
        } else {
          throw new Error('Unable to get source layer LatLng.');
        }
      }

      this.setLatLng(latlng);

      if (this._map) {
        // update the overlay (content, layout, etc...)
        this.update();
      }

      return true;
    },
    _updateContent: function _updateContent() {
      if (!this._content) {
        return;
      }

      var node = this._contentNode;
      var content = typeof this._content === 'function' ? this._content(this._source || this) : this._content;

      if (typeof content === 'string') {
        node.innerHTML = content;
      } else {
        while (node.hasChildNodes()) {
          node.removeChild(node.firstChild);
        }

        node.appendChild(content);
      } // @namespace DivOverlay
      // @section DivOverlay events
      // @event contentupdate: Event
      // Fired when the content of the overlay is updated


      this.fire('contentupdate');
    },
    _updatePosition: function _updatePosition() {
      if (!this._map) {
        return;
      }

      var pos = this._map.latLngToLayerPoint(this._latlng),
          offset = toPoint(this.options.offset),
          anchor = this._getAnchor();

      if (this._zoomAnimated) {
        setPosition(this._container, pos.add(anchor));
      } else {
        offset = offset.add(pos).add(anchor);
      }

      var bottom = this._containerBottom = -offset.y,
          left = this._containerLeft = -Math.round(this._containerWidth / 2) + offset.x; // bottom position the overlay in case the height of the overlay changes (images loading etc)

      this._container.style.bottom = bottom + 'px';
      this._container.style.left = left + 'px';
    },
    _getAnchor: function _getAnchor() {
      return [0, 0];
    }
  });
  Map.include({
    _initOverlay: function _initOverlay(OverlayClass, content, latlng, options) {
      var overlay = content;

      if (!(overlay instanceof OverlayClass)) {
        overlay = new OverlayClass(options).setContent(content);
      }

      if (latlng) {
        overlay.setLatLng(latlng);
      }

      return overlay;
    }
  });
  Layer.include({
    _initOverlay: function _initOverlay(OverlayClass, old, content, options) {
      var overlay = content;

      if (overlay instanceof OverlayClass) {
        setOptions(overlay, options);
        overlay._source = this;
      } else {
        overlay = old && !options ? old : new OverlayClass(options, this);
        overlay.setContent(content);
      }

      return overlay;
    }
  });
  /*
   * @class Popup
   * @inherits DivOverlay
   * @aka L.Popup
   * Used to open popups in certain places of the map. Use [Map.openPopup](#map-openpopup) to
   * open popups while making sure that only one popup is open at one time
   * (recommended for usability), or use [Map.addLayer](#map-addlayer) to open as many as you want.
   *
   * @example
   *
   * If you want to just bind a popup to marker click and then open it, it's really easy:
   *
   * ```js
   * marker.bindPopup(popupContent).openPopup();
   * ```
   * Path overlays like polylines also have a `bindPopup` method.
   * Here's a more complicated way to open a popup on a map:
   *
   * ```js
   * var popup = L.popup()
   * 	.setLatLng(latlng)
   * 	.setContent('<p>Hello world!<br />This is a nice popup.</p>')
   * 	.openOn(map);
   * ```
   */
  // @namespace Popup

  var Popup = DivOverlay.extend({
    // @section
    // @aka Popup options
    options: {
      // @option pane: String = 'popupPane'
      // `Map pane` where the popup will be added.
      pane: 'popupPane',
      // @option offset: Point = Point(0, 7)
      // The offset of the popup position.
      offset: [0, 7],
      // @option maxWidth: Number = 300
      // Max width of the popup, in pixels.
      maxWidth: 300,
      // @option minWidth: Number = 50
      // Min width of the popup, in pixels.
      minWidth: 50,
      // @option maxHeight: Number = null
      // If set, creates a scrollable container of the given height
      // inside a popup if its content exceeds it.
      maxHeight: null,
      // @option autoPan: Boolean = true
      // Set it to `false` if you don't want the map to do panning animation
      // to fit the opened popup.
      autoPan: true,
      // @option autoPanPaddingTopLeft: Point = null
      // The margin between the popup and the top left corner of the map
      // view after autopanning was performed.
      autoPanPaddingTopLeft: null,
      // @option autoPanPaddingBottomRight: Point = null
      // The margin between the popup and the bottom right corner of the map
      // view after autopanning was performed.
      autoPanPaddingBottomRight: null,
      // @option autoPanPadding: Point = Point(5, 5)
      // Equivalent of setting both top left and bottom right autopan padding to the same value.
      autoPanPadding: [5, 5],
      // @option keepInView: Boolean = false
      // Set it to `true` if you want to prevent users from panning the popup
      // off of the screen while it is open.
      keepInView: false,
      // @option closeButton: Boolean = true
      // Controls the presence of a close button in the popup.
      closeButton: true,
      // @option autoClose: Boolean = true
      // Set it to `false` if you want to override the default behavior of
      // the popup closing when another popup is opened.
      autoClose: true,
      // @option closeOnEscapeKey: Boolean = true
      // Set it to `false` if you want to override the default behavior of
      // the ESC key for closing of the popup.
      closeOnEscapeKey: true,
      // @option closeOnClick: Boolean = *
      // Set it if you want to override the default behavior of the popup closing when user clicks
      // on the map. Defaults to the map's [`closePopupOnClick`](#map-closepopuponclick) option.
      // @option className: String = ''
      // A custom CSS class name to assign to the popup.
      className: ''
    },
    // @namespace Popup
    // @method openOn(map: Map): this
    // Alternative to `map.openPopup(popup)`.
    // Adds the popup to the map and closes the previous one.
    openOn: function openOn(map) {
      map = arguments.length ? map : this._source._map; // experimental, not the part of public api

      if (!map.hasLayer(this) && map._popup && map._popup.options.autoClose) {
        map.removeLayer(map._popup);
      }

      map._popup = this;
      return DivOverlay.prototype.openOn.call(this, map);
    },
    onAdd: function onAdd(map) {
      DivOverlay.prototype.onAdd.call(this, map); // @namespace Map
      // @section Popup events
      // @event popupopen: PopupEvent
      // Fired when a popup is opened in the map

      map.fire('popupopen', {
        popup: this
      });

      if (this._source) {
        // @namespace Layer
        // @section Popup events
        // @event popupopen: PopupEvent
        // Fired when a popup bound to this layer is opened
        this._source.fire('popupopen', {
          popup: this
        }, true); // For non-path layers, we toggle the popup when clicking
        // again the layer, so prevent the map to reopen it.


        if (!(this._source instanceof Path)) {
          this._source.on('preclick', stopPropagation);
        }
      }
    },
    onRemove: function onRemove(map) {
      DivOverlay.prototype.onRemove.call(this, map); // @namespace Map
      // @section Popup events
      // @event popupclose: PopupEvent
      // Fired when a popup in the map is closed

      map.fire('popupclose', {
        popup: this
      });

      if (this._source) {
        // @namespace Layer
        // @section Popup events
        // @event popupclose: PopupEvent
        // Fired when a popup bound to this layer is closed
        this._source.fire('popupclose', {
          popup: this
        }, true);

        if (!(this._source instanceof Path)) {
          this._source.off('preclick', stopPropagation);
        }
      }
    },
    getEvents: function getEvents() {
      var events = DivOverlay.prototype.getEvents.call(this);

      if (this.options.closeOnClick !== undefined ? this.options.closeOnClick : this._map.options.closePopupOnClick) {
        events.preclick = this.close;
      }

      if (this.options.keepInView) {
        events.moveend = this._adjustPan;
      }

      return events;
    },
    _initLayout: function _initLayout() {
      var prefix = 'leaflet-popup',
          container = this._container = create$1('div', prefix + ' ' + (this.options.className || '') + ' leaflet-zoom-animated');
      var wrapper = this._wrapper = create$1('div', prefix + '-content-wrapper', container);
      this._contentNode = create$1('div', prefix + '-content', wrapper);
      disableClickPropagation(container);
      disableScrollPropagation(this._contentNode);
      on(container, 'contextmenu', stopPropagation);
      this._tipContainer = create$1('div', prefix + '-tip-container', container);
      this._tip = create$1('div', prefix + '-tip', this._tipContainer);

      if (this.options.closeButton) {
        var closeButton = this._closeButton = create$1('a', prefix + '-close-button', container);
        closeButton.setAttribute('role', 'button'); // overrides the implicit role=link of <a> elements #7399

        closeButton.setAttribute('aria-label', 'Close popup');
        closeButton.href = '#close';
        closeButton.innerHTML = '<span aria-hidden="true">&#215;</span>';
        on(closeButton, 'click', this.close, this);
      }
    },
    _updateLayout: function _updateLayout() {
      var container = this._contentNode,
          style = container.style;
      style.width = '';
      style.whiteSpace = 'nowrap';
      var width = container.offsetWidth;
      width = Math.min(width, this.options.maxWidth);
      width = Math.max(width, this.options.minWidth);
      style.width = width + 1 + 'px';
      style.whiteSpace = '';
      style.height = '';
      var height = container.offsetHeight,
          maxHeight = this.options.maxHeight,
          scrolledClass = 'leaflet-popup-scrolled';

      if (maxHeight && height > maxHeight) {
        style.height = maxHeight + 'px';
        addClass(container, scrolledClass);
      } else {
        removeClass(container, scrolledClass);
      }

      this._containerWidth = this._container.offsetWidth;
    },
    _animateZoom: function _animateZoom(e) {
      var pos = this._map._latLngToNewLayerPoint(this._latlng, e.zoom, e.center),
          anchor = this._getAnchor();

      setPosition(this._container, pos.add(anchor));
    },
    _adjustPan: function _adjustPan(e) {
      if (!this.options.autoPan) {
        return;
      }

      if (this._map._panAnim) {
        this._map._panAnim.stop();
      }

      var map = this._map,
          marginBottom = parseInt(getStyle(this._container, 'marginBottom'), 10) || 0,
          containerHeight = this._container.offsetHeight + marginBottom,
          containerWidth = this._containerWidth,
          layerPos = new Point(this._containerLeft, -containerHeight - this._containerBottom);

      layerPos._add(getPosition(this._container));

      var containerPos = map.layerPointToContainerPoint(layerPos),
          padding = toPoint(this.options.autoPanPadding),
          paddingTL = toPoint(this.options.autoPanPaddingTopLeft || padding),
          paddingBR = toPoint(this.options.autoPanPaddingBottomRight || padding),
          size = map.getSize(),
          dx = 0,
          dy = 0;

      if (containerPos.x + containerWidth + paddingBR.x > size.x) {
        // right
        dx = containerPos.x + containerWidth - size.x + paddingBR.x;
      }

      if (containerPos.x - dx - paddingTL.x < 0) {
        // left
        dx = containerPos.x - paddingTL.x;
      }

      if (containerPos.y + containerHeight + paddingBR.y > size.y) {
        // bottom
        dy = containerPos.y + containerHeight - size.y + paddingBR.y;
      }

      if (containerPos.y - dy - paddingTL.y < 0) {
        // top
        dy = containerPos.y - paddingTL.y;
      } // @namespace Map
      // @section Popup events
      // @event autopanstart: Event
      // Fired when the map starts autopanning when opening a popup.


      if (dx || dy) {
        map.fire('autopanstart').panBy([dx, dy], {
          animate: e && e.type === 'moveend'
        });
      }
    },
    _getAnchor: function _getAnchor() {
      // Where should we anchor the popup on the source layer?
      return toPoint(this._source && this._source._getPopupAnchor ? this._source._getPopupAnchor() : [0, 0]);
    }
  }); // @namespace Popup
  // @factory L.popup(options?: Popup options, source?: Layer)
  // Instantiates a `Popup` object given an optional `options` object that describes its appearance and location and an optional `source` object that is used to tag the popup with a reference to the Layer to which it refers.

  var popup = function popup(options, source) {
    return new Popup(options, source);
  };
  /* @namespace Map
   * @section Interaction Options
   * @option closePopupOnClick: Boolean = true
   * Set it to `false` if you don't want popups to close when user clicks the map.
   */


  Map.mergeOptions({
    closePopupOnClick: true
  }); // @namespace Map
  // @section Methods for Layers and Controls

  Map.include({
    // @method openPopup(popup: Popup): this
    // Opens the specified popup while closing the previously opened (to make sure only one is opened at one time for usability).
    // @alternative
    // @method openPopup(content: String|HTMLElement, latlng: LatLng, options?: Popup options): this
    // Creates a popup with the specified content and options and opens it in the given point on a map.
    openPopup: function openPopup(popup, latlng, options) {
      this._initOverlay(Popup, popup, latlng, options).openOn(this);

      return this;
    },
    // @method closePopup(popup?: Popup): this
    // Closes the popup previously opened with [openPopup](#map-openpopup) (or the given one).
    closePopup: function closePopup(popup) {
      popup = arguments.length ? popup : this._popup;

      if (popup) {
        popup.close();
      }

      return this;
    }
  });
  /*
   * @namespace Layer
   * @section Popup methods example
   *
   * All layers share a set of methods convenient for binding popups to it.
   *
   * ```js
   * var layer = L.Polygon(latlngs).bindPopup('Hi There!').addTo(map);
   * layer.openPopup();
   * layer.closePopup();
   * ```
   *
   * Popups will also be automatically opened when the layer is clicked on and closed when the layer is removed from the map or another popup is opened.
   */
  // @section Popup methods

  Layer.include({
    // @method bindPopup(content: String|HTMLElement|Function|Popup, options?: Popup options): this
    // Binds a popup to the layer with the passed `content` and sets up the
    // necessary event listeners. If a `Function` is passed it will receive
    // the layer as the first argument and should return a `String` or `HTMLElement`.
    bindPopup: function bindPopup(content, options) {
      this._popup = this._initOverlay(Popup, this._popup, content, options);

      if (!this._popupHandlersAdded) {
        this.on({
          click: this._openPopup,
          keypress: this._onKeyPress,
          remove: this.closePopup,
          move: this._movePopup
        });
        this._popupHandlersAdded = true;
      }

      return this;
    },
    // @method unbindPopup(): this
    // Removes the popup previously bound with `bindPopup`.
    unbindPopup: function unbindPopup() {
      if (this._popup) {
        this.off({
          click: this._openPopup,
          keypress: this._onKeyPress,
          remove: this.closePopup,
          move: this._movePopup
        });
        this._popupHandlersAdded = false;
        this._popup = null;
      }

      return this;
    },
    // @method openPopup(latlng?: LatLng): this
    // Opens the bound popup at the specified `latlng` or at the default popup anchor if no `latlng` is passed.
    openPopup: function openPopup(latlng) {
      if (this._popup && this._popup._prepareOpen(latlng)) {
        // open the popup on the map
        this._popup.openOn(this._map);
      }

      return this;
    },
    // @method closePopup(): this
    // Closes the popup bound to this layer if it is open.
    closePopup: function closePopup() {
      if (this._popup) {
        this._popup.close();
      }

      return this;
    },
    // @method togglePopup(): this
    // Opens or closes the popup bound to this layer depending on its current state.
    togglePopup: function togglePopup() {
      if (this._popup) {
        this._popup.toggle(this);
      }

      return this;
    },
    // @method isPopupOpen(): boolean
    // Returns `true` if the popup bound to this layer is currently open.
    isPopupOpen: function isPopupOpen() {
      return this._popup ? this._popup.isOpen() : false;
    },
    // @method setPopupContent(content: String|HTMLElement|Popup): this
    // Sets the content of the popup bound to this layer.
    setPopupContent: function setPopupContent(content) {
      if (this._popup) {
        this._popup.setContent(content);
      }

      return this;
    },
    // @method getPopup(): Popup
    // Returns the popup bound to this layer.
    getPopup: function getPopup() {
      return this._popup;
    },
    _openPopup: function _openPopup(e) {
      if (!this._popup || !this._map) {
        return;
      } // prevent map click


      stop(e);
      var target = e.layer || e.target;

      if (this._popup._source === target && !(target instanceof Path)) {
        // treat it like a marker and figure out
        // if we should toggle it open/closed
        if (this._map.hasLayer(this._popup)) {
          this.closePopup();
        } else {
          this.openPopup(e.latlng);
        }

        return;
      }

      this._popup._source = target;
      this.openPopup(e.latlng);
    },
    _movePopup: function _movePopup(e) {
      this._popup.setLatLng(e.latlng);
    },
    _onKeyPress: function _onKeyPress(e) {
      if (e.originalEvent.keyCode === 13) {
        this._openPopup(e);
      }
    }
  });
  /*
   * @class Tooltip
   * @inherits DivOverlay
   * @aka L.Tooltip
   * Used to display small texts on top of map layers.
   *
   * @example
   *
   * ```js
   * marker.bindTooltip("my tooltip text").openTooltip();
   * ```
   * Note about tooltip offset. Leaflet takes two options in consideration
   * for computing tooltip offsetting:
   * - the `offset` Tooltip option: it defaults to [0, 0], and it's specific to one tooltip.
   *   Add a positive x offset to move the tooltip to the right, and a positive y offset to
   *   move it to the bottom. Negatives will move to the left and top.
   * - the `tooltipAnchor` Icon option: this will only be considered for Marker. You
   *   should adapt this value if you use a custom icon.
   */
  // @namespace Tooltip

  var Tooltip = DivOverlay.extend({
    // @section
    // @aka Tooltip options
    options: {
      // @option pane: String = 'tooltipPane'
      // `Map pane` where the tooltip will be added.
      pane: 'tooltipPane',
      // @option offset: Point = Point(0, 0)
      // Optional offset of the tooltip position.
      offset: [0, 0],
      // @option direction: String = 'auto'
      // Direction where to open the tooltip. Possible values are: `right`, `left`,
      // `top`, `bottom`, `center`, `auto`.
      // `auto` will dynamically switch between `right` and `left` according to the tooltip
      // position on the map.
      direction: 'auto',
      // @option permanent: Boolean = false
      // Whether to open the tooltip permanently or only on mouseover.
      permanent: false,
      // @option sticky: Boolean = false
      // If true, the tooltip will follow the mouse instead of being fixed at the feature center.
      sticky: false,
      // @option opacity: Number = 0.9
      // Tooltip container opacity.
      opacity: 0.9
    },
    onAdd: function onAdd(map) {
      DivOverlay.prototype.onAdd.call(this, map);
      this.setOpacity(this.options.opacity); // @namespace Map
      // @section Tooltip events
      // @event tooltipopen: TooltipEvent
      // Fired when a tooltip is opened in the map.

      map.fire('tooltipopen', {
        tooltip: this
      });

      if (this._source) {
        this.addEventParent(this._source); // @namespace Layer
        // @section Tooltip events
        // @event tooltipopen: TooltipEvent
        // Fired when a tooltip bound to this layer is opened.

        this._source.fire('tooltipopen', {
          tooltip: this
        }, true);
      }
    },
    onRemove: function onRemove(map) {
      DivOverlay.prototype.onRemove.call(this, map); // @namespace Map
      // @section Tooltip events
      // @event tooltipclose: TooltipEvent
      // Fired when a tooltip in the map is closed.

      map.fire('tooltipclose', {
        tooltip: this
      });

      if (this._source) {
        this.removeEventParent(this._source); // @namespace Layer
        // @section Tooltip events
        // @event tooltipclose: TooltipEvent
        // Fired when a tooltip bound to this layer is closed.

        this._source.fire('tooltipclose', {
          tooltip: this
        }, true);
      }
    },
    getEvents: function getEvents() {
      var events = DivOverlay.prototype.getEvents.call(this);

      if (!this.options.permanent) {
        events.preclick = this.close;
      }

      return events;
    },
    _initLayout: function _initLayout() {
      var prefix = 'leaflet-tooltip',
          className = prefix + ' ' + (this.options.className || '') + ' leaflet-zoom-' + (this._zoomAnimated ? 'animated' : 'hide');
      this._contentNode = this._container = create$1('div', className);
    },
    _updateLayout: function _updateLayout() {},
    _adjustPan: function _adjustPan() {},
    _setPosition: function _setPosition(pos) {
      var subX,
          subY,
          map = this._map,
          container = this._container,
          centerPoint = map.latLngToContainerPoint(map.getCenter()),
          tooltipPoint = map.layerPointToContainerPoint(pos),
          direction = this.options.direction,
          tooltipWidth = container.offsetWidth,
          tooltipHeight = container.offsetHeight,
          offset = toPoint(this.options.offset),
          anchor = this._getAnchor();

      if (direction === 'top') {
        subX = tooltipWidth / 2;
        subY = tooltipHeight;
      } else if (direction === 'bottom') {
        subX = tooltipWidth / 2;
        subY = 0;
      } else if (direction === 'center') {
        subX = tooltipWidth / 2;
        subY = tooltipHeight / 2;
      } else if (direction === 'right') {
        subX = 0;
        subY = tooltipHeight / 2;
      } else if (direction === 'left') {
        subX = tooltipWidth;
        subY = tooltipHeight / 2;
      } else if (tooltipPoint.x < centerPoint.x) {
        direction = 'right';
        subX = 0;
        subY = tooltipHeight / 2;
      } else {
        direction = 'left';
        subX = tooltipWidth + (offset.x + anchor.x) * 2;
        subY = tooltipHeight / 2;
      }

      pos = pos.subtract(toPoint(subX, subY, true)).add(offset).add(anchor);
      removeClass(container, 'leaflet-tooltip-right');
      removeClass(container, 'leaflet-tooltip-left');
      removeClass(container, 'leaflet-tooltip-top');
      removeClass(container, 'leaflet-tooltip-bottom');
      addClass(container, 'leaflet-tooltip-' + direction);
      setPosition(container, pos);
    },
    _updatePosition: function _updatePosition() {
      var pos = this._map.latLngToLayerPoint(this._latlng);

      this._setPosition(pos);
    },
    setOpacity: function setOpacity(opacity) {
      this.options.opacity = opacity;

      if (this._container) {
        _setOpacity(this._container, opacity);
      }
    },
    _animateZoom: function _animateZoom(e) {
      var pos = this._map._latLngToNewLayerPoint(this._latlng, e.zoom, e.center);

      this._setPosition(pos);
    },
    _getAnchor: function _getAnchor() {
      // Where should we anchor the tooltip on the source layer?
      return toPoint(this._source && this._source._getTooltipAnchor && !this.options.sticky ? this._source._getTooltipAnchor() : [0, 0]);
    }
  }); // @namespace Tooltip
  // @factory L.tooltip(options?: Tooltip options, source?: Layer)
  // Instantiates a Tooltip object given an optional `options` object that describes its appearance and location and an optional `source` object that is used to tag the tooltip with a reference to the Layer to which it refers.

  var tooltip = function tooltip(options, source) {
    return new Tooltip(options, source);
  }; // @namespace Map
  // @section Methods for Layers and Controls


  Map.include({
    // @method openTooltip(tooltip: Tooltip): this
    // Opens the specified tooltip.
    // @alternative
    // @method openTooltip(content: String|HTMLElement, latlng: LatLng, options?: Tooltip options): this
    // Creates a tooltip with the specified content and options and open it.
    openTooltip: function openTooltip(tooltip, latlng, options) {
      this._initOverlay(Tooltip, tooltip, latlng, options).openOn(this);

      return this;
    },
    // @method closeTooltip(tooltip: Tooltip): this
    // Closes the tooltip given as parameter.
    closeTooltip: function closeTooltip(tooltip) {
      tooltip.close();
      return this;
    }
  });
  /*
   * @namespace Layer
   * @section Tooltip methods example
   *
   * All layers share a set of methods convenient for binding tooltips to it.
   *
   * ```js
   * var layer = L.Polygon(latlngs).bindTooltip('Hi There!').addTo(map);
   * layer.openTooltip();
   * layer.closeTooltip();
   * ```
   */
  // @section Tooltip methods

  Layer.include({
    // @method bindTooltip(content: String|HTMLElement|Function|Tooltip, options?: Tooltip options): this
    // Binds a tooltip to the layer with the passed `content` and sets up the
    // necessary event listeners. If a `Function` is passed it will receive
    // the layer as the first argument and should return a `String` or `HTMLElement`.
    bindTooltip: function bindTooltip(content, options) {
      if (this._tooltip && this.isTooltipOpen()) {
        this.unbindTooltip();
      }

      this._tooltip = this._initOverlay(Tooltip, this._tooltip, content, options);

      this._initTooltipInteractions();

      if (this._tooltip.options.permanent && this._map && this._map.hasLayer(this)) {
        this.openTooltip();
      }

      return this;
    },
    // @method unbindTooltip(): this
    // Removes the tooltip previously bound with `bindTooltip`.
    unbindTooltip: function unbindTooltip() {
      if (this._tooltip) {
        this._initTooltipInteractions(true);

        this.closeTooltip();
        this._tooltip = null;
      }

      return this;
    },
    _initTooltipInteractions: function _initTooltipInteractions(remove) {
      if (!remove && this._tooltipHandlersAdded) {
        return;
      }

      var onOff = remove ? 'off' : 'on',
          events = {
        remove: this.closeTooltip,
        move: this._moveTooltip
      };

      if (!this._tooltip.options.permanent) {
        events.mouseover = this._openTooltip;
        events.mouseout = this.closeTooltip;
        events.click = this._openTooltip;
      } else {
        events.add = this._openTooltip;
      }

      if (this._tooltip.options.sticky) {
        events.mousemove = this._moveTooltip;
      }

      this[onOff](events);
      this._tooltipHandlersAdded = !remove;
    },
    // @method openTooltip(latlng?: LatLng): this
    // Opens the bound tooltip at the specified `latlng` or at the default tooltip anchor if no `latlng` is passed.
    openTooltip: function openTooltip(latlng) {
      if (this._tooltip && this._tooltip._prepareOpen(latlng)) {
        // open the tooltip on the map
        this._tooltip.openOn(this._map);
      }

      return this;
    },
    // @method closeTooltip(): this
    // Closes the tooltip bound to this layer if it is open.
    closeTooltip: function closeTooltip() {
      if (this._tooltip) {
        return this._tooltip.close();
      }
    },
    // @method toggleTooltip(): this
    // Opens or closes the tooltip bound to this layer depending on its current state.
    toggleTooltip: function toggleTooltip() {
      if (this._tooltip) {
        this._tooltip.toggle(this);
      }

      return this;
    },
    // @method isTooltipOpen(): boolean
    // Returns `true` if the tooltip bound to this layer is currently open.
    isTooltipOpen: function isTooltipOpen() {
      return this._tooltip.isOpen();
    },
    // @method setTooltipContent(content: String|HTMLElement|Tooltip): this
    // Sets the content of the tooltip bound to this layer.
    setTooltipContent: function setTooltipContent(content) {
      if (this._tooltip) {
        this._tooltip.setContent(content);
      }

      return this;
    },
    // @method getTooltip(): Tooltip
    // Returns the tooltip bound to this layer.
    getTooltip: function getTooltip() {
      return this._tooltip;
    },
    _openTooltip: function _openTooltip(e) {
      if (!this._tooltip || !this._map || this._map.dragging && this._map.dragging.moving()) {
        return;
      }

      this._tooltip._source = e.layer || e.target;
      this.openTooltip(this._tooltip.options.sticky ? e.latlng : undefined);
    },
    _moveTooltip: function _moveTooltip(e) {
      var latlng = e.latlng,
          containerPoint,
          layerPoint;

      if (this._tooltip.options.sticky && e.originalEvent) {
        containerPoint = this._map.mouseEventToContainerPoint(e.originalEvent);
        layerPoint = this._map.containerPointToLayerPoint(containerPoint);
        latlng = this._map.layerPointToLatLng(layerPoint);
      }

      this._tooltip.setLatLng(latlng);
    }
  });
  /*
   * @class DivIcon
   * @aka L.DivIcon
   * @inherits Icon
   *
   * Represents a lightweight icon for markers that uses a simple `<div>`
   * element instead of an image. Inherits from `Icon` but ignores the `iconUrl` and shadow options.
   *
   * @example
   * ```js
   * var myIcon = L.divIcon({className: 'my-div-icon'});
   * // you can set .my-div-icon styles in CSS
   *
   * L.marker([50.505, 30.57], {icon: myIcon}).addTo(map);
   * ```
   *
   * By default, it has a 'leaflet-div-icon' CSS class and is styled as a little white square with a shadow.
   */

  var DivIcon = Icon.extend({
    options: {
      // @section
      // @aka DivIcon options
      iconSize: [12, 12],
      // also can be set through CSS
      // iconAnchor: (Point),
      // popupAnchor: (Point),
      // @option html: String|HTMLElement = ''
      // Custom HTML code to put inside the div element, empty by default. Alternatively,
      // an instance of `HTMLElement`.
      html: false,
      // @option bgPos: Point = [0, 0]
      // Optional relative position of the background, in pixels
      bgPos: null,
      className: 'leaflet-div-icon'
    },
    createIcon: function createIcon(oldIcon) {
      var div = oldIcon && oldIcon.tagName === 'DIV' ? oldIcon : document.createElement('div'),
          options = this.options;

      if (options.html instanceof Element) {
        empty(div);
        div.appendChild(options.html);
      } else {
        div.innerHTML = options.html !== false ? options.html : '';
      }

      if (options.bgPos) {
        var bgPos = toPoint(options.bgPos);
        div.style.backgroundPosition = -bgPos.x + 'px ' + -bgPos.y + 'px';
      }

      this._setIconStyles(div, 'icon');

      return div;
    },
    createShadow: function createShadow() {
      return null;
    }
  }); // @factory L.divIcon(options: DivIcon options)
  // Creates a `DivIcon` instance with the given options.

  function divIcon(options) {
    return new DivIcon(options);
  }

  Icon.Default = IconDefault;
  /*
   * @class GridLayer
   * @inherits Layer
   * @aka L.GridLayer
   *
   * Generic class for handling a tiled grid of HTML elements. This is the base class for all tile layers and replaces `TileLayer.Canvas`.
   * GridLayer can be extended to create a tiled grid of HTML elements like `<canvas>`, `<img>` or `<div>`. GridLayer will handle creating and animating these DOM elements for you.
   *
   *
   * @section Synchronous usage
   * @example
   *
   * To create a custom layer, extend GridLayer and implement the `createTile()` method, which will be passed a `Point` object with the `x`, `y`, and `z` (zoom level) coordinates to draw your tile.
   *
   * ```js
   * var CanvasLayer = L.GridLayer.extend({
   *     createTile: function(coords){
   *         // create a <canvas> element for drawing
   *         var tile = L.DomUtil.create('canvas', 'leaflet-tile');
   *
   *         // setup tile width and height according to the options
   *         var size = this.getTileSize();
   *         tile.width = size.x;
   *         tile.height = size.y;
   *
   *         // get a canvas context and draw something on it using coords.x, coords.y and coords.z
   *         var ctx = tile.getContext('2d');
   *
   *         // return the tile so it can be rendered on screen
   *         return tile;
   *     }
   * });
   * ```
   *
   * @section Asynchronous usage
   * @example
   *
   * Tile creation can also be asynchronous, this is useful when using a third-party drawing library. Once the tile is finished drawing it can be passed to the `done()` callback.
   *
   * ```js
   * var CanvasLayer = L.GridLayer.extend({
   *     createTile: function(coords, done){
   *         var error;
   *
   *         // create a <canvas> element for drawing
   *         var tile = L.DomUtil.create('canvas', 'leaflet-tile');
   *
   *         // setup tile width and height according to the options
   *         var size = this.getTileSize();
   *         tile.width = size.x;
   *         tile.height = size.y;
   *
   *         // draw something asynchronously and pass the tile to the done() callback
   *         setTimeout(function() {
   *             done(error, tile);
   *         }, 1000);
   *
   *         return tile;
   *     }
   * });
   * ```
   *
   * @section
   */

  var GridLayer = Layer.extend({
    // @section
    // @aka GridLayer options
    options: {
      // @option tileSize: Number|Point = 256
      // Width and height of tiles in the grid. Use a number if width and height are equal, or `L.point(width, height)` otherwise.
      tileSize: 256,
      // @option opacity: Number = 1.0
      // Opacity of the tiles. Can be used in the `createTile()` function.
      opacity: 1,
      // @option updateWhenIdle: Boolean = (depends)
      // Load new tiles only when panning ends.
      // `true` by default on mobile browsers, in order to avoid too many requests and keep smooth navigation.
      // `false` otherwise in order to display new tiles _during_ panning, since it is easy to pan outside the
      // [`keepBuffer`](#gridlayer-keepbuffer) option in desktop browsers.
      updateWhenIdle: Browser.mobile,
      // @option updateWhenZooming: Boolean = true
      // By default, a smooth zoom animation (during a [touch zoom](#map-touchzoom) or a [`flyTo()`](#map-flyto)) will update grid layers every integer zoom level. Setting this option to `false` will update the grid layer only when the smooth animation ends.
      updateWhenZooming: true,
      // @option updateInterval: Number = 200
      // Tiles will not update more than once every `updateInterval` milliseconds when panning.
      updateInterval: 200,
      // @option zIndex: Number = 1
      // The explicit zIndex of the tile layer.
      zIndex: 1,
      // @option bounds: LatLngBounds = undefined
      // If set, tiles will only be loaded inside the set `LatLngBounds`.
      bounds: null,
      // @option minZoom: Number = 0
      // The minimum zoom level down to which this layer will be displayed (inclusive).
      minZoom: 0,
      // @option maxZoom: Number = undefined
      // The maximum zoom level up to which this layer will be displayed (inclusive).
      maxZoom: undefined,
      // @option maxNativeZoom: Number = undefined
      // Maximum zoom number the tile source has available. If it is specified,
      // the tiles on all zoom levels higher than `maxNativeZoom` will be loaded
      // from `maxNativeZoom` level and auto-scaled.
      maxNativeZoom: undefined,
      // @option minNativeZoom: Number = undefined
      // Minimum zoom number the tile source has available. If it is specified,
      // the tiles on all zoom levels lower than `minNativeZoom` will be loaded
      // from `minNativeZoom` level and auto-scaled.
      minNativeZoom: undefined,
      // @option noWrap: Boolean = false
      // Whether the layer is wrapped around the antimeridian. If `true`, the
      // GridLayer will only be displayed once at low zoom levels. Has no
      // effect when the [map CRS](#map-crs) doesn't wrap around. Can be used
      // in combination with [`bounds`](#gridlayer-bounds) to prevent requesting
      // tiles outside the CRS limits.
      noWrap: false,
      // @option pane: String = 'tilePane'
      // `Map pane` where the grid layer will be added.
      pane: 'tilePane',
      // @option className: String = ''
      // A custom class name to assign to the tile layer. Empty by default.
      className: '',
      // @option keepBuffer: Number = 2
      // When panning the map, keep this many rows and columns of tiles before unloading them.
      keepBuffer: 2
    },
    initialize: function initialize(options) {
      setOptions(this, options);
    },
    onAdd: function onAdd() {
      this._initContainer();

      this._levels = {};
      this._tiles = {};

      this._resetView(); // implicit _update() call

    },
    beforeAdd: function beforeAdd(map) {
      map._addZoomLimit(this);
    },
    onRemove: function onRemove(map) {
      this._removeAllTiles();

      _remove(this._container);

      map._removeZoomLimit(this);

      this._container = null;
      this._tileZoom = undefined;
    },
    // @method bringToFront: this
    // Brings the tile layer to the top of all tile layers.
    bringToFront: function bringToFront() {
      if (this._map) {
        toFront(this._container);

        this._setAutoZIndex(Math.max);
      }

      return this;
    },
    // @method bringToBack: this
    // Brings the tile layer to the bottom of all tile layers.
    bringToBack: function bringToBack() {
      if (this._map) {
        toBack(this._container);

        this._setAutoZIndex(Math.min);
      }

      return this;
    },
    // @method getContainer: HTMLElement
    // Returns the HTML element that contains the tiles for this layer.
    getContainer: function getContainer() {
      return this._container;
    },
    // @method setOpacity(opacity: Number): this
    // Changes the [opacity](#gridlayer-opacity) of the grid layer.
    setOpacity: function setOpacity(opacity) {
      this.options.opacity = opacity;

      this._updateOpacity();

      return this;
    },
    // @method setZIndex(zIndex: Number): this
    // Changes the [zIndex](#gridlayer-zindex) of the grid layer.
    setZIndex: function setZIndex(zIndex) {
      this.options.zIndex = zIndex;

      this._updateZIndex();

      return this;
    },
    // @method isLoading: Boolean
    // Returns `true` if any tile in the grid layer has not finished loading.
    isLoading: function isLoading() {
      return this._loading;
    },
    // @method redraw: this
    // Causes the layer to clear all the tiles and request them again.
    redraw: function redraw() {
      if (this._map) {
        this._removeAllTiles();

        var tileZoom = this._clampZoom(this._map.getZoom());

        if (tileZoom !== this._tileZoom) {
          this._tileZoom = tileZoom;

          this._updateLevels();
        }

        this._update();
      }

      return this;
    },
    getEvents: function getEvents() {
      var events = {
        viewprereset: this._invalidateAll,
        viewreset: this._resetView,
        zoom: this._resetView,
        moveend: this._onMoveEnd
      };

      if (!this.options.updateWhenIdle) {
        // update tiles on move, but not more often than once per given interval
        if (!this._onMove) {
          this._onMove = throttle(this._onMoveEnd, this.options.updateInterval, this);
        }

        events.move = this._onMove;
      }

      if (this._zoomAnimated) {
        events.zoomanim = this._animateZoom;
      }

      return events;
    },
    // @section Extension methods
    // Layers extending `GridLayer` shall reimplement the following method.
    // @method createTile(coords: Object, done?: Function): HTMLElement
    // Called only internally, must be overridden by classes extending `GridLayer`.
    // Returns the `HTMLElement` corresponding to the given `coords`. If the `done` callback
    // is specified, it must be called when the tile has finished loading and drawing.
    createTile: function createTile() {
      return document.createElement('div');
    },
    // @section
    // @method getTileSize: Point
    // Normalizes the [tileSize option](#gridlayer-tilesize) into a point. Used by the `createTile()` method.
    getTileSize: function getTileSize() {
      var s = this.options.tileSize;
      return s instanceof Point ? s : new Point(s, s);
    },
    _updateZIndex: function _updateZIndex() {
      if (this._container && this.options.zIndex !== undefined && this.options.zIndex !== null) {
        this._container.style.zIndex = this.options.zIndex;
      }
    },
    _setAutoZIndex: function _setAutoZIndex(compare) {
      // go through all other layers of the same pane, set zIndex to max + 1 (front) or min - 1 (back)
      var layers = this.getPane().children,
          edgeZIndex = -compare(-Infinity, Infinity); // -Infinity for max, Infinity for min

      for (var i = 0, len = layers.length, zIndex; i < len; i++) {
        zIndex = layers[i].style.zIndex;

        if (layers[i] !== this._container && zIndex) {
          edgeZIndex = compare(edgeZIndex, +zIndex);
        }
      }

      if (isFinite(edgeZIndex)) {
        this.options.zIndex = edgeZIndex + compare(-1, 1);

        this._updateZIndex();
      }
    },
    _updateOpacity: function _updateOpacity() {
      if (!this._map) {
        return;
      } // IE doesn't inherit filter opacity properly, so we're forced to set it on tiles


      if (Browser.ielt9) {
        return;
      }

      _setOpacity(this._container, this.options.opacity);

      var now = +new Date(),
          nextFrame = false,
          willPrune = false;

      for (var key in this._tiles) {
        var tile = this._tiles[key];

        if (!tile.current || !tile.loaded) {
          continue;
        }

        var fade = Math.min(1, (now - tile.loaded) / 200);

        _setOpacity(tile.el, fade);

        if (fade < 1) {
          nextFrame = true;
        } else {
          if (tile.active) {
            willPrune = true;
          } else {
            this._onOpaqueTile(tile);
          }

          tile.active = true;
        }
      }

      if (willPrune && !this._noPrune) {
        this._pruneTiles();
      }

      if (nextFrame) {
        cancelAnimFrame(this._fadeFrame);
        this._fadeFrame = requestAnimFrame(this._updateOpacity, this);
      }
    },
    _onOpaqueTile: falseFn,
    _initContainer: function _initContainer() {
      if (this._container) {
        return;
      }

      this._container = create$1('div', 'leaflet-layer ' + (this.options.className || ''));

      this._updateZIndex();

      if (this.options.opacity < 1) {
        this._updateOpacity();
      }

      this.getPane().appendChild(this._container);
    },
    _updateLevels: function _updateLevels() {
      var zoom = this._tileZoom,
          maxZoom = this.options.maxZoom;

      if (zoom === undefined) {
        return undefined;
      }

      for (var z in this._levels) {
        z = Number(z);

        if (this._levels[z].el.children.length || z === zoom) {
          this._levels[z].el.style.zIndex = maxZoom - Math.abs(zoom - z);

          this._onUpdateLevel(z);
        } else {
          _remove(this._levels[z].el);

          this._removeTilesAtZoom(z);

          this._onRemoveLevel(z);

          delete this._levels[z];
        }
      }

      var level = this._levels[zoom],
          map = this._map;

      if (!level) {
        level = this._levels[zoom] = {};
        level.el = create$1('div', 'leaflet-tile-container leaflet-zoom-animated', this._container);
        level.el.style.zIndex = maxZoom;
        level.origin = map.project(map.unproject(map.getPixelOrigin()), zoom).round();
        level.zoom = zoom;

        this._setZoomTransform(level, map.getCenter(), map.getZoom()); // force the browser to consider the newly added element for transition


        falseFn(level.el.offsetWidth);

        this._onCreateLevel(level);
      }

      this._level = level;
      return level;
    },
    _onUpdateLevel: falseFn,
    _onRemoveLevel: falseFn,
    _onCreateLevel: falseFn,
    _pruneTiles: function _pruneTiles() {
      if (!this._map) {
        return;
      }

      var key, tile;

      var zoom = this._map.getZoom();

      if (zoom > this.options.maxZoom || zoom < this.options.minZoom) {
        this._removeAllTiles();

        return;
      }

      for (key in this._tiles) {
        tile = this._tiles[key];
        tile.retain = tile.current;
      }

      for (key in this._tiles) {
        tile = this._tiles[key];

        if (tile.current && !tile.active) {
          var coords = tile.coords;

          if (!this._retainParent(coords.x, coords.y, coords.z, coords.z - 5)) {
            this._retainChildren(coords.x, coords.y, coords.z, coords.z + 2);
          }
        }
      }

      for (key in this._tiles) {
        if (!this._tiles[key].retain) {
          this._removeTile(key);
        }
      }
    },
    _removeTilesAtZoom: function _removeTilesAtZoom(zoom) {
      for (var key in this._tiles) {
        if (this._tiles[key].coords.z !== zoom) {
          continue;
        }

        this._removeTile(key);
      }
    },
    _removeAllTiles: function _removeAllTiles() {
      for (var key in this._tiles) {
        this._removeTile(key);
      }
    },
    _invalidateAll: function _invalidateAll() {
      for (var z in this._levels) {
        _remove(this._levels[z].el);

        this._onRemoveLevel(Number(z));

        delete this._levels[z];
      }

      this._removeAllTiles();

      this._tileZoom = undefined;
    },
    _retainParent: function _retainParent(x, y, z, minZoom) {
      var x2 = Math.floor(x / 2),
          y2 = Math.floor(y / 2),
          z2 = z - 1,
          coords2 = new Point(+x2, +y2);
      coords2.z = +z2;

      var key = this._tileCoordsToKey(coords2),
          tile = this._tiles[key];

      if (tile && tile.active) {
        tile.retain = true;
        return true;
      } else if (tile && tile.loaded) {
        tile.retain = true;
      }

      if (z2 > minZoom) {
        return this._retainParent(x2, y2, z2, minZoom);
      }

      return false;
    },
    _retainChildren: function _retainChildren(x, y, z, maxZoom) {
      for (var i = 2 * x; i < 2 * x + 2; i++) {
        for (var j = 2 * y; j < 2 * y + 2; j++) {
          var coords = new Point(i, j);
          coords.z = z + 1;

          var key = this._tileCoordsToKey(coords),
              tile = this._tiles[key];

          if (tile && tile.active) {
            tile.retain = true;
            continue;
          } else if (tile && tile.loaded) {
            tile.retain = true;
          }

          if (z + 1 < maxZoom) {
            this._retainChildren(i, j, z + 1, maxZoom);
          }
        }
      }
    },
    _resetView: function _resetView(e) {
      var animating = e && (e.pinch || e.flyTo);

      this._setView(this._map.getCenter(), this._map.getZoom(), animating, animating);
    },
    _animateZoom: function _animateZoom(e) {
      this._setView(e.center, e.zoom, true, e.noUpdate);
    },
    _clampZoom: function _clampZoom(zoom) {
      var options = this.options;

      if (undefined !== options.minNativeZoom && zoom < options.minNativeZoom) {
        return options.minNativeZoom;
      }

      if (undefined !== options.maxNativeZoom && options.maxNativeZoom < zoom) {
        return options.maxNativeZoom;
      }

      return zoom;
    },
    _setView: function _setView(center, zoom, noPrune, noUpdate) {
      var tileZoom = Math.round(zoom);

      if (this.options.maxZoom !== undefined && tileZoom > this.options.maxZoom || this.options.minZoom !== undefined && tileZoom < this.options.minZoom) {
        tileZoom = undefined;
      } else {
        tileZoom = this._clampZoom(tileZoom);
      }

      var tileZoomChanged = this.options.updateWhenZooming && tileZoom !== this._tileZoom;

      if (!noUpdate || tileZoomChanged) {
        this._tileZoom = tileZoom;

        if (this._abortLoading) {
          this._abortLoading();
        }

        this._updateLevels();

        this._resetGrid();

        if (tileZoom !== undefined) {
          this._update(center);
        }

        if (!noPrune) {
          this._pruneTiles();
        } // Flag to prevent _updateOpacity from pruning tiles during
        // a zoom anim or a pinch gesture


        this._noPrune = !!noPrune;
      }

      this._setZoomTransforms(center, zoom);
    },
    _setZoomTransforms: function _setZoomTransforms(center, zoom) {
      for (var i in this._levels) {
        this._setZoomTransform(this._levels[i], center, zoom);
      }
    },
    _setZoomTransform: function _setZoomTransform(level, center, zoom) {
      var scale = this._map.getZoomScale(zoom, level.zoom),
          translate = level.origin.multiplyBy(scale).subtract(this._map._getNewPixelOrigin(center, zoom)).round();

      if (Browser.any3d) {
        setTransform(level.el, translate, scale);
      } else {
        setPosition(level.el, translate);
      }
    },
    _resetGrid: function _resetGrid() {
      var map = this._map,
          crs = map.options.crs,
          tileSize = this._tileSize = this.getTileSize(),
          tileZoom = this._tileZoom;

      var bounds = this._map.getPixelWorldBounds(this._tileZoom);

      if (bounds) {
        this._globalTileRange = this._pxBoundsToTileRange(bounds);
      }

      this._wrapX = crs.wrapLng && !this.options.noWrap && [Math.floor(map.project([0, crs.wrapLng[0]], tileZoom).x / tileSize.x), Math.ceil(map.project([0, crs.wrapLng[1]], tileZoom).x / tileSize.y)];
      this._wrapY = crs.wrapLat && !this.options.noWrap && [Math.floor(map.project([crs.wrapLat[0], 0], tileZoom).y / tileSize.x), Math.ceil(map.project([crs.wrapLat[1], 0], tileZoom).y / tileSize.y)];
    },
    _onMoveEnd: function _onMoveEnd() {
      if (!this._map || this._map._animatingZoom) {
        return;
      }

      this._update();
    },
    _getTiledPixelBounds: function _getTiledPixelBounds(center) {
      var map = this._map,
          mapZoom = map._animatingZoom ? Math.max(map._animateToZoom, map.getZoom()) : map.getZoom(),
          scale = map.getZoomScale(mapZoom, this._tileZoom),
          pixelCenter = map.project(center, this._tileZoom).floor(),
          halfSize = map.getSize().divideBy(scale * 2);
      return new Bounds(pixelCenter.subtract(halfSize), pixelCenter.add(halfSize));
    },
    // Private method to load tiles in the grid's active zoom level according to map bounds
    _update: function _update(center) {
      var map = this._map;

      if (!map) {
        return;
      }

      var zoom = this._clampZoom(map.getZoom());

      if (center === undefined) {
        center = map.getCenter();
      }

      if (this._tileZoom === undefined) {
        return;
      } // if out of minzoom/maxzoom


      var pixelBounds = this._getTiledPixelBounds(center),
          tileRange = this._pxBoundsToTileRange(pixelBounds),
          tileCenter = tileRange.getCenter(),
          queue = [],
          margin = this.options.keepBuffer,
          noPruneRange = new Bounds(tileRange.getBottomLeft().subtract([margin, -margin]), tileRange.getTopRight().add([margin, -margin])); // Sanity check: panic if the tile range contains Infinity somewhere.


      if (!(isFinite(tileRange.min.x) && isFinite(tileRange.min.y) && isFinite(tileRange.max.x) && isFinite(tileRange.max.y))) {
        throw new Error('Attempted to load an infinite number of tiles');
      }

      for (var key in this._tiles) {
        var c = this._tiles[key].coords;

        if (c.z !== this._tileZoom || !noPruneRange.contains(new Point(c.x, c.y))) {
          this._tiles[key].current = false;
        }
      } // _update just loads more tiles. If the tile zoom level differs too much
      // from the map's, let _setView reset levels and prune old tiles.


      if (Math.abs(zoom - this._tileZoom) > 1) {
        this._setView(center, zoom);

        return;
      } // create a queue of coordinates to load tiles from


      for (var j = tileRange.min.y; j <= tileRange.max.y; j++) {
        for (var i = tileRange.min.x; i <= tileRange.max.x; i++) {
          var coords = new Point(i, j);
          coords.z = this._tileZoom;

          if (!this._isValidTile(coords)) {
            continue;
          }

          var tile = this._tiles[this._tileCoordsToKey(coords)];

          if (tile) {
            tile.current = true;
          } else {
            queue.push(coords);
          }
        }
      } // sort tile queue to load tiles in order of their distance to center


      queue.sort(function (a, b) {
        return a.distanceTo(tileCenter) - b.distanceTo(tileCenter);
      });

      if (queue.length !== 0) {
        // if it's the first batch of tiles to load
        if (!this._loading) {
          this._loading = true; // @event loading: Event
          // Fired when the grid layer starts loading tiles.

          this.fire('loading');
        } // create DOM fragment to append tiles in one batch


        var fragment = document.createDocumentFragment();

        for (i = 0; i < queue.length; i++) {
          this._addTile(queue[i], fragment);
        }

        this._level.el.appendChild(fragment);
      }
    },
    _isValidTile: function _isValidTile(coords) {
      var crs = this._map.options.crs;

      if (!crs.infinite) {
        // don't load tile if it's out of bounds and not wrapped
        var bounds = this._globalTileRange;

        if (!crs.wrapLng && (coords.x < bounds.min.x || coords.x > bounds.max.x) || !crs.wrapLat && (coords.y < bounds.min.y || coords.y > bounds.max.y)) {
          return false;
        }
      }

      if (!this.options.bounds) {
        return true;
      } // don't load tile if it doesn't intersect the bounds in options


      var tileBounds = this._tileCoordsToBounds(coords);

      return toLatLngBounds(this.options.bounds).overlaps(tileBounds);
    },
    _keyToBounds: function _keyToBounds(key) {
      return this._tileCoordsToBounds(this._keyToTileCoords(key));
    },
    _tileCoordsToNwSe: function _tileCoordsToNwSe(coords) {
      var map = this._map,
          tileSize = this.getTileSize(),
          nwPoint = coords.scaleBy(tileSize),
          sePoint = nwPoint.add(tileSize),
          nw = map.unproject(nwPoint, coords.z),
          se = map.unproject(sePoint, coords.z);
      return [nw, se];
    },
    // converts tile coordinates to its geographical bounds
    _tileCoordsToBounds: function _tileCoordsToBounds(coords) {
      var bp = this._tileCoordsToNwSe(coords),
          bounds = new LatLngBounds(bp[0], bp[1]);

      if (!this.options.noWrap) {
        bounds = this._map.wrapLatLngBounds(bounds);
      }

      return bounds;
    },
    // converts tile coordinates to key for the tile cache
    _tileCoordsToKey: function _tileCoordsToKey(coords) {
      return coords.x + ':' + coords.y + ':' + coords.z;
    },
    // converts tile cache key to coordinates
    _keyToTileCoords: function _keyToTileCoords(key) {
      var k = key.split(':'),
          coords = new Point(+k[0], +k[1]);
      coords.z = +k[2];
      return coords;
    },
    _removeTile: function _removeTile(key) {
      var tile = this._tiles[key];

      if (!tile) {
        return;
      }

      _remove(tile.el);

      delete this._tiles[key]; // @event tileunload: TileEvent
      // Fired when a tile is removed (e.g. when a tile goes off the screen).

      this.fire('tileunload', {
        tile: tile.el,
        coords: this._keyToTileCoords(key)
      });
    },
    _initTile: function _initTile(tile) {
      addClass(tile, 'leaflet-tile');
      var tileSize = this.getTileSize();
      tile.style.width = tileSize.x + 'px';
      tile.style.height = tileSize.y + 'px';
      tile.onselectstart = falseFn;
      tile.onmousemove = falseFn; // update opacity on tiles in IE7-8 because of filter inheritance problems

      if (Browser.ielt9 && this.options.opacity < 1) {
        _setOpacity(tile, this.options.opacity);
      }
    },
    _addTile: function _addTile(coords, container) {
      var tilePos = this._getTilePos(coords),
          key = this._tileCoordsToKey(coords);

      var tile = this.createTile(this._wrapCoords(coords), bind(this._tileReady, this, coords));

      this._initTile(tile); // if createTile is defined with a second argument ("done" callback),
      // we know that tile is async and will be ready later; otherwise


      if (this.createTile.length < 2) {
        // mark tile as ready, but delay one frame for opacity animation to happen
        requestAnimFrame(bind(this._tileReady, this, coords, null, tile));
      }

      setPosition(tile, tilePos); // save tile in cache

      this._tiles[key] = {
        el: tile,
        coords: coords,
        current: true
      };
      container.appendChild(tile); // @event tileloadstart: TileEvent
      // Fired when a tile is requested and starts loading.

      this.fire('tileloadstart', {
        tile: tile,
        coords: coords
      });
    },
    _tileReady: function _tileReady(coords, err, tile) {
      if (err) {
        // @event tileerror: TileErrorEvent
        // Fired when there is an error loading a tile.
        this.fire('tileerror', {
          error: err,
          tile: tile,
          coords: coords
        });
      }

      var key = this._tileCoordsToKey(coords);

      tile = this._tiles[key];

      if (!tile) {
        return;
      }

      tile.loaded = +new Date();

      if (this._map._fadeAnimated) {
        _setOpacity(tile.el, 0);

        cancelAnimFrame(this._fadeFrame);
        this._fadeFrame = requestAnimFrame(this._updateOpacity, this);
      } else {
        tile.active = true;

        this._pruneTiles();
      }

      if (!err) {
        addClass(tile.el, 'leaflet-tile-loaded'); // @event tileload: TileEvent
        // Fired when a tile loads.

        this.fire('tileload', {
          tile: tile.el,
          coords: coords
        });
      }

      if (this._noTilesToLoad()) {
        this._loading = false; // @event load: Event
        // Fired when the grid layer loaded all visible tiles.

        this.fire('load');

        if (Browser.ielt9 || !this._map._fadeAnimated) {
          requestAnimFrame(this._pruneTiles, this);
        } else {
          // Wait a bit more than 0.2 secs (the duration of the tile fade-in)
          // to trigger a pruning.
          setTimeout(bind(this._pruneTiles, this), 250);
        }
      }
    },
    _getTilePos: function _getTilePos(coords) {
      return coords.scaleBy(this.getTileSize()).subtract(this._level.origin);
    },
    _wrapCoords: function _wrapCoords(coords) {
      var newCoords = new Point(this._wrapX ? wrapNum(coords.x, this._wrapX) : coords.x, this._wrapY ? wrapNum(coords.y, this._wrapY) : coords.y);
      newCoords.z = coords.z;
      return newCoords;
    },
    _pxBoundsToTileRange: function _pxBoundsToTileRange(bounds) {
      var tileSize = this.getTileSize();
      return new Bounds(bounds.min.unscaleBy(tileSize).floor(), bounds.max.unscaleBy(tileSize).ceil().subtract([1, 1]));
    },
    _noTilesToLoad: function _noTilesToLoad() {
      for (var key in this._tiles) {
        if (!this._tiles[key].loaded) {
          return false;
        }
      }

      return true;
    }
  }); // @factory L.gridLayer(options?: GridLayer options)
  // Creates a new instance of GridLayer with the supplied options.

  function gridLayer(options) {
    return new GridLayer(options);
  }
  /*
   * @class TileLayer
   * @inherits GridLayer
   * @aka L.TileLayer
   * Used to load and display tile layers on the map. Note that most tile servers require attribution, which you can set under `Layer`. Extends `GridLayer`.
   *
   * @example
   *
   * ```js
   * L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png?{foo}', {foo: 'bar', attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(map);
   * ```
   *
   * @section URL template
   * @example
   *
   * A string of the following form:
   *
   * ```
   * 'https://{s}.somedomain.com/blabla/{z}/{x}/{y}{r}.png'
   * ```
   *
   * `{s}` means one of the available subdomains (used sequentially to help with browser parallel requests per domain limitation; subdomain values are specified in options; `a`, `b` or `c` by default, can be omitted), `{z}` — zoom level, `{x}` and `{y}` — tile coordinates. `{r}` can be used to add "&commat;2x" to the URL to load retina tiles.
   *
   * You can use custom keys in the template, which will be [evaluated](#util-template) from TileLayer options, like this:
   *
   * ```
   * L.tileLayer('https://{s}.somedomain.com/{foo}/{z}/{x}/{y}.png', {foo: 'bar'});
   * ```
   */


  var TileLayer = GridLayer.extend({
    // @section
    // @aka TileLayer options
    options: {
      // @option minZoom: Number = 0
      // The minimum zoom level down to which this layer will be displayed (inclusive).
      minZoom: 0,
      // @option maxZoom: Number = 18
      // The maximum zoom level up to which this layer will be displayed (inclusive).
      maxZoom: 18,
      // @option subdomains: String|String[] = 'abc'
      // Subdomains of the tile service. Can be passed in the form of one string (where each letter is a subdomain name) or an array of strings.
      subdomains: 'abc',
      // @option errorTileUrl: String = ''
      // URL to the tile image to show in place of the tile that failed to load.
      errorTileUrl: '',
      // @option zoomOffset: Number = 0
      // The zoom number used in tile URLs will be offset with this value.
      zoomOffset: 0,
      // @option tms: Boolean = false
      // If `true`, inverses Y axis numbering for tiles (turn this on for [TMS](https://en.wikipedia.org/wiki/Tile_Map_Service) services).
      tms: false,
      // @option zoomReverse: Boolean = false
      // If set to true, the zoom number used in tile URLs will be reversed (`maxZoom - zoom` instead of `zoom`)
      zoomReverse: false,
      // @option detectRetina: Boolean = false
      // If `true` and user is on a retina display, it will request four tiles of half the specified size and a bigger zoom level in place of one to utilize the high resolution.
      detectRetina: false,
      // @option crossOrigin: Boolean|String = false
      // Whether the crossOrigin attribute will be added to the tiles.
      // If a String is provided, all tiles will have their crossOrigin attribute set to the String provided. This is needed if you want to access tile pixel data.
      // Refer to [CORS Settings](https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_settings_attributes) for valid String values.
      crossOrigin: false,
      // @option referrerPolicy: Boolean|String = false
      // Whether the referrerPolicy attribute will be added to the tiles.
      // If a String is provided, all tiles will have their referrerPolicy attribute set to the String provided.
      // This may be needed if your map's rendering context has a strict default but your tile provider expects a valid referrer
      // (e.g. to validate an API token).
      // Refer to [HTMLImageElement.referrerPolicy](https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/referrerPolicy) for valid String values.
      referrerPolicy: false
    },
    initialize: function initialize(url, options) {
      this._url = url;
      options = setOptions(this, options); // detecting retina displays, adjusting tileSize and zoom levels

      if (options.detectRetina && Browser.retina && options.maxZoom > 0) {
        options.tileSize = Math.floor(options.tileSize / 2);

        if (!options.zoomReverse) {
          options.zoomOffset++;
          options.maxZoom--;
        } else {
          options.zoomOffset--;
          options.minZoom++;
        }

        options.minZoom = Math.max(0, options.minZoom);
      }

      if (typeof options.subdomains === 'string') {
        options.subdomains = options.subdomains.split('');
      }

      this.on('tileunload', this._onTileRemove);
    },
    // @method setUrl(url: String, noRedraw?: Boolean): this
    // Updates the layer's URL template and redraws it (unless `noRedraw` is set to `true`).
    // If the URL does not change, the layer will not be redrawn unless
    // the noRedraw parameter is set to false.
    setUrl: function setUrl(url, noRedraw) {
      if (this._url === url && noRedraw === undefined) {
        noRedraw = true;
      }

      this._url = url;

      if (!noRedraw) {
        this.redraw();
      }

      return this;
    },
    // @method createTile(coords: Object, done?: Function): HTMLElement
    // Called only internally, overrides GridLayer's [`createTile()`](#gridlayer-createtile)
    // to return an `<img>` HTML element with the appropriate image URL given `coords`. The `done`
    // callback is called when the tile has been loaded.
    createTile: function createTile(coords, done) {
      var tile = document.createElement('img');
      on(tile, 'load', bind(this._tileOnLoad, this, done, tile));
      on(tile, 'error', bind(this._tileOnError, this, done, tile));

      if (this.options.crossOrigin || this.options.crossOrigin === '') {
        tile.crossOrigin = this.options.crossOrigin === true ? '' : this.options.crossOrigin;
      } // for this new option we follow the documented behavior
      // more closely by only setting the property when string


      if (typeof this.options.referrerPolicy === 'string') {
        tile.referrerPolicy = this.options.referrerPolicy;
      }
      /*
       Alt tag is set to empty string to keep screen readers from reading URL and for compliance reasons
       https://www.w3.org/TR/WCAG20-TECHS/H67
      */


      tile.alt = '';
      /*
       Set role="presentation" to force screen readers to ignore this
       https://www.w3.org/TR/wai-aria/roles#textalternativecomputation
      */

      tile.setAttribute('role', 'presentation');
      tile.src = this.getTileUrl(coords);
      return tile;
    },
    // @section Extension methods
    // @uninheritable
    // Layers extending `TileLayer` might reimplement the following method.
    // @method getTileUrl(coords: Object): String
    // Called only internally, returns the URL for a tile given its coordinates.
    // Classes extending `TileLayer` can override this function to provide custom tile URL naming schemes.
    getTileUrl: function getTileUrl(coords) {
      var data = {
        r: Browser.retina ? '@2x' : '',
        s: this._getSubdomain(coords),
        x: coords.x,
        y: coords.y,
        z: this._getZoomForUrl()
      };

      if (this._map && !this._map.options.crs.infinite) {
        var invertedY = this._globalTileRange.max.y - coords.y;

        if (this.options.tms) {
          data['y'] = invertedY;
        }

        data['-y'] = invertedY;
      }

      return template(this._url, extend(data, this.options));
    },
    _tileOnLoad: function _tileOnLoad(done, tile) {
      // For https://github.com/Leaflet/Leaflet/issues/3332
      if (Browser.ielt9) {
        setTimeout(bind(done, this, null, tile), 0);
      } else {
        done(null, tile);
      }
    },
    _tileOnError: function _tileOnError(done, tile, e) {
      var errorUrl = this.options.errorTileUrl;

      if (errorUrl && tile.getAttribute('src') !== errorUrl) {
        tile.src = errorUrl;
      }

      done(e, tile);
    },
    _onTileRemove: function _onTileRemove(e) {
      e.tile.onload = null;
    },
    _getZoomForUrl: function _getZoomForUrl() {
      var zoom = this._tileZoom,
          maxZoom = this.options.maxZoom,
          zoomReverse = this.options.zoomReverse,
          zoomOffset = this.options.zoomOffset;

      if (zoomReverse) {
        zoom = maxZoom - zoom;
      }

      return zoom + zoomOffset;
    },
    _getSubdomain: function _getSubdomain(tilePoint) {
      var index = Math.abs(tilePoint.x + tilePoint.y) % this.options.subdomains.length;
      return this.options.subdomains[index];
    },
    // stops loading all tiles in the background layer
    _abortLoading: function _abortLoading() {
      var i, tile;

      for (i in this._tiles) {
        if (this._tiles[i].coords.z !== this._tileZoom) {
          tile = this._tiles[i].el;
          tile.onload = falseFn;
          tile.onerror = falseFn;

          if (!tile.complete) {
            tile.src = emptyImageUrl;
            var coords = this._tiles[i].coords;

            _remove(tile);

            delete this._tiles[i]; // @event tileabort: TileEvent
            // Fired when a tile was loading but is now not wanted.

            this.fire('tileabort', {
              tile: tile,
              coords: coords
            });
          }
        }
      }
    },
    _removeTile: function _removeTile(key) {
      var tile = this._tiles[key];

      if (!tile) {
        return;
      } // Cancels any pending http requests associated with the tile


      tile.el.setAttribute('src', emptyImageUrl);
      return GridLayer.prototype._removeTile.call(this, key);
    },
    _tileReady: function _tileReady(coords, err, tile) {
      if (!this._map || tile && tile.getAttribute('src') === emptyImageUrl) {
        return;
      }

      return GridLayer.prototype._tileReady.call(this, coords, err, tile);
    }
  }); // @factory L.tilelayer(urlTemplate: String, options?: TileLayer options)
  // Instantiates a tile layer object given a `URL template` and optionally an options object.

  function tileLayer(url, options) {
    return new TileLayer(url, options);
  }
  /*
   * @class TileLayer.WMS
   * @inherits TileLayer
   * @aka L.TileLayer.WMS
   * Used to display [WMS](https://en.wikipedia.org/wiki/Web_Map_Service) services as tile layers on the map. Extends `TileLayer`.
   *
   * @example
   *
   * ```js
   * var nexrad = L.tileLayer.wms("http://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0r.cgi", {
   * 	layers: 'nexrad-n0r-900913',
   * 	format: 'image/png',
   * 	transparent: true,
   * 	attribution: "Weather data © 2012 IEM Nexrad"
   * });
   * ```
   */


  var TileLayerWMS = TileLayer.extend({
    // @section
    // @aka TileLayer.WMS options
    // If any custom options not documented here are used, they will be sent to the
    // WMS server as extra parameters in each request URL. This can be useful for
    // [non-standard vendor WMS parameters](https://docs.geoserver.org/stable/en/user/services/wms/vendor.html).
    defaultWmsParams: {
      service: 'WMS',
      request: 'GetMap',
      // @option layers: String = ''
      // **(required)** Comma-separated list of WMS layers to show.
      layers: '',
      // @option styles: String = ''
      // Comma-separated list of WMS styles.
      styles: '',
      // @option format: String = 'image/jpeg'
      // WMS image format (use `'image/png'` for layers with transparency).
      format: 'image/jpeg',
      // @option transparent: Boolean = false
      // If `true`, the WMS service will return images with transparency.
      transparent: false,
      // @option version: String = '1.1.1'
      // Version of the WMS service to use
      version: '1.1.1'
    },
    options: {
      // @option crs: CRS = null
      // Coordinate Reference System to use for the WMS requests, defaults to
      // map CRS. Don't change this if you're not sure what it means.
      crs: null,
      // @option uppercase: Boolean = false
      // If `true`, WMS request parameter keys will be uppercase.
      uppercase: false
    },
    initialize: function initialize(url, options) {
      this._url = url;
      var wmsParams = extend({}, this.defaultWmsParams); // all keys that are not TileLayer options go to WMS params

      for (var i in options) {
        if (!(i in this.options)) {
          wmsParams[i] = options[i];
        }
      }

      options = setOptions(this, options);
      var realRetina = options.detectRetina && Browser.retina ? 2 : 1;
      var tileSize = this.getTileSize();
      wmsParams.width = tileSize.x * realRetina;
      wmsParams.height = tileSize.y * realRetina;
      this.wmsParams = wmsParams;
    },
    onAdd: function onAdd(map) {
      this._crs = this.options.crs || map.options.crs;
      this._wmsVersion = parseFloat(this.wmsParams.version);
      var projectionKey = this._wmsVersion >= 1.3 ? 'crs' : 'srs';
      this.wmsParams[projectionKey] = this._crs.code;
      TileLayer.prototype.onAdd.call(this, map);
    },
    getTileUrl: function getTileUrl(coords) {
      var tileBounds = this._tileCoordsToNwSe(coords),
          crs = this._crs,
          bounds = toBounds(crs.project(tileBounds[0]), crs.project(tileBounds[1])),
          min = bounds.min,
          max = bounds.max,
          bbox = (this._wmsVersion >= 1.3 && this._crs === EPSG4326 ? [min.y, min.x, max.y, max.x] : [min.x, min.y, max.x, max.y]).join(','),
          url = TileLayer.prototype.getTileUrl.call(this, coords);

      return url + getParamString(this.wmsParams, url, this.options.uppercase) + (this.options.uppercase ? '&BBOX=' : '&bbox=') + bbox;
    },
    // @method setParams(params: Object, noRedraw?: Boolean): this
    // Merges an object with the new parameters and re-requests tiles on the current screen (unless `noRedraw` was set to true).
    setParams: function setParams(params, noRedraw) {
      extend(this.wmsParams, params);

      if (!noRedraw) {
        this.redraw();
      }

      return this;
    }
  }); // @factory L.tileLayer.wms(baseUrl: String, options: TileLayer.WMS options)
  // Instantiates a WMS tile layer object given a base URL of the WMS service and a WMS parameters/options object.

  function tileLayerWMS(url, options) {
    return new TileLayerWMS(url, options);
  }

  TileLayer.WMS = TileLayerWMS;
  tileLayer.wms = tileLayerWMS;
  /*
   * @class Renderer
   * @inherits Layer
   * @aka L.Renderer
   *
   * Base class for vector renderer implementations (`SVG`, `Canvas`). Handles the
   * DOM container of the renderer, its bounds, and its zoom animation.
   *
   * A `Renderer` works as an implicit layer group for all `Path`s - the renderer
   * itself can be added or removed to the map. All paths use a renderer, which can
   * be implicit (the map will decide the type of renderer and use it automatically)
   * or explicit (using the [`renderer`](#path-renderer) option of the path).
   *
   * Do not use this class directly, use `SVG` and `Canvas` instead.
   *
   * @event update: Event
   * Fired when the renderer updates its bounds, center and zoom, for example when
   * its map has moved
   */

  var Renderer = Layer.extend({
    // @section
    // @aka Renderer options
    options: {
      // @option padding: Number = 0.1
      // How much to extend the clip area around the map view (relative to its size)
      // e.g. 0.1 would be 10% of map view in each direction
      padding: 0.1
    },
    initialize: function initialize(options) {
      setOptions(this, options);
      stamp(this);
      this._layers = this._layers || {};
    },
    onAdd: function onAdd() {
      if (!this._container) {
        this._initContainer(); // defined by renderer implementations


        if (this._zoomAnimated) {
          addClass(this._container, 'leaflet-zoom-animated');
        }
      }

      this.getPane().appendChild(this._container);

      this._update();

      this.on('update', this._updatePaths, this);
    },
    onRemove: function onRemove() {
      this.off('update', this._updatePaths, this);

      this._destroyContainer();
    },
    getEvents: function getEvents() {
      var events = {
        viewreset: this._reset,
        zoom: this._onZoom,
        moveend: this._update,
        zoomend: this._onZoomEnd
      };

      if (this._zoomAnimated) {
        events.zoomanim = this._onAnimZoom;
      }

      return events;
    },
    _onAnimZoom: function _onAnimZoom(ev) {
      this._updateTransform(ev.center, ev.zoom);
    },
    _onZoom: function _onZoom() {
      this._updateTransform(this._map.getCenter(), this._map.getZoom());
    },
    _updateTransform: function _updateTransform(center, zoom) {
      var scale = this._map.getZoomScale(zoom, this._zoom),
          viewHalf = this._map.getSize().multiplyBy(0.5 + this.options.padding),
          currentCenterPoint = this._map.project(this._center, zoom),
          topLeftOffset = viewHalf.multiplyBy(-scale).add(currentCenterPoint).subtract(this._map._getNewPixelOrigin(center, zoom));

      if (Browser.any3d) {
        setTransform(this._container, topLeftOffset, scale);
      } else {
        setPosition(this._container, topLeftOffset);
      }
    },
    _reset: function _reset() {
      this._update();

      this._updateTransform(this._center, this._zoom);

      for (var id in this._layers) {
        this._layers[id]._reset();
      }
    },
    _onZoomEnd: function _onZoomEnd() {
      for (var id in this._layers) {
        this._layers[id]._project();
      }
    },
    _updatePaths: function _updatePaths() {
      for (var id in this._layers) {
        this._layers[id]._update();
      }
    },
    _update: function _update() {
      // Update pixel bounds of renderer container (for positioning/sizing/clipping later)
      // Subclasses are responsible of firing the 'update' event.
      var p = this.options.padding,
          size = this._map.getSize(),
          min = this._map.containerPointToLayerPoint(size.multiplyBy(-p)).round();

      this._bounds = new Bounds(min, min.add(size.multiplyBy(1 + p * 2)).round());
      this._center = this._map.getCenter();
      this._zoom = this._map.getZoom();
    }
  });
  /*
   * @class Canvas
   * @inherits Renderer
   * @aka L.Canvas
   *
   * Allows vector layers to be displayed with [`<canvas>`](https://developer.mozilla.org/docs/Web/API/Canvas_API).
   * Inherits `Renderer`.
   *
   * Due to [technical limitations](https://caniuse.com/canvas), Canvas is not
   * available in all web browsers, notably IE8, and overlapping geometries might
   * not display properly in some edge cases.
   *
   * @example
   *
   * Use Canvas by default for all paths in the map:
   *
   * ```js
   * var map = L.map('map', {
   * 	renderer: L.canvas()
   * });
   * ```
   *
   * Use a Canvas renderer with extra padding for specific vector geometries:
   *
   * ```js
   * var map = L.map('map');
   * var myRenderer = L.canvas({ padding: 0.5 });
   * var line = L.polyline( coordinates, { renderer: myRenderer } );
   * var circle = L.circle( center, { renderer: myRenderer } );
   * ```
   */

  var Canvas = Renderer.extend({
    // @section
    // @aka Canvas options
    options: {
      // @option tolerance: Number = 0
      // How much to extend the click tolerance around a path/object on the map.
      tolerance: 0
    },
    getEvents: function getEvents() {
      var events = Renderer.prototype.getEvents.call(this);
      events.viewprereset = this._onViewPreReset;
      return events;
    },
    _onViewPreReset: function _onViewPreReset() {
      // Set a flag so that a viewprereset+moveend+viewreset only updates&redraws once
      this._postponeUpdatePaths = true;
    },
    onAdd: function onAdd() {
      Renderer.prototype.onAdd.call(this); // Redraw vectors since canvas is cleared upon removal,
      // in case of removing the renderer itself from the map.

      this._draw();
    },
    _initContainer: function _initContainer() {
      var container = this._container = document.createElement('canvas');
      on(container, 'mousemove', this._onMouseMove, this);
      on(container, 'click dblclick mousedown mouseup contextmenu', this._onClick, this);
      on(container, 'mouseout', this._handleMouseOut, this);
      container['_leaflet_disable_events'] = true;
      this._ctx = container.getContext('2d');
    },
    _destroyContainer: function _destroyContainer() {
      cancelAnimFrame(this._redrawRequest);
      delete this._ctx;

      _remove(this._container);

      off(this._container);
      delete this._container;
    },
    _updatePaths: function _updatePaths() {
      if (this._postponeUpdatePaths) {
        return;
      }

      var layer;
      this._redrawBounds = null;

      for (var id in this._layers) {
        layer = this._layers[id];

        layer._update();
      }

      this._redraw();
    },
    _update: function _update() {
      if (this._map._animatingZoom && this._bounds) {
        return;
      }

      Renderer.prototype._update.call(this);

      var b = this._bounds,
          container = this._container,
          size = b.getSize(),
          m = Browser.retina ? 2 : 1;
      setPosition(container, b.min); // set canvas size (also clearing it); use double size on retina

      container.width = m * size.x;
      container.height = m * size.y;
      container.style.width = size.x + 'px';
      container.style.height = size.y + 'px';

      if (Browser.retina) {
        this._ctx.scale(2, 2);
      } // translate so we use the same path coordinates after canvas element moves


      this._ctx.translate(-b.min.x, -b.min.y); // Tell paths to redraw themselves


      this.fire('update');
    },
    _reset: function _reset() {
      Renderer.prototype._reset.call(this);

      if (this._postponeUpdatePaths) {
        this._postponeUpdatePaths = false;

        this._updatePaths();
      }
    },
    _initPath: function _initPath(layer) {
      this._updateDashArray(layer);

      this._layers[stamp(layer)] = layer;
      var order = layer._order = {
        layer: layer,
        prev: this._drawLast,
        next: null
      };

      if (this._drawLast) {
        this._drawLast.next = order;
      }

      this._drawLast = order;
      this._drawFirst = this._drawFirst || this._drawLast;
    },
    _addPath: function _addPath(layer) {
      this._requestRedraw(layer);
    },
    _removePath: function _removePath(layer) {
      var order = layer._order;
      var next = order.next;
      var prev = order.prev;

      if (next) {
        next.prev = prev;
      } else {
        this._drawLast = prev;
      }

      if (prev) {
        prev.next = next;
      } else {
        this._drawFirst = next;
      }

      delete layer._order;
      delete this._layers[stamp(layer)];

      this._requestRedraw(layer);
    },
    _updatePath: function _updatePath(layer) {
      // Redraw the union of the layer's old pixel
      // bounds and the new pixel bounds.
      this._extendRedrawBounds(layer);

      layer._project();

      layer._update(); // The redraw will extend the redraw bounds
      // with the new pixel bounds.


      this._requestRedraw(layer);
    },
    _updateStyle: function _updateStyle(layer) {
      this._updateDashArray(layer);

      this._requestRedraw(layer);
    },
    _updateDashArray: function _updateDashArray(layer) {
      if (typeof layer.options.dashArray === 'string') {
        var parts = layer.options.dashArray.split(/[, ]+/),
            dashArray = [],
            dashValue,
            i;

        for (i = 0; i < parts.length; i++) {
          dashValue = Number(parts[i]); // Ignore dash array containing invalid lengths

          if (isNaN(dashValue)) {
            return;
          }

          dashArray.push(dashValue);
        }

        layer.options._dashArray = dashArray;
      } else {
        layer.options._dashArray = layer.options.dashArray;
      }
    },
    _requestRedraw: function _requestRedraw(layer) {
      if (!this._map) {
        return;
      }

      this._extendRedrawBounds(layer);

      this._redrawRequest = this._redrawRequest || requestAnimFrame(this._redraw, this);
    },
    _extendRedrawBounds: function _extendRedrawBounds(layer) {
      if (layer._pxBounds) {
        var padding = (layer.options.weight || 0) + 1;
        this._redrawBounds = this._redrawBounds || new Bounds();

        this._redrawBounds.extend(layer._pxBounds.min.subtract([padding, padding]));

        this._redrawBounds.extend(layer._pxBounds.max.add([padding, padding]));
      }
    },
    _redraw: function _redraw() {
      this._redrawRequest = null;

      if (this._redrawBounds) {
        this._redrawBounds.min._floor();

        this._redrawBounds.max._ceil();
      }

      this._clear(); // clear layers in redraw bounds


      this._draw(); // draw layers


      this._redrawBounds = null;
    },
    _clear: function _clear() {
      var bounds = this._redrawBounds;

      if (bounds) {
        var size = bounds.getSize();

        this._ctx.clearRect(bounds.min.x, bounds.min.y, size.x, size.y);
      } else {
        this._ctx.save();

        this._ctx.setTransform(1, 0, 0, 1, 0, 0);

        this._ctx.clearRect(0, 0, this._container.width, this._container.height);

        this._ctx.restore();
      }
    },
    _draw: function _draw() {
      var layer,
          bounds = this._redrawBounds;

      this._ctx.save();

      if (bounds) {
        var size = bounds.getSize();

        this._ctx.beginPath();

        this._ctx.rect(bounds.min.x, bounds.min.y, size.x, size.y);

        this._ctx.clip();
      }

      this._drawing = true;

      for (var order = this._drawFirst; order; order = order.next) {
        layer = order.layer;

        if (!bounds || layer._pxBounds && layer._pxBounds.intersects(bounds)) {
          layer._updatePath();
        }
      }

      this._drawing = false;

      this._ctx.restore(); // Restore state before clipping.

    },
    _updatePoly: function _updatePoly(layer, closed) {
      if (!this._drawing) {
        return;
      }

      var i,
          j,
          len2,
          p,
          parts = layer._parts,
          len = parts.length,
          ctx = this._ctx;

      if (!len) {
        return;
      }

      ctx.beginPath();

      for (i = 0; i < len; i++) {
        for (j = 0, len2 = parts[i].length; j < len2; j++) {
          p = parts[i][j];
          ctx[j ? 'lineTo' : 'moveTo'](p.x, p.y);
        }

        if (closed) {
          ctx.closePath();
        }
      }

      this._fillStroke(ctx, layer); // TODO optimization: 1 fill/stroke for all features with equal style instead of 1 for each feature

    },
    _updateCircle: function _updateCircle(layer) {
      if (!this._drawing || layer._empty()) {
        return;
      }

      var p = layer._point,
          ctx = this._ctx,
          r = Math.max(Math.round(layer._radius), 1),
          s = (Math.max(Math.round(layer._radiusY), 1) || r) / r;

      if (s !== 1) {
        ctx.save();
        ctx.scale(1, s);
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y / s, r, 0, Math.PI * 2, false);

      if (s !== 1) {
        ctx.restore();
      }

      this._fillStroke(ctx, layer);
    },
    _fillStroke: function _fillStroke(ctx, layer) {
      var options = layer.options;

      if (options.fill) {
        ctx.globalAlpha = options.fillOpacity;
        ctx.fillStyle = options.fillColor || options.color;
        ctx.fill(options.fillRule || 'evenodd');
      }

      if (options.stroke && options.weight !== 0) {
        if (ctx.setLineDash) {
          ctx.setLineDash(layer.options && layer.options._dashArray || []);
        }

        ctx.globalAlpha = options.opacity;
        ctx.lineWidth = options.weight;
        ctx.strokeStyle = options.color;
        ctx.lineCap = options.lineCap;
        ctx.lineJoin = options.lineJoin;
        ctx.stroke();
      }
    },
    // Canvas obviously doesn't have mouse events for individual drawn objects,
    // so we emulate that by calculating what's under the mouse on mousemove/click manually
    _onClick: function _onClick(e) {
      var point = this._map.mouseEventToLayerPoint(e),
          layer,
          clickedLayer;

      for (var order = this._drawFirst; order; order = order.next) {
        layer = order.layer;

        if (layer.options.interactive && layer._containsPoint(point)) {
          if (!(e.type === 'click' || e.type === 'preclick') || !this._map._draggableMoved(layer)) {
            clickedLayer = layer;
          }
        }
      }

      this._fireEvent(clickedLayer ? [clickedLayer] : false, e);
    },
    _onMouseMove: function _onMouseMove(e) {
      if (!this._map || this._map.dragging.moving() || this._map._animatingZoom) {
        return;
      }

      var point = this._map.mouseEventToLayerPoint(e);

      this._handleMouseHover(e, point);
    },
    _handleMouseOut: function _handleMouseOut(e) {
      var layer = this._hoveredLayer;

      if (layer) {
        // if we're leaving the layer, fire mouseout
        removeClass(this._container, 'leaflet-interactive');

        this._fireEvent([layer], e, 'mouseout');

        this._hoveredLayer = null;
        this._mouseHoverThrottled = false;
      }
    },
    _handleMouseHover: function _handleMouseHover(e, point) {
      if (this._mouseHoverThrottled) {
        return;
      }

      var layer, candidateHoveredLayer;

      for (var order = this._drawFirst; order; order = order.next) {
        layer = order.layer;

        if (layer.options.interactive && layer._containsPoint(point)) {
          candidateHoveredLayer = layer;
        }
      }

      if (candidateHoveredLayer !== this._hoveredLayer) {
        this._handleMouseOut(e);

        if (candidateHoveredLayer) {
          addClass(this._container, 'leaflet-interactive'); // change cursor

          this._fireEvent([candidateHoveredLayer], e, 'mouseover');

          this._hoveredLayer = candidateHoveredLayer;
        }
      }

      this._fireEvent(this._hoveredLayer ? [this._hoveredLayer] : false, e);

      this._mouseHoverThrottled = true;
      setTimeout(bind(function () {
        this._mouseHoverThrottled = false;
      }, this), 32);
    },
    _fireEvent: function _fireEvent(layers, e, type) {
      this._map._fireDOMEvent(e, type || e.type, layers);
    },
    _bringToFront: function _bringToFront(layer) {
      var order = layer._order;

      if (!order) {
        return;
      }

      var next = order.next;
      var prev = order.prev;

      if (next) {
        next.prev = prev;
      } else {
        // Already last
        return;
      }

      if (prev) {
        prev.next = next;
      } else if (next) {
        // Update first entry unless this is the
        // single entry
        this._drawFirst = next;
      }

      order.prev = this._drawLast;
      this._drawLast.next = order;
      order.next = null;
      this._drawLast = order;

      this._requestRedraw(layer);
    },
    _bringToBack: function _bringToBack(layer) {
      var order = layer._order;

      if (!order) {
        return;
      }

      var next = order.next;
      var prev = order.prev;

      if (prev) {
        prev.next = next;
      } else {
        // Already first
        return;
      }

      if (next) {
        next.prev = prev;
      } else if (prev) {
        // Update last entry unless this is the
        // single entry
        this._drawLast = prev;
      }

      order.prev = null;
      order.next = this._drawFirst;
      this._drawFirst.prev = order;
      this._drawFirst = order;

      this._requestRedraw(layer);
    }
  }); // @factory L.canvas(options?: Renderer options)
  // Creates a Canvas renderer with the given options.

  function canvas(options) {
    return Browser.canvas ? new Canvas(options) : null;
  }
  /*
   * Thanks to Dmitry Baranovsky and his Raphael library for inspiration!
   */


  var vmlCreate = function () {
    try {
      document.namespaces.add('lvml', 'urn:schemas-microsoft-com:vml');
      return function (name) {
        return document.createElement('<lvml:' + name + ' class="lvml">');
      };
    } catch (e) {// Do not return fn from catch block so `e` can be garbage collected
      // See https://github.com/Leaflet/Leaflet/pull/7279
    }

    return function (name) {
      return document.createElement('<' + name + ' xmlns="urn:schemas-microsoft.com:vml" class="lvml">');
    };
  }();
  /*
   * @class SVG
   *
   *
   * VML was deprecated in 2012, which means VML functionality exists only for backwards compatibility
   * with old versions of Internet Explorer.
   */
  // mixin to redefine some SVG methods to handle VML syntax which is similar but with some differences


  var vmlMixin = {
    _initContainer: function _initContainer() {
      this._container = create$1('div', 'leaflet-vml-container');
    },
    _update: function _update() {
      if (this._map._animatingZoom) {
        return;
      }

      Renderer.prototype._update.call(this);

      this.fire('update');
    },
    _initPath: function _initPath(layer) {
      var container = layer._container = vmlCreate('shape');
      addClass(container, 'leaflet-vml-shape ' + (this.options.className || ''));
      container.coordsize = '1 1';
      layer._path = vmlCreate('path');
      container.appendChild(layer._path);

      this._updateStyle(layer);

      this._layers[stamp(layer)] = layer;
    },
    _addPath: function _addPath(layer) {
      var container = layer._container;

      this._container.appendChild(container);

      if (layer.options.interactive) {
        layer.addInteractiveTarget(container);
      }
    },
    _removePath: function _removePath(layer) {
      var container = layer._container;

      _remove(container);

      layer.removeInteractiveTarget(container);
      delete this._layers[stamp(layer)];
    },
    _updateStyle: function _updateStyle(layer) {
      var stroke = layer._stroke,
          fill = layer._fill,
          options = layer.options,
          container = layer._container;
      container.stroked = !!options.stroke;
      container.filled = !!options.fill;

      if (options.stroke) {
        if (!stroke) {
          stroke = layer._stroke = vmlCreate('stroke');
        }

        container.appendChild(stroke);
        stroke.weight = options.weight + 'px';
        stroke.color = options.color;
        stroke.opacity = options.opacity;

        if (options.dashArray) {
          stroke.dashStyle = isArray(options.dashArray) ? options.dashArray.join(' ') : options.dashArray.replace(/( *, *)/g, ' ');
        } else {
          stroke.dashStyle = '';
        }

        stroke.endcap = options.lineCap.replace('butt', 'flat');
        stroke.joinstyle = options.lineJoin;
      } else if (stroke) {
        container.removeChild(stroke);
        layer._stroke = null;
      }

      if (options.fill) {
        if (!fill) {
          fill = layer._fill = vmlCreate('fill');
        }

        container.appendChild(fill);
        fill.color = options.fillColor || options.color;
        fill.opacity = options.fillOpacity;
      } else if (fill) {
        container.removeChild(fill);
        layer._fill = null;
      }
    },
    _updateCircle: function _updateCircle(layer) {
      var p = layer._point.round(),
          r = Math.round(layer._radius),
          r2 = Math.round(layer._radiusY || r);

      this._setPath(layer, layer._empty() ? 'M0 0' : 'AL ' + p.x + ',' + p.y + ' ' + r + ',' + r2 + ' 0,' + 65535 * 360);
    },
    _setPath: function _setPath(layer, path) {
      layer._path.v = path;
    },
    _bringToFront: function _bringToFront(layer) {
      toFront(layer._container);
    },
    _bringToBack: function _bringToBack(layer) {
      toBack(layer._container);
    }
  };
  var create = Browser.vml ? vmlCreate : svgCreate;
  /*
   * @class SVG
   * @inherits Renderer
   * @aka L.SVG
   *
   * Allows vector layers to be displayed with [SVG](https://developer.mozilla.org/docs/Web/SVG).
   * Inherits `Renderer`.
   *
   * Due to [technical limitations](https://caniuse.com/svg), SVG is not
   * available in all web browsers, notably Android 2.x and 3.x.
   *
   * Although SVG is not available on IE7 and IE8, these browsers support
   * [VML](https://en.wikipedia.org/wiki/Vector_Markup_Language)
   * (a now deprecated technology), and the SVG renderer will fall back to VML in
   * this case.
   *
   * @example
   *
   * Use SVG by default for all paths in the map:
   *
   * ```js
   * var map = L.map('map', {
   * 	renderer: L.svg()
   * });
   * ```
   *
   * Use a SVG renderer with extra padding for specific vector geometries:
   *
   * ```js
   * var map = L.map('map');
   * var myRenderer = L.svg({ padding: 0.5 });
   * var line = L.polyline( coordinates, { renderer: myRenderer } );
   * var circle = L.circle( center, { renderer: myRenderer } );
   * ```
   */

  var SVG = Renderer.extend({
    _initContainer: function _initContainer() {
      this._container = create('svg'); // makes it possible to click through svg root; we'll reset it back in individual paths

      this._container.setAttribute('pointer-events', 'none');

      this._rootGroup = create('g');

      this._container.appendChild(this._rootGroup);
    },
    _destroyContainer: function _destroyContainer() {
      _remove(this._container);

      off(this._container);
      delete this._container;
      delete this._rootGroup;
      delete this._svgSize;
    },
    _update: function _update() {
      if (this._map._animatingZoom && this._bounds) {
        return;
      }

      Renderer.prototype._update.call(this);

      var b = this._bounds,
          size = b.getSize(),
          container = this._container; // set size of svg-container if changed

      if (!this._svgSize || !this._svgSize.equals(size)) {
        this._svgSize = size;
        container.setAttribute('width', size.x);
        container.setAttribute('height', size.y);
      } // movement: update container viewBox so that we don't have to change coordinates of individual layers


      setPosition(container, b.min);
      container.setAttribute('viewBox', [b.min.x, b.min.y, size.x, size.y].join(' '));
      this.fire('update');
    },
    // methods below are called by vector layers implementations
    _initPath: function _initPath(layer) {
      var path = layer._path = create('path'); // @namespace Path
      // @option className: String = null
      // Custom class name set on an element. Only for SVG renderer.

      if (layer.options.className) {
        addClass(path, layer.options.className);
      }

      if (layer.options.interactive) {
        addClass(path, 'leaflet-interactive');
      }

      this._updateStyle(layer);

      this._layers[stamp(layer)] = layer;
    },
    _addPath: function _addPath(layer) {
      if (!this._rootGroup) {
        this._initContainer();
      }

      this._rootGroup.appendChild(layer._path);

      layer.addInteractiveTarget(layer._path);
    },
    _removePath: function _removePath(layer) {
      _remove(layer._path);

      layer.removeInteractiveTarget(layer._path);
      delete this._layers[stamp(layer)];
    },
    _updatePath: function _updatePath(layer) {
      layer._project();

      layer._update();
    },
    _updateStyle: function _updateStyle(layer) {
      var path = layer._path,
          options = layer.options;

      if (!path) {
        return;
      }

      if (options.stroke) {
        path.setAttribute('stroke', options.color);
        path.setAttribute('stroke-opacity', options.opacity);
        path.setAttribute('stroke-width', options.weight);
        path.setAttribute('stroke-linecap', options.lineCap);
        path.setAttribute('stroke-linejoin', options.lineJoin);

        if (options.dashArray) {
          path.setAttribute('stroke-dasharray', options.dashArray);
        } else {
          path.removeAttribute('stroke-dasharray');
        }

        if (options.dashOffset) {
          path.setAttribute('stroke-dashoffset', options.dashOffset);
        } else {
          path.removeAttribute('stroke-dashoffset');
        }
      } else {
        path.setAttribute('stroke', 'none');
      }

      if (options.fill) {
        path.setAttribute('fill', options.fillColor || options.color);
        path.setAttribute('fill-opacity', options.fillOpacity);
        path.setAttribute('fill-rule', options.fillRule || 'evenodd');
      } else {
        path.setAttribute('fill', 'none');
      }
    },
    _updatePoly: function _updatePoly(layer, closed) {
      this._setPath(layer, pointsToPath(layer._parts, closed));
    },
    _updateCircle: function _updateCircle(layer) {
      var p = layer._point,
          r = Math.max(Math.round(layer._radius), 1),
          r2 = Math.max(Math.round(layer._radiusY), 1) || r,
          arc = 'a' + r + ',' + r2 + ' 0 1,0 '; // drawing a circle with two half-arcs

      var d = layer._empty() ? 'M0 0' : 'M' + (p.x - r) + ',' + p.y + arc + r * 2 + ',0 ' + arc + -r * 2 + ',0 ';

      this._setPath(layer, d);
    },
    _setPath: function _setPath(layer, path) {
      layer._path.setAttribute('d', path);
    },
    // SVG does not have the concept of zIndex so we resort to changing the DOM order of elements
    _bringToFront: function _bringToFront(layer) {
      toFront(layer._path);
    },
    _bringToBack: function _bringToBack(layer) {
      toBack(layer._path);
    }
  });

  if (Browser.vml) {
    SVG.include(vmlMixin);
  } // @namespace SVG
  // @factory L.svg(options?: Renderer options)
  // Creates a SVG renderer with the given options.


  function svg(options) {
    return Browser.svg || Browser.vml ? new SVG(options) : null;
  }

  Map.include({
    // @namespace Map; @method getRenderer(layer: Path): Renderer
    // Returns the instance of `Renderer` that should be used to render the given
    // `Path`. It will ensure that the `renderer` options of the map and paths
    // are respected, and that the renderers do exist on the map.
    getRenderer: function getRenderer(layer) {
      // @namespace Path; @option renderer: Renderer
      // Use this specific instance of `Renderer` for this path. Takes
      // precedence over the map's [default renderer](#map-renderer).
      var renderer = layer.options.renderer || this._getPaneRenderer(layer.options.pane) || this.options.renderer || this._renderer;

      if (!renderer) {
        renderer = this._renderer = this._createRenderer();
      }

      if (!this.hasLayer(renderer)) {
        this.addLayer(renderer);
      }

      return renderer;
    },
    _getPaneRenderer: function _getPaneRenderer(name) {
      if (name === 'overlayPane' || name === undefined) {
        return false;
      }

      var renderer = this._paneRenderers[name];

      if (renderer === undefined) {
        renderer = this._createRenderer({
          pane: name
        });
        this._paneRenderers[name] = renderer;
      }

      return renderer;
    },
    _createRenderer: function _createRenderer(options) {
      // @namespace Map; @option preferCanvas: Boolean = false
      // Whether `Path`s should be rendered on a `Canvas` renderer.
      // By default, all `Path`s are rendered in a `SVG` renderer.
      return this.options.preferCanvas && canvas(options) || svg(options);
    }
  });
  /*
   * L.Rectangle extends Polygon and creates a rectangle when passed a LatLngBounds object.
   */

  /*
   * @class Rectangle
   * @aka L.Rectangle
   * @inherits Polygon
   *
   * A class for drawing rectangle overlays on a map. Extends `Polygon`.
   *
   * @example
   *
   * ```js
   * // define rectangle geographical bounds
   * var bounds = [[54.559322, -5.767822], [56.1210604, -3.021240]];
   *
   * // create an orange rectangle
   * L.rectangle(bounds, {color: "#ff7800", weight: 1}).addTo(map);
   *
   * // zoom the map to the rectangle bounds
   * map.fitBounds(bounds);
   * ```
   *
   */

  var Rectangle = Polygon.extend({
    initialize: function initialize(latLngBounds, options) {
      Polygon.prototype.initialize.call(this, this._boundsToLatLngs(latLngBounds), options);
    },
    // @method setBounds(latLngBounds: LatLngBounds): this
    // Redraws the rectangle with the passed bounds.
    setBounds: function setBounds(latLngBounds) {
      return this.setLatLngs(this._boundsToLatLngs(latLngBounds));
    },
    _boundsToLatLngs: function _boundsToLatLngs(latLngBounds) {
      latLngBounds = toLatLngBounds(latLngBounds);
      return [latLngBounds.getSouthWest(), latLngBounds.getNorthWest(), latLngBounds.getNorthEast(), latLngBounds.getSouthEast()];
    }
  }); // @factory L.rectangle(latLngBounds: LatLngBounds, options?: Polyline options)

  function rectangle(latLngBounds, options) {
    return new Rectangle(latLngBounds, options);
  }

  SVG.create = create;
  SVG.pointsToPath = pointsToPath;
  GeoJSON.geometryToLayer = geometryToLayer;
  GeoJSON.coordsToLatLng = coordsToLatLng;
  GeoJSON.coordsToLatLngs = coordsToLatLngs;
  GeoJSON.latLngToCoords = latLngToCoords;
  GeoJSON.latLngsToCoords = latLngsToCoords;
  GeoJSON.getFeature = getFeature;
  GeoJSON.asFeature = asFeature;
  /*
   * L.Handler.BoxZoom is used to add shift-drag zoom interaction to the map
   * (zoom to a selected bounding box), enabled by default.
   */
  // @namespace Map
  // @section Interaction Options

  Map.mergeOptions({
    // @option boxZoom: Boolean = true
    // Whether the map can be zoomed to a rectangular area specified by
    // dragging the mouse while pressing the shift key.
    boxZoom: true
  });
  var BoxZoom = Handler.extend({
    initialize: function initialize(map) {
      this._map = map;
      this._container = map._container;
      this._pane = map._panes.overlayPane;
      this._resetStateTimeout = 0;
      map.on('unload', this._destroy, this);
    },
    addHooks: function addHooks() {
      on(this._container, 'mousedown', this._onMouseDown, this);
    },
    removeHooks: function removeHooks() {
      off(this._container, 'mousedown', this._onMouseDown, this);
    },
    moved: function moved() {
      return this._moved;
    },
    _destroy: function _destroy() {
      _remove(this._pane);

      delete this._pane;
    },
    _resetState: function _resetState() {
      this._resetStateTimeout = 0;
      this._moved = false;
    },
    _clearDeferredResetState: function _clearDeferredResetState() {
      if (this._resetStateTimeout !== 0) {
        clearTimeout(this._resetStateTimeout);
        this._resetStateTimeout = 0;
      }
    },
    _onMouseDown: function _onMouseDown(e) {
      if (!e.shiftKey || e.which !== 1 && e.button !== 1) {
        return false;
      } // Clear the deferred resetState if it hasn't executed yet, otherwise it
      // will interrupt the interaction and orphan a box element in the container.


      this._clearDeferredResetState();

      this._resetState();

      disableTextSelection();
      disableImageDrag();
      this._startPoint = this._map.mouseEventToContainerPoint(e);
      on(document, {
        contextmenu: stop,
        mousemove: this._onMouseMove,
        mouseup: this._onMouseUp,
        keydown: this._onKeyDown
      }, this);
    },
    _onMouseMove: function _onMouseMove(e) {
      if (!this._moved) {
        this._moved = true;
        this._box = create$1('div', 'leaflet-zoom-box', this._container);
        addClass(this._container, 'leaflet-crosshair');

        this._map.fire('boxzoomstart');
      }

      this._point = this._map.mouseEventToContainerPoint(e);
      var bounds = new Bounds(this._point, this._startPoint),
          size = bounds.getSize();
      setPosition(this._box, bounds.min);
      this._box.style.width = size.x + 'px';
      this._box.style.height = size.y + 'px';
    },
    _finish: function _finish() {
      if (this._moved) {
        _remove(this._box);

        removeClass(this._container, 'leaflet-crosshair');
      }

      enableTextSelection();
      enableImageDrag();
      off(document, {
        contextmenu: stop,
        mousemove: this._onMouseMove,
        mouseup: this._onMouseUp,
        keydown: this._onKeyDown
      }, this);
    },
    _onMouseUp: function _onMouseUp(e) {
      if (e.which !== 1 && e.button !== 1) {
        return;
      }

      this._finish();

      if (!this._moved) {
        return;
      } // Postpone to next JS tick so internal click event handling
      // still see it as "moved".


      this._clearDeferredResetState();

      this._resetStateTimeout = setTimeout(bind(this._resetState, this), 0);
      var bounds = new LatLngBounds(this._map.containerPointToLatLng(this._startPoint), this._map.containerPointToLatLng(this._point));

      this._map.fitBounds(bounds).fire('boxzoomend', {
        boxZoomBounds: bounds
      });
    },
    _onKeyDown: function _onKeyDown(e) {
      if (e.keyCode === 27) {
        this._finish();

        this._clearDeferredResetState();

        this._resetState();
      }
    }
  }); // @section Handlers
  // @property boxZoom: Handler
  // Box (shift-drag with mouse) zoom handler.

  Map.addInitHook('addHandler', 'boxZoom', BoxZoom);
  /*
   * L.Handler.DoubleClickZoom is used to handle double-click zoom on the map, enabled by default.
   */
  // @namespace Map
  // @section Interaction Options

  Map.mergeOptions({
    // @option doubleClickZoom: Boolean|String = true
    // Whether the map can be zoomed in by double clicking on it and
    // zoomed out by double clicking while holding shift. If passed
    // `'center'`, double-click zoom will zoom to the center of the
    //  view regardless of where the mouse was.
    doubleClickZoom: true
  });
  var DoubleClickZoom = Handler.extend({
    addHooks: function addHooks() {
      this._map.on('dblclick', this._onDoubleClick, this);
    },
    removeHooks: function removeHooks() {
      this._map.off('dblclick', this._onDoubleClick, this);
    },
    _onDoubleClick: function _onDoubleClick(e) {
      var map = this._map,
          oldZoom = map.getZoom(),
          delta = map.options.zoomDelta,
          zoom = e.originalEvent.shiftKey ? oldZoom - delta : oldZoom + delta;

      if (map.options.doubleClickZoom === 'center') {
        map.setZoom(zoom);
      } else {
        map.setZoomAround(e.containerPoint, zoom);
      }
    }
  }); // @section Handlers
  //
  // Map properties include interaction handlers that allow you to control
  // interaction behavior in runtime, enabling or disabling certain features such
  // as dragging or touch zoom (see `Handler` methods). For example:
  //
  // ```js
  // map.doubleClickZoom.disable();
  // ```
  //
  // @property doubleClickZoom: Handler
  // Double click zoom handler.

  Map.addInitHook('addHandler', 'doubleClickZoom', DoubleClickZoom);
  /*
   * L.Handler.MapDrag is used to make the map draggable (with panning inertia), enabled by default.
   */
  // @namespace Map
  // @section Interaction Options

  Map.mergeOptions({
    // @option dragging: Boolean = true
    // Whether the map is draggable with mouse/touch or not.
    dragging: true,
    // @section Panning Inertia Options
    // @option inertia: Boolean = *
    // If enabled, panning of the map will have an inertia effect where
    // the map builds momentum while dragging and continues moving in
    // the same direction for some time. Feels especially nice on touch
    // devices. Enabled by default.
    inertia: true,
    // @option inertiaDeceleration: Number = 3000
    // The rate with which the inertial movement slows down, in pixels/second².
    inertiaDeceleration: 3400,
    // px/s^2
    // @option inertiaMaxSpeed: Number = Infinity
    // Max speed of the inertial movement, in pixels/second.
    inertiaMaxSpeed: Infinity,
    // px/s
    // @option easeLinearity: Number = 0.2
    easeLinearity: 0.2,
    // TODO refactor, move to CRS
    // @option worldCopyJump: Boolean = false
    // With this option enabled, the map tracks when you pan to another "copy"
    // of the world and seamlessly jumps to the original one so that all overlays
    // like markers and vector layers are still visible.
    worldCopyJump: false,
    // @option maxBoundsViscosity: Number = 0.0
    // If `maxBounds` is set, this option will control how solid the bounds
    // are when dragging the map around. The default value of `0.0` allows the
    // user to drag outside the bounds at normal speed, higher values will
    // slow down map dragging outside bounds, and `1.0` makes the bounds fully
    // solid, preventing the user from dragging outside the bounds.
    maxBoundsViscosity: 0.0
  });
  var Drag = Handler.extend({
    addHooks: function addHooks() {
      if (!this._draggable) {
        var map = this._map;
        this._draggable = new Draggable(map._mapPane, map._container);

        this._draggable.on({
          dragstart: this._onDragStart,
          drag: this._onDrag,
          dragend: this._onDragEnd
        }, this);

        this._draggable.on('predrag', this._onPreDragLimit, this);

        if (map.options.worldCopyJump) {
          this._draggable.on('predrag', this._onPreDragWrap, this);

          map.on('zoomend', this._onZoomEnd, this);
          map.whenReady(this._onZoomEnd, this);
        }
      }

      addClass(this._map._container, 'leaflet-grab leaflet-touch-drag');

      this._draggable.enable();

      this._positions = [];
      this._times = [];
    },
    removeHooks: function removeHooks() {
      removeClass(this._map._container, 'leaflet-grab');
      removeClass(this._map._container, 'leaflet-touch-drag');

      this._draggable.disable();
    },
    moved: function moved() {
      return this._draggable && this._draggable._moved;
    },
    moving: function moving() {
      return this._draggable && this._draggable._moving;
    },
    _onDragStart: function _onDragStart() {
      var map = this._map;

      map._stop();

      if (this._map.options.maxBounds && this._map.options.maxBoundsViscosity) {
        var bounds = toLatLngBounds(this._map.options.maxBounds);
        this._offsetLimit = toBounds(this._map.latLngToContainerPoint(bounds.getNorthWest()).multiplyBy(-1), this._map.latLngToContainerPoint(bounds.getSouthEast()).multiplyBy(-1).add(this._map.getSize()));
        this._viscosity = Math.min(1.0, Math.max(0.0, this._map.options.maxBoundsViscosity));
      } else {
        this._offsetLimit = null;
      }

      map.fire('movestart').fire('dragstart');

      if (map.options.inertia) {
        this._positions = [];
        this._times = [];
      }
    },
    _onDrag: function _onDrag(e) {
      if (this._map.options.inertia) {
        var time = this._lastTime = +new Date(),
            pos = this._lastPos = this._draggable._absPos || this._draggable._newPos;

        this._positions.push(pos);

        this._times.push(time);

        this._prunePositions(time);
      }

      this._map.fire('move', e).fire('drag', e);
    },
    _prunePositions: function _prunePositions(time) {
      while (this._positions.length > 1 && time - this._times[0] > 50) {
        this._positions.shift();

        this._times.shift();
      }
    },
    _onZoomEnd: function _onZoomEnd() {
      var pxCenter = this._map.getSize().divideBy(2),
          pxWorldCenter = this._map.latLngToLayerPoint([0, 0]);

      this._initialWorldOffset = pxWorldCenter.subtract(pxCenter).x;
      this._worldWidth = this._map.getPixelWorldBounds().getSize().x;
    },
    _viscousLimit: function _viscousLimit(value, threshold) {
      return value - (value - threshold) * this._viscosity;
    },
    _onPreDragLimit: function _onPreDragLimit() {
      if (!this._viscosity || !this._offsetLimit) {
        return;
      }

      var offset = this._draggable._newPos.subtract(this._draggable._startPos);

      var limit = this._offsetLimit;

      if (offset.x < limit.min.x) {
        offset.x = this._viscousLimit(offset.x, limit.min.x);
      }

      if (offset.y < limit.min.y) {
        offset.y = this._viscousLimit(offset.y, limit.min.y);
      }

      if (offset.x > limit.max.x) {
        offset.x = this._viscousLimit(offset.x, limit.max.x);
      }

      if (offset.y > limit.max.y) {
        offset.y = this._viscousLimit(offset.y, limit.max.y);
      }

      this._draggable._newPos = this._draggable._startPos.add(offset);
    },
    _onPreDragWrap: function _onPreDragWrap() {
      // TODO refactor to be able to adjust map pane position after zoom
      var worldWidth = this._worldWidth,
          halfWidth = Math.round(worldWidth / 2),
          dx = this._initialWorldOffset,
          x = this._draggable._newPos.x,
          newX1 = (x - halfWidth + dx) % worldWidth + halfWidth - dx,
          newX2 = (x + halfWidth + dx) % worldWidth - halfWidth - dx,
          newX = Math.abs(newX1 + dx) < Math.abs(newX2 + dx) ? newX1 : newX2;
      this._draggable._absPos = this._draggable._newPos.clone();
      this._draggable._newPos.x = newX;
    },
    _onDragEnd: function _onDragEnd(e) {
      var map = this._map,
          options = map.options,
          noInertia = !options.inertia || e.noInertia || this._times.length < 2;
      map.fire('dragend', e);

      if (noInertia) {
        map.fire('moveend');
      } else {
        this._prunePositions(+new Date());

        var direction = this._lastPos.subtract(this._positions[0]),
            duration = (this._lastTime - this._times[0]) / 1000,
            ease = options.easeLinearity,
            speedVector = direction.multiplyBy(ease / duration),
            speed = speedVector.distanceTo([0, 0]),
            limitedSpeed = Math.min(options.inertiaMaxSpeed, speed),
            limitedSpeedVector = speedVector.multiplyBy(limitedSpeed / speed),
            decelerationDuration = limitedSpeed / (options.inertiaDeceleration * ease),
            offset = limitedSpeedVector.multiplyBy(-decelerationDuration / 2).round();

        if (!offset.x && !offset.y) {
          map.fire('moveend');
        } else {
          offset = map._limitOffset(offset, map.options.maxBounds);
          requestAnimFrame(function () {
            map.panBy(offset, {
              duration: decelerationDuration,
              easeLinearity: ease,
              noMoveStart: true,
              animate: true
            });
          });
        }
      }
    }
  }); // @section Handlers
  // @property dragging: Handler
  // Map dragging handler (by both mouse and touch).

  Map.addInitHook('addHandler', 'dragging', Drag);
  /*
   * L.Map.Keyboard is handling keyboard interaction with the map, enabled by default.
   */
  // @namespace Map
  // @section Keyboard Navigation Options

  Map.mergeOptions({
    // @option keyboard: Boolean = true
    // Makes the map focusable and allows users to navigate the map with keyboard
    // arrows and `+`/`-` keys.
    keyboard: true,
    // @option keyboardPanDelta: Number = 80
    // Amount of pixels to pan when pressing an arrow key.
    keyboardPanDelta: 80
  });
  var Keyboard = Handler.extend({
    keyCodes: {
      left: [37],
      right: [39],
      down: [40],
      up: [38],
      zoomIn: [187, 107, 61, 171],
      zoomOut: [189, 109, 54, 173]
    },
    initialize: function initialize(map) {
      this._map = map;

      this._setPanDelta(map.options.keyboardPanDelta);

      this._setZoomDelta(map.options.zoomDelta);
    },
    addHooks: function addHooks() {
      var container = this._map._container; // make the container focusable by tabbing

      if (container.tabIndex <= 0) {
        container.tabIndex = '0';
      }

      on(container, {
        focus: this._onFocus,
        blur: this._onBlur,
        mousedown: this._onMouseDown
      }, this);

      this._map.on({
        focus: this._addHooks,
        blur: this._removeHooks
      }, this);
    },
    removeHooks: function removeHooks() {
      this._removeHooks();

      off(this._map._container, {
        focus: this._onFocus,
        blur: this._onBlur,
        mousedown: this._onMouseDown
      }, this);

      this._map.off({
        focus: this._addHooks,
        blur: this._removeHooks
      }, this);
    },
    _onMouseDown: function _onMouseDown() {
      if (this._focused) {
        return;
      }

      var body = document.body,
          docEl = document.documentElement,
          top = body.scrollTop || docEl.scrollTop,
          left = body.scrollLeft || docEl.scrollLeft;

      this._map._container.focus();

      window.scrollTo(left, top);
    },
    _onFocus: function _onFocus() {
      this._focused = true;

      this._map.fire('focus');
    },
    _onBlur: function _onBlur() {
      this._focused = false;

      this._map.fire('blur');
    },
    _setPanDelta: function _setPanDelta(panDelta) {
      var keys = this._panKeys = {},
          codes = this.keyCodes,
          i,
          len;

      for (i = 0, len = codes.left.length; i < len; i++) {
        keys[codes.left[i]] = [-1 * panDelta, 0];
      }

      for (i = 0, len = codes.right.length; i < len; i++) {
        keys[codes.right[i]] = [panDelta, 0];
      }

      for (i = 0, len = codes.down.length; i < len; i++) {
        keys[codes.down[i]] = [0, panDelta];
      }

      for (i = 0, len = codes.up.length; i < len; i++) {
        keys[codes.up[i]] = [0, -1 * panDelta];
      }
    },
    _setZoomDelta: function _setZoomDelta(zoomDelta) {
      var keys = this._zoomKeys = {},
          codes = this.keyCodes,
          i,
          len;

      for (i = 0, len = codes.zoomIn.length; i < len; i++) {
        keys[codes.zoomIn[i]] = zoomDelta;
      }

      for (i = 0, len = codes.zoomOut.length; i < len; i++) {
        keys[codes.zoomOut[i]] = -zoomDelta;
      }
    },
    _addHooks: function _addHooks() {
      on(document, 'keydown', this._onKeyDown, this);
    },
    _removeHooks: function _removeHooks() {
      off(document, 'keydown', this._onKeyDown, this);
    },
    _onKeyDown: function _onKeyDown(e) {
      if (e.altKey || e.ctrlKey || e.metaKey) {
        return;
      }

      var key = e.keyCode,
          map = this._map,
          offset;

      if (key in this._panKeys) {
        if (!map._panAnim || !map._panAnim._inProgress) {
          offset = this._panKeys[key];

          if (e.shiftKey) {
            offset = toPoint(offset).multiplyBy(3);
          }

          map.panBy(offset);

          if (map.options.maxBounds) {
            map.panInsideBounds(map.options.maxBounds);
          }
        }
      } else if (key in this._zoomKeys) {
        map.setZoom(map.getZoom() + (e.shiftKey ? 3 : 1) * this._zoomKeys[key]);
      } else if (key === 27 && map._popup && map._popup.options.closeOnEscapeKey) {
        map.closePopup();
      } else {
        return;
      }

      stop(e);
    }
  }); // @section Handlers
  // @section Handlers
  // @property keyboard: Handler
  // Keyboard navigation handler.

  Map.addInitHook('addHandler', 'keyboard', Keyboard);
  /*
   * L.Handler.ScrollWheelZoom is used by L.Map to enable mouse scroll wheel zoom on the map.
   */
  // @namespace Map
  // @section Interaction Options

  Map.mergeOptions({
    // @section Mouse wheel options
    // @option scrollWheelZoom: Boolean|String = true
    // Whether the map can be zoomed by using the mouse wheel. If passed `'center'`,
    // it will zoom to the center of the view regardless of where the mouse was.
    scrollWheelZoom: true,
    // @option wheelDebounceTime: Number = 40
    // Limits the rate at which a wheel can fire (in milliseconds). By default
    // user can't zoom via wheel more often than once per 40 ms.
    wheelDebounceTime: 40,
    // @option wheelPxPerZoomLevel: Number = 60
    // How many scroll pixels (as reported by [L.DomEvent.getWheelDelta](#domevent-getwheeldelta))
    // mean a change of one full zoom level. Smaller values will make wheel-zooming
    // faster (and vice versa).
    wheelPxPerZoomLevel: 60
  });
  var ScrollWheelZoom = Handler.extend({
    addHooks: function addHooks() {
      on(this._map._container, 'wheel', this._onWheelScroll, this);
      this._delta = 0;
    },
    removeHooks: function removeHooks() {
      off(this._map._container, 'wheel', this._onWheelScroll, this);
    },
    _onWheelScroll: function _onWheelScroll(e) {
      var delta = getWheelDelta(e);
      var debounce = this._map.options.wheelDebounceTime;
      this._delta += delta;
      this._lastMousePos = this._map.mouseEventToContainerPoint(e);

      if (!this._startTime) {
        this._startTime = +new Date();
      }

      var left = Math.max(debounce - (+new Date() - this._startTime), 0);
      clearTimeout(this._timer);
      this._timer = setTimeout(bind(this._performZoom, this), left);
      stop(e);
    },
    _performZoom: function _performZoom() {
      var map = this._map,
          zoom = map.getZoom(),
          snap = this._map.options.zoomSnap || 0;

      map._stop(); // stop panning and fly animations if any
      // map the delta with a sigmoid function to -4..4 range leaning on -1..1


      var d2 = this._delta / (this._map.options.wheelPxPerZoomLevel * 4),
          d3 = 4 * Math.log(2 / (1 + Math.exp(-Math.abs(d2)))) / Math.LN2,
          d4 = snap ? Math.ceil(d3 / snap) * snap : d3,
          delta = map._limitZoom(zoom + (this._delta > 0 ? d4 : -d4)) - zoom;
      this._delta = 0;
      this._startTime = null;

      if (!delta) {
        return;
      }

      if (map.options.scrollWheelZoom === 'center') {
        map.setZoom(zoom + delta);
      } else {
        map.setZoomAround(this._lastMousePos, zoom + delta);
      }
    }
  }); // @section Handlers
  // @property scrollWheelZoom: Handler
  // Scroll wheel zoom handler.

  Map.addInitHook('addHandler', 'scrollWheelZoom', ScrollWheelZoom);
  /*
   * L.Map.TapHold is used to simulate `contextmenu` event on long hold,
   * which otherwise is not fired by mobile Safari.
   */

  var tapHoldDelay = 600; // @namespace Map
  // @section Interaction Options

  Map.mergeOptions({
    // @section Touch interaction options
    // @option tapHold: Boolean
    // Enables simulation of `contextmenu` event, default is `true` for mobile Safari.
    tapHold: Browser.touchNative && Browser.safari && Browser.mobile,
    // @option tapTolerance: Number = 15
    // The max number of pixels a user can shift his finger during touch
    // for it to be considered a valid tap.
    tapTolerance: 15
  });
  var TapHold = Handler.extend({
    addHooks: function addHooks() {
      on(this._map._container, 'touchstart', this._onDown, this);
    },
    removeHooks: function removeHooks() {
      off(this._map._container, 'touchstart', this._onDown, this);
    },
    _onDown: function _onDown(e) {
      clearTimeout(this._holdTimeout);

      if (e.touches.length !== 1) {
        return;
      }

      var first = e.touches[0];
      this._startPos = this._newPos = new Point(first.clientX, first.clientY);
      this._holdTimeout = setTimeout(bind(function () {
        this._cancel();

        if (!this._isTapValid()) {
          return;
        } // prevent simulated mouse events https://w3c.github.io/touch-events/#mouse-events


        on(document, 'touchend', preventDefault);
        on(document, 'touchend touchcancel', this._cancelClickPrevent);

        this._simulateEvent('contextmenu', first);
      }, this), tapHoldDelay);
      on(document, 'touchend touchcancel contextmenu', this._cancel, this);
      on(document, 'touchmove', this._onMove, this);
    },
    _cancelClickPrevent: function cancelClickPrevent() {
      off(document, 'touchend', preventDefault);
      off(document, 'touchend touchcancel', cancelClickPrevent);
    },
    _cancel: function _cancel() {
      clearTimeout(this._holdTimeout);
      off(document, 'touchend touchcancel contextmenu', this._cancel, this);
      off(document, 'touchmove', this._onMove, this);
    },
    _onMove: function _onMove(e) {
      var first = e.touches[0];
      this._newPos = new Point(first.clientX, first.clientY);
    },
    _isTapValid: function _isTapValid() {
      return this._newPos.distanceTo(this._startPos) <= this._map.options.tapTolerance;
    },
    _simulateEvent: function _simulateEvent(type, e) {
      var simulatedEvent = new MouseEvent(type, {
        bubbles: true,
        cancelable: true,
        view: window,
        // detail: 1,
        screenX: e.screenX,
        screenY: e.screenY,
        clientX: e.clientX,
        clientY: e.clientY // button: 2,
        // buttons: 2

      });
      simulatedEvent._simulated = true;
      e.target.dispatchEvent(simulatedEvent);
    }
  }); // @section Handlers
  // @property tapHold: Handler
  // Long tap handler to simulate `contextmenu` event (useful in mobile Safari).

  Map.addInitHook('addHandler', 'tapHold', TapHold);
  /*
   * L.Handler.TouchZoom is used by L.Map to add pinch zoom on supported mobile browsers.
   */
  // @namespace Map
  // @section Interaction Options

  Map.mergeOptions({
    // @section Touch interaction options
    // @option touchZoom: Boolean|String = *
    // Whether the map can be zoomed by touch-dragging with two fingers. If
    // passed `'center'`, it will zoom to the center of the view regardless of
    // where the touch events (fingers) were. Enabled for touch-capable web
    // browsers.
    touchZoom: Browser.touch,
    // @option bounceAtZoomLimits: Boolean = true
    // Set it to false if you don't want the map to zoom beyond min/max zoom
    // and then bounce back when pinch-zooming.
    bounceAtZoomLimits: true
  });
  var TouchZoom = Handler.extend({
    addHooks: function addHooks() {
      addClass(this._map._container, 'leaflet-touch-zoom');
      on(this._map._container, 'touchstart', this._onTouchStart, this);
    },
    removeHooks: function removeHooks() {
      removeClass(this._map._container, 'leaflet-touch-zoom');
      off(this._map._container, 'touchstart', this._onTouchStart, this);
    },
    _onTouchStart: function _onTouchStart(e) {
      var map = this._map;

      if (!e.touches || e.touches.length !== 2 || map._animatingZoom || this._zooming) {
        return;
      }

      var p1 = map.mouseEventToContainerPoint(e.touches[0]),
          p2 = map.mouseEventToContainerPoint(e.touches[1]);
      this._centerPoint = map.getSize()._divideBy(2);
      this._startLatLng = map.containerPointToLatLng(this._centerPoint);

      if (map.options.touchZoom !== 'center') {
        this._pinchStartLatLng = map.containerPointToLatLng(p1.add(p2)._divideBy(2));
      }

      this._startDist = p1.distanceTo(p2);
      this._startZoom = map.getZoom();
      this._moved = false;
      this._zooming = true;

      map._stop();

      on(document, 'touchmove', this._onTouchMove, this);
      on(document, 'touchend touchcancel', this._onTouchEnd, this);
      preventDefault(e);
    },
    _onTouchMove: function _onTouchMove(e) {
      if (!e.touches || e.touches.length !== 2 || !this._zooming) {
        return;
      }

      var map = this._map,
          p1 = map.mouseEventToContainerPoint(e.touches[0]),
          p2 = map.mouseEventToContainerPoint(e.touches[1]),
          scale = p1.distanceTo(p2) / this._startDist;

      this._zoom = map.getScaleZoom(scale, this._startZoom);

      if (!map.options.bounceAtZoomLimits && (this._zoom < map.getMinZoom() && scale < 1 || this._zoom > map.getMaxZoom() && scale > 1)) {
        this._zoom = map._limitZoom(this._zoom);
      }

      if (map.options.touchZoom === 'center') {
        this._center = this._startLatLng;

        if (scale === 1) {
          return;
        }
      } else {
        // Get delta from pinch to center, so centerLatLng is delta applied to initial pinchLatLng
        var delta = p1._add(p2)._divideBy(2)._subtract(this._centerPoint);

        if (scale === 1 && delta.x === 0 && delta.y === 0) {
          return;
        }

        this._center = map.unproject(map.project(this._pinchStartLatLng, this._zoom).subtract(delta), this._zoom);
      }

      if (!this._moved) {
        map._moveStart(true, false);

        this._moved = true;
      }

      cancelAnimFrame(this._animRequest);
      var moveFn = bind(map._move, map, this._center, this._zoom, {
        pinch: true,
        round: false
      });
      this._animRequest = requestAnimFrame(moveFn, this, true);
      preventDefault(e);
    },
    _onTouchEnd: function _onTouchEnd() {
      if (!this._moved || !this._zooming) {
        this._zooming = false;
        return;
      }

      this._zooming = false;
      cancelAnimFrame(this._animRequest);
      off(document, 'touchmove', this._onTouchMove, this);
      off(document, 'touchend touchcancel', this._onTouchEnd, this); // Pinch updates GridLayers' levels only when zoomSnap is off, so zoomSnap becomes noUpdate.

      if (this._map.options.zoomAnimation) {
        this._map._animateZoom(this._center, this._map._limitZoom(this._zoom), true, this._map.options.zoomSnap);
      } else {
        this._map._resetView(this._center, this._map._limitZoom(this._zoom));
      }
    }
  }); // @section Handlers
  // @property touchZoom: Handler
  // Touch zoom handler.

  Map.addInitHook('addHandler', 'touchZoom', TouchZoom);
  Map.BoxZoom = BoxZoom;
  Map.DoubleClickZoom = DoubleClickZoom;
  Map.Drag = Drag;
  Map.Keyboard = Keyboard;
  Map.ScrollWheelZoom = ScrollWheelZoom;
  Map.TapHold = TapHold;
  Map.TouchZoom = TouchZoom;
  exports.Bounds = Bounds;
  exports.Browser = Browser;
  exports.CRS = CRS;
  exports.Canvas = Canvas;
  exports.Circle = Circle;
  exports.CircleMarker = CircleMarker;
  exports.Class = Class;
  exports.Control = Control;
  exports.DivIcon = DivIcon;
  exports.DivOverlay = DivOverlay;
  exports.DomEvent = DomEvent;
  exports.DomUtil = DomUtil;
  exports.Draggable = Draggable;
  exports.Evented = Evented;
  exports.FeatureGroup = FeatureGroup;
  exports.GeoJSON = GeoJSON;
  exports.GridLayer = GridLayer;
  exports.Handler = Handler;
  exports.Icon = Icon;
  exports.ImageOverlay = ImageOverlay;
  exports.LatLng = LatLng;
  exports.LatLngBounds = LatLngBounds;
  exports.Layer = Layer;
  exports.LayerGroup = LayerGroup;
  exports.LineUtil = LineUtil;
  exports.Map = Map;
  exports.Marker = Marker;
  exports.Mixin = Mixin;
  exports.Path = Path;
  exports.Point = Point;
  exports.PolyUtil = PolyUtil;
  exports.Polygon = Polygon;
  exports.Polyline = Polyline;
  exports.Popup = Popup;
  exports.PosAnimation = PosAnimation;
  exports.Projection = index;
  exports.Rectangle = Rectangle;
  exports.Renderer = Renderer;
  exports.SVG = SVG;
  exports.SVGOverlay = SVGOverlay;
  exports.TileLayer = TileLayer;
  exports.Tooltip = Tooltip;
  exports.Transformation = Transformation;
  exports.Util = Util;
  exports.VideoOverlay = VideoOverlay;
  exports.bind = bind;
  exports.bounds = toBounds;
  exports.canvas = canvas;
  exports.circle = circle;
  exports.circleMarker = circleMarker;
  exports.control = control;
  exports.divIcon = divIcon;
  exports.extend = extend;
  exports.featureGroup = featureGroup;
  exports.geoJSON = geoJSON;
  exports.geoJson = geoJson;
  exports.gridLayer = gridLayer;
  exports.icon = icon;
  exports.imageOverlay = imageOverlay;
  exports.latLng = toLatLng;
  exports.latLngBounds = toLatLngBounds;
  exports.layerGroup = layerGroup;
  exports.map = createMap;
  exports.marker = marker;
  exports.point = toPoint;
  exports.polygon = polygon;
  exports.polyline = polyline;
  exports.popup = popup;
  exports.rectangle = rectangle;
  exports.setOptions = setOptions;
  exports.stamp = stamp;
  exports.svg = svg;
  exports.svgOverlay = svgOverlay;
  exports.tileLayer = tileLayer;
  exports.tooltip = tooltip;
  exports.transformation = toTransformation;
  exports.version = version;
  exports.videoOverlay = videoOverlay;
  var oldL = window.L;

  exports.noConflict = function () {
    window.L = oldL;
    return this;
  }; // Always export us to window global (see #2364)


  window.L = exports;
});

/***/ }),

/***/ 6431:
/***/ (function(module) {

"use strict";
module.exports = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAABSCAMAAAAhFXfZAAAC91BMVEVMaXEzeak2f7I4g7g3g7cua5gzeKg8hJo3grY4g7c3grU0gLI2frE0daAubJc2gbQwd6QzeKk2gLMtd5sxdKIua5g1frA2f7IydaM0e6w2fq41fK01eqo3grgubJgta5cxdKI1f7AydaQydaMxc6EubJgvbJkwcZ4ubZkwcJwubZgubJcydqUydKIxapgubJctbJcubZcubJcvbJYubJcvbZkubJctbJctbZcubJg2f7AubJcrbZcubJcubJcua5g3grY0fq8ubJcubJdEkdEwhsw6i88vhswuhcsuhMtBjMgthMsrg8srgss6is8qgcs8i9A9iMYtg8spgcoogMo7hcMngMonf8olfso4gr8kfck5iM8jfMk4iM8he8k1fro7itAgesk2hs8eecgzfLcofssdeMg0hc4cd8g2hcsxeLQbdsgZdcgxeLImfcszhM0vda4xgckzhM4xg84wf8Yxgs4udKsvfcQucqhUndROmdM1fK0wcZ8vb5w0eqpQm9MzeKhXoNVcpdYydKNWn9VZotVKltJFjsIwcJ1Rms9OlslLmtH///8+kc9epdYzd6dbo9VHkMM2f7FHmNBClM8ydqVcpNY9hro3gLM9hLczealQmcw3fa46f7A8gLMxc6I3eagyc6FIldJMl9JSnNRSntNNl9JPnNJFi75UnM9ZodVKksg8kM45jc09e6ZHltFBk883gbRBh7pDk9EwcaBzn784g7dKkcY2i81Om9M7j85Llc81is09g7Q4grY/j9A0eqxKmdFFltBEjcXf6fFImdBCiLxJl9FGlNFBi78yiMxVndEvbpo6js74+vx+psPP3+o/ks5HkcpGmNCjwdZCkNDM3ehYoNJEls+lxNkxh8xHks0+jdC1zd5Lg6r+/v/H2ufz9/o3jM3t8/edvdM/k89Th61OiLBSjbZklbaTt9BfptdjmL1AicBHj8hGk9FAgK1dkLNTjLRekrdClc/k7fM0icy0y9tgp9c4jc2NtM9Dlc8zicxeXZn3AAAAQ3RSTlMAHDdTb4yPA+LtnEQmC4L2EmHqB7XA0d0sr478x4/Yd5i1zOfyPkf1sLVq4Nh3FvjxopQ2/STNuFzUwFIwxKaejILpIBEV9wAABhVJREFUeF6s1NdyFEcYBeBeoQIhRAkLlRDGrhIgY3BJL8CVeKzuyXFzzjkn5ZxzzuScg3PO8cKzu70JkO0LfxdTU//pM9vTu7Xgf6KqOVTb9X7toRrVEfBf1HTVjZccrT/2by1VV928Yty9ZbVuucdz90frG8DBjl9pVApbOstvmMuvVgaNXSfAAd6pGxpy6yxf5ph43pS/4f3uoaGm2rdu72S9xzOvMymkZFq/ptDrk90mhW7e4zl7HLzhxGWPR20xmSxJ/VqldG5m9XhaVOA1DadsNh3Pu5L2N6QtPO/32JpqQBVVk20oy/Pi2s23WEvyfHbe1thadVQttvm7Llf65gGmXK67XtupyoM7HQhmXdLS8oGWJNeOJ3C5fG5XCEJnkez3/oFdsvgJ4l2ANZwhrJKk/7OSXa+3Vw2WJMlKnGkobouYk6T0TyX30klOUnTD9HJ5qpckL3EW/w4XF3Xd0FGywXUrstrclVsqz5Pd/sXFYyDnPdrLcQODmGOK47IZb4CmibmMn+MYRzFZ5jg33ZL/EJrWcszHmANy3ARBK/IXtciJy8VsitPSdE3uuHxzougojcUdr8/32atnz/ev3f/K5wtpxUTpcaI45zusVDpYtZi+jg0oU9b3x74h7+n9ABvYEZeKaVq0sh0AtLKsFtqNBdeT0MrSzwwlq9+x6xAO4tgOtSzbCjrNQQiNvQUbUEubvzBUeGw26yDCsRHCoLkTHDa7IdOLIThs/gHvChszh2CimE8peRs47cxANI0lYNB5y1DljpOF0IhzBDPOZnDOqYYbeGKECbPzWnXludPphw5c2YBq5zlwXphIbO4VDCZ0gnPfUO1TwZoYwAs2ExPCedAu9DAjfQUjzITQb3jNj0KG2Sgt6BHaQUdYzWz+XmBktOHwanXjaSTcwwziBcuMOtwBmqPrTOxFQR/DRKKPqyur0aiW6cULYsx6tBm0jXpR/AUWR6HRq9WVW6MRhIq5jLyjbaCTDCijyYJNpCajdyobP/eTw0iexBAKkJ3gA5KcQb2zBXsIBckn+xVv8jkZSaEFHE+jFEleAEfayRU0MouNoBmB/L50Ai/HSLIHxcrpCvnhSQAuakKp2C/YbCylJjXRVy/z3+Kv/RrNcCo+WUzlVEhzKffnTQnxeN9fWF88fiNCUdSTsaufaChKWInHeysygfpIqagoakW+vV20J8uyl6TyNKEZWV4oRSPyCkWpgOLSbkCObT8o2r6tlG58HQquf6O0v50tB7JM7F4EORd2dx/K0w/KHsVkLPaoYrwgP/y7krr3SSMA4zj+OBgmjYkxcdIJQyQRKgg2viX9Hddi9UBb29LrKR7CVVEEEXWojUkXNyfTNDE14W9gbHJNuhjDettN3ZvbOvdOqCD3Jp/9l+/wJE+9PkYGjx/fqkys3S2rMozM/o2106rfMUINo6hVqz+eu/hd1c4xTg0TAfy5kV+4UG6+IthHTU9woWmxuKNbTfuCSfovBCxq7EtHqvYL4Sm6F8GVxsSXHMQ07TOi1DKtZxjWaaIyi4CXWjxPccUw8WVbMYY5wxC1mzEyXMJWkllpRloi+Kkoq69sxBTlElF6aAxYUbjXNlhlDZilDnM4U5SlN5biRsRHnbx3mbeWjEh4mEyiuJDl5XcWVmX5GvNkFgLWZM5qwsop4/AWfLhU1cR7k1VVvcYCWRkOI6Xy5gmnphCYIkvzuNYzHzosq2oNk2RtSs8khfUOfHIDgR6ysYBaMpl4uEgk2U/oJTs9AaTSwma7dT69geAE2ZpEjUsn2ieJNHeKfrI3EcAGJ2ZaNgVuC8EBctCLc57P5u5led6IOBkIYkuQMrmmjChs4VkfOerHqSBkPzZlhe06RslZ3zMjk2sscqKwY0RcjKK+LWbzd7KiHhkncs/siFJ+V5eXxD34B8nVuJEpGJNmxN2gH3vSvp7J70tF+D1Ej8qUJD1TkErAND2GZwTFg/LubvmgiBG3SOvdlsqFQrkEzJCL1rstlnVFROixZoDDSuXQFHESwVGlcuQcMb/b42NgjLowh5MTDFE3vNB5qStRIErdCQEh6pLPR92anSUb/wAIhldAaDMpGgAAAABJRU5ErkJggg==";

/***/ }),

/***/ 7093:
/***/ (function(module) {

"use strict";
module.exports = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAApCAYAAADAk4LOAAAFgUlEQVR4Aa1XA5BjWRTN2oW17d3YaZtr2962HUzbDNpjszW24mRt28p47v7zq/bXZtrp/lWnXr337j3nPCe85NcypgSFdugCpW5YoDAMRaIMqRi6aKq5E3YqDQO3qAwjVWrD8Ncq/RBpykd8oZUb/kaJutow8r1aP9II0WmLKLIsJyv1w/kqw9Ch2MYdB++12Onxee/QMwvf4/Dk/Lfp/i4nxTXtOoQ4pW5Aj7wpici1A9erdAN2OH64x8OSP9j3Ft3b7aWkTg/Fm91siTra0f9on5sQr9INejH6CUUUpavjFNq1B+Oadhxmnfa8RfEmN8VNAsQhPqF55xHkMzz3jSmChWU6f7/XZKNH+9+hBLOHYozuKQPxyMPUKkrX/K0uWnfFaJGS1QPRtZsOPtr3NsW0uyh6NNCOkU3Yz+bXbT3I8G3xE5EXLXtCXbbqwCO9zPQYPRTZ5vIDXD7U+w7rFDEoUUf7ibHIR4y6bLVPXrz8JVZEql13trxwue/uDivd3fkWRbS6/IA2bID4uk0UpF1N8qLlbBlXs4Ee7HLTfV1j54APvODnSfOWBqtKVvjgLKzF5YdEk5ewRkGlK0i33Eofffc7HT56jD7/6U+qH3Cx7SBLNntH5YIPvODnyfIXZYRVDPqgHtLs5ABHD3YzLuespb7t79FY34DjMwrVrcTuwlT55YMPvOBnRrJ4VXTdNnYug5ucHLBjEpt30701A3Ts+HEa73u6dT3FNWwflY86eMHPk+Yu+i6pzUpRrW7SNDg5JHR4KapmM5Wv2E8Tfcb1HoqqHMHU+uWDD7zg54mz5/2BSnizi9T1Dg4QQXLToGNCkb6tb1NU+QAlGr1++eADrzhn/u8Q2YZhQVlZ5+CAOtqfbhmaUCS1ezNFVm2imDbPmPng5wmz+gwh+oHDce0eUtQ6OGDIyR0uUhUsoO3vfDmmgOezH0mZN59x7MBi++WDL1g/eEiU3avlidO671bkLfwbw5XV2P8Pzo0ydy4t2/0eu33xYSOMOD8hTf4CrBtGMSoXfPLchX+J0ruSePw3LZeK0juPJbYzrhkH0io7B3k164hiGvawhOKMLkrQLyVpZg8rHFW7E2uHOL888IBPlNZ1FPzstSJM694fWr6RwpvcJK60+0HCILTBzZLFNdtAzJaohze60T8qBzyh5ZuOg5e7uwQppofEmf2++DYvmySqGBuKaicF1blQjhuHdvCIMvp8whTTfZzI7RldpwtSzL+F1+wkdZ2TBOW2gIF88PBTzD/gpeREAMEbxnJcaJHNHrpzji0gQCS6hdkEeYt9DF/2qPcEC8RM28Hwmr3sdNyht00byAut2k3gufWNtgtOEOFGUwcXWNDbdNbpgBGxEvKkOQsxivJx33iow0Vw5S6SVTrpVq11ysA2Rp7gTfPfktc6zhtXBBC+adRLshf6sG2RfHPZ5EAc4sVZ83yCN00Fk/4kggu40ZTvIEm5g24qtU4KjBrx/BTTH8ifVASAG7gKrnWxJDcU7x8X6Ecczhm3o6YicvsLXWfh3Ch1W0k8x0nXF+0fFxgt4phz8QvypiwCCFKMqXCnqXExjq10beH+UUA7+nG6mdG/Pu0f3LgFcGrl2s0kNNjpmoJ9o4B29CMO8dMT4Q5ox8uitF6fqsrJOr8qnwNbRzv6hSnG5wP+64C7h9lp30hKNtKdWjtdkbuPA19nJ7Tz3zR/ibgARbhb4AlhavcBebmTHcFl2fvYEnW0ox9xMxKBS8btJ+KiEbq9zA4RthQXDhPa0T9TEe69gWupwc6uBUphquXgf+/FrIjweHQS4/pduMe5ERUMHUd9xv8ZR98CxkS4F2n3EUrUZ10EYNw7BWm9x1GiPssi3GgiGRDKWRYZfXlON+dfNbM+GgIwYdwAAAAASUVORK5CYII=";

/***/ }),

/***/ 8858:
/***/ (function(module) {

"use strict";
module.exports = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACkAAAApCAQAAAACach9AAACMUlEQVR4Ae3ShY7jQBAE0Aoz/f9/HTMzhg1zrdKUrJbdx+Kd2nD8VNudfsL/Th///dyQN2TH6f3y/BGpC379rV+S+qqetBOxImNQXL8JCAr2V4iMQXHGNJxeCfZXhSRBcQMfvkOWUdtfzlLgAENmZDcmo2TVmt8OSM2eXxBp3DjHSMFutqS7SbmemzBiR+xpKCNUIRkdkkYxhAkyGoBvyQFEJEefwSmmvBfJuJ6aKqKWnAkvGZOaZXTUgFqYULWNSHUckZuR1HIIimUExutRxwzOLROIG4vKmCKQt364mIlhSyzAf1m9lHZHJZrlAOMMztRRiKimp/rpdJDc9Awry5xTZCte7FHtuS8wJgeYGrex28xNTd086Dik7vUMscQOa8y4DoGtCCSkAKlNwpgNtphjrC6MIHUkR6YWxxs6Sc5xqn222mmCRFzIt8lEdKx+ikCtg91qS2WpwVfBelJCiQJwvzixfI9cxZQWgiSJelKnwBElKYtDOb2MFbhmUigbReQBV0Cg4+qMXSxXSyGUn4UbF8l+7qdSGnTC0XLCmahIgUHLhLOhpVCtw4CzYXvLQWQbJNmxoCsOKAxSgBJno75avolkRw8iIAFcsdc02e9iyCd8tHwmeSSoKTowIgvscSGZUOA7PuCN5b2BX9mQM7S0wYhMNU74zgsPBj3HU7wguAfnxxjFQGBE6pwN+GjME9zHY7zGp8wVxMShYX9NXvEWD3HbwJf4giO4CFIQxXScH1/TM+04kkBiAAAAAElFTkSuQmCC";

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	!function() {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = function(exports, definition) {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/global */
/******/ 	!function() {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	!function() {
/******/ 		__webpack_require__.o = function(obj, prop) { return Object.prototype.hasOwnProperty.call(obj, prop); }
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/publicPath */
/******/ 	!function() {
/******/ 		__webpack_require__.p = "";
/******/ 	}();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
!function() {
"use strict";

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "default": function() { return /* binding */ entry_lib; }
});

;// CONCATENATED MODULE: ./node_modules/@vue/cli-service/lib/commands/build/setPublicPath.js
/* eslint-disable no-var */
// This file is imported into lib/wc client bundles.

if (typeof window !== 'undefined') {
  var currentScript = window.document.currentScript
  if (true) {
    var getCurrentScript = __webpack_require__(858)
    currentScript = getCurrentScript()

    // for backward compatibility, because previously we directly included the polyfill
    if (!('currentScript' in document)) {
      Object.defineProperty(document, 'currentScript', { get: getCurrentScript })
    }
  }

  var src = currentScript && currentScript.src.match(/(.+\/)[^/]+\.js(\?.*)?$/)
  if (src) {
    __webpack_require__.p = src[1] // eslint-disable-line
  }
}

// Indicate to webpack that this file can be concatenated
/* harmony default export */ var setPublicPath = (null);

;// CONCATENATED MODULE: ./node_modules/@vue/vue-loader-v15/lib/loaders/templateLoader.js??vue-loader-options!./node_modules/@vue/vue-loader-v15/lib/index.js??vue-loader-options!./src/components/SheetsMap.vue?vue&type=template&id=61fbe1d0&scoped=true&
var render = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',[_c('div',[_c('l-map',{staticStyle:{"height":"80vh"},attrs:{"zoom":_vm.zoom,"center":_vm.center}},[_c('l-tile-layer',{attrs:{"url":_vm.url,"attribution":_vm.attribution}}),_c('l-marker',{attrs:{"lat-lng":_vm.markerLatLng}})],1)],1),_c('div',[_c('h3',[_vm._v("Sheets Map")]),_c('ul',[_c('li',[_vm._v("id: "+_vm._s(_vm.id)+" ")]),_c('li',[_vm._v("entity_type_id: "+_vm._s(_vm.entity_type_id)+" ")]),_c('li',[_vm._v("config_entity_id: "+_vm._s(_vm.config_entity_id)+" ")]),_c('li',[_vm._v("endpoint_config: "+_vm._s(_vm.endpoint_config)+" ")]),_c('li',[_vm._v("code: "+_vm._s(_vm.code)+" ")]),_c('li',[_vm._v("active_filters: "+_vm._s(_vm.active_filters)+" ")])])])])}
var staticRenderFns = []


// EXTERNAL MODULE: ./node_modules/core-js/modules/es.array.slice.js
var es_array_slice = __webpack_require__(7042);
// EXTERNAL MODULE: ./node_modules/core-js/modules/es.symbol.js
var es_symbol = __webpack_require__(2526);
// EXTERNAL MODULE: ./node_modules/core-js/modules/es.symbol.description.js
var es_symbol_description = __webpack_require__(1817);
// EXTERNAL MODULE: ./node_modules/core-js/modules/es.object.to-string.js
var es_object_to_string = __webpack_require__(1539);
// EXTERNAL MODULE: ./node_modules/core-js/modules/es.json.stringify.js
var es_json_stringify = __webpack_require__(8862);
// EXTERNAL MODULE: ./node_modules/core-js/modules/es.number.constructor.js
var es_number_constructor = __webpack_require__(9653);
// EXTERNAL MODULE: ./node_modules/core-js/modules/web.dom-collections.for-each.js
var web_dom_collections_for_each = __webpack_require__(4747);
// EXTERNAL MODULE: ./node_modules/core-js/modules/es.array.find.js
var es_array_find = __webpack_require__(9826);
// EXTERNAL MODULE: ./node_modules/core-js/modules/es.array.filter.js
var es_array_filter = __webpack_require__(7327);
// EXTERNAL MODULE: ./node_modules/core-js/modules/es.function.name.js
var es_function_name = __webpack_require__(8309);
// EXTERNAL MODULE: ./node_modules/core-js/modules/es.object.assign.js
var es_object_assign = __webpack_require__(9601);
// EXTERNAL MODULE: ./node_modules/core-js/modules/es.array.concat.js
var es_array_concat = __webpack_require__(2222);
// EXTERNAL MODULE: ./node_modules/core-js/modules/es.regexp.exec.js
var es_regexp_exec = __webpack_require__(4916);
// EXTERNAL MODULE: ./node_modules/core-js/modules/es.regexp.test.js
var es_regexp_test = __webpack_require__(7601);
// EXTERNAL MODULE: ./node_modules/core-js/modules/es.array.iterator.js
var es_array_iterator = __webpack_require__(6992);
// EXTERNAL MODULE: ./node_modules/core-js/modules/es.set.js
var es_set = __webpack_require__(189);
// EXTERNAL MODULE: ./node_modules/core-js/modules/es.string.iterator.js
var es_string_iterator = __webpack_require__(8783);
// EXTERNAL MODULE: ./node_modules/core-js/modules/web.dom-collections.iterator.js
var web_dom_collections_iterator = __webpack_require__(3948);
// EXTERNAL MODULE: ./node_modules/core-js/modules/es.array.map.js
var es_array_map = __webpack_require__(1249);
// EXTERNAL MODULE: ./node_modules/core-js/modules/web.btoa.js
var web_btoa = __webpack_require__(7479);
// EXTERNAL MODULE: ./node_modules/core-js/modules/web.dom-exception.constructor.js
var web_dom_exception_constructor = __webpack_require__(7714);
// EXTERNAL MODULE: ./node_modules/core-js/modules/web.dom-exception.stack.js
var web_dom_exception_stack = __webpack_require__(2801);
// EXTERNAL MODULE: ./node_modules/core-js/modules/web.dom-exception.to-string-tag.js
var web_dom_exception_to_string_tag = __webpack_require__(1174);
// EXTERNAL MODULE: ./node_modules/core-js/modules/es.array.join.js
var es_array_join = __webpack_require__(9600);
// EXTERNAL MODULE: ./node_modules/leaflet/dist/leaflet-src.js
var leaflet_src = __webpack_require__(9014);
;// CONCATENATED MODULE: ./node_modules/vue2-leaflet/dist/components/LMap.js


























var debounce = function debounce(fn, time) {
  var timeout;

  var debouncedFunction = function debouncedFunction() {
    var args = [],
        len = arguments.length;

    while (len--) {
      args[len] = arguments[len];
    }

    var context = this;

    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(function () {
      fn.apply(context, args);
      timeout = null;
    }, time);
  };

  debouncedFunction.cancel = function () {
    if (timeout) {
      clearTimeout(timeout);
    }
  };

  return debouncedFunction;
};

var capitalizeFirstLetter = function capitalizeFirstLetter(string) {
  if (!string || typeof string.charAt !== 'function') {
    return string;
  }

  return string.charAt(0).toUpperCase() + string.slice(1);
};

var propsBinder = function propsBinder(vueElement, leafletElement, props, options) {
  var loop = function loop(key) {
    var setMethodName = 'set' + capitalizeFirstLetter(key);
    var deepValue = props[key].type === Object || props[key].type === Array || Array.isArray(props[key].type);

    if (props[key].custom && vueElement[setMethodName]) {
      vueElement.$watch(key, function (newVal, oldVal) {
        vueElement[setMethodName](newVal, oldVal);
      }, {
        deep: deepValue
      });
    } else if (setMethodName === 'setOptions') {
      vueElement.$watch(key, function (newVal, oldVal) {
        (0,leaflet_src.setOptions)(leafletElement, newVal);
      }, {
        deep: deepValue
      });
    } else if (leafletElement[setMethodName]) {
      vueElement.$watch(key, function (newVal, oldVal) {
        leafletElement[setMethodName](newVal);
      }, {
        deep: deepValue
      });
    }
  };

  for (var key in props) {
    loop(key);
  }
};

var collectionCleaner = function collectionCleaner(options) {
  var result = {};

  for (var key in options) {
    var value = options[key];

    if (value !== null && value !== undefined) {
      result[key] = value;
    }
  }

  return result;
};

var optionsMerger = function optionsMerger(props, instance) {
  var options = instance.options && instance.options.constructor === Object ? instance.options : {};
  props = props && props.constructor === Object ? props : {};
  var result = collectionCleaner(options);
  props = collectionCleaner(props);
  var defaultProps = instance.$options.props;

  for (var key in props) {
    var def = defaultProps[key] ? defaultProps[key].default && typeof defaultProps[key].default === 'function' ? defaultProps[key].default.call() : defaultProps[key].default : Symbol('unique');
    var isEqual = false;

    if (Array.isArray(def)) {
      isEqual = JSON.stringify(def) === JSON.stringify(props[key]);
    } else {
      isEqual = def === props[key];
    }

    if (result[key] && !isEqual) {
      console.warn(key + " props is overriding the value passed in the options props");
      result[key] = props[key];
    } else if (!result[key]) {
      result[key] = props[key];
    }
  }

  return result;
};

var Options = {
  props: {
    /**
     * Leaflet options to pass to the component constructor
     */
    options: {
      type: Object,
      default: function _default() {
        return {};
      }
    }
  }
}; //

/**
 * Base component, contains and wrap all the other components.
 */

var script = {
  name: 'LMap',
  mixins: [Options],
  props: {
    /**
     * The center of the map, supports .sync modifier
     */
    center: {
      type: [Object, Array],
      custom: true,
      default: function _default() {
        return [0, 0];
      }
    },

    /**
     * The bounds of the map, supports .sync modifier
     */
    bounds: {
      type: [Array, Object],
      custom: true,
      default: null
    },

    /**
     * The max bounds of the map
     */
    maxBounds: {
      type: [Array, Object],
      default: null
    },

    /**
     * The zoom of the map, supports .sync modifier
     */
    zoom: {
      type: Number,
      custom: true,
      default: 0
    },

    /**
     * The minZoom of the map
     */
    minZoom: {
      type: Number,
      default: null
    },

    /**
     * The maxZoom of the map
     */
    maxZoom: {
      type: Number,
      default: null
    },

    /**
     * The paddingBottomRight of the map
     */
    paddingBottomRight: {
      type: Array,
      custom: true,
      default: null
    },

    /**
     * The paddingTopLeft of the map
     */
    paddingTopLeft: {
      type: Array,
      custom: true,
      default: null
    },

    /**
     * The padding of the map
     */
    padding: {
      type: Array,
      custom: true,
      default: null
    },

    /**
     * The worldCopyJump option for the map
     */
    worldCopyJump: {
      type: Boolean,
      default: false
    },

    /**
     * The crs option for the map
     * @values CRS.EPSG3857
     */
    crs: {
      type: Object,
      custom: true,
      default: function _default() {
        return leaflet_src.CRS.EPSG3857;
      }
    },
    maxBoundsViscosity: {
      type: Number,
      default: null
    },
    inertia: {
      type: Boolean,
      default: null
    },
    inertiaDeceleration: {
      type: Number,
      default: null
    },
    inertiaMaxSpeed: {
      type: Number,
      default: null
    },
    easeLinearity: {
      type: Number,
      default: null
    },
    zoomAnimation: {
      type: Boolean,
      default: null
    },
    zoomAnimationThreshold: {
      type: Number,
      default: null
    },
    fadeAnimation: {
      type: Boolean,
      default: null
    },
    markerZoomAnimation: {
      type: Boolean,
      default: null
    },
    noBlockingAnimations: {
      type: Boolean,
      default: false
    }
  },
  data: function data() {
    return {
      ready: false,
      lastSetCenter: this.center ? (0,leaflet_src.latLng)(this.center) : null,
      lastSetBounds: this.bounds ? (0,leaflet_src.latLngBounds)(this.bounds) : null,
      layerControl: undefined,
      layersToAdd: [],
      layersInControl: []
    };
  },
  computed: {
    fitBoundsOptions: function fitBoundsOptions() {
      var options = {
        animate: this.noBlockingAnimations ? false : null
      };

      if (this.padding) {
        options.padding = this.padding;
      } else {
        if (this.paddingBottomRight) {
          options.paddingBottomRight = this.paddingBottomRight;
        }

        if (this.paddingTopLeft) {
          options.paddingTopLeft = this.paddingTopLeft;
        }
      }

      return options;
    }
  },
  beforeDestroy: function beforeDestroy() {
    if (this.debouncedMoveEndHandler) {
      this.debouncedMoveEndHandler.cancel();
    }

    if (this.mapObject) {
      this.mapObject.remove();
    }
  },
  mounted: function mounted() {
    var this$1 = this;
    var options = optionsMerger({
      minZoom: this.minZoom,
      maxZoom: this.maxZoom,
      maxBounds: this.maxBounds,
      maxBoundsViscosity: this.maxBoundsViscosity,
      worldCopyJump: this.worldCopyJump,
      crs: this.crs,
      center: this.center,
      zoom: this.zoom,
      inertia: this.inertia,
      inertiaDeceleration: this.inertiaDeceleration,
      inertiaMaxSpeed: this.inertiaMaxSpeed,
      easeLinearity: this.easeLinearity,
      zoomAnimation: this.zoomAnimation,
      zoomAnimationThreshold: this.zoomAnimationThreshold,
      fadeAnimation: this.fadeAnimation,
      markerZoomAnimation: this.markerZoomAnimation
    }, this);
    this.mapObject = (0,leaflet_src.map)(this.$el, options);

    if (this.bounds) {
      this.fitBounds(this.bounds);
    }

    this.debouncedMoveEndHandler = debounce(this.moveEndHandler, 100);
    this.mapObject.on('moveend', this.debouncedMoveEndHandler);
    this.mapObject.on('overlayadd', this.overlayAddHandler);
    this.mapObject.on('overlayremove', this.overlayRemoveHandler);
    leaflet_src.DomEvent.on(this.mapObject, this.$listeners);
    propsBinder(this, this.mapObject, this.$options.props);
    this.ready = true;
    /**
     * DEPRECATED event
     * @deprecated
     */

    this.$emit('leaflet:load');
    this.$nextTick(function () {
      /**
       * Triggers when the component is ready
       * @type {object}
       * @property {object} mapObject - reference to leaflet map object
       */
      this$1.$emit('ready', this$1.mapObject);
    });
  },
  methods: {
    registerLayerControl: function registerLayerControl(lControlLayers) {
      var this$1 = this;
      this.layerControl = lControlLayers;
      this.mapObject.addControl(lControlLayers.mapObject);
      this.layersToAdd.forEach(function (layer) {
        this$1.layerControl.addLayer(layer);
      });
      this.layersToAdd = [];
    },
    addLayer: function addLayer(layer, alreadyAdded) {
      if (layer.layerType !== undefined) {
        if (this.layerControl === undefined) {
          this.layersToAdd.push(layer);
        } else {
          var exist = this.layersInControl.find(function (l) {
            return l.mapObject._leaflet_id === layer.mapObject._leaflet_id;
          });

          if (!exist) {
            this.layerControl.addLayer(layer);
            this.layersInControl.push(layer);
          }
        }
      }

      if (!alreadyAdded && layer.visible !== false) {
        this.mapObject.addLayer(layer.mapObject);
      }
    },
    hideLayer: function hideLayer(layer) {
      this.mapObject.removeLayer(layer.mapObject);
    },
    removeLayer: function removeLayer(layer, alreadyRemoved) {
      if (layer.layerType !== undefined) {
        if (this.layerControl === undefined) {
          this.layersToAdd = this.layersToAdd.filter(function (l) {
            return l.name !== layer.name;
          });
        } else {
          this.layerControl.removeLayer(layer);
          this.layersInControl = this.layersInControl.filter(function (l) {
            return l.mapObject._leaflet_id !== layer.mapObject._leaflet_id;
          });
        }
      }

      if (!alreadyRemoved) {
        this.mapObject.removeLayer(layer.mapObject);
      }
    },
    setZoom: function setZoom(newVal, oldVal) {
      if (newVal === undefined || newVal === null) {
        return;
      }

      this.mapObject.setZoom(newVal, {
        animate: this.noBlockingAnimations ? false : null
      });
      this.cacheMapView();
    },
    setCenter: function setCenter(newVal, oldVal) {
      if (newVal == null) {
        return;
      }

      var newCenter = (0,leaflet_src.latLng)(newVal);
      var oldCenter = this.lastSetCenter || this.mapObject.getCenter();

      if (oldCenter.lat !== newCenter.lat || oldCenter.lng !== newCenter.lng) {
        this.lastSetCenter = newCenter;
        this.mapObject.panTo(newCenter, {
          animate: this.noBlockingAnimations ? false : null
        });
        this.cacheMapView(undefined, newCenter);
      }
    },
    setBounds: function setBounds(newVal, oldVal) {
      if (!newVal) {
        return;
      }

      var newBounds = (0,leaflet_src.latLngBounds)(newVal);

      if (!newBounds.isValid()) {
        return;
      }

      var oldBounds = this.lastSetBounds || this.mapObject.getBounds();
      var boundsChanged = !oldBounds.equals(newBounds, 0); // set maxMargin to 0 - check exact equals

      if (boundsChanged) {
        this.fitBounds(newBounds);
        this.cacheMapView(newBounds);
      }
    },
    setPaddingBottomRight: function setPaddingBottomRight(newVal, oldVal) {
      this.paddingBottomRight = newVal;
    },
    setPaddingTopLeft: function setPaddingTopLeft(newVal, oldVal) {
      this.paddingTopLeft = newVal;
    },
    setPadding: function setPadding(newVal, oldVal) {
      this.padding = newVal;
    },
    setCrs: function setCrs(newVal, oldVal) {
      var mapObject = this.mapObject,
          prevBounds = mapObject.getBounds();
      mapObject.options.crs = newVal;
      this.fitBounds(prevBounds, {
        animate: false
      });
    },
    fitBounds: function fitBounds(bounds, overrideOptions) {
      this.mapObject.fitBounds(bounds, Object.assign({}, this.fitBoundsOptions, overrideOptions));
    },
    moveEndHandler: function moveEndHandler() {
      /**
       * Triggers when zoom is updated
       * @type {number,string}
       */
      this.$emit('update:zoom', this.mapObject.getZoom());
      var center = this.mapObject.getCenter();
      /**
       * Triggers when center is updated
       * @type {object,array}
       */

      this.$emit('update:center', center);
      var bounds = this.mapObject.getBounds();
      /**
       * Triggers when bounds are updated
       * @type {object}
       */

      this.$emit('update:bounds', bounds);
    },
    overlayAddHandler: function overlayAddHandler(e) {
      var layer = this.layersInControl.find(function (l) {
        return l.name === e.name;
      });

      if (layer) {
        layer.updateVisibleProp(true);
      }
    },
    overlayRemoveHandler: function overlayRemoveHandler(e) {
      var layer = this.layersInControl.find(function (l) {
        return l.name === e.name;
      });

      if (layer) {
        layer.updateVisibleProp(false);
      }
    },
    cacheMapView: function cacheMapView(bounds, center) {
      // Cache the last values used to define the map view by mutating props.
      this.lastSetBounds = bounds || this.mapObject.getBounds();
      this.lastSetCenter = center || this.lastSetBounds.getCenter();
    }
  }
};

function normalizeComponent(template, style, script, scopeId, isFunctionalTemplate, moduleIdentifier
/* server only */
, shadowMode, createInjector, createInjectorSSR, createInjectorShadow) {
  if (typeof shadowMode !== 'boolean') {
    createInjectorSSR = createInjector;
    createInjector = shadowMode;
    shadowMode = false;
  } // Vue.extend constructor export interop.


  var options = typeof script === 'function' ? script.options : script; // render functions

  if (template && template.render) {
    options.render = template.render;
    options.staticRenderFns = template.staticRenderFns;
    options._compiled = true; // functional template

    if (isFunctionalTemplate) {
      options.functional = true;
    }
  } // scopedId


  if (scopeId) {
    options._scopeId = scopeId;
  }

  var hook;

  if (moduleIdentifier) {
    // server build
    hook = function hook(context) {
      // 2.3 injection
      context = context || // cached call
      this.$vnode && this.$vnode.ssrContext || // stateful
      this.parent && this.parent.$vnode && this.parent.$vnode.ssrContext; // functional
      // 2.2 with runInNewContext: true

      if (!context && typeof __VUE_SSR_CONTEXT__ !== 'undefined') {
        context = __VUE_SSR_CONTEXT__;
      } // inject component styles


      if (style) {
        style.call(this, createInjectorSSR(context));
      } // register component module identifier for async chunk inference


      if (context && context._registeredComponents) {
        context._registeredComponents.add(moduleIdentifier);
      }
    }; // used by ssr in case component is cached and beforeCreate
    // never gets called


    options._ssrRegister = hook;
  } else if (style) {
    hook = shadowMode ? function (context) {
      style.call(this, createInjectorShadow(context, this.$root.$options.shadowRoot));
    } : function (context) {
      style.call(this, createInjector(context));
    };
  }

  if (hook) {
    if (options.functional) {
      // register for functional component in vue file
      var originalRender = options.render;

      options.render = function renderWithStyleInjection(h, context) {
        hook.call(context);
        return originalRender(h, context);
      };
    } else {
      // inject component registration as beforeCreate hook
      var existing = options.beforeCreate;
      options.beforeCreate = existing ? [].concat(existing, hook) : [hook];
    }
  }

  return script;
}

var isOldIE = typeof navigator !== 'undefined' && /msie [6-9]\\b/.test(navigator.userAgent.toLowerCase());

function createInjector(context) {
  return function (id, style) {
    return addStyle(id, style);
  };
}

var HEAD;
var styles = {};

function addStyle(id, css) {
  var group = isOldIE ? css.media || 'default' : id;
  var style = styles[group] || (styles[group] = {
    ids: new Set(),
    styles: []
  });

  if (!style.ids.has(id)) {
    style.ids.add(id);
    var code = css.source;

    if (css.map) {
      // https://developer.chrome.com/devtools/docs/javascript-debugging
      // this makes source maps inside style tags work properly in Chrome
      code += '\n/*# sourceURL=' + css.map.sources[0] + ' */'; // http://stackoverflow.com/a/26603875

      code += '\n/*# sourceMappingURL=data:application/json;base64,' + btoa(unescape(encodeURIComponent(JSON.stringify(css.map)))) + ' */';
    }

    if (!style.element) {
      style.element = document.createElement('style');
      style.element.type = 'text/css';

      if (css.media) {
        style.element.setAttribute('media', css.media);
      }

      if (HEAD === undefined) {
        HEAD = document.head || document.getElementsByTagName('head')[0];
      }

      HEAD.appendChild(style.element);
    }

    if ('styleSheet' in style.element) {
      style.styles.push(code);
      style.element.styleSheet.cssText = style.styles.filter(Boolean).join('\n');
    } else {
      var index = style.ids.size - 1;
      var textNode = document.createTextNode(code);
      var nodes = style.element.childNodes;

      if (nodes[index]) {
        style.element.removeChild(nodes[index]);
      }

      if (nodes.length) {
        style.element.insertBefore(textNode, nodes[index]);
      } else {
        style.element.appendChild(textNode);
      }
    }
  }
}
/* script */


var __vue_script__ = script;
/* template */

var __vue_render__ = function __vue_render__() {
  var _vm = this;

  var _h = _vm.$createElement;

  var _c = _vm._self._c || _h;

  return _c('div', {
    staticClass: "vue2leaflet-map"
  }, [_vm.ready ? _vm._t("default") : _vm._e()], 2);
};

var __vue_staticRenderFns__ = [];
/* style */

var __vue_inject_styles__ = function __vue_inject_styles__(inject) {
  if (!inject) {
    return;
  }

  inject("data-v-09f270aa_0", {
    source: ".vue2leaflet-map{height:100%;width:100%}",
    map: undefined,
    media: undefined
  });
};
/* scoped */


var __vue_scope_id__ = undefined;
/* module identifier */

var __vue_module_identifier__ = undefined;
/* functional template */

var __vue_is_functional_template__ = false;
/* style inject SSR */

/* style inject shadow dom */

var __vue_component__ = /*#__PURE__*/normalizeComponent({
  render: __vue_render__,
  staticRenderFns: __vue_staticRenderFns__
}, __vue_inject_styles__, __vue_script__, __vue_scope_id__, __vue_is_functional_template__, __vue_module_identifier__, false, createInjector, undefined, undefined);

/* harmony default export */ var LMap = (__vue_component__);
;// CONCATENATED MODULE: ./node_modules/vue2-leaflet/dist/components/LTileLayer.js










var LTileLayer_capitalizeFirstLetter = function capitalizeFirstLetter(string) {
  if (!string || typeof string.charAt !== 'function') {
    return string;
  }

  return string.charAt(0).toUpperCase() + string.slice(1);
};

var LTileLayer_propsBinder = function propsBinder(vueElement, leafletElement, props, options) {
  var loop = function loop(key) {
    var setMethodName = 'set' + LTileLayer_capitalizeFirstLetter(key);
    var deepValue = props[key].type === Object || props[key].type === Array || Array.isArray(props[key].type);

    if (props[key].custom && vueElement[setMethodName]) {
      vueElement.$watch(key, function (newVal, oldVal) {
        vueElement[setMethodName](newVal, oldVal);
      }, {
        deep: deepValue
      });
    } else if (setMethodName === 'setOptions') {
      vueElement.$watch(key, function (newVal, oldVal) {
        (0,leaflet_src.setOptions)(leafletElement, newVal);
      }, {
        deep: deepValue
      });
    } else if (leafletElement[setMethodName]) {
      vueElement.$watch(key, function (newVal, oldVal) {
        leafletElement[setMethodName](newVal);
      }, {
        deep: deepValue
      });
    }
  };

  for (var key in props) {
    loop(key);
  }
};

var LTileLayer_collectionCleaner = function collectionCleaner(options) {
  var result = {};

  for (var key in options) {
    var value = options[key];

    if (value !== null && value !== undefined) {
      result[key] = value;
    }
  }

  return result;
};

var LTileLayer_optionsMerger = function optionsMerger(props, instance) {
  var options = instance.options && instance.options.constructor === Object ? instance.options : {};
  props = props && props.constructor === Object ? props : {};
  var result = LTileLayer_collectionCleaner(options);
  props = LTileLayer_collectionCleaner(props);
  var defaultProps = instance.$options.props;

  for (var key in props) {
    var def = defaultProps[key] ? defaultProps[key].default && typeof defaultProps[key].default === 'function' ? defaultProps[key].default.call() : defaultProps[key].default : Symbol('unique');
    var isEqual = false;

    if (Array.isArray(def)) {
      isEqual = JSON.stringify(def) === JSON.stringify(props[key]);
    } else {
      isEqual = def === props[key];
    }

    if (result[key] && !isEqual) {
      console.warn(key + " props is overriding the value passed in the options props");
      result[key] = props[key];
    } else if (!result[key]) {
      result[key] = props[key];
    }
  }

  return result;
};

var findRealParent = function findRealParent(firstVueParent) {
  var found = false;

  while (firstVueParent && !found) {
    if (firstVueParent.mapObject === undefined) {
      firstVueParent = firstVueParent.$parent;
    } else {
      found = true;
    }
  }

  return firstVueParent;
};

var Layer = {
  props: {
    pane: {
      type: String,
      default: 'overlayPane'
    },
    attribution: {
      type: String,
      default: null,
      custom: true
    },
    name: {
      type: String,
      custom: true,
      default: undefined
    },
    layerType: {
      type: String,
      custom: true,
      default: undefined
    },
    visible: {
      type: Boolean,
      custom: true,
      default: true
    }
  },
  mounted: function mounted() {
    this.layerOptions = {
      attribution: this.attribution,
      pane: this.pane
    };
  },
  beforeDestroy: function beforeDestroy() {
    this.unbindPopup();
    this.unbindTooltip();
    this.parentContainer.removeLayer(this);
  },
  methods: {
    setAttribution: function setAttribution(val, old) {
      var attributionControl = this.$parent.mapObject.attributionControl;
      attributionControl.removeAttribution(old).addAttribution(val);
    },
    setName: function setName() {
      this.parentContainer.removeLayer(this);

      if (this.visible) {
        this.parentContainer.addLayer(this);
      }
    },
    setLayerType: function setLayerType() {
      this.parentContainer.removeLayer(this);

      if (this.visible) {
        this.parentContainer.addLayer(this);
      }
    },
    setVisible: function setVisible(isVisible) {
      if (this.mapObject) {
        if (isVisible) {
          this.parentContainer.addLayer(this);
        } else {
          if (this.parentContainer.hideLayer) {
            this.parentContainer.hideLayer(this);
          } else {
            this.parentContainer.removeLayer(this);
          }
        }
      }
    },
    unbindTooltip: function unbindTooltip() {
      var tooltip = this.mapObject ? this.mapObject.getTooltip() : null;

      if (tooltip) {
        tooltip.unbindTooltip();
      }
    },
    unbindPopup: function unbindPopup() {
      var popup = this.mapObject ? this.mapObject.getPopup() : null;

      if (popup) {
        popup.unbindPopup();
      }
    },
    updateVisibleProp: function updateVisibleProp(value) {
      /**
       * Triggers when the visible prop needs to be updated
       * @type {boolean}
       * @property {boolean} value - value of the visible property
       */
      this.$emit('update:visible', value);
    }
  }
};
var GridLayer = {
  mixins: [Layer],
  props: {
    pane: {
      type: String,
      default: 'tilePane'
    },
    opacity: {
      type: Number,
      custom: false,
      default: 1.0
    },
    zIndex: {
      type: Number,
      default: 1
    },
    tileSize: {
      type: Number,
      default: 256
    },
    noWrap: {
      type: Boolean,
      default: false
    }
  },
  mounted: function mounted() {
    this.gridLayerOptions = Object.assign({}, this.layerOptions, {
      pane: this.pane,
      opacity: this.opacity,
      zIndex: this.zIndex,
      tileSize: this.tileSize,
      noWrap: this.noWrap
    });
  }
};
var TileLayerMixin = {
  mixins: [GridLayer],
  props: {
    tms: {
      type: Boolean,
      default: false
    },
    subdomains: {
      type: [String, Array],
      default: 'abc',
      validator: function validator(prop) {
        if (typeof prop === 'string') {
          return true;
        } // Validates array that array only contains only strings


        if (Array.isArray(prop)) {
          return prop.every(function (subdomain) {
            return typeof subdomain === 'string';
          });
        }

        return false;
      }
    },
    detectRetina: {
      type: Boolean,
      default: false
    }
  },
  mounted: function mounted() {
    this.tileLayerOptions = Object.assign({}, this.gridLayerOptions, {
      tms: this.tms,
      subdomains: this.subdomains,
      detectRetina: this.detectRetina
    });
  },
  render: function render() {
    return null;
  }
};
var LTileLayer_Options = {
  props: {
    /**
     * Leaflet options to pass to the component constructor
     */
    options: {
      type: Object,
      default: function _default() {
        return {};
      }
    }
  }
}; //

/**
 * Load tiles from a map server and display them accordingly to map zoom, center and size
 */

var LTileLayer_script = {
  name: 'LTileLayer',
  mixins: [TileLayerMixin, LTileLayer_Options],
  props: {
    url: {
      type: String,
      default: null
    },
    tileLayerClass: {
      type: Function,
      default: leaflet_src.tileLayer
    }
  },
  mounted: function mounted() {
    var this$1 = this;
    var options = LTileLayer_optionsMerger(this.tileLayerOptions, this);
    this.mapObject = this.tileLayerClass(this.url, options);
    leaflet_src.DomEvent.on(this.mapObject, this.$listeners);
    LTileLayer_propsBinder(this, this.mapObject, this.$options.props);
    this.parentContainer = findRealParent(this.$parent);
    this.parentContainer.addLayer(this, !this.visible);
    this.$nextTick(function () {
      /**
       * Triggers when the component is ready
       * @type {object}
       * @property {object} mapObject - reference to leaflet map object
       */
      this$1.$emit('ready', this$1.mapObject);
    });
  }
};

function LTileLayer_normalizeComponent(template, style, script, scopeId, isFunctionalTemplate, moduleIdentifier
/* server only */
, shadowMode, createInjector, createInjectorSSR, createInjectorShadow) {
  if (typeof shadowMode !== 'boolean') {
    createInjectorSSR = createInjector;
    createInjector = shadowMode;
    shadowMode = false;
  } // Vue.extend constructor export interop.


  var options = typeof script === 'function' ? script.options : script; // render functions

  if (template && template.render) {
    options.render = template.render;
    options.staticRenderFns = template.staticRenderFns;
    options._compiled = true; // functional template

    if (isFunctionalTemplate) {
      options.functional = true;
    }
  } // scopedId


  if (scopeId) {
    options._scopeId = scopeId;
  }

  var hook;

  if (moduleIdentifier) {
    // server build
    hook = function hook(context) {
      // 2.3 injection
      context = context || // cached call
      this.$vnode && this.$vnode.ssrContext || // stateful
      this.parent && this.parent.$vnode && this.parent.$vnode.ssrContext; // functional
      // 2.2 with runInNewContext: true

      if (!context && typeof __VUE_SSR_CONTEXT__ !== 'undefined') {
        context = __VUE_SSR_CONTEXT__;
      } // inject component styles


      if (style) {
        style.call(this, createInjectorSSR(context));
      } // register component module identifier for async chunk inference


      if (context && context._registeredComponents) {
        context._registeredComponents.add(moduleIdentifier);
      }
    }; // used by ssr in case component is cached and beforeCreate
    // never gets called


    options._ssrRegister = hook;
  } else if (style) {
    hook = shadowMode ? function (context) {
      style.call(this, createInjectorShadow(context, this.$root.$options.shadowRoot));
    } : function (context) {
      style.call(this, createInjector(context));
    };
  }

  if (hook) {
    if (options.functional) {
      // register for functional component in vue file
      var originalRender = options.render;

      options.render = function renderWithStyleInjection(h, context) {
        hook.call(context);
        return originalRender(h, context);
      };
    } else {
      // inject component registration as beforeCreate hook
      var existing = options.beforeCreate;
      options.beforeCreate = existing ? [].concat(existing, hook) : [hook];
    }
  }

  return script;
}
/* script */


var LTileLayer_vue_script_ = LTileLayer_script;
/* template */

var LTileLayer_vue_render_ = function __vue_render__() {
  var _vm = this;

  var _h = _vm.$createElement;

  var _c = _vm._self._c || _h;

  return _c('div');
};

var LTileLayer_vue_staticRenderFns_ = [];
/* style */

var LTileLayer_vue_inject_styles_ = undefined;
/* scoped */

var LTileLayer_vue_scope_id_ = undefined;
/* module identifier */

var LTileLayer_vue_module_identifier_ = undefined;
/* functional template */

var LTileLayer_vue_is_functional_template_ = false;
/* style inject */

/* style inject SSR */

/* style inject shadow dom */

var LTileLayer_vue_component_ = /*#__PURE__*/LTileLayer_normalizeComponent({
  render: LTileLayer_vue_render_,
  staticRenderFns: LTileLayer_vue_staticRenderFns_
}, LTileLayer_vue_inject_styles_, LTileLayer_vue_script_, LTileLayer_vue_scope_id_, LTileLayer_vue_is_functional_template_, LTileLayer_vue_module_identifier_, false, undefined, undefined, undefined);

/* harmony default export */ var LTileLayer = (LTileLayer_vue_component_);
;// CONCATENATED MODULE: ./node_modules/vue2-leaflet/dist/components/LMarker.js










var LMarker_debounce = function debounce(fn, time) {
  var timeout;

  var debouncedFunction = function debouncedFunction() {
    var args = [],
        len = arguments.length;

    while (len--) {
      args[len] = arguments[len];
    }

    var context = this;

    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(function () {
      fn.apply(context, args);
      timeout = null;
    }, time);
  };

  debouncedFunction.cancel = function () {
    if (timeout) {
      clearTimeout(timeout);
    }
  };

  return debouncedFunction;
};

var LMarker_capitalizeFirstLetter = function capitalizeFirstLetter(string) {
  if (!string || typeof string.charAt !== 'function') {
    return string;
  }

  return string.charAt(0).toUpperCase() + string.slice(1);
};

var LMarker_propsBinder = function propsBinder(vueElement, leafletElement, props, options) {
  var loop = function loop(key) {
    var setMethodName = 'set' + LMarker_capitalizeFirstLetter(key);
    var deepValue = props[key].type === Object || props[key].type === Array || Array.isArray(props[key].type);

    if (props[key].custom && vueElement[setMethodName]) {
      vueElement.$watch(key, function (newVal, oldVal) {
        vueElement[setMethodName](newVal, oldVal);
      }, {
        deep: deepValue
      });
    } else if (setMethodName === 'setOptions') {
      vueElement.$watch(key, function (newVal, oldVal) {
        (0,leaflet_src.setOptions)(leafletElement, newVal);
      }, {
        deep: deepValue
      });
    } else if (leafletElement[setMethodName]) {
      vueElement.$watch(key, function (newVal, oldVal) {
        leafletElement[setMethodName](newVal);
      }, {
        deep: deepValue
      });
    }
  };

  for (var key in props) {
    loop(key);
  }
};

var LMarker_collectionCleaner = function collectionCleaner(options) {
  var result = {};

  for (var key in options) {
    var value = options[key];

    if (value !== null && value !== undefined) {
      result[key] = value;
    }
  }

  return result;
};

var LMarker_optionsMerger = function optionsMerger(props, instance) {
  var options = instance.options && instance.options.constructor === Object ? instance.options : {};
  props = props && props.constructor === Object ? props : {};
  var result = LMarker_collectionCleaner(options);
  props = LMarker_collectionCleaner(props);
  var defaultProps = instance.$options.props;

  for (var key in props) {
    var def = defaultProps[key] ? defaultProps[key].default && typeof defaultProps[key].default === 'function' ? defaultProps[key].default.call() : defaultProps[key].default : Symbol('unique');
    var isEqual = false;

    if (Array.isArray(def)) {
      isEqual = JSON.stringify(def) === JSON.stringify(props[key]);
    } else {
      isEqual = def === props[key];
    }

    if (result[key] && !isEqual) {
      console.warn(key + " props is overriding the value passed in the options props");
      result[key] = props[key];
    } else if (!result[key]) {
      result[key] = props[key];
    }
  }

  return result;
};

var LMarker_findRealParent = function findRealParent(firstVueParent) {
  var found = false;

  while (firstVueParent && !found) {
    if (firstVueParent.mapObject === undefined) {
      firstVueParent = firstVueParent.$parent;
    } else {
      found = true;
    }
  }

  return firstVueParent;
};

var LMarker_Layer = {
  props: {
    pane: {
      type: String,
      default: 'overlayPane'
    },
    attribution: {
      type: String,
      default: null,
      custom: true
    },
    name: {
      type: String,
      custom: true,
      default: undefined
    },
    layerType: {
      type: String,
      custom: true,
      default: undefined
    },
    visible: {
      type: Boolean,
      custom: true,
      default: true
    }
  },
  mounted: function mounted() {
    this.layerOptions = {
      attribution: this.attribution,
      pane: this.pane
    };
  },
  beforeDestroy: function beforeDestroy() {
    this.unbindPopup();
    this.unbindTooltip();
    this.parentContainer.removeLayer(this);
  },
  methods: {
    setAttribution: function setAttribution(val, old) {
      var attributionControl = this.$parent.mapObject.attributionControl;
      attributionControl.removeAttribution(old).addAttribution(val);
    },
    setName: function setName() {
      this.parentContainer.removeLayer(this);

      if (this.visible) {
        this.parentContainer.addLayer(this);
      }
    },
    setLayerType: function setLayerType() {
      this.parentContainer.removeLayer(this);

      if (this.visible) {
        this.parentContainer.addLayer(this);
      }
    },
    setVisible: function setVisible(isVisible) {
      if (this.mapObject) {
        if (isVisible) {
          this.parentContainer.addLayer(this);
        } else {
          if (this.parentContainer.hideLayer) {
            this.parentContainer.hideLayer(this);
          } else {
            this.parentContainer.removeLayer(this);
          }
        }
      }
    },
    unbindTooltip: function unbindTooltip() {
      var tooltip = this.mapObject ? this.mapObject.getTooltip() : null;

      if (tooltip) {
        tooltip.unbindTooltip();
      }
    },
    unbindPopup: function unbindPopup() {
      var popup = this.mapObject ? this.mapObject.getPopup() : null;

      if (popup) {
        popup.unbindPopup();
      }
    },
    updateVisibleProp: function updateVisibleProp(value) {
      /**
       * Triggers when the visible prop needs to be updated
       * @type {boolean}
       * @property {boolean} value - value of the visible property
       */
      this.$emit('update:visible', value);
    }
  }
};
var LMarker_Options = {
  props: {
    /**
     * Leaflet options to pass to the component constructor
     */
    options: {
      type: Object,
      default: function _default() {
        return {};
      }
    }
  }
};
/**
 * Marker component, lets you add and personalize markers on the map
 */

var LMarker_script = {
  name: 'LMarker',
  mixins: [LMarker_Layer, LMarker_Options],
  props: {
    pane: {
      type: String,
      default: 'markerPane'
    },
    draggable: {
      type: Boolean,
      custom: true,
      default: false
    },
    latLng: {
      type: [Object, Array],
      custom: true,
      default: null
    },
    icon: {
      type: [Object],
      custom: false,
      default: function _default() {
        return new leaflet_src.Icon.Default();
      }
    },
    opacity: {
      type: Number,
      custom: false,
      default: 1.0
    },
    zIndexOffset: {
      type: Number,
      custom: false,
      default: null
    }
  },
  data: function data() {
    return {
      ready: false
    };
  },
  beforeDestroy: function beforeDestroy() {
    if (this.debouncedLatLngSync) {
      this.debouncedLatLngSync.cancel();
    }
  },
  mounted: function mounted() {
    var this$1 = this;
    var options = LMarker_optionsMerger(Object.assign({}, this.layerOptions, {
      icon: this.icon,
      zIndexOffset: this.zIndexOffset,
      draggable: this.draggable,
      opacity: this.opacity
    }), this);
    this.mapObject = (0,leaflet_src.marker)(this.latLng, options);
    leaflet_src.DomEvent.on(this.mapObject, this.$listeners);
    this.debouncedLatLngSync = LMarker_debounce(this.latLngSync, 100);
    this.mapObject.on('move', this.debouncedLatLngSync);
    LMarker_propsBinder(this, this.mapObject, this.$options.props);
    this.parentContainer = LMarker_findRealParent(this.$parent);
    this.parentContainer.addLayer(this, !this.visible);
    this.ready = true;
    this.$nextTick(function () {
      /**
       * Triggers when the component is ready
       * @type {object}
       * @property {object} mapObject - reference to leaflet map object
       */
      this$1.$emit('ready', this$1.mapObject);
    });
  },
  methods: {
    setDraggable: function setDraggable(newVal, oldVal) {
      if (this.mapObject.dragging) {
        newVal ? this.mapObject.dragging.enable() : this.mapObject.dragging.disable();
      }
    },
    setLatLng: function setLatLng(newVal) {
      if (newVal == null) {
        return;
      }

      if (this.mapObject) {
        var oldLatLng = this.mapObject.getLatLng();
        var newLatLng = (0,leaflet_src.latLng)(newVal);

        if (newLatLng.lat !== oldLatLng.lat || newLatLng.lng !== oldLatLng.lng) {
          this.mapObject.setLatLng(newLatLng);
        }
      }
    },
    latLngSync: function latLngSync(event) {
      this.$emit('update:latLng', event.latlng);
      this.$emit('update:lat-lng', event.latlng);
    }
  },
  render: function render(h) {
    if (this.ready && this.$slots.default) {
      return h('div', {
        style: {
          display: 'none'
        }
      }, this.$slots.default);
    }

    return null;
  }
};

function LMarker_normalizeComponent(template, style, script, scopeId, isFunctionalTemplate, moduleIdentifier
/* server only */
, shadowMode, createInjector, createInjectorSSR, createInjectorShadow) {
  if (typeof shadowMode !== 'boolean') {
    createInjectorSSR = createInjector;
    createInjector = shadowMode;
    shadowMode = false;
  } // Vue.extend constructor export interop.


  var options = typeof script === 'function' ? script.options : script; // render functions

  if (template && template.render) {
    options.render = template.render;
    options.staticRenderFns = template.staticRenderFns;
    options._compiled = true; // functional template

    if (isFunctionalTemplate) {
      options.functional = true;
    }
  } // scopedId


  if (scopeId) {
    options._scopeId = scopeId;
  }

  var hook;

  if (moduleIdentifier) {
    // server build
    hook = function hook(context) {
      // 2.3 injection
      context = context || // cached call
      this.$vnode && this.$vnode.ssrContext || // stateful
      this.parent && this.parent.$vnode && this.parent.$vnode.ssrContext; // functional
      // 2.2 with runInNewContext: true

      if (!context && typeof __VUE_SSR_CONTEXT__ !== 'undefined') {
        context = __VUE_SSR_CONTEXT__;
      } // inject component styles


      if (style) {
        style.call(this, createInjectorSSR(context));
      } // register component module identifier for async chunk inference


      if (context && context._registeredComponents) {
        context._registeredComponents.add(moduleIdentifier);
      }
    }; // used by ssr in case component is cached and beforeCreate
    // never gets called


    options._ssrRegister = hook;
  } else if (style) {
    hook = shadowMode ? function (context) {
      style.call(this, createInjectorShadow(context, this.$root.$options.shadowRoot));
    } : function (context) {
      style.call(this, createInjector(context));
    };
  }

  if (hook) {
    if (options.functional) {
      // register for functional component in vue file
      var originalRender = options.render;

      options.render = function renderWithStyleInjection(h, context) {
        hook.call(context);
        return originalRender(h, context);
      };
    } else {
      // inject component registration as beforeCreate hook
      var existing = options.beforeCreate;
      options.beforeCreate = existing ? [].concat(existing, hook) : [hook];
    }
  }

  return script;
}
/* script */


var LMarker_vue_script_ = LMarker_script;
/* template */

/* style */

var LMarker_vue_inject_styles_ = undefined;
/* scoped */

var LMarker_vue_scope_id_ = undefined;
/* module identifier */

var LMarker_vue_module_identifier_ = undefined;
/* functional template */

var LMarker_vue_is_functional_template_ = undefined;
/* style inject */

/* style inject SSR */

/* style inject shadow dom */

var LMarker_vue_component_ = /*#__PURE__*/LMarker_normalizeComponent({}, LMarker_vue_inject_styles_, LMarker_vue_script_, LMarker_vue_scope_id_, LMarker_vue_is_functional_template_, LMarker_vue_module_identifier_, false, undefined, undefined, undefined);

/* harmony default export */ var LMarker = (LMarker_vue_component_);
;// CONCATENATED MODULE: ./node_modules/thread-loader/dist/cjs.js!./node_modules/babel-loader/lib/index.js??clonedRuleSet-40[0].rules[0].use[1]!./node_modules/@vue/vue-loader-v15/lib/index.js??vue-loader-options!./src/components/SheetsMap.vue?vue&type=script&lang=js&
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
//
// import L from 'leaflet';



delete leaflet_src.Icon.Default.prototype._getIconUrl;
leaflet_src.Icon.Default.mergeOptions({
  iconRetinaUrl: __webpack_require__(6431),
  iconUrl: __webpack_require__(7093),
  shadowUrl: __webpack_require__(8858)
});
/* harmony default export */ var SheetsMapvue_type_script_lang_js_ = ({
  name: 'SheetsMap',
  components: {
    LMap: LMap,
    LTileLayer: LTileLayer,
    LMarker: LMarker
  },
  props: {
    id: String,
    entity_type_id: String,
    config_entity_id: String,
    endpoint_config: String,
    code: String,
    active_filters: Object
  },
  data: function data() {
    return {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a target="_blank" href="http://osm.org/copyright">OpenStreetMap</a> contributors',
      zoom: 10,
      center: [51.505, -0.159],
      markerLatLng: [51.504, -0.159]
    };
  }
});
;// CONCATENATED MODULE: ./src/components/SheetsMap.vue?vue&type=script&lang=js&
 /* harmony default export */ var components_SheetsMapvue_type_script_lang_js_ = (SheetsMapvue_type_script_lang_js_); 
;// CONCATENATED MODULE: ./node_modules/mini-css-extract-plugin/dist/loader.js??clonedRuleSet-12[0].rules[0].use[0]!./node_modules/css-loader/dist/cjs.js??clonedRuleSet-12[0].rules[0].use[1]!./node_modules/@vue/vue-loader-v15/lib/loaders/stylePostLoader.js!./node_modules/postcss-loader/dist/cjs.js??clonedRuleSet-12[0].rules[0].use[2]!./node_modules/@vue/vue-loader-v15/lib/index.js??vue-loader-options!./src/components/SheetsMap.vue?vue&type=style&index=0&id=61fbe1d0&scoped=true&lang=css&
// extracted by mini-css-extract-plugin

;// CONCATENATED MODULE: ./src/components/SheetsMap.vue?vue&type=style&index=0&id=61fbe1d0&scoped=true&lang=css&

;// CONCATENATED MODULE: ./node_modules/@vue/vue-loader-v15/lib/runtime/componentNormalizer.js
/* globals __VUE_SSR_CONTEXT__ */

// IMPORTANT: Do NOT use ES2015 features in this file (except for modules).
// This module is a runtime utility for cleaner component module output and will
// be included in the final webpack user bundle.

function componentNormalizer_normalizeComponent (
  scriptExports,
  render,
  staticRenderFns,
  functionalTemplate,
  injectStyles,
  scopeId,
  moduleIdentifier, /* server only */
  shadowMode /* vue-cli only */
) {
  // Vue.extend constructor export interop
  var options = typeof scriptExports === 'function'
    ? scriptExports.options
    : scriptExports

  // render functions
  if (render) {
    options.render = render
    options.staticRenderFns = staticRenderFns
    options._compiled = true
  }

  // functional template
  if (functionalTemplate) {
    options.functional = true
  }

  // scopedId
  if (scopeId) {
    options._scopeId = 'data-v-' + scopeId
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
    hook = shadowMode
      ? function () {
        injectStyles.call(
          this,
          (options.functional ? this.parent : this).$root.$options.shadowRoot
        )
      }
      : injectStyles
  }

  if (hook) {
    if (options.functional) {
      // for template-only hot-reload because in that case the render fn doesn't
      // go through the normalizer
      options._injectStyles = hook
      // register for functional component in vue file
      var originalRender = options.render
      options.render = function renderWithStyleInjection (h, context) {
        hook.call(context)
        return originalRender(h, context)
      }
    } else {
      // inject component registration as beforeCreate hook
      var existing = options.beforeCreate
      options.beforeCreate = existing
        ? [].concat(existing, hook)
        : [hook]
    }
  }

  return {
    exports: scriptExports,
    options: options
  }
}

;// CONCATENATED MODULE: ./src/components/SheetsMap.vue



;


/* normalize component */

var component = componentNormalizer_normalizeComponent(
  components_SheetsMapvue_type_script_lang_js_,
  render,
  staticRenderFns,
  false,
  null,
  "61fbe1d0",
  null
  
)

/* harmony default export */ var SheetsMap = (component.exports);
;// CONCATENATED MODULE: ./node_modules/@vue/cli-service/lib/commands/build/entry-lib.js


/* harmony default export */ var entry_lib = (SheetsMap);


}();
module.exports = __webpack_exports__["default"];
/******/ })()
;
//# sourceMappingURL=index.common.js.map