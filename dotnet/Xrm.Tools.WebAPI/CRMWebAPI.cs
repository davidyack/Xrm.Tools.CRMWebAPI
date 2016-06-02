// =====================================================================
//  File:		CRMWebAPI
//  Summary:	Helper library for working with CRM Web API
// =====================================================================
// 
//
//  Copyright(C) 2016 Colorado Technology Consultants Inc.  All rights reserved.
//
//
//  THIS CODE AND INFORMATION ARE PROVIDED "AS IS" WITHOUT WARRANTY OF ANY
//  KIND, EITHER EXPRESSED OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
//  IMPLIED WARRANTIES OF MERCHANTABILITY AND/OR FITNESS FOR A
//  PARTICULAR PURPOSE.
// 
//  Any use or other rights related to this source code, resulting object code or 
//  related artifacts are controlled the prevailing EULA in effect. See the EULA
//  for detail rights. In the event no EULA was provided contact copyright holder
//  for a current copy.
//
// =====================================================================
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Collections.Specialized;
using System.Dynamic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;
using Xrm.Tools.WebAPI.Requests;
using Xrm.Tools.WebAPI.Results;


namespace Xrm.Tools.WebAPI
{
    public class CRMWebAPI
    {
        private HttpClient _httpClient = null;
        private string _apiUrl = string.Empty;
        private string _AccessToken = string.Empty;
        private Func<string, Task<string>> _getAccessToken = null;

        /// <summary>
        /// 
        /// </summary>
        /// <param name="apiUrl">CRM API base URL e.g. https://orgname.api.crm.dynamics.com/api/data/v8.0/ </param>
        /// <param name="accessToken">allows for hard coded access token for testing</param>
        /// <param name="callerID">user id to impersonate on calls</param>
        /// <param name="getAccessToken">method to call to refresh access token, called before each use of token</param>
        public CRMWebAPI(string apiUrl, string accessToken, Guid callerID = default(Guid), Func<string, Task<string>> getAccessToken = null)
        {
            _apiUrl = apiUrl;
            _httpClient = new HttpClient();
            _AccessToken = accessToken;
            _getAccessToken = getAccessToken;
            _httpClient.DefaultRequestHeaders.Authorization =
               new AuthenticationHeaderValue("Bearer", accessToken);
            SetHttpClientDefaults(callerID);
        }

