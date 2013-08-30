window.gameName = "";
window.timeoutId = 0;
window.gameHasBeenSaved = false;

$(init);

// initializes the page - mainly attaching various event handlers
function init() {
	// catch events propragating through to the ".container" element
	// this model allows elements to be inserted dynamically into the container without
	// requiring event handlers be attached to each new element as it is inserted
	$('.container').on('click', '.bid-container i', function(e) {
		// if an inactive bid direction icon is clicked, switch the bid direction
		
		var $that = $(this);
		
		resetAutoSaveTimer();
		
		$('.editable').blur();
		
		if (! $that.hasClass('active')) {
			$that.addClass('active');
			$that.siblings('i').removeClass('active');				
		}
		var $leftScore = $that.parentsUntil('.round').parent().find('.score.left');
		var $rightScore = $that.parentsUntil('.round').parent().find('.score.right');
		var oldLeft = $leftScore.html();
		$leftScore.html($rightScore.html());
		$rightScore.html(oldLeft);
		
		recalculateScores();
		highlightScores();
		
	}).on('click', '.editable', function(e) {
		// if any .editable element is clicked, replace that element with an <input> element to accept keyboard input
		
		if ($(this).hasClass('active')) return;
		var $that = $(this).addClass('active');
		var oldVal = $that.html();
		$that.html("<input type='text' old-value='" + oldVal + "' />").children('input').focus();
						
	}).on('blur', '.editable', function(e) {	
		// when the .editable input box loses focus, extract the contents of the input box and return the
		// element to its original state
		var $that = $(this);
						
		if (!$that.hasClass('active')) return;
		
		resetAutoSaveTimer();
		
		var fieldHasBeenUpdated = false;
		
		// ensure that the input is a number evenly divisble by 5 and no greater than 180 or less than -180 
		//(if the input is for a score or bid)
		if ($that.children('input').val() !== "") {
			if ($that.hasClass('score')) {
				var newScore = parseInt($that.children('input').val(), 10);
				if (newScore % 5 === 0 && newScore >= -180 && newScore <= 180) {							
					$that.removeClass('active').html(newScore);	
					fieldHasBeenUpdated = true;
				} else {
					$that.removeClass('active').html($that.children('input').attr('old-value'));
				}							
			} else {
				$that.removeClass('active').html($that.children('input').val());
				fieldHasBeenUpdated = true;
			}						
		} else {
			$that.removeClass('active').html($that.children('input').attr('old-value'));
		}
		
		if (fieldHasBeenUpdated && (!$that.hasClass('bid')) && $that.hasClass('score')) {					
			// one of the round's score is updated, so change the other score appropriately
			var bid = $that.parentsUntil('.round').parent().find('.bid').html();
			if (($that.hasClass('left') && $that.parentsUntil('.round').parent().find('i.active').hasClass('left')) ||
				($that.hasClass('right') && $that.parentsUntil('.round').parent().find('i.active').hasClass('right'))) {
				// we are editing the team that took the bid
				if (parseInt($that.html(), 10) < bid) {
					// they didn't make their bid
					if (parseInt($that.html(), 10) >= 0) {
						$that.parentsUntil('.round').parent().find('.score').not($that).not('.bid').html(180 - parseInt($that.html(), 10));
						$that.html(bid * -1);	
					} else {
						$that.html(bid * -1);
					}							
				} else {
					// they made their bid
					$that.parentsUntil('.round').parent().find('.score').not($that).not('.bid').html(180 - parseInt($that.html(), 10));
				}
			} else {
				// we are editing the team that did not take the bid
				if (parseInt($that.html(), 10) >= 0) {
					if (180 - parseInt($that.html(), 10) < bid) {
						// this team set the other team
						$that.parentsUntil('.round').parent().find('.score').not($that).not('.bid').html(bid * -1);
					} else {
						//they did not set the other team
						$that.parentsUntil('.round').parent().find('.score').not($that).not('.bid').html(180 - parseInt($that.html(), 10));
					}	
				} else {
					$that.html(0);
					$that.parentsUntil('.round').parent().find('.score').not($that).not('.bid').html(180);
				}						
			}
			
			recalculateScores();
			highlightScores();
		} else if (fieldHasBeenUpdated && $that.hasClass('bid') && $that.hasClass('score')) {
			// we've updated a bid, so change the scores appropriately
			 
			var leftScore = parseInt($that.parentsUntil('.round').parent().find('.score.left').html(), 10);
			var rightScore = parseInt($that.parentsUntil('.round').parent().find('.score.right').html(), 10);
			var newBid = parseInt($that.html(), 10);
			var activeSide = $that.parentsUntil('.round').parent().find('i.active').hasClass('right') ? 'right' : 'left';					
			
			if (!( leftScore === 0 && rightScore === 0)) {
				if (activeSide === 'right') {
					if (180 - leftScore < newBid) {
						$that.parentsUntil('.round').parent().find('.score.right').html(newBid * -1);
					} else {
						$that.parentsUntil('.round').parent().find('.score.right').html(180 - leftScore);
					}
				}
				
				if (activeSide === 'left') {
					if (180 - rightScore < newBid) {
						$that.parentsUntil('.round').parent().find('.score.left').html(newBid * -1);
					} else {
						$that.parentsUntil('.round').parent().find('.score.left').html(180 - rightScore);
					}
				}
			}
		
			recalculateScores();
			highlightScores();
		}		
	}).on('keydown', '.editable', function(e) {
		// enter was pressed while editing an .editable, call this element's blur handler
		
		if (e.which === 13) {
			$(this).trigger('blur');	
		}				
	}).on('click', '.remove-button', function(e) {
		// the remove button was clicked, delete this round
		
		resetAutoSaveTimer();
		
		$(this).parentsUntil('.round').parent().slideUp(function() {
			$(this).remove();
			recalculateScores();
		});
	});
	
	$('#add-round-button').click(function() {
		// the add button was clicked, add a new round to the end of the list
		
		resetAutoSaveTimer();
		
		var newRound = $('#templates .row.round').clone().css('display', 'none');
		$('.round-container').append(newRound);
		newRound.slideDown(function() {
			document.getElementById('footer-spacer').scrollIntoView();
		});				
	});
	
	//start with one round already on the page
	$('.round-container').append($('#templates .row.round').clone());			
	
	// make the rounds sortable via drag and drop
	$('.round-container').sortable({
		start: function(event, ui) {
			$('.editable').each(function() {
				$(this).trigger('blur');
			});
		},
		stop: function(event, ui) {
			
			resetAutoSaveTimer();
			
			recalculateScores();
		}
	});
	
	// the save button was clicked.  either prompt for a game name or, if the game name has
	// already been set, save the game
	$('#save').click(function() {
		if (window.gameName === "") {
			$('#save-modal').modal('show');	
		} else {
			saveScores();
		}
	});
	
	// open the load game modal
	$('#load').click(function() {
		$('#load-modal').modal('show');
	});
	
	// open up the statistics modal if there's at least one round
	$('#stats').click(function() {
		if (window.chartsAreReady) { 
			if ($('.round-container .round').size() > 0) {
				$('#stat-modal').modal('show');
			} else {
				writeMessage("No rounds recorded!", "red");
			}
		}
	});
	
	// handles the clicking of the save button inside of the save game modal
	$("#save-game-button").click(function() {
		if (checkForValidGameName("save")) {
			$("#save-modal").modal('hide');
			saveScores();	
		} else {
			$('#duplicate-name-warning').slideDown();
			$('#save-game-name').css('background', 'rgba(255, 0, 0, .15)');
		}
	});
	
	// handles the clicking of the load button inside of the load game modal
	$("#load-game-button").click(function() {
		if (checkForValidGameName("load")) {
			$("#load-modal").modal('hide');
			loadScores();	
		} else {
			$('#game-does-not-exist-warning').slideDown();
			$('#load-game-name').css('background', 'rgba(255, 0, 0, .15)');
		}
	});
	
	// turn the game name input box red if that name has already been used
	// also, click the appropriate button if "enter" is pressed while typing the box
	$('#save-game-name, #load-game-name').on('focus keydown', function(e) {
		$(this).css('background', '');
		
		if (e.which && e.which === 13) {
			$($(this).attr('enter-target')).click();
		}
	});
	
	// focus on the input box when the save or load modal is opened
	$('#save-modal, #load-modal').on('shown', function(e) {
		$(this).find('input.initial-focus').focus();
	});
	
	// reset the save or load modal back to its original state when it's opened
	$('#save-modal, #load-modal').on('show', function(e) {
		$('#duplicate-name-warning, #game-does-not-exist-warning').css('display', 'none');
		$(this).find('#save-game-name, #load-game-name').css('background', '');
		$(this).find('input.initial-focus').val('');
	});
	
	// apply tooltips
	$('.tooltipped').tooltip();
	
	// if a chart tab is clicked, switch to the appropriate tab content
	$('#chart-tab a').click(function (e) {
		e.preventDefault();
		e.stopPropagation();
		$(this).tab('show');
	});
	
	// initialize the Score by Round chart when it's shown
	$('#score-by-round-tab').on('shown', function(e) {
		e.stopPropagation();
		drawScoreByRoundChart();
	});
	
	// initialize the Total Score chart when it's shown
	$('#total-score-tab').on('shown', function(e) {
		e.stopPropagation();
		drawTotalScoreChart();
	});
	
	// initialize the Bid chart when it's shown
	$('#bid-tab').on('shown', function(e) {
		e.stopPropagation();
		drawBidChart();
	});
	
	// initialize the misc. table when it's shown
	$('#miscellaneous-tab').on('shown', function(e) {
		e.stopPropagation();
		drawMiscellaneousChart();
	});
	
	// initialize whichever tab is open when the stat modal is opened
	$('#stat-modal').on('shown', function(e) {
		e.stopPropagation();
		$('#chart-tab li.active').trigger('shown');
	});
}