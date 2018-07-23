# Installation
```npm
npm install
```
# Development [laravel-mix](https://github.com/JeffreyWay/laravel-mix)
```npm
npm run watch
```
# Production (laravel-mix) [laravel-mix](https://github.com/JeffreyWay/laravel-mix)
```npm
npm run prod
```
# Usage
...
```html
<link rel="stylesheet" href="css/call-us-widget.css">
```
...
```html
<div class="call-us-widget"></div>
```
...
```html
<script src="js/call-us-widget.js"></script>
```
```javascript
if (CallUsWidget) {
    let widget = new CallUsWidget('.call-us-widget', {
        imgSrc : "./images/call-me-img.gif"
    });
    widget.init();
}
```
## Arguments
```javascript
new CallUsWidget(selector, options)
```
### selector
any
### options
name | type | default | description
--- | --- | --- | ---
*imgSrc* | `string` | **""** | **Required** Path to the image
*callMeText* | `string` | **"перезвоню за {{seconds}} с."** | Text of the "call me" button (not in the modal). Could use {{seconds}} as a template variable
*modalCallMeText* | `string` | **"Перезвонить мне"** | Text of the "call me" button (in the modal).
*requiredErrorText* | `string` | **"Укажите номер телефона"** | Text which displayed, if telephone field wasn't filled
*descriptionText* | `string` | **"Здравствуйте, дождитесь звонка оператора. Если он не успеет за {{seconds}} с., приносим извинения за задержку, Вам обязательно перезвонят."** | Text of modal body. Could use {{seconds}} as a template variable
*modalSrOnly* | `string` | **"Телефон, на который перезвонить"** | Text the displayed for Accessibility purpose
*seconds* | `number` | **"25"** | The number of seconds for countdown. Could be used for *callMeText* and *descriptionText* instead of `{{template}}`
*successText* | `string` | **"Ваш запрос оператору отправлен"** | Success text shown under telephone input field.
*baseCallUrl* | `string` | **"http://bizsys.ln24.ru/sitecall/index.php"** | Url for ajax get request to third party server -- distributor of operator call
*siteName* | `string` | **window.location.hostname** | The get parameter in callback REST API. For statistic purpose
*popupStyles* | `object` | **{ position : "fixed", top : "auto", left : "auto", bottom : "30px", right : "30px", width : "150px", height : "200px" }** | Style object. Applied to popup. Could use camelCase css styles, e.g. backgroundColor, or hyphen case ones, e.g. background-color. Other styles, beside shown as default, could also be applied, for e.g. **{ backgroundColor : "red", "border-bottom" : "1px solid purple" }**
