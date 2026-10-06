// Render loops ask this before doing any work: is the element near the viewport and is the tab visible?
export function watchVisible(el, margin = '80px') {
  let on = true;
  const io = new IntersectionObserver(([e]) => { on = e.isIntersecting; }, { rootMargin: margin });
  io.observe(el);
  return { active: () => on && !document.hidden, stop: () => io.disconnect() };
}
