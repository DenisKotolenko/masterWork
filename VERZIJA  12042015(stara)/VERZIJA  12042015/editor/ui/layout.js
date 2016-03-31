joint.layout = joint.layout || {};
joint.layout.GridLayout = {
    layout: function (graph, opt) {
        opt = opt || {};
        var elements = graph.getElements();
        var columns = opt.columns || 1;
        var dx = opt.dx || 0;
        var dy = opt.dy || 0;
        var columnWidth = opt.columnWidth || this._maxDim(elements, "width") + dx;
        var rowHeight = opt.rowHeight || this._maxDim(elements, "height") + dy;
        var centralize = _.isUndefined(opt.centralize) || opt.centralize !== false;
        var resizeToFit = !! opt.resizeToFit;
        _.each(elements, function (element, index) {
            var cx = 0,
                cy = 0,
                elementSize = element.get("size");
            if (resizeToFit) {
                var elementWidth = columnWidth - 2 * dx;
                var elementHeight = rowHeight - 2 * dy;
                var calcElHeight = elementSize.height * (elementSize.width ? elementWidth / elementSize.width : 1);
                var calcElWidth = elementSize.width * (elementSize.height ? elementHeight / elementSize.height : 1);
                if (calcElHeight > rowHeight) {
                    elementWidth = calcElWidth
                } else {
                    elementHeight = calcElHeight
                }
                elementSize = {
                    width: elementWidth,
                    height: elementHeight
                };
                element.set("size", elementSize)
            }
            if (centralize) {
                cx = (columnWidth - elementSize.width) / 2;
                cy = (rowHeight - elementSize.height) / 2
            }
            element.set("position", {
                x: index % columns * columnWidth + dx + cx,
                y: Math.floor(index / columns) * rowHeight + dy + cy
            })
        })
    },
    _maxDim: function (elements, dimension) {
        return _.reduce(elements, function (max, el) {
            return Math.max(el.get("size")[dimension], max)
        }, 0)
    }
};
(function e(t, n, r) {
    function s(o, u) {
        if (!n[o]) {
            if (!t[o]) {
                var a = typeof require == "function" && require;
                if (!u && a) return a(o, !0);
                if (i) return i(o, !0);
                throw new Error("Cannot find module '" + o + "'")
            }
            var f = n[o] = {
                exports: {}
            };
            t[o][0].call(f.exports, function (e) {
                var n = t[o][1][e];
                return s(n ? n : e)
            }, f, f.exports, e, t, n, r)
        }
        return n[o].exports
    }
    var i = typeof require == "function" && require;
    for (var o = 0; o < r.length; o++) s(r[o]);
    return s
})({
    1: [
        function (require, module, exports) {
            var global = typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {};
            global.dagre = require("./index")
        }, {
            "./index": 2
        }
    ],
    2: [
        function (require, module, exports) {
            exports.Digraph = require("graphlib").Digraph;
            exports.Graph = require("graphlib").Graph;
            exports.layout = require("./lib/layout");
            exports.version = require("./lib/version")
        }, {
            "./lib/layout": 3,
            "./lib/version": 18,
            graphlib: 23
        }
    ],
    3: [
        function (require, module, exports) {
            var util = require("./util"),
                rank = require("./rank"),
                order = require("./order"),
                CGraph = require("graphlib").CGraph,
                CDigraph = require("graphlib").CDigraph;
            module.exports = function () {
                var config = {
                    debugLevel: 0,
                    orderMaxSweeps: order.DEFAULT_MAX_SWEEPS,
                    rankSimplex: false,
                    rankDir: "TB"
                };
                var position = require("./position")();
                var self = {};
                self.orderIters = util.propertyAccessor(self, config, "orderMaxSweeps");
                self.rankSimplex = util.propertyAccessor(self, config, "rankSimplex");
                self.nodeSep = delegateProperty(position.nodeSep);
                self.edgeSep = delegateProperty(position.edgeSep);
                self.universalSep = delegateProperty(position.universalSep);
                self.rankSep = delegateProperty(position.rankSep);
                self.rankDir = util.propertyAccessor(self, config, "rankDir");
                self.debugAlignment = delegateProperty(position.debugAlignment);
                self.debugLevel = util.propertyAccessor(self, config, "debugLevel", function (x) {
                    util.log.level = x;
                    position.debugLevel(x)
                });
                self.run = util.time("Total layout", run);
                self._normalize = normalize;
                return self;

                function initLayoutGraph(inputGraph) {
                    var g = new CDigraph;
                    inputGraph.eachNode(function (u, value) {
                        if (value === undefined) value = {};
                        g.addNode(u, {
                            width: value.width,
                            height: value.height
                        });
                        if (value.hasOwnProperty("rank")) {
                            g.node(u).prefRank = value.rank
                        }
                    });
                    if (inputGraph.parent) {
                        inputGraph.nodes().forEach(function (u) {
                            g.parent(u, inputGraph.parent(u))
                        })
                    }
                    inputGraph.eachEdge(function (e, u, v, value) {
                        if (value === undefined) value = {};
                        var newValue = {
                            e: e,
                            minLen: value.minLen || 1,
                            width: value.width || 0,
                            height: value.height || 0,
                            points: []
                        };
                        g.addEdge(null, u, v, newValue)
                    });
                    var graphValue = inputGraph.graph() || {};
                    g.graph({
                        rankDir: graphValue.rankDir || config.rankDir
                    });
                    return g
                }

                function run(inputGraph) {
                    var rankSep = self.rankSep();
                    var g;
                    try {
                        g = util.time("initLayoutGraph", initLayoutGraph)(inputGraph);
                        if (g.order() === 0) {
                            return g
                        }
                        g.eachEdge(function (e, s, t, a) {
                            a.minLen *= 2
                        });
                        self.rankSep(rankSep / 2);
                        util.time("rank.run", rank.run)(g, config.rankSimplex);
                        util.time("normalize", normalize)(g);
                        util.time("order", order)(g, config.orderMaxSweeps);
                        util.time("position", position.run)(g);
                        util.time("undoNormalize", undoNormalize)(g);
                        util.time("fixupEdgePoints", fixupEdgePoints)(g);
                        util.time("rank.restoreEdges", rank.restoreEdges)(g);
                        return util.time("createFinalGraph", createFinalGraph)(g, inputGraph.isDirected())
                    } finally {
                        self.rankSep(rankSep)
                    }
                }

                function normalize(g) {
                    var dummyCount = 0;
                    g.eachEdge(function (e, s, t, a) {
                        var sourceRank = g.node(s).rank;
                        var targetRank = g.node(t).rank;
                        if (sourceRank + 1 < targetRank) {
                            for (var u = s, rank = sourceRank + 1, i = 0; rank < targetRank; ++rank, ++i) {
                                var v = "_D" + ++dummyCount;
                                var node = {
                                    width: a.width,
                                    height: a.height,
                                    edge: {
                                        id: e,
                                        source: s,
                                        target: t,
                                        attrs: a
                                    },
                                    rank: rank,
                                    dummy: true
                                };
                                if (i === 0) node.index = 0;
                                else if (rank + 1 === targetRank) node.index = 1;
                                g.addNode(v, node);
                                g.addEdge(null, u, v, {});
                                u = v
                            }
                            g.addEdge(null, u, t, {});
                            g.delEdge(e)
                        }
                    })
                }

                function undoNormalize(g) {
                    g.eachNode(function (u, a) {
                        if (a.dummy) {
                            if ("index" in a) {
                                var edge = a.edge;
                                if (!g.hasEdge(edge.id)) {
                                    g.addEdge(edge.id, edge.source, edge.target, edge.attrs)
                                }
                                var points = g.edge(edge.id).points;
                                points[a.index] = {
                                    x: a.x,
                                    y: a.y,
                                    ul: a.ul,
                                    ur: a.ur,
                                    dl: a.dl,
                                    dr: a.dr
                                }
                            }
                            g.delNode(u)
                        }
                    })
                }

                function fixupEdgePoints(g) {
                    g.eachEdge(function (e, s, t, a) {
                        if (a.reversed) a.points.reverse()
                    })
                }

                function createFinalGraph(g, isDirected) {
                    var out = isDirected ? new CDigraph : new CGraph;
                    out.graph(g.graph());
                    g.eachNode(function (u, value) {
                        out.addNode(u, value)
                    });
                    g.eachNode(function (u) {
                        out.parent(u, g.parent(u))
                    });
                    g.eachEdge(function (e, u, v, value) {
                        out.addEdge(value.e, u, v, value)
                    });
                    var maxX = 0,
                        maxY = 0;
                    g.eachNode(function (u, value) {
                        if (!g.children(u).length) {
                            maxX = Math.max(maxX, value.x + value.width / 2);
                            maxY = Math.max(maxY, value.y + value.height / 2)
                        }
                    });
                    g.eachEdge(function (e, u, v, value) {
                        var maxXPoints = Math.max.apply(Math, value.points.map(function (p) {
                            return p.x
                        }));
                        var maxYPoints = Math.max.apply(Math, value.points.map(function (p) {
                            return p.y
                        }));
                        maxX = Math.max(maxX, maxXPoints + value.width / 2);
                        maxY = Math.max(maxY, maxYPoints + value.height / 2)
                    });
                    out.graph().width = maxX;
                    out.graph().height = maxY;
                    return out
                }

                function delegateProperty(f) {
                    return function () {
                        if (!arguments.length) return f();
                        f.apply(null, arguments);
                        return self
                    }
                }
            }
        }, {
            "./order": 4,
            "./position": 9,
            "./rank": 10,
            "./util": 17,
            graphlib: 23
        }
    ],
    4: [
        function (require, module, exports) {
            var util = require("./util"),
                crossCount = require("./order/crossCount"),
                initLayerGraphs = require("./order/initLayerGraphs"),
                initOrder = require("./order/initOrder"),
                sortLayer = require("./order/sortLayer");
            module.exports = order;
            var DEFAULT_MAX_SWEEPS = 24;
            order.DEFAULT_MAX_SWEEPS = DEFAULT_MAX_SWEEPS;

            function order(g, maxSweeps) {
                if (arguments.length < 2) {
                    maxSweeps = DEFAULT_MAX_SWEEPS
                }
                var layerGraphs = initLayerGraphs(g);
                layerGraphs.forEach(function (lg) {
                    lg = lg.filterNodes(function (u) {
                        return !g.children(u).length
                    })
                });
                initOrder(g);
                util.log(2, "Order phase start cross count: " + g.graph().orderInitCC);
                var i, lastBest;
                for (i = 0, lastBest = 0; lastBest < 4 && i < maxSweeps; ++i, ++lastBest) {
                    sweep(g, layerGraphs, i);
                    if (saveBest(g)) {
                        lastBest = 0
                    }
                    util.log(3, "Order phase iter " + i + " cross count: " + g.graph().orderCC)
                }
                restoreBest(g);
                util.log(2, "Order iterations: " + i);
                util.log(2, "Order phase best cross count: " + g.graph().orderCC)
            }

            function predecessorWeights(g, nodes) {
                var weights = {};
                nodes.forEach(function (u) {
                    weights[u] = g.inEdges(u).map(function (e) {
                        return g.node(g.source(e)).order
                    })
                });
                return weights
            }

            function successorWeights(g, nodes) {
                var weights = {};
                nodes.forEach(function (u) {
                    weights[u] = g.outEdges(u).map(function (e) {
                        return g.node(g.target(e)).order
                    })
                });
                return weights
            }

            function sweep(g, layerGraphs, iter) {
                if (iter % 2 === 0) {
                    sweepDown(g, layerGraphs, iter)
                } else {
                    sweepUp(g, layerGraphs, iter)
                }
            }

            function sweepDown(g, layerGraphs) {
                var cg;
                for (i = 1; i < layerGraphs.length; ++i) {
                    cg = sortLayer(layerGraphs[i], cg, predecessorWeights(g, layerGraphs[i].nodes()))
                }
            }

            function sweepUp(g, layerGraphs) {
                var cg;
                for (i = layerGraphs.length - 2; i >= 0; --i) {
                    sortLayer(layerGraphs[i], cg, successorWeights(g, layerGraphs[i].nodes()))
                }
            }

            function saveBest(g) {
                var graph = g.graph();
                var cc = crossCount(g);
                if (!("orderCC" in graph) || graph.orderCC > cc) {
                    graph.orderCC = cc;
                    graph.order = {};
                    g.eachNode(function (u, value) {
                        if ("order" in value) {
                            graph.order[u] = value.order
                        }
                    });
                    return true
                }
                return false
            }

            function restoreBest(g) {
                var order = g.graph().order;
                g.eachNode(function (u, value) {
                    if ("order" in value) {
                        value.order = order[u]
                    }
                })
            }
        }, {
            "./order/crossCount": 5,
            "./order/initLayerGraphs": 6,
            "./order/initOrder": 7,
            "./order/sortLayer": 8,
            "./util": 17
        }
    ],
    5: [
        function (require, module, exports) {
            var util = require("../util");
            module.exports = crossCount;

            function crossCount(g) {
                var cc = 0;
                var ordering = util.ordering(g);
                for (var i = 1; i < ordering.length; ++i) {
                    cc += twoLayerCrossCount(g, ordering[i - 1], ordering[i])
                }
                return cc
            }

            function twoLayerCrossCount(g, layer1, layer2) {
                var indices = [];
                layer1.forEach(function (u) {
                    var nodeIndices = [];
                    g.outEdges(u).forEach(function (e) {
                        nodeIndices.push(g.node(g.target(e)).order)
                    });
                    nodeIndices.sort(function (x, y) {
                        return x - y
                    });
                    indices = indices.concat(nodeIndices)
                });
                var firstIndex = 1;
                while (firstIndex < layer2.length) firstIndex <<= 1;
                var treeSize = 2 * firstIndex - 1;
                firstIndex -= 1;
                var tree = [];
                for (var i = 0; i < treeSize; ++i) {
                    tree[i] = 0
                }
                var cc = 0;
                indices.forEach(function (i) {
                    var treeIndex = i + firstIndex;
                    ++tree[treeIndex];
                    while (treeIndex > 0) {
                        if (treeIndex % 2) {
                            cc += tree[treeIndex + 1]
                        }
                        treeIndex = treeIndex - 1 >> 1;
                        ++tree[treeIndex]
                    }
                });
                return cc
            }
        }, {
            "../util": 17
        }
    ],
    6: [
        function (require, module, exports) {
            var nodesFromList = require("graphlib").filter.nodesFromList,
                Set = require("cp-data").Set;
            module.exports = initLayerGraphs;

            function initLayerGraphs(g) {
                var ranks = [];

                function dfs(u) {
                    if (u === null) {
                        g.children(u).forEach(function (v) {
                            dfs(v)
                        });
                        return
                    }
                    var value = g.node(u);
                    value.minRank = "rank" in value ? value.rank : Number.MAX_VALUE;
                    value.maxRank = "rank" in value ? value.rank : Number.MIN_VALUE;
                    var uRanks = new Set;
                    g.children(u).forEach(function (v) {
                        var rs = dfs(v);
                        uRanks = Set.union([uRanks, rs]);
                        value.minRank = Math.min(value.minRank, g.node(v).minRank);
                        value.maxRank = Math.max(value.maxRank, g.node(v).maxRank)
                    });
                    if ("rank" in value) uRanks.add(value.rank);
                    uRanks.keys().forEach(function (r) {
                        if (!(r in ranks)) ranks[r] = [];
                        ranks[r].push(u)
                    });
                    return uRanks
                }
                dfs(null);
                var layerGraphs = [];
                ranks.forEach(function (us, rank) {
                    layerGraphs[rank] = g.filterNodes(nodesFromList(us))
                });
                return layerGraphs
            }
        }, {
            "cp-data": 19,
            graphlib: 23
        }
    ],
    7: [
        function (require, module, exports) {
            var crossCount = require("./crossCount");
            module.exports = initOrder;

            function initOrder(g) {
                var orderCount = [];

                function addNode(u, value) {
                    if ("order" in value) return;
                    if (g.children && g.children(u).length > 0) return;
                    if (!(value.rank in orderCount)) {
                        orderCount[value.rank] = 0
                    }
                    value.order = orderCount[value.rank]++
                }
                g.eachNode(function (u, value) {
                    addNode(u, value)
                });
                var cc = crossCount(g);
                g.graph().orderInitCC = cc;
                g.graph().orderCC = Number.MAX_VALUE
            }
        }, {
            "./crossCount": 5
        }
    ],
    8: [
        function (require, module, exports) {
            var util = require("../util");
            module.exports = sortLayer;

            function sortLayer(g, cg, weights) {
                var ordering = [];
                var bs = {};
                g.eachNode(function (u, value) {
                    ordering[value.order] = u;
                    var ws = weights[u];
                    if (ws.length) {
                        bs[u] = util.sum(ws) / ws.length
                    }
                });
                var toSort = g.nodes().filter(function (u) {
                    return bs[u] !== undefined
                });
                toSort.sort(function (x, y) {
                    return bs[x] - bs[y] || g.node(x).order - g.node(y).order
                });
                for (var i = 0, j = 0, jl = toSort.length; j < jl; ++i) {
                    if (bs[ordering[i]] !== undefined) {
                        g.node(toSort[j++]).order = i
                    }
                }
            }
        }, {
            "../util": 17
        }
    ],
    9: [
        function (require, module, exports) {
            var util = require("./util");
            module.exports = function () {
                var config = {
                    nodeSep: 50,
                    edgeSep: 10,
                    universalSep: null,
                    rankSep: 30
                };
                var self = {};
                self.nodeSep = util.propertyAccessor(self, config, "nodeSep");
                self.edgeSep = util.propertyAccessor(self, config, "edgeSep");
                self.universalSep = util.propertyAccessor(self, config, "universalSep");
                self.rankSep = util.propertyAccessor(self, config, "rankSep");
                self.debugLevel = util.propertyAccessor(self, config, "debugLevel");
                self.run = run;
                return self;

                function run(g) {
                    g = g.filterNodes(util.filterNonSubgraphs(g));
                    var layering = util.ordering(g);
                    var conflicts = findConflicts(g, layering);
                    var xss = {};
                    ["u", "d"].forEach(function (vertDir) {
                        if (vertDir === "d") layering.reverse();
                        ["l", "r"].forEach(function (horizDir) {
                            if (horizDir === "r") reverseInnerOrder(layering);
                            var dir = vertDir + horizDir;
                            var align = verticalAlignment(g, layering, conflicts, vertDir === "u" ? "predecessors" : "successors");
                            xss[dir] = horizontalCompaction(g, layering, align.pos, align.root, align.align);
                            if (config.debugLevel >= 3) debugPositioning(vertDir + horizDir, g, layering, xss[dir]);
                            if (horizDir === "r") flipHorizontally(xss[dir]);
                            if (horizDir === "r") reverseInnerOrder(layering)
                        });
                        if (vertDir === "d") layering.reverse()
                    });
                    balance(g, layering, xss);
                    g.eachNode(function (v) {
                        var xs = [];
                        for (var alignment in xss) {
                            var alignmentX = xss[alignment][v];
                            posXDebug(alignment, g, v, alignmentX);
                            xs.push(alignmentX)
                        }
                        xs.sort(function (x, y) {
                            return x - y
                        });
                        posX(g, v, (xs[1] + xs[2]) / 2)
                    });
                    var y = 0,
                        reverseY = g.graph().rankDir === "BT" || g.graph().rankDir === "RL";
                    layering.forEach(function (layer) {
                        var maxHeight = util.max(layer.map(function (u) {
                            return height(g, u)
                        }));
                        y += maxHeight / 2;
                        layer.forEach(function (u) {
                            posY(g, u, reverseY ? -y : y)
                        });
                        y += maxHeight / 2 + config.rankSep
                    });
                    var minX = util.min(g.nodes().map(function (u) {
                        return posX(g, u) - width(g, u) / 2
                    }));
                    var minY = util.min(g.nodes().map(function (u) {
                        return posY(g, u) - height(g, u) / 2
                    }));
                    g.eachNode(function (u) {
                        posX(g, u, posX(g, u) - minX);
                        posY(g, u, posY(g, u) - minY)
                    })
                }

                function undirEdgeId(u, v) {
                    return u < v ? u.toString().length + ":" + u + "-" + v : v.toString().length + ":" + v + "-" + u
                }

                function findConflicts(g, layering) {
                    var conflicts = {}, pos = {}, prevLayer, currLayer, k0, l, k1;
                    if (layering.length <= 2) return conflicts;

                    function updateConflicts(v) {
                        var k = pos[v];
                        if (k < k0 || k > k1) {
                            conflicts[undirEdgeId(currLayer[l], v)] = true
                        }
                    }
                    layering[1].forEach(function (u, i) {
                        pos[u] = i
                    });
                    for (var i = 1; i < layering.length - 1; ++i) {
                        prevLayer = layering[i];
                        currLayer = layering[i + 1];
                        k0 = 0;
                        l = 0;
                        for (var l1 = 0; l1 < currLayer.length; ++l1) {
                            var u = currLayer[l1];
                            pos[u] = l1;
                            k1 = undefined;
                            if (g.node(u).dummy) {
                                var uPred = g.predecessors(u)[0];
                                if (g.node(uPred).dummy) k1 = pos[uPred]
                            }
                            if (k1 === undefined && l1 === currLayer.length - 1) k1 = prevLayer.length - 1;
                            if (k1 !== undefined) {
                                for (; l <= l1; ++l) {
                                    g.predecessors(currLayer[l]).forEach(updateConflicts)
                                }
                                k0 = k1
                            }
                        }
                    }
                    return conflicts
                }

                function verticalAlignment(g, layering, conflicts, relationship) {
                    var pos = {}, root = {}, align = {};
                    layering.forEach(function (layer) {
                        layer.forEach(function (u, i) {
                            root[u] = u;
                            align[u] = u;
                            pos[u] = i
                        })
                    });
                    layering.forEach(function (layer) {
                        var prevIdx = -1;
                        layer.forEach(function (v) {
                            var related = g[relationship](v),
                                mid;
                            if (related.length > 0) {
                                related.sort(function (x, y) {
                                    return pos[x] - pos[y]
                                });
                                mid = (related.length - 1) / 2;
                                related.slice(Math.floor(mid), Math.ceil(mid) + 1).forEach(function (u) {
                                    if (align[v] === v) {
                                        if (!conflicts[undirEdgeId(u, v)] && prevIdx < pos[u]) {
                                            align[u] = v;
                                            align[v] = root[v] = root[u];
                                            prevIdx = pos[u]
                                        }
                                    }
                                })
                            }
                        })
                    });
                    return {
                        pos: pos,
                        root: root,
                        align: align
                    }
                }

                function horizontalCompaction(g, layering, pos, root, align) {
                    var sink = {}, maybeShift = {}, shift = {}, pred = {}, xs = {};
                    layering.forEach(function (layer) {
                        layer.forEach(function (u, i) {
                            sink[u] = u;
                            maybeShift[u] = {};
                            if (i > 0) pred[u] = layer[i - 1]
                        })
                    });

                    function updateShift(toShift, neighbor, delta) {
                        if (!(neighbor in maybeShift[toShift])) {
                            maybeShift[toShift][neighbor] = delta
                        } else {
                            maybeShift[toShift][neighbor] = Math.min(maybeShift[toShift][neighbor], delta)
                        }
                    }

                    function placeBlock(v) {
                        if (!(v in xs)) {
                            xs[v] = 0;
                            var w = v;
                            do {
                                if (pos[w] > 0) {
                                    var u = root[pred[w]];
                                    placeBlock(u);
                                    if (sink[v] === v) {
                                        sink[v] = sink[u]
                                    }
                                    var delta = sep(g, pred[w]) + sep(g, w);
                                    if (sink[v] !== sink[u]) {
                                        updateShift(sink[u], sink[v], xs[v] - xs[u] - delta)
                                    } else {
                                        xs[v] = Math.max(xs[v], xs[u] + delta)
                                    }
                                }
                                w = align[w]
                            } while (w !== v)
                        }
                    }
                    util.values(root).forEach(function (v) {
                        placeBlock(v)
                    });
                    layering.forEach(function (layer) {
                        layer.forEach(function (v) {
                            xs[v] = xs[root[v]];
                            if (v === root[v] && v === sink[v]) {
                                var minShift = 0;
                                if (v in maybeShift && Object.keys(maybeShift[v]).length > 0) {
                                    minShift = util.min(Object.keys(maybeShift[v]).map(function (u) {
                                        return maybeShift[v][u] + (u in shift ? shift[u] : 0)
                                    }))
                                }
                                shift[v] = minShift
                            }
                        })
                    });
                    layering.forEach(function (layer) {
                        layer.forEach(function (v) {
                            xs[v] += shift[sink[root[v]]] || 0
                        })
                    });
                    return xs
                }

                function findMinCoord(g, layering, xs) {
                    return util.min(layering.map(function (layer) {
                        var u = layer[0];
                        return xs[u]
                    }))
                }

                function findMaxCoord(g, layering, xs) {
                    return util.max(layering.map(function (layer) {
                        var u = layer[layer.length - 1];
                        return xs[u]
                    }))
                }

                function balance(g, layering, xss) {
                    var min = {}, max = {}, smallestAlignment, shift = {};

                    function updateAlignment(v) {
                        xss[alignment][v] += shift[alignment]
                    }
                    var smallest = Number.POSITIVE_INFINITY;
                    for (var alignment in xss) {
                        var xs = xss[alignment];
                        min[alignment] = findMinCoord(g, layering, xs);
                        max[alignment] = findMaxCoord(g, layering, xs);
                        var w = max[alignment] - min[alignment];
                        if (w < smallest) {
                            smallest = w;
                            smallestAlignment = alignment
                        }
                    }["u", "d"].forEach(function (vertDir) {
                        ["l", "r"].forEach(function (horizDir) {
                            var alignment = vertDir + horizDir;
                            shift[alignment] = horizDir === "l" ? min[smallestAlignment] - min[alignment] : max[smallestAlignment] - max[alignment]
                        })
                    });
                    for (alignment in xss) {
                        g.eachNode(updateAlignment)
                    }
                }

                function flipHorizontally(xs) {
                    for (var u in xs) {
                        xs[u] = -xs[u]
                    }
                }

                function reverseInnerOrder(layering) {
                    layering.forEach(function (layer) {
                        layer.reverse()
                    })
                }

                function width(g, u) {
                    switch (g.graph().rankDir) {
                    case "LR":
                        return g.node(u).height;
                    case "RL":
                        return g.node(u).height;
                    default:
                        return g.node(u).width
                    }
                }

                function height(g, u) {
                    switch (g.graph().rankDir) {
                    case "LR":
                        return g.node(u).width;
                    case "RL":
                        return g.node(u).width;
                    default:
                        return g.node(u).height
                    }
                }

                function sep(g, u) {
                    if (config.universalSep !== null) {
                        return config.universalSep
                    }
                    var w = width(g, u);
                    var s = g.node(u).dummy ? config.edgeSep : config.nodeSep;
                    return (w + s) / 2
                }

                function posX(g, u, x) {
                    if (g.graph().rankDir === "LR" || g.graph().rankDir === "RL") {
                        if (arguments.length < 3) {
                            return g.node(u).y
                        } else {
                            g.node(u).y = x
                        }
                    } else {
                        if (arguments.length < 3) {
                            return g.node(u).x
                        } else {
                            g.node(u).x = x
                        }
                    }
                }

                function posXDebug(name, g, u, x) {
                    if (g.graph().rankDir === "LR" || g.graph().rankDir === "RL") {
                        if (arguments.length < 3) {
                            return g.node(u)[name]
                        } else {
                            g.node(u)[name] = x
                        }
                    } else {
                        if (arguments.length < 3) {
                            return g.node(u)[name]
                        } else {
                            g.node(u)[name] = x
                        }
                    }
                }

                function posY(g, u, y) {
                    if (g.graph().rankDir === "LR" || g.graph().rankDir === "RL") {
                        if (arguments.length < 3) {
                            return g.node(u).x
                        } else {
                            g.node(u).x = y
                        }
                    } else {
                        if (arguments.length < 3) {
                            return g.node(u).y
                        } else {
                            g.node(u).y = y
                        }
                    }
                }

                function debugPositioning(align, g, layering, xs) {
                    layering.forEach(function (l, li) {
                        var u, xU;
                        l.forEach(function (v) {
                            var xV = xs[v];
                            if (u) {
                                var s = sep(g, u) + sep(g, v);
                                if (xV - xU < s) console.log("Position phase: sep violation. Align: " + align + ". Layer: " + li + ". " + "U: " + u + " V: " + v + ". Actual sep: " + (xV - xU) + " Expected sep: " + s)
                            }
                            u = v;
                            xU = xV
                        })
                    })
                }
            }
        }, {
            "./util": 17
        }
    ],
    10: [
        function (require, module, exports) {
            var util = require("./util"),
                acyclic = require("./rank/acyclic"),
                initRank = require("./rank/initRank"),
                feasibleTree = require("./rank/feasibleTree"),
                constraints = require("./rank/constraints"),
                simplex = require("./rank/simplex"),
                components = require("graphlib").alg.components,
                filter = require("graphlib").filter;
            exports.run = run;
            exports.restoreEdges = restoreEdges;

            function run(g, useSimplex) {
                var selfLoops = removeSelfLoops(g);
                util.time("constraints.apply", constraints.apply)(g);
                var sidewaysEdges = removeSelfLoops(g).map(function (edge) {
                    return edge.value.originalEdge
                });
                util.time("acyclic", acyclic)(g);
                var flatGraph = g.filterNodes(util.filterNonSubgraphs(g));
                initRank(flatGraph);
                components(flatGraph).forEach(function (cmpt) {
                    var subgraph = flatGraph.filterNodes(filter.nodesFromList(cmpt));
                    rankComponent(subgraph, useSimplex)
                });
                util.time("constraints.relax", constraints.relax(g));
                util.time("reorientEdges", reorientEdges)(g);
                g.graph().rankRemovedEdges = selfLoops.concat(sidewaysEdges)
            }

            function restoreEdges(g) {
                g.graph().rankRemovedEdges.forEach(function (edge) {
                    if (g.hasEdge(edge.e)) {
                        g.addEdge(null, g.source(edge.e), g.target(edge.e), g.edge(edge.e));
                        g.delEdge(edge.e)
                    }
                    g.addEdge(edge.e, edge.u, edge.v, edge.value)
                });
                acyclic.undo(g)
            }

            function removeSelfLoops(g) {
                var selfLoops = [];
                g.eachEdge(function (e, u, v, value) {
                    if (u === v) {
                        selfLoops.push({
                            e: e,
                            u: u,
                            v: v,
                            value: value
                        });
                        g.delEdge(e)
                    }
                });
                return selfLoops
            }

            function reorientEdges(g) {
                g.eachEdge(function (e, u, v, value) {
                    if (g.node(u).rank > g.node(v).rank) {
                        g.delEdge(e);
                        value.reversed = true;
                        g.addEdge(e, v, u, value)
                    }
                })
            }

            function rankComponent(subgraph, useSimplex) {
                var spanningTree = feasibleTree(subgraph);
                if (useSimplex) {
                    util.log(1, "Using network simplex for ranking");
                    simplex(subgraph, spanningTree)
                }
                normalize(subgraph)
            }

            function normalize(g) {
                var m = util.min(g.nodes().map(function (u) {
                    return g.node(u).rank
                }));
                g.eachNode(function (u, node) {
                    node.rank -= m
                })
            }
        }, {
            "./rank/acyclic": 11,
            "./rank/constraints": 12,
            "./rank/feasibleTree": 13,
            "./rank/initRank": 14,
            "./rank/simplex": 16,
            "./util": 17,
            graphlib: 23
        }
    ],
    11: [
        function (require, module, exports) {
            var util = require("../util");
            module.exports = acyclic;
            module.exports.undo = undo;

            function acyclic(g) {
                var onStack = {}, visited = {}, reverseCount = 0;

                function dfs(u) {
                    if (u in visited) return;
                    visited[u] = onStack[u] = true;
                    g.outEdges(u).forEach(function (e) {
                        var t = g.target(e),
                            value;
                        if (u === t) {
                            console.error('Warning: found self loop "' + e + '" for node "' + u + '"')
                        } else if (t in onStack) {
                            value = g.edge(e);
                            g.delEdge(e);
                            value.reversed = true;
                            ++reverseCount;
                            g.addEdge(e, t, u, value)
                        } else {
                            dfs(t)
                        }
                    });
                    delete onStack[u]
                }
                g.eachNode(function (u) {
                    dfs(u)
                });
                util.log(2, "Acyclic Phase: reversed " + reverseCount + " edge(s)");
                return reverseCount
            }

            function undo(g) {
                g.eachEdge(function (e, s, t, a) {
                    if (a.reversed) {
                        delete a.reversed;
                        g.delEdge(e);
                        g.addEdge(e, t, s, a)
                    }
                })
            }
        }, {
            "../util": 17
        }
    ],
    12: [
        function (require, module, exports) {
            exports.apply = function (g) {
                function dfs(sg) {
                    var rankSets = {};
                    g.children(sg).forEach(function (u) {
                        if (g.children(u).length) {
                            dfs(u);
                            return
                        }
                        var value = g.node(u),
                            prefRank = value.prefRank;
                        if (prefRank !== undefined) {
                            if (!checkSupportedPrefRank(prefRank)) {
                                return
                            }
                            if (!(prefRank in rankSets)) {
                                rankSets.prefRank = [u]
                            } else {
                                rankSets.prefRank.push(u)
                            }
                            var newU = rankSets[prefRank];
                            if (newU === undefined) {
                                newU = rankSets[prefRank] = g.addNode(null, {
                                    originalNodes: []
                                });
                                g.parent(newU, sg)
                            }
                            redirectInEdges(g, u, newU, prefRank === "min");
                            redirectOutEdges(g, u, newU, prefRank === "max");
                            g.node(newU).originalNodes.push({
                                u: u,
                                value: value,
                                parent: sg
                            });
                            g.delNode(u)
                        }
                    });
                    addLightEdgesFromMinNode(g, sg, rankSets.min);
                    addLightEdgesToMaxNode(g, sg, rankSets.max)
                }
                dfs(null)
            };

            function checkSupportedPrefRank(prefRank) {
                if (prefRank !== "min" && prefRank !== "max" && prefRank.indexOf("same_") !== 0) {
                    console.error("Unsupported rank type: " + prefRank);
                    return false
                }
                return true
            }

            function redirectInEdges(g, u, newU, reverse) {
                g.inEdges(u).forEach(function (e) {
                    var origValue = g.edge(e),
                        value;
                    if (origValue.originalEdge) {
                        value = origValue
                    } else {
                        value = {
                            originalEdge: {
                                e: e,
                                u: g.source(e),
                                v: g.target(e),
                                value: origValue
                            },
                            minLen: g.edge(e).minLen
                        }
                    } if (reverse) {
                        g.addEdge(null, newU, g.source(e), value);
                        value.reversed = true
                    } else {
                        g.addEdge(null, g.source(e), newU, value)
                    }
                })
            }

            function redirectOutEdges(g, u, newU, reverse) {
                g.outEdges(u).forEach(function (e) {
                    var origValue = g.edge(e),
                        value;
                    if (origValue.originalEdge) {
                        value = origValue
                    } else {
                        value = {
                            originalEdge: {
                                e: e,
                                u: g.source(e),
                                v: g.target(e),
                                value: origValue
                            },
                            minLen: g.edge(e).minLen
                        }
                    } if (reverse) {
                        g.addEdge(null, g.target(e), newU, value);
                        value.reversed = true
                    } else {
                        g.addEdge(null, newU, g.target(e), value)
                    }
                })
            }

            function addLightEdgesFromMinNode(g, sg, minNode) {
                if (minNode !== undefined) {
                    g.children(sg).forEach(function (u) {
                        if (u !== minNode && !g.outEdges(minNode, u).length) {
                            g.addEdge(null, minNode, u, {
                                minLen: 0
                            })
                        }
                    })
                }
            }

            function addLightEdgesToMaxNode(g, sg, maxNode) {
                if (maxNode !== undefined) {
                    g.children(sg).forEach(function (u) {
                        if (u !== maxNode && !g.outEdges(u, maxNode).length) {
                            g.addEdge(null, u, maxNode, {
                                minLen: 0
                            })
                        }
                    })
                }
            }
            exports.relax = function (g) {
                var originalEdges = [];
                g.eachEdge(function (e, u, v, value) {
                    var originalEdge = value.originalEdge;
                    if (originalEdge) {
                        originalEdges.push(originalEdge)
                    }
                });
                g.eachNode(function (u, value) {
                    var originalNodes = value.originalNodes;
                    if (originalNodes) {
                        originalNodes.forEach(function (originalNode) {
                            originalNode.value.rank = value.rank;
                            g.addNode(originalNode.u, originalNode.value);
                            g.parent(originalNode.u, originalNode.parent)
                        });
                        g.delNode(u)
                    }
                });
                originalEdges.forEach(function (edge) {
                    g.addEdge(edge.e, edge.u, edge.v, edge.value)
                })
            }
        }, {}
    ],
    13: [
        function (require, module, exports) {
            var Set = require("cp-data").Set,
                Digraph = require("graphlib").Digraph,
                rankUtil = require("./rankUtil");
            module.exports = feasibleTree;

            function feasibleTree(g) {
                var remaining = new Set(g.nodes()),
                    minLen = [],
                    tree = new Digraph;
                var minLenMap = {};
                g.eachEdge(function (e, u, v, edge) {
                    var id = incidenceId(u, v);
                    if (!(id in minLenMap)) {
                        minLen.push(minLenMap[id] = {
                            u: u,
                            v: v,
                            len: 0,
                            weight: 0
                        })
                    }
                    var mle = minLenMap[id];
                    mle.len = Math.max(mle.len, edge.minLen);
                    mle.weight++
                });
                var root = g.nodes()[0];
                remaining.remove(root);
                var nodeVal = g.node(root);
                tree.addNode(root, nodeVal);
                tree.graph({
                    root: root
                });

                function findMinSlack() {
                    var result, eSlack = Number.POSITIVE_INFINITY;
                    minLen.forEach(function (mle) {
                        if (remaining.has(mle.u) !== remaining.has(mle.v)) {
                            var mleSlack = rankUtil.slack(g, mle.u, mle.v, mle.len);
                            if (mleSlack < eSlack) {
                                if (!remaining.has(mle.u)) {
                                    result = {
                                        treeNode: mle.u,
                                        graphNode: mle.v,
                                        len: mle.len,
                                        reversed: false,
                                        weight: mle.weight
                                    }
                                } else {
                                    result = {
                                        treeNode: mle.v,
                                        graphNode: mle.u,
                                        len: -mle.len,
                                        reversed: true,
                                        weight: mle.weight
                                    }
                                }
                                eSlack = mleSlack
                            }
                        }
                    });
                    return result
                }
                while (remaining.size() > 0) {
                    var result = findMinSlack();
                    nodeVal = g.node(result.graphNode);
                    remaining.remove(result.graphNode);
                    tree.addNode(result.graphNode, nodeVal);
                    tree.addEdge(null, result.treeNode, result.graphNode, {
                        reversed: result.reversed,
                        weight: result.weight
                    });
                    nodeVal.rank = g.node(result.treeNode).rank + result.len
                }
                return tree
            }

            function incidenceId(u, v) {
                return u < v ? u.length + ":" + u + "-" + v : v.length + ":" + v + "-" + u
            }
        }, {
            "./rankUtil": 15,
            "cp-data": 19,
            graphlib: 23
        }
    ],
    14: [
        function (require, module, exports) {
            var util = require("../util"),
                topsort = require("graphlib").alg.topsort;
            module.exports = initRank;

            function initRank(g) {
                var sorted = topsort(g);
                sorted.forEach(function (u) {
                    var inEdges = g.inEdges(u);
                    if (inEdges.length === 0) {
                        g.node(u).rank = 0;
                        return
                    }
                    var minLens = inEdges.map(function (e) {
                        return g.node(g.source(e)).rank + g.edge(e).minLen
                    });
                    g.node(u).rank = util.max(minLens)
                })
            }
        }, {
            "../util": 17,
            graphlib: 23
        }
    ],
    15: [
        function (require, module, exports) {
            module.exports = {
                slack: slack
            };

            function slack(graph, u, v, minLen) {
                return Math.abs(graph.node(u).rank - graph.node(v).rank) - minLen
            }
        }, {}
    ],
    16: [
        function (require, module, exports) {
            var util = require("../util"),
                rankUtil = require("./rankUtil");
            module.exports = simplex;

            function simplex(graph, spanningTree) {
                initCutValues(graph, spanningTree);
                while (true) {
                    var e = leaveEdge(spanningTree);
                    if (e === null) break;
                    var f = enterEdge(graph, spanningTree, e);
                    exchange(graph, spanningTree, e, f)
                }
            }

            function initCutValues(graph, spanningTree) {
                computeLowLim(spanningTree);
                spanningTree.eachEdge(function (id, u, v, treeValue) {
                    treeValue.cutValue = 0
                });

                function dfs(n) {
                    var children = spanningTree.successors(n);
                    for (var c in children) {
                        var child = children[c];
                        dfs(child)
                    }
                    if (n !== spanningTree.graph().root) {
                        setCutValue(graph, spanningTree, n)
                    }
                }
                dfs(spanningTree.graph().root)
            }

            function computeLowLim(tree) {
                var postOrderNum = 0;

                function dfs(n) {
                    var children = tree.successors(n);
                    var low = postOrderNum;
                    for (var c in children) {
                        var child = children[c];
                        dfs(child);
                        low = Math.min(low, tree.node(child).low)
                    }
                    tree.node(n).low = low;
                    tree.node(n).lim = postOrderNum++
                }
                dfs(tree.graph().root)
            }

            function setCutValue(graph, tree, child) {
                var parentEdge = tree.inEdges(child)[0];
                var grandchildren = [];
                var grandchildEdges = tree.outEdges(child);
                for (var gce in grandchildEdges) {
                    grandchildren.push(tree.target(grandchildEdges[gce]))
                }
                var cutValue = 0;
                var E = 0;
                var F = 0;
                var G = 0;
                var H = 0;
                var outEdges = graph.outEdges(child);
                var gc;
                for (var oe in outEdges) {
                    var succ = graph.target(outEdges[oe]);
                    for (gc in grandchildren) {
                        if (inSubtree(tree, succ, grandchildren[gc])) {
                            E++
                        }
                    }
                    if (!inSubtree(tree, succ, child)) {
                        G++
                    }
                }
                var inEdges = graph.inEdges(child);
                for (var ie in inEdges) {
                    var pred = graph.source(inEdges[ie]);
                    for (gc in grandchildren) {
                        if (inSubtree(tree, pred, grandchildren[gc])) {
                            F++
                        }
                    }
                    if (!inSubtree(tree, pred, child)) {
                        H++
                    }
                }
                var grandchildCutSum = 0;
                for (gc in grandchildren) {
                    var cv = tree.edge(grandchildEdges[gc]).cutValue;
                    if (!tree.edge(grandchildEdges[gc]).reversed) {
                        grandchildCutSum += cv
                    } else {
                        grandchildCutSum -= cv
                    }
                }
                if (!tree.edge(parentEdge).reversed) {
                    cutValue += grandchildCutSum - E + F - G + H
                } else {
                    cutValue -= grandchildCutSum - E + F - G + H
                }
                tree.edge(parentEdge).cutValue = cutValue
            }

            function inSubtree(tree, n, root) {
                return tree.node(root).low <= tree.node(n).lim && tree.node(n).lim <= tree.node(root).lim
            }

            function leaveEdge(tree) {
                var edges = tree.edges();
                for (var n in edges) {
                    var e = edges[n];
                    var treeValue = tree.edge(e);
                    if (treeValue.cutValue < 0) {
                        return e
                    }
                }
                return null
            }

            function enterEdge(graph, tree, e) {
                var source = tree.source(e);
                var target = tree.target(e);
                var lower = tree.node(target).lim < tree.node(source).lim ? target : source;
                var aligned = !tree.edge(e).reversed;
                var minSlack = Number.POSITIVE_INFINITY;
                var minSlackEdge;
                if (aligned) {
                    graph.eachEdge(function (id, u, v, value) {
                        if (id !== e && inSubtree(tree, u, lower) && !inSubtree(tree, v, lower)) {
                            var slack = rankUtil.slack(graph, u, v, value.minLen);
                            if (slack < minSlack) {
                                minSlack = slack;
                                minSlackEdge = id
                            }
                        }
                    })
                } else {
                    graph.eachEdge(function (id, u, v, value) {
                        if (id !== e && !inSubtree(tree, u, lower) && inSubtree(tree, v, lower)) {
                            var slack = rankUtil.slack(graph, u, v, value.minLen);
                            if (slack < minSlack) {
                                minSlack = slack;
                                minSlackEdge = id
                            }
                        }
                    })
                } if (minSlackEdge === undefined) {
                    var outside = [];
                    var inside = [];
                    graph.eachNode(function (id) {
                        if (!inSubtree(tree, id, lower)) {
                            outside.push(id)
                        } else {
                            inside.push(id)
                        }
                    });
                    throw new Error("No edge found from outside of tree to inside")
                }
                return minSlackEdge
            }

            function exchange(graph, tree, e, f) {
                tree.delEdge(e);
                var source = graph.source(f);
                var target = graph.target(f);

                function redirect(v) {
                    var edges = tree.inEdges(v);
                    for (var i in edges) {
                        var e = edges[i];
                        var u = tree.source(e);
                        var value = tree.edge(e);
                        redirect(u);
                        tree.delEdge(e);
                        value.reversed = !value.reversed;
                        tree.addEdge(e, v, u, value)
                    }
                }
                redirect(target);
                var root = source;
                var edges = tree.inEdges(root);
                while (edges.length > 0) {
                    root = tree.source(edges[0]);
                    edges = tree.inEdges(root)
                }
                tree.graph().root = root;
                tree.addEdge(null, source, target, {
                    cutValue: 0
                });
                initCutValues(graph, tree);
                adjustRanks(graph, tree)
            }

            function adjustRanks(graph, tree) {
                function dfs(p) {
                    var children = tree.successors(p);
                    children.forEach(function (c) {
                        var minLen = minimumLength(graph, p, c);
                        graph.node(c).rank = graph.node(p).rank + minLen;
                        dfs(c)
                    })
                }
                dfs(tree.graph().root)
            }

            function minimumLength(graph, u, v) {
                var outEdges = graph.outEdges(u, v);
                if (outEdges.length > 0) {
                    return util.max(outEdges.map(function (e) {
                        return graph.edge(e).minLen
                    }))
                }
                var inEdges = graph.inEdges(u, v);
                if (inEdges.length > 0) {
                    return -util.max(inEdges.map(function (e) {
                        return graph.edge(e).minLen
                    }))
                }
            }
        }, {
            "../util": 17,
            "./rankUtil": 15
        }
    ],
    17: [
        function (require, module, exports) {
            exports.min = function (values) {
                return Math.min.apply(Math, values)
            };
            exports.max = function (values) {
                return Math.max.apply(Math, values)
            };
            exports.all = function (xs, f) {
                for (var i = 0; i < xs.length; ++i) {
                    if (!f(xs[i])) {
                        return false
                    }
                }
                return true
            };
            exports.sum = function (values) {
                return values.reduce(function (acc, x) {
                    return acc + x
                }, 0)
            };
            exports.values = function (obj) {
                return Object.keys(obj).map(function (k) {
                    return obj[k]
                })
            };
            exports.propertyAccessor = function (self, config, field, setHook) {
                return function (x) {
                    if (!arguments.length) return config[field];
                    config[field] = x;
                    if (setHook) setHook(x);
                    return self
                }
            };
            exports.ordering = function (g) {
                var ordering = [];
                g.eachNode(function (u, value) {
                    var rank = ordering[value.rank] || (ordering[value.rank] = []);
                    rank[value.order] = u
                });
                return ordering
            };
            exports.filterNonSubgraphs = function (g) {
                return function (u) {
                    return g.children(u).length === 0
                }
            };

            function time(name, func) {
                return function () {
                    var start = (new Date).getTime();
                    try {
                        return func.apply(null, arguments)
                    } finally {
                        log(1, name + " time: " + ((new Date).getTime() - start) + "ms")
                    }
                }
            }
            time.enabled = false;
            exports.time = time;

            function log(level) {
                if (log.level >= level) {
                    console.log.apply(console, Array.prototype.slice.call(arguments, 1))
                }
            }
            log.level = 0;
            exports.log = log
        }, {}
    ],
    18: [
        function (require, module, exports) {
            module.exports = "0.4.0"
        }, {}
    ],
    19: [
        function (require, module, exports) {
            exports.Set = require("./lib/Set");
            exports.PriorityQueue = require("./lib/PriorityQueue");
            exports.version = require("./lib/version")
        }, {
            "./lib/PriorityQueue": 20,
            "./lib/Set": 21,
            "./lib/version": 22
        }
    ],
    20: [
        function (require, module, exports) {
            module.exports = PriorityQueue;

            function PriorityQueue() {
                this._arr = [];
                this._keyIndices = {}
            }
            PriorityQueue.prototype.size = function () {
                return this._arr.length
            };
            PriorityQueue.prototype.keys = function () {
                return this._arr.map(function (x) {
                    return x.key
                })
            };
            PriorityQueue.prototype.has = function (key) {
                return key in this._keyIndices
            };
            PriorityQueue.prototype.priority = function (key) {
                var index = this._keyIndices[key];
                if (index !== undefined) {
                    return this._arr[index].priority
                }
            };
            PriorityQueue.prototype.min = function () {
                if (this.size() === 0) {
                    throw new Error("Queue underflow")
                }
                return this._arr[0].key
            };
            PriorityQueue.prototype.add = function (key, priority) {
                if (!(key in this._keyIndices)) {
                    var entry = {
                        key: key,
                        priority: priority
                    };
                    var index = this._arr.length;
                    this._keyIndices[key] = index;
                    this._arr.push(entry);
                    this._decrease(index);
                    return true
                }
                return false
            };
            PriorityQueue.prototype.removeMin = function () {
                this._swap(0, this._arr.length - 1);
                var min = this._arr.pop();
                delete this._keyIndices[min.key];
                this._heapify(0);
                return min.key
            };
            PriorityQueue.prototype.decrease = function (key, priority) {
                var index = this._keyIndices[key];
                if (priority > this._arr[index].priority) {
                    throw new Error("New priority is greater than current priority. " + "Key: " + key + " Old: " + this._arr[index].priority + " New: " + priority)
                }
                this._arr[index].priority = priority;
                this._decrease(index)
            };
            PriorityQueue.prototype._heapify = function (i) {
                var arr = this._arr;
                var l = 2 * i,
                    r = l + 1,
                    largest = i;
                if (l < arr.length) {
                    largest = arr[l].priority < arr[largest].priority ? l : largest;
                    if (r < arr.length) {
                        largest = arr[r].priority < arr[largest].priority ? r : largest
                    }
                    if (largest !== i) {
                        this._swap(i, largest);
                        this._heapify(largest)
                    }
                }
            };
            PriorityQueue.prototype._decrease = function (index) {
                var arr = this._arr;
                var priority = arr[index].priority;
                var parent;
                while (index > 0) {
                    parent = index >> 1;
                    if (arr[parent].priority < priority) {
                        break
                    }
                    this._swap(index, parent);
                    index = parent
                }
            };
            PriorityQueue.prototype._swap = function (i, j) {
                var arr = this._arr;
                var keyIndices = this._keyIndices;
                var tmp = arr[i];
                arr[i] = arr[j];
                arr[j] = tmp;
                keyIndices[arr[i].key] = i;
                keyIndices[arr[j].key] = j
            }
        }, {}
    ],
    21: [
        function (require, module, exports) {
            module.exports = Set;

            function Set(initialKeys) {
                this._size = 0;
                this._keys = {};
                if (initialKeys) {
                    for (var i = 0, il = initialKeys.length; i < il; ++i) {
                        this.add(initialKeys[i])
                    }
                }
            }
            Set.intersect = function (sets) {
                if (sets.length === 0) {
                    return new Set
                }
                var result = new Set(sets[0].keys ? sets[0].keys() : sets[0]);
                for (var i = 1, il = sets.length; i < il; ++i) {
                    var resultKeys = result.keys(),
                        other = sets[i].keys ? sets[i] : new Set(sets[i]);
                    for (var j = 0, jl = resultKeys.length; j < jl; ++j) {
                        var key = resultKeys[j];
                        if (!other.has(key)) {
                            result.remove(key)
                        }
                    }
                }
                return result
            };
            Set.union = function (sets) {
                var totalElems = sets.reduce(function (lhs, rhs) {
                    return lhs + (rhs.size ? rhs.size() : rhs.length)
                }, 0);
                var arr = new Array(totalElems);
                var k = 0;
                for (var i = 0, il = sets.length; i < il; ++i) {
                    var cur = sets[i],
                        keys = cur.keys ? cur.keys() : cur;
                    for (var j = 0, jl = keys.length; j < jl; ++j) {
                        arr[k++] = keys[j]
                    }
                }
                return new Set(arr)
            };
            Set.prototype.size = function () {
                return this._size
            };
            Set.prototype.keys = function () {
                return values(this._keys)
            };
            Set.prototype.has = function (key) {
                return key in this._keys
            };
            Set.prototype.add = function (key) {
                if (!(key in this._keys)) {
                    this._keys[key] = key;
                    ++this._size;
                    return true
                }
                return false
            };
            Set.prototype.remove = function (key) {
                if (key in this._keys) {
                    delete this._keys[key];
                    --this._size;
                    return true
                }
                return false
            };

            function values(o) {
                var ks = Object.keys(o),
                    len = ks.length,
                    result = new Array(len),
                    i;
                for (i = 0; i < len; ++i) {
                    result[i] = o[ks[i]]
                }
                return result
            }
        }, {}
    ],
    22: [
        function (require, module, exports) {
            module.exports = "1.1.0"
        }, {}
    ],
    23: [
        function (require, module, exports) {
            exports.Graph = require("./lib/Graph");
            exports.Digraph = require("./lib/Digraph");
            exports.CGraph = require("./lib/CGraph");
            exports.CDigraph = require("./lib/CDigraph");
            require("./lib/graph-converters");
            exports.alg = {
                isAcyclic: require("./lib/alg/isAcyclic"),
                components: require("./lib/alg/components"),
                dijkstra: require("./lib/alg/dijkstra"),
                dijkstraAll: require("./lib/alg/dijkstraAll"),
                findCycles: require("./lib/alg/findCycles"),
                floydWarshall: require("./lib/alg/floydWarshall"),
                postorder: require("./lib/alg/postorder"),
                preorder: require("./lib/alg/preorder"),
                prim: require("./lib/alg/prim"),
                tarjan: require("./lib/alg/tarjan"),
                topsort: require("./lib/alg/topsort")
            };
            exports.converter = {
                json: require("./lib/converter/json.js")
            };
            var filter = require("./lib/filter");
            exports.filter = {
                all: filter.all,
                nodesFromList: filter.nodesFromList
            };
            exports.version = require("./lib/version")
        }, {
            "./lib/CDigraph": 25,
            "./lib/CGraph": 26,
            "./lib/Digraph": 27,
            "./lib/Graph": 28,
            "./lib/alg/components": 29,
            "./lib/alg/dijkstra": 30,
            "./lib/alg/dijkstraAll": 31,
            "./lib/alg/findCycles": 32,
            "./lib/alg/floydWarshall": 33,
            "./lib/alg/isAcyclic": 34,
            "./lib/alg/postorder": 35,
            "./lib/alg/preorder": 36,
            "./lib/alg/prim": 37,
            "./lib/alg/tarjan": 38,
            "./lib/alg/topsort": 39,
            "./lib/converter/json.js": 41,
            "./lib/filter": 42,
            "./lib/graph-converters": 43,
            "./lib/version": 45
        }
    ],
    24: [
        function (require, module, exports) {
            var Set = require("cp-data").Set;
            module.exports = BaseGraph;

            function BaseGraph() {
                this._value = undefined;
                this._nodes = {};
                this._edges = {};
                this._nextId = 0
            }
            BaseGraph.prototype.order = function () {
                return Object.keys(this._nodes).length
            };
            BaseGraph.prototype.size = function () {
                return Object.keys(this._edges).length
            };
            BaseGraph.prototype.graph = function (value) {
                if (arguments.length === 0) {
                    return this._value
                }
                this._value = value
            };
            BaseGraph.prototype.hasNode = function (u) {
                return u in this._nodes
            };
            BaseGraph.prototype.node = function (u, value) {
                var node = this._strictGetNode(u);
                if (arguments.length === 1) {
                    return node.value
                }
                node.value = value
            };
            BaseGraph.prototype.nodes = function () {
                var nodes = [];
                this.eachNode(function (id) {
                    nodes.push(id)
                });
                return nodes
            };
            BaseGraph.prototype.eachNode = function (func) {
                for (var k in this._nodes) {
                    var node = this._nodes[k];
                    func(node.id, node.value)
                }
            };
            BaseGraph.prototype.hasEdge = function (e) {
                return e in this._edges
            };
            BaseGraph.prototype.edge = function (e, value) {
                var edge = this._strictGetEdge(e);
                if (arguments.length === 1) {
                    return edge.value
                }
                edge.value = value
            };
            BaseGraph.prototype.edges = function () {
                var es = [];
                this.eachEdge(function (id) {
                    es.push(id)
                });
                return es
            };
            BaseGraph.prototype.eachEdge = function (func) {
                for (var k in this._edges) {
                    var edge = this._edges[k];
                    func(edge.id, edge.u, edge.v, edge.value)
                }
            };
            BaseGraph.prototype.incidentNodes = function (e) {
                var edge = this._strictGetEdge(e);
                return [edge.u, edge.v]
            };
            BaseGraph.prototype.addNode = function (u, value) {
                if (u === undefined || u === null) {
                    do {
                        u = "_" + ++this._nextId
                    } while (this.hasNode(u))
                } else if (this.hasNode(u)) {
                    throw new Error("Graph already has node '" + u + "'")
                }
                this._nodes[u] = {
                    id: u,
                    value: value
                };
                return u
            };
            BaseGraph.prototype.delNode = function (u) {
                this._strictGetNode(u);
                this.incidentEdges(u).forEach(function (e) {
                    this.delEdge(e)
                }, this);
                delete this._nodes[u]
            };
            BaseGraph.prototype._addEdge = function (e, u, v, value, inMap, outMap) {
                this._strictGetNode(u);
                this._strictGetNode(v);
                if (e === undefined || e === null) {
                    do {
                        e = "_" + ++this._nextId
                    } while (this.hasEdge(e))
                } else if (this.hasEdge(e)) {
                    throw new Error("Graph already has edge '" + e + "'")
                }
                this._edges[e] = {
                    id: e,
                    u: u,
                    v: v,
                    value: value
                };
                addEdgeToMap(inMap[v], u, e);
                addEdgeToMap(outMap[u], v, e);
                return e
            };
            BaseGraph.prototype._delEdge = function (e, inMap, outMap) {
                var edge = this._strictGetEdge(e);
                delEdgeFromMap(inMap[edge.v], edge.u, e);
                delEdgeFromMap(outMap[edge.u], edge.v, e);
                delete this._edges[e]
            };
            BaseGraph.prototype.copy = function () {
                var copy = new this.constructor;
                copy.graph(this.graph());
                this.eachNode(function (u, value) {
                    copy.addNode(u, value)
                });
                this.eachEdge(function (e, u, v, value) {
                    copy.addEdge(e, u, v, value)
                });
                copy._nextId = this._nextId;
                return copy
            };
            BaseGraph.prototype.filterNodes = function (filter) {
                var copy = new this.constructor;
                copy.graph(this.graph());
                this.eachNode(function (u, value) {
                    if (filter(u)) {
                        copy.addNode(u, value)
                    }
                });
                this.eachEdge(function (e, u, v, value) {
                    if (copy.hasNode(u) && copy.hasNode(v)) {
                        copy.addEdge(e, u, v, value)
                    }
                });
                return copy
            };
            BaseGraph.prototype._strictGetNode = function (u) {
                var node = this._nodes[u];
                if (node === undefined) {
                    throw new Error("Node '" + u + "' is not in graph")
                }
                return node
            };
            BaseGraph.prototype._strictGetEdge = function (e) {
                var edge = this._edges[e];
                if (edge === undefined) {
                    throw new Error("Edge '" + e + "' is not in graph")
                }
                return edge
            };

            function addEdgeToMap(map, v, e) {
                (map[v] || (map[v] = new Set)).add(e)
            }

            function delEdgeFromMap(map, v, e) {
                var vEntry = map[v];
                vEntry.remove(e);
                if (vEntry.size() === 0) {
                    delete map[v]
                }
            }
        }, {
            "cp-data": 19
        }
    ],
    25: [
        function (require, module, exports) {
            var Digraph = require("./Digraph"),
                compoundify = require("./compoundify");
            var CDigraph = compoundify(Digraph);
            module.exports = CDigraph;
            CDigraph.fromDigraph = function (src) {
                var g = new CDigraph,
                    graphValue = src.graph();
                if (graphValue !== undefined) {
                    g.graph(graphValue)
                }
                src.eachNode(function (u, value) {
                    if (value === undefined) {
                        g.addNode(u)
                    } else {
                        g.addNode(u, value)
                    }
                });
                src.eachEdge(function (e, u, v, value) {
                    if (value === undefined) {
                        g.addEdge(null, u, v)
                    } else {
                        g.addEdge(null, u, v, value)
                    }
                });
                return g
            };
            CDigraph.prototype.toString = function () {
                return "CDigraph " + JSON.stringify(this, null, 2)
            }
        }, {
            "./Digraph": 27,
            "./compoundify": 40
        }
    ],
    26: [
        function (require, module, exports) {
            var Graph = require("./Graph"),
                compoundify = require("./compoundify");
            var CGraph = compoundify(Graph);
            module.exports = CGraph;
            CGraph.fromGraph = function (src) {
                var g = new CGraph,
                    graphValue = src.graph();
                if (graphValue !== undefined) {
                    g.graph(graphValue)
                }
                src.eachNode(function (u, value) {
                    if (value === undefined) {
                        g.addNode(u)
                    } else {
                        g.addNode(u, value)
                    }
                });
                src.eachEdge(function (e, u, v, value) {
                    if (value === undefined) {
                        g.addEdge(null, u, v)
                    } else {
                        g.addEdge(null, u, v, value)
                    }
                });
                return g
            };
            CGraph.prototype.toString = function () {
                return "CGraph " + JSON.stringify(this, null, 2)
            }
        }, {
            "./Graph": 28,
            "./compoundify": 40
        }
    ],
    27: [
        function (require, module, exports) {
            var util = require("./util"),
                BaseGraph = require("./BaseGraph"),
                Set = require("cp-data").Set;
            module.exports = Digraph;

            function Digraph() {
                BaseGraph.call(this);
                this._inEdges = {};
                this._outEdges = {}
            }
            Digraph.prototype = new BaseGraph;
            Digraph.prototype.constructor = Digraph;
            Digraph.prototype.isDirected = function () {
                return true
            };
            Digraph.prototype.successors = function (u) {
                this._strictGetNode(u);
                return Object.keys(this._outEdges[u]).map(function (v) {
                    return this._nodes[v].id
                }, this)
            };
            Digraph.prototype.predecessors = function (u) {
                this._strictGetNode(u);
                return Object.keys(this._inEdges[u]).map(function (v) {
                    return this._nodes[v].id
                }, this)
            };
            Digraph.prototype.neighbors = function (u) {
                return Set.union([this.successors(u), this.predecessors(u)]).keys()
            };
            Digraph.prototype.sources = function () {
                var self = this;
                return this._filterNodes(function (u) {
                    return self.inEdges(u).length === 0
                })
            };
            Digraph.prototype.sinks = function () {
                var self = this;
                return this._filterNodes(function (u) {
                    return self.outEdges(u).length === 0
                })
            };
            Digraph.prototype.source = function (e) {
                return this._strictGetEdge(e).u
            };
            Digraph.prototype.target = function (e) {
                return this._strictGetEdge(e).v
            };
            Digraph.prototype.inEdges = function (target, source) {
                this._strictGetNode(target);
                var results = Set.union(util.values(this._inEdges[target])).keys();
                if (arguments.length > 1) {
                    this._strictGetNode(source);
                    results = results.filter(function (e) {
                        return this.source(e) === source
                    }, this)
                }
                return results
            };
            Digraph.prototype.outEdges = function (source, target) {
                this._strictGetNode(source);
                var results = Set.union(util.values(this._outEdges[source])).keys();
                if (arguments.length > 1) {
                    this._strictGetNode(target);
                    results = results.filter(function (e) {
                        return this.target(e) === target
                    }, this)
                }
                return results
            };
            Digraph.prototype.incidentEdges = function (u, v) {
                if (arguments.length > 1) {
                    return Set.union([this.outEdges(u, v), this.outEdges(v, u)]).keys()
                } else {
                    return Set.union([this.inEdges(u), this.outEdges(u)]).keys()
                }
            };
            Digraph.prototype.toString = function () {
                return "Digraph " + JSON.stringify(this, null, 2)
            };
            Digraph.prototype.addNode = function (u, value) {
                u = BaseGraph.prototype.addNode.call(this, u, value);
                this._inEdges[u] = {};
                this._outEdges[u] = {};
                return u
            };
            Digraph.prototype.delNode = function (u) {
                BaseGraph.prototype.delNode.call(this, u);
                delete this._inEdges[u];
                delete this._outEdges[u]
            };
            Digraph.prototype.addEdge = function (e, source, target, value) {
                return BaseGraph.prototype._addEdge.call(this, e, source, target, value, this._inEdges, this._outEdges)
            };
            Digraph.prototype.delEdge = function (e) {
                BaseGraph.prototype._delEdge.call(this, e, this._inEdges, this._outEdges)
            };
            Digraph.prototype._filterNodes = function (pred) {
                var filtered = [];
                this.eachNode(function (u) {
                    if (pred(u)) {
                        filtered.push(u)
                    }
                });
                return filtered
            }
        }, {
            "./BaseGraph": 24,
            "./util": 44,
            "cp-data": 19
        }
    ],
    28: [
        function (require, module, exports) {
            var util = require("./util"),
                BaseGraph = require("./BaseGraph"),
                Set = require("cp-data").Set;
            module.exports = Graph;

            function Graph() {
                BaseGraph.call(this);
                this._incidentEdges = {}
            }
            Graph.prototype = new BaseGraph;
            Graph.prototype.constructor = Graph;
            Graph.prototype.isDirected = function () {
                return false
            };
            Graph.prototype.neighbors = function (u) {
                this._strictGetNode(u);
                return Object.keys(this._incidentEdges[u]).map(function (v) {
                    return this._nodes[v].id
                }, this)
            };
            Graph.prototype.incidentEdges = function (u, v) {
                this._strictGetNode(u);
                if (arguments.length > 1) {
                    this._strictGetNode(v);
                    return v in this._incidentEdges[u] ? this._incidentEdges[u][v].keys() : []
                } else {
                    return Set.union(util.values(this._incidentEdges[u])).keys()
                }
            };
            Graph.prototype.toString = function () {
                return "Graph " + JSON.stringify(this, null, 2)
            };
            Graph.prototype.addNode = function (u, value) {
                u = BaseGraph.prototype.addNode.call(this, u, value);
                this._incidentEdges[u] = {};
                return u
            };
            Graph.prototype.delNode = function (u) {
                BaseGraph.prototype.delNode.call(this, u);
                delete this._incidentEdges[u]
            };
            Graph.prototype.addEdge = function (e, u, v, value) {
                return BaseGraph.prototype._addEdge.call(this, e, u, v, value, this._incidentEdges, this._incidentEdges)
            };
            Graph.prototype.delEdge = function (e) {
                BaseGraph.prototype._delEdge.call(this, e, this._incidentEdges, this._incidentEdges)
            }
        }, {
            "./BaseGraph": 24,
            "./util": 44,
            "cp-data": 19
        }
    ],
    29: [
        function (require, module, exports) {
            var Set = require("cp-data").Set;
            module.exports = components;

            function components(g) {
                var results = [];
                var visited = new Set;

                function dfs(v, component) {
                    if (!visited.has(v)) {
                        visited.add(v);
                        component.push(v);
                        g.neighbors(v).forEach(function (w) {
                            dfs(w, component)
                        })
                    }
                }
                g.nodes().forEach(function (v) {
                    var component = [];
                    dfs(v, component);
                    if (component.length > 0) {
                        results.push(component)
                    }
                });
                return results
            }
        }, {
            "cp-data": 19
        }
    ],
    30: [
        function (require, module, exports) {
            var PriorityQueue = require("cp-data").PriorityQueue;
            module.exports = dijkstra;

            function dijkstra(g, source, weightFunc, incidentFunc) {
                var results = {}, pq = new PriorityQueue;

                function updateNeighbors(e) {
                    var incidentNodes = g.incidentNodes(e),
                        v = incidentNodes[0] !== u ? incidentNodes[0] : incidentNodes[1],
                        vEntry = results[v],
                        weight = weightFunc(e),
                        distance = uEntry.distance + weight;
                    if (weight < 0) {
                        throw new Error("dijkstra does not allow negative edge weights. Bad edge: " + e + " Weight: " + weight)
                    }
                    if (distance < vEntry.distance) {
                        vEntry.distance = distance;
                        vEntry.predecessor = u;
                        pq.decrease(v, distance)
                    }
                }
                weightFunc = weightFunc || function () {
                    return 1
                };
                incidentFunc = incidentFunc || (g.isDirected() ? function (u) {
                    return g.outEdges(u)
                } : function (u) {
                    return g.incidentEdges(u)
                });
                g.nodes().forEach(function (u) {
                    var distance = u === source ? 0 : Number.POSITIVE_INFINITY;
                    results[u] = {
                        distance: distance
                    };
                    pq.add(u, distance)
                });
                var u, uEntry;
                while (pq.size() > 0) {
                    u = pq.removeMin();
                    uEntry = results[u];
                    if (uEntry.distance === Number.POSITIVE_INFINITY) {
                        break
                    }
                    incidentFunc(u).forEach(updateNeighbors)
                }
                return results
            }
        }, {
            "cp-data": 19
        }
    ],
    31: [
        function (require, module, exports) {
            var dijkstra = require("./dijkstra");
            module.exports = dijkstraAll;

            function dijkstraAll(g, weightFunc, incidentFunc) {
                var results = {};
                g.nodes().forEach(function (u) {
                    results[u] = dijkstra(g, u, weightFunc, incidentFunc)
                });
                return results
            }
        }, {
            "./dijkstra": 30
        }
    ],
    32: [
        function (require, module, exports) {
            var tarjan = require("./tarjan");
            module.exports = findCycles;

            function findCycles(g) {
                return tarjan(g).filter(function (cmpt) {
                    return cmpt.length > 1
                })
            }
        }, {
            "./tarjan": 38
        }
    ],
    33: [
        function (require, module, exports) {
            module.exports = floydWarshall;

            function floydWarshall(g, weightFunc, incidentFunc) {
                var results = {}, nodes = g.nodes();
                weightFunc = weightFunc || function () {
                    return 1
                };
                incidentFunc = incidentFunc || (g.isDirected() ? function (u) {
                    return g.outEdges(u)
                } : function (u) {
                    return g.incidentEdges(u)
                });
                nodes.forEach(function (u) {
                    results[u] = {};
                    results[u][u] = {
                        distance: 0
                    };
                    nodes.forEach(function (v) {
                        if (u !== v) {
                            results[u][v] = {
                                distance: Number.POSITIVE_INFINITY
                            }
                        }
                    });
                    incidentFunc(u).forEach(function (e) {
                        var incidentNodes = g.incidentNodes(e),
                            v = incidentNodes[0] !== u ? incidentNodes[0] : incidentNodes[1],
                            d = weightFunc(e);
                        if (d < results[u][v].distance) {
                            results[u][v] = {
                                distance: d,
                                predecessor: u
                            }
                        }
                    })
                });
                nodes.forEach(function (k) {
                    var rowK = results[k];
                    nodes.forEach(function (i) {
                        var rowI = results[i];
                        nodes.forEach(function (j) {
                            var ik = rowI[k];
                            var kj = rowK[j];
                            var ij = rowI[j];
                            var altDistance = ik.distance + kj.distance;
                            if (altDistance < ij.distance) {
                                ij.distance = altDistance;
                                ij.predecessor = kj.predecessor
                            }
                        })
                    })
                });
                return results
            }
        }, {}
    ],
    34: [
        function (require, module, exports) {
            var topsort = require("./topsort");
            module.exports = isAcyclic;

            function isAcyclic(g) {
                try {
                    topsort(g)
                } catch (e) {
                    if (e instanceof topsort.CycleException) return false;
                    throw e
                }
                return true
            }
        }, {
            "./topsort": 39
        }
    ],
    35: [
        function (require, module, exports) {
            var Set = require("cp-data").Set;
            module.exports = postorder;

            function postorder(g, root, f) {
                var visited = new Set;
                if (g.isDirected()) {
                    throw new Error("This function only works for undirected graphs")
                }

                function dfs(u, prev) {
                    if (visited.has(u)) {
                        throw new Error("The input graph is not a tree: " + g)
                    }
                    visited.add(u);
                    g.neighbors(u).forEach(function (v) {
                        if (v !== prev) dfs(v, u)
                    });
                    f(u)
                }
                dfs(root)
            }
        }, {
            "cp-data": 19
        }
    ],
    36: [
        function (require, module, exports) {
            var Set = require("cp-data").Set;
            module.exports = preorder;

            function preorder(g, root, f) {
                var visited = new Set;
                if (g.isDirected()) {
                    throw new Error("This function only works for undirected graphs")
                }

                function dfs(u, prev) {
                    if (visited.has(u)) {
                        throw new Error("The input graph is not a tree: " + g)
                    }
                    visited.add(u);
                    f(u);
                    g.neighbors(u).forEach(function (v) {
                        if (v !== prev) dfs(v, u)
                    })
                }
                dfs(root)
            }
        }, {
            "cp-data": 19
        }
    ],
    37: [
        function (require, module, exports) {
            var Graph = require("../Graph"),
                PriorityQueue = require("cp-data").PriorityQueue;
            module.exports = prim;

            function prim(g, weightFunc) {
                var result = new Graph,
                    parents = {}, pq = new PriorityQueue,
                    u;

                function updateNeighbors(e) {
                    var incidentNodes = g.incidentNodes(e),
                        v = incidentNodes[0] !== u ? incidentNodes[0] : incidentNodes[1],
                        pri = pq.priority(v);
                    if (pri !== undefined) {
                        var edgeWeight = weightFunc(e);
                        if (edgeWeight < pri) {
                            parents[v] = u;
                            pq.decrease(v, edgeWeight)
                        }
                    }
                }
                if (g.order() === 0) {
                    return result
                }
                g.eachNode(function (u) {
                    pq.add(u, Number.POSITIVE_INFINITY);
                    result.addNode(u)
                });
                pq.decrease(g.nodes()[0], 0);
                var init = false;
                while (pq.size() > 0) {
                    u = pq.removeMin();
                    if (u in parents) {
                        result.addEdge(null, u, parents[u])
                    } else if (init) {
                        throw new Error("Input graph is not connected: " + g)
                    } else {
                        init = true
                    }
                    g.incidentEdges(u).forEach(updateNeighbors)
                }
                return result
            }
        }, {
            "../Graph": 28,
            "cp-data": 19
        }
    ],
    38: [
        function (require, module, exports) {
            module.exports = tarjan;

            function tarjan(g) {
                if (!g.isDirected()) {
                    throw new Error("tarjan can only be applied to a directed graph. Bad input: " + g)
                }
                var index = 0,
                    stack = [],
                    visited = {}, results = [];

                function dfs(u) {
                    var entry = visited[u] = {
                        onStack: true,
                        lowlink: index,
                        index: index++
                    };
                    stack.push(u);
                    g.successors(u).forEach(function (v) {
                        if (!(v in visited)) {
                            dfs(v);
                            entry.lowlink = Math.min(entry.lowlink, visited[v].lowlink)
                        } else if (visited[v].onStack) {
                            entry.lowlink = Math.min(entry.lowlink, visited[v].index)
                        }
                    });
                    if (entry.lowlink === entry.index) {
                        var cmpt = [],
                            v;
                        do {
                            v = stack.pop();
                            visited[v].onStack = false;
                            cmpt.push(v)
                        } while (u !== v);
                        results.push(cmpt)
                    }
                }
                g.nodes().forEach(function (u) {
                    if (!(u in visited)) {
                        dfs(u)
                    }
                });
                return results
            }
        }, {}
    ],
    39: [
        function (require, module, exports) {
            module.exports = topsort;
            topsort.CycleException = CycleException;

            function topsort(g) {
                if (!g.isDirected()) {
                    throw new Error("topsort can only be applied to a directed graph. Bad input: " + g)
                }
                var visited = {};
                var stack = {};
                var results = [];

                function visit(node) {
                    if (node in stack) {
                        throw new CycleException
                    }
                    if (!(node in visited)) {
                        stack[node] = true;
                        visited[node] = true;
                        g.predecessors(node).forEach(function (pred) {
                            visit(pred)
                        });
                        delete stack[node];
                        results.push(node)
                    }
                }
                var sinks = g.sinks();
                if (g.order() !== 0 && sinks.length === 0) {
                    throw new CycleException
                }
                g.sinks().forEach(function (sink) {
                    visit(sink)
                });
                return results
            }

            function CycleException() {}
            CycleException.prototype.toString = function () {
                return "Graph has at least one cycle"
            }
        }, {}
    ],
    40: [
        function (require, module, exports) {
            var Set = require("cp-data").Set;
            module.exports = compoundify;

            function compoundify(SuperConstructor) {
                function Constructor() {
                    SuperConstructor.call(this);
                    this._parents = {};
                    this._children = {
                        "null": new Set
                    }
                }
                Constructor.prototype = new SuperConstructor;
                Constructor.prototype.constructor = Constructor;
                Constructor.prototype.parent = function (u, parent) {
                    this._strictGetNode(u);
                    if (arguments.length < 2) {
                        return this._parents[u]
                    }
                    if (u === parent) {
                        throw new Error("Cannot make " + u + " a parent of itself")
                    }
                    if (parent !== null) {
                        this._strictGetNode(parent)
                    }
                    this._children[this._parents[u]].remove(u);
                    this._parents[u] = parent;
                    this._children[parent].add(u)
                };
                Constructor.prototype.children = function (u) {
                    if (u !== null) {
                        this._strictGetNode(u)
                    }
                    return this._children[u].keys()
                };
                Constructor.prototype.addNode = function (u, value) {
                    u = SuperConstructor.prototype.addNode.call(this, u, value);
                    this._parents[u] = null;
                    this._children[u] = new Set;
                    this._children[null].add(u);
                    return u
                };
                Constructor.prototype.delNode = function (u) {
                    var parent = this.parent(u);
                    this._children[u].keys().forEach(function (child) {
                        this.parent(child, parent)
                    }, this);
                    this._children[parent].remove(u);
                    delete this._parents[u];
                    delete this._children[u];
                    return SuperConstructor.prototype.delNode.call(this, u)
                };
                Constructor.prototype.copy = function () {
                    var copy = SuperConstructor.prototype.copy.call(this);
                    this.nodes().forEach(function (u) {
                        copy.parent(u, this.parent(u))
                    }, this);
                    return copy
                };
                Constructor.prototype.filterNodes = function (filter) {
                    var self = this,
                        copy = SuperConstructor.prototype.filterNodes.call(this, filter);
                    var parents = {};

                    function findParent(u) {
                        var parent = self.parent(u);
                        if (parent === null || copy.hasNode(parent)) {
                            parents[u] = parent;
                            return parent
                        } else if (parent in parents) {
                            return parents[parent]
                        } else {
                            return findParent(parent)
                        }
                    }
                    copy.eachNode(function (u) {
                        copy.parent(u, findParent(u))
                    });
                    return copy
                };
                return Constructor
            }
        }, {
            "cp-data": 19
        }
    ],
    41: [
        function (require, module, exports) {
            var Graph = require("../Graph"),
                Digraph = require("../Digraph"),
                CGraph = require("../CGraph"),
                CDigraph = require("../CDigraph");
            exports.decode = function (nodes, edges, Ctor) {
                Ctor = Ctor || Digraph;
                if (typeOf(nodes) !== "Array") {
                    throw new Error("nodes is not an Array")
                }
                if (typeOf(edges) !== "Array") {
                    throw new Error("edges is not an Array")
                }
                if (typeof Ctor === "string") {
                    switch (Ctor) {
                    case "graph":
                        Ctor = Graph;
                        break;
                    case "digraph":
                        Ctor = Digraph;
                        break;
                    case "cgraph":
                        Ctor = CGraph;
                        break;
                    case "cdigraph":
                        Ctor = CDigraph;
                        break;
                    default:
                        throw new Error("Unrecognized graph type: " + Ctor)
                    }
                }
                var graph = new Ctor;
                nodes.forEach(function (u) {
                    graph.addNode(u.id, u.value)
                });
                if (graph.parent) {
                    nodes.forEach(function (u) {
                        if (u.children) {
                            u.children.forEach(function (v) {
                                graph.parent(v, u.id)
                            })
                        }
                    })
                }
                edges.forEach(function (e) {
                    graph.addEdge(e.id, e.u, e.v, e.value)
                });
                return graph
            };
            exports.encode = function (graph) {
                var nodes = [];
                var edges = [];
                graph.eachNode(function (u, value) {
                    var node = {
                        id: u,
                        value: value
                    };
                    if (graph.children) {
                        var children = graph.children(u);
                        if (children.length) {
                            node.children = children
                        }
                    }
                    nodes.push(node)
                });
                graph.eachEdge(function (e, u, v, value) {
                    edges.push({
                        id: e,
                        u: u,
                        v: v,
                        value: value
                    })
                });
                var type;
                if (graph instanceof CDigraph) {
                    type = "cdigraph"
                } else if (graph instanceof CGraph) {
                    type = "cgraph"
                } else if (graph instanceof Digraph) {
                    type = "digraph"
                } else if (graph instanceof Graph) {
                    type = "graph"
                } else {
                    throw new Error("Couldn't determine type of graph: " + graph)
                }
                return {
                    nodes: nodes,
                    edges: edges,
                    type: type
                }
            };

            function typeOf(obj) {
                return Object.prototype.toString.call(obj).slice(8, -1)
            }
        }, {
            "../CDigraph": 25,
            "../CGraph": 26,
            "../Digraph": 27,
            "../Graph": 28
        }
    ],
    42: [
        function (require, module, exports) {
            var Set = require("cp-data").Set;
            exports.all = function () {
                return function () {
                    return true
                }
            };
            exports.nodesFromList = function (nodes) {
                var set = new Set(nodes);
                return function (u) {
                    return set.has(u)
                }
            }
        }, {
            "cp-data": 19
        }
    ],
    43: [
        function (require, module, exports) {
            var Graph = require("./Graph"),
                Digraph = require("./Digraph");
            Graph.prototype.toDigraph = Graph.prototype.asDirected = function () {
                var g = new Digraph;
                this.eachNode(function (u, value) {
                    g.addNode(u, value)
                });
                this.eachEdge(function (e, u, v, value) {
                    g.addEdge(null, u, v, value);
                    g.addEdge(null, v, u, value)
                });
                return g
            };
            Digraph.prototype.toGraph = Digraph.prototype.asUndirected = function () {
                var g = new Graph;
                this.eachNode(function (u, value) {
                    g.addNode(u, value)
                });
                this.eachEdge(function (e, u, v, value) {
                    g.addEdge(e, u, v, value)
                });
                return g
            }
        }, {
            "./Digraph": 27,
            "./Graph": 28
        }
    ],
    44: [
        function (require, module, exports) {
            exports.values = function (o) {
                var ks = Object.keys(o),
                    len = ks.length,
                    result = new Array(len),
                    i;
                for (i = 0; i < len; ++i) {
                    result[i] = o[ks[i]]
                }
                return result
            }
        }, {}
    ],
    45: [
        function (require, module, exports) {
            module.exports = "0.7.0"
        }, {}
    ]
}, {}, [1]);
joint.layout.DirectedGraph = {
    layout: function (graph, opt) {
        opt = opt || {};
        var inputGraph = this._prepareData(graph);
        var runner = dagre.layout();
        if (opt.debugLevel) {
            runner.debugLevel(opt.debugLevel)
        }
        if (opt.rankDir) {
            runner.rankDir(opt.rankDir)
        }
        if (opt.rankSep) {
            runner.rankSep(opt.rankSep)
        }
        if (opt.edgeSep) {
            runner.edgeSep(opt.edgeSep)
        }
        if (opt.nodeSep) {
            runner.nodeSep(opt.nodeSep)
        }
        var layoutGraph = runner.run(inputGraph);
        layoutGraph.eachNode(function (u, value) {
            if (!value.dummy) {
                graph.get("cells").get(u).set("position", {
                    x: value.x - value.width / 2,
                    y: value.y - value.height / 2
                })
            }
        });
        if (opt.setLinkVertices) {
            layoutGraph.eachEdge(function (e, u, v, value) {
                var link = graph.get("cells").get(e);
                if (link) {
                    graph.get("cells").get(e).set("vertices", value.points)
                }
            })
        }
        return {
            width: layoutGraph.graph().width,
            height: layoutGraph.graph().height
        }
    },
    _prepareData: function (graph) {
        var dagreGraph = new dagre.Digraph;
        _.each(graph.getElements(), function (cell) {
            if (dagreGraph.hasNode(cell.id)) return;
            dagreGraph.addNode(cell.id, {
                width: cell.get("size").width,
                height: cell.get("size").height,
                rank: cell.get("rank")
            })
        });
        _.each(graph.getLinks(), function (cell) {
            if (dagreGraph.hasEdge(cell.id)) return;
            var sourceId = cell.get("source").id;
            var targetId = cell.get("target").id;
            dagreGraph.addEdge(cell.id, sourceId, targetId, {
                minLen: cell.get("minLen") || 1
            })
        });
        return dagreGraph
    }
};
