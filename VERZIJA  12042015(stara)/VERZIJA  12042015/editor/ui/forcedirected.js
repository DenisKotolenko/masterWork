joint.layout.ForceDirected = Backbone.Model.extend({
    defaults: {
        linkDistance: 10,
        linkStrength: 1,
        charge: 10
    },
    initialize: function (opt) {
        this.elements = this.get("graph").getElements();
        this.links = this.get("graph").getLinks();
        this.cells = this.get("graph").get("cells");
        this.width = this.get("width");
        this.height = this.get("height");
        this.gravityCenter = this.get("gravityCenter");
        this.t = 1;
        this.energy = Infinity;
        this.progress = 0
    },
    start: function () {
        var w = this.get("width");
        var h = this.get("height");
        var elementsJSON = [];
        var linksJSON = [];
        _.each(this.elements, function (el) {
            el.set("position", {
                x: Math.random() * w,
                y: Math.random() * h
            });
            el.charge = el.get("charge") || this.get("charge");
            el.weight = el.get("weight") || 1;
            var pos = el.get("position");
            el.x = pos.x;
            el.y = pos.y;
            el.px = el.x;
            el.py = el.y;
            el.fx = 0;
            el.fy = 0
        }, this);
        _.each(this.links, function (link) {
            link.strength = link.get("strength") || this.get("linkStrength");
            link.distance = link.get("distance") || this.get("linkDistance");
            link.source = this.cells.get(link.get("source").id);
            link.target = this.cells.get(link.get("target").id)
        }, this)
    },
    step: function () {
        if (this.t * .99 < .005) return this.notifyEnd();
        var w = this.width;
        var h = this.height;
        var gravity = .1;
        var gravityCenter = this.gravityCenter;
        var energyBefore = this.energy;
        this.energy = 0;
        var xBefore = 0;
        var yBefore = 0;
        var xAfter = 0;
        var yAfter = 0;
        var i, j;
        var nElements = this.elements.length;
        var nLinks = this.links.length;
        for (i = 0; i < nElements - 1; i++) {
            var v = this.elements[i];
            xBefore += v.x;
            yBefore += v.y;
            for (j = i + 1; j < nElements; j++) {
                var u = this.elements[j];
                var dx = u.x - v.x;
                var dy = u.y - v.y;
                var distanceSquared = dx * dx + dy * dy;
                var distance = Math.sqrt(distanceSquared);
                var fr = this.t * v.charge / distanceSquared;
                var fx = fr * dx;
                var fy = fr * dy;
                v.fx -= fx;
                v.fy -= fy;
                u.fx += fx;
                u.fy += fy;
                this.energy += fx * fx + fy * fy
            }
        }
        xBefore += this.elements[nElements - 1].x;
        yBefore += this.elements[nElements - 1].y;
        for (i = 0; i < nLinks; i++) {
            var link = this.links[i];
            var v = link.source;
            var u = link.target;
            var dx = u.x - v.x;
            var dy = u.y - v.y;
            var distanceSquared = dx * dx + dy * dy;
            var distance = Math.sqrt(distanceSquared);
            var fa = this.t * link.strength * (distance - link.distance) / distance;
            var fx = fa * dx;
            var fy = fa * dy;
            var k = v.weight / (v.weight + u.weight);
            v.x += fx * (1 - k);
            v.y += fy * (1 - k);
            u.x -= fx * k;
            u.y -= fy * k;
            this.energy += fx * fx + fy * fy
        }
        for (i = 0; i < nElements; i++) {
            var el = this.elements[i];
            var pos = {
                x: el.x,
                y: el.y
            };
            if (gravityCenter) {
                pos.x += (gravityCenter.x - pos.x) * this.t * gravity;
                pos.y += (gravityCenter.y - pos.y) * this.t * gravity
            }
            pos.x += el.fx;
            pos.y += el.fy;
            pos.x = Math.max(0, Math.min(w, pos.x));
            pos.y = Math.max(0, Math.min(h, pos.y));
            var friction = .9;
            pos.x += (el.px - pos.x) * friction;
            pos.y += (el.py - pos.y) * friction;
            el.px = pos.x;
            el.py = pos.y;
            el.fx = el.fy = 0;
            el.x = pos.x;
            el.y = pos.y;
            xAfter += el.x;
            yAfter += el.y;
            this.notify(el, i, pos)
        }
        this.t = this.cool(this.t, this.energy, energyBefore);
        var gdx = xBefore - xAfter;
        var gdy = yBefore - yAfter;
        var gd = Math.sqrt(gdx * gdx + gdy * gdy);
        if (gd < 1) {
            this.notifyEnd()
        }
    },
    cool: function (t, energy, energyBefore) {
        if (energy < energyBefore) {
            this.progress += 1;
            if (this.progress >= 5) {
                this.progress = 0;
                return t / .99
            }
        } else {
            this.progress = 0;
            return t * .99
        }
        return t
    },
    notify: function (el, i, pos) {
        el.set("position", pos)
    },
    notifyEnd: function () {
        this.trigger("end")
    }
});
