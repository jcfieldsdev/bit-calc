/******************************************************************************
 * Bit Calc                                                                   *
 *                                                                            *
 * Copyright (C) 2019 J.C. Fields (jcfields@jcfields.dev).                    *
 *                                                                            *
 * Permission is hereby granted, free of charge, to any person obtaining a    *
 * copy of this software and associated documentation files (the "Software"), *
 * to deal in the Software without restriction, including without limitation  *
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,   *
 * and/or sell copies of the Software, and to permit persons to whom the      *
 * Software is furnished to do so, subject to the following conditions:       *
 *                                                                            *
 * The above copyright notice and this permission notice shall be included in *
 * all copies or substantial portions of the Software.                        *
 *                                                                            *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR *
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,   *
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL    *
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER *
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING    *
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER        *
 * DEALINGS IN THE SOFTWARE.                                                  *
 ******************************************************************************/

"use strict";

/*
 * constants
 */

const DEFAULT_SIZE = 8;
const DEFAULT_OP = "and";
const MEMORY_LIMIT = 32;
const STORAGE_NAME = "bitcalc";

/*
 * initialization
 */

window.addEventListener("load", function() {
	const calc = new Calc();
	const store = new Storage(STORAGE_NAME);

	calc.load(store.load());
	calc.start();

	window.addEventListener("beforeunload", function() {
		store.save(calc.save());
	});
	window.addEventListener("keydown", function(event) {
		// prevents conflicts with OS/browser shortcuts
		if (event.ctrlKey || event.metaKey) {
			return;
		}

		const keyCode = event.keyCode;

		if (keyCode == 9) { // tab
			event.preventDefault();
			calc.rotateBinaryOp(event.shiftKey);
		}

		if (keyCode == 12 || keyCode == 27) { // clear/escape
			if (event.altKey || event.shiftKey) {
				calc.clearAll();
			} else {
				calc.runUnaryOp("clear");
			}
		}

		if (keyCode == 37) { // left
			const element = $("div.register.active div.active input");

			if (element.selectionStart == 0) {
				event.preventDefault();
				calc.toggleBase();
			}
		}

		if (keyCode == 39) { // right
			const element = $("div.register.active div.active input");

			if (element.selectionStart == element.value.length) {
				event.preventDefault();
				calc.toggleBase();
			}
		}

		if (keyCode == 38 || keyCode == 40) { // up/down
			event.preventDefault();
			calc.toggleRegister();
		}

		if (keyCode == 49 && event.shiftKey) { // bitwise not (!)
			calc.runUnaryOp("not");
		}

		if (keyCode == 59) { // shift left by 1 (;)
			calc.runUnaryOp("shiftLeft1");
		}

		if (keyCode == 61 || keyCode == 107) { // increment (+)
			calc.runUnaryOp("increment");
		}

		if (keyCode == 82 && event.shiftKey) { // recall (shift+R)
			calc.recall();
		}

		if (keyCode == 83) { // S
			calc.swap();
		}

		if (keyCode == 83 && event.shiftKey) { // store (shift+S)
			calc.store();
		}

		if (keyCode == 88) { // X
			calc.copyRegister("x");
		}

		if (keyCode == 89) { // Y
			calc.copyRegister("y");
		}

		if (keyCode == 173 || keyCode == 109) { // decrement (-)
			calc.runUnaryOp("decrement");
		}

		if (keyCode == 188) { // shift left by 4 (, or <)
			calc.runUnaryOp("shiftLeft4");
		}

		if (keyCode == 190) { // shift right by 4 (. or >)
			calc.runUnaryOp("shiftRight4");
		}

		if (keyCode == 191) { // switch endianness (/)
			event.preventDefault(); // hotkey for inline search in Firefox
			calc.runUnaryOp("endian");
		}

		if (keyCode == 192) { // backtick
			calc.rotateSize(event.shiftKey);
		}

		if (keyCode == 219) { // rotate left ([)
			calc.runUnaryOp("rotateLeft");
		}

		if (keyCode == 220) { // flip (\)
			calc.runUnaryOp("reverse");
		}

		if (keyCode == 221) { // rotate right (])
			calc.runUnaryOp("rotateRight");
		}

		if (keyCode == 222) { // shift right by 1 (')
			event.preventDefault(); // hotkey for inline search in Firefox
			calc.runUnaryOp("shiftRight1");
		}
	});

	document.addEventListener("click", function(event) {
		const element = event.target;

		if (element.matches("#recall")) {
			calc.recall();
		}

		if (element.matches("#store")) {
			calc.store();
		}

		if (element.matches("#swap")) {
			calc.swap();
		}

		if (element.matches("#clearAll")) {
			calc.clearAll();
		}

		if (element.matches("#x div.label")) {
			calc.selectRegister(true);
		}

		if (element.matches("#y div.label")) {
			calc.selectRegister(false);
		}

		if (element.matches("#x div.bin button")) {
			calc.x.flip(Number(element.value));
			calc.runBinaryOp();
		}

		if (element.matches("#y div.bin button")) {
			calc.y.flip(Number(element.value));
			calc.runBinaryOp();
		}

		if (element.closest("#x div.dec")) {
			calc.selectRegister(true, true);
		}

		if (element.closest("#y div.dec")) {
			calc.selectRegister(false, true);
		}

		if (element.closest("#x div.hex")) {
			calc.selectRegister(true, false);
		}

		if (element.closest("#y div.hex")) {
			calc.selectRegister(false, false);
		}

		if (element.matches("#sizes button")) {
			calc.setSize(element.value);
		}

		if (element.matches("#unary button")) {
			if (element.value != "") {
				calc.runUnaryOp(element.value);
			}
		}

		if (element.matches("#binary button")) {
			calc.setBinaryOp(element.value);
		}

		if (element.matches("#move button")) {
			if (element.value != "") { // excludes swap button
				calc.copyRegister(element.value);
			}
		}
	});
	document.addEventListener("input", function(event) {
		const element = event.target;

		if (element.matches("#x div.dec input")) {
			calc.x.set(Number.parseInt(element.value));
			calc.runBinaryOp();
		}

		if (element.matches("#y div.dec input")) {
			calc.y.set(Number.parseInt(element.value));
			calc.runBinaryOp();
		}

		if (element.matches("#x div.hex input")) {
			calc.x.set(Number.parseInt(element.value, 16));
			calc.runBinaryOp();
		}

		if (element.matches("#y div.hex input")) {
			calc.y.set(Number.parseInt(element.value, 16));
			calc.runBinaryOp();
		}
	});
});

