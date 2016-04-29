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
    public class BasicCRUDTests : UnitTestBaseClass
    {
        

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
