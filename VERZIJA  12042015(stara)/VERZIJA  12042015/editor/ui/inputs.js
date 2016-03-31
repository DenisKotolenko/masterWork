var CommonInspectorInputs = {
    size: {
        width: {
            type: "number",
            min: 1,
            max: 500,
            group: "geometry",
            label: "width",
            index: 1
        },
        height: {
            type: "number",
            min: 1,
            max: 500,
            group: "geometry",
            label: "height",
            index: 2
        }
    },
    position: {
        x: {
            type: "number",
            min: 1,
            max: 2e3,
            group: "geometry",
            label: "x",
            index: 3
        },
        y: {
            type: "number",
            min: 1,
            max: 2e3,
            group: "geometry",
            label: "y",
            index: 4
        }
    },
    ohURI: {
        type: "textarea",
        group: "openhab",
        index: 1,
        label: "OpenHab Binding URI",
        attrs: {
            label: {
                "data-tooltip": "Set the openHab item URI."
            }
        }
    },
    ohItemName: {
        type: "text",
        group: "openhab",
        index: 1,
        label: "Itemname",
        attrs: {
            label: {
                "data-tooltip": "Set the item name."
            }
        }
    },
    ohLabelText: {
        type: "textarea",
        group: "openhab",
        index: 1,
        label: "Label text",
        attrs: {
            label: {
                "data-tooltip": "Set the item name."
            }
        }
    },
    ohItemType: {
        type: "select",
        options: ["Color", "Contact", "DateTime", "Dimmer", "Group", "Number", "Rollershutter", "String", "Switch"],
        group: "openhab",
        index: 1,
        label: "Item type",
        attrs: {
            label: {
                "data-tooltip": "Set the item name."
            }
        }
    },
    ohIconName: {
        type: "text",
        group: "openhab",
        index: 1,
        label: "Icon name",
        attrs: {
            label: {
                "data-tooltip": "Set the item name."
            }
        }
    },
    ohGroups: {
        type: "text",
        group: "openhab",
        index: 1,
        label: "Groups",
        attrs: {
            label: {
                "data-tooltip": "Set the item name."
            }
        }
    }
};
var CommonInspectorGroups = {
    text: {
        label: "Text",
        index: 1
    },
    presentation: {
        label: "Presentation",
        index: 2
    },
    geometry: {
        label: "Geometry",
        index: 3
    },
    data: {
        label: "Data",
        index: 4
    },
	configdata: {
	    label: "Config Data",
        index: 5
	},
	metadata: {
	    label: "Meta Data",
        index: 6
	}
};
var CommonInspectorTextInputs = {
    text: {
        type: "textarea",
        group: "text",
        index: 1
    },
    "font-size": {
        type: "range",
        min: 5,
        max: 80,
        unit: "px",
        group: "text",
        index: 2
    },
    "font-family": {
        type: "select",
        options: ["Arial", "Helvetica", "Times New Roman", "Courier New", "Georgia", "Garamond", "Tahoma", "Lucida Console", "Comic Sans MS"],
        group: "text",
        index: 3
    },
    "font-weight": {
        type: "range",
        min: 100,
        max: 900,
        step: 100,
        defaultValue: 400,
        group: "text",
        index: 4
    },
    fill: {
        type: "color",
        group: "text",
        defaultValue:"#ffffff",
        index: 5
    },
    stroke: {
        type: "color",
        group: "text",
        index: 6,
        defaultValue: "#000000"
    },
    "stroke-width": {
        type: "range",
        min: 0,
        max: 5,
        step: .5,
        defaultValue: 0,
        unit: "px",
        group: "text",
        index: 7
    },
    "ref-x": {
        type: "range",
        min: 0,
        max: .9,
        step: .1,
        defaultValue: .5,
        group: "text",
        index: 8
    },
    "ref-y": {
        type: "range",
        min: 0,
        max: .9,
        step: .1,
        defaultValue: .5,
        group: "text",
        index: 9
    }
};
var InputDefs = {
    text: {
        type: "textarea",
        label: "Text"
    },
    "font-size": {
        type: "range",
        min: 5,
        max: 80,
        unit: "px",
        label: "Font size"
    },
    "font-family": {
        type: "select",
        options: ["Arial", "Helvetica", "Times New Roman", "Courier New", "Georgia", "Garamond", "Tahoma", "Lucida Console", "Comic Sans MS"],
        label: "Font family"
    },
    "font-weight": {
        type: "range",
        min: 100,
        max: 900,
        step: 100,
        defaultValue: 400,
        label: "Font weight"
    },
    fill: {
        type: "color",
        label: "Fill color",
        defaultValue: "#ffffff"
    },
    stroke: {
        type: "color",
        defaultValue: "#000000",
        label: "Stroke"
    },
    "stroke-width": {
        type: "range",
        min: 0,
        max: 5,
        step: .5,
        defaultValue: 0,
        unit: "px",
        label: "Stroke width"
    },
    "ref-x": {
        type: "range",
        min: 0,
        max: .9,
        step: .1,
        defaultValue: .1,
        label: "Horizontal alignment"
    },
    "ref-y": {
        type: "range",
        min: 0,
        max: .9,
        step: .1,
        defaultValue: .1,
        label: "Vertical alignment"
    },
    "ref-dx": {
        type: "range",
        min: 0,
        max: 50,
        step: 1,
        defaultValue: 0,
        label: "Horizontal offset"
    },
    "ref-dy": {
        type: "range",
        min: 0,
        max: 50,
        step: 1,
        defaultValue: 0,
        label: "Vertical offset"
    },
    dx: {
        type: "range",
        min: 0,
        max: 50,
        step: 1,
        defaultValue: 0,
        label: "Horizontal distance"
    },
    dy: {
        type: "range",
        min: 0,
        max: 50,
        step: 1,
        defaultValue: 0,
        label: "Vertical distance"
    },
    "stroke-dasharray": {
        type: "select",
        options: ["0", "1", "5,5", "5,10", "10,5", "3,5", "5,1", "15,10,5,10,15"],
        label: "Stroke dasharray"
    },
    rx: {
        type: "range",
        min: 0,
        max: 30,
        defaultValue: 1,
        unit: "px",
        label: "X-axis radius"
    },
    ry: {
        type: "range",
        min: 0,
        max: 30,
        defaultValue: 1,
        unit: "px",
        label: "Y-axis radius"
    },
    "xlink:href": {
        type: "text",
        label: "Image URL"
    }
};

function inp(defs) {
    var ret = {};
    _.each(defs, function (def, attr) {
        ret[attr] = _.extend({}, InputDefs[attr], def)
    });
    return ret
}

