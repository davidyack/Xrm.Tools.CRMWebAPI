# Usage example

```javascript
var CRMWebAPI = require('CRMWebAPI');

var apiconfig = { APIUrl: 'https://orgname.crm.dynamics.com/api/data/v8.0/', AccessToken: "<accesstoken>" };

var crmAPI = new CRMWebAPI(apiconfig);

crmAPI
	.Create("accounts", { "name": "test2" })
		.then(
			function(r){
				console.log('Created: ' + r);
				return crmAPI.Update('accounts', r, { "name": "test2updated"});
			}, 
			function(e){
				console.log(e);
			})
		.then(
			function(r){
				console.log('Updated: ' + r.EntityID);
				return crmAPI.Delete('accounts', r.EntityID);
			}, 
			function(e){
				console.log(e);
			})
		.then(
			function(r){
				console.log('Deleted');
			}, function(e){
				console.log(e);
		})
```
