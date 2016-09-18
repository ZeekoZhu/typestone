// import '../node_modules/reflect-metadata/Reflect.js';
// 上面的注释去掉会出现奇怪的问题

/// <reference path="./linq.ts" />


class Model {
	public Template: Element;
	public Result: Element;
	public Watchers: Watcher[];


	@Data
	public Name: string;

	@Data
	public Age: number;



	constructor(private selector: string) {
		this.Watchers = new Array<Watcher>();
		this.Template = document.querySelector(selector);
		let temp = document.createDocumentFragment();
		temp.appendChild(this.Template.cloneNode(true));
		this.AddWatcher(this.Template.firstChild);
	}

	/**
	 * 将 node 节点对象转化为 string
	 * 
	 * @param {Node} element 节点对象
	 * @param {boolean} [deep=true] 是否转化所有子节点
	 * @returns
	 */
	static ConvertToHtml(element: Node, deep: boolean = true) {
		let ele = document.createElement('div');
		ele.appendChild(element.cloneNode(deep));
		return ele.innerHTML;
	}

	/**
	 * 给模板加上监听器的函数
	 *
	 * 遍历 Node 中的所有的特性和文本节点
	 * 
	 * @param {Node} template 模板对象
	 */
	AddWatcher(template: Node) {
		if (template === null) {
			return;
		}
		let currentNode = template;
		console.log(Model.ConvertToHtml(currentNode, false));
		console.info(currentNode);

		switch (currentNode.nodeType) {
			case 3:
				let content = currentNode.nodeValue;
				let temps = content.match(/\{\{\w+\}\}/g);
				if (temps) {
					temps.forEach(temp => {
						let propKey = temp.substring(2, temp.length - 2);
						let watcher = this.Watchers.FirstOrDefault(w => {
							return w.propertyKey === propKey;
						});
						let isNew: boolean = false;
						if (watcher == null) {
							watcher = new Watcher();
							isNew = true;
						}

						let templates = {};

						if (watcher.elements.indexOf(currentNode as Element) < 0) {
							watcher.elements.push(currentNode as Element);
							templates['text'] = content;
							watcher.templates.push(templates);
						}
						// else {
						// 	watcher.templates[watcher.elements.length - 1]["attrValue.name"] = attrValue.value;
						// }
						if (isNew) {
							watcher.propertyKey = propKey;
							this.Watchers.push(watcher);
						}
					});
				}
		}

		// 首先寻找 attribute 里面的模板哟
		for (let key in currentNode.attributes) {
			if (currentNode.attributes.hasOwnProperty(key)) {
				let attrValue = currentNode.attributes[key];
				let temps = attrValue.value.match(/\{\{\w+\}\}/g);
				if (temps) {
					temps.forEach(temp => {
						// let temp = temps[index];
						// 解析属性名
						let propKey = temp.substring(2, temp.length - 2);
						// 寻找已经存在的属性监视器
						let isNew: boolean = false;
						let watcher = this.Watchers.FirstOrDefault(w => {
							return w.propertyKey === propKey;
						});
						if (watcher == null) {
							watcher = new Watcher();
							isNew = true;
						}
						watcher.currentValue = this[propKey];

						// 用来存放属性的对象
						let attributes = {};

						// 绑定添加元素监视
						if (watcher.elements.indexOf(currentNode as Element) < 0) {
							watcher.elements.push(currentNode as Element);
							attributes[attrValue.name] = attrValue.value;
							watcher.templates.push(attributes);
						}
						else {
							watcher.templates[watcher.elements.length - 1][attrValue.name] = attrValue.value;
						}
						if (isNew) {
							watcher.propertyKey = propKey;
							this.Watchers.push(watcher);
						}
					});
				}
			}
		}


		this.AddWatcher(currentNode.nextSibling);
		this.AddWatcher(currentNode.firstChild);
	}

	static HasTemplate(node: Node) {

	}
}



/**
 * Data 特性
 * 
 * @param {*} target
 * @param {string} key
 */
function Data(target: any, key: string) {
	let model = this as Model;

	let _val = model[key];
	let getter = function () {
		console.log(`Get: ${key} => ${_val}`);
		return _val;
	};

	// property setter
	let setter = function (newVal) {
		console.log(`Set: ${key} => ${newVal}`);
		_val = newVal;
		let _this = this as Model;
		if (!_this.Watchers) {
			return;
		}
		let watcher = _this.Watchers.filter((value) => {
			return value.propertyKey === key;
		});
		if (watcher === null) {
			return;
		}
		else {
			watcher[0].elements.forEach((value, index) => {
				let templates = watcher[0].templates[index];
				for (let key in templates) {
					if (templates.hasOwnProperty(key)) {
						let template = templates[key];
						let result = Stone(template, _this);
						if (key === 'text') {
							value.textContent = result;
						}
						else {
							value.setAttribute(key, result);
						}
					}
				}
			});
		}
	};

	// Delete property.
	if (delete this[key]) {

		// Create new property with getter and setter
		Object.defineProperty(target, key, {
			get: getter,
			set: setter,
			enumerable: true,
			configurable: true
		});
	}

}

class Watcher {
	public currentValue: string | number;
	public propertyKey: string;
	public elements: Element[] = new Array();
	public templates: any[] = new Array();

	public Update(value: string | number) {
		if (value === this.currentValue) {
			return;
		}
		else {
			console.log(`update ${this.propertyKey} from ${this.currentValue} to ${value}`);
		}
	}
}





let test = new Model('#test');
test.Name = 'zeeko';
console.log(test);


/**
 * 模板处理函数
 * 
 * @param {string} templateStr
 * @param {*} dataObj
 * @returns
 */
function Stone(templateStr: string, dataObj: any) {

	function getTempName(tempStr) {
		return tempStr.substring(2, tempStr.length - 2);
	}

	function getValueByName(propertyName, obj) {
		if (obj[propertyName]) {
			return obj[propertyName];
		}
		else {
			return 'NULL';
		}
	}

	let temps = templateStr.match(/\{\{\w+\}\}/g);
	for (let temp in temps) {
		if (temps.hasOwnProperty(temp)) {
			let tempReduce = getTempName(temps[temp]);
			let tempValue = getValueByName(tempReduce, dataObj);
			templateStr = templateStr.replace(temps[temp], tempValue);
		}

	}
	return templateStr;
}


