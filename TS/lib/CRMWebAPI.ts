/// <reference path="../../typings/index.d.ts" />

type CRMWebAPIConfig = {
    APIUrl: string;
    AccessToken?: string;
    callerId?: string;
};

export class CRMWebAPI {
    config: CRMWebAPIConfig;
    node: boolean;
    https: any;
    urllib: any;
    _GetHttpRequest: any;

    constructor(config: CRMWebAPIConfig) {
        this.config = config;

        if (typeof module !== "undefined" && module.exports) {
            this.node = true;
            this.https = require("https");
            this.urllib = require("url");
            this._GetHttpRequest = this._GetHttpRequestHTTPS;
        } else {
            this.node = false;
            this._GetHttpRequest = this._GetHttpRequestXMLHTTPRequest;
        }
    }

    private _restParam(func: Function, startIndex: number): any {
        startIndex = startIndex == null ? func.length - 1 : +startIndex;
        return function () {
            let length = Math.max(arguments.length - startIndex, 0);
            let rest = Array(length);
            for (let index = 0; index < length; index++) {
                rest[index] = arguments[index + startIndex];
            }
            switch (startIndex) {
                case 0:
                    return func.call(this, rest);
                case 1:
                    return func.call(this, arguments[0], rest);
            }
        };
    }

    private whilst(test: Function, iterator: any, callback: Function): any {
        if (test()) {
            const next = this._restParam(function (err, args) {
                if (err) {
                    callback(err);
                } else if (test.apply(this, args)) {
                    iterator(next);
                } else {
                    callback.apply(null, [null].concat(args));
                }
            }, null);
            iterator(next);
        } else {
            callback(null);
        }
    }

    public GetListfunction(uri: string, QueryOptions: any): Promise<any> {
        return new Promise((resolve, reject) => {
            const url = this._BuildQueryURL(uri, QueryOptions);
            this._GetHttpRequest("GET", url, {
                "headers": this._BuildQueryHeaders(QueryOptions)
            }, (err, res) => {
                if (err !== false) {
                    reject(res);
                } else {
                    let data = JSON.parse(res.response, this._DateReviver);
                    let nextLink = data["@odata.nextLink"];
                    let recordCount = data["@odata.count"];
                    let response = {
                        List: data.value,
                        Count: recordCount
                    };
                    if ((QueryOptions != null) && (QueryOptions.RecordAction != null)) {
                        response.List.forEach(function (record) {
                            QueryOptions.RecordAction(record);
                        });
                        response.List = [];
                    }
                    if ((QueryOptions != null) && (QueryOptions.PageAction != null)) {
                        QueryOptions.PageAction(response.List);
                        response.List = [];
                    }
                    if (nextLink === "undefined") {
                        resolve(response);
                    } else {
                        this.whilst(() => {
                            return (nextLink !== undefined);
                        }, callback => {
                            this._GetHttpRequest("GET", nextLink, {
                                "headers": this._BuildQueryHeaders(QueryOptions)
                            }, function (err, res) {
                                if (err === false) {
                                    data = JSON.parse(res.response, this._DateReviver);
                                    nextLink = data["@odata.nextLink"];
                                    response.List = response.List.concat(data.value);
                                    if ((QueryOptions != null) && (QueryOptions.RecordAction != null)) {
                                        response.List.forEach(function (record) {
                                            QueryOptions.RecordAction(record);
                                        });
                                        response.List = [];
                                    }
                                    if ((QueryOptions != null) && (QueryOptions.PageAction != null)) {
                                        QueryOptions.PageAction(response.List);
                                        response.List = [];
                                    }
                                    callback(null, response.List.length);
                                } else {
                                    callback("err", 0);
                                }
                            });
                        }, function (err, n) {
                            resolve(response);
                        });
                    }
                }
            });
        });
    }

    public Get(entityCollection: string, entityID: string, QueryOptions: string): Promise<any> {
        return new Promise((resolve, reject) => {
            let url = null;
            if (entityID == null) {
                url = this._BuildQueryURL(entityCollection, QueryOptions);
            } else {
                url = this._BuildQueryURL(entityCollection + "(" + entityID.toString().replace(/[{}]/g, "") + ")", QueryOptions);
            }
            this._GetHttpRequest(
                "GET",
                url,
                {
                    "headers": this._BuildQueryHeaders(QueryOptions)
                },
                (err, res) => {
                    if (err !== false) {
                        reject(res);
                    } else {
                        const data = JSON.parse(res.response, this._DateReviver);
                        resolve(data);
                    }
                }
            );
        });
    }

