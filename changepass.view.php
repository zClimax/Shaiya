<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
	<head>
		<title>Shaiya Generic Change Password Page</title>
		<meta http-equiv="content-type" content="text/html;charset=utf-8" />
		<meta http-equiv="Content-Style-Type" content="text/css" />
		<style type="text/css">#error {color:#ff0000; list-style:none;}</style>
		<script type="text/javascript">var RecaptchaOptions = {theme:'clean'};</script>
	</head>
	<body>
		<h3>Change Password</h3>
		<?php if(count($errors)){ ?>
			<ul id="error">
			<?php foreach($errors as $error){ ?>
				<li><?php echo $error; ?></li>
			<?php } ?>
			</ul>
		<?php } ?>
		<form action="changepass.php" method="post">
			<div style="width:436px; border:1px solid #000000; padding:16px;">
				User Name
				<input name="username" value="<?php if(isset($_POST['username'])){ echo $_POST['username']; } ?>" style="width:100%;" />
				<div style="height: 5px;">&nbsp;</div>
				Current Password							
				<input name="password" type="password" value="<?php if(isset($_POST['password'])){ echo $_POST['password']; } ?>" style="width:100%;" />
				<div style="height: 5px;">&nbsp;</div>
				New Password							
				<input name="newpassword" type="password" value="<?php if(isset($_POST['newpassword'])){ echo $_POST['newpassword']; } ?>" style="width:100%;" />
				<div style="height: 5px;">&nbsp;</div>
				Confirm Password							
				<input name="newpassword2" type="password" value="<?php if(isset($_POST['newpassword2'])){ echo $_POST['newpassword2']; } ?>" style="width:100%;" />
				<div style="height: 5px;">&nbsp;</div>
				Please type this in the text box below to prove you are human
				<?php echo recaptcha_get_html($recaptcha_public_key); ?>
				<div style="height: 5px;">&nbsp;</div>
				<input type="submit" value="Change Password" />
			</div>
		</form>
	</body>
</html>