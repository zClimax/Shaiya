<?php
require_once('recaptchalib.config.php');
require_once('recaptchalib.php');
require_once('db.config.php');

$username = isset($_POST['username']) ? trim($_POST['username']) : '';
$password = isset($_POST['password']) ? trim($_POST['password']) : '';
$newpassword = isset($_POST['newpassword']) ? trim($_POST['newpassword']) : '';
$newpassword2 = isset($_POST['newpassword2']) ? trim($_POST['newpassword2']) : '';
$errors = array();
$success = false;
if(isset($_POST) && !empty($_POST)){
	// Validate new passwords.
	if(empty($newpassword)){
		$errors[] = 'Please provide a new password.';
	}else if(strlen($newpassword) < 3 || strlen($newpassword) > 16){
		$errors[] = 'New password must be between 3 and 16 characters in length.';
	}else if($newpassword != $newpassword2){
		$errors[] = 'New passwords do not match.';
	}else{
		// Validate user name and password.
		$sql = "SELECT UserID FROM PS_UserData.dbo.Users_Master WHERE UserID = ? AND Pw = ?";
		$stmt = odbc_prepare($GLOBALS['dbConn'],$sql);
		$args = array($username,$password);
		if(!odbc_execute($stmt,$args)){
			$errors[] = 'Failed to validate the user credentials against the database.';
		}elseif(!$row = odbc_fetch_array($stmt)){
			$errors[] = 'Invalid user name and/or password.';
		}
	}
	// Validate reCAPTCHA.  This is to prevent someone brute force guessing passwords with a bot.
	$response = recaptcha_check_answer($recaptcha_private_key,$_SERVER['REMOTE_ADDR'],$_POST['recaptcha_challenge_field'],$_POST['recaptcha_response_field']);
	if(!$response->is_valid){
		if($response->error == 'incorrect-captcha-sol'){
			$errors['recaptcha'] = 'Incorrect answer to reCAPTCHA';
		}else{
			$errors['recaptcha'] = $response->error;
		}
	}
	// Persist the new password to the database if no previous errors occured.
	if(count($errors) == 0){
		$sql = "UPDATE PS_UserData.dbo.Users_Master
				SET Pw = ?
				WHERE UserID = ?";
		$stmt = odbc_prepare($GLOBALS['dbConn'],$sql);
		$args = array($newpassword,$username);
		if(!odbc_execute($stmt,$args)){
			$errors[] = 'Failed to change password, please try again later';
		}else{
			$success = htmlentities("Password for {$username} successfully changed!");
		}
	}
}
// Determine which view to show.
if($success === false){
	require_once('changepass.view.php');
}else{
	require_once('success.view.php');
}
?>