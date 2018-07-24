export const camelToHyphen = (str) => {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
}


/*
* https://stackoverflow.com/a/30058928
* */
export const isNumericInput = (event) => {
    const key = event.keyCode
    return ((key >= 48 && key <= 57) || // Allow number line
        (key >= 96 && key <= 105) // Allow number pad
    )
}
export const isModifierKey = (event) => {
    const key = event.keyCode;
    return (event.shiftKey === true || key === 35 || key === 36) || // Allow Shift, Home, End
        (key === 8 || key === 9 || key === 13 || key === 46) || // Allow Backspace, Tab, Enter, Delete
        (key > 36 && key < 41) || // Allow left, up, right, down
        (
            // Allow Ctrl/Command + A,C,V,X,Z
            (event.ctrlKey === true || event.metaKey === true) &&
            (key === 65 || key === 67 || key === 86 || key === 88 || key === 90)
        )
}
export const enforceFormat = (event) => {
    if (!isNumericInput(event) && !isModifierKey(event)) event.preventDefault()
}
export const formatToPhone = (event) => {
    if (isModifierKey(event)) return
    const target = event.target
    const input = event.target.value.replace(/\D/g,'').substring(0,10) // First ten digits of input only
    const zip = input.substring(0,3)
    const middle = input.substring(3,6)
    const last = input.substring(6,10)

    if (input.length > 6) {
        target.value = `${zip}-${middle}-${last}`
    } else if (input.length > 3) {
        target.value = `${zip}-${middle}`
    }
    else if (input.length > 0) {
        target.value = `${zip}`
    }
}
