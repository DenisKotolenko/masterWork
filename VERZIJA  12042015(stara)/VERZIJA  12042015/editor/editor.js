
            var selectedRule = null;
            var connecttool=1;
            var rules = Array();
            localStorage['layouts']=demo;
            // Uncomment the following line and comment the line after if you
            // want to use channels.
            var app = new Rappid({ channelUrl: 'ws://jointjs.com:4141' });
            Backbone.history.start();

            app.paper.on('cell:pointerdblclick',
                function(cellView, evt, x, y) {
                    if(cellView.model.attributes.type=='iot.Rule') {
                        var inpts=[];
                        app.paper.model.getLinks().forEach(function(e) {
                            if(e.attributes.target.id == cellView.model.id )
                            {
                                var tport = e.get('target').port;
                                var src = app.graph.getCell(e.attributes.source.id);
                                src.getEmbeddedCells().forEach(function(embcel) {
                                    $("#editor-input-rules").
				    	append('<li><a href="#">'+
					embcel.attributes.name+'</a></li>');
                                    inpts.push(embcel);
                                });
                            }
                        });



                        //alert('cell view ' + cellView.model.id + ' was clicked');
                        editor.getSession().setValue("");
                        selectedRule = cellView.model.id;
                        $('#RuleModal').modal('show');
                        editor.getSession().setValue(rules[selectedRule])
                    }
                }
            );

			app.paper.on('cell:pointerup', function(cellView, evt, x, y) {
                console.log('element moved');
                var elementBelow = app.graph.get('cells').find(function(cell) {
                    if (cell instanceof joint.dia.Link) return false; // Not interested in links.
                    if (cell.id === cellView.model.id) return false; // The same element as the dropped one.
                    if (cell.getBBox().containsPoint(g.point(x, y)) && (cell.attributes.type=="iot.CommChannelDeviceBlock" || cell.attributes.type=="iot.CommChannelCCDeviceBlock")) {
                        return true;
                    }
                    return false;
                });
				if(!elementBelow){
					var elementBelow = app.graph.get('cells').find(function(cell) {
						if (cell instanceof joint.dia.Link) return false; // Not interested in links.
						if (cell.id === cellView.model.id) return false; // The same element as the dropped one.
						if (cell.getBBox().containsPoint(g.point(x, y)) && cell.attributes.type=="iot.SubSystem") {
						    return true;
						}
						return false;
					});
					if(!elementBelow){
						var elementBelow = app.graph.get('cells').find(function(cell) {
							if (cell instanceof joint.dia.Link) return false; // Not interested in links.
							if (cell.id === cellView.model.id) return false; // The same element as the dropped one.
							if (cell.getBBox().containsPoint(g.point(x, y)) && cell.attributes.type=="iot.System") {
							    return true;
							}
							return false;
						});
					}
				}
				
                if (elementBelow && !_.contains(app.graph.getNeighbors(elementBelow), cellView.model)) {
                    embedByTypes(elementBelow, cellView.model, 'iot.CommChannelDeviceBlock','iot.DeviceChannelBlock', 'rect', { stroke: 'blue' },'rect',{ stroke: 'black' });
                    embedByTypes(elementBelow, cellView.model, 'iot.CommChannelCCDeviceBlock','iot.DeviceChannelBlock', 'rect', { stroke: 'blue' },'rect',{ stroke: 'black' });
                    embedByTypes(elementBelow, cellView.model, 'iot.CommChannelDeviceBlock','iot.WebServiceBlock', 'rect', { stroke: 'blue' },'rect',{ stroke: 'black' });
                    embedByTypes(elementBelow, cellView.model, 'iot.CommChannelCCDeviceBlock','iot.WebServiceBlock', 'rect', { stroke: 'blue' },'rect',{ stroke: 'black' });
                    embedByTypes(elementBelow, cellView.model, 'iot.SubSystem','iot.DeviceChannelBlock', 'rect', { stroke: 'blue' },'rect',{ stroke: 'black' });
                    embedByTypes(elementBelow, cellView.model, 'iot.SubSystem','iot.WebServiceBlock', 'rect', { stroke: 'blue' },'rect',{ stroke: 'black' });
                    embedByTypes(elementBelow, cellView.model, 'iot.SubSystem','iot.CommChannelDeviceBlock', 'rect', { stroke: 'blue' },'rect',{ stroke: 'black' });
                    embedByTypes(elementBelow, cellView.model, 'iot.SubSystem','iot.CommChannelCCDeviceBlock', 'rect', { stroke: 'blue' },'rect',{ stroke: 'black' });
                    embedByTypes(elementBelow, cellView.model, 'iot.System','iot.SubSystem', 'rect', { stroke: 'blue' },'rect',{ stroke: 'black' });
                    embedByTypes(elementBelow, cellView.model, 'iot.System','iot.DeviceChannelBlock', 'rect', { stroke: 'blue' },'rect',{ stroke: 'black' });
                    embedByTypes(elementBelow, cellView.model, 'iot.System','iot.WebServiceBlock', 'rect', { stroke: 'blue' },'rect',{ stroke: 'black' });
                    embedByTypes(elementBelow, cellView.model, 'iot.System','iot.CommChannelDeviceBlock', 'rect', { stroke: 'blue' },'rect',{ stroke: 'black' });
                    embedByTypes(elementBelow, cellView.model, 'iot.System','iot.CommChannelCCDeviceBlock', 'rect', { stroke: 'blue' },'rect',{ stroke: 'black' });
           }
            });
			function updateChildrenWithSameGroup(oldgroup,newgroup){
				var elementBelow = app.graph.get('cells').find(function(cell) {
                    if (cell instanceof joint.dia.Link) return false; // Not interested in links.
                        	if(cell.attributes.type=="iot.CommChannelDeviceBlock" || cell.attributes.type=="iot.CommChannelCCDeviceBlock" || cell.attributes.type=="iot.DeviceChannelBlock" || cell.attributes.type=="iot.WebServiceBlock"){
								if(cell._previousAttributes.attrs.grp.text==oldgroup){
									var viewsByPoint = app.paper.findViewsFromPoint(g.point(cell.getBBox().x+3,cell.getBBox().y+3));
									var cellView;
									for(var i=0;i<viewsByPoint.length;i++){
										if(viewsByPoint[i].model.id == cell.id){
											cellView = viewsByPoint[i];
										}
									}									
									cellView.model.attributes.attrs.grp.text=newgroup;
								}
							}
							if(cell.attributes.type=="iot.CommChannelDeviceBlock" || cell.attributes.type=="iot.CommChannelCCDeviceBlock"){
								if(cell._previousAttributes.attrs.subgrp.text==oldgroup){
									var viewsByPoint = app.paper.findViewsFromPoint(g.point(cell.getBBox().x+3,cell.getBBox().y+3));
									var cellView;
									for(var i=0;i<viewsByPoint.length;i++){
										if(viewsByPoint[i].model.id == cell.id){
											cellView = viewsByPoint[i];
										}
									}									
									cellView.model.attributes.attrs.subgrp.text=newgroup;
								}
							}
						return false;
                    
                });
			}
			function reparentEverything(cell,p){		
			var viewsByPoint = app.paper.findViewsFromPoint(p);
			var cellView;
			var x = p.x;
			var y = p.y;
			for(var i=0;i<viewsByPoint.length;i++){
				if(viewsByPoint[i].model.id == cell.id){
					cellView = viewsByPoint[i];
				}
			}
			var elementBelow = app.graph.get('cells').find(function(cell) {
                    if (cell instanceof joint.dia.Link) return false; // Not interested in links.
                    if (cell.id === cellView.model.id) return false; // The same element as the dropped one.
                    if (cell.getBBox().containsPoint(g.point(x, y)) && (cell.attributes.type=="iot.CommChannelDeviceBlock" || cell.attributes.type=="iot.CommChannelCCDeviceBlock")) {
                        return true;
                    }
                    return false;
                });
				if(!elementBelow){
					var elementBelow = app.graph.get('cells').find(function(cell) {
						if (cell instanceof joint.dia.Link) return false; // Not interested in links.
						if (cell.id === cellView.model.id) return false; // The same element as the dropped one.
						if (cell.getBBox().containsPoint(g.point(x, y)) && cell.attributes.type=="iot.SubSystem") {
						    return true;
						}
						return false;
					});
					if(!elementBelow){
						var elementBelow = app.graph.get('cells').find(function(cell) {
							if (cell instanceof joint.dia.Link) return false; // Not interested in links.
							if (cell.id === cellView.model.id) return false; // The same element as the dropped one.
							if (cell.getBBox().containsPoint(g.point(x, y)) && cell.attributes.type=="iot.System") {
							    return true;
							}
							return false;
						});
					}
				}
				
                if (elementBelow && !_.contains(app.graph.getNeighbors(elementBelow), cellView.model)) {
                    embedByTypes(elementBelow, cellView.model, 'iot.CommChannelDeviceBlock','iot.DeviceChannelBlock', 'rect', { stroke: 'blue' },'rect',{ stroke: 'black' });
                    embedByTypes(elementBelow, cellView.model, 'iot.CommChannelCCDeviceBlock','iot.DeviceChannelBlock', 'rect', { stroke: 'blue' },'rect',{ stroke: 'black' });
                    embedByTypes(elementBelow, cellView.model, 'iot.CommChannelDeviceBlock','iot.WebServiceBlock', 'rect', { stroke: 'blue' },'rect',{ stroke: 'black' });
                    embedByTypes(elementBelow, cellView.model, 'iot.CommChannelCCDeviceBlock','iot.WebServiceBlock', 'rect', { stroke: 'blue' },'rect',{ stroke: 'black' });
                    embedByTypes(elementBelow, cellView.model, 'iot.SubSystem','iot.DeviceChannelBlock', 'rect', { stroke: 'blue' },'rect',{ stroke: 'black' });
                    embedByTypes(elementBelow, cellView.model, 'iot.SubSystem','iot.WebServiceBlock', 'rect', { stroke: 'blue' },'rect',{ stroke: 'black' });
                    embedByTypes(elementBelow, cellView.model, 'iot.SubSystem','iot.CommChannelDeviceBlock', 'rect', { stroke: 'blue' },'rect',{ stroke: 'black' });
                    embedByTypes(elementBelow, cellView.model, 'iot.SubSystem','iot.CommChannelCCDeviceBlock', 'rect', { stroke: 'blue' },'rect',{ stroke: 'black' });
                    embedByTypes(elementBelow, cellView.model, 'iot.System','iot.SubSystem', 'rect', { stroke: 'blue' },'rect',{ stroke: 'black' });
                    embedByTypes(elementBelow, cellView.model, 'iot.System','iot.DeviceChannelBlock', 'rect', { stroke: 'blue' },'rect',{ stroke: 'black' });
                    embedByTypes(elementBelow, cellView.model, 'iot.System','iot.WebServiceBlock', 'rect', { stroke: 'blue' },'rect',{ stroke: 'black' });
                    embedByTypes(elementBelow, cellView.model, 'iot.System','iot.CommChannelDeviceBlock', 'rect', { stroke: 'blue' },'rect',{ stroke: 'black' });
                    embedByTypes(elementBelow, cellView.model, 'iot.System','iot.CommChannelCCDeviceBlock', 'rect', { stroke: 'blue' },'rect',{ stroke: 'black' });
              }
			}
			var sysind =0;
			var subsysind =0;
			var ccind =0;
			var devind =0;
			var devchanind =0;
			var webind =0;
			function addIndexAndGroup(cell,p){		
				var viewsByPoint = app.paper.findViewsFromPoint(p);
				var cellView;
				var x = p.x;
				var y = p.y;
				for(var i=0;i<viewsByPoint.length;i++){
					if(viewsByPoint[i].model.id == cell.id){
						cellView = viewsByPoint[i];
					}
				}
				if(cell.attributes.type=="iot.System"){
					cellView.model.attributes.attrs.grp.text = "Sys"+sysind;
					sysind++;
				}
				if(cell.attributes.type=="iot.SubSystem"){
					cellView.model.attributes.attrs.grp.text = "SubSys"+subsysind;
					subsysind++;
				}
				if(cell.attributes.type=="iot.CommChannelDeviceBlock" || cell.attributes.type=="iot.CommChannelCCDeviceBlock"){
					cellView.model.attributes.attrs.grp.text = "Dev"+devind;
					cellView.model.attributes.attrs.devicename.text = "Dev"+devind;
					devind++;
				}
			}
			
			function embedByTypes(elementBelow, cellmodel, elementTypeHost, elementTypeChild , cproperty, cstyle, dproperty, dstyle)
            {
                    if(elementBelow.attributes.type==elementTypeHost && cellmodel.attributes.type==elementTypeChild) {
                        if(elementBelow.attributes.type=="iot.SubSystem" && cellmodel.attributes.type=="iot.CommChannelDeviceBlock"){
							cellmodel.attributes.attrs.subgrp.text=elementBelow._previousAttributes.attrs.grp.text;
						}
						if(elementBelow.attributes.type=="iot.SubSystem" && cellmodel.attributes.type=="iot.CommChannelCCDeviceBlock"){
							cellmodel.attributes.attrs.subgrp.text=elementBelow._previousAttributes.attrs.grp.text;
						}
						
						if(elementBelow.attributes.type=="iot.System" && cellmodel.attributes.type=="iot.CommChannelDeviceBlock"){
							cellmodel.attributes.attrs.subgrp.text=elementBelow._previousAttributes.attrs.grp.text;
						}
						if(elementBelow.attributes.type=="iot.System" && cellmodel.attributes.type=="iot.CommChannelCCDeviceBlock"){
							cellmodel.attributes.attrs.subgrp.text=elementBelow._previousAttributes.attrs.grp.text;
						}
						
						if(elementBelow.attributes.type=="iot.CommChannelDeviceBlock" && cellmodel.attributes.type=="iot.DeviceChannelBlock"){
							var prevAttrs;
							try{
							prevAttrs = elementBelow.attributes.attrs;
							}
							catch(e){
							prevAttrs = elementBelow._previousAttributes.attrs;
							}
							cellmodel.attributes.attrs.grp.text=prevAttrs.grp.text;
							if(cellmodel.attributes.attrs.devicename.text==undefined || cellmodel.attributes.attrs.devicename.text==""){
								cellmodel.attributes.attrs.devicename.text=prevAttrs.devicename.text;
							}
							if(cellmodel.attributes.attrs.devicemodel.text==undefined || cellmodel.attributes.attrs.devicemodel.text==""){
								cellmodel.attributes.attrs.devicemodel.text=prevAttrs.devicemodel.text;
							}
							if(cellmodel.attributes.attrs.devmanufacturer.text==undefined || cellmodel.attributes.attrs.devmanufacturer.text==""){
								cellmodel.attributes.attrs.devmanufacturer.text=prevAttrs.devmanufacturer.text;
							}
						}
						if(elementBelow.attributes.type=="iot.CommChannelDeviceBlock" && cellmodel.attributes.type=="iot.WebServiceBlock"){
							cellmodel.attributes.attrs.grp.text=elementBelow._previousAttributes.attrs.grp.text;
						}
						if(elementBelow.attributes.type=="iot.CommChannelCCDeviceBlock" && cellmodel.attributes.type=="iot.DeviceChannelBlock"){
							var prevAttrs;
							try{
							prevAttrs = elementBelow.attributes.attrs;
							}
							catch(e){
							prevAttrs = elementBelow._previousAttributes.attrs;
							}
							cellmodel.attributes.attrs.grp.text=prevAttrs.grp.text;
							if(cellmodel.attributes.attrs.devicename.text==undefined || cellmodel.attributes.attrs.devicename.text==""){
								cellmodel.attributes.attrs.devicename.text=prevAttrs.devicename.text;
							}
							if(cellmodel.attributes.attrs.devicemodel.text==undefined || cellmodel.attributes.attrs.devicemodel.text==""){
								cellmodel.attributes.attrs.devicemodel.text=prevAttrs.devicemodel.text;
							}
							if(cellmodel.attributes.attrs.devmanufacturer.text==undefined || cellmodel.attributes.attrs.devmanufacturer.text==""){
								cellmodel.attributes.attrs.devmanufacturer.text=prevAttrs.devmanufacturer.text;
							}
						}
						if(elementBelow.attributes.type=="iot.CommChannelCCDeviceBlock" && cellmodel.attributes.type=="iot.WebServiceBlock"){
							var prevAttrs;
							try{
							prevAttrs = elementBelow.attributes.attrs;
							}
							catch(e){
							prevAttrs = elementBelow._previousAttributes.attrs;
							}
							cellmodel.attributes.attrs.grp.text=prevAttrs.grp.text;
						}
						if(connecttool==1) {
                            elementBelow.embed(cellmodel);
                            cellmodel.attr(cproperty, cstyle);
                            // Auto groupname set
                            //cellmodel.set("ohGroups", elementBelow.get("ohItemName"));
                        }
                        else {
                            elementBelow.unembed(cellmodel);
                            cellmodel.attr(dproperty, dstyle);
                            // Auto groupname set
                            // cellmodel.set("ohGroups", "");
                        }
                    }
            }

            function uradi() {
                var jsonString = JSON.stringify(app.graph);
                var print_rules = [];
                for (var r in rules) {
                    print_rules.push( { "rulename": r, "rulecode": rules[r] });
                }
 // window.open("data:,"+JSON.stringify(print_rules), '_blank');
                var gen = new Generator();
                gen.generateOpenHAB(app.graph,app.paper,JSON.stringify(print_rules));
                
            }
            

  app.graph.on('change:size', function(cell, newPosition, opt) {

        if (opt.skipParentHandler) return;

        if (cell.get('embeds') && cell.get('embeds').length) {
            // If we're manipulating a parent element, let's store
            // it's original size to a special property so that
            // we can shrink the parent element back while manipulating
            // its children.
            cell.set('originalSize', cell.get('size'));
        }
    });

    app.graph.on('change:position', function(cell, newPosition, opt) {

        if (opt.skipParentHandler) return;

        if (cell.get('embeds') && cell.get('embeds').length) {
            // If we're manipulating a parent element, let's store
            // it's original position to a special property so that
            // we can shrink the parent element back while manipulating
            // its children.
            cell.set('originalPosition', cell.get('position'));
        }

        var parentId = cell.get('parent');
        if (!parentId) return;

        var parent = app.graph.getCell(parentId);
        var parentBbox = parent.getBBox();

        if (!parent.get('originalPosition')) parent.set('originalPosition', parent.get('position'));
        if (!parent.get('originalSize')) parent.set('originalSize', parent.get('size'));

        var originalPosition = parent.get('originalPosition');
        var originalSize = parent.get('originalSize');

        var newX = originalPosition.x;
        var newY = originalPosition.y;
        var newCornerX = originalPosition.x + originalSize.width;
        var newCornerY = originalPosition.y + originalSize.height;

        _.each(parent.getEmbeddedCells(), function(child) {

            var childBbox = child.getBBox();

            if (childBbox.x < newX) { newX = childBbox.x; }
            if (childBbox.y < newY) { newY = childBbox.y; }
            if (childBbox.corner().x > newCornerX) { newCornerX = childBbox.corner().x; }
            if (childBbox.corner().y > newCornerY) { newCornerY = childBbox.corner().y; }
        });

        // Note that we also pass a flag so that we know we shouldn't adjust the
        // `originalPosition` and `originalSize` in our handlers as a reaction
        // on the following `set()` call.
        parent.set({
            position: { x: newX, y: newY },
            size: { width: newCornerX - newX, height: newCornerY - newY }
        }, { skipParentHandler: true });
    });