        /// <summary>
        /// On-premise Active Directory with Credentials
        /// </summary>
        /// <param name="apiUrl"></param>
        /// <param name="networkCredential"></param>
        public CRMWebAPI(string apiUrl, NetworkCredential networkCredential = null, Guid callerID = default(Guid))
        {
            _apiUrl = apiUrl;

            if (networkCredential != null)
                _httpClient = new HttpClient(new HttpClientHandler() { Credentials = networkCredential });
            else
                _httpClient = new HttpClient();

            SetHttpClientDefaults(callerID);
        }
        /// <summary>
        /// Retrieve a list of records based on query options
        /// </summary>
        /// <param name="uri">e.g. accounts</param>
        /// <param name="QueryOptions">Filter, OrderBy,Select, and other options</param>
        /// <returns></returns>
        public async Task<CRMGetListResult<ExpandoObject>> GetList(string uri, CRMGetListOptions QueryOptions = null)
        {
            await CheckAuthToken();

            string fullUrl = BuildGetUrl(uri, QueryOptions);
            HttpRequestMessage request = new HttpRequestMessage(new HttpMethod("GET"), fullUrl);

            if ((QueryOptions != null) && (QueryOptions.FormattedValues))
                request.Headers.Add("Prefer", "odata.include-annotations=\"OData.Community.Display.V1.FormattedValue\"");

            var results = await _httpClient.SendAsync(request);
                        
            results.EnsureSuccessStatusCode();
            var data = await results.Content.ReadAsStringAsync();
            CRMGetListResult<ExpandoObject> resultList = new CRMGetListResult<ExpandoObject>();
            resultList.List = new List<ExpandoObject>();
            
            var values = JObject.Parse(data);
            var valueList = values["value"].ToList();
            foreach (var value in valueList)
                resultList.List.Add(value.ToObject<ExpandoObject>());            
            var nextLink = values["@odata.nextLink"];
            var recordCount = values["@odata.count"];
            if (recordCount != null)
                resultList.Count = int.Parse(recordCount.ToString());
            while (nextLink != null)
            {
                var nextResults = await _httpClient.GetAsync(nextLink.ToString());
                nextResults.EnsureSuccessStatusCode();
                var nextData = await nextResults.Content.ReadAsStringAsync();

                var nextValues = JObject.Parse(nextData);
                var nextValueList = nextValues["value"].ToList();
                foreach (var nextvalue in nextValueList)
                    resultList.List.Add(nextvalue.ToObject<ExpandoObject>());                
                nextLink = nextValues["@odata.nextLink"];
            }

            return resultList;
        }
        /// <summary>
        /// Retrieve a list of records based on query options
        /// </summary>
        /// <typeparam name="ResultType"></typeparam>
        /// <param name="uri">e.g. accounts</param>
        /// <param name="QueryOptions">Filter, OrderBy,Select, and other options</param>
        /// <returns></returns>
        public async Task<CRMGetListResult<ResultType>> GetList<ResultType>(string uri, CRMGetListOptions QueryOptions = null)
        {
            await CheckAuthToken();

            string fullUrl = BuildGetUrl(uri, QueryOptions);
            var results = await _httpClient.GetAsync(fullUrl);
            results.EnsureSuccessStatusCode();
            var data = await results.Content.ReadAsStringAsync();
            var values = JObject.Parse(data);
            CRMGetListResult<ResultType> resultList = new CRMGetListResult<ResultType>();
            resultList.List = new List<ResultType>();

            foreach (var value in values["value"].ToList())
            {
                resultList.List.Add(value.ToObject<ResultType>());
            }
            var nextLink = values["@odata.nextLink"];
            var recordCount = values["@odata.count"];
            if (recordCount != null)
                resultList.Count = int.Parse(recordCount.ToString());

            while (nextLink != null)
            {
                var nextResults = await _httpClient.GetAsync(nextLink.ToString());
                nextResults.EnsureSuccessStatusCode();
                var nextData = await nextResults.Content.ReadAsStringAsync();

                var nextValues = JObject.Parse(nextData);            
                foreach (var value in nextValues["value"].ToList())
                {
                    resultList.List.Add(value.ToObject<ResultType>());
                }
                nextLink = nextValues["@odata.nextLink"];
            }
            return resultList;
        }

        /// <summary>
        /// Get count of matching records.  
        /// 
        /// Note: This returns up to 5,000 records matching criteria it will not reflect all records over 5,000 due to
        /// a limitiation with CRM internal handling of retrieval of the count
        /// </summary>
        /// <param name="uri">e.g. accounts</param>
        /// <param name="QueryOptions">Filter, OrderBy,Select, and other options</param>
        /// <returns></returns>
        public async Task<int> GetCount(string uri, CRMGetListOptions QueryOptions = null)
        {
            await CheckAuthToken();
            if (QueryOptions != null)
                QueryOptions.IncludeCount = false;
            string fullUrl = BuildGetUrl(uri+"/$count", QueryOptions);
            var results = await _httpClient.GetAsync(fullUrl);
            results.EnsureSuccessStatusCode();
            var data = await results.Content.ReadAsStringAsync();
            
            return int.Parse(data);
           
        }
        /// <summary>
        /// get a single record matching the URI
        /// </summary>
        /// <param name="uri"></param>
        /// <param name="QueryOptions"></param>
        /// <returns></returns>
        public async Task<ExpandoObject> Get(string entityCollection, Guid entityID, CRMGetListOptions QueryOptions = null)
        {
            return await Get<ExpandoObject>(entityCollection, entityID, QueryOptions);
        }
        /// <summary>
        /// get a single record with the specified return type
        /// </summary>
        /// <typeparam name="ResultType"></typeparam>
        /// <param name="uri"></param>
        /// <param name="QueryOptions"></param>
        /// <returns></returns>
        public async Task<ResultType> Get<ResultType>(string entityCollection,Guid entityID, CRMGetListOptions QueryOptions = null)
        {
            await CheckAuthToken();

            string fullUrl = string.Empty;
            if (entityID == Guid.Empty)
               fullUrl =  BuildGetUrl( entityCollection , QueryOptions);
            else
                fullUrl = BuildGetUrl(entityCollection + "(" + entityID.ToString() + ")", QueryOptions);
            HttpRequestMessage request = new HttpRequestMessage(new HttpMethod("GET"), fullUrl);

            if ((QueryOptions != null) && (QueryOptions.FormattedValues))
                request.Headers.Add("Prefer", "odata.include-annotations=\"OData.Community.Display.V1.FormattedValue\"");

            var results = await _httpClient.SendAsync(request);
            
            results.EnsureSuccessStatusCode();
            var data = await results.Content.ReadAsStringAsync();
            return JsonConvert.DeserializeObject<ResultType>(data);
        }
        /// <summary>
        /// create a new record
        /// </summary>
        /// <param name="entityCollection"></param>
        /// <param name="data"></param>
        /// <returns></returns>
        public async Task<Guid> Create(string entityCollection, object data)
        {
            await CheckAuthToken();

            var fullUrl = _apiUrl + entityCollection;

            HttpRequestMessage request = new HttpRequestMessage(new HttpMethod("Post"), fullUrl);

            request.Content = new StringContent(JsonConvert.SerializeObject(data), Encoding.UTF8, "application/json");            

            var response = await _httpClient.SendAsync(request);            

            response.EnsureSuccessStatusCode();

            Guid idGuid = GetEntityIDFromResponse(fullUrl, response);

            return idGuid;
        }     

