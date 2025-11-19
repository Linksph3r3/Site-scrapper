// Switch modes
document.getElementById("mode-url").onclick = () => {
  document.getElementById("url-section").classList.remove("hidden");
  document.getElementById("html-section").classList.add("hidden");
};

document.getElementById("mode-html").onclick = () => {
  document.getElementById("url-section").classList.add("hidden");
  document.getElementById("html-section").classList.remove("hidden");
};

// ---------- URL MODE (with CORS bypass) ----------
document.getElementById("ripUrl").onclick = async () => {
  const url = document.getElementById("pageUrl").value.trim();
  if (!url) return alert("Enter a URL");

  const proxy = "https://api.allorigins.win/raw?url=";

  try {
    const html = await fetch(proxy + encodeURIComponent(url)).then(r => r.text());
    processHTML(html);
  } catch (err) {
    alert("Failed to fetch page. The site may require login.");
    console.error(err);
  }
};

// ---------- PASTE HTML MODE ----------
document.getElementById("ripHtml").onclick = () => {
  const html = document.getElementById("htmlInput").value.trim();
  if (!html) return alert("Paste HTML first");
  processHTML(html);
};

// ---------- SHARED PROCESSOR ----------
function processHTML(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  // Select ONLY user-posted images in .message-body
  let images = [...doc.querySelectorAll(".message-body img.bbImage")];

  // Filter out ads or junk images
  images = images.filter(img => {
    const src = img.getAttribute("src") || "";
    if (src.includes("ads") || src.includes("banner") || src.includes("tracker")) return false;
    if (img.closest("iframe")) return false;
    return true;
  });

  displayImages(images);
}

// ---------- DISPLAY ----------
function displayImages(images) {
  const results = document.getElementById("results");
  results.innerHTML = "";

  if (images.length === 0) {
    results.innerHTML = "<p>No user images found.</p>";
    return;
  }

  images.forEach(img => {
    const el = document.createElement("img");
    el.src = img.src;
    results.appendChild(el);
  });
}

