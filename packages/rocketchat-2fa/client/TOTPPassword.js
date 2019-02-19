import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { modal } from 'meteor/rocketchat:ui-utils';
import { t } from 'meteor/rocketchat:utils';
import toastr from 'toastr';
import axios from 'axios';
import { Session } from 'meteor/session';


function reportError(error, callback) {
	if (callback) {
		callback(error);
	} else {
		throw error;
	}
}

Meteor.loginWithPasswordAndTOTP = function(selector, password, code, callback) {
	if (typeof selector === 'string') {
		if (selector.indexOf('@') === -1) {
			selector = { username: selector };
		} else {
			selector = { email: selector };
		}
	}

	Accounts.callLoginMethod({
		methodArguments: [{
			totp: {
				login: {
					user: selector,
					password: Accounts._hashPassword(password),
				},
				code,
			},
		}],
		userCallback(error) {
			if (error) {
				reportError(error, callback);
			} else {
				callback && callback();
			}
		},
	});
};

const { loginWithPassword } = Meteor;

Meteor.loginWithPassword = function(email, password, cb) {

	loginWithPassword(email, password, (error) => {
		console.log("inside loginWithPassword");
		if (!error || error.error !== 'totp-required') {

			return cb(error);
				console.log("error val is",error);
		}

		modal.open({
			title: t('Two-factor_authentication'),
			text: t('Open_your_authentication_app_and_enter_the_code'),
			type: 'input',
			inputType: 'text',
			showCancelButton: true,
			closeOnConfirm: true,
			confirmButtonText: t('Verify'),
			cancelButtonText: t('Cancel'),
		}, (code) => {
			if (code === false) {
				return cb();
			}

			Meteor.loginWithPasswordAndTOTP(email, password, code, (error) => {
				if (error && error.error === 'totp-invalid') {
					toastr.error(t('Invalid_two_factor_code'));
					cb();
				} else {
					cb(error);
				}
			});
		});
	});
};

const { loginWithMobileNumber } = Meteor;
Meteor.loginWithMobileNumber = function(mobile_number,cb) {
	const url = `http://35.200.136.212:80/api/v1/users.register`;
	var xhr = new XMLHttpRequest();
	xhr.open('POST', url, true);
	xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
	xhr.onload = function () {
		  var res = xhr.response;
			console.log("response val is",res);
			if(res.success = true){
		  modal.open({
					title: t('Two-factor_authentication'),
					text: t('Enter the otp send to your mobile'),
					type: 'input',
					inputType: 'text',
					showCancelButton: true,
					closeOnConfirm: true,
					confirmButtonText: t('Verify'),
					cancelButtonText: t('Cancel'),
				}, (code) => {
					if (code === false) {
						return cb();
					}else{
						loginWithPassword('username', 'password', (error) => {
								if (!error || error.error !== 'totp-required') {
									return cb(error);
								}
						});
					}
				});
				setTimeout(function(){
		     	modal.close();
	      }, 120000)
			}
	};
	xhr.send("contact="+mobile_number);
};
