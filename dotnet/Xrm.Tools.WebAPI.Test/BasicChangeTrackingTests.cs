using System;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using System.Threading.Tasks;
using System.Dynamic;

namespace Xrm.Tools.WebAPI.Test
{
    [TestClass]
    public class BasicChangeTrackingTests : UnitTestBaseClass
    {
        [TestMethod]
        public async Task TestMethod1()
        {

            var api = GetAPI();

            var results = await api.GetList("accounts", new Requests.CRMGetListOptions() { TrackChanges = true, FormattedValues = true });

            results = await api.GetList("accounts", new Requests.CRMGetListOptions() { TrackChanges = true, TrackChangesLink = results.TrackChangesLink, FormattedValues = true });

            dynamic data = new ExpandoObject();
            data.name = "test " + DateTime.Now.ToString();

            Guid createdID = await api.Create("accounts", data);

            results = await api.GetList("accounts", new Requests.CRMGetListOptions() { TrackChanges = true, TrackChangesLink = results.TrackChangesLink, FormattedValues = true });

        }
    }
}