        /// <summary>
        /// create multiple records at once using a batch
        /// </summary>
        /// <param name="entityCollection"></param>
        /// <param name="datalist"></param>
        /// <returns></returns>
        public async Task<CRMBatchResult> Create(string entityCollection, object[] datalist)
        {
            await CheckAuthToken();

#if WINDOWS_APP
     throw new NotImplementedException();
#else

            var httpClient = new HttpClient();

            httpClient.DefaultRequestHeaders.Authorization =
               new AuthenticationHeaderValue("Bearer", _AccessToken);
            httpClient.DefaultRequestHeaders.Add("OData-MaxVersion", "4.0");
            httpClient.DefaultRequestHeaders.Add("OData-Version", "4.0");
            var batchid = "batch_" + Guid.NewGuid().ToString();

            MultipartContent batchContent = new MultipartContent("mixed", batchid);
            var changesetID = "changeset_" + Guid.NewGuid().ToString();
            MultipartContent changeSetContent = new MultipartContent("mixed", changesetID);

            int contentID = 1;
            foreach (var data in datalist)
            {
                HttpRequestMessage req = new HttpRequestMessage(HttpMethod.Post, _apiUrl + entityCollection);

                req.Content = new StringContent(JsonConvert.SerializeObject(data), Encoding.UTF8, "application/json");
                HttpMessageContent content = new HttpMessageContent(req);
                content.Headers.Remove("Content-Type");                
                content.Headers.TryAddWithoutValidation("Content-Type", "application/http");
                content.Headers.TryAddWithoutValidation("Content-Transfer-Encoding", "binary");
                content.Headers.TryAddWithoutValidation("Content-ID", contentID.ToString());
                contentID++;
                changeSetContent.Add(content);
            }

            batchContent.Add(changeSetContent);

            HttpRequestMessage batchRequest = new HttpRequestMessage(HttpMethod.Post, _apiUrl + "$batch");

            batchRequest.Content = batchContent;

            var batchstring = await batchRequest.Content.ReadAsStringAsync();

            var response = await httpClient.SendAsync(batchRequest);
            var responseString = response.Content.ReadAsStringAsync();
            MultipartMemoryStreamProvider batchStream = await response.Content.ReadAsMultipartAsync(); ;
            var changesetStream = batchStream.Contents.FirstOrDefault();
            
            StreamContent changesetFixedContent = FixupChangeStreamDueToBug(changesetStream);

            var changesetFixedStream = await changesetFixedContent.ReadAsMultipartAsync();
            CRMBatchResult finalResult = new CRMBatchResult();
            finalResult.ResultItems = new List<CRMBatchResultItem>();

            foreach (var responseContent in changesetFixedStream.Contents)
            {               
                var fixedREsponseContent = FixupToAddCorrectHttpContentType(responseContent);
                var individualResponseString = await fixedREsponseContent.ReadAsStringAsync();
                var indivdualResponse = await fixedREsponseContent.ReadAsHttpResponseMessageAsync();              
                var idString = indivdualResponse.Headers.GetValues("OData-EntityId").FirstOrDefault();
                idString = idString.Replace(_apiUrl + entityCollection, "").Replace("(", "").Replace(")", "");
                CRMBatchResultItem resultItem = new CRMBatchResultItem();
                resultItem.EntityID = Guid.Parse(idString);
                finalResult.ResultItems.Add(resultItem);
            }

            return finalResult;
#endif
        }
        /// <summary>
        /// currently the content type for individual responses is missing msgtype=response that the API needs to parse it
        /// </summary>
        /// <param name="changesetStream"></param>
        /// <returns></returns>
        private static HttpContent FixupToAddCorrectHttpContentType(HttpContent changesetStream)
        {
            changesetStream.Headers.Remove("Content-Type");
            changesetStream.Headers.Add("Content-Type", "application/http; msgtype=response");

            return changesetStream;
            
        }
        /// <summary>
        /// currently the change set is missing a new line at the end - this fixes that
        /// </summary>
        /// <param name="changesetStream"></param>
        /// <returns></returns>
        private static StreamContent FixupChangeStreamDueToBug(HttpContent changesetStream)
        {
            Stream changesetResultStream = changesetStream.ReadAsStreamAsync().Result;
            MemoryStream tempStream = new MemoryStream();
            changesetResultStream.CopyTo(tempStream);

            tempStream.Seek(0, SeekOrigin.End);
            StreamWriter writer = new StreamWriter(tempStream);
            //add new line to fix stream
            writer.WriteLine();
            writer.Flush();
            tempStream.Position = 0;

            StreamContent changesetFixedContent = new StreamContent(tempStream);
            foreach (var header in changesetStream.Headers)
            {
                changesetFixedContent.Headers.Add(header.Key, header.Value);
            }

            return changesetFixedContent;
        }

    
        /// <summary>
        /// Update or Insert based on a match with the entityID
        /// </summary>
        /// <param name="entityCollection"></param>
        /// <param name="entityID"></param>
        /// <param name="data"></param>
        /// <param name="preventCreate"></param>
        /// <param name="preventUpdate"></param>
        /// <returns></returns>
        public async Task<CRMUpdateResult> Update(string entityCollection, Guid entityID, object data, bool Upsert = true)
        {
            return await Update(entityCollection, entityID.ToString(), data, Upsert);
        }
        /// <summary>
        /// Update or insert based on match with key provided in form of Field = Value
        /// </summary>
        /// <param name="entityCollection"></param>
        /// <param name="key"></param>
        /// <param name="data"></param>
        /// <param name="preventCreate"></param>
        /// <param name="preventUpdate"></param>
        /// <returns></returns>
        public async Task<CRMUpdateResult> Update(string entityCollection, string key, object data, bool Upsert = true)
        {
            await CheckAuthToken();
            CRMUpdateResult result = new CRMUpdateResult();
            var fullUrl = _apiUrl + entityCollection;

            HttpRequestMessage request = new HttpRequestMessage(new HttpMethod("PATCH"), fullUrl + "(" + key + ")");

            request.Content = new StringContent(JsonConvert.SerializeObject(data), Encoding.UTF8, "application/json");

            if (!Upsert)
                request.Headers.Add("If-Match", "*");          

            var response = await _httpClient.SendAsync(request);

            result.EntityID = GetEntityIDFromResponse(fullUrl, response);
           
          
            if (!response.IsSuccessStatusCode)
            {
                if ((response.StatusCode == HttpStatusCode.PreconditionFailed) &&
                        (!Upsert))
                {
                    return result;
                }
                response.EnsureSuccessStatusCode();
            }

            return result;

        }
        /// <summary>
        /// delete record
        /// </summary>
        /// <param name="entityCollection"></param>
        /// <param name="entityID"></param>
        /// <returns></returns>
        public async Task Delete(string entityCollection, Guid entityID)
        {
            await CheckAuthToken();

            var response = await _httpClient.DeleteAsync(_apiUrl + entityCollection + "(" + entityID.ToString() + ")");

            response.EnsureSuccessStatusCode();

        }
        /// <summary>
        /// execute an unbound function
        /// </summary>
        /// <param name="function"></param>
        /// <param name="parameters"></param>
        /// <returns></returns>
        private async Task<ExpandoObject> ExecuteFunction(string function, KeyValuePair<string, object>[] parameters = null)
        {
            await CheckAuthToken();
            var fullUrl = string.Empty;
            fullUrl = BuildFunctionActionURI(function, parameters);
            var results = await _httpClient.GetAsync(fullUrl);
            results.EnsureSuccessStatusCode();
            var data = await results.Content.ReadAsStringAsync();
            var values = JsonConvert.DeserializeObject<ExpandoObject>(data);
            return values;
        }
        
        

