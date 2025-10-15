///<reference path="../../src/types/declaration/core.d.ts" />

/**
 * ui.js：负责所有和UI界面相关的绘制
 * 包括：
 * 自动寻路、怪物手册、楼传器、存读档、菜单栏、NPC对话事件、等等
 */

'use strict';

function ui() {
    this._init();
}

// 初始化UI
ui.prototype._init = function () {
    this.uidata = functions_d6ad677b_427a_4623_b50f_a445a3b0ef8a.ui;
};

////////////////// 地图设置

ui.prototype.getContextByName = function (name) {
    if (name instanceof HTMLCanvasElement) return name.getContext('2d');
    var canvas = name;
    if (typeof name == 'string') {
        if (core.canvas[name]) canvas = core.canvas[name];
        else if (core.dymCanvas[name]) canvas = core.dymCanvas[name];
    }
    if (canvas && canvas.canvas) {
        return canvas;
    }
    return null;
};

ui.prototype._createUIEvent = function () {
    if (main.mode == 'editor') return;
    if (!core.dymCanvas['uievent']) {
        core.createCanvas('uievent', 0, 0, core._PX_, core._PY_, 135);
    }
};

////// 清除地图 //////
ui.prototype.clearMap = function (name, x, y, width, height) {
    if (name == 'all') {
        for (var m in core.canvas) {
            core.canvas[m].clearRect(
                -32,
                -32,
                core.canvas[m].canvas.width + 32,
                core.canvas[m].canvas.height + 32
            );
        }
        core.removeGlobalAnimate();
        core.deleteCanvas(function (one) {
            return one.startsWith('_bigImage_');
        });
        core.setWeather(null);
    } else {
        var ctx = this.getContextByName(name);
        if (ctx) {
            if (x != null && y != null && width != null && height != null) {
                ctx.clearRect(x, y, width, height);
            } else {
                ctx.clearRect(
                    -32,
                    -32,
                    ctx.canvas.width + 32,
                    ctx.canvas.height + 32
                );
            }
        }
    }
};

ui.prototype._uievent_clearMap = function (data) {
    if (
        main.mode != 'editor' &&
        (data.x == null ||
            data.y == null ||
            data.width == null ||
            data.height == null)
    ) {
        this.deleteCanvas('uievent');
        return;
    }
    this._createUIEvent();
    this.clearMap(
        'uievent',
        core.calValue(data.x),
        core.calValue(data.y),
        core.calValue(data.width),
        core.calValue(data.height)
    );
};

////// 在某个canvas上绘制一段文字 //////
ui.prototype.fillText = function (name, text, x, y, style, font, maxWidth) {
    if (style) core.setFillStyle(name, style);
    if (font) core.setFont(name, font);
    var ctx = this.getContextByName(name);
    if (!ctx) return;
    text = (text + '').replace(/\\r/g, '\r');
    var originText = text.replace(/\r(\[.*\])?/g, '');
    var index = text.indexOf('\r');
    if (maxWidth != null) {
        this.setFontForMaxWidth(ctx, index >= 0 ? originText : text, maxWidth);
    }
    if (index >= 0) {
        var currentStyle = ctx.fillStyle;
        var textWidth = core.calWidth(ctx, originText);
        var textAlign = ctx.textAlign;
        if (textAlign == 'center') x -= textWidth / 2;
        else if (textAlign == 'right') x -= textWidth;
        ctx.textAlign = 'left';
        text = text.replace(/\r(?!\[.*\])/g, '\r[' + currentStyle + ']');
        var colorArray = text.match(/\r\[.*?\]/g);
        var textArray = text.split(/\r\[.*?\]/);
        var width = 0;
        for (var i = 0; i < textArray.length; i++) {
            var subtext = textArray[i];
            if (colorArray[i - 1])
                ctx.fillStyle = colorArray[i - 1].slice(2, -1);
            ctx.fillText(subtext, x + width, y);
            width += core.calWidth(ctx, subtext, x, y);
        }
        ctx.textAlign = textAlign;
        ctx.fillStyle = currentStyle;
    } else {
        ctx.fillText(text, x, y);
    }
};

ui.prototype._uievent_fillText = function (data) {
    this._createUIEvent();
    this.fillText(
        'uievent',
        core.replaceText(data.text),
        core.calValue(data.x),
        core.calValue(data.y),
        data.style,
        data.font,
        data.maxWidth
    );
};

////// 自适配字体大小
ui.prototype.setFontForMaxWidth = function (name, text, maxWidth, font) {
    var ctx = this.getContextByName(name);
    if (font) core.setFont(name, font);
    var font = ctx.font,
        u = /(\d+)px/.exec(font);
    if (u == null) return;
    for (var font_size = parseInt(u[1]); font_size >= 8; font_size--) {
        ctx.font = font.replace(/(\d+)px/, font_size + 'px');
        if (ctx.measureText(text).width <= maxWidth) return;
    }
};

////// 在某个canvas上绘制粗体 //////
ui.prototype.fillBoldText = function (
    name,
    text,
    x,
    y,
    style,
    strokeStyle,
    font,
    maxWidth
) {
    var ctx = this.getContextByName(name);
    if (!ctx) return;
    if (font) ctx.font = font;
    if (!style) style = ctx.fillStyle;
    style = core.arrayToRGBA(style);
    strokeStyle ??= '#000';
    strokeStyle = core.arrayToRGBA(strokeStyle);
    if (maxWidth != null) {
        this.setFontForMaxWidth(ctx, text, maxWidth);
    }
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth =
        1.5 *
        (core.domStyle.isVertical ? core.domStyle.ratio : core.domStyle.scale);
    ctx.fillStyle = style;
    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);
};

ui.prototype._uievent_fillBoldText = function (data) {
    this._createUIEvent();
    this.fillBoldText(
        'uievent',
        core.replaceText(data.text),
        core.calValue(data.x),
        core.calValue(data.y),
        data.style,
        data.strokeStyle,
        data.font
    );
};

////// 在某个canvas上绘制一个矩形 //////
ui.prototype.fillRect = function (name, x, y, width, height, style, angle) {
    if (style) core.setFillStyle(name, style);
    var ctx = this.getContextByName(name);
    if (ctx) {
        if (angle) {
            ctx.save();
            ctx.translate(x + width / 2, y + height / 2);
            ctx.rotate(angle);
            ctx.translate(-x - width / 2, -y - height / 2);
        }
        ctx.fillRect(x, y, width, height);
        if (angle) {
            ctx.restore();
        }
    }
};

ui.prototype._uievent_fillRect = function (data) {
    this._createUIEvent();
    if (data.radius) {
        this.fillRoundRect(
            'uievent',
            core.calValue(data.x),
            core.calValue(data.y),
            core.calValue(data.width),
            core.calValue(data.height),
            core.calValue(data.radius),
            data.style,
            ((core.calValue(data.angle) || 0) * Math.PI) / 180
        );
    } else {
        this.fillRect(
            'uievent',
            core.calValue(data.x),
            core.calValue(data.y),
            core.calValue(data.width),
            core.calValue(data.height),
            data.style,
            ((core.calValue(data.angle) || 0) * Math.PI) / 180
        );
    }
};

////// 在某个canvas上绘制一个矩形的边框 //////
ui.prototype.strokeRect = function (
    name,
    x,
    y,
    width,
    height,
    style,
    lineWidth,
    angle
) {
    if (style) core.setStrokeStyle(name, style);
    if (lineWidth) core.setLineWidth(name, lineWidth);
    var ctx = this.getContextByName(name);
    if (ctx) {
        if (angle) {
            ctx.save();
            ctx.translate(x + width / 2, y + height / 2);
            ctx.rotate(angle);
            ctx.translate(-x - width / 2, -y - height / 2);
        }
        ctx.strokeRect(x, y, width, height);
        if (angle) {
            ctx.restore();
        }
    }
};

ui.prototype._uievent_strokeRect = function (data) {
    this._createUIEvent();
    if (data.radius) {
        this.strokeRoundRect(
            'uievent',
            core.calValue(data.x),
            core.calValue(data.y),
            core.calValue(data.width),
            core.calValue(data.height),
            core.calValue(data.radius),
            data.style,
            data.lineWidth,
            ((core.calValue(data.angle) || 0) * Math.PI) / 180
        );
    } else {
        this.strokeRect(
            'uievent',
            core.calValue(data.x),
            core.calValue(data.y),
            core.calValue(data.width),
            core.calValue(data.height),
            data.style,
            data.lineWidth,
            ((core.calValue(data.angle) || 0) * Math.PI) / 180
        );
    }
};

////// 在某个canvas上绘制一个圆角矩形 //////
ui.prototype.fillRoundRect = function (
    name,
    x,
    y,
    width,
    height,
    radius,
    style,
    angle
) {
    if (style) core.setFillStyle(name, style);
    var ctx = this.getContextByName(name);
    if (ctx) {
        if (angle) {
            ctx.save();
            ctx.translate(x + width / 2, y + height / 2);
            ctx.rotate(angle);
            ctx.translate(-x - width / 2, -y - height / 2);
        }
        this._roundRect_buildPath(ctx, x, y, width, height, radius);
        ctx.fill();
        if (angle) {
            ctx.restore();
        }
    }
};

