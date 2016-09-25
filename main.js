$(document).ready(function() {
    "use strict";

    var first = true
	$('html').click(function(e) {
		if (first) {
		    setInterval ('cursorBlink()', 1000);
		    first = false;
		}

		$('#line-marker').css('display', 'block').css('top', e.pageY);
	});

	$('html').keydown(function(e) {
		var currentPosition = parseInt($('#line-marker').css('top'), 10);
		var currentHeight = parseInt($('#line-marker').css('height'), 10);
		var cursorPosition = parseInt($('#cursor').css('left'), 10)

		if ($('#line-marker').css('display') == "block") {
			console.log(e.keyCode);

			switch(e.keyCode) {
			    case 71: // g
			    	$('#line-marker').css('top', currentPosition - currentHeight);
			        break;
			    case 66: // b
			    	$('#line-marker').css('top', currentPosition + currentHeight);
			        break;
			    case 70: // f
			    	$('#line-marker').css('top', currentPosition - 1);
			        break;
			    case 86: // v
			    	$('#line-marker').css('top', currentPosition + 1);
			        break;
			    case 74: // j
			    	$('#line-marker').css('height', currentHeight + 1);
			    	fixCursorHeight();
			        break;
			    case 78: // n
			    	$('#line-marker').css('height', currentHeight - 1);
			    	fixCursorHeight();
			        break;
			    case 73: // i
			    	$('#cursor').css('left', cursorPosition - 20);
			        break;
			    case 79: // o
			    	$('#cursor').css('left', cursorPosition + 20);
			        break;
			    case 67: // c
			    	$('#cursor').toggle();
			        break;
			}
		}
	});
});

var cursorBlink = function() {
	$('#cursor').animate({
	    opacity: 0
	}, 'fast', 'swing').animate({
	    opacity: 1
	}, 'fast', 'swing');
};

var fixCursorHeight = function() {
	var lineMarkerHeight = parseInt($('#line-marker').css('height'), 10);
	$('#cursor').css('height', lineMarkerHeight - 4);
};