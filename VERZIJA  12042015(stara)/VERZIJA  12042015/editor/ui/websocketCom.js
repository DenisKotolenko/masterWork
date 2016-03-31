if (typeof exports === "object") {
    var joint = {
        com: {},
        util: require("../../../src/core").util
    };
    var WebSocketServer = require("ws").Server;
    var WebSocket = require("ws");
    var _ = require("lodash");
    var url = require("url");
    var Backbone = require("backbone")
}
joint.com = joint.com || {};
joint.com.Channel = function (opt) {
    this.options = opt;
    if (!this.options || !this.options.graph) throw new Error("Channel: missing a graph.");
    this.options.ttl = this.options.ttl || 60;
    this.options.healthCheckInterval = this.options.healthCheckInterval || 1e3 * 60 * 60;
    this.options.reconnectInterval = this.options.reconnectInterval || 1e4;
    this._isClient = !! this.options.url;
    this._clients = [];
    this.messageQueue = [];
    this.id = this.options.id || (this._isClient ? "c_" : "s_") + joint.util.uuid();
    this.state = {};
    this.state[this.id] = 0;
    this.sites = {};
    this.sites[this.id] = {
        socket: undefined,
        outgoing: [],
        ttl: this.options.ttl
    };
    this.initialize()
};
_.extend(joint.com.Channel.prototype, Backbone.Events);
joint.com.Channel.prototype.initialize = function () {
    this.options.graph.on("all", this.onGraphChange.bind(this));
    if (this._isClient) {
        this.connectClient()
    } else if (this.options.port) {
        this.server = new WebSocketServer({
            port: this.options.port
        });
        this.server.on("connection", this.onConnection.bind(this))
    }
    if (!this._isClient) {
        this._healthCheckInterval = setInterval(this.healthCheck.bind(this), this.options.healthCheckInterval)
    }
};
joint.com.Channel.prototype.connectClient = function () {
    var url = this.options.url + "/?channelId=" + this.id + "&state=" + JSON.stringify(this.state) + (this.options.query ? "&query=" + JSON.stringify(this.options.query) : "");
    if (this.options.debugLevel > 0) this.log("connectClient", url);
    var socket = new WebSocket(url);
    socket.onopen = this.onConnection.bind(this, socket);
    socket.onclose = this.onClose.bind(this, socket)
};
joint.com.Channel.prototype.close = function () {
    if (this._reconnectTimeout) clearTimeout(this._reconnectTimeout);
    if (this._healthCheckInterval) clearInterval(this._healthCheckInterval);
    this._closed = true;
    _.each(this.sites, function (site) {
        if (site.socket) site.socket.close()
    });
    if (this.server) this.server.close()
};
joint.com.Channel.prototype.healthCheck = function () {
    if (this.options.debugLevel > 0) this.log("healthCheck", _.object(_.keys(this.sites), _.pluck(this.sites, "ttl")));
    _.each(this.sites, function (site, channelId) {
        if (channelId === this.id) return;
        if (!site.socket || site.socket.readyState !== 1) {
            site.ttl -= 1
        } else {
            site.ttl = this.options.ttl
        } if (site.ttl <= 0) {
            delete this.sites[channelId];
            delete this.state[channelId]
        }
    }, this)
};
joint.com.Channel.prototype.onConnection = function (socket) {
    this._clients.push(socket);
    if (this._isClient) {
        this.sites[this.id].socket = socket;
        socket.onmessage = function (evt) {
            this.onMessage(socket, evt.data)
        }.bind(this)
    } else {
        var upgradeReqUrl = url.parse(socket.upgradeReq.url, true);
        var channelId = upgradeReqUrl.query.channelId;
        if (this.sites[channelId]) {
            this.sites[channelId].socket = socket
        } else {
            if (this.debugLevel > 1) this.log("new_site", channelId);
            this.sites[channelId] = {
                socket: socket,
                outgoing: [],
                ttl: this.options.ttl
            };
            this.state[channelId] = 0;
            var op = {
                channelId: this.id,
                state: JSON.parse(JSON.stringify(this.state)),
                action: "graph",
                graph: this.options.graph.toJSON()
            };
            this.messageQueue.push({
                type: "op",
                data: op,
                source: this.id,
                target: [channelId]
            });
            this.send()
        }
        socket.on("message", this.onMessage.bind(this, socket));
        socket.on("close", this.onClose.bind(this, socket))
    }
};
joint.com.Channel.prototype.onClose = function (socket) {
    var index = this._clients.indexOf(socket);
    if (index !== -1) {
        this._clients.splice(index, 1)
    }
    if (this._isClient && !this._closed) {
        if (this._reconnectTimeout) clearTimeout(this._reconnectTimeout);
        this._reconnectTimeout = setTimeout(this.connectClient.bind(this), this.options.reconnectInterval)
    }
    this.trigger("close", socket)
};
joint.com.Channel.prototype.onMessage = function (socket, message) {
    this.trigger("message:received", message);
    if (this.options.debugLevel > 1) this.log("message", message);
    try {
        message = JSON.parse(message)
    } catch (err) {
        return console.error("Channel: message parsing failed.", err)
    }
    if (message.type == "notification") {
        this.trigger(message.data.event, message.data.data);
        return this.sendNotification(message)
    }
    var op = message.data;
    if (this._isClient) {
        var mySite = this.sites[this.id];
        op = this.receive(mySite, this.id, op)
    } else {
        var otherSite = this.sites[op.channelId];
        op = this.receive(otherSite, op.channelId, op);
        var mySite = this.sites[this.id];
        op = this.receive(mySite, this.id, op)
    } if (op.action === "graph") {
        this.state[op.channelId] = op.state[op.channelId]
    } else {
        this.state[op.channelId] = (this.state[op.channelId] || 0) + 1
    } if (this.options.debugLevel > 1) this.log("new state", this.state);
    this.execute(op);
    _.each(this.sites, function (site, channelId) {
        if (channelId !== this.id && channelId !== op.channelId) {
            this.receive(site, channelId, op)
        }
    }, this);
    if (!this._isClient) {
        message.op = op;
        this.messageQueue.push(message);
        this.broadcast(message)
    }
    this.trigger("message:processed", message)
};
joint.com.Channel.prototype.receive = function (site, channelId, op) {
    if (!site) return op;
    if (this.options.debugLevel > 1) this.log("receive", channelId, op);
    if (this.options.debugLevel > 1) this.log("outgoing", site.outgoing);
    site.outgoing = _.filter(site.outgoing, function (oldOp) {
        return oldOp.state[oldOp.channelId] >= (op.state[oldOp.channelId] || 0)
    });
    if (this.options.debugLevel > 1) this.log("outgoing.length", site.outgoing.length);
    for (var i = 0; i < site.outgoing.length; i++) {
        var oldOp = site.outgoing[i];
        var transformResult = this.transform(op, oldOp);
        op = transformResult[0];
        site.outgoing[i] = transformResult[1]
    }
    return op
};
joint.com.Channel.prototype.transform = function (o1, o2) {
    if (this.options.debugLevel > 1) this.log("transform", o1, o2);
    if (o1.action === "change:target" && o2.action === "remove") {
        if (o1.cell.target.id === o2.cell.id) {
            o1.cell.target = {
                x: 0,
                y: 0
            }
        }
    }
    if (o1.action === "change:source" && o2.action === "remove") {
        if (o1.cell.source.id === o2.cell.id) {
            o1.cell.source = {
                x: 0,
                y: 0
            }
        }
    }
    return [o1, o2]
};
joint.com.Channel.prototype.execute = function (op) {
    var cell;
    switch (op.action) {
    case "add":
        this.options.graph.addCell(op.cell, {
            remote: true
        });
        break;
    case "remove":
        cell = this.options.graph.getCell(op.cell.id);
        if (cell) cell.remove({
            remote: true,
            disconnectLinks: true
        });
        break;
    case "graph":
        this.options.graph.fromJSON(op.graph);
        break;
    default:
        var attribute = op.action.substr("change:".length);
        cell = this.options.graph.getCell(op.cell.id);
        if (cell) cell.set(attribute, op.cell[attribute], {
            remote: true
        });
        break
    }
};
joint.com.Channel.prototype.broadcast = function (message) {
    if (this._isClient) {
        message.target = _.keys(this.sites)
    } else {
        message.target = _.keys(_.omit(this.sites, this.id, message.source))
    }
    this.send()
};
joint.com.Channel.prototype.send = function () {
    if (this._paused) return;
    var toRemove = [];
    for (var i = 0; i < this.messageQueue.length; i++) {
        var m = this.messageQueue[i];
        if (this.sendMessage(m)) {
            toRemove.push(i)
        }
    }
    toRemove.forEach(_.bind(function (msgIdx) {
        this.messageQueue.splice(msgIdx, 1)
    }, this))
};
joint.com.Channel.prototype.sendMessage = function (m) {
    if (this.debugLevel > 1) this.log("sendMessage", m);
    var successTargets = [];
    m.target.forEach(function (target, idx) {
        var recievingSite = this.sites[target];
        if (!recievingSite) return successTargets.push(idx);
        if (!recievingSite.socket) return;
        if (recievingSite.socket.readyState !== 1) return;
        if (this.debugLevel > 1) this.log("sendMessage", target, m);
        recievingSite.socket.send(JSON.stringify(m));
        successTargets.push(idx)
    }, this);
    successTargets.forEach(function (targetIdx) {
        m.target.splice(targetIdx, 1)
    });
    if (!m.target.length) return true;
    return false
};
joint.com.Channel.prototype.log = function (keyword, args) {
    var text = "Channel [" + this.id + "] " + keyword.toUpperCase() + ": ";
    console.log.apply(console, [text].concat(_.rest(_.toArray(arguments))))
};
joint.com.Channel.prototype.pause = function () {
    this._paused = true
};
joint.com.Channel.prototype.unpause = function () {
    this._paused = false;
    this.send()
};
joint.com.Channel.prototype.notify = function (event, data) {
    var message = {
        type: "notification",
        source: this.id,
        data: {
            event: event,
            data: data
        }
    };
    this.sendNotification(message)
};
joint.com.Channel.prototype.sendNotification = function (message) {
    if (this._isClient) {
        message.target = _.keys(this.sites)
    } else {
        message.target = _.keys(_.omit(this.sites, this.id, message.source))
    }
    this.sendMessage(message)
};
joint.com.Channel.prototype.onGraphChange = function (eventName, cell, graph, options) {
    if (options && options.remote) return;
    var isInteresting = eventName === "add" || eventName === "remove" || eventName.substr(0, "change:".length) === "change:";
    if (!isInteresting) return;
    var op = {
        channelId: this.id,
        state: JSON.parse(JSON.stringify(this.state)),
        action: eventName,
        cell: cell.toJSON()
    };
    var message = {
        type: "op",
        data: op,
        source: this.id
    };
    if (this.options.debugLevel > 1) this.log("generate", message);
    this.messageQueue.push(message);
    this.broadcast(message);
    this.sites[this.id].outgoing.push(op);
    this.state[this.id]++
};
joint.com.ChannelHub = function (opt) {
    this.options = opt;
    if (!this.options.port) throw new Error("ChannelHub: missing a port.");
    this.initialize()
};
_.extend(joint.com.ChannelHub.prototype, Backbone.Events);
joint.com.ChannelHub.prototype.initialize = function () {
    this.server = new WebSocketServer({
        port: this.options.port
    });
    this.server.on("connection", this.onConnection.bind(this))
};
joint.com.ChannelHub.prototype.onConnection = function (socket) {
    var upgradeReqUrl = url.parse(socket.upgradeReq.url, true);
    var req = {
        query: upgradeReqUrl.query
    };
    if (!this.router) throw new Error("ChannelHub: missing a router.");
    var channel = this.router(req);
    channel.onConnection(socket)
};
joint.com.ChannelHub.prototype.route = function (router) {
    this.router = router
};
joint.com.ChannelHub.prototype.close = function () {
    this.server.close()
};
if (typeof exports === "object") {
    module.exports.Channel = joint.com.Channel;
    module.exports.ChannelHub = joint.com.ChannelHub
}
