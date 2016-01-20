'use strict';
var https = require('https');
var urllib = require('url');
var CRMWebAPI;
CRMWebAPI = function (config) {
  CRMWebAPI.prototype.GetList = function (uri, QueryOptions) {
    return new Promise(function (resolve, reject) {
      var url = CRMWebAPI.prototype._BuildQueryURL(uri, QueryOptions, config);
      CRMWebAPI.prototype._GetHttpRequest(config, "GET", url, {}, function (err, res) {
        if (err != false) {
          reject(res);
        } else {
          var data = JSON.parse(res.response, CRMWebAPI.prototype._DateReviver);
          var response = {
            List: data.value,
            Count: 0
          };
          resolve(response);
        }
      });
    });
  };
  CRMWebAPI.prototype.Get = function (entityCollection, entityID, QueryOptions) {
    return new Promise(function (resolve, reject) {
      var url = CRMWebAPI.prototype._BuildQueryURL(entityCollection + "(" + entityID.toString() + ")", QueryOptions, config);
      CRMWebAPI.prototype._GetHttpRequest(config, "GET", url, {}, function (err, res) {
        if (err != false) {
          reject(res);
        } else {
          var data = JSON.parse(res.response, CRMWebAPI.prototype._DateReviver)
          resolve(data);
        }
      });
    });
  };
  CRMWebAPI.prototype.GetCount = function (uri, QueryOptions) {
    return new Promise(function (resolve, reject) {
      var url = CRMWebAPI.prototype._BuildQueryURL(uri + "/$count", QueryOptions, config);
      CRMWebAPI.prototype._GetHttpRequest(config, "GET", url, {}, function (err, res) {
        if (err != false) {
          reject(res);
        } else {
          var data = parseInt(res.response);
          resolve(data);
        }
      });
    });
  };
  CRMWebAPI.prototype.Create = function (entityCollection, data) {
    return new Promise(function (resolve, reject) {
      var url = config.APIUrl + entityCollection;
      CRMWebAPI.prototype._GetHttpRequest(config, "POST", url, {
        'data': JSON.stringify(data)
      }, function (err, res) {
        if (err != false) {
          reject(res);
        } else {
          resolve(/\(([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\)/g.exec(res.headers["odata-entityid"])[1]);
        }
      });
    });
  };
  CRMWebAPI.prototype.Update = function (entityCollection, key, data, Upsert) {
    return new Promise(function (resolve, reject) {
      var url = config.APIUrl + entityCollection +'(' + key +')';
      var payload = {
        "data": JSON.stringify(data),
        "headers": {}
      }
      if (Upsert != null && Upsert == true) payload["headers"]["If-Match"] = "*";
      CRMWebAPI.prototype._GetHttpRequest(config, "POST", url, payload, function (err, res) {
        if (err != false) {
          reject(res);
        } else {
          var response = {
            EntityID: /\(([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\)/g.exec(res.headers["odata-entityid"])[1]
          };
          resolve(response);
        }
      });
    });
  };
  CRMWebAPI.prototype.Delete = function (entityCollection, entityID) {
    return new Promise(function (resolve, reject) {
      var url = config.APIUrl +entityCollection+'('+entityID+')';
      CRMWebAPI.prototype._GetHttpRequest(config, "DELETE", url, {}, function (err, res) {
        if (err != false) {
          reject(res);
        } else {
          resolve();
        }
      });
    });
  };
  CRMWebAPI.prototype.ExecuteFunction = function (functionName, parameters, entityCollection, entityID) {
    return new Promise(function (resolve, reject) {
      var parmvars = [];
      var parmvalues = [];
      var parmcount = 1;
      if (parameters != null) {
        Object.keys(parameters).forEach(function (key) {
          var val = parameters[key];
          parmvars.push(key + "=" + "@p" + parmcount.toString());
          if (typeof val === 'string' || val instanceof String) parmvalues.push("@p" + parmcount.toString() + "='" + val + "'");
          else parmvalues.push("@p" + parmcount.toString() + "=" + val);
          parmcount++;
        });
      }
      var url = "";
      if (parameters != null) {
        url = config.APIUrl + functionName + "(" + parmvars.join(",") + ")?" + parmvalues.join("&");
        if (entityCollection != null) url = config.APIUrl + entityCollection + "(" + entityID.toString() +")" + functionName + "(" + parmvars.join(",") + ")?" + parmvalues.join("&");
      } else {
        url = config.APIUrl + functionName + "()";
        if (entityCollection != null) url = config.APIUrl + entityCollection + "(" + entityID.toString() +")" + functionName + "()";
      }
      CRMWebAPI.prototype._GetHttpRequest(config, "GET", url, {}, function (err, res) {
        if (err != false) {
          reject(res);
        } else {
          var data = JSON.parse(res.response, CRMWebAPI.prototype._DateReviver)
          resolve(data);
        }
      });
    });
  };
  CRMWebAPI.prototype.ExecuteAction = function (actionName, data, entityCollection, entityID) {
    return new Promise(function (resolve, reject) {
      var url = config.APIUrl + actionName;
      if (entityCollection != null) url = config.APIUrl + entityCollection + "(" + entityID.toString() + ")" + actionName;
      CRMWebAPI.prototype._GetHttpRequest(config, "POST", url, {
        "data": JSON.stringify(data)
      }, function (err, res) {
        if (err != false) {
          reject(res);
        } else {
          var data = JSON.parse(res.response, CRMWebAPI.prototype._DateReviver)
          resolve(data);
        }
      });
    });
  };
  CRMWebAPI.prototype._BuildQueryURL = function (uri, queryOptions, config) {
    CRMWebAPI.prototype._BuildQueryURL = function (uri, queryOptions, config) {
	var fullurl = config.APIUrl + uri;
	var qs = [];
	
	if (queryOptions != null) {
		if (queryOptions.Select != null) qs.push("$select=" + queryOptions.Select.join(","));
		if (queryOptions.OrderBy != null) qs.push("$orderby=" + queryOptions.OrderBy.join(","));
		if (queryOptions.Filter != null) qs.push("$filter=" + queryOptions.Filter);
		if (queryOptions.IncludeCount) qs.push("$count=true");
		if (queryOptions.Skip > 0) qs.push("skip=" + queryOptions.Skip);
		if (queryOptions.Top > 0) qs.push("$top=" + queryOptions.Top);
		if (queryOptions.SystemQuery != null) qs.push("savedQuery=" + queryOptions.SystemQuery);
		if (queryOptions.UserQuery != null) qs.push("userQuery=" + queryOptions.UserQuery);
		if (queryOptions.FetchXml != null)  qs.push("fetchXml=" + encodeURI(queryOptions.FetchXml));
	}
	if (qs.length > 0) fullurl += "?" + qs.join("&")
	return fullurl;
};

  };
  CRMWebAPI.prototype._GetHttpRequest = function (config, method, url, payload, callback) {
    var parsed_url = urllib.parse(url);
    var options = {
      hostname: parsed_url.hostname,
      port: 443,
      path: parsed_url.path,
      method: method,
      headers: {
        "Accept": "application/json",
        "OData-MaxVersion": "4.0",
        "OData-Version": "4.0",
      }
    }
    if (method == 'POST') {
      options.headers['Content-Length'] = payload.data.length;
      options.headers['Content-Type'] = 'application/json';
    }
    if (config.callerId) options.headers["MSCRMCallerID"] = config.callerId;
    if (config.AccessToken != null) options.headers["Authorization"] = "Bearer " + config.AccessToken;
    if (payload.headers != undefined) {
      for (var name in payload.headers) {
        options.headers[name] = payload.headers[name];
      }
    }
    var req = https.request(options, function (res) {
      var body = '';
      res.setEncoding('utf8');
      res.on('data', function (chunk) {
        body += chunk;
      })
      res.on('end', function () {
        if ((res.statusCode >= 200)&&(res.statusCode < 300)) {
          callback(false, {
            'response': body,
            'headers': res.headers
          });
        } else {
          callback(true, {
            'response': body,
            'headers': res.headers
          });
        }
      });
    });
    req.on('error', function (err) {
      callback(true, err);
    })
    if (method == 'POST') req.write(payload.data);
    req.end();
  };
  CRMWebAPI.prototype._DateReviver = function (key, value) {
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
module.exports = CRMWebAPI;
