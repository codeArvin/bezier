/**
 * 获取线段 AB 上某一点 C， 使 AC / AB = ratio
 * @param {Object} dot1 点 A
 * @param {Object} dot2 点 B
 * @param {Number} ratio 比例
 */
const getRatioCoord = ({x:x1,y:y1}, {x:x2,y:y2}, ratio) => ({
    x: x1 + ratio * (x2 - x1),
    y: y1 + ratio * (y2 - y1)
});

/**
 * 根据 ratio，和初始控制点获得所有控制点的坐标
 * @param {Array} dots [{x, y}, ...] 贝塞尔曲线最外层控制点
 * @param {Number} ratio 比例
 */
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

const FACTORIAL_CACHE = { '0': 1, '1': 1 };
/**
 * 阶乘，通过 cache 保存计算过的结果
 * @param {Number} n
 */
const factorial = function F(n) {
    const k = `${n}`;
    if (!FACTORIAL_CACHE[k]) {
        FACTORIAL_CACHE[k] = n * F(n - 1);
    }
    return FACTORIAL_CACHE[k];
};

const C_CACHE = {};
/**
 * 组合数
 * @param {Number} i
 * @param {Number} n
 */
const C = (i, n) => {
    const k = `${i}_${n}`;
    if (!C_CACHE[k]) {
        C_CACHE[k] = factorial(n) / (factorial(n - i) * factorial(i));
    }
    return C_CACHE[k];
};

/**
 * 根据控制点和比例求出当前贝塞尔曲线上的点
 * @param {Array} dots 控制点
 * @param {Number} ratio 比例
 */
const getBezierCoord = (dots, ratio) => {
    const n = dots.length - 1;
    let coord = { x: 0, y: 0 };
    for (let i = 0; i <= n; i++) {
        // console.log('TTT: ', i, n);
        coord.x += dots[i].x * C(i, n) * Math.pow((1 - ratio), n - i) * Math.pow(ratio, i);
        coord.y += dots[i].y * C(i, n) * Math.pow((1 - ratio), n - i) * Math.pow(ratio, i);
    }
    return coord;
};

/**
 * 获取贝塞尔曲线的坐标点
 * @param {Array} dots [{x, y}, ...] 贝塞尔曲线最外层控制点
 * @param {Boolean} sign true: 新方法，公式求 | false 老方法，控制点求
 */
const getBezierCoords = (dots, sign = false) => {
    // eslint-disable-next-line
    console.time(`${sign ? 'new': 'old'}`);
    const coords = [];
    const step = 0.001;
    let ratio = 0;
    while(ratio <= 1) {
        if (sign) {
            // 公式求，不直观、效率咋还低下来了?
            sign && coords.push(getBezierCoord(dots, ratio));
        } else {
            // 控制点求，直观，但为啥效率却比用公式求高?
            coords.push(getControlDots(dots, ratio).pop()[0]);
        }
        ratio = +(ratio + step).toFixed(3); // 精度处理
    }
    // eslint-disable-next-line
    console.timeEnd(`${sign ? 'new': 'old'}`);
    return coords;
};

/**
 * 获取 requestAnimationFrame、cancelAnimationFrame
 */
const getRAF = () => {
    const basicRAF = cb => setTimeout(cb, 1000 / 60);
    let rAF = requestAnimationFrame || basicRAF;
    let cancelrAF = cancelAnimationFrame || clearTimeout;
    return {
        rAF,
        cancelrAF
    };
};

/**
 * 防抖函数
 * @param {Function} fn 需要添加防抖的函数
 * @param {Number} wait 防抖时间
 */
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

/**
 * 获取随机颜色值
 */
const getRandomColor = () => {
    return `#${(~~(Math.random() * (1 << 24))).toString(16)}`;
};

/**
 * 缓动函数的 factor
 * start(起点)、end(终点)、time(当前时间)、duration(运动总时间)
 * 则当前位置 = (end - start) * factor(time / duration) + start
 */
const ease = {
    linear: k => k,
    easeInQuad: k => Math.pow(k, 2),
    easeInCubic: k => Math.pow(k, 3),
    easeInQuart: k => Math.pow(k, 4),
    easeInQuint: k => Math.pow(k, 5)
};

/**
 * 获取当前时刻所需的 ratio
 * @param {Number} time 当前时间
 * @param {Number} duration 动画时长
 * @param {Function} easingFn 缓动函数的 factor
 */
const getRatio = (time, duration, easingFn = ease.linear) => easingFn(time/duration);

/**
 * 返回当前时间
 */
const getTime = () => Date.now();

/**
 * 返回给定长度的数组，数组元素为 0, 1, 2, ...
 * @param {Number} count 数组长度
 */
const getEmptyArr = (count) => {
    const arr = [];
    for (let i = 0; i < count; i++) {
        arr.push(i);
    }
    return arr;
};

/**
 * 获取 dom 元素相对页面左/上边缘的距离
 * @param {HTMLElement} dom DOM 元素
 */
const getOffset = (dom) => {
    let parent = dom;
    let left = 0;
    let top = 0;
    while (parent) {
        left += parent.offsetLeft;
        top += parent.offsetTop;
        parent = parent.offsetParent;
    }
    return { left, top };
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
    debounce,
    getOffset
};

export default util;
