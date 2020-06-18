using System;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using System.Dynamic;
using System.Threading.Tasks;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Collections.Generic;
using Xrm.Tools.WebAPI.Requests;
using System.IO;

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
                var api = await GetAPI();

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

                var results = await api.GetList("accounts", new Requests.CRMGetListOptions() { Top = 5, FormattedValues = true });

                string fetchXml = "<fetch version='1.0' mapping='logical' output-format='xml-platform' no-lock='true'><entity name='account'><attribute name='accountid'/><attribute name='name'/></entity></fetch>";

                var fetchResults = await api.GetList("accounts", QueryOptions: new CRMGetListOptions() { FetchXml = fetchXml, FetchAllRecords = true });

                var count = await api.GetCount("accounts");

                List<object> batchList = new List<object>();
                for (int i = 0; i < 5; i++)
                {
                    dynamic batchCreateData = new ExpandoObject();
                    batchCreateData.name = "test " + DateTime.Now.ToString();
                    batchList.Add(batchCreateData);
                }
                var batchResults = await api.Create("accounts", batchList.ToArray());

                dynamic gettimeoptions = new ExpandoObject();
                gettimeoptions.LocalizedStandardName = "Pacific Standard Time";
                gettimeoptions.LocaleId = 1033;

                var gettimeResults = await api.ExecuteFunction("GetTimeZoneCodeByLocalizedName", gettimeoptions);

                var whoamiResults = await api.ExecuteFunction("WhoAmI");

                System.Diagnostics.Trace.WriteLine("finished");


            }).Wait();
        }

        [TestMethod]
        public void TestCreateRelatedRecords1()
        {

            Task.Run(async () =>
            {
                var api = await GetAPI();

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
        [TestMethod]
        public void TestCreateRelatedRecords2()
        {

            Task.Run(async () =>
            {
                var api = await GetAPI();

                dynamic account = new ExpandoObject();
                account.name = "Test Account " + DateTime.Now.ToString();
                Guid accountID = await api.Create("accounts", account);
                dynamic primaryContact = new ExpandoObject();
                primaryContact.firstname = "John";
                primaryContact.lastname = "Smith;";
                Guid contactID = await api.Create("contacts", primaryContact);

                await api.Associate("accounts", accountID, "primarycontactid", "contacts", contactID);

                await api.DeleteAssociation("accounts", accountID, "primarycontactid", "contacts", contactID);

                System.Diagnostics.Trace.WriteLine("finished");


            }).Wait();
        }
        [TestMethod]
        public void TestFetchXml()
        {

            Task.Run(async () =>
            {
                var api = await GetAPI();

                CRMGetListOptions qOptions = new CRMGetListOptions()
                {
                    FetchXml = @"<fetch no-lock='true'><entity name='account'><attribute name='accountid'/><attribute name='name'/><attribute name='accountnumber'/><filter type='and'></filter><link-entity name='contact' from='contactid' to='primarycontactid' link-type='inner' alias='contact'><attribute name='fullname'/></link-entity></entity></fetch>"
                };
                var accounts = await api.GetList("accounts", qOptions);
                foreach (dynamic account in accounts.List)
                {
                    var myAccount = account as IDictionary<string, object>;

                    Console.WriteLine(myAccount["contact.fullname"]);
                }

                System.Diagnostics.Trace.WriteLine("finished");


            }).Wait();
        }
        [TestMethod]
        public void TestOrderBy()
        {

            Task.Run(async () =>
            {
                var api = await GetAPI();

                var accounts = await api.GetList("accounts", new CRMGetListOptions() { Top = 10, FormattedValues = true, Select = new string[] { "name" }, OrderBy = new string[] { "name" } });


                System.Diagnostics.Trace.WriteLine("finished");


            }).Wait();
        }

        [TestMethod]
        public void TestApply()
        {

            Task.Run(async () =>
            {
                var api = await GetAPI();

                var opps = await api.GetList("opportunities", new CRMGetListOptions() { Apply = "aggregate(estimatedvalue with sum as total)" });


                System.Diagnostics.Trace.WriteLine("finished");


            }).Wait();
        }
        [TestMethod]
        public void TestExpandQuery()
        {

            Task.Run(async () =>
            {
                var api = await GetAPI();

                dynamic whoamiResults = await api.ExecuteFunction("WhoAmI");
                CRMGetListOptions userOptions = new CRMGetListOptions()
                {
                    Expand = new CRMExpandOptions[]
                        { new CRMExpandOptions()
                            { Property="businessunitid",
                              Select = new string[] { "businessunitid","name","websiteurl" }
                            }
                        }
                };

                var userResults = await api.Get("systemusers", Guid.Parse(whoamiResults.UserId), QueryOptions: userOptions);

                CRMGetListOptions buOptions = new CRMGetListOptions()
                {
                    Expand = new CRMExpandOptions[]
                       { new CRMExpandOptions()
                            { Property="business_unit_system_users",
                              Select = new string[] { "systemuserid","fullname" },
                              Filter = "systemuserid ne " + whoamiResults.UserId,
                              OrderBy = new string[] {"createdon asc"},
                              Top=5

                            }
                       }
                };
                var buResult = await api.Get("businessunits",
                     Guid.Parse(userResults.businessunitid.businessunitid),
                      QueryOptions: buOptions);
                dynamic userCount = buResult.business_unit_system_users.Count;

                System.Diagnostics.Trace.WriteLine("finished");


            }).Wait();
        }

        [TestMethod]
        public void TestAltKeyUpdate()
        {

            Task.Run(async () =>
            {
                var api = await GetAPI();
                string statid = "2bf3c48a-de2d-e511-80f8-c4346bac7da8";
                dynamic data = new ExpandoObject();
                data.tt_name = "test";
                data.tt_blocks = 1;
                data.tt_externalstatid = statid;
                var result = await api.Update("test_entity", "test_externalstatid='" + statid + "'", data, Upsert: true);


            }).Wait();
        }

        [TestMethod]
        public void TestAltKeyGet()
        {
            Task.Run(async () =>
            {
                var api = await GetAPI();
                string statid = "2bf3c48a-de2d-e511-80f8-c4346bac7da8";

                var result = await api.Get<ExpandoObject>("test_entity", $"test_externalstatid='{statid}'");
            }).Wait();
        }

        [TestMethod]
        public void TestFileFields()
        {
            Task.Run(async () =>
            {
                var api = await GetAPI();

                dynamic data = new ExpandoObject();
                data.name = "test " + DateTime.Now.ToString();

                Guid createdID = await api.Create("accounts", data);

                var fileData = File.ReadAllBytes("c:\\test\\logo.jpg");
                await api.UpdateFileData("accounts", createdID, "cr0e2_logo", "logo.jpg", fileData);
                var getData = await api.GetFileData("accounts", createdID, "cr0e2_logo");
                File.WriteAllBytes("c:\\test\\logoGet.jpg", getData);


            }).Wait();
        }

    }
}
