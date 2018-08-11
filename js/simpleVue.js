'use strict';

(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
		typeof define === 'function' && define.amd ? define(factory) :
			(global.SimpleVue = factory());
}(this, (function () {
	
	/**
	 * 构造器
	 * @param options
	 * @constructor
	 */
	function SimpleVue(options) {
		this.$options = options || {};
		this.$el = options.el;
		var data = this.$data = options.data;
		// 数据代理
		// 实现 vm.xxx -> vm.$data.xxx
		var keys = Object.keys(data);
		for (var i = 0; i < keys.length; i++) {
			proxyData(this, '$data', keys[i])
		}
		observe(this.$data);//开始观测data数据
		new Compile(this.$el || document.body, this);//解析模板指令，渲染对应的data数据
	}
	
	function proxyData(ctx, sourceKey, key) {
		Object.defineProperty(ctx, key, {
			enumerable: true,
			configurable: true,
			get: function () {
				return this[sourceKey][key];
			},
			set: function (newVal) {
				this[sourceKey][key] = newVal;
			}
		});
	}
	
	/**
	 * 观察data中所有数据
	 * @param data
	 * @constructor
	 */
	function Observer(data) {
		this.data = data;
		this.walk(data);
	}
	
	Observer.prototype.walk = function (data) {
		var keys = Object.keys(data);
		for (var i = 0; i < keys.length; i++) {
			this.defineReactive(data, keys[i], data[keys[i]])
		}
	};
	
	Observer.prototype.defineReactive = function (data, key, val) {
		observe(val);//递归遍历所有子属性
		var dep = new Dep();
		Object.defineProperty(data, key, {
			enumerable: true,
			configurable: false,
			get: function () {
				Dep.target && dep.addSub(Dep.target);//添加watcher到订阅器
				return val;
			},
			set: function (newVal) {
				if (val === newVal) {
					return;
				}
				// console.log('属性' + key + '已经被监听了，原始值为：“' + val.toString() + '”，当前值为：“' + newVal.toString() + '”');
				val = newVal;
				dep.notify();//通知属性变更
			}
		})
	};
	
	function observe(data) {
		if (!data || typeof data !== 'object') {
			return;
		}
		return new Observer(data);
	}
	
	/**
	 * 订阅器存放
	 * @constructor
	 */
	function Dep() {
		this.subs = [];
	}
	
	Dep.target = null;
	
	Dep.prototype.addSub = function (watcher) {
		this.subs.push(watcher);
	};
	
	Dep.prototype.notify = function () {
		var subs = this.subs;
		for (var i = 0; i < subs.length; i++) {
			subs[i].update();
		}
	};
	
	/**
	 * 订阅器
	 * @param vm
	 * @param exp
	 * @param cb
	 * @constructor
	 */
	function Watcher(vm, exp, cb) {
		this.vm = vm;
		this.exp = exp;
		this.cb = cb;
		this.value = this.get();
	}
	
	Watcher.prototype.get = function () {
		Dep.target = this;
		var value = this.vm[this.exp];//将当前watcher添加到订阅器中
		Dep.target = null;
		return value;
	};
	
	Watcher.prototype.update = function () {
		var oldVal = this.value;
		var newVal = this.vm[this.exp];
		if (oldVal !== newVal) {
			this.cb.call(this.vm)
		}
	};
	
	
	var dirRE = /^v-/;
	var onRE = /^@|^v-on:/;
	
	/**
	 * 解析模板指令，渲染视图
	 * @param el
	 * @param vm
	 * @constructor
	 */
	function Compile(el, vm) {
		this.el = this.isElementNode(el) ? el : document.querySelector(el);//创建文档节点
		this.vm = vm;
		if (this.el) {
			this.fragment = this.node2Fragment(this.el);//创建文档片段
			this.compileElement(this.fragment);//开始解析文档数据
			this.el.appendChild(this.fragment);//将文档片段插入顶级元素节点并渲染页面
		}
	}
	
	
	Compile.prototype.node2Fragment = function (el) {
		var fragment = document.createDocumentFragment();
		var child;
		while (child = el.firstChild) {
			fragment.appendChild(child);
		}
		return fragment;
	};
	
	Compile.prototype.compileElement = function (el) {
		var childNodes = el.childNodes;
		var reg = /\{\{(.*)\}\}/;// 表达式文本
		for (var i = 0; i < childNodes.length; i++) {
			var node = childNodes[i];
			if (this.isElementNode(node)) {
				this.compile(node);//编译元素节点指令
			}
			else if (this.isTextNode(node) && reg.test(node.textContent)) {
				this.compileText(node, RegExp.$1);//编译文本节点
			}
			if (node.childNodes && node.childNodes.length) {
				this.compileElement(node)
			}
			
		}
	};
	
	Compile.prototype.compile = function (node) {
		// console.log(node.attributes)
		var attributes = node.attributes;
		// console.log(attributes)
		for (var i = 0; i < attributes.length; i++) {
			var attr = attributes[i];
			var attrName = attr.name;
			var exp = attr.value;
			var dir;
			if (this.isEventDirective(attrName)) {//事件指令
				dir = attrName.replace(onRE, '')
				directives.eventHandler(this.vm, node, dir, exp)
			}
			else if (this.isDirective(attrName)) {//普通指令
				dir = attrName.replace(dirRE, '');
				directives[dir] && directives[dir](this.vm, node, exp);
			}
		}
	};
	
	Compile.prototype.compileText = function (node, exp) {
		directives.text(this.vm, node, exp)
	};
	
	Compile.prototype.isDirective = function (attr) {
		return dirRE.test(attr);
	};
	
	Compile.prototype.isElementNode = function (node) {
		return node.nodeType === 1;
	};
	
	Compile.prototype.isTextNode = function (node) {
		return node.nodeType === 3;
	};
	
	Compile.prototype.isEventDirective = function (attr) {
		return onRE.test(attr);
	};
	
	var directives = {
		text: function (vm, node, exp) {
			this.bind(vm, node, exp, 'textContent');
		},
		html: function (vm, node, exp) {
			this.bind(vm, node, exp, 'innerHTML');
		},
		model: function (vm, node, exp) {
			this.bind(vm, node, exp, 'value');
			var val = vm[exp];
			node.addEventListener('input', function (e) {
				var newVal = e.target.value;
				if (val !== newVal) {
					vm[exp] = newVal;
					val = newVal;//这里会触发setter更新视图
				}
			})
		},
		bind: function (vm, node, exp, dir) {
			this.update(vm, node, exp, dir);
			//todo 监听属性变动
			new Watcher(vm, exp, this.update.bind(this, vm, node, exp, dir))
		},
		update: function (vm, node, exp, dir) {
			var value = vm[exp];
			node[dir] = typeof value === 'undefined' ? '' : value;
		},
		eventHandler: function (vm, node, dir, exp) {
			var reg = /\((.*)\)/;
			// console.log(eventType, exp)
			var params;
			if (reg.test(exp)) {
				params = RegExp.$1;
				exp = exp.replace(/\([^\)]*\)/g, '');
			}
			var fn = bindFunc(vm.$options.methods[exp], vm);
			if (!fn) {
				return console.error('method "' + exp + '" is not defined!')
			}
			node.addEventListener(dir, function (ev) {
				eval('fn(' + params + ')')
			}, false);
		}
	};
	
	function bindFunc(fn, ctx) {
		return fn && fn.bind(ctx);
	}
	
	return SimpleVue;
	
})));



