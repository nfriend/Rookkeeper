<?php

// suppress error reporting 
error_reporting(0);

// if we're running locally, connect to the local database.  otherwise connect to the server's local database
if ($_POST['host'] === 'localhost' || $_POST['host'] === '127.0.0.1') {
	$mysqli = new mysqli("127.0.0.1", "root", "password", "rookkeeper");	
} else {
	$mysqli = new mysqli("127.0.0.1", "rookkeeperuser", "scoresandstuff", "rookkeeper");	
}

if (mysqli_connect_errno()) {
	// if there was an error in connecting to the database	
    	
	// the object used to send the response back to the client	
    $response = array(
		"success" => false,
		"message" => "Failed to connect to database: " . mysqli_connect_error()
	);
} else {
	// the connection to the db was successful
	
	// test if the name already exists in the database
	$query = "SELECT * FROM name WHERE name LIKE '" . $mysqli->real_escape_string($_POST['gameName']) . "'";
	
	if ($stmt = $mysqli->prepare($query)) {
	    // the statement was prepared successfully
	    $stmt->execute();
	    $stmt->store_result();
	    
	    if ($stmt->num_rows > 0) {
	    	// the name already exists in the database
	    	$response = array(
				"success" => true,
				"nameIsValid" => false
			);
	    } else {
	    	// the name does not exist in the database
	    	$response = array(
				"success" => true,
				"nameIsValid" => true
			);
	    }
	    $stmt->close();
	} else {
		// the statement was not prepared successfully
		$response = array(
			"success" => false,
			"message" => "something went wrong."
		);
	}
}

$mysqli->close();

// send the response to the client
echo json_encode($response);

?>