function switchtool(x)
{
    connecttool=x;
}
function loadLayout(id) {
    $("#loadLayoutModal").modal("hide");
    var foo = JSON.parse(localStorage["layouts"]);
    var locsel;
    for (var r in foo) {
        if(foo[r].name==id) locsel=foo[r];
    }

    app.graph.fromJSON(locsel.layout);

}


$(document).ready ( function(){


           /* app.graph.on('add', function(cell) {
                cell.on('change:attrs', function() {
                    cell.attr('rect/fill', { fill: "#ffffff" });
                });
            }) */

			$("#savelayoutname").val('conf');
			var selectedRuleIndex = 0;
            $("#savebuttonrule").click(function() {
                if(selectedRule==undefined || selectedRule==null){
					var ruleName = $('#RuleNameText').val();
					if(ruleName==''){
						ruleName = "Rule"+selectedRuleIndex;
					}
					else{
						ruleName = ruleName.replace(/\s/g, '');
					}
					if(!($("#"+ruleName).length==0)){
						ruleName = ruleName + selectedRuleIndex;
					}
					$("#rulecontainer").append('<li><a id="'+ruleName+'" style="cursor:pointer">'+ruleName+'</a></li>');
					rules[ruleName] = editor.getSession().getValue();
					selectedRuleIndex++;
					selectedRule=ruleName;
					rules[selectedRule]=editor.getSession().getValue();
					editor.getSession().setValue(rules[selectedRule]);
					$("#"+ruleName).click(function() {
						editor.getSession().setValue(rules[$("#"+ruleName).attr("id")]);
						selectedRule=ruleName;
						$('#rulecontainer li.active').removeClass('active');
						$("#"+ruleName).parent().addClass('active');
					});
					$('#rulecontainer li.active').removeClass('active');
					$("#"+ruleName).parent().addClass('active');
				}
				else{
					rules[selectedRule] = editor.getSession().getValue();
				}
			});
			
			$("#AddRuleButton").click(function() {
				var ruleName = $('#RuleNameText').val();
                if(ruleName==''){
					ruleName = "Rule"+selectedRuleIndex;
				}
				else{
					ruleName = ruleName.replace(/\s/g, '');
				}
				if(!($("#"+ruleName).length==0)){
					ruleName = ruleName + selectedRuleIndex;
				}
				$("#rulecontainer").append('<li><a id="'+ruleName+'" style="cursor:pointer">'+ruleName+'</a></li>');
				rules[ruleName] = '';
                selectedRuleIndex++;
				selectedRule=ruleName;
				rules[selectedRule]='';
				editor.getSession().setValue(rules[selectedRule]);
				$("#"+ruleName).click(function() {
					editor.getSession().setValue(rules[$("#"+ruleName).attr("id")]);
					selectedRule=ruleName;
					$('#rulecontainer li.active').removeClass('active');
					$("#"+ruleName).parent().addClass('active');
				});
				$('#rulecontainer li.active').removeClass('active');
				$("#"+ruleName).parent().addClass('active');
			});

            $("#savelayoutbutton").click(function() {
	 //         var foo = localStorage["layouts"];
                var print_rules = [];
                for (var r in rules) {
                   print_rules.push( { "rulename": r, "rulecode": rules[r] });
                }
                foo = { "name":sname, "layout": app.graph , "rules": print_rules  };
		var sname=$("#savelayoutname").val();
     //           foo.push({ "name":sname, "layout": app.graph , "rules": rules  });
                var jsonString = JSON.stringify(foo); //JSON.stringify(app.graph);
               var blob = new Blob([jsonString], {type: "text/json;charset=utf-8"});

	       textFile = window.URL.createObjectURL(blob);
	       var downloadLink = document.createElement("a");
               downloadLink.href = textFile;
               downloadLink.download = sname+".json";
               document.body.appendChild(downloadLink);
               downloadLink.click();
               document.body.removeChild(downloadLink);   
               window.URL.destroyObjectURL(blob);
  //             saveAs(blob, "status.json");	      
	     
//                localStorage["layouts"]= JSON.stringify(foo);
//                $('#saveLayoutModal').modal('hide');

            });
		$("#savelayoutbuttonmodal").click(function() {
	 //         var foo = localStorage["layouts"];
	            var print_rules = [];
                for (var r in rules) {
                    print_rules.push( { "rulename": r, "rulecode": rules[r] });
                }
                foo = { "name":sname, "layout": app.graph , "rules": print_rules  };
		var sname=$("#savelayoutname").val();
		$('#saveLayoutModal').modal('hide');
     //           foo.push({ "name":sname, "layout": app.graph , "rules": rules  });
                var jsonString = JSON.stringify(foo); //JSON.stringify(app.graph);
               var blob = new Blob([jsonString], {type: "text/json;charset=utf-8"});

	       textFile = window.URL.createObjectURL(blob);
	       var downloadLink = document.createElement("a");
               downloadLink.href = textFile;
               downloadLink.download = sname+".json";
               document.body.appendChild(downloadLink);
               downloadLink.click();
               document.body.removeChild(downloadLink);   
               saveAs(blob, sname+".json");	      
	     // 
//                localStorage["layouts"]= JSON.stringify(foo);
//                $('#saveLayoutModal').modal('hide');

            });	
			$("#saveaslayoutbutton").click(function() {
				$('#saveLayoutModal').modal('show');//         
            });



            $("#loadLayoutClick").click(function() {
 //               var loadData = localStorage["layouts"];
 //               var foo = JSON.parse(loadData);
 //               $("#loadlayoutlist").html("");

 //               for (var r in foo) {
 //                   var x = foo[r];
 //                   if(x.name==undefined) continue;
 //                   $("#loadlayoutlist").prepend("<li class=\"list-group-item\" onclick=\"loadLayout('"+x.name+"')\">"+x.name+"</li>");
 //               }
 //               $("#loadLayoutModal").modal("show");
                document.getElementById("diskfile").click();
            });

            $("#loadModule").click(function() {
                document.getElementById("files").click();
            });


            $("#loadConfigDisk").click(function() {
                document.getElementById("diskfile").click();
            });




            document.getElementById('files').addEventListener('change', readSingleFile, false);
            function readSingleFile(evt) {
                //Retrieve the first (and only!) File from the FileList object
                var f = evt.target.files[0];

                if (f) {
                  var r = new FileReader();
                  r.onload = function(e) {
                      var contents = e.target.result;
                      var plugin = JSON.parse(contents);
                      var c = new joint.shapes.ciot.Input({
                          name: plugin.name,
                            size: {
                                width: 90,
                                height: 80
                            }
                      });
                      c.set('ohItemName',plugin.ohItemName);
                      c.set('ohLabelText',plugin.ohLabelText);
                      c.set('ohItemType',plugin.ohItemType);
                      c.set('ohIconName',plugin.ohIconName);
                      app.stencil.load([c],"customItems");
                  }
                  r.readAsText(f);
                } else {
                  alert("Failed to load file");
                }
              }


            document.getElementById('diskfile').addEventListener('change',
              readSingleLayout, false);
            function readSingleLayout(evt) {
                //Retrieve the first (and only!) File from the FileList object
                var f = evt.target.files[0];

                if (f) {
                  var r = new FileReader();
                  r.onload = function(e) {
                      var contents = e.target.result;
                      app.graph.clear();
					  var layot = JSON.parse(contents);
                      app.graph.fromJSON(layot.layout);
					  var print_rules;
					  for (var indOfR in layot.rules) {
							r = layot.rules[indOfR].rulename;
							rules[r]=layot.rules[indOfR].rulecode;
					  		$("#rulecontainer").append('<li><a id="'+r+'" style="cursor:pointer">'+r+'</a></li>');
							selectedRuleIndex++;
							selectedRule=r;
							editor.getSession().setValue(rules[selectedRule]);
							$("#"+r).click(function() {
								editor.getSession().setValue(rules[$("#"+this.id).attr("id")]);
								selectedRule=this.id;
								$('#rulecontainer li.active').removeClass('active');
								$("#"+this.id).parent().addClass('active');
							});
							$('#rulecontainer li.active').removeClass('active');
							$("#"+r).parent().addClass('active');
					  }
                      app.graph.addCell(new joint.shapes.basic.Rect({ }));
                  }
                  r.readAsText(f);
                } else {
                  alert("Failed to load file");
                }
				
				$(this).val("");
				$("#diskfile").val("");
				$("#files").val("");
              }
			  
	          document.getElementById('addToLib').addEventListener('change',
              addToLib, false);
            function addToLib(evt) {
                //Retrieve the first (and only!) File from the FileList object
                var f = evt.target.files[0];

                if (f) {
                  var r = new FileReader();
                  r.onload = function(e) {
                      var contents = e.target.result;
                      libdevicesLoaded[f.name] = contents;
					  $("#libname").append("<option value='"+f.name+"'>"+f.name+"</option>");
                  }
                  r.readAsText(f);
                } else {
                  alert("Failed to load file");
                }
				$("#addToLib").val("");
              }
			  
			document.getElementById('loadLib').addEventListener('change',
              loadLib, false);
            function loadLib(evt) {
                //Retrieve the first (and only!) File from the FileList object
                var f = evt.target.files[0];

                if (f) {
                  var r = new FileReader();
                  r.onload = function(e) {
                      var contents = e.target.result;
                      libdevicesLoaded = JSON.parse(contents);
						$("#libname").html="";
					for(var i in libdevicesLoaded){
						$("#libname").append("<option value='"+i+"'>"+i+"</option>");
					}
                  }
                  r.readAsText(f);
                } else {
                  alert("Failed to load file");
                }
				$("#loadLib").val("");
              }
			document.getElementById('saveLib').addEventListener('click',
              saveLib, false);
            function saveLib(evt) {
                //Retrieve the first (and only!) File from the FileList object
               var jsonString = JSON.stringify(libdevicesLoaded); //JSON.stringify(app.graph);
               var blob = new Blob([jsonString], {type: "text/json;charset=utf-8"});

	       textFile = window.URL.createObjectURL(blob);
	       var downloadLink = document.createElement("a");
               downloadLink.href = textFile;
               downloadLink.download = "lib.json";
               document.body.appendChild(downloadLink);
               downloadLink.click();
               document.body.removeChild(downloadLink);   
               window.URL.destroyObjectURL(blob);
			}
});
