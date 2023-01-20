const ext_api = (typeof browser === 'object') ? browser : chrome;

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
            ext_api.storage.local.get()
                .then((storedSettings) => {
                    ratingsCheckbox.checked = storedSettings.showRatings;
                    removePromotedCheckbox.checked = storedSettings.removePromoted;
                });

            document.addEventListener("change", () => {
                ext_api.storage.local.set({ showRatings: ratingsCheckbox.checked, removePromoted: removePromotedCheckbox.checked });
            });
            break;
        case "Chrome":
            ext_api.storage.local.get(["showRatings", "removePromoted"], (storedSettings) => {
                ratingsCheckbox.checked = storedSettings.showRatings;
                removePromotedCheckbox.checked = storedSettings.removePromoted;
            });

            document.addEventListener("change", () => {
                ext_api.storage.local.set({ showRatings: ratingsCheckbox.checked, removePromoted: removePromotedCheckbox.checked });
            });
            break;
    }

    ext_api.permissions.contains({
        origins: [
            "*://www.kununu.com/*",
            "*://indeed.com/*",
            "*://www.indeed.com/*",
        ]
    }, function (result) {
        if (!result) {
            console.debug("Permissions not granted");
            document.querySelector('#enable-permissions-row').classList.add("visible");
        }
    });

    document.querySelector('#enable-permissions-button').addEventListener('click', function () {
        ext_api.permissions.request(
            {
                origins: [
                    "*://www.kununu.com/*",
                    "*://indeed.com/*",
                    "*://www.indeed.com/*",
                ]
            }
        );
    });
});
