    const KANNADA_WORD_REGEX = /^[\u0C80-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2]+$/;

    var DEFAULT_LANGUAGE = 'en',
        DEFAULT_TRIGGER_KEY = 'none',

        LANGUAGE,
        TRIGGER_KEY;

    function getTargetDictionaryDiv(event) {
        var element = event.target;
        if(element.classList.contains("dictionaryDiv")) {
            return element;
        } else {
            return null;
        }
    }

    function showMeaning (event) {
        var createdDiv,
            info = getSelectionInfo(event);

        if (!info) { return; }
        if (!isKannadaWord(info.word)) { return; }

        retrieveMeaning(info)
            .then((response) => {
                if (!response.content) { return noMeaningFound(createdDiv, info.word); }

                appendToDiv(createdDiv, response.content);
            });

        // Creating this div while we are fetching meaning to make extension more fast.
        createdDiv = createDiv(info);
    }


    function getSelectionInfo(event) {
        var word;
        var boundingRect;
        var zIndex;

        if (window.getSelection().toString().length > 1) {
            word = window.getSelection().toString();
            boundingRect = getSelectionCoords(window.getSelection());
        } else {
            return null;
        }

        var top = boundingRect.top + window.scrollY,
            bottom = boundingRect.bottom + window.scrollY,
            left = boundingRect.left + window.scrollX;

        if (boundingRect.height == 0) {
            top = event.pageY;
            bottom = event.pageY;
            left = event.pageX;
        }

        var dictDiv = getTargetDictionaryDiv(event);
        if (dictDiv) {
            zIndex = getStyle(dictDiv, "z-index");
            zIndex = parseInt(zIndex) + 1;
        } else {
            zIndex = 1000000; // default value for first dictionary popup
        }

        return {
            top: top,
            bottom: bottom,
            left: left,
            word: word,
            clientY: event.clientY,
            height: boundingRect.height,
            zIndex: zIndex.toString(),
        };
    }

    function getStyle(el, styleProp) {
        var value;

        if (window.getComputedStyle) {
            value = document.defaultView.getComputedStyle(el, null).getPropertyValue(styleProp);
        } else if (el.currentStyle) {
            value = el.currentStyle[styleProp];
        }

        return value;
    }

    function isKannadaWord(word) {
        // see: https://github.com/mathiasbynens/unicode-data/blob/master/10.0.0/scripts/Kannada-regex.js
        return KANNADA_WORD_REGEX.test(word);
    }

    function retrieveMeaning(info){
        return browser.runtime.sendMessage({ word: info.word, lang: LANGUAGE, time: Date.now() });
    }

    function createDiv(info) {
        var hostDiv = document.createElement("div");

        hostDiv.className = "dictionaryDiv";
        hostDiv.style.left = info.left -10 + "px";
        hostDiv.style.position = "absolute";
        hostDiv.style.zIndex = info.zIndex;
        hostDiv.attachShadow({mode: 'open'});

        var shadow = hostDiv.shadowRoot;
        var style = document.createElement("style");
        //style.textContent = "*{ all: initial}";
        style.textContent = ".mwe-popups{background:#fff;position:absolute;z-index:110;-webkit-box-shadow:0 30px 90px -20px rgba(0,0,0,0.3),0 0 1px #a2a9b1;box-shadow:0 30px 90px -20px rgba(0,0,0,0.3),0 0 1px #a2a9b1;padding:0;font-size:14px;min-width:300px;border-radius:2px}.mwe-popups.mwe-popups-is-not-tall{width:500px}.mwe-popups .mwe-popups-container{color:#222;margin-top:-9px;padding-top:9px;text-decoration:none}.mwe-popups.mwe-popups-is-not-tall .mwe-popups-extract{min-height:40px;max-height:140px;overflow:hidden;margin-bottom:47px;padding-bottom:0}.mwe-popups .mwe-popups-extract{margin:16px;display:block;color:#222;text-decoration:none;position:relative} .mwe-popups.flipped_y:before{content:'';position:absolute;border:8px solid transparent;border-bottom:0;border-top: 8px solid #a2a9b1;bottom:-8px;left:10px}.mwe-popups.flipped_y:after{content:'';position:absolute;border:11px solid transparent;border-bottom:0;border-top:11px solid #fff;bottom:-7px;left:7px} .mwe-popups.mwe-popups-no-image-tri:before{content:'';position:absolute;border:8px solid transparent;border-top:0;border-bottom: 8px solid #a2a9b1;top:-8px;left:10px}.mwe-popups.mwe-popups-no-image-tri:after{content:'';position:absolute;border:11px solid transparent;border-top:0;border-bottom:11px solid #fff;top:-7px;left:7px} .audio{background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAcUlEQVQ4y2P4//8/AyUYQhAH3gNxA7IAIQPmo/H3g/QA8XkgFiBkwHyoYnRQABVfj88AmGZcTuuHyjlgMwBZM7IE3NlQGhQe65EN+I8Dw8MLGgYoFpFqADK/YUAMwOsFigORatFIlYRElaRMWmaiBAMAp0n+3U0kqkAAAAAASUVORK5CYII=);background-position: center;background-repeat: no-repeat;cursor:pointer;margin-left: 8px;opacity: 0.5; width: 16px; display: inline-block;} .audio:hover {opacity: 1;}";
        shadow.appendChild(style);

        var encapsulateDiv = document.createElement("div");
        encapsulateDiv.style = "all: initial; text-shadow: transparent 0px 0px 0px, rgba(0,0,0,1) 0px 0px 0px !important;";
        shadow.appendChild(encapsulateDiv);


        var popupDiv = document.createElement("div");
        popupDiv.style = "font-family: arial,sans-serif; border-radius: 12px; border: 1px solid #a2a9b1; box-shadow: 0 0 17px rgba(0,0,0,0.5)";
        encapsulateDiv.appendChild(popupDiv);


        var contentContainer = document.createElement("div");
        contentContainer.className = "mwe-popups-container";
        popupDiv.appendChild(contentContainer);



        var content = document.createElement("div");
        content.className = "mwe-popups-extract";
        content.style = "line-height: 1.4; margin-top: 0px; margin-bottom: 11px; max-height: none";
        contentContainer.appendChild(content);


        var heading = document.createElement("h3");
        // heading.style = "margin-block-end: 0px; display:inline-block;";
        heading.textContent = "Searching";

        var meaning = document.createElement("div");
        meaning.className = "meaning";
        // meaning.innerHTML = "&nbsp;";
        meaning.style = "display: none; margin-block-end: 5px";

        content.appendChild(heading);
        content.appendChild(meaning);
        document.body.appendChild(hostDiv);

        if(info.clientY < window.innerHeight/2){
            popupDiv.className = "mwe-popups mwe-popups-no-image-tri mwe-popups-is-not-tall";
            hostDiv.style.top = info.bottom + 10 + "px";
            if(info.height == 0){
                hostDiv.style.top = parseInt(hostDiv.style.top) + 8 + "px";
            }
        } else {
            popupDiv.className = "mwe-popups flipped_y mwe-popups-is-not-tall";
            hostDiv.style.top = info.top - 10 - popupDiv.clientHeight + "px";

            if(info.height == 0){
                hostDiv.style.top = parseInt(hostDiv.style.top) - 8 + "px";
            }
        }

        return {
            heading,
            meaning
        };

    }

    function getSelectionCoords(selection) {
        var oRange = selection.getRangeAt(0); //get the text range
        var oRect = oRange.getBoundingClientRect();
        return oRect;
    }

    function addMeaningEntry(meaningSectionDiv, meaning) {
      var word_type = document.createElement("span");
      word_type.style = "font-style: italic; border-bottom: 1px dashed #888;";
      word_type.textContent = meaning.type;
      meaningSectionDiv.appendChild(word_type);

      var ol = document.createElement("ol");
      meaning.defs.forEach((def) => {
        var li = document.createElement("li");
        // p.style = "margin-top: 10px";
        li.textContent = def;
        ol.appendChild(li);
      });

      meaningSectionDiv.appendChild(ol);
    }

    function appendToDiv(createdDiv, content){
        var hostDiv = createdDiv.heading.getRootNode().host;
        var popupDiv = createdDiv.heading.getRootNode().querySelectorAll("div")[1];
        var heightBefore = popupDiv.clientHeight;

        var alarLink = document.createElement("a");
        alarLink.target = "_blank";
        alarLink.textContent = content.word;
        alarLink.href = `https://alar.ink/dictionary/kannada/english/${encodeURIComponent(content.word)}`;

        createdDiv.heading.style = "margin-block-end: 5px;";
        createdDiv.heading.textContent = "";
        createdDiv.heading.appendChild(alarLink);

        createdDiv.meaning.style.display = "inline-block";
        content.meaning.forEach((e) => {
          addMeaningEntry(createdDiv.meaning, e);
        });

        // createdDiv.moreInfo.textContent = "More »";

        var heightAfter = popupDiv.clientHeight;
        var difference = heightAfter - heightBefore;

        if(popupDiv.classList.contains("flipped_y")){
            hostDiv.style.top = parseInt(hostDiv.style.top) - difference + 1 + "px";
        }
    }

    function noMeaningFound(createdDiv, word){
        var alarLink = document.createElement("a");
        alarLink.target = "_blank";
        alarLink.textContent = word;
        alarLink.href = `https://alar.ink/dictionary/kannada/english/${word}`;

        createdDiv.heading.style = "margin-block-end: 5px;";
        createdDiv.heading.textContent = "";
        createdDiv.heading.appendChild(alarLink);

        createdDiv.meaning.style.display = "inline-block";
        createdDiv.meaning.textContent = "ಆಯ್ಕೆ ಮಾಡಿದ ಪದಕ್ಕೆ ವಿವರಣೆ ದೊರಕುತ್ತಿಲ್ಲ";
    }

    function removeMeaning(event) {
        var currentZIndex;
        var dictDiv;
        var elementZIndex;

        dictDiv = getTargetDictionaryDiv(event);

        if (dictDiv) {
            currentZIndex = parseInt(getStyle(dictDiv, "z-index"));
        } else {
            currentZIndex = -1;
        }

        document.querySelectorAll(".dictionaryDiv").forEach( (div) => {
            elementZIndex = parseInt(getStyle(div, "z-index"));
            if (elementZIndex > currentZIndex) {
                div.remove();
            }
        });
    }

    document.addEventListener('dblclick', ((e) => {
        if (TRIGGER_KEY === 'none') {
            return showMeaning(e);
        }

        //e has property altKey, shiftKey, cmdKey representing they key being pressed while double clicking.
        if(e[`${TRIGGER_KEY}Key`]) {
            return showMeaning(e);
        }

        return;
    }));

    document.addEventListener('click', removeMeaning);

    (function () {
        let storageItem = browser.storage.local.get();

        storageItem.then((results) => {
            let interaction = results.interaction || { dblClick: { key: DEFAULT_TRIGGER_KEY }};

            LANGUAGE = results.language || DEFAULT_LANGUAGE;
            TRIGGER_KEY = interaction.dblClick.key;
        });
    })();
