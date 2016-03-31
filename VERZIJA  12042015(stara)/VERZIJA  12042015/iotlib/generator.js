var Generator = function() {}

Generator.prototype = {
     name : 'OpenHub Generator',
     init: function() {
        /// constructor
     },
     generateOpenHAB : function (json,jsonpaper,rules) {
        var deobjectified = JSON.parse(JSON.stringify(json));
		var obj = deobjectified;
		for (x in obj.cells) {
			var cellModel = jsonpaper.getModelById(obj.cells[x].id);
			obj.cells[x].extraAttr = cellModel.attributes.attrs;
		}
		sessionStorage.setItem('interstate', JSON.stringify(obj));
		sessionStorage.setItem('interstaterules', rules);
        window.open("openhabexport.html");
        return this.name + " OK";
     },
     checkConnection : function ( ) {
        return "not implemented";
     }
};
