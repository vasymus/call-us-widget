import {camelToHyphen, enforceFormat, formatToPhone} from '../helpers'
import LocalData from './LocalData'
import LocationFetcher from './LocationFetcher'
import Tracker from './Tracker'


class CallUsWidget {
    constructor(selector, options = {}) {
        /*
        * put it here, because if put in bootstrap.js some times typeof jQuery().modal === 'undefined'
        * */
        if (typeof jQuery === 'undefined') {
            window.$ = window.jQuery = require('jquery/dist/jquery.slim')
        }

        /*
        * https://stackoverflow.com/a/14768682
        * */
        if (typeof jQuery().emulateTransitionEnd !== 'function' && typeof jQuery().modal !== 'function') {
            require('bootstrap-sass/assets/javascripts/bootstrap/transition')
            require('bootstrap-sass/assets/javascripts/bootstrap/modal')
        }

        this.$element = jQuery(selector)
        let {
            imgSrc = "",
            popupStyles : {
                position = "fixed",
                top = "auto",
                left = "auto",
                bottom = "30px",
                right = "30px",
                width = "auto",
                height = "auto",
                ...restPopupStyles,
            } = {},
            imgStyles : {
                width : imgWidth = "auto",
                height : imgHeight = "auto",
                ...restImgStyles,
            } = {},
            buttonStyles : {
                width : buttonWidth = "auto",
                ...restButtonStyles,
            } = {},
            popupCloseStyles : {
                ...restPopupCloseStyles,
            },
            buttonClass = "primary",
            callMeText = "перезвоню за {{seconds}} с.",
            modalCallMeText = "Перезвонить мне",
            requiredErrorText = "Укажите номер телефона",
            correctNumberErrorText = "Некорректный номер телефона",
            descriptionText = '<p class="text-center">Здравствуйте, дождитесь ответа оператора.</p><p class="text-center">Он Вам перезвонит за {{seconds}} сек.</p>',
            modalSrOnly = "Телефон, на который перезвонить",
            seconds = 25,
            successText = "Ваш запрос оператору отправлен",
            baseCallUrl = "http://bizsys.ln24.ru/sitecall/index.php",
            siteName = window.location.hostname,
            temporaryHidePopupTime = 180000 // 3 minutes
        } = options
        this.imgSrc = imgSrc
        this.popupStyles = {position, top, left, bottom, right, width, height, ...restPopupStyles}
        this.imgStyles = {width : imgWidth, height : imgHeight, ...restImgStyles}
        this.buttonStyles = {width : buttonWidth, ...restButtonStyles}
        this.popupCloseStyles = {...restPopupCloseStyles}
        this._callMeText = callMeText
        this.modalCallMeText = modalCallMeText
        this.requiredErrorText = requiredErrorText
        this.correctNumberErrorText = correctNumberErrorText
        this.successText = successText
        this._descriptionText = descriptionText
        this.modalSrOnly = modalSrOnly
        this.seconds = seconds
        this.baseCallUrl = baseCallUrl
        this.siteName = siteName
        this.buttonClass = buttonClass
        this.temporaryHidePopupTime = temporaryHidePopupTime
        this.count = CallUsWidget.counts
        this.localData = new LocalData()
        this.locationFetcher = new LocationFetcher()
        this.tracker = new Tracker()
        CallUsWidget.counts++
    }

    init() {
        this.localData.init()
        this.locationFetcher.init()
        this.tracker.init()
        this._preloadGif()
            .finally(() => new Promise(resolve => {
                this.locationFetcher.resolveLocality(resolve)
            }))
            .finally(() => {
                this._render()
                this._findNodes()
                this._addCallMeListeners()
                this._addModalListeners()
                this._addFormListeners()
                this._initCloud()
                this._renderLocation()
            })
    }

    _render() {
        this.$element.html(this._getTemplate())
    }

    _reset() {
        this._stopViewCountdown()
        this.$modal.remove()
        this.$element.append(this._getModalTemplate())
        this._findNodes()
        this._addModalListeners()
        this._addFormListeners()
    }

