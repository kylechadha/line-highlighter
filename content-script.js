//
//  --------------------------------------------------------
//     Welcome to the 'Line Highlighter' Chrome Extension
//  --------------------------------------------------------
//
//   Created by Kyle Chadha
//   www.kylechadha.com
//   @kylechadha
//

$(document).ready(function() {
	"use strict";

	$("body").append('<div id="line-marker"><div id="cursor"></div></div>')

	var enabled = false;
	var first = true;
	$('html').click(function(e) {
		if (!enabled) {
			return;
		}

		if (first) {
			setInterval ('cursorBlink()', 1000);
			first = false;
		}

		$('#line-marker').css('display', 'block').css('top', e.pageY);
	});

	$('html').keydown(function(e) {
		if (e.keyCode == 69) { // e keypress
			enabled = !enabled;
			$('#line-marker').toggle();
			// * Could clear the cursor Interval here and set first to true again. Meh.
		}

		if (!enabled) {
			return;
		}

		var currentPosition = parseInt($('#line-marker').css('top'), 10);
		var currentHeight = parseInt($('#line-marker').css('height'), 10);
		var cursorPosition = parseInt($('#cursor').css('left'), 10);

		switch(e.keyCode) {
			case 70: // g keypress
				$('#line-marker').css('top', currentPosition - currentHeight);
				break;
			case 86: // b keypress
				$('#line-marker').css('top', currentPosition + currentHeight);
				break;
			case 71: // f keypress
				$('#line-marker').css('top', currentPosition - 1);
				break;
			case 66: // v keypress
				$('#line-marker').css('top', currentPosition + 1);
				break;
			case 74: // j keypress
				$('#line-marker').css('height', currentHeight + 1);
				fixCursorHeight();
				break;
			case 78: // n keypress
				$('#line-marker').css('height', currentHeight - 1);
				fixCursorHeight();
				break;
			case 73: // i keypress
				$('#cursor').css('left', cursorPosition - 20);
				break;
			case 79: // o keypress
				$('#cursor').css('left', cursorPosition + 20);
				break;
			case 67: // c keypress
				$('#cursor').toggle();
				break;
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
