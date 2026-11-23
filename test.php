<?php

function login($username, $password) {
    // Configuration
    $db_host = 'localhost';
    $db_username = getenv('DB_USERNAME');
    $db_password = getenv('DB_PASSWORD');
    $db_name = 'arnicaTest';


    // Connect to database
    $conn = new mysqli($db_host, $db_username, $db_password, $db_name);

    // Check connection
    if ($conn->connect_error) {
        die("Connection failed: ". $conn->connect_error);
    }

    // admin
    // gdhas' OR 1=1 #

    // Query database
    $query = "SELECT * FROM users WHERE username = '$username' AND password = '$password'";

    $result = $conn->query($query);

    // Check if user exists
    if ($result->num_rows > 0) {
        echo "Welcome, $username!";
    } else {
        echo "$query Invalid username or password.";
    }

    // Close connection
    $conn->close();
}<?php


$username = $_POST['username'];
$password = $_POST['password'];
login($username, $password);
?>
