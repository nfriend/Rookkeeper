// step through each round and update the total scores
function recalculateScores() {
	var leftScore = 0;
	var rightScore = 0;
	
	$('.round-container .round').each(function() {
		var $that = $(this);
		leftScore += parseInt($that.find('.score.left').html(), 10);
		rightScore += parseInt($that.find('.score.right').html(), 10);
		
	});
	
	$('#left-score').html(leftScore);
	$('#right-score').html(rightScore);
}

// step through each round, and highlight any negative scores in red
function highlightScores() {
	$('.editable.score').not('.bid').each(function() {
		var $that = $(this);
		if (parseInt($that.html(), 10) < 0) {
			$that.css('color', 'red');
		} else {
			$that.css('color', '');
		}
	});
}

// save the data back to the server
function saveScores(customMessage) {
	var successMessage = customMessage || "Game saved!";
	var data = {};
	var scores = [];
		
	// step through each round, and pack the info into the parameter object
	$('.round-container .round').each(function() {
		var $that = $(this);
		
		if (! $that.parent().is("#templates")) {
			scores.push({
				"left":  $that.find('.score.left').html(),
				"bid":   $that.find('.score.bid').html(),
				"right": $that.find('.score.right').html(),
				"bid-direction": $that.find('.icon-circle-arrow-left').is(".active") ? "left" : "right"
			});

		}					
	});
	
	// some additional parameters
	data.scores = scores;
	data.gameName = window.gameName;
	data.host = window.location.host;
	data.team1Name = $('#team-1-name').html();
	data.team2Name = $('#team-2-name').html();
	
	$.ajax({
		type: "POST",
		url: "save-game.php",
		data: data,
		success: function(data) {
			if (! (data.success)) {
				$("#error-message-container").html(data.message);
				$('#error-modal').modal('show');
			} else {
				writeMessage(successMessage, "green");
				window.gameHasBeenSaved = true;
			}
		},
		error: function(data) {
			if (data.message) {
				$("#error-message-container").html(data.message);
			} else {
				$("#error-message-container").html("An error occured while attempting to connect to the server.  Please try again.");
			}
			
			$('#error-modal').modal('show');
		},
		dataType: 'json'
	});
}

// load data from the server
function loadScores(customMessage) {
	var successMessage = customMessage || ("Game \"" + window.gameName + "\" loaded.");
	var data = {};
	data.gameName = window.gameName;
	data.host = window.location.host;
	
	$.ajax({
		type: "POST",
		url: "load-game.php",
		data: data,
		success: function(data) {
			if (! (data.success)) {
				$("#error-message-container").html(data.message);
				$('#error-modal').modal('show');
			} else {
				writeMessage(successMessage, "green");
				window.gameHasBeenSaved = true;
				var result = data.data;
				$('.round-container').html("");
				
				var teamNamesHaveBeenSet = false;
				
				// step through each entry in the return object, and populate the current scoresheet with the data
				result.forEach(function(element, index, array) {
					
					if (! teamNamesHaveBeenSet) {
						$('#team-1-name').html(element.team1Name);
						$('#team-2-name').html(element.team2Name);
						teamNamesHaveBeenSet = true;
					}
					
					var newRound = $('#templates .row.round').clone().css('display', 'none');
					newRound.find('.score.left').html(element.left);
					newRound.find('.score.bid').html(element.bid);
					newRound.find('.score.right').html(element.right);
					if (element.bidDirection === "right") {
						
						newRound.find('.bid-container i').toggleClass('active');
					}
					
					$('.round-container').append(newRound.css('display', ''));
				});
				
				recalculateScores();
				highlightScores();
			}
		},
		error: function(data) {
			if (data.message) {
				$("#error-message-container").html(data.message);
			} else {
				$("#error-message-container").html("An error occured while attempting to connect to the server.  Please try again.");
				//$("#error-message-container").html(JSON.stringify(data));
			}
			
			$('#error-modal').modal('show');
		},
		dataType: 'json'
	});
}

