using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Xrm.Tools.WebAPI.Results
{
    public class CRMEntityDisplayName
    {
        public Guid MetadataId { get; set; }
        public string EntitySetName { get; set; }
        public string LogicalName { get; set; }
        public string LogicalCollectionName { get; set; }
        public string PrimaryIdAttribute { get; set; }
        public string DisplayName { get; set; }
        public string DisplayCollectionName { get; set; }
        public string LogicalDisplayName { get; set; }
        public string LogicalDisplayCollectionName { get; set; }

    }
}