    _findNodes() {
        this.$modal = this.$element.find('.modal')
        this.$form = this.$modal.find('form')
        this.$phoneInputFormGroup = this.$form.find('.js-call-us-widget-telephone-form-group')
        this.$phoneInput = this.$phoneInputFormGroup.find('.js-call-us-widget-telephone')
        this.$countdown = this.$modal.find('.js-call-us-widget-countdown')
        this.$seconds = this.$countdown.find('.js-call-us-widget-sec')
        this.$ms = this.$countdown.find('.js-call-us-widget-ms')
        this.$popup = this.$element.find('.call-us-widget-popup')
        this.$popupClose = this.$popup.find('.js-call-us-widget-popup-close')
        this.$popupCloud = this.$popup.find('.js-call-us-widget-popup-cloud')
        this.$popupCloudGreeting = this.$popupCloud.find('.js-call-us-widget-popup-cloud-greeting')
        this.$popupCloudDiscount = this.$popupCloud.find('.js-call-us-widget-popup-cloud-discount')
        this.$popupCloudClose = this.$popupCloud.find('.js-call-us-widget-popup-cloud-close')
        this.$location = this.$popup.find('.js-call-us-widget-location')
        this.$wheelAnimationInt = this.$popup.find('.js-call-us-widget-wheel-int')
        this.$wheelAnimationFloat = this.$popup.find('.js-call-us-widget-wheel-float')
        this.$popupCloudMoveText = this.$popup.find('.js-call-us-widget-move-text')
        this.$img = this.$popup.find('img')
        this.$button = this.$popup.find('.btn')
        this.$body = jQuery('body')
    }

    _renderLocation() {
        let locality = this.locationFetcher.getFormatedLocality()
        this.$location.html(locality)
    }

    _initCloud() {
        this.cloudTimer = setTimeout(this.__cloudAppearDefferCB, CallUsWidget.popupCloudAppearDeffer)
    }
    __cloudAppearDefferCB = () => {
        this.$popupCloud.show()
        this.$popupCloudGreeting.removeClass('v-hidden').addClass('fadeIn')

        setTimeout(() => {
            this.$popupCloudGreeting.removeClass('fadeIn').addClass('fadeOut')
            this.$popupCloudMoveText.removeClass('v-hidden').addClass('fadeIn call-us-widget-move-text')
            this.$popupCloudDiscount.removeClass('v-hidden').addClass('fadeIn')

            this._initDiscountAnimation()
            setTimeout(this._disappearCloud, CallUsWidget.popupCloudDisappear)
        }, 3000)
    }

    _disappearCloud = () => {
        this.$popupCloud.hide()
        this.__resetAnimationDiscount()

        clearTimeout(this.cloudTimer)
        this.$popupCloud.hide()
        this.$popupCloudGreeting.addClass('v-hidden').removeClass('fadeIn fadeOut')
        this.$popupCloudMoveText.addClass('v-hidden').removeClass('fadeIn call-us-widget-move-text')
        this.$popupCloudDiscount.addClass('v-hidden').removeClass('fadeIn')
        this.cloudTimer = setTimeout(this.__cloudAppearDefferCB, CallUsWidget.popupCloudAppearDeffer)
    }
    __resetAnimationDiscount = () => {
        this.animationDiscount = 0
        this.__renderAnimateDiscount()
    }

    _initDiscountAnimation() {
        this.animationDiscount = 0
        this.__renderAnimateDiscount()
        this.animationTimer = setTimeout(this.__manualAnimation, 250)
    }

    __manualAnimation = () => {
        if (this.animationDiscount >= 50) {
            clearTimeout(this.animationTimer)
        } else {
            this.animationDiscount++
            this.__renderAnimateDiscount()
            this.animationTimer = setTimeout(this.__manualAnimation, 250)
        }
    }

    __renderAnimateDiscount = () => {
        let int = this.___getAnimateDiscountInt()
        let float = this.___getAnimateDiscountFloat()
        this.$wheelAnimationInt.html(int)
        this.$wheelAnimationFloat.html(float)
    }

    ___getAnimateDiscountInt = () => (this.animationDiscount / 10).toFixed(1).split('.')[0]
    ___getAnimateDiscountFloat = () => (this.animationDiscount / 10).toFixed(1).split('.')[1]

    _addFormListeners() {
        this.$form.on('submit', this.__submitHandler)
        this.$phoneInput.on('keydown', this.__keydown)
        this.$phoneInput.on('keyup', this.__keyup)
    }

    _startViewCountdown() {
        this.startTimestamp = Date.now()
        this.interval = setInterval(() => {
            let subtractedTimePassed = this.__getMS() - (Date.now() - this.startTimestamp)
            if (subtractedTimePassed > 0) {
                this.$seconds.html(this._getCountdownSecondsFormated(subtractedTimePassed))
                this.$ms.html(this._getCountdownMsFormated(subtractedTimePassed))
            } else {
                this.$seconds.html(this._getCountdownSecondsFormated(0))
                this.$ms.html(this._getCountdownMsFormated(0))
                this._stopViewCountdown()
            }
        }, 100)
    }

