Currently the nodejs library only supports oAuth authentication use Adal.js for Node to get an access token for real applications or https://xrm.tools/AccessToken for testing

#Getting Started

````
npm install CRMWebAPI
````

# Usage example
You can find other query example information [here](https://github.com/davidyack/Xrm.Tools.CRMWebAPI/wiki/Query-Examples )

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
