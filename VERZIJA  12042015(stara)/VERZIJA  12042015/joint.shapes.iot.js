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

    markup: '<g class="rotatable"><g class="scalable"><rect fill="white" /></g><g class="labelcontainer"><text class="label"/></g><g class="inPorts"/><g class="outPorts"/></g>',
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
			grp: {
				text:''
			},
            text: {
                fill: 'black',
                'pointer-events': 'none',
            },
            '.labelcontainer text': { x:0, y: -5, 'text-anchor': 'start' },
            '.label': { text: 'Model'},
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
        size: {
            width: 8,
            height: 5
        },
        inPorts: ["in1", "in2"],
        outPorts: ["out"],
        attrs: {
            type: 'iot.Device',
            rect: {
                fill: "white",
                rx: 2,
                ry: 2
            },
            ".label": {
                text: "<<subsystem>>",
                fill: "white",
                "font-size": 10,
                stroke: "black",
                "stroke-width": 0
            },
            ".inPorts circle": {
                fill: "white",
                opacity: .9
            },
            ".outPorts circle": {
                fill: "white",
                opacity: .9
            },
            ".inPorts text, .outPorts text": {
                "font-size": 9
            }
        }

    }, joint.shapes.iot.Model.prototype.defaults)

});


joint.shapes.iot.Rule = joint.shapes.iot.Model.extend({
    defaults: joint.util.deepSupplement({
        type: 'iot.Rule',
        size: {
            width: 8,
            height: 5
        },
        inPorts: ["in1", "in2"],
        outPorts: ["out"],
        attrs: {
            type: 'iot.Rule',
            rect: {
                fill: "white",
                rx: 2,
                ry: 2
            },
            ".label": {
                text: "<<rule>>",
                fill: "white",
                "font-size": 10,
                stroke: "black",
                "stroke-width": 0
            },
            ".inPorts circle": {
                fill: "white",
                opacity: .9
            },
            ".outPorts circle": {
                fill: "white",
                opacity: .9
            },
            ".inPorts text, .outPorts text": {
                "font-size": 9
            }
        }

    }, joint.shapes.iot.Model.prototype.defaults)

});


joint.shapes.iot.System = joint.shapes.iot.Model.extend({
    defaults: joint.util.deepSupplement({
        type: 'iot.System',
        size: {
            width: 8,
            height: 5
        },
        attrs: {
            type: 'iot.System',
            rect: {
                fill: "white",
                rx: 2,
                ry: 2
            },
            ".label": {
                text: "<<system>>",
                fill: "white",
                "font-size": 10,
                stroke: "black",
                "stroke-width": 0
		    },
            ".inPorts circle": {
                fill: "white",
                opacity: .9
            },
            ".outPorts circle": {
                fill: "white",
                opacity: .9
            },
            ".inPorts text, .outPorts text": {
                "font-size": 9
            }
        }
    }, joint.shapes.iot.Model.prototype.defaults)
});

joint.shapes.iot.SubSystem = joint.shapes.iot.Model.extend({
    defaults: joint.util.deepSupplement({
        type: 'iot.SubSystem',
        size: {
            width: 8,
            height: 5
        },
        attrs: {
            type: 'iot.SubSystem',
            rect: {
                fill: "white",
                rx: 2,
                ry: 2
            },
			icon:{
				text:'<chart>'
			},
            ".label": {
                text: "<<subsystem>>",
                fill: "white",
                "font-size": 10,
                stroke: "black",
                "stroke-width": 0
            },
            ".inPorts circle": {
                fill: "white",
                opacity: .9
            },
            ".outPorts circle": {
                fill: "white",
                opacity: .9
            },
            ".inPorts text, .outPorts text": {
                "font-size": 9
            }
        }
    }, joint.shapes.iot.Model.prototype.defaults)
});

