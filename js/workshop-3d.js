/**
 * RUSELL'S GLASS, WOODS & METALS - 3D Interactive Material Matrix
 * Real-time hardware-accelerated 3D Canvas Perspective Engine
 * Lead Software Architect: ALVARADO, JETHRO OLIVER A. (UMDC)
 */

(function () {
  const canvas = document.getElementById('login3dCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width = (canvas.width = canvas.parentElement.clientWidth || 380);
  let height = (canvas.height = 140);

  // Resize handling
  window.addEventListener('resize', () => {
    if (canvas && canvas.parentElement) {
      width = canvas.width = canvas.parentElement.clientWidth || 380;
      height = canvas.height = 140;
    }
  });

  // Camera & Rotation State
  let rotX = -0.25;
  let rotY = 0.5;
  let targetRotX = -0.25;
  let targetRotY = 0.5;
  let activeFocus = 'all'; // 'all', 'glass', 'wood', 'steel'
  let autoRotate = true;
  let isDragging = false;
  let startMouseX = 0;
  let startMouseY = 0;

  // 3D Perspective Projection
  function project(x, y, z) {
    // Rotate Y (yaw)
    const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
    const x1 = x * cosY + z * sinY;
    const z1 = -x * sinY + z * cosY;

    // Rotate X (pitch)
    const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
    const y2 = y * cosX - z1 * sinX;
    const z2 = y * sinX + z1 * cosX;

    // Distance & Perspective
    const fov = 340;
    const dist = 380;
    const factor = fov / (dist + z2);

    return {
      px: width / 2 + x1 * factor,
      py: height / 2 + y2 * factor,
      pz: z2,
      scale: factor
    };
  }

  // Draw 3D Polygon Face with dynamic depth shading
  function drawFace(points, fillColor, strokeColor, lineWidth = 1) {
    const proj = points.map(p => project(p[0], p[1], p[2]));
    // Simple backface culling
    const v1 = { x: proj[1].px - proj[0].px, y: proj[1].py - proj[0].py };
    const v2 = { x: proj[2].px - proj[0].px, y: proj[2].py - proj[0].py };
    const cross = v1.x * v2.y - v1.y * v2.x;

    ctx.beginPath();
    ctx.moveTo(proj[0].px, proj[0].py);
    for (let i = 1; i < proj.length; i++) {
      ctx.lineTo(proj[i].px, proj[i].py);
    }
    ctx.closePath();

    if (fillColor) {
      ctx.fillStyle = fillColor;
      ctx.fill();
    }
    if (strokeColor) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    }

    // Specular corner nodes
    proj.forEach(pt => {
      ctx.beginPath();
      ctx.arc(pt.px, pt.py, 1.8 * pt.scale, 0, Math.PI * 2);
      ctx.fillStyle = strokeColor || '#ffffff';
      ctx.fill();
    });
  }

  // 3D Particles
  const particles = Array.from({ length: 24 }, () => ({
    x: (Math.random() - 0.5) * 280,
    y: (Math.random() - 0.5) * 160,
    z: (Math.random() - 0.5) * 280,
    speed: 0.2 + Math.random() * 0.4,
    size: 1 + Math.random() * 1.5,
    color: ['#38bdf8', '#4ade80', '#fbbf24'][Math.floor(Math.random() * 3)]
  }));

  // Render Loop
  let lastTime = 0;
  function render(time) {
    ctx.clearRect(0, 0, width, height);

    // Auto rotate when not dragging
    if (autoRotate && !isDragging) {
      targetRotY += 0.008;
    }

    // Smooth Damping
    rotX += (targetRotX - rotX) * 0.08;
    rotY += (targetRotY - rotY) * 0.08;

    // 1. Draw Grid Base in 3D
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
    ctx.lineWidth = 1;
    for (let i = -100; i <= 100; i += 40) {
      const p1 = project(i, 45, -100);
      const p2 = project(i, 45, 100);
      ctx.beginPath();
      ctx.moveTo(p1.px, p1.py);
      ctx.lineTo(p2.px, p2.py);
      ctx.stroke();

      const p3 = project(-100, 45, i);
      const p4 = project(100, 45, i);
      ctx.beginPath();
      ctx.moveTo(p3.px, p3.py);
      ctx.lineTo(p4.px, p4.py);
      ctx.stroke();
    }

    // 2. Draw 3D Orbiting Particles
    particles.forEach(pt => {
      pt.y -= pt.speed;
      if (pt.y < -80) pt.y = 80;
      const p = project(pt.x, pt.y, pt.z);
      ctx.beginPath();
      ctx.arc(p.px, p.py, pt.size * p.scale, 0, Math.PI * 2);
      ctx.fillStyle = pt.color;
      ctx.globalAlpha = Math.max(0.2, Math.min(0.85, p.scale));
      ctx.fill();
      ctx.globalAlpha = 1.0;
    });

    // 3. MODEL 1: 3D GLASS PRISM (Left Center, Cyan Refraction)
    if (activeFocus === 'all' || activeFocus === 'glass') {
      const gX = activeFocus === 'glass' ? 0 : -65;
      const gY = -10;
      const gS = 32;

      // Octahedron Prism Vertices
      const top = [gX, gY - gS, 0];
      const bottom = [gX, gY + gS, 0];
      const f1 = [gX - gS, gY, -gS];
      const f2 = [gX + gS, gY, -gS];
      const f3 = [gX + gS, gY, gS];
      const f4 = [gX - gS, gY, gS];

      const glassFill = 'rgba(56, 189, 248, 0.22)';
      const glassStroke = '#38bdf8';

      drawFace([top, f1, f2], glassFill, glassStroke, 1.5);
      drawFace([top, f2, f3], 'rgba(56, 189, 248, 0.28)', glassStroke, 1.5);
      drawFace([top, f3, f4], glassFill, glassStroke, 1.5);
      drawFace([top, f4, f1], 'rgba(56, 189, 248, 0.16)', glassStroke, 1.5);

      drawFace([bottom, f2, f1], 'rgba(2, 132, 199, 0.25)', '#0284c7', 1.2);
      drawFace([bottom, f3, f2], 'rgba(2, 132, 199, 0.32)', '#0284c7', 1.2);
      drawFace([bottom, f4, f3], 'rgba(2, 132, 199, 0.22)', '#0284c7', 1.2);
      drawFace([bottom, f1, f4], 'rgba(2, 132, 199, 0.18)', '#0284c7', 1.2);
    }

    // 4. MODEL 2: 3D HARDWOOD TIMBER BLOCK (Center, Rich Oak Grain)
    if (activeFocus === 'all' || activeFocus === 'wood') {
      const wX = activeFocus === 'wood' ? 0 : 0;
      const wY = 5;
      const wW = 28, wH = 34, wD = 28;

      const c = [
        [wX - wW, wY - wH, -wD], [wX + wW, wY - wH, -wD],
        [wX + wW, wY + wH, -wD], [wX - wW, wY + wH, -wD],
        [wX - wW, wY - wH, wD],  [wX + wW, wY - wH, wD],
        [wX + wW, wY + wH, wD],  [wX - wW, wY + wH, wD]
      ];

      // Cube Faces
      drawFace([c[0], c[1], c[2], c[3]], 'rgba(180, 83, 9, 0.45)', '#f59e0b', 1.5); // Back
      drawFace([c[4], c[5], c[6], c[7]], 'rgba(217, 119, 6, 0.65)', '#fbbf24', 1.5); // Front
      drawFace([c[0], c[1], c[5], c[4]], 'rgba(245, 158, 11, 0.55)', '#fcd34d', 1.5); // Top
      drawFace([c[3], c[2], c[6], c[7]], 'rgba(120, 53, 15, 0.65)', '#d97706', 1.2); // Bottom
      drawFace([c[0], c[3], c[7], c[4]], 'rgba(180, 83, 9, 0.5)', '#f59e0b', 1.2); // Left
      drawFace([c[1], c[2], c[6], c[5]], 'rgba(217, 119, 6, 0.55)', '#fbbf24', 1.2); // Right
    }

    // 5. MODEL 3: 3D STAINLESS STEEL BEAM (Right Center, Brushed Chrome)
    if (activeFocus === 'all' || activeFocus === 'steel') {
      const sX = activeFocus === 'steel' ? 0 : 68;
      const sY = -6;
      const rad = 26;
      const sH = 36;

      // Hexagonal Prism for Steel Cylinder
      const topHex = [];
      const botHex = [];
      for (let i = 0; i < 6; i++) {
        const ang = (i * Math.PI) / 3;
        topHex.push([sX + Math.cos(ang) * rad, sY - sH / 2, Math.sin(ang) * rad]);
        botHex.push([sX + Math.cos(ang) * rad, sY + sH / 2, Math.sin(ang) * rad]);
      }

      // Side Quads
      for (let i = 0; i < 6; i++) {
        const next = (i + 1) % 6;
        const shade = i % 2 === 0 ? 'rgba(148, 163, 184, 0.65)' : 'rgba(100, 116, 139, 0.55)';
        drawFace([topHex[i], topHex[next], botHex[next], botHex[i]], shade, '#e2e8f0', 1.3);
      }

      // Top Cap
      drawFace(topHex, 'rgba(203, 213, 225, 0.8)', '#ffffff', 1.5);
    }

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);

  // Mouse & Touch Controls
  const container = canvas.parentElement;

  container.addEventListener('mousemove', (e) => {
    if (isDragging) {
      const deltaX = e.clientX - startMouseX;
      const deltaY = e.clientY - startMouseY;
      targetRotY += deltaX * 0.008;
      targetRotX += deltaY * 0.008;
      startMouseX = e.clientX;
      startMouseY = e.clientY;
    } else {
      const rect = canvas.getBoundingClientRect();
      const normX = (e.clientX - rect.left) / rect.width - 0.5;
      const normY = (e.clientY - rect.top) / rect.height - 0.5;
      targetRotY = normX * 1.5;
      targetRotX = -normY * 1.0 - 0.2;
    }
  });

  container.addEventListener('mousedown', (e) => {
    isDragging = true;
    autoRotate = false;
    startMouseX = e.clientX;
    startMouseY = e.clientY;
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
    setTimeout(() => { autoRotate = true; }, 1800);
  });

  // Touch Support
  container.addEventListener('touchstart', (e) => {
    if (e.touches && e.touches[0]) {
      isDragging = true;
      autoRotate = false;
      startMouseX = e.touches[0].clientX;
      startMouseY = e.touches[0].clientY;
    }
  }, { passive: true });

  container.addEventListener('touchmove', (e) => {
    if (isDragging && e.touches && e.touches[0]) {
      const deltaX = e.touches[0].clientX - startMouseX;
      const deltaY = e.touches[0].clientY - startMouseY;
      targetRotY += deltaX * 0.012;
      targetRotX += deltaY * 0.012;
      startMouseX = e.touches[0].clientX;
      startMouseY = e.touches[0].clientY;
    }
  }, { passive: true });

  container.addEventListener('touchend', () => {
    isDragging = false;
    setTimeout(() => { autoRotate = true; }, 2000);
  });

  // Global material focus helper
  window.set3dFocus = function (mode) {
    activeFocus = mode;
    document.querySelectorAll('.mat-chip').forEach(c => c.classList.remove('active'));
    const btn = document.querySelector(`.mat-chip.mat-${mode}`);
    if (btn) btn.classList.add('active');
  };
})();
