<?php

// suppress error reporting 
error_reporting(0);

// if we're running locally, connect to the local database.  otherwise connect to the server's local database
if ($_POST['host'] === 'localhost' || $_POST['host'] === '127.0.0.1') {
	$mysqli = new mysqli("127.0.0.1", "root", "password", "rookkeeper");	
} else {
	$mysqli = new mysqli("127.0.0.1", "rookkeeperuser", "scoresandstuff", "rookkeeper");	
}

// the object used to send the response back to the client
$response = array();

if ($mysqli->connect_errno) {
	// if there was an error in connecting to the database	
			
	$response = array(
		"success" => false,
		"message" => "Failed to connect to database: " . mysqli_connect_error()
	);
} else {
	// the connection to the db was successful
	
	// begin transaction
	$mysqli->autocommit(false);
	
	$roundIds = array();
	
	// delete all previously existing records associated with this game name
	executeQuery($mysqli, "CALL delete_game('" . $mysqli->real_escape_string($_POST['gameName']) . "')", false);
	
	// create (or recreate) the game
	$gameId = executeQuery($mysqli, "CALL create_game('" . $mysqli->real_escape_string($_POST['gameName']) . "', '"
		. $mysqli->real_escape_string($_POST['team1Name']) . "', '"
		. $mysqli->real_escape_string($_POST['team2Name']) . "')", true);
	
	// step through each round, and save it in the round table
	foreach ($_POST['scores'] as $round) {
		$roundIds[] = executeQuery($mysqli, "CALL create_round('" . $mysqli->real_escape_string($round['left']) . "', '"
			. $round['bid'] . "', '"
			. $round['right'] . "', '"
			. $round['bid-direction'] . "')", true);
	}
	
	// associate each round with the game name
	$counter = 0;
	foreach ($roundIds as $id) {
		executeQuery($mysqli, "CALL associate('" . $gameId . "', '" . $id . "', '" . $counter . "')", false);
		$counter++;
	}
	
	$response = array(
		"success" => true
	);
	
	// commit the transaction
	$mysqli->commit();

}

// send the response array back to the client
echo json_encode($response);

// execute the given query, and handle any errors that result
function executeQuery($mysqliObject, $queryString, $returnAValue) {
	if ($stmt = $mysqliObject->prepare($queryString)) {
	    // the statement was prepared successfully
	    	
	    $stmt->execute();
		$stmt->store_result();
		if (is_null($returnAValue) || $returnAValue) {
			$stmt->bind_result($lastInsertId);
			$stmt->fetch();
			$stmt->close();
			$mysqliObject->next_result();
			return $lastInsertId;
		}
		$mysqliObject->next_result();
		$stmt->close();
	} else {
		// the statement was not prepared successfully
		
		echo json_encode(array(
			"success" => false,
			"message" => "An error occured while attempting to write to the database: " . $mysqliObject->connect_error
		));
	}
}

?>
