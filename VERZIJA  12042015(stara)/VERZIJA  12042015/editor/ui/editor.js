var libdevicesLoaded = {};
var Rappid = Backbone.Router.extend({
    routes: {
        "*path": "home"
    },
    initialize: function (options) {
        this.options = options || {}
    },
    home: function () {
        this.initializeEditor()
    },
    initializeEditor: function () {
        this.inspectorClosedGroups = {};
        this.initializePaper();
        this.initializeStencil();
        this.initializeSelection();
        this.initializeHaloAndInspector();
        this.initializeClipboard();
        this.initializeCommandManager();
        this.initializeToolbar();
        if (this.options.channelUrl) {
            this.initializeChannel(this.options.channelUrl)
        }
    },
    initializePaper: function () {
        this.graph = new joint.dia.Graph;
        this.paperScroller = new joint.ui.PaperScroller({
            autoResizePaper: true
        });
        this.paper = new joint.dia.Paper({
            el: this.paperScroller.el,
            width: 1e3,
            height: 1e3,
            gridSize: 10,
            perpendicularLinks: true,
            model: this.graph,

            defaultLink: new joint.dia.Link({
                labels: [
                    { position: .5, attrs: { text: { text: 'o)' } } }
                ],
                attrs: {

                    ".marker-source": {
                        d: "M 10 0 L 0 5 L 10 10 z",
                        transform: "scale(0.001)"
                    },
                    ".marker-target": {
                        d: "M 10 0 L 0 5 L 10 10 z"
                    },
                    ".connection": {
                        stroke: "black"
                    }
                }
            })
        });
        this.paperScroller.options.paper = this.paper;
        $(".paper-container").append(this.paperScroller.render().el);
        this.paperScroller.center();
        this.graph.on("add", this.initializeLinkTooltips, this)
    },
    initializeLinkTooltips: function (cell) {
        if (cell instanceof joint.dia.Link) {
            var linkView = this.paper.findViewByModel(cell);
            new joint.ui.Tooltip({
                className: "tooltip small",
                target: linkView.$(".tool-options"),
                content: "Click to open Inspector for this link",
                left: linkView.$(".tool-options"),
                direction: "left"
            })
        }
    },
    initializeStencil: function () {
        this.stencil = new joint.ui.Stencil({
            graph: this.graph,
            paper: this.paper,
            width: 240,
            groups: Stencil.groups
        });
        $(".stencil-container").append(this.stencil.render().el);
        _.each(Stencil.groups, function (group, name) {
            this.stencil.load(Stencil.shapes[name], name);
            joint.layout.GridLayout.layout(this.stencil.getGraph(name), {
                columnWidth: this.stencil.options.width / 2 - 10,
                columns: 2,
                rowHeight: 80,
                resizeToFit: true,
                dy: 10,
                dx: 10
            });
            this.stencil.getPaper(name).fitToContent(1, 1, 10)
        }, this);
		$( "div[data-name='libdevices']" ).append("<select id='libname' />");
		$( "div[data-name='libdevices']" ).prepend("<div style='color:black'>Add to lib: <input type='file' id='addToLib' name='addToLib'/></div>");
		$( "div[data-name='libdevices']" ).prepend("<button id='saveLib'>Save lib</button>");
		$( "div[data-name='libdevices']" ).prepend("<div style='color:black'>Load lib: <input type='file' id='loadLib' name='loadLib'/></div>");
		$(".stencil-container .btn-expand").on("click", _.bind(this.stencil.openGroups, this.stencil));
        $(".stencil-container .btn-collapse").on("click", _.bind(this.stencil.closeGroups, this.stencil));
        this.initializeStencilTooltips()
    },
    initializeStencilTooltips: function () {
        _.each(this.stencil.graphs, function (graph) {
            graph.get("cells").each(function (cell) {
                new joint.ui.Tooltip({
                    target: '.stencil [model-id="' + cell.id + '"]',
                    content: cell.get("type").split(".").join(" "),
                    left: ".stencil",
                    direction: "left"
                })
            })
        })
    },
    initializeSelection: function () {
        this.selection = new Backbone.Collection;
        this.selectionView = new joint.ui.SelectionView({
            paper: this.paper,
            graph: this.graph,
            model: this.selection
        });
        this.paper.on("blank:pointerdown", function (evt, x, y) {
            if (_.contains(KeyboardJS.activeKeys(), "shift")) {
                this.selectionView.startSelecting(evt, x, y)
            } else {
                this.paperScroller.startPanning(evt, x, y)
            }
        }, this);
        this.paper.on("cell:pointerdown", function (cellView, evt) {
            if ((evt.ctrlKey || evt.metaKey) && !(cellView.model instanceof joint.dia.Link)) {
                this.selectionView.createSelectionBox(cellView);
                this.selection.add(cellView.model)
            }
        }, this);
        this.selectionView.on("selection-box:pointerdown", function (evt) {
            if (evt.ctrlKey || evt.metaKey) {
                var cell = this.selection.get($(evt.target).data("model"));
                this.selectionView.destroySelectionBox(this.paper.findViewByModel(cell));
                this.selection.reset(this.selection.without(cell))
            }
        }, this);
        this.paper.el.oncontextmenu = function (evt) {
            evt.preventDefault()
        };
        KeyboardJS.on("delete, backspace", _.bind(function () {
            this.commandManager.initBatchCommand();
            this.selection.invoke("remove");
            this.commandManager.storeBatchCommand();
            this.selectionView.cancelSelection()
        }, this))
    },
    createInspector: function (cellView) {
        if (!this.inspector || this.inspector.options.cellView !== cellView) {
            if (this.inspector) {
                this.inspectorClosedGroups[this.inspector.options.cellView.model.id] = _.map(app.inspector.$(".group.closed"), function (g) {
                    return $(g).index()
                });
                this.inspector.remove()
            }
            var inspectorDefs = InspectorDefs[cellView.model.get("type")];
            this.inspector = new joint.ui.Inspector({
                inputs: inspectorDefs ? inspectorDefs.inputs : CommonInspectorInputs,
                groups: inspectorDefs ? inspectorDefs.groups : CommonInspectorGroups,
                cellView: cellView
            });
            this.initializeInspectorTooltips();
            this.inspector.render();
            $(".inspector-container").html(this.inspector.el);
            if (this.inspectorClosedGroups[cellView.model.id]) {
                _.each(this.inspector.$(".group"), function (g, i) {
                    if (_.contains(this.inspectorClosedGroups[cellView.model.id], $(g).index())) {
                        $(g).addClass("closed")
                    }
                }, this)
            } else {
                this.inspector.$(".group:not(:first-child)").addClass("closed")
            }
        }
    },
    initializeInspectorTooltips: function () {
        this.inspector.on("render", function () {
            this.inspector.$("[data-tooltip]").each(function () {
                var $label = $(this);
                new joint.ui.Tooltip({
                    target: $label,
                    content: $label.data("tooltip"),
                    right: ".inspector",
                    direction: "right"
                })
            })
        }, this)
    },
    initializeHaloAndInspector: function () {
        this.paper.on("cell:pointerup", function (cellView, evt) {
            if (cellView.model instanceof joint.dia.Link || this.selection.contains(cellView.model)) return;
            var freetransform = new joint.ui.FreeTransform({
                graph: this.graph,
                paper: this.paper,
                cell: cellView.model
            });
            var halo = new joint.ui.Halo({
                graph: this.graph,
                paper: this.paper,
                cellView: cellView
            });
            freetransform.render();
            halo.render();
            this.initializeHaloTooltips(halo);
            this.createInspector(cellView);
            this.selection.reset([cellView.model]);

        }, this);
        this.paper.on("link:options", function (evt, cellView, x, y) {
            this.createInspector(cellView)
        }, this)
    },
    initializeHaloTooltips: function (halo) {
        new joint.ui.Tooltip({
            className: "tooltip small",
            target: halo.$(".remove"),
            content: "Click to remove the object",
            direction: "right",
            right: halo.$(".remove"),
            padding: 15
        });
        new joint.ui.Tooltip({
            className: "tooltip small",
            target: halo.$(".clone"),
            content: "Click and drag to clone the object",
            direction: "left",
            left: halo.$(".clone"),
            padding: 15
        });
        new joint.ui.Tooltip({
            className: "tooltip small",
            target: halo.$(".unlink"),
            content: "Click to break all connections to other objects",
            direction: "right",
            right: halo.$(".unlink"),
            padding: 15
        });
        new joint.ui.Tooltip({
            className: "tooltip small",
            target: halo.$(".link"),
            content: "Click and drag to connect the object",
            direction: "left",
            left: halo.$(".link"),
            padding: 15
        });
        new joint.ui.Tooltip({
            className: "tooltip small",
            target: halo.$(".rotate"),
            content: "Click and drag to rotate the object",
            direction: "right",
            right: halo.$(".rotate"),
            padding: 15
        });
		halo.changeHandle('fork', function(e) {
			e.preventDefault();
			$("#confModal input").val("");
			$("#confModal").modal("show");
		});
		
    },
    initializeClipboard: function () {
        this.clipboard = new joint.ui.Clipboard;
        KeyboardJS.on("ctrl + c", _.bind(function () {
            this.clipboard.copyElements(this.selection, this.graph, {
                translate: {
                    dx: 20,
                    dy: 20
                },
                useLocalStorage: true
            })
        }, this));
        KeyboardJS.on("ctrl + v", _.bind(function () {
            this.clipboard.pasteCells(this.graph);
            this.selectionView.cancelSelection();
            var selectionTmp = [];
            this.clipboard.each(function (cell) {
                if (cell.get("type") === "link") return;
                selectionTmp.push(this.graph.getCell(cell.id));
                this.selectionView.createSelectionBox(this.paper.findViewByModel(cell))
            }, this);
            this.selection.reset(selectionTmp)
        }, this));
        KeyboardJS.on("ctrl + x", _.bind(function () {
            var originalCells = this.clipboard.copyElements(this.selection, this.graph, {
                useLocalStorage: true
            });
            this.commandManager.initBatchCommand();
            _.invoke(originalCells, "remove");
            this.commandManager.storeBatchCommand();
            this.selectionView.cancelSelection()
        }, this))
    },
    initializeCommandManager: function () {
        this.commandManager = new joint.dia.CommandManager({
            graph: this.graph
        });
        KeyboardJS.on("ctrl + z", _.bind(function () {
            this.commandManager.undo();
            this.selectionView.cancelSelection()
        }, this));
        KeyboardJS.on("ctrl + y", _.bind(function () {
            this.commandManager.redo();
            this.selectionView.cancelSelection()
        }, this))
    },
    initializeValidator: function () {
        this.validator = new joint.dia.Validator({
            commandManager: this.commandManager
        });
        this.validator.validate("change:position change:size add", _.bind(function (err, command, next) {
            if (command.action === "add" && command.batch) return next();
            var cell = command.data.attributes || this.graph.getCell(command.data.id).toJSON();
            var area = g.rect(cell.position.x, cell.position.y, cell.size.width, cell.size.height);
            if (_.find(this.graph.getElements(), function (e) {
                var position = e.get("position");
                var size = e.get("size");
                return e.id !== cell.id && area.intersect(g.rect(position.x, position.y, size.width, size.height))
            })) return next("Another cell in the way!")
        }, this));
        this.validator.on("invalid", function (message) {
            $(".statusbar-container").text(message).addClass("error");
            _.delay(function () {
                $(".statusbar-container").text("").removeClass("error")
            }, 1500)
        })
    },
    initializeToolbar: function () {
        this.initializeToolbarTooltips();
        $("#btn-undo").on("click", _.bind(this.commandManager.undo, this.commandManager));
        $("#btn-redo").on("click", _.bind(this.commandManager.redo, this.commandManager));
        $("#btn-clear").on("click", _.bind(this.graph.clear, this.graph));
        $("#btn-svg").on("click", _.bind(this.paper.openAsSVG, this.paper));
        $("#btn-png").on("click", _.bind(this.openAsPNG, this));
        $("#btn-A").on("mousedown", _.bind(this.createAnnotation, this));
        $("#btn-R").on("mousedown", _.bind(this.openRule, this));
        $("#btn-zoom-in").on("click", _.bind(this.zoomIn, this));
        $("#btn-zoom-out").on("click", _.bind(this.zoomOut, this));
        $("#btn-fullscreen").on("click", _.bind(this.toggleFullscreen, this));
        $("#btn-print").on("click", _.bind(this.paper.print, this.paper));
        $("#btn-to-front").on("mousedown", _.bind(function (evt) {
            this.clipboard.copyElements(this.selection, this.graph, {
                translate: {
                    dx: 20,
                    dy: 20
                },
                useLocalStorage: true
            });
        }, this));
        $("#btn-to-back").on("mousedown", _.bind(function (evt) {
            this.clipboard.pasteCells(this.graph,this.paper);
            this.selectionView.cancelSelection();
            var selectionTmp = [];
            this.clipboard.each(function (cell) {
                if (cell.get("type") === "link") return;
                selectionTmp.push(this.graph.getCell(cell.id));
                this.selectionView.createSelectionBox(this.paper.findViewByModel(cell))
            }, this);
            this.selection.reset(selectionTmp);
        }, this));
        $("#btn-layout").on("click", _.bind(this.layoutDirectedGraph, this));
        $("#input-gridsize").on("change", _.bind(function (evt) {
            var gridSize = parseInt(evt.target.value, 10);
            $("#output-gridsize").text(gridSize);
            this.setGrid(gridSize)
        }, this))
    },
    initializeToolbarTooltips: function () {
        $(".toolbar-container [data-tooltip]").each(function () {
            new joint.ui.Tooltip({
                target: $(this),
                content: $(this).data("tooltip"),
                top: ".toolbar-container",
                direction: "top"
            })
        })
    },
	createAnnotation: function () {
        var el1 = new joint.shapes.iot.Annotation({
         	attrs: {
			    ".labelAnnotation": {
				'font-size': 17,
					text: "Annotation",
                    fill: "#000000",
                    stroke: "#000000",
                    "stroke-width": 0
                }
            }
        });
		var newX=300;
		var newY=300;
		this.selection.each(function (element) {
			newX = element.get("position").x-40;
			newY = element.get("position").y;
		});
		el1.position(newX,newY);
		this.graph.addCell(el1);
    },
	openRule: function () {
        $('#RuleModal').modal('show');
		if(selectedRule!=undefined){
			editor.getSession().setValue(rules[selectedRule]);
		}
    },
    openAsPNG: function () {
        var windowFeatures = "menubar=yes,location=yes,resizable=yes,scrollbars=yes,status=yes";
        var windowName = _.uniqueId("png_output");
        var imageWindow = window.open("", windowName, windowFeatures);
        this.paper.toPNG(function (dataURL) {
            imageWindow.document.write('<img src="' + dataURL + '"/>')
        }, {
            padding: 10
        })
    },
    zoom: function (newZoomLevel, ox, oy) {
        if (_.isUndefined(this.zoomLevel)) {
            this.zoomLevel = 1
        }
        if (newZoomLevel > .2 && newZoomLevel < 20) {
            ox = ox || (this.paper.el.scrollLeft + this.paper.el.clientWidth / 2) / this.zoomLevel;
            oy = oy || (this.paper.el.scrollTop + this.paper.el.clientHeight / 2) / this.zoomLevel;
            this.paper.scale(newZoomLevel, newZoomLevel, ox, oy);
            this.zoomLevel = newZoomLevel
        }
    },
    zoomOut: function () {
        this.zoom((this.zoomLevel || 1) - .2)
    },
    zoomIn: function () {
        this.zoom((this.zoomLevel || 1) + .2)
    },
    toggleFullscreen: function () {
        var el = document.body;

        function prefixedResult(el, prop) {
            var prefixes = ["webkit", "moz", "ms", "o", ""];
            for (var i = 0; i < prefixes.length; i++) {
                var prefix = prefixes[i];
                var propName = prefix ? prefix + prop : prop.substr(0, 1).toLowerCase() + prop.substr(1);
                if (!_.isUndefined(el[propName])) {
                    return _.isFunction(el[propName]) ? el[propName]() : el[propName]
                }
            }
        }
        if (prefixedResult(document, "FullScreen") || prefixedResult(document, "IsFullScreen")) {
            prefixedResult(document, "CancelFullScreen")
        } else {
            prefixedResult(el, "RequestFullScreen")
        }
    },
    setGrid: function (gridSize) {
        this.paper.options.gridSize = gridSize;
        var backgroundImage = this.getGridBackgroundImage(gridSize);
        $(this.paper.svg).css("background-image", 'url("' + backgroundImage + '")')
    },
    getGridBackgroundImage: function (gridSize, color) {
        var canvas = $("<canvas/>", {
            width: gridSize,
            height: gridSize
        });
        canvas[0].width = gridSize;
        canvas[0].height = gridSize;
        var context = canvas[0].getContext("2d");
        context.beginPath();
        context.rect(1, 1, 1, 1);
        context.fillStyle = color || "#AAAAAA";
        context.fill();
        return canvas[0].toDataURL("image/png")
    },
    layoutDirectedGraph: function () {
        this.commandManager.initBatchCommand();
        _.each(this.graph.getLinks(), function (link) {
            link.set("vertices", []);
            if (!link.get("source").id || !link.get("target").id) {
                link.remove()
            }
        });
        joint.layout.DirectedGraph.layout(this.graph, {
            setLinkVertices: false,
            rankDir: "LR",
            rankDir: "TB"
        });
        this.paperScroller.el.scrollLeft = 0;
        this.paperScroller.el.scrollTop = 0;
        this.commandManager.storeBatchCommand()
    },
    initializeChannel: function (url) {
        var room = location.hash && location.hash.substr(1);
        if (!room) {
            room = joint.util.uuid();
            this.navigate("#" + room)
        }
        var channel = this.channel = new joint.com.Channel({
            graph: this.graph,
            url: url || "ws://localhost:4141",
            query: {
                room: room
            }
        });
       //  console.log("room", room, "channel", channel.id);
        var roomUrl = location.href.replace(location.hash, "") + "#" + room;
        $(".statusbar-container .rt-colab").html('Send this link to a friend to <b>collaborate in real-time</b>: <a href="' + roomUrl + '" target="_blank">' + roomUrl + "</a>")
    }
});
