'use strict';
var CRMWebAPI;
CRMWebAPI = function (config) {
	
	
	CRMWebAPI.prototype.GetList = function (uri,QueryOptions) {
   	
	   return new Promise(function(resolve, reject) {

		var url = config.APIUrl + uri;
	
		var req = CRMWebAPI.prototype._GetHttpRequest(config,"GET",url);
		
		req.onreadystatechange = function () {
			if (this.readyState == 4 /* complete */) {
				req.onreadystatechange = null;
				if (this.status == 200) 				
				{
					var data = JSON.parse(this.response, CRMWebAPI.prototype._DateReviver)
					var response = {
                        List: data.value,
						Count: 0        
              		};
					resolve(response);
				}
				else 
					reject(this);				
			}
		};
		req.send();
		
	   });
    };
	
	CRMWebAPI.prototype._GetHttpRequest = function (config,method,url) {
		var req = new XMLHttpRequest();
		req.open(method, encodeURI(url), true);
		req.setRequestHeader("Authorization", "Bearer "+ config.AccessToken);
		req.setRequestHeader("Accept", "application/json");
		if (config.callerId) {
		req.setRequestHeader("MSCRMCallerID", config.callerId);
		}
		req.setRequestHeader("OData-MaxVersion", "4.0");
		req.setRequestHeader("OData-Version", "4.0");
		
		return req;
	}
	
	CRMWebAPI.prototype._DateReviver = function (key, value)
	{
		var a;
		if (typeof value === 'string') {
		a = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
		if (a) {
			return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4], +a[5], +a[6]));
		}
		}
		return value;	
	};
};