        /// <summary>
        /// Execute a bound function using object parameters
        /// </summary>
        /// <param name="function"></param>
        /// <param name="entityCollection"></param>
        /// <param name="entityID"></param>
        /// <param name="data"></param>
        /// <returns></returns>
        public async Task<ExpandoObject> ExecuteFunction(string function, string entityCollection, Guid entityID, object data)
        {
            List<KeyValuePair<string, object>> list = ConvertObjectToKeyValuePair(data);

            return await ExecuteFunction(function, entityCollection, entityID, list.ToArray());
        }
        /// <summary>
        /// execute an unbound function using object parameters
        /// </summary>
        /// <param name="function"></param>
        /// <param name="data"></param>
        /// <returns></returns>
        public async Task<ExpandoObject> ExecuteFunction(string function, object data=null)
        {
            List<KeyValuePair<string, object>> list = ConvertObjectToKeyValuePair(data);

            return await ExecuteFunction(function, list.ToArray());
        }

        /// <summary>
        /// Execute an Action
        /// </summary>
        /// <param name="action"></param>
        /// <param name="data"></param>
        /// <returns></returns>
        public async Task<ExpandoObject> ExecuteAction(string action, object data)
        {
            await CheckAuthToken();

            var fullUrl = string.Format("{0}{1}", _apiUrl, action);
                        
            HttpRequestMessage request = new HttpRequestMessage(new HttpMethod("Post"), fullUrl);

            request.Content = new StringContent(JsonConvert.SerializeObject(data), Encoding.UTF8, "application/json");

            var results = await _httpClient.SendAsync(request);

            results.EnsureSuccessStatusCode();

            var resultData = await results.Content.ReadAsStringAsync();
            var values = JsonConvert.DeserializeObject<ExpandoObject>(resultData);
            return values;
        }
        /// <summary>
        /// Execute a bound action
        /// </summary>
        /// <param name="action"></param>
        /// <param name="entityCollection"></param>
        /// <param name="entityID"></param>
        /// <param name="data"></param>
        /// <returns></returns>
        public async Task<ExpandoObject> ExecuteAction(string action, string entityCollection,Guid entityID,object data)
        {
            return await ExecuteAction(string.Format("{0}({1})/{2}", entityCollection, entityID.ToString(), action), data);            
        }        

