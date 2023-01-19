console.debug("[+] BetterLinkedInJobs loaded...")

let removePromotedActive = false;
let showRatings = false;

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

function getBrowserInstance() {
    if (typeof chrome !== "undefined") {
        if (typeof browser !== "undefined") {
            return browser;
        } else {
            return chrome;
        }
    } else {
        return chrome;
    }
}

function removePromoted() {
    if (removePromotedActive === false) return;

    new Array(...document.getElementsByClassName("jobs-search-results__list-item")).forEach((e) => {
        if (e.nodeName === 'LI') {
            if (e.innerText.includes("Promoted")) {
                e.remove();
            }
        }
    });
};

function evaluateXPath(aNode, aExpr) {
    const xpe = new XPathEvaluator();
    const nsResolver = xpe.createNSResolver(aNode.ownerDocument === null ? aNode.documentElement : aNode.ownerDocument.documentElement);
    const result = xpe.evaluate(aExpr, aNode, nsResolver, 0, null);
    const found = [];
    let res;
    while (res = result.iterateNext())
        found.push(res);
    return found;
}

function prepareSearchTermForIndeed(name) {
    const replaceList = [
        'DACH',
        'GmbH',
        'Deutschland',
        'Germany',
        'AG',
        'EMEA'
    ];
    const words = name.split(' ');
    const lastWord = words[words.length - 1];

    for (let i = 0; i < replaceList.length; i++) {
        if (lastWord === replaceList[i]) {
            words.pop();
            break;
        }
    }
    return words.join(' ');
}

const getRatings = () => {
    if (showRatings === false) return;

    new Array(...document.getElementsByClassName("jobs-search-results__list-item")).forEach((e) => {
        if (e.nodeName === 'LI' && !e.classList.contains("already-rated")) {
            const company = Array.prototype.filter.call(
                e.getElementsByClassName("job-card-container__link job-card-container__company-name"),
                (element) => element.nodeName === 'A',
            )[0];

            if (company === undefined) return;

            const ratingRow = document.createElement("div");
            ratingRow.classList.add("rating-row");

            getBrowserInstance().runtime.sendMessage(
                {
                    url: `https://www.indeed.com/companies/search?q=${prepareSearchTermForIndeed(company.innerText)}`,
                    json: false
                },
                r => {
                    const el = document.createElement('html');
                    el.innerHTML = r;
                    let results = evaluateXPath(el, "//section/div/div[1]/div[1]/div[2]/a");
                    if (results.length > 0) {
                        const userRating = results[0].childNodes[0].childNodes[0].innerText;
                        const ratingsCount = results[0].childNodes[0].childNodes[3].innerText;
                        ratingRow.innerHTML += `
                        <a class="rating-col" href="${"https://www.indeed.com" + results[0].getAttribute('href')}" target="_blank">
                            <span style="text-decoration: underline;">Indeed</span>
                            <span class="stars" data-fillcolor="butterscotch" data-score="${userRating.split('.')[0]}"></span>
                            <span>Score: ${userRating}</span>
                            <span>${ratingsCount}</span>
                        </a>
                        `;
                    }
                });

            const getRating = (slug) => new Promise(resolve => {
                getBrowserInstance().runtime.sendMessage({ url: `https://www.kununu.com/${slug}`, json: false },
                    (body) => {
                        const parser = new DOMParser();
                        const dom = parser.parseFromString(body, "text/html");
                        const ratingsCard = dom.getElementById("card-profile-metrics");
                        const userRating = ratingsCard.childNodes[0].childNodes[0].childNodes[0].childNodes[0].innerText.replace(',', '.');
                        const ratingsCount = ratingsCard.childNodes[0].childNodes[0].childNodes[2].innerText;
                        const recommendationScore = ratingsCard.childNodes[0].childNodes[2].childNodes[0].childNodes[0].innerText;
                        const progress = ratingsCard.childNodes[0].childNodes[2].childNodes[0].childNodes[1];
                        resolve(`
                        <a class="rating-col" href="${"https://www.kununu.com/" + slug}" target="_blank">
                            <span style="text-decoration: underline;">Kununu</span>
                            <span class="stars" data-fillcolor="butterscotch" data-score="${userRating.split('.')[0]}"></span>
                            <span>Score: ${userRating}</span>
                            <span>${ratingsCount}</span>
                            <span>Recommendation: ${recommendationScore}</span>
                            ${progress.outerHTML}
                        </a>
                        `);
                    });
            });

            getBrowserInstance().runtime.sendMessage(
                {
                    url: `https://www.kununu.com/middlewares/kununu-search/profiles/autocomplete?q=${company.innerText}&reorderByCountry=de`,
                    json: true
                },
                async ({ data }) => {
                    if (data.profiles.length > 0) {
                        const ratingElement = await getRating(data.profiles[0].slug);
                        ratingRow.innerHTML += ratingElement;
                    } else {
                        const nameList = company.innerText.split(' ');
                        nameList.pop();
                        if (nameList.length > 0) {
                            getBrowserInstance().runtime.sendMessage(
                                {
                                    url: `https://www.kununu.com/middlewares/kununu-search/profiles/autocomplete?q=${nameList.join(' ')}&reorderByCountry=de`,
                                    json: true
                                },
                                async ({ data }) => {
                                    if (data.profiles.length > 0) {
                                        const ratingElement = await getRating(data.profiles[0].slug);
                                        ratingRow.innerHTML += ratingElement;
                                    }
                                });
                        }
                    }
                });

            e.getElementsByClassName("job-card-container")[0].appendChild(ratingRow);
            e.classList.add("already-rated");
        }
    });
};

async function loadSettings() {
    switch (getBrowserName()) {
        case "Firefox":
            const storedSettings = await browser.storage.local.get();
            removePromotedActive = storedSettings.removePromoted;
            showRatings = storedSettings.showRatings;
            break;
        case "Chrome":
            chrome.storage.local.get(["removePromoted", "showRatings"], (storedSettings) => {
                removePromotedActive = storedSettings.removePromoted;
                showRatings = storedSettings.showRatings;
            });
            break;
    }
};

switch (getBrowserName()) {
    case "Firefox":
        browser.storage.local.onChanged.addListener(loadSettings);
        break;
    case "Chrome":
        chrome.storage.local.onChanged.addListener(loadSettings);
        break;
}

loadSettings();
removePromoted();
getRatings();
window.setInterval(() => {
    removePromoted();
    getRatings();
}, 3000);
