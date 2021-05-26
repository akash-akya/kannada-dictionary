const DEFAULT_HISTORY_SETTING = {enabled: true},
      INDEX_URL = browser.runtime.getURL("dict/index.json"),
      REFERENCE_REGEXP = /^= ([^0-9]+)([0-9]*)\.$/;

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const { word, lang } = request;
    getMeaning(word).then(content => sendResponse({ content }));
    return true;
});

    async function getMeaning(word) {
        var text = await fetch(INDEX_URL, {method: 'GET'}).then(response => response.text());

        // we split dictionary to into separate managable files, each
        // containing "chunk" of words.  dictionary chunk files are
        // named as `chunk_{index}.json` "index.json" contains index
        // for these files
        const wordsIndex = JSON.parse(text).index;
        const index = wordsIndex.findIndex(chunk => word <= chunk.end);

        if (index < 0) { return null; }

        const chunkURL = browser.runtime.getURL(`dict/chunk_${index}.json`);
        text = await fetch(chunkURL, {method: 'GET'}).then(response => response.text());
        const dict = JSON.parse(text);

        // TODO: removing suffix to get root word
        var meaning = dict[word];

        if (meaning == null) { return null; }

        // a definition is a reference to another word, if definition is of
        // the form `= another_word.` or `= another_word(index).`
        // index is used to disambiguate. (check REFERENCE_REGEXP).
        //
        // NOTE: we are assuming that generally there wont be nested references to other words
        for (var i = 0; i < meaning.length; i++ ) {
            // skip if word exists but there are no definition, ex: ನಲ್ಲಿ
            if (meaning[i].defs.length == 0) { continue; }

            // if the definition is a reference, then there *should* be only one entry under `defs`
            const def = meaning[i].defs[0];

            // matching with regexp for every definition *might* be expensive (?)
            if (def.startsWith("= ")) {
                const [ _, ref, refIndex ] = def.match(REFERENCE_REGEXP);

                // TODO: check existing `dict` first
                const content = await getMeaning(ref);
                if (content) {
                    if (refIndex) {
                        meaning[i] = content.meaning[refIndex - 1];
                    } else {
                        meaning[i] = content.meaning[0];
                    }
                } else {
                    console.error(`reference "${ref}" for the word "${word}" does not exists`);
                }
            }
        }

        return { meaning: meaning, word: word };
    }
