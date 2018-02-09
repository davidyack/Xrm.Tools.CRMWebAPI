var CRMWebAPI = require('../../lib/CRMWebAPI');

var server = 'https://rctrdevcrm.regent.edu/CRMRECRUITTEST';

var apiconfig = {
  APIUrl: server + '/api/data/v8.1/',
  ntlm: {
    username: 'user1',
    password: 'mypass',
    domain: 'MYDOMAIN',
    workstation: process.env.COMPUTERNAME
  }
};

var crmAPI = new CRMWebAPI(apiconfig);

crmAPI.ExecuteFunction('WhoAmI').then(function (x) {
  console.log('WhoAmI Response', x, '\n');
});

var record = {
  firstname: 'foo',
  lastname: 'bar',
  emailaddress1: 'foo@bar.com'
}

var entityCol = 'contacts';
var id;
crmAPI.Create(entityCol, record).then(function (_id) {
  console.log('Contact Created: ID ' + _id);
  id = _id;
}).then(function () {
  return crmAPI.Update(entityCol, id, {
    lastname: 'baz'
  })
}).then(function () {
  return crmAPI.Get('contacts', id, {})
}).then(function (value) {
  console.log('Contact Record retrieved', value);
  return crmAPI.Delete(entityCol, id);
}).then(function () {
  console.log('Contact Record deleted.')
  }, console.log);
