document.addEventListener("DOMContentLoaded", function () {
    const ratingsCheckbox = document.getElementById("RatingsCheckbox");
    const removePromotedCheckbox = document.getElementById("RemovePromotedCheckbox");

    browser.storage.local.get()
        .then((storedSettings) => {
            ratingsCheckbox.checked = storedSettings.showRatings;
            removePromotedCheckbox.checked = storedSettings.removePromoted;
        });

    document.addEventListener("change", () => {
        browser.storage.local.set({ showRatings: ratingsCheckbox.checked, removePromoted: removePromotedCheckbox.checked });
    });
});
