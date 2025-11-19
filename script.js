document.getElementById("ripButton").addEventListener("click", () => {
    const url = document.getElementById("urlInput").value;
    if (!url) return alert("Please enter a URL");

    fetchImages(url);
});

async function fetchImages(url) {
    document.getElementById("results").innerHTML = "Loading...";

    try {
        const proxy = "https://api.allorigins.win/raw?url=" + encodeURIComponent(url);

        const response = await fetch(proxy);
        const html = await response.text();

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        const imgTags = doc.querySelectorAll("img");
        const resultsDiv = document.getElementById("results");
        resultsDiv.innerHTML = "";

        let imageUrls = [];

        imgTags.forEach((img, i) => {
            let src = img.getAttribute("src");

            if (!src) return;

            // Fix relative links
            if (!src.startsWith("http")) {
                try {
                    src = new URL(src, url).href;
                } catch {
                    return;
                }
            }

            imageUrls.push(src);

            const imageElement = document.createElement("img");
            imageElement.src = src;

            resultsDiv.appendChild(imageElement);
        });

        if (imageUrls.length === 0) {
            resultsDiv.innerHTML = "No images found.";
            return;
        }

        document.getElementById("downloadZip").style.display = "block";
        setupZipDownload(imageUrls);

    } catch (err) {
        document.getElementById("results").innerHTML = "Error loading page.";
        console.error(err);
    }
}

function setupZipDownload(imageUrls) {
    document.getElementById("downloadZip").onclick = async () => {
        const zip = new JSZip();

        for (let i = 0; i < imageUrls.length; i++) {
            try {
                const res = await fetch(imageUrls[i]);
                const blob = await res.blob();
                zip.file(`image_${i}.jpg`, blob);
            } catch (e) {
                console.log("Failed to download:", imageUrls[i]);
            }
        }

        const zipFile = await zip.generateAsync({ type: "blob" });

        const a = document.createElement("a");
        a.href = URL.createObjectURL(zipFile);
        a.download = "images.zip";
        a.click();
    };
}
