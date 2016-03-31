joint.shapes.ciot.Input = joint.shapes.ciot.Class.extend({
        defaults: joint.util.deepSupplement({
        type: 'ciot.Input',
        name: "<< input >>",
        attributes: ["+binding", "+itemName", "+labelText","+itemType"],
        methods: [],
          size: {
            width: 8,
            height: 6
        },
        attrs: {
            "." : {
                "font-family": "verdana"
            },
            ".uml-class-name-text": {
                "font-size": 9,
                "font-family": "verdana"
            },
            ".uml-class-name-rect": {
                "fill": "white"
            },
            ".uml-class-attrs-text": {
                "font-size": 9,
                "font-family": "verdana"
            },
            ".uml-class-attrs-rect": {
                "fill": "white"
            },
            ".uml-class-methods-text": {
                "font-size": 9,
                "font-family": "verdana"
            },
            ".uml-class-methods-rect": {
                "fill": "white"
            }
        }
    }, joint.shapes.ciot.Class.prototype.defaults),

//    getClassName: function() {
//        return ['<<input>>', this.get('name')];
//    }
});
joint.shapes.ciot.InputView = joint.shapes.ciot.ClassView;


joint.shapes.ciot.Output = joint.shapes.ciot.Class.extend({
        defaults: joint.util.deepSupplement({
        type: 'ciot.Output',
        name: "<< output >>",
        attributes: ["+binding", "+itemName", "+labelText","+itemType"],

          size: {
            width: 8,
            height: 6
        },
        attrs: {
            "." : {
                "font-family": "verdana"
            },
            ".uml-class-name-text": {
                "font-size": 9,
                "font-family": "verdana"
            },
            ".uml-class-name-rect": {
                "fill": "white"
            },
            ".uml-class-attrs-text": {
                "font-size": 9,
                "font-family": "verdana"
            },
            ".uml-class-attrs-rect": {
                "fill": "white"
            },
            ".uml-class-methods-text": {
                "font-size": 9,
                "font-family": "verdana"
            },
            ".uml-class-methods-rect": {
                "fill": "white"
            }
        }
    }, joint.shapes.ciot.Class.prototype.defaults),

//    getClassName: function() {
//        return ['<<output>>', this.get('name')];
//    }
});
joint.shapes.ciot.OutputView = joint.shapes.ciot.ClassView;


joint.shapes.ciot.Sensor = joint.shapes.ciot.Class.extend({

    defaults: joint.util.deepSupplement({
        type: 'ciot.Abstract',
        name: "<< input >>",
        attributes: ["+binding", "+itemName", "+labelText","+itemType"],
        methods: [],
          size: {
            width: 8,
            height: 6
        },
        attrs: {
            "." : {
                "font-family": "verdana"
            },
            ".uml-class-name-text": {
                "font-size": 9,
                "font-family": "verdana"
            },
            ".uml-class-name-rect": {
                "fill": "white"
            },
            ".uml-class-attrs-text": {
                "font-size": 9,
                "font-family": "verdana"
            },
            ".uml-class-attrs-rect": {
                "fill": "white"
            },
            ".uml-class-methods-text": {
                "font-size": 9,
                "font-family": "verdana"
            },
            ".uml-class-methods-rect": {
                "fill": "white"
            }
        }
    }, joint.shapes.ciot.Class.prototype.defaults),

//    getClassName: function() {
//        return ['<<input>>', this.get('name')];
//    }

});





joint.shapes.ciot.Component = joint.shapes.ciot.Sensor.extend({

    defaults: joint.util.deepSupplement({
        type: 'ciot.Abstract',
        name: "ComponentName",
    }, joint.shapes.ciot.Sensor.prototype.defaults),

    getClassName: function() {
        return ['<<component>>', this.get('name')];
    }

});


