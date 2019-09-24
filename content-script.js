//
//  --------------------------------------------------------
//     Welcome to the 'Line Highlighter' Chrome Extension
//  --------------------------------------------------------
//
//   Created by Kyle Chadha
//   www.kylechadha.com
//   @kylechadha
//

// ** TODOs
// - Investigate why setInterval isn't blinking consistently
// - Attach/deattach click handler based on enable/disable
// - Add toast notifications to let the user know the line highlighter has been enabled
// - Add toast notifications to show cursor controls on first use
// - Check all cursor controls work

$(document).ready(function() {
	"use strict";

	var enabled = false;
	var first = true;

	$('html').click(function(e) {
		if (!enabled) {
			return;
		}

		if (first) {
			console.log('Line Highlighter: Created with <3 by Kyle Chadha @kylechadha');
			setInterval ('cursorBlink()', 1000);
			first = false;
		}

		$('#line-marker').css('display', 'block').css('top', e.pageY - parseInt($('#line-marker').css('height'), 10)/2);
		$('#cursor').css('left', e.pageX - parseInt($('#line-marker').css('left'), 10) - parseInt($('#cursor').css('width'), 10)/2);
	});

	$('html').keydown(function(e) {
		if (e.ctrlKey || e.metaKey) {
			switch (String.fromCharCode(e.which).toLowerCase()) {
				case 'e':
					enabled = !enabled;
					if (enabled) {
						$("body").append('<div id="line-marker"><div id="cursor"></div></div>');
					} else {
						$('#line-marker').remove();
					}
					return;
			 }
		}

		if (!enabled) {
			return;
		}

		var currentHeight = parseInt($('#line-marker').css('height'), 10);
		var currentPosition = parseInt($('#line-marker').css('top'), 10);
		var cursorPosition = parseInt($('#cursor').css('left'), 10);
		var cursorWidth = parseInt($('#cursor').css('width'), 10);

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
				$('#cursor').css('height', currentHeight + 1);
				break;
			case 'n':
				$('#line-marker').css('height', currentHeight - 1);
				$('#cursor').css('height', currentHeight - 1);
				break;
			case 'g':
				$('#cursor').toggle();
				break;
			case 'i':
				$('#cursor').css('left', cursorPosition - cursorWidth);
				break;
			case 'o':
				$('#cursor').css('left', cursorPosition + cursorWidth);
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
