interface Array<T> {
	FirstOrDefault(callbackfn: (value: T, index: number, array: T[]) => boolean): T;
}

Array.prototype.FirstOrDefault = function (predicate) {
	let result = this.filter(predicate);
	return result ? result[0] : null;
};



// let strs = new Array<string>('a', 'b', 'a', 'asdf');
// let result = strs.FirstOrDefault((value) => {
// 	return value === 'asdf';
// });

// console.log(result);