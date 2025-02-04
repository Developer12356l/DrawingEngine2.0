let color = '#000000';

const canvas = document.getElementById('c');
const { x: canvasX, y: canvasY } = canvas.getBoundingClientRect();
const ctx = canvas.getContext('2d');
ctx.strokeStyle = color;
ctx.lineWidth = 3;

/* Controls */
const clearBtn = document.getElementById('clear');
clearBtn.addEventListener('click', function() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});

const mode = document.getElementById('mode');
const saveBtn = document.getElementById('save');
const importBtn = document.getElementById('import');
const brushSize = document.getElementById('brushSize');
const colorPicker = document.getElementById('colorPicker');

let drawing = false;
let prevMousePosition;

saveBtn.addEventListener('click', saveDrawing);
importBtn.addEventListener('change', importDrawing);
brushSize.addEventListener('input', changeBrushSize);
colorPicker.addEventListener('input', changeColor);

function addStroke({ pageX, pageY }) {
    const x = pageX - canvasX;
    const y = pageY - canvasY;

    draw[mode.value](ctx, ...prevMousePosition, x, y);

    prevMousePosition = [x, y];
}

const draw = {
    boring(ctx, x0, y0, x1, y1) {
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
    },
    squiggles(ctx, x0, y0, x1, y1) {
        arc(ctx, [x0, y0], [x1, y1]);
    },
    wobbles(ctx, x0, y0, x1, y1) {
        const half = [x0 + (x1 - x0) / 2, y0 + (y1 - y0) / 2];
        arc(ctx, [x0, y0], half);
        arc(ctx, half, [x1, y1], true);
    },
    swirls(ctx, x0, y0, x1, y1) {
        const dx = x1 - x0,
            dy = y1 - y0;
        const part = [x0 - dx * .25, y0 - dy * .25];
        arc(ctx, [x0, y0], part);
        arc(ctx, part, [x1, y1]);
    },
    superSwirls(ctx, x0, y0, x1, y1) {
        const dx = x1 - x0,
            dy = y1 - y0;
        const part = [x0 - dx * 2, y0 - dy * 2];
        arc(ctx, [x0, y0], part);
        arc(ctx, part, [x1, y1]);
    }
};

for (const modeName in draw) {
    const option = document.createElement('option');
    option.textContent = modeName;
    mode.append(option);
}

function arc(ctx, start, end, flip = false) {
    diff = [end[0] - start[0], end[1] - start[1]];
    const theta = -1 * (Math.atan2(...diff) - Math.PI / 2);

    ctx.beginPath();
    ctx.moveTo(...start);
    ctx.arc(start[0] + diff[0] / 2, start[1] + diff[1] / 2, Math.sqrt(diff[0] ** 2 + diff[1] ** 2) / 2, theta + Math.PI, theta, flip);
    ctx.stroke();
}

function saveDrawing() {
    const dataURL = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = 'drawing.png';
    link.click();
}

function importDrawing(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
        img.src = e.target.result;
    }
    reader.readAsDataURL(file);
}

function changeBrushSize(event) {
    ctx.lineWidth = event.target.value;
}

function changeColor(event) {
    ctx.strokeStyle = event.target.value;
}

/* Canvas pointer events */
const [down, up, move, out] = (
    'onpointermove' in document.body ? ['pointerdown', 'pointerup', 'pointermove', 'pointerout'] :
    'ontouchmove' in document.body ? ['touchstart', 'touchend', 'touchmove', 'touchend'] : ['mousedown', 'mouseup', 'mousemove', 'mouseout']
);

canvas.addEventListener(down, drawMode_ACTIVATE);

function drawMode_ACTIVATE({ pageX, pageY }) {
    const x = pageX - canvasX;
    const y = pageY - canvasY;

    prevMousePosition = [x, y];

    canvas.addEventListener(move, addStroke);
    window.addEventListener(up, drawMode_DISENGAGE);
    window.addEventListener(out, drawMode_DISENGAGE);
    canvas.addEventListener(out, stopPropagation);
    document.body.addEventListener(out, stopPropagation);
}

function drawMode_DISENGAGE() {
    canvas.removeEventListener(move, addStroke);
    document.removeEventListener(up, drawMode_DISENGAGE);
    document.removeEventListener(out, drawMode_DISENGAGE);
    canvas.removeEventListener(out, stopPropagation);
    document.body.removeEventListener(out, stopPropagation);
}

function stopPropagation(e) {
    e.stopPropagation();
}
