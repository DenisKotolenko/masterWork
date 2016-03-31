joint.ui.Tooltip = Backbone.View.extend({
    className: "tooltip",
    options: {
        left: undefined,
        right: undefined,
        top: undefined,
        bottom: undefined,
        padding: 10
    },
    initialize: function () {
        _.bindAll(this, "render", "hide", "position");
        this.$target = $(this.options.target);
        this.$target.on("mouseover", this.render);
        this.$target.on("mouseout", this.hide);
        this.$target.on("mousedown", this.hide);
        this.$el.addClass(this.options.direction)
    },
    remove: function () {
        this.$target.off("mouseover", this.render);
        this.$target.off("mouseout", this.hide);
        this.$target.off("mousedown", this.hide);
        Backbone.View.prototype.remove.apply(this, arguments)
    },
    hide: function () {
        Backbone.View.prototype.remove.apply(this, arguments)
    },
    render: function () {
        this.$el.html(this.options.content);
        this.$el.hide();
        $(document.body).append(this.$el);
        var $images = this.$("img");
        if ($images.length) {
            $images.on("load", this.position)
        } else {
            this.position()
        }
    },
    getElementBBox: function (el) {
        var $el = $(el);
        var offset = $el.offset();
        var bbox;
        var scrollTop = document.body.scrollTop || document.documentElement.scrollTop;
        var scrollLeft = document.body.scrollLeft || document.documentElement.scrollLeft;
        offset.top -= scrollTop || 0;
        offset.left -= scrollLeft || 0;
        if (el.ownerSVGElement) {
            bbox = V(el).bbox();
            bbox.x = offset.left;
            bbox.y = offset.top
        } else {
            bbox = {
                x: offset.left,
                y: offset.top,
                width: $el.outerWidth(),
                height: $el.outerHeight()
            }
        }
        return bbox
    },
    position: function () {
        var offset = this.$target.offset();
        var target = this.$target[0];
        var bbox = this.getElementBBox(this.$target[0]);
        var padding = this.options.padding;
        this.$el.show();
        var height = this.$el.outerHeight();
        var width = this.$el.outerWidth();
        if (this.options.left) {
            var $left = $(this.options.left);
            var leftBbox = this.getElementBBox($left[0]);
            this.$el.css({
                left: leftBbox.x + leftBbox.width + padding,
                top: bbox.y + bbox.height / 2 - height / 2
            })
        } else if (this.options.right) {
            var $right = $(this.options.right);
            var rightBbox = this.getElementBBox($right[0]);
            this.$el.css({
                left: rightBbox.x - width - padding,
                top: bbox.y + bbox.height / 2 - height / 2
            })
        } else if (this.options.top) {
            var $top = $(this.options.top);
            var topBbox = this.getElementBBox($top[0]);
            this.$el.css({
                top: topBbox.y + topBbox.height + padding,
                left: bbox.x + bbox.width / 2 - width / 2
            })
        } else if (this.options.bottom) {
            var $bottom = $(this.options.bottom);
            var bottomBbox = this.getElementBBox($bottom[0]);
            this.$el.css({
                top: bottomBbox.y - height - padding,
                left: bbox.x + bbox.width / 2 - width / 2
            })
        } else {
            this.$el.css({
                left: bbox.x + bbox.width + padding,
                top: bbox.y + bbox.height / 2 - height / 2
            })
        }
    }
});
