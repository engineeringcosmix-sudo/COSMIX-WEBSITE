export function installMotion() {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((node) => {
    if (reduce) {
      node.classList.add("is-in");
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.16 },
    );
    observer.observe(node);
  });

  document.querySelectorAll<HTMLElement>("[data-count]").forEach((node) => {
    const target = Number(node.dataset.count || "0");
    const suffix = node.dataset.suffix || "";
    const paint = (value: number) => {
      node.textContent = `${Math.round(value).toLocaleString("en-PK")}${suffix}`;
    };
    if (reduce) {
      paint(target);
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      const start = performance.now();
      const duration = 1400;
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / duration);
        const eased = 1 - (1 - p) ** 3;
        paint(target * eased);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    observer.observe(node);
  });

  document.querySelectorAll<HTMLElement>("[data-slider]").forEach((slider) => {
    const track = slider.querySelector<HTMLElement>("[data-track]");
    if (!track) return;
    const step = () => Math.max(track.clientWidth * 0.72, 280);
    slider.querySelector("[data-next]")?.addEventListener("click", () => {
      track.scrollBy({ left: step(), behavior: reduce ? "auto" : "smooth" });
    });
    slider.querySelector("[data-prev]")?.addEventListener("click", () => {
      track.scrollBy({ left: -step(), behavior: reduce ? "auto" : "smooth" });
    });
  });

  const hero = document.querySelector<HTMLElement>("[data-hero]");
  if (!hero) return;
  const slides = [...hero.querySelectorAll<HTMLElement>("[data-slide]")];
  const play = (index: number) => {
    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle("is-on", slideIndex === index);
      const video = slide.querySelector("video");
      if (!video) return;
      if (slideIndex === index && !reduce) video.play().catch(() => undefined);
      else video.pause();
    });
  };
  let index = slides.findIndex((slide) => slide.classList.contains("is-on"));
  if (index < 0) index = 0;
  play(index);
  if (reduce || slides.length < 2) return;
  window.setInterval(() => {
    index = (index + 1) % slides.length;
    play(index);
  }, 8000);
}
