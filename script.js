// -------------------------
// MODE SWITCHING
// -------------------------
document.getElementById("mode-url").onclick = () => {
  document.getElementById("url-section").classList.remove("hidden");
  document.getElementById("html-section").classList.add("hidden");
};

document.getElementById("mode-html").onclick = () => {
  document.getElementById("url-section").classList.add("hidden");
  document.getElementById("html-section").classList.remove("hidden");
};

// Storage for ripped image URLs
let rippedImages = [];

// -------------------------
// URL MODE
// -------------------------
document.getElementById("ripUrl").onclick = async () => {
  const url = document.getElementById("pageUrl").value.trim();
  if (!url) return alert("Enter a URL");

  try {
    const html = await fetch(url).then(r => r.text());
    processHTML(html);
  } catch (e) {
    alert("Failed to fetch page. This site may block cross-origin requests.");
  }
};

// -------------------------
// HTML MODE
// -------------------------
document.getElementById("ripHtml").onclick = () => {
  const html = document.getElementById("htmlInput").value.trim();
  if (!html) return alert("Paste HTML first");
  processHTML(html);
};

// -------------------------
// PROCESS HTML
// -------------------------
function processHTML(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  let images = [...doc.querySelectorAll(".message-body img.bbImage, .bbWrapper img")];

  images = images.filter(img => {
    const src = img.getAttribute("src") || "";
    if (!src) return false;
    if (src.includes("ads") || src.includes("banner") || src.includes("avatar")) return false;
    return true;
  });

  rippedImages = images.map(img => img.src);

  displayImages();
  showZipButton();
}

// -------------------------
// DISPLAY IMAGES
// -------------------------
function displayImages() {
  const results = document.getElementById("results");
  results.innerHTML = "";

  if (rippedImages.length === 0) {
    results.innerHTML = "<p>No user images found.</p>";
    return;
  }

  rippedImages.forEach(src => {
    const el = document.createElement("img");
    el.src = src;
    el.loading = "lazy";
    results.appendChild(el);
  });
}

// -------------------------
// ZIP CREATION (JSZip)
// -------------------------
async function downloadZip() {
  if (rippedImages.length === 0) return alert("Nothing to download");

  const zip = new JSZip();
  const folder = zip.folder("images");

  for (let i = 0; i < rippedImages.length; i++) {
    const url = rippedImages[i];
    const fileName = `image_${String(i+1).padStart(4,"0")}.jpg`;

    try {
      const blob = await fetch(url).then(r => r.blob());
      folder.file(fileName, blob);
    } catch (e) {
      console.log("Failed:", url);
    }
  }

  // Generate ZIP as blob
  const zipBlob = await zip.generateAsync({ type: "blob" });

  // ---- iOS SAFARI COMPATIBLE DOWNLOAD ----
  const reader = new FileReader();
  reader.onloadend = () => {
    const base64data = reader.result;

    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = base64data;
    document.body.appendChild(iframe);

    setTimeout(() => iframe.remove(), 2000);
  };

  reader.readAsDataURL(zipBlob); // triggers download automatically on iOS
}


// -------------------------
// SHOW ZIP BUTTON
// -------------------------
function showZipButton() {
  if (!document.getElementById("downloadZip")) {
    const btn = document.createElement("button");
    btn.id = "downloadZip";
    btn.textContent = "Download ZIP";
    btn.onclick = downloadZip;
    document.body.appendChild(btn);
  }
}
