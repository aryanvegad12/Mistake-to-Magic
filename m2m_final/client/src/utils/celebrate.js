// Small DOM-only celebration burst — no canvas, no dependency.
// Used when the student logs a mistake or marks a revision, so earning points feels earned.

const COLORS = ['#8b5cf6', '#22d3ee', '#fbbf24', '#ff6b6b', '#34d399', '#f472b6'];
const PIECES = 34;

const reducedMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * @param {object}  opts
 * @param {number} [opts.points] show a floating "+N" above the burst
 * @param {Event}  [opts.event]  click event, so the burst starts where the user tapped
 */
export function celebrate({ points, event } = {}) {
  if (reducedMotion()) return;

  const ox = event?.clientX ?? window.innerWidth / 2;
  const oy = event?.clientY ?? window.innerHeight / 3;

  const root = document.createElement('div');
  root.className = 'confetti-root';

  for (let i = 0; i < PIECES; i++) {
    const bit = document.createElement('i');
    bit.className = 'confetti-bit';
    const angle = Math.random() * Math.PI * 2;
    const dist = 80 + Math.random() * 200;

    bit.style.left = `${ox}px`;
    bit.style.top = `${oy}px`;
    bit.style.background = COLORS[i % COLORS.length];
    bit.style.borderRadius = i % 3 === 0 ? '50%' : '2px';
    bit.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
    bit.style.setProperty('--dy', `${Math.sin(angle) * dist + 140}px`);
    bit.style.setProperty('--rot', `${Math.random() * 720 - 360}deg`);
    bit.style.animationDelay = `${Math.random() * 0.12}s`;
    root.appendChild(bit);
  }

  if (points) {
    const pop = document.createElement('div');
    pop.className = 'points-pop';
    pop.textContent = `+${points}`;
    pop.style.left = `${ox - 16}px`;
    pop.style.top = `${oy - 34}px`;
    root.appendChild(pop);
  }

  document.body.appendChild(root);
  setTimeout(() => root.remove(), 1500);
}

export default celebrate;
