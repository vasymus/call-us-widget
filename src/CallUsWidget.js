import {camelToHyphen} from './helpers'


class CallUsWidget {
    constructor(selector, options = {}) {
        this.$element = jQuery(selector)
        let {
            imgSrc = "",
            popupStyles : {
                position = "fixed",
                top = "auto",
                left = "auto",
                bottom = "30px",
                right = "30px",
                width = "150px",
                height = "200px",
                ...restStyles
            } = {},
            callMeText = "перезвоню за {{seconds}} с.",
            modalCallMeText = "Перезвонить мне",
            requiredErrorText = "Укажите номер телефона",
            descriptionText = "Здравствуйте, дождитесь звонка оператора. Если он не успеет за {{seconds}} с., приносим извинения за задержку, Вам обязательно перезвонят.",
            modalSrOnly = "Телефон, на который перезвонить",
            seconds = 25,
            successText = "Ваш запрос оператору отправлен",
            baseCallUrl = "http://bizsys.ln24.ru/sitecall/index.php",
        } = options
        this.imgSrc = imgSrc
        this.popupStyles = {position, top, left, bottom, right, width, height, ...restStyles}
        this._callMeText = callMeText
        this.modalCallMeText = modalCallMeText
        this.requiredErrorText = requiredErrorText
        this.successText = successText
        this._descriptionText = descriptionText
        this.modalSrOnly = modalSrOnly
        this.seconds = seconds
        this.countdown = seconds
        this.baseCallUrl = baseCallUrl
        CallUsWidget.counts++
        this.count = CallUsWidget.counts
    }

    init() {
        this._preloadGif().finally(() => {
            this._render()
            this._findNodes()
            this._addCallMeListeners()
            this._addModalListeners()
            this._addFormListeners()
        })
    }

    _render() {
        this.$element.html(this._getTemplate())
        return this
    }

    _reset() {
        this._stopViewCountdown()
        this._resetCountdown()
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
        this.$img = this.$element.find('.call-us-widget-popup img')
        this.$button = this.$element.find('.call-us-widget-popup .btn')
        this.$body = $('body')
    }

    _addFormListeners() {
        this.$form.on('submit', this.__submitHandler)
    }

    _startViewCountdown() {
        this.interval = setInterval(() => {
            if (this.countdown > 0) {
                this.countdown--
                this.$countdown.html(this._getRenderCountdown())
            } else {
                this.countdown = 0
                this.$countdown.html(this._getRenderCountdown())
                this._stopViewCountdown()
            }
        }, 1000)
    }

    _stopViewCountdown() {
        clearInterval(this.interval)
    }

    _resetCountdown() {
        this.countdown = this.seconds
    }

    _addCallMeListeners() {
        this.$img.on('click', this.__clickToShowModal)
        this.$button.on('click', this.__clickToShowModal)
    }

    _addModalListeners() {
        this.$modal.on('show.bs.modal', this.__showBsModal)
        this.$modal.on('hidden.bs.modal', this.__hiddenBsModal)
    }

    __clickToShowModal = () => this.$modal.modal('show')
    __showBsModal = () => this.$body.addClass('call-us-widget-body-space')
    __hiddenBsModal = () => {
        this.$body.removeClass('call-us-widget-body-space')
        this._reset()
    }
    __submitHandler = (event) => {
        event.preventDefault()
        if (!this.$phoneInput.val()) {
            this.$phoneInputFormGroup.addClass('has-error')
            this.$phoneInputFormGroup.removeClass('has-success')
            this.$phoneInputInfo && this.$phoneInputInfo.remove()
            this.$phoneInputFormGroup.append(`<p class="help-block">${this.requiredErrorText}</p>`)
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
            jQuery.ajax(this.__getCallUrl(), {
                success : (data, textStatus, jqXHR) => {
                    resolve()
                },
                error : (jqXHR, textStatus, errorThrown) => {
                    resolve()
                }
            })
        })
    }

    __getCallUrl = () => {
        return `${this.baseCallUrl}?phone=89${this.$phoneInput.val()}`
    }

    _preloadGif() {
        this.$element.after(`<img src="${this.imgSrc}" alt="" style="position: absolute; text-indent: -9999px; left: -9999px;" />`)
        return new Promise(resolve => {
            this.$element.next().one('load', resolve).one('error', resolve)
        })
    }

    _getPopupStyles() {
        let styles = ""
        for (let key in this.popupStyles) {
            styles += `${camelToHyphen(key)}:${this.popupStyles[key]};`
        }
        return styles
    }

    _getRenderCountdown() {
        return `00:${this.countdown >= 10 ? this.countdown : `0${this.countdown}`}`
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
        <div class="call-us-widget-popup" style="${this._getPopupStyles()}">
            <img src="${this.imgSrc}" alt="" />
            <button type="button" class="btn btn-light btn-sm btn-block js-call-us-widget-call">${this._getCallMeText()}</button>
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
                        <h3 class="modal-title text-center js-call-us-widget-countdown" id="js-call-us-widget-modal-label-${this.count}">${this._getRenderCountdown()}</h3>
                    </div>
                    <div class="modal-body">
                        <p class="text-justify">${this._getDescription()}</p>
                        <form id="js-call-us-widget-form-${this.count}" class="pt-1">
                            <div class="form-group js-call-us-widget-telephone-form-group">
                                <label class="sr-only" for="callback-phone-${this.count}">${this.modalSrOnly}</label>
                                <div class="input-group">
                                    <div class="input-group-addon">+ 7</div>
                                    <input name="telephone" type="tel" class="form-control js-call-us-widget-telephone" id="callback-phone-${this.count}" placeholder="">
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button form="js-call-us-widget-form-${this.count}" type="submit" class="btn btn-primary">${this.modalCallMeText}</button>
                    </div>
                </div>
            </div>
        </div>
    `

    static counts = 0
}

export default CallUsWidget