function $(selector) {
	return document.querySelector(selector);
}

function $$(selector) {
	return Array.from(document.querySelectorAll(selector));
}

/*
 * Register prototype
 */

function Register(value) {
	this.value = value || 0;

	this.size = DEFAULT_SIZE;
	this.max  = 0;
}

Register.prototype.get = function() {
	return this.value;
};

Register.prototype.set = function(value) {
	if (value < 0) {
		value >>>= 0; // treats as unsigned integer
	}

	this.value = Math.min(Math.max(0, value), this.max);
};

Register.prototype.setSize = function(size, max) {
	this.size = size;
	this.max  = max;
};

Register.prototype.flip = function(n) {
	return this.set(this.value ^ 1 << n);
};

Register.prototype.clear = function() {
	return 0;
};

Register.prototype.not = function(x) {
	return ~this.value;
};

Register.prototype.reverse = function() {
	let flipped = 0;

	for (let i = 0; i < this.size; i++) {
		flipped |= ((this.value >> i) & 1) << this.size - i - 1;
	}

	return flipped;
};

Register.prototype.endian = function() {
	if (this.size == 16) {
		return ((this.value  & 0xff) << 0x08)
		     | ((this.value >> 0x08)  & 0xff);
	}

	if (this.size == 32) {
		return ((this.value  & 0x00ff) << 0x0018)
		     | ((this.value  & 0xff00) << 0x0008)
		     | ((this.value >> 0x0008)  & 0xff00)
		     | ((this.value >> 0x0018)  & 0x00ff);
	}

	return this.value;
};

Register.prototype.increment = function() {
	return this.value + 1;
};

Register.prototype.decrement = function() {
	return this.value - 1;
};

Register.prototype.rotateLeft = function() {
	const first = (this.value >> this.size - 1) & 1;
	return (this.value << 1) | first;
};

