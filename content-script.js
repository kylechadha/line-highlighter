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

	console.log("Line Highlighter loading.")

	$("body").append('<div id="line-marker"><div id="cursor"></div></div>')

	var enabled = false;
	var first = true;
	var currentPosition, currentHeight, cursorPosition;

	$('html').click(function(e) {
		if (!enabled) {
			return;
		}

		if (first) {
			setInterval ('cursorBlink()', 1000);
			first = false;
		}

		$('#line-marker').css('display', 'block').css('top', e.pageY - currentHeight/2);
	});

	$('html').keydown(function(e) {
		if (e.ctrlKey || e.metaKey) {
			switch (String.fromCharCode(e.which).toLowerCase()) {
				case 'e':
					enabled = !enabled;
					$('#line-marker').toggle();
					// * Could clear the cursor Interval here and set first to true again. Meh.
					break;
			 }
		}

		if (!enabled) {
			return;
		}

		currentPosition = parseInt($('#line-marker').css('top'), 10);
		currentHeight = parseInt($('#line-marker').css('height'), 10);
		cursorPosition = parseInt($('#cursor').css('left'), 10);

		switch(String.fromCharCode(e.which).toLowerCase()) {
			case 'f':
				$('#line-marker').css('top', currentPosition - currentHeight);
				break;
			case 'v':
				$('#line-marker').css('top', currentPosition + currentHeight);
				break;
			case 'd':
				$('#line-marker').css('top', currentPosition - 2);
				break;
			case 'c':
				$('#line-marker').css('top', currentPosition + 2);
				break;
			case 'j':
				$('#line-marker').css('height', currentHeight + 1);
				fixCursorHeight();
				break;
			case 'n':
				$('#line-marker').css('height', currentHeight - 1);
				fixCursorHeight();
				break;
			case 'g':
				$('#cursor').toggle();
				break;
			case 'i':
				$('#cursor').css('left', cursorPosition - 20);
				break;
			case 'o':
				$('#cursor').css('left', cursorPosition + 20);
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
