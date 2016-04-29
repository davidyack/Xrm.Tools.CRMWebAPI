using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Xrm.Tools.WebAPI.Results
{
    public class CRMAttributeDisplayName
    {
        public Guid MetadataId { get; set; }
        public string LogicalName { get; set; }
        public string SchemaName { get; set; }
        public bool IsPrimaryId { get; set; }
        public string AttributeType { get; set; }
        public string ODataLogicalName { get; set; }
        public string DisplayName { get; set; }
        public string LogicalDisplayName { get; set; }

    }
}