// checks a game name and returns whether or not it exists on the server
// if the name exists and which === 'save', this function returns false, otherwise it returns true
// if the name does NOT exists and which === 'load', this function returns false, otherwise it returns true
function checkForValidGameName(which) {
	window.nameIsValid = false;
	window.timeoutId = 0;
	var data = {};
	
	if (which === "save") {
		if (window.gameName === "") {
			window.gameName = $('#save-game-name').val();
		}	
	}
	
	data.gameName = (which === "save" ? window.gameName : $('#load-game-name').val());
	data.host = window.location.host;
	
	$.ajax({
		type: "POST",
		url: "check-name.php",
		data: data,
		success: function(data) {
			if (! (data.success)) {
				$("#error-message-container").html(data.message);
				$('.modal').modal('hide');
				$('#error-modal').modal('show');
			} else {
				if (data.nameIsValid) {
					window.nameIsValid = (which === "save");
				} else {
					window.nameIsValid = (! (which === "save"));
				}
				
				if (window.nameIsValid && which !== "save") { 
					window.gameName = $('#load-game-name').val();
				}
			}
		},
		error: function(data) {
			if (data.message) {
				$("#error-message-container").html(data.message);
			} else {
				$("#error-message-container").html("An error occured while attempting to connect to the server.  Please try again.");
			}
			
			$('#error-modal').modal('show');
		},
		dataType: 'json',
		async: false
	});
	
	return window.nameIsValid;
}

// change the game title to temporarily display a message in the specified color
function writeMessage(message, customColor) {
	var color = customColor || "green";
	
	$('#alert-title-container').stop().fadeOut(function() {
		$(this).html(message).css({
			color: color,
			fontSize: "25px"
		}).fadeIn();
		
		// set a timer to turn the message back to its original contents
		setTimeout(function() {
			$('#alert-title-container').fadeOut(function() {
				var returnText = (window.gameName === "" ? "Rookkeeper" : window.gameName);
				
				$(this).html(returnText).css({
					color: "black",
					fontSize: ""
				}).fadeIn();
			});
		}, 2000);
	});
}

// resets the auto-save timer (if the game has already been saved).  
// if this is called while a timer is active, the timer is reset for another 5 seconds
function resetAutoSaveTimer() {
	if (window.gameHasBeenSaved) {
		window.clearTimeout(window.timeoutId);
		window.timeoutId = window.setTimeout(function() {
			saveScores("All changes saved.");
		}, 5000);
	}
}

// gathers data and generates the Score by Round chart
function drawScoreByRoundChart() {
	var roundData = [['Round', $('#team-1-name').html(), 'bid', $('#team-2-name').html()]];
	
	var counter = 1;
	// step through each round, and pack it into a data object for the Google chart
	$('.round-container .round').each(function() {
		var $that = $(this); 
		roundData.push([
			counter, 
			parseInt($that.find('.score.left').html(), 10), 
			parseInt($that.find('.score.bid').html(), 10), 
			parseInt($that.find('.score.right').html(), 10)
		]);
		counter++;
	});
		
	var data = google.visualization.arrayToDataTable(roundData);

	var options = {
		title: 'Score by round',
		hAxis: {
			title: "Round"
		},
		vAxis: {
			title: "Score"
		}
	};

    var chart = new google.visualization.AreaChart(document.getElementById('score-by-round-chart'));
    chart.draw(data, options);
}

// gathers data and generates the Total Score chart
function drawTotalScoreChart() {
	var roundData = [['Round', $('#team-1-name').html(), 'bid', $('#team-2-name').html()]];
	
	var team1Score = 0;
	var team2Score = 0;
	
	var counter = 1;
	// step through each round, and pack it into a data object for the Google chart
	$('.round-container .round').each(function() {
		var $that = $(this); 
		roundData.push([
			counter, 
			team1Score += parseInt($that.find('.score.left').html(), 10), 
			parseInt($that.find('.score.bid').html(), 10), 
			team2Score += parseInt($that.find('.score.right').html(), 10)
		]);
		counter++;
	});
	
	var data = google.visualization.arrayToDataTable(roundData);

	var options = {
		title: 'Total score',
		hAxis: {
			title: "Round"
		},
		vAxis: {
			title: "Score"
		}
	};

    var chart = new google.visualization.LineChart(document.getElementById('total-score-chart'));
    chart.draw(data, options);
}

