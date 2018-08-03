import LocalData from './LocalData'


class Tracker {
    constructor() {
        this.localData = new LocalData()
        this.sessionTimestamp = Date.now()
    }

    init() {
        this.localData.init()
        this._setSessionTimestamp()
        this._initSessionTimer()
    }

    _setSessionTimestamp() {
        let currentTrackerData = this.__getCurrentTrackerData()
        this.localData.set(`${LocalData.trackerKey}.${this.sessionTimestamp}`, {
            ...currentTrackerData,
            [LocalData.sessionTimestampKey] : this.sessionTimestamp
        })
    }

    _initSessionTimer() {
        setInterval(() => {
            let currentTrackerData = this.__getCurrentTrackerData()
            this.localData.set(`${LocalData.trackerKey}.${this.sessionTimestamp}`, {
                ...currentTrackerData,
                [LocalData.sessionTimerKey] : (Date.now() - this.sessionTimestamp)
            })
        }, Tracker.sessionTimerIntervalMs)
    }

    __getCurrentTrackerData() {
        return this.localData.get(`${LocalData.trackerKey}.${this.sessionTimestamp}`) || {}
    }

    static sessionTimerIntervalMs = 5000
}

export default Tracker