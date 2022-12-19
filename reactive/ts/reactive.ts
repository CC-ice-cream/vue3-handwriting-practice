import {track, trigger} from './effect'

const isObject = (target: object) => target!=null && typeof target == 'object'
//响应式函数 代理对象
export const reactive = <T extends object>(target:T): object => {
  return new Proxy(target,{
    get(target, key, receiver){
      //Reflect的第三个参数 receiver 它保证传递正确的 this
      let res = Reflect.get(target, key, receiver) as object
      track(target, key)
      
      if(isObject(res)){
        //深层嵌套代理
        return reactive(res)
      }
      return res
    },
    set(target, key, value, receiver){
      let res = Reflect.set(target, key, value, receiver)
      trigger(target, key)
      return res;
    },

  })
}