joint.shapes.iot.DeviceChannelBlock = joint.shapes.iot.Model.extend({

    markup: '<g class="rotatable"><g class="scalable"><rect/></g><text class="label"/></g>',
    
    defaults: joint.util.deepSupplement({
    
        type: 'iot.DeviceChannelBlock',
        attrs: {
            'rect': { fill: 'white', stroke: 'black', 'follow-scale': true, width: 80, height: 40 },
            'text': { 'font-size': 14, 'ref-x': .5, 'ref-y': .5, ref: 'rect', 'y-alignment': 'middle', 'x-alignment': 'middle','white-space': 'normal','word-wrap': 'break-word'},
			devicename: {
				text:''
			},
			grp: {
				text:''
			},
			icon:{
				text:''
			},
			itemdisplaylabel: {
				text:''
			},
			itemtype:{
				text:'number'
			},
			channelvalue: {
				text:''
			},
			channeltype: {
				text:''
			},
			channelbinding: {
				text:''
			},
			devmanufacturer: {
				text:''
			},
			devicemodel: {
				text:''
			}			
		}
    }, joint.shapes.basic.Generic.prototype.defaults)
});

joint.shapes.iot.CommChannelDeviceBlock = joint.shapes.basic.Generic.extend({

    markup: '<g class="rotatable"><g class="scalable"><rect class="mainrect"></rect><line vector-effect="non-scaling-stroke"/></g><g><text class="label commlabel"></text></g><g class="devlabelcontainer"><text class="label devicelabel"/></g></g>',
    
    defaults: joint.util.deepSupplement({
    
        type: 'iot.CommChannelDeviceBlock',
        attrs: {
			'line': {x:0,y:0,x1:"0" ,y1:"10", x2:"80", y2:"10"},
            'rect': { fill: 'white', stroke: 'black', 'follow-scale': true, width: 80, height: 40 },
            '.devlabelcontainer text': { x:0, y: -15, 'text-anchor': 'start' },
        	'.commlabel': { 'font-size': 14, 'ref-x': 0.5, 'ref-y': 0.15, ref: 'rect', 'y-alignment': 'middle', 'x-alignment': 'middle','white-space': 'normal','word-wrap': 'break-word'},
			'.devicelabel': { 'font-size': 14,'white-space': 'normal','word-wrap': 'break-word'},
			subgrp: {
				text:''
			},
			grp: {
				text:''
			},
			devicename: {
				text:''
			},
			icon:{
				text:''
			},
			itemdisplaylabel: {
				text:''
			},
			itemtype:{
				text:'number'
			},
			devicelocation: {
				text:''
			},
			devmanufacturer: {
				text:''
			},
			devicemodel: {
				text:''
			},
			channelnum: {
				text:''
			}	
		}
					
    }, joint.shapes.basic.Generic.prototype.defaults)
});

joint.shapes.iot.CommChannelCCDeviceBlock = joint.shapes.basic.Generic.extend({

    markup: '<g class="rotatable"><g class="scalable"><rect class="mainrect"></rect><line/></g><text class="label commlabel"/><g class="devlabelcontainer"><text class="label devicelabel"/></g></g>',
    
    defaults: joint.util.deepSupplement({
    
        type: 'iot.CommChannelCCDeviceBlock',
        attrs: {
			'line': {x1:"0" ,y1:"10", x2:"80", y2:"10"},
            'rect': { fill: 'white', stroke: 'black', 'follow-scale': true, width: 80, height: 40 },
            '.devlabelcontainer text': { x:0, y: -15, 'text-anchor': 'start' },
			'.commlabel': { 'font-size': 14, 'ref-x': 0.5, 'ref-y': 0.15, ref: 'rect', 'y-alignment': 'middle', 'x-alignment': 'middle','white-space': 'normal','word-wrap': 'break-word'},
            '.devicelabel': { 'font-size': 14,'white-space': 'normal','word-wrap': 'break-word'},
			subgrp: {
				text:''
			},
			grp: {
				text:''
			},
			devicename: {
				text:''
			},
			icon:{
				text:''
			},
			itemdisplaylabel: {
				text:''
			},
			itemtype:{
				text:'number'
			},
			devicelocation: {
				text:''
			},
			devmanufacturer: {
				text:''
			},
			devicemodel: {
				text:''
			},
			channelnum: {
				text:''
			}	
        }
    }, joint.shapes.basic.Generic.prototype.defaults)
});

