import React, { Component } from 'react';
import classNames from 'classnames';
import util from '../util';
import { Slider, List } from 'antd';

const PRIMARY_COLOR_ENHANCE = 'rgba(33, 150, 243, 1)'; // 主题色-强调
const PRIMARY_COLOR = 'rgba(140, 200, 255, 1)'; // 主题色
const PRIMARY_COLOR_LIGHT = 'rgba(140, 200, 255, 0.3)'; // 主题色-淡
const DISABLE_COLOR = '#f5f5f5'; // disable 色
const DISABLE_COLOR_ENHANCE = '#b7b7b7'; // disable 色-强调

const PANEL_WIDTH = 450; // panel 宽度
const CANVAS_MARGIN = 10; // canvas 默认外边距
const CONTROL_DOTS_RANGE = [3, 20]; // 贝塞尔曲线控制点范围
const DURATION_RANGE = [1000, 10000]; // 动画时长范围
const DOT_RADIUS = 4; // 默认点半径
const COLOR = PRIMARY_COLOR_ENHANCE; // 控制点/线默认颜色
const LINE_WIDTH = 2; // 默认线宽
const LINE_CAP = 'butt'; // 默认线末端样式
const BEZIER_LINE_WIDTH = 4; // 贝塞尔曲线线宽
const BEZIER_LINE_CAP = 'round'; // 贝塞尔曲线末端样式
const BEZIER_COLOR = '#ff5722'; // 贝塞尔曲线颜色
const DEFAULT_COUNT = 3; // 贝塞尔曲线控制点个数默认值
const DEFAULT_DURATION = 2000; // 动画时长默认值
const DEFAULT_EASING_TYPE = 'linear'; // 动画效果默认值

const { rAF } = util.getRAF();
class Bezier extends Component {
    constructor(props) {
        super(props);

        this.state = {
            isAnimating: false // 是否处于生成贝塞尔曲线的动画中
        };

        this.canvas = null; // canvas dom
        this.ctx = null; // canvas 渲染上下文
        this.canvasDetail = null; // 显示 detail 的 canvas dom
        this.ctxd = null; // canvas detail 渲染上下文
        this.imageData = null; // canvas 画布信息
        this.canvasWidth = window.innerWidth - PANEL_WIDTH; // canvas width
        this.canvasHeight = window.innerHeight - 20; // canvas height
        this.count = DEFAULT_COUNT; // 贝塞尔曲线控制点个数
        this.dots = []; // 贝塞尔曲线控制点坐标
        this.controlDots = []; // 贝塞尔曲线所有控制点坐标
        this.colors = []; // 贝塞尔曲线控制点颜色
        this.ratio = 0; // 生成贝塞尔曲线所需的比例系数 [0, 1]
        this.targetIndex = null; // 当前选中的外层控制点的 index
        this.bezierCoords = []; // 贝塞尔曲线坐标
        this.duration = DEFAULT_DURATION; // 生成贝塞尔曲线的动画时长
        this.easingType = DEFAULT_EASING_TYPE; // 生成贝塞尔曲线的动画效果

        this.windowResize = util.debounce(this.windowResize, 100);
    }

    componentDidMount() {
        this.ctx = this.canvas.getContext('2d');
        this.ctxd = this.canvasDetail.getContext('2d');
        window.addEventListener('resize', this.windowResize); // 加上防抖
    }

