const ext_api = (typeof browser === 'object') ? browser : chrome;

ext_api.runtime.onMessage.addListener(
    function ({ url, json }, _, onSuccess) {
        fetch(url)
            .then(response => json ? response.json() : response.text())
            .then(responseText => onSuccess(responseText))

        return true;
    }
);
