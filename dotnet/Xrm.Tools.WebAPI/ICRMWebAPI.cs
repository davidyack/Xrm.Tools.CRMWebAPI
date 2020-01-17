// =====================================================================
//  File:		CRMWebAPI
//  Summary:	Helper library for working with CRM Web API
// =====================================================================
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
using System;
using System.Dynamic;
using System.Threading.Tasks;
using Xrm.Tools.WebAPI.Requests;
using Xrm.Tools.WebAPI.Results;

namespace Xrm.Tools.WebAPI
{
    public interface ICRMWebAPI
    {
        Task<bool> Associate(string fromEntityCollection, Guid fromEntityID, string navProperty, string toEntityCollection, Guid toEntityID);
        Task<Guid> Create(string entityCollection, object data);
        Task<CRMBatchResult> Create(string entityCollection, object[] datalist);
        Task Delete(string entityCollection, Guid entityID);
        Task DeleteAssociation(string fromEntitycollection, Guid fromEntityID, string navProperty, string toEntityCollection, Guid toEntityID);
        Task<ExpandoObject> ExecuteAction(string action, object data);
        Task<ExpandoObject> ExecuteAction(string action, string entityCollection, Guid entityID, object data);
        Task<ExpandoObject> ExecuteFunction(string function, object data = null);
        Task<ExpandoObject> ExecuteFunction(string function, string entityCollection, Guid entityID, object data);
        Task<ExpandoObject> Get(string entityCollection, Guid entityID, CRMGetListOptions QueryOptions = null);
        Task<ResultType> Get<ResultType>(string entityCollection, Guid entityID, CRMGetListOptions QueryOptions = null);
        Task<ResultType> Get<ResultType>(string entityCollection, string key, CRMGetListOptions QueryOptions = null);
        Task<int> GetCount(string uri, CRMGetListOptions QueryOptions = null);
        Task<byte[]> GetFileData(string entityCollection, Guid entityID, string fieldName);
        Task<CRMGetListResult<ExpandoObject>> GetList(string uri, CRMGetListOptions QueryOptions = null);
        Task<CRMGetListResult<ResultType>> GetList<ResultType>(string uri, CRMGetListOptions QueryOptions = null);
        Task<CRMUpdateResult> Update(string entityCollection, Guid entityID, object data, bool Upsert = true);
        Task<CRMUpdateResult> Update(string entityCollection, string key, object data, bool Upsert = true);
        Task UpdateFileData(string entityCollection, Guid entityID, string fieldName, string fileName, byte[] data);
    }
}