/*! Rappid v1.7.1 - HTML5 Diagramming Framework

Copyright (c) 2015 client IO

 2016-03-03 


This Source Code Form is subject to the terms of the Rappid Academic License
, v. 1.0. If a copy of the Rappid License was not distributed with this
file, You can obtain one at http://jointjs.com/license/rappid_academic_v1.txt
 or from the Rappid archive as was distributed by client IO. See the LICENSE file.*/


var Stencil = {};

Stencil.groups = {
    basic: { index: 1, label: 'Basic shapes' },
    library: { index: 2, label: 'Library' },
    openLibraryFile: { index: 3, label: 'Open library file' },
    navigation: { index: 4, label: 'Navigation' },

};

Stencil.shapes = {

    basic: [
        new joint.shapes.basic.Rect({
            size: { width: 5, height: 3 },
            attrs: {
                rect: {
                    rx: 2, ry: 2, width: 50, height: 30,
                    fill: '#27AE60'
                },
                text: { text: 'rect', fill: '#ffffff', 'font-size': 10, stroke: '#000000', 'stroke-width': 0 }
            }
        }),
        new joint.shapes.basic.Circle({
            size: { width: 5, height: 3 },
            attrs: {
                circle: { width: 50, height: 30, fill: '#E74C3C' },
                text: { text: 'ellipse', fill: '#ffffff', 'font-size': 10, stroke: '#000000', 'stroke-width': 0 }
            }
        }),
        new joint.shapes.devs.Atomic({
            size: { width: 4, height: 3 },
            inPorts: ['in1','in2'],
            outPorts: ['out'],
            attrs: {
	        rect: { fill: '#8e44ad', rx: 2, ry: 2 },
                '.label': { text: 'model', fill: '#ffffff', 'font-size': 10, stroke: '#000000', 'stroke-width': 0 },
	        '.inPorts circle': { fill: '#f1c40f', opacity: 0.9 },
                '.outPorts circle': { fill: '#f1c40f', opacity: 0.9 },
	        '.inPorts text, .outPorts text': { 'font-size': 9 }
            }
        })  
    ],
    library: [

    ],
    openLibraryFile: [

    ],
    navigation: [

    ]
    
};
