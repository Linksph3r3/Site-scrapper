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

// -------------------------
// STORAGE
// -------------------------
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
    alert("Failed to fetch page.\nThis site may block cross-origin requests.");
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

  // Extract ALL images
  let images = [...doc.querySelectorAll("img")];

  // Optional filtering
  images = images.filter(img => {
    const src = img.getAttribute("src") || "";
    if (!src) return false;

    // avoid junk images
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
    results.innerHTML = "<p>No images found.</p>";
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
// ZIP CREATION
// -------------------------
async function downloadZip() {
  if (rippedImages.length === 0) return alert("Nothing to download");

  const zip = new JSZip();
  const folder = zip.folder("images");

  for (let i = 0; i < rippedImages.length; i++) {
    const url = rippedImages[i];
    const fileName = `image_${String(i + 1).padStart(4, "0")}.jpg`;

    try {
      const blob = await fetch(url).then(r => r.blob());
      folder.file(fileName, blob);
    } catch (e) {
      console.log("Failed to fetch:", url);
    }
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });

  // iOS-friendly DataURL fallback
  const reader = new FileReader();
  reader.onloadend = () => {
    const base64data = reader.result;

    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = base64data;
    document.body.appendChild(iframe);

    setTimeout(() => iframe.remove(), 2000);
  };

  reader.readAsDataURL(
    new File([zipBlob], "images.zip", { type: "application/zip" })
  );
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
