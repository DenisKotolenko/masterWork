if (typeof exports === 'object') {

    var joint = {
        util: require('../src/core').util,
        shapes: {
            basic: require('./joint.shapes.basic')
        },
        dia: {
            ElementView: require('../src/joint.dia.element').ElementView,
            Link: require('../src/joint.dia.link').Link
        }
    };
    var _ = require('lodash');
}

joint.shapes.iot = {};

joint.shapes.iot.Model = joint.shapes.basic.Generic.extend(_.extend({}, joint.shapes.basic.PortsModelInterface, {

    markup: '<g class="rotatable"><g class="scalable"><rect/></g><text class="label"/><g class="inPorts"/><g class="outPorts"/></g>',
    portMarkup: '<g class="port<%= id %>"><polygon/><text/></g>',

    defaults: joint.util.deepSupplement({

        type: 'iot.Model',
        size: { width: 1, height: 1 },

        inPorts: [],
        outPorts: [],

        attrs: {
            '.': { magnet: false },
            rect: {
                width: 150, height: 250,
                stroke: 'black'
            },
            polygon: {
              //  r: 10,
                magnet: true,
                points: "-7,-7,7,-7,7,7,-7,7",

                stroke: 'black'
            },
            text: {
                fill: 'black',
                'pointer-events': 'none'
            },
            '.label': { text: 'Model', 'ref-x': .3, 'ref-y': .2 },
            '.inPorts text': { x:-15, dy: 4, 'text-anchor': 'end' },
            '.outPorts text':{ x: 15, dy: 4 }
        }

    }, joint.shapes.basic.Generic.prototype.defaults),

    getPortAttrs: function(portName, index, total, selector, type) {

        var attrs = {};

        var portClass = 'port' + index;
        var portSelector = selector + '>.' + portClass;
        var portTextSelector = portSelector + '>text';
        var portCircleSelector = portSelector + '>circle';

        attrs[portTextSelector] = { text: portName };
        attrs[portCircleSelector] = { port: { id: portName || _.uniqueId(type) , type: type } };
        attrs[portSelector] = { ref: 'rect', 'ref-y': (index + 0.5) * (1 / total) };

        if (selector === '.outPorts') { attrs[portSelector]['ref-dx'] = 0; }

        return attrs;
    }
}));


joint.shapes.iot.Device = joint.shapes.iot.Model.extend({
    defaults: joint.util.deepSupplement({
        type: 'iot.Device',
        size: { width: 80, height: 80 },
        attrs: {
            rect: { fill: 'salmon' },
            '.label': { text: 'Device' },
            '.inPorts circle': { fill: 'PaleGreen' },
            '.outPorts circle': { fill: 'Tomato' }
        }

    }, joint.shapes.iot.Model.prototype.defaults)
});

joint.shapes.iot.Rule = joint.shapes.iot.Model.extend({
    defaults: joint.util.deepSupplement({
        type: 'iot.Rule',
        size: { width: 80, height: 80 },
        attrs: {
            rect: { fill: 'salmon' },
            '.label': { text: 'Rule' },
            '.inPorts circle': { fill: 'PaleGreen' },
            '.outPorts circle': { fill: 'Tomato' }
        }

    }, joint.shapes.iot.Model.prototype.defaults)
});

joint.shapes.iot.Coupled = joint.shapes.iot.Model.extend({

    defaults: joint.util.deepSupplement({

        type: 'iot.Coupled',
        size: { width: 200, height: 300 },
        attrs: {
            rect: { fill: 'seaGreen' },
            '.label': { text: 'Coupled' },
            '.inPorts circle': { fill: 'PaleGreen' },
            '.outPorts circle': { fill: 'Tomato' }
        }

    }, joint.shapes.iot.Model.prototype.defaults)
});

joint.shapes.iot.Link = joint.dia.Link.extend({

    defaults: {
        type: 'iot.Link',
        attrs: { '.connection' : { 'stroke-width' :  2 }}
    }
});

joint.shapes.iot.ModelView = joint.dia.ElementView.extend(joint.shapes.basic.PortsViewInterface);
joint.shapes.iot.DeviceView = joint.shapes.iot.ModelView;
joint.shapes.iot.RuleView = joint.shapes.iot.ModelView;
joint.shapes.iot.CoupledView = joint.shapes.iot.ModelView;


if (typeof exports === 'object') {

    module.exports = joint.shapes.iot;
}