    _stopViewCountdown() {
        clearInterval(this.interval)
    }

    _temporaryHidePopup() {
        this.$popup.removeClass(CallUsWidget.animatedEntranceClass).addClass(CallUsWidget.animatedLeaveClass)
        setTimeout(() => {
            this.$popup.removeClass(CallUsWidget.animatedLeaveClass).addClass(CallUsWidget.animatedEntranceClass)
        }, this.temporaryHidePopupTime)
    }

    _addCallMeListeners() {
        this.$popupClose.on('click', this.__clickPopupClose)
        this.$img.on('click', this.__clickToShowModal)
        this.$button.on('click', this.__clickToShowModal)
        this.$popupCloud.on('click', this.__clickToShowModal)
        this.$popupCloudClose.on('click', this.__clickToPopupClose)
    }

    _addModalListeners() {
        this.$modal.on('show.bs.modal', this.__showBsModal)
        this.$modal.on('hidden.bs.modal', this.__hiddenBsModal)
    }

    __clickToPopupClose = () => this._disappearCloud()

    __clickPopupClose = () => {
        this._temporaryHidePopup()
    }
    __clickToShowModal = (event) => {
        let $target = $(event.target)
        if (!$target.is(this.$popupCloudClose) && !$target.is(this.$popupCloudClose.children().first())) this.$modal.modal('show')
    }
    __showBsModal = () => this.$body.addClass('call-us-widget-body-space')
    __hiddenBsModal = () => {
        this.$body.removeClass('call-us-widget-body-space')
        this._reset()
    }
    __keydown = enforceFormat
    __keyup = formatToPhone
    __submitHandler = (event) => {
        event.preventDefault()
        let value = this.$phoneInput.val()
        if (!value || !this._checkNumber(value)) {
            this.$phoneInputFormGroup.addClass('has-error')
            this.$phoneInputFormGroup.removeClass('has-success')
            this.$phoneInputInfo && this.$phoneInputInfo.remove()
            this.$phoneInputFormGroup.append(`<p class="help-block">${!this.$phoneInput.val() ? this.requiredErrorText : this.correctNumberErrorText}</p>`)
            this.$phoneInputInfo = this.$phoneInputFormGroup.children().last()
        } else {
            this._sendCallRequest().finally(() => {
                this.$phoneInputFormGroup.removeClass('has-error')
                this.$phoneInputFormGroup.addClass('has-success')
                this.$phoneInputInfo && this.$phoneInputInfo.remove()
                this.$phoneInputFormGroup.append(`<p class="help-block">${this.successText}</p>`)
                this.$phoneInputInfo = this.$phoneInputFormGroup.children().last()
                this._startViewCountdown()
            })
        }
        return false
    }

    _sendCallRequest = () => {
        return new Promise(resolve => {
            fetch(this.__getCallUrl())
                .then(response => {
                    if (response.status === 422) throw new Error("Проверьте, пожалуйста, корректность введенного номера.") // TODO display according error
                    return response.json()
                })
                .then(response => {
                    resolve()
                }).catch(error => {
                    resolve()
                })
        })
    }

    __getCallUrl = () => {
        return `${this.baseCallUrl}?phone=8${this.__getFinalPhoneInput()}&queue=505&sent-at=${Date.now()}&site_name=${this.siteName}`
    }

    __getFinalPhoneInput = () => {
        let excludDash = ("" + this.$phoneInput.val()).split("-")
        return excludDash.join("")
    }

    _preloadGif() {
        this.$element.after(`<img src="${this.imgSrc}" alt="" style="position: absolute; text-indent: -9999px; left: -9999px;" />`)
        return new Promise(resolve => {
            this.$element.next().one('load', resolve).one('error', resolve)
        })
    }

    _getStyles = (elementName) => {
        if (!['popup', 'img', 'button', 'popup-close'].includes(elementName)) console.warn('wrong element name for styles applying')
        let styles = ""
        let populator
        switch (elementName) {
            case 'popup' : {
                populator = this.popupStyles
                break
            }
            case 'img' : {
                populator = this.imgStyles
                break
            }
            case 'button' : {
                populator = this.buttonStyles
                break
            }
            case 'popup-close' : {
                populator = this.popupCloseStyles
                break
            }
        }
        for (let key in populator) {
            styles += `${camelToHyphen(key)}:${populator[key]};`
        }
        return styles
    }

