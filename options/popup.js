document.addEventListener("DOMContentLoaded", function () {
    const ratingsCheckbox = document.getElementById("RatingsCheckbox");
    const removePromotedCheckbox = document.getElementById("RemovePromotedCheckbox");

    function getBrowserName() {
        if (typeof chrome !== "undefined") {
            if (typeof browser !== "undefined") {
                return "Firefox";
            } else {
                return "Chrome";
            }
        } else {
            return "Edge";
        }
    }

    switch (getBrowserName()) {
        case "Firefox":
            browser.storage.local.get()
                .then((storedSettings) => {
                    ratingsCheckbox.checked = storedSettings.showRatings;
                    removePromotedCheckbox.checked = storedSettings.removePromoted;
                });

            document.addEventListener("change", () => {
                browser.storage.local.set({ showRatings: ratingsCheckbox.checked, removePromoted: removePromotedCheckbox.checked });
            });
            break;
        case "Chrome":
            chrome.storage.local.get(["showRatings", "removePromoted"], (storedSettings) => {
                ratingsCheckbox.checked = storedSettings.showRatings;
                removePromotedCheckbox.checked = storedSettings.removePromoted;
            });

            document.addEventListener("change", () => {
                chrome.storage.local.set({ showRatings: ratingsCheckbox.checked, removePromoted: removePromotedCheckbox.checked });
            });
            break;
    }
});
