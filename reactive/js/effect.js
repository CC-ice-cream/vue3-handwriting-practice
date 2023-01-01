var activeEffect;
var effectStack = [];
// 清除依赖函数
function cleanup(effectFn) {
    if (effectFn.deps) {
        for (var i = 0; i < effectFn.deps.length; i++) {
            var deps = effectFn.deps[i];
            deps.delete(effectFn);
        }
        effectFn.deps.length = 0;
    }
}
//高阶函数 收集副作用函数
export var effect = function (fn, options) {
    if (options === void 0) { options = { lazy: false }; }
    var effectFn = function () {
        cleanup(effectFn); //清除副作用函数对应的依赖
        activeEffect = effectFn; //当调用effect注册副作用函数时，将副作用函数赋值给activeEffect
        effectStack.push(effectFn);
        //执行副作用函数，proxy收集依赖
        var result = fn();
        //当前嵌套的副作用函数执行完毕后，将当前副作用函数弹出，把activeEffect还原为外层作用域
        effectStack.pop();
        if (effectStack && effectStack.length !== 0) {
            activeEffect = effectStack[effectStack.length - 1];
        }
        return result;
    };
    effectFn.options = options;
    effectFn.deps = [];
    if (!options.lazy) {
        effectFn();
    }
    return effectFn;
};
//创建一个WeakMap 弱引用，有助于垃圾回收
/**
 * targetMap(WeakMap)
 *      |
 *      key   ————————————————————————————  value (Map)
 * { ok: true, text: 'hellow, world' }            |
 *                                                key —————————— value
 *                                                ok              new Set() —————— [effectFn, effectFn, ...]
 *                                                text            new Set() —————— [effectFn, effectFn, ...]
 *
 */
var targetMap = new WeakMap();
//收集依赖函数
export var track = function (target, key) {
    var depsMap = targetMap.get(target);
    if (!depsMap) {
        depsMap = new Map();
        targetMap.set(target, depsMap);
    }
    var deps = depsMap.get(key);
    if (!deps) {
        deps = new Set();
        depsMap.set(key, deps);
    }
    //将当前激活的副作用函数收集进set集合中
    deps.add(activeEffect);
    // 当前激活的副作用函数也保留一份依赖集合的引用，用于cleanup清除依赖
    if (!!activeEffect.deps)
        activeEffect.deps.push(deps);
};
// 派发函数，代理对象对修改时会依次触发此前收集的副作用函数
export var trigger = function (target, key) {
    var depsMap = targetMap.get(target);
    if (!depsMap)
        return;
    var effects = depsMap.get(key);
    //为了防止分支的情况需要cleanup先清除一遍依赖再收集，这会导致foreach无限循环所以需要创建一个set包裹调用
    var effectsToRun = new Set(effects);
    effects &&
        effects.forEach(function (effectFn) {
            if (effectFn !== activeEffect) {
                effectsToRun.add(effectFn);
            }
        });
    effectsToRun.forEach(function (effects) {
        if (effects.options.scheduler &&
            typeof effects.options.scheduler === "function") {
            effects.options.scheduler(effects);
        }
        else {
            effects();
        }
    });
};