    _getCountdownSecondsFormated(ms) {
        let res = (ms / 1000).toFixed(0)
        return res.length === 1 ? `0${res}` : res
    }

    _getCountdownMsFormated(ms) {
        let res = (ms / 1000).toFixed(2).split('.')[1]
        return res.length === 1 ? `0${res}` : res
    }

    _getTextFromTemplate(template = "") {
        return `${template.split("{{")[0]}${this.seconds}${template.split("}}")[1]}`
    }

    _getDescription() {
        return this._getTextFromTemplate(this._descriptionText)
    }

    _getCallMeText() {
        return this._getTextFromTemplate(this._callMeText)
    }

    _getTemplate = () => `
        ${this._getPopupTemplate()}
        ${this._getModalTemplate()}
    `

    _getPopupTemplate = () => `
        <div class="call-us-widget-popup animated ${CallUsWidget.animatedEntranceClass}" style="${this._getStyles('popup')}">
            <button type="button" class="close call-us-widget-popup-close js-call-us-widget-popup-close" aria-label="Close" style="${this._getStyles('popup-close')}">
                <span aria-hidden="true">×</span>
            </button>
            ${this._getPopupCloudTemplate()}
            <img src="${this.imgSrc}" alt="" style="${this._getStyles('img')}" />
            <button type="button" class="btn btn-${this.buttonClass} btn-sm btn-block center-block js-call-us-widget-call" style="${this._getStyles('button')}">${this._getCallMeText()}</button>
        </div>
    `

    _getPopupCloudTemplate = () => `
        <div class="call-us-widget-popup-cloud js-call-us-widget-popup-cloud well well-sm m-0" style="display:none;">
            <button type="button" class="close call-us-widget-popup-cloud-close js-call-us-widget-popup-cloud-close" aria-label="Close"><span aria-hidden="true">&times;</span></button>
            <p class="text-center v-hidden call-us-widget-popup-cloud-big-text call-us-widget-popup-cloud-greeting js-call-us-widget-popup-cloud-greeting animated">Привет!!!</p>
            <div class="ovh-x">
                <p class="text-center text-nowrap js-call-us-widget-move-text v-hidden animated">&mdash; только сегодня клиентам <span class="js-call-us-widget-location"></span> &mdash;</p>
            </div>
            <p class="text-center call-us-widget-popup-cloud-big-text js-call-us-widget-popup-cloud-discount v-hidden animated" style="overflow-y: hidden;">скидки <span class="call-us-widget-wheel js-call-us-widget-wheel-int">0</span>.<span class="call-us-widget-wheel js-call-us-widget-wheel-float">0</span>%</p>
            <div class="call-us-widget-no-click-layer"></div>
        </div>
    `

    _getModalTemplate = () => `
        <div class="modal fade" id="call-us-widget-modal-${this.count}" tabindex="-1" role="dialog" aria-labelledby="js-call-us-widget-modal-label-${this.count}">
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                        <h3 class="modal-title text-center js-call-us-widget-countdown" id="js-call-us-widget-modal-label-${this.count}">00:<span class="js-call-us-widget-sec">${this._getCountdownSecondsFormated(this.__getMS())}</span>.<span class="js-call-us-widget-ms">${this._getCountdownMsFormated(this.__getMS())}</span></h3>
                    </div>
                    <div class="modal-body">
                        ${this._getDescription()}
                        <form id="js-call-us-widget-form-${this.count}" class="pt-1">
                            <div class="form-group js-call-us-widget-telephone-form-group call-us-widget-telephone-form-group">
                                <label class="sr-only" for="callback-phone-${this.count}">${this.modalSrOnly}</label>
                                <div class="input-group call-us-widget-input-group-center">
                                    <div class="input-group-addon">+ 7</div>
                                    <input name="telephone" type="tel" class="form-control js-call-us-widget-telephone" id="callback-phone-${this.count}" placeholder="">
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button form="js-call-us-widget-form-${this.count}" type="submit" class="btn btn-${this.buttonClass}">${this.modalCallMeText}</button>
                    </div>
                </div>
            </div>
        </div>
    `

    __getMS(){
        return this.seconds * 1000
    }

    _checkNumber = (value) => /^\d{3}-\d{3}-\d{4}$/g.test(value)

    static counts = 0
    static animatedEntranceClass = "fadeInRight"
    static animatedLeaveClass = "fadeOutRight"
    static discountAmount = 50
    static popupCloudAppearDeffer = 2000 // 180000 // 3 minutes
    static popupCloudDisappear = 30000
}

export default CallUsWidget