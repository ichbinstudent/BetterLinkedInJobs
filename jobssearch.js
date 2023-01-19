console.debug("[+] BetterLinkedInJobs loaded...")

let removeSponsored = false;
let showRatings = false;

const removePromoted = () => {
    if (removeSponsored === false) return;

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
        'AG',
        'EMEA'
    ];
    replaceList.forEach(r => name = name.replace(r, ''));
    console.log(name);
    return name;
}

const getRatings = () => {
    if (showRatings === false) return;

    new Array(...document.getElementsByClassName("jobs-search-results__list-item")).forEach((e) => {
        if (e.nodeName === 'LI' && !e.classList.contains("already-rated")) {
            const company = Array.prototype.filter.call(
                e.getElementsByClassName("job-card-container__link job-card-container__company-name"),
                (element) => element.nodeName === 'A',
            )[0];

            const ratingRow = document.createElement("div");
            ratingRow.classList.add("rating-row");

            fetch(`https://www.indeed.com/companies/search?q=${prepareSearchTermForIndeed(company.innerText)}`)
                .then(response => response.text())
                .then(r => {
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
                })
                .catch(reason => {
                    console.log(reason);
                });

            const getRating = (slug) => new Promise(resolve => {
                fetch(`https://www.kununu.com/${slug}`)
                    .then(response => response.text())
                    .then((body) => {
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

            fetch(`https://www.kununu.com/middlewares/kununu-search/profiles/autocomplete?q=${company.innerText}&reorderByCountry=de`)
                .then(response => response.json())
                .then(async ({ data }) => {
                    if (data.profiles.length > 0) {
                        const ratingElement = await getRating(data.profiles[0].slug);
                        ratingRow.innerHTML += ratingElement;
                    } else {
                        const nameList = company.innerText.split(' ');
                        nameList.pop();
                        if (nameList.length > 0) {
                            fetch(`https://www.kununu.com/middlewares/kununu-search/profiles/autocomplete?q=${nameList.join(' ')}&reorderByCountry=de`)
                                .then(response => response.json())
                                .then(async ({ data }) => {
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
    const storedSettings = await browser.storage.local.get();
    removeSponsored = storedSettings.removeSponsored;
    showRatings = storedSettings.showRatings;
};

browser.storage.local.onChanged.addListener(loadSettings)
loadSettings();
removePromoted();
getRatings();
window.setInterval(() => {
    removePromoted();
    getRatings();
}, 3000);
