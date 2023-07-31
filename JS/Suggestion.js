var suggestionItem = []

var SuggestionIndex = 0;
class SuggestionItem {
    SuggestionItem() {
        SuggestionIndex++;
        this.Id = SuggestionIndex;
    }
    Id = 0;
    Lable = "";
    Value = "";
    Childs = [];
}

var AddItems = (items = []) => {
    var sortCompere = (a, b) => {
        if (a.Lable > b.Lable)
            return 1
        if (a.Lable < b.Lable)
            return -1
        return 0
    }

    var sortChilds = (item) => {
        if (!item.Childs)
            return
        item.Childs.sort(sortCompere)
        for (let index = 0; index < item.Childs.length; index++) {
            item.Childs[index]["Id"] = parseInt(Math.random() * 1_000_000_000)
            sortChilds(item.Childs[index])
        }
    }

    for (let index = 0; index < items.length; index++) {
        items[index]["Id"] = parseInt(Math.random() * 1_000_000_000)
        sortChilds(items[index])
        suggestionItem.push(items[index])
    }

    suggestionItem.sort(sortCompere)
};

var BindSuggestionMenu = (target) => {
    $(target).on("input", (e) => {
        if ($(target).prop("LastKey") != "Backspace") {
            UpdateCaret(e.target, 1)
            FilterMenu()
            UpdateHoverLocation();
        }
    })
    $(target).on("keydown", (e) => {
        CaretKeyDown(e)
        var lastKey = $(target).prop("LastKey");
        var currentKey = e.originalEvent.key;
        if (lastKey == "Control" && currentKey == " ") {
            FilterMenu()
        }
        else if (currentKey == "Escape") {
            RemoveMenu()
        }
        else if (currentKey == "ArrowDown" && $(".suggestion li.hover").next().length) {
            UpdateHoverLocation($(".suggestion li.hover").next())
        }
        else if (currentKey == "ArrowUp" && $(".suggestion li.hover").prev().length) {
            UpdateHoverLocation($(".suggestion li.hover").prev())
        }
        else if (currentKey == "Tab" || currentKey == "Enter") {
            e.preventDefault()
            SelectItem()
        }
        else if (currentKey == "ArrowLeft" || currentKey == "ArrowRight") {
            FilterMenu()
            UpdateHoverLocation();
        } else if (currentKey == "Backspace") {
            UpdateCaret($(".suggestionable"), -1)
            FilterMenu()
            UpdateHoverLocation();
        }
        $(target).prop("LastKey", currentKey)
    })
    // $(target).on("keyup", (e) => {
    //     var currentKey = e.originalEvent.key;
    //     if (currentKey == "Tab" || currentKey == "Enter") {
    //         UpdateHoverLocation();
    //         FilterMenu()
    //     }
    // })
}
var ShowMenu = (items) => {
    var GetDisplayLable = (display) => {
        if (display) {
            return `<span class="text-container" data-text="${display}">${display}</span>`
        }
        return ""
    }
    var menu = "";
    if ($(".suggestion").length == 0) {
        menu = `<div class="suggestion"><ul>`;
        menu += `</ul></div>`;
        $("body").append(menu)
    }
    menu = "";
    var removeable = $(".suggestion-item")
    for (var i = 0; i < items.length; i++) {
        removeable = removeable.not(`[data-id="${items[i].Id}"]`)

        if (!$(`.suggestion-item[data-id="${items[i].Id}"]`).length) {
            menu +=
                `<li class="suggestion-item" data-id="${items[i].Id}" data-value="${items[i].Value}"> 
            ${(GetDisplayLable(items[i].Lable))}
            ${(GetDisplayLable(items[i].Display))}
            </li>`
        }
    }

    $(".suggestion ul").append(menu)
    removeable.remove()
    UpdateHoverLocation();
    UpdateMenuSize();
    return $(".suggestion")
}

var IsSplited = (val, withDot) => {
    var spliters = " /*-+[],()%^\n";
    if (withDot)
        spliters += "."
    for (var j = 0; j < spliters.length; j++) {
        if (val == spliters[j])
            return true
    }
}
var lastSplited = (val, withDot = true, from = undefined) => {
    if (!from) {
        from = val.length - 1
    }
    for (var j = from; j > 0; j--) {
        if (IsSplited(val[j], withDot))
            return j
    }
    return -1
}
var GetSearchParam = (endAtCurser = false, splitDot = false) => {

    var content = $(".suggestionable").val()
    var curser = GetCaret();
    var end = curser;
    var startindex = 0;
    var endindex = curser;
    for (var i = end - 1; i > 0; i--) {
        if (IsSplited(content[i], splitDot)) {
            startindex = i + 1
            break
        }
    }
    if (!endAtCurser) {
        endindex = content.length;
        for (var i = end; i < content.length; i++) {
            if (IsSplited(content[i], splitDot)) {
                endindex = i
                break
            }
        }
    }
    if (endindex <= startindex) {
        startindex = endindex
    }
    if (IsSplited(content.substring(startindex, endindex).toLowerCase())) {
        endindex = startindex
    }
    return {
        term: content.substring(startindex, endindex).toLowerCase(),
        start: startindex,
        end: endindex,
    }; // get startindex, endindex for replace on tab
}
var FindChild = (arr, name) => {
    for (let index = 0; index < arr.length; index++) {
        if (arr[index].Lable.toLowerCase() == name)
            return arr[index]
    }
}
var GetTrueItemRange = (searchParam) => {
    try {

        var path = searchParam.split(".");
        var results = suggestionItem
        if (path.length > 1) {
            for (let index = 0; index < path.length - 1; index++) {
                results = FindChild(results, path[index]).Childs;
            }
        }
    } catch { }

    return results ?? [];
}

