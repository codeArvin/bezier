// 获取线段 AB 上某一点 C，使 AC / AB = ratio
const getRatioCoord = ({x:x1,y:y1}, {x:x2,y:y2}, ratio) => ({
    x: x1 + ratio * (x2 - x1),
    y: y1 + ratio * (y2 - y1)
});

// 根据 ratio，和初始控制点获得所有控制点的坐标
const getControlDots = (dots, ratio) => {
    const controlDots = [dots];
    let currentDots = dots;
    let len = dots.length;
    while (len > 1) {
        const d = [];
        for (let i = 0; i < len - 1; i++) {
            d.push(getRatioCoord(currentDots[i], currentDots[i + 1], ratio));
        }
        controlDots.push(d);
        currentDots = d;
        len--;
    }
    return controlDots;
};

// 获取贝塞尔曲线的坐标点
const getBezierCoords = (dots) => {
    const coords = [];
    let controlDots = [];
    const step = 0.001;
    let ratio = 0;
    while(ratio <= 1) {
        controlDots = getControlDots(dots, ratio);
        coords.push(controlDots.pop()[0]);
        ratio += step;
    }
    console.log('bezier coords count: ', coords.length, ratio);
    return coords;
};

const getRAF = () => {
    const basicRAF = cb => setTimeout(cb, 1000 / 60);
    let rAF = requestAnimationFrame || basicRAF;
    let cancelrAF = cancelAnimationFrame || clearTimeout;
    return {
        rAF,
        cancelrAF
    };
};

const debounce = (fn, wait = 100) => {
    var timer = null;
    return function () {
        var context = this;
        var args = arguments;
        if (timer) {
            clearTimeout(timer);
            timer = null;
        }
        timer = setTimeout(function () {
            fn.apply(context, args);
        }, wait);
    };
};

const getRandomColor = () => {
    return `#${(~~(Math.random() * (1 << 24))).toString(16)}`
};

const ease = {
    linear: k => k,
    easeInQuad: k => Math.pow(k, 2),
    easeInCubic: k => Math.pow(k, 3),
    easeInQuart: k => Math.pow(k, 4),
    easeInQuint: k => Math.pow(k, 5)
};

const getRatio = (time, duration, easingFn = ease.linear) => easingFn(time/duration);

const getTime = () => Date.now();

const getEmptyArr = (count) => {
    const arr = [];
    for (let i = 0; i < count; i++) {
        arr.push(i);
    }
    return arr;
};

const util = {
    getRatioCoord,
    getControlDots,
    getRAF,
    getBezierCoords,
    getRandomColor,
    ease,
    getRatio,
    getTime,
    getEmptyArr,
    debounce
};

export default util;