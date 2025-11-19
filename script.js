const MAX_PAGES = 50; // safety limit so it doesn’t crawl forever

document.getElementById("ripButton").addEventListener("click", () => {
    const url = document.getElementById("urlInput").value;
    if (!url) return alert("Please enter a URL");

    startCrawler(url);
});

async function startCrawler(startUrl) {
    document.getElementById("results").innerHTML = "Crawling pages…";
    const visited = new Set();
    const toVisit = [startUrl];
    const allImages = [];

    const baseDomain = new URL(startUrl).hostname;
    let pagesCrawled = 0;

    while (toVisit.length > 0 && pagesCrawled < MAX_PAGES) {
        const url = toVisit.shift();

        if (visited.has(url)) continue;
        visited.add(url);
        pagesCrawled++;

        const html = await fetchPage(url);
        if (!html) continue;

        const doc = new DOMParser().parseFromString(html, "text/html");

        // Extract images on this page
        const imgs = extractImages(doc, url);
        allImages.push(...imgs);

        // Discover new links to crawl
        const newLinks = extractLinks(doc, url, baseDomain);

        for (let link of newLinks) {
            if (!visited.has(link) && !toVisit.includes(link)) {
                toVisit.push(link);
            }
        }

        document.getElementById("results").innerHTML =
            `Crawled ${pagesCrawled} pages… Found ${allImages.length} images so far.`;
    }

    // Display all images
    displayImages(allImages);

    // Enable ZIP download
    setupZipDownload(allImages);

    document.getElementById("downloadZip").style.display = "block";
}

async function fetchPage(url) {
    try {
        const proxy = "https://api.allorigins.win/raw?url=" + encodeURIComponent(url);
        const response = await fetch(proxy);
        return await response.text();
    } catch (e) {
        console.log("Failed to load:", url);
        return null;
    }
}

function extractImages(doc, pageUrl) {
    const imageUrls = [];

    // XenForo user-posted images ONLY
    const tags = doc.querySelectorAll(".bbWrapper img");

    tags.forEach(img => {
        let src = img.getAttribute("src");
        if (!src) return;

        // Fix relative URLs
        if (!src.startsWith("http")) {
            try {
                src = new URL(src, pageUrl).href;
            } catch {
                return;
            }
        }

        imageUrls.push(src);
    });

    return imageUrls;
}


function extractLinks(doc, pageUrl, baseDomain) {
    const links = [];
    const anchors = doc.querySelectorAll("a");

    anchors.forEach(a => {
        let href = a.getAttribute("href");
        if (!href) return;

        // Fix relative URLs
        try {
            href = new URL(href, pageUrl).href;
        } catch {
            return;
        }

        // Only follow links on the same domain
        if (new URL(href).hostname !== baseDomain) return;

        // Prefer pages inside same directory
        if (!href.startsWith(pageUrl.split("/").slice(0, 3).join("/"))) return;

        links.push(href);
    });

    return links;
}

function displayImages(images) {
    const results = document.getElementById("results");
    results.innerHTML = "";

    const uniqueImages = [...new Set(images)];

    uniqueImages.forEach(url => {
        const img = document.createElement("img");
        img.src = url;
        results.appendChild(img);
    });
}

function setupZipDownload(images) {
    const uniqueImages = [...new Set(images)];

    document.getElementById("downloadZip").onclick = async () => {
        const zip = new JSZip();

        for (let i = 0; i < uniqueImages.length; i++) {
            try {
                const res = await fetch(uniqueImages[i]);
                const blob = await res.blob();
                zip.file(`image_${i}.jpg`, blob);
            } catch (e) {
                console.log("Failed:", uniqueImages[i]);
            }
        }

        const zipFile = await zip.generateAsync({ type: "blob" });

        const a = document.createElement("a");
        a.href = URL.createObjectURL(zipFile);
        a.download = "all_images.zip";
        a.click();
    };
}
