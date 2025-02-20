<?php
// Database configuration parameters
$dbHost = '127.0.0.1';
$dbUser = 'accountName';
$dbPass = 'password';

$GLOBALS['dbConn'] = @odbc_connect("Driver={SQL Server};Server={$GLOBALS['dbHost']};",$GLOBALS['dbUser'],$GLOBALS['dbPass']) or die('Database Connection Error!');
if(!$GLOBALS['dbConn']){
	exit("Connection failed:".odbc_errormsg());
}
?>