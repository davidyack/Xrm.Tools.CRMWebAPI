using System;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using System.Threading.Tasks;
using System.Dynamic;
using System.Collections.Generic;

namespace Xrm.Tools.WebAPI.Test
{
    [TestClass]
    public class ActionTests : UnitTestBaseClass
    {
        [TestMethod]
        public void TestWinOpportunity()
        {

            Task.Run(async () =>
            {
                var api = GetAPI();

                dynamic account = new ExpandoObject();
                account.name = "test " + DateTime.Now.ToString();
                Guid accountID = await api.Create("accounts", account);

                dynamic contact = new ExpandoObject();
                contact.firstname = "test " + DateTime.Now.ToString();
                contact.lastname = "test " + DateTime.Now.ToString();
                Guid contactID = await api.Create("contacts", contact);

                dynamic opportunity = new ExpandoObject();
                var oppIndexer = opportunity as IDictionary<string, Object>;
                opportunity.name = "Test opportunity " + DateTime.Now.ToString();
                oppIndexer["customerid_account@odata.bind"] = "/xccounts(" + accountID.ToString() + ")";
                oppIndexer["parentcontactid@odata.bind"] = "/contacts(" + contactID.ToString() + ")";
                Guid oppID = await api.Create("opportunities", opportunity);

                dynamic opportClose = new ExpandoObject();
                var opportCloseIndexer = opportClose as IDictionary<string, Object>;
                opportClose.subject = "Won Opportunity";
                opportCloseIndexer["opportunityid@odata.bind"] = "/opportunities(" + oppID.ToString() + ")";
                dynamic lostOpportParams = new ExpandoObject();
                lostOpportParams.Status = 3;
                lostOpportParams.OpportunityClose = opportClose;
                await api.ExecuteAction("WinOpportunity", lostOpportParams);

                System.Diagnostics.Trace.WriteLine("finished");


            }).Wait();
        }
        [TestMethod]
        public void TestLostOpportunity()
        {

            Task.Run(async () =>
            {
                var api = GetAPI();

                dynamic account = new ExpandoObject();
                account.name = "test " + DateTime.Now.ToString();
                Guid accountID = await api.Create("accounts", account);
                
                dynamic contact = new ExpandoObject();
                contact.firstname = "test " + DateTime.Now.ToString();
                contact.lastname = "test " + DateTime.Now.ToString();
                Guid contactID = await api.Create("contacts", contact);

                dynamic opportunity = new ExpandoObject();
                var oppIndexer = opportunity as IDictionary<string, Object>;
                opportunity.name = "Test opportunity " + DateTime.Now.ToString();
                oppIndexer["customerid_account@odata.bind"] = "/accounts(" + accountID.ToString() + ")";
                oppIndexer["parentcontactid@odata.bind"] = "/contacts(" + contactID.ToString() + ")";
                Guid oppID = await api.Create("opportunities", opportunity);

                dynamic opportClose = new ExpandoObject();
                var opportCloseIndexer = opportClose as IDictionary<string, Object>;
                opportClose.subject = "Lost Opportunity";
                opportCloseIndexer["opportunityid@odata.bind"] = "/opportunities(" + oppID.ToString() +")";
                dynamic lostOpportParams = new ExpandoObject();
                lostOpportParams.Status = 4;
                lostOpportParams.OpportunityClose = opportClose;
                await api.ExecuteAction("LoseOpportunity", lostOpportParams);

                System.Diagnostics.Trace.WriteLine("finished");


            }).Wait();
        }
    }
}
