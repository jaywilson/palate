
function logEvents() {
	$("body").on("pagecontainerbeforechange", function(event, ui) {
		console.log("pagecontainerbeforechange " + ui.toPage[0].id + " " + ui.prevPage[0].id);
	});

	$("body").on("pagecontainerbeforehide", function(event, ui) {
		console.log("pagecontainerbeforehide " + ui.toPage[0].id + " " + ui.prevPage[0].id);
	});

	$("body").on("pagecontainerbeforeload", function(event, ui) {
		console.log("pagecontainerbeforeload " + ui.toPage[0].id + " " + ui.prevPage[0].id);
	});

	$("body").on("pagecontainerbeforeshow", function(event, ui) {
		console.log("pagecontainerbeforeshow " + ui.toPage[0].id + " " + ui.prevPage[0].id);
	});

	$("body").on("pagecontainerbeforetransition", function(event, ui) {
		console.log("pagecontainerbeforetransition " + ui.toPage[0].id + " " + ui.prevPage[0].id);
	});

	$("body").on("pagecontainerchange", function(event, ui) {
		console.log("pagecontainerchange " + ui.toPage[0].id + " " + ui.prevPage[0].id);
	});

	$("body").on("pagecontainercreate", function(event, ui) {
		console.log("pagecontainercreate " + ui.toPage[0].id + " " + ui.prevPage[0].id);
	});

	$("body").on("pagecontainerhide", function(event, ui) {
		console.log("pagecontainerhide " + ui.toPage[0].id + " " + ui.prevPage[0].id);
	});

	$("body").on("pagecontainerload", function(event, ui) {
		console.log("pagecontainerload " + ui.toPage[0].id + " " + ui.prevPage[0].id);
	});

	$("body").on("pagecontainershow", function(event, ui) {
		console.log("pagecontainershow " + ui.toPage[0].id + " " + ui.prevPage[0].id);
	});

	$("body").on("pagecontainertransition", function(event, ui) {
		console.log("pagecontainertransition " + ui.toPage[0].id + " " + ui.prevPage[0].id);
	});
}