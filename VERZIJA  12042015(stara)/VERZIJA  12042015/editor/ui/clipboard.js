var copyIndex = 0;
joint.ui.Clipboard = Backbone.Collection.extend({
    copyElements: function (selection, graph, opt) {
        opt = opt || {};
        var links = [];
        var elements = [];
        var elementsIdMap = {};
        selection.each(function (element) {
            var connectedLinks = graph.getConnectedLinks(element);
            links = links.concat(_.filter(connectedLinks, function (link) {
                if (selection.get(link.get("source").id) && selection.get(link.get("target").id)) {
                    return true
                }
                return false
            }));
            var clonedElement = element.clone();
            if (opt.translate) {
                clonedElement.translate(opt.translate.dx || 20, opt.translate.dy || 20)
            }
            elements.push(clonedElement);
            elementsIdMap[element.get("id")] = clonedElement.get("id")
        });
        var originalLinks = _.unique(links);
        links = _.map(originalLinks, function (link) {
            var clonedLink = link.clone();
            var source = clonedLink.get("source");
            var target = clonedLink.get("target");
            source.id = elementsIdMap[source.id];
            target.id = elementsIdMap[target.id];
            clonedLink.set({
                source: _.clone(source),
                target: _.clone(target)
            });
            if (opt.translate) {
                _.each(clonedLink.get("vertices"), function (vertex) {
                    vertex.x += opt.translate.dx || 20;
                    vertex.y += opt.translate.dy || 20
                })
            }
            return clonedLink
        });
        this.reset(elements.concat(links));
        if (opt.useLocalStorage && window.localStorage) {
            localStorage.setItem("joint.ui.Clipboard.cells", JSON.stringify(this.toJSON()))
        }
        return (selection.models || []).concat(originalLinks)
    },
    pasteCells: function (graph,paper, opt) {
        var mainThis = this;
		opt = opt || {};
        if (opt.useLocalStorage && this.length === 0 && window.localStorage) {
            this.reset(JSON.parse(localStorage.getItem("joint.ui.Clipboard.cells")))
        }
        graph.trigger("batch:start");
		var elementsBelow = new Array(); 
		var indexElemB=0;
        this.each(function (cell) {
            cell.unset("z");
            if (cell instanceof joint.dia.Link && opt.link) {
                cell.set(opt.link)
            }
			elementsBelow[indexElemB]=cell;
			indexElemB++;
		});
		for(var myI=0;myI<elementsBelow.length;myI++){
			cell = elementsBelow[myI];
			var oldgroup = cell.attr().attributes.attrs.grp.text;
			var newgroup = oldgroup+"Copy"+copyIndex;
			copyIndex++;
			cell.attr().attributes.attrs.grp.text = newgroup;
			graph.addCell(cell.toJSON());
			mainThis.parentCloneChild(cell,graph,paper,oldgroup,newgroup,mainThis);
		}
        graph.trigger("batch:stop")
    },
    clear: function () {
        this.reset([]);
        if (window.localStorage) {
            localStorage.removeItem("joint.ui.Clipboard.cells")
        }
    },
	parentCloneChild: function (ccell,graph,paper,oldgroup,newgroup,mainThis) {
				var viewsByPoint2 = app.paper.findViewsFromPoint(g.point(ccell.getBBox().x+3,ccell.getBBox().y+3));
									var ccellView;
									for(var i=0;i<viewsByPoint2.length;i++){
										if(viewsByPoint2[i].model.id == ccell.id){
											ccellView = viewsByPoint2[i];
										}
									}
				var elementsBelow = new Array(); 
				var indexElemB=0;
				app.graph.get('cells').find(function(cell) {
                    if (cell instanceof joint.dia.Link) return false; // Not interested in links.
                        	if(cell.attributes.type=="iot.DeviceChannelBlock" || cell.attributes.type=="iot.WebServiceBlock"){
								if(cell._previousAttributes.attrs.grp.text==oldgroup){
									elementsBelow[indexElemB]=cell;
									indexElemB++;
								}
							}
							if(ccellView.model.attributes.type!="iot.CommChannelDeviceBlock" && ccellView.model.attributes.type!="iot.CommChannelCCDeviceBlock" && (cell.attributes.type=="iot.CommChannelDeviceBlock" || cell.attributes.type=="iot.CommChannelCCDeviceBlock")){
								if(cell._previousAttributes.attrs.subgrp.text==oldgroup){
									elementsBelow[indexElemB]=cell;
									indexElemB++;
								}
							}
						return false;
                });
				for(var myJ=0;myJ<elementsBelow.length;myJ++){
					cell = elementsBelow[myJ];
					var clonedElement = cell.clone();
					clonedElement.unset("z");
					clonedElement.translate(20,20);
					var t = graph.addCell(clonedElement.toJSON());	
					var viewsByPoint = app.paper.findViewsFromPoint(g.point(clonedElement.getBBox().x+3,clonedElement.getBBox().y+3));
					var cellView;
					for(var i=0;i<viewsByPoint.length;i++){
						if(viewsByPoint[i].model.id == clonedElement.id){
							cellView = viewsByPoint[i];
						}
					}		
					embedByTypes(ccellView.model, cellView.model, ccellView.model.attributes.type,cellView.model.attributes.type, 'rect', { stroke: 'blue' },'rect',{ stroke: 'black' });
					if(cellView.model.attributes.type=="iot.CommChannelDeviceBlock" || cellView.model.attributes.type=="iot.CommChannelCCDeviceBlock"){
						var oldgrp = cellView.model.attributes.attrs.grp.text;
						var newgrp = oldgrp+"Copy"+copyIndex;
						copyIndex++;
						cellView.model.attributes.attrs.grp.text = newgrp;
						mainThis.parentCloneChild(clonedElement,graph,paper,oldgrp,newgrp,mainThis);
					}
				}
				
	}
});
