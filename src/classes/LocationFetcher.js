import LocalData from './LocalData'


class LocationFetcher {
    constructor() {
        this.locality = ""
        this.localData = new LocalData()
        this.resolvers = {}
    }

    init() {
        this.localData.init()
    }

    resolveLocality(resolve) {
        this.resolvers = {
            ...this.resolvers,
            outer : resolve
        }
        this.__setLocality()
    }

    getFormatedLocality() {
        return this.locality ? this.__getFormatedLocalityWithDeclension() : ""
    }

    __setLocality() {
        let locality = this.localData.get(LocalData.localityKey)
        if (locality) {
            this.locality = locality
            this.___resolveCB()
            return
        }

        navigator.geolocation.getCurrentPosition(
            (position) => { // user gave geolocation
                this.__setLocalityViaGoogleMap(position.coords.latitude, position.coords.longitude)
            },
            this.__getCoordsByIp // user refused to give geolocation
        )
    }

    __setLocalityToLocalData() {
        this.localData.set(LocalData.localityKey, this.locality)
        this.localData.set('formatedLocality', this.getFormatedLocality())
    }

    __setLocalityViaGoogleMap(latitude, longtitude) {
        fetch(`${LocationFetcher.GURL}?latlng=${latitude},${longtitude}&key=${LocationFetcher.GK}&language=${LocationFetcher.language}`)
            .then(this.___middleThenCB)
            .then(response => {
                let {results} = response
                if (!Array.isArray(results)) results = []
                this.locality = this.__parseLocalityFromGooogleMap(results)
                this.__setLocalityToLocalData()
            })
            .catch(this.___errorCB)
            .finally(this.___resolveCB)
    }

    __getCoordsByIp() {
        fetch(`${LocationFetcher.IPSERVICE_URL}?access_key=${LocationFetcher.IPSERVICE_K}&language=${LocationFetcher.language}`)
            .then(this.___middleThenCB)
            .then(response => {
                let {latitude, longitude} = response
                return new Promise(resolve => {
                    this.__setLocalityViaGoogleMap(latitude, longitude)
                    this.resolvers = {
                        ...this.resolvers,
                        inner : resolve
                    }
                })
            })
            .error(this.___errorCB)
            .finally(this.___resolveCB)
    }

    __parseLocalityFromGooogleMap(results) {
        let formattedAddresses = results.map(r => r.formatted_address).filter(r => !!r)
        if (!formattedAddresses.length) return ''
        let locality = this.__parseLocalityViaCitySearchKeys(formattedAddresses)
        if (locality) return locality
        locality = this.__parseLocalityViaRegion(formattedAddresses)
        return locality
    }

    __parseLocalityViaCitySearchKeys(formattedAddresses) {
        let locality = ''
        for (let i = 0; i < formattedAddresses.length; i++) {
            let address = formattedAddresses[i]
            for (let j = 0; j < LocationFetcher.citySearchKeys.length; j++) {
                let exc = LocationFetcher.citySearchKeys[j]
                if (address.indexOf(exc) !== -1) {
                    locality = exc
                    break
                }
            }
        }
        return locality
    }

    __parseLocalityViaRegion(formattedAddresses) {
        let locality = ''
        formattedAddresses.forEach(addr => {
            if (!locality && addr.search(/, [а-яА-ЯЁё]+?( обл\.| область),/mg) !== -1) {
                let match = addr.match(/[а-яА-ЯЁё]+(?=, [а-яА-ЯЁё]+?( обл\.| область),)/mg)
                if (match) locality = match[0]
            }
        })
        return locality
    }

    __getFormatedLocalityWithDeclension = () => {
        let locality = this.locality
        if (!locality) return ''
        return locality.indexOf('г. ') !== -1 ? `из ${locality}` : ` (${locality})`
    }

    ___middleThenCB = response => {
        if (response.status >= 400) throw new Error(response.statusText)
        return response.json()
    }
    ___errorCB = error => console.warn(error)
    ___resolveCB = () => {
        for (let resolveKey in this.resolvers) {
            typeof this.resolvers[resolveKey] === 'function' && this.resolvers[resolveKey]()
        }
    }

    static citySearchKeys = [
        'Москва',
        'Санкт-Петербург',
        'г. '
    ]

    static IPSERVICE_URL = "http://api.ipstack.com/check"
    static IPSERVICE_K = "1d64a17fea3a3231cbeaa11c15ea8ccf"
    static GURL = "https://maps.googleapis.com/maps/api/geocode/json"
    static GK = "AIzaSyC_vHnW69CWaBnw09Lce6NbCe-aXoIuKCY"
    static language = "ru"
}

export default LocationFetcher