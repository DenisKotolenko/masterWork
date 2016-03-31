var Handlebars = {};
(function (Handlebars, undefined) {
    Handlebars.VERSION = "1.0.0";
    Handlebars.COMPILER_REVISION = 4;
    Handlebars.REVISION_CHANGES = {
        1: "<= 1.0.rc.2",
        2: "== 1.0.0-rc.3",
        3: "== 1.0.0-rc.4",
        4: ">= 1.0.0"
    };
    Handlebars.helpers = {};
    Handlebars.partials = {};
    var toString = Object.prototype.toString,
        functionType = "[object Function]",
        objectType = "[object Object]";
    Handlebars.registerHelper = function (name, fn, inverse) {
        if (toString.call(name) === objectType) {
            if (inverse || fn) {
                throw new Handlebars.Exception("Arg not supported with multiple helpers")
            }
            Handlebars.Utils.extend(this.helpers, name)
        } else {
            if (inverse) {
                fn.not = inverse
            }
            this.helpers[name] = fn
        }
    };
    Handlebars.registerPartial = function (name, str) {
        if (toString.call(name) === objectType) {
            Handlebars.Utils.extend(this.partials, name)
        } else {
            this.partials[name] = str
        }
    };
    Handlebars.registerHelper("helperMissing", function (arg) {
        if (arguments.length === 2) {
            return undefined
        } else {
            throw new Error("Missing helper: '" + arg + "'")
        }
    });
    Handlebars.registerHelper("blockHelperMissing", function (context, options) {
        var inverse = options.inverse || function () {}, fn = options.fn;
        var type = toString.call(context);
        if (type === functionType) {
            context = context.call(this)
        }
        if (context === true) {
            return fn(this)
        } else if (context === false || context == null) {
            return inverse(this)
        } else if (type === "[object Array]") {
            if (context.length > 0) {
                return Handlebars.helpers.each(context, options)
            } else {
                return inverse(this)
            }
        } else {
            return fn(context)
        }
    });
    Handlebars.K = function () {};
    Handlebars.createFrame = Object.create || function (object) {
        Handlebars.K.prototype = object;
        var obj = new Handlebars.K;
        Handlebars.K.prototype = null;
        return obj
    };
    Handlebars.logger = {
        DEBUG: 0,
        INFO: 1,
        WARN: 2,
        ERROR: 3,
        level: 3,
        methodMap: {
            0: "debug",
            1: "info",
            2: "warn",
            3: "error"
        },
        log: function (level, obj) {
            if (Handlebars.logger.level <= level) {
                var method = Handlebars.logger.methodMap[level];
                if (typeof console !== "undefined" && console[method]) {
                    console[method].call(console, obj)
                }
            }
        }
    };
    Handlebars.log = function (level, obj) {
        Handlebars.logger.log(level, obj)
    };
    Handlebars.registerHelper("each", function (context, options) {
        var fn = options.fn,
            inverse = options.inverse;
        var i = 0,
            ret = "",
            data;
        var type = toString.call(context);
        if (type === functionType) {
            context = context.call(this)
        }
        if (options.data) {
            data = Handlebars.createFrame(options.data)
        }
        if (context && typeof context === "object") {
            if (context instanceof Array) {
                for (var j = context.length; i < j; i++) {
                    if (data) {
                        data.index = i
                    }
                    ret = ret + fn(context[i], {
                        data: data
                    })
                }
            } else {
                for (var key in context) {
                    if (context.hasOwnProperty(key)) {
                        if (data) {
                            data.key = key
                        }
                        ret = ret + fn(context[key], {
                            data: data
                        });
                        i++
                    }
                }
            }
        }
        if (i === 0) {
            ret = inverse(this)
        }
        return ret
    });
    Handlebars.registerHelper("if", function (conditional, options) {
        var type = toString.call(conditional);
        if (type === functionType) {
            conditional = conditional.call(this)
        }
        if (!conditional || Handlebars.Utils.isEmpty(conditional)) {
            return options.inverse(this)
        } else {
            return options.fn(this)
        }
    });
    Handlebars.registerHelper("unless", function (conditional, options) {
        return Handlebars.helpers["if"].call(this, conditional, {
            fn: options.inverse,
            inverse: options.fn
        })
    });
    Handlebars.registerHelper("with", function (context, options) {
        var type = toString.call(context);
        if (type === functionType) {
            context = context.call(this)
        }
        if (!Handlebars.Utils.isEmpty(context)) return options.fn(context)
    });
    Handlebars.registerHelper("log", function (context, options) {
        var level = options.data && options.data.level != null ? parseInt(options.data.level, 10) : 1;
        Handlebars.log(level, context)
    });
    var errorProps = ["description", "fileName", "lineNumber", "message", "name", "number", "stack"];
    Handlebars.Exception = function (message) {
        var tmp = Error.prototype.constructor.apply(this, arguments);
        for (var idx = 0; idx < errorProps.length; idx++) {
            this[errorProps[idx]] = tmp[errorProps[idx]]
        }
    };
    Handlebars.Exception.prototype = new Error;
    Handlebars.SafeString = function (string) {
        this.string = string
    };
    Handlebars.SafeString.prototype.toString = function () {
        return this.string.toString()
    };
    var escape = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#x27;",
        "`": "&#x60;"
    };
    var badChars = /[&<>"'`]/g;
    var possible = /[&<>"'`]/;
    var escapeChar = function (chr) {
        return escape[chr] || "&amp;"
    };
    Handlebars.Utils = {
        extend: function (obj, value) {
            for (var key in value) {
                if (value.hasOwnProperty(key)) {
                    obj[key] = value[key]
                }
            }
        },
        escapeExpression: function (string) {
            if (string instanceof Handlebars.SafeString) {
                return string.toString()
            } else if (string == null || string === false) {
                return ""
            }
            string = string.toString();
            if (!possible.test(string)) {
                return string
            }
            return string.replace(badChars, escapeChar)
        },
        isEmpty: function (value) {
            if (!value && value !== 0) {
                return true
            } else if (toString.call(value) === "[object Array]" && value.length === 0) {
                return true
            } else {
                return false
            }
        }
    };
    Handlebars.VM = {
        template: function (templateSpec) {
            var container = {
                escapeExpression: Handlebars.Utils.escapeExpression,
                invokePartial: Handlebars.VM.invokePartial,
                programs: [],
                program: function (i, fn, data) {
                    var programWrapper = this.programs[i];
                    if (data) {
                        programWrapper = Handlebars.VM.program(i, fn, data)
                    } else if (!programWrapper) {
                        programWrapper = this.programs[i] = Handlebars.VM.program(i, fn)
                    }
                    return programWrapper
                },
                merge: function (param, common) {
                    var ret = param || common;
                    if (param && common) {
                        ret = {};
                        Handlebars.Utils.extend(ret, common);
                        Handlebars.Utils.extend(ret, param)
                    }
                    return ret
                },
                programWithDepth: Handlebars.VM.programWithDepth,
                noop: Handlebars.VM.noop,
                compilerInfo: null
            };
            return function (context, options) {
                options = options || {};
                var result = templateSpec.call(container, Handlebars, context, options.helpers, options.partials, options.data);
                var compilerInfo = container.compilerInfo || [],
                    compilerRevision = compilerInfo[0] || 1,
                    currentRevision = Handlebars.COMPILER_REVISION;
                if (compilerRevision !== currentRevision) {
                    if (compilerRevision < currentRevision) {
                        var runtimeVersions = Handlebars.REVISION_CHANGES[currentRevision],
                            compilerVersions = Handlebars.REVISION_CHANGES[compilerRevision];
                        throw "Template was precompiled with an older version of Handlebars than the current runtime. " + "Please update your precompiler to a newer version (" + runtimeVersions + ") or downgrade your runtime to an older version (" + compilerVersions + ")."
                    } else {
                        throw "Template was precompiled with a newer version of Handlebars than the current runtime. " + "Please update your runtime to a newer version (" + compilerInfo[1] + ")."
                    }
                }
                return result
            }
        },
        programWithDepth: function (i, fn, data) {
            var args = Array.prototype.slice.call(arguments, 3);
            var program = function (context, options) {
                options = options || {};
                return fn.apply(this, [context, options.data || data].concat(args))
            };
            program.program = i;
            program.depth = args.length;
            return program
        },
        program: function (i, fn, data) {
            var program = function (context, options) {
                options = options || {};
                return fn(context, options.data || data)
            };
            program.program = i;
            program.depth = 0;
            return program
        },
        noop: function () {
            return ""
        },
        invokePartial: function (partial, name, context, helpers, partials, data) {
            var options = {
                helpers: helpers,
                partials: partials,
                data: data
            };
            if (partial === undefined) {
                throw new Handlebars.Exception("The partial " + name + " could not be found")
            } else if (partial instanceof Function) {
                return partial(context, options)
            } else if (!Handlebars.compile) {
                throw new Handlebars.Exception("The partial " + name + " could not be compiled when running in runtime-only mode")
            } else {
                partials[name] = Handlebars.compile(partial, {
                    data: data !== undefined
                });
                return partials[name](context, options)
            }
        }
    };
    Handlebars.template = Handlebars.VM.template
})(Handlebars);
this["joint"] = this["joint"] || {};
this["joint"]["templates"] = this["joint"]["templates"] || {};
this["joint"]["templates"]["halo.html"] = Handlebars.template(function (Handlebars, depth0, helpers, partials, data) {
    this.compilerInfo = [4, ">= 1.0.0"];
    helpers = this.merge(helpers, Handlebars.helpers);
    data = data || {};
    return '<div class="resize" draggable="false"/>\n<div class="remove" draggable="false"/>\n<div class="clone" draggable="false"/>\n<div class="link" draggable="false"/>\n<div class="fork" draggable="false"/>\n<div class="unlink" draggable="false"/>\n<div class="rotate" draggable="false"/>\n<label class="box"></label>\n'
});
joint.ui.Halo = Backbone.View.extend({
    className: "halo",
    template: "halo",
    events: {
        "mousedown .clone": "startCloning",
        "touchstart .clone": "startCloning",
        "mousedown .fork": "startForking",
        "touchstart .fork": "startForking",
        "mousedown .link": "startLinking",
        "touchstart .link": "startLinking",
        "mousedown .unlink": "unlinkElement",
        "mousedown .remove": "removeElement",
        "touchstart .remove": "removeElement",
        "mousedown .resize": "startResizing",
        "touchstart .resize": "startResizing",
        "mousedown .rotate": "startRotating",
        "touchstart .rotate": "startRotating"
    },
    options: {
        tinyTreshold: 40,
        smallTreshold: 80,
        loopLinkPreferredSide: "top",
        loopLinkWidth: 40,
        boxContent: function (cellView, boxElement) {
            var tmpl = _.template("x: <%= x %>, y: <%= y %>, width: <%= width %>, height: <%= height %>, angle: <%= angle %>");
            var bbox = cellView.model.getBBox();
            return tmpl({
                x: Math.floor(bbox.x),
                y: Math.floor(bbox.y),
                width: bbox.width,
                height: bbox.height,
                angle: Math.floor(cellView.model.get("angle") || 0)
            })
        },
        linkAttributes: {},
        smoothLinks: undefined
    },
    initialize: function () {
        _.bindAll(this, "pointermove", "pointerup", "render", "update", "remove");
        this.options.paper.trigger("halo:create");
        this.listenTo(this.options.graph, "reset", this.remove);
        this.listenTo(this.options.graph, "all", this.update);
        this.listenTo(this.options.paper, "blank:pointerdown halo:create", this.remove);
        this.listenTo(this.options.paper, "scale", this.update);
        $(document.body).on("mousemove touchmove", this.pointermove);
        $(document).on("mouseup touchend", this.pointerup);
        this.options.paper.$el.append(this.$el)
    },
    render: function () {
        this.options.cellView.model.on("remove", this.remove);
        this.$el.html(joint.templates["halo.html"](this.template));
        this.renderMagnets();
        this.update();
        this.$el.addClass("animate");
        this.$el.attr("data-type", this.options.cellView.model.get("type"));
        this.toggleFork();
        return this
    },
    update: function () {
        if (this.options.cellView.model instanceof joint.dia.Link) return;
        if (_.isFunction(this.options.boxContent)) {
            var $box = this.$(".box");
            var content = this.options.boxContent.call(this, this.options.cellView, $box[0]);
            if (content) {
                $box.html(content)
            }
        }
        var bbox = this.options.cellView.getBBox();
        this.$el.toggleClass("tiny", bbox.width < this.options.tinyTreshold && bbox.height < this.options.tinyTreshold);
        this.$el.toggleClass("small", !this.$el.hasClass("tiny") && bbox.width < this.options.smallTreshold && bbox.height < this.options.smallTreshold);
        this.$el.css({
            width: bbox.width,
            height: bbox.height,
            left: bbox.x,
            top: bbox.y
        }).show();
        this.updateMagnets();
        this.toggleUnlink()
    },
    startCloning: function (evt) {
        evt.preventDefault();
        evt.stopPropagation();
        evt = joint.util.normalizeEvent(evt);
        this.options.graph.trigger("batch:start");
        this._action = "clone";
        this._clone = this.options.cellView.model.clone();
        this._clone.unset("z");
        this.options.graph.addCell(this._clone);
        this._clientX = evt.clientX;
        this._clientY = evt.clientY
    },
    startLinking: function (evt) {
        evt.preventDefault();
        evt.stopPropagation();
        evt = joint.util.normalizeEvent(evt);
        this.options.graph.trigger("batch:start");
        this._action = "link";
        var cellView = this.options.cellView;
        var selector = $.data(evt.target, "selector");
        var link = this.options.paper.getDefaultLink(cellView, selector && cellView.el.querySelector(selector));
        link.set("source", {
            id: cellView.model.id,
            selector: selector
        });
        link.set("target", {
            x: 0,
            y: 0
        });
        link.attr(this.options.linkAttributes);
        if (_.isBoolean(this.options.smoothLinks)) {
            link.set("smooth", this.options.smoothLinks)
        }
        this.options.graph.addCell(link, {
            validation: false
        });
        link.set("target", this.options.paper.snapToGrid({
            x: evt.clientX,
            y: evt.clientY
        }));
        this._linkView = this.options.paper.findViewByModel(link);
        this._linkView.startArrowheadMove("target");
        this._clientX = evt.clientX;
        this._clientY = evt.clientY
    },
    startForking: function (evt) {
        evt.preventDefault();
        evt.stopPropagation();
        evt = joint.util.normalizeEvent(evt);
        this.options.graph.trigger("batch:start");
        this._action = "fork";
        this._clone = this.options.cellView.model.clone();
        this._clone.unset("z");
        this.options.graph.addCell(this._clone);
        var link = this.options.paper.getDefaultLink(this.options.cellView);
        link.set("source", {
            id: this.options.cellView.model.id
        });
        link.set("target", {
            id: this._clone.id
        });
        link.attr(this.options.linkAttributes);
        if (_.isBoolean(this.options.smoothLinks)) {
            link.set("smooth", this.options.smoothLinks)
        }
        this.options.graph.addCell(link);
        this._clientX = evt.clientX;
        this._clientY = evt.clientY
    },
    startResizing: function (evt) {
        evt.preventDefault();
        evt.stopPropagation();
        evt = joint.util.normalizeEvent(evt);
        this.options.graph.trigger("batch:start");
        this._action = "resize";
        this._flip = [1, 0, 0, 1, 1, 0, 0, 1][Math.floor(g.normalizeAngle(this.options.cellView.model.get("angle")) / 45)];
        this._clientX = evt.clientX;
        this._clientY = evt.clientY
    },
    startRotating: function (evt) {
        evt.preventDefault();
        evt.stopPropagation();
        evt = joint.util.normalizeEvent(evt);
        this.options.graph.trigger("batch:start");
        this._action = "rotate";
        var bbox = this.options.cellView.getBBox();
        this._center = g.rect(bbox).center();
        if (typeof evt.offsetX === "undefined" || typeof evt.offsetY === "undefined") {
            var targetOffset = $(evt.target).offset();
            evt.offsetX = evt.pageX - targetOffset.left;
            evt.offsetY = evt.pageY - targetOffset.top
        }
        this._rotationStart = g.point(evt.offsetX + evt.target.parentNode.offsetLeft, evt.offsetY + evt.target.parentNode.offsetTop + evt.target.parentNode.offsetHeight);
        var angle = this.options.cellView.model.get("angle");
        this._rotationStartAngle = angle || 0;
        this._clientX = evt.clientX;
        this._clientY = evt.clientY
    },
    pointermove: function (evt) {
        if (!this._action) return;
        evt.preventDefault();
        evt.stopPropagation();
        evt = joint.util.normalizeEvent(evt);
        var clientCoords = this.options.paper.snapToGrid({
            x: evt.clientX,
            y: evt.clientY
        });
        var oldClientCoords = this.options.paper.snapToGrid({
            x: this._clientX,
            y: this._clientY
        });
        var dx = clientCoords.x - oldClientCoords.x;
        var dy = clientCoords.y - oldClientCoords.y;
        switch (this._action) {
        case "resize":
            var size = this.options.cellView.model.get("size");
            var width = Math.max(size.width + (this._flip ? dx : dy), 1);
            var height = Math.max(size.height + (this._flip ? dy : dx), 1);
            this.options.cellView.model.resize(width, height, {
                absolute: true
            });
            this._clientX = evt.clientX;
            this._clientY = evt.clientY;
            break;
        case "rotate":
            dx = evt.clientX - this._clientX;
            dy = evt.clientY - this._clientY;
            var p = g.point(this._rotationStart).offset(dx, dy);
            var a = p.distance(this._center);
            var b = this._center.distance(this._rotationStart);
            var c = this._rotationStart.distance(p);
            var sign = (this._center.x - this._rotationStart.x) * (p.y - this._rotationStart.y) - (this._center.y - this._rotationStart.y) * (p.x - this._rotationStart.x);
            var _angle = Math.acos((a * a + b * b - c * c) / (2 * a * b));
            if (sign <= 0) {
                _angle = -_angle
            }
            var angleDiff = -g.toDeg(_angle);
            angleDiff = g.snapToGrid(angleDiff, 15);
            this.options.cellView.model.rotate(angleDiff + this._rotationStartAngle, true);
            break;
        case "clone":
        case "fork":
            this._clone.translate(dx, dy);
            this._clientX = evt.clientX;
            this._clientY = evt.clientY;
            break;
        case "link":
            this._linkView.pointermove(evt, clientCoords.x, clientCoords.y);
            break
        }
    },
    pointerup: function (evt) {
        if (!this._action) return;
        evt.preventDefault();
        switch (this._action) {
        case "link":
            this._linkView.pointerup(evt);
            var sourceId = this._linkView.model.get("source").id;
            var targetId = this._linkView.model.get("target").id;
            if (sourceId && targetId && sourceId === targetId) {
                this.makeLoopLink(this._linkView.model)
            }
            break
        }
        delete this._linkView;
        delete this._action;
        this.options.graph.trigger("batch:stop")
    },
    remove: function (evt) {
        Backbone.View.prototype.remove.apply(this, arguments);
        $(document.body).off("mousemove touchmove", this.pointermove);
        $(document).off("mouseup touchend", this.pointerup)
    },
    removeElement: function (evt) {
        evt.stopPropagation();
        this.options.cellView.model.remove()
    },
    unlinkElement: function (evt) {
        evt.stopPropagation();
        this.options.graph.removeLinks(this.options.cellView.model)
    },
    toggleUnlink: function () {
        if (this.options.graph.getConnectedLinks(this.options.cellView.model).length > 0) {
            this.$(".unlink").show()
        } else {
            this.$(".unlink").hide()
        }
    },
    toggleFork: function () {
        var clone = this.options.cellView.model.clone();
        var cloneView = this.options.paper.createViewForModel(clone);
        if (!this.options.paper.options.validateConnection(this.options.cellView, null, cloneView, null, "target")) {
            this.$(".fork").hide()
        }
        cloneView.remove();
        clone = null
    },
    makeLoopLink: function (link) {
        var linkWidth = this.options.loopLinkWidth;
        var paperOpt = this.options.paper.options;
        var paperRect = g.rect({
            x: 0,
            y: 0,
            width: paperOpt.width,
            height: paperOpt.height
        });
        var bbox = V(this.options.cellView.el).bbox(false, this.options.paper.viewport);
        var p1, p2;
        var sides = _.uniq([this.options.loopLinkPreferredSide, "top", "bottom", "left", "right"]);
        var sideFound = _.find(sides, function (side) {
            var centre, dx = 0,
                dy = 0;
            switch (side) {
            case "top":
                centre = g.point(bbox.x + bbox.width / 2, bbox.y - linkWidth);
                dx = linkWidth / 2;
                break;
            case "bottom":
                centre = g.point(bbox.x + bbox.width / 2, bbox.y + bbox.height + linkWidth);
                dx = linkWidth / 2;
                break;
            case "left":
                centre = g.point(bbox.x - linkWidth, bbox.y + bbox.height / 2);
                dy = linkWidth / 2;
                break;
            case "right":
                centre = g.point(bbox.x + bbox.width + linkWidth, bbox.y + bbox.height / 2);
                dy = linkWidth / 2;
                break
            }
            p1 = g.point(centre).offset(-dx, -dy);
            p2 = g.point(centre).offset(dx, dy);
            return paperRect.containsPoint(p1) && paperRect.containsPoint(p2)
        }, this);
        if (sideFound) link.set("vertices", [p1, p2])
    },
    renderMagnets: function () {
        this._magnets = [];
        var $link = this.$(".link");
        var magnetElements = this.options.cellView.$('[magnet="true"]');
        if (this.options.magnetFilter) {
            if (_.isFunction(this.options.magnetFilter)) {
                magnetElements = _.filter(magnetElements, this.options.magnetFilter)
            } else {
                magnetElements = magnetElements.filter(this.options.magnetFilter)
            }
        }
        if ($link.length && magnetElements.length) {
            var linkWidth = $link.width();
            var linkHeight = $link.height();
            _.each(magnetElements, function (magnetElement) {
                var magnetClientRect = magnetElement.getBoundingClientRect();
                var $haloElement = $link.clone().addClass("halo-magnet").css({
                    width: Math.min(magnetClientRect.width, linkWidth),
                    height: Math.min(magnetClientRect.height, linkHeight),
                    "background-size": "contain"
                }).data("selector", this.options.cellView.getSelector(magnetElement)).appendTo(this.$el);
                this._magnets.push({
                    $halo: $haloElement,
                    el: magnetElement
                })
            }, this)
        }
        if (this.options.cellView.$el.attr("magnet") == "false") {
            $link.hide();
            this.$(".fork").hide()
        }
    },
    updateMagnets: function () {
        if (this._magnets.length) {
            var hClientRect = this.el.getBoundingClientRect();
            _.each(this._magnets, function (magnet) {
                var mClientRect = magnet.el.getBoundingClientRect();
                magnet.$halo.css({
                    left: mClientRect.left - hClientRect.left + (mClientRect.width - magnet.$halo.width()) / 2,
                    top: mClientRect.top - hClientRect.top + (mClientRect.height - magnet.$halo.height()) / 2
                })
            }, this)
        }
    }
});
(function () {
    var _resize = joint.dia.Element.prototype.resize;
    joint.dia.Element.prototype.resize = resize;

    function resize(width, height, opt) {
        if (_.isUndefined(opt)) {
            return _resize.call(this, width, height)
        }
        opt.direction = opt.direction || "bottom-right";
        var angle = g.normalizeAngle(this.get("angle") || 0);
        var quadrant = {
            "top-right": 0,
            "top-left": 1,
            "bottom-left": 2,
            "bottom-right": 3
        }[opt.direction];
        if (opt.absolute) {
            quadrant += Math.floor((angle + 45) / 90);
            quadrant %= 4
        }
        var bbox = this.getBBox();
        var indentFixedPoint = bbox[["bottomLeft", "corner", "topRight", "origin"][quadrant]]();
        var imageFixedPoint = g.point(indentFixedPoint).rotate(bbox.center(), -angle);
        var radius = Math.sqrt(width * width + height * height) / 2;
        var alpha = quadrant * Math.PI / 2;
        alpha += Math.atan(quadrant % 2 == 0 ? height / width : width / height);
        alpha -= g.toRad(angle);
        var center = g.point.fromPolar(radius, alpha, imageFixedPoint);
        var origin = g.point(center).offset(width / -2, height / -2);
        this.resize(width, height).position(origin.x, origin.y)
    }
})();
var Handlebars = {};
(function (Handlebars, undefined) {
    Handlebars.VERSION = "1.0.0";
    Handlebars.COMPILER_REVISION = 4;
    Handlebars.REVISION_CHANGES = {
        1: "<= 1.0.rc.2",
        2: "== 1.0.0-rc.3",
        3: "== 1.0.0-rc.4",
        4: ">= 1.0.0"
    };
    Handlebars.helpers = {};
    Handlebars.partials = {};
    var toString = Object.prototype.toString,
        functionType = "[object Function]",
        objectType = "[object Object]";
    Handlebars.registerHelper = function (name, fn, inverse) {
        if (toString.call(name) === objectType) {
            if (inverse || fn) {
                throw new Handlebars.Exception("Arg not supported with multiple helpers")
            }
            Handlebars.Utils.extend(this.helpers, name)
        } else {
            if (inverse) {
                fn.not = inverse
            }
            this.helpers[name] = fn
        }
    };
    Handlebars.registerPartial = function (name, str) {
        if (toString.call(name) === objectType) {
            Handlebars.Utils.extend(this.partials, name)
        } else {
            this.partials[name] = str
        }
    };
    Handlebars.registerHelper("helperMissing", function (arg) {
        if (arguments.length === 2) {
            return undefined
        } else {
            throw new Error("Missing helper: '" + arg + "'")
        }
    });
    Handlebars.registerHelper("blockHelperMissing", function (context, options) {
        var inverse = options.inverse || function () {}, fn = options.fn;
        var type = toString.call(context);
        if (type === functionType) {
            context = context.call(this)
        }
        if (context === true) {
            return fn(this)
        } else if (context === false || context == null) {
            return inverse(this)
        } else if (type === "[object Array]") {
            if (context.length > 0) {
                return Handlebars.helpers.each(context, options)
            } else {
                return inverse(this)
            }
        } else {
            return fn(context)
        }
    });
    Handlebars.K = function () {};
    Handlebars.createFrame = Object.create || function (object) {
        Handlebars.K.prototype = object;
        var obj = new Handlebars.K;
        Handlebars.K.prototype = null;
        return obj
    };
    Handlebars.logger = {
        DEBUG: 0,
        INFO: 1,
        WARN: 2,
        ERROR: 3,
        level: 3,
        methodMap: {
            0: "debug",
            1: "info",
            2: "warn",
            3: "error"
        },
        log: function (level, obj) {
            if (Handlebars.logger.level <= level) {
                var method = Handlebars.logger.methodMap[level];
                if (typeof console !== "undefined" && console[method]) {
                    console[method].call(console, obj)
                }
            }
        }
    };
    Handlebars.log = function (level, obj) {
        Handlebars.logger.log(level, obj)
    };
    Handlebars.registerHelper("each", function (context, options) {
        var fn = options.fn,
            inverse = options.inverse;
        var i = 0,
            ret = "",
            data;
        var type = toString.call(context);
        if (type === functionType) {
            context = context.call(this)
        }
        if (options.data) {
            data = Handlebars.createFrame(options.data)
        }
        if (context && typeof context === "object") {
            if (context instanceof Array) {
                for (var j = context.length; i < j; i++) {
                    if (data) {
                        data.index = i
                    }
                    ret = ret + fn(context[i], {
                        data: data
                    })
                }
            } else {
                for (var key in context) {
                    if (context.hasOwnProperty(key)) {
                        if (data) {
                            data.key = key
                        }
                        ret = ret + fn(context[key], {
                            data: data
                        });
                        i++
                    }
                }
            }
        }
        if (i === 0) {
            ret = inverse(this)
        }
        return ret
    });
    Handlebars.registerHelper("if", function (conditional, options) {
        var type = toString.call(conditional);
        if (type === functionType) {
            conditional = conditional.call(this)
        }
        if (!conditional || Handlebars.Utils.isEmpty(conditional)) {
            return options.inverse(this)
        } else {
            return options.fn(this)
        }
    });
    Handlebars.registerHelper("unless", function (conditional, options) {
        return Handlebars.helpers["if"].call(this, conditional, {
            fn: options.inverse,
            inverse: options.fn
        })
    });
    Handlebars.registerHelper("with", function (context, options) {
        var type = toString.call(context);
        if (type === functionType) {
            context = context.call(this)
        }
        if (!Handlebars.Utils.isEmpty(context)) return options.fn(context)
    });
    Handlebars.registerHelper("log", function (context, options) {
        var level = options.data && options.data.level != null ? parseInt(options.data.level, 10) : 1;
        Handlebars.log(level, context)
    });
    var errorProps = ["description", "fileName", "lineNumber", "message", "name", "number", "stack"];
    Handlebars.Exception = function (message) {
        var tmp = Error.prototype.constructor.apply(this, arguments);
        for (var idx = 0; idx < errorProps.length; idx++) {
            this[errorProps[idx]] = tmp[errorProps[idx]]
        }
    };
    Handlebars.Exception.prototype = new Error;
    Handlebars.SafeString = function (string) {
        this.string = string
    };
    Handlebars.SafeString.prototype.toString = function () {
        return this.string.toString()
    };
    var escape = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#x27;",
        "`": "&#x60;"
    };
    var badChars = /[&<>"'`]/g;
    var possible = /[&<>"'`]/;
    var escapeChar = function (chr) {
        return escape[chr] || "&amp;"
    };
    Handlebars.Utils = {
        extend: function (obj, value) {
            for (var key in value) {
                if (value.hasOwnProperty(key)) {
                    obj[key] = value[key]
                }
            }
        },
        escapeExpression: function (string) {
            if (string instanceof Handlebars.SafeString) {
                return string.toString()
            } else if (string == null || string === false) {
                return ""
            }
            string = string.toString();
            if (!possible.test(string)) {
                return string
            }
            return string.replace(badChars, escapeChar)
        },
        isEmpty: function (value) {
            if (!value && value !== 0) {
                return true
            } else if (toString.call(value) === "[object Array]" && value.length === 0) {
                return true
            } else {
                return false
            }
        }
    };
    Handlebars.VM = {
        template: function (templateSpec) {
            var container = {
                escapeExpression: Handlebars.Utils.escapeExpression,
                invokePartial: Handlebars.VM.invokePartial,
                programs: [],
                program: function (i, fn, data) {
                    var programWrapper = this.programs[i];
                    if (data) {
                        programWrapper = Handlebars.VM.program(i, fn, data)
                    } else if (!programWrapper) {
                        programWrapper = this.programs[i] = Handlebars.VM.program(i, fn)
                    }
                    return programWrapper
                },
                merge: function (param, common) {
                    var ret = param || common;
                    if (param && common) {
                        ret = {};
                        Handlebars.Utils.extend(ret, common);
                        Handlebars.Utils.extend(ret, param)
                    }
                    return ret
                },
                programWithDepth: Handlebars.VM.programWithDepth,
                noop: Handlebars.VM.noop,
                compilerInfo: null
            };
            return function (context, options) {
                options = options || {};
                var result = templateSpec.call(container, Handlebars, context, options.helpers, options.partials, options.data);
                var compilerInfo = container.compilerInfo || [],
                    compilerRevision = compilerInfo[0] || 1,
                    currentRevision = Handlebars.COMPILER_REVISION;
                if (compilerRevision !== currentRevision) {
                    if (compilerRevision < currentRevision) {
                        var runtimeVersions = Handlebars.REVISION_CHANGES[currentRevision],
                            compilerVersions = Handlebars.REVISION_CHANGES[compilerRevision];
                        throw "Template was precompiled with an older version of Handlebars than the current runtime. " + "Please update your precompiler to a newer version (" + runtimeVersions + ") or downgrade your runtime to an older version (" + compilerVersions + ")."
                    } else {
                        throw "Template was precompiled with a newer version of Handlebars than the current runtime. " + "Please update your runtime to a newer version (" + compilerInfo[1] + ")."
                    }
                }
                return result
            }
        },
        programWithDepth: function (i, fn, data) {
            var args = Array.prototype.slice.call(arguments, 3);
            var program = function (context, options) {
                options = options || {};
                return fn.apply(this, [context, options.data || data].concat(args))
            };
            program.program = i;
            program.depth = args.length;
            return program
        },
        program: function (i, fn, data) {
            var program = function (context, options) {
                options = options || {};
                return fn(context, options.data || data)
            };
            program.program = i;
            program.depth = 0;
            return program
        },
        noop: function () {
            return ""
        },
        invokePartial: function (partial, name, context, helpers, partials, data) {
            var options = {
                helpers: helpers,
                partials: partials,
                data: data
            };
            if (partial === undefined) {
                throw new Handlebars.Exception("The partial " + name + " could not be found")
            } else if (partial instanceof Function) {
                return partial(context, options)
            } else if (!Handlebars.compile) {
                throw new Handlebars.Exception("The partial " + name + " could not be compiled when running in runtime-only mode")
            } else {
                partials[name] = Handlebars.compile(partial, {
                    data: data !== undefined
                });
                return partials[name](context, options)
            }
        }
    };
    Handlebars.template = Handlebars.VM.template
})(Handlebars);
this["joint"] = this["joint"] || {};
this["joint"]["templates"] = this["joint"]["templates"] || {};
this["joint"]["templates"]["freetransform.html"] = Handlebars.template(function (Handlebars, depth0, helpers, partials, data) {
    this.compilerInfo = [4, ">= 1.0.0"];
    helpers = this.merge(helpers, Handlebars.helpers);
    data = data || {};
    return '<div class="resize" data-position="top-left" draggable="false"/>\n<div class="resize" data-position="top" draggable="false"/>\n<div class="resize" data-position="top-right" draggable="false"/>\n<div class="resize" data-position="right" draggable="false"/>\n<div class="resize" data-position="bottom-right" draggable="false"/>\n<div class="resize" data-position="bottom" draggable="false"/>\n<div class="resize" data-position="bottom-left" draggable="false"/>\n<div class="resize" data-position="left" draggable="false"/>\n<div class="rotate" draggable="false"/>\n\n'
});



joint.ui.FreeTransform = Backbone.View.extend({
    className: "free-transform",
    template: "freetransform",
    events: {
        "mousedown .resize": "startResizing",
        "mousedown .rotate": "startRotating",
        "touchstart .resize": "startResizing",
        "touchstart .rotate": "startRotating"
    },
    options: {
        directions: ["nw", "n", "ne", "e", "se", "s", "sw", "w"]
    },
    initialize: function () {
        _.bindAll(this, "update", "remove", "pointerup", "pointermove");
        this.options.paper.trigger("freetransform:create");
        $(document.body).on("mousemove touchmove", this.pointermove);
        $(document).on("mouseup touchend", this.pointerup);
        this.listenTo(this.options.graph, "all", this.update);
        this.listenTo(this.options.graph, "reset", this.remove);
        this.listenTo(this.options.cell, "remove", this.remove);
        this.listenTo(this.options.paper, "blank:pointerdown freetransform:create", this.remove);
        this.listenTo(this.options.paper, "scale", this.update);
        this.options.paper.$el.append(this.el)
    },
    render: function () {
        this.$el.html(joint.templates["freetransform.html"](this.template));
        this.$el.attr("data-type", this.options.cell.get("type"));
        this.update()
    },
    update: function () {
        var viewportCTM = this.options.paper.viewport.getCTM();
        var bbox = this.options.cell.getBBox();
        bbox.x *= viewportCTM.a;
        bbox.x += viewportCTM.e;
        bbox.y *= viewportCTM.d;
        bbox.y += viewportCTM.f;
        bbox.width *= viewportCTM.a;
        bbox.height *= viewportCTM.d;
        var angle = g.normalizeAngle(this.options.cell.get("angle") || 0);
        var transformVal = "rotate(" + angle + "deg)";
        this.$el.css({
            width: bbox.width + 4,
            height: bbox.height + 4,
            left: bbox.x - 3,
            top: bbox.y - 3,
            transform: transformVal,
            "-webkit-transform": transformVal,
            "-ms-transform": transformVal
        });
        var shift = Math.floor(angle * (this.options.directions.length / 360));
        if (shift != this._previousDirectionsShift) {
            var directions = _.rest(this.options.directions, shift).concat(_.first(this.options.directions, shift));
            this.$(".resize").removeClass("nw n ne e se s sw w").each(function (index, el) {
                $(el).addClass(directions[index])
            });
            this._previousDirectionsShift = shift
        }
    },
    startResizing: function (evt) {
        evt.stopPropagation();
        this.options.graph.trigger("batch:start");
        var direction = $(evt.target).data("position");
        var rx = 0,
            ry = 0;
        _.each(direction.split("-"), function (singleDirection) {
            rx = {
                left: -1,
                right: 1
            }[singleDirection] || rx;
            ry = {
                top: -1,
                bottom: 1
            }[singleDirection] || ry
        });
        direction = {
            top: "top-left",
            bottom: "bottom-right",
            left: "bottom-left",
            right: "top-right"
        }[direction] || direction;
        var selector = {
            "top-right": "bottomLeft",
            "top-left": "corner",
            "bottom-left": "topRight",
            "bottom-right": "origin"
        }[direction];
        this._initial = {
            angle: g.normalizeAngle(this.options.cell.get("angle") || 0),
            resizeX: rx,
            resizeY: ry,
            selector: selector,
            direction: direction
        };
        this._action = "resize";
        this.startOp(evt.target)
    },
    startRotating: function (evt) {
        evt.stopPropagation();
        this.options.graph.trigger("batch:start");
        var center = this.options.cell.getBBox().center();
        var clientCoords = this.options.paper.snapToGrid({
            x: evt.clientX,
            y: evt.clientY
        });
        this._initial = {
            centerRotation: center,
            modelAngle: g.normalizeAngle(this.options.cell.get("angle") || 0),
            startAngle: g.point(clientCoords).theta(center)
        };
        this._action = "rotate";
        this.startOp(evt.target)
    },
    pointermove: function (evt) {
        if (!this._action) return;
        evt = joint.util.normalizeEvent(evt);
        var clientCoords = this.options.paper.snapToGrid({
            x: evt.clientX,
            y: evt.clientY
        });
        var gridSize = this.options.paper.options.gridSize;
        var model = this.options.cell,
            i = this._initial;
        switch (this._action) {
        case "resize":
            var currentRect = model.getBBox();
            var coimageCoords = g.point(clientCoords).rotate(currentRect.center(), i.angle);
            var requestedSize = coimageCoords.difference(currentRect[i.selector]());
            var width = i.resizeX ? requestedSize.x * i.resizeX : currentRect.width;
            var height = i.resizeY ? requestedSize.y * i.resizeY : currentRect.height;
            width = width < gridSize ? gridSize : g.snapToGrid(width, gridSize);
            height = height < gridSize ? gridSize : g.snapToGrid(height, gridSize);
            if (currentRect.width != width || currentRect.height != height) {
                model.resize(width, height, {
                    direction: i.direction
                })
            }
            break;
        case "rotate":
            var theta = i.startAngle - g.point(clientCoords).theta(i.centerRotation);
            model.rotate(g.snapToGrid(i.modelAngle + theta, 15), true);
            break
        }
    },
    pointerup: function (evt) {
        if (!this._action) return;
        this.stopOp();
        this.options.graph.trigger("batch:stop");
        delete this._action;
        delete this._initial
    },
    remove: function (evt) {
        Backbone.View.prototype.remove.apply(this, arguments);
        $("body").off("mousemove touchmove", this.pointermove);
        $(document).off("mouseup touchend", this.pointerup)
    },
    startOp: function (el) {
        if (el) {
            $(el).addClass("in-operation");
            this._elementOp = el
        }
        this.$el.addClass("in-operation")
    },
    stopOp: function () {
        if (this._elementOp) {
            $(this._elementOp).removeClass("in-operation");
            delete this._elementOp
        }
        this.$el.removeClass("in-operation")
    }
});
var Handlebars = {};
(function (Handlebars, undefined) {
    Handlebars.VERSION = "1.0.0";
    Handlebars.COMPILER_REVISION = 4;
    Handlebars.REVISION_CHANGES = {
        1: "<= 1.0.rc.2",
        2: "== 1.0.0-rc.3",
        3: "== 1.0.0-rc.4",
        4: ">= 1.0.0"
    };
    Handlebars.helpers = {};
    Handlebars.partials = {};
    var toString = Object.prototype.toString,
        functionType = "[object Function]",
        objectType = "[object Object]";
    Handlebars.registerHelper = function (name, fn, inverse) {
        if (toString.call(name) === objectType) {
            if (inverse || fn) {
                throw new Handlebars.Exception("Arg not supported with multiple helpers")
            }
            Handlebars.Utils.extend(this.helpers, name)
        } else {
            if (inverse) {
                fn.not = inverse
            }
            this.helpers[name] = fn
        }
    };
    Handlebars.registerPartial = function (name, str) {
        if (toString.call(name) === objectType) {
            Handlebars.Utils.extend(this.partials, name)
        } else {
            this.partials[name] = str
        }
    };
    Handlebars.registerHelper("helperMissing", function (arg) {
        if (arguments.length === 2) {
            return undefined
        } else {
            throw new Error("Missing helper: '" + arg + "'")
        }
    });
    Handlebars.registerHelper("blockHelperMissing", function (context, options) {
        var inverse = options.inverse || function () {}, fn = options.fn;
        var type = toString.call(context);
        if (type === functionType) {
            context = context.call(this)
        }
        if (context === true) {
            return fn(this)
        } else if (context === false || context == null) {
            return inverse(this)
        } else if (type === "[object Array]") {
            if (context.length > 0) {
                return Handlebars.helpers.each(context, options)
            } else {
                return inverse(this)
            }
        } else {
            return fn(context)
        }
    });
    Handlebars.K = function () {};
    Handlebars.createFrame = Object.create || function (object) {
        Handlebars.K.prototype = object;
        var obj = new Handlebars.K;
        Handlebars.K.prototype = null;
        return obj
    };
    Handlebars.logger = {
        DEBUG: 0,
        INFO: 1,
        WARN: 2,
        ERROR: 3,
        level: 3,
        methodMap: {
            0: "debug",
            1: "info",
            2: "warn",
            3: "error"
        },
        log: function (level, obj) {
            if (Handlebars.logger.level <= level) {
                var method = Handlebars.logger.methodMap[level];
                if (typeof console !== "undefined" && console[method]) {
                    console[method].call(console, obj)
                }
            }
        }
    };
    Handlebars.log = function (level, obj) {
        Handlebars.logger.log(level, obj)
    };
    Handlebars.registerHelper("each", function (context, options) {
        var fn = options.fn,
            inverse = options.inverse;
        var i = 0,
            ret = "",
            data;
        var type = toString.call(context);
        if (type === functionType) {
            context = context.call(this)
        }
        if (options.data) {
            data = Handlebars.createFrame(options.data)
        }
        if (context && typeof context === "object") {
            if (context instanceof Array) {
                for (var j = context.length; i < j; i++) {
                    if (data) {
                        data.index = i
                    }
                    ret = ret + fn(context[i], {
                        data: data
                    })
                }
            } else {
                for (var key in context) {
                    if (context.hasOwnProperty(key)) {
                        if (data) {
                            data.key = key
                        }
                        ret = ret + fn(context[key], {
                            data: data
                        });
                        i++
                    }
                }
            }
        }
        if (i === 0) {
            ret = inverse(this)
        }
        return ret
    });
    Handlebars.registerHelper("if", function (conditional, options) {
        var type = toString.call(conditional);
        if (type === functionType) {
            conditional = conditional.call(this)
        }
        if (!conditional || Handlebars.Utils.isEmpty(conditional)) {
            return options.inverse(this)
        } else {
            return options.fn(this)
        }
    });
    Handlebars.registerHelper("unless", function (conditional, options) {
        return Handlebars.helpers["if"].call(this, conditional, {
            fn: options.inverse,
            inverse: options.fn
        })
    });
    Handlebars.registerHelper("with", function (context, options) {
        var type = toString.call(context);
        if (type === functionType) {
            context = context.call(this)
        }
        if (!Handlebars.Utils.isEmpty(context)) return options.fn(context)
    });
    Handlebars.registerHelper("log", function (context, options) {
        var level = options.data && options.data.level != null ? parseInt(options.data.level, 10) : 1;
        Handlebars.log(level, context)
    });
    var errorProps = ["description", "fileName", "lineNumber", "message", "name", "number", "stack"];
    Handlebars.Exception = function (message) {
        var tmp = Error.prototype.constructor.apply(this, arguments);
        for (var idx = 0; idx < errorProps.length; idx++) {
            this[errorProps[idx]] = tmp[errorProps[idx]]
        }
    };
    Handlebars.Exception.prototype = new Error;
    Handlebars.SafeString = function (string) {
        this.string = string
    };
    Handlebars.SafeString.prototype.toString = function () {
        return this.string.toString()
    };
    var escape = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#x27;",
        "`": "&#x60;"
    };
    var badChars = /[&<>"'`]/g;
    var possible = /[&<>"'`]/;
    var escapeChar = function (chr) {
        return escape[chr] || "&amp;"
    };
    Handlebars.Utils = {
        extend: function (obj, value) {
            for (var key in value) {
                if (value.hasOwnProperty(key)) {
                    obj[key] = value[key]
                }
            }
        },
        escapeExpression: function (string) {
            if (string instanceof Handlebars.SafeString) {
                return string.toString()
            } else if (string == null || string === false) {
                return ""
            }
            string = string.toString();
            if (!possible.test(string)) {
                return string
            }
            return string.replace(badChars, escapeChar)
        },
        isEmpty: function (value) {
            if (!value && value !== 0) {
                return true
            } else if (toString.call(value) === "[object Array]" && value.length === 0) {
                return true
            } else {
                return false
            }
        }
    };
    Handlebars.VM = {
        template: function (templateSpec) {
            var container = {
                escapeExpression: Handlebars.Utils.escapeExpression,
                invokePartial: Handlebars.VM.invokePartial,
                programs: [],
                program: function (i, fn, data) {
                    var programWrapper = this.programs[i];
                    if (data) {
                        programWrapper = Handlebars.VM.program(i, fn, data)
                    } else if (!programWrapper) {
                        programWrapper = this.programs[i] = Handlebars.VM.program(i, fn)
                    }
                    return programWrapper
                },
                merge: function (param, common) {
                    var ret = param || common;
                    if (param && common) {
                        ret = {};
                        Handlebars.Utils.extend(ret, common);
                        Handlebars.Utils.extend(ret, param)
                    }
                    return ret
                },
                programWithDepth: Handlebars.VM.programWithDepth,
                noop: Handlebars.VM.noop,
                compilerInfo: null
            };
            return function (context, options) {
                options = options || {};
                var result = templateSpec.call(container, Handlebars, context, options.helpers, options.partials, options.data);
                var compilerInfo = container.compilerInfo || [],
                    compilerRevision = compilerInfo[0] || 1,
                    currentRevision = Handlebars.COMPILER_REVISION;
                if (compilerRevision !== currentRevision) {
                    if (compilerRevision < currentRevision) {
                        var runtimeVersions = Handlebars.REVISION_CHANGES[currentRevision],
                            compilerVersions = Handlebars.REVISION_CHANGES[compilerRevision];
                        throw "Template was precompiled with an older version of Handlebars than the current runtime. " + "Please update your precompiler to a newer version (" + runtimeVersions + ") or downgrade your runtime to an older version (" + compilerVersions + ")."
                    } else {
                        throw "Template was precompiled with a newer version of Handlebars than the current runtime. " + "Please update your runtime to a newer version (" + compilerInfo[1] + ")."
                    }
                }
                return result
            }
        },
        programWithDepth: function (i, fn, data) {
            var args = Array.prototype.slice.call(arguments, 3);
            var program = function (context, options) {
                options = options || {};
                return fn.apply(this, [context, options.data || data].concat(args))
            };
            program.program = i;
            program.depth = args.length;
            return program
        },
        program: function (i, fn, data) {
            var program = function (context, options) {
                options = options || {};
                return fn(context, options.data || data)
            };
            program.program = i;
            program.depth = 0;
            return program
        },
        noop: function () {
            return ""
        },
        invokePartial: function (partial, name, context, helpers, partials, data) {
            var options = {
                helpers: helpers,
                partials: partials,
                data: data
            };
            if (partial === undefined) {
                throw new Handlebars.Exception("The partial " + name + " could not be found")
            } else if (partial instanceof Function) {
                return partial(context, options)
            } else if (!Handlebars.compile) {
                throw new Handlebars.Exception("The partial " + name + " could not be compiled when running in runtime-only mode")
            } else {
                partials[name] = Handlebars.compile(partial, {
                    data: data !== undefined
                });
                return partials[name](context, options)
            }
        }
    };
    Handlebars.template = Handlebars.VM.template
})(Handlebars);
this["joint"] = this["joint"] || {};
this["joint"]["templates"] = this["joint"]["templates"] || {};
this["joint"]["templates"]["inspector"] = this["joint"]["templates"]["inspector"] || {};
this["joint"]["templates"]["inspector"]["color.html"] = Handlebars.template(function (Handlebars, depth0, helpers, partials, data) {
    this.compilerInfo = [4, ">= 1.0.0"];
    helpers = this.merge(helpers, Handlebars.helpers);
    data = data || {};
    var buffer = "",
        stack1, functionType = "function",
        escapeExpression = this.escapeExpression;
    buffer += "<label>";
    if (stack1 = helpers.label) {
        stack1 = stack1.call(depth0, {
            hash: {},
            data: data
        })
    } else {
        stack1 = depth0.label;
        stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1
    }
    buffer += escapeExpression(stack1) + ':</label>\n<input type="color" class="color" data-type="';
    if (stack1 = helpers.type) {
        stack1 = stack1.call(depth0, {
            hash: {},
            data: data
        })
    } else {
        stack1 = depth0.type;
        stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1
    }
    buffer += escapeExpression(stack1) + '" data-attribute="';
    if (stack1 = helpers.attribute) {
        stack1 = stack1.call(depth0, {
            hash: {},
            data: data
        })
    } else {
        stack1 = depth0.attribute;
        stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1
    }
    buffer += escapeExpression(stack1) + '" value="';
    if (stack1 = helpers.value) {
        stack1 = stack1.call(depth0, {
            hash: {},
            data: data
        })
    } else {
        stack1 = depth0.value;
        stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1
    }
    buffer += escapeExpression(stack1) + '" />\n';
    return buffer
});
this["joint"]["templates"]["inspector"]["group.html"] = Handlebars.template(function (Handlebars, depth0, helpers, partials, data) {
    this.compilerInfo = [4, ">= 1.0.0"];
    helpers = this.merge(helpers, Handlebars.helpers);
    data = data || {};
    var buffer = "",
        stack1, functionType = "function",
        escapeExpression = this.escapeExpression;
    buffer += '<div class="group">\n    <h3 class="group-label">';
    if (stack1 = helpers.label) {
        stack1 = stack1.call(depth0, {
            hash: {},
            data: data
        })
    } else {
        stack1 = depth0.label;
        stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1
    }
    buffer += escapeExpression(stack1) + "</h3>\n</div>\n";
    return buffer
});
this["joint"]["templates"]["inspector"]["list-item.html"] = Handlebars.template(function (Handlebars, depth0, helpers, partials, data) {
    this.compilerInfo = [4, ">= 1.0.0"];
    helpers = this.merge(helpers, Handlebars.helpers);
    data = data || {};
    var buffer = "",
        stack1, functionType = "function",
        escapeExpression = this.escapeExpression;
    buffer += '<div class="list-item" data-index="';
    if (stack1 = helpers.index) {
        stack1 = stack1.call(depth0, {
            hash: {},
            data: data
        })
    } else {
        stack1 = depth0.index;
        stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1
    }
    buffer += escapeExpression(stack1) + '">\n    <button class="btn-list-del">-</button>\n</div>\n';
    return buffer
});
this["joint"]["templates"]["inspector"]["list.html"] = Handlebars.template(function (Handlebars, depth0, helpers, partials, data) {
    this.compilerInfo = [4, ">= 1.0.0"];
    helpers = this.merge(helpers, Handlebars.helpers);
    data = data || {};
    var buffer = "",
        stack1, functionType = "function",
        escapeExpression = this.escapeExpression;
    buffer += "<label>";
    if (stack1 = helpers.label) {
        stack1 = stack1.call(depth0, {
            hash: {},
            data: data
        })
    } else {
        stack1 = depth0.label;
        stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1
    }
    buffer += escapeExpression(stack1) + ':</label>\n<div class="list" data-type="';
    if (stack1 = helpers.type) {
        stack1 = stack1.call(depth0, {
            hash: {},
            data: data
        })
    } else {
        stack1 = depth0.type;
        stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1
    }
    buffer += escapeExpression(stack1) + '" data-attribute="';
    if (stack1 = helpers.attribute) {
        stack1 = stack1.call(depth0, {
            hash: {},
            data: data
        })
    } else {
        stack1 = depth0.attribute;
        stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1
    }
    buffer += escapeExpression(stack1) + '">\n    <button class="btn-list-add">+</button>\n    <div class="list-items">\n    </div>\n</div>\n';
    return buffer
});
this["joint"]["templates"]["inspector"]["number.html"] = Handlebars.template(function (Handlebars, depth0, helpers, partials, data) {
    this.compilerInfo = [4, ">= 1.0.0"];
    helpers = this.merge(helpers, Handlebars.helpers);
    data = data || {};
    var buffer = "",
        stack1, functionType = "function",
        escapeExpression = this.escapeExpression;
    buffer += "<label>";
    if (stack1 = helpers.label) {
        stack1 = stack1.call(depth0, {
            hash: {},
            data: data
        })
    } else {
        stack1 = depth0.label;
        stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1
    }
    buffer += escapeExpression(stack1) + ':</label>\n<input type="number" class="number" data-type="';
    if (stack1 = helpers.type) {
        stack1 = stack1.call(depth0, {
            hash: {},
            data: data
        })
    } else {
        stack1 = depth0.type;
        stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1
    }
    buffer += escapeExpression(stack1) + '" data-attribute="';
    if (stack1 = helpers.attribute) {
        stack1 = stack1.call(depth0, {
            hash: {},
            data: data
        })
    } else {
        stack1 = depth0.attribute;
        stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1
    }
    buffer += escapeExpression(stack1) + '" value="';
    if (stack1 = helpers.value) {
        stack1 = stack1.call(depth0, {
            hash: {},
            data: data
        })
    } else {
        stack1 = depth0.value;
        stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1
    }
    buffer += escapeExpression(stack1) + '"/>\n';
    return buffer
});
this["joint"]["templates"]["inspector"]["object-property.html"] = Handlebars.template(function (Handlebars, depth0, helpers, partials, data) {
    this.compilerInfo = [4, ">= 1.0.0"];
    helpers = this.merge(helpers, Handlebars.helpers);
    data = data || {};
    var buffer = "",
        stack1, functionType = "function",
        escapeExpression = this.escapeExpression;
    buffer += '<div class="object-property" data-property="';
    if (stack1 = helpers.property) {
        stack1 = stack1.call(depth0, {
            hash: {},
            data: data
        })
    } else {
        stack1 = depth0.property;
        stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1
    }
    buffer += escapeExpression(stack1) + '">\n</div>\n';
    return buffer
});
this["joint"]["templates"]["inspector"]["object.html"] = Handlebars.template(function (Handlebars, depth0, helpers, partials, data) {
    this.compilerInfo = [4, ">= 1.0.0"];
    helpers = this.merge(helpers, Handlebars.helpers);
    data = data || {};
    var buffer = "",
        stack1, functionType = "function",
        escapeExpression = this.escapeExpression;
    buffer += "<label>";
    if (stack1 = helpers.label) {
        stack1 = stack1.call(depth0, {
            hash: {},
            data: data
        })
    } else {
        stack1 = depth0.label;
        stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1
    }
    buffer += escapeExpression(stack1) + ':</label>\n<div class="object" data-type="';
    if (stack1 = helpers.type) {
        stack1 = stack1.call(depth0, {
            hash: {},
            data: data
        })
    } else {
        stack1 = depth0.type;
        stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1
    }
    buffer += escapeExpression(stack1) + '" data-attribute="';
    if (stack1 = helpers.attribute) {
        stack1 = stack1.call(depth0, {
            hash: {},
            data: data
        })
    } else {
        stack1 = depth0.attribute;
        stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1
    }
    buffer += escapeExpression(stack1) + '">\n    <div class="object-properties"></div>\n</div>\n';
    return buffer
});
this["joint"]["templates"]["inspector"]["range.html"] = Handlebars.template(function (Handlebars, depth0, helpers, partials, data) {
    this.compilerInfo = [4, ">= 1.0.0"];
    helpers = this.merge(helpers, Handlebars.helpers);
    data = data || {};
    var buffer = "",
        stack1, stack2, functionType = "function",
        escapeExpression = this.escapeExpression;
    buffer += "<form onchange=\"$(this).find('output').text(range.value)\">\n    <label>";
    if (stack1 = helpers.label) {
        stack1 = stack1.call(depth0, {
            hash: {},
            data: data
        })
    } else {
        stack1 = depth0.label;
        stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1
    }
    buffer += escapeExpression(stack1) + ": (<output>";
    if (stack1 = helpers.value) {
        stack1 = stack1.call(depth0, {
            hash: {},
            data: data
        })
    } else {
        stack1 = depth0.value;
        stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1
    }
    buffer += escapeExpression(stack1) + "</output>" + escapeExpression((stack1 = (stack1 = depth0.options, stack1 == null || stack1 === false ? stack1 : stack1.unit), typeof stack1 === functionType ? stack1.apply(depth0) : stack1)) + ')</label>\n    <input type="range" class="range" name="range" data-type="';
    if (stack2 = helpers.type) {
        stack2 = stack2.call(depth0, {
            hash: {},
            data: data
        })
    } else {
        stack2 = depth0.type;
        stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2
    }
    buffer += escapeExpression(stack2) + '" data-attribute="';
    if (stack2 = helpers.attribute) {
        stack2 = stack2.call(depth0, {
            hash: {},
            data: data
        })
    } else {
        stack2 = depth0.attribute;
        stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2
    }
    buffer += escapeExpression(stack2) + '" min="' + escapeExpression((stack1 = (stack1 = depth0.options, stack1 == null || stack1 === false ? stack1 : stack1.min), typeof stack1 === functionType ? stack1.apply(depth0) : stack1)) + '" max="' + escapeExpression((stack1 = (stack1 = depth0.options, stack1 == null || stack1 === false ? stack1 : stack1.max), typeof stack1 === functionType ? stack1.apply(depth0) : stack1)) + '" step="' + escapeExpression((stack1 = (stack1 = depth0.options, stack1 == null || stack1 === false ? stack1 : stack1.step), typeof stack1 === functionType ? stack1.apply(depth0) : stack1)) + '" value="';
    if (stack2 = helpers.value) {
        stack2 = stack2.call(depth0, {
            hash: {},
            data: data
        })
    } else {
        stack2 = depth0.value;
        stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2
    }
    buffer += escapeExpression(stack2) + '"/>\n</form>\n';
    return buffer
});
this["joint"]["templates"]["inspector"]["select.html"] = Handlebars.template(function (Handlebars, depth0, helpers, partials, data) {
    this.compilerInfo = [4, ">= 1.0.0"];
    helpers = this.merge(helpers, Handlebars.helpers);
    data = data || {};
    var buffer = "",
        stack1, stack2, functionType = "function",
        escapeExpression = this.escapeExpression,
        self = this,
        helperMissing = helpers.helperMissing;

    function program1(depth0, data) {
        var buffer = "",
            stack1;
        buffer += ' multiple size="' + escapeExpression((stack1 = (stack1 = (stack1 = depth0.options, stack1 == null || stack1 === false ? stack1 : stack1.options), stack1 == null || stack1 === false ? stack1 : stack1.length), typeof stack1 === functionType ? stack1.apply(depth0) : stack1)) + '" ';
        return buffer
    }

    function program3(depth0, data, depth1) {
        var buffer = "",
            stack1, stack2, options;
        buffer += '\n    <option val="' + escapeExpression(typeof depth0 === functionType ? depth0.apply(depth0) : depth0) + '" ';
        options = {
            hash: {},
            inverse: self.noop,
            fn: self.program(4, program4, data),
            data: data
        };
        stack2 = (stack1 = helpers["is-or-contains"] || depth0["is-or-contains"], stack1 ? stack1.call(depth0, depth0, depth1.value, options) : helperMissing.call(depth0, "is-or-contains", depth0, depth1.value, options));
        if (stack2 || stack2 === 0) {
            buffer += stack2
        }
        buffer += ">" + escapeExpression(typeof depth0 === functionType ? depth0.apply(depth0) : depth0) + "</option>\n    ";
        return buffer
    }

    function program4(depth0, data) {
        return " selected "
    }
    buffer += "<label>";
    if (stack1 = helpers.label) {
        stack1 = stack1.call(depth0, {
            hash: {},
            data: data
        })
    } else {
        stack1 = depth0.label;
        stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1
    }
    buffer += escapeExpression(stack1) + ':</label>\n<select class="select" data-type="';
    if (stack1 = helpers.type) {
        stack1 = stack1.call(depth0, {
            hash: {},
            data: data
        })
    } else {
        stack1 = depth0.type;
        stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1
    }
    buffer += escapeExpression(stack1) + '" data-attribute="';
    if (stack1 = helpers.attribute) {
        stack1 = stack1.call(depth0, {
            hash: {},
            data: data
        })
    } else {
        stack1 = depth0.attribute;
        stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1
    }
    buffer += escapeExpression(stack1) + '" value="';
    if (stack1 = helpers.value) {
        stack1 = stack1.call(depth0, {
            hash: {},
            data: data
        })
    } else {
        stack1 = depth0.value;
        stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1
    }
    buffer += escapeExpression(stack1) + '" ';
    stack2 = helpers["if"].call(depth0, (stack1 = depth0.options, stack1 == null || stack1 === false ? stack1 : stack1.multiple), {
        hash: {},
        inverse: self.noop,
        fn: self.program(1, program1, data),
        data: data
    });
    if (stack2 || stack2 === 0) {
        buffer += stack2
    }
    buffer += ">\n    ";
    stack2 = helpers.each.call(depth0, (stack1 = depth0.options, stack1 == null || stack1 === false ? stack1 : stack1.options), {
        hash: {},
        inverse: self.noop,
        fn: self.programWithDepth(3, program3, data, depth0),
        data: data
    });
    if (stack2 || stack2 === 0) {
        buffer += stack2
    }
    buffer += "\n</select>\n";
    return buffer
});
this["joint"]["templates"]["inspector"]["text.html"] = Handlebars.template(function (Handlebars, depth0, helpers, partials, data) {
    this.compilerInfo = [4, ">= 1.0.0"];
    helpers = this.merge(helpers, Handlebars.helpers);
    data = data || {};
    var buffer = "",
        stack1, functionType = "function",
        escapeExpression = this.escapeExpression;
    buffer += "<label>";
    if (stack1 = helpers.label) {
        stack1 = stack1.call(depth0, {
            hash: {},
            data: data
        })
    } else {
        stack1 = depth0.label;
        stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1
    }
    buffer += escapeExpression(stack1) + ':</label>\n<input type="text" class="text" data-type="';
    if (stack1 = helpers.type) {
        stack1 = stack1.call(depth0, {
            hash: {},
            data: data
        })
    } else {
        stack1 = depth0.type;
        stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1
    }
    buffer += escapeExpression(stack1) + '" data-attribute="';
    if (stack1 = helpers.attribute) {
        stack1 = stack1.call(depth0, {
            hash: {},
            data: data
        })
    } else {
        stack1 = depth0.attribute;
        stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1
    }
    buffer += escapeExpression(stack1) + '" value="';
    if (stack1 = helpers.value) {
        stack1 = stack1.call(depth0, {
            hash: {},
            data: data
        })
    } else {
        stack1 = depth0.value;
        stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1
    }
    buffer += escapeExpression(stack1) + '" />\n';
    return buffer
});
this["joint"]["templates"]["inspector"]["textarea.html"] = Handlebars.template(function (Handlebars, depth0, helpers, partials, data) {
    this.compilerInfo = [4, ">= 1.0.0"];
    helpers = this.merge(helpers, Handlebars.helpers);
    data = data || {};
    var buffer = "",
        stack1, functionType = "function",
        escapeExpression = this.escapeExpression;
    buffer += "<label>";
    if (stack1 = helpers.label) {
        stack1 = stack1.call(depth0, {
            hash: {},
            data: data
        })
    } else {
        stack1 = depth0.label;
        stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1
    }
    buffer += escapeExpression(stack1) + ':</label>\n<textarea class="textarea" data-type="';
    if (stack1 = helpers.type) {
        stack1 = stack1.call(depth0, {
            hash: {},
            data: data
        })
    } else {
        stack1 = depth0.type;
        stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1
    }
    buffer += escapeExpression(stack1) + '" data-attribute="';
    if (stack1 = helpers.attribute) {
        stack1 = stack1.call(depth0, {
            hash: {},
            data: data
        })
    } else {
        stack1 = depth0.attribute;
        stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1
    }
    buffer += escapeExpression(stack1) + '">';
    if (stack1 = helpers.value) {
        stack1 = stack1.call(depth0, {
            hash: {},
            data: data
        })
    } else {
        stack1 = depth0.value;
        stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1
    }
    buffer += escapeExpression(stack1) + "</textarea>\n";
    return buffer
});
this["joint"]["templates"]["inspector"]["toggle.html"] = Handlebars.template(function (Handlebars, depth0, helpers, partials, data) {
    this.compilerInfo = [4, ">= 1.0.0"];
    helpers = this.merge(helpers, Handlebars.helpers);
    data = data || {};
    var buffer = "",
        stack1, functionType = "function",
        escapeExpression = this.escapeExpression,
        self = this;

    function program1(depth0, data) {
        return " checked "
    }
    buffer += "<label>";
    if (stack1 = helpers.label) {
        stack1 = stack1.call(depth0, {
            hash: {},
            data: data
        })
    } else {
        stack1 = depth0.label;
        stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1
    }
    buffer += escapeExpression(stack1) + ':</label>\n<div class="toggle">\n    <input type="checkbox" data-type="';
    if (stack1 = helpers.type) {
        stack1 = stack1.call(depth0, {
            hash: {},
            data: data
        })
    } else {
        stack1 = depth0.type;
        stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1
    }
    buffer += escapeExpression(stack1) + '" data-attribute="';
    if (stack1 = helpers.attribute) {
        stack1 = stack1.call(depth0, {
            hash: {},
            data: data
        })
    } else {
        stack1 = depth0.attribute;
        stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1
    }
    buffer += escapeExpression(stack1) + '" ';
    stack1 = helpers["if"].call(depth0, depth0.value, {
        hash: {},
        inverse: self.noop,
        fn: self.program(1, program1, data),
        data: data
    });
    if (stack1 || stack1 === 0) {
        buffer += stack1
    }
    buffer += " />\n    <span><i></i></span>\n</div>\n";
    return buffer
});
Handlebars.registerHelper("is", function (value, test, options) {
    if (value == test) {
        return options.fn(this)
    }
    return options.inverse(this)
});
Handlebars.registerHelper("is-or-contains", function (value, test, options) {
    if (_.isArray(test) ? _.contains(test, value) : value == test) {
        return options.fn(this)
    }
    return options.inverse(this)
});
Handlebars.registerPartial("list-item", joint.templates.inspector["list-item.html"]);
joint.ui.Inspector = Backbone.View.extend({
    className: "inspector",
    options: {
        cellView: undefined,
        cell: undefined,
        live: true
    },
    events: {
        mousedown: "startBatchCommand",
        change: "onChangeInput",
        "click .group-label": "onGroupLabelClick",
        "click .btn-list-add": "addListItem",
        "click .btn-list-del": "deleteListItem"
    },
    initialize: function () {
        this.options.groups = this.options.groups || {};
        _.bindAll(this, "stopBatchCommand");
        $(document).on("mouseup", this.stopBatchCommand);
        this.flatAttributes = joint.util.flattenObject(this.options.inputs, "/", function (obj) {
            return obj.type
        });
        this._when = {};
        var attributesArray = _.map(this.flatAttributes, function (options, path) {
            if (options.when && options.when.eq) {
                _.each(options.when.eq, function (condValue, condPath) {
                    var dependant = {
                        value: condValue,
                        path: path
                    };
                    (this._when[condPath] || (this._when[condPath] = [])).push(dependant)
                }, this)
            }
            if (options.when && options.when.regex) {
                _.each(options.when.regex, function (condRegex, condPath) {
                    var dependant = {
                        regex: condRegex,
                        path: path
                    };
                    (this._when[condPath] || (this._when[condPath] = [])).push(dependant)
                }, this)
            }
            options.path = path;
            return options
        }, this);
        this.groupedFlatAttributes = _.sortBy(attributesArray, function (options, path) {
            var groupOptions = this.options.groups[options.group];
            return groupOptions ? "a" + groupOptions.index + "b" + options.index : Number.MAX_VALUE
        }, this);
        this.on("render", function () {
            this._byPath = {};
            _.each(this.$("[data-attribute]"), function (attribute) {
                var $attribute = $(attribute);
                this._byPath[$attribute.attr("data-attribute")] = $attribute
            }, this)
        }, this);
        this.listenTo(this.getModel(), "all", this.onCellChange, this)
    },
    getModel: function () {
        return this.options.cell || this.options.cellView.model
    },
    onCellChange: function (eventName, cell, change, opt) {
        opt = opt || {};
        if (opt["inspector_" + this.cid]) return;
        switch (eventName) {
        case "remove":
            this.remove();
            break;
        case "change:position":
            this.updateInputPosition();
            break;
        case "change:size":
            this.updateInputSize();
            break;
        case "change:angle":
            this.updateInputAngle();
            break;
        case "change:source":
        case "change:target":
            break;
        default:
            var changeAttributeEvent = "change:";
            if (eventName.slice(0, changeAttributeEvent.length) === changeAttributeEvent) {
                this.render()
            }
            break
        }
    },
    render: function () {
        this.$el.empty();
        var lastGroup;
        var $groups = [];
        var $group;
        _.each(this.groupedFlatAttributes, function (options) {
            if (lastGroup !== options.group) {
                var groupOptions = this.options.groups[options.group];
                var groupLabel = groupOptions ? groupOptions.label || options.group : options.group;
                $group = $(joint.templates.inspector["group.html"]({
                    label: groupLabel
                }));
                $group.attr("data-name", options.group);
                if (groupOptions && groupOptions.closed) $group.addClass("closed");
                $groups.push($group)
            }
            this.renderTemplate($group, options, options.path);
            lastGroup = options.group
        }, this);
        this.$el.append($groups);
        this.trigger("render");
        return this
    },
    getCellAttributeValue: function (path, options) {
        var cell = this.getModel();
        var value = joint.util.getByPath(cell.attributes, path, "/");
        if (!options) return value;
        if (_.isUndefined(value) && !_.isUndefined(options.defaultValue)) {
            value = options.defaultValue
        }
        if (options.valueRegExp) {
            if (_.isUndefined(value)) {
                throw new Error("Inspector: defaultValue must be present when valueRegExp is used.")
            }
            var valueMatch = value.match(new RegExp(options.valueRegExp));
            value = valueMatch && valueMatch[2]
        }
        return value
    },
    guard: function (options) {
        var valid = true;
        if (options.when && options.when.eq) {
            var notValid = _.find(options.when.eq, function (condValue, condPath) {
                var value = this.getCellAttributeValue(condPath);
                if (value !== condValue) return true;
                return false
            }, this);
            if (notValid) valid = false
        }
        if (options.when && options.when.regex) {
            var notValid = _.find(options.when.regex, function (condRegex, condPath) {
                var value = this.getCellAttributeValue(condPath);
                if (!new RegExp(condRegex).test(value)) return true;
                return false
            }, this);
            if (notValid) valid = false
        }
        return !valid
    },
    renderTemplate: function ($el, options, path) {
        $el = $el || this.$el;
        var value = this.getCellAttributeValue(path, options);
        var inputHtml = joint.templates.inspector[options.type + ".html"]({
            options: options,
            type: options.type,
            label: options.label || path,
            attribute: path,
            value: value
        });
        var $field = $('<div class="field"></div>').attr("data-field", path);
        var $input = $(inputHtml);
        $field.append($input);
        if (this.guard(options)) $field.addClass("hidden");
        _.each(options.attrs, function (attrs, selector) {
            $field.find(selector).addBack().filter(selector).attr(attrs)
        });
        if (options.type === "list") {
            _.each(value, function (itemValue, idx) {
                var $listItem = $(joint.templates.inspector["list-item.html"]({
                    index: idx
                }));
                this.renderTemplate($listItem, options.item, path + "/" + idx);
                $input.children(".list-items").append($listItem)
            }, this)
        } else if (options.type === "object") {
            options.flatAttributes = joint.util.flattenObject(options.properties, "/", function (obj) {
                return obj.type
            });
            var attributesArray = _.map(options.flatAttributes, function (options, path) {
                options.path = path;
                return options
            });
            attributesArray = _.sortBy(attributesArray, function (options) {
                return options.index
            });
            _.each(attributesArray, function (propertyOptions) {
                var $objectProperty = $(joint.templates.inspector["object-property.html"]({
                    property: propertyOptions.path
                }));
                this.renderTemplate($objectProperty, propertyOptions, path + "/" + propertyOptions.path);
                $input.children(".object-properties").append($objectProperty)
            }, this)
        }
        $el.append($field)
    },
    updateInputPosition: function () {
        var $inputX = this._byPath["position/x"];
        var $inputY = this._byPath["position/y"];
        var position = this.getModel().get("position");
        if ($inputX) {
            $inputX.val(position.x)
        }
        if ($inputY) {
            $inputY.val(position.y)
        }
    },
    updateInputSize: function () {
        var $inputWidth = this._byPath["size/width"];
        var $inputHeight = this._byPath["size/height"];
        var size = this.getModel().get("size");
        if ($inputWidth) {
            $inputWidth.val(size.width)
        }
        if ($inputHeight) {
            $inputHeight.val(size.height)
        }
    },
    updateInputAngle: function () {
        var $inputAngle = this._byPath["angle"];
        var angle = this.getModel().get("angle");
        if ($inputAngle) {
            $inputAngle.val(angle)
        }
    },
    onChangeInput: function (evt) {
        if (this.options.live) {
            this.updateCell(evt.target)
        }
        var $input = $(evt.target);
        var path = $input.attr("data-attribute");
        var type = $input.attr("data-type");
        var value = this.parse(type, $input.val(), $input[0]);
        var dependants = this._when[path];
        this.trigger("change:" + path, value, $input[0]);
        if (dependants) {
            _.each(dependants, function (dependant) {
                var $attribute = this._byPath[dependant.path];
                var $field = $attribute.closest(".field");
                var valid = false;
                if (dependant.regex && new RegExp(dependant.regex).test(value)) {
                    valid = true
                } else if (value === dependant.value) {
                    valid = true
                }
                if (valid) $field.removeClass("hidden");
                else $field.addClass("hidden")
            }, this)
        }
    },
    getOptions: function ($attribute) {
        if ($attribute.length === 0) return undefined;
        var path = $attribute.attr("data-attribute");
        var type = $attribute.attr("data-type");
        var options = this.flatAttributes[path];
        if (!options) {
            var $parentAttribute = $attribute.parent().closest("[data-attribute]");
            var parentPath = $parentAttribute.attr("data-attribute");
            options = this.getOptions($parentAttribute);
            var childPath = path.replace(parentPath + "/", "");
            var parent = options;
            options = parent.item || parent.flatAttributes[childPath];
            options.parent = parent
        }
        return options
    },
    updateCell: function () {
        var cell = this.getModel();
        _.each(this._byPath, function ($attribute, path) {
            if ($attribute.hasClass("hidden")) return;
            var type = $attribute.attr("data-type");
            var value;
            var options;
            var kind;
            switch (type) {
            case "list":
                this.setProperty(path, []);
                break;
            case "object":
                break;
            default:
                value = this.parse(type, $attribute.val(), $attribute[0]);
				if(path=="attrs/grp/text"){
					updateChildrenWithSameGroup(joint.util.getByPath(cell.attributes, path, "/"),value);
				}
				if(path=="attrs/subgrp/text"){
					updateChildrenWithSameGroup(joint.util.getByPath(cell.attributes, path, "/"),value);
				}
                options = this.getOptions($attribute);
                if (options.valueRegExp) {
                    var oldValue = joint.util.getByPath(cell.attributes, path, "/") || options.defaultValue;

					value = oldValue.replace(new RegExp(options.valueRegExp), "$1" + value + "$3")
                
				}
                this.setProperty(path, value);
                break
            }
        }, this)
    },
    setProperty: function (path, value) {
        var cell = this.getModel();
        var pathArray = path.split("/");
        var property = pathArray[0];
        var oldValue;
        var opt = {};
        opt["inspector_" + this.cid] = true;
        if (pathArray.length > 1) {
            var attributes = _.cloneDeep(cell.attributes);
            oldValue = joint.util.getByPath(attributes, path, "/");
            var update = {};
            var initializer = update;
            var prevProperty = property;
            _.each(_.rest(pathArray), function (key) {
                initializer = initializer[prevProperty] = _.isFinite(Number(key)) ? [] : {};
                prevProperty = key
            });
            update = joint.util.setByPath(update, path, value, "/");
            _.merge(attributes, update);
            cell.set(property, attributes[property], opt)
        } else {
            oldValue = cell.get(property);
            cell.set(property, value, opt)
        }
    },
    parse: function (type, value, targetElement) {
        switch (type) {
        case "number":
            value = parseFloat(value);
            break;
        case "toggle":
            value = targetElement.checked;
            break;
        default:
            value = value;
            break
        }
        return value
    },
    startBatchCommand: function () {
        this.getModel().trigger("batch:start")
    },
    stopBatchCommand: function () {
        this.getModel().trigger("batch:stop")
    },
    addListItem: function (evt) {
        var $target = $(evt.target);
        var $attribute = $target.closest("[data-attribute]");
        var path = $attribute.attr("data-attribute");
        var options = this.getOptions($attribute);
        var $lastListItem = $attribute.children(".list-items").children(".list-item").last();
        var lastIndex = $lastListItem.length === 0 ? -1 : parseInt($lastListItem.attr("data-index"), 10);
        var index = lastIndex + 1;
        var $listItem = $(joint.templates.inspector["list-item.html"]({
            index: index
        }));
        this.renderTemplate($listItem, options.item, path + "/" + index);
        $target.parent().children(".list-items").append($listItem);
        $listItem.find("input").focus();
        this.trigger("render");
        if (this.options.live) {
            this.updateCell()
        }
    },
    deleteListItem: function (evt) {
        var $listItem = $(evt.target).closest(".list-item");
        $listItem.nextAll(".list-item").each(function () {
            var index = parseInt($(this).attr("data-index"), 10);
            var newIndex = index - 1;
            $(this).find("[data-attribute]").each(function () {
                $(this).attr("data-attribute", $(this).attr("data-attribute").replace("/" + index, "/" + newIndex))
            });
            $(this).attr("data-index", newIndex)
        });
        $listItem.remove();
        this.trigger("render");
        if (this.options.live) {
            this.updateCell()
        }
    },
    remove: function () {
        $(document).off("mouseup", this.stopBatchCommand);
        return Backbone.View.prototype.remove.apply(this, arguments)
    },
    onGroupLabelClick: function (evt) {
        evt.preventDefault();
        var $group = $(evt.target).closest(".group");
        this.toggleGroup($group.data("name"))
    },
    toggleGroup: function (name) {
        this.$('.group[data-name="' + name + '"]').toggleClass("closed")
    },
    closeGroup: function (name) {
        this.$('.group[data-name="' + name + '"]').addClass("closed")
    },
    openGroup: function (name) {
        this.$('.group[data-name="' + name + '"]').removeClass("closed")
    },
    closeGroups: function () {
        this.$(".group").addClass("closed")
    },
    openGroups: function () {
        this.$(".group").removeClass("closed")
    }
});
joint.ui.SelectionView = Backbone.View.extend({
    options: {
        paper: undefined,
        graph: undefined
    },
    className: "selection",
    events: {
        "mousedown .selection-box": "startTranslatingSelection",
        "touchstart .selection-box": "startTranslatingSelection"
    },
    initialize: function () {
        _.bindAll(this, "startSelecting", "stopSelecting", "adjustSelection");
        $(document.body).on("mouseup touchend", this.stopSelecting);
        $(document.body).on("mousemove touchmove", this.adjustSelection);
        this.options.paper.$el.append(this.$el)
    },
    startTranslatingSelection: function (evt) {
        evt.stopPropagation();
        evt = joint.util.normalizeEvent(evt);
        this._action = "translating";
        this.options.graph.trigger("batch:start");
        var snappedClientCoords = this.options.paper.snapToGrid(g.point(evt.clientX, evt.clientY));
        this._snappedClientX = snappedClientCoords.x;
        this._snappedClientY = snappedClientCoords.y;
        this.trigger("selection-box:pointerdown", evt)
    },
    startSelecting: function (evt, x, y) {
        evt = joint.util.normalizeEvent(evt);
        this.$el.removeClass("selected");
        this.$el.empty();
        this.model.reset([]);
        this._action = "selecting";
        this._clientX = evt.clientX;
        this._clientY = evt.clientY;
        var paperElement = evt.target.parentElement || evt.target.parentNode;
        var paperOffset = $(paperElement).offset();
        var paperScrollLeft = paperElement.scrollLeft;
        var paperScrollTop = paperElement.scrollTop;
        this._offsetX = evt.offsetX === undefined ? evt.clientX - paperOffset.left + window.pageXOffset + paperScrollLeft : evt.offsetX;
        this._offsetY = evt.offsetY === undefined ? evt.clientY - paperOffset.top + window.pageYOffset + paperScrollTop : evt.offsetY;
        this.$el.css({
            width: 1,
            height: 1,
            left: this._offsetX,
            top: this._offsetY
        }).show()
    },
    adjustSelection: function (evt) {
        evt = joint.util.normalizeEvent(evt);
        var dx;
        var dy;
        switch (this._action) {
        case "selecting":
            dx = evt.clientX - this._clientX;
            dy = evt.clientY - this._clientY;
            var width = this.$el.width();
            var height = this.$el.height();
            var left = parseInt(this.$el.css("left"), 10);
            var top = parseInt(this.$el.css("top"), 10);
            this.$el.css({
                left: dx < 0 ? this._offsetX + dx : left,
                top: dy < 0 ? this._offsetY + dy : top,
                width: Math.abs(dx),
                height: Math.abs(dy)
            });
            break;
        case "translating":
            var snappedClientCoords = this.options.paper.snapToGrid(g.point(evt.clientX, evt.clientY));
            var snappedClientX = snappedClientCoords.x;
            var snappedClientY = snappedClientCoords.y;
            dx = snappedClientX - this._snappedClientX;
            dy = snappedClientY - this._snappedClientY;
            var processedLinks = {};
            this.model.each(function (element) {
                element.translate(dx, dy);
                var connectedLinks = this.options.graph.getConnectedLinks(element);
                _.each(connectedLinks, function (link) {
                    if (processedLinks[link.id]) return;
                    var vertices = link.get("vertices");
                    if (vertices && vertices.length) {
                        var newVertices = [];
                        _.each(vertices, function (vertex) {
                            newVertices.push({
                                x: vertex.x + dx,
                                y: vertex.y + dy
                            })
                        });
                        link.set("vertices", newVertices)
                    }
                    processedLinks[link.id] = true
                })
            }, this);
            if (dx || dy) {
                var paperScale = V(this.options.paper.viewport).scale();
                dx *= paperScale.sx;
                dy *= paperScale.sy;
                this.$(".selection-box").each(function () {
                    var left = parseFloat($(this).css("left"), 10);
                    var top = parseFloat($(this).css("top"), 10);
                    $(this).css({
                        left: left + dx,
                        top: top + dy
                    })
                });
                this._snappedClientX = snappedClientX;
                this._snappedClientY = snappedClientY
            }
            this.trigger("selection-box:pointermove", evt);
            break
        }
    },
    stopSelecting: function (evt) {
        switch (this._action) {
        case "selecting":
            var offset = this.$el.offset();
            var width = this.$el.width();
            var height = this.$el.height();
            var localPoint = V(this.options.paper.svg).toLocalPoint(offset.left, offset.top);
            localPoint.x -= window.pageXOffset;
            localPoint.y -= window.pageYOffset;
            var elementViews = this.options.paper.findViewsInArea(g.rect(localPoint.x, localPoint.y, width, height));
            if (elementViews.length) {
                _.each(elementViews, this.createSelectionBox, this);
                this.$el.addClass("selected")
            } else {
                this.$el.hide()
            }
            this.model.reset(_.pluck(elementViews, "model"));
            break;
        case "translating":
            this.options.graph.trigger("batch:stop");
            this.trigger("selection-box:pointerup", evt);
            break;
        case "cherry-picking":
            break;
        default:
            this.$el.hide().empty();
            this.model.reset([]);
            break
        }
        delete this._action
    },
    cancelSelection: function () {
        this.$(".selection-box").remove();
        this.$el.hide().removeClass("selected");
        this.model.reset([])
    },
    destroySelectionBox: function (elementView) {
        this.$('[data-model="' + elementView.model.get("id") + '"]').remove();
        if (this.$(".selection-box").length === 0) {
            this.$el.hide().removeClass("selected")
        }
    },
    createSelectionBox: function (elementView) {
        var viewBbox = elementView.getBBox();
        var $selectionBox = $("<div/>", {
            "class": "selection-box",
            "data-model": elementView.model.get("id")
        });
        $selectionBox.css({
            left: viewBbox.x,
            top: viewBbox.y,
            width: viewBbox.width,
            height: viewBbox.height
        });
        this.$el.append($selectionBox);
        this.$el.addClass("selected").show();
        this._action = "cherry-picking"
    }
});
