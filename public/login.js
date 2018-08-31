'use strict';

let JWT = '';

//--------------------------------------------
function loginUser(username, password) {
  const settings = {
    url: 'api/auth/login/',
    method: 'POST',
    dataType: 'json',
    contentType: 'application/json',
    data: JSON.stringify({
      username: username,
      password: password
    }),
    success: function(res) {
      console.log(res);
      JWT = res;
    },
    error: function() {
      console.log('Login Failed!');
    }
  };
  console.log(settings.data);
  $.ajax(settings);
}
//--------------------------------------------
function listen() {
  $('#login-form').submit(event => {
    event.preventDefault();
    console.log('clicked');
    loginUser(
      $('#login-username').val(),
      $('#login-password').val()
    );
  });
}
//--------------------------------------------
$(window).on('load', function() {
  listen();
});