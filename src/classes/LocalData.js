/*
* https://gist.github.com/dmnsgn/14d9f5d0c37870c83ba7e5d5b0653106#file-singletonmodulescopedinstance-js
* */

let instance = null

class LocalData {
    constructor() {
        if (!instance) {
            instance = this
            this.__isInited = false
        }
        return instance
    }

    init() {
        if (!this.__isInited) {
            this._syncFromLocalStorage()
        }
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
        let upperKey
        if (key.indexOf('.') !== -1) {
            let arr = key.split('.')
            upperKey = arr[0]
            key = arr[1]
        }
        return typeof upperKey === 'undefined' ?
                        this.data[key] :
                        (
                            (typeof this.data[upperKey] === 'object' && this.data[upperKey] !== null) ?
                                this.data[upperKey][key] :
                                undefined
                        )
    }

    /*
    * @param sting key
    * @param any value
    * max two level deep inside LocalData.ldKey
    * syntax example: 'upperKey.key'
    * */
    set(key, value) {
        let upperKey
        if (key.indexOf('.') !== -1) {
            let arr = key.split('.')
            upperKey = arr[0]
            key = arr[1]
        }

        if (upperKey) {
            let currentUpperKey = (typeof this.data[upperKey] === 'object' && this.data[upperKey] !== null) ?
                                    this.data[upperKey] :
                                    {}
            this.data = {
                ...this.data,
                [upperKey] : {
                    ...currentUpperKey,
                    [key] : value
                }
            }
        } else {
            this.data = {
                ...this.data,
                [key] : value
            }
        }
        localStorage.setItem(LocalData.ldKey, JSON.stringify(this.data))
    }

    static ldKey = "c-u-w-data"
    static localityKey = 'locality'
    static currentDiscountKey = 'currentDC'
    static trackerKey = 'tr'
    static sessionTimestampKey = 'tr-s-tstmp'
    static sessionTimerKey = 't-s-t'
}

export default LocalData