    public GetCount(uri: string, QueryOptions: string): Promise<any> {
        return new Promise(function (resolve, reject) {
            const url = this._BuildQueryURL(uri + "/$count", QueryOptions);
            this._GetHttpRequest(
                "GET",
                url,
                {
                    "headers": this._BuildQueryHeaders(QueryOptions)
                },
                (err, res) => {
                    if (err !== false) {
                        reject(res);
                    } else {
                        const data = parseInt(res.response, 10);
                        resolve(data);
                    }
                }
            );
        });
    }

    public Create(entityCollection: string, data: any): Promise<any> {
        return new Promise((resolve, reject) =>  {
            const url = this.config.APIUrl + entityCollection;
            this._GetHttpRequest(
                "POST",
                url,
                {
                    "data": JSON.stringify(data)
                },
                (err, res) => {
                    if (err !== false) {
                        reject(res);
                    } else {
                        resolve(/\(([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\)/g.exec(res.headers["odata-entityid"])[1]);
                    }
                }
            );
        });
    }

    public Update(entityCollection: string, key: string, data: any, Upsert: boolean): Promise<any> {
        return new Promise((resolve, reject) => {
            const url = this.config.APIUrl + entityCollection + "(" + key.replace(/[{}]/g, "") + ")";
            let payload = {
                "data": JSON.stringify(data),
                "headers": {}
            };
            if (Upsert === true) {
                payload["headers"]["If-None-Match"] = "*";
            }
            this._GetHttpRequest(
                "PATCH",
                url,
                payload,
                (err, res) => {
                    if (err !== false) {
                        reject(res);
                    } else {
                        const response = {
                            EntityID: /\(([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\)/g.exec(res.headers["odata-entityid"])[1]
                        };
                        resolve(response);
                    }
                }
            );
        });
    }

    public Delete(entityCollection: string, entityID: string): Promise<any> {
        return new Promise((resolve, reject) => {
            const url = this.config.APIUrl + entityCollection + "(" + entityID.replace(/[{}]/g, "") + ")";
            this._GetHttpRequest(
                "DELETE",
                url,
                {},
                (err, res) => {
                if (err !== false) {
                        reject(res);
                    } else {
                        resolve(true);
                    }
                }
            );
        });
    }

    public Associate(fromEntitycollection: string, fromEntityID: string, navProperty: string, toEntityCollection: string, toEntityID: string): Promise<any> {
        return new Promise((resolve, reject) => {
            let url = this.config.APIUrl + fromEntitycollection + "(" + fromEntityID.replace(/[{}]/g, "") + ")/" + navProperty + "/$ref";
            let payload = {
                "data": JSON.stringify({
                    "@odata.id": this.config.APIUrl + toEntityCollection + "(" + toEntityID.replace(/[{}]/g, "") + ")"
                })
            };
            this._GetHttpRequest(
                "POST",
                url,
                payload,
                (err, res) => {
                    if (err !== false) {
                        reject(res);
                    } else {
                        resolve(true);
                    }
                }
            );
        });
    }

    public Disassociate(fromEntitycollection: string, fromEntityID: string, navProperty: string, toEntityCollection: string, toEntityID: string): Promise<any> {
        return new Promise((resolve, reject) => {
            const url = this.config.APIUrl + fromEntitycollection + "(" + fromEntityID.replace(/[{}]/g, "") +
                ")/" + navProperty + "/$ref?$id=" + this.config.APIUrl + toEntityCollection + "(" + toEntityID.replace(/[{}]/g, "") + ")";
            this._GetHttpRequest(
                "DELETE",
                url,
                {},
                (err, res) => {
                    if (err !== false) {
                        reject(res);
                    } else {
                        resolve(true);
                    }
                }
            );
        });
    }

    public ExecuteFunction(functionName: string, parameters: any, entityCollection: string, entityID: string): Promise<any> {
        return new Promise((resolve, reject) => {
            let parmvars = [];
            let parmvalues = [];
            let parmcount = 1;
            if (parameters != null) {
                Object.keys(parameters).forEach(key => {
                    let val = parameters[key];
                    parmvars.push(key + "=" + "@p" + parmcount.toString());
                    if (typeof val === "string" || val instanceof String) {
                        parmvalues.push("@p" + parmcount.toString() + "='" + val + "'");
                    } else {
                        parmvalues.push("@p" + parmcount.toString() + "=" + val);
                    }
                    parmcount++;
                });
            }
            let url = "";
            if (parameters != null) {
                url = this.config.APIUrl + functionName + "(" + parmvars.join() + ")?" + parmvalues.join("&");
                if (entityCollection != null) {
                    url = this.config.APIUrl + entityCollection + "(" + entityID.toString().replace(/[{}]/g, "") + ")" + functionName + "(" + parmvars.join() + ")?" + parmvalues.join("&");
                }
            } else {
                url = this.config.APIUrl + functionName + "()";
                if (entityCollection != null) {
                    url = this.config.APIUrl + entityCollection + "(" + entityID.toString().replace(/[{}]/g, "") + ")" + functionName + "()";
                }
            }
            this._GetHttpRequest(
                "GET",
                url,
                {},
                (err, res) => {
                    if (err !== false) {
                        reject(res);
                    } else {
                        var data = JSON.parse(res.response, this._DateReviver);
                        resolve(data);
                    }
                }
            );
        });
    }

    public ExecuteAction(actionName: string, data: any, entityCollection: string, entityID: string): Promise<any> {
        return new Promise((resolve, reject) => {
            let url = this.config.APIUrl + actionName;
            if (entityCollection != null) {
                url = this.config.APIUrl + entityCollection + "(" + entityID.toString().replace(/[{}]/g, "") + ")" + actionName;
            }
            this._GetHttpRequest(
                "POST",
                url,
                {
                    "data": JSON.stringify(data)
                },
                (err, res) => {
                    if (err !== false) {
                        reject(res);
                    } else {
                        var data = JSON.parse(res.response, this._DateReviver);
                        resolve(data);
                    }
                }
            );
        });
    }

    private _BuildQueryURL(uri: string, queryOptions: any): string {
        let fullurl = this.config.APIUrl + uri;
        let qs = [];
        if (queryOptions != null) {
            if (queryOptions.Select != null) {
                qs.push("$select=" + encodeURI(queryOptions.Select.join()));
            }

            if (queryOptions.OrderBy != null) {
                qs.push("$orderby=" + encodeURI(queryOptions.OrderBy.join()));
            }

            if (queryOptions.Filter != null) {
                qs.push("$filter=" + encodeURI(queryOptions.Filter));
            }

            if (queryOptions.Expand != null) {
                let expands = [];
                queryOptions.Expand.forEach(function (ex) {
                    if (ex.Select != null ||
                        ex.Filter != null ||
                        ex.OrderBy != null ||
                        ex.Top != null) {
                        let qsExpand = [];
                        if (ex.Select != null) {
                            qsExpand.push("$select=" + ex.Select.join());
                        }

                        if (ex.OrderBy != null) {
                            qsExpand.push("$orderby=" + ex.OrderBy.join());
                        }

                        if (ex.Filter != null) {
                            qsExpand.push("$filter=" + ex.Filter);
                        }

                        if (ex.Top > 0) {
                            qsExpand.push("$top=" + ex.Top);
                        }

                        expands.push(ex.Property + "(" + qsExpand.join(";") + ")");
                    } else {
                        expands.push(ex.Property);
                    }
                });
                qs.push("$expand=" + encodeURI(expands.join()));
            }
            if (queryOptions.IncludeCount) {
                qs.push("$count=true");
            }

            if (queryOptions.Skip > 0) {
                qs.push("skip=" + encodeURI(queryOptions.Skip));
            }

            if (queryOptions.Top > 0) {
                qs.push("$top=" + encodeURI(queryOptions.Top));
            }

            if (queryOptions.SystemQuery != null) {
                qs.push("savedQuery=" + encodeURI(queryOptions.SystemQuery));
            }

            if (queryOptions.UserQuery != null) {
                qs.push("userQuery=" + encodeURI(queryOptions.UserQuery));
            }

            if (queryOptions.FetchXml != null) {
                qs.push("fetchXml=" + encodeURI(queryOptions.FetchXml));
            }
        }
        if (qs.length > 0) {
            fullurl += "?" + qs.join("&");
        }
        return fullurl;
    }

    private _BuildQueryHeaders(queryOptions: any): any {
        let headers = {};
        if (queryOptions != null) {
            if (queryOptions.FormattedValues === true) {
                headers["Prefer"] = "odata.include-annotations=*";
            }
        }
        return headers;
    }

    private parseResponseHeaders(headerStr: string): any {
        let headers = {};
        if (!headerStr) {
            return headers;
        }
        const headerPairs = headerStr.split("\u000d\u000a");
        for (let i = 0; i < headerPairs.length; i++) {
            let headerPair = headerPairs[i];
            // Can't use split() here because it does the wrong thing
            // if the header value has the string ": " in it.
            let index = headerPair.indexOf("\u003a\u0020");
            if (index > 0) {
                let key = headerPair.substring(0, index);
                let val = headerPair.substring(index + 2);
                headers[key.toLowerCase()] = val;
            }
        }
        return headers;
    }

    private _GetHttpRequestXMLHTTPRequest(method: string, url: string, payload: any, callback: Function): void {
        let req = new XMLHttpRequest();
        req.open(method, url, true);
        if (this.config.AccessToken != null) {
            req.setRequestHeader("Authorization", "Bearer " + this.config.AccessToken);
        }
        req.setRequestHeader("Accept", "application/json");
        req.setRequestHeader("OData-MaxVersion", "4.0");
        req.setRequestHeader("OData-Version", "4.0");
        if (this.config.callerId) {
            req.setRequestHeader("MSCRMCallerID", this.config.callerId);
        }
        if (["POST", "PUT", "PATCH"].indexOf(method) >= 0) {
            req.setRequestHeader("Content-Length", payload.data.length);
            req.setRequestHeader("Content-Type", "application/json");
        }
        if (payload.headers !== "undefined") {
            for (let name in payload.headers) {
                req.setRequestHeader(name, payload.headers[name]);
            }
        }
        req.onreadystatechange = () => {
            if (req.readyState === 4 /* complete */) {
                req.onreadystatechange = null;
                if ((req.status >= 200) && (req.status < 305)) {
                    callback(false, {
                        "response": req.response,
                        "headers": this.parseResponseHeaders(req.getAllResponseHeaders())
                    });
                } else {
                    callback(true, this);
                }
            }
        };
        if (["POST", "PUT", "PATCH"].indexOf(method) >= 0) {
            req.send(payload.data);
        } else {
            req.send();
        }
    }

    private _GetHttpRequestHTTPS(method: string, url: string, payload: any, callback: Function): void {
        const parsed_url = this.urllib.parse(url);
        let options = {
            hostname: parsed_url.hostname,
            port: 443,
            path: parsed_url.path,
            method: method,
            headers: {
                "Accept": "application/json",
                "OData-MaxVersion": "4.0",
                "OData-Version": "4.0",
            }
        };
        if (["POST", "PUT", "PATCH"].indexOf(method) >= 0) {
            options.headers["Content-Length"] = payload.data.length;
            options.headers["Content-Type"] = "application/json";
        }
        if (this.config.callerId) {
            options.headers["MSCRMCallerID"] = this.config.callerId;
        }

        if (this.config.AccessToken != null) {
            options.headers["Authorization"] = "Bearer " + this.config.AccessToken;
        }

        if (payload.headers !== undefined) {
            for (let name in payload.headers) {
                options.headers[name] = payload.headers[name];
            }
        }

        let req = this.https.request(options, res => {
            let body = "";
            res.setEncoding("utf8");
            res.on("data", function (chunk) {
                body += chunk;
            });
            res.on("end", () => {
                if ((res.statusCode >= 200) && (res.statusCode < 305)) {
                    callback(false, {
                        "response": body,
                        "headers": res.headers
                    });
                } else {
                    callback(true, {
                        "response": body,
                        "headers": res.headers
                    });
                }
            });
        });
        req.on("error", function (err) {
            callback(true, err);
        });
        if (["POST", "PUT", "PATCH"].indexOf(method) >= 0) {
            req.write(payload.data);
        }
        req.end();
    }

    private _DateReviver(key: string, value: any): Date {
        var a;
        if (typeof value === "string") {
            a = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
            if (a) {
                return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4], +a[5], +a[6]));
            }
        }
        return value;
    }
}