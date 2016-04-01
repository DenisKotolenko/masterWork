$(document).ready(function () {
	
	
	//initialize load library button
	var loadElementButton = "<button class='btn btn-success btn-sm btn-load-element' id='loadElement'>Load Element</button>"
	var loadLibraryContainer = $(".stencil ").find("[data-name='openLibraryFile']");
	loadLibraryContainer.find("div").remove();
	loadLibraryContainer.append(loadElementButton);
	$("#loadElement").click(function () {
		$("#loadElementModal").modal("show");

		
	});
	
	$('#loadElementModal').on('hidden.bs.modal', function () {
  		$("#customIframe").html("");
		$("#files").filestyle('clear');
	});

	
	//initialize navigation
	var navigationContainer = $(".stencil ").find("[data-name='navigation']");
	navigationContainer.find("div").remove();
	navigationContainer.append($(".navigator-container"));
	
	


	
	//load json on load library modal click button
	function handleFileSelect(evt) {
		
        var files = evt.target.files; // FileList object

        // Loop through the FileList
        for (var i = 0, f; f = files[i]; i++) {

        var reader = new FileReader();

        // Closure to capture the file information.
        reader.onload = (function(theFile) {
            return function(e) {
                // Print the contents of the file and formatt JSON
				var json =	e.target.result;
                var doc = $('#customIframe');
				 
				var htmlCode =	"<button class='btn btn-default btn-sm' id='collapse-btn'>Collapse</button>" +
								"<button class='btn btn-default btn-sm' id='expand-btn'>Expand</button>"+
								"<button class='btn btn-default btn-sm' id='toggle-btn'>Toggle</button>"+
								"<button class='btn btn-default btn-sm' id='toggle-level1-btn'>Toggle level1</button>"+
								"<button class='btn btn-default btn-sm' id='toggle-level2-btn'>Toggle level2</button>"+
         						"<div id='json'></div>";			
				doc.append(htmlCode);
				cleanUpJson(json);					
            };
        })(f);

        // Read in the file
        //reader.readAsDataText(f,UTF-8);
        //reader.readAsDataURL(f);
	
		 reader.readAsText(f);			
        }
    }
    document.getElementById('files').addEventListener('change', handleFileSelect, false);
	

});


//initializes JSON view to format JSON for human reading
function cleanUpJson(json) {
	  $("#json").JSONView(json);

      $('#collapse-btn').on('click', function() {
        $('#json').JSONView('collapse');
      });

      $('#expand-btn').on('click', function() {
        $('#json').JSONView('expand');
      });

      $('#toggle-btn').on('click', function() {
        $('#json').JSONView('toggle');
      });

      $('#toggle-level1-btn').on('click', function() {
        $('#json').JSONView('toggle', 1);
      });

      $('#toggle-level2-btn').on('click', function() {
        $('#json').JSONView('toggle', 2);
      }); 
}