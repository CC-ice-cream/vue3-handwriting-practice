import { effect } from "./effect"


export const watch = function(source:any, cb:(newVal: any, oldVal: any)=>void){
  let getter:any;
  if(typeof source === 'function'){
    getter = source
  }else{
    getter = () => traverse(source)
  }
  let oldVal: any,newVal;
  const effectFn = effect(
    () => getter(),
    {
      lazy: true,   
      scheduler(){
        newVal = effectFn();
        cb(newVal, oldVal);
        oldVal = newVal
      }
    }
  )
  oldVal = effectFn();
}
function traverse(target:any, seen = new Set()){
  if(typeof target !== 'object' || target === null || seen.has(target)) return;
  seen.add(target)
  for (const key in target) {
    if (Object.prototype.hasOwnProperty.call(target, key)) {
      const element = target[key];
      traverse(element, seen)
    }
  }

  return target;
}