Register.prototype.rotateRight = function() {
	const last = this.value & 1;
	return (this.value >> 1) | (last << this.size - 1);
};

Register.prototype.shiftLeft1 = function() {
	return this.value << 1;
};

Register.prototype.shiftLeft4 = function() {
	return this.value << 4;
};

Register.prototype.shiftLeft8 = function() {
	return this.value << 8;
};

Register.prototype.shiftRight1 = function() {
	return this.value >> 1;
};

Register.prototype.shiftRight4 = function() {
	return this.value >> 4;
};

Register.prototype.shiftRight8 = function() {
	return this.value >> 8;
};

Register.prototype.add = function(n) {
	return this.value + n;
};

Register.prototype.subtract = function(n) {
	return this.value - n;
};

Register.prototype.multiply = function(n) {
	return this.value * n;
};

Register.prototype.divide = function(n) {
	if (this.value == 0 || n == 0) {
		return 0;
	}

	return Math.floor(this.value / n);
};

Register.prototype.modulo = function(n) {
	if (n == 0) {
		return 0;
	}

	return this.value % n;
};

Register.prototype.and = function(n) {
	return this.value & n;
};

Register.prototype.or = function(n) {
	return this.value | n;
};

Register.prototype.xor = function(n) {
	return this.value ^ n;
};

/*
 * Calc prototype
 */

function Calc() {
	this.x = new Register();
	this.y = new Register();
	this.z = new Register();

	this.size = DEFAULT_SIZE;
	this.max  = 0;
	this.op   = DEFAULT_OP;

	this.base     = false;
	this.register = false;

	this.memory = [];
}

Calc.prototype.start = function() {
	this.setSize(this.size);
	this.setBinaryOp(this.op);
	this.selectRegister();
};

Calc.prototype.setActive = function(query, value) {
	for (const button of $$(query)) {
		button.classList.toggle("active", button.value == value);
	}
};

Calc.prototype.setSize = function(value) {
	this.size = Number(value);
	this.max = Math.pow(2, this.size) - 1;

	for (const register of ["x", "y", "z"]) {
		this[register].setSize(this.size, this.max);

		const element = document.createElement("div");
		element.className = "bin";

		for (let i = 0; i < this.size / 8; i++) {
			const div = document.createElement("div");
			const count = this.size - i * 8;

			for (let j = 0; j < 8; j++) {
				const button = document.createElement("button");
				button.className = "bit";
				button.value = count - j - 1;
				button.textContent = "0";
				button.setAttribute("type", "button");
				div.appendChild(button);

				element.appendChild(div);
			}
		}

		$(`#${register} div.bin`).replaceWith(element);
	}

	for (const element of $$(".word")) {
		element.disabled = this.size < 16;
	}

	this.setActive("#sizes button", this.size);
	this.runBinaryOp();
};

Calc.prototype.setBinaryOp = function(fn) {
	this.op = fn;
	this.setActive("#binary button", fn);
	this.runBinaryOp();
};

Calc.prototype.rotate = function(dir, selector, comparator) {
	const items = [];
	let index = 0;

	for (const button of $$(selector)) {
		items.push(button.value);
	}

	for (const [i, item] of items.entries()) {
		if (comparator == item) {
			if (dir) {
				index = i == 0 ? items.length - 1 : i - 1;
			} else {
				index = i == items.length - 1 ? 0 : i + 1;
			}
		}
	}

	return items[index];
};

Calc.prototype.rotateSize = function(dir) {
	this.setSize(Number(this.rotate(dir, "#sizes button", this.size)));
};

Calc.prototype.rotateBinaryOp = function(dir) {
	this.setBinaryOp(this.rotate(dir, "#binary button", this.op));
};

Calc.prototype.runUnaryOp = function(fn) {
	if (this.register) {
		const w = this.x[fn]() & this.max;
		this.displayRegister("x", w);
		this.x.set(w);
	} else {
		const w = this.y[fn]() & this.max;
		this.displayRegister("y", w);
		this.y.set(w);
	}

	this.runBinaryOp();
};

