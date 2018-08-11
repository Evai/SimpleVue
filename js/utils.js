'use strict';

(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
		typeof define === 'function' && define.amd ? define(factory) :
			(global.Utils = factory());
})(this, function () {
	
	function isUndef(v) {
		return v === undefined || v === null
	}
	
	function isDef(v) {
		return v !== undefined && v !== null
	}
	
	function isTrue(v) {
		return v === true
	}
	
	function isFalse(v) {
		return v === false
	}
	
	function isObject(obj) {
		return obj !== null && typeof obj === 'object'
	}
	
	function getRawType(value) {
		return Object.prototype.toString.call(value).slice(8, -1)
	}
	
	function toString(val) {
		return val == null
			? ''
			: typeof val === 'object'
				? JSON.stringify(val, null, 2)
				: String(val)
	}
	
	function toNumber(val) {
		var n = parseFloat(val);
		return isNaN(n) ? val : n
	}
	
	/**
	 * 创建一个map并返回一个函数检查key的值
	 * @param str
	 * @param expectsLowerCase
	 * @returns {function(*): *}
	 */
	function makeMap(
		str,
		expectsLowerCase
	) {
		var map = Object.create(null);
		var list = str.split(',');
		for (var i = 0; i < list.length; i++) {
			map[list[i]] = true;
		}
		return expectsLowerCase
			? function (val) {
				return map[val.toLowerCase()];
			}
			: function (val) {
				return map[val];
			}
	}
	
	function hasOwn(obj, key) {
		return Object.prototype.hasOwnProperty.call(obj, key)
	}
	
	/**
	 * 创建一个带有缓存的函数返回值
	 * @param fn
	 * @returns {function(*=): *}
	 */
	function cached(fn) {
		var cache = Object.create(null);
		return function (originStr) {
			return cache[originStr] || (cache[originStr] = fn(originStr))
		}
	}
	
	return {
		isUndef: isUndef,
		isDef: isDef,
		isTrue: isTrue,
		isFalse: isFalse,
		isObject: isObject,
		getRawType: getRawType,
		toString: toString,
		toNumber: toNumber,
		makeMap: makeMap,
		hasOwn: hasOwn,
		cached: cached
	}
});