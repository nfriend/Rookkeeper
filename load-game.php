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
	
	$table = array();
	
	// get the requested game	
	$query = "CALL fetch_game('" . $mysqli->real_escape_string($_POST['gameName']) . "')";
	
	if ($result = $mysqli->query($query)) {
	    // the query was successful	
	    
	    // pack the result of the query into a two dimensional array
	    while ($row = $result->fetch_assoc()) {
	    	$table[] = $row;
	    }
		
		$mysqli->close();
		
		$response = array(
			"success" => true,
			"data" => $table
		);
	} else {
		// an error occured while querying the database	
		echo json_encode(array(
			"success" => false,
			"message" => "An error occured while attempting to write to the database: " . $mysqli->connect_error
		));
	}
}

// send the response to the client
echo json_encode($response);

?>
