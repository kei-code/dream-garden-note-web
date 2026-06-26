const siteConfig = window.DGN_SITE || {
  defaultStoryId: "010",
  featuredStoryId: "010",
};
const stories = Array.isArray(window.DGN_STORIES) ? window.DGN_STORIES : [];
const views = Array.from(document.querySelectorAll("[data-view]"));
const navLinks = Array.from(document.querySelectorAll("[data-nav-link]"));
const validViews = new Set(views.map((view) => view.dataset.view));
const homeVisual = document.querySelector("[data-home-visual]");
const homeTitle = document.querySelector("[data-home-title]");
const homeCopy = document.querySelector("[data-home-copy]");
const storyGrid = document.querySelector("[data-story-grid]");
const readerTitle = document.querySelector("[data-reader-title]");
const readerDescription = document.querySelector("[data-reader-description]");
const bookRoot = document.getElementById("book-root");
const turnSheet = document.getElementById("fallback-turn");
const prevButton = document.getElementById("prev-page");
const nextButton = document.getElementById("next-page");
const pageLabel = document.getElementById("page-label");
const pageProgress = document.getElementById("page-progress");
const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const originalImageRatio = 896 / 1280;

let pageFlip = null;
let customIndex = 0;
let mode = getMode();
let isAnimating = false;
let lastSwipeAt = 0;
let activeView = "home";
let activeStory = getStoryById(getActiveStoryId()) || stories[0];