        /// <summary>
        /// Helper function to convert object to KVP
        /// </summary>
        /// <param name="data"></param>
        /// <returns></returns>
        private static List<KeyValuePair<string, object>> ConvertObjectToKeyValuePair(object data)
        {
            if (data != null)
            {
                if (data.GetType() == typeof(ExpandoObject))
                {
                    var dataExpand = data as ExpandoObject;
                    return dataExpand.ToList();
                }
                else
                {
                    Type type = data.GetType();
                    IList<PropertyInfo> props = new List<PropertyInfo>(type.GetProperties());
                    List<KeyValuePair<string, object>> list = new List<KeyValuePair<string, object>>();

                    foreach (PropertyInfo prop in props)
                    {
                        object propValue = prop.GetValue(data, null);

                        list.Add(new KeyValuePair<string, object>(prop.Name, propValue));
                    }

                    return list;
                }
            }

            else return new List<KeyValuePair<string, object>>();
        }
        /// <summary>
        /// Helper function to build the url for functions and actions
        /// </summary>
        /// <param name="function"></param>
        /// <param name="parameters"></param>
        /// <returns></returns>
        private string BuildFunctionActionURI(string function, KeyValuePair<string, object>[] parameters)
        {
            string fullUrl;
            if (parameters != null)
            {
                List<string> paramList = new List<string>();
                List<string> valueList = new List<string>();
                int paramCount = 1;
                foreach (var parm in parameters)
                {
                    if (parm.Value.GetType() == typeof(String))
                    {
                        valueList.Add(string.Format("@p{0}='{1}'", paramCount, parm.Value));
                    }
                    else
                    {
                        valueList.Add(string.Format("@p{0}={1}", paramCount, parm.Value));
                    }
                    paramList.Add(string.Format("{0}=@p{1}", parm.Key, paramCount));
                    paramCount++;
                }

                fullUrl = string.Format("{0}{1}({2})?{3}", _apiUrl, function, string.Join(",", paramList), string.Join("&", valueList));
            }
            else
            {
                fullUrl = string.Format("{0}{1}()", _apiUrl, function);
            }

            return fullUrl;
        }