var FilterMenu = () => {
    var _param = GetSearchParam(true);
    var search = _param.term;

    var range = GetTrueItemRange(search);
    ShowMenu(range)
    search = search.split(".")[search.split(".").length - 1]
    if (!search)
        search = ""
    if (search.trim() != "") {
        $(".suggestion li").each((index, element) => {
            var _text_ = "";

            var FoundAny = false;
            $(element).find("span.text-container").each((index, subelement) => {
                var NotFound = false;
                var text = $(subelement).attr("data-text");
                var lowcasetext = text.toLowerCase();
                var Lastposition = 0;

                for (var i = 0; i < search.length; i++) {
                    var location = lowcasetext.indexOf(search[i], Lastposition + (i != 0));
                    if (location != -1) {
                        if (i) {
                            Lastposition++;
                        }
                        _text_ += text.substring(Lastposition, location)
                        _text_ += `<span class="select-text">${text[location]}</span>`
                        Lastposition = location
                    } else {
                        NotFound = true
                        break;
                    }
                }
                if (!NotFound) {
                    _text_ += text.substring(Lastposition + 1)
                    $(subelement).html(_text_)
                }
                FoundAny = FoundAny || !NotFound
            })
            if (!FoundAny) {
                $(element).hide()
            } else {
                $(element).show()
            }


        })
    } else {
        $(".suggestion li").each((index, element) => {
            $(element).find("span.text-container").each((index, subelement) => {
                $(subelement).html($(subelement).attr("data-text"))
            })
            $(element).show()
        })
    }
    UpdateHoverLocation()
}

$(document).on("mouseenter", ".suggestion li", (e) => {
    UpdateHoverLocation($(e.originalEvent.target))
})
$(document).on("click", ".suggestion li", () => {
    SelectItem()
});

var UpdateHoverLocation = (target) => {
    $(".suggestion li").removeClass("hover");
    if (target) {
        if ($(target).is("li")) {
            $(target).addClass("hover");
        } else {
            $(target).parents("li").addClass("hover");
        }
    } else {
        $($(".suggestion li:not(:hidden)")[0]).addClass("hover");
    }
}
var UpdateMenuSize = (target) => {
    $(".suggestion").css({
        top: $(".suggestionable").offset().top + $(".suggestionable").outerHeight(true),
        left: $(".suggestionable").offset().left + GetWidth($(".suggestionable").val().substring(0, GetCaret()), $(".suggestionable")),
        position: "absolute",
    })
}

var IsMenuShown = () => !$(".suggestion").is(":hidden");
var RemoveMenu = () => $(".suggestion").remove();
var SelectItem = () => {
    var _param = GetSearchParam(true, true);
    var content = $(".suggestionable").val()
    var text = $(".suggestion .suggestion-item.hover").attr("data-value").trim()
    if (text == "undefined") {
        text = $(".suggestion .suggestion-item.hover .text-container:first-of-type").attr("data-text").trim()
    }
    var textlenght = text.length
    $(".suggestionable").val(content.substring(0, _param.start)
        + text
        + content.substring(_param.end))
    UpdateCaret($(".suggestionable"), (textlenght - (_param.end - _param.start)))

    var pos = GetCaret($(".suggestionable"))
    var target = $(".suggestionable")[0]
    if (target.setSelectionRange) {
        target.focus();
        target.setSelectionRange(pos, pos);
    }
    else if (target.createTextRange) {
        var range = target.createTextRange();
        range.collapse(true);
        range.moveEnd('character', pos);
        range.moveStart('character', pos);
        range.select();
    }



    // FilterMenu()
    RemoveMenu()
}

var GetCaret = () => parseInt($(".suggestionable").prop("Caret"));

var CalculateTotalWidth = (anchorNode) => {
    var totalWidth = 0;
    var loc, container;
    if ($(anchorNode).parent().is(".suggestionable") &&
        $(anchorNode).prev().length) {
        loc = $(anchorNode).prev();
    } else {
        loc = $(anchorNode.parentElement)
    }
    container = loc

    while (!loc.is(".suggestionable") && loc.length) {
        while (loc.length) {
            loc = loc.prev()
            if (loc.length)
                totalWidth += loc.outerWidth(true);
        }
        loc = loc.parent()
    }

    totalWidth += GetWidth(anchorNode.textContent.substring(0, GetCaret()));

    return totalWidth
}

var GetWidth = (val, container) => {
    val = val.replaceAll(" ", "1")

    $("body").append($(`<span class="text-len" style="position: absolute;display:none;">${val}</span>`))
    $(".text-len").html(val)
    $(".text-len").css("font", container.css("font"))
    var w = $(".text-len").width()
    $(".text-len").remove()
    return w
}