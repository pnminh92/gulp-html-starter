import Util from './util.js'

class Checkgialinhkien {
  constructor (el) {
    this.el = document.querySelector(el)
    console.log(Util.plus(3, 2))
    console.log('hehaae')
  }
}

new Checkgialinhkien('body')