        /// <summary>
        /// helper function to build query url
        /// </summary>
        /// <param name="uri"></param>
        /// <param name="queryOptions"></param>
        /// <returns></returns>
        private string BuildGetUrl(string uri, CRMGetListOptions queryOptions)
        {
            var fullurl = _apiUrl + uri;
            bool firstParam = true;
            if (queryOptions != null)
            {
                if (queryOptions.Select != null)
                {

                    if (firstParam)
                        fullurl = String.Format("{0}?$select={1}", fullurl, String.Join(",", queryOptions.Select));
                    else
                        fullurl = String.Format("{1}&$select={0}", fullurl, String.Join(",", queryOptions.Select));
                    firstParam = false;

                }
                if (queryOptions.OrderBy != null)
                {

                    if (firstParam)
                        fullurl = String.Format("{0}?$orderby={1}", fullurl, String.Join(",", queryOptions.OrderBy));
                    else
                        fullurl = String.Format("{1}&$orderby={0}", fullurl, String.Join(",", queryOptions.OrderBy));
                    firstParam = false;

                }
                if (queryOptions.Filter != null)
                {
                    if (firstParam)
                        fullurl = fullurl + "?$filter=" + queryOptions.Filter;
                    else
                        fullurl = fullurl + "&$filter=" + queryOptions.Filter;
                    firstParam = false;
                }
                if (queryOptions.IncludeCount)
                {
                    if (firstParam)
                        fullurl = fullurl + "?$count=true";
                    else
                        fullurl = fullurl + "&$count=true";
                    firstParam = false;
                }

                if (queryOptions.Skip > 0)
                {
                    if (firstParam)
                        fullurl = fullurl + string.Format("?$skip={0}", queryOptions.Skip);
                    else
                        fullurl = fullurl + string.Format("&$skip={0}", queryOptions.Skip);
                    firstParam = false;
                }
                if (queryOptions.Top > 0)
                {
                    if (firstParam)
                        fullurl = fullurl + string.Format("?$top={0}", queryOptions.Top);
                    else
                        fullurl = fullurl + string.Format("&$top={0}", queryOptions.Top);
                    firstParam = false;
                }
                if (queryOptions.Expand != null)
                    BuildExpandQueryURLOptions(queryOptions, ref fullurl, ref firstParam);

                BuildAdvancedQueryURLOptions(queryOptions, ref fullurl, ref firstParam);
            }

            return fullurl;
        }

