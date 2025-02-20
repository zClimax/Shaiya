<?php
require_once('recaptchalib.config.php');
require_once('recaptchalib.php');
require_once('db.config.php');

$user_ip = $_SERVER['REMOTE_ADDR'];
$username = isset($_POST['username']) ? trim($_POST['username']) : '';
$password = isset($_POST['password']) ? trim($_POST['password']) : '';
$password2 = isset($_POST['password2']) ? trim($_POST['password2']) : '';
$errors = array();
$success = false;

// Process the POST data.
if(isset($_POST) && !empty($_POST)){
	// Validate user name.
	if(empty($username)){
		$errors[] = 'Please provide a user name.';
	}else if(strlen($username) < 3 || strlen($username) > 16){
		$errors[] = 'User name must be between 3 and 16 characters in length.';
	}else if(ctype_alnum($username) === false){
		$errors[] = 'User name must consist of numbers and letters only.';
	}else{
		// Check if username already exists in the database.
		$sql = "SELECT UserID FROM PS_UserData.dbo.Users_Master WHERE UserID = ?";
		$stmt = odbc_prepare($GLOBALS['dbConn'],$sql);
		$args = array($username);
		if(!odbc_execute($stmt,$args)){
			$errors[] = 'Failed to determine if this username already exists in the database.';
		}elseif($row = odbc_fetch_array($stmt)){
			$errors[] = 'User name already exists, please choose a different user name.';
		}
	}
	
	// Validate user password.
	if(empty($password)){
		$errors[] = 'Please provide a password.';
	}else if(strlen($password) < 3 || strlen($password) > 16){
		$errors[] = 'Password must be between 3 and 16 characters in length.';
	}else if($password != $password2){
		$errors[] = 'Passwords do not match.';
	}
	
	// Validate reCAPTCHA.  This is to prevent someone botting account creation.
	$response = recaptcha_check_answer($recaptcha_private_key,$_SERVER['REMOTE_ADDR'],$_POST['recaptcha_challenge_field'],$_POST['recaptcha_response_field']);
	if(!$response->is_valid){
		if($response->error == 'incorrect-captcha-sol'){
			$errors['recaptcha'] = 'Incorrect answer to reCAPTCHA';
		}else{
			$errors['recaptcha'] = $response->error;
		}
	}
	
	// Persist the new account to the database if no previous errors occured.
	if(count($errors) == 0){
		$sql = "INSERT INTO PS_UserData.dbo.Users_Master
				(UserID,Pw,JoinDate,Admin,AdminLevel,UseQueue,Status,Leave,LeaveDate,UserType,Point,EnPassword,UserIp)
				VALUES (?,?,GETDATE(),0,0,0,0,0,GETDATE(),'N',0,'',?)";
		$stmt = odbc_prepare($GLOBALS['dbConn'],$sql);
		$args = array($username,$password,$user_ip);
		if(odbc_execute($stmt,$args)){
			$success = htmlentities("Account {$username} successfully created!");
		}else{
			// This means the insert statement is probably not valid for your database.  Fix the query or fix your database, your choice ;)
			$errors[] = 'Failed to create a new account, please try again later';
		}
	}
}
// Determine which view to show.
if($success === false){
	require_once('register.view.php');
}else{
	require_once('success.view.php');
}
?>