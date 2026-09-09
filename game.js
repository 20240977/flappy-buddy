const canvas = document.querySelector("#gameCanvas");
const ctx = canvas.getContext("2d");

function drawBackdrop(time = 0) {
  const { width, height } = canvas;
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "#102c40");
  gradient.addColorStop(0.58, "#0d2232");
  gradient.addColorStop(1, "#07141f");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "rgba(151, 206, 219, .42)";
  for (let i = 0; i < 70; i += 1) {
    const x = (i * 137 + time * (i % 4) * 0.002) % width;
    const y = (i * 83) % (height * 0.8);
    const size = i % 9 === 0 ? 2 : 1;
    ctx.fillRect(x, y, size, size);
  }

  ctx.fillStyle = "rgba(35, 69, 83, .64)";
  for (let i = 0; i < 8; i += 1) {
    const x = i * 150 - 60;
    const tower = 85 + (i % 3) * 40;
    ctx.fillRect(x, height - tower, 96, tower);
    ctx.fillRect(x + 20, height - tower - 28, 12, 28);
  }

  ctx.fillStyle = "#08141d";
  ctx.fillRect(0, height - 35, width, 35);
  ctx.fillStyle = "rgba(200, 255, 49, .16)";
  ctx.fillRect(0, height - 36, width, 1);
}

drawBackdrop();
