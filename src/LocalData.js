/*
* https://gist.github.com/dmnsgn/14d9f5d0c37870c83ba7e5d5b0653106#file-singletonmodulescopedinstance-js
* */

let instance = null

class LocalData {
    constructor() {
        if (!instance) instance = this
        return instance
    }

    init() {
        this._syncFromLocalStorage()
    }

    _syncFromLocalStorage() {
        this.data = this._getCurrent()
    }

    _getCurrent() {
        let data
        try {
            data = JSON.parse(localStorage.getItem(LocalData.ldKey))
        } catch (e) {
            data = {}
        }
        if (!data || typeof data !== 'object') data = {}
        return data
    }

    get(key) {
        return this.data[key]
    }

    set(key, value) {
        this.data[key] = value
        let data = this._getCurrent()
        data[key] = value
        localStorage.setItem(LocalData.ldKey, JSON.stringify(data))
    }

    static ldKey = "c-u-w-data"
}

export default LocalData