// gathers data and generates the Bid chart
function drawBidChart() {
	var team1Bids = 0;
	var team2Bids = 0;
	var team1Sets = 0;
	var team2Sets = 0;
	
	var $rounds = $('.round-container .round');
	
	// step through each round, and track who took the bid and 
	// whether they were successful is getting their bid
	$rounds.each(function() {
		var $that = $(this);
		if ($that.find('i.left').is('.active')) {
			team1Bids++;
			if (parseInt($that.find('.score.left').html(), 10) < 0) {
				team1Sets++;
			}
		} else {
			team2Bids++;
			if (parseInt($that.find('.score.right').html(), 10) < 0) {
				team2Sets++;
			}
		}
	});
	
	// pack the results in the data object for the Google chart
	var data = google.visualization.arrayToDataTable([
		['Team', 'Bids taken'],
		[$('#team-1-name').html(), team1Bids],
		[$('#team-2-name').html(), team2Bids]
	]);

	var options = {
		title: 'Bids taken by team',
		titleTextStyle: {
			fontSize: 14
		},
		legend: {
			position: 'top'
		},
		slices: {
			0: {color: '#383838'},
			1: {
				color: '#AAA',
				textStyle: {
					color: 'black'	
				}
			}
		}
	};

	// draw the chart that represents how many bids each team took
    var chart = new google.visualization.PieChart(document.getElementById('bid-chart-1'));
    chart.draw(data, options);
    
    var team1Data = google.visualization.arrayToDataTable([
		['Bid result', 'Successful Bids'],
		['Successful bids', team1Bids - team1Sets],
		['Failed bids', team1Sets]
	]);

	var team1Options = {
		title: 'Outcome of bids taken by ' + $('#team-1-name').html(),
		titleTextStyle: {
			fontSize: 14
		},
		legend: {
			position: 'top'
		},
		colors: ['green', 'red']
	};
	
	// draw the chart that represents how many bids team 1 took and won
    var team1Chart = new google.visualization.PieChart(document.getElementById('bid-chart-2'));
    team1Chart.draw(team1Data, team1Options);
    
    var team2Data = google.visualization.arrayToDataTable([
		['Bid result', 'Successful Bids'],
		['Successful bids', team2Bids - team2Sets],
		['Failed bids', team2Sets]
	]);

	var team2Options = {
		title: 'Outcome of bids taken by ' + $('#team-2-name').html(),
		titleTextStyle: {
			fontSize: 14
		},
		legend: {
			position: 'top'
		},
		colors: ['green', 'red']
	};

	// draw the chart that represents how many bids team 2 took and won
    var team2Chart = new google.visualization.PieChart(document.getElementById('bid-chart-3'));
    team2Chart.draw(team2Data, team2Options);
}

