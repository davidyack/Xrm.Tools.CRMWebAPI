
var CRMWebAPI = require('CRMWebAPI');
var adal = require('adal-node');

function _authenticate(server,user,password)
{
  return new Promise(function (resolve, reject) {
    
    var  authorityHostUrl = 'https://login.windows.net/common';
    var  clientId = 'your client id here';

    var context = new  adal.AuthenticationContext(authorityHostUrl);
    
    context.acquireTokenWithUsernamePassword(server, user, password, clientId, function(err, tokenResponse) {
        if (err) { reject(err);} else {    
            resolve(tokenResponse.accessToken);
        }
    });
  });
}
        
var server = 'https://orgname.crm.dynamics.com';
_authenticate(server,'admin@<orgname>.onmicrosoft.com','your password').then(function(accessToken) {

    var apiconfig = { APIUrl:  server+'/api/data/v8.1/', AccessToken: accessToken };

    var crmAPI = new CRMWebAPI(apiconfig);

    var params = {
               "Country":'US' ,
               "Amount": 500
           };

    crmAPI.ExecuteAction("xt_CalculateDiscount", params).then(function(r){
               console.log(r);
           }, function(e){
              console.log(e);
           });
});

