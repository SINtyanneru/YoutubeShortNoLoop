console.info("Youtubeのショート動画でループ再生を切るやつ");
console.info("Se rumi-room.net");

//HTMLMediaElement.loopのsetterを乗っ取る
const property_descriptor = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, "loop");
Object.defineProperty(HTMLMediaElement.prototype, "loop", {
	configurable: true,
	enumerable: property_descriptor.enumerable,
	get() {
		console.debug("setterのget", this);
		return false;
	},
	set(v) {
		console.debug("setterのset", this);
		property_descriptor.set.call(this, false);
	}
});

//setAttribute("loop")を殺す
const original_set_attribute = Element.prototype.setAttribute;
Element.prototype.setAttribute = function(name, value) {
	if (this instanceof HTMLVideoElement && name === "loop") {
		console.debug("HTMLVideoElementに対しsetAttributeが行われた", this);
		return;
	}

	return original_set_attribute.call(this, name, value);
}

//オブザーバーを使用してDOM作成時にloopを捕捉する
const observer = new MutationObserver((list) => {
	//ショート動画以外なら何もしない
	if (window.location.pathname.startsWith("/shorts/") == false) return;

	for (const m of list) {
		//loop属性の変更
		if (m.type === "attributes" && m.target instanceof HTMLVideoElement) {
			delete_loop(m.target);
		}

		//loop属性つきで挿入された要素
		for (const n of m.addedNodes) {
			if (n.nodeType !== Node.ELEMENT_NODE) continue;
			if (n instanceof HTMLVideoElement) delete_loop(n);
			for (const v of n.querySelectorAll("video")) delete_loop(v);
		}
	}
});

function delete_loop(el) {
	if (el.hasAttribute("loop")) {
		console.debug("loopを殺した", el);
		el.removeAttribute("loop");
	}
}

observer.observe(document.documentElement, {
	childList: true,
	attributes: true,
	attributeFilter: ["loop"],
	subtree: true
});

//すでにあるVIDEOのloopを殺す
if (window.location.pathname.startsWith("/shorts/")) {
	for (const el of document.querySelectorAll("video")) {
		console.debug("loopをfalseに", el);
		el.loop = false;
	}
}