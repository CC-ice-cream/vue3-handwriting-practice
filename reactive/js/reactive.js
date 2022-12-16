import { track, trigger } from './effect.js';
var isObject = function (target) { return target != null && typeof target == 'object'; };
//响应式函数 代理对象
export var reactive = function (target) {
    return new Proxy(target, {
        get: function (target, key, receiver) {
            //Reflect的第三个参数 receiver 它保证传递正确的 this
            var res = Reflect.get(target, key, receiver);
            track(target, key);
            if (isObject(res)) {
                //深层嵌套代理
                return reactive(res);
            }
            return res;
        },
        set: function (target, key, value, receiver) {
            var res = Reflect.set(target, key, value, receiver);
            trigger(target, key);
            return res;
        },
    });
};