        private void BuildExpandQueryURLOptions(CRMGetListOptions queryOptions, ref string fullurl, ref bool firstParam)
        {
            List<string> expands = new List<string>();

            foreach (var expand in queryOptions.Expand)
            {
                List<string> expandOptions = new List<string>();

                if (expand.Select != null)
                    expandOptions.Add(String.Format("$select={0}", String.Join(",", expand.Select)));

                if (expand.OrderBy != null)
                    expandOptions.Add(String.Format("$orderby={0}", String.Join(",", expand.OrderBy)));

                if (expand.Filter != null)
                    expandOptions.Add("$filter=" + expand.Filter);

                if (expand.Top > 0)
                    expandOptions.Add(string.Format("$top={0}", expand.Top));

                if (expandOptions.Count > 0)
                    expands.Add(string.Format("{0}({1})", expand.Property, string.Join(";", expandOptions)));
                else
                    expands.Add(string.Format("{0}", expand.Property));
                
            }
            if (expands.Count > 0)
            {
                if (firstParam)
                    fullurl = fullurl + string.Format("?$expand={0}", String.Join(",",expands));
                else
                    fullurl = fullurl + string.Format("&$expand={0}", String.Join(",", expands));
                firstParam = false;
            }
                
        }

        private static void BuildAdvancedQueryURLOptions(CRMGetListOptions queryOptions, ref string fullurl, ref bool firstParam)
        {
            if (queryOptions.SystemQuery != Guid.Empty)
            {
                if (firstParam)
                    fullurl = fullurl + string.Format("?savedQuery={0}", queryOptions.SystemQuery.ToString());
                else
                    fullurl = fullurl + string.Format("&savedQuery={0}", queryOptions.SystemQuery.ToString());
                firstParam = false;
            }
            if (queryOptions.UserQuery != Guid.Empty)
            {
                if (firstParam)
                    fullurl = fullurl + string.Format("?userQuery={0}", queryOptions.UserQuery.ToString());
                else
                    fullurl = fullurl + string.Format("&userQuery={0}", queryOptions.UserQuery.ToString());
                firstParam = false;
            }
            if (!string.IsNullOrEmpty(queryOptions.FetchXml))
            {
                if (firstParam)
                    fullurl = fullurl + string.Format("?fetchXml={0}", Uri.EscapeUriString(queryOptions.FetchXml));
                else
                    fullurl = fullurl + string.Format("&$fetchXml={0}", Uri.EscapeUriString(queryOptions.FetchXml));
                firstParam = false;
            }
        }

        /// <summary>
        /// helper function to make sure token refresh happens as needed if refresh method provided
        /// </summary>
        private async Task<string> CheckAuthToken()
        {
            if (_getAccessToken == null)
                return _AccessToken;
            var newToken = await _getAccessToken(_apiUrl);
            if (newToken != _AccessToken)
            {
                _httpClient.DefaultRequestHeaders.Remove("Authorization");
                _httpClient.DefaultRequestHeaders.Authorization =
                    new AuthenticationHeaderValue("Bearer", newToken);
                _AccessToken = newToken;
            }
            return _AccessToken;
        }
        /// <summary>
        /// helper method to setup the httpclient defaults
        /// </summary>
        /// <param name="callerID"></param>
        private void SetHttpClientDefaults(Guid callerID)
        {
            _httpClient.DefaultRequestHeaders.Add("Accept", "application/json");
            _httpClient.DefaultRequestHeaders.Add("OData-MaxVersion", "4.0");
            _httpClient.DefaultRequestHeaders.Add("OData-Version", "4.0");
            // _httpClient.DefaultRequestHeaders.Add("Prefer", "odata.maxpagesize=3");
            if (callerID != Guid.Empty)
                _httpClient.DefaultRequestHeaders.Add("MSCRMCallerID", callerID.ToString());

            _httpClient.Timeout = new TimeSpan(0, 2, 0);
        }

        /// <summary>
        /// Helper method to get ID from response
        /// </summary>
        /// <param name="fullUrl"></param>
        /// <param name="response"></param>
        /// <returns></returns>
        private static Guid GetEntityIDFromResponse(string fullUrl, HttpResponseMessage response)
        {
            if ((response == null) || (response.Headers == null))
                return Guid.Empty;
            if (!response.Headers.Contains("OData-EntityId"))
                return Guid.Empty;

            var idString = response.Headers.GetValues("OData-EntityId").FirstOrDefault();

            if (string.IsNullOrEmpty(idString))
                return Guid.Empty;

            idString = idString.Replace(fullUrl, "").Replace("(", "").Replace(")", "");

            var idGuid = Guid.Parse(idString);

            return idGuid;
        }

    }
}