////// 在某个canvas上绘制一个圆角矩形的边框 //////
ui.prototype.strokeRoundRect = function (
    name,
    x,
    y,
    width,
    height,
    radius,
    style,
    lineWidth,
    angle
) {
    if (style) core.setStrokeStyle(name, style);
    if (lineWidth) core.setLineWidth(name, lineWidth);
    var ctx = this.getContextByName(name);
    if (ctx) {
        if (angle) {
            ctx.save();
            ctx.translate(x + width / 2, y + height / 2);
            ctx.rotate(angle);
            ctx.translate(-x - width / 2, -y - height / 2);
        }
        this._roundRect_buildPath(ctx, x, y, width, height, radius);
        ctx.stroke();
        if (angle) {
            ctx.restore();
        }
    }
};

ui.prototype._roundRect_buildPath = function (
    ctx,
    x,
    y,
    width,
    height,
    radius
) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
};

////// 在某个canvas上绘制一个多边形 //////
ui.prototype.fillPolygon = function (name, nodes, style) {
    if (style) core.setFillStyle(name, style);
    var ctx = this.getContextByName(name);
    if (!ctx) return;
    if (!nodes || nodes.length < 3) return;
    ctx.beginPath();
    for (var i = 0; i < nodes.length; ++i) {
        var x = core.calValue(nodes[i][0]),
            y = core.calValue(nodes[i][1]);
        if (i == 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
};

ui.prototype._uievent_fillPolygon = function (data) {
    this._createUIEvent();
    this.fillPolygon('uievent', data.nodes, data.style);
};

////// 在某个canvas上绘制一个多边形的边框 //////
ui.prototype.strokePolygon = function (name, nodes, style, lineWidth) {
    if (style) core.setStrokeStyle(name, style);
    if (lineWidth) core.setLineWidth(name, lineWidth);
    var ctx = this.getContextByName(name);
    if (!ctx) return;
    if (!nodes || nodes.length < 3) return;
    ctx.beginPath();
    for (var i = 0; i < nodes.length; ++i) {
        var x = core.calValue(nodes[i][0]),
            y = core.calValue(nodes[i][1]);
        if (i == 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
};

ui.prototype._uievent_strokePolygon = function (data) {
    this._createUIEvent();
    this.strokePolygon('uievent', data.nodes, data.style, data.lineWidth);
};

////// 在某个canvas上绘制一个椭圆 //////
ui.prototype.fillEllipse = function (name, x, y, a, b, angle, style) {
    if (style) core.setFillStyle(name, style);
    var ctx = this.getContextByName(name);
    if (!ctx) return;
    ctx.beginPath();
    ctx.ellipse(x, y, a, b, angle, 0, 2 * Math.PI);
    ctx.fill();
};

ui.prototype.fillCircle = function (name, x, y, r, style) {
    return this.fillEllipse(name, x, y, r, r, 0, style);
};

ui.prototype._uievent_fillEllipse = function (data) {
    this._createUIEvent();
    this.fillEllipse(
        'uievent',
        core.calValue(data.x),
        core.calValue(data.y),
        core.calValue(data.a),
        core.calValue(data.b),
        ((core.calValue(data.angle) || 0) * Math.PI) / 180,
        data.style
    );
};

////// 在某个canvas上绘制一个圆的边框 //////
ui.prototype.strokeEllipse = function (
    name,
    x,
    y,
    a,
    b,
    angle,
    style,
    lineWidth
) {
    if (style) core.setStrokeStyle(name, style);
    if (lineWidth) core.setLineWidth(name, lineWidth);
    var ctx = this.getContextByName(name);
    if (!ctx) return;
    ctx.beginPath();
    ctx.ellipse(x, y, a, b, angle, 0, 2 * Math.PI);
    ctx.stroke();
};

ui.prototype.strokeCircle = function (name, x, y, r, style, lineWidth) {
    return this.strokeEllipse(name, x, y, r, r, 0, style, lineWidth);
};

ui.prototype._uievent_strokeEllipse = function (data) {
    this._createUIEvent();
    this.strokeEllipse(
        'uievent',
        core.calValue(data.x),
        core.calValue(data.y),
        core.calValue(data.a),
        core.calValue(data.b),
        ((core.calValue(data.angle) || 0) * Math.PI) / 180,
        data.style,
        data.lineWidth
    );
};

ui.prototype.fillArc = function (name, x, y, r, start, end, style) {
    if (style) core.setFillStyle(name, style);
    var ctx = this.getContextByName(name);
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, r, start, end);
    ctx.closePath();
    ctx.fill();
};

ui.prototype._uievent_fillArc = function (data) {
    this._createUIEvent();
    this.fillArc(
        'uievent',
        core.calValue(data.x),
        core.calValue(data.y),
        core.calValue(data.r),
        ((core.calValue(data.start) || 0) * Math.PI) / 180,
        ((core.calValue(data.end) || 0) * Math.PI) / 180,
        data.style
    );
};

ui.prototype.strokeArc = function (
    name,
    x,
    y,
    r,
    start,
    end,
    style,
    lineWidth
) {
    if (style) core.setStrokeStyle(name, style);
    if (lineWidth) core.setLineWidth(name, lineWidth);
    var ctx = this.getContextByName(name);
    if (!ctx) return;
    ctx.beginPath();
    ctx.arc(x, y, r, start, end);
    ctx.stroke();
};

ui.prototype._uievent_strokeArc = function (data) {
    this._createUIEvent();
    this.strokeArc(
        'uievent',
        core.calValue(data.x),
        core.calValue(data.y),
        core.calValue(data.r),
        ((core.calValue(data.start) || 0) * Math.PI) / 180,
        ((core.calValue(data.end) || 0) * Math.PI) / 180,
        data.style,
        data.lineWidth
    );
};

////// 在某个canvas上绘制一条线 //////
ui.prototype.drawLine = function (name, x1, y1, x2, y2, style, lineWidth) {
    if (style) core.setStrokeStyle(name, style);
    if (lineWidth != null) core.setLineWidth(name, lineWidth);
    var ctx = this.getContextByName(name);
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
};

ui.prototype._uievent_drawLine = function (data) {
    this._createUIEvent();
    this.drawLine(
        'uievent',
        core.calValue(data.x1),
        core.calValue(data.y1),
        core.calValue(data.x2),
        core.calValue(data.y2),
        data.style,
        data.lineWidth
    );
};

////// 在某个canvas上绘制一个箭头 //////
ui.prototype.drawArrow = function (name, x1, y1, x2, y2, style, lineWidth) {
    if (x1 == x2 && y1 == y2) return;
    if (style) core.setStrokeStyle(name, style);
    if (lineWidth != null) core.setLineWidth(name, lineWidth);
    var ctx = this.getContextByName(name);
    if (!ctx) return;
    var head = 10;
    var dx = x2 - x1,
        dy = y2 - y1;
    var angle = Math.atan2(dy, dx);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(
        x2 - head * Math.cos(angle - Math.PI / 6),
        y2 - head * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(x2, y2);
    ctx.lineTo(
        x2 - head * Math.cos(angle + Math.PI / 6),
        y2 - head * Math.sin(angle + Math.PI / 6)
    );
    ctx.stroke();
};

ui.prototype._uievent_drawArrow = function (data) {
    this._createUIEvent();
    this.drawArrow(
        'uievent',
        core.calValue(data.x1),
        core.calValue(data.y1),
        core.calValue(data.x2),
        core.calValue(data.y2),
        data.style,
        data.lineWidth
    );
};

////// 设置某个canvas的文字字体 //////
/**
 * @param {CtxRefer} name
 * @param {string} font
 */
ui.prototype.setFont = function (name, font) {
    var ctx = this.getContextByName(name);
    if (ctx) {
        ctx.font = font;
    }
};

////// 设置某个canvas的线宽度 //////
ui.prototype.setLineWidth = function (name, lineWidth) {
    var ctx = this.getContextByName(name);
    if (ctx) {
        ctx.lineWidth = lineWidth;
    }
};

////// 保存某个canvas状态 //////
ui.prototype.saveCanvas = function (name) {
    var ctx = this.getContextByName(name);
    if (ctx) ctx.save();
};

////// 加载某个canvas状态 //////
ui.prototype.loadCanvas = function (name) {
    var ctx = this.getContextByName(name);
    if (ctx) ctx.restore();
};

////// 设置某个canvas的alpha值，并返回设置之前的alpha值 //////
ui.prototype.setAlpha = function (name, alpha) {
    var ctx = this.getContextByName(name);
    if (!ctx) return null;
    var previousAlpha = ctx.globalAlpha;
    ctx.globalAlpha = alpha;
    return previousAlpha;
};

////// 设置某个canvas的透明度；尽量不要使用本函数，而是全部换成setAlpha实现 //////
ui.prototype.setOpacity = function (name, opacity) {
    var ctx = this.getContextByName(name);
    if (ctx) ctx.canvas.style.opacity = opacity;
};

////// 设置某个canvas的filter //////
ui.prototype.setFilter = function (name, filter) {
    var ctx = this.getContextByName(name);
    if (!ctx) return;
    if (!filter) ctx.filter = 'none';
    else if (typeof filter === 'string') ctx.filter = filter;
    else {
        var x = [];
        if (filter.blur > 0) x.push('blur(' + filter.blur + 'px)');
        if (filter.hue > 0) x.push('hue-rotate(' + filter.hue + 'deg)');
        if (filter.grayscale > 0) x.push('grayscale(' + filter.grayscale + ')');
        if (filter.invert) x.push('invert(1)');
        if (filter.shadow > 0)
            x.push('drop-shadow(0 0 ' + filter.shadow + 'px black)');
        if (x.length == 0) ctx.filter = 'none';
        else ctx.filter = x.join(' ');
    }
};

////// 设置某个canvas的绘制属性（如颜色等） //////
ui.prototype.setFillStyle = function (name, style) {
    var ctx = this.getContextByName(name);
    if (ctx) ctx.fillStyle = core.arrayToRGBA(style);
};

////// 设置某个canvas边框属性 //////
ui.prototype.setStrokeStyle = function (name, style) {
    var ctx = this.getContextByName(name);
    if (ctx) ctx.strokeStyle = core.arrayToRGBA(style);
};

////// 设置某个canvas的对齐 //////
ui.prototype.setTextAlign = function (name, align) {
    var ctx = this.getContextByName(name);
    if (ctx) ctx.textAlign = align;
};

////// 设置某个canvas的baseline //////
ui.prototype.setTextBaseline = function (name, baseline) {
    var ctx = this.getContextByName(name);
    if (ctx) ctx.textBaseline = baseline;
};

ui.prototype._uievent_setAttribute = function (data) {
    this._createUIEvent();
    if (data.font) this.setFont('uievent', data.font);
    if (data.lineWidth) this.setLineWidth('uievent', data.lineWidth);
    if (data.alpha != null) this.setAlpha('uievent', data.alpha);
    if (data.fillStyle) this.setFillStyle('uievent', data.fillStyle);
    if (data.strokeStyle) this.setStrokeStyle('uievent', data.strokeStyle);
    if (data.align) this.setTextAlign('uievent', data.align);
    if (data.baseline) this.setTextBaseline('uievent', data.baseline);
    if (data.z != null && main.mode != 'editor') {
        var z = parseInt(data.z) || 135;
        core.dymCanvas.uievent.canvas.style.zIndex = z;
        if (core.dymCanvas._uievent_selector)
            core.dymCanvas._uievent_selector.canvas.style.zIndex = z + 1;
    }
};

ui.prototype._uievent_setFilter = function (data) {
    this._createUIEvent();
    this.setFilter('uievent', data);
};

////// 计算某段文字的宽度 //////
ui.prototype.calWidth = function (name, text, font) {
    var ctx = this.getContextByName(name);
    if (ctx) {
        if (font) core.setFont(name, font);
        return ctx.measureText(text).width;
    }
    return 0;
};

////// 字符串自动换行的分割 //////
ui.prototype.splitLines = function (name, text, maxWidth, font) {
    var ctx = this.getContextByName(name);
    if (!ctx) return [text];
    if (font) core.setFont(name, font);

    var contents = [];
    var last = 0;
    for (var i = 0; i < text.length; i++) {
        if (text.charAt(i) == '\n') {
            contents.push(text.substring(last, i));
            last = i + 1;
        } else if (text.charAt(i) == '\\' && text.charAt(i + 1) == 'n') {
            contents.push(text.substring(last, i));
            last = i + 2;
        } else {
            var toAdd = text.substring(last, i + 1);
            var width = core.calWidth(name, toAdd);
            if (maxWidth && width > maxWidth) {
                contents.push(text.substring(last, i));
                last = i;
            }
        }
    }
    contents.push(text.substring(last));
    return contents;
};

////// 绘制一张图片 //////
ui.prototype.drawImage = function (
    name,
    image,
    x,
    y,
    w,
    h,
    x1,
    y1,
    w1,
    h1,
    angle,
    reverse
) {
    // 检测文件名以 :x, :y, :o 结尾，表示左右翻转，上下翻转和中心翻转
    var ctx = this.getContextByName(name);
    if (!ctx) return;

    // var reverse = null;
    if (typeof image == 'string') {
        if (
            image.endsWith(':x') ||
            image.endsWith(':y') ||
            image.endsWith(':o')
        ) {
            reverse = image.charAt(image.length - 1);
            image = image.substring(0, image.length - 2);
        }
        image = core.getMappedName(image);
        image = core.material.images.images[image];
        if (!image) return;
    }

    var scale = {
        x: [-1, 1],
        y: [1, -1],
        o: [-1, -1]
    };

    // 只能接受2, 4, 8个参数
    if (x != null && y != null) {
        if (w == null || h == null) {
            // 两个参数变成四个参数
            w = image.width;
            h = image.height;
        }

        if (x1 != null && y1 != null && w1 != null && h1 != null) {
            if (!reverse && !angle) {
                ctx.drawImage(image, x, y, w, h, x1, y1, w1, h1);
            } else {
                ctx.save();
                ctx.translate(x1 + w1 / 2, y1 + h1 / 2);
                if (reverse) ctx.scale(scale[reverse][0], scale[reverse][1]);
                if (angle) ctx.rotate(angle);
                ctx.drawImage(image, x, y, w, h, -w1 / 2, -h1 / 2, w1, h1);
                ctx.restore();
            }
            return;
        }
        if (!reverse && !angle) {
            ctx.drawImage(image, x, y, w, h);
        } else {
            ctx.save();
            ctx.translate(x + w / 2, y + h / 2);
            if (reverse) ctx.scale(scale[reverse][0], scale[reverse][1]);
            if (angle) ctx.rotate(angle);
            ctx.drawImage(image, -w / 2, -h / 2, w, h);
            ctx.restore();
        }
        return;
    }
};

ui.prototype._uievent_drawImage = function (data) {
    this._createUIEvent();
    this.drawImage(
        'uievent',
        data.image + (data.reverse || ''),
        core.calValue(data.x),
        core.calValue(data.y),
        core.calValue(data.w),
        core.calValue(data.h),
        core.calValue(data.x1),
        core.calValue(data.y1),
        core.calValue(data.w1),
        core.calValue(data.h1),
        ((core.calValue(data.angle) || 0) * Math.PI) / 180
    );
};

ui.prototype.drawIcon = function (name, id, x, y, w, h, frame) {
    frame = frame || 0;
    var ctx = this.getContextByName(name);
    if (!ctx) return;

    var info = core.getBlockInfo(id);
    if (!info) {
        // 检查状态栏图标
        if (core.statusBar.icons[id] instanceof Image)
            info = {
                image: core.statusBar.icons[id],
                posX: 0,
                posY: 0,
                height: 32
            };
        else return;
    }
    core.drawImage(
        ctx,
        info.image,
        32 * (info.posX + frame),
        info.height * info.posY,
        32,
        info.height,
        x,
        y,
        w || 32,
        h || info.height
    );
};

ui.prototype._uievent_drawIcon = function (data) {
    this._createUIEvent();
    var id;
    try {
        id = core.calValue(data.id);
        if (typeof id !== 'string') id = data.id;
    } catch (e) {
        id = data.id;
    }
    this.drawIcon(
        'uievent',
        id,
        core.calValue(data.x),
        core.calValue(data.y),
        core.calValue(data.width),
        core.calValue(data.height),
        data.frame || 0
    );
};

///////////////// UI绘制

////// 结束一切事件和绘制，关闭UI窗口，返回游戏进程 //////
ui.prototype.closePanel = function () {
    if (core.status.hero && core.status.hero.flags) {
        // 清除全部临时变量
        Object.keys(core.status.hero.flags).forEach(function (name) {
            if (name.startsWith('@temp@') || /^arg\d+$/.test(name)) {
                delete core.status.hero.flags[name];
            }
        });
    }
    this.clearUI();
    core.maps.generateGroundPattern();
    core.updateStatusBar(true);
    // 这个setTimeout加了有bug，不加也有
    // setTimeout(() => {
    core.unlockControl();
    // }, 0);
    core.status.event.data = null;
    core.status.event.id = null;
    core.status.event.selection = null;
    core.status.event.ui = null;
    core.status.event.interval = null;
    // 清除onDownInterval
    clearInterval(core.interval.onDownInterval);
    core.interval.onDownInterval = 'tmp';
};

ui.prototype.clearUI = function () {
    core.status.boxAnimateObjs = [];
    core.deleteCanvas('_selector');
    core.clearMap('ui');
    core.setAlpha('ui', 1);
    core.setOpacity('ui', 1);
    core.deleteCanvas('ui2');
};

////// 左上角绘制一段提示 //////
ui.prototype.drawTip = function (text, id, frame) {
    // Deprecated. Fallback in modules/fallback/ui.ts
};

ui.prototype._drawTip_drawOne = function (tip) {
    // Deprecated. Fallback in modules/fallback/ui.ts
};

////// 地图中间绘制一段文字 //////
ui.prototype.drawText = function (contents, callback) {
    if (contents != null) return this._drawText_setContent(contents, callback);

    if (core.status.event.data.list.length == 0) {
        var callback = core.status.event.data.callback;
        core.ui.closePanel(false);
        if (callback) callback();
        return;
    }

    var data = core.status.event.data.list.shift();
    if (typeof data == 'string') data = { text: data };
    core.ui.drawTextBox(data.text, data);
};

ui.prototype._drawText_setContent = function (contents, callback) {
    // 合并进 insertAction
    if (
        (core.status.event && core.status.event.id == 'action') ||
        (!core.hasFlag('__replayText__') && core.isReplaying())
    ) {
        core.insertAction(contents, null, null, callback);
        return;
    }
    if (!(contents instanceof Array)) contents = [contents];

    core.status.event = {
        id: 'text',
        data: { list: contents, callback: callback }
    };
    core.lockControl();

    core.waitHeroToStop(core.drawText);
    return;
};

////// 正则处理 \t[xx,yy] 问题
ui.prototype._getTitleAndIcon = function (content) {
    var title = null,
        image = null,
        icon = null,
        height = 32,
        animate = 1;
    var bigImage = null,
        face = null;
    content = content.replace(
        /(\t|\\t)\[(([^\],]+),)?([^\],]+)\]/g,
        function (s0, s1, s2, s3, s4) {
            if (s4) {
                if (s4 == 'hero') {
                    title = core.status.hero.name;
                    image = core.material.images.hero;
                    icon = 0;
                    var w = core.material.icons.hero.width || 32;
                    height = (32 * core.material.icons.hero.height) / w;
                } else if (s4.endsWith('.png')) {
                    s4 = core.getMappedName(s4);
                    image = core.material.images.images[s4];
                } else {
                    var blockInfo = core.getBlockInfo(s4);
                    if (blockInfo != null) {
                        if (blockInfo.name) title = blockInfo.name;
                        bigImage = blockInfo.bigImage;
                        face = blockInfo.face;
                        image = blockInfo.image;
                        icon = blockInfo.posY;
                        height = bigImage == null ? blockInfo.height : 32;
                        animate = blockInfo.animate;
                    } else title = s4;
                }
            }
            if (s3 != null) {
                title = s3;
                if (title == 'null') title = null;
            }
            return '';
        }
    );
    return {
        content: content,
        title: title,
        image: image,
        icon: icon,
        height: height,
        animate: animate,
        bigImage: bigImage,
        face: face
    };
};

////// 正则处理 \b[up,xxx] 问题
ui.prototype._getPosition = function (content) {
    var pos = null,
        px = null,
        py = null,
        noPeak = false;
    if (core.status.event.id == 'action') {
        px = core.status.event.data.x;
        py = core.status.event.data.y;
    }
    if (main.mode != 'play') {
        px = editor.pos.x;
        py = editor.pos.y;
    }
    content = content
        .replace('\b', '\\b')
        .replace(
            /\\b\[(up|center|down|hero|this)(,(hero|null|\d+,\d+|\d+))?]/g,
            function (s0, s1, s2, s3) {
                pos = s1;
                if (s3 == 'hero' || (s1 == 'hero' && !s3)) {
                    px = core.getHeroLoc('x');
                    py = core.getHeroLoc('y');
                } else if (s3 == 'null') {
                    px = py = null;
                } else if (s3) {
                    var str = s3.split(',');
                    px = py = null;
                    if (str.length == 1) {
                        var follower =
                            core.status.hero.followers[parseInt(str[0]) - 1];
                        if (follower) {
                            px = follower.x;
                            py = follower.y;
                        }
                    } else {
                        px = parseInt(str[0]);
                        py = parseInt(str[1]);
                        noPeak = core.getBlockId(px, py) == null;
                    }
                }
                if (pos == 'hero' || pos == 'this') {
                    pos =
                        py == null
                            ? 'center'
                            : py > core._HALF_HEIGHT_
                              ? 'up'
                              : 'down';
                }
                return '';
            }
        );
    return { content: content, position: pos, px: px, py: py, noPeak: noPeak };
};

////// 绘制系统选择光标
ui.prototype._drawWindowSelector = function (background, x, y, w, h) {
    ((w = Math.round(w)), (h = Math.round(h)));
    var ctx = core.ui.createCanvas('_selector', x, y, w, h, 165);
    this._drawSelector(ctx, background, w, h);
};

////// 自绘一个选择光标
ui.prototype.drawUIEventSelector = function (code, background, x, y, w, h, z) {
    var canvasName = '_uievent_selector_' + (code || 0);
    var background = background || core.status.textAttribute.background;
    if (typeof background != 'string') return;
    if (main.mode == 'editor') {
        this._drawSelector('uievent', background, w, h, x, y);
        return;
    }
    z =
        z ||
        (core.dymCanvas.uievent
            ? (parseInt(core.dymCanvas.uievent.canvas.style.zIndex) || 135) + 1
            : 136);
    var ctx = core.createCanvas(canvasName, x, y, w, h, z);
    ctx.canvas.classList.add('_uievent_selector');
    this._drawSelector(ctx, background, w, h);
};

ui.prototype._uievent_drawSelector = function (data) {
    if (data.image == null) this.clearUIEventSelector(data.code || 0);
    else
        this.drawUIEventSelector(
            data.code,
            data.image,
            core.calValue(data.x),
            core.calValue(data.y),
            core.calValue(data.width),
            core.calValue(data.height)
        );
};

////// 清除自绘的选择光标
ui.prototype.clearUIEventSelector = function (codes) {
    if (codes == null) {
        core.deleteCanvas(function (one) {
            return one.startsWith('_uievent_selector_');
        });
        return;
    }
    if (codes instanceof Array) {
        codes.forEach(function (code) {
            core.ui.clearUIEventSelector(code);
        });
        return;
    }
    core.deleteCanvas('_uievent_selector_' + (codes || 0));
};

ui.prototype._drawSelector = function (ctx, background, w, h, left, top) {
    left = left || 0;
    top = top || 0;
    // back
    core.drawImage(
        ctx,
        background,
        130,
        66,
        28,
        28,
        left + 2,
        top + 2,
        w - 4,
        h - 4
    );
    // corner
    core.drawImage(ctx, background, 128, 64, 2, 2, left, top, 2, 2);
    core.drawImage(ctx, background, 158, 64, 2, 2, left + w - 2, top, 2, 2);
    core.drawImage(ctx, background, 128, 94, 2, 2, left, top + h - 2, 2, 2);
    core.drawImage(
        ctx,
        background,
        158,
        94,
        2,
        2,
        left + w - 2,
        top + h - 2,
        2,
        2
    );
    // border
    core.drawImage(ctx, background, 130, 64, 28, 2, left + 2, top, w - 4, 2);
    core.drawImage(
        ctx,
        background,
        130,
        94,
        28,
        2,
        left + 2,
        top + h - 2,
        w - 4,
        2
    );
    core.drawImage(ctx, background, 128, 66, 2, 28, left, top + 2, 2, h - 4);
    core.drawImage(
        ctx,
        background,
        158,
        66,
        2,
        28,
        left + w - 2,
        top + 2,
        2,
        h - 4
    );
};

////// 绘制 WindowSkin
ui.prototype.drawWindowSkin = function (
    background,
    ctx,
    x,
    y,
    w,
    h,
    direction,
    px,
    py
) {
    background = background || core.status.textAttribute.background;
    // 仿RM窗口皮肤 ↓
    // 绘制背景
    core.drawImage(ctx, background, 0, 0, 128, 128, x + 2, y + 2, w - 4, h - 4);
    // 绘制边框
    // 上方
    core.drawImage(ctx, background, 128, 0, 16, 16, x, y, 16, 16);
    for (var dx = 0; dx < w - 64; dx += 32) {
        core.drawImage(ctx, background, 144, 0, 32, 16, x + dx + 16, y, 32, 16);
        core.drawImage(
            ctx,
            background,
            144,
            48,
            32,
            16,
            x + dx + 16,
            y + h - 16,
            32,
            16
        );
    }
    core.drawImage(
        ctx,
        background,
        144,
        0,
        w - dx - 32,
        16,
        x + dx + 16,
        y,
        w - dx - 32,
        16
    );
    core.drawImage(
        ctx,
        background,
        144,
        48,
        w - dx - 32,
        16,
        x + dx + 16,
        y + h - 16,
        w - dx - 32,
        16
    );
    core.drawImage(ctx, background, 176, 0, 16, 16, x + w - 16, y, 16, 16);
    // 左右
    for (var dy = 0; dy < h - 64; dy += 32) {
        core.drawImage(
            ctx,
            background,
            128,
            16,
            16,
            32,
            x,
            y + dy + 16,
            16,
            32
        );
        core.drawImage(
            ctx,
            background,
            176,
            16,
            16,
            32,
            x + w - 16,
            y + dy + 16,
            16,
            32
        );
    }
    core.drawImage(
        ctx,
        background,
        128,
        16,
        16,
        h - dy - 32,
        x,
        y + dy + 16,
        16,
        h - dy - 32
    );
    core.drawImage(
        ctx,
        background,
        176,
        16,
        16,
        h - dy - 32,
        x + w - 16,
        y + dy + 16,
        16,
        h - dy - 32
    );
    // 下方
    core.drawImage(ctx, background, 128, 48, 16, 16, x, y + h - 16, 16, 16);
    core.drawImage(
        ctx,
        background,
        176,
        48,
        16,
        16,
        x + w - 16,
        y + h - 16,
        16,
        16
    );

    // arrow
    if (px != null && py != null) {
        if (direction == 'up') {
            core.drawImage(
                ctx,
                background,
                128,
                96,
                32,
                32,
                px,
                y + h - 3,
                32,
                32
            );
        } else if (direction == 'down') {
            core.drawImage(
                ctx,
                background,
                160,
                96,
                32,
                32,
                px,
                y - 29,
                32,
                32
            );
        }
    }
    // 仿RM窗口皮肤 ↑
};

////// 绘制一个背景图，可绘制 winskin 或纯色背景；支持小箭头绘制
ui.prototype.drawBackground = function (left, top, right, bottom, posInfo) {
    posInfo = posInfo || {};
    var px =
        posInfo.px == null || posInfo.noPeak
            ? null
            : posInfo.px * 32 - core.bigmap.offsetX;
    var py =
        posInfo.py == null || posInfo.noPeak
            ? null
            : posInfo.py * 32 - core.bigmap.offsetY;
    var xoffset = posInfo.xoffset || 0,
        yoffset = posInfo.yoffset || 0;
    var background = core.status.textAttribute.background;

    if (
        this._drawBackground_drawWindowSkin(
            background,
            left,
            top,
            right,
            bottom,
            posInfo.position,
            px,
            py,
            posInfo.ctx
        )
    )
        return true;
    if (typeof background == 'string')
        background = core.initStatus.textAttribute.background;
    this._drawBackground_drawColor(
        background,
        left,
        top,
        right,
        bottom,
        posInfo.position,
        px,
        py,
        xoffset,
        yoffset,
        posInfo.ctx
    );
    return false;
};

ui.prototype._uievent_drawBackground = function (data) {
    this._createUIEvent();
    var background = data.background || core.status.textAttribute.background;
    var x = core.calValue(data.x),
        y = core.calValue(data.y),
        w = core.calValue(data.width),
        h = core.calValue(data.height);
    if (typeof background == 'string') {
        this.drawWindowSkin(background, 'uievent', x, y, w, h);
    } else if (background instanceof Array) {
        this.fillRect('uievent', x, y, w, h, core.arrayToRGBA(background));
        this.strokeRect('uievent', x, y, w, h);
    }
};

ui.prototype._drawWindowSkin_getOpacity = function () {
    return core.getFlag('__winskin_opacity__', 0.85);
};

ui.prototype._drawBackground_drawWindowSkin = function (
    background,
    left,
    top,
    right,
    bottom,
    position,
    px,
    py,
    ctx
) {
    ctx = ctx || 'ui';
    if (
        typeof background == 'string' &&
        core.material.images.images[background]
    ) {
        var image = core.material.images.images[background];
        if (image.width == 192 && image.height == 128) {
            core.setAlpha(ctx, this._drawWindowSkin_getOpacity());
            this.drawWindowSkin(
                image,
                ctx,
                left,
                top,
                right - left,
                bottom - top,
                position,
                px,
                py
            );
            core.setAlpha(ctx, 1);
            return true;
        }
    }
    return false;
};

ui.prototype._drawBackground_drawColor = function (
    background,
    left,
    top,
    right,
    bottom,
    position,
    px,
    py,
    xoffset,
    yoffset,
    ctx
) {
    ctx = ctx || 'ui';
    var alpha = background[3];
    core.setAlpha(ctx, alpha);
    core.setStrokeStyle(
        ctx,
        core.arrayToRGBA(core.status.globalAttribute.borderColor)
    );
    core.setFillStyle(ctx, core.arrayToRGB(background));
    core.setLineWidth(ctx, 2);
    // 绘制
    ctx = core.getContextByName(ctx);
    ctx.beginPath();
    ctx.moveTo(left, top);
    // 上边缘三角
    if (position == 'down' && px != null && py != null) {
        ctx.lineTo(px + xoffset, top);
        ctx.lineTo(px + 16, top - yoffset);
        ctx.lineTo(px + 32 - xoffset, top);
    }
    ctx.lineTo(right, top);
    ctx.lineTo(right, bottom);
    // 下边缘三角
    if (position == 'up' && px != null && py != null) {
        ctx.lineTo(px + 32 - xoffset, bottom);
        ctx.lineTo(px + 16, bottom + yoffset);
        ctx.lineTo(px + xoffset, bottom);
    }
    ctx.lineTo(left, bottom);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    core.setAlpha(ctx, 1);
};

////// 计算有效文本框的宽度
ui.prototype._calTextBoxWidth = function (
    ctx,
    content,
    min_width,
    max_width,
    font
) {
    // 无限长度自动换行
    var allLines = core.splitLines(ctx, content, null, font);

    // 如果不存在手动换行，尽量调成半行形式
    if (allLines.length == 1) {
        var w = core.calWidth(ctx, allLines[0]) + 10;
        if (w < min_width * 2.3)
            return core.clamp(w / 1.4, min_width, max_width);
        if (w < max_width * 2.2)
            return core.clamp(w / 2.4, min_width, max_width);
        return core.clamp(w / 3.4, min_width, max_width);
    }
    // 存在手动换行：以最长的为准
    else {
        return core.clamp(
            allLines.reduce(function (pre, curr) {
                return Math.max(pre, core.calWidth(ctx, curr) + 10);
            }, 0),
            min_width,
            max_width
        );
    }
};

////// 处理 \i[xxx] 的问题
ui.prototype._getDrawableIconInfo = function (id) {
    if (id && id.indexOf('flag:') === 0) {
        id = core.getFlag(id.substring(5), id);
    }
    id = core.getIdOfThis(id);
    var image = null,
        icon = null;
    [
        'terrains',
        'animates',
        'items',
        'npcs',
        'enemys',
        'enemy48',
        'npc48'
    ].forEach(function (v) {
        if (core.material.icons[v][id] != null) {
            image = core.material.images[v];
            icon = core.material.icons[v][id];
        }
    });
    if (image == null && id in core.statusBar.icons) {
        image = core.statusBar.icons[id];
        icon = 0;
    }
    return [image, icon];
};

ui.prototype._buildFont = function (fontSize, bold, italic, font, isHD) {
    var textAttribute =
            core.status.textAttribute || core.initStatus.textAttribute,
        globalAttribute =
            core.status.globalAttribute || core.initStatus.globalAttribute;
    if (bold == null) bold = textAttribute.bold;
    return (
        (bold ? 'bold ' : '') +
        (italic ? 'italic ' : '') +
        (fontSize || textAttribute.textfont) +
        'px ' +
        (font || globalAttribute.font)
    );
};

////// 绘制一段文字到某个画布上面
// ctx：要绘制到的画布
// content：要绘制的内容；转义字符目前只允许留 \n, \r[...], \i[...], \c[...], \d, \e
// config：绘制配置项，目前暂时包含如下内容（均为可选）
//         left, top：起始点位置；maxWidth：单行最大宽度；color：默认颜色；align：左中右
//         fontSize：字体大小；lineHeight：行高；time：打字机间隔；font：字体类型；letterSpacing：字符间距
ui.prototype.drawTextContent = function (ctx, content, config) {
    ctx = core.getContextByName(ctx);
    // 设置默认配置项
    var textAttribute =
        core.status.textAttribute || core.initStatus.textAttribute;
    var globalAttribute =
        core.status.globalAttribute || core.initStatus.globalAttribute;
    config = core.clone(config || {});
    config.left = config.left || 0;
    config.right =
        config.left + (config.maxWidth == null ? core._PX_ : config.maxWidth);
    config.top = config.top || 0;
    config.color = core.arrayToRGBA(config.color || textAttribute.text);
    if (config.bold == null) config.bold = textAttribute.bold;
    config.italic = config.italic || false;
    config.align = config.align || textAttribute.align || 'left';
    config.fontSize = config.fontSize || textAttribute.textfont;
    config.lineHeight = config.lineHeight || config.fontSize * 1.3;
    config.defaultFont = config.font = config.font || globalAttribute.font;
    config.time = config.time || 0;
    config.letterSpacing =
        config.letterSpacing == null
            ? textAttribute.letterSpacing || 0
            : config.letterSpacing;

    config.index = 0;
    config.currcolor = config.color;
    config.currfont = config.fontSize;
    config.lineMargin = Math.max(
        Math.round(config.fontSize / 4),
        config.lineHeight - config.fontSize
    );
    config.topMargin = Math.floor(config.lineMargin / 2);
    config.lineMaxHeight = config.lineMargin + config.fontSize;
    config.offsetX = 0;
    config.offsetY = 0;
    config.line = 0;
    config.blocks = [];
    config.isHD = ctx == null || ctx.canvas.hasAttribute('isHD');

    // 创建一个新的临时画布
    var tempCtx = document.createElement('canvas').getContext('2d');
    if (config.isHD && ctx) {
        core.maps._setHDCanvasSize(
            tempCtx,
            ctx.canvas.width,
            ctx.canvas.height
        );
    } else {
        tempCtx.canvas.width = ctx == null ? 1 : ctx.canvas.width;
        tempCtx.canvas.height = ctx == null ? 1 : ctx.canvas.height;
    }
    tempCtx.textBaseline = 'top';
    tempCtx.font = this._buildFont(
        config.fontSize,
        config.bold,
        config.italic,
        config.font
    );
    tempCtx.fillStyle = config.color;
    config = this._drawTextContent_draw(ctx, tempCtx, content, config);
    return config;
};

ui.prototype._uievent_drawTextContent = function (data) {
    this._createUIEvent();
    data.left = core.calValue(data.left);
    data.top = core.calValue(data.top);
    this.drawTextContent('uievent', core.replaceText(data.text), data);
};

// 绘制的基本逻辑：
// 1. 一个个字符绘制到对应画布上（靠左对齐）；这个过程中，记下来每个字对应的方块 [x, y, w, h]
// 2. 每次换行时，计算当前行的宽度，然后如果是居中或者靠右对齐，则对当前行的每个小方块增加偏移量
// 3. 实际绘制时，从临时画布直接将一个个小方块绘制到目标画布上，一次全部绘制，或者打字机效果一个个绘制
ui.prototype._drawTextContent_draw = function (ctx, tempCtx, content, config) {
    // Step 1: 绘制到tempCtx上，并记录下图块信息
    while (this._drawTextContent_next(tempCtx, content, config));

    if (ctx == null) return config;

    // Step 2: 从tempCtx绘制到画布上
    config.index = 0;
    var _drawNext = function () {
        if (config.index >= config.blocks.length) return false;
        var block = config.blocks[config.index++];
        if (block != null) {
            // It works, why?
            const scale = config.isHD
                ? devicePixelRatio * core.domStyle.scale
                : 1;
            core.drawImage(
                ctx,
                tempCtx.canvas,
                block.left * scale,
                block.top * scale,
                block.width * scale,
                block.height * scale,
                config.left + block.left + block.marginLeft,
                config.top + block.top + block.marginTop,
                block.width,
                block.height
            );
        }
        return true;
    };
    if (config.time == 0) {
        while (_drawNext());
    } else {
        clearInterval(core.status.event.interval);
        core.status.event.interval = setInterval(function () {
            if (!_drawNext()) {
                clearInterval(core.status.event.interval);
                core.status.event.interval = null;
            }
        }, config.time);
    }

    return config;
};

ui.prototype._drawTextContent_next = function (tempCtx, content, config) {
    if (config.index >= content.length) {
        this._drawTextContent_newLine(tempCtx, config);
        return false;
    }
    // get next character
    var ch = content.charAt(config.index);
    var code = content.charCodeAt(config.index++);
    while (code >= 0xd800 && code <= 0xdbff) {
        ch += content.charAt(config.index);
        code = content.charCodeAt(config.index++);
    }
    return this._drawTextContent_drawChar(tempCtx, content, config, ch);
};

// 绘制下一个字符
ui.prototype._drawTextContent_drawChar = function (
    tempCtx,
    content,
    config,
    ch
) {
    // 标点禁则：不能在行首的标点
    var forbidStart =
        '）)】》＞﹞>)]»›〕〉}］」｝〗』' +
        '，。？！：；·…,.?!:;、……~&@#～＆＠＃';
    // 标点禁则：不能在行尾的标点
    var forbidEnd = '（(【《＜﹝<([«‹〔〈{［「｛〖『';

    // \n, \\n
    if (ch == '\n' || (ch == '\\' && content.charAt(config.index) == 'n')) {
        this._drawTextContent_newLine(tempCtx, config);
        if (ch == '\\') config.index++;
        return this._drawTextContent_next(tempCtx, content, config);
    }
    // \r, \\r
    if (ch == '\r' || (ch == '\\' && content.charAt(config.index) == 'r')) {
        if (ch == '\\') config.index++;
        return this._drawTextContent_changeColor(tempCtx, content, config);
    }
    if (ch == '\\') {
        var c = content.charAt(config.index);
        if (c == 'i')
            return this._drawTextContent_drawIcon(tempCtx, content, config);
        if (c == 'c')
            return this._drawTextContent_changeFontSize(
                tempCtx,
                content,
                config
            );
        if (c == 'd' || c == 'e') {
            config.index++;
            if (c == 'd') config.bold = !config.bold;
            if (c == 'e') config.italic = !config.italic;
            tempCtx.font = this._buildFont(
                config.currfont,
                config.bold,
                config.italic,
                config.font
            );
            return true;
        }
        if (c == 'g')
            return this._drawTextContent_changeFont(tempCtx, content, config);
        if (c == 'z')
            return this._drawTextContent_emptyChar(tempCtx, content, config);
    }
    // 检查是不是自动换行
    var charwidth = core.calWidth(tempCtx, ch) + config.letterSpacing;
    if (config.maxWidth != null) {
        if (config.offsetX + charwidth > config.maxWidth) {
            // --- 当前应当换行，然而还是检查一下是否是forbidStart
            if (!config.forceChangeLine && forbidStart.indexOf(ch) >= 0) {
                config.forceChangeLine = true;
            } else {
                this._drawTextContent_newLine(tempCtx, config);
                config.index -= ch.length;
                return this._drawTextContent_next(tempCtx, content, config);
            }
        } else if (
            forbidEnd.indexOf(ch) >= 0 &&
            config.index < content.length
        ) {
            // --- 当前不应该换行；但是提前检查一下是否是行尾标点
            var nextch = content.charAt(config.index);
            // 确认不是手动换行
            if (
                nextch != '\n' &&
                !(nextch == '\\' && content.charAt(config.index + 1) == 'n')
            ) {
                // 检查是否会换行
                var nextchwidth =
                    core.calWidth(tempCtx, nextch) + config.letterSpacing;
                if (
                    config.offsetX + charwidth + nextchwidth >
                    config.maxWidth
                ) {
                    // 下一项会换行，因此在此处换行
                    this._drawTextContent_newLine(tempCtx, config);
                    config.index -= ch.length;
                    return this._drawTextContent_next(tempCtx, content, config);
                }
            }
        }
    }

    // 输出
    var left = config.offsetX,
        top = config.offsetY + config.topMargin;
    core.fillText(tempCtx, ch, left, top);
    config.blocks.push({
        left: config.offsetX,
        top: config.offsetY,
        width: charwidth,
        height: config.currfont + config.lineMargin,
        line: config.line,
        marginLeft: 0
    });
    config.offsetX += charwidth;
    return true;
};

ui.prototype._drawTextContent_newLine = function (tempCtx, config) {
    // 计算偏移量
    var width = config.offsetX,
        totalWidth = config.right - config.left;
    var marginLeft = 0;
    if (config.align == 'center') marginLeft = (totalWidth - width) / 2;
    else if (config.align == 'right') marginLeft = totalWidth - width;

    config.blocks.forEach(function (b) {
        if (b == null) return;
        if (b.line == config.line) {
            b.marginLeft = marginLeft;
            // b.marginTop = 0; // 上对齐
            b.marginTop = (config.lineMaxHeight - b.height) / 2; // 居中对齐
            // b.marginTop = config.lineMaxHeight - b.height; // 下对齐
        }
    });

    config.offsetX = 0;
    config.offsetY += config.lineMaxHeight;
    config.lineMaxHeight = config.currfont + config.lineMargin;
    config.line++;
    config.forceChangeLine = false;
};

ui.prototype._drawTextContent_changeColor = function (
    tempCtx,
    content,
    config
) {
    // 检查是不是 []
    var index = config.index,
        index2;
    if (
        content.charAt(index) == '[' &&
        (index2 = content.indexOf(']', index)) >= 0
    ) {
        // 变色
        var str = content.substring(index + 1, index2);
        if (str == '') tempCtx.fillStyle = config.color;
        else tempCtx.fillStyle = str;
        config.index = index2 + 1;
    } else tempCtx.fillStyle = config.color;
    return this._drawTextContent_next(tempCtx, content, config);
};

ui.prototype._drawTextContent_changeFontSize = function (
    tempCtx,
    content,
    config
) {
    config.index++;
    // 检查是不是 []
    var index = config.index,
        index2;
    if (
        content.charAt(index) == '[' &&
        (index2 = content.indexOf(']', index)) >= 0
    ) {
        var str = content.substring(index + 1, index2);
        if (!/^\d+$/.test(str)) config.currfont = config.fontSize;
        else config.currfont = parseInt(str);
        config.index = index2 + 1;
    } else config.currfont = config.fontSize;
    config.lineMaxHeight = Math.max(
        config.lineMaxHeight,
        config.currfont + config.lineMargin
    );
    tempCtx.font = this._buildFont(
        config.currfont,
        config.bold,
        config.italic,
        config.font,
        config.isHD
    );
    return this._drawTextContent_next(tempCtx, content, config);
};

ui.prototype._drawTextContent_changeFont = function (tempCtx, content, config) {
    config.index++;
    // 检查是不是 []
    var index = config.index,
        index2;
    if (
        content.charAt(index) == '[' &&
        (index2 = content.indexOf(']', index)) >= 0
    ) {
        var str = content.substring(index + 1, index2);
        if (str == '') config.font = config.defaultFont;
        else config.font = str;
        config.index = index2 + 1;
    } else config.font = config.defaultFont;
    tempCtx.font = this._buildFont(
        config.currfont,
        config.bold,
        config.italic,
        config.font,
        config.isHD
    );
    return this._drawTextContent_next(tempCtx, content, config);
};

ui.prototype._drawTextContent_emptyChar = function (tempCtx, content, config) {
    config.index++;
    var index = config.index,
        index2;
    if (
        content.charAt(index) == '[' &&
        (index2 = content.indexOf(']', index)) >= 0
    ) {
        var str = content.substring(index + 1, index2);
        if (/^\d+$/.test(str)) {
            var value = parseInt(str);
            for (var i = 0; i < value; ++i) {
                config.blocks.push(null); // Empty char
            }
        } else config.blocks.push(null);
        config.index = index2 + 1;
    } else config.blocks.push(null);
    return this._drawTextContent_next(tempCtx, content, config);
};

ui.prototype._drawTextContent_drawIcon = function (tempCtx, content, config) {
    // 绘制一个 \i 效果
    var index = config.index,
        index2;
    if (
        content.charAt(config.index + 1) == '[' &&
        (index2 = content.indexOf(']', index + 1)) >= 0
    ) {
        var str = core.replaceText(content.substring(index + 2, index2));
        // --- 获得图标
        var cls = core.getClsFromId(str) || '';
        var iconInfo = core.ui._getDrawableIconInfo(str),
            image = iconInfo[0],
            icon = iconInfo[1];
        if (image == null)
            return this._drawTextContent_next(tempCtx, content, config);
        // 检查自动换行
        var width = config.currfont + 2,
            left = config.offsetX + 2,
            top = config.offsetY + config.topMargin - 1;
        if (config.maxWidth != null && left + width > config.maxWidth) {
            this._drawTextContent_newLine(tempCtx, config);
            config.index--;
            return this._drawTextContent_next(tempCtx, content, config);
        }
        // 绘制到画布上
        var height = 32;
        if (cls.endsWith('48')) height = 48;
        core.drawImage(
            tempCtx,
            image,
            0,
            height * icon,
            32,
            height,
            left,
            top,
            width,
            height === 48 ? width * 1.5 : width
        );

        config.blocks.push({
            left: left,
            top: config.offsetY,
            width: width,
            height: width + config.lineMargin,
            line: config.line,
            marginLeft: 0
        });

        config.offsetX += width + 6;
        config.index = index2 + 1;
        return true;
    }
    return this._drawTextContent_next(tempCtx, content, config);
};

ui.prototype.getTextContentHeight = function (content, config) {
    return this.drawTextContent(null, content, config).offsetY;
};

ui.prototype._getRealContent = function (content) {
    return content
        .replace(/(\r|\\(r|c|d|e|g|z))(\[.*?])?/g, '')
        .replace(/(\\i)(\[.*?])?/g, '占1');
};

ui.prototype._animateUI = function (type, ctx, callback) {
    ctx = ctx || 'ui';
    var time = core.status.textAttribute.animateTime || 0;
    if (
        !core.status.event ||
        !time ||
        core.isReplaying() ||
        (type != 'show' && type != 'hide')
    ) {
        if (callback) callback();
        return;
    }
    clearInterval(core.status.event.animateUI);
    var opacity = 0;
    if (type == 'show') {
        opacity = 0;
    } else if (type == 'hide') {
        opacity = 1;
    }
    core.setOpacity(ctx, opacity);
    core.status.event.animateUI = setInterval(function () {
        if (type == 'show') opacity += 0.05;
        else opacity -= 0.05;
        core.setOpacity(ctx, opacity);
        if (opacity >= 1 || opacity <= 0) {
            clearInterval(core.status.event.animateUI);
            delete core.status.event.animateUI;
            if (callback) callback();
        }
    }, time / 20);
};

////// 绘制一个对话框 //////
ui.prototype.drawTextBox = function (content, config) {
    config = config || {};

    this.clearUI();
    content = core.replaceText(content);

    var ctx = config.ctx || null;
    if (ctx && main.mode == 'play') {
        core.createCanvas(ctx, 0, 0, core._PX_, core._PY_, 141);
        ctx = core.getContextByName(ctx);
    }

    // Step 1: 获得标题信息和位置信息
    var textAttribute = core.status.textAttribute;
    var titleInfo = this._getTitleAndIcon(content);
    var posInfo = this._getPosition(titleInfo.content);
    if (posInfo.position != 'up' && posInfo.position != 'down')
        posInfo.px = posInfo.py = null;
    if (!posInfo.position) posInfo.position = textAttribute.position;
    content = this._drawTextBox_drawImages(posInfo.content, config.ctx);
    if (config.pos) {
        delete posInfo.px;
        delete posInfo.py;
        posInfo.pos = config.pos;
    }
    posInfo.ctx = ctx;

    // Step 2: 计算对话框的矩形位置
    var hPos = this._drawTextBox_getHorizontalPosition(
        content,
        titleInfo,
        posInfo
    );
    var vPos = this._drawTextBox_getVerticalPosition(
        content,
        titleInfo,
        posInfo,
        hPos.validWidth
    );
    posInfo.xoffset = hPos.xoffset;
    posInfo.yoffset = vPos.yoffset - 4;

    if (ctx && main.mode == 'play') {
        ctx.canvas.setAttribute('_text_left', hPos.left);
        ctx.canvas.setAttribute('_text_top', vPos.top);
    }

    // Step 3: 绘制背景图
    var isWindowSkin = this.drawBackground(
        hPos.left,
        vPos.top,
        hPos.right,
        vPos.bottom,
        posInfo
    );
    var alpha = isWindowSkin
        ? this._drawWindowSkin_getOpacity()
        : textAttribute.background[3];

    // Step 4: 绘制标题、头像、动画
    var content_top = this._drawTextBox_drawTitleAndIcon(
        titleInfo,
        hPos,
        vPos,
        alpha,
        config.ctx
    );

    // Step 5: 绘制正文
    var config = this.drawTextContent(config.ctx || 'ui', content, {
        left: hPos.content_left,
        top: content_top,
        maxWidth: hPos.validWidth,
        lineHeight: vPos.lineHeight,
        time:
            config.showAll ||
            config.async ||
            textAttribute.time <= 0 ||
            core.status.event.id != 'action'
                ? 0
                : textAttribute.time
    });

    // Step 6: 绘制光标
    if (main.mode == 'play') {
        var left = (hPos.left + hPos.right) / 2;
        if (
            posInfo.position == 'up' &&
            !posInfo.noPeak &&
            posInfo.px != null &&
            Math.abs(posInfo.px * 32 + 16 - left) < 50
        )
            left = hPos.right - 64;
    }
    return config;
};

ui.prototype._drawTextBox_drawImages = function (content, ctx) {
    // deprecated.
};

ui.prototype._drawTextBox_getHorizontalPosition = function () {
    // deprecated.
};

ui.prototype._drawTextBox_getVerticalPosition = function () {
    // deprecated.
};

ui.prototype._drawTextBox_drawTitleAndIcon = function () {
    // deprecated.
};

ui.prototype._createTextCanvas = function (content, lineHeight) {
    var width = core._PX_,
        height =
            30 + this.getTextContentHeight(content, { lineHeight: lineHeight });
    var ctx = document.createElement('canvas').getContext('2d');
    ctx.canvas.width = width;
    ctx.canvas.height = height;
    ctx.clearRect(0, 0, width, height);
    return ctx;
};

////// 绘制滚动字幕 //////
ui.prototype.drawScrollText = function (content, time, lineHeight, callback) {
    content = core.replaceText(content || '');
    lineHeight = lineHeight || 1.4;
    time = time || 5000;
    this.clearUI();
    var offset = core.status.textAttribute.offset || 15;
    lineHeight *= core.status.textAttribute.textfont;
    var ctx = this._createTextCanvas(content, lineHeight);
    var obj = {
        align: core.status.textAttribute.align,
        lineHeight: lineHeight
    };
    if (obj.align == 'right') obj.left = core._PX_ - offset;
    else if (obj.align != 'center') obj.left = offset;
    this.drawTextContent(ctx, content, obj);
    this._drawScrollText_animate(ctx, time, callback);
};

ui.prototype._drawScrollText_animate = function (ctx, time, callback) {
    // deprecated.
};

////// 文本图片化 //////
ui.prototype.textImage = function (content, lineHeight) {
    content = core.replaceText(content || '');
    lineHeight = lineHeight || 1.4;
    lineHeight *= core.status.textAttribute.textfont;
    var ctx = this._createTextCanvas(content, lineHeight);
    this.drawTextContent(ctx, content, {
        align: core.status.textAttribute.align,
        lineHeight: lineHeight
    });
    return ctx.canvas;
};

////// 绘制一个选项界面 //////
ui.prototype.drawChoices2 = async function (content, choices, width, noRoute) {
    if (main.replayChecking) {
        const selected = (() => {
            const route = core.status.replay.toReplay[0];
            if (!route.startsWith('choices:')) {
                return 0;
            } else {
                return Number(route.slice(8));
            }
        })();
        core.status.replay.toReplay.shift();
        core.insertAction(choices[selected].action);
        core.doAction();
    } else {
        const {
            routedChoices,
            getChoices,
            mainUIController,
            HALF_WIDTH,
            HALF_HEIGHT,
            POP_BOX_WIDTH
        } = Mota.require('@user/client-modules');
        const choice = choices.map((v, i) => [i, v.text]);
        const fn = noRoute ? getChoices : routedChoices;
        const selected = await fn(
            mainUIController,
            choice,
            [HALF_WIDTH, HALF_HEIGHT, void 0, void 0, 0.5, 0.5],
            width ?? POP_BOX_WIDTH,
            { text: content ?? '' }
        );
        core.insertAction(choices[selected].action);
        core.doAction();
    }
};

ui.prototype._drawChoices_getHorizontalPosition = function () {
    // deprecated.
};

ui.prototype._drawChoices_getVerticalPosition = function () {
    // deprecated.
};

ui.prototype._drawChoices_drawTitle = function () {
    // deprecated.
};

ui.prototype._drawChoices_drawChoices = function () {
    // deprecated.
};

////// 绘制一个确认/取消的警告页面 //////
ui.prototype.drawConfirmBox = async function (
    text,
    yesCallback,
    noCallback,
    noRoute
) {
    if (main.replayChecking) {
        const confirm = (() => {
            const route = core.status.replay.toReplay[0];
            if (!route.startsWith('choices:')) {
                return false;
            } else {
                return Number(route.slice(8)) === 1;
            }
        })();
        core.status.replay.toReplay.shift();
        if (confirm) {
            yesCallback?.();
        } else {
            noCallback?.();
        }
    } else {
        const {
            routedConfirm,
            getConfirm,
            mainUIController,
            HALF_WIDTH,
            HALF_HEIGHT,
            POP_BOX_WIDTH
        } = Mota.require('@user/client-modules');
        const fn = noRoute ? getConfirm : routedConfirm;
        const confirm = await fn(
            mainUIController,
            text,
            [HALF_WIDTH, HALF_HEIGHT, void 0, void 0, 0.5, 0.5],
            POP_BOX_WIDTH
        );
        if (confirm) {
            yesCallback?.();
        } else {
            noCallback?.();
        }
    }
};

ui.prototype._drawConfirmBox_getRect = function (contents, ctx) {
    // deprecated.
};

////// 绘制等待界面 //////
ui.prototype.drawWaiting = function (text) {
    // deprecated.
};

////// 绘制系统设置界面 //////
ui.prototype._drawSwitchs = function () {
    // deprecated.
};

ui.prototype._drawSwitchs_sounds = function () {
    // deprecated.
};

ui.prototype._drawSwitchs_display = function () {
    // deprecated.
};

ui.prototype._drawSwitchs_action = function () {
    // deprecated.
};

////// 绘制系统菜单栏 //////
ui.prototype._drawSettings = function () {
    // deprecated.
};

////// 绘制存档笔记 //////
ui.prototype._drawNotes = function () {
    // deprecated.
};

////// 绘制快捷商店选择栏 //////
ui.prototype._drawQuickShop = function () {
    const shop = Mota.require('@user/legacy-plugin-data');
    core.status.event.id = 'selectShop';
    var shopList = core.status.shops,
        keys = shop.listShopIds();
    var choices = keys.map(function (shopId) {
        return {
            text: shopList[shopId].textInList,
            color: shop.isShopVisited(shopId) ? null : '#999999'
        };
    });
    choices.push('返回游戏');
    this.drawChoices(null, choices, void 0, true);
};

ui.prototype._drawSyncSave = function () {
    // deprecated.
};

ui.prototype._drawSyncSelect = function () {
    // deprecated.
};

ui.prototype._drawLocalSaveSelect = function () {
    // deprecated.
};

ui.prototype._drawStorageRemove = function () {
    // deprecated.
};

ui.prototype._drawReplay = function () {
    // deprecated.
};

ui.prototype._drawGameInfo = function () {
    // deprecated.
};

ui.prototype.drawPagination = function (page, totalPage, y) {
    // deprecated.
};

ui.prototype._drawCursor = function () {
    // deprecated.
};

ui.prototype.drawBook = function (index) {
    // deprecated.
};

ui.prototype.drawFly = function (page) {
    // deprecated.
};

ui.prototype._drawCenterFly = function () {
    // deprecated.
};

ui.prototype._drawViewMaps = function (index, x, y) {
    // deprecated.
};

ui.prototype._drawViewMaps_drawHint = function () {
    // deprecated.
};

ui.prototype._drawViewMaps_buildData = function (index, x, y) {
    // deprecated.
};

ui.prototype._drawToolbox = function (index) {
    // deprecated.
};

ui.prototype.getToolboxItems = function (cls) {
    return Object.keys(core.status.hero.items[cls] || {})
        .filter(function (id) {
            return !core.material.items[id].hideInToolbox;
        })
        .sort();
};

ui.prototype._drawEquipbox = function (index) {
    // deprecated.
};

ui.prototype._drawSLPanel = function (index, refresh) {
    // deprecated.
};

ui.prototype._drawSLPanel_draw = function (page, max_page) {
    // deprecated.
};

ui.prototype._drawSLPanel_drawBackground = function () {
    // deprecated.
};

ui.prototype._drawSLPanel_loadSave = function (page, callback) {
    // deprecated.
};

ui.prototype._drawSLPanel_drawRecord = function () {
    // deprecated.
};

ui.prototype._drawSLPanel_drawRecords = function (n) {
    // deprecated.
};

ui.prototype._drawKeyBoard = function () {
    // Deprecated.
};

ui.prototype._drawStatistics = function (floorIds) {
    // deprecated.
};

ui.prototype._drawStatistics_buildObj = function () {
    // deprecated.
};

ui.prototype._drawStatistics_add = function (floorId, obj, x1, x2, value) {
    // deprecated.
};

ui.prototype._drawStatistics_floorId = function (floorId, obj) {
    // deprecated.
};

ui.prototype._drawStatistics_enemy = function (floorId, id, obj) {
    // deprecated.
};

ui.prototype._drawStatistics_items = function (floorId, floor, id, obj) {
    // deprecated.
};

ui.prototype._drawStatistics_generateText = function (obj, type, data) {
    // deprecated.
};

ui.prototype._drawHelp = function () {
    // deprecated.
};

// 下面这些由于编辑器还在用，删不了

////// 动态canvas //////

////// canvas创建 //////
ui.prototype.createCanvas = function (name, x, y, width, height, z) {
    // 如果画布已存在则直接调用
    if (core.dymCanvas[name]) {
        this.relocateCanvas(name, x, y);
        this.resizeCanvas(name, width, height);
        core.dymCanvas[name].canvas.style.zIndex = z;
        return core.dymCanvas[name];
    }
    var newCanvas = document.createElement('canvas');
    newCanvas.id = name;
    newCanvas.style.display = 'block';
    newCanvas.setAttribute('_left', x);
    newCanvas.setAttribute('_top', y);
    newCanvas.style.width = width * core.domStyle.scale + 'px';
    newCanvas.style.height = height * core.domStyle.scale + 'px';
    newCanvas.style.left = x * core.domStyle.scale + 'px';
    newCanvas.style.top = y * core.domStyle.scale + 'px';
    newCanvas.style.zIndex = z;
    newCanvas.style.position = 'absolute';
    newCanvas.style.pointerEvents = 'none';
    core.dymCanvas[name] = newCanvas.getContext('2d');
    core.maps._setHDCanvasSize(core.dymCanvas[name], width, height);
    core.dom.gameDraw.appendChild(newCanvas);
    return core.dymCanvas[name];
};

////// canvas重定位 //////
ui.prototype.relocateCanvas = function (name, x, y, useDelta) {
    var ctx = core.getContextByName(name);
    if (!ctx) return null;
    if (x != null) {
        // 增量模式
        if (useDelta) {
            x += parseFloat(ctx.canvas.getAttribute('_left')) || 0;
        }
        ctx.canvas.style.left = x * core.domStyle.scale + 'px';
        ctx.canvas.setAttribute('_left', x);
    }
    if (y != null) {
        // 增量模式
        if (useDelta) {
            y += parseFloat(ctx.canvas.getAttribute('_top')) || 0;
        }
        ctx.canvas.style.top = y * core.domStyle.scale + 'px';
        ctx.canvas.setAttribute('_top', y);
    }
    return ctx;
};

////// canvas旋转 //////
ui.prototype.rotateCanvas = function (name, angle, centerX, centerY) {
    var ctx = core.getContextByName(name);
    if (!ctx) return null;
    var canvas = ctx.canvas;
    angle = angle || 0;
    if (centerX == null || centerY == null) {
        canvas.style.transformOrigin = '';
    } else {
        var left = parseFloat(canvas.getAttribute('_left'));
        var top = parseFloat(canvas.getAttribute('_top'));
        canvas.style.transformOrigin =
            (centerX - left) * core.domStyle.scale +
            'px ' +
            (centerY - top) * core.domStyle.scale +
            'px';
    }
    if (angle == 0) {
        canvas.style.transform = '';
    } else {
        canvas.style.transform = 'rotate(' + angle + 'deg)';
    }
    canvas.setAttribute('_angle', angle);
};

////// canvas重置 //////
ui.prototype.resizeCanvas = function (name, width, height, styleOnly) {
    var ctx = core.getContextByName(name);
    if (!ctx) return null;
    if (width != null) {
        if (!styleOnly && ctx.canvas.hasAttribute('isHD'))
            core.maps._setHDCanvasSize(ctx, width, null);
        ctx.canvas.style.width = width * core.domStyle.scale + 'px';
    }
    if (height != null) {
        if (!styleOnly && ctx.canvas.hasAttribute('isHD'))
            core.maps._setHDCanvasSize(ctx, null, height);
        ctx.canvas.style.height = height * core.domStyle.scale + 'px';
    }
    return ctx;
};
////// canvas删除 //////
ui.prototype.deleteCanvas = function (name) {
    if (name instanceof Function) {
        Object.keys(core.dymCanvas).forEach(function (one) {
            if (name(one)) core.deleteCanvas(one);
        });
        return;
    }

    if (!core.dymCanvas[name]) return null;
    core.dymCanvas[name].canvas.remove();
    delete core.dymCanvas[name];
};

////// 删除所有动态canvas //////
ui.prototype.deleteAllCanvas = function () {
    this.deleteCanvas(function () {
        return true;
    });
};