function getHashParts() {
  const hash = window.location.hash.replace(/^#/, "");
  const [view = "home", storyId = ""] = hash.split("/");
  return { view, storyId };
}

function getViewFromHash() {
  const { view } = getHashParts();
  return validViews.has(view) ? view : "home";
}

function getActiveStoryId() {
  const { view, storyId } = getHashParts();
  if (view === "reader" && storyId) return storyId;
  return siteConfig.defaultStoryId;
}

function getStoryById(storyId) {
  return stories.find((storyItem) => storyItem.id === storyId) || null;
}

function toCssUrl(value) {
  return `url("${String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}")`;
}

function applyBookMaterials(storyItem = activeStory) {
  const materials = {
    ...(siteConfig.bookMaterials || {}),
    ...(storyItem?.bookMaterials || {}),
  };
  const root = document.documentElement;

  if (materials.coverImage) {
    root.style.setProperty("--book-cover-image", toCssUrl(materials.coverImage));
  }
  if (materials.backCoverImage) {
    root.style.setProperty("--book-back-cover-image", toCssUrl(materials.backCoverImage));
  }
  if (materials.paperTexture) {
    root.style.setProperty("--book-paper-texture", toCssUrl(materials.paperTexture));
  }
}

function setActiveStory(storyId = getActiveStoryId()) {
  activeStory =
    getStoryById(storyId) ||
    getStoryById(siteConfig.defaultStoryId) ||
    stories[0];
  applyBookMaterials(activeStory);
  return activeStory;
}

function setActiveView(nextView) {
  const previousStoryId = activeStory?.id || "";
  activeView = nextView;

  for (const view of views) {
    view.hidden = view.dataset.view !== nextView;
  }

  for (const link of navLinks) {
    if (link.dataset.navLink === nextView) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  }

  document.body.classList.toggle("view-reader", nextView === "reader");

  if (nextView === "reader") {
    const storyForReader = setActiveStory(getActiveStoryId());
    renderReaderIntro(storyForReader);

    if (bookRoot.dataset.storyId !== storyForReader.id || previousStoryId !== storyForReader.id) {
      customIndex = 0;
      initializeReader();
      return;
    }

    updateBookMetrics();
  }
}

function getMode() {
  return window.matchMedia("(max-width: 900px)").matches ? "mobile" : "desktop";
}

function updateBookMetrics() {
  const root = document.documentElement;

  if (getMode() === "mobile") {
    const mobileTextRatio = 0.22;
    const maxWidth = Math.min(window.innerWidth, 560);
    const maxHeight = Math.max(420, window.innerHeight - 64);
    const pageWidth = Math.max(
      260,
      Math.min(maxWidth, maxHeight * (1 - mobileTextRatio) * originalImageRatio),
    );
    const imageHeight = pageWidth / originalImageRatio;
    const pageHeight = imageHeight / (1 - mobileTextRatio);

    root.style.setProperty("--page-width", `${pageWidth.toFixed(2)}px`);
    root.style.setProperty("--page-height", `${pageHeight.toFixed(2)}px`);
    root.style.setProperty("--spread-width", `${pageWidth.toFixed(2)}px`);
    root.style.setProperty("--spread-height", `${pageHeight.toFixed(2)}px`);
    return;
  }

  const maxSpreadWidth = Math.min(window.innerWidth - 176, 1320);
  const maxSpreadHeight = Math.max(420, window.innerHeight - 96);
  const spreadRatio = originalImageRatio * 2;
  const spreadWidth = Math.max(640, Math.min(maxSpreadWidth, maxSpreadHeight * spreadRatio));
  const spreadHeight = spreadWidth / spreadRatio;
  const pageWidth = spreadWidth / 2;

  root.style.setProperty("--page-width", `${pageWidth.toFixed(2)}px`);
  root.style.setProperty("--page-height", `${spreadHeight.toFixed(2)}px`);
  root.style.setProperty("--spread-width", `${spreadWidth.toFixed(2)}px`);
  root.style.setProperty("--spread-height", `${spreadHeight.toFixed(2)}px`);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function getTitleLines(storyItem) {
  if (Array.isArray(storyItem?.titleLines) && storyItem.titleLines.length > 0) {
    return storyItem.titleLines;
  }
  return [storyItem?.title || ""];
}

function getPrimaryImage(storyItem) {
  return storyItem?.heroImage || storyItem?.scenes?.[0]?.image || "";
}

function getPrimaryAlt(storyItem) {
  return storyItem?.scenes?.[0]?.alt || `${storyItem?.title || "作品"}の画像`;
}

function updateMeta(storyItem) {
  const title = storyItem?.title || "Dream Garden Note";
  const description = storyItem?.description || "";
  const ogImage = storyItem?.ogImage || getPrimaryImage(storyItem);

  document.title = `Dream Garden Note | ${title}`;
  document
    .querySelector('meta[name="description"]')
    ?.setAttribute("content", `Dream Garden NoteのWeb絵本。${description}`);
  document
    .querySelector('meta[property="og:title"]')
    ?.setAttribute("content", `Dream Garden Note | ${title}`);
  document
    .querySelector('meta[property="og:description"]')
    ?.setAttribute("content", storyItem?.listDescription || description);
  document
    .querySelector('meta[property="og:image"]')
    ?.setAttribute("content", ogImage);
}

function renderHome() {
  const featuredStory =
    getStoryById(siteConfig.featuredStoryId) ||
    getStoryById(siteConfig.defaultStoryId) ||
    stories[0];

  if (!featuredStory) return;

  const image = getPrimaryImage(featuredStory);
  homeVisual.innerHTML = image
    ? `<img src="${escapeHtml(image)}" alt="" fetchpriority="high" />`
    : "";
  homeTitle.innerHTML = getTitleLines(featuredStory)
    .map((line) => escapeHtml(line))
    .join("<br />");
  homeCopy.textContent = featuredStory.heroCopy || featuredStory.description || "";
  updateMeta(featuredStory);
}

function renderStoryList() {
  const publishedStories = stories.filter((storyItem) => storyItem.status === "published");

  storyGrid.innerHTML = publishedStories
    .map((storyItem, index) => {
      const tags = (storyItem.tags || [])
        .map((tag) => `<li>${escapeHtml(tag)}</li>`)
        .join("");
      const image = getPrimaryImage(storyItem);
      const loading = index === 0 ? "eager" : "lazy";

      return `
        <a
          class="story-card"
          href="#reader/${escapeHtml(storyItem.id)}"
          data-story-id="${escapeHtml(storyItem.id)}"
          aria-label="${escapeHtml(storyItem.title)}を読む"
        >
          <figure>
            <img
              src="${escapeHtml(image)}"
              alt="${escapeHtml(getPrimaryAlt(storyItem))}"
              loading="${loading}"
            />
          </figure>
          <div class="story-card-copy">
            <h3>${escapeHtml(storyItem.title)}</h3>
            <p>${escapeHtml(storyItem.listDescription || storyItem.description)}</p>
            <ul class="story-tags" aria-label="テーマ">
              ${tags}
            </ul>
          </div>
        </a>
      `;
    })
    .join("");
}

function renderReaderIntro(storyItem = activeStory) {
  if (!storyItem) return;
  readerTitle.textContent = storyItem.title;
  readerDescription.textContent = storyItem.description || "";
  updateMeta(storyItem);
}

function createImagePage(scene) {
  return `
    <figure class="book-page image-page">
      <img src="${scene.image}" alt="${escapeHtml(scene.alt)}" />
    </figure>
  `;
}

function createTextPage(scene, pageIndex, totalPages) {
  return `
    <article class="book-page text-page" data-story-id="${escapeHtml(activeStory.id)}" data-scene-id="${escapeHtml(scene.id)}">
      <div class="page-content">
        ${scene.desktopText.map((text) => `<p>${escapeHtml(text)}</p>`).join("")}
      </div>
      <p class="page-count">${pageIndex} / ${totalPages}</p>
    </article>
  `;
}

function createCoverPage() {
  const titleLines = getTitleLines(activeStory)
    .map((line) => `<span>${escapeHtml(line)}</span>`)
    .join("");

  return `
    <article class="book-page cover-page">
      <div class="page-content">
        <p class="page-kicker">Dream Garden Note</p>
        <h2 class="cover-title">${titleLines}</h2>
      </div>
    </article>
  `;
}

function createBackPage() {
  const backCover = activeStory.backCover || {};
  const text = mode === "mobile" && backCover.mobileText ? backCover.mobileText : backCover.text;

  return `
    <article class="book-page back-page">
      <div class="page-content">
        <p class="page-kicker">Dream Garden Note</p>
        <p>${escapeHtml(text || "")}</p>
      </div>
    </article>
  `;
}

function createMobileScene(scene, pageIndex, totalPages) {
  return `
    <article class="mobile-scene">
      <img src="${scene.image}" alt="${escapeHtml(scene.alt)}" />
      <div class="mobile-copy">
        <p>${escapeHtml(scene.mobileText)}</p>
        <p class="mobile-page-count">${pageIndex} / ${totalPages}</p>
      </div>
    </article>
  `;
}

function getCustomPages() {
  const scenes = activeStory.scenes || [];
  const totalPages = scenes.length + 2;
  const cover = activeStory.cover || {};
  const backCover = activeStory.backCover || {};

  if (mode === "mobile") {
    return [
      {
        label: cover.label || "表紙",
        markup: `<div class="mobile-book">${createCoverPage()}</div>`,
      },
      ...scenes.map((scene, index) => ({
        label: scene.title,
        markup: `<div class="mobile-book">${createMobileScene(scene, index + 2, totalPages)}</div>`,
      })),
      {
        label: backCover.label || "裏表紙",
        markup: `<div class="mobile-book">${createBackPage()}</div>`,
      },
    ];
  }

  return [
    {
      label: cover.label || "表紙",
      markup: `<div class="single-page-wrap">${createCoverPage()}</div>`,
    },
    ...scenes.map((scene, index) => ({
      label: scene.title,
      markup: `<div class="custom-spread">${createImagePage(scene)}${createTextPage(scene, index + 2, totalPages)}</div>`,
    })),
    {
      label: backCover.label || "裏表紙",
      markup: `<div class="single-page-wrap">${createBackPage()}</div>`,
    },
  ];
}

function getStPages() {
  const scenes = activeStory.scenes || [];
  const totalPages = scenes.length + 2;

  if (mode === "mobile") {
    return [
      `<article class="st-page st-cover">${createCoverPage()}</article>`,
      ...scenes.map((scene, index) => `
        <article class="st-page">
          ${createMobileScene(scene, index + 2, totalPages)}
        </article>
      `),
      `<article class="st-page st-back">${createBackPage()}</article>`,
    ];
  }

  const pages = [`<article class="st-page st-cover">${createCoverPage()}</article>`];

  for (const [index, scene] of scenes.entries()) {
    pages.push(`
      <article class="st-page st-image">
        <img src="${scene.image}" alt="${escapeHtml(scene.alt)}" />
      </article>
    `);
    pages.push(`
      <article class="st-page" data-story-id="${escapeHtml(activeStory.id)}" data-scene-id="${escapeHtml(scene.id)}">
        <div class="page-content">
          ${scene.desktopText.map((text) => `<p>${escapeHtml(text)}</p>`).join("")}
        </div>
        <p class="page-count">${index + 2} / ${totalPages}</p>
      </article>
    `);
  }

  pages.push(`<article class="st-page st-back">${createBackPage()}</article>`);
  return pages;
}

function updateControls(index, total) {
  const pages = getCustomPages();
  const label = pages[Math.min(index, pages.length - 1)]?.label || activeStory.cover?.label || "表紙";

  pageLabel.textContent = label;
  pageProgress.textContent = `${index + 1} / ${total}`;
  pageLabel.setAttribute("aria-hidden", "false");
  pageProgress.setAttribute("aria-hidden", "false");
  prevButton.disabled = index <= 0;
  nextButton.disabled = index >= total - 1;
}

function getTurnFaceMarkup(pageMarkup, side) {
  const template = document.createElement("template");
  template.innerHTML = pageMarkup.trim();

  if (mode === "mobile") {
    const mobileBook = template.content.querySelector(".mobile-book");
    return mobileBook?.innerHTML || pageMarkup;
  }

  const spread = template.content.querySelector(".custom-spread");
  if (spread) {
    const page = spread.querySelector(side === "left" ? ".image-page" : ".text-page");
    return page?.outerHTML || pageMarkup;
  }

  const singlePage = template.content.querySelector(".single-page-wrap");
  return singlePage?.innerHTML || pageMarkup;
}

function getTurnScope(pageMarkup) {
  if (mode === "mobile") return "mobile";
  return pageMarkup.includes("custom-spread") ? "spread" : "single";
}

function getBlankTurnFaceMarkup() {
  return `<article class="book-page text-page turn-blank-page" aria-hidden="true"></article>`;
}

function getTurnMarkup(currentMarkup, nextMarkup, direction) {
  const isNext = direction === "next";
  const frontSide = isNext ? "right" : "left";
  const backSide = isNext ? "left" : "right";
  const currentScope = getTurnScope(currentMarkup);
  const front = getTurnFaceMarkup(currentMarkup, frontSide);
  const back = currentScope === "single" ? getBlankTurnFaceMarkup() : getTurnFaceMarkup(nextMarkup, backSide);

  return `
    <div class="turn-page">
      <div class="turn-face turn-front">${front}</div>
      <div class="turn-face turn-back">${back}</div>
    </div>
  `;
}

function resetTurnLayer() {
  turnSheet.className = "fallback-turn";
  turnSheet.innerHTML = "";
}

function renderCustomPage(nextIndex = customIndex, direction = "none") {
  const pages = getCustomPages();
  const total = pages.length;
  const normalizedIndex = Math.min(Math.max(nextIndex, 0), total - 1);

  if (direction !== "none" && !motionQuery.matches) {
    const currentMarkup = pages[customIndex]?.markup || bookRoot.innerHTML;
    const nextMarkup = pages[normalizedIndex].markup;
    const scope = getTurnScope(currentMarkup);
    const nextScope = getTurnScope(nextMarkup);
    const isSingleTransition = scope === "single" || nextScope === "single";
    const turnDuration = mode === "mobile" ? 340 : isSingleTransition ? 520 : 460;
    const turnSwapDelay = isSingleTransition ? 0 : mode === "mobile" ? 100 : 160;

    isAnimating = true;
    turnSheet.innerHTML = getTurnMarkup(currentMarkup, nextMarkup, direction);
    turnSheet.className = `fallback-turn is-turning is-${direction} is-${scope}`;

    window.setTimeout(() => {
      bookRoot.innerHTML = nextMarkup;
      customIndex = normalizedIndex;
      updateControls(customIndex, total);
    }, turnSwapDelay);

    window.setTimeout(() => {
      resetTurnLayer();
      isAnimating = false;
    }, turnDuration + 40);

    return;
  }

  bookRoot.dataset.engine = "custom";
  bookRoot.innerHTML = pages[normalizedIndex].markup;
  customIndex = normalizedIndex;
  updateControls(customIndex, total);
}

function initializeCustomReader() {
  if (pageFlip) {
    pageFlip.destroy();
    pageFlip = null;
  }
  renderCustomPage(0);
}

function initializeStPageFlip() {
  const PageFlip = window.St?.PageFlip;
  if (!PageFlip) return false;

  const pages = getStPages();
  const metrics = window.getComputedStyle(document.documentElement);
  const width = Number.parseFloat(metrics.getPropertyValue("--page-width")) || 448;
  const height = Number.parseFloat(metrics.getPropertyValue("--page-height")) || 640;

  bookRoot.dataset.engine = "stpageflip";
  bookRoot.innerHTML = `<div id="st-book">${pages.join("")}</div>`;

  try {
    pageFlip = new PageFlip(document.getElementById("st-book"), {
      width,
      height,
      size: "stretch",
      minWidth: mode === "mobile" ? 300 : 360,
      maxWidth: mode === "mobile" ? 520 : 580,
      minHeight: mode === "mobile" ? 520 : 520,
      maxHeight: mode === "mobile" ? 820 : 760,
      maxShadowOpacity: 0.38,
      showCover: true,
      mobileScrollSupport: false,
      usePortrait: mode === "mobile",
      flippingTime: 780,
      drawShadow: true,
    });
    pageFlip.loadFromHTML(document.querySelectorAll("#st-book .st-page"));
    pageFlip.on("flip", (event) => {
      updateControls(event.data, pages.length);
    });
    updateControls(0, pages.length);
    return true;
  } catch {
    pageFlip = null;
    return false;
  }
}

function initializeReader() {
  if (!activeStory) return;

  mode = getMode();
  updateBookMetrics();
  bookRoot.innerHTML = "";
  resetTurnLayer();
  isAnimating = false;
  bookRoot.dataset.storyId = activeStory.id;

  window.setTimeout(() => {
    const shouldPreferStPageFlip = bookRoot.dataset.preferStpageflip === "true";
    const usedStPageFlip = shouldPreferStPageFlip ? initializeStPageFlip() : false;
    if (!usedStPageFlip) initializeCustomReader();
  }, 350);
}

function goToNextPage() {
  if (isAnimating) return;
  if (pageFlip) {
    pageFlip.flipNext();
    return;
  }
  if (customIndex >= getCustomPages().length - 1) {
    return;
  }
  renderCustomPage(customIndex + 1, "next");
}

function goToPreviousPage() {
  if (isAnimating) return;
  if (pageFlip) {
    pageFlip.flipPrev();
    return;
  }
  if (customIndex <= 0) {
    return;
  }
  renderCustomPage(customIndex - 1, "prev");
}

prevButton.addEventListener("click", goToPreviousPage);
nextButton.addEventListener("click", goToNextPage);

window.addEventListener("keydown", (event) => {
  if (activeView !== "reader") return;
  if (event.key === "ArrowRight") goToNextPage();
  if (event.key === "ArrowLeft") goToPreviousPage();
});

let touchStartX = 0;
let touchStartY = 0;

bookRoot.addEventListener(
  "touchstart",
  (event) => {
    const touch = event.changedTouches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
  },
  { passive: true },
);

bookRoot.addEventListener(
  "touchmove",
  (event) => {
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;

    if (Math.abs(deltaX) > 16 && Math.abs(deltaX) > Math.abs(deltaY)) {
      event.preventDefault();
    }
  },
  { passive: false },
);

bookRoot.addEventListener(
  "touchend",
  (event) => {
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;

    if (Math.abs(deltaX) < 46 || Math.abs(deltaX) < Math.abs(deltaY)) return;
    event.preventDefault();
    lastSwipeAt = Date.now();
    if (deltaX < 0) goToNextPage();
    if (deltaX > 0) goToPreviousPage();
  },
  { passive: false },
);

document.addEventListener("click", (event) => {
  if (activeView !== "reader") return;
  if (event.target.closest("button, a")) return;
  if (Date.now() - lastSwipeAt < 450) return;

  if (mode === "mobile") {
    const edgeWidth = Math.max(64, window.innerWidth * 0.22);

    if (event.clientX <= edgeWidth) {
      goToPreviousPage();
      return;
    }

    if (event.clientX >= window.innerWidth - edgeWidth) {
      goToNextPage();
      return;
    }
  }
});

window.addEventListener("resize", () => {
  const nextMode = getMode();
  updateBookMetrics();
  if (nextMode === mode) return;
  initializeReader();
});

const canvas = document.getElementById("firefly-layer");
const context = canvas.getContext("2d");
let width = 0;
let height = 0;
let fireflies = [];
let animationFrame = null;

function resizeCanvas() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * ratio);
  canvas.height = Math.floor(height * ratio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function createFirefly(index) {
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    radius: 0.8 + Math.random() * 2.8,
    speedX: (Math.random() - 0.5) * 0.12,
    speedY: -0.02 - Math.random() * 0.08,
    drift: Math.random() * Math.PI * 2 + index,
    alpha: 0.16 + Math.random() * 0.38,
    pulse: 0.003 + Math.random() * 0.007,
  };
}

function resetFireflies() {
  const count = Math.max(24, Math.min(62, Math.round(width / 22)));
  fireflies = Array.from({ length: count }, (_, index) => createFirefly(index));
}

function drawFireflies() {
  context.clearRect(0, 0, width, height);

  for (const firefly of fireflies) {
    firefly.drift += firefly.pulse;
    firefly.x += firefly.speedX + Math.sin(firefly.drift) * 0.05;
    firefly.y += firefly.speedY + Math.cos(firefly.drift * 0.8) * 0.025;

    if (firefly.y < -24) {
      firefly.y = height + 24;
      firefly.x = Math.random() * width;
    }
    if (firefly.x < -24) firefly.x = width + 24;
    if (firefly.x > width + 24) firefly.x = -24;

    const glow = firefly.alpha + Math.sin(firefly.drift * 1.8) * 0.16;
    const radius = firefly.radius * 7;
    const gradient = context.createRadialGradient(
      firefly.x,
      firefly.y,
      0,
      firefly.x,
      firefly.y,
      radius,
    );

    gradient.addColorStop(0, `rgba(255, 235, 145, ${Math.max(0.2, glow)})`);
    gradient.addColorStop(0.32, `rgba(241, 201, 95, ${Math.max(0.06, glow * 0.42)})`);
    gradient.addColorStop(1, "rgba(241, 201, 95, 0)");

    context.fillStyle = gradient;
    context.beginPath();
    context.arc(firefly.x, firefly.y, radius, 0, Math.PI * 2);
    context.fill();
  }

  animationFrame = window.requestAnimationFrame(drawFireflies);
}

function startFireflies() {
  if (motionQuery.matches) return;
  resizeCanvas();
  resetFireflies();
  drawFireflies();
}

function stopFireflies() {
  if (animationFrame) {
    window.cancelAnimationFrame(animationFrame);
    animationFrame = null;
  }
  context.clearRect(0, 0, width, height);
}

window.addEventListener("resize", () => {
  if (motionQuery.matches) return;
  resizeCanvas();
  resetFireflies();
});

motionQuery.addEventListener("change", () => {
  if (motionQuery.matches) {
    stopFireflies();
  } else {
    startFireflies();
  }
});

window.addEventListener("hashchange", () => {
  setActiveView(getViewFromHash());
});

renderHome();
renderStoryList();
setActiveView(getViewFromHash());
startFireflies();
