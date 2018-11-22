'use strict';

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD
        define(['CRMWebAPI'], factory);
    } else if (typeof exports === 'object') {
        // Node, CommonJS-like
        module.exports = factory(require('https'), require('url'));
    } else {        
        // Browser globals (root is window)        
        root.CRMWebAPI = factory(root.CRMWebAPI);        
    }
}(this, function (https, url) {
    return (function () {
        function CRMWebAPI(config) {
            this.config = config;
            if (typeof module !== 'undefined' && module.exports) {
                this.node = true;
                this.https = https;
                this.urllib = url;
                this._GetHttpRequest = this._GetHttpRequestHTTPS;
            } else {
                this.node = false;
                this._GetHttpRequest = this._GetHttpRequestXMLHTTPRequest;
            }
            return this;
        }
	CRMWebAPI.prototype._log = function (category, message,data) {
		
		var logger = function(category,message,data) { console.log(category +':' + message)};
		if ((this.config.Log != null) && (this.config.Log.Logger))
		   logger = this.config.Log.Logger;
		
		if ((this.config.Log != null) && (this.config.Log[category] == true))
			logger(category,message,data);	

	};
	CRMWebAPI.prototype._restParam = function (func, startIndex) {
		startIndex = startIndex == null ? func.length - 1 : +startIndex;
		return function () {
			var length = Math.max(arguments.length - startIndex, 0);
			var rest = Array(length);
			for (var index = 0; index < length; index++) {
				rest[index] = arguments[index + startIndex];
			}
			switch (startIndex) {
				case 0:
					return func.call(this, rest);
				case 1:
					return func.call(this, arguments[0], rest);
			}
		};
	};
	CRMWebAPI.prototype.whilst = function (test, iterator, callback) {
		if (test()) {
			var next = this._restParam(function (err, args) {
				if (err) {
					callback(err);
				} else if (test.apply(this, args)) {
					iterator(next);
				} else {
					callback.apply(null, [null].concat(args));
				}
			});
			iterator(next);
		} else {
			callback(null);
		}
	};
	CRMWebAPI.prototype.GetList = function (uri, QueryOptions) {
		var self = this;
		return new Promise(function (resolve, reject) {
			var url = self._BuildQueryURL(uri, QueryOptions, self.config);
			self._GetHttpRequest(self.config, "GET", url, {
				'headers': self._BuildQueryHeaders(QueryOptions, self.config)
			}, function (err, res) {
				if (err != false) {
					self._log('Errors','GetList Error:',res);
					reject(res);
				} else {
					var data = JSON.parse(res.response, CRMWebAPI.prototype._DateReviver);
					var nextLink = data['@odata.nextLink'];
					var recordCount = data['@odata.count'];
					var response = {
						List: data.value,
						Count: recordCount
					};
					if ((QueryOptions != null) && (QueryOptions.RecordAction != null))
					{
						response.List.forEach(function(record){
							QueryOptions.RecordAction(record);
						});
						response.List = [];
					}
					if ((QueryOptions != null) && (QueryOptions.PageAction != null))
					{						
					 	QueryOptions.PageAction(response.List);
						 response.List = [];						
					}						
					if (nextLink === 'undefined') {
						resolve(response);
					} else {
						self.whilst(function () {
							return (nextLink !== undefined);
						}, function (callback) {
							self._GetHttpRequest(self.config, "GET", nextLink, {
								'headers': self._BuildQueryHeaders(QueryOptions, self.config)
							}, function (err, res) {
								if (err == false) {
									data = JSON.parse(res.response, CRMWebAPI.prototype._DateReviver);
									nextLink = data['@odata.nextLink'];									
									response.List = response.List.concat(data.value);
									if ((QueryOptions != null) && (QueryOptions.RecordAction != null))
									{
										response.List.forEach(function(record){
											QueryOptions.RecordAction(record);
										});
										response.List = [];
									}
									if ((QueryOptions != null) && (QueryOptions.PageAction != null))
									{						
										QueryOptions.PageAction(response.List);
										response.List = [];						
									}						
									callback(null, response.List.length);
								} else {
									self._log('Errors','GetList Error2',res);
									callback('err', 0);
								}
							});
						}, function (err, n) {
							resolve(response);
						});
					}
				}
			});
		});
	};
	CRMWebAPI.prototype.Get = function (entityCollection, entityID, QueryOptions) {
        /// <summary>
        /// Get a collection or an instance of given entity type
        /// </summary>
        /// <param name="entityCollection" type="type">Entity logical name to retrieve including plural suffix</param>
        /// <param name="entityID" type="type">ID of requested record, or null for collection based on QueryOptions.Filter</param>
        /// <param name="QueryOptions" type="type"></param>
		var self = this;
		return new Promise(function (resolve, reject) {
			var url = null;
			if (entityID == null)
				url = self._BuildQueryURL(entityCollection , QueryOptions, self.config);
			else
			 	url  = self._BuildQueryURL(entityCollection + "(" + entityID.toString().replace(/[{}]/g, "") + ")", QueryOptions, self.config);
			self._GetHttpRequest(self.config, "GET", url, {
				'headers': self._BuildQueryHeaders(QueryOptions, self.config)
			}, function (err, res) {
				if (err != false) {
					self._log('Errors','Get Error',res);
					reject(res);
				} else {
					var data = JSON.parse(res.response, CRMWebAPI.prototype._DateReviver)
					resolve(data);
				}
			});
		});
	};
	CRMWebAPI.prototype.GetCount = function (uri, QueryOptions) {
		var self = this;
		return new Promise(function (resolve, reject) {
			var url = self._BuildQueryURL(uri + "/$count", QueryOptions, self.config);
			self._GetHttpRequest(self.config, "GET", url, {
				'headers': self._BuildQueryHeaders(QueryOptions, self.config)
			}, function (err, res) {
				if (err != false) {
					self._log('Errors','GetCount Error',res);
					reject(res);
				} else {
					var data = parseInt(res.response);
					resolve(data);
				}
			});
		});
	};
	CRMWebAPI.prototype.Create = function (entityCollection, data) {
        /// <summary>
        /// Create a record
        /// </summary>
        /// <param name="entityCollection" type="type">Plural name of entity to create</param>
        /// <param name="data" type="type">JSON object with attributes for the record to create</param>
		var self = this;
		return new Promise(function (resolve, reject) {
			var url = self.config.APIUrl + entityCollection;
			self._log('ODataUrl',url);
			self._GetHttpRequest(self.config, "POST", url, {
				'data': JSON.stringify(data)
			}, function (err, res) {
				if (err != false) {
					self._log('Errors','Create Error',res);
					reject(res);
				} else {
					resolve(/\(([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\)/g.exec(res.headers["odata-entityid"])[1]);
				}
			});
		});
	};
	CRMWebAPI.prototype.Update = function (entityCollection, key, data, Upsert) {
        /// <summary>
        /// Update an existing record or create a new if record does not exist (Upsert)
        /// </summary>
        /// <param name="entityCollection" type="type">Plural name of entity to update</param>
        /// <param name="key" type="type">Key to locate existing record</param>
        /// <param name="data" type="type">JSON object with attributes for the record to upddate</param>
        /// <param name="Upsert" type="type">Set to true to enable upsert functionality, which creates a new record if key is not found</param>	
		var self = this;
		return new Promise(function (resolve, reject) {
			var url = self.config.APIUrl + entityCollection + '(' + key.replace(/[{}]/g, "") + ')';
			self._log('ODataUrl',url);
			var payload = {
				"data": JSON.stringify(data),
				"headers": {}
			};
			if (Upsert == false) payload["headers"]["If-Match"] = "*";
			self._GetHttpRequest(self.config, "PATCH", url, payload, function (err, res) {
				if (err != false) {
					self._log('Errors','Update Error',res);
					reject(res);
				} else {
					var response = {};
					var parseEntityID = /\(([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\)/g.exec(res.headers["odata-entityid"]);
					
					if (parseEntityID != null)
						response.EntityID = parseEntityID[1];
						
					resolve(response);
				}
			});
		});
	};
	CRMWebAPI.prototype.Delete = function (entityCollection, entityID) {
        /// <summary>
        /// Delete an existing record
        /// </summary>
        /// <param name="entityCollection" type="type">Plural name of entity to delete</param>
        /// <param name="entityID" type="type">ID of record to delete</param>
		var self = this;
		return new Promise(function (resolve, reject) {
			var url = self.config.APIUrl + entityCollection + '(' + entityID.replace(/[{}]/g, "") + ')';
			self._log('ODataUrl',url);
			self._GetHttpRequest(self.config, "DELETE", url, {}, function (err, res) {
				if (err != false) {
					self._log('Errors','Delete Error',res);
					reject(res);
				} else {
					resolve(true);
				}
			});
		});
	};
	CRMWebAPI.prototype.Associate = function (fromEntitycollection, fromEntityID, navProperty, toEntityCollection, toEntityID) {
		var self = this;
		return new Promise(function (resolve, reject) {
			var url = self.config.APIUrl + fromEntitycollection + '(' + fromEntityID.replace(/[{}]/g, "") + ')/' + navProperty + '/$ref';
			self._log('ODataUrl',url);
			var payload = {
				'data': JSON.stringify({
					'@odata.id': self.config.APIUrl + toEntityCollection + '(' + toEntityID.replace(/[{}]/g, "") + ')'
				})
			};
			self._GetHttpRequest(self.config, 'POST', url, payload, function (err, res) {
				if (err != false) {
					self._log('Errors','Associate Error',res);
					reject(res);
				} else {
					resolve(true);
				}
			});
		});
	};
	CRMWebAPI.prototype.DeleteAssociation = function (fromEntitycollection, fromEntityID, navProperty, toEntityCollection, toEntityID) {
		var self = this;
		return new Promise(function (resolve, reject) {
			var url = self.config.APIUrl + fromEntitycollection + '(' + fromEntityID.replace(/[{}]/g, "") +
			   ')/' + navProperty + '/$ref';
			   
			if (toEntityCollection != null && toEntityID != null) 
			   url += '?$id=' + self.config.APIUrl + toEntityCollection + '(' + toEntityID.replace(/[{}]/g, "") + ')';

			self._log('ODataUrl',url);
			self._GetHttpRequest(self.config, 'DELETE', url, {}, function (err, res) {
				if (err != false) {
					self._log('Errors','DeleteAssociation Error',res);
					reject(res);
				} else {
					resolve(true);
				}
			});
		});
	};
	CRMWebAPI.prototype.ExecuteFunction = function (functionName, parameters, entityCollection, entityID) {
		var self = this;
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
				url = self.config.APIUrl + functionName + "(" + parmvars.join(",") + ")?" + parmvalues.join("&");
				if (entityCollection != null) url = self.config.APIUrl + entityCollection + "(" + entityID.toString().replace(/[{}]/g, "") + ")" + functionName + "(" + parmvars.join(",") + ")?" + parmvalues.join("&");
			} else {
				url = self.config.APIUrl + functionName + "()";
				if (entityCollection != null) url = self.config.APIUrl + entityCollection + "(" + entityID.toString().replace(/[{}]/g, "") + ")" + functionName + "()";
			}
			self._log('ODataUrl',url);
			self._GetHttpRequest(self.config, "GET", url, {}, function (err, res) {
				if (err != false) {
					self._log('Errors','ExecuteFunction Error',res);
					reject(res);
				} else {
					var data = JSON.parse(res.response, CRMWebAPI.prototype._DateReviver)
					resolve(data);
				}
			});
		});
	};
	CRMWebAPI.prototype.ExecuteAction = function (actionName, data, entityCollection, entityID) {
		var self = this;
		return new Promise(function (resolve, reject) {
			var url = self.config.APIUrl + actionName;
			if (entityCollection != null) url = self.config.APIUrl + entityCollection + "(" + entityID.toString().replace(/[{}]/g, "") + ")/" + actionName;
			self._log('ODataUrl',url);
			if (data == null)
				data = {};
			self._GetHttpRequest(self.config, "POST", url, {
				"data": JSON.stringify(data)
			}, function (err, res) {
				if (err != false) {
					self._log('Errors','ExecuteAction Error',res);
					reject(res);
				} else {					
					if (res.response == "") {
						resolve(null);
					} else {
						var data = JSON.parse(res.response, CRMWebAPI.prototype._DateReviver)
						resolve(data);
					}
				}
			});
		});
	};
	CRMWebAPI.prototype._BuildQueryURL = function (uri, queryOptions, config) {
		var fullurl = config.APIUrl + uri;
		var qs = [];
		if (queryOptions != null) {
			if (queryOptions.Select != null) qs.push("$select=" + encodeURI(queryOptions.Select.join(",")));
			if (queryOptions.OrderBy != null) qs.push("$orderby=" + encodeURI(queryOptions.OrderBy.join(",")));
			if (queryOptions.Filter != null) qs.push("$filter=" + encodeURI(queryOptions.Filter));
			if (queryOptions.Expand != null) 
			{
				var expands = [];
				queryOptions.Expand.forEach(function (ex){
					if ((ex.Select != null) || (ex.Filter != null) || (ex.OrderBy != null) || (ex.Top != null))
					{ 	
						var qsExpand = [];				 
						if (ex.Select != null) qsExpand.push("$select=" + ex.Select.join(","));
						if (ex.OrderBy != null) qsExpand.push("$orderby=" + ex.OrderBy.join(","));
						if (ex.Filter != null) qsExpand.push("$filter=" + ex.Filter);
						if (ex.Top > 0) qsExpand.push("$top=" + ex.Top);
						expands.push(ex.Property + "(" +qsExpand.join(";") + ")");
					}
					else
						expands.push(ex.Property);
				});
				qs.push("$expand="+ encodeURI(expands.join(",")));
			}
			if (queryOptions.IncludeCount) qs.push("$count=true");
			if (queryOptions.Skip > 0) qs.push("skip=" + encodeURI(queryOptions.Skip));
			if (queryOptions.Top > 0) qs.push("$top=" + encodeURI(queryOptions.Top));
			if (queryOptions.SystemQuery != null) qs.push("savedQuery=" + encodeURI(queryOptions.SystemQuery));
			if (queryOptions.UserQuery != null) qs.push("userQuery=" + encodeURI(queryOptions.UserQuery));
			if (queryOptions.FetchXml != null) qs.push("fetchXml=" + encodeURI(queryOptions.FetchXml));
		}
		if (qs.length > 0) fullurl += "?" + qs.join("&")
		this._log('ODataUrl',fullurl);
		return fullurl;
	};
	CRMWebAPI.prototype._BuildQueryHeaders = function (queryOptions, config) {
		var headers = {};
		if (queryOptions != null) {
			if (queryOptions.FormattedValues == true) headers['Prefer'] = 'odata.include-annotations="OData.Community.Display.V1.FormattedValue"';
		}
		return headers;
	};
	CRMWebAPI.prototype.parseResponseHeaders = function (headerStr) {
		var headers = {};
		if (!headerStr) {
			return headers;
		}
		var headerPairs = headerStr.split('\u000d\u000a');
		for (var i = 0; i < headerPairs.length; i++) {
			var headerPair = headerPairs[i];
			// Can't use split() here because it does the wrong thing
			// if the header value has the string ": " in it.
			var index = headerPair.indexOf('\u003a\u0020');
			if (index > 0) {
				var key = headerPair.substring(0, index);
				var val = headerPair.substring(index + 2);
				headers[key.toLowerCase()] = val;
			}
		}
		return headers;
	};
	CRMWebAPI.prototype._GetHttpRequestXMLHTTPRequest = function (config, method, url, payload, callback) {
		var self = this;
		var req = new XMLHttpRequest();
		//req.open(method, encodeURI(url), true);
		req.open(method, url, true);
		if (config.AccessToken != null) req.setRequestHeader("Authorization", "Bearer " + config.AccessToken);
		req.setRequestHeader("Accept", "application/json");
		req.setRequestHeader("OData-MaxVersion", "4.0");
		req.setRequestHeader("OData-Version", "4.0");
		if (config.callerId) req.setRequestHeader("MSCRMCallerID", config.callerId);		
		if (config.CallerID) req.setRequestHeader("MSCRMCallerID", config.CallerID);		
		if (['POST', 'PUT', 'PATCH'].indexOf(method) >= 0) {
			req.setRequestHeader("Content-Type", "application/json");
		}
		if (payload.headers !== 'undefined') {
			for (var name in payload.headers) {
				req.setRequestHeader(name, payload.headers[name]);
			}
		}
		req.onreadystatechange = function () {
			if (this.readyState == 4 /* complete */ ) {
				req.onreadystatechange = null;
				if ((this.status >= 200) && (this.status < 300)) {
					callback(false, {
						'response': this.response,
						'headers': self.parseResponseHeaders(this.getAllResponseHeaders())
					});
				} else {
					callback(true, this)
				}
			}
		};
		if (['POST', 'PUT', 'PATCH'].indexOf(method) >= 0) {
			req.send(payload.data);
		} else {
			req.send();
		}
	};
	CRMWebAPI.prototype._GetHttpRequestHTTPS = function (config, method, url, payload, callback) {
		var parsed_url = this.urllib.parse(url);
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
		if (['POST', 'PUT', 'PATCH'].indexOf(method) >= 0) {
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
		var req = this.https.request(options, function (res) {
			var body = '';
			res.setEncoding('utf8');
			res.on('data', function (chunk) {
				body += chunk;
			})
			res.on('end', function () {
				if ((res.statusCode >= 200) && (res.statusCode < 300)) {
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
		if (['POST', 'PUT', 'PATCH'].indexOf(method) >= 0) {
			req.write(payload.data);
		}
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
	return CRMWebAPI;
})();
}));