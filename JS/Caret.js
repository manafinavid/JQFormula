
var UpdateCaret = (target, len) => {
    var GetCaret = (target) => parseInt(target.prop("Caret")) ?? 0;
    if (len) {
        var v = ($(target).prop("Caret") ?? target.selectionStart ?? window.getSelection().anchorOffset ?? "0")
        v = parseInt(v)
        if (!(v + len < 0 || v + len > ($(target).val() != "" ? $(target).val() : $(target).text()).length))
            $(target).prop("Caret", v + len)
    } else {
        $(target).prop("Caret", target.selectionStart ?? window.getSelection().anchorOffset)
    }

}
var CaretKeyDown = (e) => {
    var currentKey = e.originalEvent.key;
    if (currentKey == "ArrowUp" || currentKey == "ArrowDown") {
        e.preventDefault()
    }
    if (currentKey == "ArrowLeft" || currentKey == "ArrowRight") {
        UpdateCaret(e.target, currentKey == "ArrowLeft" ? -1 : 1)
    } else {
        UpdateCaret(e.target)
    }
}