Calc.prototype.runBinaryOp = function() {
	const z = this.x[this.op](this.y.get());

	this.displayRegister("x", this.x.get());
	this.displayRegister("y", this.y.get());
	this.displayRegister("z", z);

	// sets z after displaying so underflow/overflow color is properly applied
	this.z.set(z);

	this.updateButtons();
};

Calc.prototype.displayRegister = function(register, value) {
	// treats as unsigned integer unless subtraction resulting in negative
	if (value < 0 && (this.op != "subtract" || this.x.get() > this.y.get())) {
		value >>>= 0;
	}

	$(`#${register} div.label`).classList.toggle("underflow", value < 0);
	$(`#${register} div.label`).classList.toggle("overflow", value > this.max);

	value = Math.min(Math.max(0, value), this.max);

	for (const button of $$(`#${register} div.bin button`)) {
		const bit = value & (1 << Number(button.value));

		button.textContent = bit ? "1" : "0";
		button.classList.toggle("active", bit != 0);
	}

	if (Number.isNaN(value)) {
		value = 0;
	}

	const dec = value.toString(10);
	const hex = value.toString(16).padStart(2 * this.size / 8, "0");

	$(`#${register} div.dec input`).value = dec;
	$(`#${register} div.hex input`).value = hex;
};

Calc.prototype.selectBase = function(base) {
	if (base != undefined) {
		this.base = base;
	}

	for (const element of $$("div.dec")) {
		element.classList.toggle("active", this.base);
	}

	for (const element of $$("div.hex")) {
		element.classList.toggle("active", !this.base);
	}

	const element = $("div.register.active div.active input");
	element.focus();
};

Calc.prototype.toggleBase = function() {
	this.base = !this.base;
	this.selectBase();
};

Calc.prototype.selectRegister = function(register, base) {
	if (register != undefined) {
		this.register = register;
	}

	$("#x").classList.toggle("active", this.register);
	$("#y").classList.toggle("active", !this.register);

	this.selectBase(base);
};

Calc.prototype.toggleRegister = function() {
	this.register = !this.register;
	this.selectRegister();
};

Calc.prototype.copyRegister = function(register) {
	if (register == "x") {
		this.x.set(this.z.get());
	} else {
		this.y.set(this.z.get());
	}

	this.runBinaryOp();
};

Calc.prototype.clearAll = function() {
	this.x.set(this.x.clear());
	this.y.set(this.y.clear());

	this.runBinaryOp();
};

Calc.prototype.updateButtons = function() {
	$("#recall").disabled = this.memory.length == 0;
	$("#store").disabled = this.memory.length >= MEMORY_LIMIT;

	$("#recall .count").textContent = this.memory.length;
};

Calc.prototype.store = function () {
	if (this.memory.length >= MEMORY_LIMIT) {
		this.memory.shift(); // removes oldest memory item
	}

	this.memory.push(this.z.get());
	this.updateButtons();
};

Calc.prototype.recall = function() {
	if (this.memory.length > 0) {
		const mem = this.memory.pop();

		if (this.register) {
			this.x.set(mem);
		} else {
			this.y.set(mem);
		}

		this.runBinaryOp();
	}

	this.updateButtons();
};

Calc.prototype.swap = function() {
	const x = this.x.get(), y = this.y.get();

	this.x.set(y);
	this.y.set(x);

	this.runBinaryOp();
};

Calc.prototype.load = function(data) {
	for (const key in data) {
		if (typeof data[key] == "object" && "value" in data[key]) {
			this[key] = new Register(data[key].value);
		} else {
			this[key] = data[key];
		}
	}
};

Calc.prototype.save = function() {
	return Object.keys(this).reduce(function(obj, key) {
		obj[key] = this[key];
		return obj;
	}.bind(this), {});
};

/*
 * Storage prototype
 */

function Storage(name) {
	this.name = name;
}

Storage.prototype.load = function() {
	try {
		return JSON.parse(localStorage.getItem(this.name)) || {};
	} catch (err) {
		console.error(err);
		this.reset();
		return null;
	}
};

Storage.prototype.save = function(data) {
	try {
		localStorage.setItem(this.name, JSON.stringify(data));
	} catch (err) {
		console.error(err);
	}
};

Storage.prototype.reset = function() {
	try {
		localStorage.removeItem(this.name);
	} catch (err) {
		console.error(err);
	}
};