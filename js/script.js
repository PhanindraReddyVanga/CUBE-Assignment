// Keeping this plain and readable on purpose.
document.addEventListener("DOMContentLoaded", () => {
  // ----- Mobile nav
  const header = document.getElementById("header");
  const navToggle = document.getElementById("navToggle");
  const nav = document.getElementById("site-nav");

  if (header && navToggle && nav) {
    const setNavOpen = (open) => {
      header.setAttribute("data-nav-open", open ? "true" : "false");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    };

    navToggle.addEventListener("click", () => {
      const open = header.getAttribute("data-nav-open") === "true";
      setNavOpen(!open);
    });

    nav.addEventListener("click", (e) => {
      if (e.target.closest("a")) setNavOpen(false);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setNavOpen(false);
    });
  }

  // ----- Product gallery
  const galleryImg = document.getElementById("galleryImg");
  const galleryPrev = document.getElementById("galleryPrev");
  const galleryNext = document.getElementById("galleryNext");
  const galleryDots = document.getElementById("galleryDots");
  const galleryThumbs = document.getElementById("galleryThumbs");

  const galleryImages = [
    { src: "assets/product-main.png", alt: "GTG Perfumes bottle" },
    { src: "assets/product-1.png", alt: "Perfume lifestyle image 1" },
    { src: "assets/product-2.png", alt: "Perfume lifestyle image 2" },
    { src: "assets/product-3.png", alt: "Perfume lifestyle image 3" },
    { src: "assets/product-4.png", alt: "Perfume lifestyle image 4" },
  ];

  let currentImage = 0;

  function showImage(i) {
    if (!galleryImg) return;
    currentImage = i;

    const img = galleryImages[currentImage];
    galleryImg.src = img.src;
    galleryImg.alt = img.alt;

    if (galleryDots) {
      Array.from(galleryDots.children).forEach((dot, idx) => {
        dot.setAttribute("aria-selected", idx === currentImage ? "true" : "false");
      });
    }

    if (galleryThumbs) {
      Array.from(galleryThumbs.children).forEach((btn, idx) => {
        // thumbs are 1..4 => map to image index 1..4
        btn.setAttribute("aria-current", idx + 1 === currentImage ? "true" : "false");
      });
    }
  }

  function stepImage(dir) {
    const next = (currentImage + dir + galleryImages.length) % galleryImages.length;
    showImage(next);
  }

  if (galleryDots) {
    galleryDots.innerHTML = "";
    galleryImages.forEach((_, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "dot";
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-label", `Show image ${i + 1}`);
      btn.addEventListener("click", () => showImage(i));
      galleryDots.appendChild(btn);
    });
  }

  if (galleryThumbs) {
    galleryThumbs.innerHTML = "";
    galleryImages.slice(1).forEach((img, idx) => {
      const realIndex = idx + 1;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "thumb";
      btn.addEventListener("click", () => showImage(realIndex));

      const t = document.createElement("img");
      t.src = img.src;
      t.alt = "";
      t.loading = "lazy";
      btn.appendChild(t);

      galleryThumbs.appendChild(btn);
    });
  }

  galleryPrev?.addEventListener("click", () => stepImage(-1));
  galleryNext?.addEventListener("click", () => stepImage(1));
  showImage(0);

  // ----- Product form logic
  const productForm = document.getElementById("productForm");
  const addToCart = document.getElementById("addToCart");

  const subscriptionBox = document.getElementById("subscriptionBox");
  const subscriptionToggle = document.getElementById("subscriptionToggle");
  const subscriptionPanel = document.getElementById("subscriptionPanel");
  const includedList = document.getElementById("includedList");
  const subscriptionNote = document.getElementById("subscriptionNote");

  const includedByType = {
    single: {
      items: [
        "1 bottle shipped monthly",
        "Free Sampler for original, lily and rose fragrances",
        "50% OFF Shipping",
        "Pause or Cancel Anytime after 3 months minimum",
        "28 Day Money Back Guarantee*",
      ],
      note: "Renews every 30 days.",
    },
    double: {
      items: [
        "2 bottles shipped monthly",
        "Free Sampler for original, lily and rose fragrances",
        "Free shipping",
        "Pause or Cancel Anytime after 3 months minimum",
        "28 Day Money Back Guarantee*",
      ],
      note: "Renews every 30 days.",
    },
    "one-time": {
      items: ["One-time order (no renewal)", "Free sampler included"],
      note: "No subscription renewal.",
    },
  };

  function getCheckedValue(name) {
    if (!productForm) return "";
    const el = productForm.querySelector(`input[name="${name}"]:checked`);
    return el ? el.value : "";
  }

  function updateIncluded(type) {
    if (!includedList || !subscriptionNote) return;
    const data = includedByType[type] || includedByType.single;

    includedList.innerHTML = "";
    data.items.forEach((text) => {
      const li = document.createElement("li");
      li.textContent = text;
      includedList.appendChild(li);
    });
    subscriptionNote.textContent = data.note;
  }

  function updateSubscriptionVisibility(type) {
    if (!subscriptionBox) return;
    const show = type === "single" || type === "double";
    subscriptionBox.style.display = show ? "" : "none";
    if (subscriptionPanel) subscriptionPanel.hidden = false;
    subscriptionBox.dataset.collapsed = "false";
    subscriptionToggle?.setAttribute("aria-expanded", "true");
  }

  function updateCartLink() {
    if (!addToCart) return;
    const fragrance = getCheckedValue("fragrance");
    const type = getCheckedValue("purchaseType");
    addToCart.href = `cart.html?fragrance=${encodeURIComponent(fragrance)}&type=${encodeURIComponent(type)}`;
  }

  function syncProductUI() {
    const type = getCheckedValue("purchaseType");
    updateCartLink();
    updateSubscriptionVisibility(type);
    updateIncluded(type);
  }

  productForm?.addEventListener("change", syncProductUI);

  subscriptionToggle?.addEventListener("click", () => {
    if (!subscriptionBox || !subscriptionPanel) return;
    const isCollapsed = subscriptionBox.dataset.collapsed === "true";
    const nextCollapsed = !isCollapsed;

    subscriptionBox.dataset.collapsed = nextCollapsed ? "true" : "false";
    subscriptionToggle.setAttribute("aria-expanded", nextCollapsed ? "false" : "true");
    subscriptionPanel.hidden = nextCollapsed;
  });

  syncProductUI();

  // ----- Percentage counter (IntersectionObserver)
  const statsSection = document.getElementById("statsSection");
  const percentEls = statsSection ? statsSection.querySelectorAll(".percent") : [];

  function animateNumber(el, to) {
    const suffix = el.getAttribute("data-suffix") || "";
    const start = 0;
    const duration = 900;
    const t0 = performance.now();

    function tick(now) {
      const t = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const val = Math.round(start + (to - start) * eased);
      el.textContent = `${val}${suffix}`;
      if (t < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  if (statsSection && percentEls.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          percentEls.forEach((el) => {
            if (el.dataset.done === "true") return;
            el.dataset.done = "true";
            const target = Number(el.getAttribute("data-target") || "0");
            animateNumber(el, target);
          });

          observer.disconnect();
        });
      },
      { threshold: 0.35 }
    );

    observer.observe(statsSection);
  }

  // ----- Small hero count-up (just runs once)
  document.querySelectorAll(".hero-count").forEach((el) => {
    const target = Number(el.getAttribute("data-count-to") || "0");
    const suffix = el.getAttribute("data-suffix") || "";
    const compact = el.getAttribute("data-format") === "compact";

    const duration = 650;
    const t0 = performance.now();

    const format = (n) => {
      if (!compact) return String(n);
      return n >= 1000
        ? new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 0 }).format(n)
        : String(n);
    };

    function tick(now) {
      const t = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const val = Math.round(target * eased);
      el.textContent = `${format(val)}${suffix}`;
      if (t < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  });

  // ----- Footer bits
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  const newsletterForm = document.getElementById("newsletterForm");
  newsletterForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const input = document.getElementById("newsletter-email");
    const email = input ? input.value.trim() : "";
    if (!email) return;

    // just a demo interaction
    alert("Subscribed (demo).");
    newsletterForm.reset();
  });

  // ----- Collection accordion (Our Collection)
  const acc = document.getElementById("collectionAccordion");
  if (acc) {
    const items = Array.from(acc.querySelectorAll(".accordion-item"));

    function closeItem(item) {
      item.classList.remove("is-open");
      const btn = item.querySelector(".accordion-btn");
      const panel = item.querySelector(".accordion-panel");
      const icon = item.querySelector(".accordion-icon");
      if (btn) btn.setAttribute("aria-expanded", "false");
      if (panel) panel.hidden = true;
      if (icon) icon.textContent = "+";
    }

    function openItem(item) {
      item.classList.add("is-open");
      const btn = item.querySelector(".accordion-btn");
      const panel = item.querySelector(".accordion-panel");
      const icon = item.querySelector(".accordion-icon");
      if (btn) btn.setAttribute("aria-expanded", "true");
      if (panel) panel.hidden = false;
      if (icon) icon.textContent = "–";
    }

    // normalize initial state
    items.forEach((item, idx) => {
      if (item.classList.contains("is-open") || idx === 0) openItem(item);
      else closeItem(item);
    });

    acc.addEventListener("click", (e) => {
      const btn = e.target.closest(".accordion-btn");
      if (!btn) return;

      const item = btn.closest(".accordion-item");
      if (!item) return;

      const isOpen = item.classList.contains("is-open");
      items.forEach(closeItem);
      if (!isOpen) openItem(item);
    });
  }
});
