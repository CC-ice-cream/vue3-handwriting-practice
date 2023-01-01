import { effect } from "./effect.js";
export var watch = function (source, cb) {
    var getter;
    if (typeof source === 'function') {
        getter = source;
    }
    else {
        getter = function () { return traverse(source); };
    }
    var oldVal, newVal;
    var effectFn = effect(function () { return getter(); }, {
        lazy: true,
        scheduler: function () {
            newVal = effectFn();
            cb(newVal, oldVal);
            oldVal = newVal;
        }
    });
    oldVal = effectFn();
};
function traverse(target, seen) {
    if (seen === void 0) { seen = new Set(); }
    if (typeof target !== 'object' || target === null || seen.has(target))
        return;
    seen.add(target);
    for (var key in target) {
        if (Object.prototype.hasOwnProperty.call(target, key)) {
            var element = target[key];
            traverse(element, seen);
        }
    }
    return target;
}
