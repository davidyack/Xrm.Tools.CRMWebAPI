using System;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using System.Dynamic;
using System.Threading.Tasks;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Collections.Generic;
using Xrm.Tools.WebAPI.Requests;

namespace Xrm.Tools.WebAPI.Test
{
    [TestClass]
    public class BasicCRUDTests
    {
        public CRMWebAPI GetAPI()
        {

            CRMWebAPI api = new CRMWebAPI("https://sb.api.crm.dynamics.com/api/data/v8.0/",
                    "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6Ik1uQ19WWmNBVGZNNXBPWWlKSE1iYTlnb0VLWSIsImtpZCI6Ik1uQ19WWmNBVGZNNXBPWWlKSE1iYTlnb0VLWSJ9.eyJhdWQiOiJodHRwczovL3NiLmNybS5keW5hbWljcy5jb20vIiwiaXNzIjoiaHR0cHM6Ly9zdHMud2luZG93cy5uZXQvODA1MDhiOTctMDY0Mi00NTRhLWExNjAtZjA1YzdlYjFiNDVlLyIsImlhdCI6MTQ2MDYwMjg1NywibmJmIjoxNDYwNjAyODU3LCJleHAiOjE0NjA2MDY3NTcsImFjciI6IjEiLCJhbXIiOlsicHdkIl0sImFwcGlkIjoiZWMxYWE3YWQtZGFlYy00OGVmLTg1MzgtYWQyN2ZjZDM3MDI4IiwiYXBwaWRhY3IiOiIwIiwiZmFtaWx5X25hbWUiOiJZYWNrIiwiZ2l2ZW5fbmFtZSI6IkRhdmlkIiwiaXBhZGRyIjoiNjcuMTkwLjEyNi45IiwibmFtZSI6IkRhdmlkIFlhY2siLCJvaWQiOiJiZTdlZjA3Yy04YzAyLTQ1YTctYWExOC1iZWZjMmIzNjE0MjYiLCJwdWlkIjoiMTAwM0JGRkQ4MDlCRTA5NiIsInNjcCI6InVzZXJfaW1wZXJzb25hdGlvbiIsInN1YiI6IklIRHB4ZVNMOTBPMDFYRkFHaEtYZDd4bm4zanlFRVdFMEQ2UExyVGhTWTQiLCJ0aWQiOiI4MDUwOGI5Ny0wNjQyLTQ1NGEtYTE2MC1mMDVjN2ViMWI0NWUiLCJ1bmlxdWVfbmFtZSI6ImR5YWNrQGNvbG9yYWRvdGMuY29tIiwidXBuIjoiZHlhY2tAY29sb3JhZG90Yy5jb20iLCJ2ZXIiOiIxLjAifQ.UX6_wwW1WVNEFn8g4DK8HTq_esR7jOj9EGhFJ97Hmq6qTpqrSq-SM6Nk7RZWMlMrlraunFqJ3TCIpDE2BDlIhynHNp3Rjv2SvniqixSxWn-d7OyWpO6OZfp2PAUCYwRFilMKsgSuSbXMgeLE9RfQ-jXoVglEG3CGdwMWBvJi40FCm64Xm6oN6p4YMNIF4Yn_sT2q5lHVAuNHWpu5BRECVP2jekplY5huXtI1_ERE01RJUFI0Duv8F48waZr3ZUpwkvEsSg8zUP8ChaqjateeftlhXKBiftDwmkAmGpeu32wl5PNnKtmZZwjVX2iBGGK4W_c4p-OzRkTkH8yf4DmjMw");
            return api;

        }

        [TestMethod]
        public void TestMethod1()
        {

            Task.Run(async () =>
            {
                var api = GetAPI();

                dynamic data = new ExpandoObject();
                data.name = "test " + DateTime.Now.ToString();

                Guid createdID = await api.Create("accounts", data);                

                var retrievedObject = await api.Get("accounts", createdID, new CRMGetListOptions() { FormattedValues = true });

                var retrievedObjectEx = await api.Get<ExpandoObject>("accounts", createdID);

                dynamic updateObject = new ExpandoObject();
                updateObject.name = "updated name " + DateTime.Now.ToString();

                var updateResult = await api.Update("accounts", createdID, updateObject);
                //update with an upsert
                var upsertResult = await api.Update("accounts", Guid.NewGuid(), updateObject, Upsert: true);

                await api.Delete("accounts", upsertResult.EntityID);

                var results = await api.GetList("accounts", new Requests.CRMGetListOptions() { Top = 5, FormattedValues=true });

                string fetchXml = "<fetch mapping='logical'><entity name='account'><attribute name='accountid'/><attribute name='name'/></entity></fetch>";

                var fetchResults = await api.GetList("accounts", QueryOptions: new CRMGetListOptions() { FetchXml = fetchXml });

                var count = await api.GetCount("accounts");

                List<object> batchList = new List<object>();
                for (int i=0;i<5;i++)
                {
                    dynamic batchCreateData = new ExpandoObject();
                    batchCreateData.name = "test " + DateTime.Now.ToString();
                    batchList.Add(batchCreateData);
                }
                var batchResults = await api.Create("accounts", batchList.ToArray());

                dynamic gettimeoptions = new ExpandoObject();
                gettimeoptions.LocalizedStandardName = "";
                gettimeoptions.LocalId = 1033;

                var gettimeResults  = await api.ExecuteFunction("GetTimeZoneCodeByLocalizedName",gettimeoptions);

                var whoamiResults = await api.ExecuteFunction("WhoAmI");

                System.Diagnostics.Trace.WriteLine("finished");


            }).Wait();
        }

        [TestMethod]
        public void TestCreateRelatedRecords1()
        {

            Task.Run(async () =>
            {
                var api = GetAPI();

                dynamic account = new ExpandoObject();
                account.name = "Test Account " + DateTime.Now.ToString();
                dynamic primaryContact = new ExpandoObject();
                primaryContact.firstname = "John";
                primaryContact.lastname = "Smith;";
                account.primarycontactid = primaryContact;
                dynamic opportunity = new ExpandoObject();
                opportunity.name = "OP for " + account.name;
                account.opportunity_customer_accounts = new object[] { opportunity };
                dynamic task = new ExpandoObject();
                task.subject = "Task for opportunity";
                opportunity.Opportunity_Tasks = new object[] { task };

                Guid createdID = await api.Create("accounts", account);


                System.Diagnostics.Trace.WriteLine("finished");


            }).Wait();
        }
    }
}
