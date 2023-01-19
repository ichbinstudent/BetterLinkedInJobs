chrome.runtime.onMessage.addListener(
    function({url, json}, sender, onSuccess) {
        fetch(url)
            .then(response => json ? response.json() : response.text())
            .then(responseText => onSuccess(responseText))
        
        return true;
    }
);