joint.shapes.iot.WebServiceBlock = joint.shapes.basic.Generic.extend({

    markup: '<g class="rotatable"><g class="scalable"><circle/></g><text class="label"/></g>',
    
    defaults: joint.util.deepSupplement({
    
        type: 'iot.WebServiceBlock',
        attrs: {
            'circle': {  cx:"50", cy:"50", r:"40", stroke:"black",fill:"red" },
            '.label': { 'font-size': 14, 'ref-x': .5, 'ref-y': .5, ref: 'circle', 'y-alignment': 'middle', 'x-alignment': 'middle','white-space': 'normal','word-wrap': 'break-word'},
        	icon:{
				text:''
			},
			grp: {
				text:''
			},
			itemdisplaylabel: {
				text:''
			},
			channelbinding: {
				text:''
			},
			itemtype:{
				text:'number'
			}
		}
    }, joint.shapes.basic.Generic.prototype.defaults)
});

joint.shapes.iot.Annotation = joint.shapes.basic.Generic.extend({

    markup: '<g class="rotatable"><text class="labelAnnotation"/></g>',
    
    defaults: joint.util.deepSupplement({
    
        type: 'iot.Annotation',
        attrs: {
			'.labelAnnotation': { 'font-size': 17,'x':0,'y':0,'white-space': 'normal','word-wrap': 'break-word'},
		}
    }, joint.shapes.basic.Generic.prototype.defaults)
});

joint.shapes.iot.Link = joint.dia.Link.extend({

    defaults: {
        type: 'iot.Link',
        attrs: { '.connection' : { 'stroke-width' :  2 }}
    }
});

joint.shapes.iot.LibDevice = joint.shapes.iot.Model.extend({
    defaults: joint.util.deepSupplement({
        type: 'iot.LibDevice',
        size: {
            width: 8,
            height: 5
        },
        attrs: {
            type: 'iot.LibDevice',
            rect: {
                fill: "white",
                rx: 2,
                ry: 2
            },
            ".label": {
                text: "Lib Device",
                fill: "white",
                "font-size": 10,
                stroke: "black",
                "stroke-width": 0
		    },
            ".inPorts circle": {
                fill: "white",
                opacity: .9
            },
            ".outPorts circle": {
                fill: "white",
                opacity: .9
            },
            ".inPorts text, .outPorts text": {
                "font-size": 9
            }
        }
    }, joint.shapes.iot.Model.prototype.defaults)
});


joint.shapes.iot.ModelView = joint.dia.ElementView.extend(joint.shapes.basic.PortsViewInterface);
joint.shapes.iot.DeviceView = joint.shapes.iot.ModelView;
joint.shapes.iot.RuleView = joint.shapes.iot.ModelView;
joint.shapes.iot.SystemView = joint.shapes.iot.ModelView;
joint.shapes.iot.SubSystemView = joint.shapes.iot.ModelView;
joint.shapes.iot.DeviceChannelBlockView = joint.shapes.iot.ModelView;
joint.shapes.iot.WebServiceBlockView = joint.shapes.iot.ModelView;
joint.shapes.iot.AnnotationView = joint.shapes.iot.ModelView;
joint.shapes.iot.CommChannelDeviceBlockView = joint.shapes.iot.ModelView;
joint.shapes.iot.CommChannelCCDeviceBlockView = joint.shapes.iot.ModelView;

if (typeof exports === 'object') {

    module.exports = joint.shapes.iot;
}
