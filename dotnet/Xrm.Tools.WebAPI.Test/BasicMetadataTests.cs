using System;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Xrm.Tools.WebAPI;
using Xrm.Tools.WebAPI.Metadata;
using System.Threading.Tasks;
using System.Linq;
using System.Dynamic;

namespace Xrm.Tools.WebAPI.Test
{
    [TestClass]
    public class BasicMetadataTests : UnitTestBaseClass
    {
        [TestMethod]
        public void TestOptionSetNames()
        {
            Task.Run(async () =>
            {
                var api = await GetAPI();

                var optionSet = await api.GetOptionSetByName("need");

                var optionSetLabels = await api.GetOptionSetUserLabels("need");

            }).Wait();

        }

        [TestMethod]
        public void TestEntitySetNames()
        {
            Task.Run(async () =>
            {
                var api = await GetAPI();

                var entityNameList = await api.GetEntityDisplayNameList();

                var entityNameListWithLCID = await api.GetEntityDisplayNameList(1033);

            }).Wait();

        }

        [TestMethod]
        public void TestAttributeNames()
        {
            Task.Run(async () =>
            {
                var api = await GetAPI();

                var entityNameList = await api.GetEntityDisplayNameList();

                var firstEntity = entityNameList.Where(e => e.LogicalName == "account").FirstOrDefault();

                var attrNameList = await api.GetAttributeDisplayNameList(firstEntity.MetadataId);

                var attrNameListWithLCID = await api.GetAttributeDisplayNameList(firstEntity.MetadataId,1033);

            }).Wait();

        }

        [TestMethod]
        public void TestCopyAttribute()
        {
            Task.Run(async () =>
            {
                var api = await GetAPI();

                var entityNameList = await api.GetEntityDisplayNameList();

                var accountEntity = entityNameList.Where(e => e.LogicalName == "account").FirstOrDefault();

                var attrNameList = await api.GetAttributeDisplayNameList(accountEntity.MetadataId);

                var nameAttr = attrNameList.Where(a => a.LogicalName == "name").FirstOrDefault();

                var newAttrib = await api.CopyEntityAttribute(accountEntity.MetadataId, accountEntity.MetadataId, nameAttr.MetadataId, nameAttr.AttributeType, "dy_name123");

            }).Wait();

        }
     }
}
