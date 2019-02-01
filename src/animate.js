import React from '@react';

const easingFn = {
    linear: k => k,
    easeInQuad: k => Math.pow(k, 2),
    easeInCubic: k => Math.pow(k, 3),
    easeInQuart: k => Math.pow(k, 4),
    easeInQuint: k => Math.pow(k, 5)
};

const getRAF = () => {
    const basicRAF = cb => setTimeout(cb, 1000 / 60);
    let rAF = requestAnimationFrame || basicRAF;
    let cancelrAF = cancelAnimationFrame || clearTimeout;
    return { rAF, cancelrAF };
};

const { rAF, cancelrAF } = getRAF();

const getTime = () => Date.now();

class P extends React.Component {
    constructor(props) {
        super(props);
        this.easingFn = easingFn;
    }

    translate(x, y) {
        this.dot.style.transform = `translate(${x}px, ${y}px)`;
        this.dot.X = x;
        this.dot.Y = y;
    }

    animate({ destX, destY, duration = 1000, easingType = 'easeInQuad' }) {
        const startX = this.dot.X || 0;
        const startY = this.dot.Y || 0;
        const startTime = getTime();
        const destTime = startTime + duration;
        const step = () => {
            const now = getTime();
            const factor = this.easingFn[easingType]((now - startTime) / duration);
            const newX = (destX - startX) * factor + startX;
            const newY = (destY - startY) * factor + startY;

            if (now >= destTime) {
                this.isAnimating = false;
                this.translate(destX, destY);
                return;
            }
            console.log('FFFFF', newX, destX, startX, factor);
            this.translate(newX, newY);
            if (this.isAnimating) {
                cancelrAF(this.rAF);
                this.rAF = rAF(step);
            }
        };
        this.isAnimating = true;
        step();
    }

    componentDidMount() {
        window.dot = this.dot;
        window.h = this.translate.bind(this);
        window.t = this.animate.bind(this);
    }
    render() {
        return (
            <div className="page">
                <div ref={d => this.dot = d} className="dot"></div>
                <style jsx>{`
                    .page {
                        width: 100%;
                        height: 100%;
                    }
                    .dot {
                        width: 20px;
                        height: 20px;
                        border-radius: 50%;
                        background-color: red;
                    }
                `}</style>
            </div>
        );
    }
}

export default P;