    componentDidUpdate() {
        // 恢复上次的状态
        this.imageData && this.ctx.putImageData(this.imageData, 0, 0);
        this.imageData = null;
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.windowResize);
    }

    // window 大小改变时，更新 canvasWidth、canvasHeight
    windowResize = () => {
        this.canvasWidth = window.innerWidth - PANEL_WIDTH;
        this.canvasHeight = window.innerHeight - 20;
        // 只有在 canvas 大小变化的时候需要保存当前画布信息
        this.imageData = this.ctx.getImageData(0, 0, this.canvasWidth, this.canvasHeight);
        this.update();
    }

    // 绘制点
    drawDot = ({ x, y, radius = DOT_RADIUS, color = COLOR }) => {
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
    }

    // 绘制线
    drawLine = ({
        beginDot,
        endDot,
        lineWidth = LINE_WIDTH,
        lineCap = LINE_CAP,
        color = COLOR
    }) => {
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.moveTo(beginDot.x, beginDot.y);
        ctx.lineTo(endDot.x, endDot.y);
        ctx.closePath();
        ctx.lineWidth = lineWidth;
        ctx.lineCap = lineCap;
        ctx.strokeStyle = color;
        ctx.stroke();
    }

    // 绘制控制点, isAll=true 绘制全部；isAll=false 绘制最外层
    drawControlDots = (isAll = true) => {
        if (isAll) {
            this.controlDots.forEach((dots, index) => {
                const color = this.colors[index];
                dots.forEach((dot, i) => {
                    if (i !== 0) {
                        this.drawLine({
                            beginDot: dots[i - 1],
                            endDot: dot,
                            color
                        });
                    }
                    this.drawDot({
                        x: dot.x,
                        y: dot.y,
                        color
                    });
                });
            });
        } else {
            this.dots.forEach((dot, i) => {
                if (i !== 0) {
                    this.drawLine({
                        beginDot: this.dots[i - 1],
                        endDot: dot
                    });
                }
                this.drawDot({
                    x: dot.x,
                    y: dot.y
                });
            });
        }
    }

    // 绘制贝塞尔曲线，isAll=true，绘制全部；isAll=false，根据 ratio 按比例绘制
    drawBezier = (isAll = true) => {
        const ratio = isAll ? 1 : this.ratio;
        const len = this.bezierCoords.length;
        const coords = this.bezierCoords.filter((c, i) => i / len <= ratio);
        const { x, y } = coords.shift();
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.moveTo(x, y);
        coords.forEach(({x,y}) => {
            ctx.lineTo(x, y);
        });
        ctx.strokeStyle = BEZIER_COLOR;
        ctx.lineWidth = BEZIER_LINE_WIDTH;
        ctx.lineCap = BEZIER_LINE_CAP;
        ctx.stroke();
    }

    // 开始生成贝塞尔曲线
    beginDrawing = () => {
        this.bezierCoords = util.getBezierCoords(this.dots);
        const startTime = util.getTime();
        const destTime = startTime + this.duration;
        this.colors = util.getEmptyArr(this.count).map(i => i === 0 ? COLOR : util.getRandomColor());
        const step = () => {
            const now = util.getTime();
            if (now >= destTime) {
                this.ratio = 1;
            } else {
                this.ratio = util.getRatio(now - startTime, this.duration, util.ease[this.easingType]);
            }
            // 更新控制点
            this.controlDots = util.getControlDots(this.dots, this.ratio);
            this.clear();
            this.drawControlDots();
            this.drawBezier(false);
            if (now >= destTime) {
                this.clear();
                this.drawDotsAndBezier();
                this.setState({ isAnimating: false });
                return;
            }
            rAF(step);
        };
        this.setState({ isAnimating: true });
        step();
    }

    // 只绘制最外层控制点和贝塞尔曲线
    drawDotsAndBezier = () => {
        this.drawControlDots(false);
        this.drawBezier();
    }

    // 绘制 detail，包括 dots
    drawDetail = () => {
        const ctxd = this.ctxd;
        ctxd.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        ctxd.font = '20px Arial';
        ctxd.fillStyle = PRIMARY_COLOR_ENHANCE;
        this.dots.forEach(({ x, y }, i) => {
            ctxd.fillText(`[${x}, ${y}]`, 10, 25 * (i + 1));
        });
    }

    // 清空 canvas 画布
    clear = () => {
        this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    }

    // 更新视图，因为没有使用 this.state
    update = () => {
        this.setState({});
    }

    handleCanvasMouseDown = (e) => {
        const { left, top } = util.getOffset(this.canvas);
        const _x = e.pageX - left;
        const _y = e.pageY - top;
        const len = this.dots.length;
        if (len < this.count) {
            // 控制点数不够，继续绘制
            const curCoord = { x: _x, y: _y };
            this.dots.push(curCoord);
            this.drawDot(curCoord);
            if (len !== 0) {
                this.drawLine({
                    beginDot: this.dots[len - 1],
                    endDot: curCoord
                });
            }
            this.drawDetail();
            // 如果是最后一个点，开始动画
            if (len + 1 === this.count) {
                this.beginDrawing();
            }
        } else {
            // 确定点击外层控制点的 index
            if (this.state.isAnimating) { return; }
            for (let i = 0; i < this.dots.length; i++) {
                const { x, y } = this.dots[i];
                const distance = Math.sqrt(Math.pow(x - _x, 2) + Math.pow(y - _y, 2));
                if (distance <= 6) {
                    this.targetIndex = i;
                    break;
                }
            }
        }
    }

    handleCanvasMouseMove = (e) => {
        if (this.targetIndex === null) { return; }
        const { left, top } = util.getOffset(this.canvas);
        this.dots[this.targetIndex] = {
            x: e.pageX - left,
            y: e.pageY - top
        };
        this.clear();
        this.bezierCoords = util.getBezierCoords(this.dots);
        this.drawDotsAndBezier();
    }

    handleCanvasMouseUp = () => {
        this.targetIndex = null;
    }

    handleConfigChange = (type, value) => {
        if (this.state.isAnimating) { return; }
        switch (type) {
            case 'controlDot':
                this.count = value;
                break;
            case 'duration':
                this.duration = value;
                break;
            case 'easingType':
                this.easingType = value;
                break;
            default:
                return;
        }
        this.dots = [];
        this.controlDots = [];
        this.colors = [];
        this.ratio = 0;
        this.bezierCoords = [];
        this.ctxd.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        this.clear();
        this.update();
    }

    listRender = (item) => {
        const className = classNames({
            'easing-list-item': true,
            'disable': this.state.isAnimating,
            'active': item === this.easingType
        });
        return (
            <List.Item
                className={className}
                onClick={this.handleConfigChange.bind(this, 'easingType', item)}
            >
                <div style={{margin: '0 auto'}}>{item}</div>
            </List.Item>
        );
    }

    render() {
        return (
            <div className="App">
                <div className="panel">
                    <div className="App-title">贝塞尔曲线</div>
                    <div className="control">
                        <div className="title">控制点个数：{this.count}</div>
                        <Slider
                            dots={true}
                            min={CONTROL_DOTS_RANGE[0]}
                            max={CONTROL_DOTS_RANGE[1]}
                            step={1}
                            value={this.count}
                            onChange={this.handleConfigChange.bind(this, 'controlDot')}
                            disabled={this.state.isAnimating}
                        />
                    </div>
                    <div className="duration">
                        <div className="title">动画时长：{this.duration / 1000}s</div>
                        <Slider
                            dots={true}
                            min={DURATION_RANGE[0]}
                            max={DURATION_RANGE[1]}
                            step={1000}
                            value={this.duration}
                            onChange={this.handleConfigChange.bind(this, 'duration')}
                            disabled={this.state.isAnimating}
                        />
                    </div>
                    <div className="animate">
                        <div className="title">动画效果：{this.easingType}</div>
                        <List
                            className="easing-list"
                            bordered={true}
                            size="small"
                            dataSource={Object.keys(util.ease)}
                            renderItem={this.listRender}
                        />
                    </div>
                </div>
                <div className="canvas">
                    <canvas
                        width={`${this.canvasWidth}px`}
                        height={`${this.canvasHeight}px`}
                        ref={c => this.canvasDetail = c}
                    >
                        你的浏览器不支持 canvas， 请升级你的浏览器。
                    </canvas>
                    <canvas
                        width={`${this.canvasWidth}px`}
                        height={`${this.canvasHeight}px`}
                        ref={c => this.canvas = c}
                        onMouseDown={this.handleCanvasMouseDown}
                        onMouseMove={this.handleCanvasMouseMove}
                        onMouseUp={this.handleCanvasMouseUp}
                    >
                        你的浏览器不支持 canvas， 请升级你的浏览器。
                    </canvas>
                </div>
                <style jsx="true">{`
                    .App {
                        overflow: hidden;
                        display: flex;
                        flex-direction: row;
                        height: 100%;
                    }
                    .App-title {
                        font-size: 30px;
                        font-weight: bolder;
                        color: ${PRIMARY_COLOR_ENHANCE};
                        margin-bottom: 20px;
                    }
                    .panel {
                        width: ${PANEL_WIDTH}px;
                        height: 100%;
                        display: flex;
                        flex-direction: column;
                        padding-left: 20px;
                        padding-top: 20px;
                    }
                    .control, .duration {
                        width: 400px;
                    }
                    .title {
                        color: ${PRIMARY_COLOR_ENHANCE};
                        font-size: 16px;
                        font-weight: bold;
                    }
                    .easing-list {
                        margin-top: 10px;
                        width: 200px;
                        overflow: scroll;
                    }
                    .easing-list-item {
                        transition: all 0.5s;
                        color: ${PRIMARY_COLOR_ENHANCE};
                    }
                    .easing-list-item:not(.disable):hover {
                        background-color: ${PRIMARY_COLOR_LIGHT};
                        cursor: pointer;
                    }
                    .easing-list-item.disable:hover {
                        cursor: not-allowed;
                    }
                    .disable {
                        background-color: ${DISABLE_COLOR};
                        color: ${DISABLE_COLOR_ENHANCE};
                    }
                    .active {
                        background-color: ${PRIMARY_COLOR_LIGHT};
                    }
                    .canvas {
                        margin: 0 ${CANVAS_MARGIN}px;
                        border: 1px solid ${PRIMARY_COLOR};
                        border-radius: 5px;
                        box-shadow: 0 0 5px 1px ${PRIMARY_COLOR};
                        align-self: center;
                        position: relative;
                        line-height: 0;
                    }
                    .canvas canvas:last-child {
                        position: absolute;
                        top: 0;
                        left: 0;
                    }
                `}</style>
            </div>
        );
    }
}

export default Bezier;