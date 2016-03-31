joint.dia.Paper.prototype.toDataURL = function (callback, options) {
    if (typeof this.toSVG !== "function") throw new Error("The joint.format.svg.js plugin must be loaded.");
    options = options || {};
    var imageWidth, imageHeight, contentHeight, contentWidth, padding = options.padding || 0;
    if (!options.width || !options.height) {
        var clientRect = this.viewport.getBoundingClientRect();
        contentWidth = clientRect.width || 1;
        contentHeight = clientRect.height || 1;
        imageWidth = contentWidth + 2 * padding;
        imageHeight = contentHeight + 2 * padding
    } else {
        imageWidth = options.width;
        imageHeight = options.height;
        padding = Math.min(padding, imageWidth / 2 - 1, imageHeight / 2 - 1);
        contentWidth = imageWidth - 2 * padding;
        contentHeight = imageHeight - 2 * padding
    }
    var img = new Image;
    img.onload = function () {
        var dataURL, context, canvas;

        function createCanvas() {
            canvas = document.createElement("canvas");
            canvas.width = imageWidth;
            canvas.height = imageHeight;
            context = canvas.getContext("2d");
            context.fillStyle = options.backgroundColor || "white";
            context.fillRect(0, 0, imageWidth, imageHeight)
        }
        createCanvas();
        context.drawImage(img, padding, padding, contentWidth, contentHeight);
        try {
            dataURL = canvas.toDataURL(options.type, options.quality)
        } catch (e) {
            if (typeof canvg === "undefined") {
                console.error("Canvas tainted. Canvg library required.");
                return
            }
            createCanvas();
            canvg(canvas, svg, {
                ignoreDimensions: true,
                ignoreClear: true,
                offsetX: padding,
                offsetY: padding,
                renderCallback: function () {
                    dataURL = canvas.toDataURL(options.type, options.quality);
                    callback(dataURL)
                }
            });
            return
        }
        callback(dataURL)
    };
    var svg = this.toSVG();
    svg = svg.replace('width="100%"', 'width="' + contentWidth + '"').replace('height="100%"', 'height="' + contentHeight + '"');
    img.src = "data:image/svg+xml;base64," + btoa(svg)
};
joint.dia.Paper.prototype.toPNG = function (callback, options) {
    options = options || {};
    options.type = "image/png";
    this.toDataURL(callback, options)
};
joint.dia.Paper.prototype.toJPEG = function (callback, options) {
    options = options || {};
    options.type = "image/jpeg";
    this.toDataURL(callback, options)
};
(function () {
    var printEvents = "onbeforeprint" in window;

    function beforePrint(opt, data) {
        var svg = V(this.svg);
        var bbox = this.getContentBBox().moveAndExpand({
            x: -opt.padding,
            y: -opt.padding,
            width: 2 * opt.padding,
            height: 2 * opt.padding
        });
        data.attrs = {
            width: svg.attr("width"),
            height: svg.attr("height"),
            viewBox: svg.attr("viewBox")
        };
        svg.attr({
            width: "100%",
            height: "100%",
            viewBox: [bbox.x, bbox.y, bbox.width, bbox.height].join(" ")
        });
        this.$el.addClass("printarea").addClass(opt.size);
        if (opt.detachBody) {
            data.$parent = this.$el.parent();
            data.$content = $(document.body).children().detach();
            this.$el.appendTo(document.body)
        }
    }

    function afterPrint(opt, data) {
        var svg = V(this.svg);
        svg.attr(data.attrs);
        this.$el.removeClass("printarea").removeClass(opt.size);
        if (opt.detachBody) {
            this.$el.appendTo(data.$parent);
            data.$content.appendTo(document.body)
        }
    }
    joint.dia.Paper.prototype.print = function (opt) {
        opt = opt || {};
        _.defaults(opt, {
            size: "a4",
            padding: 5,
            detachBody: true
        });
        var data = {};
        var localBeforePrint = _.bind(beforePrint, this, opt, data);
        var localAfterPrint = _.bind(afterPrint, this, opt, data);
        if (printEvents) {
            $(window).one("beforeprint", localBeforePrint);
            $(window).one("afterprint", localAfterPrint)
        } else {
            localBeforePrint()
        }
        window.print();
        if (!printEvents) {
            var onceAfterPrint = _.once(localAfterPrint);
            $(document).one("mouseover", onceAfterPrint);
            _.delay(onceAfterPrint, 1e3)
        }
    }
})();
