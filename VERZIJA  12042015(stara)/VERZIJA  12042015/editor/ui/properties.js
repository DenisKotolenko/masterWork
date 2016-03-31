var genericicons = ["","<office>", "<bath>","<boy>","<chart>","<bedroom>","<calendar>","<cellar>","<cistern>","<climate>","<clock>","<corridor>"];
var generictypes = ["number","group","switch","color","string","contact","datetime","dimmer","rollershutter"];


var InspectorDefs = {
    link: {
        inputs: {
            attrs: {
                ".connection": {
                    "stroke-width": {
                        type: "range",
                        min: 0,
                        max: 50,
                        defaultValue: 1,
                        unit: "px",
                        group: "connection",
                        label: "stroke width",
                    index: 1
                    },
                    stroke: {
                        type: "color",
                        group: "connection",
                        label: "stroke color",
                        index: 2
                    },
                    "stroke-dasharray": {
                        type: "select",
                        options: ["0", "1", "5,5", "5,10", "10,5", "5,1", "15,10,5,10,15"],
                        group: "connection",
                        label: "stroke dasharray",
                        index: 3
                    }
                },
                ".marker-source": {
                    transform: {
                        type: "range",
                        min: 1,
                        max: 15,
                        unit: "x scale",
                        defaultValue: "scale(1)",
                        valueRegExp: "(scale\\()(.*)(\\))",
                        group: "marker-source",
                        label: "source arrowhead size",
                        index: 1
                    },
                    fill: {
                        type: "color",
                        group: "marker-source",
                        label: "soure arrowhead color",
                        index: 2
                    }
                },
                ".marker-target": {
                    transform: {
                        type: "range",
                        min: 1,
                        max: 15,
                        unit: "x scale",
                        defaultValue: "scale(1)",
                        valueRegExp: "(scale\\()(.*)(\\))",
                        group: "marker-target",
                        label: "target arrowhead size",
                        index: 1
                    },
                    fill: {
                        type: "color",
                        group: "marker-target",
                        label: "target arrowhead color",
                        index: 2
                    }
                }
            },
            smooth: {
                type: "toggle",
                group: "connection",
                index: 4
            },
            manhattan: {
                type: "toggle",
                group: "connection",
                index: 5
            },
            labels: {
                type: "list",
                group: "labels",
                attrs: {
                    label: {
                        "data-tooltip": "Set (possibly multiple) labels for the link"
                    }
                },
                item: {
                    type: "object",
                    properties: {
                        position: {
                            type: "range",
                            min: .1,
                            max: .9,
                            step: .1,
                            defaultValue: .5,
                            label: "position",
                            index: 2,
                            attrs: {
                                label: {
                                    "data-tooltip": "Position the label relative to the source of the link"
                                }
                            }
                        },
                        attrs: {
                            text: {
                                text: {
                                    type: "text",
                                    label: "text",
                                    defaultValue: "label",
                                    index: 1,
                                    attrs: {
                                        label: {
                                            "data-tooltip": "Set text of the label"
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        groups: {
            labels: {
                label: "Labels",
                index: 1
            },
            connection: {
                label: "Connection",
                index: 2
            },
            "marker-source": {
                label: "Source marker",
                index: 3
            },
            "marker-target": {
                label: "Target marker",
                index: 4
            }
        }
    },
    "devs.Atomic": {
        inputs: _.extend({
            attrs: {
                ".label": inp({
                    text: {
                        group: "text",
                        index: 1
                    },
                    "font-size": {
                        group: "text",
                        index: 2
                    },
                    "font-family": {
                        group: "text",
                        index: 3
                    },
                    "font-weight": {
                        group: "text",
                        index: 4
                    },
                    fill: {
                        group: "text",
                        index: 5
                    },
                    stroke: {
                        group: "text",
                        index: 6
                    },
                    "stroke-width": {
                        group: "text",
                        index: 7
                    },
                    "ref-x": {
                        group: "text",
                        index: 8
                    },
                    "ref-y": {
                        group: "text",
                        index: 9
                    }
                }),
                rect: inp({
                    fill: {
                        group: "presentation",
                        index: 1
                    },
                    "stroke-width": {
                        min: 0,
                        max: 30,
                        defaultValue: 1,
                        unit: "px",
                        group: "presentation",
                        index: 2
                    },
                    "stroke-dasharray": {
                        group: "presentation",
                        index: 3
                    },
                    rx: {
                        group: "presentation",
                        index: 4
                    },
                    ry: {
                        group: "presentation",
                        index: 5
                    }
                }),
                ".inPorts circle": inp({
                    fill: {
                        group: "presentation",
                        index: 6,
                        label: "Input ports fill color"
                    }
                }),
                ".outPorts circle": inp({
                    fill: {
                        group: "presentation",
                        index: 7,
                        label: "Output ports fill color"
                    }
                })
            },
            inPorts: {
                type: "list",
                item: {
                    type: "text"
                },
                group: "data",
                index: -2
            },
            outPorts: {
                type: "list",
                item: {
                    type: "text"
                },
                group: "data",
                index: -1
            }
        }, CommonInspectorInputs),
        groups: CommonInspectorGroups
    },
    "iot.Rule": {
        inputs: _.extend({
            attrs: {
                ".label": inp({
                    text: {
                        group: "text",
                        index: 1
                    },
                    "font-size": {
                        group: "text",
                        index: 2
                    },
                    "font-family": {
                        group: "text",
                        index: 3
                    },
                    "font-weight": {
                        group: "text",
                        index: 4
                    },
                    fill: {
                        group: "text",
                        index: 5
                    },
                    stroke: {
                        group: "text",
                        index: 6
                    },
                    "stroke-width": {
                        group: "text",
                        index: 7
                    },
                    "ref-x": {
                        group: "text",
                        index: 8
                    },
                    "ref-y": {
                        group: "text",
                        index: 9
                    }
                }),
                rect: inp({
                    fill: {
                        group: "presentation",
                        index: 1
                    },
                    "stroke-width": {
                        min: 0,
                        max: 30,
                        defaultValue: 1,
                        unit: "px",
                        group: "presentation",
                        index: 2
                    },
                    "stroke-dasharray": {
                        group: "presentation",
                        index: 3
                    },
                    rx: {
                        group: "presentation",
                        index: 4
                    },
                    ry: {
                        group: "presentation",
                        index: 5
                    }
                }),
                ".inPorts circle": inp({
                    fill: {
                        group: "presentation",
                        index: 6,
                        label: "Input ports fill color"
                    }
                }),
                ".outPorts circle": inp({
                    fill: {
                        group: "presentation",
                        index: 7,
                        label: "Output ports fill color"
                    }
                })
            },
            inPorts: {
                type: "list",
                item: {
                    type: "text"
                },
                group: "data",
                index: -2
            },
            outPorts: {
                type: "list",
                item: {
                    type: "text"
                },
                group: "data",
                index: -1
            }
        }, CommonInspectorInputs),
        groups: CommonInspectorGroups
    },
    "iot.System": {
        inputs: _.extend({
            attrs: {
                ".label": inp({
                    text: {
						label: "LABEL",
                        group: "configdata",
                        index: 1
                    },
		        }),
				grp: inp({
					text: {
						label: "Group",
                        group: "configdata",
                        index: 1
                    }
		        })
            },
        }),
        groups: CommonInspectorGroups
    },
	"iot.SubSystem": {
        inputs: _.extend({
            attrs: {
                ".label": inp({
                    text: {
						label: "LABEL",
                        group: "configdata",
                        index: 1
                    },
		        }),
				grp: inp({
					text: {
						label: "Group",
                        group: "configdata",
                        index: 1
                    }
		        }),
				icon: inp({
					text: {
						label: "Icon",
                        group: "configdata",
                        index: 1,
						type: "select",
						options: genericicons
                    }
		        })
			},
        }),
        groups: CommonInspectorGroups
    },
	"iot.DeviceChannelBlock": {
        inputs: _.extend({
            attrs: {
               grp: inp({
					text: {
						label: "Device group",
                        group: "configdata",
                        index: 1
                    }
		        }),
				devicename: inp({
                    text: {
						label: "Device name",
                        group: "configdata",
                        index: 1
                    },
		        }),
				".label": inp({
                    text: {
						label: "Channel tag",
                        group: "configdata",
                        index: 1
                    },
		        }),
				icon: inp({
					text: {
						label: "Item icon display",
                        group: "configdata",
                        index: 1,
						type: "select",
						options: genericicons
                    }
		        }),
				itemdisplaylabel: inp({
                    text: {
						label: "Channel display label",
                        group: "configdata",
                        index: 1
                    },
		        }),
				itemtype: inp({
                	text: {
						label: "Item type",
                        group: "configdata",
                        index: 1,
						type: "select",
						options: generictypes
                    }
		        }),
				channelvalue: inp({
                    text: {
						label: "Channel value",
                        group: "metadata",
                        index: 1
                    },
		        }),
				channeltype: inp({
                    text: {
						label: "Channel type",
                        group: "metadata",
                        index: 1
                    },
		        }),
				channelbinding: inp({
                    text: {
						label: "Channel binding",
                        group: "metadata",
                        index: 1
                    },
		        }),
				devmanufacturer: inp({
                    text: {
						label: "Dev. manufacturer",
                        group: "metadata",
                        index: 1
                    },
		        }),
				devicemodel: inp({
                    text: {
						label: "Device model",
                        group: "metadata",
                        index: 1
                    },
		        })
			},
        }),
        groups: CommonInspectorGroups
    },
	"iot.CommChannelDeviceBlock": {
        inputs: _.extend({
            attrs: {
               subgrp: inp({
					text: {
						label: "Subsystem group",
                        group: "configdata",
                        index: 1
                    }
		        }),
			    grp: inp({
					text: {
						label: "Device group",
                        group: "configdata",
                        index: 1
                    }
		        }),
				devicename: inp({
                    text: {
						label: "Device name",
                        group: "configdata",
                        index: 1
                    },
		        }),
				".devicelabel": inp({
                    text: {
						label: "Device label",
                        group: "configdata",
                        index: 1
                    },
		        }),
				".commlabel": inp({
                    text: {
						label: "Device commun",
                        group: "configdata",
                        index: 1
                    },
		        }),
				icon: inp({
					text: {
						label: "Device icon display",
                        group: "configdata",
                        index: 1,
						type: "select",
						options: genericicons
                    }
		        }),
				devicelocation: inp({
                    text: {
						label: "Device location",
                        group: "metadata",
                        index: 1
                    },
		        }),
				devmanufacturer: inp({
                    text: {
						label: "Dev. manufacturer",
                        group: "metadata",
                        index: 1
                    },
		        }),
				devicemodel: inp({
                    text: {
						label: "Device model",
                        group: "metadata",
                        index: 1
                    },
		        }),
				channelnum: inp({
                    text: {
						label: "Number of channels",
                        group: "metadata",
                        index: 1
                    },
		        })
			},
        }),
        groups: CommonInspectorGroups
    },
	"iot.CommChannelCCDeviceBlock": {
        inputs: _.extend({
            attrs: {
               subgrp: inp({
					text: {
						label: "Subsystem group",
                        group: "configdata",
                        index: 1
                    }
		        }),
			   grp: inp({
					text: {
						label: "Device group",
                        group: "configdata",
                        index: 1
                    }
		        }),
				devicename: inp({
                    text: {
						label: "Device name",
                        group: "configdata",
                        index: 1
                    },
		        }),
				".devicelabel": inp({
                    text: {
						label: "Device label",
                        group: "configdata",
                        index: 1
                    },
		        }),
				".commlabel": inp({
                    text: {
						label: "Device commun",
                        group: "configdata",
                        index: 1
                    },
		        }),
				icon: inp({
					text: {
						label: "Device icon display",
                        group: "configdata",
                        index: 1,
						type: "select",
						options: genericicons
                    }
		        }),
				devicelocation: inp({
                    text: {
						label: "Device location",
                        group: "metadata",
                        index: 1
                    },
		        }),
				devmanufacturer: inp({
                    text: {
						label: "Dev. manufacturer",
                        group: "metadata",
                        index: 1
                    },
		        }),
				devicemodel: inp({
                    text: {
						label: "Device model",
                        group: "metadata",
                        index: 1
                    },
		        }),
				channelnum: inp({
                    text: {
						label: "Number of channels",
                        group: "metadata",
                        index: 1
                    },
		        })
			},
        }),
        groups: CommonInspectorGroups
    },
	"iot.WebServiceBlock": {
        inputs: _.extend({
            attrs: {
               grp: inp({
					text: {
						label: "Device group",
                        group: "configdata",
                        index: 1
                    }
		        }),
				'.label': inp({
                    text: {
						label: "Channel tag",
                        group: "configdata",
                        index: 1
                    },
		        }),
				itemtype: inp({
                	text: {
						label: "Item type",
                        group: "configdata",
                        index: 1,
						type: "select",
						options: generictypes
                    }
		        }),
				itemdisplaylabel: inp({
                    text: {
						label: "Item display label",
                        group: "configdata",
                        index: 1
                    },
		        }),
				channelbinding: inp({
                    text: {
						label: "Channel binding",
                        group: "configdata",
                        index: 1
                    },
		        }),
				icon: inp({
					text: {
						label: "Item icon display",
                        group: "configdata",
                        index: 1,
						type: "select",
						options: genericicons
                    }
		        })
			},
        }),
        groups: CommonInspectorGroups
    },
	"iot.Annotation": {
        inputs: _.extend({
            attrs: {
               '.labelAnnotation': inp({
                    text: {
						label: "Annotation",
                        group: "configdata",
                        index: 1
                    },
		        })
			},
        }),
        groups: CommonInspectorGroups
    },
    "uml.Input": {
        inputs: _.extend({
            attrs: {
                ".uml-class-name-rect": inp({

                }),
                ".uml-class-attrs-rect": inp({

                }),
                ".uml-class-methods-rect": inp({

                })
            },
            name: {
                type: "text",
                group: "name",
                index: 0,
                label: "Input name"
            },
            attributes: {
                type: "list",
                item: {
                    type: "text"
                },
                group: "attributes",
                index: 0,
                label: "Attributes"
            },
            methods: {
                type: "list",
                item: {
                    type: "text"
                },
                group: "methods",
                index: 0,
                label: "Methods"
            }
        }, CommonInspectorInputs),
        groups: {
            name: {
                label: "Input properties",
                index: 1
            },
            openhab: {
                label: "URI",
                index: 2
            },
            attributes: {
                label: "Attributes",
                index: 3
            },
            methods: {
                label: "Methods",
                index: 4
            },
            geometry: {
                label: "Geometry",
                index: 5
            }
        }
    },"uml.Abstract": {
        inputs: _.extend({
            attrs: {
                ".uml-class-name-rect": inp({

                }),
                ".uml-class-attrs-rect": inp({

                }),
                ".uml-class-methods-rect": inp({

                })
            },
            name: {
                type: "text",
                group: "name",
                index: 0,
                label: "Input name"
            },
            attributes: {
                type: "list",
                item: {
                    type: "text"
                },
                group: "attributes",
                index: 0,
                label: "Attributes"
            },
            methods: {
                type: "list",
                item: {
                    type: "text"
                },
                group: "methods",
                index: 0,
                label: "Methods"
            }
        }, CommonInspectorInputs),
        groups: {
            name: {
                label: "Input properties",
                index: 1
            },
            openhab: {
                label: "OpenHab",
                index: 2
            },
            attributes: {
                label: "Attributes",
                index: 3
            },
            methods: {
                label: "Methods",
                index: 4
            },
            geometry: {
                label: "Geometry",
                index: 5
            }
        }
    }
    ,"uml.Abstract2": {
        inputs: _.extend({
            attrs: {
                ".uml-class-name-rect": inp({

                }),
                ".uml-class-attrs-rect": inp({

                }),
                ".uml-class-methods-rect": inp({

                })
            },
            name: {
                type: "text",
                group: "name",
                index: 0,
                label: "Input name"
            },
            attributes: {
                type: "list",
                item: {
                    type: "text"
                },
                group: "attributes",
                index: 0,
                label: "Attributes"
            },
            methods: {
                type: "list",
                item: {
                    type: "text"
                },
                group: "methods",
                index: 0,
                label: "Methods"
            }
        }, CommonInspectorInputs),
        groups: {
            name: {
                label: "Input properties",
                index: 1
            },
            openhab: {
                label: "OpenHab",
                index: 2
            },
            attributes: {
                label: "Attributes",
                index: 3
            },
            methods: {
                label: "Methods",
                index: 4
            },
            geometry: {
                label: "Geometry",
                index: 5
            }
        }
    },
    "uml.Output": {
        inputs: _.extend({
            attrs: {
                ".uml-class-name-rect": inp({

                }),
                ".uml-class-attrs-rect": inp({

                }),
                ".uml-class-methods-rect": inp({

                })
            },
            name: {
                type: "text",
                group: "name",
                index: 0,
                label: "Input name"
            },
            attributes: {
                type: "list",
                item: {
                    type: "text"
                },
                group: "attributes",
                index: 0,
                label: "Attributes"
            },
            methods: {
                type: "list",
                item: {
                    type: "text"
                },
                group: "methods",
                index: 0,
                label: "Methods"
            }
        }, CommonInspectorInputs),
        groups: {
            name: {
                label: "Input properties",
                index: 1
            },
            openhab: {
                label: "OpenHab",
                index: 2
            },
            attributes: {
                label: "Attributes",
                index: 3
            },
            methods: {
                label: "Methods",
                index: 4
            },
            geometry: {
                label: "Geometry",
                index: 5
            }
        }
    },
    "ciot.Input": {
        inputs: _.extend({
            attrs: {
                ".uml-class-name-rect": inp({

                }),
                ".uml-class-attrs-rect": inp({

                }),
                ".uml-class-methods-rect": inp({

                })
            },
            name: {
                type: "text",
                group: "name",
                index: 0,
                label: "Input name"
            },
            attributes: {
                type: "list",
                item: {
                    type: "text"
                },
                group: "attributes",
                index: 0,
                label: "Attributes"
            },
            methods: {
                type: "list",
                item: {
                    type: "text"
                },
                group: "methods",
                index: 0,
                label: "Methods"
            }
        }, CommonInspectorInputs),
        groups: {
            name: {
                label: "Input properties",
                index: 1
            },
            openhab: {
                label: "OpenHab",
                index: 2
            },
            attributes: {
                label: "Attributes",
                index: 3
            },
            methods: {
                label: "Methods",
                index: 4
            },
            geometry: {
                label: "Geometry",
                index: 5
            }
        }
    },
    "ciot.Output": {
        inputs: _.extend({
            attrs: {
                ".uml-class-name-rect": inp({

                }),
                ".uml-class-attrs-rect": inp({

                }),
                ".uml-class-methods-rect": inp({

                })
            },
            name: {
                type: "text",
                group: "name",
                index: 0,
                label: "Input name"
            },
            attributes: {
                type: "list",
                item: {
                    type: "text"
                },
                group: "attributes",
                index: 0,
                label: "Attributes"
            },
            methods: {
                type: "list",
                item: {
                    type: "text"
                },
                group: "methods",
                index: 0,
                label: "Methods"
            }
        }, CommonInspectorInputs),
        groups: {
            name: {
                label: "Input properties",
                index: 1
            },
            openhab: {
                label: "OpenHab",
                index: 2
            },
            attributes: {
                label: "Attributes",
                index: 3
            },
            methods: {
                label: "Methods",
                index: 4
            },
            geometry: {
                label: "Geometry",
                index: 5
            }
        }
    }
};
