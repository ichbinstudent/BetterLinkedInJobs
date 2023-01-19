document.addEventListener("DOMContentLoaded", function () {
    const ratingsCheckbox = document.getElementById("RatingsCheckbox");
    const removeSponsoredCheckbox = document.getElementById("RemoveSponsoredCheckbox");

    browser.storage.local.get()
        .then((storedSettings) => {
            ratingsCheckbox.checked = storedSettings.showRatings;
            removeSponsoredCheckbox.checked = storedSettings.removeSponsored;
        });

    document.addEventListener("change", () => {
        browser.storage.local.set({ showRatings: ratingsCheckbox.checked, removeSponsored: removeSponsoredCheckbox.checked });
    });
});