// gathers data and generates the Misc. table
function drawMiscellaneousChart() {
	// initialize all the various variables (names are self-explanatory)
	var team1AveragePointsPerRound = 0;
	var team2AveragePointsPerRound = 0;
	var bothAveragePointsPerRound = 0;
	
	var team1BidCount = 0;
	var team2BidCount = 0;
	
	var team1SetCount = 0;
	var team2SetCount = 0;
	
	var team1TotalBid = 0;
	var team2TotalBid = 0;
	
	var team1BestRound  = 0;
	var team2BestRound  = 0;
	var team1WorstRound = 180;
	var team2WorstRound = 180;
	
	var team1BidWinningRoundScoresArray = [];
	var team2BidWinningRoundScoresArray = [];
	var team1BidLosingRoundScoresArray  = [];
	var team2BidLosingRoundScoresArray  = [];
	var bothBidWinningRoundScoresArray  = [];
	var bothBidLosingRoundScoresArray   = [];
	
	var team1BidWinningRoundScores = 0;
	var team2BidWinningRoundScores = 0;
	var team1BidLosingRoundScores  = 0;
	var team2BidLosingRoundScores  = 0;
	var bothBidWinningRoundScores  = 0;
	var bothBidLosingRoundScores   = 0;
	
	
	var $round = $('.round-container .round'); 
	
	// step through each round
	$round.each(function() {
		var $that = $(this);
		var team1Score = parseInt($that.find('.score.left').html(), 10);
		var bid = parseInt($that.find('.score.bid').html(), 10);
		var team2Score = parseInt($that.find('.score.right').html(), 10);
		var bidDirection = $that.find('.bid-container i.left').is('.active') ? 'left' : 'right';
		team1AveragePointsPerRound += team1Score;
		team2AveragePointsPerRound += team2Score;
		bothAveragePointsPerRound += (team1Score + team2Score);
		
		if (bidDirection === "left") {
			// team 1 took the bid
			team1BidCount++;
			team1TotalBid += bid;
			if (team1Score < 0) { 
				// they were set
				team1SetCount++;
			}
			
			team1BidWinningRoundScoresArray.push(team1Score);
			team2BidLosingRoundScoresArray .push(team2Score);
			bothBidWinningRoundScoresArray .push(team1Score);
			bothBidLosingRoundScoresArray  .push(team2Score);
			
		} else {
			// team 2 took the bid
			team2BidCount++;
			team2TotalBid += bid;
			if (team2Score < 0) {
				// they were set
				team2SetCount++;
			}
			
			team2BidWinningRoundScoresArray.push(team2Score);
			team1BidLosingRoundScoresArray .push(team1Score);
			bothBidWinningRoundScoresArray .push(team2Score);
			bothBidLosingRoundScoresArray  .push(team1Score);
			
		}
		
		// figure out if any of the scores qualifies for a record
		if (team1Score > team1BestRound) {
			team1BestRound = team1Score;	
		}
		if (team2Score > team2BestRound) {
			team2BestRound = team2Score;	
		}
		if (team1Score < team1WorstRound) {
			team1WorstRound = team1Score;	
		}
		if (team2Score < team2WorstRound) {
			team2WorstRound = team2Score;	
		}
	});
	
	var team1AverageBid = 0, 
		team2AverageBid = 0, 
		bothAverageBid = 0;
	
	// compute average bids
	if ($round.size() > 0) {
		team1AverageBid = team1BidCount > 0 ? Math.round(team1TotalBid/team1BidCount) : "-"; 
		team2AverageBid = team2BidCount > 0 ? Math.round(team2TotalBid/team2BidCount) : "-";
	} else {
		team1AverageBid = "-";
		team2AverageBid = "-";
	}
	
	// step through each array, and add each item together
	team1BidWinningRoundScoresArray.forEach(function(element) {
		team1BidWinningRoundScores += element;
	});
	team1BidLosingRoundScoresArray.forEach(function(element) {
		team1BidLosingRoundScores += element;
	});
	team2BidWinningRoundScoresArray.forEach(function(element) {
		team2BidWinningRoundScores += element;
	});
	team2BidLosingRoundScoresArray.forEach(function(element) {
		team2BidLosingRoundScores += element;
	});
	bothBidWinningRoundScoresArray.forEach(function(element) {
		bothBidWinningRoundScores += element;
	});
	bothBidLosingRoundScoresArray.forEach(function(element) {
		bothBidLosingRoundScores += element;
	});
	
	// figure out the averages
	team1BidWinningRoundScores = Math.round(team1BidWinningRoundScores / team1BidWinningRoundScoresArray.length);
	team2BidWinningRoundScores = Math.round(team2BidWinningRoundScores / team2BidWinningRoundScoresArray.length);
	team1BidLosingRoundScores  = Math.round(team1BidLosingRoundScores  / team1BidLosingRoundScoresArray.length);
	team2BidLosingRoundScores  = Math.round(team2BidLosingRoundScores  / team2BidLosingRoundScoresArray.length);
	bothBidWinningRoundScores  = Math.round(bothBidWinningRoundScores  / bothBidWinningRoundScoresArray.length);
	bothBidLosingRoundScores   = Math.round(bothBidLosingRoundScores   / bothBidLosingRoundScoresArray.length);
	
	// take any results that errored out (resulted in NaN) and replace them with a '-' symbol
	if (isNaN(team1BidWinningRoundScores)) team1BidWinningRoundScores = "-";
	if (isNaN(team1BidLosingRoundScores))  team1BidLosingRoundScores  = "-";
	if (isNaN(team2BidWinningRoundScores)) team2BidWinningRoundScores = "-";
	if (isNaN(team2BidLosingRoundScores))  team2BidLosingRoundScores  = "-";
	if (isNaN(bothBidWinningRoundScores))  bothBidWinningRoundScores  = "-";
	if (isNaN(bothBidLosingRoundScores))   bothBidLosingRoundScores   = "-"; 
	
	// if team1AverageBid and team2AverageBid are real numbers, find the bothAverageBid
	// by taking the average of both
	if (team1AverageBid !== "-" && team2AverageBid !== "-") {
		bothAverageBid = Math.round((team1AverageBid + team2AverageBid) / 2);
	} else {
		bothAverageBid = "-";
	}
	
	team1AveragePointsPerRound = Math.round(team1AveragePointsPerRound / $round.size());
	team2AveragePointsPerRound = Math.round(team2AveragePointsPerRound / $round.size());
	bothAveragePointsPerRound  = Math.round(bothAveragePointsPerRound / ($round.size() * 2));
	
	var bothBestRound = team1BestRound > team2BestRound ? team1BestRound : team2BestRound;
	var bothWorstRound = team1WorstRound < team2WorstRound ? team1WorstRound : team2WorstRound;
	
	// generate the HTML string that will make the table
	var newHtml = 
		"		<table class='table table-striped' id='averages-table'>"
		+ "			<thead>"
		+ "				<tr>"
		+ "					<th></th>"
		+ "					<th>Average points/round</th>"
		+ "					<th>Average bid</th>"
		+ "					<th><div class='tooltipped' data-placement='top' title='the average number of points scored in any round in which the bid was won'>Average points/bid winning round</div></th>"
		+ "					<th><div class='tooltipped' data-placement='top' title='the average number of points scored in any round in which the bid was lost'</div>Average points/bid losing round</th>"
		+ "					<th><div class='tooltipped' data-placement='top' title='the most amount of points scored in any single round'>Best round</div></th>"
		+ "					<th><div class='tooltipped' data-placement='top' title='the least amount of points scored in any single round'>Worst round</div></th>"
		+ "				</tr>"
		+ "			</thead>"
		+ "			<tbody>"
		+ "				<tr>"
		+ "					<td><b>" + $('#team-1-name').html() + "</b></td>"
		+ "					<td>" + team1AveragePointsPerRound + "</td>"
		+ "					<td>" + team1AverageBid + "</td>"
		+ "					<td>" + team1BidWinningRoundScores + "</td>"
		+ "					<td>" + team1BidLosingRoundScores + "</td>"
		+ "					<td>" + team1BestRound + "</td>"
		+ "					<td>" + team1WorstRound + "</td>"
		+ "				</tr>"
		+ "				<tr>"
		+ "					<td><b>" + $('#team-2-name').html() + "</b></td>"
		+ "					<td>" + team2AveragePointsPerRound + "</td>"
		+ "					<td>" + team2AverageBid + "</td>"
		+ "					<td>" + team2BidWinningRoundScores + "</td>"
		+ "					<td>" + team2BidLosingRoundScores + "</td>"
		+ "					<td>" + team2BestRound + "</td>"
		+ "					<td>" + team2WorstRound + "</td>"
		+ "				</tr>"
		+ "				<tr>"
		+ "					<td><b>Overall</b></td>"
		+ "					<td>" + bothAveragePointsPerRound + "</td>"
		+ "					<td>" + bothAverageBid + "</td>"
		+ "					<td>" + bothBidWinningRoundScores + "</td>"
		+ "					<td>" + bothBidLosingRoundScores + "</td>"
		+ "					<td>" + bothBestRound + "</td>"
		+ "					<td>" + bothWorstRound + "</td>"
		+ "				</tr>"
		+ "			</tbody>"
		+ "		</table>";
		
		// place the table inside its container
		$('#miscellaneous-chart').html(newHtml).find('.tooltipped').tooltip();
}