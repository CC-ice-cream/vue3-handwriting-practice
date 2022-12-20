type ActiveEffect = {
  (): void;
  deps?: any[];
};
let activeEffect: ActiveEffect;
const effectStack: any[] = [];
// 清除依赖函数
function cleanup(effectFn: ActiveEffect) {
  if (effectFn.deps) {
    for (let i = 0; i < effectFn.deps.length; i++) {
      const deps = effectFn.deps[i];
      deps.delete(effectFn);
    }
    effectFn.deps.length = 0;
  }
}
//高阶函数 收集副作用函数
export const effect = (fn: Function, options = {}) => {
  const effectFn = function () {
    cleanup(effectFn); //清除副作用函数对应的依赖
    activeEffect = effectFn; //当调用effect注册副作用函数时，将副作用函数赋值给activeEffect
    effectStack.push(effectFn);
    //执行副作用函数，proxy收集依赖
    fn();
    //当前嵌套的副作用函数执行完毕后，将当前副作用函数弹出，把activeEffect还原为外层作用域
    effectStack.pop();
    if (effectStack && effectStack.length !== 0) {
      activeEffect = effectStack[effectStack.length - 1];
    }
  };
  effectFn.options = options;
  effectFn.deps = [] as any;
  effectFn();
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
const targetMap = new WeakMap();
//收集依赖函数
export const track = (target: object, key: string | number | symbol) => {
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }
  let deps = depsMap.get(key);
  if (!deps) {
    deps = new Set();
    depsMap.set(key, deps);
  }
  //将当前激活的副作用函数收集进set集合中
  deps.add(activeEffect);
  // 当前激活的副作用函数也保留一份依赖集合的引用，用于cleanup清除依赖
  if (!!activeEffect.deps) activeEffect.deps.push(deps);
};
// 派发函数，代理对象对修改时会依次触发此前收集的副作用函数
export const trigger = (target: object, key: string | number | symbol) => {
  const depsMap = targetMap.get(target);
  if (!depsMap) return;
  const effects = depsMap.get(key);
  //为了防止分支的情况需要cleanup先清除一遍依赖再收集，这会导致foreach无限循环所以需要创建一个set包裹调用
  const effectsToRun = new Set(effects);
  effects && effects.forEach((effectFn: unknown) => {
    if(effectFn !== activeEffect){
      effectsToRun.add(effectFn)
    }
  })
  effectsToRun.forEach((effects: any) => {
    if(effects.options.scheduler && typeof effects.options.scheduler === 'function'){
      effects.options.scheduler(effects)
    }else{
      effects()
    }
  });
};
