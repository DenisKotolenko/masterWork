var Stencil = {};
Stencil.groups = {
    device: {
        index: 1,
        label: "IOT GEN. BLOCKS"
    },
    libdevices: {
        index: 2,
        label: "LIBRARY DEVICES"
    }
};
Stencil.shapes = {

    device: [
        new joint.shapes.iot.System({
            size: {
                width: 4,
                height: 3
            },
			inPorts: ["in1", "in2"],
            outPorts: ["out"],
            attrs: {
                rect: {
                    fill: "#FCFCFC",
                    rx: 0,
                    ry: 0
                },
                ".label": {
				    'font-size': 14, 
					'x': 0,
					'y': 0,
					'white-space': 'normal',
					'word-wrap': 'break-word',
                    text: "SYSTEM",
                    fill: "#ffffff",
                    stroke: "#000000",
                    "stroke-width": 0
                },
                ".inPorts circle": {
                    fill: "#f1c40f",
                    opacity: .9
                },
                ".outPorts circle": {
                    fill: "#f1c40f",
                    opacity: .9
                },
                ".inPorts text, .outPorts text": {
                    "font-size": 9
                }
            }
        }),
		new joint.shapes.iot.SubSystem({
            size: {
                width: 4,
                height: 3
            },
			inPorts: ["in1", "in2"],
            outPorts: ["out"],
            attrs: {
                rect: {
                    fill: "#FCFCFC",
                    rx: 2,
                    ry: 2
                },
                ".label": {
				    'font-size': 14, 
					'x': 0,
					'y': 0,
					'white-space': 'normal',
					'word-wrap': 'break-word',
                    text: "SUBSYSTEM",
                    fill: "#ffffff",
                    stroke: "#000000",
                    "stroke-width": 0
                },
                ".inPorts circle": {
                    fill: "#f1c40f",
                    opacity: .9
                },
                ".outPorts circle": {
                    fill: "#f1c40f",
                    opacity: .9
                },
                ".inPorts text, .outPorts text": {
                    "font-size": 9
                }
            }
        }),
		new joint.shapes.iot.DeviceChannelBlock({
            size: {
                width: 4,
                height: 3
            },
			attrs: {
                rect: {
                    fill: "#FCFCFC",
                    rx: 2,
                    ry: 2
                },
                ".label": {
                    text: "DEVICE CHANNEL",
					fill: "#000000",
					"ref-width": 0.5,
                    "font-size": 10,
                    stroke: "#000000",
                    "stroke-width": 0
                }
            }
        }),
		new joint.shapes.iot.CommChannelDeviceBlock({
            size: {
                width: 4,
                height: 3
            },
			attrs: {
			rect: { fill: "#FCFCFC",
                    rx: 0,
                    ry: 0 },
            'line': {'stroke':'#000000','stroke-width':'1'},
			'.label': { 
					'x': 0,
					'y': -4,
					fill: "#000000",
                    "font-size": 10,
                    stroke: "#000000",
                    "stroke-width": 0
			},
			'.commlabel': { 
					'x': 0,
					'ref-y': 24,
					text: "COMM CHANNEL",
        	},
			'.devicelabel': { 
					text: "DEVICE",
					fill: "#000000",
                    "font-size": 10,
                    stroke: "#000000",
                    "stroke-width": 0
         	}
			
   
            }
        }),
		new joint.shapes.iot.CommChannelCCDeviceBlock({
            size: {
                width: 4,
                height: 3
            },
			attrs: {
			rect: { fill: "#FCFCFC",
                    rx: 10,
                    ry: 10 },
            'line': {'stroke':'#000000','stroke-width':'1'},
			'.label': { 
				'x': 0,
					'y': -4,
					fill: "#000000",
                    "font-size": 10,
                    stroke: "#000000",
                    "stroke-width": 0
			},
			'.commlabel': { 
					'x': 0,
					'ref-y': 24,
					text: "COMM CHANNEL",
        	},
			'.devicelabel': { 
					fill: "#000000",
                    "font-size": 10,
                    stroke: "#000000",
                    "stroke-width": 0,
					text: "C.C. DEVICE"
         	}
			
   
            }
        }),
		new joint.shapes.iot.WebServiceBlock({
            size: {
                width: 4,
                height: 3
            },
			attrs: {
                circle: {
                    cx:"40", cy:"40", r:"40", stroke:"#000000", fill:"#ffffff"
                },
                ".label": {
                    text: "WEB SERVICE",
                    fill: "#000000",
                    "font-size": 10,
                    stroke: "#000000",
                    "stroke-width": 0
                }
            }
        })

    ],
    libdevices: [ new joint.shapes.iot.LibDevice({
            size: {
                width: 4,
                height: 3
            },
			inPorts: ["in1", "in2"],
            outPorts: ["out"],
            attrs: {
                rect: {
                    fill: "#FCFCFC",
                    rx: 0,
                    ry: 0
                },
                ".label": {
				    'font-size': 14, 
					'x': 0,
					'y': 0,
					'white-space': 'normal',
					'word-wrap': 'break-word',
                    text: "Library device",
                    fill: "#ffffff",
                    stroke: "#000000",
                    "stroke-width": 0
                },
                ".inPorts circle": {
                    fill: "#f1c40f",
                    opacity: .9
                },
                ".outPorts circle": {
                    fill: "#f1c40f",
                    opacity: .9
                },
                ".inPorts text, .outPorts text": {
                    "font-size": 9
                }
            },
			
        })]
};
