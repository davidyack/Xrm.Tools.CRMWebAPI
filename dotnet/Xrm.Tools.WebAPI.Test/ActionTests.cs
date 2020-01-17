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
        public async Task TestWinOpportunity()
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
            opportClose.subject = "Won Opportunity";
            opportCloseIndexer["opportunityid@odata.bind"] = "/opportunities(" + oppID.ToString() + ")";
            dynamic lostOpportParams = new ExpandoObject();
            lostOpportParams.Status = 3;
            lostOpportParams.OpportunityClose = opportClose;
            await api.ExecuteAction("WinOpportunity", lostOpportParams);

            System.Diagnostics.Trace.WriteLine("finished");
        }
        [TestMethod]
        public async Task TestLostOpportunity()
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
            opportCloseIndexer["opportunityid@odata.bind"] = "/opportunities(" + oppID.ToString() + ")";
            dynamic lostOpportParams = new ExpandoObject();
            lostOpportParams.Status = 4;
            lostOpportParams.OpportunityClose = opportClose;
            await api.ExecuteAction("LoseOpportunity", lostOpportParams);

            System.Diagnostics.Trace.WriteLine("finished");
        }

        [TestMethod]
        public async Task TestCalculateRollup()
        {
            var api = GetAPI();

            dynamic voteCountUpdate = new ExpandoObject();
            voteCountUpdate.Target = new ExpandoObject();
            var ivote = voteCountUpdate.Target as IDictionary<string, Object>;

            ivote["@odata.id"] = "ctccrm_ideas(19dc848b-1c5e-e711-8112-e0071b66aea1)";
            voteCountUpdate.FieldName = "ctccrm_votes";
            await api.ExecuteFunction("CalculateRollupField", voteCountUpdate);


            System.Diagnostics.Trace.WriteLine("finished");
        }
    }
}
